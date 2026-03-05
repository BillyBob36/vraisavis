'use client';

import { useState } from 'react';
import { TemplateProps } from '@/lib/templates/types';
import { useTranslation, AVAILABLE_LOCALES } from '@/lib/i18n/context';
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

  const { t, locale, setLocale } = useTranslation();
  const [claimMode, setClaimMode] = useState<'choice' | 'now' | 'later'>('choice');

  const showContactFields = wantNotifyOwn || wantNotifyOthers;

  // Language selector component
  const LanguageSelector = () => (
    <div className="flex items-center justify-center gap-2">
      {AVAILABLE_LOCALES.map((loc) => (
        <button
          key={loc.code}
          onClick={() => setLocale(loc.code)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            locale === loc.code
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {loc.flag} {loc.label}
        </button>
      ))}
    </div>
  );

  // === INTRO ===
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-start sm:items-center justify-center p-0 sm:p-4">
        <div className="w-full sm:max-w-md">
          <div className="min-h-screen sm:min-h-0 bg-white sm:rounded-3xl sm:shadow-xl p-6 sm:p-8 text-center space-y-6 flex flex-col justify-center sm:block">
            <LanguageSelector />

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
                  <p className="font-semibold text-gray-900">{t.introSlotTitle}</p>
                  <p className="text-sm text-gray-500">{t.introSlotDesc}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-lg">⚡</div>
                <div>
                  <p className="font-semibold text-gray-900">{t.introFastTitle}</p>
                  <p className="text-sm text-gray-500">{t.introFastDesc}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-lg">🔒</div>
                <div>
                  <p className="font-semibold text-gray-900">{t.introAnonTitle}</p>
                  <p className="text-sm text-gray-500">{t.introAnonDesc}</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={onNext}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {t.introCta}
            </button>

            <p className="text-sm font-semibold text-gray-600">{t.introFooter}</p>

            <button
              onClick={onGoToRedeem}
              className="w-full py-3 text-sm text-orange-500 font-medium border-2 border-orange-200 rounded-2xl hover:bg-orange-50 transition-all"
            >
              {t.introRedeem}
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
              <h2 className="text-xl font-bold text-gray-900">{t.positiveTitle}</h2>
            </div>

            {/* Question */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">{t.positiveQuestion}</label>
              <textarea
                value={positiveText}
                onChange={(e) => onPositiveChange(e.target.value)}
                placeholder={t.positivePlaceholder}
                className="w-full h-32 p-4 border-2 border-gray-200 rounded-2xl text-base resize-none focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all placeholder:text-gray-400"
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{t.positiveMinChars}</span>
                <span>{positiveText.length}/500</span>
              </div>
            </div>

            {/* Rating */}
            <ThumbRating
              value={positiveRating}
              onChange={onPositiveRatingChange}
              type="positive"
              label={t.positiveRatingLabel}
              variant="classic"
            />

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={onBack} className="px-6 py-3 text-gray-500 font-medium rounded-xl hover:bg-gray-100 transition-all">{t.back}</button>
              <button
                onClick={onNext}
                disabled={positiveText.trim().length < 10 || positiveRating === 0}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {t.next}
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
              <h2 className="text-xl font-bold text-gray-900">{t.negativeTitle}</h2>
              <p className="text-sm text-gray-500">{t.negativeSubtitle}</p>
            </div>

            {/* Question */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">{t.negativeQuestion}</label>
              <textarea
                value={negativeText}
                onChange={(e) => onNegativeChange(e.target.value)}
                placeholder={t.negativePlaceholder}
                className="w-full h-32 p-4 border-2 border-gray-200 rounded-2xl text-base resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400"
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{t.negativeMinChars}</span>
                <span>{negativeText.length}/500</span>
              </div>
            </div>

            {/* Rating */}
            <ThumbRating
              value={negativeRating}
              onChange={onNegativeRatingChange}
              type="negative"
              label={t.negativeRatingLabel}
              variant="classic"
            />

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={onBack} className="px-6 py-3 text-gray-500 font-medium rounded-xl hover:bg-gray-100 transition-all">{t.back}</button>
              <button
                onClick={onNext}
                disabled={negativeText.trim().length < 10 || negativeRating === 0}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {t.next}
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
              <h2 className="text-xl font-bold text-gray-900">{t.contactTitle}</h2>
              <p className="text-sm text-gray-500">{t.contactSubtitle}</p>
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
                  <p className="font-semibold text-gray-900 text-sm">{t.contactOwnLabel}</p>
                  <p className="text-xs text-gray-500">{t.contactOwnDesc}</p>
                </div>
                <div className={`w-12 h-7 rounded-full p-1 transition-all ${wantNotifyOwn ? 'bg-violet-500' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${wantNotifyOwn ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>

              <div
                onClick={() => onWantNotifyOthersChange(!wantNotifyOthers)}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  wantNotifyOthers ? 'border-violet-400 bg-violet-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex-1 pr-3">
                  <p className="font-semibold text-gray-900 text-sm">{t.contactOthersLabel}</p>
                  <p className="text-xs text-gray-500">{t.contactOthersDesc}</p>
                </div>
                <div className={`w-12 h-7 rounded-full p-1 transition-all ${wantNotifyOthers ? 'bg-violet-500' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${wantNotifyOthers ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>

            {/* Contact fields — only if at least one toggle is on */}
            {showContactFields && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs text-blue-700" dangerouslySetInnerHTML={{ __html: t.contactPrivacy }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.contactEmail}</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => onContactEmailChange(e.target.value)}
                    placeholder={t.contactEmailPlaceholder}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.contactPhone} <span className="text-gray-400 font-normal">{t.contactPhoneOptional}</span></label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => onContactPhoneChange(e.target.value)}
                    placeholder={t.contactPhonePlaceholder}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={onBack} className="px-6 py-3 text-gray-500 font-medium rounded-xl hover:bg-gray-100 transition-all">{t.back}</button>
              <button
                onClick={onNext}
                disabled={showContactFields && !contactEmail && !contactPhone}
                className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {t.contactCta}
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
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white">{t.spinTitle}</h2>
            <p className="text-sm text-purple-200">{t.spinSubtitle}</p>
          </div>

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
              <p className="text-yellow-300 font-bold animate-pulse text-lg">{t.spinSpinning}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // === CLAIM (new UX: choice → now / later) ===
  if (step === 'claim') {
    const prizeName = spinResult?.prize?.name || redeemResult?.prizeName || '';
    const prizeDesc = spinResult?.prize?.description || redeemResult?.prizeDescription || null;
    const prizeCode = spinResult?.prize?.code || redeemResult?.code || '';
    const expiresAt = spinResult?.prize?.expiresAt;

    // Success state
    if (claimSuccess) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-400 via-emerald-400 to-teal-400 flex items-start sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md">
            <div className="min-h-screen sm:min-h-0 bg-white sm:rounded-3xl sm:shadow-2xl p-6 sm:p-8 text-center space-y-6 flex flex-col justify-center sm:block">
              <div className="text-6xl">✅</div>
              <h2 className="text-2xl font-black text-gray-900">{t.claimSuccessTitle}</h2>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                <p className="text-xl font-bold text-green-600">{prizeName}</p>
                {prizeDesc && <p className="text-sm text-gray-500 mt-1">{prizeDesc}</p>}
              </div>
              <p className="text-gray-500">{t.claimSuccessEnjoy}</p>
              {showGoogleReview && (
                <div className="space-y-2 mt-2">
                  <p className="text-sm text-gray-500 leading-snug">{t.googleReviewTextWin}</p>
                  <button onClick={onGoogleReview} className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all text-sm">{t.googleReviewCopy}</button>
                  <p className="text-xs text-gray-400">{t.googleReviewPaste}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // "Collect now" mode — server hold button
    if (claimMode === 'now') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 flex items-start sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md">
            <div className="min-h-screen sm:min-h-0 bg-white sm:rounded-3xl sm:shadow-2xl p-6 sm:p-8 text-center space-y-6 flex flex-col justify-center sm:block">
              <div className="text-5xl">🎁</div>
              <h2 className="text-xl font-black text-gray-900">{t.claimNowTitle}</h2>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200">
                <p className="text-xl font-bold text-orange-600">{prizeName}</p>
                {prizeDesc && <p className="text-sm text-gray-500 mt-1">{prizeDesc}</p>}
              </div>

              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                <p className="text-red-600 font-bold text-sm">{t.claimWarning}</p>
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
                    <div className="absolute inset-0 bg-green-500 transition-none" style={{ width: `${holdProgress * 100}%` }} />
                    <span className="relative z-10">
                      {isClaiming ? t.claimHoldValidating : holdProgress > 0 && holdProgress < 1 ? t.claimHoldProgress : t.claimHoldDefault}
                    </span>
                  </button>
                </div>
                {claimError && <p className="text-red-500 text-sm font-medium">{claimError}</p>}
                <p className="text-xs text-gray-400">{t.claimHoldInstruction}</p>
              </div>

              <button
                onClick={() => setClaimMode('choice')}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                {t.claimLaterBack}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // "Collect later" mode — show code
    if (claimMode === 'later') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-start sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md">
            <div className="min-h-screen sm:min-h-0 bg-white sm:rounded-3xl sm:shadow-2xl p-6 sm:p-8 text-center space-y-6 flex flex-col justify-center sm:block">
              <div className="text-5xl">📝</div>
              <h2 className="text-xl font-black text-gray-900">{t.claimLaterTitle}</h2>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-5 border-2 border-yellow-200">
                <p className="text-lg font-bold text-orange-600">{prizeName}</p>
                {prizeDesc && <p className="text-sm text-gray-500 mt-1">{prizeDesc}</p>}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">{t.claimLaterNote}</p>
                <div className="bg-gray-900 text-yellow-400 font-mono text-2xl font-bold py-4 px-6 rounded-xl tracking-widest select-all">
                  {prizeCode}
                </div>
                {expiresAt && (
                  <p className="text-xs text-gray-400">
                    {t.claimLaterValidUntil} {new Date(expiresAt).toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR')}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-blue-700 text-sm">{t.claimLaterInstruction}</p>
              </div>

              <button
                onClick={() => setClaimMode('choice')}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                {t.claimLaterBack}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Default: choice screen
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 flex items-start sm:items-center justify-center p-0 sm:p-4">
        <div className="w-full sm:max-w-md">
          <div className="min-h-screen sm:min-h-0 bg-white sm:rounded-3xl sm:shadow-2xl p-6 sm:p-8 text-center space-y-6 flex flex-col justify-center sm:block">
            <div className="text-5xl">🎉</div>
            <h2 className="text-2xl font-black text-gray-900">{t.claimTitle}</h2>
            <p className="text-sm text-gray-500">{t.claimPrizeLabel}</p>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200">
              <p className="text-2xl font-black text-orange-600">{prizeName}</p>
              {prizeDesc && <p className="text-sm text-gray-500 mt-2">{prizeDesc}</p>}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setClaimMode('now')}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {t.claimNowBtn}
              </button>
              <p className="text-xs text-gray-400">{t.claimNowDesc}</p>
            </div>

            <div className="w-12 h-0.5 bg-gray-200 mx-auto" />

            <div className="space-y-3">
              <button
                onClick={() => setClaimMode('later')}
                className="w-full py-4 text-orange-600 font-bold text-lg border-2 border-orange-200 rounded-2xl hover:bg-orange-50 active:scale-[0.98] transition-all"
              >
                {t.claimLaterBtn}
              </button>
              <p className="text-xs text-gray-400">{t.claimLaterDesc}</p>
            </div>
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
            <h2 className="text-xl font-bold text-gray-900">{t.redeemTitle}</h2>
            <p className="text-sm text-gray-500">{t.redeemSubtitle}</p>

            <div className="space-y-3">
              <input
                type="text"
                value={redeemCode}
                onChange={(e) => onRedeemCodeChange(e.target.value.toUpperCase())}
                placeholder={t.redeemPlaceholder}
                className="w-full p-4 border-2 border-gray-200 rounded-2xl text-center text-xl font-mono font-bold tracking-widest focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all placeholder:text-gray-300 placeholder:text-base placeholder:font-normal placeholder:tracking-normal"
                maxLength={12}
              />
              {redeemError && <p className="text-red-500 text-sm font-medium">{redeemError}</p>}
            </div>

            <button
              onClick={onRedeemSubmit}
              disabled={!redeemCode.trim() || isRedeeming}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isRedeeming ? t.redeemVerifying : t.redeemCta}
            </button>

            <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">{t.redeemBack}</button>
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
            <h2 className="text-xl font-bold text-gray-900">{t.resultTitle}</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto" />
            <p className="text-sm text-gray-400">{t.resultSubtitle}</p>
            {showGoogleReview && (
              <div className="space-y-2 mt-2">
                <p className="text-sm text-gray-500 leading-snug">{t.googleReviewText}</p>
                <button onClick={onGoogleReview} className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all text-sm">{t.googleReviewCopy}</button>
                <p className="text-xs text-gray-400">{t.googleReviewPaste}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
