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
| Paddle dashboard PROD → URL webhook + events | ✅ URL configurée sur `cloudfunctions.net/paddleWebhook` — ⚠️ **liste d'événements à RE-VÉRIFIER au point 22** contre la liste canonique des 9 (la config des événements est PAR ENVIRONNEMENT, leçon du point 12) |
| Paddle dashboard SANDBOX → URL webhook + events | ✅ URL stable `cloudfunctions.net/paddleWebhook` + **9 événements cochés (2026-07-16)** — avant : 3 seulement → `subscription.canceled` jamais envoyé (cause racine du point 12) · **test annulation validé** (`subscription.canceled` → `subscription_active=false`) |
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

### 🗺️ FEUILLE DE ROUTE JUSQU'À PUBLICATION (fusion audit + roadmap — 2026-07-14)

> **Ceci est la roadmap AUTORITAIRE.** Elle intègre les constats de l'audit global du 2026-07-14. Le détail technique du travail DÉJÀ RÉALISÉ est archivé plus bas (section 📦 ARCHIVE).

═══════════════════════════════
**STRATÉGIE EN DEUX TEMPS**
═══════════════════════════════
- **PHASE 1 — Publication WEB + PWA**, paiements Paddle, domaine `manifest-mind.app`. Pas de DUNS ni de compte store nécessaire. ← **PRIORITÉ ACTUELLE**
- **PHASE 2 (plus tard, chantier séparé) — Publication STORES en NOM PROPRE** (compte individuel, évite le DUNS). **NOUVELLE CONSTRUCTION native** de l'app (pas un simple portage). Paiements via **RevenueCat** (Paddle interdit sur stores). **Apple Sign-In obligatoire**. Config native `app.json` (permissions, notifications, deep links). Contraintes stores (test fermé Google 14 j, risque rejet Apple).
  - ✅ **~~FUITE DE CONTENU — notification d'affirmation~~** — **CORRIGÉ le 2026-07-15** (traité en Phase B point 6, par anticipation, en ouvrant l'accès à `parametres` depuis le paywall). `scheduleAffirmationNotif()` fait désormais `const cycleContent = (await isPaywalled()) ? null : getCycleContent(...)` → un non-abonné paywallé reçoit le texte générique `t.notifications.affirmationBody`, jamais l'affirmation réelle. Sûr web ET natif. L'écran `parametres` n'est **pas** gaté (RGPD). *(Historique : repérée le 2026-07-14 en vérifiant le périmètre d'A.2 — `parametres.tsx` était le seul écran whitelisté à importer `getCycleContent` et mettait l'affirmation du cycle courant dans le corps de la notif quotidienne ; inerte sur web mais réelle sur natif.)*

═══════════════════════════════
**🔢 ORDRE D'EXÉCUTION — RÉORGANISÉ (2026-07-15) — FAIT AUTORITÉ**
═══════════════════════════════

> **CET ORDRE REMPLACE la lecture linéaire A→H ci-dessous** (qui reste le DÉTAIL de chaque point). **Décision : AUCUN déploiement public tant que tout n'est pas testé ET nettoyé.** Les tests mobiles se font via un **tunnel HTTPS privé** (URL temporaire, obscure — **PAS une publication** ; `manifest-mind.app` reste vierge jusqu'au vrai déploiement).

**✅ DÉJÀ FAIT :** PHASE A · PHASE B · PHASE C (Google complet) · Points **9** + **11** (Phase D) codés, validés, commités · Point **12** résolu (config Paddle, zéro code, test annulation validé 2026-07-16).

**RESTE À FAIRE, STRICTEMENT DANS CET ORDRE :**
1. **PHASE D — finir la robustesse paiement** : ✅ ~~point **12**~~ (résolu 2026-07-16, config Paddle) → point **10** (remboursement lifetime), puis **13** (prix EUR→USD centralisés). 🚨 **UN POINT À LA FOIS pour le 10 (webhook = argent + accès) : OBSERVER d'abord (payloads réels — leçon du point 12), TESTER après — NE PAS le regrouper avec le 13.**
2. **PHASE E — légal** : **14** (CGU/confidentialité « 7 cycles » + essai sans carte) · **15** (export RGPD) · **16** (bannière consentement) · **17** (mentions Paddle).
3. **PHASE H-partie-1 — configurer la PWA** : **25** (manifest, service worker, icônes 192/512/maskable, robots.txt). *(La PWA doit EXISTER avant de pouvoir la tester sur mobile.)*
4. **🧪 TESTS MOBILES via TUNNEL HTTPS** : parcours complet, **PWA/installation**, **Google Sign-In**, **Paddle sandbox**, **Safari/iPhone**, responsive, **clavier mobile**. ⚠️ **AVEC les boutons debug ENCORE PRÉSENTS** (indispensables pour atteindre le cycle 8 sur mobile). Cf. encadrés « TUNNEL » et « SAFARI/IPHONE » ci-dessous.
5. **PHASE F — nettoyage complet, APRÈS les tests** : **18** (retirer boutons debug) · **19** (code mort/logs — **sauf** diagnostics `paddle.ts`) · **20** (`app.json` plugin `expo-font` double) · **renommage `claude_master.md`** (casse git, cf. ARCHIVE) · **21** (`DEBUG_SKIP_PAYWALL = false`).
6. **PHASE G — config production** : **22** (Paddle sandbox→prod + catalogue + webhook prod) · **23** ✅ (domaine approuvé) · **23-bis** (détails de paiement bancaire) · **24** (config Google prod + restriction clé API).
7. **PHASE H-partie-2 — build + déploiement** : **26** (`npx expo export --platform web`) · **27** (déployer sur `manifest-mind.app`) · **28** (tests finaux réels + reçu Paddle au client).
8. 🚀 **PUBLICATION WEB.**

═══════════════════════════════
🚨 **NE PAS RETIRER LES BOUTONS DEBUG AVANT L'ÉTAPE 5**
═══════════════════════════════
Les boutons debug de `home.tsx` (**« reset »** et **« ⏭ cycle suivant »**) restent **JUSQU'À l'étape 5 (Phase F), APRÈS les tests mobiles** — ils sont **indispensables** pour atteindre le cycle 8 sur téléphone pendant les tests (étape 4). **AUCUNE session future ne doit les retirer « par zèle »**, même en croisant une remarque du type « nettoyer les boutons debug ». Ce n'est PAS une omission, c'est une décision d'ordonnancement. (Avertissement identique dans l'ARCHIVE.)

