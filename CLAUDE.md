# ManifestMind — Règles impératives (à lire à CHAQUE session)

## 🔒 RÈGLE ABSOLUE — PROTECTION DE LA VERSION WEB
- L'application WEB en ligne (https://manifestmind.web.app) doit rester STRICTEMENT IDENTIQUE. On n'y touche à rien.
- Le code source est PARTAGÉ entre le web et le natif. Toute modification destinée au natif (stores) ne doit JAMAIS dégrader, changer ou casser le comportement de la version web.
- Avant toute modification, vérifier et signaler si elle risque d'affecter le web. En cas de doute, s'arrêter et demander.
- **Exception validée par l'utilisatrice le 23/11/2026 — version 1.1.0** : les changements de la liste définitive A→E (cf. claude_master.md, « 🗺️ VERSION 1.1.0 ») vont AUSSI sur le web : payant dès l'ouverture, ronds animés, journal modifiable, écran « Parcours accompli », textes légaux. Ils partent en ligne en UNE fois, le jour de la publication des apps. **Hors de cette liste, la règle ci-dessus reste entière.** Paddle (`paddleWebhook`, destination webhook, produits) n'est touché que par les étapes de la liste (Node 22, nouveaux prix le jour J).

## 🛡️ RÈGLE — VÉRIFIER LE RENDU STATIQUE WEB (TAILLES DE ROUTES) SUR TOUT CODE PARTAGÉ
- Origine (24/07/2026, Bloc 2 musique) : importer `expo-audio` dans du code partagé a CASSÉ le rendu statique web — toutes les routes HTML sont tombées à 19,3 kB (au lieu de 32-47 kB variées). Or `tsc --noEmit` = 0 ET `expo export --platform web` = 0 : les DEUX vérifs habituelles étaient au vert. Régression invisible, détectée seulement en comparant les tailles de routes.
- **« exit 0 » NE SUFFIT PAS.** Pour toute modif touchant du code PARTAGÉ web/natif, EN PLUS :
  1. Comparer les tailles des routes HTML statiques (sortie de `expo export --platform web`) AVANT et APRÈS.
  2. Elles doivent rester STRICTEMENT identiques. Une uniformisation soudaine des tailles = signal d'alerte (rendu statique cassé).
  3. Régression détectée → NE PAS COMMITTER, corriger d'abord (typiquement en isolant le code fautif en **client-only**), puis re-vérifier.
  4. Toujours RAPPORTER le résultat de cette comparaison à l'utilisatrice, pas seulement les codes de sortie.
- Enjeu : un HTML statique dégradé n'empêche pas le site de fonctionner, mais nuit au référencement et au premier affichage — invisible aux tests classiques.

## 🟣 MODÈLE D'ACCÈS — PAYANT DÈS L'OUVERTURE (décision du 23/11/2026, version 1.1.0)
- **Règle décidée** : plus AUCUN cycle gratuit, nulle part (web, Android, iOS). Après l'onboarding, le paywall s'affiche tout de suite. **Personne n'est laissé finir son cycle 1** : une personne en plein cycle 1 gratuit au moment de la mise à jour voit le paywall immédiatement.
- **État de transition** : tant que la 1.1.0 n'est pas codée, construite et publiée, le code en ligne applique encore « 1 cycle gratuit → félicitations → paywall ». C'est l'ANCIEN modèle, à remplacer — jamais à étendre ni à réintroduire.
- Modèles OBSOLÈTES : « 1 cycle gratuit » (21/07/2026 → 1.1.0) et « 7 cycles → paywall cycle 8 ». Toute mention de cycle gratuit / essai / « cycle 7 / cycle 8 » ailleurs = trace historique, jamais la règle actuelle.
- Examinateurs Google et Apple : ils entrent par « J'ai déjà un abonnement — Me connecter » avec le compte de démonstration (abonnement posé dans Firestore). Ce bouton et « Restaurer » doivent rester visibles sur le paywall.

## 💲 RÈGLE — AUCUN PRIX ÉCRIT EN DUR (décision du 23/11/2026)
- Les prix viennent TOUJOURS des consoles, lus à l'exécution : Paddle sur le web (`Paddle.PricePreview`), Google Play et App Store sur mobile (via Adapty). Un changement fait dans une console doit se voir dans l'app sans reconstruction.
- Interdit : tout montant écrit dans le code, les traductions ou les textes légaux. Seuls les montants CALCULÉS à partir du prix venu de la console (ex. « soit X/mois » de l'annuel) sont permis.
- Prix décidés pour la 1.1.0, identiques partout et en dollars : **4,99 $/mois · 29,99 $/an · 79,99 $ à vie**. L'utilisatrice les pose dans les consoles LE JOUR de la mise en ligne, pas avant.
- **Offre annuelle spéciale (1.1.0)** : produit à part `mm_premium_annual_special` à **19,99 $/an**, présenté seulement dans une fenêtre (à partir de la 2ᵉ visite du paywall sans achat, 30 s après l'ouverture). Détails dans claude_master.md (« 🎁 OFFRE ANNUELLE SPÉCIALE »).

## 🟣 RÈGLE PERMANENTE — LES TROIS SURFACES ENSEMBLE, TOUJOURS (décision du 24/11/2026)
- **Site, Android et iOS ont TOUJOURS les mêmes prix et les mêmes offres.** Tout produit, toute offre, tout prix ajouté ou modifié l'est sur les trois en même temps : Paddle, Google Play et App Store. Jamais sur une seule surface.
- Interdit : une offre ou un prix « mobile seulement » ou « site seulement ».

## 🎯 DÉCISION — CIBLE API ANDROID 36 (via ROUTE A)
- Viser targetSdk/compileSdk 36 dès la 1ʳᵉ publication, via expo-build-properties, en RESTANT sur Expo SDK 54. PAS de montée Expo SDK 55 (risque web élevé).
- Application au moment du 1er build natif (G2). Filet : repli API 35 possible si incompatibilité, sans risque web.

## 🧭 MODE DE TRAVAIL
- Ne rien coder / builder / committer sans demande explicite. Documentation et lecture par défaut ; actions uniquement sur consigne claire.
- claude_master.md n'est PAS lu automatiquement : ce CLAUDE.md fait foi pour les règles impératives.

## 📓 JOURNAL DE RÉFÉRENCE — claude_master.md
- Tout le contexte, l'historique et les décisions détaillées de ces derniers mois sont dans claude_master.md (à la racine, minuscules).
- Le LIRE en début de session pour le contexte complet (état du projet, phases, décisions passées, points de vigilance).
