// ─────────────────────────────────────────────────────────────────────────────
// ManifestMind — logique d'installation PWA (point 4-bis)
// ─────────────────────────────────────────────────────────────────────────────
//
// Module SANS React : capte l'événement `beforeinstallprompt` (Android/Chrome),
// détecte la plateforme et l'état « déjà installé » (standalone), et pilote le
// déclenchement natif. Consommé par components/ui/InstallPrompt.tsx et par la
// rangée « Installer l'application » de parametres.tsx.
//
// 🛡️ 100 % web-only : toutes les fonctions renvoient un no-op / valeur neutre
// sur natif (Platform.OS !== 'web') — inerte pour la Phase 2 (stores).

import { Platform } from 'react-native';

// Depuis iOS 16.4 (2023), TOUS les navigateurs iOS (Safari, Chrome, Edge…)
// peuvent « Ajouter à l'écran d'accueil » → un seul cas 'ios' (instructions),
// plus de distinction safari/chrome.
export type InstallPlatform = 'android' | 'ios' | 'other';

// L'événement beforeinstallprompt n'est pas dans les types DOM standard.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let initDone = false;
const installedListeners = new Set<() => void>();

// Enregistre les listeners une seule fois (idempotent). Appelé au démarrage
// depuis _layout.tsx (<PwaInstallListener/>). `beforeinstallprompt` fire au
// chargement dès que les critères sont réunis → on le capte et on le stocke,
// pour l'utiliser plus tard au clic du bouton (geste utilisateur requis).
export function initPwaInstall(): void {
  if (initDone || !isWeb) return;
  initDone = true;
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault(); // supprime la mini-infobar Chrome, on gère notre bouton
    deferredPrompt = e as BeforeInstallPromptEvent;
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installedListeners.forEach((cb) => cb());
  });
}

// S'abonner à l'événement « appinstalled » → masquer bannières/rangée en direct.
export function subscribeInstalled(cb: () => void): () => void {
  installedListeners.add(cb);
  return () => {
    installedListeners.delete(cb);
  };
}

export function isStandalone(): boolean {
  if (!isWeb) return false;
  const mm = typeof window.matchMedia === 'function'
    && window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(mm || iosStandalone);
}

export function getPlatform(): InstallPlatform {
  if (!isWeb || typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  // Tout iOS (Safari, Chrome/CriOS, Firefox/FxiOS, Edge/EdgiOS) → 'ios' :
  // depuis iOS 16.4 ils peuvent tous ajouter à l'écran d'accueil, via le même
  // menu Partager (emplacement de l'icône différent, d'où le wording générique).
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'other';
}

// L'app est-elle installable / vaut-il la peine de proposer l'install ?
export function installOfferable(): boolean {
  if (isStandalone()) return false;
  const p = getPlatform();
  if (p === 'ios' || p === 'android') return true;
  // desktop / autre : seulement si le navigateur a émis l'événement (installable)
  return deferredPrompt !== null;
}

// Ouvre la boîte de dialogue native (Android/Chrome + desktop). Doit être
// appelée depuis un geste utilisateur. Renvoie 'unavailable' si aucun événement
// n'a été capté (→ l'appelant montre le repli « menu ⋮ »).
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';
  const evt = deferredPrompt;
  deferredPrompt = null; // un événement ne peut servir qu'UNE fois
  try {
    await evt.prompt();
    const choice = await evt.userChoice;
    return choice.outcome;
  } catch {
    return 'unavailable';
  }
}

// Aiguillage central du clic « Installer », commun aux bannières et à la rangée
// Paramètres. Chaque appelant fournit ses propres retours UI (modale iOS, toast).
export async function performInstall(cb: {
  onIosInstructions: () => void; // iOS (tout navigateur) → modale d'étapes
  onFallback: () => void;        // Android sans événement / autre → « menu ⋮ »
}): Promise<void> {
  if (getPlatform() === 'ios') return cb.onIosInstructions();
  // android + other : tenter la boîte native, repli sinon
  const res = await promptInstall();
  if (res === 'unavailable') cb.onFallback();
}
