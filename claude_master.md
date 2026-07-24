# CLAUDE_MASTER.md — ManifestMind

═══════════════════════════════════════════════════════════════════════════════
🔒🔒🔒 **RÈGLE ABSOLUE ET PERMANENTE — PROTECTION DE LA VERSION WEB** 🔒🔒🔒
*(À RELIRE ET RESPECTER À CHAQUE SESSION, SANS QU'ON AIT À LA RÉPÉTER)*
═══════════════════════════════════════════════════════════════════════════════

- 🟢 **L'application WEB en ligne (`https://manifestmind.web.app`) doit rester STRICTEMENT IDENTIQUE. On n'y touche à rien.**
- 🔗 **Le code source est PARTAGÉ entre le web et le natif.** Toute modification destinée au **natif (stores)** ne doit **JAMAIS** dégrader, changer ou casser le comportement de la **version web**.
- 🛑 **À chaque intervention future, AVANT toute modification : vérifier et SIGNALER si elle risque d'affecter le web. En cas de doute → s'ARRÊTER et DEMANDER.**

═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
🟣 **MODÈLE FREEMIUM EN VIGUEUR (AUTORITÉ) — 1 CYCLE GRATUIT** 🟣
═══════════════════════════════════════════════════════════════════════════════

- ✅ **MODÈLE ACTUEL (la SEULE règle en vigueur)** : **1 seul cycle gratuit** → écran de félicitations (avec points) → **paywall dès le retour à l'accueil** (même session, sans attendre minuit) → bloqué à chaque ouverture tant que non-abonné → abonnement = accès cycle 2 + rythme quotidien dès le cycle 3. *(Décision 2026-07-21, commit `34dffde` ; détail : « 📝 DÉCISION MODÈLE — 1 CYCLE GRATUIT » plus bas.)*
- 🕰️ **ANCIEN MODÈLE (OBSOLÈTE, NE PLUS APPLIQUER)** : « **7 cycles gratuits → paywall au cycle 8** ». **TOUTES** les mentions « 7 cycles / cycle 7 / cycle 8 » ailleurs dans ce document décrivent CET ancien modèle (trace historique des Phases A→E et des tests). **Ne JAMAIS les prendre pour la règle en vigueur** — la seule règle actuelle est « 1 cycle gratuit » ci-dessus.

═══════════════════════════════════════════════════════════════════════════════

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

L'API Key (`pdl_live_apikey_*`) n'est utilisée que pour **appeler** l'API Paddle (cancel, refund, query). Aucune feature V1 n'en a besoin. Ne pas la générer/stocker tant qu'on n'en a pas l'usage concret — surface d'attaque réduite. À planifier en V1.5 quand on ajoutera "Annuler mon abonnement" côté app — **même chantier V1.5 que l'automatisation des remboursements (point 10 de la feuille de route, reporté le 2026-07-16 avec runbook manuel en V1)**.

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
  - 📸 **Persistance photos NATIF (noté le 2026-07-16)** : les URIs `file://` du picker/manipulator pointent vers le **cache** de l'app, que l'OS peut nettoyer → **copier vers `documentDirectory`** (vision board + photo de profil). Cf. section « 🔴 BUG PERSISTANCE WEB » pour le contexte complet.
  - 🔔 **Notifications — paramètre mort + intention à trancher (noté le 2026-07-16, NON corrigé volontairement — clôture de session, fichier sensible, notifs INERTES sur web)** : dans `parametres.tsx`, `scheduleRappelNotifRaw(time: Date)` reçoit un paramètre `time` **jamais utilisé** — le rappel « cycle incomplet » est codé en dur à **20 h 00** (`hour: 20, minute: 0`). C'est COHÉRENT avec la doc actuelle (politique de confidentialité + i18n : « rappel à 20h ») — donc paramètre mort, pas dysfonctionnement — MAIS la table des clés nomme `reminder_time` « Heure rappel » alors qu'elle pilote en réalité l'heure de l'**affirmation** : ambiguïté d'intention à trancher au chantier notifications natif. **Correctif prévu (Phase 2)** : (1) décider si le rappel doit suivre une heure choisie ou rester fixe à 20 h ; (2) selon la décision, utiliser `time` ou retirer le paramètre (+ ses 3 sites d'appel `scheduleRappelNotifRaw(time|reminderTime)`) ; (3) tester le cycle complet des notifs sur appareil réel (jamais testé — Expo Go ne suffit pas pour les notifs planifiées). À traiter EN MÊME TEMPS que la revalidation de l'anti-fuite `isPaywalled()` ci-dessus (même zone de code).
  - ✅ **~~FUITE DE CONTENU — notification d'affirmation~~** — **CORRIGÉ le 2026-07-15** (traité en Phase B point 6, par anticipation, en ouvrant l'accès à `parametres` depuis le paywall). `scheduleAffirmationNotif()` fait désormais `const cycleContent = (await isPaywalled()) ? null : getCycleContent(...)` → un non-abonné paywallé reçoit le texte générique `t.notifications.affirmationBody`, jamais l'affirmation réelle. Sûr web ET natif. L'écran `parametres` n'est **pas** gaté (RGPD). *(Historique : repérée le 2026-07-14 en vérifiant le périmètre d'A.2 — `parametres.tsx` était le seul écran whitelisté à importer `getCycleContent` et mettait l'affirmation du cycle courant dans le corps de la notif quotidienne ; inerte sur web mais réelle sur natif.)*

═══════════════════════════════
**🔢 ORDRE D'EXÉCUTION — RÉORGANISÉ (2026-07-15) — FAIT AUTORITÉ**
═══════════════════════════════

> **CET ORDRE REMPLACE la lecture linéaire A→H ci-dessous** (qui reste le DÉTAIL de chaque point). **Décision : AUCUN déploiement public tant que tout n'est pas testé ET nettoyé.** Les tests mobiles se font via un **tunnel HTTPS privé** (URL temporaire, obscure — **PAS une publication** ; `manifest-mind.app` reste vierge jusqu'au vrai déploiement).

**✅ DÉJÀ FAIT :** PHASE A · PHASE B · PHASE C (Google complet) · **PHASE D (2026-07-16)** — 9 + 11 + 12 + 13 ✅, 10 ⏸️ V1.5 · **PHASE E (2026-07-16)** — 15 export RGPD ✅ · 16 consentement qualifié ✅ · 14+17 les 9 documents légaux réécrits et publiés ✅. *(+ hors-roadmap : bug persistance web corrigé le 2026-07-16.)*

