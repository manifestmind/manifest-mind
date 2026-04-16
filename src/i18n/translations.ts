// ─── ManifestMind i18n ───────────────────────────────────────────────────────
// Source of truth for all UI strings in FR / EN / ES.
// Sections mirror screen names for easy lookup.
// Dynamic segments use {placeholder} notation — interpolate before rendering.

export const translations = {
  fr: {
    // ── Common ────────────────────────────────────────────────────────────────
    commun: {
      navbar: {
        accueil: 'Accueil',
        profil: 'Profil',
        parametres: 'Paramètres',
      },
      partager: 'Partager',
      ou: 'ou',
      annuler: 'Annuler',
      confirmer: 'Confirmer',
      supprimer: 'Supprimer',
      suivant: 'Suivant →',
      continuer: 'Continuer →',
      commencer: 'Commencer →',
      passer: 'Passer cette étape sans points',
      theme: 'Thème',
      cycle: 'Cycle',
      disponibleProchainement: 'Disponible prochainement',
    },

    // ── Legal URLs ─────────────────────────────────────────────────────────────
    legal: {
      privacyUrl: 'https://manifestmind.github.io/manifest-mind/politique_confidentialite_fr.html',
      termsUrl: 'https://manifestmind.github.io/manifest-mind/conditions_utilisation_fr.html',
    },

    // ── Level names (NEW — replaces Éveillé/Floraison/Rayonnant/Manifestant) ──
    niveaux: {
      eveil: 'Éveil',
      ancrage: 'Ancrage',
      expansion: 'Expansion',
      manifestation: 'Manifestation',
    },

    // ── Themes (7) ────────────────────────────────────────────────────────────
    themes: [
      'Confiance & Identité',
      'Abondance & Prospérité',
      'Amour & Relations',
      'Santé & Vitalité',
      'Carrière & Mission',
      'Créativité & Expression',
      'Gratitude & Paix',
    ],

    // ── Onboarding : welcome ───────────────────────────────────────────────────
    welcome: {
      tagline: 'Bien-être & Intentions',
      quote: 'Chaque pensée\nfaçonne ton futur',
      commencer: 'Commencer →',
      hint: 'Ton espace de croissance personnelle',
    },

    // ── Onboarding : features ─────────────────────────────────────────────────
    features: {
      titre: 'Un programme complet',
      sousTitre: '365 cycles · 2555 étapes · 4 phases · 7 thèmes',
      texteViolet: '365 cycles pour transformer ta vie étape par étape',
      etape: 'Étape 1 / 3',
      cartes: {
        ouverture: {
          titre: 'Ouverture quotidienne',
          texte: 'Récompense ta constance chaque cycle.',
          note: 'Chaque connexion renforce\nton énergie intérieure.',
        },
        affirmation: {
          titre: 'Affirmations quotidiennes',
          texte: 'Un message puissant à chaque cycle.',
          note: 'Reprogramme ton esprit dès le début du cycle.',
        },
        actions: {
          titre: 'Actions concrètes',
          facile: 'Facile',
          difficile: 'ou difficile',
          note: 'Chaque petite action te rapproche de ton objectif.',
        },
        visualisation: {
          titre: 'Visualisation guidée',
          texte: 'Méditation et respiration chaque cycle.',
          note: 'Visualise ta future vie comme si tu y étais déjà.',
        },
        visionBoard: {
          titre: 'Vision Board',
          texte: 'Visualise tes rêves et objectifs.',
          note: 'Crée une vision claire et laisse\nton esprit le manifester.',
        },
        journal: {
          titre: 'Journal personnel',
          texte: 'Clarifie tes pensées et tes émotions.',
          note: 'Écrire c\'est concrétiser\nce que tu veux vraiment.',
        },
        badges: {
          titre: 'Points & Badges',
          texte: '100 pts/cycle max · 4 niveaux · récompenses',
          note: 'Transforme ta progression en victoire visible.',
        },
      },
      suivant: 'Suivant →',
    },

    // ── Onboarding : privacy ──────────────────────────────────────────────────
    privacy: {
      titre: 'Confidentialité',
      etape: 'Étape 2 / 3',
      items: {
        chiffrement: { titre: 'Données chiffrées', texte: 'Progression et journal sécurisés' },
        vente: { titre: 'Jamais vendues', texte: 'Aucun partage tiers, jamais' },
        suppression: { titre: 'Suppression à tout moment', texte: 'Depuis les Paramètres de l\'app' },
        pub: { titre: 'Aucune publicité', texte: 'Jamais de ciblage marketing' },
      },
      checkboxAvant: "J'accepte les ",
      checkboxTerms: "Conditions d'utilisation",
      checkboxMilieu: ' et la ',
      checkboxPrivacy: 'Politique de confidentialité',
      continuer: 'Continuer →',
    },

    // ── Onboarding : pricing ──────────────────────────────────────────────────
    pricing: {
      titre: 'Transforme ta vie en 365 cycles',
      etape: 'Étape 3 / 3',
      plans: {
        lifetime: {
          badge: '⭐ Meilleure offre · Accès à vie',
          titre: 'Lifetime',
          sousTitre: 'Paiement unique · Transformation permanente',
          unite: 'une fois',
        },
        annuel: {
          badge: '⭐ Recommandé · Économise 50%',
          titre: 'Annuel',
          sousTitre: '79€/an · soit 0,21€/cycle',
          unite: '/mois',
        },
        mensuel: {
          titre: 'Mensuel',
          sousTitre: 'Résiliable à tout moment',
          unite: '/mois',
        },
      },
      avantages: [
        '365 cycles de transformation guidée',
        'Affirmations + actions quotidiennes',
        'Journal et vision board intégrés',
        'Suivi de progression et discipline',
        'Disponible en FR, EN & ES',
      ],
      cta: 'Je transforme ma vie maintenant →',
      bottomText: 'Moins de 0,50€ pour changer ta vie',
      restaurer: 'Restaurer un achat',
    },

    // ── Onboarding : auth ─────────────────────────────────────────────────────
    auth: {
      titre: 'Rejoins-nous',
      sousTitre: 'Crée ton compte pour sauvegarder\nta progression',
      apple: 'Continuer avec Apple',
      google: 'Continuer avec Google',
      email: 'Continuer avec e-mail',
      placeholder: 'Ton adresse e-mail',
      envoyer: 'Envoyer le lien →',
      sansCompte: 'Continuer sans compte →',
      alertApple: {
        titre: 'Disponible prochainement',
        corps: 'La connexion Apple sera disponible dans une prochaine version.',
      },
      alertGoogle: {
        titre: 'Disponible prochainement',
        corps: 'La connexion Google sera disponible dans une prochaine version.',
      },
      alertEmailSent: {
        titre: 'Lien envoyé !',
        corps: 'Vérifie ta boîte mail ✉️\nUn lien de connexion t\'a été envoyé.',
      },
      alertEmailError: {
        titre: 'Erreur',
        corps: 'Impossible d\'envoyer le lien. Vérifie ton adresse e-mail.',
      },
      alertLienInvalide: {
        titre: 'Lien invalide',
        corps: 'Ce lien de connexion est invalide ou a déjà été utilisé. Demande un nouveau lien.',
      },
      alertLienExpire: {
        titre: 'Lien expiré',
        corps: 'Ce lien a expiré. Retourne à l\'écran de connexion et demande un nouveau lien.',
      },
      alertLienEmailManquant: {
        titre: 'Ouvre sur ton appareil',
        corps: 'Pour finaliser la connexion, ouvre ce lien sur l\'appareil où tu as saisi ton adresse e-mail.',
      },
      alertErreurReseau: {
        titre: 'Erreur réseau',
        corps: 'Vérifie ta connexion internet et réessaie.',
      },
      alertUtilisateurIntrouvable: {
        titre: 'Compte introuvable',
        corps: 'Aucun compte n\'est associé à cette adresse e-mail. Crée un compte ou utilise une autre adresse.',
      },
      alertNonConnecte: {
        titre: 'Non connecté',
        corps: 'Tu n\'as pas de compte Firebase actif. Continue sans compte ou crée-en un.',
      },
    },

    // ── App : splash ──────────────────────────────────────────────────────────
    splash: {
      tagline: 'Bien-être & Intentions',
      badge: '✦ +10 pts au démarrage',
      quote: 'Chaque pensée\nfaçonne ton futur',
      commencer: 'Commencer →',
      hint: 'Ton espace de croissance personnelle',
      toast: '+10 pts · Ouverture du cycle',
    },

    // ── App : name ────────────────────────────────────────────────────────────
    name: {
      titre: 'Comment tu t\'appelles ?',
      placeholder: 'Ton prénom',
      btnNouvel: 'Continuer →',
      btnEdit: 'Mettre à jour →',
    },

    // ── App : home ────────────────────────────────────────────────────────────
    home: {
      bienvenue: 'Bienvenue',
      defautPrenom: 'toi',
      citation: 'Visualise le succès, crois en toi\net manifeste tes rêves',
      gaugeLabel: 'Progression · Cycle',
      gaugeCycles: '365 cycles',
      nextCycle: '✦ Prochain cycle à minuit',
      programmeTermine: '✦ 365 cycles accomplis',
      commencerCycle: 'Commencer mon cycle →',
      continuerCycle: 'Continuer mon cycle →',
      toastMilestone: '✦ {n} pts sur 36 500 — Félicitations !',
      toastNewLevel: '✦ Nouveau niveau — {level} !',
      cards: {
        journal: 'Journal',
        visionBoard: 'Vision Board',
      },
      feats: {
        affirmations: 'Affirmations',
        actions: 'Actions',
        visualisations: 'Visualisations',
      },
    },

    // ── App : affirmation ─────────────────────────────────────────────────────
    affirmation: {
      titre: 'Affirmation',
      etape: 'Étape 2 · Cycle {n}',
      instruction: 'Répète cette phrase à voix haute,\nplusieurs fois, avec sincérité.',
      valider: 'J\'ai répété mon affirmation · +15 pts',
      passer: 'Passer cette étape sans points',
      toast: '✦ +15 pts · Affirmation validée',
    },

    // ── App : action ──────────────────────────────────────────────────────────
    action: {
      titre: 'Actions du cycle',
      etape: 'Étape 3 & 4 · Cycle {n}',
      affirmationValidee: '✓ Affirmation validée',
      facile: 'Action facile',
      difficile: 'Action difficile',
      validerFacile: 'Valider · +15 pts',
      validerDifficile: 'Valider · +25 pts',
      passer: 'Passer cette étape sans points',
      toastFacile: '✦ +15 pts · Action facile validée',
      toastDifficile: '✦ +25 pts · Action difficile validée',
    },

    // ── App : visualisation ───────────────────────────────────────────────────
    visualisation: {
      titre: 'Visualisation',
      etape: 'Étape 5 · Cycle {n}',
      inspire: 'Inspire',
      retiens: 'Retiens',
      expire: 'Expire',
      valider: 'J\'ai visualisé · +15 pts ✦',
      passer: 'Passer cette étape sans points',
      toast: '✦ +15 pts · Visualisation validée',
    },

    // ── App : celebration ─────────────────────────────────────────────────────
    celebration: {
      cycleComplete: 'Cycle {n} complété ✦',
      felicitations: 'Félicitations',
      pointsGagnes: 'Points gagnés ce cycle',
      surCentPossibles: 'sur 100 possibles',
      etapes: {
        ouverture: 'Ouverture',
        affirmation: 'Affirmation',
        actionFacile: 'Action facile',
        actionDifficile: 'Action difficile',
        visualisation: 'Visualisation',
        journal: 'Journal',
        visionBoard: 'Vision Board',
      },
      passee: 'passée',
      prochainCycle: 'Prochain cycle disponible à minuit',
      retourAccueil: 'Retour à l\'accueil',
    },

    // ── App : journal ─────────────────────────────────────────────────────────
    journal: {
      titre: 'Journal',
      etape: 'Étape 6 · Cycle {n}',
      placeholder: 'Écris ce que tu ressens, ce que tu veux libérer, ce que tu manifestes...',
      valider: 'Valider mon journal · +15 pts',
      passer: 'Passer cette étape sans points',
      toast: '✦ +15 pts · Journal validé',
      mots: 'mots',
      entreesPrecedentes: 'Entrées précédentes',
      aujourdhui: "Aujourd'hui",
      passe: 'Passé',
      etapePassee: 'Étape passée sans points',
    },

    // ── App : vision-board ────────────────────────────────────────────────────
    visionBoard: {
      titre: 'Vision Board',
      etape: 'Étape 7 · Cycle {n}',
      cellules: {
        carriere: 'Carrière',
        amour: 'Amour',
        abondance: 'Abondance',
        reves: 'Rêves',
        voyages: 'Voyages',
        sante: 'Santé',
        famille: 'Famille & Proches',
      },
      ajouterPhoto: 'Appuie pour ajouter ta photo',
      valider: 'Valider mon Vision Board · +5 pts',
      passer: 'Passer cette étape sans points',
      toast: '✦ +5 pts · Vision Board validé',
      terminerCycle: 'Terminer mon cycle ✦',
      permissionTitre: 'Accès aux photos requis',
      permissionMessage: 'Pour ajouter une photo, autorise l\'accès à ta galerie dans les Réglages de ton téléphone.',
    },

    // ── App : profil ──────────────────────────────────────────────────────────
    profil: {
      titre: 'Mon Profil',
      cycleTheme: 'Cycle {n} · Thème {theme}',
      progression: 'Progression',
      cycleEnCours: 'Cycle en cours',
      etapes: {
        ouverture: 'Ouverture',
        affirmation: 'Affirmation',
        actions: 'Actions',
      },
      stats: {
        totalPoints: 'Total points',
        ptsPossibles: '/ 36 500 pts possibles',
        cyclesCompletes: 'Cycles complétés',
        meilleurCycle: 'Meilleur cycle',
        moyenneCycle: 'Moy. par cycle',
        pts: 'pts',
      },
      modifierPrenom: 'Modifier mon prénom',
      recommencer: 'Recommencer depuis le début',
      recommencerSub: 'Efface tout · Irréversible',
      alertReset: {
        titre: 'Recommencer depuis le début ?',
        corps: 'Cette action est irréversible.\n\nTous tes points, cycles, entrées de journal et photos seront définitivement effacés.\nTu recommenceras au Cycle 1.\n\nTon abonnement reste actif.',
        annuler: 'Annuler',
        confirmer: 'Confirmer',
      },
    },

    // ── App : parametres ──────────────────────────────────────────────────────
    parametres: {
      titre: 'Paramètres',
      sections: {
        langue: 'Langue',
        notifications: 'Notifications',
        abonnement: 'Abonnement',
        compte: 'Compte',
        legal: 'Légal',
      },
      langueApp: 'Langue de l\'application',
      notifs: {
        affirmationTitre: 'Affirmation du cycle',
        affirmationSub: 'Reçois ton affirmation chaque matin',
        heureTitre: 'Heure de rappel matin',
        heureSub: 'Affirmation + ouverture du cycle',
        rappelTitre: 'Rappel cycle incomplet',
        rappelSub: 'Si cycle non terminé à 20h',
      },
      abonnement: {
        planActuel: 'Plan actuel',
        planSub: 'Annuel · Renouvellement auto',
        actif: 'Actif',
        restaurer: 'Restaurer les achats',
      },
      compte: {
        deconnecter: 'Se déconnecter',
        supprimer: 'Supprimer mon compte',
      },
      legalLinks: {
        confidentialite: 'Politique de confidentialité',
        conditions: 'Conditions d\'utilisation',
      },
      tagline: 'Fait avec amour pour ton épanouissement personnel',
      alertLangue: {
        titre: 'Langue',
        corps: 'Seul le français est disponible pour l\'instant.',
      },
      alertNotifsDesactivees: {
        titre: 'Notifications désactivées',
        corps: 'Active les notifications dans les réglages de ton téléphone.',
      },
      alertDeconnecter: {
        titre: 'Se déconnecter',
        corps: 'Tu seras redirigé vers l\'écran d\'accueil.',
        annuler: 'Annuler',
        confirmer: 'Déconnecter',
      },
      alertSupprimer: {
        titre: 'Supprimer mon compte',
        corps: 'Toutes tes données seront effacées définitivement. Cette action est irréversible.',
        annuler: 'Annuler',
        confirmer: 'Supprimer',
      },
      alertSupprimerReauth: {
        titre: 'Reconnexion requise',
        corps: 'Pour supprimer ton compte, nous devons vérifier ton identité. Souhaites-tu recevoir un nouveau lien de connexion ?',
        annuler: 'Annuler',
        envoyer: 'Envoyer un lien',
      },
      alertRestaurer: {
        titre: 'Restaurer les achats',
        corps: 'Aucun achat à restaurer pour le moment.',
      },
    },

    // ── App : pricing-upgrade ─────────────────────────────────────────────────
    pricingUpgrade: {
      titre: 'Changer d\'abonnement',
      confirmer: 'Confirmer mon abonnement →',
      restaurer: 'Restaurer un achat',
    },

    // ── Notifications ─────────────────────────────────────────────────────────
    notifications: {
      affirmationBody: 'Ton affirmation du cycle t\'attend.',
      rappelBody: 'Ton cycle d\'aujourd\'hui n\'est pas encore terminé. Tu peux encore le compléter !',
    },

    // ── Share (useShare.ts) ───────────────────────────────────────────────────
    share: {
      message: (cycle: number, level: string, pts: number) =>
        `👁✨ ManifestMind\n\n🔮 Cycle ${cycle} / 365 complété\n🌸 Niveau ${level}\n⭐ ${pts} pts / 36 500\n\nJe transforme ma vie\nun cycle à la fois ✦\n\n🔗 manifest-mind.app`,
      dialogTitle: 'Partager ma progression',
      copieeTitre: 'Copié !',
      copieCorps: 'Ton message a été copié dans le presse-papier.',
      erreurTitre: 'Partage impossible',
      erreurCorps: 'Une erreur est survenue. Réessaie.',
    },
  },

  // ════════════════════════════════════════════════════════════════════════════
  en: {
    commun: {
      navbar: {
        accueil: 'Home',
        profil: 'Profile',
        parametres: 'Settings',
      },
      partager: 'Share',
      ou: 'or',
      annuler: 'Cancel',
      confirmer: 'Confirm',
      supprimer: 'Delete',
      suivant: 'Next →',
      continuer: 'Continue →',
      commencer: 'Start →',
      passer: 'Skip this step without points',
      theme: 'Theme',
      cycle: 'Cycle',
      disponibleProchainement: 'Coming soon',
    },

    legal: {
      privacyUrl: 'https://manifestmind.github.io/manifest-mind/privacy_policy_en.html',
      termsUrl: 'https://manifestmind.github.io/manifest-mind/terms_of_use_en.html',
    },

    niveaux: {
      eveil: 'Awakening',
      ancrage: 'Grounding',
      expansion: 'Expansion',
      manifestation: 'Manifestation',
    },

    themes: [
      'Confidence & Identity',
      'Abundance & Prosperity',
      'Love & Relationships',
      'Health & Vitality',
      'Career & Mission',
      'Creativity & Expression',
      'Gratitude & Peace',
    ],

    welcome: {
      tagline: 'Wellness & Intentions',
      quote: 'Every thought\nshapes your future',
      commencer: 'Start →',
      hint: 'Your personal growth space',
    },

    features: {
      titre: 'A complete program',
      sousTitre: '365 cycles · 2555 steps · 4 phases · 7 themes',
      texteViolet: '365 cycles to transform your life step by step',
      etape: 'Step 1 / 3',
      cartes: {
        ouverture: {
          titre: 'Daily Opening',
          texte: 'Reward your consistency every cycle.',
          note: 'Each connection strengthens\nyour inner energy.',
        },
        affirmation: {
          titre: 'Daily Affirmations',
          texte: 'A powerful message every cycle.',
          note: 'Reprogram your mind at the start of each cycle.',
        },
        actions: {
          titre: 'Concrete Actions',
          facile: 'Easy',
          difficile: 'or hard',
          note: 'Every small action brings you closer to your goal.',
        },
        visualisation: {
          titre: 'Guided Visualization',
          texte: 'Meditation and breathing every cycle.',
          note: 'Visualize your future life as if you were already there.',
        },
        visionBoard: {
          titre: 'Vision Board',
          texte: 'Visualize your dreams and goals.',
          note: 'Create a clear vision and let\nyour mind manifest it.',
        },
        journal: {
          titre: 'Personal Journal',
          texte: 'Clarify your thoughts and emotions.',
          note: 'Writing makes real\nwhat you truly want.',
        },
        badges: {
          titre: 'Points & Badges',
          texte: '100 pts/cycle max · 4 levels · rewards',
          note: 'Turn your progress into a visible victory.',
        },
      },
      suivant: 'Next →',
    },

    privacy: {
      titre: 'Privacy',
      etape: 'Step 2 / 3',
      items: {
        chiffrement: { titre: 'Encrypted Data', texte: 'Secure progress and journal' },
        vente: { titre: 'Never Sold', texte: 'No third-party sharing, ever' },
        suppression: { titre: 'Delete Anytime', texte: 'From the app Settings' },
        pub: { titre: 'No Advertising', texte: 'Never any marketing targeting' },
      },
      checkboxAvant: 'I accept the ',
      checkboxTerms: 'Terms of Use',
      checkboxMilieu: ' and the ',
      checkboxPrivacy: 'Privacy Policy',
      continuer: 'Continue →',
    },

    pricing: {
      titre: 'Transform your life in 365 cycles',
      etape: 'Step 3 / 3',
      plans: {
        lifetime: {
          badge: '⭐ Best offer · Lifetime access',
          titre: 'Lifetime',
          sousTitre: 'One-time payment · Permanent transformation',
          unite: 'once',
        },
        annuel: {
          badge: '⭐ Recommended · Save 50%',
          titre: 'Annual',
          sousTitre: '€79/year · €0.21/cycle',
          unite: '/mo',
        },
        mensuel: {
          titre: 'Monthly',
          sousTitre: 'Cancel anytime',
          unite: '/mo',
        },
      },
      avantages: [
        '365 guided transformation cycles',
        'Daily affirmations + actions',
        'Integrated journal and vision board',
        'Progress tracking and discipline',
        'Available in FR, EN & ES',
      ],
      cta: 'I transform my life now →',
      bottomText: 'Less than €0.50 to change your life',
      restaurer: 'Restore a purchase',
    },

    auth: {
      titre: 'Join us',
      sousTitre: 'Create your account to save\nyour progress',
      apple: 'Continue with Apple',
      google: 'Continue with Google',
      email: 'Continue with email',
      placeholder: 'Your email address',
      envoyer: 'Send link →',
      sansCompte: 'Continue without account →',
      alertApple: {
        titre: 'Coming soon',
        corps: 'Apple sign-in will be available in a future version.',
      },
      alertGoogle: {
        titre: 'Coming soon',
        corps: 'Google sign-in will be available in a future version.',
      },
      alertEmailSent: {
        titre: 'Link sent!',
        corps: 'Check your inbox ✉️\nA sign-in link has been sent to you.',
      },
      alertEmailError: {
        titre: 'Error',
        corps: 'Unable to send the link. Check your email address.',
      },
      alertLienInvalide: {
        titre: 'Invalid link',
        corps: 'This sign-in link is invalid or has already been used. Please request a new link.',
      },
      alertLienExpire: {
        titre: 'Link expired',
        corps: 'This link has expired. Go back to the sign-in screen and request a new link.',
      },
      alertLienEmailManquant: {
        titre: 'Open on your device',
        corps: 'To complete sign-in, open this link on the device where you entered your email address.',
      },
      alertErreurReseau: {
        titre: 'Network error',
        corps: 'Check your internet connection and try again.',
      },
      alertUtilisateurIntrouvable: {
        titre: 'Account not found',
        corps: 'No account is associated with this email address. Create an account or use a different address.',
      },
      alertNonConnecte: {
        titre: 'Not signed in',
        corps: 'You don\'t have an active Firebase account. Continue without an account or create one.',
      },
    },

    splash: {
      tagline: 'Wellness & Intentions',
      badge: '✦ +10 pts at startup',
      quote: 'Every thought\nshapes your future',
      commencer: 'Start →',
      hint: 'Your personal growth space',
      toast: '+10 pts · Cycle Opening',
    },

    name: {
      titre: "What's your name?",
      placeholder: 'Your first name',
      btnNouvel: 'Continue →',
      btnEdit: 'Update →',
    },

    home: {
      bienvenue: 'Welcome',
      defautPrenom: 'you',
      citation: 'Visualize success, believe in yourself\nand manifest your dreams',
      gaugeLabel: 'Progress · Cycle',
      gaugeCycles: '365 cycles',
      nextCycle: '✦ Next cycle at midnight',
      programmeTermine: '✦ 365 cycles achieved',
      commencerCycle: 'Start my cycle →',
      continuerCycle: 'Continue my cycle →',
      toastMilestone: '✦ {n} pts out of 36,500 — Congrats!',
      toastNewLevel: '✦ New level — {level}!',
      cards: {
        journal: 'Journal',
        visionBoard: 'Vision Board',
      },
      feats: {
        affirmations: 'Affirmations',
        actions: 'Actions',
        visualisations: 'Visualizations',
      },
    },

    affirmation: {
      titre: 'Affirmation',
      etape: 'Step 2 · Cycle {n}',
      instruction: 'Repeat this phrase out loud,\nseveral times, with sincerity.',
      valider: 'I repeated my affirmation · +15 pts',
      passer: 'Skip this step without points',
      toast: '✦ +15 pts · Affirmation validated',
    },

    action: {
      titre: 'Cycle Actions',
      etape: 'Steps 3 & 4 · Cycle {n}',
      affirmationValidee: '✓ Affirmation validated',
      facile: 'Easy Action',
      difficile: 'Hard Action',
      validerFacile: 'Validate · +15 pts',
      validerDifficile: 'Validate · +25 pts',
      passer: 'Skip this step without points',
      toastFacile: '✦ +15 pts · Easy action validated',
      toastDifficile: '✦ +25 pts · Hard action validated',
    },

    visualisation: {
      titre: 'Visualization',
      etape: 'Step 5 · Cycle {n}',
      inspire: 'Inhale',
      retiens: 'Hold',
      expire: 'Exhale',
      valider: 'I visualized · +15 pts ✦',
      passer: 'Skip this step without points',
      toast: '✦ +15 pts · Visualization validated',
    },

    celebration: {
      cycleComplete: 'Cycle {n} completed ✦',
      felicitations: 'Congratulations',
      pointsGagnes: 'Points earned this cycle',
      surCentPossibles: 'out of 100 possible',
      etapes: {
        ouverture: 'Opening',
        affirmation: 'Affirmation',
        actionFacile: 'Easy Action',
        actionDifficile: 'Hard Action',
        visualisation: 'Visualization',
        journal: 'Journal',
        visionBoard: 'Vision Board',
      },
      passee: 'skipped',
      prochainCycle: 'Next cycle available at midnight',
      retourAccueil: 'Back to home',
    },

    journal: {
      titre: 'Journal',
      etape: 'Step 6 · Cycle {n}',
      placeholder: 'Write what you feel, what you want to release, what you\'re manifesting...',
      valider: 'Save my journal · +15 pts',
      passer: 'Skip this step without points',
      toast: '✦ +15 pts · Journal saved',
      mots: 'words',
      entreesPrecedentes: 'Previous entries',
      aujourdhui: 'Today',
      passe: 'Skipped',
      etapePassee: 'Step skipped without points',
    },

    visionBoard: {
      titre: 'Vision Board',
      etape: 'Step 7 · Cycle {n}',
      cellules: {
        carriere: 'Career',
        amour: 'Love',
        abondance: 'Abundance',
        reves: 'Dreams',
        voyages: 'Travel',
        sante: 'Health',
        famille: 'Family & Friends',
      },
      ajouterPhoto: 'Tap to add your photo',
      valider: 'Save my Vision Board · +5 pts',
      passer: 'Skip this step without points',
      toast: '✦ +5 pts · Vision Board saved',
      terminerCycle: 'Complete my cycle ✦',
      permissionTitre: 'Photo access required',
      permissionMessage: 'To add a photo, allow access to your gallery in your phone Settings.',
    },

    profil: {
      titre: 'My Profile',
      cycleTheme: 'Cycle {n} · Theme {theme}',
      progression: 'Progress',
      cycleEnCours: 'Current Cycle',
      etapes: {
        ouverture: 'Opening',
        affirmation: 'Affirmation',
        actions: 'Actions',
      },
      stats: {
        totalPoints: 'Total points',
        ptsPossibles: '/ 36,500 possible pts',
        cyclesCompletes: 'Completed cycles',
        meilleurCycle: 'Best cycle',
        moyenneCycle: 'Avg. per cycle',
        pts: 'pts',
      },
      modifierPrenom: 'Edit my name',
      recommencer: 'Restart from the beginning',
      recommencerSub: 'Erases everything · Irreversible',
      alertReset: {
        titre: 'Restart from the beginning?',
        corps: 'This action is irreversible.\n\nAll your points, cycles, journal entries and photos will be permanently deleted.\nYou will restart at Cycle 1.\n\nYour subscription remains active.',
        annuler: 'Cancel',
        confirmer: 'Confirm',
      },
    },

    parametres: {
      titre: 'Settings',
      sections: {
        langue: 'Language',
        notifications: 'Notifications',
        abonnement: 'Subscription',
        compte: 'Account',
        legal: 'Legal',
      },
      langueApp: 'App language',
      notifs: {
        affirmationTitre: 'Daily affirmation',
        affirmationSub: 'Receive your affirmation every morning',
        heureTitre: 'Morning reminder time',
        heureSub: 'Affirmation + cycle opening',
        rappelTitre: 'Incomplete cycle reminder',
        rappelSub: 'If cycle not completed by 8pm',
      },
      abonnement: {
        planActuel: 'Current plan',
        planSub: 'Annual · Auto-renewal',
        actif: 'Active',
        restaurer: 'Restore purchases',
      },
      compte: {
        deconnecter: 'Sign out',
        supprimer: 'Delete my account',
      },
      legalLinks: {
        confidentialite: 'Privacy Policy',
        conditions: 'Terms of Use',
      },
      tagline: 'Made with love for your personal growth',
      alertLangue: {
        titre: 'Language',
        corps: 'Only French is available for now.',
      },
      alertNotifsDesactivees: {
        titre: 'Notifications disabled',
        corps: 'Enable notifications in your phone settings.',
      },
      alertDeconnecter: {
        titre: 'Sign out',
        corps: 'You will be redirected to the welcome screen.',
        annuler: 'Cancel',
        confirmer: 'Sign out',
      },
      alertSupprimer: {
        titre: 'Delete my account',
        corps: 'All your data will be permanently deleted. This action is irreversible.',
        annuler: 'Cancel',
        confirmer: 'Delete',
      },
      alertSupprimerReauth: {
        titre: 'Re-authentication required',
        corps: 'To delete your account, we need to verify your identity. Would you like to receive a new sign-in link?',
        annuler: 'Cancel',
        envoyer: 'Send a link',
      },
      alertRestaurer: {
        titre: 'Restore purchases',
        corps: 'No purchases to restore at this time.',
      },
    },

    pricingUpgrade: {
      titre: 'Change subscription',
      confirmer: 'Confirm my subscription →',
      restaurer: 'Restore a purchase',
    },

    notifications: {
      affirmationBody: 'Your cycle affirmation is waiting for you.',
      rappelBody: "Today's cycle is not yet complete. You can still finish it!",
    },

    share: {
      message: (cycle: number, level: string, pts: number) =>
        `👁✨ ManifestMind\n\n🔮 Cycle ${cycle} / 365 completed\n🌸 Level ${level}\n⭐ ${pts} pts / 36,500\n\nI'm transforming my life\none cycle at a time ✦\n\n🔗 manifest-mind.app`,
      dialogTitle: 'Share my progress',
      copieeTitre: 'Copied!',
      copieCorps: 'Your message has been copied to the clipboard.',
      erreurTitre: 'Share failed',
      erreurCorps: 'An error occurred. Please try again.',
    },
  },

  // ════════════════════════════════════════════════════════════════════════════
  es: {
    commun: {
      navbar: {
        accueil: 'Inicio',
        profil: 'Perfil',
        parametres: 'Ajustes',
      },
      partager: 'Compartir',
      ou: 'o',
      annuler: 'Cancelar',
      confirmer: 'Confirmar',
      supprimer: 'Eliminar',
      suivant: 'Siguiente →',
      continuer: 'Continuar →',
      commencer: 'Comenzar →',
      passer: 'Saltar este paso sin puntos',
      theme: 'Tema',
      cycle: 'Ciclo',
      disponibleProchainement: 'Próximamente',
    },

    legal: {
      privacyUrl: 'https://manifestmind.github.io/manifest-mind/politica_privacidad_es.html',
      termsUrl: 'https://manifestmind.github.io/manifest-mind/terminos_uso_es.html',
    },

    niveaux: {
      eveil: 'Despertar',
      ancrage: 'Arraigo',
      expansion: 'Expansión',
      manifestation: 'Manifestación',
    },

    themes: [
      'Confianza & Identidad',
      'Abundancia & Prosperidad',
      'Amor & Relaciones',
      'Salud & Vitalidad',
      'Carrera & Misión',
      'Creatividad & Expresión',
      'Gratitud & Paz',
    ],

    welcome: {
      tagline: 'Bienestar & Intenciones',
      quote: 'Cada pensamiento\ndibuja tu futuro',
      commencer: 'Comenzar →',
      hint: 'Tu espacio de crecimiento personal',
    },

    features: {
      titre: 'Un programa completo',
      sousTitre: '365 ciclos · 2555 pasos · 4 fases · 7 temas',
      texteViolet: '365 ciclos para transformar tu vida paso a paso',
      etape: 'Paso 1 / 3',
      cartes: {
        ouverture: {
          titre: 'Apertura diaria',
          texte: 'Recompensa tu constancia cada ciclo.',
          note: 'Cada conexión refuerza\ntu energía interior.',
        },
        affirmation: {
          titre: 'Afirmaciones diarias',
          texte: 'Un mensaje poderoso en cada ciclo.',
          note: 'Reprograma tu mente desde el inicio del ciclo.',
        },
        actions: {
          titre: 'Acciones concretas',
          facile: 'Fácil',
          difficile: 'o difícil',
          note: 'Cada pequeña acción te acerca a tu objetivo.',
        },
        visualisation: {
          titre: 'Visualización guiada',
          texte: 'Meditación y respiración en cada ciclo.',
          note: 'Visualiza tu vida futura como si ya estuvieras en ella.',
        },
        visionBoard: {
          titre: 'Vision Board',
          texte: 'Visualiza tus sueños y objetivos.',
          note: 'Crea una visión clara y deja\nque tu mente la manifieste.',
        },
        journal: {
          titre: 'Diario personal',
          texte: 'Clarifica tus pensamientos y emociones.',
          note: 'Escribir es concretar\nlo que realmente quieres.',
        },
        badges: {
          titre: 'Puntos & Logros',
          texte: '100 pts/ciclo máx · 4 niveles · recompensas',
          note: 'Convierte tu progreso en una victoria visible.',
        },
      },
      suivant: 'Siguiente →',
    },

    privacy: {
      titre: 'Privacidad',
      etape: 'Paso 2 / 3',
      items: {
        chiffrement: { titre: 'Datos cifrados', texte: 'Progreso y diario seguros' },
        vente: { titre: 'Nunca vendidos', texte: 'Sin compartir con terceros, nunca' },
        suppression: { titre: 'Eliminar en cualquier momento', texte: 'Desde los Ajustes de la app' },
        pub: { titre: 'Sin publicidad', texte: 'Sin segmentación de marketing' },
      },
      checkboxAvant: 'Acepto los ',
      checkboxTerms: 'Términos de uso',
      checkboxMilieu: ' y la ',
      checkboxPrivacy: 'Política de privacidad',
      continuer: 'Continuar →',
    },

    pricing: {
      titre: 'Transforma tu vida en 365 ciclos',
      etape: 'Paso 3 / 3',
      plans: {
        lifetime: {
          badge: '⭐ Mejor oferta · Acceso de por vida',
          titre: 'Lifetime',
          sousTitre: 'Pago único · Transformación permanente',
          unite: 'una vez',
        },
        annuel: {
          badge: '⭐ Recomendado · Ahorra 50%',
          titre: 'Anual',
          sousTitre: '79€/año · 0,21€/ciclo',
          unite: '/mes',
        },
        mensuel: {
          titre: 'Mensual',
          sousTitre: 'Cancelable en cualquier momento',
          unite: '/mes',
        },
      },
      avantages: [
        '365 ciclos de transformación guiada',
        'Afirmaciones + acciones diarias',
        'Diario y vision board integrados',
        'Seguimiento de progreso y disciplina',
        'Disponible en FR, EN & ES',
      ],
      cta: 'Transformo mi vida ahora →',
      bottomText: 'Menos de 0,50€ para cambiar tu vida',
      restaurer: 'Restaurar una compra',
    },

    auth: {
      titre: 'Únete',
      sousTitre: 'Crea tu cuenta para guardar\ntu progreso',
      apple: 'Continuar con Apple',
      google: 'Continuar con Google',
      email: 'Continuar con e-mail',
      placeholder: 'Tu dirección de e-mail',
      envoyer: 'Enviar enlace →',
      sansCompte: 'Continuar sin cuenta →',
      alertApple: {
        titre: 'Próximamente',
        corps: 'El acceso con Apple estará disponible en una versión futura.',
      },
      alertGoogle: {
        titre: 'Próximamente',
        corps: 'El acceso con Google estará disponible en una versión futura.',
      },
      alertEmailSent: {
        titre: '¡Enlace enviado!',
        corps: 'Revisa tu bandeja ✉️\nSe ha enviado un enlace de acceso.',
      },
      alertEmailError: {
        titre: 'Error',
        corps: 'No se pudo enviar el enlace. Verifica tu dirección de e-mail.',
      },
      alertLienInvalide: {
        titre: 'Enlace inválido',
        corps: 'Este enlace de acceso es inválido o ya fue usado. Solicita un nuevo enlace.',
      },
      alertLienExpire: {
        titre: 'Enlace expirado',
        corps: 'Este enlace ha expirado. Vuelve a la pantalla de inicio de sesión y solicita uno nuevo.',
      },
      alertLienEmailManquant: {
        titre: 'Abre en tu dispositivo',
        corps: 'Para completar el inicio de sesión, abre este enlace en el dispositivo donde introdujiste tu e-mail.',
      },
      alertErreurReseau: {
        titre: 'Error de red',
        corps: 'Verifica tu conexión a internet e inténtalo de nuevo.',
      },
      alertUtilisateurIntrouvable: {
        titre: 'Cuenta no encontrada',
        corps: 'Ninguna cuenta está asociada a esta dirección de e-mail. Crea una cuenta o usa una dirección diferente.',
      },
      alertNonConnecte: {
        titre: 'No conectado',
        corps: 'No tienes una cuenta Firebase activa. Continúa sin cuenta o crea una.',
      },
    },

    splash: {
      tagline: 'Bienestar & Intenciones',
      badge: '✦ +10 pts al inicio',
      quote: 'Cada pensamiento\ndibuja tu futuro',
      commencer: 'Comenzar →',
      hint: 'Tu espacio de crecimiento personal',
      toast: '+10 pts · Apertura del ciclo',
    },

    name: {
      titre: '¿Cómo te llamas?',
      placeholder: 'Tu nombre',
      btnNouvel: 'Continuar →',
      btnEdit: 'Actualizar →',
    },

    home: {
      bienvenue: 'Bienvenido/a',
      defautPrenom: 'tú',
      citation: 'Visualiza el éxito, cree en ti\ny manifiesta tus sueños',
      gaugeLabel: 'Progreso · Ciclo',
      gaugeCycles: '365 ciclos',
      nextCycle: '✦ Próximo ciclo a medianoche',
      programmeTermine: '✦ 365 ciclos logrados',
      commencerCycle: 'Iniciar mi ciclo →',
      continuerCycle: 'Continuar mi ciclo →',
      toastMilestone: '✦ {n} pts de 36.500 — ¡Felicidades!',
      toastNewLevel: '✦ Nuevo nivel — {level}!',
      cards: {
        journal: 'Diario',
        visionBoard: 'Vision Board',
      },
      feats: {
        affirmations: 'Afirmaciones',
        actions: 'Acciones',
        visualisations: 'Visualizaciones',
      },
    },

    affirmation: {
      titre: 'Afirmación',
      etape: 'Paso 2 · Ciclo {n}',
      instruction: 'Repite esta frase en voz alta,\nvarias veces, con sinceridad.',
      valider: 'Repetí mi afirmación · +15 pts',
      passer: 'Saltar este paso sin puntos',
      toast: '✦ +15 pts · Afirmación validada',
    },

    action: {
      titre: 'Acciones del ciclo',
      etape: 'Pasos 3 & 4 · Ciclo {n}',
      affirmationValidee: '✓ Afirmación validada',
      facile: 'Acción fácil',
      difficile: 'Acción difícil',
      validerFacile: 'Validar · +15 pts',
      validerDifficile: 'Validar · +25 pts',
      passer: 'Saltar este paso sin puntos',
      toastFacile: '✦ +15 pts · Acción fácil validada',
      toastDifficile: '✦ +25 pts · Acción difícil validada',
    },

    visualisation: {
      titre: 'Visualización',
      etape: 'Paso 5 · Ciclo {n}',
      inspire: 'Inspira',
      retiens: 'Retén',
      expire: 'Exhala',
      valider: 'Visualicé · +15 pts ✦',
      passer: 'Saltar este paso sin puntos',
      toast: '✦ +15 pts · Visualización validada',
    },

    celebration: {
      cycleComplete: 'Ciclo {n} completado ✦',
      felicitations: 'Felicidades',
      pointsGagnes: 'Puntos ganados este ciclo',
      surCentPossibles: 'de 100 posibles',
      etapes: {
        ouverture: 'Apertura',
        affirmation: 'Afirmación',
        actionFacile: 'Acción fácil',
        actionDifficile: 'Acción difícil',
        visualisation: 'Visualización',
        journal: 'Diario',
        visionBoard: 'Vision Board',
      },
      passee: 'omitida',
      prochainCycle: 'Próximo ciclo disponible a medianoche',
      retourAccueil: 'Volver al inicio',
    },

    journal: {
      titre: 'Diario',
      etape: 'Paso 6 · Ciclo {n}',
      placeholder: 'Escribe lo que sientes, lo que quieres liberar, lo que manifiestas...',
      valider: 'Guardar mi diario · +15 pts',
      passer: 'Saltar este paso sin puntos',
      toast: '✦ +15 pts · Diario guardado',
      mots: 'palabras',
      entreesPrecedentes: 'Entradas anteriores',
      aujourdhui: 'Hoy',
      passe: 'Omitido',
      etapePassee: 'Paso omitido sin puntos',
    },

    visionBoard: {
      titre: 'Vision Board',
      etape: 'Paso 7 · Ciclo {n}',
      cellules: {
        carriere: 'Carrera',
        amour: 'Amor',
        abondance: 'Abundancia',
        reves: 'Sueños',
        voyages: 'Viajes',
        sante: 'Salud',
        famille: 'Familia y Cercanos',
      },
      ajouterPhoto: 'Toca para añadir tu foto',
      valider: 'Guardar mi Vision Board · +5 pts',
      passer: 'Saltar este paso sin puntos',
      toast: '✦ +5 pts · Vision Board guardado',
      terminerCycle: 'Completar mi ciclo ✦',
      permissionTitre: 'Acceso a fotos requerido',
      permissionMessage: 'Para añadir una foto, permite el acceso a tu galería en los Ajustes de tu teléfono.',
    },

    profil: {
      titre: 'Mi Perfil',
      cycleTheme: 'Ciclo {n} · Tema {theme}',
      progression: 'Progreso',
      cycleEnCours: 'Ciclo actual',
      etapes: {
        ouverture: 'Apertura',
        affirmation: 'Afirmación',
        actions: 'Acciones',
      },
      stats: {
        totalPoints: 'Total puntos',
        ptsPossibles: '/ 36.500 pts posibles',
        cyclesCompletes: 'Ciclos completados',
        meilleurCycle: 'Mejor ciclo',
        moyenneCycle: 'Prom. por ciclo',
        pts: 'pts',
      },
      modifierPrenom: 'Editar mi nombre',
      recommencer: 'Reiniciar desde el principio',
      recommencerSub: 'Borra todo · Irreversible',
      alertReset: {
        titre: '¿Reiniciar desde el principio?',
        corps: 'Esta acción es irreversible.\n\nTodos tus puntos, ciclos, entradas de diario y fotos serán eliminados permanentemente.\nComenzarás de nuevo en el Ciclo 1.\n\nTu suscripción permanece activa.',
        annuler: 'Cancelar',
        confirmer: 'Confirmar',
      },
    },

    parametres: {
      titre: 'Ajustes',
      sections: {
        langue: 'Idioma',
        notifications: 'Notificaciones',
        abonnement: 'Suscripción',
        compte: 'Cuenta',
        legal: 'Legal',
      },
      langueApp: 'Idioma de la app',
      notifs: {
        affirmationTitre: 'Afirmación del ciclo',
        affirmationSub: 'Recibe tu afirmación cada mañana',
        heureTitre: 'Hora de recordatorio matutino',
        heureSub: 'Afirmación + apertura del ciclo',
        rappelTitre: 'Recordatorio ciclo incompleto',
        rappelSub: 'Si el ciclo no está terminado a las 20h',
      },
      abonnement: {
        planActuel: 'Plan actual',
        planSub: 'Anual · Renovación automática',
        actif: 'Activo',
        restaurer: 'Restaurar compras',
      },
      compte: {
        deconnecter: 'Cerrar sesión',
        supprimer: 'Eliminar mi cuenta',
      },
      legalLinks: {
        confidentialite: 'Política de privacidad',
        conditions: 'Términos de uso',
      },
      tagline: 'Hecho con amor para tu crecimiento personal',
      alertLangue: {
        titre: 'Idioma',
        corps: 'Solo el francés está disponible por ahora.',
      },
      alertNotifsDesactivees: {
        titre: 'Notificaciones desactivadas',
        corps: 'Activa las notificaciones en los ajustes de tu teléfono.',
      },
      alertDeconnecter: {
        titre: 'Cerrar sesión',
        corps: 'Serás redirigido a la pantalla de inicio.',
        annuler: 'Cancelar',
        confirmer: 'Cerrar sesión',
      },
      alertSupprimer: {
        titre: 'Eliminar mi cuenta',
        corps: 'Todos tus datos serán eliminados permanentemente. Esta acción es irreversible.',
        annuler: 'Cancelar',
        confirmer: 'Eliminar',
      },
      alertSupprimerReauth: {
        titre: 'Reautenticación requerida',
        corps: 'Para eliminar tu cuenta, necesitamos verificar tu identidad. ¿Deseas recibir un nuevo enlace de inicio de sesión?',
        annuler: 'Cancelar',
        envoyer: 'Enviar enlace',
      },
      alertRestaurer: {
        titre: 'Restaurar compras',
        corps: 'No hay compras para restaurar por ahora.',
      },
    },

    pricingUpgrade: {
      titre: 'Cambiar suscripción',
      confirmer: 'Confirmar mi suscripción →',
      restaurer: 'Restaurar una compra',
    },

    notifications: {
      affirmationBody: 'Tu afirmación del ciclo te espera.',
      rappelBody: 'Tu ciclo de hoy aún no está terminado. ¡Todavía puedes completarlo!',
    },

    share: {
      message: (cycle: number, level: string, pts: number) =>
        `👁✨ ManifestMind\n\n🔮 Ciclo ${cycle} / 365 completado\n🌸 Nivel ${level}\n⭐ ${pts} pts / 36.500\n\nEstoy transformando mi vida\nun ciclo a la vez ✦\n\n🔗 manifest-mind.app`,
      dialogTitle: 'Compartir mi progreso',
      copieeTitre: '¡Copiado!',
      copieCorps: 'Tu mensaje ha sido copiado al portapapeles.',
      erreurTitre: 'Error al compartir',
      erreurCorps: 'Ha ocurrido un error. Inténtalo de nuevo.',
    },
  },
} as const;

export type Lang = keyof typeof translations;
export type Translations = typeof translations;
