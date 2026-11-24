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

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
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
  const [size, setSize] = useState(max);
  const [boxH, setBoxH] = useState(0);
  const [done, setDone] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const sizeRef = useRef(max);
  const boxRef = useRef(0);

  // Recommence l'ajustement depuis la taille MAX.
  const restart = useCallback(() => {
    sizeRef.current = max;
    setSize(max);
    setDone(false);
    setOverflow(false);
  }, [max]);

  useEffect(() => { restart(); }, [fitKey, restart]);

  function onBoxLayout(e: LayoutChangeEvent) {
    const h = Math.round(e.nativeEvent.layout.height);
    if (Math.abs(h - boxRef.current) < 1) return;
    boxRef.current = h;
    setBoxH(h);
    restart();
  }

  // La hauteur du contenu ne peut pas être inférieure à la boîte (minHeight) :
  // elle ne la dépasse que s'il y a vraiment trop de texte.
  function onContentLayout(e: LayoutChangeEvent) {
    const box = boxRef.current;
    if (!box) return;
    const h = e.nativeEvent.layout.height;
    if (h > box + 1 && sizeRef.current > min) {
      sizeRef.current -= 1;
      setSize(sizeRef.current);
      return;
    }
    setOverflow(h > box + 1);
    setDone(true);
  }

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
          // hauteur ne change pas (sinon onLayout ne se redéclenche pas et le
          // texte resterait invisible).
          key={`${fitKey}|${size}|${boxH}`}
          onLayout={onContentLayout}
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
