import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { getRedirectResult, isSignInWithEmailLink, signInAnonymously, signInWithEmailLink } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { AuthToastHost, showAuthToast } from '../components/ui/AuthToast';
import { auth } from '../services/firebase';
import { finalizeSignIn } from '../services/authSession';
import { INITIAL_WEB_HREF } from '../services/initialUrl';
import { useSubscriptionSync } from '../hooks/useSubscriptionSync';
import { BackgroundMusicProvider } from '../components/audio/BackgroundMusicProvider';
import { LanguageProvider } from '../src/i18n/LanguageContext';
import { useTranslation } from '../src/hooks/useTranslation';
import { initPwaInstall } from '../services/pwaInstall';

function SubscriptionSync() {
  useSubscriptionSync();
  return null;
}

// Enregistre au démarrage les listeners d'installation PWA (point 4-bis).
// Isolé, web-only, sans effet sur les autres bootstraps (auth, deep link).
function PwaInstallListener() {
  useEffect(() => { initPwaInstall(); }, []);
  return null;
}

// Bootstrap identité — SÉQUENTIEL, l'ordre est critique :
//
//   1. getRedirectResult() — récupère la session d'un signInWithRedirect Google
//      (repli quand le popup est bloqué). DOIT être résolu EN PREMIER : sinon
//      l'étape 3 fabriquerait un anonyme parasite juste avant que la session
//      Google n'arrive, et l'utilisateur atterrirait sur le mauvais UID.
//   2. authStateReady() — sur web, la session est réhydratée de façon ASYNCHRONE
//      (auth.currentUser = null tant que ce n'est pas fini).
//   3. Anonyme de secours — on garantit qu'un utilisateur d'essai
//      (onboarding_completed=true) a TOUJOURS un UID. Évite qu'une page
//      (pricing-upgrade) lise un `null` prématuré → createUser au lieu de
//      linkWithCredential.
function AuthBootstrap() {
  useEffect(() => {
    (async () => {
      // ── 1. Retour d'un signInWithRedirect Google (web uniquement) ──────────
      if (Platform.OS === 'web') {
        try {
          const cred = await getRedirectResult(auth);
          if (cred?.user) {
            if (__DEV__) console.log('[bootstrap] retour redirect Google uid=', cred.user.uid, 'email=', cred.user.email);
            await finalizeSignIn();
            return; // session établie et routée — pas d'anonyme à créer
          }
        } catch (e: any) {
          // Redirect échoué (cookies tiers bloqués, state perdu…) : on ne bloque
          // pas le démarrage, l'utilisateur retombe sur l'écran d'auth.
          if (__DEV__) console.log('[bootstrap] getRedirectResult échoué', e?.code, e?.message);
        }
      }

      // ── 2 & 3. Réhydratation puis anonyme de secours ───────────────────────
      try {
        await auth.authStateReady();
        const started = await AsyncStorage.getItem('onboarding_completed');
        if (!auth.currentUser && started === 'true') {
          const cred = await signInAnonymously(auth);
          if (__DEV__) console.log('[bootstrap] anonyme recréé uid=', cred.user.uid);
        } else if (__DEV__) {
          console.log('[bootstrap] authStateReady user=', auth.currentUser?.uid ?? null, 'anon=', auth.currentUser?.isAnonymous ?? null);
        }
      } catch (e: any) {
        if (__DEV__) console.log('[bootstrap] anon échec', e?.code, e?.message);
      }
    })();
  }, []);
  return null;
}

// Garde de dé-duplication au niveau MODULE (survit aux remounts, notamment le
// double-montage de React StrictMode en dev) : le magic link ne doit être
// consommé qu'UNE fois par chargement de page — sinon la 2e tentative échoue
// (oobCode déjà consommé) et déclenche une redirection parasite vers /auth.
let magicLinkProcessed = false;

