// ManifestMind — rond de fond animé (version 1.1.0)
// ─────────────────────────────────────────────────────────────────────────────
//
// Remplace les ronds FIXES des écrans (<View style={[styles.orb, …]} />) : même
// taille, même couleur, même place, même opacité. Seul le MOUVEMENT s'ajoute,
// repris des cœurs de Resonance (FondCoeurs.tsx, lu sans rien y modifier) :
//   - DÉRIVE : grande boucle lente et irrégulière autour de sa place, chaque rond
//     avec son rythme (28 à 39 s) et son point de départ ;
//   - RESPIRATION : ± 3 % de taille, toutes les 11 à 15 s.
// « Réduire les animations » (réglage du téléphone ou du navigateur) : immobile.
// Arrêté quand l'écran n'est pas affiché (batterie). Sur Android et iPhone,
// l'animation tourne sans calcul image par image dans l'app (pilote natif) ; sur
// le web, le navigateur la calcule.
//
// La célébration garde sa propre pulsation (non concernée).

import { useIsFocused } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

// Amplitude de la dérive (px). 20 × 16 = « plus discret » (décision par défaut du
// 2026-11-23, à juger sur l'APK de test) ; Resonance utilise 36 × 28.
export const AMPLITUDE: [number, number] = [20, 16];

const ND = Platform.OS !== 'web'; // pilote natif (indisponible sur le web)
const TOUR = Math.PI * 2;
const ECHANTILLONS = 64;

// Variante stable par rond, dérivée de sa taille et de sa place (aucun hasard :
// même mouvement à chaque ouverture, rien de différent entre rendu serveur et app).
function variante(style: StyleProp<ViewStyle>) {
  const s = (StyleSheet.flatten(style) || {}) as ViewStyle;
  const num = (v: unknown) => (typeof v === 'number' ? v : 0);
  const seed = Math.abs(num(s.width) * 7 + num(s.top) * 3 + num(s.bottom) * 5 + num(s.left) * 11 + num(s.right) * 13) + 1;
  const r = (k: number) => ((Math.sin(seed * (k + 1) * 12.9898) * 43758.5453) % 1 + 1) % 1;
  return {
    boucle: 28000 + Math.round(r(0) * 11000),      // 28 à 39 s
    respiration: 11000 + Math.round(r(1) * 4000),  // 11 à 15 s
    depart: r(2),                                  // point de départ dans la boucle
    forme: [r(3), r(4), r(5), r(6)].map((v) => v * TOUR), // rend la boucle irrégulière
  };
}

function useReduireAnimations() {
  const [reduire, setReduire] = useState(false);
  useEffect(() => {
    let actif = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { if (actif) setReduire(v); }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduire);
    return () => { actif = false; sub?.remove?.(); };
  }, []);
  return reduire;
}

export default function Orbe({ style }: { style: StyleProp<ViewStyle> }) {
  const focus = useIsFocused();
  const reduire = useReduireAnimations();
  const v = useMemo(() => variante(style), []); // eslint-disable-line react-hooks/exhaustive-deps
  const temps = useMemo(() => new Animated.Value(v.depart), [v]);
  const souffle = useMemo(() => new Animated.Value(0), []);

  // Boucle irrégulière : deux sinusoïdes par axe, déphasées selon le rond.
  const chemin = useMemo(() => {
    const entree: number[] = [], xs: number[] = [], ys: number[] = [];
    const [ax, ay] = AMPLITUDE;
    for (let i = 0; i <= ECHANTILLONS; i++) {
      const p = i / ECHANTILLONS, a = p * TOUR;
      entree.push(p);
      xs.push(ax * (0.75 * Math.sin(a + v.forme[0]) + 0.25 * Math.sin(2 * a + v.forme[1])));
      ys.push(ay * (0.75 * Math.cos(a + v.forme[2]) + 0.25 * Math.sin(2 * a + v.forme[3])));
    }
    return { entree, xs, ys };
  }, [v]);

  const actif = focus && !reduire;

  useEffect(() => {
    if (!actif) return;
    let arrete = false;
    let derive: Animated.CompositeAnimation | null = null;
    // Reprend là où elle s'était arrêtée, puis boucle de 0 à 1 indéfiniment.
    temps.stopAnimation((depuis) => {
      if (arrete) return;
      const reste = Math.max(0, 1 - depuis);
      derive = Animated.timing(temps, { toValue: 1, duration: reste * v.boucle, easing: Easing.linear, useNativeDriver: ND });
      derive.start(({ finished }) => {
        if (!finished || arrete) return;
        temps.setValue(0);
        derive = Animated.loop(Animated.timing(temps, { toValue: 1, duration: v.boucle, easing: Easing.linear, useNativeDriver: ND }));
        derive.start();
      });
    });
    const respire = Animated.loop(Animated.sequence([
      Animated.timing(souffle, { toValue: 1, duration: v.respiration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
      Animated.timing(souffle, { toValue: 0, duration: v.respiration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
    ]));
    respire.start();
    return () => { arrete = true; derive?.stop(); respire.stop(); };
  }, [actif, temps, souffle, v]);

  const transform = [
    { translateX: temps.interpolate({ inputRange: chemin.entree, outputRange: chemin.xs }) },
    { translateY: temps.interpolate({ inputRange: chemin.entree, outputRange: chemin.ys }) },
    { scale: souffle.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.03] }) },
  ];

  return <Animated.View pointerEvents="none" style={[style, { transform }]} />;
}
