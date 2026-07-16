// ─────────────────────────────────────────────────────────────────────────────
// ManifestMind — persistance des photos choisies par l'utilisateur
// ─────────────────────────────────────────────────────────────────────────────
//
// 🔴 POURQUOI CE FICHIER EXISTE (bug découvert le 2026-07-16) :
// Sur WEB, expo-image-picker retourne une `blob:` URL — une référence vers la
// mémoire du navigateur, valable UNIQUEMENT pour la session en cours. La
// stocker dans AsyncStorage persiste la chaîne… qui pointe vers du vide à la
// session suivante → vision board / photo de profil "effacés" à la réouverture.
//
// Correctif : convertir la photo en data-URI base64 AVANT stockage — l'image
// vit alors DANS AsyncStorage (localStorage), elle survit à tout redémarrage
// et l'export RGPD devient réellement portable.
//
// Redimensionnement OBLIGATOIRE au passage : sans lui, une photo 12 MP pèse
// 1-2,5 Mo → ×1,33 en base64 → 2-3 photos satureraient le quota localStorage
// (~5 Mo). Resize à 900 px de large max + JPEG qualité 0,7 → ~100-200 Ko par
// photo, 8 photos (7 vision board + 1 profil) ≈ 1,5 Mo. Marge confortable.
//
// Sur NATIF, on conserve le comportement historique (URI de fichier, ici la
// sortie du manipulator dans le cache de l'app) : des data-URIs gonfleraient
// AsyncStorage (limite ~2 Mo par entrée sur Android). ⚠️ Phase 2 : copier vers
// documentDirectory — le cache peut être nettoyé par l'OS (noté au master).

import { Platform } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';

const MAX_WIDTH = 900;

// Convertit un asset du picker en URI STOCKABLE de façon durable.
// Peut lever (image illisible, etc.) : l'appelant gère l'échec par un toast.
export async function toPersistentPhotoUri(asset: ImagePickerAsset): Promise<string> {
  // Ne jamais AGRANDIR une image plus petite que la cible.
  const actions = asset.width && asset.width > MAX_WIDTH
    ? [{ resize: { width: MAX_WIDTH } }]
    : [];

  const res = await manipulateAsync(asset.uri, actions, {
    compress: 0.7,
    format: SaveFormat.JPEG,
    base64: Platform.OS === 'web',
  });

  if (Platform.OS === 'web') {
    if (!res.base64) throw new Error('manipulateAsync: base64 absent');
    return `data:image/jpeg;base64,${res.base64}`;
  }
  return res.uri;
}
