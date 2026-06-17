# CLAUDE_MASTER.md — ManifestMind

> Référence technique complète pour les sessions Claude Code.
> Mise à jour : 2026-06-16

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
    attraction.tsx           # Page 2 — 3 citations (Byrne / Robbins / Rohn) + phrase finale violette pulsée
    features.tsx             # Page 3 — présentation fonctionnalités
    privacy.tsx              # Page 4
    pricing.tsx              # Page 5
    auth.tsx                 # Page 6 — Apple / Google / Email magic link / Skip
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
  config.ts                  # feature flags : STORES_ACTIVE, FREE_CYCLES, DEBUG_SKIP_PAYWALL

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
- Flux validé : `index → welcome → attraction → features → privacy → pricing → auth → splash → name → home`
- **Branche plan "Free"** : depuis `pricing.tsx`, si `selectedPlan === 'free'` → `router.replace('/(app)/splash')` directement (skip `auth`). Écrit `selected_plan='free'` + `onboarding_completed='true'` avant la nav.
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
- `attraction.tsx` : séquence en `Animated` natif — titre fade 1500ms, 3 citations slide-up+fade (stagger 1200ms, durée 1000ms chacune), phrase finale fade-in 800ms + pulsation couleur `#6B3FA0 ↔ #9B6FD0` en `Animated.loop` (useNativeDriver: false pour color), bouton fade-in. Total ≈ 6.9s avant bouton. Palette violet/sombre uniquement, zéro doré, zéro shimmer. i18n : `attraction.citation1/2/3` avec `{ texte, auteur }` + `final.{ligne1, ligne2}`.

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
| `selected_plan` | `'free'\|'lifetime'\|'annuel'\|'mensuel'` | Plan sélectionné (`'free'` = entrée onboarding sans paiement) |
| `subscription_active` | `'true'\|null` | Abonnement Premium actif (gate freemium) |
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

## Freemium

### Branchement onboarding (`pricing.tsx`)

Trois plans gratuits + payants. Le branchement décide qui aura `subscription_active='true'` dès l'entrée dans l'app.

| Choix utilisateur | `selected_plan` | `subscription_active` | `onboarding_completed` | Navigation | Condition |
|---|---|---|---|---|---|
| Free | `'free'` | non écrit | `'true'` | `replace → splash` (skip auth) | toujours |
| Payant (lifetime / annuel / mensuel) | `selectedPlan` | `'true'` | `'true'` | `push → auth` | `STORES_ACTIVE === true` |
| Payant + `STORES_ACTIVE === false` | non écrit | non écrit | non écrit | Alert "Disponible prochainement", reste sur écran | tant que stores off |

→ Tant que `STORES_ACTIVE=false`, seul le plan **Free** permet d'entrer dans l'app depuis l'onboarding.

### Gate `home.tsx`

Triple condition pour déclencher le paywall :

```
cycle > FREE_CYCLES  ET  selected_plan === 'free'  ET  subscription_active !== 'true'
→ router.replace('/(app)/pricing-upgrade')
```

Conséquences :
- **Free user, cycle 8+** sans avoir upgradé → paywall.
- **Free user upgradé** via paywall (`subscription_active='true'`) → ne paywall plus.
- **Plan payant** (`selected_plan ∈ {lifetime, annuel, mensuel}` avec `subscription_active='true'` posé en onboarding) → jamais paywallé, accès illimité dès le cycle 1.

### Carte "Free" dans `pricing.tsx`

