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
  useSubscriptionSync.ts     # listener Firestore users/{uid} → sync subscription_active vers AsyncStorage

services/
  firebase.ts                # init Firebase, auth avec getReactNativePersistence(AsyncStorage)
  config.ts                  # feature flags : STORES_ACTIVE, PADDLE_ACTIVE, PADDLE_SANDBOX, FREE_CYCLES, DEBUG_SKIP_PAYWALL, canPay()
  paddle.ts                  # chargeur dynamique Paddle.js + openCheckout() — web-only, no-op sur native

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
| `DEBUG_SKIP_PAYWALL` | `boolean` | **DEBUG**. Quand `true`, le gate freemium dans `home.tsx` est totalement court-circuité — accès illimité cycles 1→365 pour tester sur Expo Go sans payer. `console.warn` au mount de Home pour rappel. **Doit rester à `false` en prod / avant toute soumission aux stores.** Ne le repasser à `true` que **temporairement** pour tester les cycles sans payer, puis le remettre à `false` aussitôt. (État actuel : `false` depuis 2026-07-11.) |

### Bandeau freemium dans `pricing-upgrade.tsx`

- Détection au mount : `current_cycle > FREE_CYCLES && !subscription_active` → state `isFreemiumExpired`
- Si `true` → bandeau `freemiumTitre` + `freemiumMessage` (clés `t.pricingUpgrade.freemium*`) inséré entre l'œil et le titre.
- Sinon (accès depuis parametres pendant les cycles gratuits) → bandeau caché, UI inchangée.

### Post-achat (in-app via `pricing-upgrade.tsx`)

- `handlePurchase` (quand `STORES_ACTIVE=true`) écrit `selected_plan` + `subscription_active='true'` puis `router.replace('/(app)/home')` (et **non** `back()`, sinon boucle quand on vient du gate).
- Câblage RevenueCat futur : déplacer l'écriture `subscription_active='true'` du flow synchrone vers le callback success de RevenueCat. Le gate `home.tsx` n'a aucune ligne à toucher — il continue à lire la clé peu importe qui l'a écrite.

---

## Paiements

### Stratégie multi-plateforme

| Plateforme | Provider | Source de vérité `subscription_active` |
|---|---|---|
| Web (`Platform.OS === 'web'`) | **Paddle Billing** (Paddle.js v2) | Webhook Paddle → Firebase Functions → Firestore → `useSubscriptionSync` listener → AsyncStorage |
| iOS / Android | **RevenueCat** (planifié) | Webhook RevenueCat → Firebase Functions → Firestore → même listener → AsyncStorage |

→ `subscription_active` dans AsyncStorage n'est écrite **que par `useSubscriptionSync`** (jamais par le client de manière optimiste sur web). Le gate `home.tsx` et la row `parametres.tsx` lisent cette clé sans savoir qui l'a posée — agnostique au provider.

### Flags `services/config.ts`

| Flag | Type | Effet |
|------|------|-------|
| `STORES_ACTIVE` | `boolean` | Active RevenueCat sur native (iOS/Android). Sans effet sur web. |
| `PADDLE_ACTIVE` | `boolean` | Active Paddle.js sur web. Sans effet sur native. |
| `PADDLE_SANDBOX` | `boolean` | Lu depuis `EXPO_PUBLIC_PADDLE_SANDBOX` dans `.env`. Quand `true`, utilise les vars sandbox token/price IDs + `Paddle.Environment.set('sandbox')`. |
| `canPay()` | helper | Renvoie `PADDLE_ACTIVE` sur web, `STORES_ACTIVE` sur native. À utiliser dans tous les `handlePurchase` au lieu de checker les flags séparément. |

### Routing dans `handlePurchase`

```
if (!canPay())                         → Alert "Disponible prochainement"
else if (Platform.OS === 'web' && PADDLE_ACTIVE) → openCheckout() Paddle
else /* native, STORES_ACTIVE */       → RevenueCat (futur, aujourd'hui stub)
```

