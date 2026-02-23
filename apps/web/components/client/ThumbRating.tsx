'use client';

const POSITIVE_LABELS = ['', 'Sympa', 'Satisfaisant', 'Réussi', 'Remarquable', 'Exceptionnel'];
const NEGATIVE_LABELS = ['', 'Faible', 'Gênant', 'Décevant', 'Problématique', 'Inacceptable'];

interface ThumbRatingProps {
  value: number;
  onChange: (val: number) => void;
  type: 'positive' | 'negative';
  label: string;
  variant?: 'classic' | 'glass';
}

export default function ThumbRating({ value, onChange, type, label, variant = 'classic' }: ThumbRatingProps) {
  const isPositive = type === 'positive';
  const emoji = isPositive ? '👍' : '👎';
  const activeColor = isPositive
    ? variant === 'glass' ? 'bg-emerald-500/30 border-emerald-400/50' : 'bg-green-100 border-green-400'
    : variant === 'glass' ? 'bg-red-500/30 border-red-400/50' : 'bg-red-100 border-red-400';
  const inactiveColor = variant === 'glass'
    ? 'bg-white/5 border-white/10 hover:bg-white/10'
    : 'bg-gray-50 border-gray-200 hover:bg-gray-100';
  const labelColor = variant === 'glass' ? 'text-white/60' : 'text-gray-500';
  const textColor = variant === 'glass' ? 'text-white/80' : 'text-gray-700';
  const dynamicLabelColor = isPositive
    ? variant === 'glass' ? 'text-emerald-300' : 'text-green-600'
    : variant === 'glass' ? 'text-red-300' : 'text-red-500';

  const dynamicLabel = value > 0
    ? (isPositive ? POSITIVE_LABELS[value] : NEGATIVE_LABELS[value])
    : null;

  return (
    <div className="space-y-2">
      <p className={`text-sm font-medium ${textColor}`}>{label}</p>
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl transition-all active:scale-90 ${
              n <= value ? activeColor : inactiveColor
            }`}
          >
            {n <= value ? emoji : (
              <span className="opacity-30 grayscale">{emoji}</span>
            )}
          </button>
        ))}
      </div>
      <div className="h-5 flex items-center justify-center">
        {dynamicLabel && (
          <span className={`text-sm font-semibold ${dynamicLabelColor} transition-all`}>
            {dynamicLabel}
          </span>
        )}
        {!dynamicLabel && (
          <span className={`text-xs ${labelColor}`}>—</span>
        )}
      </div>
    </div>
  );
}
