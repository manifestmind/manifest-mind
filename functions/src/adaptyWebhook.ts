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
// RÈGLE DE RÉVOCATION : SEUL `access_level_updated(is_active=false)` peut passer
// subscription_active à false (il connaît l'état NET du premium, lifetime inclus).
// Tous les autres événements « négatifs » (expiration, remboursement, annulation,
// grâce, incident, pause) sont NO-OP → jamais de coupure à tort. Les grants
// accordent EN PLUS de access_level_updated(is_active=true) → ceinture + bretelles
// sur l'octroi, source unique et autoritaire sur la révocation.

function deriveAdaptySubscriptionActive(
  eventType: string | undefined,
  props: AdaptyEvent['event_properties'],
): boolean | null {
  switch (eventType) {
    // 🔑 SOURCE AUTORITAIRE UNIQUE. Reflète l'état NET du niveau d'accès premium
    // (tous produits confondus, lifetime inclus). SEUL événement autorisé à
    // RÉVOQUER (is_active=false) → jamais de coupure à tort. Il ACCORDE aussi
    // (is_active=true) → ceinture + bretelles sur l'octroi avec les grants.
    case 'access_level_updated':
      // STRICT : on n'agit QUE sur le niveau 'premium'. Tout autre niveau — ou un
      // access_level_id ABSENT — → no-op, pour qu'un futur 2e niveau d'accès dans
      // Adapty ne touche JAMAIS subscription_active.
      if (props?.access_level_id !== PREMIUM_ACCESS_LEVEL) return null;
      return !!props?.is_active;

    // GRANTS (activation rapide) → true. Toujours sûrs : recevoir un achat / essai
    // / renouvellement signifie que l'accès est dû. (La révocation ne vient JAMAIS
    // d'ici — cf. bloc NO-OP ci-dessous.)
    // ⚠️ Hypothèse MONO-NIVEAU : aujourd'hui tous les produits mappent 'premium'.
    // Si un 2e niveau d'accès est ajouté un jour, rendre ces grants conscients du
    // niveau (ou ne se fier qu'à access_level_updated, qui, lui, porte le niveau).
    case 'subscription_started':
    case 'subscription_renewed':
    case 'subscription_renewal_reactivated':
    case 'trial_started':
    case 'trial_converted':
    case 'trial_renewal_reactivated':
    case 'non_subscription_purchase':
      return true;

    // ⚠️ NO-OP sur TOUS les événements « négatifs » (fin de période, remboursement,
    // annulation de renouvellement, grâce, incident de facturation, pause). On ne
    // révoque JAMAIS sur un événement granulaire : il ignore les AUTRES droits de
    // l'utilisateur (ex. un mensuel qui expire alors qu'un LIFETIME est actif → ne
    // doit PAS couper l'accès). La révocation réelle vient uniquement de
    // access_level_updated(is_active=false), qui connaît l'état NET du premium.
    case 'subscription_expired':
    case 'trial_expired':
    case 'subscription_refunded':
    case 'non_subscription_purchase_refunded':
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
      // Deux cas TRÈS différents pour un JSON valide sans event_type :
      //
      // (a) REQUÊTE DE VÉRIFICATION Adapty (clic « Enregistrer » dans le dashboard) :
      //     corps = objet strictement VIDE `{}`. Adapty attend un 2XX + un corps
      //     JSON valide (+ Content-Type application/json). On répond 200 JSON et on
      //     n'écrit ABSOLUMENT RIEN (return immédiat, aucun accès Firestore).
      //     res.json() pose automatiquement `Content-Type: application/json`.
      //
      // (b) VRAI événement MALFORMÉ : corps NON vide mais sans event_type. Un vrai
      //     événement Adapty porte toujours des champs (profile_id, event_datetime,
      //     event_properties…) → objet non vide → on GARDE le 400 pour qu'il reste
      //     VISIBLE et ne soit JAMAIS confondu avec une vérification.
      const isEmptyBody = event !== null && typeof event === 'object' && Object.keys(event).length === 0;
      if (isEmptyBody) {
        // Log volontairement très reconnaissable (préfixe ✅ VERIFICATION) pour le
        // repérer d'un coup d'œil dans les journaux et confirmer que la vérification
        // Adapty est bien passée par ici.
        logger.info('[adapty] ✅ VERIFICATION endpoint (corps {} vide) → 200, aucune écriture Firestore');
        res.status(200).json({ ok: true, verification: true });
        return;
      }
      logger.warn('[adapty] corps non vide sans event_type → 400 (événement malformé)');
      res.status(400).send('Bad Request');
      return;
    }

    // Journalisation de TOUT événement reçu (type + horodatage + uid) AVANT tout
    // traitement — visibilité complète pour diagnostiquer, y compris les
    // événements no-op ou inconnus.
    logger.info(
      `[adapty] reçu event=${eventType} at=${event.event_datetime ?? '?'} uid=${event.customer_user_id ?? 'none'}`,
    );

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

    // Horodatage de l'événement (ms). Sert à ignorer les événements HORS-ORDRE :
    // une révocation ne doit jamais être annulée par un octroi plus ANCIEN arrivé
    // en retard. Absent/illisible → on applique quand même (best effort) sans
    // faire avancer la borne d'ordre.
    const eventMs = event.event_datetime ? Date.parse(event.event_datetime) : NaN;

    try {
      const userRef = db.collection('users').doc(firebaseUid);
      // Transaction : lit la borne d'ordre (adapty_event_at_ms) et IGNORE tout
      // événement STRICTEMENT antérieur au dernier ÉCRIT (protège du hors-ordre),
      // sinon écrit (création-si-absent via merge).
      //
      // Comparaison « < » (PAS « ≤ ») VOLONTAIRE : un événement de MÊME horodatage
      // est TOUJOURS traité → jamais de révocation perdue si elle partage la ms
      // d'un autre événement (ex. subscription_expired + access_level_updated=false
      // à la même ms). Rejouer un doublon exact réécrit la même valeur → idempotent
      // en effet (un écrit de trop, négligeable). Principe : en cas de doute,
      // traiter un événement en trop plutôt qu'en perdre un.
      //
      // Rappel : les no-op ne passent JAMAIS ici (return avant la transaction) →
      // SEULS les événements qui écrivent font avancer la borne.
      const outcome = await db.runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        const lastMs = snap.exists
          ? (snap.get('adapty_event_at_ms') as number | undefined)
          : undefined;
        if (typeof lastMs === 'number' && !Number.isNaN(eventMs) && eventMs < lastMs) {
          return 'stale' as const;
        }
        const update: Record<string, unknown> = {
          subscription_active: newSubActive,
          adapty_event_type: eventType,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (!Number.isNaN(eventMs)) update.adapty_event_at_ms = eventMs;
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
        tx.set(userRef, update, { merge: true });
        return 'applied' as const;
      });

      if (outcome === 'stale') {
        logger.warn(
          `[adapty] event ${eventType} (at=${event.event_datetime ?? '?'}) IGNORÉ ` +
            `(hors-ordre / ≤ dernier traité) pour users/${firebaseUid}`,
        );
        res.status(200).send('OK (stale, ignored)');
        return;
      }

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
