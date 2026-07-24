# ManifestMind — Règles impératives (à lire à CHAQUE session)

## 🔒 RÈGLE ABSOLUE — PROTECTION DE LA VERSION WEB
- L'application WEB en ligne (https://manifestmind.web.app) doit rester STRICTEMENT IDENTIQUE. On n'y touche à rien.
- Le code source est PARTAGÉ entre le web et le natif. Toute modification destinée au natif (stores) ne doit JAMAIS dégrader, changer ou casser le comportement de la version web.
- Avant toute modification, vérifier et signaler si elle risque d'affecter le web. En cas de doute, s'arrêter et demander.

## 🛡️ RÈGLE — VÉRIFIER LE RENDU STATIQUE WEB (TAILLES DE ROUTES) SUR TOUT CODE PARTAGÉ
- Origine (24/07/2026, Bloc 2 musique) : importer `expo-audio` dans du code partagé a CASSÉ le rendu statique web — toutes les routes HTML sont tombées à 19,3 kB (au lieu de 32-47 kB variées). Or `tsc --noEmit` = 0 ET `expo export --platform web` = 0 : les DEUX vérifs habituelles étaient au vert. Régression invisible, détectée seulement en comparant les tailles de routes.
- **« exit 0 » NE SUFFIT PAS.** Pour toute modif touchant du code PARTAGÉ web/natif, EN PLUS :
  1. Comparer les tailles des routes HTML statiques (sortie de `expo export --platform web`) AVANT et APRÈS.
  2. Elles doivent rester STRICTEMENT identiques. Une uniformisation soudaine des tailles = signal d'alerte (rendu statique cassé).
  3. Régression détectée → NE PAS COMMITTER, corriger d'abord (typiquement en isolant le code fautif en **client-only**), puis re-vérifier.
  4. Toujours RAPPORTER le résultat de cette comparaison à l'utilisatrice, pas seulement les codes de sortie.
- Enjeu : un HTML statique dégradé n'empêche pas le site de fonctionner, mais nuit au référencement et au premier affichage — invisible aux tests classiques.

## 🟣 MODÈLE FREEMIUM EN VIGUEUR — 1 CYCLE GRATUIT
- Modèle actuel (seule règle en vigueur) : 1 cycle gratuit → félicitations → paywall dès le retour à l'accueil.
- Ancien modèle OBSOLÈTE : « 7 cycles → paywall cycle 8 ». Toute mention « 7 cycles / cycle 7 / cycle 8 » ailleurs = trace historique, jamais la règle actuelle.

## 🎯 DÉCISION — CIBLE API ANDROID 36 (via ROUTE A)
- Viser targetSdk/compileSdk 36 dès la 1ʳᵉ publication, via expo-build-properties, en RESTANT sur Expo SDK 54. PAS de montée Expo SDK 55 (risque web élevé).
- Application au moment du 1er build natif (G2). Filet : repli API 35 possible si incompatibilité, sans risque web.

## 🧭 MODE DE TRAVAIL
- Ne rien coder / builder / committer sans demande explicite. Documentation et lecture par défaut ; actions uniquement sur consigne claire.
- claude_master.md n'est PAS lu automatiquement : ce CLAUDE.md fait foi pour les règles impératives.

## 📓 JOURNAL DE RÉFÉRENCE — claude_master.md
- Tout le contexte, l'historique et les décisions détaillées de ces derniers mois sont dans claude_master.md (à la racine, minuscules).
- Le LIRE en début de session pour le contexte complet (état du projet, phases, décisions passées, points de vigilance).
