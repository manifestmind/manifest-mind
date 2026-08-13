// Paddle.js loader + checkout helper (web-only)
//
// Ce module est web-only : sur native (iOS / Android), toutes les fonctions
// sont no-op et retournent immédiatement. Le guard Platform.OS au début
// protège contre les imports/exécutions sur les plateformes non supportées.
//
// Paddle.js v2 doit être chargé via balise <script> dans le DOM, pas via
// import ES module. Le chargeur ci-dessous injecte le script à la demande,
// puis attend que window.Paddle soit disponible.

import { Platform } from 'react-native';
import { PADDLE_SANDBOX, SUPPORT_EMAIL } from './config';
// Types de prix PARTAGÉS avec le natif (Adapty). Import de TYPE uniquement
// (effacé à la compilation) → aucun couplage runtime, aucune lib native tirée
// dans le bundle web. Sur web, Metro résout purchasesNative.web.ts (qui exporte
// ces mêmes types). Permet à previewPrices() de renvoyer EXACTEMENT la forme que
// nativeGetPrices(), donc de réutiliser le même constructeur de cartes.
import type { NativePriceInfo, NativePricesResult } from './purchasesNative';

const PADDLE_JS_SRC = 'https://cdn.paddle.com/paddle/v2/paddle.js';

type PaddlePlan = 'mensuel' | 'annuel' | 'lifetime';

type CheckoutArgs = {
  plan: PaddlePlan;
  email: string;
  firebaseUid: string;
  onClose?: () => void;
  onCheckoutCompleted?: () => void;
};

// Cause d'un échec d'OUVERTURE du checkout (pas d'un paiement — le paiement est
// asynchrone via webhook). L'appelant traduit ça en message utilisateur.
export type CheckoutErrorReason = 'config' | 'load' | 'setup' | 'open' | 'unsupported';

// Résultat de openCheckout : { ok: true } = la modale Paddle S'EST OUVERTE (et
// NON « payé »). Le paiement effectif reste confirmé côté serveur (webhook →
// Firestore → activation.tsx). { ok: false } = on n'a pas pu ouvrir → l'appelant
// affiche un message. La fermeture volontaire de la modale n'est PAS un échec
// (elle arrive APRÈS ce retour, via l'événement checkout.closed → onClose).
export type CheckoutResult = { ok: true } | { ok: false; reason: CheckoutErrorReason };

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: 'sandbox' | 'production') => void };
      Setup: (config: { token: string; eventCallback?: (data: any) => void }) => void;
      Checkout: { open: (options: any) => void; close: () => void };
      // Aperçu de prix LOCALISÉS (devise + taxes du visiteur, détecté par IP).
      // S'authentifie avec le MÊME client token public (aucune clé secrète).
      PricePreview: (options: {
        items: { priceId: string; quantity: number }[];
      }) => Promise<any>;
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Chargement lazy de Paddle.js (idempotent)
// ──────────────────────────────────────────────────────────────────────────

let paddleLoaderPromise: Promise<void> | null = null;
let paddleSetupDone = false;

function loadPaddleScript(): Promise<void> {
  if (Platform.OS !== 'web') {
    return Promise.reject(new Error('[paddle] loadPaddleScript called on non-web platform'));
  }
  if (paddleLoaderPromise) return paddleLoaderPromise;

  paddleLoaderPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('[paddle] window/document undefined'));
      return;
    }
    if (window.Paddle) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${PADDLE_JS_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('[paddle] script load error')));
      return;
    }
    const script = document.createElement('script');
    script.src = PADDLE_JS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('[paddle] script load error'));
    document.head.appendChild(script);
  });

  return paddleLoaderPromise;
}

// ──────────────────────────────────────────────────────────────────────────
// Setup Paddle (token + environnement) — appelé une seule fois après load
// ──────────────────────────────────────────────────────────────────────────

// Paddle.Setup() n'est appelable qu'UNE fois par chargement de page : son
// eventCallback est figé. On y branche donc un dispatcher stable qui relit les
// handlers du checkout COURANT, stockés ici. Sans ça, un 2e openCheckout (1re
// tentative abandonnée, passage par pricing.tsx…) verrait ses callbacks
// silencieusement ignorés — checkout.completed ne routerait jamais.
let currentHandlers: Pick<CheckoutArgs, 'onClose' | 'onCheckoutCompleted'> = {};