═══════════════════════════════
🧪 **PROCÉDURE TUNNEL HTTPS (tests mobiles — étape 4)**
═══════════════════════════════
1. `npx expo start --tunnel` → URL HTTPS temporaire (ex. `https://xxxx.exp.direct`, via ngrok intégré).
2. Ajouter cette URL **aux domaines autorisés Firebase** (Console Firebase → Authentication → Settings → Authorized domains) — sinon **Google Sign-In + magic link** échouent (`auth/unauthorized-domain`).
3. Ajouter cette URL **aux « approved domains » Paddle SANDBOX** (dashboard Paddle → Checkout settings) — sinon le **checkout Paddle ne s'ouvre pas**.
4. Ouvrir l'URL du tunnel depuis le **navigateur du téléphone** (dont **Safari/iPhone**).
⚠️ **L'URL du tunnel CHANGE à chaque relance → REFAIRE les étapes 2 et 3** à chaque nouvelle URL.
- Rappel : sans tunnel (IP locale HTTP `192.168.x.x:8081`) → OK pour écrans/responsive/**email+password**, mais **Google, magic link, PWA et Paddle NE marchent PAS** (domaine autorisé + HTTPS requis).

═══════════════════════════════
📱 **VIGILANCE SAFARI/IPHONE (à valider à l'étape 4)**
═══════════════════════════════
Le repli **`signInWithRedirect`** (quand le popup Google est bloqué) passe par `manifestmind.firebaseapp.com`, un **domaine tiers** → **cassé par le blocage des cookies tiers de Safari/ITP** (et Chrome qui s'y met). **Invisible en localhost** (le popup passe), donc **à tester EXPLICITEMENT sur un vrai iPhone via le tunnel**. Correctif prévu au point **24** (servir le handler d'auth depuis notre domaine : `authDomain` + rewrite Firebase Hosting) — mais le **diagnostic** se fait à l'étape 4.

═══════════════════════════════
**DÉTAIL DES PHASES (référence — exécution selon l'ORDRE ci-dessus)**
═══════════════════════════════

**PHASE A — Sécuriser l'accès payant (CHANTIER N°1, avant tout)**
1. ✅ **~~Versionner + verrouiller les règles Firestore~~** — **FAIT (2026-07-14)**. Cf. « A.1 » en archive.
2. ✅ **~~Protéger TOUS les écrans de contenu (gate au niveau du layout `(app)`)~~** — **FAIT (2026-07-14)**. Cf. « A.2 » en archive.
3. ✅ **~~Empêcher l'essai gratuit renouvelable à l'infini~~** — **TRANCHÉ ET FAIT (2026-07-14)**. Décision : **Option 1 — assumer la fuite, réduire l'attrait**. Cf. « A.3 » en archive pour le raisonnement complet et la liste des fuites ACCEPTÉES.

→ ✅ **PHASE A TERMINÉE (2026-07-14).** Prochaine étape : **PHASE B**.

**PHASE B — Autres points critiques**
4. ✅ **~~Débloquer l'utilisateur qui a payé mais dont le webhook échoue~~** — **FAIT (2026-07-15)**. La boucle venait du bouton « Continuer → `home` » de la phase `slow` d'`activation.tsx` (home → gate → paywall). **Supprimé.** Désormais le SEUL chemin vers home passe par la phase `activated`, qui exige `subscription_active === true` **confirmé**. Recours ajoutés en phase `slow` :
   - **« Réessayer » = vérification SERVEUR autoritaire** — `hasActiveSubscription(auth.currentUser.uid)` (`getDoc users/{uid}`), la vérité serveur, qui court-circuite un listener `onSnapshot` mort ou branché sur le mauvais UID. **Ne débloque QUE si le serveur confirme** (règles Firestore : lecture own doc OK, écriture client interdite → valeur non forgeable). Aucune écriture optimiste.
     - **Feedback visible à chaque clic (corrigé 2026-07-15)** — le bouton était *muet* au-delà du 1er clic (seul le texte de l'écran basculait, une fois, à l'escalade) → perçu comme cassé. Désormais 3 états visibles : `Vérification…` (pendant le `getDoc`, désactivé) → succès **ou** `Réessayer dans Ns` (cooldown `RETRY_COOLDOWN_S=5` **affiché**, qui borne aussi les lectures Firestore) → `Réessayer` actif. `runCheck()` renvoie un booléen ; le succès survient PENDANT le check (avant le cooldown) → jamais bloqué. `checking`/`cooldown` = UI pure, phase `slow` uniquement → nominal intact. i18n `t.activation.{verification,reessayerDans}`.
   - **Escalade temporelle** : re-vérif serveur automatique toutes les 4 s, bornée à `SLOW_AUTO_MAX=3` passes (borne le coût Firestore). Un webhook simplement en retard s'auto-débloque. Après `ESCALATE_AFTER=3` échecs → message bascule de « Encore un instant » vers **« Ton paiement est en sécurité »** (réassurance Paddle *merchant of record* + reçu e-mail) + bouton **« J'ai payé — me reconnecter »** (→ `auth.tsx`, ré-attache le listener au bon UID) + **lien support `mailto:` `contact@manifest-mind.app`** (constante `SUPPORT_EMAIL` dans `services/config.ts` ; si un jour vidée → le bloc support disparaît tout seul).
   - i18n `t.activation.{jaiPaye,bloqueTitre,bloqueMessage,bloqueSupport}` (FR/EN/ES).
   - **🔒 Sécurité** : un non-payeur (y compris via URL directe `/activation`) ne peut JAMAIS atteindre home — `serverConfirms()` renvoie `false`, et il n'existe plus aucun bouton routant vers home « à l'aveugle ».
   - **⚠️ 4 risques signalés (acceptés)** : (1) `getDoc` hors ligne → `false` fail-closed (l'utilisateur reste sur l'écran d'aide — correct, à ne pas confondre avec « webhook cassé ») ; (2) coût Firestore de la re-vérif borné à `SLOW_AUTO_MAX` passes auto + retries manuels ; (3) reconnexion au mauvais compte → aucun octroi (correct), au bon compte → listener ré-attaché ; (4) bouton « Continuer » retiré = aucun cas légitime perdu (la phase `activated` couvre le cas abonné actif).
5. ✅ **~~Supprimer `firebase.ts` mort~~** (racine, clé API en dur, importé nulle part) — **FAIT (2026-07-15)**. Confirmé mort (aucun import direct/dynamique ; toutes les refs pointent sur `services/firebase.ts`) ; le fichier ne faisait qu'un `const firebaseConfig` **jamais exporté**. `tsc` clean + app bootée après suppression. ⚠️ **La restriction de clé par domaine est DÉPLACÉE en PHASE G** (point 24) : sur localhost elle n'apporte rien et, mal réglée, casserait le dev ; elle n'a de sens que sur le domaine de prod. **Rien à réécrire dans l'historique git ni à faire tourner** : une clé web Firebase n'est PAS un secret (déjà dans le bundle vivant), la sécurité vient des règles Firestore (A.1 ✅) ; la restriction protège le **quota/la facture**, pas les données.
6. ✅ **~~Sortir de la « souricière » du cycle 8~~** — **FAIT (2026-07-15)**. `pricing-upgrade.tsx` n'offrait aucune porte vers le compte (déconnexion / suppression RGPD / langue), alors que `parametres` est **déjà** dans la liste blanche du gate A.2 — il manquait juste le LIEN. Ajout d'un **lien texte tertiaire discret « Paramètres du compte »** (`t.pricingUpgrade.gererCompte`, FR/EN/ES) → `router.push('/(app)/parametres')`. **Le gate reste l'unique décideur et intact** (aucune touche à `_layout.tsx`/`ALWAYS_ALLOWED`/`isPaywalled`) : depuis parametres, la navbar « Accueil » vise `home` (non whitelisté) → gate → **rebond sur le paywall**. Aucun chemin (parametres ni profil) ne mène à un écran de contenu. **Portée : `pricing-upgrade.tsx` uniquement** (l'onboarding `pricing.tsx` n'est pas une souricière).
   - 🛡️ **Angle mort notif FERMÉ maintenant (web + natif), au lieu d'attendre la Phase 2** — puisqu'on ouvrait l'accès à `parametres`. `scheduleAffirmationNotif` (`parametres.tsx`) mettait l'affirmation réelle du cycle courant dans le corps de la notif ; pour un **non-abonné paywallé** c'était une fuite du contenu que le gate refuse à l'écran. Correctif : `const cycleContent = (await isPaywalled()) ? null : getCycleContent(...)` → repli sur `t.notifications.affirmationBody` (repli qui existait déjà). Source de vérité unique `isPaywalled()` : un essai (cycles 1-7) n'est pas paywallé → garde légitimement son affirmation. **Inerte sur web** (pas de notif locale récurrente) mais désormais **sûr aussi sur natif**. → Le point « FUITE DE CONTENU notification » listé en tête de Phase 2 est donc **déjà traité**.

→ ✅ **PHASE B TERMINÉE (2026-07-15).** Les 3 points (4 webhook / 5 firebase.ts / 6 souricière) sont livrés, `tsc` clean, app bootée. **Commit groupé en attente** (après tests utilisateur). Prochaine étape : **PHASE C** (Google Sign-In, volets C et D).

**PHASE C — Finir Google Sign-In (Priorité 2 restante)**
7. ✅ **~~Volet C — conversion anonyme via `linkWithPopup`~~** — **CODÉ (2026-07-15), à tester.** Bouton « Continuer avec Google » **au-dessus** du formulaire email+password (séparateur « ou », web only, visible seulement en conversion `mustCreateAccount`) sur `pricing-upgrade.tsx` **et** `pricing.tsx`. **Approche par DÉLÉGATION (zéro touche au chemin email, zéro copie du garde-fou)** : nouveau service `linkOrSignInWithGoogle()` (`services/googleAuth.ts`) rend le compte permanent (`linkWithPopup` → **même UID**, progression préservée), puis `handleGooglePurchase` **appelle `handlePurchase()`** — qui, voyant `needsAccount()=false`, saute le bloc compte et enchaîne SON garde-fou `hasActiveSubscription()` + `openCheckout`. **POPUP-ONLY** (pas de repli `linkWithRedirect` : au retour, `AuthBootstrap` route vers splash → casserait l'enchaînement Paddle) → popup bloqué = message `t.compte.googleBloque` + repli sur email. `auth/credential-already-in-use` / `email-already-in-use` → `GoogleAuthProvider.credentialFromError()` + `signInWithCredential` (`status:'switched'`) → l'utilisateur retombe sur SON compte, le garde-fou serveur le restaure sans re-paiement. i18n : 1 clé neuve `t.compte.googleBloque` (FR/EN/ES) ; le reste réutilise `t.auth.google`/`t.commun.ou`/`t.auth.googleErreur`/`t.auth.googleReseau`. `tsc` clean + app bootée.
7-bis. ✅ **Volet C VALIDÉ (tests 2026-07-15)** — (a) chemin email+password intact, comportement identique ; (b) Google au cycle 8 crée le compte + enchaîne Paddle → paiement → activation → home ; (c) garde-fou anti double-paiement couvre aussi le chemin Google (abonnement retrouvé, aucun paiement).
8. ✅ **~~Volet D — reconnexion Google~~** — **VALIDÉ (tests 2026-07-15)**, aucun code neuf (fourni par le volet B). Reconnexion Google (`auth.tsx` → `signInWithGoogle` → `finalizeSignIn`) restaure l'abonnement sur le **bon UID sans re-paiement** ; un compte **non-abonné** reste bloqué au paywall (sécurité OK). ⚠️ Repli `signInWithRedirect` (popup bloqué) OK en localhost ; **prod Safari/iPhone à revalider en Phase H** (dépend du point 24 : handler d'auth servi depuis `manifest-mind.app`).

→ ✅ **PHASE C TERMINÉE (2026-07-15).** **Google Sign-In complet** : connexion (volet B), conversion au cycle 8 via `linkWithPopup` (volet C), reconnexion (volet D). Prochaine étape : **PHASE D** (robustesse paiement).

**PHASE D — Robustesse & paiement**
9. ✅ **~~Rendre visibles les échecs de paiement~~** — **CODÉ (2026-07-15), à tester.** `openCheckout` renvoyait `Promise<void>` et avalait tout en `console.warn` → clic « payer » sans effet ni message. Désormais **`openCheckout` renvoie `CheckoutResult`** (`{ ok:true }` = **la modale s'est OUVERTE**, PAS « payé » ; `{ ok:false; reason }`). Les 2 appelants (`pricing.tsx` + `pricing-upgrade.tsx`, et donc le chemin Google qui délègue à `handlePurchase`) affichent un toast en cas d'échec. Helper pur `mapCheckoutError(reason, t.paiement)` → **2 messages** : `load` = actionnable (connexion/bloqueur de pub) ; `config`/`setup`/`open` = technique + support `{email}` (`SUPPORT_EMAIL`) ; `unsupported` (native) → `null` (pas de toast). **Fermeture volontaire** de la modale = **silence** (arrive après `ok:true`, via l'événement `checkout.closed` → `onClose`, non câblé). i18n `t.paiement.{erreurChargement,erreurTechnique}` (FR/EN/ES). `tsc` clean + app bootée.
    - 🚨 **Les `console.error`/`console.warn` de `paddle.ts` sont des DIAGNOSTICS INTENTIONNELS — NE PAS les retirer au nettoyage Phase F (point 19).** `config`/`setup` sont passés en `console.error` (une config `.env` cassée = 100 % des paiements échouent). Sans monitoring centralisé, ce sont le seul signal côté dev + le support est le canal réel côté prod.
    - 🔮 **Amélioration future (hors périmètre V1) : monitoring d'erreurs centralisé** (type Sentry) pour capter ces échecs en prod sans dépendre du support. Non retenu maintenant : ajoute une dépendance + config pour un besoin qui n'apparaît qu'avec du volume.
10. 🟠 Gérer le **remboursement lifetime** (accès jamais retiré : les `adjustment.*` tombent dans la branche `default` du webhook → ack 200 no-op). **⏳ PROCHAIN POINT — OBSERVER AVANT DE CODER (leçon du point 12)** : `adjustment.created` + `adjustment.updated` sont **cochés en sandbox depuis le 2026-07-16** → protocole : (1) achat lifetime sandbox sur un compte de test ; (2) remboursement complet depuis le dashboard Paddle ; (3) capturer les **payloads réels** (Paddle → Notifications) + la branche touchée dans Cloud Logging. **Questions ouvertes à trancher par l'observation** : `custom_data.firebase_uid` présent sur un adjustment ? (un adjustment est créé par le vendeur, pas par le checkout — probablement ABSENT → la **contingence recherche inverse du point 12 pourrait resservir ici**, via `paddle_customer_id` puisque lifetime = one-time sans `subscription_id`) · séquence des statuts (`pending_approval` → `approved` ?) · quel événement fait foi pour retirer l'accès. Périmètre : couvrir aussi les remboursements mensuel/annuel au passage.
11. ✅ **~~Protéger le double-clic d'achat~~** — **CODÉ (2026-07-15), à tester.** `submitting` ne couvrait que `convertOrSignIn` → pour un compte **déjà permanent** (bloc sauté), le bouton restait cliquable pendant `hasActiveSubscription` + le chargement de Paddle.js → plusieurs `openCheckout` en parallèle. **Verrou unifié** (remplace `submitting` + `googleBusy`) sur `pricing.tsx` + `pricing-upgrade.tsx` :
    - `busyRef` (**`useRef`, synchrone**) = anti-réentrance bulletproof (un double-tap dans le même tick, que `disabled` seul ne bloque pas) ; `busyKind` (`null|'confirm'|'google'`) = UI (désactive **les DEUX** boutons + « Chargement… » sur l'actif). Couvre **tout le flux, y compris le chargement de Paddle.js**.
    - **Cœur extrait en `runPurchase()` (sans verrou)** — appelé par les 2 boutons (`handlePurchase` « Confirmer » + `handleGooglePurchase`), qui tiennent le verrou via **`try/finally`**. Le garde-fou anti double-paiement reste en **UNE seule copie** (dans `runPurchase`). `handleGooglePurchase` tient le verrou pendant popup + checkout et appelle **directement `runPurchase`** (pas de dance release/re-acquire).
    - **`finally` garantit la réactivation** sur TOUT chemin de sortie (validation KO, `emailExists`, restauration, **échec du checkout point 9 `{ok:false}`**, exception) → **jamais de bouton mort**.
    - i18n `t.paiement.chargement` (FR/EN/ES). ⚠️ `auth.tsx` (reconnexion) garde son `googleBusy` local — **hors périmètre** (pas un flux d'achat). `tsc` clean + app bootée.
12. ✅ **~~Vérifier la désactivation à l'annulation~~** — **RÉSOLU (2026-07-16). Cause racine = CONFIG PADDLE (destination abonnée à 3 événements sur les 7 gérés), PAS le code. ZÉRO ligne changée. Test d'annulation VALIDÉ.**
    - **Ce que le test sandbox a prouvé (2026-07-16)** : (a) `custom_data.firebase_uid` **EST bien propagé par Paddle sur les événements `subscription.*`** (payload réel du `subscription.created` vérifié : `"custom_data": { "firebase_uid": "…" }`) — l'hypothèse « custom_data absent des événements lifecycle » était **FAUSSE** ; (b) le **VRAI problème** : la destination webhook SANDBOX n'était abonnée qu'à **3 événements** — **aucun `subscription.canceled` n'a jamais été ENVOYÉ** par Paddle. Le webhook n'a jamais eu tort : **il n'a jamais été convoqué**. Preuve dans le doc Firestore du test : jamais touché par l'annulation (`paddle_event_type` resté à `transaction.paid`, `updated_at` = heure du paiement).
    - **Correctif = une case à cocher, pas du code** : abonner la destination sandbox à la **liste canonique des 9 ÉVÉNEMENTS** (📋 détaillée au point 22 — la MÊME config devra être REFAITE en PROD, elle ne se transfère pas).
    - ✅ **Validation FAITE (2026-07-16, 08:36 UTC-4)** — nouvel abo de test annulé « **cancel immediately** » (⚠️ rappel : l'annulation standard ne fire `subscription.canceled` qu'en FIN de période ; au clic on ne reçoit qu'un `subscription.updated` status `active`). **Preuve Firestore** : `paddle_event_type: "subscription.canceled"` · `paddle_status: "canceled"` · **`subscription_active: false`** · `updated_at` = heure de l'annulation. Avant correctif, ce doc serait resté à `true` avec `paddle_event_type: "transaction.paid"` → accès à vie. **Bonus colmaté au passage : la fuite `past_due`** (carte qui échoue au renouvellement — événement pas coché non plus avant le correctif). ⚠️ Reste à **nettoyer le doc de test du 1ᵉʳ essai du 2026-07-16 matin** (annulation jamais livrée → `subscription_active: true` résiduel dans Firestore sandbox).
    - 📚 **LEÇON DE MÉTHODE (valable pour les points suivants, dont le 10)** : le diagnostic initial (« custom_data absent des événements lifecycle ») était plausible, argumenté… et **FAUX**. Le test sandbox l'a infirmé AVANT qu'une ligne ne soit écrite — le plan de recherche inverse, validé sur papier, aurait été du code inutile sur le chemin le plus critique de l'app. **Toujours TESTER/OBSERVER avant de coder** quand le correctif touche le webhook (argent + accès) : exiger le payload réel, le log réel, l'état Firestore réel — pas une hypothèse sur ce que Paddle « devrait » envoyer.
    - **📦 CONTINGENCE ARCHIVÉE — recherche inverse (plan validé mais NON codé, NE PAS coder sans déclencheur)**. Doctrine : webhook = argent + accès → aucun code superflu ; coder un fallback pour un cas qu'on ne sait plus produire = du risque sans bénéfice. **Fil de détente déjà en place** : la ligne `logger.warn('… missing custom_data.firebase_uid')` (`functions/src/index.ts` l. ~250) — si un jour elle apparaît dans Cloud Logging sur un événement légitime (ex. un `transaction.paid` de renouvellement sans custom_data, cas jamais observé), ressortir CE plan : résolution `custom_data.firebase_uid` → requête `users` par **`paddle_subscription_id`** → repli **`paddle_customer_id`** (champs déjà persistés à l'activation, auto-indexés) ; `limit(2)` anti-ambiguïté (2 matchs → ne rien écrire + log error, ne jamais deviner) ; **ack 200 même si irrésolu** (des 5xx répétés feraient marquer la destination défaillante par Paddle et la désactiveraient → tuerait AUSSI les activations) ; dériver AVANT de résoudre (pas de requête pour les no-op). 🔑 Finesse : `data.id` = **subscription id** pour les `subscription.*` mais **transaction id** pour les `transaction.*` (→ y utiliser `data.subscription_id`) — helper unique `extractSubscriptionId`, à réutiliser aussi dans la persistance (backfill de `paddle_subscription_id` par les événements `subscription.*`).
13. 🟠 **Prix : passer d'EUROS à DOLLARS + centraliser** — **DÉCISION (2026-07-15).** 🚨 **BUG signalé par l'audit : l'app affiche des EUROS alors que Paddle facture en DOLLARS** (prod ET sandbox déjà configurés en USD, devise unique quel que soit le pays). Prix officiels : **Lifetime 149 $ · Mensuel 12,99 $ · Annuel 79 $** (soit 6,58 $/mois si affiché mensualisé).
    - **Où c'est écrit en dur** : montants dans le JSX de `pricing.tsx` (l. ~400/427/452) **ET** `pricing-upgrade.tsx` (l. ~294/321/346) = `149€`, `6,58€`, `12,99€` (dupliqués sur 2 écrans). + i18n `t.pricing.plans.annuel.sousTitre` (« 79€/an · soit 0,21€/cycle ») et `t.pricing.bottomText` (« Moins de 0,50€… ») en **FR/EN/ES**. Les clés `unite` (`/mois`, `une fois`) sont **neutres** (OK).
    - **Approche retenue (à coder en Phase D)** : **Option A — dollars EN DUR, mais CENTRALISÉS** en une source unique (constante `PRICES` + helper `formatUSD(montant, lang)`), utilisée par les 2 écrans + interpolée dans l'i18n. **PAS de fetch dynamique Paddle** (Option B) : sur-dimensionné pour une devise unique + rares changements, et ça coupleraient l'affichage du prix à la dispo de Paddle.js (bloqueur de pub → prix invisibles, ironique vu le point 9). ⚠️ Contrepartie assumée : garder `PRICES` en phase avec Paddle manuellement (rappel : le **vrai** montant facturé s'affiche de toute façon dans l'overlay Paddle au checkout).
    - **Annuel** : garder le **« 6,58 $/mois » en tête** (argument commercial) MAIS avec sous-titre **« facturé 79 $/an »** bien visible (honnêteté / anti-litige). ⚠️ Rounding à corriger : 79/365 = 0,216 → **0,22 $/cycle** (le « 0,21 » actuel est faux).
    - **Format par langue** (⚠️ le `$` se place différemment) : **EN `$12.99`** (symbole avant, point décimal) · **FR `12,99 $`** · **ES `12,99 $`** (symbole après + espace, virgule décimale). Éviter `Intl.NumberFormat` pour USD (rend « 12,99 $US » en fr/es + support RN partiel) → **petit formateur manuel** piloté par la langue.

**PHASE E — Légal & conformité**
14. **CGU + confidentialité** : « 7 jours » → « 7 cycles », essai sans carte (FR/EN/ES). Publier. *(fichiers hors repo : `manifestmind.github.io/manifest-mind/`)*
15. 🟠 Ajouter l'**export de données** (droit RGPD de portabilité — au-delà de la suppression déjà faite).
16. 🟡 **Bannière consentement** cookies/traceurs (à qualifier).
17. Vérifier **mentions Paddle** (merchant of record, TVA) accessibles.

**PHASE F — Nettoyage avant prod**
18. Retirer **boutons debug** (`reset`, `⏭ cycle suivant`) de `home.tsx`.
19. Nettoyer **code mort** (logs non `__DEV__` dans `useShare.ts`/`auth.tsx`/`paddle.ts`, `icon-symbol`, dépendance `expo-av`, assets template `react-logo*`, mockups HTML racine, `handleRestore` vides). 🚨 **EXCEPTION `paddle.ts`** : les `console.error`/`console.warn` des échecs de checkout (point 9) sont des **diagnostics INTENTIONNELS à CONSERVER** — ne retirer QUE d'éventuels logs debug non liés au paiement.
20. Corriger `app.json` (**plugin `expo-font` déclaré en double**).
21. Vérifier `DEBUG_SKIP_PAYWALL = false`.

**PHASE G — Config production**
22. Paddle **sandbox → prod** (`EXPO_PUBLIC_PADDLE_SANDBOX=false` — ⚠️ actuellement `true` dans `.env`, un build prod encaisserait en sandbox ; produits/prix/webhook prod).
    - 🚨🚨 **CONFIGURER LES ÉVÉNEMENTS DE LA DESTINATION WEBHOOK EN PRODUCTION (pas seulement l'URL !)** — la config des événements d'une destination Paddle est **PROPRE À CHAQUE ENVIRONNEMENT** : cocher en sandbox ne coche RIEN en prod. Cocher exactement les mêmes événements qu'en sandbox (liste ci-dessous). **Sans ça, les annulations ne seraient jamais reçues → les résiliés garderaient l'accès À VIE = fuite de revenu réelle avec de VRAIS clients.** (Leçon du point 12, 2026-07-16 : en sandbox, seuls 3 événements étaient cochés → `subscription.canceled` jamais envoyé, le webhook jamais convoqué.) ⚠️ Le « 7 events » noté pour la prod en juin est à **RE-VÉRIFIER case par case** contre cette liste.
    - **📋 LISTE CANONIQUE — 9 événements à cocher (identique sandbox et prod, à recopier tel quel le jour J) :**
      - **5 OBLIGATOIRES** (sans eux le système sait activer mais jamais désactiver) :
        1. `transaction.paid` → active
        2. `subscription.activated` → active (redondance volontaire)
        3. `subscription.canceled` → **désactive** (la case manquante du point 12)
        4. `subscription.past_due` → **désactive** (sans lui : échec de renouvellement = accès à vie)
        5. `subscription.updated` → dérive du statut (`active`/`trialing` → true, sinon false ; une annulation programmée fin de période garde `status:'active'` → accès conservé jusqu'au terme, voulu)
      - **4 UTILES** :
        6. `subscription.created` → no-op, trace dans les logs
        7. `transaction.payment_failed` → no-op, trace support (client qui galère à payer)
        8. `adjustment.created` · 9. `adjustment.updated` → **préparation point 10 remboursements** (un remboursement Paddle Billing = un *adjustment* `action:'refund'`, créé puis approuvé). Aujourd'hui : no-op inoffensif (branche `default` → ack 200) ; cochés dès maintenant pour disposer de vrais payloads d'exemple au moment de coder le point 10.
      - **NE PAS cocher le reste** (bruit) : autres `transaction.*` (`created`/`ready`/`billed`/`completed`/`updated`…), `customer.*`/`address.*`/`business.*`, `product.*`/`price.*`/`discount.*`, `payout.*`/`report.*`, `subscription.imported`/`trialing`/`paused`/`resumed` (pas de pause offerte en V1 — à revisiter seulement si un jour pause manuelle au dashboard).
23. ✅ **~~Approuver le domaine `manifest-mind.app` par Paddle~~** — **FAIT (2026-07-15)**. Paddle a approuvé le domaine (« vous pouvez commencer à collecter les paiements dès que vous serez prêt »). **Le seul délai externe de la feuille de route est levé** — tout le reste ne dépend plus que de nous.
23-bis. 🆕 **Détails de paiement Paddle — compte bancaire pour RECEVOIR les fonds.** Sans ça, on peut encaisser côté client mais Paddle **ne peut pas reverser**. Dashboard Paddle → *Business / Payout details* → compte bancaire + infos fiscales/entreprise. **À finaliser une fois le catalogue prod configuré (point 22).** Peut demander une vérification (prévoir un peu de marge).
24. **Config Google prod** : `manifest-mind.app` aux domaines Firebase ; **servir le handler auth depuis le domaine** (sinon `signInWithRedirect` cassé sur Safari/iPhone à cause des cookies tiers) ; **publier l'écran de consentement OAuth**.
    - **🔑 Restreindre la clé API web** (déplacée du point 5 ; protège le quota/facture, PAS les données) — Console Google Cloud → projet `manifestmind` → **APIs & Services → Credentials** → clé « Browser key (auto created by Firebase) » (`AIzaSyDqKc…`) :
      1. **Application restrictions → Websites (HTTP referrers)** — ajouter **TOUS** les référents sinon l'auth casse : `manifest-mind.app/*`, `*.manifest-mind.app/*`, **`manifestmind.firebaseapp.com/*`** (⚠️ domaine du handler d'auth — popup/redirect Google + magic link ; l'oublier casse la connexion), `manifestmind.web.app/*` (si Hosting par défaut), `localhost/*` + `localhost:*/*` (dev) — ou **clé de dev séparée**.
      2. **API restrictions → Restrict key** — ne cocher que : **Identity Toolkit API**, **Token Service API**, **Cloud Firestore API**, **Firebase Installations API**, **Cloud Storage** (l'app appelle `getStorage`).
      3. **Save** → propagation ~5 min → **tester sur le vrai domaine** : login email+password, popup Google, magic link RGPD, lecture Firestore.
      - ⚠️ **Phase 2 native** : la restriction par référent bloquerait l'app native (pas de referrer) → **clé distincte** avec restriction Android (SHA-256) / iOS (bundle ID).

**PHASE H — PWA & déploiement**
25. **PWA** (manifest, service worker, icônes 192/512/maskable, robots.txt).
26. Build : `npx expo export --platform web`.
27. Déployer sur `manifest-mind.app`.
28. **Tests finaux réels** (vrai paiement, multi-navigateurs dont **Safari/iPhone**).
    - 📧 **Vérifier le destinataire du reçu Paddle.** Au **premier VRAI paiement en prod**, confirmer que le **reçu/la confirmation Paddle part bien au CLIENT** (e-mail saisi/utilisé au checkout), **pas à moi**. ⚠️ En **sandbox**, les confirmations arrivent sur MON e-mail vendeur — **comportement normal du sandbox** ; l'e-mail client est bien enregistré sur la transaction. À revalider en prod car un reçu manquant côté client = source de litiges/chargebacks.
→ 🚀 **PUBLICATION WEB**

**Notes :** Phases **A, B, C** ✅ faites ; points **9 + 11** (D) ✅ codés, validés, commités. **⚠️ L'ORDRE D'EXÉCUTION du reste = le bloc « 🔢 ORDRE D'EXÉCUTION — RÉORGANISÉ » EN TÊTE de cette roadmap** (D → E → PWA → **tests mobiles tunnel** → F nettoyage → G prod → build/deploy → 🚀), et NON la lecture linéaire A→H. **Boutons debug conservés jusqu'à l'étape 5 (après tests mobiles).** Domaine Paddle approuvé (23 ✅). **Aucun déploiement public avant que tout soit testé ET nettoyé.** Après lancement web → **PHASE 2 stores**.

---

### 🔐 RECONNEXION DIRECTE email + mot de passe — **CODÉ (2026-07-15), à tester**

**Vision livrée :** un utilisateur qui revient tape **e-mail + mot de passe** et entre **directement**, sans boîte mail ni message confus. La reconnexion par magic link (qui obligeait à quitter l'app pour sa boîte mail) est **retirée de l'UI** de `auth.tsx`.

**✅ Test décisif validé (2026-07-15) — le PIVOT de toute la stratégie :** `sendPasswordResetEmail()` **POSE bien un mot de passe** sur un compte créé par magic link (donc sans mot de passe). Testé sur `duboislyana@hotmail.fr` : e-mail reçu → mot de passe défini → `signInWithPassword` OK → **UID INCHANGÉ `385h51XiwuRw8Akbq3SQmsmipJB2`**. Les anciens comptes magic-link ne sont donc PAS enfermés dehors. (Test console via REST Identity Toolkit ; le cas Google-only n'a pas été testé — décision : inutile, cf. risque 4.)

**Ce qui a été codé :**
- **`auth.tsx`** devient l'**écran de reconnexion** (plus de création) : titre reformulé (« Ravi de te revoir »), **Google bien visible** (inchangé), **e-mail + mot de passe + « Se connecter »** (`signInWithEmailAndPassword` → `finalizeSignIn`), lien **« Mot de passe oublié ou jamais défini ? »** (`sendPasswordResetEmail` — le mécanisme validé ci-dessus). **Message d'erreur honnête unique** (`t.auth.erreurIdentifiants`) car la protection anti-énumération regroupe mauvais mot de passe / e-mail inconnu / Google-only sous `auth/invalid-credential`. **Limiteur anti-brute-force conservé** (3 échecs → cooldown 30 s) + gestion `auth/too-many-requests`. **UI magic-link retirée**, mais `signInWithEmailAndPassword` en direct (PAS `convertOrSignIn` : sémantique de reconnexion, pas de conversion).
- **Magic link CONSERVÉ pour le RGPD** : `parametres.sendReauthLink()` (ré-auth `requires-recent-login` avant suppression) + `DeepLinkHandler` (consommation) **non touchés**. La machinerie reste 100 % fonctionnelle.
- **BUG 2 corrigé** (formulaire de conversion « Créer ton compte pour continuer ») : saisir l'e-mail d'un compte **déjà existant** affichait « mot de passe incorrect » — **trompeur** pour un compte magic-link qui n'a jamais eu de mot de passe. Désormais : `authConversion.ts` renvoie un code dédié **`mm/email-exists-signin-failed`** ; les deux écrans de prix affichent un **message honnête inline** (`t.compte.errEmailDejaUtilise` = « Cet e-mail a déjà un compte. Connecte-toi pour retrouver ta progression. ») + un **bouton « Me reconnecter »** → `auth.tsx`. Les autres erreurs restent des toasts.
- **Point 7** : ligne de rappel sous le champ mot de passe du formulaire cycle 8 (`t.compte.rappelReconnexion` : « Retiens bien ce mot de passe : il te servira à te reconnecter »), sur `pricing.tsx` ET `pricing-upgrade.tsx`.
- **i18n** : nouvelles clés `t.auth.*` (passwordPlaceholder, seConnecter, motDePasseOublie, emailManquantReset, resetEnvoye, erreurIdentifiants, erreurTropDeTentatives) + `t.compte.rappelReconnexion` / `boutonReconnexion`, en **FR/EN/ES**. `t.auth.titre`/`sousTitre` reformulés en reconnexion.

**Fichiers touchés :** `app/(onboarding)/auth.tsx`, `services/authConversion.ts`, `app/(app)/pricing-upgrade.tsx`, `app/(onboarding)/pricing.tsx`, `src/i18n/translations.ts`. `tsc --noEmit` **clean**.

**🚨 4 RISQUES SIGNALÉS — à ne pas perdre :**
1. **Compte anonyme orphelin.** Après `signInWithEmailAndPassword`, l'anonyme de l'essai est abandonné (non supprimé) dans Firebase Auth. **Sans conséquence** (progression = locale, Option A), juste un peu de bruit côté Auth. **Acceptable.**
2. **Course paywall à la reconnexion sur le MÊME navigateur** (préexistante, PAS introduite par ce chantier) : si un abonné se reconnecte là où `current_cycle ≥ 8` est resté local, le gate de `home` pourrait lire `subscription_active` **avant** que `useSubscriptionSync` l'ait restauré depuis Firestore. **Filet existant** : `finalizeSignIn` route vers `splash` (tap manuel « Commencer ») → le listener a le temps de restaurer. À surveiller, non dégradé.
3. **Branche NATIVE de `pricing.tsx` (≈ ligne 214)** pousse vers `auth.tsx` en attendant une **création** de compte. `auth.tsx` étant devenu login-only, ce chemin **suppose une création** qu'un écran de login ne fait pas. **Inerte en Phase 1** (`STORES_ACTIVE=false` → jamais atteint) ; **à retraiter en PHASE 2** avec RevenueCat. **Pas une régression web.**
4. **Compte Google-only + « mot de passe oublié »** : cas non testé (décision assumée). Si `sendPasswordResetEmail` reste silencieux pour un Google-only, l'utilisateur n'est **pas bloqué** : le message honnête l'oriente déjà vers le **bouton Google**. **Couvert par conception.**

---

### 📦 ARCHIVE — détail technique du travail DÉJÀ RÉALISÉ

> Historique et justifications des décisions (ne pas re-débattre sans raison). Les « ⏳ Reste à faire » ci-dessous sont désormais cadrés par la feuille de route ci-dessus.

#### 🚨🚨 NE PAS TOUCHER AUX BOUTONS DE TEST DE `home.tsx` AVANT LA PHASE F 🚨🚨

Les deux boutons debug de `home.tsx` — **« reset »** et **« ⏭ cycle suivant »** — sont **VOLONTAIREMENT CONSERVÉS**. Ils sont **nécessaires pour tester** A.3 et **toutes les phases suivantes** (B, C, D…) : sans eux, impossible de se placer à un cycle donné pour vérifier un gate, un paywall ou un paiement.

**Retrait UNIQUEMENT en PHASE F** (nettoyage final, juste avant la construction / le déploiement) — cf. point 18 de la feuille de route.

⚠️ **Aucune session ne doit les supprimer « par zèle » en croyant bien faire**, même en croisant une remarque du type « retirer les boutons debug ». Ce n'est PAS une omission, c'est une décision. Tant que la Phase F n'est pas atteinte, ils restent.

#### 📌 INCIDENT À CORRIGER EN PHASE F — casse du nom de `claude_master.md`

Le fichier est **suivi par git sous `claude_master.md` (minuscules)** mais a été édité plusieurs fois sous **`CLAUDE_MASTER.md` (majuscules)**. Windows ne distingue pas les deux casses, **git si**.

- **Conséquence observée le 2026-07-14** : un `git add CLAUDE_MASTER.md` n'a matché **aucun chemin suivi** → la mise à jour du doc est **sortie du commit silencieusement** (rattrapée dans un commit suivant, mais l'erreur était invisible).
- **Risque réel** : sur un **déploiement / clone Linux** (casse significative), ce seraient **deux fichiers distincts**.
- **Correctif (Phase F)** : `git mv` en **forçant la casse** pour fixer un nom unique, puis committer le renommage.

#### ✅ A.3 — Essai gratuit renouvelable — **TRANCHÉ ET FAIT (2026-07-14)**

##### La décision : Option 1 — assumer la fuite, réduire l'attrait

**Le constat structurant (ne pas le re-débattre) :** la mémoire de l'essai est **locale** (`current_cycle` en AsyncStorage). Tout ce qui efface ce stockage rend les 7 cycles. On peut condamner les boutons de l'app ; on ne condamnera **jamais** le bouton « Effacer les données de navigation » du navigateur. **Tant que la mémoire de l'essai vit chez le client, elle est effaçable.**

**Et on ne peut PAS la déplacer côté serveur sans exiger une identité réelle.** L'essai démarre par un `signInAnonymously` : l'UID est stable (il survit même à `AsyncStorage.clear()`, la session Firebase vivant dans IndexedDB), mais **rien n'empêche l'utilisateur de le jeter** — effacer les données du site détruit IndexedDB, `AuthBootstrap` recrée un anonyme neuf, vierge. Les comptes anonymes sont **gratuits et illimités** : ce n'est pas une identité, c'est un **jeton jetable**. Un serveur ne peut donc rien mémoriser de durable à son sujet.

→ Il n'y avait que **deux** options réelles (le fingerprinting d'appareil est écarté : fragile, faux positifs qui bloquent des innocents, délicat au RGPD) :
- **Exiger un compte (e-mail/Google) pour DÉMARRER l'essai** → faille réellement fermée, mais la création de compte passe du cycle 8 au cycle 1.
- **Option 1 — assumer la fuite** → retenue.

**Le raisonnement (2026-07-14) :** le **zéro-friction à l'entrée est un pilier du modèle** — on démarre ses 7 cycles immédiatement, sans compte ni carte. Et qui vide son navigateur pour rejouer l'essai **perd toute sa progression** (journal, vision board, points, historique) : il ne vole pas 7 cycles, il les **rachète au prix de tout ce qu'il avait construit**. Il peut recommencer indéfiniment, **il ne verra jamais le cycle 8** — il rejoue une démo en boucle, il ne consomme jamais le produit. **Ce n'est pas un abonné perdu : c'est quelqu'un qui n'allait pas payer.** À l'inverse, exiger un compte au cycle 1 ferait payer un prix à **100 % des visiteurs** (dont ceux qui allaient s'abonner) pour empêcher un abus qui ne rapporte rien à celui qui le commet. Mauvais échange sur un produit qui doit d'abord convaincre.

##### 🔓 Fuites EXPLICITEMENT ACCEPTÉES — ce ne sont PAS des bugs

**Ne pas les « redécouvrir » plus tard et se précipiter pour les corriger.** Elles sont la conséquence assumée de l'Option 1 :
- **Vidage des données de navigation / du site** (détruit AsyncStorage **et** IndexedDB → nouvel anonyme, essai neuf).
- **Fenêtre de navigation privée.**
- **Autre navigateur / autre appareil.**
- **« Supprimer mon compte »** (`parametres.tsx` → `AsyncStorage.clear()`) : **NON BLOQUABLE** — obligation RGPD, et de toute façon fonctionnellement équivalent au vidage du navigateur.

##### Ce qui a été corrigé — le seul chemin utilisateur réel

Après revue de **tous** les chemins accessibles à un vrai utilisateur, **un seul** rembobinait `current_cycle` : le bouton **« Réinitialiser ma progression »** de `profil.tsx`. (Vérifié au passage : **`startFreeTrial()` de `pricing.tsx` ne touche PAS `current_cycle`** — repasser par l'onboarding et recliquer « essai gratuit », y compris via « Nouveau compte » de la modale retour-abonné, laisse l'utilisateur à son cycle, donc toujours paywallé. Ce chemin ne renouvelle rien.)

⚠️ Le problème n'était **pas seulement au cycle 8** : un utilisateur au cycle 3 qui réinitialise repart au cycle 1 et récupère **7 cycles neufs** alors qu'il n'en avait consommé que 3 → boucle infinie. La restriction devait donc viser **tout non-abonné**, pas seulement les paywallés.

**Correctif — le bouton est réservé aux ABONNÉS :**
- **`services/access.ts`** — ajout de **`isSubscriber()`**. 🚨 **CE N'EST PAS L'INVERSE DE `isPaywalled()`** : il y a **TROIS** états, pas deux. Un utilisateur d'essai au cycle 3 n'est **pas paywallé** MAIS n'est **pas abonné**. Utiliser `!isPaywalled()` comme preuve d'abonnement rouvrirait la faille. `isSubscriber()` est **fail-CLOSED** (erreur de lecture → `false`), à l'inverse d'`isPaywalled()` qui est fail-open : se tromper dans le sens permissif rouvrirait la faille, tandis qu'un abonné ne perd qu'une fonction annexe le temps d'un rechargement.
- **`profil.tsx`** — la ligne « Recommencer » est **MASQUÉE** (et non désactivée) pour un non-abonné, comme « Restaurer un achat » l'est sur web. Masquée plutôt que grisée : inutile de mettre l'idée de réinitialiser dans la tête d'un utilisateur d'essai. L'état d'abonnement est relu **à chaque focus** (l'abonnement peut arriver pendant la vie de l'écran).
- **`confirmReset()`** — **revérifie `isSubscriber()` à l'exécution** et sort sans rien faire sinon. Ceinture et bretelles : **masquer un bouton n'est pas une protection, c'est de la présentation.**

**Justification produit (elle tient sans l'argument sécurité) :** recommencer le voyage de 365 jours n'a de sens que pour un abonné au long cours qui a parcouru une vraie distance. Pendant un essai de 7 cycles, il n'y a rien à effacer. C'est une fonctionnalité d'abonné ; le fait que ça ferme aussi la faille est un bonus, pas la justification.

#### ✅ A.1 — Règles Firestore versionnées — **TERMINÉ (2026-07-14)**

- **`firestore.rules`** créé à la racine + `firebase.json` déclare `"firestore": { "rules": "firestore.rules" }`. **Volontairement PAS de clé `indexes`** : ajouter un `firestore.indexes.json` vide ferait courir le risque qu'un déploiement supprime des index existants. Aucun index utilisé aujourd'hui.
- Les règles publiées en console (2026-07-13) ont été **récupérées via l'API Rules** et versionnées à l'identique, à une clarification près : `allow write: if false` → **`allow create, update: if false`**. ⚠️ **Sémantiquement IDENTIQUE**, mais `write` recouvre create + update + **delete** en Firestore et se relisait donc comme une contradiction avec la règle `delete` juste au-dessus. Sans effet réel (les règles s'additionnent : un `allow … : if false` n'accorde rien mais ne refuse rien non plus — c'est bien la règle `delete` qui accorde la suppression).
- **Périmètre client vérifié exhaustivement** — le client ne fait QUE 3 opérations Firestore, toutes sur son propre doc : `onSnapshot` (`useSubscriptionSync.ts`), `getDoc` (`services/subscription.ts`), `deleteDoc` (`parametres.tsx`). **Aucune écriture client nulle part.** Interdire create/update ne casse donc rien. Le webhook écrit via l'**Admin SDK**, qui **contourne** les règles par conception.
- **Déploiement** : `npx firebase deploy --only firestore:rules` (le `--only` est essentiel — sans lui, `firebase deploy` redéploierait aussi `paddleWebhook`).
- **Validé au Rules Playground (2026-07-14)** : `get` sur son doc ✅ Allowed · `update` (`subscription_active: true`) 🔴 **Denied** ← *l'abonnement n'est pas forgeable depuis le navigateur* · `delete` sur son doc ✅ Allowed.

#### ✅ A.2 — Gate de périmètre sur TOUS les écrans de contenu — **TERMINÉ (2026-07-14)**

Avant : `(app)/_layout.tsx` était un `<Stack>` nu et seul `home.tsx` portait le gate → `/affirmation`, `/journal`, etc. étaient **joignables par URL directe** sans aucune vérification d'abonnement.

- **`services/access.ts`** (nouveau) — **`isPaywalled()` = SOURCE DE VÉRITÉ UNIQUE** de la règle (`cycle > FREE_CYCLES && !subscription_active`, court-circuitée par `DEBUG_SKIP_PAYWALL`). **Ne JAMAIS re-dupliquer cette règle ailleurs** : deux copies d'une règle de sécurité finissent par diverger.
- **`(app)/_layout.tsx`** — gate de périmètre, vérifié à chaque changement de `usePathname`. **LISTE BLANCHE** (`ALWAYS_ALLOWED`), pas liste noire : tout écran ajouté demain est **protégé d'office**, et un oubli se voit au premier test (écran bloqué) au lieu de rester une faille invisible. Le `<Stack>` reste **toujours monté** (le démonter relancerait les écrans à zéro) ; pendant le contrôle, un **voile opaque `#F0EAE0`** le recouvre → aucun flash de contenu payant avant la redirection.
- **`home.tsx`** — sa copie locale de la règle remplacée par `await isPaywalled()`.

