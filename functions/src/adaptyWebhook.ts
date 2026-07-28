// ─────────────────────────────────────────────────────────────────────────────
// ManifestMind — Firebase Cloud Function : webhook Adapty (achats natifs stores)
// ─────────────────────────────────────────────────────────────────────────────
//
// Endpoint HTTPS qui reçoit les événements webhook d'Adapty (abonnements /
// achats in-app Google Play & Apple), les authentifie, puis met à jour Firestore
// (users/{uid}.subscription_active) — EXACTEMENT la même source de vérité que le
// webhook Paddle (web). L'app cliente écoute users/{uid} via useSubscriptionSync.
//
// 🔒 STRICTEMENT SÉPARÉ de paddleWebhook :
//   - Fonction distincte, fichier distinct, secrets distincts.
//   - Paddle reste web-only et 100 % intact ; on ne partage QUE la convention
//     d'écriture Firestore (users/{uid}.subscription_active).
//
// Authentification (modèle Adapty, ≠ Paddle) :
//   - Adapty n'utilise PAS de signature HMAC. Il envoie un header `Authorization`
//     dont la valeur est un SECRET STATIQUE configuré dans le dashboard Adapty
//     (valeurs séparées prod / sandbox), transmis tel quel.
//   - On vérifie par égalité TIMING-SAFE contre le(s) secret(s) configuré(s).
//   - Aucune fenêtre anti-replay : Adapty ne signe pas d'horodatage ; le secret
//     statique EST le facteur d'authentification (et Adapty peut légitimement
//     rejouer d'anciens événements en retry → ne pas rejeter sur l'âge).
//
// customer_user_id = UID Firebase (posé côté app via activate({ customerUserId })
// dans services/purchasesNative.ts). Symétrique au custom_data.firebase_uid Paddle.
//
// Configuration secrets avant deploy (Phase B) :
//   firebase functions:secrets:set ADAPTY_WEBHOOK_AUTHORIZATION
//   firebase functions:secrets:set ADAPTY_SANDBOX_WEBHOOK_AUTHORIZATION   (optionnel)
//
// ─────────────────────────────────────────────────────────────────────────────

import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions/v2';
import { onRequest, type Request } from 'firebase-functions/v2/https';
import type { Response } from 'express';

// ─── Initialisation Firebase Admin (singleton partagé avec paddleWebhook) ────

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

// ─── Secrets Adapty Webhook (valeur du header Authorization) ─────────────────
// Posés via : firebase functions:secrets:set ADAPTY_WEBHOOK_AUTHORIZATION
const ADAPTY_WEBHOOK_AUTHORIZATION = defineSecret('ADAPTY_WEBHOOK_AUTHORIZATION');
// Endpoint sandbox Adapty (distinct de la prod). Optionnel.
const ADAPTY_SANDBOX_WEBHOOK_AUTHORIZATION = defineSecret('ADAPTY_SANDBOX_WEBHOOK_AUTHORIZATION');

// ─── Constantes ─────────────────────────────────────────────────────────────

// Access level Adapty qui déverrouille le premium (défini dans le dashboard,
// symétrique de l'entitlement RevenueCat / du champ subscription_active).
const PREMIUM_ACCESS_LEVEL = 'premium';

// ─── Types ──────────────────────────────────────────────────────────────────

type AdaptyEvent = {
  event_type?: string;
  event_datetime?: string;
  customer_user_id?: string | null;
  profile_id?: string;
  event_properties?: {
    access_level_id?: string;
    is_active?: boolean;
    vendor_product_id?: string;
    transaction_id?: string;
    [key: string]: unknown;
  };
};

// ─── Vérification du header Authorization (égalité timing-safe) ──────────────
//
// Adapty envoie la valeur EXACTE configurée dans le dashboard. On la compare à
// chaque secret fourni (prod + sandbox) en temps constant. Le premier match gagne.

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

type AuthCheck = { valid: true } | { valid: false; reason: string };

function verifyAdaptyAuthorization(
  authHeader: string | undefined,
  secrets: (string | undefined)[],
): AuthCheck {
  if (!authHeader) {
    return { valid: false, reason: 'missing Authorization header' };
  }
  let anySecretPresent = false;
  for (const secret of secrets) {
    if (!secret) continue; // secret non configuré (ex : sandbox pas encore posé)
    anySecretPresent = true;
    if (safeEqual(authHeader, secret)) {
      return { valid: true };
    }
  }
  if (!anySecretPresent) {
    return { valid: false, reason: 'no authorization secret configured' };
  }
  return { valid: false, reason: 'authorization mismatch (prod + sandbox)' };
}

// ─── Dérivation de subscription_active selon l'événement ────────────────────
//
// Renvoie :
//   - true  → activer subscription_active
//   - false → désactiver
//   - null  → ne pas toucher (on ack + log)
//
// Source autoritaire = `access_level_updated` (porte is_active + access_level_id).
// Les événements de cycle de vie sont mappés en filet de sécurité, en évitant
// toute révocation prématurée (annulation de renouvellement / grâce / incident
// de facturation = l'accès reste ACTIF jusqu'à l'expiration réelle → no-op).

