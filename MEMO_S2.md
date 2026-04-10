# CLAUDE_MASTER.md — Session 2
# Pages : Splash · Prénom · Accueil

---

## RAPPEL ÉTAT DU PROJET

Onboarding 5 écrans VALIDÉS ✅
- index.tsx — Bienvenue + langue
- features.tsx — Fonctionnalités
- privacy.tsx — CGU
- pricing.tsx — Tarifs (stub paiement)
- auth.tsx — Connexion (Apple/Google stub, Email ML)

Fichier de référence visuel : pages_1_2_3.html à la racine du projet

---

## SESSION 2 — OBJECTIF

Coder 3 nouvelles pages dans app/(app)/ :
1. splash.tsx — Page Splash
2. name.tsx — Page Prénom
3. home.tsx — Page Accueil

---

## NAVIGATION GLOBALE À METTRE À JOUR

Modifier app/(app)/_layout.tsx pour gérer le routing :

```typescript
// Au démarrage de l'app (app)
// 1. Lire user_language → appliquer la langue
// 2. Vérifier last_open_date → créditer +10 pts si nouveau jour
// 3. Afficher Splash systématiquement
// Splash → vérifie user_name
//   Si absent → Page Prénom (une seule fois dans la vie)
//   Si présent → Page Accueil
```

---

## PAGE 1 — SPLASH (app/(app)/splash.tsx)

### Design
Reproduis EXACTEMENT le visuel de pages_1_2_3.html section "01 — Splash"

Couleurs :
- Fond : #F0EAE0
- Orbes : #B8D4B0, #C4A8D4, #E8C890 — softPulse animation
- Bouton : #3A3530, borderRadius 999

Éléments :
- Logo SVG œil animé (même que onboarding) width=180 height=138
- "ManifestMind" — Cormorant Garamond italic 26px
- "Bien-être & Intentions" — Jost 300 11px uppercase
- Badge or "✦ +10 pts au démarrage" — FDE8B0/9A6A00
- Séparateur fin + Citation "Chaque pensée façonne ton futur"
- 3 points décoratifs verts/violets/or
- Bouton "Commencer →" — #3A3530 pilule

### Logique

```typescript
useEffect(() => {
  async function initSplash() {
    // 1. Lire la langue mémorisée
    const lang = await AsyncStorage.getItem('user_language') || 'fr'
    // Appliquer la langue via LanguageContext

    // 2. Créditer +10 pts si première ouverture du jour
    const lastOpen = await AsyncStorage.getItem('last_open_date')
    const today = new Date().toDateString()
    if (lastOpen !== today) {
      await AsyncStorage.setItem('last_open_date', today)
      const pointsToday = parseInt(
        await AsyncStorage.getItem('points_today') || '0'
      )
      await AsyncStorage.setItem(
        'points_today', 
        String(Math.min(pointsToday + 10, 100))
      )
      const pointsTotal = parseInt(
        await AsyncStorage.getItem('points_total') || '0'
      )
      await AsyncStorage.setItem(
        'points_total', 
        String(pointsTotal + 10)
      )
    }
  }
  initSplash()
}, [])

// Bouton Commencer
async function handleStart() {
  const userName = await AsyncStorage.getItem('user_name')
  if (!userName) {
    router.push('/(app)/name')
  } else {
    router.push('/(app)/home')
  }
}
```

---

## PAGE 2 — PRÉNOM (app/(app)/name.tsx)

### Design
Reproduis EXACTEMENT le visuel de pages_1_2_3.html section "02 — Prénom"

Éléments :
- Orbes #B8D4B0 et #C4A8D4
- Logo SVG œil animé width=180 height=138
- Séparateur fin
- "Comment t'appelles-tu ?" — Cormorant Garamond italic 26px
- "Personnalisons ton expérience" — Jost 300 13px
- Champ texte centré — border-radius 50px, fond #E8E0D4
- Bouton "Sauvegarder & Continuer →" — #3A3530 pilule
- Texte bas : "Stocké uniquement sur ton appareil. Aucune donnée transmise."

### Logique

```typescript
// Cette page ne s'affiche qu'une seule fois
// Vérification faite dans splash.tsx avant navigation

const [name, setName] = useState('')

async function handleSave() {
  if (!name.trim()) return // Ne pas sauvegarder si vide
  
  await AsyncStorage.setItem('user_name', name.trim())
  await AsyncStorage.setItem(
    'user_start_date', 
    new Date().toISOString()
  )
  router.replace('/(app)/home')
}

// Bouton désactivé si champ vide
// opacity 0.4 si name.trim() === ''
// opacity 1 si name.trim() !== ''
```

---

## PAGE 3 — ACCUEIL (app/(app)/home.tsx)

### Design
Reproduis EXACTEMENT le visuel de pages_1_2_3.html section "03 — Accueil"

Structure (page FIXE — pas de scroll) :
- Fond : #F0EAE0
- Orbes : #B8D4B0, #C4A8D4, #E8C890
- flex:1, justifyContent: space-between
- overflow: hidden

Éléments dans l'ordre :

**1. Œil SVG** width=64 height=49 — fixe sans animation d'ouverture

**2. "Bonjour" + Prénom**
- "Bonjour" — Jost 300 12px uppercase #7A7068
- Prénom lu depuis AsyncStorage — Cormorant Garamond italic 30px #2A2520

**3. Phrase violette**
- "Visualise le succès, crois en toi et manifeste tes rêves"
- Cormorant Garamond italic 15px #6B3FA0 centré

