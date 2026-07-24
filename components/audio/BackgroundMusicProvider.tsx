// components/audio/BackgroundMusicProvider.tsx
//
// Lecteur de musique de fond GLOBAL (Bloc 2 du chantier musique).
//
// Monté UNE fois dans app/_layout.tsx, AU-DESSUS de la navigation : le lecteur
// persiste quand on change d'écran → la musique joue en continu et ne redémarre
// JAMAIS entre les pages.
//
// 🔴 SSR / RENDU STATIQUE WEB : expo-router pré-rend les pages en environnement
// Node (sans navigateur). `useAudioPlayer` y casse le rendu du contenu (chaque
// route retombait sur une coquille minimale). On isole donc TOUT le moteur audio
// dans un composant interne (<AudioEngine>) monté UNIQUEMENT côté client (après
// hydratation, via le flag `mounted`). Pendant le SSR et la 1re passe client,
// rien d'audio n'est rendu → le HTML statique reste STRICTEMENT identique.
//
// Démarrage :
//   - NATIF (Android/iOS) : lecture immédiate au montage du moteur.
//   - WEB : les navigateurs BLOQUENT l'autoplay tant que l'utilisateur n'a pas
//     interagi. On démarre au PREMIER GESTE (tap/clic/touche). De plus, en
//     « chargement strict (option b) », on ne CHARGE le fichier (replace) qu'à
//     ce moment → un visiteur qui rebondit ne télécharge jamais les 3,11 Mo.
//
// Le lecteur est exposé via un Context pour que l'icône + curseur (Bloc 3) et la
// persistance du volume (Bloc 4) s'y branchent sans refonte. La valeur vaut
// `null` tant que le moteur n'est pas monté (SSR / avant hydratation).

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { useAudioPlayer } from 'expo-audio';

// Référence à l'asset (handle/URL) — NE télécharge RIEN au chargement du module.
// Sur web, le fichier n'est réellement récupéré qu'au player.replace() (1er geste).
const AUDIO_SOURCE = require('../../assets/audio/background-music.mp3');

// Volume discret de départ (deviendra réglable/persisté aux blocs 3-4).
const DEFAULT_VOLUME = 0.15;

type BackgroundMusicValue = { player: ReturnType<typeof useAudioPlayer> };

const BackgroundMusicContext = createContext<BackgroundMusicValue | null>(null);

// Consommé par l'icône + curseur (Bloc 3) et la persistance du volume (Bloc 4).
// Peut renvoyer `null` tant que le moteur audio n'est pas monté (SSR).
export function useBackgroundMusic(): BackgroundMusicValue | null {
  return useContext(BackgroundMusicContext);
}

// Moteur audio réel — rendu CLIENT UNIQUEMENT (jamais pendant le SSR). C'est le
// seul endroit où `useAudioPlayer` est appelé. Ne rend aucun DOM (retourne null).
function AudioEngine({ onReady }: { onReady: (value: BackgroundMusicValue) => void }) {
  // NATIF : source au montage → démarrage immédiat.
  // WEB : PAS de source au montage (option b) → aucun téléchargement tant qu'il
  // n'y a pas eu de geste ; on charge via replace() au 1er geste.
  const player = useAudioPlayer(Platform.OS === 'web' ? null : AUDIO_SOURCE);

  useEffect(() => {
    onReady({ player });

    if (Platform.OS !== 'web') {
      // ── NATIF : boucle + volume discret + lecture immédiate ──
      player.loop = true;
      player.volume = DEFAULT_VOLUME;
      try {
        player.play();
      } catch {
        /* no-op */
      }
      return;
    }

    // ── WEB : autoplay bloqué → démarrage au 1er geste + chargement strict ──
    // On ne CHARGE le fichier (replace) qu'à cet instant : un visiteur qui
    // rebondit avant toute interaction ne télécharge jamais les 3,11 Mo.
    if (typeof document === 'undefined') return;

    const events = ['pointerdown', 'touchstart', 'keydown', 'click'] as const;

    function start() {
      try {
        player.replace(AUDIO_SOURCE); // déclenche le téléchargement MAINTENANT
        player.loop = true;
        player.volume = DEFAULT_VOLUME;
        player.play();
      } catch {
        /* refus navigateur : ne rien casser */
      }
      remove();
    }

    const remove = () =>
      events.forEach((e) => document.removeEventListener(e, start, true));

    events.forEach((e) =>
      document.addEventListener(e, start, { once: true, capture: true }),
    );

    return remove;
  }, [player, onReady]);

  return null;
}

export function BackgroundMusicProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<BackgroundMusicValue | null>(null);

  // `mounted` reste false pendant le SSR ET la 1re passe de rendu client (pas de
  // hydration mismatch : serveur et client rendent d'abord la même chose, sans
  // moteur audio). L'effet ne s'exécute qu'après, côté client → on monte alors
  // <AudioEngine>. `{children}` reste TOUJOURS sous le même Provider → jamais
  // remonté.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <BackgroundMusicContext.Provider value={value}>
      {mounted ? <AudioEngine onReady={setValue} /> : null}
      {children}
    </BackgroundMusicContext.Provider>
  );
}