Appliqué dans `pricing.tsx` (onboarding) et `pricing-upgrade.tsx` (paywall in-app).

### Architecture Paddle web (flow complet)

```
1. User clique "Confirmer" sur pricing-upgrade.tsx (web, PADDLE_ACTIVE=true)
2. handlePurchase appelle services/paddle.ts → openCheckout({
     plan: 'mensuel'|'annuel'|'lifetime',
     email: auth.currentUser.email,
     firebaseUid: auth.currentUser.uid
   })
3. Paddle.js (chargé lazy via <script>) ouvre la modale checkout
4. User paie → Paddle valide la carte
5. Paddle POST → https://manifest-mind.app/api/paddle-webhook (Firebase Function)
6. La function vérifie la signature HMAC, lit custom_data.firebase_uid,
   écrit users/{uid}.subscription_active = true dans Firestore
7. useSubscriptionSync (listener actif app-wide) détecte le snapshot change
8. Écrit AsyncStorage.setItem('subscription_active', 'true')
9. Gate home.tsx lève le paywall au prochain focus, l'utilisateur accède au cycle 8+
```

**Sécurité** : aucune écriture optimiste côté client sur web. `subscription_active` ne devient `'true'` que via le listener Firestore, qui ne reçoit que des updates écrites par le webhook serveur authentifié par HMAC. Un user malin ne peut pas contourner en ouvrant/fermant la modale Paddle.

### `.env` — variables Paddle

```
EXPO_PUBLIC_PADDLE_CLIENT_TOKEN=live_...
EXPO_PUBLIC_PADDLE_PRICE_MENSUEL=pri_...
EXPO_PUBLIC_PADDLE_PRICE_ANNUEL=pri_...
EXPO_PUBLIC_PADDLE_PRICE_LIFETIME=pri_...

EXPO_PUBLIC_PADDLE_SANDBOX=false
EXPO_PUBLIC_PADDLE_SANDBOX_TOKEN=
EXPO_PUBLIC_PADDLE_SANDBOX_PRICE_MENSUEL=
EXPO_PUBLIC_PADDLE_SANDBOX_PRICE_ANNUEL=
EXPO_PUBLIC_PADDLE_SANDBOX_PRICE_LIFETIME=
```

Token client (préfixe `live_*` ou `test_*`) est conçu pour être bundlé côté client. **Aucun secret serveur ici.**

### 🚨 PADDLE_API_KEY serveur — sécurité absolue

