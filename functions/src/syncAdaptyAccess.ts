// ─────────────────────────────────────────────────────────────────────────────
// ManifestMind — filet de sécurité de la RESTAURATION (version 1.1.0)
// ─────────────────────────────────────────────────────────────────────────────
//
// Pourquoi : l'app ne débloque l'accès que sur `users/{uid}.subscription_active`
// (Firestore), écrit par les webhooks. Le 2026-11-25 (versionCode 12), une
// restauration a bien rattaché un abonnement au profil Adapty d'un nouveau
// compte, mais Adapty n'a envoyé AUCUN événement au webhook → accès jamais
// ouvert. Cette fonction comble ce trou : après « Restaurer », l'app l'appelle ;
// elle lit le profil Adapty AVEC LA CLÉ SECRÈTE (côté serveur) et, si l'accès
// `premium` y est actif, pose subscription_active = true.
//
// 🔒 Sécurité :
//   - Fonction APPELABLE (onCall) : Firebase vérifie le jeton de la personne
//     connectée. L'UID utilisé est UNIQUEMENT `request.auth.uid` — jamais une
//     donnée envoyée par l'app. Impossible d'ouvrir l'accès d'un autre compte.
//   - La décision vient d'Adapty, lu côté serveur avec la clé secrète : l'app ne
//     peut pas la falsifier.
//   - Elle n'OUVRE que (jamais de coupure) : la révocation reste l'affaire des
//     webhooks. Elle ne touche pas à `adapty_event_at_ms` (l'horloge des
//     webhooks) : une révocation postérieure s'appliquera normalement.
//   - Aucun lien avec paddleWebhook ni adaptyWebhook (fichier séparé, aucun code
//     partagé).

import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions/v2';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const ADAPTY_SECRET_KEY = defineSecret('ADAPTY_SECRET_KEY');
const ADAPTY_PROFILE_URL = 'https://api.adapty.io/api/v2/server-side-api/profile/';
const PREMIUM_ACCESS_LEVEL = 'premium';

type AdaptyAccessLevel = {
  access_level_id?: string;
  starts_at?: string | null;
  expires_at?: string | null;
};

// Accès premium actif MAINTENANT : niveau `premium`, déjà commencé, et sans fin
// (à vie) ou avec une fin dans le futur. Exporté pour les tests.
export function premiumActif(levels: AdaptyAccessLevel[] | undefined, maintenant = Date.now()): boolean {
  return (levels ?? []).some((l) => {
    if (l.access_level_id !== PREMIUM_ACCESS_LEVEL) return false;
    if (l.starts_at && Date.parse(l.starts_at) > maintenant) return false;
    if (!l.expires_at) return true;
    const fin = Date.parse(l.expires_at);
    return Number.isFinite(fin) && fin > maintenant;
  });
}

export const syncAdaptyAccess = onCall(
  {
    region: 'europe-west1',
    secrets: [ADAPTY_SECRET_KEY],
    maxInstances: 10,
    // Appelable depuis l'app (comme toute fonction onCall) ; la connexion est
    // vérifiée DANS la fonction (request.auth), pas par Cloud Run.
    invoker: 'public',
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Connexion requise.');

    let levels: AdaptyAccessLevel[] | undefined;
    try {
      const r = await fetch(ADAPTY_PROFILE_URL, {
        method: 'GET',
        headers: {
          Authorization: `Api-Key ${ADAPTY_SECRET_KEY.value()}`,
          'adapty-customer-user-id': uid,
        },
      });
      if (r.status === 404) {
        logger.info(`[sync-adapty] aucun profil Adapty pour uid=${uid}`);
        return { active: false };
      }
      if (!r.ok) {
        logger.error(`[sync-adapty] lecture Adapty HTTP ${r.status} pour uid=${uid}`);
        throw new HttpsError('unavailable', 'Adapty indisponible.');
      }
      const body = (await r.json()) as { data?: { access_levels?: AdaptyAccessLevel[] } };
      levels = body?.data?.access_levels;
    } catch (e) {
      if (e instanceof HttpsError) throw e;
      logger.error(`[sync-adapty] erreur réseau Adapty pour uid=${uid}`, e);
      throw new HttpsError('unavailable', 'Adapty indisponible.');
    }

    if (!premiumActif(levels)) {
      logger.info(`[sync-adapty] pas d'accès premium actif chez Adapty pour uid=${uid} → rien écrit`);
      return { active: false };
    }

    await admin.firestore().collection('users').doc(uid).set(
      {
        subscription_active: true,
        // Marque « ouvert par la restauration » : seuls ces comptes sont relus par
        // la vérification quotidienne (verifierAccesRestaures).
        adapty_sync_ouvert: true,
        adapty_sync_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    logger.info(`[sync-adapty] users/${uid} : subscription_active=true (accès premium actif chez Adapty)`);
    return { active: true };
  },
);
