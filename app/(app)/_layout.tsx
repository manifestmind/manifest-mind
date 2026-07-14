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

import { Stack, usePathname, useRouter } from 'expo-router';
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
  const pathname = usePathname();

  // `true` tant qu'on n'a pas tranché pour la route courante. On masque alors
  // l'écran (voile opaque) pour qu'aucun contenu payant n'apparaisse, même une
  // fraction de seconde, avant la redirection.
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Les groupes expo-router entre parenthèses n'apparaissent pas dans l'URL :
    // app/(app)/affirmation.tsx → pathname '/affirmation'. On isole le segment.
    const screen = pathname.split('/').filter(Boolean).pop() ?? '';

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
  }, [pathname, router]);

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