- **JAMAIS** dans `.env` de ce repo Expo (même non préfixée `EXPO_PUBLIC_*`, elle finirait dans le bundle si importée).
- **JAMAIS** dans aucun fichier `.ts` de ce repo.
- Vit **uniquement** dans la config Firebase Functions : `firebase functions:config:set paddle.api_key="..."`.
- Sert au backend pour valider la signature HMAC des webhooks Paddle.
- **Rotation 90 jours obligatoire** (Paddle force l'expiration). Date courante : expire le **2026-09-28**. Voir mémoire `paddle-api-key-expiry` pour la procédure complète.

### UX gap onboarding web (limitation connue V1)

En onboarding, sur web + `PADDLE_ACTIVE=true`, choisir un plan payant ne déclenche **pas** Paddle Checkout immédiatement : Paddle a besoin d'un Firebase UID, qui n'existe pas avant `auth.tsx`. L'utilisateur s'auth, atterrit en mode Free, puis paie via :
- Parametres → row "Passer à Premium" (à tout moment)
- Gate freemium au cycle 8 (automatique)

À refiner en V2 si conversion onboarding paye → mode payant doit être plus directe (collecte email pré-auth + auth post-Paddle).

### Backend webhook (déployé le 2026-06-30)

Firebase Cloud Functions 2nd gen dans `functions/` à la racine du repo, region `europe-west1`, runtime Node 20. Une seule function :

- **`paddleWebhook`** (fichier `functions/src/index.ts`)
  - Reçoit POST de Paddle
  - Vérifie signature HMAC-SHA256 sur `<ts>:<rawBody>` avec le Webhook Notification Secret
  - Anti-replay : rejette timestamps hors fenêtre ±5 min
  - Comparaison signature en `crypto.timingSafeEqual`
  - Route selon `event_type` (cf. mapping ci-dessus)
  - Écrit `users/{uid}` dans Firestore Native mode via Admin SDK (bypass rules)
  - Répond 200 OK sur succès (Paddle acknowledgement), 401 sur sig invalide, 500 sur Firestore fail (Paddle retry)

**URL webhook stable à utiliser dans Paddle dashboard** :
```
https://europe-west1-manifestmind.cloudfunctions.net/paddleWebhook
```

⚠️ **Ne PAS utiliser l'URL Cloud Run directe** (`https://paddlewebhook-<hash>-ew.a.run.app`) — le hash est régénéré par Firebase Functions 2nd gen à certains redeploys, cassant Paddle. L'alias `cloudfunctions.net` est garanti stable par Firebase.

### Firestore

- **Mode** : Native (obligatoire pour compat Admin SDK + client `onSnapshot`)
- **Location** : `europe-west1` (même région que le webhook, latence ~ms)
- **Rules** : deny par défaut + read own `users/{uid}` autorisé pour user authentifié, write bloqué côté client (seul le webhook Admin SDK écrit)

### Secrets serveur — dans Google Secret Manager uniquement

Un seul secret nécessaire au fonctionnement :
- **`PADDLE_WEBHOOK_SECRET`** (`pdl_ntfset_*`) — clé HMAC pour vérifier les webhooks entrants

Anti-piège documenté : **NE PAS créer ni updater le secret via le champ "Secret value" (textarea) de la Cloud Console UI** — ce champ peut silencieusement corrompre le paste (répétition multiple observée en juin 2026 = 6× la valeur, 420 bytes au lieu de 70). Toujours utiliser :
- Soit **"Upload from file"** dans Cloud Console (fichier UTF-8 sans BOM, sans trailing newline)
- Soit `gcloud secrets versions add ... --data-file=-`
- Soit `firebase functions:secrets:set ...` (interactif, moins sûr, hors sujet ici)

Procédure PowerShell pour créer un fichier propre : cf. commit `<hash>` message ou historique conversation 2026-06-30.

### Test manuel du webhook

Script `scripts/test-webhook.js` : envoie un event `subscription.activated` factice signé HMAC valide.

Usage PowerShell :
```
$env:PADDLE_WEBHOOK_SECRET = "<valeur du dashboard Paddle>"
$env:TEST_FIREBASE_UID = "TEST_WEBHOOK_LOCAL_001"
node scripts/test-webhook.js
Remove-Item Env:PADDLE_WEBHOOK_SECRET
Remove-Item Env:TEST_FIREBASE_UID
```

Attendu : HTTP 200 + log Cloud Logging `[paddle] users/TEST_WEBHOOK_LOCAL_001 updated: subscription_active=true` + doc créé dans Firestore. Supprimer le doc de test après validation.

### Rotation PADDLE_WEBHOOK_SECRET

En cas de fuite ou rotation planifiée :
1. Paddle dashboard → Notifications → ton webhook → "Rotate secret"
2. Cloud Console → Secret Manager → `PADDLE_WEBHOOK_SECRET` → New Version → **Upload from file** avec la nouvelle valeur
3. `npx firebase deploy --only functions` pour repointer le mount env var sur la latest version
4. Test via `scripts/test-webhook.js` puis désactive/delete l'ancienne version dans Secret Manager

### PADDLE_API_KEY serveur — pas nécessaire au V1

L'API Key (`pdl_live_apikey_*`) n'est utilisée que pour **appeler** l'API Paddle (cancel, refund, query). Aucune feature V1 n'en a besoin. Ne pas la générer/stocker tant qu'on n'en a pas l'usage concret — surface d'attaque réduite. À planifier en V1.5 quand on ajoutera "Annuler mon abonnement" côté app.

### État actuel Paddle (2026-07-12 fin de session)

| Composant | Statut |
|---|---|
| Backend `paddleWebhook` déployé sur `europe-west1` | ✅ Live (dual-secret prod + sandbox, redéployé 2026-07-11) |
| Firestore Native en `europe-west1` | ✅ Créé, rules deny-par-défaut + read own users/{uid} |
| Secret `PADDLE_WEBHOOK_SECRET` v2 dans Secret Manager | ✅ Actif (v1 corrompue laissée en historique pour rollback) |
| Secret `PADDLE_SANDBOX_WEBHOOK_SECRET` dans Secret Manager | ✅ **versions/2** (v1 = mauvaise clé → 401 ; v2 corrigée le 2026-07-12), lié à la function (IAM secretAccessor OK) |
| Validation signature dual-secret (`verifyPaddleSignature` teste prod puis sandbox) | ✅ Déployé — prod et sandbox valident en parallèle, sans bascule manuelle |
| Paddle dashboard PROD → URL webhook + 7 events | ✅ Configuré sur `cloudfunctions.net/paddleWebhook` |
| Paddle dashboard SANDBOX → URL webhook + events | ✅ Déclaré sur la même URL stable `cloudfunctions.net/paddleWebhook` |
| Sandbox `.env` (5 vars `EXPO_PUBLIC_PADDLE_SANDBOX_*` + `=true`) | ✅ Renseigné le 2026-07-11 |
| Test end-to-end PROD : script → HMAC → webhook → Firestore write | ✅ HTTP 200 validé le 2026-06-30 |
| Test paiement end-to-end SANDBOX (carte test → webhook → `subscription_active`) | ✅ **VALIDÉ le 2026-07-12** — paiement Paddle → webhook (clé sandbox v2) → `users/{uid}.subscription_active=true` dans Firestore. Toute la chaîne fonctionne. |
| App-side code (`services/paddle.ts`, `useSubscriptionSync`, routing) | ✅ Prêt, non actif |
| `PADDLE_ACTIVE` dans `services/config.ts` | ✅ `true` depuis 2026-07-11 (activé pour tester le checkout web sandbox) |
| `STORES_ACTIVE` dans `services/config.ts` | 🔒 `false` |
| `DEBUG_SKIP_PAYWALL` dans `services/config.ts` | ✅ `false` depuis 2026-07-11 (gate freemium actif). ⚠️ Repasser à `true` UNIQUEMENT et TEMPORAIREMENT pour tester les cycles 8→365 sur Expo Go sans payer, puis re-`false`. **Doit être `false` en prod / avant toute soumission.** |

### Prochaine session Paddle — étapes

1. ✅ **~~Créer compte Paddle Sandbox~~** (`sandbox-vendors.paddle.com`) — 3 produits Mensuel/Annuel/Lifetime → 3 sandbox price IDs, 1 sandbox client token (`test_*`), 1 sandbox webhook secret (`pdl_ntfset_*` distinct de la prod). *Fait.*
2. ✅ **~~Configurer sandbox dans `.env`~~** — 5 vars `EXPO_PUBLIC_PADDLE_SANDBOX_*` renseignées + `EXPO_PUBLIC_PADDLE_SANDBOX=true`. *Fait le 2026-07-11.*
3. ✅ **~~Adapter le backend pour 2 secrets~~** — retenu : **fallback dual-secret dans la function unique** (`verifyPaddleSignature` teste prod puis sandbox). `PADDLE_SANDBOX_WEBHOOK_SECRET` v1 posé + function redéployée le 2026-07-11. Webhook sandbox déclaré sur la même URL stable `cloudfunctions.net/paddleWebhook`. *Fait.*
4. ✅ **~~Test paiement end-to-end sandbox~~** — **VALIDÉ le 2026-07-12**. Paiement Paddle sandbox (carte test) → webhook (clé sandbox v2) → `users/{uid}.subscription_active=true` dans Firestore. Chaîne complète OK. (Blocage résolu : la clé `PADDLE_SANDBOX_WEBHOOK_SECRET` v1 était erronée → 401 ; v2 = bonne `pdl_ntfset_*` de la destination sandbox.)
5. **Build web** — `npx expo export --platform web` → génère `dist/`, à déployer sur Firebase Hosting ou autre CDN. Tester la version bundlée avant flip prod. Une fois validé : `PADDLE_ACTIVE=true` + `EXPO_PUBLIC_PADDLE_SANDBOX=false` → live.

### Modèle d'accès définitif — IMPLÉMENTÉ (2026-07-12)

Décision tranchée + livrée : **essai gratuit = 7 CYCLES** (pas 7 jours), **sans carte**, via **compte Firebase anonyme** (`signInAnonymously`). Au **cycle 8**, tout **non-abonné** est bloqué → paywall, avec **conversion inline email+password** (`linkWithCredential`, **même UID** → progression préservée, Option A = progression locale AsyncStorage). Même conversion à l'onboarding si plan payant choisi direct. Reconnexion = magic link.

Phases livrées & validées :
- **P0** — console : providers Anonymous + Email/Password (+ Email link) activés ; règles Firestore read own `users/{uid}` / write deny.
- **P2** — gate `home.tsx` : `cycle > FREE_CYCLES && !subscription_active` (retrait de `isFree`).
- **P1** — `signInAnonymously` au démarrage de l'essai (`pricing.tsx`) ; ancien `handleSkipAccount` supprimé (chemin unique « sans compte » = essai anonyme).
- **P3** — conversion inline email+password (`services/authConversion.ts` : `convertOrSignIn`/`needsAccount`/`mapConversionError`) sur `pricing-upgrade.tsx` (cycle 8) et `pricing.tsx` (paid onboarding) → enchaîne Paddle. Gère `email-already-in-use` (fallback signIn). i18n `t.compte` (fr/en/es).
- **Fix authStateReady** — `_layout.tsx` `AnonymousBootstrap` (attend `auth.authStateReady()`, garantit l'anonyme) ; `await auth.authStateReady()` dans les `handlePurchase` ; `mustCreateAccount` réactif via `onAuthStateChanged`. Résout le `currentUser` null prématuré (réhydratation async de la persistance web) → vraie conversion `linkWithCredential`, même UID. **Testé OK end-to-end le 2026-07-12** (paiement → `subscription_active=true` → accès débloqué).

### 🗺️ Roadmap priorisée — prochaines sessions (dans cet ordre)

#### PRIORITÉ 1 — Finition du modèle d'accès (en cours, presque bouclé)
1. ⏳ **Redirection automatique dans l'app après paiement** — actuellement, après paiement sur `pricing-upgrade`, il faut aller **manuellement** sur home/splash (on n'auto-route PAS car `checkout.completed` arrive avant la synchro webhook→Firestore→`subscription_active` → router immédiatement rebondirait sur le paywall). À implémenter : écran **« activation en cours »** qui attend `subscription_active=true` (listener `useSubscriptionSync`) puis route vers home. À l'onboarding (cycle 1) le problème ne se pose pas.
2. ⏳ **Phase 4 — wording « 7 cycles gratuits »** partout (retirer toute mention « 7 jours »), 3 langues (`translations.ts`).
3. ⏳ **Phase 5 — reconnexion** — vérifier que le magic link reconnecte bien un utilisateur qui revient (compte converti email+password) ; `subscription_active` resynchronisé depuis Firestore. (Pas de formulaire password au MVP.)

#### PRIORITÉ 2 — Google Sign-In (à faire AVANT le lancement public)
Les boutons Google existent mais sont des **coquilles vides** (`auth.tsx` : `handleGoogleSignIn` affiche juste un toast). Le provider **Google est déjà activé côté Firebase**. À développer :
- **Connexion Google** : `signInWithPopup` + `GoogleAuthProvider` (compte Google perso), avec `signInWithRedirect` en fallback si popup bloqué.
- **Conversion du compte anonyme via Google au cycle 8** — alternative à email+password : `linkWithPopup(auth.currentUser, GoogleAuthProvider)` (même UID conservé, cf. logique `services/authConversion.ts`). Gérer `credential-already-in-use`.
- **Reconnexion via Google** pour un utilisateur qui revient.
- (Apple Sign-In laissé de côté pour l'instant — chantier séparé, exige config Apple Developer.)

#### PRIORITÉ 3 — Préparation du lancement web (Phase 1)
- ⏳ **PWA** — `manifest.webmanifest` (nom, icônes, `display: standalone`, `theme_color`), **service worker** (offline/cache), **jeu d'icônes** (192/512 + maskable) → installable sur écran d'accueil.
- ⏳ **Passage Paddle sandbox → production** — créer produits + prix côté prod, configurer le webhook prod, **approbation du domaine `manifest-mind.app`** dans Paddle. Puis `.env` : `EXPO_PUBLIC_PADDLE_SANDBOX=false` (bascule sur le token/price IDs prod déjà présents).
- ⏳ **Documents légaux** — CGU + politique de confidentialité à jour avec **« 7 cycles »** et **essai sans carte** (3 langues).
- ⏳ **Déploiement web** — build `npx expo export --platform web` → `dist/` → déploiement sur `manifest-mind.app` + **tests finaux en conditions réelles** (paiement prod, magic link, Google).

#### Transverse — nettoyage avant prod
🧹 Retirer les boutons debug `home.tsx` (« reset », « ⏭ cycle suivant ») et les `console.log` `__DEV__` de diagnostic ; supprimer la clé i18n `t.auth.sansCompte` + le style `skipText` devenus inutilisés. Vérifier `DEBUG_SKIP_PAYWALL = false` (point 0 🚨).

### Rappel : 2 constructions distinctes prévues

L'app cible **2 pipelines de distribution parallèles** — chacun avec son propre provider de paiement :

| Pipeline | Cible | Provider paiement | Trigger flag | Build command |
|---|---|---|---|---|
| **Web** | Navigateurs (desktop + mobile) | **Paddle Billing** ← objet des dernières sessions | `PADDLE_ACTIVE=true` | `npx expo export --platform web` |
| **Native** | App Store (iOS) + Play Store (Android) | **RevenueCat** ← planifié V1.5 | `STORES_ACTIVE=true` | `eas build --platform ios/android` |

Les deux pipelines partagent le même code source Expo. Le routing par `Platform.OS === 'web'` dans `handlePurchase` (`pricing.tsx` + `pricing-upgrade.tsx`) sélectionne le bon provider au runtime. La source de vérité `subscription_active` est unifiée via Firestore listener (`useSubscriptionSync`) — un user peut ainsi payer sur web puis retrouver son abonnement actif sur l'app mobile après login (même Firebase UID → même doc Firestore users/{uid}).

⚠️ **Ne pas confondre les deux checklists** : `DEBUG_SKIP_PAYWALL` est bloquant pour **les deux** (bypass paywall universel). `PADDLE_ACTIVE` est spécifique au pipeline web. `STORES_ACTIVE` est spécifique au pipeline native. Le point 0 🚨 de la checklist ci-dessous s'applique aux deux.

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
9. Vérifier que les 3 URLs légales (FR/EN/ES × privacy/terms/refund) sont **accessibles publiquement** sur `manifestmind.github.io/manifest-mind/` avant soumission stores :
   - FR : `politique_confidentialite_fr.html`, `conditions_utilisation_fr.html`, `remboursement_fr.html`
   - EN : `privacy_policy_en.html`, `terms_of_use_en.html`, `refund_policy_en.html`
   - ES : `politica_privacidad_es.html`, `terminos_uso_es.html`, `politica_reembolso_es.html`
   URLs lues via `t.legal.{privacyUrl,termsUrl,refundUrl}` depuis `parametres.tsx` (section "Légal").