**4. Jauge progression annuelle 365 jours**
- Label gauche : "Progression" — Jost 10px uppercase #7A7068
- Badge droit : niveau actuel — Jost 10px #6B3FA0 fond #DDD0F8
- "365 jours" aligné droite — Cormorant Garamond italic 11px #9A8878
- Barre : height 14px, fond #E4DCD4, border 0.5px #C8BEB0
- Remplissage violet #6B3FA0 animé au chargement
- 4 points niveaux sous la barre

**5. Bouton "Commencer mon jour"**
- #3A3530, borderRadius 999
- marginTop 6, marginBottom 6
- fontSize 10px
- → navigate vers /(app)/affirmation

**6. Deux boutons cliquables**
- Journal : fond rgba(255,255,255,.65), bordure #C4A8D4
  icône carnet violet, "+15 pts/jour"
  → navigate vers /(app)/journal
- Vision Board : fond rgba(255,255,255,.65), bordure #C4A8D4
  icône grille colorée, "+5 pts/jour"
  → navigate vers /(app)/vision-board

**7. Bloc puces — FIXE NON CLIQUABLE**
- Fond rgba(255,255,255,.35), bordure #E0D8D0, borderRadius 10
- 3 lignes séparées par traits fins :
  - Icône soleil #FDE8B0 + "Affirmations" + badge "+15 pts"
  - Icône éclair #DDD0F8 + "Actions" + badge "+15/25 pts"
  - Icône œil #C4E8F0 + "Visualisations" + badge "+15 pts"

### Logique

```typescript
// Lire le prénom
const [userName, setUserName] = useState('')
const [dayNumber, setDayNumber] = useState(1)
const [progressPercent, setProgressPercent] = useState(0)
const [level, setLevel] = useState('Éveillé')

useEffect(() => {
  async function loadHome() {
    // Prénom
    const name = await AsyncStorage.getItem('user_name') || ''
    setUserName(name)

    // Calcul du jour actuel
    const startDate = await AsyncStorage.getItem('user_start_date')
    if (startDate) {
      const start = new Date(startDate)
      const today = new Date()
      const diff = Math.floor(
        (today.getTime() - start.getTime()) / 86400000
      ) + 1
      const day = Math.min(diff, 365)
      setDayNumber(day)

      // Progression annuelle en %
      const percent = (day / 365) * 100
      setProgressPercent(percent)

      // Niveau
      if (percent < 25) setLevel('Éveillé')
      else if (percent < 50) setLevel('Floraison')
      else if (percent < 75) setLevel('Rayonnant')
      else setLevel('Manifestant')
    }
  }
  loadHome()
}, [])
```

### Navbar — 3 onglets

```typescript
// Navbar fixe en bas — 3 boutons uniquement
// Accueil (actif sur home.tsx) → /(app)/home
// Profil → /(app)/profil
// Paramètres → /(app)/parametres

// Icônes SVG :
// Accueil : maison SVG fill #6B3FA0 si actif, #A09088 sinon
// Profil : cercle + silhouette SVG
// Paramètres : engrenage SVG (cercle avec rayons)

// Style navbar :
// height 50px
// backgroundColor #F0EAE0
// borderTop 0.5px #D4C4B8
// flexDirection row, justifyContent space-around
```

---

## ASYNCSTORAGE — CLÉS UTILISÉES CES 3 PAGES

```typescript
// Déjà créées dans l'onboarding :
'user_language'        // langue choisie FR/EN/ES
'onboarding_completed' // true après onboarding

// Créées dans ces 3 pages :
'last_open_date'       // date du jour en toDateString()
'points_today'         // points du jour (max 100, reset minuit)
'points_total'         // points cumulés totaux
'user_name'            // prénom sauvegardé à vie
'user_start_date'      // date ISO du premier jour du parcours
```

---

## FICHIERS À CRÉER

```
app/(app)/splash.tsx     ← Page Splash
app/(app)/name.tsx       ← Page Prénom (une seule fois)
app/(app)/home.tsx       ← Page Accueil
```

Placeholder vides à créer également pour que la navigation ne casse pas :
```
app/(app)/affirmation.tsx   ← placeholder "Page Affirmation"
app/(app)/journal.tsx       ← placeholder "Page Journal"
app/(app)/vision-board.tsx  ← placeholder "Page Vision Board"
app/(app)/profil.tsx        ← placeholder "Page Profil"
app/(app)/parametres.tsx    ← placeholder "Page Paramètres"
```

---

## RESET QUOTIDIEN DES POINTS

À implémenter dans app/(app)/_layout.tsx :

```typescript
// Vérifier si points_today doit être remis à zéro
const lastOpen = await AsyncStorage.getItem('last_open_date')
const today = new Date().toDateString()
if (lastOpen !== today) {
  // Nouveau jour → reset points du jour
  await AsyncStorage.setItem('points_today', '0')
}
```

---

## INSTRUCTIONS CLAUDE CODE

1. Lis pages_1_2_3.html à la racine — c'est la référence visuelle exacte

2. Reproduis pixel par pixel le design des 3 sections :
   "01 — Splash", "02 — Prénom", "03 — Accueil"

3. Teste sur Expo Go après chaque page :
   - Splash : œil animé visible, badge +10 pts, bouton fonctionne
   - Prénom : s'affiche seulement si user_name absent, sauvegarde OK
   - Accueil : prénom affiché, jauge visible, 3 boutons naviguent

4. Vérifie 0 erreur TypeScript

5. Confirme chaque page avant de passer à la suivante

6. NE PAS modifier les fichiers de l'onboarding déjà validés

7. Mets à jour CLAUDE_MASTER.md après chaque page validée

