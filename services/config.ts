// Feature flags ManifestMind
// Centralise les bascules globales (stores, expérimentations) pour ne pas
// disperser les conditions dans les écrans.

// Bascule à `true` une fois RevenueCat / In-App Purchases câblés sur les
// stores. Tant que `false`, le bouton d'achat affiche "Disponible prochainement"
// au lieu de lancer le flux de paiement.
export const STORES_ACTIVE = false;

// Nombre de cycles offerts avant le paywall freemium.
export const FREE_CYCLES = 7;

// ──────────────────────────────────────────────────────────────────────────
// DEBUG — À PASSER À false AVANT SOUMISSION AUX STORES
// ──────────────────────────────────────────────────────────────────────────
// Permet de tester les cycles 8 à 365 sur Expo Go sans payer.
// Quand `true`, le gate freemium dans home.tsx est court-circuité :
// aucun utilisateur n'est jamais redirigé vers pricing-upgrade.tsx.
export const DEBUG_SKIP_PAYWALL = true;