function DeepLinkHandler() {
  const t = useTranslation();

  useEffect(() => {
    async function handleAuthLink(url: string) {
      const isLink = isSignInWithEmailLink(auth, url);
      if (__DEV__) console.log('[deeplink] url =', url, '| isSignInWithEmailLink =', isLink);
      if (!isLink) return;
      if (magicLinkProcessed) {
        if (__DEV__) console.log('[deeplink] déjà traité ce chargement — skip');
        return;
      }
      magicLinkProcessed = true;

      try {
        let email = await AsyncStorage.getItem('emailForSignIn');
        if (__DEV__) console.log('[deeplink] emailForSignIn (storage) =', email);

        // Email absent (lien ouvert dans un autre navigateur/onglet, storage
        // vidé…) : on le DEMANDE au lieu d'abandonner silencieusement.
        if (!email && Platform.OS === 'web' && typeof window !== 'undefined') {
          email = window.prompt(t.auth.alertLienEmailManquant.corps) || '';
          if (__DEV__) console.log('[deeplink] email via prompt =', email || '(vide)');
        }
        if (!email) {
          showAuthToast(`${t.auth.alertLienEmailManquant.titre} — ${t.auth.alertLienEmailManquant.corps}`, 'error');
          magicLinkProcessed = false;
          router.replace('/(onboarding)/auth' as any);
          return;
        }

        await signInWithEmailLink(auth, email, url);
        if (__DEV__) console.log('[deeplink] signInWithEmailLink OK pour', email);
        await AsyncStorage.removeItem('emailForSignIn');

        // Init des clés de cycle (si absentes) + onboarding_completed + route
        // splash. Helper partagé avec Google (services/authSession.ts) : le gate
        // paywall est appliqué EN AVAL par home.tsx.
        if (__DEV__) console.log('[deeplink] session établie → route /splash');
        await finalizeSignIn();
      } catch (error: any) {
        magicLinkProcessed = false; // autorise un nouveau lien (nouveau chargement)
        const code: string = error?.code ?? '';
        if (__DEV__) console.log('[deeplink] signInWithEmailLink FAILED', code, error?.message);
        if (code === 'auth/expired-action-code') {
          showAuthToast(`${t.auth.alertLienExpire.titre} — ${t.auth.alertLienExpire.corps}`, 'error');
        } else if (code === 'auth/invalid-action-code' || code === 'auth/invalid-email') {
          showAuthToast(`${t.auth.alertLienInvalide.titre} — ${t.auth.alertLienInvalide.corps}`, 'error');
        } else if (code === 'auth/network-request-failed') {
          showAuthToast(`${t.auth.alertErreurReseau.titre} — ${t.auth.alertErreurReseau.corps}`, 'error');
        } else if (code === 'auth/user-not-found') {
          showAuthToast(`${t.auth.alertUtilisateurIntrouvable.titre} — ${t.auth.alertUtilisateurIntrouvable.corps}`, 'error');
        } else {
          showAuthToast(`${t.auth.alertLienInvalide.titre} — ${t.auth.alertLienInvalide.corps}`, 'error');
        }
        router.replace('/(onboarding)/auth' as any);
      }
    }

    // WEB : le retour magic link est le query string standard de
    // window.location.href (?apiKey=…&oobCode=…&mode=signIn). On le lit
    // SYNCHRONEMENT au montage, AVANT qu'index.tsx ne redirige et efface les
    // params de la barre d'URL (c'était la cause du décrochage).
    if (Platform.OS === 'web') {
      // On traite l'URL capturée AU MODULE LOAD (INITIAL_WEB_HREF), PAS
      // window.location.href : ce dernier est déjà réécrit en /auth au moment
      // où cet effet tourne. INITIAL_WEB_HREF contient encore ?apiKey&oobCode&mode.
      if (INITIAL_WEB_HREF) {
        if (__DEV__) console.log('[deeplink] web using INITIAL_WEB_HREF =', INITIAL_WEB_HREF);
        handleAuthLink(INITIAL_WEB_HREF);
      }
    } else {
      // NATIF : démarrage à froid via deep link
      Linking.getInitialURL().then(url => { if (url) handleAuthLink(url); });
    }

    // App déjà ouverte, reçoit un lien (surtout natif)
    const sub = Linking.addEventListener('url', ({ url }) => handleAuthLink(url));
    return () => sub.remove();
  }, [t]);

  return null;
}

// Un tap sur une notification est-il un tap "direct" (corps de la notif) qui
// vise l'écran affirmation ? (data.screen posé par scheduleAffirmationNotif.)
function isAffirmationTap(
  response: Notifications.NotificationResponse | null | undefined,
): boolean {
  return (
    !!response &&
    response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER &&
    response.notification.request.content.data?.screen === 'affirmation'
  );
}

