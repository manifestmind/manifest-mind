// ─────────────────────────────────────────────────────────────────────────────
// ManifestMind — Firebase Cloud Function : webhook Paddle Billing
// ─────────────────────────────────────────────────────────────────────────────
//
// Endpoint HTTPS qui reçoit les événements webhook de Paddle, vérifie leur
// authenticité par signature HMAC-SHA256, puis met à jour Firestore
// (users/{uid}.subscription_active) selon le type d'événement.
//
// L'app cliente écoute users/{uid} via useSubscriptionSync et propage la
// valeur dans AsyncStorage, débloquant le paywall freemium côté client.
//
// Sécurité :
//   - Signature HMAC-SHA256 obligatoire et vérifiée en timing-safe
//   - Anti-replay : fenêtre de tolérance 5 min sur le timestamp Paddle
//   - Secret stocké dans Google Secret Manager via defineSecret (Functions
//     2nd gen), jamais dans le code ni dans les env vars de l'app
//   - Aucune écriture client optimiste : Firestore est la source unique
//
// Événements traités (cf. CLAUDE_MASTER.md section "Paiements") :
//   - transaction.paid             → subscription_active = true
//   - subscription.activated       → subscription_active = true
//   - subscription.updated         → derive from status (active/trialing)
//   - subscription.canceled        → subscription_active = false
//                                    (fire à fin de période, pas au clic)
//   - subscription.past_due        → subscription_active = false
//   - transaction.payment_failed   → no-op (Paddle gère retry)
//   - subscription.created         → no-op (paiement arrive séparément)
//
// Configuration secret avant deploy :
//   firebase functions:secrets:set PADDLE_WEBHOOK_SECRET
//
// ─────────────────────────────────────────────────────────────────────────────

import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions/v2';
import { onRequest, type Request } from 'firebase-functions/v2/https';
import type { Response } from 'express';

// ─── Initialisation Firebase Admin (singleton) ──────────────────────────────

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

// ─── Secret Paddle Webhook ──────────────────────────────────────────────────
// Valeur posée via : firebase functions:secrets:set PADDLE_WEBHOOK_SECRET

const PADDLE_WEBHOOK_SECRET = defineSecret('PADDLE_WEBHOOK_SECRET');
// Secret de signature du compte Paddle SANDBOX (distinct de la prod).
// Posé via : firebase functions:secrets:set PADDLE_SANDBOX_WEBHOOK_SECRET
const PADDLE_SANDBOX_WEBHOOK_SECRET = defineSecret('PADDLE_SANDBOX_WEBHOOK_SECRET');

// ─── Constantes ─────────────────────────────────────────────────────────────

// Fenêtre anti-replay : on rejette tout événement dont le timestamp Paddle
// est plus vieux que 5 min (passé ou futur). Empêche un attaquant de rejouer
// une requête capturée plus tard.
const REPLAY_WINDOW_SECONDS = 300;

// ─── Types ──────────────────────────────────────────────────────────────────

type PaddleEvent = {
  event_id: string;
  event_type: string;
  occurred_at?: string;
  data: {
    id?: string;
    status?: string;
    customer_id?: string;
    subscription_id?: string;
    custom_data?: {
      firebase_uid?: string;
      selected_plan?: string;
    };
  };
};

type SignatureCheck = { valid: true } | { valid: false; reason: string };

// ─── Vérification signature Paddle ──────────────────────────────────────────
//
// Header Paddle-Signature au format : ts=<unix_seconds>;h1=<hex_signature>
// Signature attendue = HMAC-SHA256(secret, `<ts>:<raw_body>`)

function verifyPaddleSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secrets: (string | undefined)[],
): SignatureCheck {
  if (!signatureHeader) {
    return { valid: false, reason: 'missing Paddle-Signature header' };
  }

  // Parse ts=... ; h1=...
  const parts = signatureHeader.split(';').map((p) => p.trim());
  let ts: string | undefined;
  let h1: string | undefined;
  for (const part of parts) {
    if (part.startsWith('ts=')) ts = part.substring(3);
    if (part.startsWith('h1=')) h1 = part.substring(3);
  }
  if (!ts || !h1) {
    return { valid: false, reason: 'malformed signature header' };
  }

  // Anti-replay : timestamp doit être dans la fenêtre tolérée
  const tsNum = parseInt(ts, 10);
  if (Number.isNaN(tsNum)) {
    return { valid: false, reason: 'non-numeric timestamp' };
  }
  const nowSec = Math.floor(Date.now() / 1000);
  const ageSec = nowSec - tsNum;
  if (ageSec > REPLAY_WINDOW_SECONDS) {
    return { valid: false, reason: `event too old (${ageSec}s)` };
  }
  if (ageSec < -REPLAY_WINDOW_SECONDS) {
    return { valid: false, reason: `event in future (${-ageSec}s)` };
  }

  // Calcul de la signature attendue sur `<ts>:<raw_body>`, testé contre
  // chaque secret fourni (prod + sandbox). Le premier match gagne.
  // Le payload et le buffer reçu sont identiques pour tous les secrets :
  // on les calcule une seule fois hors de la boucle.
  const payload = `${ts}:${rawBody.toString('utf8')}`;
  const receivedBuf = Buffer.from(h1, 'hex');
  let anySecretPresent = false;

  for (const secret of secrets) {
    if (!secret) continue; // secret non configuré (ex : sandbox pas encore posé)
    anySecretPresent = true;
    const expectedHex = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (expectedHex.length !== h1.length) continue;
    const expectedBuf = Buffer.from(expectedHex, 'hex');
    if (expectedBuf.length !== receivedBuf.length) continue;
    if (crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
      return { valid: true };
    }
  }

  if (!anySecretPresent) {
    return { valid: false, reason: 'no signing secret configured' };
  }
  return { valid: false, reason: 'signature mismatch (prod + sandbox)' };
}

