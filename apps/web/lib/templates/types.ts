export type TemplateId = 'classic' | 'glass';

export interface TemplateConfig {
  id: TemplateId;
  name: string;
  description: string;
  preview: string;
}

export interface SlotSymbol {
  id: string;
  emoji: string;
  label: string;
}

export interface Prize {
  id: string;
  name: string;
  description: string | null;
}

export interface Restaurant {
  id: string;
  name: string;
  welcomeMessage: string | null;
  thankYouMessage: string | null;
  clientTemplate: TemplateId;
  prizes: Prize[];
}

export interface SpinResult {
  won: boolean;
  prize?: {
    name: string;
    description: string | null;
    code: string;
    expiresAt: string;
  };
  message: string;
}

export type ClientStep = 'intro' | 'positive' | 'negative' | 'contact' | 'spin' | 'result';

export interface TemplateProps {
  step: ClientStep;
  restaurant: Restaurant;
  onNext: () => void;
  onBack: () => void;
  // Intro
  // Positive feedback
  positiveText: string;
  onPositiveChange: (text: string) => void;
  // Negative feedback
  negativeText: string;
  onNegativeChange: (text: string) => void;
  // Contact preferences
  wantNotifyOwn: boolean;
  onWantNotifyOwnChange: (val: boolean) => void;
  wantNotifyOthers: boolean;
  onWantNotifyOthersChange: (val: boolean) => void;
  contactEmail: string;
  onContactEmailChange: (val: string) => void;
  contactPhone: string;
  onContactPhoneChange: (val: string) => void;
  // Spin
  isSpinning: boolean;
  onSpin: () => void;
  spinResult: SpinResult | null;
  reelsFinished: boolean;
  onReelsFinished: () => void;
  isWin: boolean;
  // Prize mapping for slot machine display
  prizeSymbolMap: Map<string, [SlotSymbol, SlotSymbol, SlotSymbol]>;
  assignedSymbols: [SlotSymbol, SlotSymbol, SlotSymbol] | null;
}

// 24 slot symbols for supporting 20+ prizes
export const SLOT_SYMBOLS: SlotSymbol[] = [
  { id: 'cherry', emoji: '🍒', label: 'Cerise' },
  { id: 'lemon', emoji: '🍋', label: 'Citron' },
  { id: 'orange', emoji: '🍊', label: 'Orange' },
  { id: 'grape', emoji: '🍇', label: 'Raisin' },
  { id: 'watermelon', emoji: '🍉', label: 'Pastèque' },
  { id: 'star', emoji: '⭐', label: 'Étoile' },
  { id: 'diamond', emoji: '💎', label: 'Diamant' },
  { id: 'heart', emoji: '❤️', label: 'Cœur' },
  { id: 'crown', emoji: '👑', label: 'Couronne' },
  { id: 'fire', emoji: '🔥', label: 'Feu' },
  { id: 'bell', emoji: '🔔', label: 'Cloche' },
  { id: 'clover', emoji: '🍀', label: 'Trèfle' },
  { id: 'rocket', emoji: '🚀', label: 'Fusée' },
  { id: 'rainbow', emoji: '🌈', label: 'Arc-en-ciel' },
  { id: 'moon', emoji: '🌙', label: 'Lune' },
  { id: 'sun', emoji: '☀️', label: 'Soleil' },
  { id: 'bolt', emoji: '⚡', label: 'Éclair' },
  { id: 'gem', emoji: '💠', label: 'Gemme' },
  { id: 'trophy', emoji: '🏆', label: 'Trophée' },
  { id: 'gift', emoji: '🎁', label: 'Cadeau' },
  { id: 'cake', emoji: '🎂', label: 'Gâteau' },
  { id: 'pizza', emoji: '🍕', label: 'Pizza' },
  { id: 'icecream', emoji: '🍦', label: 'Glace' },
  { id: 'coffee', emoji: '☕', label: 'Café' },
];

// Generate unique 3-symbol combinations for each prize
export function buildPrizeSymbolMap(prizes: Prize[]): Map<string, [SlotSymbol, SlotSymbol, SlotSymbol]> {
  const map = new Map<string, [SlotSymbol, SlotSymbol, SlotSymbol]>();
  const usedCombos = new Set<string>();

  prizes.forEach((prize, index) => {
    // Each prize gets a unique triple of symbols
    // Use index-based selection to ensure uniqueness
    const s1 = SLOT_SYMBOLS[index % SLOT_SYMBOLS.length];
    const s2 = SLOT_SYMBOLS[(index + 8) % SLOT_SYMBOLS.length];
    const s3 = SLOT_SYMBOLS[(index + 16) % SLOT_SYMBOLS.length];
    
    const comboKey = `${s1.id}-${s2.id}-${s3.id}`;
    if (!usedCombos.has(comboKey)) {
      usedCombos.add(comboKey);
      map.set(prize.id, [s1, s2, s3]);
    } else {
      // Fallback: shift by 1
      const alt1 = SLOT_SYMBOLS[(index + 1) % SLOT_SYMBOLS.length];
      const alt2 = SLOT_SYMBOLS[(index + 9) % SLOT_SYMBOLS.length];
      const alt3 = SLOT_SYMBOLS[(index + 17) % SLOT_SYMBOLS.length];
      map.set(prize.id, [alt1, alt2, alt3]);
    }
  });

  return map;
}

// "No prize" symbol combination
export const NO_PRIZE_SYMBOLS: [SlotSymbol, SlotSymbol, SlotSymbol] = [
  SLOT_SYMBOLS[0], // cherry
  SLOT_SYMBOLS[5], // star
  SLOT_SYMBOLS[10], // bell
];
