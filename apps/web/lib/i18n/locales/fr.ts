import { Translations } from '../types';

export const fr: Translations = {
  // Language selector
  langLabel: '🇫🇷 Français',

  // Intro
  introSlotTitle: 'Tentez de gagner des lots !',
  introSlotDesc: 'Donnez votre avis et jouez à la machine à sous',
  introFastTitle: "Moins d'une minute",
  introFastDesc: '2 questions rapides, et c\'est parti !',
  introAnonTitle: '100% anonyme',
  introAnonDesc: 'Aucune inscription, aucune donnée personnelle',
  introCta: 'C\'est parti ! 🎉',
  introFooter: 'Vos avis nous aident à nous améliorer',
  introRedeem: 'Récupérer mes cadeaux',

  // Positive
  positiveTitle: "D'abord le positif",
  positiveQuestion: "Qu'est-ce que vous avez le plus apprécié aujourd'hui ?",
  positivePlaceholder: "Ex: Le dessert était délicieux, l'accueil très chaleureux, les sièges confortables, l'ambiance détendue, le serveur attentionné...",
  positiveMinChars: 'Minimum 10 caractères',
  positiveRatingLabel: 'De 1 à 5 positif à quel point ?',

  // Negative
  negativeTitle: 'À améliorer',
  negativeSubtitle: "Aidez-nous à nous améliorer — soyez honnête, c'est comme ça qu'on progresse !",
  negativeQuestion: "Qu'est-ce qu'on peut améliorer pour vous donner envie de revenir ?",
  negativePlaceholder: "Ex: L'attente était trop longue, la table bruyante, la chaise inconfortable, le plat servi froid, l'accueil peu souriant...",
  negativeMinChars: 'Minimum 10 caractères',
  negativeRatingLabel: 'De 1 à 5 négatif à quel point ?',

  // Contact
  contactTitle: 'Restez informé(e)',
  contactSubtitle: 'Souhaitez-vous être prévenu(e) quand le restaurant prend en compte les retours clients ?',
  contactOwnLabel: 'Mes remarques',
  contactOwnDesc: 'Être prévenu(e) quand mes suggestions sont prises en compte',
  contactOthersLabel: 'Autres améliorations',
  contactOthersDesc: "Être prévenu(e) des améliorations suite aux retours d'autres clients",
  contactPrivacy: '🔒 Vos coordonnées restent <strong>strictement anonymes</strong>. Le restaurateur n\'y a pas accès. Elles servent uniquement à vous envoyer une alerte automatique en cas d\'amélioration liée à vos retours.',
  contactEmail: 'Email',
  contactEmailPlaceholder: 'votre@email.com',
  contactPhone: 'WhatsApp',
  contactPhoneOptional: '(optionnel)',
  contactPhonePlaceholder: '+33 6 12 34 56 78',
  contactCta: 'Jouer à la machine ! 🎰',

  // Spin
  spinTitle: 'Tentez votre chance !',
  spinSubtitle: 'Appuyez sur le bouton pour lancer la machine',
  spinSpinning: 'La roue tourne... 🤞',

  // Slot Machine
  slotTitle: '🎰 MACHINE À SOUS 🎰',
  slotSpinning: '🎰 En cours...',
  slotWin: '🎉 GAGNÉ ! 🎉',
  slotSeePrizes: '🏆 Voir les lots à gagner',
  slotPrizesTitle: '🏆 Lots à gagner',
  slotPlay: '🎰 Jouer !',

  // Claim - choice
  claimTitle: 'Félicitations ! Vous avez gagné :',
  claimNowBtn: '🎁 Récupérer maintenant',
  claimNowDesc: 'Présentez votre écran au serveur',
  claimLaterBtn: '📝 Récupérer plus tard',
  claimLaterDesc: 'Obtenez un code pour revenir le chercher',
  claimGoogleBtn: '⭐ Copier votre avis vers Google',
  claimGoogleDesc: 'Votre commentaire nous fait chaud au cœur ! Donnez-nous un coup de pouce en le publiant sur Google',

  // Claim - now (server validation)
  claimNowTitle: 'Présentez cet écran au serveur',
  claimWarning: '⚠️ Attention ! Si vous appuyez sur le bouton ci-dessous en l\'absence d\'un responsable, votre lot sera perdu.',
  alreadyPlayedTitle: 'Vous avez déjà participé !',
  alreadyPlayedBack: '← Retour à l\'accueil',
  claimHoldDefault: 'Maintenir 2s pour valider',
  claimHoldProgress: 'Maintenez...',
  claimHoldValidating: 'Validation...',
  claimHoldInstruction: 'Le serveur du restaurant doit maintenir ce bouton enfoncé pendant 2 secondes',

  // Claim - later (show code)
  claimLaterTitle: 'Notez votre code',
  claimLaterInstruction: 'Gardez précieusement ce code. Lors de votre prochaine visite, scannez le QR code du restaurant et cliquez sur "Récupérer mes cadeaux" pour utiliser votre lot.',
  claimLaterNote: 'Code à conserver :',
  claimLaterValidUntil: 'Valable jusqu\'au',
  claimLaterBack: '← Revenir au choix',

  // Claim success
  claimSuccessTitle: 'Cadeau validé !',
  claimSuccessEnjoy: 'Bonne dégustation ! 🎉',

  // Result (no win)
  resultTitle: 'Dommage ! Pas de lot cette fois ci !',
  resultSubtitle: 'La prochaine fois sera la bonne !',

  // Google review
  googleReviewText: 'Aidez-nous en partageant votre avis positif sur Google en deux clics',
  googleReviewCopy: '① Un clic pour copier',
  googleReviewPaste: '② Un clic pour coller →',
  googleReviewTextWin: 'Votre commentaire nous fait chaud au cœur ! Vous pouvez nous donner un coup de pouce en le publiant aussi sur Google',

  // Redeem
  redeemTitle: 'Récupérer mon cadeau',
  redeemSubtitle: 'Entrez le code que vous avez reçu lors de votre dernière visite',
  redeemPlaceholder: 'Ex: FB-A7K9-X2M5',
  redeemCta: 'Récupérer ce lot',
  redeemVerifying: 'Vérification...',
  redeemBack: '← Retour à l\'accueil',

  // Common
  back: 'Retour',
  next: 'Suivant →',
};
