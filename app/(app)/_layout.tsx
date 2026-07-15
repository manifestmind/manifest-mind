// app/(app)/_layout.tsx — Gate de périmètre du contenu payant.
//
// Ce layout enveloppe TOUS les écrans du groupe (app). Il vérifie à chaque
// navigation que l'utilisateur a le droit d'être là, et le renvoie au paywall
// sinon. Sans lui, les écrans de contenu étaient joignables par URL directe
// (/affirmation, /journal…) sans aucune vérification d'abonnement.
//
// La règle elle-même vit dans services/access.ts (isPaywalled) — partagée avec
// le gate de home.tsx, pour qu'il n'existe jamais deux copies divergentes.
//
// ─── LISTE BLANCHE — sécurisé par défaut ────────────────────────────────────
// On nomme les écrans TOUJOURS accessibles ; tout le reste est gaté. Un écran
// de contenu ajouté demain est donc protégé d'office. L'inverse (liste noire)
// laisserait un nouvel écran ouvert par oubli — une faille invisible. Ici, un
// oubli se voit immédiatement : l'écran est bloqué au premier test.

import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { isPaywalled } from '../../services/access';

// Écrans accessibles SANS abonnement, en toutes circonstances.
//
//   pricing-upgrade → le paywall lui-même. Le gater = boucle infinie.
//   activation      → 🚨 l'utilisateur VIENT de payer et `subscription_active`
//                     n'est, par construction, pas encore `true` : c'est
//                     exactement ce que cet écran attend (polling). Le gater
//                     renverrait tout nouveau payeur au paywall.
//   parametres      → RGPD (suppression de compte), déconnexion, langue,
//                     accès à « Passer à Premium ». Doit rester joignable.
//   profil          → écran de compte, aucun contenu premium à protéger.
//   splash, name    → écrans d'entrée, aucun contenu de cycle.
const ALWAYS_ALLOWED = new Set([
  'pricing-upgrade',
  'activation',
  'parametres',
  'profil',
  'splash',
  'name',
]);

export default function AppLayout() {
  const router = useRouter();

  // On lit les SEGMENTS et non le pathname. Le pathname ne contient pas le
  // groupe (les parenthèses n'apparaissent pas dans l'URL : (app)/journal.tsx
  // → '/journal'), donc il est impossible d'y distinguer un écran de (app)
  // d'un écran de (onboarding). useSegments() les expose :
  //   ['(app)', 'pricing-upgrade']   vs   ['(onboarding)', 'auth']
  const segments = useSegments();

  // On dérive DEUX CHAÎNES et on fait porter l'effet dessus, plutôt que sur le
  // tableau : `useSegments()` renvoie une nouvelle référence à chaque rendu, ce
  // qui relancerait l'effet (et une lecture AsyncStorage) en continu.
  const group = segments[0] ?? '';
  const screen = segments[segments.length - 1] ?? '';

  // `true` tant qu'on n'a pas tranché pour la route courante. On masque alors
  // l'écran (voile opaque) pour qu'aucun contenu payant n'apparaisse, même une
  // fraction de seconde, avant la redirection.
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // 🚨 CE LAYOUT NE GARDE QUE SON PROPRE GROUPE.
    //
    // Il reste MONTÉ quand on navigue vers un autre groupe (la route sort de
    // (app) mais le layout survit sous la nouvelle route dans la pile). Son
    // effet se redéclenche alors avec la route de destination.
    //
    // Sans ce test, une sortie vers (onboarding) était vue comme « écran
    // inconnu, donc protégé » → isPaywalled() → renvoi sur le paywall. Le gate
    // rattrapait l'utilisateur AU MOMENT MÊME où il tentait de sortir : le lien
    // « J'ai déjà un abonnement — Me reconnecter » semblait mort, et la
    // déconnexion comme la suppression de compte (RGPD) étaient coincées
    // derrière le paywall. La liste blanche ci-dessus ne décrit QUE le groupe
    // (app) : tout écran d'un autre groupe en est absent par nature, pas par
    // oubli. Hors de (app), on ne décide rien.
    if (group !== '(app)') {
      setChecking(false);
      return;
    }

    if (ALWAYS_ALLOWED.has(screen)) {
      setChecking(false);
      return;
    }

    setChecking(true);
    (async () => {
      const blocked = await isPaywalled();
      if (cancelled) return; // navigation déjà repartie ailleurs entre-temps

      if (blocked) {
        router.replace('/(app)/pricing-upgrade' as any);
        // On laisse `checking` à true : le voile reste posé jusqu'à ce que la
        // redirection ait effectivement changé de route. Le prochain passage de
        // cet effet (sur /pricing-upgrade, whitelisté) le lèvera.
        return;
      }

      setChecking(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [group, screen, router]);

  // Le <Stack> reste TOUJOURS monté : le démonter à chaque vérification
  // relancerait les écrans à zéro (perte d'état, animations rejouées). On se
  // contente de le recouvrir pendant le contrôle.
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      {checking && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#F0EAE0',
          }}
        />
      )}
    </View>
  );
}