**🚨 DOUBLE GATE — les deux points d'application sont complémentaires, ne pas en supprimer un :**
- **Layout = le PÉRIMÈTRE** (accès par URL directe).
- **`home` = la TRANSITION.** Le passage au cycle 8 ne vient PAS d'une navigation : c'est `home` qui fait avancer `current_cycle` quand minuit est passé. Au moment où le layout a vérifié la route, le cycle valait **encore 7** — il a laissé passer, à raison. Seul le gate de `home`, placé **après** l'incrément, attrape la bascule.

**🚨 ÉCRANS QUI DOIVENT RESTER HORS DU GATE** (`ALWAYS_ALLOWED`) :
- **`activation`** ← **LE PIÈGE**. L'utilisateur **vient de payer** et `subscription_active` n'est, **par construction**, pas encore `true` (c'est exactement ce que l'écran attend en polling). Le gater renverrait **tout nouveau payeur** au paywall. C'est le seul écran où l'état « cycle > 7 + pas d'abonnement » est **normal**.
- **`pricing-upgrade`** — le paywall lui-même → le gater = **boucle de redirection infinie**.
- **`parametres`** (RGPD : suppression de compte, déconnexion, langue), **`profil`**, **`splash`**, **`name`**.

**FAIL-OPEN assumé** : lecture AsyncStorage en échec ou valeur corrompue → `isPaywalled()` renvoie `false` (accès permis). Un pépin de stockage ne doit **jamais** enfermer dehors un abonné qui a payé. Même arbitrage que `hasActiveSubscription()`.

