# ManifestMind — Règles impératives (à lire à CHAQUE session)

## 🔒 RÈGLE ABSOLUE — PROTECTION DE LA VERSION WEB
- L'application WEB en ligne (https://manifestmind.web.app) doit rester STRICTEMENT IDENTIQUE. On n'y touche à rien.
- Le code source est PARTAGÉ entre le web et le natif. Toute modification destinée au natif (stores) ne doit JAMAIS dégrader, changer ou casser le comportement de la version web.
- Avant toute modification, vérifier et signaler si elle risque d'affecter le web. En cas de doute, s'arrêter et demander.

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
