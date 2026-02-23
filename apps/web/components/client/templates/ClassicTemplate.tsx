'use client';

import { TemplateProps } from '@/lib/templates/types';
import SlotMachine from '../SlotMachine';
import ThumbRating from '../ThumbRating';

export default function ClassicTemplate(props: TemplateProps) {
  const {
    step, restaurant, onNext, onBack,
    positiveText, onPositiveChange,
    positiveRating, onPositiveRatingChange,
    negativeText, onNegativeChange,
    negativeRating, onNegativeRatingChange,
    wantNotifyOwn, onWantNotifyOwnChange,
    wantNotifyOthers, onWantNotifyOthersChange,
    contactEmail, onContactEmailChange,
    contactPhone, onContactPhoneChange,
    isSpinning, onSpin, spinResult,
    reelsFinished, onReelsFinished, isWin,
    prizeSymbolMap, assignedSymbols,
    onClaim, isClaiming, claimSuccess, claimError,
    holdProgress, onHoldStart, onHoldEnd,
    redeemCode, onRedeemCodeChange, onRedeemSubmit,
    isRedeeming, redeemResult, redeemError, onGoToRedeem,
    showGoogleReview, onGoogleReview,
  } = props;

  const showContactFields = wantNotifyOwn || wantNotifyOthers;

  // === INTRO ===
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-start sm:items-center justify-center p-0 sm:p-4">
        <div className="w-full sm:max-w-md">
          <div className="min-h-screen sm:min-h-0 bg-white sm:rounded-3xl sm:shadow-xl p-6 sm:p-8 text-center space-y-6 flex flex-col justify-center sm:block">
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
                  <p className="text-sm text-gray-500">2 questions rapides, et c'est parti !</p>
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

            <p className="text-sm font-semibold text-gray-600">
              Vos avis nous aident à nous améliorer
            </p>

            <button
              onClick={onGoToRedeem}
              className="w-full py-3 text-sm text-orange-500 font-medium border-2 border-orange-200 rounded-2xl hover:bg-orange-50 transition-all"
            >
              Récupérer mes cadeaux
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === POSITIVE FEEDBACK ===
  if (step === 'positive') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-start sm:items-center justify-center p-0 sm:p-4">
        <div className="w-full sm:max-w-md">
          <div className="min-h-screen sm:min-h-0 bg-white sm:rounded-3xl sm:shadow-xl p-6 sm:p-8 space-y-6">
            {/* Progress */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-green-400 rounded-full" />
              <div className="flex-1 h-2 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="text-4xl">😊</div>
              <h2 className="text-xl font-bold text-gray-900">D'abord le positif</h2>
            </div>

            {/* Question */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Qu'est-ce que vous avez le plus apprécié aujourd'hui ?
              </label>
              <textarea
                value={positiveText}
                onChange={(e) => onPositiveChange(e.target.value)}
                placeholder="Ex: Le dessert était délicieux, l'accueil très chaleureux, les sièges confortables, l'ambiance détendue, le serveur attentionné..."
                className="w-full h-32 p-4 border-2 border-gray-200 rounded-2xl text-base resize-none focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all placeholder:text-gray-400"
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Minimum 10 caractères</span>
                <span>{positiveText.length}/500</span>
              </div>
            </div>

            {/* Rating */}
            <ThumbRating
              value={positiveRating}
              onChange={onPositiveRatingChange}
              type="positive"
              label="De 1 à 5 positif à quel point ?"
              variant="classic"
            />

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
                disabled={positiveText.trim().length < 10 || positiveRating === 0}
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-start sm:items-center justify-center p-0 sm:p-4">
        <div className="w-full sm:max-w-md">
          <div className="min-h-screen sm:min-h-0 bg-white sm:rounded-3xl sm:shadow-xl p-6 sm:p-8 space-y-6">
            {/* Progress */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-green-400 rounded-full" />
              <div className="flex-1 h-2 bg-blue-400 rounded-full" />
            </div>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="text-4xl">🤔</div>
              <h2 className="text-xl font-bold text-gray-900">À améliorer</h2>
              <p className="text-sm text-gray-500">
                Aidez-nous à nous améliorer — soyez honnête, c'est comme ça qu'on progresse !
              </p>
            </div>

            {/* Question */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Qu'est-ce qu'on peut améliorer pour vous donner envie de revenir ?
              </label>
              <textarea
                value={negativeText}
                onChange={(e) => onNegativeChange(e.target.value)}
                placeholder="Ex: L'attente était trop longue, la table bruyante, la chaise inconfortable, le plat servi froid, l'accueil peu souriant..."
                className="w-full h-32 p-4 border-2 border-gray-200 rounded-2xl text-base resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400"
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Minimum 10 caractères</span>
                <span>{negativeText.length}/500</span>
              </div>
            </div>

            {/* Rating */}
            <ThumbRating
              value={negativeRating}
              onChange={onNegativeRatingChange}
              type="negative"
              label="De 1 à 5 négatif à quel point ?"
              variant="classic"
            />

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
                disabled={negativeText.trim().length < 10 || negativeRating === 0}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Suivant →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === CONTACT PREFERENCES ===
  if (step === 'contact') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-start sm:items-center justify-center p-0 sm:p-4">
        <div className="w-full sm:max-w-md">
          <div className="min-h-screen sm:min-h-0 bg-white sm:rounded-3xl sm:shadow-xl p-6 sm:p-8 space-y-5">
            {/* Progress */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-green-400 rounded-full" />
              <div className="flex-1 h-2 bg-blue-400 rounded-full" />
              <div className="flex-1 h-2 bg-violet-400 rounded-full" />
            </div>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="text-4xl">🔔</div>
              <h2 className="text-xl font-bold text-gray-900">Restez informé(e)</h2>
              <p className="text-sm text-gray-500">
                Souhaitez-vous être prévenu(e) quand le restaurant prend en compte les retours clients ?
              </p>
            </div>

            {/* Toggle options */}
            <div className="space-y-3">
              <div
                onClick={() => onWantNotifyOwnChange(!wantNotifyOwn)}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  wantNotifyOwn ? 'border-violet-400 bg-violet-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex-1 pr-3">
                  <p className="font-semibold text-gray-900 text-sm">Mes remarques</p>
                  <p className="text-xs text-gray-500">Être prévenu(e) quand mes suggestions sont prises en compte</p>
                </div>
                <div className={`w-12 h-7 rounded-full p-1 transition-all ${
                  wantNotifyOwn ? 'bg-violet-500' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    wantNotifyOwn ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </div>

              <div
                onClick={() => onWantNotifyOthersChange(!wantNotifyOthers)}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  wantNotifyOthers ? 'border-violet-400 bg-violet-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex-1 pr-3">
                  <p className="font-semibold text-gray-900 text-sm">Autres améliorations</p>
                  <p className="text-xs text-gray-500">Être prévenu(e) des améliorations suite aux retours d'autres clients</p>
                </div>
                <div className={`w-12 h-7 rounded-full p-1 transition-all ${
                  wantNotifyOthers ? 'bg-violet-500' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    wantNotifyOthers ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </div>
            </div>

            {/* Contact fields — only if at least one toggle is on */}
            {showContactFields && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs text-blue-700">
                    🔒 Vos coordonnées restent <strong>strictement anonymes</strong>. Le restaurateur n'y a pas accès. Elles servent uniquement à vous envoyer une alerte automatique en cas d'amélioration liée à vos retours.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => onContactEmailChange(e.target.value)}
                    placeholder="votre@email.com"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone <span className="text-gray-400 font-normal">(optionnel)</span></label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => onContactPhoneChange(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                  />
                </div>
              </div>
            )}

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
                disabled={showContactFields && !contactEmail && !contactPhone}
                className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-violet-900 flex items-start sm:items-center justify-center p-4 sm:p-4">
        <div className="w-full sm:max-w-md space-y-6 pt-8 sm:pt-0">
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
            onSpin={onSpin}
            targetSymbols={assignedSymbols}
            prizes={restaurant.prizes}
            prizeSymbolMap={prizeSymbolMap}
            variant="classic"
            isWin={isWin}
          />

          {isSpinning && !reelsFinished && (
            <div className="text-center">
              <p className="text-yellow-300 font-bold animate-pulse text-lg">
                La roue tourne... 🤞
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // === CLAIM (server validation) ===
  if (step === 'claim') {
    const prizeName = spinResult?.prize?.name || redeemResult?.prizeName || '';
    const prizeDesc = spinResult?.prize?.description || redeemResult?.prizeDescription || null;
    const prizeCode = spinResult?.prize?.code || redeemResult?.code || '';
    const expiresAt = spinResult?.prize?.expiresAt;

    if (claimSuccess) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-400 via-emerald-400 to-teal-400 flex items-start sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md">
            <div className="min-h-screen sm:min-h-0 bg-white sm:rounded-3xl sm:shadow-2xl p-6 sm:p-8 text-center space-y-6 flex flex-col justify-center sm:block">
              <div className="text-6xl">✅</div>
              <h2 className="text-2xl font-black text-gray-900">Cadeau validé !</h2>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                <p className="text-xl font-bold text-green-600">{prizeName}</p>
                {prizeDesc && <p className="text-sm text-gray-500 mt-1">{prizeDesc}</p>}
              </div>
              <p className="text-gray-500">Bonne dégustation ! 🎉</p>
              {showGoogleReview && (
                <div className="space-y-2 mt-2">
                  <p className="text-sm text-gray-500 leading-snug">
                    Votre commentaire nous fait chaud au cœur ! Vous pouvez nous donner un coup de pouce en le publiant aussi sur Google
                  </p>
                  <button
                    onClick={onGoogleReview}
                    className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all text-sm"
                  >
                    ① Un clic pour copier
                  </button>
                  <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <span>②</span>
                    <span>Un clic pour coller</span>
                    <span>→</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 flex items-start sm:items-center justify-center p-0 sm:p-4">
        <div className="w-full sm:max-w-md">
          <div className="min-h-screen sm:min-h-0 bg-white sm:rounded-3xl sm:shadow-2xl p-6 sm:p-8 text-center space-y-6">
            <div className="text-5xl">🎁</div>
            <h2 className="text-xl font-black text-gray-900">Présentez cet écran au serveur</h2>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200">
              <p className="text-xl font-bold text-orange-600">{prizeName}</p>
              {prizeDesc && <p className="text-sm text-gray-500 mt-1">{prizeDesc}</p>}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Code :</p>
              <div className="bg-gray-900 text-yellow-400 font-mono text-2xl font-bold py-4 px-6 rounded-xl tracking-widest">
                {prizeCode}
              </div>
              {expiresAt && (
                <p className="text-xs text-gray-400">
                  Valable jusqu'au {new Date(expiresAt).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>

            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
              <p className="text-red-600 font-bold text-sm">
                ⚠️ Attention ! Si vous appuyez sans responsable, votre lot sera perdu.
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <button
                  onMouseDown={onHoldStart}
                  onMouseUp={onHoldEnd}
                  onMouseLeave={onHoldEnd}
                  onTouchStart={onHoldStart}
                  onTouchEnd={onHoldEnd}
                  disabled={isClaiming}
                  className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-lg rounded-2xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 relative overflow-hidden"
                >
                  <div
                    className="absolute inset-0 bg-green-500 transition-none"
                    style={{ width: `${holdProgress * 100}%` }}
                  />
                  <span className="relative z-10">
                    {isClaiming ? 'Validation...' : holdProgress > 0 && holdProgress < 1 ? 'Maintenez...' : 'Maintenir 2s pour valider'}
                  </span>
                </button>
              </div>
              {claimError && (
                <p className="text-red-500 text-sm font-medium">{claimError}</p>
              )}
              <p className="text-xs text-gray-400">
                Le serveur du restaurant doit maintenir ce bouton enfoncé pendant 2 secondes
              </p>
            </div>

            <p className="text-xs text-gray-400">
              Notez votre code <strong>{prizeCode}</strong> — vous pourrez aussi récupérer votre lot un autre jour.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // === REDEEM (deferred pickup) ===
  if (step === 'redeem') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-start sm:items-center justify-center p-0 sm:p-4">
        <div className="w-full sm:max-w-md">
          <div className="min-h-screen sm:min-h-0 bg-white sm:rounded-3xl sm:shadow-xl p-6 sm:p-8 text-center space-y-6 flex flex-col justify-center sm:block">
            <div className="text-5xl">🎟️</div>
            <h2 className="text-xl font-bold text-gray-900">Récupérer mon cadeau</h2>
            <p className="text-sm text-gray-500">
              Entrez le code que vous avez reçu lors de votre dernière visite
            </p>

            <div className="space-y-3">
              <input
                type="text"
                value={redeemCode}
                onChange={(e) => onRedeemCodeChange(e.target.value.toUpperCase())}
                placeholder="Ex: FB-A7K9-X2M5"
                className="w-full p-4 border-2 border-gray-200 rounded-2xl text-center text-xl font-mono font-bold tracking-widest focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all placeholder:text-gray-300 placeholder:text-base placeholder:font-normal placeholder:tracking-normal"
                maxLength={12}
              />
              {redeemError && (
                <p className="text-red-500 text-sm font-medium">{redeemError}</p>
              )}
            </div>

            <button
              onClick={onRedeemSubmit}
              disabled={!redeemCode.trim() || isRedeeming}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isRedeeming ? 'Vérification...' : 'Récupérer ce lot'}
            </button>

            <button
              onClick={onBack}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === RESULT ===
  if (step === 'result' && spinResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-start sm:items-center justify-center p-0 sm:p-4">
        <div className="w-full sm:max-w-md">
          <div className="min-h-screen sm:min-h-0 bg-white sm:rounded-3xl sm:shadow-xl p-6 sm:p-8 text-center space-y-6 flex flex-col justify-center sm:block">
            <div className="text-5xl">😊</div>
            <h2 className="text-xl font-bold text-gray-900">Dommage ! Pas de lot cette fois ci !</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto" />
            <p className="text-sm text-gray-400">
              La prochaine fois sera la bonne !
            </p>
            {showGoogleReview && (
              <div className="space-y-2 mt-2">
                <p className="text-sm text-gray-500 leading-snug">
                  Aidez-nous en partageant votre avis positif sur Google en deux clics
                </p>
                <button
                  onClick={onGoogleReview}
                  className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all text-sm"
                >
                  ① Un clic pour copier
                </button>
                <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                  <span>②</span>
                  <span>Un clic pour coller</span>
                  <span>→</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