**Portée honnête** : A.2 ferme l'accès **opportuniste** (URL directe, onglet resté ouvert). Les 365 jours de contenu (`assets/content/content_*.json`) restent **embarqués dans le bundle JS** et sont extractibles par quelqu'un de motivé. Une vraie protection supposerait de servir le contenu depuis le serveur contre vérification d'abonnement — chantier d'une autre ampleur, **non retenu** (hors périmètre, non justifié ici).

**Tests validés (2026-07-14)** : activation NON gatée (payeur passe) · paiement sandbox complet OK · URL directe bloquée pour les 7 écrans de contenu · parametres accessible même paywallé · cycles 1-7 intacts · blocage au cycle 8.

**🔧 CORRECTIF GATE (2026-07-15) — `usePathname` → `useSegments`, 4 SORTIES DÉBLOQUÉES.** Le gate lisait `usePathname()`, qui **n'expose pas le groupe** de routes (les parenthèses n'apparaissent pas dans l'URL : `(app)/journal` → `/journal` ; `(onboarding)/auth` → `/auth`). Impossible d'y distinguer un écran `(app)` d'un écran `(onboarding)`. Or ce layout **reste monté** quand on quitte `(app)` et son effet se redéclenche avec la route de destination : une sortie vers `(onboarding)` était vue comme « écran inconnu → protégé » → `isPaywalled()` → **renvoi sur le paywall au moment même où l'utilisateur tentait de sortir**. Résultat : **4 chemins coincés derrière le paywall** — les deux liens « Me reconnecter » (`pricing`/`pricing-upgrade` → `auth`), la **déconnexion** et la **suppression de compte RGPD** (`parametres` → `welcome`). Correctif : lire `useSegments()` (`['(app)','pricing-upgrade']` vs `['(onboarding)','auth']`) et **ne rien décider hors du groupe `(app)`** (`if (group !== '(app)') { setChecking(false); return; }`). L'effet porte sur deux chaînes dérivées (`group`, `screen`) et non sur le tableau `segments` (nouvelle référence à chaque rendu → sinon relance en boucle). La liste blanche ne décrit QUE `(app)` : tout autre groupe en est absent **par nature**, pas par oubli.