**RESTE À FAIRE, STRICTEMENT DANS CET ORDRE :**
1. ✅ **~~PHASE D — robustesse paiement~~** — **TERMINÉE (2026-07-16)** : points 9 ✅ · 11 ✅ · 12 ✅ (config Paddle) · 10 ⏸️ (reporté V1.5, runbook manuel) · 13 ✅ (prix USD centralisés). → **Prochaine étape : PHASE E.**
2. ✅ **~~PHASE E — légal~~ — TERMINÉE (2026-07-16)** : **15** ✅ export RGPD (`services/dataExport.ts` + rangée parametres) · **16** ✅ qualifié (pas de bannière — transparence seule ; 🚨 **DÉCLENCHEUR** : tout futur analytics/monitoring = bannière obligatoire AVANT activation) · **14+17** ✅ les 9 documents légaux réécrits et PUBLIÉS (dual-plateforme web Paddle MoR + stores ; cf. détail au point 14, dont la note anti-steering Phase 2).
3. ✅ **~~PHASE H-partie-1 — configurer la PWA~~ — FAIT (2026-07-17)** : point 25 ✅ (identité définitive M+œil sur violet, 10 fichiers d'icônes web+stores, manifest, SW minimal 3-règles, robots.txt — détail au point 25). → **Prochaine étape : 🧪 TESTS MOBILES via TUNNEL (étape 4).**
4. **🧪 TESTS MOBILES via TUNNEL HTTPS** : parcours complet, **PWA/installation**, **Google Sign-In**, **Paddle sandbox**, **Safari/iPhone**, responsive, **clavier mobile**, **🔴 PERSISTANCE après fermeture COMPLÈTE du navigateur** (photos vision board + journal + progression — leçon du bug du 2026-07-16). ⚠️ **AVEC les boutons debug ENCORE PRÉSENTS** (indispensables pour atteindre le cycle 8 sur mobile) — **MAIS ATTENTION : le bouton « reset » fait un `AsyncStorage.clear()` TOTAL en UN TAP sans confirmation** (home.tsx, coin haut-droit) : un tap accidentel pendant les tests efface tout. Cf. encadrés « TUNNEL » et « SAFARI/IPHONE » ci-dessous.
   - **📅 PLAN DE LA PROCHAINE SESSION (noté le 2026-07-17 en clôture — objectif : avancer jusqu'au nettoyage Phase F INCLUS)** :
     1. **Tester la PWA en local** : `npx expo export --platform web` puis `npx serve dist` → DevTools F12 → Application → Manifest (icônes + maskable OK, zéro erreur) + Service Workers (`sw.js` activated) → installation desktop (icône « Installer » dans la barre d'adresse Chrome/Edge) → vérifier favicon net dans l'onglet. ⚠️ APRÈS les tests : Application → Storage → « Clear site data » (désinscrire le SW de localhost).
     2. **Tests mobiles au TUNNEL** (cet encadré + « TUNNEL » et « SAFARI/IPHONE » ci-dessous) : installation PWA réelle sur téléphone (bannière Android + masques réels des launchers, « Sur l'écran d'accueil » iOS), parcours complet, Google, Paddle sandbox, responsive, clavier, persistance.
     3. **PHASE F — nettoyage** (points 18-21 : boutons debug, code mort/logs — exceptions documentées —, doublon `expo-font` d'app.json, renommage `claude_master.md` en forçant la casse, vérif `DEBUG_SKIP_PAYWALL=false` ; + assets template orphelins notés au point 25 ; + migration `MediaTypeOptions` notée au point 19).
   - **✅ ÉTAPE 4 — TESTS MOBILES TERMINÉE (2026-07-17)** — tout validé sur vrai matériel (tunnel Cloudflare, Android Chrome + iPhone Safari) :
     - ✅ **Installation PWA** réussie sur **Android (Chrome)** ET **iPhone (Safari)** — icône M+œil belle et lisible, bien découpée par les masques des deux plateformes ; lancement **standalone** (plein écran, sans barre d'URL) sur les deux.
     - ✅ **Google Sign-In iPhone/Safari** (popup) — cf. vigilance Safari levée + point 24 déclassé.
     - ✅ **Persistance après fermeture complète** (iPhone) — photo vision board + entrée journal retrouvées après réouverture → le fix data-URIs/rechargement journal du 2026-07-16 tient sur mobile.
     - ✅ **Paiement email+password sur mobile** (parcours cycle 7→8 → paywall → checkout Paddle s'ouvre → paiement validé, e-mail Paddle reçu → accès débloqué).
     - ✅ **Paiement via Google sur mobile (volet C)** — téléphone vierge, compte Google jamais payé : « Continuer avec Google » → popup → checkout Paddle s'enchaîne directement → paiement validé, données enregistrées, retour au cycle 8. Le `linkWithPopup` + délégation à `handlePurchase` **tient en conditions réelles mobiles**.
     - 📌 **COMPORTEMENT NORMAL CONSIGNÉ (ne PAS rediagnostiquer comme bug)** : se connecter avec un AUTRE compte Google sur le MÊME téléphone → l'utilisateur **garde le cycle 8** et l'app **redemande le prénom**. C'est la conjonction attendue de : (a) **Option A** — progression LOCALE à l'appareil (non clé par UID, ne suit pas le compte) → le cycle reste celui de l'appareil ; (b) **basculement d'identité** — `credential-already-in-use` → `signInWithCredential` → **nouvel UID** dont le prénom n'est pas encore posé localement pour cette session → `finalizeSignIn` n'initialise que les clés absentes. Cohérent avec le code des volets B/C. (À distinguer d'une vraie perte de données : ici rien n'est perdu, c'est l'appareil qui porte la progression, pas le compte.)
     - ✅ **Journal** : saisie parfaite, limite 150 mots bloquée, compteur visible. ✅ **Vision board** OK. ✅ **Clavier mobile** : rien de masqué, tout accessible sur les deux téléphones. ✅ **Responsive/safe-areas** OK.
     - **→ ÉTAPE 4 TERMINÉE.** Reste à re-confirmer installation + Google sur le VRAI domaine au point 28 (post-déploiement). Prochaine étape roadmap : **PHASE F (nettoyage)**.
     - 🧭 **TEST DU 1ᵉʳ PAIEMENT RÉEL (point 28) SANS boutons debug** : forcer le cycle par la CONSOLE — `localStorage.setItem('current_cycle','8')` puis F5 → paywall. Test sur ordinateur (checkout Paddle identique). **Donc AUCUN besoin de conserver les boutons debug ni d'inventer un mode caché** → le point 18 (retrait) peut se faire sereinement.
     - 📎 Console (non bloquant, à traiter plus tard) : `apple-mobile-web-app-capable` déprécié → AJOUTER `mobile-web-app-capable` à côté (garder l'apple) dans `+html.tsx` (1 ligne, lot polish PWA ou Phase F) · manifest `screenshots` absent (« richer install UI » — bonus cosmétique, → section 🎨 DESIGN) · warnings « No route named (app)/… » = inoffensifs (dev expo-router).
4-bis. ✅ **BOUTON D'INSTALLATION PWA — FAIT ET VALIDÉ SUR VRAI MATÉRIEL (2026-07-17)** — Android (boîte native 1-clic), iPhone Safari (modale), **Chrome iOS (modale — correctif iOS 16.4 validé)**, textes distincts par plateforme, célébration s'affiche même après ✕ à l'arrivée.
    - **📁 LIVRÉ** : `services/pwaInstall.ts` (nouveau) · `components/ui/InstallPrompt.tsx` (nouveau — bannières arrivée/célébration + `IosInstallModal`) · `_layout.tsx` (+`<PwaInstallListener/>`) · `home.tsx` (bannière arrivée) · `celebration.tsx` (bannière célébration) · `parametres.tsx` (rangée « Installer l'application ») · `translations.ts` (`t.install.*` FR/EN/ES) · `dataExport.ts` (2 clés RGPD).
    - **📚 LEÇON iOS 16.4 (à retenir)** : la règle « seul Safari peut installer sur iOS » est **PÉRIMÉE depuis iOS 16.4 (mars 2023)** — **Chrome iOS (et tout navigateur iOS) peut installer** via son menu Partager (emplacement de l'icône différent : bas sur Safari, haut-droite sur Chrome → wording générique « ton navigateur »). Le 1ᵉʳ jet du code renvoyait « ouvre dans Safari » sur Chrome iOS → aurait **perdu tous les utilisateurs Chrome iPhone**. C'est l'observation de l'utilisateur (« j'ai pourtant installé depuis Chrome ! ») qui a déclenché la vérification. **Toujours vérifier les règles plateformes actuelles plutôt que se fier à des contraintes historiques mémorisées.**
    - **🔑 LOGIQUE FINALE DES CLÉS** : `pwa_arrival_dismissed` gouverne **UNIQUEMENT** la bannière d'arrivée (✕ = « j'ai vu, enlève-la » → ne revient plus, arrivée seule). `pwa_celebration_prompt_shown` = garde « montré une fois » de la célébration, **INDÉPENDANTE** du refus d'arrivée (✕ à l'arrivée n'empêche pas la célébration de proposer une fois le 1ᵉʳ cycle terminé). Rangée Paramètres **toujours** disponible (masquée seulement si déjà installé / non installable). Détection : `getPlatform()` → `'android'|'ios'|'other'` ; `isStandalone()` (matchMedia + navigator.standalone) → rien si installé ; `beforeinstallprompt` capté à la racine. 100 % web-only, purement additif.
    - **⏳ Détail du plan initial (conservé pour référence)** — Rien ne signale à l'utilisateur qu'il peut installer l'app → adoption compromise pour un rituel quotidien.
    - **🎯 DÉCISION TIMING (validée) : LES DEUX bannières, deux intensités.** (1) **ARRIVÉE — discrète** : petite bannière en bas de `home.tsx`, facile à ignorer, avec ×, ne bloque rien. (2) **1ʳᵉ CÉLÉBRATION — engageante** : sur `celebration.tsx`, le pic d'intention (« Reviens demain ✨ »). **+ rangée permanente « Installer l'application » dans Paramètres (VALIDÉ OUI)** — seul moyen in-app de revenir sur un refus (masquée si déjà installé).
    - **🔑 CLÉS (validé) : 1 clé de refus + 1 garde d'affichage.** `pwa_install_dismissed` = LE refus (posé par **fermeture explicite** : × arrivée OU « Plus tard » célébration) → plus RIEN, jamais (arrivée ET célébration — RÈGLE ABSOLUE respectée). `pwa_celebration_prompt_shown` = garde « montré une fois » (sinon la bannière reviendrait à CHAQUE fin de cycle) — **PAS un refus**. **Distinction cruciale : FERMER (×) = refus définitif ; IGNORER (continuer sans fermer) ≠ refus** → la célébration pourra encore proposer à qui a ignoré l'arrivée. Les 2 clés → **export RGPD** (`dataExport.ts`).
    - **⚙️ MÉCANISME PLATEFORME** : **Android/Chrome** = capter `beforeinstallprompt` À LA RACINE dès le démarrage (il fire au chargement, souvent déjà dispo à l'arrivée ; l'ancienne exigence « 30 s d'engagement » a disparu) → au tap « Installer », `prompt()` = boîte native 1-clic (⚠️ `prompt()` DOIT être dans un geste utilisateur = le clic du bouton, OK). Repli si event pas encore là → texte « Menu ⋮ → Installer ». **iPhone/Safari** = Apple INTERDIT le déclenchement programmatique → **modale d'instructions illustrée** (icône Partager iOS dessinée + flèche vers la barre Safari du bas + 3 étapes). **Chrome iOS** (ne peut pas installer) → « Ouvre dans Safari ». **Détection standalone** (`matchMedia('(display-mode: standalone)')` / `navigator.standalone`) → rien si déjà installé. Écouter `appinstalled` → masquer.
    - **📁 PLAN TECHNIQUE (fichiers)** : **NOUVEAU** `components/ui/InstallPrompt.tsx` (composant réutilisable, `variant='arrival'|'celebration'` + modale iOS, rend `null` dans la majorité des cas) · **NOUVEAU** `services/pwaInstall.ts` (capte/stocke l'event, `isStandalone()`, `getPlatform()` → android/ios-safari/ios-chrome/other, `promptInstall()`) · `app/_layout.tsx` +1 composant frère isolé `<PwaInstallListener/>` (web-only, modèle des `AnonymousBootstrap`/`AuthBootstrap` — **NE PAS toucher** LanguageProvider/DeepLinkHandler/AuthBootstrap) · `app/(app)/home.tsx` +overlay `variant="arrival"` · `app/(app)/celebration.tsx` +overlay `variant="celebration"` (gardé par `pwa_celebration_prompt_shown`) · `parametres.tsx` +rangée « Installer l'application » · `translations.ts` +clés `t.install.*` FR/EN/ES · `dataExport.ts` +2 clés.
    - **🛡️ GARDE-FOUS NON-RÉGRESSION** : 100 % **web-only** (inerte natif Phase 2) · **purement additif** (2 overlays + 1 listener isolé + clés neuves, AUCUNE logique existante modifiée) · **ne touche PAS** auth/paiement/gate `access.ts`/prix/persistance/webhook/boutons debug/config · overlays rendent `null` si installé/refusé · **re-test tunnel** obligatoire (1-clic Android, modale iOS, persistance refus, ignore→célébration s'affiche, standalone→tout masqué, célébration 1×).
    - **✍️ TEXTES VALIDÉS (FR/EN/ES)** :
      - **Arrivée** (bouton « Installer/Install/Instalar » + ×) : FR « Installe ManifestMind sur ton écran d'accueil » · EN « Add ManifestMind to your home screen » · ES « Añade ManifestMind a tu pantalla de inicio ».
      - **Célébration** (titre + message + [Installer] + [Plus tard]) : FR titre « Reviens demain ✨ » / « Garde ManifestMind sous les yeux : installe l'app sur ton écran d'accueil pour ne manquer aucun cycle. » · EN « Come back tomorrow ✨ » / « Keep ManifestMind in sight: add the app to your home screen so you never miss a cycle. » · ES « Vuelve mañana ✨ » / « Mantén ManifestMind a la vista: añade la app a tu pantalla de inicio para no perderte ningún ciclo. »
      - **Modale iOS** (titre + 3 étapes + bouton) : FR « Installer ManifestMind » / 1. Appuie sur l'icône **Partager** en bas de Safari · 2. Choisis **« Sur l'écran d'accueil »** · 3. Appuie sur **« Ajouter »** / « J'ai compris ». EN « Install ManifestMind » / 1. Tap the **Share** icon at the bottom of Safari · 2. Choose **"Add to Home Screen"** · 3. Tap **"Add"** / « Got it ». ES « Instalar ManifestMind » / 1. Toca el icono **Compartir** abajo en Safari · 2. Elige **"Añadir a pantalla de inicio"** · 3. Toca **"Añadir"** / « Entendido ».
      - **Replis** : Android sans event → FR « Ouvre le menu ⋮ de Chrome, puis "Installer l'application" » · EN « Open Chrome's ⋮ menu, then "Install app" » · ES « Abre el menú ⋮ de Chrome y pulsa "Instalar aplicación" ». Chrome iOS → FR « Ouvre cette page dans Safari pour installer l'application » · EN « Open this page in Safari to install the app » · ES « Abre esta página en Safari para instalar la aplicación ». Rangée Paramètres → FR « Installer l'application » · EN « Install the app » · ES « Instalar la aplicación ».
5. **PHASE F — nettoyage complet, APRÈS les tests ET le bouton d'installation** — **PLAN VALIDÉ + décisions 2026-07-17 : cf. bloc « 📋 PLAN VALIDÉ » en tête de la section PHASE F détaillée.** Résumé : **Commit A unique** = **18** (boutons debug) · **19** (code mort/logs, exceptions paddle.ts + home.tsx:85) · **20** (`expo-font` double) · **+ meta `mobile-web-app-capable`** ; **21** `DEBUG_SKIP_PAYWALL` déjà `false` ✅. **`handleRestore` LAISSÉS** · **`MediaTypeOptions` REPORTÉ Phase 2** · **renommage `claude_master.md` ABANDONNÉ** (repo cohérent, vérifié).
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
📱 **VIGILANCE SAFARI/IPHONE — ✅ LARGEMENT LEVÉE (test 2026-07-17)**
═══════════════════════════════
Testé sur iPhone Safari (PWA installée depuis le tunnel) : **le popup Google s'ouvre et l'auth passe** → le risque « cookies tiers de Safari/ITP » **ne s'est pas matérialisé** sur le chemin popup (le chemin commun). **2 réserves** : le repli `signInWithRedirect` (popup bloqué) n'a pas été exercé, et le test était sur domaine tunnel, pas `manifest-mind.app`. → Le correctif `authDomain`/rewrite du point **24** est **DÉCLASSÉ en contingence** (déclencheur : popup bloqué + redirect cassé au re-test final point 28). Détail complet au point 24.

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
8. ✅ **~~Volet D — reconnexion Google~~** — **VALIDÉ (tests 2026-07-15)**, aucun code neuf (fourni par le volet B). Reconnexion Google (`auth.tsx` → `signInWithGoogle` → `finalizeSignIn`) restaure l'abonnement sur le **bon UID sans re-paiement** ; un compte **non-abonné** reste bloqué au paywall (sécurité OK). ✅ **Safari/iPhone (popup) confirmé fonctionnel le 2026-07-17** (test tunnel — reconnexion `ncpnettoyage@gmail.com` reconnu abonné). Le repli `signInWithRedirect` (popup bloqué) reste non exercé → contingence point 24, à re-confirmer sur le vrai domaine au point 28.

→ ✅ **PHASE C TERMINÉE (2026-07-15).** **Google Sign-In complet** : connexion (volet B), conversion au cycle 8 via `linkWithPopup` (volet C), reconnexion (volet D). Prochaine étape : **PHASE D** (robustesse paiement).

**PHASE D — Robustesse & paiement**
9. ✅ **~~Rendre visibles les échecs de paiement~~** — **CODÉ (2026-07-15), à tester.** `openCheckout` renvoyait `Promise<void>` et avalait tout en `console.warn` → clic « payer » sans effet ni message. Désormais **`openCheckout` renvoie `CheckoutResult`** (`{ ok:true }` = **la modale s'est OUVERTE**, PAS « payé » ; `{ ok:false; reason }`). Les 2 appelants (`pricing.tsx` + `pricing-upgrade.tsx`, et donc le chemin Google qui délègue à `handlePurchase`) affichent un toast en cas d'échec. Helper pur `mapCheckoutError(reason, t.paiement)` → **2 messages** : `load` = actionnable (connexion/bloqueur de pub) ; `config`/`setup`/`open` = technique + support `{email}` (`SUPPORT_EMAIL`) ; `unsupported` (native) → `null` (pas de toast). **Fermeture volontaire** de la modale = **silence** (arrive après `ok:true`, via l'événement `checkout.closed` → `onClose`, non câblé). i18n `t.paiement.{erreurChargement,erreurTechnique}` (FR/EN/ES). `tsc` clean + app bootée.
    - 🚨 **Les `console.error`/`console.warn` de `paddle.ts` sont des DIAGNOSTICS INTENTIONNELS — NE PAS les retirer au nettoyage Phase F (point 19).** `config`/`setup` sont passés en `console.error` (une config `.env` cassée = 100 % des paiements échouent). Sans monitoring centralisé, ce sont le seul signal côté dev + le support est le canal réel côté prod.
    - 🔮 **Amélioration future (hors périmètre V1) : monitoring d'erreurs centralisé** (type Sentry) pour capter ces échecs en prod sans dépendre du support. Non retenu maintenant : ajoute une dépendance + config pour un besoin qui n'apparaît qu'avec du volume.
10. ⏸️ **Remboursement lifetime — REPORTÉ V1.5 (décision 2026-07-16), traitement MANUEL en V1 via le runbook ci-dessous.** Rattaché au chantier V1.5 existant « Annuler mon abonnement » + `PADDLE_API_KEY` (cf. section « PADDLE_API_KEY serveur — pas nécessaire au V1 »).
    - **Le trou (réel mais borné)** : les `adjustment.*` tombent dans la branche `default` du webhook → ack 200 no-op → un remboursé lifetime garde l'accès (lifetime = one-time, AUCUN `subscription.canceled` ne viendra jamais le couper — contrairement aux remboursements mensuel/annuel, où l'annulation de l'abo finit par couper l'accès via le point 12 ✅).
    - **Pourquoi le report est sain** : cas doublement rare (remboursement × acheteur lifetime) · **détectable à 100 %** (Paddle merchant of record notifie CHAQUE remboursement par e-mail + adjustment visible au dashboard + trace Cloud Logging puisque les `adjustment.*` sont cochés) · le correctif manuel produit **exactement le même état Firestore** que le ferait le webhook — zéro perte de qualité, juste de la latence humaine sur un événement rarissime. À l'inverse, le point 13 (prix €/$) est visible par 100 % des visiteurs dès le jour 1.
    - **📖 RUNBOOK MANUEL (V1) — à chaque e-mail de remboursement Paddle :**
      1. E-mail Paddle « refund » reçu (ou adjustment vu au dashboard) → noter l'e-mail client et/ou le `customer_id` (`ctm_…`).
      2. Console Firebase → Firestore → collection `users` → retrouver le doc par le champ **`paddle_customer_id`** (ou croiser avec l'e-mail via Firebase Auth → UID).
      3. Passer **`subscription_active` à `false`** sur ce doc (édition manuelle console).
      4. Vérifier le re-paywall : `useSubscriptionSync` propage le `false` automatiquement (mécanisme validé au point 12) — le client retombe sur le paywall au prochain focus de home.
      5. Tracer : noter la date + le `customer_id` traité (e-mail archivé suffit).
    - **Config déjà en place pour le jour du codage** : `adjustment.created` + `adjustment.updated` **cochés en sandbox depuis le 2026-07-16** (et dans la liste canonique des 9 à cocher en PROD, point 22) → les payloads réels s'accumuleront dans le journal Paddle.
    - **🔬 PROTOCOLE D'OBSERVATION (à dérouler AVANT de coder l'automatisation, leçon du point 12)** : (1) achat lifetime sandbox sur un compte de test ; (2) remboursement complet depuis le dashboard Paddle ; (3) capturer les **payloads réels** (Paddle → Notifications) + la branche touchée dans Cloud Logging. **Questions ouvertes à trancher par l'observation** : `custom_data.firebase_uid` présent sur un adjustment ? (créé par le vendeur, pas par le checkout — probablement ABSENT → la **contingence recherche inverse du point 12 resservirait ici**, via `paddle_customer_id` puisque lifetime = one-time sans `subscription_id`) · séquence des statuts (`pending_approval` → `approved` ?) · quel événement fait foi pour retirer l'accès (ne pas désactiver sur un remboursement encore refusable). Périmètre : couvrir aussi les remboursements mensuel/annuel au passage.
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
13. ✅ **~~Prix : passer d'EUROS à DOLLARS + centraliser~~** — **FAIT ET VALIDÉ (2026-07-16)** (tests : 3 langues × 2 écrans OK, aucun placeholder brut, overlay Paddle = prix affiché). *(Décision 2026-07-15 : bug d'audit — l'app affichait des EUROS alors que Paddle facture en DOLLARS, prod ET sandbox en USD, devise unique.)* Prix officiels : **Lifetime 149 $ · Mensuel 12,99 $ · Annuel 79 $** (6,58 $/mois affiché mensualisé).
    - **✅ LIVRÉ (2026-07-16)** : **`services/prices.ts`** (nouveau) = SOURCE UNIQUE `PRICES` (149 / 12.99 / 79 / 6.58 / **0.22** — le « 0,21 » historique était un arrondi FAUX, 79/365 = 0,216 → arrondi SUPÉRIEUR pour ne jamais sous-annoncer) + **`formatUSD(montant, lang)`** (manuel, pas d'`Intl` ; EN `$12.99`, FR/ES `12,99 $` avec **espace insécable ` `** anti-`$`-orphelin ; entiers sans décimales). Les 6 montants JSX des 2 écrans → `formatUSD(PRICES.…, lang)`. i18n : `annuel.sousTitre` → placeholders `{prixAn}`/`{prixCycle}` interpolés aux 2 points d'usage (« Facturé 79 $/an · soit 0,22 $/cycle ») ; `bottomText` → slogan STATIQUE converti en $ (décision : pas un prix qui suit Paddle). **🚨 Ne JAMAIS ré-écrire un montant en dur dans un écran — toujours `PRICES` + `formatUSD`.** Parcours de paiement : **zéro ligne touchée** (verrou point 11, toasts point 9, price IDs `.env`, webhook intacts). `tsc` clean. Seul le mockup mort `onboarding_manifestmind.html` garde des `€` (part au point 19).
    - **Où c'est écrit en dur** : montants dans le JSX de `pricing.tsx` (l. ~400/427/452) **ET** `pricing-upgrade.tsx` (l. ~294/321/346) = `149€`, `6,58€`, `12,99€` (dupliqués sur 2 écrans). + i18n `t.pricing.plans.annuel.sousTitre` (« 79€/an · soit 0,21€/cycle ») et `t.pricing.bottomText` (« Moins de 0,50€… ») en **FR/EN/ES**. Les clés `unite` (`/mois`, `une fois`) sont **neutres** (OK).
    - **Approche retenue (à coder en Phase D)** : **Option A — dollars EN DUR, mais CENTRALISÉS** en une source unique (constante `PRICES` + helper `formatUSD(montant, lang)`), utilisée par les 2 écrans + interpolée dans l'i18n. **PAS de fetch dynamique Paddle** (Option B) : sur-dimensionné pour une devise unique + rares changements, et ça coupleraient l'affichage du prix à la dispo de Paddle.js (bloqueur de pub → prix invisibles, ironique vu le point 9). ⚠️ Contrepartie assumée : garder `PRICES` en phase avec Paddle manuellement (rappel : le **vrai** montant facturé s'affiche de toute façon dans l'overlay Paddle au checkout).
    - **Annuel** : garder le **« 6,58 $/mois » en tête** (argument commercial) MAIS avec sous-titre **« facturé 79 $/an »** bien visible (honnêteté / anti-litige). ⚠️ Rounding à corriger : 79/365 = 0,216 → **0,22 $/cycle** (le « 0,21 » actuel est faux).
    - **Format par langue** (⚠️ le `$` se place différemment) : **EN `$12.99`** (symbole avant, point décimal) · **FR `12,99 $`** · **ES `12,99 $`** (symbole après + espace, virgule décimale). Éviter `Intl.NumberFormat` pour USD (rend « 12,99 $US » en fr/es + support RN partiel) → **petit formateur manuel** piloté par la langue.

**PHASE E — Légal & conformité** — **ORDRE INTERNE DÉCIDÉ (2026-07-16) : 15 → 16 → (14+17 FUSIONNÉS)**. Les documents légaux sont la PHOTOGRAPHIE de l'app : on livre d'abord l'export (15) et la qualification consentement (16), PUIS une passe UNIQUE d'édition des 9 fichiers (14+17) — sinon on éditerait et redéploierait deux fois.

15. ✅ **~~Export de données~~** (droit RGPD de portabilité) — **FAIT ET VALIDÉ (2026-07-16)** (tests : export nominal + essai anonyme OK ; l'outil a même servi de RADIOGRAPHIE pour sceller le diagnostic du bug persistance — preuve que les données locales étaient intactes). ⚠️ Un processus par e-mail est légalement suffisant mais **matériellement impossible ici** : avec l'Option A, journal/prénom/progression sont LOCAUX (on ne détient pas ces données côté serveur) — seule l'app peut les exporter.
    - **Livré** : **`services/dataExport.ts`** (nouveau) — `exporterDonnees(lang)` assemble un JSON unique (`manifestmind-export-AAAA-MM-JJ.json`, indenté) : sections `export` (méta) / `compte` (Auth : type permanent|essai_anonyme, email, uid, méthodes, date) / `abonnement` (Firestore + marqueurs locaux, **FAIL-OPEN** : panne serveur → note d'erreur, l'export local part quand même — un droit RGPD ne dépend pas du réseau) / `progression` / `journal` (scan préfixe `journal_cycle_*`) / `visionBoard` + `photoProfil` (data-URIs inclus — poids borné par localStorage ≈ 5-6 Mo max, cas typique 1-3 Mo, zéro coût serveur/réseau : Blob 100 % local) / `preferences`. Exclusions volontaires : `sub_sync_uid`, `emailForSignIn` (plomberie). Livraison : web = Blob + `<a download>` ; natif = `expo-file-system` + `expo-sharing` (pattern `useShare.ts`).
    - **UI** : rangée « Exporter mes données » dans `parametres.tsx` entre « Se déconnecter » et « Supprimer mon compte » (les 2 droits RGPD côte à côte). Accessible à TOUS (essai anonyme + paywallé — parametres déjà whitelisté A.2, gate intact). Verrou anti double-clic (`exportingRef` synchrone), toasts `t.parametres.compte.{exportOk,exportErreur}` (jamais Alert). i18n : 3 clés neuves ×3 langues.
    - **🚨 RÈGLE DE MAINTENANCE** : toute NOUVELLE clé AsyncStorage porteuse de données utilisateur doit être ajoutée à la liste explicite de `dataExport.ts` (en-tête du fichier le rappelle).
    - 📌 Constat annexe hors périmètre (préexistant) : le quota localStorage (~5 Mo) peut refuser silencieusement une photo de vision board très lourde (`QuotaExceededError` avalé) — polish futur éventuel, rien d'urgent.
16. 🟡 **Consentement cookies — QUALIFIÉ (2026-07-16) : PAS DE BANNIÈRE REQUISE.** Inventaire : Firebase Auth (IndexedDB, session) = exempté (strictement nécessaire) · AsyncStorage (progression/préférences) = exempté (le service même) · cookies Paddle au checkout = exemptés (nécessaires à la transaction initiée) · cookies Google du popup Sign-In = domaine google.com, mention en politique · **AUCUN analytics/pub/pixel**. Requis : la seule TRANSPARENCE (section stockage dans la politique de confidentialité → passe 14+17). 🚨 **DÉCLENCHEUR DE REQUALIFICATION** : le jour où un analytics/monitoring est ajouté (Sentry évoqué au point 9, Google Analytics…), la bannière devient OBLIGATOIRE **AVANT** l'activation de l'outil.
17. **Mentions Paddle** (merchant of record) — fusionné dans la passe 14. Exigences : CGU/confidentialité/remboursement accessibles ✅ (prérequis de l'approbation domaine, point 23) · **mention MoR à AJOUTER** (formule type : « Nos commandes sont traitées par notre revendeur en ligne Paddle.com, qui est le Merchant of Record. Paddle gère les demandes de service client et la facturation. ») · politique de remboursement à aligner sur les conditions acheteur Paddle (Paddle peut accorder des remboursements) · TVA collectée/reversée par Paddle, reçu émis par Paddle.

14. ✅ **~~CGU + confidentialité + remboursement — PASSE UNIQUE ×9 FICHIERS~~ — FAIT ET PUBLIÉ (2026-07-16, commit `ddb58db` sur `manifestmind/manifest-mind`).** Textes FR validés par l'utilisateur puis déclinés EN/ES. Résultat : CGU ×3 réécrites en **14 sections** (essai 7 cycles sans carte, compte/auth réelle, paiement/remboursement/résiliation/restauration **selon plateforme** web Paddle MoR / stores, export, réinit abonnés, suppression ≠ résiliation) · confidentialité ×3 en **11 sections** (auth réelle + essai anonyme, niveaux corrigés dans les 3 langues — EN `Awakening/Grounding/Expansion/Manifestation`, ES `Despertar/Arraigo/Expansión/Manifestación` = `t.niveaux` de l'app —, mention analytics RETIRÉE, serveurs complétés Paddle IDs, Paddle en tiers, **nouvelle section « Stockage local et cookies »**, portabilité → bouton export) · remboursement ×3 (lifetime ajouté, Paddle MoR, résiliation honnête, tutoiement harmonisé FR/ES, dates juillet 2026). Intégrité vérifiée : balises équilibrées, mêmes comptes de sections/paragraphes dans les 3 langues, badges + © 2026 ×9. HTML/CSS/SVG préservés (seul ajout : règles `h3` + `a{color}` aux 3 CGU pour les sous-titres plateforme).
    - **🏪 NOTE PHASE 2 (stores)** : les documents couvrent DÉJÀ les deux plateformes — **MAIS relire les règles ANTI-STEERING d'Apple/Google au moment de la soumission** : les sections « selon ta plateforme » mentionnent le web et Paddle, ce qu'Apple peut juger comme de l'incitation au contournement de l'IAP (guideline 3.1.1/3.1.3). Ajuster les textes si besoin AVANT soumission (ex. version des docs servie dans l'app native sans les mentions web).
    - *(Checklist d'audit d'origine conservée ci-dessous pour référence historique.)*
    - **⚙️ Méthode** : cloner le repo GitHub Pages `manifestmind/manifest-mind` (branche `main`) en dossier VOISIN (pas dans le repo app) → éditer → commit + push → Pages redéploie. Les 9 fichiers sont servis sur `manifest-mind.app/*.html` (le CNAME du repo est actif ; les URLs `github.io` font un 301 vers le domaine).
    - **📋 AUDIT COMPLET (2026-07-16, pages publiées lues intégralement) — CHECKLIST D'ÉDITION :**
    - **✅ Déjà bon (ne pas re-corriger)** : AUCUN « 7 jours/7 days/7 días » (corrigés par l'utilisateur en juin) · AUCUN prix (ni € ni $ — bonne pratique, les docs ne se périment pas quand les prix bougent) · remboursements disent déjà « 7 premiers cycles gratuits sans carte bancaire » ×3 langues.
    - **🔴 CGU ×3 (`conditions_utilisation_fr` / `terms_of_use_en` / `terminos_uso_es`) — réécriture ~50 % : elles décrivent une APP STORE NATIVE (la Phase 2, pas notre lancement web Paddle)** :
      - §1-2 « application mobile », « en téléchargeant, installant » → app web
      - §3 « accès conditionné à un abonnement payant » = FAUX → décrire l'essai 7 cycles sans carte
      - §3 « paiements traités par l'App Store (Apple) ou Google Play » → **Paddle (merchant of record)**
      - §3 renouvellement désactivable « depuis App Store/Google Play » → Paddle (lien du reçu / contact)
      - §4 remboursements « gérés par Apple ou Google » (reportaproblem.apple.com, Play 48h) → Paddle + contact
      - §5 « Restaurer les achats » → masqué sur web ; réalité = reconnexion (email+mot de passe / Google)
      - §7 réinitialisation « accessible depuis le Profil » → réservée aux ABONNÉS (correctif A.3)
      - §7 suppression : « abonnement à résilier depuis App Store/Google Play » → Paddle
      - AJOUTER : description de l'authentification réelle (essai anonyme → conversion cycle 8, Google, email+mdp) + mention Paddle MoR (point 17)
    - **🟠 Confidentialité ×3 (`politique_confidentialite_fr` / `privacy_policy_en` / `politica_privacidad_es`) — retouches ~35 %** :
      - §2 connexion « Google, Apple ou Magic Link » → email+mdp (principal) + Google ; Apple absent du web ; magic link = ré-auth RGPD seulement ; AJOUTER le compte ANONYME d'essai (un UID existe dès l'essai)
      - §2 niveaux « Éveillé, Floraison, Rayonnant, Manifestant » → **Éveil, Ancrage, Expansion, Manifestation** (×3 langues : Awakened/Blossoming/Radiant/Manifesting et Despierto/Floreciendo/Radiante/Manifestando sont FAUX aussi)
      - §3 🚨 « améliorer l'application de façon anonyme et agrégée » = **traitement INEXISTANT (aucun analytics) → RETIRER** (déclare des obligations RGPD pour rien)
      - §4 serveurs « uniquement e-mail, nom d'affichage » → AJOUTER : statut d'abonnement + identifiants Paddle (`paddle_customer_id`, `paddle_subscription_id`…) écrits par le webhook dans Firestore
      - §5 tiers Google/Apple → Google (web) + **AJOUTER PADDLE** (destinataire des données de paiement, MoR)
      - §7 réinitialisation universelle → abonnés seulement
      - §8 portabilité sans moyen concret → pointer le bouton « Exporter mes données » (point 15)
      - AJOUTER : section transparence stockage (localStorage/AsyncStorage, IndexedDB Firebase, cookies Paddle checkout, cookies Google Sign-In) — livrable du point 16
    - **🟢 Remboursement ×3 (`remboursement_fr` / `refund_policy_en` / `politica_reembolso_es`) — retouches légères** :
      - §2 ne cite que mensuel/annuel → AJOUTER LIFETIME (et son traitement)
      - §4 « annuler depuis les paramètres de votre compte » = FAUX (pas de gestion d'abo in-app en V1) → lien du reçu Paddle ou contact support
      - AJOUTER mention Paddle MoR (c'est Paddle qui accorde les remboursements)
      - 📅 Date « juin 2025 » + « © 2025 » → coquilles (mise à jour réelle : juin 2026)
      - Cosmétique (optionnel) : design différent des 2 autres docs (pas d'œil, style brut)
    - ✅ **~~Micro-retouche APP~~ — FAIT (2026-07-16)** : les 9 URLs `t.legal.*` pointent désormais DIRECTEMENT sur `https://manifest-mind.app/….html` (fini le 301 via github.io).

**PHASE F — Nettoyage avant prod**

**📋 PLAN VALIDÉ + DÉCISIONS (2026-07-17) — À EXÉCUTER APRÈS le bouton d'installation PWA. Investigation faite en lecture seule, tout est vérifié.**
- **COMMIT A unique** (points 18, 19, 20 + meta PWA) — pas de Commit B. Puis smoke-test utilisateur.
- **`handleRestore` (×3) : LAISSÉS** (décision 2026-07-17) — échafaudages Phase 2 (RevenueCat natif), câblés à des boutons masqués sur web ; les retirer = zéro bénéfice web + casse le câblage futur. `parametres.handleRestorePurchases` fait un `Alert` (web-hidden), les 2 autres sont des stubs vides. **NE PAS TOUCHER.**
- **`MediaTypeOptions` déprécié : REPORTÉ PHASE 2 / post-lancement** (décision 2026-07-17) — c'est le SEUL vrai risque de la Phase F (touche le pick photo `profil.tsx:170` + `vision-board.tsx:153` **validé sur mobile le 2026-07-17**), et ce n'est qu'un warning. Ne PAS migrer avant le déploiement. Migration future : `mediaTypes: ['images']` + re-test du pick photo.
18. Retirer **boutons debug** (`reset` + `⏭ cycle suivant` + fonction `handleNextCycleDebug`) de `home.tsx` (~l.261, 287-302). ✅ Vérifié sans risque : `loadHome` (appelé par la fonction debug) reste utilisé ailleurs, aucun autre code ne référence ces boutons. Rappel : l'utilisateur forcera le cycle par la console (`localStorage.setItem('current_cycle','8')`+F5) au test du 1ᵉʳ paiement réel (point 28).
19. Nettoyer **code mort** (vérifié en lecture seule le 2026-07-17) : **supprimer** `components/ui/icon-symbol.tsx` + `.ios.tsx` (**aucun import**) · retirer dépendance **`expo-av`** de package.json (**aucun import code**) · **supprimer assets template orphelins** `assets/images/` : `react-logo.png`+`@2x`+`@3x`, `partial-react-logo.png`, `icon.png`, `favicon.png`, `android-icon-{background,foreground,monochrome}.png` (**aucune réf code**) — ⚠️ **GARDER `splash-icon.png`** (référencé par `expo-splash-screen` dans app.json, splash natif = todo Phase 2) · **supprimer 7 mockups HTML racine** (`onboarding_manifestmind.html`, `page_*.html`, `pages_*.html` — règle le dernier `€` du repo, point 13) · **envelopper dans `if (__DEV__)`** les logs non gardés : `useShare.ts:45`, `initialUrl.ts:20`, `_layout.tsx:59`, `pricing.tsx:84`&`:116`, `pricing-upgrade.tsx:79` (les 2 derniers loggaient l'e-mail → bonus vie privée). 🚨 **EXCEPTION — NE PAS TOUCHER** : tous les `console.warn/error` de `paddle.ts` (diagnostics intentionnels point 9) + `home.tsx:85` (warn lié au flag DEBUG, inoffensif quand false).
    - **➕ EXTRA (même Commit A) — meta PWA** : dans `app/+html.tsx:39`, **AJOUTER** `<meta name="mobile-web-app-capable" content="yes">` à côté de l'`apple-mobile-web-app-capable` (qu'on GARDE) → règle le warning console vu au test PWA.
    - **➕ EXTRA (même Commit A, 2026-07-17) — Alert.alert muets sur web → `showAuthToast`** (piège récurrent : `Alert.alert` = no-op silencieux sur RN Web). Découvert via le bouton **Partager** (paraissait mort sur desktop : il copiait bien mais sans feedback). CONVERTIS (web-atteignables) : `useShare.ts` ×2 (copié/échec), `parametres.tsx` ×2 (notifs refusées), `vision-board.tsx` ×1 (permission photo). **LAISSÉS** (non atteignables sur web) : `pricing.tsx:148` + `pricing-upgrade.tsx:92` (« disponible prochainement » — `canPay()`=true sur web → chemin natif Phase 2 où Alert fonctionne). Branche MOBILE du partage (feuille native) inchangée. Imports `Alert` morts retirés de `useShare.ts`/`vision-board.tsx`. *(Ces conversions étaient déjà listées « Priorité 3 / nettoyage prod » dans l'archive — traitées ici.)*
    - **🔴 EXTRA (même Commit A, 2026-07-17) — PARTAGE CASSÉ SUR WEB DEPUIS TOUJOURS, corrigé.** Le toast d'erreur (ci-dessus) a RÉVÉLÉ un crash présent depuis le début : `shareProgress()` (`useShare.ts`) entrait dans la branche `if (Sharing.isAvailableAsync())` — **`true` sur web dès que `navigator.share` existe** (Chrome desktop + TOUS les mobiles) — puis plantait ligne 34 sur `FileSystem.writeAsStringAsync`, **API inexistante sur web** (`UnavailabilityError`). Le crash était **masqué par l'`Alert.alert` no-op** → invisible pendant des mois (personne ne l'avait jamais vu). **Correctif** : branche `Platform.OS === 'web'` en tête → `Clipboard.setStringAsync(message)` + toast « Copié ! » puis `return` ; la branche **NATIVE (fichier + `Sharing.shareAsync`) reste byte-identique** pour la Phase 2. Le partage web = copier le TEXTE + le lien `manifest-mind.app` (levier d'acquisition virale, pas une image → le presse-papier suffit). ⚠️ **Note test** : sur mobile via TUNNEL = web → le partage prend aussi la branche presse-papier (le flux fichier ne marche QUE sur build natif Phase 2).
      - 📚 **LEÇON** : un `Alert.alert` muet sur RN Web peut cacher un **crash** (pas juste une absence de feedback) pendant des mois. Toujours convertir les `Alert.alert` en toast tôt — le silence masque parfois pire qu'un message manquant.
      - 🔮 **Amélioration possible POST-LANCEMENT (hors périmètre)** : sur mobile web, utiliser `navigator.share({ text: message })` pour ouvrir la vraie feuille de partage native (au lieu du simple presse-papier). Écartée en V1 : ajoute de la complexité + retest par navigateur, alors qu'on veut du fiable près du déploiement. Cf. aussi section 🎨 DESIGN.
20. Corriger `app.json` (**plugin `expo-font` déclaré en double** — les 2 blocs sont IDENTIQUES, vérifié ; retirer l'un). Re-`expo export` après (config build sensible).
21. ✅ **`DEBUG_SKIP_PAYWALL = false`** — **déjà vérifié** (config.ts:51 = `false`). Juste re-confirmer au moment du commit, aucun changement attendu.

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
    - **✅ POINT 22 COMPLÈTEMENT BOUCLÉ (2026-07-18)** : produits/prix PROD ✅ (USD, périodes corrigées : Vie one-time / Annuel yearly / Mensuel monthly) · price IDs `.env` ✅ (identiques au dashboard, mapping code vérifié) · client token prod ✅ (`live_2c65…`, bon compte) · webhook prod « Events: 10 » ✅ (9 requis présents + 1 extra inoffensif) · **SECRET webhook prod VALIDÉ ✅** — `scripts/test-webhook.js` avec le secret prod → **HTTP 200** (chaîne complète prouvée : secret posé dans Secret Manager + function déployée avec + signature validée + écriture Firestore). Doc test `TEST_WEBHOOK_LOCAL_001` supprimé, secret effacé de la session. ⏳ Seul reste avant build : basculer `EXPO_PUBLIC_PADDLE_SANDBOX=false` (à la toute fin).
    - **🚨 PAS DE « SIMULATE » dans ce dashboard Paddle** (Developer Tools = Authentication / Data / Notifications seulement, pas de simulateur). → **Le secret webhook prod sera validé par le 1ᵉʳ VRAI PAIEMENT (point 28)** : accès qui s'active = secret bon ; sinon → destination webhook → **« View log »** donne le code (200 = OK / 401 = reposer le secret + `firebase deploy --only functions`). **Alternative de pré-test SANS paiement** : `scripts/test-webhook.js` avec le secret prod en variable d'env (signe un event factice → 200 si le serveur a le même secret ; écrit un doc test `users/TEST_WEBHOOK_LOCAL_001` à supprimer après). ⚠️ Le paiement lui-même n'est JAMAIS perdu si le webhook échoue (Paddle encaisse + **retente les webhooks plusieurs fois sur ~3 j** → auto-rattrapage après correction ; + replay manuel possible + runbook Firestore).
23. ✅ **~~Approuver le domaine `manifest-mind.app` par Paddle~~** — **FAIT (2026-07-15)**. Paddle a approuvé le domaine (« vous pouvez commencer à collecter les paiements dès que vous serez prêt »). **Le seul délai externe de la feuille de route est levé** — tout le reste ne dépend plus que de nous.
23-bis. 🆕 **Détails de paiement Paddle — compte bancaire pour RECEVOIR les fonds.** Sans ça, on peut encaisser côté client mais Paddle **ne peut pas reverser**. Dashboard Paddle → *Business / Payout details* → compte bancaire + infos fiscales/entreprise. **À finaliser une fois le catalogue prod configuré (point 22).** Peut demander une vérification (prévoir un peu de marge).
24. **Config Google prod** : `manifest-mind.app` aux domaines Firebase ; **publier l'écran de consentement OAuth** ; (voir ci-dessous le statut DÉCLASSÉ du handler auth Safari).
    - **🔐 ÉCRAN DE CONSENTEMENT OAuth — CLARIFIÉ (2026-07-17) : simple PUBLICATION, PAS de vérification à délai.** C'est le SEUL avertissement de sécurité réel (« Application non vérifiée par Google » au Google Sign-In) — **rien à voir avec la PWA** (voir note « Avertissements de sécurité » ci-dessous). Où : Google Cloud Console → projet `manifestmind` → **APIs & Services → OAuth consent screen**. Infos : type **External**, nom (ManifestMind), e-mail support (`contact@manifest-mind.app`), logo (icône M+œil), domaine autorisé (`manifest-mind.app`), liens Confidentialité + CGU (✅ on les a), e-mail dev. **Scopes demandés = `email`/`profile`/`openid` UNIQUEMENT (non sensibles)** → **« Publier l'application » (Testing → In production) = effet quasi immédiat, PAS de review à délai, risque de refus quasi nul.** La vérification longue (jours/semaines) ne concerne QUE les scopes sensibles (Gmail/Drive/contacts) — **PAS notre cas.** → Moins urgent que Paddle (aucun délai externe), reste au point 24 ; mais gratuit/rapide/sans risque, peut être avancé à tout moment si on veut nettoyer l'avertissement tôt.
    - **🛡️ AVERTISSEMENTS DE SÉCURITÉ — bilan (2026-07-17)** : **la PWA ne déclenche AUCUNE alerte** (« app non vérifiée / virus ») → c'est un **raccourci vers un site HTTPS, zéro exécutable téléchargé** ; ces alertes ne concernent que le sideloading d'`.apk`/`.exe`. Installations testées sur 2 téléphones + PC **sans aucun avertissement** = représentatif (mécanisme identique pour tous). Seul vrai point = l'OAuth ci-dessus. Mineurs à savoir : magic link RGPD peut tomber en spam ; certificat HTTPS auto-fourni par l'hébergeur (l'interstitiel vu pendant les tests = localtunnel, temporaire, sans rapport prod).
    - **🧹 NETTOYAGE DES DOMAINES DE TUNNEL (à faire en Phase G, ici au point 24)** — pendant les tests mobiles, plusieurs URLs de tunnel ont été autorisées à utiliser l'auth et le checkout. **À SUPPRIMER** :
      - **FIREBASE** → Authentication → Settings → Authorized domains → retirer tous les `*.trycloudflare.com` / `*.loca.lt` accumulés (constatés le 2026-07-17 : `angry-sheep-float.loca.lt`, `duplicate-plenty-alabama-key.trycloudflare.com`, `enzyme-pencil-organisations-recipe.trycloudflare.com`, `ebony-invisible-promotion-harper.trycloudflare.com` — + toute autre URL de tunnel ajoutée depuis). **GARDER** : `manifest-mind.app` + `localhost`.
      - **PADDLE SANDBOX** → Checkout → Approved domains → retirer les mêmes domaines de tunnel. **GARDER** : `manifest-mind.app` + `localhost`.
      - ⚠️ Raison : ce sont des domaines autorisés à utiliser l'auth + le checkout ; ne rien laisser traîner avant la prod.
    - ✅ **RISQUE SAFARI/IPHONE LARGEMENT LEVÉ (test 2026-07-17)** — sur **iPhone Safari, PWA installée depuis le tunnel**, Google Sign-In fonctionne : **le popup s'ouvre et l'autorisation passe** (compte `ncpnettoyage@gmail.com`, reconnu abonné, passe le cycle 7 sans paywall). Le blocage des cookies tiers **ne s'est PAS matérialisé**. → **La sous-tâche « servir le handler auth depuis notre domaine » (`authDomain` + rewrite Firebase Hosting) est DÉCLASSÉE en CONTINGENCE**, pas retirée. **2 réserves honnêtes** : (a) c'est le chemin **popup** qui a réussi — le repli `signInWithRedirect` (déclenché seulement si le popup est bloqué), lui, dépend toujours des cookies tiers et **n'a PAS été exercé** ; (b) testé sur **domaine tunnel**, pas sur `manifest-mind.app`. → **Déclencheur pour ressortir le fix** : si, au **re-test final sur le vrai domaine (point 28)**, le popup est bloqué ET le repli redirect casse sur Safari. Sinon, ne rien coder.
    - **🔑 Restreindre la clé API web** (déplacée du point 5 ; protège le quota/facture, PAS les données) — Console Google Cloud → projet `manifestmind` → **APIs & Services → Credentials** → clé « Browser key (auto created by Firebase) » (`AIzaSyDqKc…`) :
      1. **Application restrictions → Websites (HTTP referrers)** — ajouter **TOUS** les référents sinon l'auth casse : `manifest-mind.app/*`, `*.manifest-mind.app/*`, **`manifestmind.firebaseapp.com/*`** (⚠️ domaine du handler d'auth — popup/redirect Google + magic link ; l'oublier casse la connexion), `manifestmind.web.app/*` (si Hosting par défaut), `localhost/*` + `localhost:*/*` (dev) — ou **clé de dev séparée**.
      2. **API restrictions → Restrict key** — ne cocher que : **Identity Toolkit API**, **Token Service API**, **Cloud Firestore API**, **Firebase Installations API**, **Cloud Storage** (l'app appelle `getStorage`).
      3. **Save** → propagation ~5 min → **tester sur le vrai domaine** : login email+password, popup Google, magic link RGPD, lecture Firestore.
      - ⚠️ **Phase 2 native** : la restriction par référent bloquerait l'app native (pas de referrer) → **clé distincte** avec restriction Android (SHA-256) / iOS (bundle ID).

**PHASE H — PWA & déploiement**
25. ✅ **~~PWA~~ — FAIT (2026-07-17).** 
    - **🎨 IDENTITÉ VISUELLE DÉFINITIVE (décision utilisateur, web ET stores)** : fond **violet `#6B3FA0`** + **M Cormorant Garamond SemiBold crème `#F0EAE0`** + **l'œil** (état final des animations, paupières assombries `#2A1840`, sans halo) niché au creux du M. **Deux niveaux** (pratique standard) : M+œil détaillé pour ≥48 px (écrans d'accueil 120-192 px physiques, stores) ; **œil SIMPLIFIÉ** pour les favicons 16/32 (traits épaissis, 3 formes pleines — le M y serait illisible, vérifié au pixel).
    - **Fichiers** : `public/icons/` (7 PWA : 192, 512, maskable-192/512, apple-touch-180, favicon-32/16) · `assets/icons/` (`icon-1024.png` **3 canaux sans alpha — exigence Apple vérifiée**, `adaptive-foreground-1024.png` transparent, `icon-source.svg` = source vectorielle canonique, M en CHEMIN extrait de la police par opentype.js — régénérable à toute taille).
    - **Zones sûres VÉRIFIÉES AU PIXEL** (scan programmatique du rayon de contenu) : maskable 39,5 % ≤ 40 % ✅ · adaptatif 32,0 % ≤ 33 % ✅. Le contenu plein format atteint Ø90,8 % → maskable = composition ×0,87, adaptatif = ×0,705 (même design, échelles adaptées).
    - **`public/manifest.webmanifest`** : short_name « ManifestMind » (12 car.), display standalone, theme/background `#F0EAE0` (crème — l'UI de l'APP est crème ; l'icône est violette, c'est voulu), icônes any + maskable.
    - **`public/sw.js` — SW MINIMAL 3 RÈGLES (contrat de sécurité en tête de fichier, NE PAS « améliorer »)** : (1) navigations = RÉSEAU d'abord (cache = secours hors-ligne uniquement → jamais coincé sur une vieille version) ; (2) cache-first UNIQUEMENT `/_expo/`+`/assets/`+`/icons/` (noms hashés = immuables par construction) ; (3) **cross-origin et non-GET JAMAIS interceptés** (Paddle/Firestore/Google Auth ne voient pas le SW). Pas de skipWaiting. Enregistré par `app/+html.tsx` **sauf port 8081** (dev Expo protégé).
    - **`app/+html.tsx`** (nouveau, coquille HTML officielle expo-router) : manifest, favicons, apple-touch-icon, theme-color, meta iOS, enregistrement SW.
    - **`app.json`** : `icon` → 1024 · `android.adaptiveIcon` → foreground + fond `#6B3FA0` (**câblage Phase 2 fait, inerte sur web** ; les refs template `android-icon-*` retirées — dont `monochromeImage` : une icône monochrome propre pour Android 13 est à créer en Phase 2, cf. 🎨 DESIGN) · `web.favicon` → favicon-32. ⚠️ Doublon `expo-font` NON touché (point 20).
    - **Vérifié** : `tsc` 0 erreur · `expo export` OK · `dist/` contient manifest + sw.js + robots.txt + icons/ + head complet (liens vérifiés au grep).
    - 📎 Les assets template devenus orphelins (`assets/images/icon.png`, `android-icon-*`, `favicon.png`) → **à supprimer au point 19 (Phase F)**.
    - **✅ POINT 27 — COHABITATION DOMAINE : APPROCHE VALIDÉE (2026-07-17)** — cf. point 27 détaillé ci-dessous.
26. Build : `npx expo export --platform web`.
27. **Déployer sur `manifest-mind.app` — APPROCHE VALIDÉE (2026-07-17) : tout servir depuis UN hébergeur (Firebase Hosting).**
    - **Le problème (résolu)** : conflit de propriété du domaine apex. Aujourd'hui `manifest-mind.app` appartient à **GitHub Pages** (branche `main` = 9 docs légaux + `CNAME`). Un seul hébergeur peut posséder l'apex → l'app et Pages ne peuvent pas se le partager.
    - **La solution (3 gestes au déploiement)** : (1) **copier les 9 HTML légaux dans `public/` de l'app** → Expo les copie à la racine du build → servis aux **MÊMES URLs** (`manifest-mind.app/conditions_utilisation_fr.html`…), aucun conflit de noms avec les routes (`home.html`/`index.html` distincts), les `t.legal.*` continuent de marcher **sans changement** ; (2) **déployer tout le `dist/` sur Firebase Hosting** (même projet Google que le backend ; gère le rewrite `/__/auth/**` si le point 24 l'exige un jour) + pointer le DNS de `manifest-mind.app` vers Firebase ; (3) **libérer le domaine de GitHub Pages** (retirer le custom domain / `CNAME` de `main`).
    - **Confirmé** : `manifest-mind.app/` servira `index.html` = route initiale (`app/index.tsx` → welcome/splash) → l'utilisateur arrive **DIRECTEMENT sur l'app, aucune page intermédiaire**.
    - **Conséquence maintenance** : à partir du point 27, les docs légaux se maintiennent dans `public/` du repo app (UNE source ; la branche `main`/Pages devient backup ou archivée). **PAS bloquant avant le déploiement** (Pages sert les docs d'ici là).
28. **Tests finaux réels** (vrai paiement, multi-navigateurs dont **Safari/iPhone**).
    - 📧 **Vérifier le destinataire du reçu Paddle.** Au **premier VRAI paiement en prod**, confirmer que le **reçu/la confirmation Paddle part bien au CLIENT** (e-mail saisi/utilisé au checkout), **pas à moi**. ⚠️ En **sandbox**, les confirmations arrivent sur MON e-mail vendeur — **comportement normal du sandbox** ; l'e-mail client est bien enregistré sur la transaction. À revalider en prod car un reçu manquant côté client = source de litiges/chargebacks.
    - **🧹 NETTOYAGE DES DONNÉES DE TEST — APRÈS le test de paiement réel, JUSTE AVANT le lancement (⚠️ PAS avant : des comptes de test peuvent servir au paiement réel)** :
      - **FIREBASE** → Authentication → Users → supprimer tous les comptes de test (`ncpnettoyage@…`, `fortuneoffhell+*@…`, `duboislyana@…`, + autres créés aux tests).
      - **FIRESTORE** → collection `users` → supprimer les documents de test correspondants (dont le doc résiduel du 2026-07-16 matin `subscription_active:true` non désactivé, cf. point 12).
      - **TÉLÉPHONES** → désinstaller les PWA de test (elles pointent vers des tunnels MORTS) → réinstaller la vraie depuis `manifest-mind.app`.
      - 📌 Les abonnements Paddle **SANDBOX** peuvent RESTER (environnement séparé de la prod, ne polluent rien).
→ 🚀 **PUBLICATION WEB**

**Notes :** Phases **A, B, C, D, E** ✅ · **PWA point 25** ✅ · **bouton install 4-bis** ✅ · **ÉTAPE 4 tests mobiles** ✅ · **PHASE F ✅ TERMINÉE (2026-07-17, commit `949afe3`)**. **⚠️ L'ORDRE D'EXÉCUTION du reste = le bloc « 🔢 ORDRE D'EXÉCUTION — RÉORGANISÉ » EN TÊTE de cette roadmap.** **Aucun déploiement public avant que tout soit testé ET nettoyé.** Après lancement web → **PHASE 2 stores** (⚠️ relire l'anti-steering des docs légaux, cf. point 14).

**📊 ÉTAT PHASE G (pause 2026-07-18 soir) — FAIT vs RESTE :**

> 🚨 **NATURE PHASE G/H : SURTOUT DES MANIPS QUE L'UTILISATEUR FAIT dans les dashboards** (Paddle, Firebase, Google Cloud). Claude ne peut PAS y accéder → guide pas à pas, ne suppose jamais une manip faite. **Garde-fou sandbox/prod : jamais mélanger `sandbox-vendors` et `vendors.paddle.com` ; `EXPO_PUBLIC_PADDLE_SANDBOX=false` = LE commutateur ; `live_*` ≠ `test_*`.**

**✅ FAIT :**
- **Point 22 (Paddle PROD) COMPLET (2026-07-18)** : produits/prix/périodes vérifiés (Vie 149 $ one-time / Annuel 79 $ yearly / Mensuel 12,99 $ monthly, **USD**) · price IDs + mapping code + token `live_2c65…` cohérents avec `.env` (bon compte) · webhook prod 9 événements + URL stable OK · **SECRET WEBHOOK VALIDÉ** (`test-webhook.js` → **HTTP 200**) · **domaine `manifest-mind.app` APPROUVÉ en LIVE**.
- **Point 23-bis (bancaire) COMPLET** : Payout settings enregistré, **Virement bancaire** (Payoneer ne couvre pas le Paraguay), entité **Horizonte Digital** (SAS Paraguay, type Corporations), **vérification compte au VERT, aucune attente**.
- **Point 24 EN PARTIE** : `manifest-mind.app` dans **Firebase Authorized domains** ✅ · **ménage domaines de tunnel** fait (Firebase + Paddle, ne restent que `manifest-mind.app` + défauts) ✅ · **écran OAuth** « En production », type Externe, champs remplis (nom ManifestMind, page d'accueil, liens légaux fr, domaine autorisé) ✅ · docs légaux déjà en **HTTP 200** sur `manifest-mind.app` (GitHub Pages).

**✅ PHASE G TERMINÉE (2026-07-19)** — tous les réglages Checkout LIVE finalisés :
- **Default payment link** = `https://manifest-mind.app` ✅
- **Statement descriptor** = **`MANIFEST`** ✅ (8 car., marque reconnaissable ; PAS « Horizonte » — le client verra `PADDLE.NET* MANIFEST`, anti-contestation)
- **Payment methods** : cartes auto-actives (socle Paddle non désactivable) ✅ + moyens choisis
- **Discount field** activé ✅ (requis pour le test -100 %)
- **Saving payment methods** activé ✅ (abonnements récurrents)
- **Marketing consent** désactivé (V1) ✅

**⏳ SEUL RESTE de la config prod : RESTREINDRE LA CLÉ API web** — **DÉPLACÉ EN PHASE H (option B)** : à faire JUSTE APRÈS le déploiement, testé directement sur `manifest-mind.app` (procédure détaillée prête au bloc « 24. »).

**📌 AMÉLIORATION POST-LANCEMENT (notée)** : email d'assistance OAuth → passer de `ncpnettoyage@gmail.com` à **`contact@manifest-mind.app`** (nécessite créer un compte Google avec l'adresse Zoho + confirmer que la boîte reçoit). Idéal : aligner support OAuth = docs légaux = `SUPPORT_EMAIL` app, tous sur `contact@`.

**📅 PLAN DE LA REPRISE — ORDRE RÉVISÉ (2026-07-19) : clé API APRÈS le déploiement (décision utilisateur — option B).**
> **Pourquoi option B** : le référent qui compte (`manifest-mind.app`) ne peut être testé qu'une fois l'app déployée ; localhost est capricieux avec les référents (faux négatifs) ; la restriction protège le quota/facture PAS les données (déjà couvertes par les règles Firestore) → aucune urgence avant la mise en public. **Procédure clé API inchangée, PRÊTE (bloc « 24. » ci-dessous) — juste appliquée après le déploiement, testée directement sur `manifest-mind.app`.**
1. **[UTILISATEUR] Default payment link Paddle** → `https://manifest-mind.app` (Checkout > Checkout settings) + activer les **payment methods** (cartes).
2. **PHASE H — build + déploiement** :
   - **[CLAUDE]** Copier les 9 HTML légaux dans `public/` de l'app (cohabitation domaine, point 27) + préparer `firebase.json` Hosting.
   - **[CLAUDE, sur ton feu vert]** `EXPO_PUBLIC_PADDLE_SANDBOX=false` dans `.env` + `npx expo export --platform web` → `dist/`.
   - **[UTILISATEUR]** Déployer sur **Firebase Hosting** + DNS `manifest-mind.app` + **libérer GitHub Pages** (retirer custom domain/CNAME).
3. **[UTILISATEUR + guide CLAUDE] Restreindre la clé API web — JUSTE APRÈS le déploiement, testée DIRECTEMENT sur `manifest-mind.app`** (procédure détaillée au point 24 : référents `manifest-mind.app/*`, `*.manifest-mind.app/*`, `manifestmind.firebaseapp.com/*`, `manifestmind.web.app/*`, `localhost/*`+`localhost:*/*` ; APIs : Identity Toolkit, Token Service, Cloud Firestore, Firebase Installations, Cloud Storage). ⚠️ **Tester l'auth après ~5 min** (login email+mdp, popup Google, magic link, lecture Firestore) SUR le domaine. 🛟 Rollback = Application restrictions → None.
4. **✅ GATE (3 verts avant de payer)** : domaine **APPROUVÉ** ✅ (déjà) + **vérification compte PASSÉE** ✅ (déjà) + app **DÉPLOYÉE**.
5. **[UTILISATEUR] Test paiement réel** avec **code -100 %** (créé en live, checkout complet à 0 $, rien à rembourser) sur `manifest-mind.app` → vérifier : transaction `completed` · webhook 200 · `subscription_active=true` · accès débloqué · reçu Paddle au CLIENT. **Archiver le code -100 % après.**
6. **🧹 [UTILISATEUR] Nettoyage données de test APRÈS le paiement** (comptes Firebase Users + docs Firestore `users` + réinstaller les PWA depuis `manifest-mind.app`) → 🚀 **PUBLICATION WEB.**
   - 🚨 **Garde-fous guides Paddle** : ne JAMAIS recréer/supprimer la destination webhook live (régénère le secret → casse tout), ni éditer/supprimer les produits/prix live (immuables une fois utilisés).
   - 🧪 **Rappel TUNNEL** (si re-test) : `npx expo export --platform web` + `npx serve dist -l 3000` + `cloudflared tunnel --url http://localhost:3000` ; URL change → re-autoriser Firebase + Paddle.

**✅ BLOC B — DÉPLOIEMENT TEST + VÉRIFICATION B2 (2026-07-19) :**
- **B1 déploiement test OK** : `npx firebase deploy --only hosting` → **`https://manifestmind.web.app`** (63 fichiers, aucune erreur). `manifest-mind.app` **pas touché** (sert encore les docs légaux via GitHub Pages).
- **B2 VÉRIFICATION LECTURE SEULE VALIDÉE** : ✅ app charge (welcome + langues) · ✅ navigation + onboarding + cycle complet + célébration · ✅ les 3 langues · ✅ Google Sign-In (marche sur `web.app` : domaine Firebase auto-autorisé) · ✅ docs légaux en accès direct + liens in-app (les liens pointent en dur vers `manifest-mind.app`, servi par GitHub Pages → 200) · ✅ paywall cycle 8 → redirige bien vers la page de paiement (le gate marche) · ✅ auth email : détection « compte existant » OK (testée avec un ancien email de test → comportement correct, PAS un bug). **PWA** : normal de ne PAS voir les bannières en navigation privée desktop (déjà validées au tunnel mobile, étape 4).
- **⚠️ Reportés au vrai domaine (normal de ne PAS marcher sur `web.app`)** : **checkout Paddle** (seul `manifest-mind.app` approuvé en LIVE → à tester au Bloc E) · **aperçu OG** (balises pointent en dur vers `manifest-mind.app/og-image.png`, absent de GitHub Pages → à tester au Bloc C avec un debugger de partage).
- 📌 **Anciens comptes de test restants dans Firebase** (d'où le « email déjà utilisé ») → à nettoyer à l'étape E3 (nettoyage données de test après le paiement réel), comme prévu.

**🧹 POLISH V1.5 — Console web (bénin, NON bloquant lancement) :** deux logs propres à l'**export statique** (SSG + hydratation), **zéro impact utilisateur** (prouvé au B2 : tout fonctionne), **PAS des régressions** (invisibles en dev/tunnel car dev = rendu client pur, apparaissent uniquement avec le pré-rendu HTML) :
1. **React #418** (mismatch d'hydratation, probablement langue au 1ᵉʳ rendu : `+html.tsx` code `lang="fr"` en dur, le client rend selon la langue stockée) → React re-rend le sous-arbre côté client, imperceptible. **Piste correctif** : aligner le rendu initial sur la langue stockée / `lang` dynamique.
2. **Warning expo-router** « No route named "(app)/profil" (et parametres/name/activation) in nested children » → artefact de timing (résolution avant montage du layout `(app)`), les routes existent bel et bien (navigation OK). Interne à expo-router.
→ Décision (2026-07-19) : **on ne corrige pas avant le lancement** (mauvais rapport risque/bénéfice, risque de régression). À traiter en passe polish V1.5.

**✅ BLOC C — BASCULE DU DOMAINE `manifest-mind.app` → FIREBASE HOSTING — TERMINÉ (2026-07-19) :**
- **Registrar = Namecheap.** Setup apex Firebase standard : **A `@` → `199.36.158.100`** + **TXT `@` → `hosting-site=manifestmind`** (sans guillemets) ; les **4 A records GitHub** (`185.199.108/109/110/111.153`) **supprimés**. TTL baissé à 5 min en pré-vol. **Zoho 100 % intact** (aucun `MX`/`TXT` Zoho touché ; A ≠ MX) ; **Mail Settings = Custom MX** inchangé.
- **C1/C2 OK** : domaine ajouté dans Firebase Console → Hosting (mode « Configuration rapide »), TXT posé, A basculé (ajouter-avant-supprimer), « Valider » cliqué.
- **C3 VALIDÉ** : statut Firebase **« Connecté »** (SSL provisionné ; l'`ERR_CERT_COMMON_NAME_INVALID` transitoire a disparu). Vérifs HTTPS sur `manifest-mind.app` : app charge · cadenas valide · docs légaux directs (FR/EN/ES) servis par **Firebase** · liens légaux in-app OK · **Google Sign-In OK sur le vrai domaine** · **aperçu OG OK** (og-image.png désormais servi par Firebase — le test reporté du B2 est levé) · console = seulement les 2 logs bénins connus (#418 + warning route).
- **C4 TERMINÉ** : **CNAME `www` supprimé** (Namecheap — décision « option minimale », pas de 2ᵉ domaine Firebase → `www.manifest-mind.app` ne résout plus, voulu) + **custom domain retiré de GitHub Pages** (Settings → Pages, repo `manifest-mind` branche `main`). **GitHub Pages libéré** ; Firebase est seul maître de l'apex. Docs légaux toujours OK après libération (servis par Firebase). ⚠️ **Rollback GitHub instantané perdu** (assumé : C3 était 100 % vert et stable).
- 📌 **`www` non traité en 2ᵉ domaine Firebase** (choix minimal). Si un jour on veut `www → apex`, l'ajouter comme 2ᵉ domaine perso Firebase (noté, non bloquant).

**➡️ PROCHAINE ÉTAPE : BLOC E** (dans l'ordre) : **E1** restreindre la clé API web (sur le vrai domaine, procédure point 24) + tester l'auth → **E2** GATE (3 verts : domaine approuvé ✅ + compte vérifié ✅ + déployé ✅) → **E3** créer le code -100 % (usage limit 1) → **E4** test paiement réel Mensuel à 0 $ (vérifier transaction `completed` · webhook 200 · `subscription_active=true` · accès débloqué · reçu client) puis archiver le code + annuler l'abo test → **E5** nettoyage données de test → **E6 🚀 lancement.**

**✅ E1 — RESTRICTION CLÉ API WEB — TERMINÉ (2026-07-19) :**
- **Clé** = « Browser key (auto created by Firebase) » (`AIzaSyDqKc6XJz…`, = `EXPO_PUBLIC_FIREBASE_API_KEY`), projet Google Cloud `manifestmind`.
- **Application restrictions → Sites Web** : 6 référents ajoutés (**nouveau format Google, avec schéma, SANS `/*`**) : `https://manifest-mind.app` · `https://*.manifest-mind.app` · `https://manifestmind.firebaseapp.com` (CRITIQUE Google Sign-In) · `https://manifestmind.web.app` · `http://localhost:8081` · `http://localhost`.
- **📌 DÉCOUVERTE : les API restrictions étaient DÉJÀ posées par Firebase** (25 API auto-cochées à la création de la clé, incluant Identity Toolkit / Token Service / Cloud Firestore, etc.). La clé n'a **jamais** été « non restreinte » côté API — seulement côté application (« Aucune » avant E1). **On n'a PAS touché aux 25 API** (les trimmer à 5 = gain quasi nul vs risque de casse ; elles sont prouvées non-cassantes puisque l'app tournait déjà avec). **E1 = uniquement l'ajout des référents.**
- **Testé OK sur `manifest-mind.app`** : app charge (lecture Firestore) · console propre (pas de `API key not valid` ni `referer blocked`) · gate cycle 8 OK · navigation compte existant OK.
- 🛟 **Rollback documenté** (si besoin un jour) : Application restrictions → **Aucune** → Enregistrer → ~5 min. Ne jamais toucher aux API.

**✅ E3 + E4 — TEST DE PAIEMENT RÉEL EN PROD — RÉUSSI À 100 % (2026-07-19) :**
- **E3** : code **`LAUNCHTEST100`** créé en Paddle LIVE (Percentage 100 %, restreint au Mensuel, **usage limit 1**).
- **E4** : parcours réel sur `manifest-mind.app` (nav. privée, cycle 8 forcé par console, compte frais **`ncpnettoyage+launchtest@gmail.com`** via l'astuce Gmail `+`), plan **Mensuel**, code -100 % → checkout **0 $** → complété (mastercard). **Les 5 vérifs VERTES** :
  1. Paddle → Transaction **« Complete »** 0 $ (ManifestMind Mensuel).
  2. Webhook **prouvé** (Firestore, cf. #3 — le client ne peut pas écrire `subscription_active`, seul le webhook Admin SDK le peut).
  3. Firestore `users/{uid}` : **`subscription_active=true`**, `paddle_status="active"`, `paddle_event_type="subscription.activated"`, `paddle_customer_id` + `paddle_event_id` remplis, `updated_at` à l'heure du test.
  4. **Accès débloqué** (passage cycle 8).
  5. **Reçu Paddle** reçu par mail.
- **→ La chaîne paiement PROD complète est validée end-to-end** (checkout LIVE → webhook signé → Firestore → déblocage → reçu client). Reste **E5 (nettoyage)** puis **E6 🚀**.

**✅ E5 — NETTOYAGE + 🚀 LANCEMENT PHASE 1 (WEB + PWA) — TERMINÉ (2026-07-19) :**
- **E5.1** : code `LAUNCHTEST100` **archivé** (Paddle).
- **E5.2** : abo de test **annulé** (« Cancel immediately ») → webhook **`subscription.canceled`** prouvé → Firestore `subscription_active` repassé à **`false`**, `paddle_status="canceled"`. **➡️ Chaîne paiement validée DANS LES DEUX SENS (souscription ✅ + annulation ✅ = point 12 confirmé en PROD).**
- **E5.3** : **SLATE 100 % VIERGE** — tous les comptes de test supprimés : Firestore `users` (3 docs) + Authentication (18 comptes : emails + anonymes). Base propre pour les vrais utilisateurs.
- **E5.4** : **PWA réinstallée depuis `manifest-mind.app`** (bannière d'install OK, icône téléphone) = canal d'installation des utilisateurs Phase 1.
- **Flags confirmés (lecture seule)** : `DEBUG_SKIP_PAYWALL=false` · `EXPO_PUBLIC_PADDLE_SANDBOX=false` · `PADDLE_ACTIVE=true` · `STORES_ACTIVE=false`.

═══════════════════════════════
🚀🚀 **MANIFESTMIND — LANCÉE EN PHASE 1 (WEB + PWA) le 2026-07-19** 🚀🚀
═══════════════════════════════
**`https://manifest-mind.app` est publiquement fonctionnel** : app + PWA installable, 3 langues, essai **1 cycle gratuit → paywall après le cycle 1** (⚠️ 7 cycles au lancement, passé à 1 le 2026-07-21 — cf. bandeau modèle en tête) → paiement Paddle (Mensuel/Annuel/Vie en USD) → déblocage, auth email+mdp / Google, docs légaux servis par Firebase, clé API restreinte, chaîne paiement prouvée souscription+annulation, base vierge. **Le déploiement web est COMPLET.** Prochains chantiers → voir la section **« PROCHAINS CHANTIERS »** juste ci-dessous (analytics d'abord, stores ensuite).

═══════════════════════════════
📝 **DÉCISION MODÈLE — 1 CYCLE GRATUIT (au lieu de 7) — 2026-07-21**
═══════════════════════════════
- **Décision** : l'essai gratuit passe de **7 cycles à 1 SEUL cycle**. Motif : conversion trop lente avec 7 (rétention gratuite trop longue, erreur d'évaluation initiale) — corrigée pendant que **seuls des amis** utilisaient l'app (aucun impact vrai client). ⚠️ Cette décision **remplace** le modèle « 7 cycles → paywall cycle 8 » décrit plus haut dans l'historique (les mentions « 7 » antérieures = trace historique, non corrigées).
- **Parcours cible (obtenu)** : cycle 1 complet → **écran de félicitations AVEC les points** (non sauté) → **paywall dès le retour à l'accueil** (même session, sans attendre minuit) → **bloqué à chaque ouverture** tant que non-abonné → abonnement = accès cycle 2 + rythme quotidien normal dès le cycle 3.
- **Implémentation (Option B, la plus propre)** :
  - `services/config.ts` : `FREE_CYCLES` **7 → 1**.
  - `app/(app)/celebration.tsx` : avance immédiate de `next_cycle_time` (`Date.now()` au lieu de minuit) **UNIQUEMENT** à la frontière `cycle === FREE_CYCLES && non-abonné`. Les cycles payants ET les abonnés gardent minuit → **rythme 1/jour strictement intact** dès le cycle 3.
  - `services/access.ts` : `isPaywalled` **INCHANGÉ** (`cycle > FREE_CYCLES && !subActive`). ⚠️ Une 1ʳᵉ tentative via une clause `cycle_completed` a été **ANNULÉE** : elle créait une **course** (la célébration pose `cycle_completed` au montage, le gate le lisait dans la même navigation) qui **interceptait l'écran de félicitations**. Ne PAS ré-introduire cette clause.
  - Textes UI : 4 clés × 3 langues (`translations.ts` — titre carte, description, retourAbonne, freemiumTitre → « premier cycle offert / accompli »).
  - Docs légaux : 6 fichiers `public/` (CGU ×3 + Remboursement ×3) → « premier cycle offert », « à partir du 2ᵉ cycle ».
- **Effet de bord assumé (validé)** : le jour de l'abonnement, la personne peut faire cycle 1 (gratuit) **et** cycle 2 (payant) le même jour — **bonus** (gratification post-paiement), pas une perte. Rythme strict dès le cycle 3.
- **État** : figé en code au commit **`34dffde`** ; `tsc --noEmit` propre ; **déployé en production et vérifié fonctionnel le 2026-07-21** (`https://manifestmind.web.app` — déploiement Firebase Hosting).

═══════════════════════════════
🧭 **PROCHAINS CHANTIERS — À LIRE EN DÉBUT DE PROCHAINE SESSION (noté 2026-07-19)**
═══════════════════════════════

**PRIORITÉ 1 — 📊 FIREBASE ANALYTICS (à évaluer et probablement intégrer DÈS LE DÉBUT de la prochaine session).**
- **Objectif** : voir le **parcours des utilisateurs**, surtout les **anonymes en essai gratuit** — à quel cycle ils arrivent, où ils décrochent, **taux d'arrivée au paywall (après le cycle 1)**, **taux de conversion au paiement**.
- **Contexte favorable** : Firebase Analytics est **gratuit** et **déjà disponible** dans le projet Firebase `manifestmind` (rien à acheter/créer côté compte).
- **À faire lors du chantier** :
  1. **Définir les événements à tracker** — ex. `cycle_1_atteint`, `cycle_7_atteint`, `paywall_vu`, `checkout_ouvert`, `paiement_effectue`, `essai_reset`… (liste à trancher ensemble).
  2. **🔴 POINT RGPD (bloquant à vérifier AVANT activation)** : vérifier que la **politique de confidentialité couvre l'usage d'analytics** et l'**ajuster si besoin**. ⚠️ Rappel du déclencheur consigné au **point 16** : *tout* ajout d'analytics/monitoring = **bannière de consentement obligatoire AVANT activation** (transparence seule ne suffit plus dès qu'on collecte du comportement). → prévoir bannière consentement + mise à jour des 9 docs (×3 langues) si on part sur Analytics.
  3. **Câbler les événements** dans le code (web + prêt pour natif Phase 2).
- **⚖️ ALTERNATIVE PLUS LÉGÈRE À PRÉSENTER AUSSI (comparer les 2 AVANT de décider)** : un **compteur maison dans Firestore** (incréments par cycle/événement) — **moins puissant** (pas d'entonnoirs/segmentation clés en main, pas de tableau de bord riche) mais **plus simple** et **potentiellement moins lourd côté RGPD** (données agrégées, pas de SDK de tracking tiers). → présenter **avantages/inconvénients des deux options** (Analytics vs compteur Firestore) et **décider ensemble**.

**PRIORITÉ 2 — 📱 PHASE 2 STORES (iOS/Android) — VOLONTAIREMENT DIFFÉRÉE.**
- **Décision (2026-07-19)** : **laisser tourner le web quelques semaines d'abord**, et **trancher la question du paiement natif (Paddle vs achats in-app RevenueCat) AVANT de se lancer**. **L'analytics est PRIORITAIRE sur les stores.**
- Toute la mémoire technique du chantier natif est prête dans la section **« PRÉPARATION V2 STORES »** ci-dessous — à ne dérouler que le jour venu.

═══════════════════════════════
📱 **PRÉPARATION V2 STORES (PHASE 2) — MÉMOIRE À DÉROULER LE JOUR DU CHANTIER NATIF**
═══════════════════════════════

> Consolidé le 2026-07-19 (post-lancement web). **Rien de tout ceci n'est bloquant pour la V1 web.** C'est le plan de reprise pour publier sur l'App Store (iOS) et le Play Store (Android). Regroupe les notes Phase 2 dispersées dans ce doc.

**🎛️ Les bascules de config (le commutateur central)**
- **`services/config.ts`** : `STORES_ACTIVE=false` → **passer à `true`** pour activer le paiement natif. `canPay()` renvoie alors `STORES_ACTIVE` sur iOS/Android (aujourd'hui → « Disponible prochainement » sur natif). `PADDLE_ACTIVE`/`PADDLE_SANDBOX` = web only, ne pas confondre.
- **`DEBUG_SKIP_PAYWALL`** doit rester `false` (rappel encadré : point 0 checklist stores).

**💳 Paiement natif (le gros morceau)**
- **Décision d'archi à trancher** : les stores **imposent leur facturation in-app** (Apple IAP / Google Play Billing) pour du contenu numérique → **Paddle NE peut PAS servir sur natif**. Plan retenu de longue date = **RevenueCat** (cf. tableau plateformes en bas du doc, `STORES_ACTIVE=true` + `eas build`).
- **Conséquence prix** : de nouveaux **product IDs IAP** (par store) à créer ; `getPriceId()` de `services/paddle.ts` (mapping plan→price Paddle) est **web-only** → le natif aura son propre mapping RevenueCat. Les prix devront respecter les **paliers de prix des stores** (pas de montant libre comme Paddle).
- **Branches natives déjà en place, inatteignables en web** (à re-tester/brancher sur RevenueCat) : `pricing.tsx` et `pricing-upgrade.tsx` ont des chemins `Platform.OS !== 'web'` (dont `handleRestore`) + `pricing.tsx` pousse vers `auth.tsx` en supposant une **création** de compte (⚠️ `auth.tsx` est devenu **login-only** au chantier reconnexion — **RISQUE 3 consigné** : ce chemin suppose une création qu'un écran de login ne fait pas → **à retraiter avec RevenueCat**, cf. section « RECONNEXION DIRECTE », risque 3).

**🔐 Auth & clés (prêtes, non touchées)**
- **Clés API Android/iOS** (« auto created by Firebase ») **NON modifiées**, restreintes à leurs 25 API par défaut → **prêtes pour le natif**. (Seule la **Browser key** a reçu la restriction de référents en E1 — cf. E1.)
- **« Sign in with Apple » à AJOUTER pour iOS** : Apple **impose** Sign in with Apple si l'app propose un autre login social (Google). Non nécessaire en web V1 ; **prérequis de validation App Store**. (Il n'y a PAS de stub Apple fonctionnel aujourd'hui — c'est à implémenter.)

**♻️ Restaurer les achats (natif only)**
- `parametres.tsx` : rangées « Restaurer » (`handleRestorePurchases` + `restaurerAcces`) **masquées sur web** (`Platform.OS !== 'web'`), avec `Alert.alert` (⚠️ **no-op sur web mais OK sur natif** — sur natif `Alert.alert` fonctionne). Sur natif = vrai concept store (RevenueCat `restorePurchases`). **À câbler.**

**🖼️ Persistance native (fiabilité)**
- **Photos** : `services/imagePersist.ts` garde les URIs `file://` du picker/manipulator sur natif — or ces URIs pointent vers le **cache** que l'OS peut nettoyer. **➡️ Copier vers `documentDirectory`** (vision board + photo de profil) pour une persistance native fiable. (Le web utilise déjà des data-URIs, non concerné.)
- **`ImagePicker.MediaTypeOptions`** (déprécié) : migration reportée Phase 2 (cf. PHASE F, point 19).

**🎨 Assets stores (cf. section 🎨 DESIGN / FINITIONS)**
- **Feature graphic Google Play 1024×500** (bannière fiche Play).
- **Icône monochrome Android 13** (« themed icons » launcher — `android.adaptiveIcon.monochromeImage`, ref template retirée au point 25).
- **Splash screen natif** : `app.json` référence encore l'image template (`splash-icon.png`) → remplacer par l'identité définitive M+œil.
- **Politique de remboursement (×3 langues)** à harmoniser avec la charte des 2 autres docs légaux (actuellement style « brut »).

**⚖️ Légal / conformité stores**
- **Anti-steering** : relire la note des docs légaux (point 14) — les stores **interdisent** de rediriger vers un paiement web externe depuis l'app native. Les docs dual-plateforme ont été rédigés en prévision ; **vérifier le wording avant soumission**.
- **Comptes développeur à créer/anticiper** : **Apple Developer Program** (99 $/an) + **Google Play Developer** (25 $ une fois). Délais de validation à prévoir.
- **RGPD/consentement** : si ajout d'analytics/monitoring natif → **bannière de consentement obligatoire AVANT activation** (déclencheur consigné au point 16).

**🔁 Build & sortie**
- Build via **`eas build --platform ios/android`** (cf. tableau plateformes). Prévoir la config EAS, les provisioning profiles Apple, le keystore Android.

**📌 Où retrouver le détail** : sections « RECONNEXION DIRECTE » (risque 3), « 🎨 DESIGN / FINITIONS », « BUG PERSISTANCE WEB » (note Phase 2 natif), PHASE F (point 19), tableau plateformes en fin de doc.

═══════════════════════════════
🤖 **PHASE 2 — ANDROID / GOOGLE PLAY — ÉTAT DES LIEUX + FEUILLE DE ROUTE (démarré 2026-07-21)**
═══════════════════════════════

> On commence par **Google Play (Android)** avant Apple. Comprendre les règles des DEUX avant de construire à fond. Rythme « tranquille comme le web ».

**🏷️ DÉCISIONS STRUCTURANTES (2026-07-21) :**
- **Publication en NOM PROPRE (compte développeur INDIVIDUEL)**, PAS en société : le DUNS (demandé il y a des mois pour un compte Organisation) est toujours sans réponse → on contourne par le compte individuel.
  - ⚠️ **CONSÉQUENCE À GARDER EN MÉMOIRE** : **Paddle = entité Horizonte Digital (SAS Paraguay)** / **Stores = nom propre (individuel)**. Deux identités de vendeur distinctes selon le canal. À assumer dans les mentions/CGV le jour venu.
- **Paiement : Google Play Billing OBLIGATOIRE sur Android** (contenu numérique = déblocage de cycles) → **via RevenueCat** (`react-native-purchases`, abstrait Play Billing + StoreKit iOS, webhooks serveur). **Paddle reste WEB ONLY** (no-op sur natif, déjà en place). **Ne jamais afficher un checkout Paddle dans l'app Android** (= violation policy).
- **`subscription_active` mis à jour par 2 sources, même modèle** : web = webhook Paddle ; Android = achat Play Billing → **webhook RevenueCat** → même Cloud Function → `users/{uid}`. **Clé = même `uid` Firebase** des deux côtés (`Purchases.logIn(firebaseUid)` côté natif, symétrique au `custom_data.firebase_uid` de Paddle). Architecture web (Firestore source de vérité) = tremplin, on ajoute juste un 2ᵉ écrivain.

**✅ SOCLE ANDROID DÉJÀ EN PLACE (audit lecture seule 2026-07-21)** : package `com.manifestmind.app` (app.json) · `google-services.json` présent (app Android enregistrée Firebase) · `adaptiveIcon` (foreground + fond violet) · `intentFilters autoVerify` sur `firebaseapp.com` (App Links = magic link natif OK) · Expo ~54 / RN 0.81.5 / new arch · `expo-notifications`. Flags/garde-fous prêts : `STORES_ACTIVE=false` (à basculer), `canPay()` chemin natif, `openCheckout` no-op natif (paddle.ts l.171).

**❌ MANQUE POUR UN BUILD STORE** : `eas.json` (config EAS Build, absent) 🔴 · **bibliothèque paiement natif** (aucune : ni RevenueCat, ni IAP) 🔴 · **Sign in with Apple** (iOS only, inexistant — pas de vrai stub) · splash définitif (encore template blanc, app.json l.53) · icône monochrome Android 13 (optionnel) · permission `POST_NOTIFICATIONS` runtime (Android 13+) · assets fiche Play (feature graphic 1024×500, screenshots, icône 512, descriptions ×3 langues) 🔴 · déclarations conformité (Data Safety, content rating, target audience) 🔴.

**🧩 CODE STORE-ONLY — statut réel** : `STORES_ACTIVE`/`canPay()`/no-op Paddle natif = **prêts (flags)**. `handleRestore`/rangées « Restaurer » (pricing.tsx l.608, parametres.tsx) = **stubs `Alert.alert` à REMPLACER** par `Purchases.restorePurchases()`. Branche native `pricing.tsx` pousse vers `auth.tsx` en supposant une **création** de compte → **à retravailler (RISQUE 3 : auth.tsx est login-only)**. `getPriceId()` = Paddle only → le natif aura son mapping RevenueCat (product IDs Play). **Sign in with Apple = à écrire de zéro (iOS).**

**🗺️ FEUILLE DE ROUTE G0→G7 ([TOI]=dashboards, [CLAUDE]=code sur feu vert) :**
- **G0 — Règles & décision** : synthétiser les policies Play (Payments, Data Safety, Content rating, target audience) AVANT de payer les 25 $. Aucune ligne de code. *(en cours 2026-07-21)*
- **G1 — Comptes** : [TOI] compte **Google Play Developer INDIVIDUEL** (25 $ une fois) + accords ; compte **RevenueCat** (gratuit).
- **G2 — EAS Build** : [CLAUDE] créer `eas.json` + config credentials ; [TOI] lancer un **1ᵉʳ build dev/interne SANS paiement** → installer sur vrai Android → valider que l'app build & tourne natif.
- **G3 — Paiement natif** : [CLAUDE] installer `react-native-purchases`, câbler `logIn(uid)`, remplacer stubs restore + UI achat native, écrire **Cloud Function webhook RevenueCat → Firestore**, basculer `STORES_ACTIVE=true` ; [TOI] configurer produits/abos Play Console + RevenueCat.
- **G4 — Fiche & conformité Play** : [TOI, guidé] listing (descriptions ×3, feature graphic 1024×500, screenshots, icône 512), **Data Safety**, **content rating**, target audience, privacy URL.
- **G5 — Assets natifs** : [CLAUDE/design] splash définitif M+œil, icône monochrome Android 13, screenshots.
- **G6 — Tests piste interne** : [TOI] internal testing track, achat réel (license testers) → vérifier Firestore via webhook RevenueCat, restore, annulation ; [CLAUDE] corrige.
- **G7 — Soumission → publication** 🚀.
- *(plus tard : Phase Apple — Sign in with Apple, StoreKit via RevenueCat déjà abstrait, exigences App Store.)*

**⚠️ Vigilances** : achats intestables en Expo Go → **EAS build obligatoire** + appareil Android réel avec Play Services · coûts Play 25 $ (une fois) / RevenueCat gratuit au début / Apple 99 $/an (plus tard) · le flux compte+achat natif doit refléter la conversion au paywall (après le cycle 1) web mais via Play Billing (conçu en G3, là où RISQUE 3 se retravaille).

**🎯 DÉCISION — CIBLE API ANDROID 36 (Android 16) DÈS LA 1ʳᵉ PUBLICATION, via ROUTE A (2026-07-21)**
- **Cible** : `targetSdk`/`compileSdk` **36** dès la première soumission, par la **Route A** = override via le plugin **`expo-build-properties`**, en **RESTANT sur Expo SDK 54**. 🚫 **PAS de montée vers Expo SDK 55** (Route B **INTERDITE ici** : risque web élevé — bumperait des dépendances PARTAGÉES web/natif).
- **Justification** : **zéro risque pour le web** (réglage 100 % natif Android — `compileSdk`/`targetSdk` non lus par le bundle web, aucune dépendance partagée touchée) ; évite un **second chantier API** ; **sécurise la bascule Google du 31 août 2026** dès le départ ; **edge-to-edge déjà activé** (`app.json` `edgeToEdgeEnabled: true`).
- **Application** : réglage à faire **AU MOMENT du premier build natif (étape G2)**, PAS isolément maintenant.
- **🛟 Filet de sécurité acté** : si un build en API 36 révèle une **incompatibilité bloquante** avec Expo 54 → **repli sur API 35** pour la 1ʳᵉ soumission (acceptée avant le 31 août 2026), puis nouvelle tentative en 36 ensuite. Ce repli reste **sans risque pour le web** dans les deux sens.
- ⚠️ Rappel outillage : le build `.aab` qui **valide** réellement l'API 36 passe par **EAS (cloud) + test sur appareil** — non vérifiable en local dans l'environnement Claude (cf. G2).

───────────────────────────────
📅 **PLAN DE REPRISE — CHRONOLOGIQUE JUSQU'AU LANCEMENT GOOGLE PLAY (établi 2026-07-21)**
───────────────────────────────

> Légende : 👤 utilisatrice (dashboards/décisions/tests téléphone) · 🤖 Claude (code/config) · risque web 🟢 aucun / 🟡 à re-tester / 🔴 élevé · ⏳ attente externe · ⚖️ décision · ▶️ démarrable MAINTENANT · ⛔ attend l'approbation d'identité Google.

**☀️ Coups d'envoi (en parallèle dès la reprise)**
1. 👤 Surveiller la **validation d'identité Google** ⏳⛔ (débloque produits + upload).
2. 👤 Recruter **12-15 testeurs** (emails Google) ⏳▶️ — **chemin critique** (compteur 14 jours).
3. 👤 Créer comptes gratuits **Expo (EAS)** + **RevenueCat** ▶️ 🟢.
4. ⚖️ Confirmer **paiement = Play Billing via RevenueCat** (Paddle web-only) ▶️ — bloque le code paiement.
5. ⚖️ Choisir **e-mail public** (contact@) + confirmer alignement des **prix** sur les paliers Play ▶️.

**🛠️ Socle build natif (SANS attendre Google) ▶️**
6. 🤖 Préparer `eas.json` + `expo-build-properties` (**API 36**) + vérif `app.json` — 🟡 (re-test web).
7. 👤 Lancer le **1er build EAS dev/interne SANS paiement** → test vrai Android (démarrage, Firebase auth, deep links, notifs) ⏳(build) 🟡. Filet : repli **API 35** si blocage 🟢.
8. 🤖 Correctifs natifs propres : **tap-notif → écran affirmation** ; **persistance photos** → dossier durable — 🟡.

**💳 Paiement natif ⛔ (compte Google approuvé requis)**
9. 👤 Créer produits/abos **Play Console** (Mensuel/Annuel/Vie, prix par pays) 🟢.
10. 👤 Configurer **RevenueCat** (entitlement premium + mapping produits) 🟢.
11. 🤖 Installer `react-native-purchases` (🔴 **ISOLER du web** + re-test), `logIn(uid)`, UI achat native, restore, branche pricing native (**RISQUE 3**).
12. 🤖 **Cloud Function webhook RevenueCat → Firestore** (jumelle Paddle ; **NE PAS toucher `paddleWebhook`**) 🟢.
13. 🤖 Basculer `STORES_ACTIVE=true` — 🟡 (vérifier web inchangé).

**📋 Fiche & conformité Play ⛔ (parallélisable ; assets dès la Semaine 1)**
14. 👤 Listing (descriptions ×3, feature graphic 1024×500, screenshots, icône 512) + **Data Safety** + content rating (Tout public) + public **adultes** + privacy URL + **suppression de compte hors-app**. Assets 🟡. ⚖️ trancher **textes légaux natifs anti-steering** avant soumission.

**🚀 Test fermé & publication**
15. 👤 Build **`.aab` final signé** + upload sur la **piste de test fermé** (12 testeurs) ⛔ 🟢 → **démarre les 14 jours**.
16. ⏳ **14 jours de test fermé** (incompressible) — corriger les retours.
17. 👤 **Achat réel de test** → vérifier déblocage + base + restore + annulation — 🟡 (re-vérif web).
18. 👤 Demander le **passage en production** → soumission → ⏳ validation Google → 🚀 **publication**.

**🔑 Rappels** : ▶️ **démarrable sans Google** = décisions, comptes Expo/RevenueCat, config API 36, 1er build, correctifs natifs, assets. ⛔ **après approbation** = produits, mapping RevenueCat, listing, upload, 14 jours. Maillon **le plus risqué web** = **étape 11** (isoler `react-native-purchases`). Objectif calendrier : atteindre vite l'**étape 15** pour lancer les 14 jours au plus tôt.

───────────────────────────────
📌 **NOTES À NE PAS OUBLIER — PHASE 2 / TEST FERMÉ (ajoutées 2026-07-23)**
───────────────────────────────

**1. 🔴 DÉBLOCAGE DES TESTEURS PENDANT LE TEST FERMÉ (critique)**
- Pendant les 14 jours de test fermé, les 12 testeurs finiront leur **cycle 1 gratuit** puis heurteront le **paywall** — or le paiement natif n'est pas branché (`STORES_ACTIVE=false` → bouton « Disponible prochainement »). Sans déblocage, les testeurs seraient **bloqués après 1 cycle** → test vidé de son sens.
- **Décision** : donner l'accès complet aux comptes de test pendant tout le test fermé, par le **même mécanisme que le compte de démo Google** (`subscription_active: true` en base Firestore, **données uniquement, zéro code**). **Méthode exacte analysée le 2026-07-23 → piste retenue : UN compte ManifestMind partagé (e-mail + mot de passe) avec `subscription_active:true` ; les testeurs se connectent via « J'ai déjà un abonnement — Me reconnecter » (login e-mail, la progression restant LOCALE par appareil, Option A → un seul compte suffit pour les 12).** Réversible en fin de test (repasser `subscription_active:false` / supprimer le doc).

**🎯 DÉCISION VALIDÉE (2026-07-23) — DÉBLOCAGE DES TESTEURS : OPTION A1 (compte partagé)** *(complète la note ci-dessus, commit `e567528`)*
- **Méthode retenue** : créer **UN SEUL compte ManifestMind dédié aux bêta-testeurs** (e-mail + mot de passe), avec **`subscription_active: true` posé à la main dans Firestore** — exactement comme le compte de démo Google.
- **Pourquoi un seul compte suffit pour 12 testeurs** : la progression est stockée **LOCALEMENT** sur chaque appareil (AsyncStorage). Le seul état serveur partagé est `subscription_active` (**lecture seule** côté client). Chaque testeur a donc sa propre progression sur son téléphone, même en partageant le compte.
- **Compte DÉDIÉ** aux bêta-testeurs, **distinct du compte de démo Google** — pour pouvoir le désactiver en fin de test **sans toucher** au compte utilisé par les examinateurs Google.
- **Zéro code modifié** → 🟢 aucun risque web, 🟢 aucun risque d'ouvrir le premium à de vrais utilisateurs (**le gate reste intact**).
- **Options ÉCARTÉES** : liste de comptes de test en dur dans le code · allowlist Firestore lue par le gate · Remote Config — toutes impliquent de **modifier le gate** (code sensible partagé web/natif), avec un **risque élevé** de débloquer le premium pour tout le monde en cas de bug.
- **Retour en arrière (fin de test)** : repasser `subscription_active` à `false` sur ce doc (ou supprimer le doc / désactiver le compte dans Authentication). **Instantané, aucun redéploiement.**
- ⚠️ **Instructions testeurs** : au paywall, toucher **« J'ai déjà un abonnement — Me reconnecter »** et se connecter avec l'e-mail + mot de passe fournis. **PAS** le mode anonyme (impossible à débloquer, aucun doc Firestore). **PAS** la connexion Google (ne fonctionne pas sur natif aujourd'hui).
- ⚠️ **Ces identifiants donnent l'accès premium** : à ne **pas** diffuser au-delà des testeurs.

**🎨 CHANTIER TYPO + MUSIQUE À FAIRE AVANT LE TEST FERMÉ (regroupés) — noté 2026-07-23**
- **Découverte (build du 23/07/2026)** : l'app **WEB n'utilise PAS** les vraies polices **Cormorant Garamond / Jost** — elle affiche des **polices de substitution système**. Le plugin `expo-font` déclarait ces polices par **URL Google Fonts**, ce qui ne fonctionnait **ni pour le web** (jamais lu — aucun `@font-face`/lien dans le build app, vérifié dans `dist/`) **ni pour le natif** (cause de l'échec du **Prebuild**). L'entrée `expo-font` a été **retirée** pour débloquer le build (commit `18fdf23`).
- **Conséquence actuelle** : **natif ET web** affichent des polices de substitution. **Seules les 9 pages légales** chargent les vraies polices (via leur propre `<link>` dans le `<head>`).
- **DÉCISION** : chantier dédié **AVANT le test fermé**, regroupant **deux améliorations** :
  - **TYPOGRAPHIE (option c)** : **embarquer les vraies polices** Cormorant Garamond et Jost, pour le **natif ET le web**, afin d'unifier l'identité visuelle sur toutes les plateformes. ⚠️ Ce chantier **CHANGERA le rendu du web** (aujourd'hui en fallback) — c'est une **amélioration DÉLIBÉRÉE et assumée, décidée par l'utilisatrice**, et **non une violation de la règle A**. À **valider écran par écran** (débordements, alignements, centrage).
  - **MUSIQUE DE FOND** : intégration **dès l'onboarding**, **web et natif** (droits détenus par le conjoint de l'utilisatrice — cf. note précédente).
- **Calendrier** : **après** le premier build natif fonctionnel, **avant** l'envoi de la version aux 12 testeurs.

───────────────────────────────
🤖 **PREMIER TEST DE L'APK NATIF — RÉSULTATS (23/07/2026)**
───────────────────────────────

**✅ PREMIER BUILD NATIF ANDROID RÉUSSI — 23/07/2026**
- Build EAS réussi (profil **preview**, APK), installé et testé sur un **vrai téléphone Android**.
- 🎯 **API 36 (Android 16) COMPILE SANS PROBLÈME** → la décision **« Route A »** (`expo-build-properties`, en restant sur Expo SDK 54) est **VALIDÉE**. Le repli API 35 n'a **pas** été nécessaire.
- **Blocages franchis avant d'y arriver** (mémoire) : (1) variables Firebase à fournir via le **dashboard EAS** ; (2) **`google-services.json` désormais suivi par git** (la variable-fichier EAS ne se chargeait pas — cf. commits `9dc0ccf`) ; (3) **entrée `expo-font` retirée** d'`app.json` (URLs Google Fonts traitées comme fichiers locaux au Prebuild — commit `18fdf23`).
- **Testé et FONCTIONNEL sur natif** : splash, choix de langue, onboarding complet, cycle 1 jouable, journal (saisie), photos/Vision Board (ajout), paywall après le cycle 1 avec « Disponible prochainement », rendu visuel validé, bouton « J'ai déjà un abonnement — Me reconnecter » présent.

**✅ NOTIFICATIONS LOCALES — RÉSOLU (23/07/2026)**
- Cause = uniquement une **autorisation système** : notifications non activées pour ManifestMind dans les réglages du téléphone.
- Après activation : **test concluant** — notification programmée à H+quelques minutes, **reçue à l'heure prévue** avec l'affirmation. Fonctionne sur natif.
- **Reste en suspens (polish, non bloquant)** : le **tap sur la notification n'est pas câblé** vers l'écran affirmation.

**📌 REPORTÉ À FROID, APRÈS LE LANCEMENT — ÉCRANS DE CÉLÉBRATION DE PALIERS**
- **État constaté** : il n'existe **AUCUN écran de célébration dédié aux paliers de niveau**. Ce qui existe = un **TOAST éphémère** (bandeau violet, 6 s, `CongratulationsToast`) déclenché par `checkMilestones` au franchissement d'un niveau **ou** d'un palier de 1 000 pts.
- **Aucun schéma ni spec** d'un tel écran retrouvé dans le projet : **ce travail n'existe pas** (les docs retrouvés — `MEMO_S2.md`, tableau niveaux du master — décrivent la **jauge** et le **système de niveaux**, pas des écrans de célébration).
- **DÉCISION : ne rien faire maintenant.** Si souhaité, ce sera un **chantier NEUF, à concevoir de zéro, à froid APRÈS le lancement**.
- **Justification du report** : paliers hors de portée à court terme (1ᵉʳ toast à 1 000 pts ≈ 10 cycles ; 1ᵉʳ changement de niveau à 9 125 pts ≈ 91 cycles) — ni l'utilisatrice ni les 12 testeurs ne les atteindront pendant les 14 jours. De plus, `checkMilestones` est du **code PARTAGÉ** (tous les écrans d'étape) → **risque web 🟡**, à traiter sans pression de calendrier.

**🔴 EN COURS — CLÉ FIREBASE NATIVE (problème bloquant identifié)**
- **Diagnostic confirmé** : la **restriction par référent HTTP** de la clé API Firebase (durcissement **E1**) **BLOQUE toutes les requêtes Firebase sur l'app native** (une app native n'envoie pas de référent). Conséquence : **connexion e-mail impossible** sur l'APK, et Firebase globalement inopérant sur natif (le cycle 1 fonctionnait uniquement sur l'**état local**).
- Ce cas était **PRÉVU** et déjà noté dans ce journal (« Phase 2 native : la restriction par référent bloquerait l'app native → clé distincte »).
- **Correctif retenu : Option 1** — créer une **clé API dédiée au natif** avec **Application restriction = « Aucune »** (API restrictions limitées aux APIs Firebase), et la fournir au build via la variable **`EXPO_PUBLIC_FIREBASE_API_KEY`** du dashboard EAS (environnements **Preview/Production**). Le web conserve sa **Browser key** restreinte par référent → **🟢 web inchangé**.
- ⚠️ **Piège identifié** : une clé restreinte **« Applications Android (SHA-256) »** ne fonctionnerait **PAS** — le **SDK Firebase JS** utilisé sur natif n'envoie **ni référent ni en-têtes de package/signature Android**.
- **Portée** : ce correctif débloque **à la fois** les examinateurs Google Play **et** les 12 testeurs du test fermé. **À faire AVANT la soumission.**

**✅ CORRECTIF CLÉ FIREBASE NATIVE — APPLIQUÉ (23/07/2026)**
- **Diagnostic prouvé par test curl SANS build** : la **Browser key** renvoie **403 `API_KEY_HTTP_REFERRER_BLOCKED`** sans référent (= cause de l'échec de connexion sur l'APK) ; la **Android key** renvoie **400 `INVALID_LOGIN_CREDENTIALS`** (= acceptée, fonctionne sans référent). Firestore atteint avec les deux clés (refus par les règles, pas par la clé).
- **Correctif appliqué** : dans le dashboard EAS, `EXPO_PUBLIC_FIREBASE_API_KEY` remplacée par la valeur de la **« Android key (auto created by Firebase) »** (Application restriction = Aucune), sur les **3 environnements**.
- **Aucune modification de code.** 🟢 **Web inchangé** : le web est déployé depuis le `.env` local (Browser key) ; les variables EAS n'affectent que les builds natifs.
- ⏳ **Reste à confirmer par un build** : la connexion e-mail du compte de démo sur l'APK.

**📌 MÉTHODE DE TEST RETENUE (23/07/2026)**
- Un build EAS coûte jusqu'à **1 h d'attente** (file de l'offre gratuite). **Décision : ne plus JAMAIS itérer une correction à la fois par build.** On **valide chaque correctif AVANT le build** par les moyens rapides (**curl**, **Expo Go**, tests locaux), puis on **REGROUPE** les corrections dans un **build unique de confirmation**. *(Preuve : la clé Firebase native a été validée par curl, zéro build gâché — cf. ci-dessus.)*

**2. 🎵 MUSIQUE DE FOND (à intégrer AVANT publication)**
- **Décision** : intégrer une **musique de fond dès l'onboarding**, sur **TOUTES** les versions (web ET natif).
- **Droits** : composée par le conjoint de l'utilisatrice, qui en détient les droits et autorise l'usage dans ManifestMind → **aucun problème de droits** côté Google.
- **Calendrier** : à faire **PENDANT le test fermé, PAS après publication** (une MàJ post-publication après le **31 août 2026** imposerait l'API 36 + un nouvel examen).
- ⚠️ **Code PARTAGÉ web/natif → RÈGLE A → re-test web OBLIGATOIRE** avant validation.

**3. 📊 MàJ DATA SAFETY À PRÉVOIR (quand Analytics sera activé)**
- La déclaration « Sécurité des données » est **exacte aujourd'hui** (collecte : **e-mail, ID utilisateur, historique des achats** ; rien d'autre coché).
- **MAIS à mettre à jour AVANT de publier la version qui active Firebase Analytics** (chantier priorité 1) : Analytics collecte l'**App Instance ID** (→ « Appareil ou autres ID »), des **événements d'usage** (→ « Activité dans l'appli »), et peut collecter l'**identifiant publicitaire** (→ revoir aussi la déclaration **AD_ID**).
- **Idem** si ajout de **Crashlytics/Sentry** (→ « Infos et performance des applis ») ou des **notifications push FCM** (→ token/FID). Déclencheur RGPD associé : bannière de consentement (cf. point 16 + PROCHAINS CHANTIERS).

───────────────────────────────
📚 **BLOC G0 — SYNTHÈSE DES RÈGLES GOOGLE PLAY (référence durable, consignée 2026-07-21)**
───────────────────────────────

> À comprendre AVANT de créer le compte. Aucune ligne de code — c'est de la compréhension.

**🅰️ Google Play Payments policy (paiement)**
- Contenu numérique (déblocage de cycles) → **Play Billing OBLIGATOIRE**. Interdit d'afficher un paiement externe (Paddle) DANS l'app Android.
- Dans Play Console : créer les **abonnements** (Mensuel, Annuel) + le **produit unique** (Vie), prix par pays. RevenueCat s'y branche.
- **Clarté abonnement (strict)** : avant l'achat, afficher clairement prix + périodicité + **renouvellement automatique** + comment annuler. Google rejette les abos « pièges ».

**🅱️ Data Safety form (déclaration des données) — concerne les données qui QUITTENT l'appareil**
- **Email** (Firebase Auth, création de compte) → ✅ collecté → déclarer (email, fonctionnement app + gestion compte).
- **Statut d'abonnement** (Firestore `users`) → ✅ collecté → déclarer.
- **Photos vision board/profil + journal** → ❌ **restent sur l'appareil (Option A, stockage local) → NON collectés** (nuance en ta faveur).
- **Infos de paiement** → gérées par Google Play, pas par l'app → généralement non déclarées.
- Cocher : **chiffré en transit** ✅ (Firebase HTTPS), **suppression possible** ✅ (flux RGPD in-app), **URL privacy** ✅ (`manifest-mind.app`).
- 🔴 **Doit être COHÉRENT avec la politique de confidentialité** (Google recoupe).

**🅲️ Content rating + Target audience**
- **Content rating** : questionnaire IARC (violence/sexe/jeux d'argent/drogues → tout « non ») → **« Tout public » / PEGI 3**.
- **Target audience** : cibler **ADULTES (18+ ou 16+)**, PAS les enfants → évite le programme **« Designed for Families »** (règles bien plus strictes).

**⚠️ Règles qui peuvent faire REFUSER**
1. Paiement externe dans l'app → rejet (Play Billing only).
2. **Allégations santé/médicales** : « bien-être / épanouissement personnel » OK ; « soigne / guérit / traite l'anxiété » = risqué (désinformation santé). **Rester sur le vocabulaire épanouissement.**
3. **Suppression de compte** : exigée in-app ✅ (existe) ET **depuis l'EXTÉRIEUR de l'app** (une URL/instruction de demande de suppression) → **À PRÉVOIR** (page/section accessible hors app).
4. Crash / fonctionnalité cassée → rejet (d'où tests G6).
5. Fiche trompeuse (titre/captures) → rejet.
6. Permissions : ne demander que le nécessaire (notifs, photos) et les déclarer.

**🔴 TIMING CRITIQUE (compte PERSONNEL créé depuis fin 2023)**
- **Test fermé obligatoire : ≥ 12 testeurs inscrits pendant 14 JOURS CONSÉCUTIFS AVANT de pouvoir demander la production.**
- Impossible de publier directement. **Recruter ~12-15 testeurs (emails Google) dès maintenant** = seul délai incompressible (2 semaines). L'utilisatrice a commencé à les réunir (2026-07-21).

**📋 À PRÉPARER AVANT de payer les 25 $**
1. Compte Google (perso) dédié.
2. **Pièce d'identité officielle** (vérification d'identité réelle du compte individuel).
3. Nom légal + adresse + téléphone (correspondant à la pièce).
4. Moyen de paiement (25 $ une fois, à vie).
5. **Nom de développeur public** (peut être une marque, compte reste à l'identité vérifiée).
6. ⚠️ **Coordonnées développeur PUBLIQUES** sur la fiche (email, souvent adresse) → choisir quoi exposer, **idéalement `contact@manifest-mind.app`** (pas un perso).
7. URL politique de confidentialité ✅ (`manifest-mind.app`).
8. Liste des ~12 testeurs.
9. **Pas de DUNS** en individuel ✅ (c'est le contournement retenu, le DUNS Organisation étant sans réponse depuis des mois).

**🎯 À retenir** : Android = Play Billing (RevenueCat) · Data Safety = email + statut abo (photos/journal locaux = non collectés) · rating « Tout public » + cible adultes · bien-être oui / promesses médicales non · suppression de compte hors app à ajouter · **12 testeurs / 14 jours** avant prod · identité réelle + email public à préparer avant de payer.

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

### 🎨 DESIGN / FINITIONS VISUELLES — à traiter EN UNE SEULE PASSE (plus tard, avant ou après lancement selon ampleur)

> Regroupe tout ce qui touche à l'APPARENCE et n'est pas bloquant fonctionnellement. **Ne pas traiter au fil de l'eau** — accumuler ici, puis une passe dédiée.

1. **Page « Politique de remboursement » (×3 langues) à harmoniser avec les 2 autres documents légaux** : pas d'œil animé SVG, pas de hero, style « brut » (Georgia, page simple) vs la charte complète (Cormorant Garamond + Jost, orbes animées, sections numérotées). Constaté à l'audit du 2026-07-16 — choix délibéré de ne PAS le traiter pendant la passe légale (contenu ≠ design).
2. **Feature graphic Google Play 1024×500 (Phase 2)** : bannière marketing exigée par la fiche Play Store — à créer à partir de l'identité définitive (M+œil sur violet). Noté le 2026-07-17.
3. **Icône monochrome Android 13 (Phase 2)** : pour les « themed icons » du launcher — version monochrome du M+œil (ou de l'œil simplifié) en blanc sur transparent, à câbler dans `android.adaptiveIcon.monochromeImage` (la ref template a été retirée au point 25). Noté le 2026-07-17.
4. **Splash screen natif (Phase 2)** : `expo-splash-screen` dans `app.json` référence encore l'image template (`splash-icon.png`, fond blanc) — à remplacer par l'identité définitive au chantier natif.

### 🔴 BUG PERSISTANCE WEB — photos blob: + journal non rechargé — CORRIGÉ (2026-07-16)

**Symptôme** : après fermeture COMPLÈTE du navigateur, vision board et journal semblaient effacés. **Diagnostic scellé par re-export RGPD** : localStorage 100 % intact (journal, progression, prénom présents) — DEUX causes distinctes, AUCUNE purge en cause (inventaire exhaustif des purges fait, toutes ciblées et innocentes), AUCUNE régression (git formel : `vision-board.tsx`/`journal.tsx` intouchés depuis les commits fondateurs). « Ça marchait avant » = les tests initiaux étaient sur **Expo Go natif** (URIs `file://` + state suspendu) ; la faille web était LATENTE depuis le pivot web, jamais testée.

1. **Photos (VRAIE perte)** : sur web, expo-image-picker retourne une **`blob:` URL** — référence mémoire qui MEURT à la fermeture de session. Stockée telle quelle → cellules vides à la réouverture. **Correctif** : `services/imagePersist.ts` (nouveau) — `toPersistentPhotoUri()` : resize ≤900 px (jamais d'agrandissement) + JPEG q0,7 via **`expo-image-manipulator`** (dépendance ajoutée, ~14.0.8) → **data-URI base64** (~100-200 Ko/photo, 8 photos ≈ 1,5 Mo, marge sur les ~5 Mo de localStorage). Web = data-URI ; **natif = URI fichier comme avant** (des data-URIs dépasseraient la limite ~2 Mo/entrée d'AsyncStorage Android). Appliqué à `vision-board.tsx` ET `profil.tsx` (photo de profil, même faille). **Écriture AVANT état** + `try/catch` → toast `t.commun.photoNonSauvee` (l'échec quota, silencieux historiquement, est désormais VISIBLE). Bonus : l'export RGPD embarque désormais réellement les images.
2. **Journal (illusion de perte, AUCUNE donnée perdue)** : `load()` ne rechargeait JAMAIS l'entrée du cycle COURANT (seulement le flag `validated` + les cycles passés) → champ vide à chaque montage. **Correctif** : hydratation de `journal_cycle_{cycle}` au montage (texte + compteur de mots, entrées `skipped` ignorées). Touche aussi le natif (masqué par la suspension d'app).
3. **Ceinture `maxLength={2000}` sur le TextInput du journal (même train, 2026-07-16)** : la garde des 150 mots compte les mots séparés par des ESPACES → un collage massif sans espace (= 1 seul « mot ») la traversait et pouvait saturer le quota localStorage. 2000 caractères absorbent confortablement 150 vrais mots — invisible en usage légitime, la garde des mots reste inchangée par-dessus.

**✅ VALIDÉ (2026-07-16)** : test décisif refait — 2 photos vision board + photo de profil + entrée journal → fermeture COMPLÈTE du navigateur → réouverture → tout est là.

**📚 Leçon (à intégrer aux tests, étape 4)** : **tester la persistance après fermeture COMPLÈTE du navigateur** fait partie des tests essentiels — c'est le premier vrai test de persistance web du projet qui a révélé la faille.
**⚠️ Phase 2 natif (à ne pas perdre)** : les URIs `file://` du picker/manipulator pointent vers le **cache** de l'app, que l'OS peut nettoyer → **copier vers `documentDirectory`** pour une persistance native fiable.

### 📦 ARCHIVE — détail technique du travail DÉJÀ RÉALISÉ

> Historique et justifications des décisions (ne pas re-débattre sans raison). Les « ⏳ Reste à faire » ci-dessous sont désormais cadrés par la feuille de route ci-dessus.

#### 🚨🚨 NE PAS TOUCHER AUX BOUTONS DE TEST DE `home.tsx` AVANT LA PHASE F 🚨🚨

Les deux boutons debug de `home.tsx` — **« reset »** et **« ⏭ cycle suivant »** — sont **VOLONTAIREMENT CONSERVÉS**. Ils sont **nécessaires pour tester** A.3 et **toutes les phases suivantes** (B, C, D…) : sans eux, impossible de se placer à un cycle donné pour vérifier un gate, un paywall ou un paiement.

**Retrait UNIQUEMENT en PHASE F** (nettoyage final, juste avant la construction / le déploiement) — cf. point 18 de la feuille de route.

⚠️ **Aucune session ne doit les supprimer « par zèle » en croyant bien faire**, même en croisant une remarque du type « retirer les boutons debug ». Ce n'est PAS une omission, c'est une décision. Tant que la Phase F n'est pas atteinte, ils restent.

#### ✅ CASSE DU NOM `claude_master.md` — VÉRIFIÉ COHÉRENT (2026-07-17), PAS DE RENOMMAGE NÉCESSAIRE

Vérification `git ls-files | grep -i master.md` le 2026-07-17 : **une seule entrée suivie, `claude_master.md` (minuscules)**. L'incident de casse est **déjà résorbé** — le repo est cohérent (aucune double-entrée). **DÉCISION : on ne fait PAS de renommage** — forcer une casse (majuscules) sur Windows insensible à la casse serait un vrai risque git pour zéro bénéfice. Règle de maintenance : toujours `git add claude_master.md` (minuscules), jamais `CLAUDE_MASTER.md`.

*(Historique de l'incident, résolu : le 2026-07-14, un `git add CLAUDE_MASTER.md` n'avait matché aucun chemin suivi → une mise à jour était sortie d'un commit silencieusement, rattrapée ensuite. Depuis, tout est committé sous la casse minuscule → cohérent.)*

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
   - ✅ **~~CGU « 7 jours »~~ — NOTE PÉRIMÉE (constaté à l'audit du 2026-07-16)** : les pages publiées ne contiennent **AUCUN** « 7 jours/7 days/7 días » — l'utilisateur les avait corrigés en juin 2026 (les politiques de remboursement disent déjà « 7 premiers cycles gratuits sans carte »). Le VRAI chantier légal est ailleurs : **CGU écrites pour une app STORE native, Paddle absent des 9 fichiers** → cf. checklist d'audit complète au point 14 (Phase E).
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
  - ⚠️ **CORRECTION (2026-07-17) — cette affirmation ne valait QUE pour les liens « Restaurer un achat » des écrans de PRIX** (`pricing.tsx`/`pricing-upgrade.tsx`, bien gardés `Platform.OS !== 'web'`). **La rangée « Restaurer les achats » de `parametres.tsx` (section Abonnement), elle, N'ÉTAIT PAS masquée** → sur web c'était un **bouton VISIBLE et MUET** (son `handleRestorePurchases` = `Alert.alert`, no-op silencieux sur RN Web). **CORRIGÉ en Phase F (Commit A, 2026-07-17)** : rangée `parametres` désormais `Platform.OS !== 'web'` ; « Plan actuel » reçoit `rowLast` en plus quand web+abonné (sinon coins bas carrés, la rangée Restaurer masquée était la dernière). **Phase 2 (natif)** : la rangée redevient visible et utile avec RevenueCat.

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

---

## STRATÉGIE DE BUILD NATIF — décidée le 2026-07-23

**Principe (décision utilisatrice)** : un seul chantier par build, JAMAIS mélangés. Le code partagé web/natif (surtout ce qui exige un redéploiement web) est TOUJOURS isolé, pour identifier immédiatement toute régression.

- **BUILD 1 (périmètre GELÉ le 2026-07-23)** — 5 corrections JS + confirmation clé Firebase native :
  - n°1 persistance photos → `documentDirectory` (`services/imagePersist.ts`) — commit `076ebfa`
  - n°2 tap notification → écran affirmation (`app/_layout.tsx`) — commit `e59f16b`
  - n°3 erreurs de connexion non trompeuses (`auth.tsx` + `translations.ts`) — commit `d1a8f8c`
  - n°4 bouton Apple masqué sur Android, iOS-only (`auth.tsx`) — commit `79bc6c2`
  - n°5 crash journal → célébration (démontage du `TextInput` avant navigation ; Fabric/New Arch réparentait le `ReactEditText` pendant `slide_from_bottom`) (`app/(app)/journal.tsx`) — commit `0b0aabc`
  - + clé Firebase native (Android key, App-restriction=None) déjà dans les variables EAS Preview/Production → **à CONFIRMER par ce build** (connexion e-mail native qui échouait avant).
  - Tous : `tsc --noEmit` = 0 et `expo export --platform web` = 0 à chaque commit. Aucun redéploiement web.
- **BUILD 2** — **MUSIQUE DE FOND, ISOLÉE**. Raison : touche du code PARTAGÉ web/natif ET impose un **redéploiement web**. Jamais mélangée à autre chose (fichier audio pas encore prêt, cf. chantier musique).
- **BUILD 3** — **Google Sign-In natif**, isolé (`@react-native-google-signin`, SHA, config).
- **BUILD 4** — **RevenueCat / achats in-app**, isolé. ⚠️ **BLOQUANT avant le test fermé** : les 12 testeurs doivent pouvoir tester le VRAI parcours d'achat (pas seulement le compte de démo).

---

## 🎯 RÈGLE DE TRAVAIL — CIBLAGE DES CORRECTIONS PAR PLATEFORME (décidée le 2026-07-23)

**Constat utilisatrice** : la version WEB fonctionne bien et est stable depuis longtemps. Les bugs rencontrés le 23/07/2026 (crash Fabric journal, persistance photos, tap notification, bouton Apple) sont TOUS **spécifiquement NATIFS** — ils n'existent pas sur le web. Appliquer ces correctifs au web ne résoudrait rien et introduirait un **risque inutile de régression** sur une version qui marche.

**Contexte** : les trois plateformes (web / Google Play / Apple) **divergent DÉJÀ par nature** — Paddle sur web vs Google Play Billing sur natif, clés Firebase différentes, Sign in with Apple iOS-only, boutons masqués selon la plateforme. Variantes assumées d'un même code.

**RÈGLE : NE PAS APPLIQUER AU WEB CE QUI NE CONCERNE QUE LE NATIF.** Pour CHAQUE correction future :
1. **Dire explicitement** si le problème existe AUSSI sur le web, ou s'il est spécifique au natif.
2. **Si spécifique au natif → conditionner à la plateforme** (`Platform.OS`), pour que le comportement web reste STRICTEMENT inchangé. **C'est le cas par défaut.**
3. **Si la correction bénéficierait aussi au web → le dire, expliquer pourquoi, et LAISSER TRANCHER l'utilisatrice.** Ne JAMAIS l'appliquer au web sans accord explicite.
4. **Toujours indiquer, pour chaque correction : « affecte le web : OUI / NON »**, et si OUI, ce que l'utilisateur web verrait changer concrètement.

**Objectif** : garder la maîtrise de ce qui part sur chaque plateforme, éviter les régressions sur une version web stable, ne redéployer le web que quand on le décide, avec un contenu choisi.

**⚠️ POINT DE VIGILANCE À TRAITER — redéploiement web (prévu pour la MUSIQUE, Build 2)** : un déploiement web reconstruit TOUT depuis l'état du code → les corrections du Build 1 partiront automatiquement avec. Deux touchent du **code partagé** : **n°3** (messages d'erreur de connexion, `auth.tsx` + `translations.ts`) et **n°5** (démontage du `TextInput` dans le journal, `journal.tsx`). Avant ce déploiement, il faudra : (a) dire précisément ce qui changerait pour un utilisateur web, (b) proposer, si pertinent, de conditionner ces corrections au natif, (c) prévoir un **test web complet après déploiement** (connexion + journal en priorité).
