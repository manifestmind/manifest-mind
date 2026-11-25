// ─────────────────────────────────────────────────────────────────────────────
// ManifestMind — vérification QUOTIDIENNE des accès ouverts par la restauration
// (version 1.1.0, complément de syncAdaptyAccess)
// ─────────────────────────────────────────────────────────────────────────────
//
// syncAdaptyAccess OUVRE l'accès d'un compte quand Adapty y voit un accès
// premium actif, mais ne le referme jamais. Avec le partage d'accès Adapty
// « Enabled (default) », rien ne garantit qu'un compte qui a HÉRITÉ de l'accès
// recevra un événement de fin. Cette fonction, chaque jour à 5 h (heure de
// Paris), relit chez Adapty les SEULS comptes ouverts par la restauration et
// referme ceux dont l'accès a pris fin.
//
// Ce qu'elle ne touche JAMAIS :
//   - les comptes SANS la marque `adapty_sync_ouvert` (abonnés normaux, compte de
//     démonstration, accès posés à la main) : ils ne sont même pas lus ;
//   - les comptes À VIE (`has_lifetime`), même marqués ;
//   - les abonnés du SITE (Paddle actif : `paddle_status` ni annulé ni impayé) ;
//   - les comptes dont un webhook a parlé APRÈS la restauration : le webhook
//     redevient seul juge (on retire seulement la marque).
// Dans le doute (Adapty injoignable), elle ne referme rien.

import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions/v2';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { premiumActif } from './syncAdaptyAccess';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const ADAPTY_SECRET_KEY = defineSecret('ADAPTY_SECRET_KEY');
const ADAPTY_PROFILE_URL = 'https://api.adapty.io/api/v2/server-side-api/profile/';

type DocUser = {
  subscription_active?: boolean;
  has_lifetime?: boolean;
  paddle_status?: string;
  adapty_event_at_ms?: number;
  adapty_sync_at?: admin.firestore.Timestamp;
};

// Décision SANS appel réseau (exportée pour les tests) :
//   'ignorer'        → ne rien écrire (à vie, abonné du site) ;
//   'retirer_marque' → le webhook a repris la main, ou l'accès est déjà fermé ;
//   'verifier'       → relire Adapty.
export function decisionAvantAdapty(d: DocUser): 'ignorer' | 'retirer_marque' | 'verifier' {
  if (d.has_lifetime === true) return 'ignorer';
  if (d.paddle_status && !['canceled', 'past_due'].includes(d.paddle_status)) return 'ignorer';
  if (d.subscription_active !== true) return 'retirer_marque';
  const syncMs = d.adapty_sync_at?.toMillis?.();
  if (typeof d.adapty_event_at_ms === 'number' && typeof syncMs === 'number' && d.adapty_event_at_ms > syncMs) {
    return 'retirer_marque';
  }
  return 'verifier';
}

export const verifierAccesRestaures = onSchedule(
  {
    schedule: '0 5 * * *',
    timeZone: 'Europe/Paris',
    region: 'europe-west1',
    secrets: [ADAPTY_SECRET_KEY],
    maxInstances: 1,
  },
  async () => {
    const db = admin.firestore();
    const snap = await db.collection('users').where('adapty_sync_ouvert', '==', true).get();
    let gardes = 0, fermes = 0, ignores = 0, marquesRetirees = 0, doutes = 0;

    for (const doc of snap.docs) {
      const uid = doc.id;
      const decision = decisionAvantAdapty(doc.data() as DocUser);
      if (decision === 'ignorer') { ignores++; continue; }
      if (decision === 'retirer_marque') {
        await doc.ref.update({ adapty_sync_ouvert: false });
        marquesRetirees++;
        continue;
      }

      // Relecture Adapty (clé secrète, côté serveur).
      let actif: boolean;
      try {
        const r = await fetch(ADAPTY_PROFILE_URL, {
          headers: { Authorization: `Api-Key ${ADAPTY_SECRET_KEY.value()}`, 'adapty-customer-user-id': uid },
        });
        if (r.status === 404) {
          actif = false;
        } else if (!r.ok) {
          doutes++;
          logger.warn(`[verif-restaures] Adapty HTTP ${r.status} pour uid=${uid} → rien fermé`);
          continue;
        } else {
          const body = (await r.json()) as { data?: { access_levels?: [] } };
          actif = premiumActif(body?.data?.access_levels);
        }
      } catch (e) {
        doutes++;
        logger.warn(`[verif-restaures] Adapty injoignable pour uid=${uid} → rien fermé`, e);
        continue;
      }

      if (actif) {
        await doc.ref.update({ adapty_sync_verifie_at: admin.firestore.FieldValue.serverTimestamp() });
        gardes++;
        continue;
      }

      // Fermeture, en transaction : on relit le document pour ne jamais écraser
      // une décision prise entre-temps (webhook, achat sur le site, à vie).
      const ferme = await db.runTransaction(async (tx) => {
        const s = await tx.get(doc.ref);
        if (!s.exists || s.get('adapty_sync_ouvert') !== true) return false;
        if (decisionAvantAdapty(s.data() as DocUser) !== 'verifier') return false;
        tx.update(doc.ref, {
          subscription_active: false,
          adapty_sync_ouvert: false,
          adapty_sync_ferme_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        return true;
      });
      if (ferme) {
        fermes++;
        logger.info(`[verif-restaures] users/${uid} : accès FERMÉ (plus d'accès premium actif chez Adapty)`);
      }
    }

    logger.info(
      `[verif-restaures] ${snap.size} compte(s) marqué(s) : ${gardes} gardé(s), ${fermes} fermé(s), ` +
        `${marquesRetirees} marque(s) retirée(s), ${ignores} ignoré(s), ${doutes} dans le doute`,
    );
  },
);