#### ✅ PRIORITÉ 1 — Finition du modèle d'accès — **TERMINÉE (2026-07-13)**

> Les 3 points ci-dessous sont livrés et testés.
1. ✅ **~~Redirection automatique dans l'app après paiement~~** — **FAIT (2026-07-13)**. Écran `app/(app)/activation.tsx` : après `checkout.completed`, `pricing-upgrade.tsx` route vers `/(app)/activation`, qui poll `subscription_active` dans AsyncStorage (la MÊME clé que relit le gate de `home.tsx` → zéro course) puis route vers home. Affichage min. 2,5 s + 1,2 s de respiration. Timeout 30 s → écran « Encore un instant » + boutons Réessayer / Continuer (jamais de loader infini). Abandon de paiement non géré volontairement (on reste sur la page des prix).
   - Deux fixes dans `services/paddle.ts` au passage : (a) `Paddle.Checkout.close()` sur `checkout.completed` — sans `successUrl`, l'overlay Paddle restait affiché PAR-DESSUS l'écran d'activation, qui était monté mais invisible ; (b) `Paddle.Setup()` n'étant appelable qu'une fois par chargement de page, son `eventCallback` est désormais un **dispatcher stable** qui relit les handlers du checkout courant (variable de module `currentHandlers`) — avant, les callbacks d'un 2e `openCheckout` étaient silencieusement ignorés.