function dispatchPaddleEvent(data: any) {
  if (!data?.name) return;
  if (__DEV__) console.log('[paddle] event', data.name);
  if (data.name === 'checkout.closed') currentHandlers.onClose?.();
  if (data.name === 'checkout.completed') {
    // Fermer l'overlay Paddle AVANT de rendre la main : sans successUrl, Paddle
    // laisse sa page "Payment successful" affichée par-dessus l'app. L'écran
    // d'activation se monterait derrière et resterait invisible.
    try {
      window.Paddle?.Checkout.close();
    } catch (e) {
      if (__DEV__) console.log('[paddle] Checkout.close() a échoué', e);
    }
    currentHandlers.onCheckoutCompleted?.();
  }
}

function setupPaddle(): boolean {
  if (Platform.OS !== 'web' || !window.Paddle) return false;
  if (paddleSetupDone) return true;

  const token = PADDLE_SANDBOX
    ? process.env.EXPO_PUBLIC_PADDLE_SANDBOX_TOKEN
    : process.env.EXPO_PUBLIC_PADDLE_CLIENT_TOKEN;

  if (!token) {
    console.warn(
      `[paddle] token manquant (PADDLE_SANDBOX=${PADDLE_SANDBOX}) — vérifier .env`,
    );
    return false;
  }

  try {
    window.Paddle.Environment.set(PADDLE_SANDBOX ? 'sandbox' : 'production');
    window.Paddle.Setup({ token, eventCallback: dispatchPaddleEvent });
    paddleSetupDone = true;
    return true;
  } catch (e) {
    console.warn('[paddle] Setup failed', e);
    return false;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Mapping plan → price ID (prod / sandbox)
// ──────────────────────────────────────────────────────────────────────────

function getPriceId(plan: PaddlePlan): string | undefined {
  if (PADDLE_SANDBOX) {
    switch (plan) {
      case 'mensuel':  return process.env.EXPO_PUBLIC_PADDLE_SANDBOX_PRICE_MENSUEL;
      case 'annuel':   return process.env.EXPO_PUBLIC_PADDLE_SANDBOX_PRICE_ANNUEL;
      case 'lifetime': return process.env.EXPO_PUBLIC_PADDLE_SANDBOX_PRICE_LIFETIME;
    }
  }
  switch (plan) {
    case 'mensuel':  return process.env.EXPO_PUBLIC_PADDLE_PRICE_MENSUEL;
    case 'annuel':   return process.env.EXPO_PUBLIC_PADDLE_PRICE_ANNUEL;
    case 'lifetime': return process.env.EXPO_PUBLIC_PADDLE_PRICE_LIFETIME;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// API publique : openCheckout
// ──────────────────────────────────────────────────────────────────────────
//
// Ouvre le checkout Paddle pour le plan demandé. No-op sur native.
//
// Note importante : on ne touche PAS à AsyncStorage ici. La source de vérité
// de subscription_active est le webhook serveur → Firestore → listener
// useSubscriptionSync. L'utilisateur peut fermer le checkout sans payer ;
// seul un paiement effectif validé côté serveur déclenche l'update.

export async function openCheckout(args: CheckoutArgs): Promise<CheckoutResult> {
  if (Platform.OS !== 'web') {
    console.warn('[paddle] openCheckout appelé sur native — ignoré (utilise STORES_ACTIVE / RevenueCat)');
    return { ok: false, reason: 'unsupported' };
  }

  const priceId = getPriceId(args.plan);
  if (!priceId) {
    // ⚠️ Diagnostic INTENTIONNEL (config .env cassée = 100 % des paiements
    // échouent) — NE PAS retirer au nettoyage Phase F.
    console.error(`[paddle] price ID manquant pour plan="${args.plan}" (PADDLE_SANDBOX=${PADDLE_SANDBOX}) — vérifier .env`);
    return { ok: false, reason: 'config' };
  }

  try {
    await loadPaddleScript();
  } catch (e) {
    // Cause la plus fréquente en prod : bloqueur de pub / réseau bloque cdn.paddle.com.
    console.warn('[paddle] chargement script échoué', e);
    return { ok: false, reason: 'load' };
  }

  // Handlers du checkout courant, relus par le dispatcher stable (cf. supra).
  currentHandlers = {
    onClose: args.onClose,
    onCheckoutCompleted: args.onCheckoutCompleted,
  };

  const setupOk = setupPaddle();
  if (!setupOk || !window.Paddle) {
    console.error('[paddle] setup impossible (token manquant ou Setup en échec)');
    return { ok: false, reason: 'setup' };
  }

  try {
    window.Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email: args.email },
      customData: { firebase_uid: args.firebaseUid },
    });
    // La modale s'est ouverte. Le paiement (ou l'abandon) suit de façon asynchrone
    // via les événements Paddle — ce n'est PAS l'objet de ce retour.
    return { ok: true };
  } catch (e) {
    console.warn('[paddle] Checkout.open failed', e);
    return { ok: false, reason: 'open' };
  }
}

// Traduit une cause d'échec en message utilisateur. 2 messages seulement :
//   - 'load'  → actionnable (connexion / bloqueur de pub) ;
//   - autres  → technique, avec le support (SUPPORT_EMAIL interpolé).
// 'unsupported' (native, no-op) → null : l'appelant n'affiche rien.
export function mapCheckoutError(
  reason: CheckoutErrorReason,
  msgs: { erreurChargement: string; erreurTechnique: string },
): string | null {
  switch (reason) {
    case 'load':
      return msgs.erreurChargement;
    case 'config':
    case 'setup':
    case 'open':
      return msgs.erreurTechnique.replace('{email}', SUPPORT_EMAIL);
    case 'unsupported':
      return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Prix LOCALISÉS via Paddle.PricePreview (WEB uniquement)
// ──────────────────────────────────────────────────────────────────────────
//
// Récupère les 3 prix localisés (devise + taxes du visiteur, détectés par IP)
// avec le client token public déjà en place — AUCUNE clé secrète, AUCUN nouvel
// identifiant. Renvoie EXACTEMENT la forme de nativeGetPrices() (Adapty) pour
// que le hook réutilise le même constructeur de cartes + le même TOUT-OU-RIEN.
//
// TOUT-OU-RIEN : { ok: false } si le web n'est pas disponible, si un price ID
// .env manque, si Paddle échoue, ou si UN SEUL des 3 produits n'a pas un prix
// localisé complet (formaté + montant + devise). L'appelant désactive alors
// l'achat et affiche « Prix indisponibles ». Jamais de prix inventé.
export async function previewPrices(): Promise<NativePricesResult> {
  if (Platform.OS !== 'web') return { ok: false };

  const plans: PaddlePlan[] = ['mensuel', 'annuel', 'lifetime'];
  const priceIdByPlan = {} as Record<PaddlePlan, string>;
  const items: { priceId: string; quantity: number }[] = [];
  for (const plan of plans) {
    const id = getPriceId(plan);
    if (!id) {
      // .env incomplet (100 % des prix cassés) — diagnostic INTENTIONNEL.
      console.error(`[paddle] price ID manquant pour preview plan="${plan}" — vérifier .env`);
      return { ok: false };
    }
    priceIdByPlan[plan] = id;
    items.push({ priceId: id, quantity: 1 });
  }

  try {
    await loadPaddleScript();
  } catch (e) {
    if (__DEV__) console.log('[paddle] preview: chargement script échoué', e);
    return { ok: false };
  }
  if (!setupPaddle() || !window.Paddle?.PricePreview) return { ok: false };

  try {
    const result = await window.Paddle.PricePreview({ items });
    const lineItems: any[] = result?.data?.details?.lineItems ?? [];
    const currencyCode: string | undefined = result?.data?.currencyCode;
    if (!currencyCode) return { ok: false };

    // Nombre de décimales de la devise (USD=2, JPY=0…) via Intl — évite un
    // facteur 100 erroné : `totals.total` de Paddle est en PLUS PETITE UNITÉ.
    let decimals = 2;
    try {
      decimals =
        new Intl.NumberFormat('en', { style: 'currency', currency: currencyCode })
          .resolvedOptions().maximumFractionDigits ?? 2;
    } catch {
      decimals = 2;
    }
    const divisor = Math.pow(10, decimals);

    const prices = {} as Record<PaddlePlan, NativePriceInfo>;
    for (const plan of plans) {
      const li = lineItems.find((x) => x?.price?.id === priceIdByPlan[plan]);
      const localized: string | undefined = li?.formattedTotals?.total;
      const rawMinor: unknown = li?.totals?.total;
      const amount =
        typeof rawMinor === 'string' || typeof rawMinor === 'number'
          ? Number(rawMinor) / divisor
          : NaN;
      if (!localized || !Number.isFinite(amount)) return { ok: false };
      prices[plan] = { localized, amount, currencyCode };
    }
    return { ok: true, prices };
  } catch (e) {
    if (__DEV__) console.log('[paddle] PricePreview échoué', e);
    return { ok: false };
  }
}
