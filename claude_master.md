# CLAUDE_MASTER.md — ManifestMind

> Référence technique complète pour les sessions Claude Code.
> Mise à jour : 2026-04-16

---

## Stack

- **React Native + Expo** (expo-router v4, file-based routing)
- **Firebase 12.x** — auth (magic link), firestore, storage
- **AsyncStorage** — persistance locale (non chiffré)
- **i18n** — FR / EN / ES via `src/i18n/translations.ts` + `LanguageContext`
- **Animations** — `react-native-reanimated` (welcome.tsx uniquement), `Animated` API partout ailleurs
- **Icons / Illustrations** — SVG inline via `react-native-svg` (pas de librairie d'icônes)

---

## Architecture des fichiers

```
app/
  index.tsx                  # Router initial (AsyncStorage → welcome ou splash)
  _layout.tsx                # Root layout : LanguageProvider + DeepLinkHandler (magic link) + Stack
  (onboarding)/
    welcome.tsx              # Page 1 — œil animé + sélection langue
    features.tsx             # Page 2 — présentation fonctionnalités
    privacy.tsx              # Page 3
    pricing.tsx              # Page 4
    auth.tsx                 # Page 5 — Apple / Google / Email magic link / Skip
  (app)/
    splash.tsx               # Écran d'accueil quotidien
    name.tsx                 # Saisie prénom
    home.tsx                 # Tableau de bord principal
    affirmation.tsx          # Étape 1/7 du cycle
    action.tsx               # Étape 2/7
    visualisation.tsx        # Étape 3/7
    journal.tsx              # Étape 4/7
    vision-board.tsx         # Étape 5/7
    celebration.tsx          # Fin de cycle
    profil.tsx               # Profil utilisateur
    parametres.tsx           # Paramètres
    pricing-upgrade.tsx      # Upgrade abonnement

hooks/
  useCycleContent.ts         # getCycleContent(n, lang?) + getCycleColors(n, lang?)
  useShare.ts                # shareProgress() — Sharing + fallback Clipboard

services/
  firebase.ts                # init Firebase, auth avec getReactNativePersistence(AsyncStorage)

src/
  i18n/
    translations.ts          # Source of truth i18n (FR/EN/ES)
    LanguageContext.tsx       # Provider + useLanguage()
  hooks/
    useTranslation.ts        # Retourne translations[lang]

assets/content/
  content_fr.json            # 365 entrées jour_1 … jour_365
  content_en.json
  content_es.json

components/ui/
  PointsToast.tsx
  CongratulationsToast.tsx
```

---

## Règles critiques

### Navigation
- **NE JAMAIS** nommer un fichier `index.tsx` dans un groupe de routes `(onboarding)` ou `(app)` — conflit fatal avec `app/index.tsx`
- Flux validé : `index → welcome → features → privacy → pricing → auth → splash → name → home`
- `router.replace` pour les transitions principales (pas de back stack)
- `router.push` pour journal/vision-board avec `?fromCycle=true`

### Eye SVG — clipPath IDs (uniques par fichier)
| Fichier | ID |
|---------|-----|
| welcome.tsx | ec1 |
| splash.tsx | sc1 |
| name.tsx | nc1 |
| home.tsx | hc1 |
| affirmation.tsx | ac1 |
| action.tsx | axc1 |
| visualisation.tsx | vc1 |
| journal.tsx | jc1 |
| vision-board.tsx | vbc1 |
| celebration.tsx | cc1 |
| profil.tsx | pc1 |
| parametres.tsx | prc1 |
| pricing-upgrade.tsx | pu1 |

### Animations
- `react-native-reanimated` : **uniquement dans welcome.tsx**
- `Animated` (RN natif) : partout ailleurs
- Eviter d'importer les deux dans le même fichier

### i18n
- Toujours utiliser `t.section.cle` — ne jamais hardcoder de strings FR/EN/ES
- Interpolation : `t.home.toastMilestone.replace('{n}', String(n))`
- `visionBoard.cellules` est un objet (pas un tableau)
- `commun.navbar.*` : accueil / profil / parametres

### AsyncStorage — patterns obligatoires
```ts
// Lecture
try {
  const val = await AsyncStorage.getItem('key') || 'default';
} catch {
  // fallback silencieux
}

// Écriture critique
try {
  await AsyncStorage.setItem('key', value);
} catch {
  // log ou continuer
}

// Lectures multiples → multiGet (jamais de boucle O(N))
const results = await AsyncStorage.multiGet(['key1', 'key2']);
```

### Responsive / Safe Area
- Pattern universel : `Math.max(insets.top + N, fallback)` en inline style
- **NE PAS** mettre paddingTop/paddingBottom statiques dans StyleSheet pour les containers principaux
- `useSafeAreaInsets` doit être importé sur chaque écran
- Dynamic Island iOS = insets.top ≈ 59px

---

## Clés AsyncStorage

| Clé | Type | Description |
|-----|------|-------------|
| `onboarding_completed` | `'true'` | Onboarding terminé |
| `user_name` | string | Prénom saisi |
| `user_language` | `'fr'\|'en'\|'es'` | Langue choisie |
| `current_cycle` | string (1–365) | Cycle courant |
| `current_theme` | string (1–7) | Thème courant |
| `cycle_completed` | `'true'\|'false'` | Cycle du jour terminé |
| `cycle_points` | string (number) | Points du cycle courant |
| `points_total` | string (number) | Total points cumulés |
| `next_cycle_time` | string (timestamp) | Timestamp minuit prochain |
| `cycle_step_status` | JSON | État des 7 étapes |
| `cycle_earned_points` | JSON | Points gagnés par étape |
| `journal_cycle_N` | JSON | Entrée journal cycle N |
| `vision_board_photos` | JSON | URIs photos vision board |
| `notif_affirmation` | `'true'\|'false'` | Notif affirmation active |
| `notif_rappel` | `'true'\|'false'` | Notif rappel active |
| `reminder_time` | `'HH:MM'` | Heure rappel |
| `selected_plan` | `'lifetime'\|'annuel'\|'mensuel'` | Plan sélectionné |
| `emailForSignIn` | string | Email magic link en attente |

---

## Points système

| Étape | Points |
|-------|--------|
| Ouverture (home) | +10 |
| Affirmation | +15 |
| Action facile | +15 |
| Action difficile | +25 |
| Visualisation | +15 |
| Journal | +15 |
| Vision Board | +5 |
| **Total/cycle** | **100** |
| **Total programme** | **36 500** |

Niveaux : Éveil (0–25%) · Ancrage (25–50%) · Expansion (50–75%) · Manifestation (75–100%)

---

## Firebase

- **Config** : variables d'env `EXPO_PUBLIC_FIREBASE_*` dans `.env` (jamais hardcodées, `.env` dans `.gitignore`)
- **Fichiers natifs** : `google-services.json` (Android) + `GoogleService-Info.plist` (iOS) à la racine — dans `.gitignore`
- **Auth** : `getReactNativePersistence(AsyncStorage)` via `@firebase/auth` (Metro résout vers build RN)
- **Auth flows actifs** :
  - Magic link email — envoi (`auth.tsx`) + réception deep link (`_layout.tsx` → `DeepLinkHandler`)
  - Sign Out — `signOut(auth)` + `AsyncStorage.multiRemove` (conserve `user_language`) → `parametres.tsx`
  - Delete Account — `deleteUser(auth.currentUser)` + `AsyncStorage.clear()` → `parametres.tsx`
  - `auth/requires-recent-login` → renvoi magic link automatique avant suppression
- **Auth stubs** : Apple Sign-In, Google Sign-In (boutons présents, `// TODO: activer quand compte Developer actif`)
- **Deep link** : `app.json` → `ios.associatedDomains: ["applinks:manifestmind.firebaseapp.com"]` + `android.intentFilters` (autoVerify). Requiert EAS build (pas Expo Go).
- **Sécurité** : AsyncStorage non chiffré sur Android rooté — prévoir `expo-secure-store` pour données sensibles en V2

### Erreurs Firebase câblées (FR/EN/ES via `t()`)
| Code | Clé i18n |
|------|----------|
| `auth/expired-action-code` | `t.auth.alertLienExpire` |
| `auth/invalid-action-code` | `t.auth.alertLienInvalide` |
| `auth/network-request-failed` | `t.auth.alertErreurReseau` |
| `auth/user-not-found` | `t.auth.alertUtilisateurIntrouvable` |
| `auth/requires-recent-login` | `t.parametres.alertSupprimerReauth` |
| email manquant (autre appareil) | `t.auth.alertLienEmailManquant` |
| état non connecté | `t.auth.alertNonConnecte` |

---

## Audit Préventif — État après corrections (2026-04-15)

### Corrigé (34/36)

**Priorité 1 — CRITIQUE (14/14)**
- [x] #33 Clé Firebase dans .env
- [x] #6 index.tsx try/catch AsyncStorage
- [x] #7–13 try/catch sur tous les AsyncStorage
- [x] #23 journal.tsx "Aujourd'hui" → `t.journal.aujourdhui`
- [x] #24 journal.tsx "Étape passée sans points" → `t.journal.etapePassee`
- [x] #25 journal.tsx "Passé" → `t.journal.passe`
- [x] #1 affirmation.tsx safe area content
- [x] #2 action.tsx safe area content
- [x] #3 parametres.tsx safe area scrollContent

**Priorité 2 — IMPORTANT (11/11)**
- [x] #34 Firebase `inMemoryPersistence` → `getReactNativePersistence(AsyncStorage)`
- [x] #14/#20 journal.tsx O(N) loop → `AsyncStorage.multiGet`
- [x] #27 journal.tsx `getCycleColors(cycle, lang)`
- [x] #15 pricing-upgrade.tsx try/catch setItem
- [x] #16 vision-board.tsx race condition toast → setTimeout 2500ms
- [x] #26 vision-board.tsx `getCycleColors(cycle, lang)`
- [x] #30 vision-board.tsx permission refusée → Alert i18n (3 langues)
- [x] #4 vision-board.tsx ScrollView pour iPhone SE
- [x] #29 parametres.tsx `Linking.openURL` try/catch

**Priorité 3 — MINEUR (9/11)**
- [x] #17 index.tsx timeout 500ms → 0ms
- [x] #5 action.tsx navLabel fontSize 8 → 11
- [x] #28 useCycleContent.ts interface `CycleDay` typée, plus de `(content as any)`
- [x] #31 useShare.ts Alert utilisateur en cas d'échec (3 langues)
- [x] #32 parametres.tsx `getPermissionsAsync()` avant scheduling
- [x] #35 auth.tsx rate limiting (3 échecs → cooldown 30s)
- [x] #18 home.tsx BackHandler (bloque retour vers onboarding Android)
- [x] #19 home.tsx cycle 365 → message `t.home.programmeTermine` i18n
- [x] #36 firebase.ts commentaire sécurité AsyncStorage/expo-secure-store
- [ ] #21 useCycleContent imports statiques — bundle size acceptable, skip
- [ ] #22 home.tsx useMemo — refactor complexe, non prioritaire

---

## À faire avant publication App Store

1. Intégration RevenueCat (`pricing-upgrade.tsx` `handlePurchase` + `handleRestore`)
2. Apple Sign-In + Google Sign-In (stubs dans `auth.tsx`) — nécessite comptes Developer actifs
3. Ajouter SHA-256 Android dans Firebase Console (pour autoVerify App Links deep link)
4. Remplacer AsyncStorage par `expo-secure-store` pour les données auth sensibles
5. Retirer les boutons debug de `home.tsx` (`reset` + `⏭ cycle suivant`)
6. Vérifier que `SafeAreaProvider` est présent dans le root layout
7. Vérifier `.env` non commité (dans `.gitignore` ✓)
8. Tester le flux magic link complet sur EAS build (deep link non fonctionnel en Expo Go)