2. ✅ **~~Phase 4 — wording « 7 cycles gratuits »~~** — **RIEN À FAIRE côté interface (vérifié 2026-07-13)**. `translations.ts` ne contient AUCUNE mention « 7 jours / 7 days / 7 días » : le wording de l'essai est déjà 100 % en cycles dans les 3 langues (`pricing.plans.free.*`, `pricingUpgrade.freemium*`). Les « jour / day / día » restants sont légitimes (journal, actions *quotidiennes* — un cycle par jour, c'est exact — et « prochain cycle à minuit »).
   - 🚨 **RESTE À FAIRE — CGU** : les documents légaux contiennent encore **« 7 jours gratuits »** (3 mentions d'après l'utilisateur), à remplacer par **« 7 cycles gratuits »**, en **FR/EN/ES**. Ces fichiers HTML **ne sont pas dans ce repo** — ils sont hébergés sur `manifestmind.github.io/manifest-mind/` (URLs dans `t.legal.*`). ⚠️ **À traiter dans la session dédiée aux documents légaux (Priorité 3) — le rappeler à l'utilisateur à ce moment-là.**
   - Écart mineur non traité : « **essai sans carte bancaire** » n'est mentionné sur aucun écran alors que c'est le modèle réel (argument de conversion). Candidat : `pricing.plans.free.sousTitre`.
