# ManifestMind — Claude Master Documentation

**Dernière mise à jour :** 12 Avril 2026
**État :** Celebration validée ✅ — logique fin de cycle complète, tous les chemins couverts

---

## PAGES VALIDÉES — NE JAMAIS MODIFIER LE DESIGN

| Fichier | Statut |
|---------|--------|
| app/(onboarding)/welcome.tsx | ✅ Validé |
| app/(onboarding)/features.tsx | ✅ Validé |
| app/(onboarding)/privacy.tsx | ✅ Validé |
| app/(onboarding)/pricing.tsx | ✅ Validé |
| app/(onboarding)/auth.tsx | ✅ Validé (initialise premier cycle) |
| app/(app)/splash.tsx | ✅ Validé |
| app/(app)/name.tsx | ✅ Validé |
| app/(app)/home.tsx | ✅ Validé (logique cycles 3 états) |
| app/(app)/affirmation.tsx | ✅ Validé (design + logique) |
| app/(app)/action.tsx | ✅ Validé (design + logique) |
| app/(app)/visualisation.tsx | ✅ Validé (design + logique) |
| app/(app)/journal.tsx | ✅ Validé (design + logique) |
| app/(app)/vision-board.tsx | ✅ Validé (design + logique) |
| app/(app)/celebration.tsx | ✅ Validé (design + logique) |

---

## RÈGLES CRITIQUES — NE JAMAIS VIOLER

### 1. Ne jamais nommer `index.tsx` dans un groupe route
Dans expo-router, les groupes `(name)` sont transparents dans les URLs :
- `app/index.tsx` → URL `/`
- `app/(onboarding)/index.tsx` → URL `/` ← CONFLIT FATAL

**Solution :** Toujours utiliser des noms descriptifs : `welcome.tsx`, `splash.tsx`, etc.

### 2. Root layout = Stack, pas Slot
`<Slot />` bloque la navigation cross-groupe `(onboarding)` vers `(app)`.
`<Stack screenOptions={{ headerShown: false }} />` est requis dans `app/_layout.tsx`.

### 3. Routes cross-groupe avec `as any`
`typedRoutes: false` dans `app.json`. Toujours caster les routes cross-groupe :
```ts
router.replace('/(app)/splash' as any)
```

### 4. Reanimated : UNIQUEMENT dans `welcome.tsx`
Reanimated cause `opacity: 0` permanent en Expo Go sur toutes les pages sauf welcome.tsx.
- Reanimated conservé **uniquement** dans `app/(onboarding)/welcome.tsx`
- Toutes les autres pages utilisent `Animated` de React Native uniquement
- PointsToast utilise Reanimated en interne mais est autorisé car c'est un composant pré-existant

### 5. Navbar identique sur toutes les pages
Icônes 22×22, `paddingTop: 8`, `paddingBottom: Math.max(insets.bottom, 8)`.
Ne jamais modifier sans instruction explicite.

### 6. Design des pages validées — INTOUCHABLE
Ne jamais modifier couleurs, polices, espacements, SVG, animations, navbar ni layouts des pages listées ci-dessus.

### 7. Ne jamais tuer les process node
Ne pas utiliser `kill`, `taskkill` ou équivalents sur les process node/expo.
L'utilisateur gère Expo Go lui-même.

---

## RÈGLES TECHNIQUES

### Reanimated
- Utiliser UNIQUEMENT dans `welcome.tsx`
- Sur toutes les autres pages : `Animated` de React Native uniquement
- Cause `opacity: 0` permanent sur Expo Go hors `welcome.tsx`
- **PointsToast.tsx réécrit** : zéro Reanimated — `useRef(new Animated.Value(0))` + `Animated.timing` avec `useNativeDriver: true`

### useFocusEffect — rechargement au retour sur page
- `home.tsx` utilise `useFocusEffect(useCallback(..., []))` pour relire `cycle_completed` + `cycle_step_status` à chaque retour
- `vision-board.tsx` idem pour les photos + créditation +5 pts
- **Règle** : toute page qui doit refléter un état AsyncStorage mis à jour par une autre page doit utiliser `useFocusEffect` et non `useEffect([], [])`

