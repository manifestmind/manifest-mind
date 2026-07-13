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
import { PADDLE_SANDBOX } from './config';

const PADDLE_JS_SRC = 'https://cdn.paddle.com/paddle/v2/paddle.js';

type PaddlePlan = 'mensuel' | 'annuel' | 'lifetime';

type CheckoutArgs = {
  plan: PaddlePlan;
  email: string;
  firebaseUid: string;
  onClose?: () => void;
  onCheckoutCompleted?: () => void;
};

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: 'sandbox' | 'production') => void };
      Setup: (config: { token: string; eventCallback?: (data: any) => void }) => void;
      Checkout: { open: (options: any) => void; close: () => void };
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

export async function openCheckout(args: CheckoutArgs): Promise<void> {
  if (Platform.OS !== 'web') {
    console.warn('[paddle] openCheckout appelé sur native — ignoré (utilise STORES_ACTIVE / RevenueCat)');
    return;
  }

  const priceId = getPriceId(args.plan);
  if (!priceId) {
    console.warn(`[paddle] price ID manquant pour plan="${args.plan}" (PADDLE_SANDBOX=${PADDLE_SANDBOX})`);
    return;
  }

  try {
    await loadPaddleScript();
  } catch (e) {
    console.warn('[paddle] chargement script échoué', e);
    return;
  }

  // Handlers du checkout courant, relus par le dispatcher stable (cf. supra).
  currentHandlers = {
    onClose: args.onClose,
    onCheckoutCompleted: args.onCheckoutCompleted,
  };

  const setupOk = setupPaddle();
  if (!setupOk || !window.Paddle) return;

  try {
    window.Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email: args.email },
      customData: { firebase_uid: args.firebaseUid },
    });
  } catch (e) {
    console.warn('[paddle] Checkout.open failed', e);
  }
}