3. ✅ **~~Phase 5 — reconnexion (minimum vital)~~** — **FAIT (2026-07-13)**. Diagnostic : le champ email + `sendSignInLinkToEmail` + le repli `window.prompt` (lien ouvert sur un autre navigateur) existaient déjà dans `auth.tsx` / `_layout.tsx` — mais **`auth.tsx` était devenu INATTEIGNABLE sur web** : depuis que le plan payant fait la conversion inline + Paddle, plus aucun écran ne routait vers lui (seules références restantes : la branche native de `pricing.tsx` + les redirections d'erreur du `DeepLinkHandler`). Un abonné revenant sur un appareil neuf n'avait donc aucune porte d'entrée.
   - Correctif minimal : lien **« J'ai déjà un compte → Me reconnecter »** sur `pricing.tsx` (sous le CTA) → `push` vers `auth.tsx`. Clé i18n `pricing.dejaCompte` (FR/EN/ES). Chaîne : email → magic link → `DeepLinkHandler` → `signInWithEmailLink` → **même UID** → `useSubscriptionSync` repose `subscription_active` depuis Firestore.
   - Rappel modèle : la progression est **locale** (Option A) → sur un appareil neuf elle repart au cycle 1, même compte, même abonnement. (Sur le MÊME navigateur, elle est conservée : testé, retour au cycle 13.)

#### PRIORITÉ 2 — Google Sign-In + sécurité des accès

##### ✅ Volet 4 — Garde-fou « piège de l'anonyme » + reconnexion sécurisée — **TERMINÉ (2026-07-13)**

Deux failles d'accès corrigées, toutes deux validées par les tests.

**a) Marqueur d'appareil + question au clic « essai gratuit »**
- `useSubscriptionSync` pose `had_subscription='true'` dès qu'il constate un abonnement actif. **Jamais retiré** — ni par lui, ni par la déconnexion (absent du `multiRemove` de `parametres.tsx`). Seul « Supprimer mon compte » (`AsyncStorage.clear()`) l'efface.
- `pricing.tsx` : si le marqueur est présent au clic « essai gratuit », **modale** (et non `Alert` — `Alert.alert` **n'affiche RIEN sur React Native Web**) « Bon retour parmi nous ✨ » → « Retrouver mon espace » (→ `auth.tsx`) ou « Nouveau compte ». Clés `pricing.retourAbonne.*` (FR/EN/ES). Un vrai nouvel utilisateur (pas de marqueur) ne la voit jamais.
- ⚠️ Limite assumée : le marqueur est **local**. Sur un téléphone réellement neuf il n'existe pas — impossible de faire autrement, l'app n'a aucune identité avant authentification. Les autres filets couvrent ce cas (liens de reconnexion + garde-fou serveur).

**b) 🚨 BUG CORRIGÉ — « Nouveau compte » héritait du compte payant**
`startFreeTrial()` ne créait un anonyme que `if (!auth.currentUser)`. Or **la session Firebase vit dans IndexedDB** et survit au reset comme au `AsyncStorage.clear()` : un compte permanent connecté était donc **réutilisé** → l'utilisateur héritait de l'abonnement (accès cycles 8+) et se retrouvait littéralement DANS le compte de l'abonné (appareil prêté). Correctif : `signOut()` si le compte courant est **permanent**, purge explicite de `subscription_active`, puis nouvel anonyme.

**c) 🚨 GARDE-FOU SERVEUR anti double-paiement** (`services/subscription.ts`)
`hasActiveSubscription(uid)` (`getDoc` sur `users/{uid}`) est appelé dans les DEUX `handlePurchase`, **après authentification et AVANT `openCheckout`**. `convertOrSignIn` peut reconnecter un utilisateur EXISTANT (email déjà pris → `signIn`) : sans cette vérification, un abonné revenu sur un appareil neuf se voyait présenter Paddle et **payait une 2e fois**. Si déjà abonné → `activation?restore=1` (« ✅ Abonnement retrouvé »), zéro paiement. Lecture Firestore en échec → `false` (on laisse payer : hors ligne le checkout échouerait de toute façon).

**d) 🚨 PURGE À TOUT CHANGEMENT D'IDENTITÉ** (`useSubscriptionSync`)
Le `DeepLinkHandler` ne purgeait rien : un `subscription_active='true'` résiduel (autre compte) était lu par le gate **avant l'arrivée du 1er snapshot** → accès accordé à tort. Pire, **hors ligne** (le handler d'erreur ne touche volontairement à rien) la clé résiduelle survivait **indéfiniment** sur un compte n'ayant jamais payé. Correctif centralisé dans le listener (donc valable pour Google/Apple sans code neuf) : à tout **changement d'UID** (clé `sub_sync_uid`), `subscription_active` est effacé **avant** l'attachement du listener. Purge **uniquement si l'UID change** — sinon un simple rechargement ferait rebondir un abonné légitime sur le paywall. La purge est **séquencée avant** l'attachement, sinon son `removeItem` pouvait s'exécuter après le 1er snapshot et effacer un `true` légitime.

**e) Ergonomie des écrans de prix**
- Lien **« J'ai déjà un abonnement — Me reconnecter »** (bouton bordé violet, pleine largeur) **sous le CTA**, sur les **DEUX** écrans : `pricing.tsx` ET `pricing-upgrade.tsx` (le paywall du cycle 8 — c'est là qu'atterrit réellement l'abonné bloqué, il n'avait aucune sortie).
- **« Restaurer un achat » masqué sur web** (`Platform.OS !== 'web'`) : concept de store natif (RevenueCat, Phase 2), sans effet sur web où la source de vérité est Firestore. Code conservé pour le pipeline natif.

##### ✅ Volet B — Connexion Google — **TERMINÉ & VALIDÉ (2026-07-14)**
- `services/googleAuth.ts` : `signInWithPopup` + `prompt: 'select_account'` (sans ça, Google reconnecte silencieusement au dernier compte → mauvais UID → abonnement introuvable). **Discrimination des erreurs** : popup **bloqué par le navigateur** (`auth/popup-blocked`, `auth/operation-not-supported-in-environment`) → repli `signInWithRedirect` ; popup **fermé par l'utilisateur** (`auth/popup-closed-by-user`, `auth/cancelled-popup-request`) → abandon **silencieux** (le renvoyer chez Google serait absurde).
- `services/authSession.ts` : `finalizeSignIn()` extrait du `DeepLinkHandler` — init des clés de cycle **si absentes uniquement** (ne JAMAIS écraser une progression), `onboarding_completed`, route splash. **Partagé magic link + Google** (+ Apple demain).
- `_layout.tsx` : `AnonymousBootstrap` → **`AuthBootstrap`, SÉQUENTIEL** : `getRedirectResult()` → `authStateReady()` → anonyme de secours. L'ordre est **critique** : sinon un anonyme parasite est créé juste avant l'arrivée de la session Google de retour, et l'utilisateur atterrit sur le mauvais UID.
- `auth.tsx` : bouton câblé (web only, garde `googleBusy` anti double-popup), toasts i18n `t.auth.googleErreur` / `googleReseau`. Toast « disponible prochainement » conservé sur natif.
- ✅ **FUSION email ↔ Google VALIDÉE (2026-07-14)** : paiement en email+password sur `ncpnettoyage@gmail.com`, puis reconnexion **Google** sur la même adresse → **même UID**, abonnement retrouvé, aucun paywall au cycle 8. Le réglage Firebase « associer les comptes qui utilisent la même adresse e-mail » fait son travail.
  - ⚠️ **Piège de test** (rencontré) : la fusion n'opère que sur une **adresse IDENTIQUE**. Se connecter avec Google sur `ncpnettoyage@gmail.com` alors que l'abonnement a été payé sur `duboislyana@hotmail.fr` donne — normalement — un **UID neuf sans abonnement** → paywall. Ce n'est PAS un bug : deux adresses = deux comptes.