### Cycle complété — détection automatique
- `home.tsx` détecte si toutes les étapes sont `true` et `cycle_completed=false` → auto-marque `cycle_completed=true` + `next_cycle_time=minuit`
- Couvre le cas où l'utilisateur arrive à home sans avoir tapé "Terminer mon cycle"

### ClipPath IDs SVG — IDs uniques par fichier (ne jamais réutiliser)

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

---

## STRUCTURE DU PROJET

```
app/
  _layout.tsx                    → Stack racine, headerShown: false
  index.tsx                      → Point d'entrée AsyncStorage → routing

  (onboarding)/
    _layout.tsx                  → Stack, headerShown: false
    welcome.tsx   ✅             → Oeil animé Reanimated, langue, citation, → features
    features.tsx  ✅             → 7 cartes fonctionnalités
    privacy.tsx   ✅             → CGU, checkbox, liens légaux
    pricing.tsx   ✅             → 3 plans tarifaires, stubs achat
    auth.tsx      ✅             → Apple/Google stub, Magic Link, initialise cycles, → splash

  (app)/
    _layout.tsx                  → Stack, headerShown: false
    splash.tsx    ✅             → Oeil SVG statique, toast si opening=false, → name ou home
    name.tsx      ✅             → Saisie prénom, → home
    home.tsx      ✅             → Écran principal (design validé, logique cycles 3 états)
    affirmation.tsx  ✅          → Étape 2 cycle — affirmation thème
    action.tsx       ✅          → Étape 3+4 cycle — action facile + difficile
    visualisation.tsx ✅         → Étape 5 cycle — respiration + phrases guidées
    journal.tsx      ✅          → Étape 6 cycle — journal de gratitude
    vision-board.tsx ✅          → Étape 7 cycle — vision board photos
    celebration.tsx  ✅          → Fin de cycle — points + détail étapes
    profil.tsx       placeholder → router.back()
    parametres.tsx   placeholder → router.back()

services/
  firebase.ts                    → initializeAuth + inMemoryPersistence

components/
  ui/PointsToast.tsx             → Toast points animé (Animated RN — zéro Reanimated)

constants/
  theme.ts                       → Couleurs et styles globaux
```

---

## FLUX DE NAVIGATION VALIDÉ

```
app/index.tsx
  onboarding_completed absent  →  /(onboarding)/welcome
  onboarding_completed = true  →  /(app)/splash

(onboarding) : welcome → features → privacy → pricing → auth
  auth.tsx → initialise clés cycle → /(app)/splash

(app)/splash
  user_name absent  →  /(app)/name
  user_name présent →  /(app)/home

(app)/name → sauvegarde user_name → /(app)/home

(app)/home — bouton principal selon état du cycle :

  ÉTAT 1 — opening = false :
    Texte : "Commencer mon cycle →"
    Action : +10 pts total + cycle, opening=true, → affirmation.tsx

  ÉTAT 2 — opening = true, cycle non complété :
    Texte : "Continuer mon cycle →"
    Navigue vers prochaine étape non complétée :
      affirmation false          → affirmation.tsx
      action_easy ou hard false  → action.tsx
      visualisation false        → visualisation.tsx
      journal false              → journal.tsx
      vision_board false         → vision-board.tsx

  ÉTAT 3 — cycle_completed = true :
    Texte : "✦ Prochain cycle à minuit"
    Couleur #6B3FA0, non cliquable

  Carte Journal      → /(app)/journal
  Carte Vision Board → /(app)/vision-board
  Navbar Profil      → /(app)/profil
  Navbar Paramètres  → /(app)/parametres
  Bouton reset (discret, top:48 right:16) → AsyncStorage.clear() → /

Cycle des étapes :
  affirmation → action → visualisation → journal → vision-board → (celebration)
```

---

## ASYNCSTORAGE KEYS (architecture cycles)

### Clés actives

