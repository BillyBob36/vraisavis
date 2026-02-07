'use client';

import { TemplateProps } from '@/lib/templates/types';
import SlotMachine from '../SlotMachine';

export default function GlassTemplate(props: TemplateProps) {
  const {
    step, restaurant, onNext, onBack,
    positiveText, onPositiveChange,
    negativeText, onNegativeChange,
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
  } = props;

  const showContactFields = wantNotifyOwn || wantNotifyOthers;

  // === INTRO ===
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute top-20 -left-20 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 -right-20 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 text-center space-y-6">
            {/* Logo / Restaurant */}
            <div className="space-y-2">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-4xl">
                🍽️
              </div>
              <h1 className="text-2xl font-bold text-white">{restaurant.name}</h1>
            </div>

            {/* Divider */}
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto" />

            {/* Value props */}
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3 bg-white/5 rounded-2xl p-3 border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400/30 to-pink-400/30 backdrop-blur-xl border border-white/10 flex items-center justify-center shrink-0 text-lg">🎰</div>
                <div>
                  <p className="font-semibold text-white/90">Tentez de gagner des lots !</p>
                  <p className="text-xs text-white/50">Donnez votre avis et jouez à la machine à sous</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/5 rounded-2xl p-3 border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400/30 to-emerald-400/30 backdrop-blur-xl border border-white/10 flex items-center justify-center shrink-0 text-lg">⚡</div>
                <div>
                  <p className="font-semibold text-white/90">Moins d'une minute</p>
                  <p className="text-xs text-white/50">2 questions rapides, puis c'est parti !</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/5 rounded-2xl p-3 border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400/30 to-cyan-400/30 backdrop-blur-xl border border-white/10 flex items-center justify-center shrink-0 text-lg">🔒</div>
                <div>
                  <p className="font-semibold text-white/90">100% anonyme</p>
                  <p className="text-xs text-white/50">Aucune inscription, aucune donnée personnelle</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={onNext}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10"
            >
              C'est parti ! 🎉
            </button>

            <p className="text-xs text-white/30">
              Votre avis aide {restaurant.name} à s'améliorer
            </p>

            <button
              onClick={onGoToRedeem}
              className="w-full py-3 text-sm text-purple-300 font-medium border border-white/20 rounded-2xl hover:bg-white/5 transition-all"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-10 -right-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 -left-20 w-64 h-64 bg-green-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 space-y-6">
            {/* Progress */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-emerald-400/80 rounded-full shadow-sm shadow-emerald-400/50" />
              <div className="flex-1 h-1.5 bg-white/10 rounded-full" />
            </div>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="text-4xl">😊</div>
              <h2 className="text-xl font-bold text-white">Le positif</h2>
              <p className="text-sm text-white/50">
                Qu'est-ce qui vous a le plus plu aujourd'hui ?
              </p>
            </div>

            {/* Question */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white/80">
                En un mot ou une phrase : qu'avez-vous adoré ?
              </label>
              <textarea
                value={positiveText}
                onChange={(e) => onPositiveChange(e.target.value)}
                placeholder="Ex: Le dessert était incroyable, l'accueil chaleureux..."
                className="w-full h-32 p-4 bg-white/5 border border-white/20 rounded-2xl text-base text-white resize-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all placeholder:text-white/20 backdrop-blur-xl"
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-white/30">
                <span>Minimum 10 caractères</span>
                <span>{positiveText.length}/500</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="px-6 py-3 text-white/50 font-medium rounded-xl hover:bg-white/5 border border-white/10 transition-all"
              >
                Retour
              </button>
              <button
                onClick={onNext}
                disabled={positiveText.trim().length < 10}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl shadow-md shadow-emerald-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/10"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-10 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 space-y-6">
            {/* Progress */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-emerald-400/80 rounded-full shadow-sm shadow-emerald-400/50" />
              <div className="flex-1 h-1.5 bg-blue-400/80 rounded-full shadow-sm shadow-blue-400/50" />
            </div>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="text-4xl">🤔</div>
              <h2 className="text-xl font-bold text-white">L'amélioration</h2>
              <p className="text-sm text-white/50">
                Aidez-nous à nous améliorer — soyez honnête, c'est comme ça qu'on progresse !
              </p>
            </div>

            {/* Question */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white/80">
                En toute sincérité, quel point mérite d'être amélioré ?
              </label>
              <textarea
                value={negativeText}
                onChange={(e) => onNegativeChange(e.target.value)}
                placeholder="Ex: L'attente était un peu longue, le bruit ambiant..."
                className="w-full h-32 p-4 bg-white/5 border border-white/20 rounded-2xl text-base text-white resize-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all placeholder:text-white/20 backdrop-blur-xl"
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-white/30">
                <span>Optionnel mais apprécié</span>
                <span>{negativeText.length}/500</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="px-6 py-3 text-white/50 font-medium rounded-xl hover:bg-white/5 border border-white/10 transition-all"
              >
                Retour
              </button>
              <button
                onClick={onNext}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl shadow-md shadow-blue-500/25 transition-all border border-white/10"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-10 -left-20 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-6 sm:p-8 space-y-5">
            {/* Progress */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-emerald-400/80 rounded-full shadow-sm shadow-emerald-400/50" />
              <div className="flex-1 h-1.5 bg-blue-400/80 rounded-full shadow-sm shadow-blue-400/50" />
              <div className="flex-1 h-1.5 bg-violet-400/80 rounded-full shadow-sm shadow-violet-400/50" />
            </div>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="text-4xl">🔔</div>
              <h2 className="text-xl font-bold text-white">Restez informé(e)</h2>
              <p className="text-sm text-white/50">
                Souhaitez-vous être prévenu(e) quand le restaurant prend en compte les retours clients ?
              </p>
            </div>

            {/* Toggle options */}
            <div className="space-y-3">
              <div
                onClick={() => onWantNotifyOwnChange(!wantNotifyOwn)}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  wantNotifyOwn ? 'border-violet-400/50 bg-violet-500/10' : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex-1 pr-3">
                  <p className="font-semibold text-white/90 text-sm">Mes remarques</p>
                  <p className="text-xs text-white/40">Être prévenu(e) quand mes suggestions sont prises en compte</p>
                </div>
                <div className={`w-12 h-7 rounded-full p-1 transition-all ${
                  wantNotifyOwn ? 'bg-violet-500' : 'bg-white/20'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    wantNotifyOwn ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </div>

              <div
                onClick={() => onWantNotifyOthersChange(!wantNotifyOthers)}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  wantNotifyOthers ? 'border-violet-400/50 bg-violet-500/10' : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex-1 pr-3">
                  <p className="font-semibold text-white/90 text-sm">Autres améliorations</p>
                  <p className="text-xs text-white/40">Être prévenu(e) des améliorations suite aux retours d'autres clients</p>
                </div>
                <div className={`w-12 h-7 rounded-full p-1 transition-all ${
                  wantNotifyOthers ? 'bg-violet-500' : 'bg-white/20'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    wantNotifyOthers ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </div>
            </div>

            {/* Contact fields */}
            {showContactFields && (
              <div className="space-y-3">
                <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-3">
                  <p className="text-xs text-blue-300">
                    🔒 Vos coordonnées restent <strong>strictement anonymes</strong>. Le restaurateur n'y a pas accès. Elles servent uniquement à vous envoyer une alerte automatique en cas d'amélioration liée à vos retours.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => onContactEmailChange(e.target.value)}
                    placeholder="votre@email.com"
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-sm text-white focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/20 outline-none transition-all placeholder:text-white/20 backdrop-blur-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Téléphone <span className="text-white/30 font-normal">(optionnel)</span></label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => onContactPhoneChange(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-sm text-white focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/20 outline-none transition-all placeholder:text-white/20 backdrop-blur-xl"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="px-6 py-3 text-white/50 font-medium rounded-xl hover:bg-white/5 border border-white/10 transition-all"
              >
                Retour
              </button>
              <button
                onClick={onNext}
                disabled={showContactFields && !contactEmail && !contactPhone}
                className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl shadow-md shadow-violet-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/10"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="w-full max-w-md relative z-10 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white">Tentez votre chance !</h2>
            <p className="text-sm text-white/50">
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
            variant="glass"
            isWin={isWin}
          />

          {isSpinning && !reelsFinished && (
            <div className="text-center">
              <p className="text-violet-300 font-bold animate-pulse text-lg">
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
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 flex items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute top-10 left-10 w-40 h-40 bg-green-400/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-emerald-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />

          <div className="w-full max-w-md relative z-10">
            <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 text-center space-y-6">
              <div className="text-6xl">✅</div>
              <h2 className="text-2xl font-black text-white">Cadeau validé !</h2>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-green-400/30">
                <p className="text-xl font-bold text-green-300">{prizeName}</p>
                {prizeDesc && <p className="text-sm text-white/50 mt-1">{prizeDesc}</p>}
              </div>
              <p className="text-white/60">Bonne dégustation ! 🎉</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-900 to-red-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-40 h-40 bg-yellow-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-orange-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 text-center space-y-6">
            <div className="text-5xl">�</div>
            <h2 className="text-xl font-black text-white">Présentez cet écran au serveur</h2>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-yellow-400/30">
              <p className="text-xl font-bold text-yellow-300">{prizeName}</p>
              {prizeDesc && <p className="text-sm text-white/50 mt-1">{prizeDesc}</p>}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-white/50">Code :</p>
              <div className="bg-black/40 backdrop-blur-xl text-yellow-400 font-mono text-2xl font-bold py-4 px-6 rounded-xl tracking-widest border border-yellow-400/20">
                {prizeCode}
              </div>
              {expiresAt && (
                <p className="text-xs text-white/40">
                  Valable jusqu'au {new Date(expiresAt).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>

            <div className="bg-red-500/20 border border-red-400/30 rounded-2xl p-4">
              <p className="text-red-300 font-bold text-sm">
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
                  className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-lg rounded-2xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 relative overflow-hidden border border-white/10"
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
                <p className="text-red-400 text-sm font-medium">{claimError}</p>
              )}
              <p className="text-xs text-white/40">
                Le serveur du restaurant doit maintenir ce bouton enfoncé pendant 2 secondes
              </p>
            </div>

            <p className="text-xs text-white/40">
              Notez votre code <strong className="text-yellow-400">{prizeCode}</strong> — vous pourrez aussi récupérer votre lot un autre jour.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // === REDEEM (deferred pickup) ===
  if (step === 'redeem') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-20 -left-20 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 -right-20 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 text-center space-y-6">
            <div className="text-5xl">🎟️</div>
            <h2 className="text-xl font-bold text-white">Récupérer mon cadeau</h2>
            <p className="text-sm text-white/50">
              Entrez le code que vous avez reçu lors de votre dernière visite
            </p>

            <div className="space-y-3">
              <input
                type="text"
                value={redeemCode}
                onChange={(e) => onRedeemCodeChange(e.target.value.toUpperCase())}
                placeholder="Ex: FB-A7K9-X2M5"
                className="w-full p-4 bg-white/5 border border-white/20 rounded-2xl text-center text-xl font-mono font-bold tracking-widest text-white focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all placeholder:text-white/20 placeholder:text-base placeholder:font-normal placeholder:tracking-normal backdrop-blur-xl"
                maxLength={12}
              />
              {redeemError && (
                <p className="text-red-400 text-sm font-medium">{redeemError}</p>
              )}
            </div>

            <button
              onClick={onRedeemSubmit}
              disabled={!redeemCode.trim() || isRedeeming}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-purple-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/10"
            >
              {isRedeeming ? 'Vérification...' : 'Récupérer ce lot'}
            </button>

            <button
              onClick={onBack}
              className="text-sm text-white/40 hover:text-white/60 transition-colors"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 text-center space-y-6">
            <div className="text-5xl">😊</div>
            <h2 className="text-xl font-bold text-white">Pas de lot cette fois</h2>
            <p className="text-white/50">
              {restaurant.thankYouMessage || 'Merci pour votre participation ! Votre avis compte énormément pour nous.'}
            </p>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto" />
            <p className="text-sm text-white/30">
              Revenez la prochaine fois pour retenter votre chance !
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
