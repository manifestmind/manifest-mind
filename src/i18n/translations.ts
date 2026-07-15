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
      refundUrl: 'https://manifestmind.github.io/manifest-mind/remboursement_fr.html',
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
      quote: 'Chaque pensée façonne\nton futur',
      commencer: 'Commencer →',
      hint: 'Ton espace de croissance personnelle',
    },

    // ── Onboarding : attraction ───────────────────────────────────────────────
    attraction: {
      titre: 'Qu\'est-ce que la loi de l\'attraction ?',
      citation1: {
        texte: '❝ Ce que vous ressentez, vous l\'attirez.\nCe que vous imaginez, vous le créez. ❞',
        auteur: 'Rhonda Byrne',
      },
      citation2: {
        texte: '❝ L\'action est la clé fondamentale\nde tout succès. ❞',
        auteur: 'Tony Robbins',
      },
      citation3: {
        texte: '❝ Vous n\'attirez pas ce que vous voulez.\nVous attirez ce que vous êtes. ❞',
        auteur: 'Jim Rohn',
      },
      final: {
        ligne1: '365 cycles · 2 555 étapes',
        ligne2: 'Une transformation réelle.',
      },
      bouton: 'Continuer →',
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
        free: {
          titre: '7 cycles offerts',
          sousTitre: 'Pour découvrir ManifestMind',
          description: 'Accès complet aux 7 premiers cycles. Le tarif s\'affiche à partir du cycle 8.',
          prix: 'Gratuit',
          bouton: 'Commencer gratuitement →',
        },
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
      dejaCompte: 'J\'ai déjà un abonnement — Me reconnecter',
      restaurer: 'Restaurer un achat',
      // Question posée au clic « essai gratuit » quand l'appareil porte le
      // marqueur had_subscription (un abonnement a déjà existé ici).
      retourAbonne: {
        titre: 'Bon retour parmi nous ✨',
        texte: 'Il semble qu\'un abonnement existe déjà sur cet appareil. Tu peux retrouver ton espace, ou créer un nouveau compte (essai gratuit de 7 cycles, puis abonnement).',
        retrouver: 'Retrouver mon espace',
        nouveauCompte: 'Nouveau compte',
      },
    },

    // ── Onboarding : auth ─────────────────────────────────────────────────────
    auth: {
      titre: 'Ravi de te revoir',
      sousTitre: 'Reconnecte-toi pour retrouver\nta progression',
      apple: 'Continuer avec Apple',
      google: 'Continuer avec Google',
      email: 'Continuer avec e-mail',
      placeholder: 'Ton adresse e-mail',
      envoyer: 'Envoyer le lien →',
      passwordPlaceholder: 'Ton mot de passe',
      seConnecter: 'Se connecter',
      motDePasseOublie: 'Mot de passe oublié ou jamais défini ?',
      emailManquantReset: 'Saisis d\'abord ton adresse e-mail.',
      resetEnvoye: {
        titre: 'E-mail envoyé',
        corps: 'Si un compte existe pour cette adresse, un e-mail pour définir ton mot de passe vient d\'être envoyé. Vérifie ta boîte mail ✉️',
      },
      erreurIdentifiants: 'E-mail ou mot de passe incorrect. Si tu n\'as jamais défini de mot de passe, utilise « Mot de passe oublié ». Si tu t\'es inscrit avec Google, utilise le bouton Google.',
      erreurTropDeTentatives: 'Trop de tentatives. Patiente quelques instants avant de réessayer.',
      alertApple: {
        titre: 'Disponible prochainement',
        corps: 'La connexion Apple sera disponible dans une prochaine version.',
      },
      alertGoogle: {
        titre: 'Disponible prochainement',
        corps: 'La connexion Google sera disponible dans une prochaine version.',
      },
      googleErreur: 'Connexion Google impossible. Réessaie.',
      googleReseau: 'Problème de connexion. Vérifie ton accès internet.',
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
        passerPremium: 'Passer à Premium',
        restaurer: 'Restaurer les achats',
        restaurerAcces: 'J\'ai déjà un abonnement — Restaurer mon accès',
      },
      compte: {
        deconnecter: 'Se déconnecter',
        supprimer: 'Supprimer mon compte',
      },
      legalLinks: {
        confidentialite: 'Politique de confidentialité',
        conditions: 'Conditions d\'utilisation',
        remboursement: 'Politique de remboursement',
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
      freemiumTitre: 'Tes 7 cycles offerts sont terminés',
      freemiumMessage: 'Tu as découvert ManifestMind. Continue ta transformation jusqu\'au cycle 365 en passant à Premium.',
      freemiumBouton: 'Continuer mon parcours',
      gererCompte: 'Paramètres du compte',
    },

    // ── Écran d'attente post-paiement (activation de l'abonnement) ────────────
    activation: {
      paiementRecu: '✅ Paiement reçu.',
      voyage: 'Ton voyage commence maintenant…',
      preparation: 'Nous préparons ton espace de transformation.',
      // Mode restauration (?restore=1) : abonnement déjà actif, aucun paiement.
      restaureConfirmation: '✅ Abonnement retrouvé.',
      restaureTitre: 'Ton espace t\'attend…',
      restaurePreparation: 'Nous rouvrons ton espace de transformation.',
      succesTitre: 'Ton espace est prêt',
      succesMessage: 'Bon retour parmi nous. On reprend ton parcours.',
      lentTitre: 'Encore un instant',
      lentMessage: 'Ton paiement est bien reçu, l\'activation prend un peu plus de temps que prévu.',
      rafraichir: 'Réessayer',
      continuer: 'Continuer',
      // Feedback à chaque clic sur "Réessayer" : vérif en cours, puis cooldown
      // visible (anti-martèlement Firestore affiché) — jamais de bouton muet.
      verification: 'Vérification…',
      reessayerDans: 'Réessayer dans {s} s',
      // Escalade "vrai recours" quand l'activation ne se débloque pas après
      // plusieurs vérifications serveur (webhook probablement en échec).
      jaiPaye: 'J\'ai payé — me reconnecter',
      bloqueTitre: 'Ton paiement est en sécurité',
      bloqueMessage: 'Ton paiement a été traité par Paddle, qui t\'a envoyé un e-mail de reçu. L\'activation peut tarder de quelques minutes. Si rien ne se débloque, reconnecte-toi avec le compte utilisé pour payer, ou réessaie dans un moment.',
      bloqueSupport: 'Besoin d\'aide ? Écris-nous à {email}',
    },

    // ── Création / conversion de compte (email + mot de passe) ────────────────
    compte: {
      titre: 'Crée ton compte pour continuer',
      emailPlaceholder: 'Ton email',
      passwordPlaceholder: 'Mot de passe (min. 6 caractères)',
      errEmailInvalide: 'Adresse email invalide.',
      errPasswordCourt: 'Le mot de passe doit faire au moins 6 caractères.',
      errEmailDejaUtilise: 'Cet e-mail a déjà un compte. Connecte-toi pour retrouver ta progression.',
      errReseau: 'Problème de connexion. Réessaie.',
      errGenerique: 'Impossible de créer le compte. Réessaie.',
      rappelReconnexion: 'Retiens bien ce mot de passe : il te servira à te reconnecter.',
      boutonReconnexion: 'Me reconnecter',
      googleBloque: 'Popup Google bloqué par le navigateur. Autorise-le, ou crée ton compte avec un e-mail ci-dessous.',
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
      refundUrl: 'https://manifestmind.github.io/manifest-mind/refund_policy_en.html',
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

    attraction: {
      titre: 'What is the law of attraction?',
      citation1: {
        texte: '❝ What you feel, you attract.\nWhat you imagine, you create. ❞',
        auteur: 'Rhonda Byrne',
      },
      citation2: {
        texte: '❝ Action is the fundamental key\nto all success. ❞',
        auteur: 'Tony Robbins',
      },
      citation3: {
        texte: '❝ You don\'t attract what you want.\nYou attract what you are. ❞',
        auteur: 'Jim Rohn',
      },
      final: {
        ligne1: '365 cycles · 2,555 steps',
        ligne2: 'A real transformation.',
      },
      bouton: 'Continue →',
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
        free: {
          titre: '7 free cycles',
          sousTitre: 'To discover ManifestMind',
          description: 'Full access to the first 7 cycles. Pricing appears from cycle 8.',
          prix: 'Free',
          bouton: 'Start for free →',
        },
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
      cta: 'Transform my life now →',
      bottomText: 'Less than €0.50 to change your life',
      dejaCompte: 'I already have a subscription — Log in',
      restaurer: 'Restore a purchase',
      retourAbonne: {
        titre: 'Welcome back ✨',
        texte: 'It looks like a subscription already exists on this device. You can return to your space, or create a new account (7 free cycles, then subscription).',
        retrouver: 'Return to my space',
        nouveauCompte: 'New account',
      },
    },

    auth: {
      titre: 'Good to see you again',
      sousTitre: 'Log back in to pick up\nwhere you left off',
      apple: 'Continue with Apple',
      google: 'Continue with Google',
      email: 'Continue with email',
      placeholder: 'Your email address',
      envoyer: 'Send link →',
      passwordPlaceholder: 'Your password',
      seConnecter: 'Log in',
      motDePasseOublie: 'Forgot or never set a password?',
      emailManquantReset: 'Enter your e-mail address first.',
      resetEnvoye: {
        titre: 'E-mail sent',
        corps: 'If an account exists for this address, an e-mail to set your password has just been sent. Check your inbox ✉️',
      },
      erreurIdentifiants: 'Incorrect e-mail or password. If you never set a password, use “Forgot password”. If you signed up with Google, use the Google button.',
      erreurTropDeTentatives: 'Too many attempts. Please wait a moment before trying again.',
      alertApple: {
        titre: 'Coming soon',
        corps: 'Apple sign-in will be available in a future version.',
      },
      alertGoogle: {
        titre: 'Coming soon',
        corps: 'Google sign-in will be available in a future version.',
      },
      googleErreur: 'Google sign-in failed. Please try again.',
      googleReseau: 'Connection problem. Check your internet access.',
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
        passerPremium: 'Go Premium',
        restaurer: 'Restore purchases',
        restaurerAcces: 'I already have a subscription — Restore my access',
      },
      compte: {
        deconnecter: 'Sign out',
        supprimer: 'Delete my account',
      },
      legalLinks: {
        confidentialite: 'Privacy Policy',
        conditions: 'Terms of Use',
        remboursement: 'Refund policy',
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
      freemiumTitre: 'Your 7 free cycles are complete',
      freemiumMessage: 'You\'ve discovered ManifestMind. Continue your transformation to cycle 365 by going Premium.',
      freemiumBouton: 'Continue my journey',
      gererCompte: 'Account settings',
    },

    // ── Post-payment waiting screen (subscription activation) ─────────────────
    activation: {
      paiementRecu: '✅ Payment received.',
      voyage: 'Your journey begins now…',
      preparation: 'We\'re preparing your space of transformation.',
      restaureConfirmation: '✅ Subscription found.',
      restaureTitre: 'Your space is waiting…',
      restaurePreparation: 'We\'re reopening your space of transformation.',
      succesTitre: 'Your space is ready',
      succesMessage: 'Welcome back. Let\'s pick up your journey.',
      lentTitre: 'Just a moment longer',
      lentMessage: 'Your payment was received — activation is taking a little longer than expected.',
      rafraichir: 'Try again',
      continuer: 'Continue',
      verification: 'Checking…',
      reessayerDans: 'Try again in {s}s',
      jaiPaye: 'I paid — log me back in',
      bloqueTitre: 'Your payment is safe',
      bloqueMessage: 'Your payment was processed by Paddle, which emailed you a receipt. Activation can take a few minutes. If nothing unlocks, log back in with the account you paid with, or try again shortly.',
      bloqueSupport: 'Need help? Email us at {email}',
    },

    // ── Account creation / conversion (email + password) ──────────────────────
    compte: {
      titre: 'Create your account to continue',
      emailPlaceholder: 'Your email',
      passwordPlaceholder: 'Password (min. 6 characters)',
      errEmailInvalide: 'Invalid email address.',
      errPasswordCourt: 'Password must be at least 6 characters.',
      errEmailDejaUtilise: 'This e-mail already has an account. Log in to pick up your progress.',
      errReseau: 'Connection problem. Please try again.',
      errGenerique: 'Could not create the account. Please try again.',
      rappelReconnexion: 'Remember this password — you\'ll use it to log back in.',
      boutonReconnexion: 'Log in',
      googleBloque: 'Google popup blocked by the browser. Allow it, or create your account with an email below.',
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
      refundUrl: 'https://manifestmind.github.io/manifest-mind/politica_reembolso_es.html',
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

    attraction: {
      titre: '¿Qué es la ley de la atracción?',
      citation1: {
        texte: '❝ Lo que sientes, lo atraes.\nLo que imaginas, lo creas. ❞',
        auteur: 'Rhonda Byrne',
      },
      citation2: {
        texte: '❝ La acción es la clave fundamental\nde todo éxito. ❞',
        auteur: 'Tony Robbins',
      },
      citation3: {
        texte: '❝ No atraes lo que quieres.\nAtraes lo que eres. ❞',
        auteur: 'Jim Rohn',
      },
      final: {
        ligne1: '365 ciclos · 2 555 pasos',
        ligne2: 'Una transformación real.',
      },
      bouton: 'Continuar →',
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
        free: {
          titre: '7 ciclos gratuitos',
          sousTitre: 'Para descubrir ManifestMind',
          description: 'Acceso completo a los primeros 7 ciclos. El precio aparece a partir del ciclo 8.',
          prix: 'Gratis',
          bouton: 'Empezar gratis →',
        },
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
      cta: 'Transformar mi vida ahora →',
      bottomText: 'Menos de 0,50€ para cambiar tu vida',
      dejaCompte: 'Ya tengo una suscripción — Iniciar sesión',
      restaurer: 'Restaurar una compra',
      retourAbonne: {
        titre: 'Qué bueno verte de nuevo ✨',
        texte: 'Parece que ya existe una suscripción en este dispositivo. Puedes volver a tu espacio o crear una cuenta nueva (7 ciclos gratis y luego suscripción).',
        retrouver: 'Volver a mi espacio',
        nouveauCompte: 'Cuenta nueva',
      },
    },

    auth: {
      titre: 'Qué bueno verte otra vez',
      sousTitre: 'Vuelve a entrar y retoma\ndonde lo dejaste',
      apple: 'Continuar con Apple',
      google: 'Continuar con Google',
      email: 'Continuar con e-mail',
      placeholder: 'Tu dirección de e-mail',
      envoyer: 'Enviar enlace →',
      passwordPlaceholder: 'Tu contraseña',
      seConnecter: 'Iniciar sesión',
      motDePasseOublie: '¿Olvidaste o nunca definiste tu contraseña?',
      emailManquantReset: 'Introduce primero tu correo.',
      resetEnvoye: {
        titre: 'Correo enviado',
        corps: 'Si existe una cuenta para esta dirección, acabamos de enviar un correo para definir tu contraseña. Revisa tu bandeja ✉️',
      },
      erreurIdentifiants: 'Correo o contraseña incorrectos. Si nunca definiste una contraseña, usa «¿Olvidaste tu contraseña?». Si te registraste con Google, usa el botón de Google.',
      erreurTropDeTentatives: 'Demasiados intentos. Espera un momento antes de volver a intentarlo.',
      alertApple: {
        titre: 'Próximamente',
        corps: 'El acceso con Apple estará disponible en una versión futura.',
      },
      alertGoogle: {
        titre: 'Próximamente',
        corps: 'El acceso con Google estará disponible en una versión futura.',
      },
      googleErreur: 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.',
      googleReseau: 'Problema de conexión. Comprueba tu acceso a internet.',
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
        passerPremium: 'Pasar a Premium',
        restaurer: 'Restaurar compras',
        restaurerAcces: 'Ya tengo una suscripción — Restaurar mi acceso',
      },
      compte: {
        deconnecter: 'Cerrar sesión',
        supprimer: 'Eliminar mi cuenta',
      },
      legalLinks: {
        confidentialite: 'Política de privacidad',
        conditions: 'Términos de uso',
        remboursement: 'Política de reembolso',
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
      freemiumTitre: 'Tus 7 ciclos gratuitos han terminado',
      freemiumMessage: 'Has descubierto ManifestMind. Continúa tu transformación hasta el ciclo 365 pasando a Premium.',
      freemiumBouton: 'Continuar mi camino',
      gererCompte: 'Ajustes de la cuenta',
    },

    // ── Pantalla de espera tras el pago (activación de la suscripción) ────────
    activation: {
      paiementRecu: '✅ Pago recibido.',
      voyage: 'Tu viaje empieza ahora…',
      preparation: 'Estamos preparando tu espacio de transformación.',
      restaureConfirmation: '✅ Suscripción recuperada.',
      restaureTitre: 'Tu espacio te espera…',
      restaurePreparation: 'Estamos reabriendo tu espacio de transformación.',
      succesTitre: 'Tu espacio está listo',
      succesMessage: 'Bienvenido de nuevo. Retomamos tu camino.',
      lentTitre: 'Un instante más',
      lentMessage: 'Tu pago se ha recibido correctamente; la activación tarda un poco más de lo previsto.',
      rafraichir: 'Reintentar',
      continuer: 'Continuar',
      verification: 'Comprobando…',
      reessayerDans: 'Reintentar en {s} s',
      jaiPaye: 'He pagado — volver a iniciar sesión',
      bloqueTitre: 'Tu pago está seguro',
      bloqueMessage: 'Tu pago fue procesado por Paddle, que te envió un recibo por correo. La activación puede tardar unos minutos. Si no se desbloquea, vuelve a iniciar sesión con la cuenta con la que pagaste, o inténtalo de nuevo en un momento.',
      bloqueSupport: '¿Necesitas ayuda? Escríbenos a {email}',
    },

    // ── Creación / conversión de cuenta (email + contraseña) ──────────────────
    compte: {
      titre: 'Crea tu cuenta para continuar',
      emailPlaceholder: 'Tu correo',
      passwordPlaceholder: 'Contraseña (mín. 6 caracteres)',
      errEmailInvalide: 'Correo electrónico no válido.',
      errPasswordCourt: 'La contraseña debe tener al menos 6 caracteres.',
      errEmailDejaUtilise: 'Este correo ya tiene una cuenta. Inicia sesión para retomar tu progreso.',
      errReseau: 'Problema de conexión. Inténtalo de nuevo.',
      errGenerique: 'No se pudo crear la cuenta. Inténtalo de nuevo.',
      rappelReconnexion: 'Recuerda esta contraseña: la necesitarás para volver a entrar.',
      boutonReconnexion: 'Iniciar sesión',
      googleBloque: 'El navegador bloqueó la ventana de Google. Permítela o crea tu cuenta con un correo abajo.',
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
