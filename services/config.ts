// Feature flags ManifestMind
// Centralise les bascules globales (stores, expérimentations) pour ne pas
// disperser les conditions dans les écrans.

import { Platform } from 'react-native';

// Bascule à `true` une fois RevenueCat / In-App Purchases câblés sur les
// stores natifs (iOS / Android). Tant que `false`, sur native, le bouton
// d'achat affiche "Disponible prochainement". Sans effet sur web (voir
// PADDLE_ACTIVE).
export const STORES_ACTIVE = false;

// Bascule à `true` une fois Paddle.js + webhook Firebase Functions câblés
// pour les paiements web. Tant que `false`, sur web, le bouton d'achat
// affiche "Disponible prochainement". Sans effet sur native (voir STORES_ACTIVE).
export const PADDLE_ACTIVE = true;

// Mode sandbox Paddle (pour tester sans facturation réelle). Lu depuis .env.
// Quand `true`, services/paddle.ts utilise Paddle.Environment.set('sandbox')
// + les vars EXPO_PUBLIC_PADDLE_SANDBOX_TOKEN/PRICE_*.
export const PADDLE_SANDBOX = process.env.EXPO_PUBLIC_PADDLE_SANDBOX === 'true';

// Nombre de cycles offerts avant le paywall freemium.
export const FREE_CYCLES = 7;

// Adresse de support (boîte configurée et relevée). Utilisée par activation.tsx
// pour offrir un recours à un vrai payeur dont le webhook a échoué. Si un jour
// on la vide (''), le bloc "contacter le support" disparaît automatiquement et
// seule la guidance Paddle reste — aucune promesse de contact qu'on ne tient pas.
export const SUPPORT_EMAIL = 'contact@manifest-mind.app';

// Helper platform-aware : renvoie true si la plateforme courante a un provider
// de paiement actif. Permet d'unifier les checks dans pricing.tsx,
// pricing-upgrade.tsx et parametres.tsx sans dupliquer la logique.
//
//   - Web      → PADDLE_ACTIVE
//   - iOS/Android → STORES_ACTIVE
//
// Si false, l'UI doit afficher "Disponible prochainement" et bloquer l'achat.
export function canPay(): boolean {
  if (Platform.OS === 'web') return PADDLE_ACTIVE;
  return STORES_ACTIVE;
}

// ──────────────────────────────────────────────────────────────────────────
// DEBUG — À PASSER À false AVANT SOUMISSION AUX STORES
// ──────────────────────────────────────────────────────────────────────────
// Permet de tester les cycles 8 à 365 sur Expo Go sans payer.
// Quand `true`, le gate freemium dans home.tsx est court-circuité :
// aucun utilisateur n'est jamais redirigé vers pricing-upgrade.tsx.
export const DEBUG_SKIP_PAYWALL = false;