| Clé | Type | Rôle |
|-----|------|------|
| onboarding_completed | true | Fin onboarding (auth.tsx) |
| user_language | fr / en / es | Langue choisie (welcome.tsx) |
| legal_accepted | true | CGU acceptées (privacy.tsx) |
| legal_accepted_date | ISO string | Date acceptation CGU |
| selected_plan | lifetime / annuel / mensuel | Plan choisi (pricing.tsx) |
| user_name | string | Prénom utilisateur (name.tsx) |
| current_cycle | string int 1–365 | Numéro de cycle actuel |
| current_theme | string int 1–7 | Thème actuel = ((cycle-1) % 7) + 1 |
| cycle_step_status | JSON string | État des étapes du cycle |
| cycle_points | string int | Points gagnés ce cycle |
| cycle_completed | true / false | Cycle terminé ? |
| next_cycle_time | string timestamp | Minuit du jour suivant |
| points_total | string int | Points cumulés tous cycles |
| cycle_earned_points | JSON string | Points gagnés par étape ce cycle (pour celebration) |

### Structure cycle_step_status
```json
{
  "opening": false,
  "affirmation": false,
  "action_easy": false,
  "action_hard": false,
  "visualisation": false,
  "journal": false,
  "vision_board": false
}
```

### Clés supprimées — ne plus utiliser
- day_number
- daily_progress_step
- last_open_date
- points_today
- user_start_date

---

## ARCHITECTURE CYCLES

### Concept fondamental
365 cycles, 7 thèmes séquentiels, 8 étapes par cycle.
Le "cycle" remplace le "jour". Le cycle avance à minuit (next_cycle_time), pas à l'ouverture.

### 8 étapes par cycle
1. opening (ouverture)
2. affirmation
3. action_easy
4. action_hard
5. visualisation
6. journal
7. vision_board
8. (celebration — fin de cycle)

### Calcul thème
```ts
current_theme = ((current_cycle - 1) % 7) + 1
// Cycle 1 → thème 1, Cycle 7 → thème 7, Cycle 8 → thème 1
```

### Jauge progression
```ts
progressPercent = (points_total / 36500) * 100
// 36500 = 365 cycles x 100 pts max par cycle
```

### Niveaux
| Niveau | Seuil |
|--------|-------|
| Éveillé | 0–25% |
| Floraison | 25–50% |
| Rayonnant | 50–75% |
| Manifestant | 75–100% |

### Initialisation premier cycle (dans auth.tsx)
```ts
await AsyncStorage.setItem('current_cycle', '1')
await AsyncStorage.setItem('current_theme', '1')
await AsyncStorage.setItem('cycle_completed', 'false')
await AsyncStorage.setItem('cycle_points', '0')
await AsyncStorage.setItem('points_total', '0')
await AsyncStorage.setItem('cycle_step_status', JSON.stringify({
  opening: false, affirmation: false,
  action_easy: false, action_hard: false,
  visualisation: false, journal: false, vision_board: false
}))
await AsyncStorage.setItem('cycle_earned_points', JSON.stringify({
  opening: 0, affirmation: 0, action_easy: 0, action_hard: 0,
  visualisation: 0, journal: 0, vision_board: 0
}))
```

### Vérification nouveau cycle (dans home.tsx au chargement)
```ts
if (cycle_completed === 'true' && Date.now() >= next_cycle_time) {
  // Incrémenter cycle, calculer nouveau thème, reset step_status + cycle_points
}
```

---

## HOME.TSX — DESIGN VALIDÉ (ne pas modifier)

- Oeil SVG : 120x92, clipPath id="hc1", marginTop:32 sur le bloc header
- Header : "Bonjour" 14px uppercase Jost, prénom 36px serif italic
- Citation violette : 18px serif italic, couleur #6B3FA0
- Jauge : header "PROGRESSION · CYCLE {n}" gauche + badge niveau droite, "365 cycles" droite, barre h:16, 4 niveaux
- Bouton : paddingVertical:10, fontSize:12, letterSpacing:1, backgroundColor:#3A3530, borderRadius:999 — texte et couleur évoluent selon état
- Cartes Journal/VisionBoard : paddingVertical:8, paddingHorizontal:8, gap:3, cardTitle 11px — avec lien "Passer cette étape sans points" dessous
- Bloc puces Affirmations/Actions/Visualisations : pointerEvents="none", informatif uniquement
- Layout content : flex:1, justifyContent:space-between, paddingHorizontal:16, paddingTop:12, paddingBottom:16
- Navbar : icônes 22x22, labels 11px, paddingTop:8, safe area bottom

---

## FIREBASE

