// ─────────────────────────────────────────────────────────────────────────────
// ManifestMind — offre annuelle spéciale (version 1.1.0)
// ─────────────────────────────────────────────────────────────────────────────
//
// Règle (décision utilisatrice 2026-11-24, cf. claude_master.md « 🎁 OFFRE
// ANNUELLE SPÉCIALE ») — identique sur le site, Android et iOS :
//   - JAMAIS à la 1ʳᵉ visite du paywall ;
//   - à partir de la 2ᵉ visite sans achat : À CHAQUE visite, 30 s après
//     l'ouverture du paywall, une fenêtre présente l'offre ;
//   - présentation : « Offre annuelle spéciale : {prix}/an », prix lu dans la
//     console (Paddle / Google Play / App Store) — sans prix barré, ni
//     pourcentage, ni urgence.
//
// Une « visite » = une ouverture d'un écran de paywall (onboarding ou mise à
// niveau). Le compteur vit sur l'appareil (AsyncStorage / localStorage), comme
// la progression ; il n'est jamais envoyé à un serveur.

import AsyncStorage from '@react-native-async-storage/async-storage';

export const PAYWALL_VISITS_KEY = 'paywall_visits';
export const OFFRE_DELAI_MS = 30_000;
export const OFFRE_VISITE_MIN = 2;

// Enregistre une ouverture du paywall et renvoie le nouveau total.
// Stockage en échec → 0 (l'offre ne s'affiche pas : on ne montre jamais une
// offre sur une information incertaine).
export async function enregistrerVisitePaywall(): Promise<number> {
  try {
    const n = parseInt((await AsyncStorage.getItem(PAYWALL_VISITS_KEY)) || '0', 10);
    const suivant = (Number.isFinite(n) && n > 0 ? n : 0) + 1;
    await AsyncStorage.setItem(PAYWALL_VISITS_KEY, String(suivant));
    return suivant;
  } catch {
    return 0;
  }
}