4e carte (la 1ʳᵉ dans l'ordre visuel). Bordure `#B8D4B0` (vert tendre, palette orbes), pas de badge promo, description en 3ᵉ ligne du `planInfo`, prix "Gratuit/Free/Gratis" en serif vert `#5A8050`. Le bouton CTA bas devient `t.pricing.plans.free.bouton` quand "Free" est sélectionné, sinon `t.pricing.cta`.

### Cycles 1 → 7

Accès complet à toutes les modalités, aucune restriction, aucun compte requis pour le plan Free. Progression conservée même si l'utilisateur ne s'abonne jamais — au moment où il upgrade, il reprend au cycle 8.

### Paywall accessible à tout moment depuis `parametres.tsx`

Row "Plan actuel / Passer à Premium" :
- `subscription_active='true'` → "Plan actuel" + badge "Actif".
- Sinon + `STORES_ACTIVE=true` → "Passer à Premium" + chevron.
- Sinon + `STORES_ACTIVE=false` → "Disponible prochainement" + chevron.
Dans tous les cas la row reste tappable → navigue vers `pricing-upgrade.tsx`.

### Feature flags (`services/config.ts`)

| Flag | Type | Description |
|------|------|-------------|
| `STORES_ACTIVE` | `boolean` | `false` tant que RevenueCat / IAP non câblés. Effets : `pricing.tsx` onboarding bloque les plans payants (Alert "Disponible prochainement"), `pricing-upgrade.tsx` Alert au lieu d'achat, `parametres.tsx` label bouton = "Disponible prochainement". Seul le plan Free reste fonctionnel. |
| `FREE_CYCLES` | `number` | `7` — cycles offerts avant paywall. Utilisé par `home.tsx` (gate) et `pricing-upgrade.tsx` (détection contexte freemium-expiré). |
| `DEBUG_SKIP_PAYWALL` | `boolean` | **DEBUG**. Quand `true`, le gate freemium dans `home.tsx` est totalement court-circuité — accès illimité cycles 1→365 pour tester sur Expo Go sans payer. `console.warn` au mount de Home pour rappel. **Doit être à `false` avant toute soumission aux stores.** |

### Bandeau freemium dans `pricing-upgrade.tsx`

- Détection au mount : `current_cycle > FREE_CYCLES && !subscription_active` → state `isFreemiumExpired`
- Si `true` → bandeau `freemiumTitre` + `freemiumMessage` (clés `t.pricingUpgrade.freemium*`) inséré entre l'œil et le titre.
- Sinon (accès depuis parametres pendant les cycles gratuits) → bandeau caché, UI inchangée.

### Post-achat (in-app via `pricing-upgrade.tsx`)

- `handlePurchase` (quand `STORES_ACTIVE=true`) écrit `selected_plan` + `subscription_active='true'` puis `router.replace('/(app)/home')` (et **non** `back()`, sinon boucle quand on vient du gate).
- Câblage RevenueCat futur : déplacer l'écriture `subscription_active='true'` du flow synchrone vers le callback success de RevenueCat. Le gate `home.tsx` n'a aucune ligne à toucher — il continue à lire la clé peu importe qui l'a écrite.

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

0. **🚨 `services/config.ts` : `DEBUG_SKIP_PAYWALL = false`** — sinon tous les utilisateurs auraient accès illimité gratuit. Vérifier que `console.warn` n'apparaît plus au mount de Home.
1. Intégration RevenueCat (`pricing-upgrade.tsx` `handlePurchase` + `handleRestore`) — câbler le succès d'achat à `AsyncStorage.setItem('subscription_active', 'true')`, puis basculer `STORES_ACTIVE = true` dans `services/config.ts`
2. Apple Sign-In + Google Sign-In (stubs dans `auth.tsx`) — nécessite comptes Developer actifs
3. Ajouter SHA-256 Android dans Firebase Console (pour autoVerify App Links deep link)
4. Remplacer AsyncStorage par `expo-secure-store` pour les données auth sensibles
5. Retirer les boutons debug de `home.tsx` (`reset` + `⏭ cycle suivant`)
6. Vérifier que `SafeAreaProvider` est présent dans le root layout
7. Vérifier `.env` non commité (dans `.gitignore` ✓)
8. Tester le flux magic link complet sur EAS build (deep link non fonctionnel en Expo Go)