// ─── Dérivation de subscription_active selon l'événement ────────────────────
//
// Renvoie :
//   - true  → activer subscription_active dans Firestore
//   - false → désactiver
//   - null  → ne pas toucher subscription_active (mais on log)

function deriveSubscriptionActive(
  eventType: string,
  status: string | undefined,
): boolean | null {
  switch (eventType) {
    case 'transaction.paid':
    case 'subscription.activated':
      return true;

    case 'subscription.canceled':
    case 'subscription.past_due':
      return false;

    case 'subscription.updated':
      // Pendant une grâce (cancellation programmée), status reste 'active'
      // jusqu'à expiration réelle → subscription_active reste true.
      return status === 'active' || status === 'trialing';

    case 'transaction.payment_failed':
    case 'subscription.created':
      // Acknowledged mais aucune mise à jour (Paddle gère retry/sequencing).
      return null;

    default:
      // Événement non géré explicitement — on ack 200 sans rien changer.
      return null;
  }
}

// ─── Handler principal ──────────────────────────────────────────────────────

export const paddleWebhook = onRequest(
  {
    region: 'europe-west1',
    secrets: [PADDLE_WEBHOOK_SECRET, PADDLE_SANDBOX_WEBHOOK_SECRET],
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

    // 2. Raw body — onRequest l'expose via req.rawBody (Buffer).
    //    On signe sur le raw, jamais sur le JSON re-sérialisé (sinon HMAC casse).
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody || rawBody.length === 0) {
      logger.warn('[paddle] rawBody missing or empty');
      res.status(400).send('Bad Request');
      return;
    }

    // 3. Vérification signature
    const prodSecret = PADDLE_WEBHOOK_SECRET.value();
    const sandboxSecret = PADDLE_SANDBOX_WEBHOOK_SECRET.value();
    if (!prodSecret && !sandboxSecret) {
      logger.error('[paddle] no webhook secret configured (prod + sandbox both empty)');
      res.status(500).send('Internal Server Error');
      return;
    }
    const signatureHeader = req.get('Paddle-Signature') ?? req.get('paddle-signature');
    const sigCheck = verifyPaddleSignature(rawBody, signatureHeader, [prodSecret, sandboxSecret]);
    if (!sigCheck.valid) {
      logger.warn(`[paddle] signature invalid: ${sigCheck.reason}`);
      res.status(401).send('Unauthorized');
      return;
    }

    // 4. Parse JSON
    let event: PaddleEvent;
    try {
      event = JSON.parse(rawBody.toString('utf8')) as PaddleEvent;
    } catch (e) {
      logger.warn('[paddle] body not valid JSON', e);
      res.status(400).send('Bad Request');
      return;
    }

    const { event_id, event_type } = event;
    if (!event_id || !event_type) {
      logger.warn('[paddle] event missing event_id or event_type');
      res.status(400).send('Bad Request');
      return;
    }

    // 5. Extraction de l'UID Firebase depuis custom_data
    const customData = event.data.custom_data;
    const firebaseUid = customData?.firebase_uid;
    if (!firebaseUid) {
      // Cas légitime : événement déclenché depuis le dashboard sans custom_data
      // (test, action manuelle). On ack pour éviter retry, mais on log.
      logger.warn(
        `[paddle] event ${event_id} (${event_type}) missing custom_data.firebase_uid`,
      );
      res.status(200).send('OK (no firebase_uid)');
      return;
    }

    // 6. Dérivation et écriture Firestore
    const newSubActive = deriveSubscriptionActive(event_type, event.data.status);
    if (newSubActive === null) {
      logger.info(
        `[paddle] event ${event_id} (${event_type}) acknowledged, no sub change`,
      );
      res.status(200).send('OK (no change)');
      return;
    }

    try {
      const userRef = db.collection('users').doc(firebaseUid);
      const update: Record<string, unknown> = {
        subscription_active: newSubActive,
        paddle_event_id: event_id,
        paddle_event_type: event_type,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (event.data.status) update.paddle_status = event.data.status;
      if (event.data.customer_id) update.paddle_customer_id = event.data.customer_id;
      if (event.data.subscription_id) update.paddle_subscription_id = event.data.subscription_id;
      if (customData?.selected_plan) update.selected_plan = customData.selected_plan;

      await userRef.set(update, { merge: true });

      logger.info(
        `[paddle] users/${firebaseUid} updated: subscription_active=${newSubActive} (${event_type})`,
      );
      res.status(200).send('OK');
    } catch (e) {
      logger.error('[paddle] Firestore write failed', e);
      // 5xx → Paddle retry automatiquement avec backoff
      res.status(500).send('Internal Server Error');
    }
  },
);