##### 📌 Compromis Option A confirmé — progression LOCALE (2026-07-14)
Test en fenêtre privée : abonnement retrouvé ✅, mais **progression repartie au cycle 1**. Comportement **attendu** (Option A : progression en AsyncStorage, non clé par UID, jamais synchronisée). Conséquence assumée : **changer d'appareil = garder son abonnement mais perdre sa progression**.
→ **Amélioration future possible — Option B** : progression dans Firestore (`users/{uid}.progress`), synchronisée au login. À évaluer si des utilisateurs remontent la perte de progression au changement d'appareil. Impacte : `home.tsx`, `finalizeSignIn()`, règles Firestore (write own doc), gestion des conflits local↔cloud.

##### ✅ 3 fonctions d'action CASSÉES sur web — **CORRIGÉ (2026-07-14)**

🚨 **RÈGLE ABSOLUE : `Alert.alert` est un no-op SILENCIEUX sur react-native-web.** Toute confirmation enveloppée dedans ne s'affiche jamais → son `onPress` n'est JAMAIS exécuté → **l'action ne s'exécute pas du tout**. Trois fonctions étaient mortes sur web sans aucun message d'erreur : **se déconnecter**, **supprimer mon compte** (trou RGPD !) et **réinitialiser ma progression**. Le code était correct, il n'était jamais atteint.
→ **Toute confirmation passe désormais par `components/ui/ConfirmDialog.tsx`** (basé sur `Modal`, variante `destructif`). **NE JAMAIS réutiliser `Alert` pour une confirmation.**

- **Se déconnecter** (`parametres.tsx`) — comportement CHANGÉ : l'ancienne version effaçait cycles/journal/vision board/points (se déconnecter = tout perdre). Désormais **la progression est CONSERVÉE** (Option A, locale) et retrouvée à la reconnexion — `finalizeSignIn()` n'initialise que si les clés sont absentes. On ne retire que : `subscription_active` (les droits appartiennent à l'UID qui part), `selected_plan`, `emailForSignIn`, et **`onboarding_completed`** — ⚠️ sans ce dernier, `AuthBootstrap` recréerait un **anonyme** au prochain chargement et l'utilisateur n'atteindrait JAMAIS l'écran de connexion. `had_subscription` volontairement conservé (déclenche « Bon retour parmi nous »).
- **Supprimer mon compte (RGPD)** — ordre **critique** : doc Firestore `users/{uid}` **d'abord** (après `deleteUser`, `request.auth` n'existe plus → les règles refuseraient), puis compte Firebase, puis `AsyncStorage.clear()`. Cas `auth/requires-recent-login` → `ConfirmDialog` proposant un nouveau magic link, **rien n'est effacé** tant que la ré-auth n'a pas eu lieu.
  - ✅ **Règle Firestore publiée (2026-07-14)** : `allow delete: if request.auth != null && request.auth.uid == uid;` sur `users/{uid}`. Sans elle → `permission-denied` et le doc **survivait** à la suppression du compte. Sans danger : l'utilisateur peut détruire son propre doc (au pire il se prive de son abonnement), il ne peut toujours pas s'en accorder un.
- **Réinitialiser ma progression** (`profil.tsx`) — retour au cycle 1, **compte et abonnement intacts** (`subscription_active` / `had_subscription` hors de la liste).

##### ⏳ Reste à faire — Alert informatives (Priorité 3)
Une poignée d'`Alert.alert` **informatives** ne s'affichent pas non plus sur web (aucune action perdue, juste du silence) : permission photo refusée (`vision-board.tsx`), partage copié / échoué (`useShare.ts`), « disponible prochainement » (`pricing.tsx`, `pricing-upgrade.tsx`), « restaurer un achat » + notifs désactivées (`parametres.tsx`). → à basculer sur `showAuthToast` (qui, lui, fonctionne sur web) lors du nettoyage prod.

##### ⏳ Reste à faire — Google, volets C et D
- **Volet C — Conversion anonyme au cycle 8 via Google** : `linkWithPopup` (même UID → progression préservée), en alternative au formulaire email+password de `pricing-upgrade.tsx`. Gérer `auth/credential-already-in-use` → `GoogleAuthProvider.credentialFromError()` + `signInWithCredential` → l'utilisateur retombe sur son ancien compte, et le **garde-fou serveur** `hasActiveSubscription()` détecte son abonnement **sans le faire payer**.
- **Volet D — Reconnexion Google** : aucun code propre à écrire, fourni par le volet B. À **tester** seulement.
- ⚠️ **Web uniquement** : `signInWithPopup` n'existe pas sur React Native. La version native exigera `expo-auth-session` / `@react-native-google-signin` → chantier séparé, avec le pipeline RevenueCat.

##### 🍎 Apple Sign-In — MASQUÉ sur web (2026-07-14), à câbler en Phase 2
- `auth.tsx` : bouton Apple derrière `Platform.OS !== 'web'` (même traitement que « Restaurer un achat »). `handleAppleSignIn` reste une **coquille vide** (toast) — **code conservé**, rien supprimé.
- Pourquoi masqué : le Sign in with Apple **web** exige un compte **Apple Developer payant (99 $/an)** + config côté Apple (Service ID, clé privée, domaines/Return URLs vérifiés). Pas encore en place → on ne montre pas un bouton qui ne fait rien.
- 🚨 **Phase 2 (App Store) — OBLIGATOIRE** : dès qu'une app propose un login social tiers (Google), **Apple IMPOSE** de proposer aussi Sign in with Apple (App Review Guideline 4.8). Sans lui, **rejet à la soumission**. Prérequis : compte Apple Developer actif.
- Sur web (Phase 1), **Google + email/magic link suffisent**.

##### 🔧 Config console à faire par l'utilisateur (Google)
- ✅ Provider Google activé + domaines autorisés (`localhost` présent) → **suffisant pour tester le popup en dev** (Firebase crée le client OAuth Web et enregistre `.../__/auth/handler` tout seul).
- 🚨 **À VÉRIFIER — Firebase → Authentication → Settings → liaison des comptes** : doit être sur **un seul compte par adresse email**. Sinon un utilisateur inscrit en email+password qui se connecte ensuite avec un Google du **même email** obtient un **2e UID** → **abonnement perdu silencieusement**.
- ⏳ Avant prod : **écran de consentement OAuth** (nom, email de support, logo, URLs légales) configuré et **publié**, sinon avertissement « application non vérifiée ». Ajouter `manifest-mind.app` aux domaines autorisés Firebase.

#### 📎 Détail technique — lancement web (cadré par PHASES G & H ci-dessus)
- 🚨 **AUTH GOOGLE EN PROD — 2 points à ne PAS oublier** (issus du volet B, 2026-07-14) :
  1. **`signInWithRedirect` est cassé par le blocage des cookies tiers** (Safari/ITP, et Chrome qui s'y met). Le repli popup-bloqué repose sur un aller-retour via `manifestmind.firebaseapp.com` — un domaine TIERS du point de vue de `manifest-mind.app`. Invisible en localhost (le popup passe), mais **le repli ne marchera pas sur iPhone en prod**. Correctif : servir le handler d'auth depuis NOTRE domaine → `authDomain: 'manifest-mind.app'` dans la config Firebase + **rewrite Firebase Hosting** de `/__/auth/**` vers le handler. À faire au déploiement web.
  2. **Écran de consentement OAuth à configurer ET publier** (Google Cloud → APIs & Services → OAuth consent screen) : nom de l'app, email de support, logo, URLs légales. Sans ça → avertissement **« application non vérifiée »** pour les utilisateurs. Ajouter aussi `manifest-mind.app` aux domaines autorisés Firebase.
- ⏳ **PWA** — `manifest.webmanifest` (nom, icônes, `display: standalone`, `theme_color`), **service worker** (offline/cache), **jeu d'icônes** (192/512 + maskable) → installable sur écran d'accueil.
- ⏳ **Passage Paddle sandbox → production** — créer produits + prix côté prod, configurer le webhook prod, **approbation du domaine `manifest-mind.app`** dans Paddle. Puis `.env` : `EXPO_PUBLIC_PADDLE_SANDBOX=false` (bascule sur le token/price IDs prod déjà présents).
- ⏳ **Documents légaux** — CGU + politique de confidentialité à jour avec **« 7 cycles »** et **essai sans carte** (3 langues).
- ⏳ **Déploiement web** — build `npx expo export --platform web` → `dist/` → déploiement sur `manifest-mind.app` + **tests finaux en conditions réelles** (paiement prod, magic link, Google).

#### 📎 Détail technique — nettoyage (cadré par PHASE F ci-dessus)
🧹 Boutons debug `home.tsx` (« reset », « ⏭ cycle suivant ») + logs non-`__DEV__`. `DEBUG_SKIP_PAYWALL = false` (point 0 🚨). *(La clé i18n `t.auth.sansCompte` + le style `skipText` ont déjà été supprimés le 2026-07-13.)*

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
  - **Reconnexion email + mot de passe** (`auth.tsx`) — `signInWithEmailAndPassword` + « mot de passe oublié/jamais défini » via `sendPasswordResetEmail`. **Voie principale de reconnexion** (cf. section 🔐 Reconnexion directe).
  - Magic link email — **envoi désormais réservé au RGPD** (`parametres.sendReauthLink`, ré-auth avant suppression) + réception deep link (`_layout.tsx` → `DeepLinkHandler`). L'UI d'envoi magic-link d'`auth.tsx` a été retirée.
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