- services/firebase.ts → `initializeAuth(app, { persistence: inMemoryPersistence })`
- Firebase 12.x : `getReactNativePersistence` non disponible dans cette version
- `inMemoryPersistence` utilisé temporairement — 0 warning, 0 erreur TypeScript
- À corriger lors de la session Auth avec la vraie implémentation Apple/Google/Magic Link

---

## STUBS EN ATTENTE

```ts
// pricing.tsx
handlePurchase()   → console.log + AsyncStorage selected_plan + navigation
handleRestore()    → console.log stub

// auth.tsx
handleAppleSignIn()  → Alert stub
handleGoogleSignIn() → Alert stub
sendMagicLink()      → Firebase sendSignInLinkToEmail
```

---

## PROCHAINES PAGES À CONSTRUIRE

1. ~~affirmation.tsx~~ ✅
2. ~~action.tsx~~ ✅
3. ~~visualisation.tsx~~ ✅
4. ~~journal.tsx~~ ✅
5. ~~vision-board.tsx~~ ✅
6. ~~celebration.tsx~~ ✅
7. profil.tsx — Profil utilisateur + stats
8. parametres.tsx — Paramètres + reset compte

---

## LOGIQUE FIN DE CYCLE — VALIDÉE ✅

### getNextStepRoute() — implémentée dans toutes les pages étapes
Fonction sync identique dans affirmation, action, visualisation, journal, vision-board :
```ts
function getNextStepRoute(status: Record<string, boolean>): string {
  if (!status.affirmation) return '/(app)/affirmation';
  if (!status.action_easy || !status.action_hard) return '/(app)/action';
  if (!status.visualisation) return '/(app)/visualisation';
  if (!status.journal) return '/(app)/journal';
  if (!status.vision_board) return '/(app)/vision-board';
  return 'completed';
}
function goNext(route: string) {
  if (route === 'completed') router.replace('/(app)/celebration' as any);
  else if (route === '/(app)/journal' || route === '/(app)/vision-board')
    router.push((route + '?fromCycle=true') as any);
  else router.push(route as any);
}
```

### Cas couverts — tous les chemins mènent à celebration
1. Flux normal affirmation → action → visualisation → journal → vision-board → celebration
2. Visualisation validée/passée + journal et vision_board déjà faits → celebration
3. Journal validé/passé depuis accueil + c'était la dernière étape → celebration
4. Vision-board ouvert + toutes étapes déjà faites → showFinishBtn → celebration
5. Affirmation validée/passée + tout le reste déjà fait → celebration
6. Action validée/passée + tout le reste déjà fait → celebration

### celebration.tsx — logique
- Lit `cycle_points` et `cycle_earned_points` depuis AsyncStorage
- Affiche les points par étape (badge violet si gagné, gris si passé)
- Écrit `cycle_completed=true` + `next_cycle_time=minuit`
- Retour home → état 3 "✦ Prochain cycle à minuit"

### cycle_earned_points — tracking par étape
- Initialisé dans auth.tsx (premier cycle) et home.tsx (reset nouveau cycle)
- Rempli dans chaque page étape lors de la validation (+pts) ou passé (0)
- Clés : opening, affirmation, action_easy, action_hard, visualisation, journal, vision_board

---

## À IMPLÉMENTER PLUS TARD


### Contenu JSON — adjustsFontSizeToFit
Tous les textes dynamiques (affirmations, actions, visualisations) doivent s'adapter
à la taille de leur bloc blanc conteneur.
- Utiliser `adjustsFontSizeToFit={true}` et `numberOfLines` adapté sur chaque `<Text>`
  qui affiche du contenu venant du JSON
- À implémenter lors de la session d'intégration du contenu `content_fr.json`

### Firebase Auth
- `inMemoryPersistence` utilisé temporairement
- À corriger lors de la session Auth avec la vraie implémentation Apple/Google/Magic Link

---

## NETTOYAGE À FAIRE AVANT PUBLICATION

- Bouton reset sur toutes les pages → à supprimer avant publication stores
- Placeholders profil, parametres → à remplacer par vraies pages
- Stubs Apple/Google Sign-In dans auth.tsx → à remplacer par vraie implémentation
- `handlePurchase()` stub dans pricing.tsx → à remplacer par expo-in-app-purchases
