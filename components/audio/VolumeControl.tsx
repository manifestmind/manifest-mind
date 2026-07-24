// components/audio/VolumeControl.tsx
//
// Bloc 3/4 du chantier musique : contrôle du volume de la musique de fond.
//
// Overlay GLOBAL (monté une fois dans app/_layout.tsx, au-dessus du Stack) →
// présent sur TOUTES les pages (y compris splash/onboarding : signale à
// l'utilisateur que l'app a une musique, même téléphone en silencieux).
//
// - Icône haut-parleur VIOLET (#6B3FA0), jamais grisée, dans un cercle
//   translucide, en HAUT-GAUCHE. Au tap : ouvre/ferme le panneau de réglage.
// - Panneau : un bouton ON/OFF (mute) intégré + un curseur horizontal. Gauche =
//   silence (0, croix affichée), droite = max (1.0). Réglage EN DIRECT via le
//   context du lecteur (Bloc 2). Persistance au relâché + au mute (Bloc 4).
// - Fermeture : re-tap sur l'icône, ou tap réellement EN DEHORS du panneau.
//
// 👆 TACTILE (correctif) : la pastille (16 px) et le rail (5 px) restent fins
// VISUELLEMENT, mais la zone TACTILE est un conteneur transparent de 44 px de
// haut (TOUCH_HEIGHT) qui porte les panHandlers + un hitSlop généreux. Étant le
// PARENT, il rend aussi tactile le débordement de la pastille (clipping Android).
// Les ~10 px de bord (EDGE) forcent 0 (à gauche) / max (à droite) → mute et max
// atteignables au doigt. Un toucher dans cette zone ne ferme jamais le panneau.
//
// Curseur « maison » (PanResponder) → aucune dépendance ajoutée, marche web ET
// natif. SSR : le panneau n'est rendu que si `open` (faux au rendu statique) →
// aucun impact sur le HTML statique ; l'icône seule se rend (Svg + Views).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_VOLUME, MUSIC_VOLUME_KEY, useBackgroundMusic } from './BackgroundMusicProvider';

const PURPLE = '#6B3FA0';
const TRACK_WIDTH = 120; // largeur VISUELLE du rail
const TRACK_HEIGHT = 5; // hauteur VISUELLE du rail (fin)
const THUMB = 16; // pastille VISUELLE (fine)
const TOUCH_HEIGHT = 44; // hauteur de la ZONE TACTILE (≥ 44 px recommandé)
const EDGE = 10; // marge de bord : toucher dans les 10 px force 0 (gauche) / 1 (droite)
// 2ᵉ clé (locale à ce composant) : dernier volume > 0 de l'utilisateur, pour que
// l'unmute rétablisse le VRAI dernier niveau même après un redémarrage en état muet.
const LAST_VOLUME_KEY = 'music_last_volume';
// DEFAULT_VOLUME et MUSIC_VOLUME_KEY sont importés de BackgroundMusicProvider
// (source unique partagée avec le lecteur).

function SpeakerIcon({ muted, size = 22 }: { muted: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Corps du haut-parleur (toujours plein violet) */}
      <Path d="M4 9 H7.5 L12 5 V19 L7.5 15 H4 Z" fill={PURPLE} />
      {muted ? (
        // Volume 0 : « barré » — toujours violet, jamais grisé.
        <Path
          d="M15.5 8.5 L21 15.5 M21 8.5 L15.5 15.5"
          stroke={PURPLE}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      ) : (
        // Volume > 0 : ondes sonores.
        <Path
          d="M15.5 9 Q17.5 12 15.5 15 M18 7 Q21.5 12 18 17"
          stroke={PURPLE}
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
        />
      )}
    </Svg>
  );
}

