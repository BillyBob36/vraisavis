export type Locale = 'fr' | 'en';

export interface Translations {
  // Language selector
  langLabel: string;

  // Intro
  introSlotTitle: string;
  introSlotDesc: string;
  introFastTitle: string;
  introFastDesc: string;
  introAnonTitle: string;
  introAnonDesc: string;
  introCta: string;
  introFooter: string;
  introRedeem: string;

  // Positive
  positiveTitle: string;
  positiveQuestion: string;
  positivePlaceholder: string;
  positiveMinChars: string;
  positiveRatingLabel: string;

  // Negative
  negativeTitle: string;
  negativeSubtitle: string;
  negativeQuestion: string;
  negativePlaceholder: string;
  negativeMinChars: string;
  negativeRatingLabel: string;

  // Contact
  contactTitle: string;
  contactSubtitle: string;
  contactOwnLabel: string;
  contactOwnDesc: string;
  contactOthersLabel: string;
  contactOthersDesc: string;
  contactPrivacy: string;
  contactEmail: string;
  contactEmailPlaceholder: string;
  contactPhone: string;
  contactPhoneOptional: string;
  contactPhonePlaceholder: string;
  contactCta: string;

  // Spin
  spinTitle: string;
  spinSubtitle: string;
  spinSpinning: string;

  // Slot Machine
  slotTitle: string;
  slotSpinning: string;
  slotWin: string;
  slotSeePrizes: string;
  slotPrizesTitle: string;
  slotPlay: string;

  // Claim - choice
  claimTitle: string;
  claimPrizeLabel: string;
  claimNowBtn: string;
  claimNowDesc: string;
  claimLaterBtn: string;
  claimLaterDesc: string;

  // Claim - now (server validation)
  claimNowTitle: string;
  claimWarning: string;
  claimHoldDefault: string;
  claimHoldProgress: string;
  claimHoldValidating: string;
  claimHoldInstruction: string;

  // Claim - later (show code)
  claimLaterTitle: string;
  claimLaterInstruction: string;
  claimLaterNote: string;
  claimLaterValidUntil: string;
  claimLaterBack: string;

  // Claim success
  claimSuccessTitle: string;
  claimSuccessEnjoy: string;

  // Result (no win)
  resultTitle: string;
  resultSubtitle: string;

  // Google review
  googleReviewText: string;
  googleReviewCopy: string;
  googleReviewPaste: string;
  googleReviewTextWin: string;

  // Redeem
  redeemTitle: string;
  redeemSubtitle: string;
  redeemPlaceholder: string;
  redeemCta: string;
  redeemVerifying: string;
  redeemBack: string;

  // Common
  back: string;
  next: string;
}
