// ManifestMind — boîte de texte ajustée par MESURE (version 1.1.0)
// ─────────────────────────────────────────────────────────────────────────────
//
// Remplace les paliers de taille par NOMBRE DE CARACTÈRES (affirmation, action,
// visualisation), qui faisaient déborder certains cycles : un texte juste sous un
// palier (ex. 95 caractères en 17 px) prenait plus de hauteur qu'un texte plus
// long écrit plus petit, et passait par-dessus la consigne ou le bouton.
//
// Principe (repris de Resonance, version allégée) :
//   1. on affiche le texte à la taille MAX dans la boîte réellement disponible ;
//   2. on MESURE la hauteur obtenue ; si elle dépasse, on réduit d'1 px et on
//      remesure, jusqu'à la taille MIN ;
//   3. si à la taille MIN le texte dépasse encore (police système agrandie,
//      petit écran), la boîte DÉFILE au lieu de déborder sur le reste.
// Fonctionne à l'identique sur web et natif (mesure par onLayout, pas de
// adjustsFontSizeToFit, absent du web). Les polices actuelles sont gardées.
//
// Usage : <FitBox max={20} min={13} fitKey={texte}>{(size) => <Text …/>}</FitBox>
// La boîte doit recevoir une hauteur bornée par son parent (flex: 1…).

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  max: number;
  min: number;
  // Change quand le contenu change (texte, langue) → nouvel ajustement.
  fitKey: string;
  justify?: 'center' | 'space-between' | 'flex-start';
  style?: StyleProp<ViewStyle>;
  children: (size: number) => ReactNode;
};

export default function FitBox({ max, min, fitKey, justify = 'center', style, children }: Props) {
  // Un ESSAI d'ajustement = { gen, size }. Chaque mesure porte l'essai qui l'a
  // produite : une mesure d'un essai périmé est IGNORÉE.
  //
  // 🐞 Correctif APK n° 2 : l'ancienne version relançait l'ajustement dans un
  // useEffect APRÈS le changement de texte. Sur Android (nouvelle architecture),
  // la mesure du nouveau texte arrive AVANT cet effet : l'effet la remettait à
  // zéro sans qu'aucune nouvelle mesure ne suive → texte resté invisible
  // (opacity 0) jusqu'au prochain changement de mise en page (ex. toucher le
  // bouton), ou affiché à la taille max sans réduction → texte coupé. Sur le
  // web la mesure arrive après l'effet, d'où un bug invisible sur le site.
  // Désormais la remise à zéro se fait PENDANT le rendu (même rendu que le
  // nouveau texte) : l'ordre des événements n'a plus d'importance.
  const [fit, setFit] = useState({ gen: 0, size: max, done: false, overflow: false });
  const [boxH, setBoxH] = useState(0);
  const boxRef = useRef(0);

  const [prevKey, setPrevKey] = useState(fitKey);
  const [prevMax, setPrevMax] = useState(max);
  if (prevKey !== fitKey || prevMax !== max) {
    setPrevKey(fitKey);
    setPrevMax(max);
    setFit((f) => ({ gen: f.gen + 1, size: max, done: false, overflow: false }));
  }

  function onBoxLayout(e: LayoutChangeEvent) {
    const h = Math.round(e.nativeEvent.layout.height);
    if (Math.abs(h - boxRef.current) < 1) return;
    boxRef.current = h;
    setBoxH(h);
    setFit((f) => ({ gen: f.gen + 1, size: max, done: false, overflow: false }));
  }

  // La hauteur du contenu ne peut pas être inférieure à la boîte (minHeight) :
  // elle ne la dépasse que s'il y a vraiment trop de texte.
  function onContentLayout(e: LayoutChangeEvent, gen: number, size: number) {
    const box = boxRef.current;
    if (!box) return;
    const h = e.nativeEvent.layout.height;
    setFit((f) => {
      if (f.gen !== gen || f.size !== size) return f; // mesure d'un essai périmé
      // Trop haut → 1 px de moins (y compris si le texte grandit APRÈS coup,
      // ex. police chargée en retard : on réajuste au lieu de laisser couper).
      if (h > box + 1 && size > min) return { ...f, size: size - 1 };
      const overflow = h > box + 1;
      return f.done && f.overflow === overflow ? f : { ...f, done: true, overflow };
    });
  }

  // Filet de sécurité : si une mesure ne revient jamais, le texte s'affiche
  // quand même (en défilement) au lieu de rester invisible.
  useEffect(() => {
    if (fit.done || !boxH) return;
    const { gen, size } = fit;
    const timer = setTimeout(() => {
      setFit((f) => (f.gen === gen && f.size === size && !f.done ? { ...f, done: true, overflow: true } : f));
    }, 1200);
    return () => clearTimeout(timer);
  }, [fit, boxH]);

  const { gen, size, done, overflow } = fit;
  return (
    <View style={[styles.box, style]} onLayout={onBoxLayout}>
      <ScrollView
        style={StyleSheet.absoluteFill}
        scrollEnabled={overflow}
        showsVerticalScrollIndicator={overflow}
        // Jamais d'effet de rebond quand tout tient dans la boîte.
        bounces={overflow}
      >
        <View
          // Remonté à chaque essai : garantit une NOUVELLE mesure même quand la
          // hauteur ne change pas (sinon onLayout ne se redéclenche pas).
          key={`${gen}|${size}|${boxH}`}
          onLayout={(e) => onContentLayout(e, gen, size)}
          style={{ minHeight: boxH, justifyContent: justify, opacity: done ? 1 : 0 }}
        >
          {children(size)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignSelf: 'stretch' },
});