// Câblage du tap sur notification → écran affirmation.
//
// 🟢 WEB STRICTEMENT INTACT : les notifications locales récurrentes ne tournent
// pas sur web (cf. parametres.tsx « inerte sur web »). On sort immédiatement sur
// web — aucun listener enregistré, aucune navigation, comportement identique.
//
// 🔒 PAYWALL (double protection, on ne rouvre aucune faille) :
//   1. On route vers /(app)/affirmation. Le gate de périmètre (app)/_layout.tsx
//      y applique isPaywalled() → un utilisateur paywallé est renvoyé au paywall
//      AVANT tout affichage de contenu premium (affirmation n'est pas whitelisté).
//   2. La notif d'un non-abonné ne contient déjà jamais l'affirmation réelle
//      (repli générique dans scheduleAffirmationNotif).
// La notif de rappel (20:00) n'a pas de data.screen → simple ouverture, aucune
// navigation forcée.
function NotificationRouter() {
  const segments = useSegments();
  const group = segments[0] ?? '';
  const screen = segments[segments.length - 1] ?? '';
  const [coldPending, setColdPending] = useState(false);

  // Enregistrement des deux sources de tap. NATIF UNIQUEMENT.
  useEffect(() => {
    if (Platform.OS === 'web') return; // web inchangé — rien enregistré

    // Tap "à chaud" : l'app tournait déjà (arrière-plan → premier plan). Elle est
    // stabilisée, on empile l'affirmation directement sur la route courante
    // (souvent home → le retour y ramène).
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      if (isAffirmationTap(r)) router.push('/(app)/affirmation' as any);
    });

    // Tap "à froid" : l'app a été LANCÉE en touchant la notif. La réponse de
    // lancement est disponible SYNCHRONEMENT au montage (getLastNotificationResponse,
    // non déprécié). Au montage, index.tsx est en train de router (→ splash) ;
    // naviguer tout de suite serait écrasé par ce routage. On mémorise l'intention
    // et on la consomme plus bas, une fois arrivé sur splash.
    if (isAffirmationTap(Notifications.getLastNotificationResponse())) {
      setColdPending(true);
    }

    return () => sub.remove();
  }, []);

  // Consommation du tap "à froid" : dès que le démarrage a posé la route sur
  // (app)/splash (donc index.tsx a fini de router), on empile l'affirmation.
  // La séquence à froid s'arrête sur splash (qui attend un clic « Commencer »),
  // c'est donc le point stable où l'on prend la main sans course de navigation.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (coldPending && group === '(app)' && screen === 'splash') {
      setColdPending(false);
      // Purge la réponse de lancement : évite tout re-routage sur un remontage.
      Notifications.clearLastNotificationResponse();
      router.push('/(app)/affirmation' as any);
    }
  }, [coldPending, group, screen]);

  return null;
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <BackgroundMusicProvider>
      <AuthBootstrap />
      <DeepLinkHandler />
      <NotificationRouter />
      <SubscriptionSync />
      <PwaInstallListener />
      <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 300 }}>
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(app)/splash"        options={{ animation: 'fade' }} />
        <Stack.Screen name="(app)/home"          options={{ animation: 'fade' }} />
        <Stack.Screen name="(app)/affirmation"   options={{ animation: 'slide_from_right', animationDuration: 280 }} />
        <Stack.Screen name="(app)/action"        options={{ animation: 'slide_from_right', animationDuration: 280 }} />
        <Stack.Screen name="(app)/visualisation" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
        <Stack.Screen name="(app)/journal"       options={{ animation: 'slide_from_right', animationDuration: 280 }} />
        <Stack.Screen name="(app)/vision-board"  options={{ animation: 'slide_from_right', animationDuration: 280 }} />
        <Stack.Screen name="(app)/celebration"   options={{ animation: 'slide_from_bottom', animationDuration: 400 }} />
        <Stack.Screen name="(app)/profil"        options={{ animation: 'fade' }} />
        <Stack.Screen name="(app)/parametres"    options={{ animation: 'fade' }} />
        <Stack.Screen name="(app)/name"          options={{ animation: 'fade' }} />
        <Stack.Screen name="(app)/activation"    options={{ animation: 'fade' }} />
      </Stack>
      <AuthToastHost />
      </BackgroundMusicProvider>
    </LanguageProvider>
  );
}
