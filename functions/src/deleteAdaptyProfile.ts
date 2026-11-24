// ─────────────────────────────────────────────────────────────────────────────
// deleteAdaptyProfile — effacement du profil Adapty à la suppression du compte
// (version 1.1.0, étape B.13)
// ─────────────────────────────────────────────────────────────────────────────
//
// Quand un compte Firebase est supprimé (bouton « Supprimer mon compte » des
// Paramètres, ou suppression depuis la console), Firebase déclenche cette
// fonction AUTOMATIQUEMENT, côté serveur. Elle demande à Adapty de supprimer le
// profil rattaché à ce compte (identifiant Firebase = customer_user_id chez
// Adapty, posé par adapty.identify dans services/purchasesNative.ts).
//
// → Aucun changement dans l'app ni sur le site : couvre aussi les versions déjà
//   installées.
// → C'est la « demande de suppression aux plateformes » de la formulation C.11 :
//   ce qu'Adapty conserve ensuite dépend de ses propres règles.
//
// API Adapty (documentation officielle « Delete profile ») :
//   DELETE https://api.adapty.io/api/v2/server-side-api/profile/
//   Authorization: Api-Key <clé secrète>   ·   adapty-customer-user-id: <uid>
//   204 = supprimé · 404 = aucun profil (compte qui n'a jamais vu le paywall)
//
// Déclencheur « suppression de compte » : il n'existe que dans la 1ʳᵉ génération
// des fonctions Firebase (toujours prise en charge) ; c'est la seule fonction du
// projet de ce type. paddleWebhook et adaptyWebhook ne sont PAS concernés.
//
// 🔒 Secret : ADAPTY_SECRET_KEY (clé secrète Adapty, `secret_live_…`) dans Google
// Secret Manager, jamais dans le code ni dans les journaux.
//
// Jamais d'exception renvoyée : la suppression du compte Firebase a déjà eu lieu,
// une erreur Adapty ne doit rien bloquer. En cas d'échec, une ligne d'erreur dans
// les journaux permet un nettoyage manuel (identifiant du compte seulement).
// ─────────────────────────────────────────────────────────────────────────────

import * as functions from 'firebase-functions/v1';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions/v2';

const ADAPTY_SECRET_KEY = defineSecret('ADAPTY_SECRET_KEY');
const ADAPTY_DELETE_URL = 'https://api.adapty.io/api/v2/server-side-api/profile/';

export const deleteAdaptyProfile = functions
  .region('europe-west1')
  .runWith({ secrets: [ADAPTY_SECRET_KEY], timeoutSeconds: 30, memory: '128MB' })
  .auth.user()
  .onDelete(async (user) => {
    const uid = user.uid;
    try {
      const res = await fetch(ADAPTY_DELETE_URL, {
        method: 'DELETE',
        headers: {
          Authorization: `Api-Key ${ADAPTY_SECRET_KEY.value().trim()}`,
          'adapty-customer-user-id': uid,
        },
      });
      if (res.status === 204) {
        logger.info(`[adapty-delete] profil supprimé uid=${uid}`);
      } else if (res.status === 404) {
        logger.info(`[adapty-delete] aucun profil Adapty uid=${uid} (rien à supprimer)`);
      } else {
        // Corps de réponse limité et sans en-têtes : jamais la clé dans les journaux.
        const body = (await res.text().catch(() => '')).slice(0, 200);
        logger.error(`[adapty-delete] ÉCHEC HTTP ${res.status} uid=${uid} — nettoyage manuel à prévoir`, { body });
      }
    } catch (e) {
      logger.error(`[adapty-delete] ÉCHEC réseau uid=${uid} — nettoyage manuel à prévoir`, { message: (e as Error)?.message });
    }
  });