function deriveAdaptySubscriptionActive(
  eventType: string | undefined,
  props: AdaptyEvent['event_properties'],
): boolean | null {
  switch (eventType) {
    // Événement d'état autoritaire : reflète l'état courant de l'access level.
    case 'access_level_updated':
      if (props?.access_level_id && props.access_level_id !== PREMIUM_ACCESS_LEVEL) {
        return null; // un autre access level → non concerné
      }
      return !!props?.is_active;

    // Activation (abonnements + essais + lifetime via non_subscription_purchase).
    case 'subscription_started':
    case 'subscription_renewed':
    case 'subscription_renewal_reactivated':
    case 'trial_started':
    case 'trial_converted':
    case 'trial_renewal_reactivated':
    case 'non_subscription_purchase':
      return true;

    // Fin réelle de l'accès → révocation.
    case 'subscription_expired':
    case 'trial_expired':
    case 'subscription_refunded':
    case 'non_subscription_purchase_refunded':
      return false;

    // Accès CONSERVÉ jusqu'à expiration → ne rien changer ici (l'expiration
    // effective enverra subscription_expired / access_level_updated is_active=false).
    case 'subscription_renewal_cancelled':
    case 'trial_renewal_cancelled':
    case 'entered_grace_period':
    case 'billing_issue_detected':
    case 'subscription_paused':
    case 'subscription_deferred':
      return null;

    default:
      return null;
  }
}

// ─── Handler principal ──────────────────────────────────────────────────────

export const adaptyWebhook = onRequest(
  {
    region: 'europe-west1',
    secrets: [ADAPTY_WEBHOOK_AUTHORIZATION, ADAPTY_SANDBOX_WEBHOOK_AUTHORIZATION],
    cors: false,
    maxInstances: 10,
    invoker: 'public',
  },
  async (req: Request, res: Response) => {
    // 1. Méthode
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // 2. Authentification par header Authorization (secret statique Adapty)
    const prodSecret = ADAPTY_WEBHOOK_AUTHORIZATION.value();
    const sandboxSecret = ADAPTY_SANDBOX_WEBHOOK_AUTHORIZATION.value();
    if (!prodSecret && !sandboxSecret) {
      logger.error('[adapty] no authorization secret configured (prod + sandbox both empty)');
      res.status(500).send('Internal Server Error');
      return;
    }
    const authHeader = req.get('Authorization') ?? req.get('authorization');
    const authCheck = verifyAdaptyAuthorization(authHeader, [prodSecret, sandboxSecret]);
    if (!authCheck.valid) {
      logger.warn(`[adapty] authorization invalid: ${authCheck.reason}`);
      res.status(401).send('Unauthorized');
      return;
    }

    // 3. Parse JSON (raw body → jamais de dépendance au body-parser express)
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody || rawBody.length === 0) {
      logger.warn('[adapty] rawBody missing or empty');
      res.status(400).send('Bad Request');
      return;
    }
    let event: AdaptyEvent;
    try {
      event = JSON.parse(rawBody.toString('utf8')) as AdaptyEvent;
    } catch (e) {
      logger.warn('[adapty] body not valid JSON', e);
      res.status(400).send('Bad Request');
      return;
    }

    const eventType = event.event_type;
    if (!eventType) {
      logger.warn('[adapty] event missing event_type');
      res.status(400).send('Bad Request');
      return;
    }

    // 4. Extraction de l'UID Firebase (customer_user_id posé côté app)
    const firebaseUid = event.customer_user_id;
    if (!firebaseUid) {
      // Cas légitime : profil sans customer_user_id (test dashboard, achat non
      // identifié). On ack pour éviter les retries, mais on log.
      logger.warn(`[adapty] event ${eventType} missing customer_user_id`);
      res.status(200).send('OK (no customer_user_id)');
      return;
    }

    // 5. Dérivation et écriture Firestore
    const newSubActive = deriveAdaptySubscriptionActive(eventType, event.event_properties);
    if (newSubActive === null) {
      logger.info(`[adapty] event ${eventType} acknowledged, no sub change`);
      res.status(200).send('OK (no change)');
      return;
    }

    try {
      const userRef = db.collection('users').doc(firebaseUid);
      const update: Record<string, unknown> = {
        subscription_active: newSubActive,
        adapty_event_type: eventType,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (event.profile_id) update.adapty_profile_id = event.profile_id;
      if (event.event_properties?.access_level_id) {
        update.adapty_access_level_id = event.event_properties.access_level_id;
      }
      if (event.event_properties?.vendor_product_id) {
        update.adapty_vendor_product_id = event.event_properties.vendor_product_id;
      }
      if (event.event_properties?.transaction_id) {
        update.adapty_transaction_id = event.event_properties.transaction_id;
      }

      await userRef.set(update, { merge: true });

      logger.info(
        `[adapty] users/${firebaseUid} updated: subscription_active=${newSubActive} (${eventType})`,
      );
      res.status(200).send('OK');
    } catch (e) {
      logger.error('[adapty] Firestore write failed', e);
      // 5xx → Adapty retry automatiquement
      res.status(500).send('Internal Server Error');
    }
  },
);
