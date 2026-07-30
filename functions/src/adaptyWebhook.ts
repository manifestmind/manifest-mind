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

// Product ID Google Play de l'ACHAT À VIE (achat unique, non-consommable). Sert à
// poser/retirer le drapeau `has_lifetime` (bouclier anti-coupure). À garder
// synchronisé avec PRODUCT_ID_BY_PLAN.lifetime de services/purchasesNative.ts.
const LIFETIME_PRODUCT_ID = 'mm_premium_lifetime';

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
// RÈGLE DE RÉVOCATION (révisée 2026-07-30) : Adapty n'émet PAS `access_level_updated`
// à l'expiration — comportement DOCUMENTÉ (« Adapty doesn't send access_level_updated
// upon subscription expiration — refer to expires_at to end the subscriptions on your
// side »). On révoque donc sur les événements de PERTE explicites (subscription_expired
// / subscription_refunded / trial_expired / non_subscription_purchase_refunded) → false.
// Les événements qui ne coupent PAS l'accès (résiliation de renouvellement, grâce,
// incident, pause) restent NO-OP. La PROTECTION du lifetime contre la perte d'un
// ABONNEMENT est faite par le bouclier `has_lifetime` dans la transaction (handler),
// pas ici : cette fonction n'exprime que l'INTENTION (true / false / null).

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

    // 🔻 PERTE D'ACCÈS explicite → false (intention de révocation). Le bouclier
    // `has_lifetime` (dans la transaction) empêche qu'une perte d'ABONNEMENT ne coupe
    // un titulaire du lifetime. `non_subscription_purchase_refunded` = remboursement
    // du lifetime lui-même → effacera le drapeau ET coupera (non soumis au bouclier).
    case 'subscription_expired':
    case 'subscription_refunded':
    case 'trial_expired':
    case 'non_subscription_purchase_refunded':
      return false;

    // ⚠️ NO-OP : ces événements NE coupent PAS l'accès. Résilier le renouvellement
    // laisse l'accès actif jusqu'à l'expiration (c'est subscription_expired qui
    // coupera) ; grâce / incident / pause maintiennent l'accès le temps de la reprise.
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

    // ── Classification (bouclier lifetime + maintenance du drapeau) ──────────
    // isLifetimeGrant  : achat du lifetime → posera has_lifetime=true.
    // isLifetimeRefund : remboursement du lifetime → effacera has_lifetime ET coupera.
    //   (Mono-produit : le SEUL achat non-abonnement est le lifetime. À revoir si un
    //    2e produit ponctuel apparaît.)
    // isSubscriptionLoss : perte d'un ABONNEMENT (expiration/remboursement/essai, ou
    //   access_level_updated=false) → SOUMISE au bouclier lifetime. Le remboursement du
    //   lifetime, lui, a isSubscriptionLoss=false → il n'est JAMAIS bloqué par le
    //   bouclier (Réserve 1 : il efface le drapeau et coupe dans la même écriture).
    //
    // ⚠️ LIMITE CONNUE & ASSUMÉE (double possession) : si un utilisateur détient à la
    // fois le lifetime ET un abonnement actif et se fait rembourser le lifetime, l'accès
    // est coupé bien que l'abonnement tourne encore. Cas composé très rare, auto-réparé
    // au prochain événement d'abonnement. Choix documenté (cf. claude_master.md).
    const props = event.event_properties;
    const isLifetimeGrant =
      eventType === 'non_subscription_purchase' && props?.vendor_product_id === LIFETIME_PRODUCT_ID;
    const isLifetimeRefund = eventType === 'non_subscription_purchase_refunded';
    const isSubscriptionLoss = newSubActive === false && !isLifetimeRefund;

    // Horodatage de l'événement (ms), pour l'ordre. Absent/illisible → best effort
    // sans faire avancer la borne.
    const eventMs = event.event_datetime ? Date.parse(event.event_datetime) : NaN;

    try {
      const userRef = db.collection('users').doc(firebaseUid);
      // Transaction : borne d'ordre (adapty_event_at_ms) + bouclier lifetime.
      //
      // ORDRE — PRIORITÉ À LA RÉVOCATION SUR ÉGALITÉ (Réserve 2) :
      //   - STRICTEMENT antérieur au dernier écrit → périmé, rejeté (tout type) : une
      //     expiration en retard ne coupe pas un abo re-souscrit ENTRE-temps ; un octroi
      //     en retard ne ressuscite pas un accès révoqué.
      //   - MÊME horodatage (Adapty n'a qu'une précision à la SECONDE) : la révocation
      //     PASSE, l'octroi CÈDE (`newSubActive === true` → 'stale'). Ainsi une coupure
      //     ne peut JAMAIS être écrasée par un octroi de même seconde. Principe : perdre
      //     un octroi (auto-réparé au prochain event) plutôt qu'une coupure.
      //   - Plus récent → traité (tout type). Re-souscription = octroi plus récent → gagne.
      const outcome = await db.runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        const lastMs = snap.exists
          ? (snap.get('adapty_event_at_ms') as number | undefined)
          : undefined;
        if (typeof lastMs === 'number' && !Number.isNaN(eventMs)) {
          if (eventMs < lastMs) return 'stale' as const;
          if (eventMs === lastMs && newSubActive === true) return 'stale' as const;
        }

        // 🛡️ BOUCLIER LIFETIME : une perte d'ABONNEMENT ne coupe pas un titulaire du
        // lifetime. (Le remboursement du lifetime a isSubscriptionLoss=false → il
        // n'entre pas ici : il effacera le drapeau ET coupera, plus bas.)
        const hasLifetime = snap.exists ? snap.get('has_lifetime') === true : false;
        if (isSubscriptionLoss && hasLifetime) {
          return 'protected-lifetime' as const;
        }

        const update: Record<string, unknown> = {
          subscription_active: newSubActive,
          adapty_event_type: eventType,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (!Number.isNaN(eventMs)) update.adapty_event_at_ms = eventMs;
        // Maintenance du drapeau lifetime (Réserve 1 : le remboursement EFFACE le
        // drapeau ET coupe — non soumis au bouclier ci-dessus).
        if (isLifetimeGrant) update.has_lifetime = true;
        if (isLifetimeRefund) update.has_lifetime = false;
        if (event.profile_id) update.adapty_profile_id = event.profile_id;
        if (props?.access_level_id) {
          update.adapty_access_level_id = props.access_level_id;
        }
        if (props?.vendor_product_id) {
          update.adapty_vendor_product_id = props.vendor_product_id;
        }
        if (props?.transaction_id) {
          update.adapty_transaction_id = props.transaction_id;
        }
        tx.set(userRef, update, { merge: true });
        return 'applied' as const;
      });

      if (outcome === 'stale') {
        logger.warn(
          `[adapty] event ${eventType} (at=${event.event_datetime ?? '?'}) IGNORÉ ` +
            `(périmé, ou octroi de même seconde qu'une écriture — la révocation prime) ` +
            `pour users/${firebaseUid}`,
        );
        res.status(200).send('OK (stale, ignored)');
        return;
      }

      if (outcome === 'protected-lifetime') {
        logger.info(
          `[adapty] event ${eventType} IGNORÉ — accès LIFETIME protégé ` +
            `(has_lifetime=true) pour users/${firebaseUid}`,
        );
        res.status(200).send('OK (lifetime protected)');
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
