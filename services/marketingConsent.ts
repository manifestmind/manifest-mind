// services/marketingConsent.ts — Consentement marketing (RGPD).
//
// SEUL fichier qui écrit dans la collection `marketing_consents`. Les écrans
// appelants ne connaissent ni Firestore ni la forme du document : ils appellent
// `saveMarketingConsent(...)` et n'attendent rien en retour.
//
// ─────────────────────────────────────────────────────────────────────────────
// POURQUOI UNE COLLECTION SÉPARÉE, ET PAS users/{uid}
// ─────────────────────────────────────────────────────────────────────────────
// `firestore.rules` interdit au client TOUTE création/mise à jour de
// users/{uid} (`allow create, update: if false`) — c'est ce qui rend
// `subscription_active` infalsifiable. Y écrire le consentement aurait obligé à
// ouvrir la permission `create` sur le document qui porte l'abonnement : la plus
// dangereuse de tout le modèle. De plus users/{uid} est créé par le webhook AU
// MOMENT D'UN ACHAT — or la cible de cette fonctionnalité est précisément la
// personne qui crée un compte SANS acheter : son document n'existe pas.
// D'où une collection distincte, avec ses propres règles (additives par chemin,
// donc sans effet sur le bloc /users/).
//
// ─────────────────────────────────────────────────────────────────────────────
// RÈGLE ABSOLUE : NE JAMAIS BLOQUER UNE VENTE
// ─────────────────────────────────────────────────────────────────────────────
// Le consentement est SECONDAIRE, la vente ne l'est pas. Cette fonction est donc
// conçue pour être appelée SANS `await` :
//     saveMarketingConsent({...}).catch(() => {});
// Elle n'échoue jamais bruyamment et ne rejette jamais. Compromis ASSUMÉ et
// validé : une écriture ratée = un consentement perdu silencieusement. L'inverse
// — attendre l'écriture — retarderait un achat sur réseau lent, ce qui est pire.

import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// D'où vient l'inscription. Renseigne la liste de diffusion sans recoupement.
export type ConsentSource = 'pricing' | 'pricing-upgrade' | 'activation';

type SaveArgs = {
  uid: string;
  email: string;
  lang: string;
  source: ConsentSource;
};

// Enregistre une ACCEPTATION. À n'appeler QUE si la case est cochée : un refus
// ne produit AUCUN document. Conséquences voulues :
//   - moins de données personnelles conservées ;
//   - la collection EST la liste de diffusion — tout ce qu'elle contient est
//     consentant, exportable tel quel, rien à filtrer.
//
// `consent_at` est un horodatage SERVEUR (serverTimestamp) : c'est lui qui rend
// le consentement PROUVABLE en cas de contrôle. Un horodatage client, réglable
// depuis l'appareil, serait contestable.
//
// Les clés écrites doivent rester EXACTEMENT celles autorisées par le `hasOnly`
// de firestore.rules (consent, consent_at, email, lang, source) — en ajouter une
// ici sans toucher aux règles ferait échouer l'écriture en permission-denied.
export async function saveMarketingConsent({ uid, email, lang, source }: SaveArgs): Promise<void> {
  if (!uid) return;
  try {
    await setDoc(doc(db, 'marketing_consents', uid), {
      consent: true,
      consent_at: serverTimestamp(),
      email,
      lang,
      source,
    });
  } catch (e: any) {
    // Avalé volontairement : aucune remontée à l'appelant, aucun toast. Le seul
    // signal est ce log de dev — en production, l'achat prime sur la trace.
    if (__DEV__) console.log('[marketingConsent] écriture échouée', e?.code, e?.message);
  }
}
