'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import {
  Restaurant,
  ClientStep,
  SpinResult,
  SlotSymbol,
  buildPrizeSymbolMap,
  NO_PRIZE_SYMBOLS,
  TemplateProps,
} from '@/lib/templates/types';
import ClassicTemplate from '@/components/client/templates/ClassicTemplate';
import GlassTemplate from '@/components/client/templates/GlassTemplate';

// Simple fingerprint based on browser characteristics
async function generateFingerprint(): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('VraisAvis', 2, 2);
  }
  const canvasData = canvas.toDataURL();

  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    canvasData,
  ].join('|');

  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function ClientExperiencePage() {
  const params = useParams();
  const restaurantId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [fingerprintId, setFingerprintId] = useState<string | null>(null);
  const [step, setStep] = useState<ClientStep>('intro');
  const [positiveText, setPositiveText] = useState('');
  const [negativeText, setNegativeText] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [prizeSymbolMap, setPrizeSymbolMap] = useState<Map<string, [SlotSymbol, SlotSymbol, SlotSymbol]>>(new Map());
  const [assignedSymbols, setAssignedSymbols] = useState<[SlotSymbol, SlotSymbol, SlotSymbol] | null>(null);
  const [reelsFinished, setReelsFinished] = useState(false);
  const spinResultRef = useRef<SpinResult | null>(null);

  // Load restaurant data and register fingerprint
  useEffect(() => {
    async function init() {
      try {
        // Load restaurant info
        const restData = await apiFetch<{ restaurant: Restaurant }>(
          `/api/v1/client/restaurant/${restaurantId}`
        );
        setRestaurant(restData.restaurant);

        // Build prize symbol map
        const symbolMap = buildPrizeSymbolMap(restData.restaurant.prizes);
        setPrizeSymbolMap(symbolMap);

        // Generate and register fingerprint
        const hash = await generateFingerprint();
        const fpData = await apiFetch<{ fingerprintId: string; canPlay: boolean; message?: string }>(
          '/api/v1/client/fingerprint',
          {
            method: 'POST',
            body: JSON.stringify({ hash, restaurantId }),
          }
        );

        if (!fpData.canPlay) {
          setError(fpData.message || 'Vous avez déjà participé pendant ce service');
          return;
        }

        setFingerprintId(fpData.fingerprintId);
      } catch (err: any) {
        setError(err.message || 'Impossible de charger le restaurant');
      } finally {
        setLoading(false);
      }
    }

    if (restaurantId) init();
  }, [restaurantId]);

  const handleNext = useCallback(() => {
    const steps: ClientStep[] = ['intro', 'positive', 'negative', 'spin', 'result'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    const steps: ClientStep[] = ['intro', 'positive', 'negative', 'spin', 'result'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  }, [step]);

  const handleSpin = useCallback(async () => {
    if (!fingerprintId || !restaurant) return;

    setIsSpinning(true);

    try {
      // Submit feedback first
      await apiFetch('/api/v1/client/feedback', {
        method: 'POST',
        body: JSON.stringify({
          fingerprintId,
          restaurantId,
          positiveText,
          negativeText: negativeText || undefined,
        }),
      });

      // Then spin
      const result = await apiFetch<SpinResult>('/api/v1/client/spin', {
        method: 'POST',
        body: JSON.stringify({ fingerprintId, restaurantId }),
      });

      spinResultRef.current = result;

      // Determine target symbols based on result
      if (result.won && result.prize) {
        // Find the prize in the map by name match
        const matchingPrize = restaurant.prizes.find(p => p.name === result.prize!.name);
        if (matchingPrize) {
          const symbols = prizeSymbolMap.get(matchingPrize.id);
          if (symbols) {
            setAssignedSymbols(symbols);
          } else {
            setAssignedSymbols(NO_PRIZE_SYMBOLS);
          }
        } else {
          setAssignedSymbols(NO_PRIZE_SYMBOLS);
        }
      } else {
        setAssignedSymbols(NO_PRIZE_SYMBOLS);
      }

      // The result will be shown when onReelsFinished is called by SlotMachine

    } catch (err: any) {
      setIsSpinning(false);
      setError(err.message || 'Erreur lors du tirage');
    }
  }, [fingerprintId, restaurant, restaurantId, positiveText, negativeText, prizeSymbolMap]);

  const handleReelsFinished = useCallback(() => {
    setReelsFinished(true);
    // Wait 2.5s after reels stop so user can see the final symbols
    setTimeout(() => {
      setSpinResult(spinResultRef.current);
      setIsSpinning(false);
      setStep('result');
    }, 2500);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-white/60 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 text-center max-w-sm space-y-4">
          <div className="text-4xl">😕</div>
          <h2 className="text-xl font-bold text-white">Oups !</h2>
          <p className="text-white/60">{error || 'Restaurant introuvable'}</p>
        </div>
      </div>
    );
  }

  // Template props
  const templateProps: TemplateProps = {
    step,
    restaurant,
    onNext: handleNext,
    onBack: handleBack,
    positiveText,
    onPositiveChange: setPositiveText,
    negativeText,
    onNegativeChange: setNegativeText,
    isSpinning,
    onSpin: handleSpin,
    spinResult,
    reelsFinished,
    onReelsFinished: handleReelsFinished,
    prizeSymbolMap,
    assignedSymbols,
  };

  // Render the appropriate template
  switch (restaurant.clientTemplate) {
    case 'glass':
      return <GlassTemplate {...templateProps} />;
    case 'classic':
    default:
      return <ClassicTemplate {...templateProps} />;
  }
}
