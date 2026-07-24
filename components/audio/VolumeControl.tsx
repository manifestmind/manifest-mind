// components/audio/VolumeControl.tsx
//
// Bloc 3 du chantier musique : contrôle du volume de la musique de fond.
//
// Overlay GLOBAL (monté une fois dans app/_layout.tsx, au-dessus du Stack) →
// présent sur TOUTES les pages (y compris splash/onboarding : signale à
// l'utilisateur que l'app a une musique, même téléphone en silencieux).
//
// - Icône haut-parleur VIOLET (#6B3FA0), jamais grisée, dans un cercle
//   translucide (lisible sur fonds variés), en HAUT-GAUCHE (coin libre : le bas
//   a la barre de nav, le haut-droite le compteur de points de celebration).
// - Au tap : un curseur HORIZONTAL se déploie vers la droite. Gauche = silence
//   total (0), droite = volume max (1.0). Réglage EN DIRECT via le context du
//   lecteur (Bloc 2). À volume 0, le haut-parleur devient « barré » (toujours
//   violet, pas grisé).
// - Fermeture : re-tap sur l'icône, ou tap en dehors (fond invisible).
// - Curseur « maison » (PanResponder) → aucune dépendance ajoutée, marche
//   web ET natif.
//
// ⚠️ La persistance du niveau entre sessions = Bloc 4 (ici, réglage en direct
// seulement, départ au défaut 0.15).
//
// SSR : ne fait AUCUN appel navigateur au rendu (Svg + Views + PanResponder.create
// only) → sûr pour le rendu statique web. useBackgroundMusic() peut renvoyer null
// (avant montage du moteur / SSR) : géré.

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
const TRACK_WIDTH = 120;
const TRACK_HEIGHT = 5;
const THUMB = 16;
// DEFAULT_VOLUME et MUSIC_VOLUME_KEY sont importés de BackgroundMusicProvider
// (source unique partagée avec le lecteur).

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
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

  // Miroir du volume courant, lu par les handlers du PanResponder (créé une fois).
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  // Bloc 4 — au démarrage : relire le niveau mémorisé pour positionner le curseur
  // (le lecteur démarre déjà au bon volume via BackgroundMusicProvider). On teste
  // Number.isFinite pour respecter un 0 mémorisé ; sinon on garde le défaut.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(MUSIC_VOLUME_KEY);
        const parsed = raw != null ? parseFloat(raw) : NaN;
        if (!cancelled && Number.isFinite(parsed)) {
          setVolume(Math.min(1, Math.max(0, parsed)));
        }
      } catch {
        /* storage indisponible : garder le défaut */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Applique une position tactile (relative à la piste) au volume [0..1].
  const apply = (x: number) => {
    const v = Math.max(0, Math.min(1, x / TRACK_WIDTH));
    setVolume(v);
    const p = playerRef.current;
    if (p) p.volume = v;
  };

  // Bloc 4 — persistance AU RELÂCHÉ (pas à chaque micro-mouvement du curseur).
  const persist = () => {
    AsyncStorage.setItem(MUSIC_VOLUME_KEY, String(volumeRef.current)).catch(() => {});
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
      {/* Fond invisible plein écran : tap en dehors → ferme le curseur. */}
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
            <View style={styles.track} {...pan.panHandlers}>
              <View style={[styles.fill, { width: Math.max(0, volume * TRACK_WIDTH) }]} />
              <View style={[styles.thumb, { left: volume * TRACK_WIDTH - THUMB / 2 }]} />
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
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(107,63,160,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 12,
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
