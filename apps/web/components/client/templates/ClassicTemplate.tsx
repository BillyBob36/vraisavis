'use client';

import { TemplateProps } from '@/lib/templates/types';
import SlotMachine from '../SlotMachine';

export default function ClassicTemplate(props: TemplateProps) {
  const {
    step, restaurant, onNext, onBack,
    positiveText, onPositiveChange,
    negativeText, onNegativeChange,
    isSpinning, onSpin, spinResult,
    reelsFinished, onReelsFinished,
    prizeSymbolMap, assignedSymbols,
  } = props;

  // === INTRO ===
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
            {/* Logo / Restaurant */}
            <div className="space-y-2">
              <div className="text-5xl">🍽️</div>
              <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
            </div>

            {/* Divider */}
            <div className="w-16 h-1 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full mx-auto" />

            {/* Value props */}
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0 text-lg">🎰</div>
                <div>
                  <p className="font-semibold text-gray-900">Tentez de gagner des lots !</p>
                  <p className="text-sm text-gray-500">Donnez votre avis et jouez à la machine à sous</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-lg">⚡</div>
                <div>
                  <p className="font-semibold text-gray-900">Moins d'une minute</p>
                  <p className="text-sm text-gray-500">2 questions rapides, puis c'est parti !</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-lg">🔒</div>
                <div>
                  <p className="font-semibold text-gray-900">100% anonyme</p>
                  <p className="text-sm text-gray-500">Aucune inscription, aucune donnée personnelle</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={onNext}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              C'est parti ! 🎉
            </button>

            <p className="text-xs text-gray-400">
              Votre avis aide {restaurant.name} à s'améliorer
            </p>
          </div>
        </div>
      </div>
    );
  }

  // === POSITIVE FEEDBACK ===
  if (step === 'positive') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
            {/* Progress */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-green-400 rounded-full" />
              <div className="flex-1 h-2 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="text-4xl">😊</div>
              <h2 className="text-xl font-bold text-gray-900">Le positif</h2>
              <p className="text-sm text-gray-500">
                Qu'est-ce qui vous a le plus plu aujourd'hui ?
              </p>
            </div>

            {/* Question */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                En un mot ou une phrase : qu'avez-vous adoré ?
              </label>
              <textarea
                value={positiveText}
                onChange={(e) => onPositiveChange(e.target.value)}
                placeholder="Ex: Le dessert était incroyable, l'accueil chaleureux..."
                className="w-full h-32 p-4 border-2 border-gray-200 rounded-2xl text-base resize-none focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all placeholder:text-gray-300"
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Minimum 10 caractères</span>
                <span>{positiveText.length}/500</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="px-6 py-3 text-gray-500 font-medium rounded-xl hover:bg-gray-100 transition-all"
              >
                Retour
              </button>
              <button
                onClick={onNext}
                disabled={positiveText.trim().length < 10}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Suivant →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === NEGATIVE FEEDBACK ===
  if (step === 'negative') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
            {/* Progress */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-green-400 rounded-full" />
              <div className="flex-1 h-2 bg-blue-400 rounded-full" />
            </div>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="text-4xl">🤔</div>
              <h2 className="text-xl font-bold text-gray-900">L'amélioration</h2>
              <p className="text-sm text-gray-500">
                Aidez-nous à nous améliorer — soyez honnête, c'est comme ça qu'on progresse !
              </p>
            </div>

            {/* Question */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                En toute sincérité, quel point mérite d'être amélioré ?
              </label>
              <textarea
                value={negativeText}
                onChange={(e) => onNegativeChange(e.target.value)}
                placeholder="Ex: L'attente était un peu longue, le bruit ambiant..."
                className="w-full h-32 p-4 border-2 border-gray-200 rounded-2xl text-base resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-300"
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Optionnel mais apprécié</span>
                <span>{negativeText.length}/500</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="px-6 py-3 text-gray-500 font-medium rounded-xl hover:bg-gray-100 transition-all"
              >
                Retour
              </button>
              <button
                onClick={onNext}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Jouer à la machine ! 🎰
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === SPIN ===
  if (step === 'spin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-violet-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white">Tentez votre chance !</h2>
            <p className="text-sm text-purple-200">
              Appuyez sur le bouton pour lancer la machine
            </p>
          </div>

          {/* Slot Machine */}
          <SlotMachine
            isSpinning={isSpinning}
            onSpinComplete={onReelsFinished}
            targetSymbols={assignedSymbols}
            prizes={restaurant.prizes}
            prizeSymbolMap={prizeSymbolMap}
            variant="classic"
          />

          {/* Spin Button */}
          {!isSpinning && !spinResult && (
            <button
              onClick={onSpin}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black text-xl rounded-2xl shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.95] transition-all animate-pulse"
            >
              🎰 LANCER ! 🎰
            </button>
          )}

          {isSpinning && !reelsFinished && (
            <div className="text-center">
              <p className="text-yellow-300 font-bold animate-pulse text-lg">
                La roue tourne... 🤞
              </p>
            </div>
          )}

          {reelsFinished && (
            <div className="text-center space-y-2">
              <p className="text-yellow-300 font-bold text-xl animate-bounce">
                🥁 Résultat...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // === RESULT ===
  if (step === 'result' && spinResult) {
    if (spinResult.won && spinResult.prize) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6">
              <div className="text-6xl animate-bounce">🎉</div>
              <h2 className="text-2xl font-black text-gray-900">Félicitations !</h2>
              <p className="text-lg text-gray-600">Vous avez gagné :</p>
              
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200">
                <p className="text-xl font-bold text-orange-600">{spinResult.prize.name}</p>
                {spinResult.prize.description && (
                  <p className="text-sm text-gray-500 mt-1">{spinResult.prize.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Votre code :</p>
                <div className="bg-gray-900 text-yellow-400 font-mono text-2xl font-bold py-4 px-6 rounded-xl tracking-widest">
                  {spinResult.prize.code}
                </div>
                <p className="text-xs text-gray-400">
                  Présentez ce code au personnel pour récupérer votre lot
                </p>
                <p className="text-xs text-gray-400">
                  Valable jusqu'au {new Date(spinResult.prize.expiresAt).toLocaleDateString('fr-FR')}
                </p>
              </div>

              <p className="text-sm text-gray-500">
                Merci pour votre avis ! 🙏
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
            <div className="text-5xl">😊</div>
            <h2 className="text-xl font-bold text-gray-900">Pas de lot cette fois</h2>
            <p className="text-gray-500">
              {restaurant.thankYouMessage || 'Merci pour votre participation ! Votre avis compte énormément pour nous.'}
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto" />
            <p className="text-sm text-gray-400">
              Revenez la prochaine fois pour retenter votre chance !
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