export default function VolumeControl() {
  const insets = useSafeAreaInsets();
  const ctx = useBackgroundMusic();

  // Ref vers le lecteur (mise à jour à chaque rendu) : le PanResponder est créé
  // une seule fois mais lit toujours le lecteur courant via cette ref.
  const playerRef = useRef(ctx?.player ?? null);
  playerRef.current = ctx?.player ?? null;

  const [open, setOpen] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  // Miroir SYNCHRONE du volume (lu par persist() et les handlers du PanResponder).
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  // Dernier volume > 0 connu, pour rétablir le son après un mute (bouton on/off).
  const lastNonZeroRef = useRef(DEFAULT_VOLUME);

  // Bloc 4 — au démarrage : relire le niveau mémorisé pour positionner le curseur
  // (le lecteur démarre déjà au bon volume via BackgroundMusicProvider). On teste
  // Number.isFinite pour respecter un 0 mémorisé ; sinon on garde le défaut.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [[, rawCur], [, rawLast]] = await AsyncStorage.multiGet([
          MUSIC_VOLUME_KEY,
          LAST_VOLUME_KEY,
        ]);
        if (cancelled) return;

        // Dernier volume > 0 mémorisé → l'unmute rétablit le VRAI niveau même
        // après un redémarrage en état muet (volume courant à 0).
        const parsedLast = rawLast != null ? parseFloat(rawLast) : NaN;
        if (Number.isFinite(parsedLast) && parsedLast > 0) {
          lastNonZeroRef.current = Math.min(1, parsedLast);
        }

        // Volume courant : positionne le curseur (le lecteur démarre déjà au bon
        // niveau via BackgroundMusicProvider). Number.isFinite pour respecter un 0.
        const parsedCur = rawCur != null ? parseFloat(rawCur) : NaN;
        if (Number.isFinite(parsedCur)) {
          const c = Math.min(1, Math.max(0, parsedCur));
          setVolume(c);
          volumeRef.current = c;
          if (c > 0) lastNonZeroRef.current = c;
        }
      } catch {
        /* storage indisponible : garder le défaut */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fixe le volume [0..1] : état + miroir synchrone + lecteur. Mémorise le dernier
  // niveau > 0 (pour l'unmute).
  const setLevel = (v: number) => {
    const c = Math.max(0, Math.min(1, v));
    if (c > 0) lastNonZeroRef.current = c;
    volumeRef.current = c;
    setVolume(c);
    const p = playerRef.current;
    if (p) p.volume = c;
  };

  // Convertit une position tactile (relative à la zone) en volume. Les EDGE px de
  // chaque bord forcent 0 / 1 → mute et max atteignables au doigt (remap linéaire
  // de [EDGE, WIDTH-EDGE] vers [0, 1], clampé par setLevel).
  const apply = (x: number) => {
    const usable = TRACK_WIDTH - 2 * EDGE;
    setLevel((x - EDGE) / usable);
  };

  // Bloc 4 — persistance AU RELÂCHÉ / au mute (pas à chaque micro-mouvement).
  const persist = () => {
    const v = volumeRef.current;
    AsyncStorage.setItem(MUSIC_VOLUME_KEY, String(v)).catch(() => {});
    // On ne mémorise le "dernier niveau" que s'il est > 0 : ainsi un mute (0)
    // n'écrase pas le vrai dernier niveau, et l'unmute le retrouvera au relancement.
    if (v > 0) {
      AsyncStorage.setItem(LAST_VOLUME_KEY, String(v)).catch(() => {});
    }
  };

  // Bouton on/off : coupe (v=0) ou rétablit le dernier volume > 0 mémorisé.
  const toggleMute = () => {
    if (volume > 0) {
      setLevel(0);
    } else {
      setLevel(lastNonZeroRef.current > 0 ? lastNonZeroRef.current : DEFAULT_VOLUME);
    }
    persist();
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e: GestureResponderEvent) => apply(e.nativeEvent.locationX),
      onPanResponderMove: (e: GestureResponderEvent) => apply(e.nativeEvent.locationX),
      onPanResponderRelease: () => persist(),
      onPanResponderTerminate: () => persist(),
    }),
  ).current;

  const top = Math.max(insets.top, 12) + 6;

  return (
    <>
      {/* Fond invisible plein écran : tap RÉELLEMENT en dehors → ferme le curseur.
          Le panneau (zIndex supérieur) est au-dessus : un toucher dans le panneau
          n'atteint jamais ce backdrop, donc ne ferme pas. */}
      {open && (
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessibilityLabel="Fermer le réglage du volume"
        />
      )}

      <View style={[styles.container, { top }]} pointerEvents="box-none">
        <Pressable
          onPress={() => setOpen((o) => !o)}
          style={styles.iconCircle}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Musique de fond — régler le volume"
        >
          <SpeakerIcon muted={volume === 0} />
        </Pressable>

        {open && (
          <View style={styles.panel}>
            {/* Bouton on/off intégré (mute rapide sans glisser jusqu'au bord). */}
            <Pressable
              onPress={toggleMute}
              style={styles.muteBtn}
              hitSlop={{ top: 12, bottom: 12, left: 10, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel={volume === 0 ? 'Réactiver le son' : 'Couper le son'}
            >
              <SpeakerIcon muted={volume === 0} size={20} />
            </Pressable>

            {/* Zone TACTILE élargie (44 px, transparente) qui porte les panHandlers.
                Parent du rail → le débordement de la pastille reste tactile (Android). */}
            <View
              style={styles.touchZone}
              hitSlop={{ top: 20, bottom: 20, left: 12, right: 12 }}
              {...pan.panHandlers}
            >
              <View style={styles.track}>
                <View style={[styles.fill, { width: Math.max(0, volume * TRACK_WIDTH) }]} />
                <View style={[styles.thumb, { left: volume * TRACK_WIDTH - THUMB / 2 }]} />
              </View>
            </View>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
  },
  container: {
    position: 'absolute',
    left: 14,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(107,63,160,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(107,63,160,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  muteBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchZone: {
    width: TRACK_WIDTH,
    height: TOUCH_HEIGHT,
    justifyContent: 'center',
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: '#E3D9F0',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: '#9B72C8',
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: PURPLE,
    top: TRACK_HEIGHT / 2 - THUMB / 2,
  },
});
