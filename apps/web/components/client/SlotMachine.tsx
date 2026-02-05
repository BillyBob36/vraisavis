'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SlotSymbol, SLOT_SYMBOLS, Prize } from '@/lib/templates/types';

interface SlotMachineProps {
  isSpinning: boolean;
  onSpinComplete: () => void;
  targetSymbols: [SlotSymbol, SlotSymbol, SlotSymbol] | null;
  prizes: Prize[];
  prizeSymbolMap: Map<string, [SlotSymbol, SlotSymbol, SlotSymbol]>;
  variant?: 'classic' | 'glass';
  isWin?: boolean;
}

const REEL_SIZE = 20;
const SPIN_DURATION = 3000;
const REEL_DELAYS = [0, 400, 800];

function generateReelStrip(targetSymbol: SlotSymbol): SlotSymbol[] {
  const strip: SlotSymbol[] = [];
  for (let i = 0; i < REEL_SIZE - 1; i++) {
    strip.push(SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]);
  }
  strip.push(targetSymbol);
  return strip;
}

export default function SlotMachine({
  isSpinning,
  onSpinComplete,
  targetSymbols,
  prizes,
  prizeSymbolMap,
  variant = 'classic',
  isWin = false,
}: SlotMachineProps) {
  const [reels, setReels] = useState<SlotSymbol[][]>([
    [SLOT_SYMBOLS[0]], [SLOT_SYMBOLS[0]], [SLOT_SYMBOLS[0]]
  ]);
  const [spinning, setSpinning] = useState([false, false, false]);
  const [stopped, setStopped] = useState([true, true, true]);
  const [displayIndex, setDisplayIndex] = useState([0, 0, 0]);
  const [showLegend, setShowLegend] = useState(true);
  const [winFlash, setWinFlash] = useState(false);
  const animFrames = useRef<number[]>([0, 0, 0]);
  const spinStartTime = useRef<number[]>([0, 0, 0]);
  const hasCompleted = useRef(false);

  const animateReel = useCallback((reelIdx: number, strip: SlotSymbol[], startTime: number) => {
    const elapsed = Date.now() - startTime;
    const duration = SPIN_DURATION + REEL_DELAYS[reelIdx] * 2;

    if (elapsed < duration) {
      const progress = elapsed / duration;
      const eased = progress < 0.8 ? progress / 0.8 : 1;
      const speed = Math.max(1, Math.floor((1 - eased * 0.9) * 8));
      
      setDisplayIndex(prev => {
        const next = [...prev];
        next[reelIdx] = (prev[reelIdx] + speed) % strip.length;
        return next;
      });

      animFrames.current[reelIdx] = requestAnimationFrame(() => 
        animateReel(reelIdx, strip, startTime)
      );
    } else {
      setDisplayIndex(prev => {
        const next = [...prev];
        next[reelIdx] = strip.length - 1;
        return next;
      });
      setStopped(prev => {
        const next = [...prev];
        next[reelIdx] = true;
        return next;
      });
      setSpinning(prev => {
        const next = [...prev];
        next[reelIdx] = false;
        return next;
      });
    }
  }, []);

  useEffect(() => {
    if (isSpinning && targetSymbols) {
      hasCompleted.current = false;
      setWinFlash(false);
      setShowLegend(false);
      const strips = targetSymbols.map(sym => generateReelStrip(sym));
      setReels(strips);
      setStopped([false, false, false]);
      setSpinning([true, true, true]);

      strips.forEach((strip, idx) => {
        const delay = REEL_DELAYS[idx];
        setTimeout(() => {
          const startTime = Date.now();
          spinStartTime.current[idx] = startTime;
          animateReel(idx, strip, startTime);
        }, delay);
      });
    }

    return () => {
      animFrames.current.forEach(id => cancelAnimationFrame(id));
    };
  }, [isSpinning, targetSymbols, animateReel]);

  useEffect(() => {
    if (stopped[0] && stopped[1] && stopped[2] && !hasCompleted.current && isSpinning) {
      hasCompleted.current = true;

      if (isWin) {
        // Win animation: flash the reels for 2s before completing
        setWinFlash(true);
        setTimeout(() => {
          onSpinComplete();
        }, 2000);
      } else {
        setTimeout(() => {
          onSpinComplete();
        }, 800);
      }
    }
  }, [stopped, isSpinning, isWin, onSpinComplete]);

  const getCurrentSymbol = (reelIdx: number): SlotSymbol => {
    const strip = reels[reelIdx];
    if (!strip || strip.length === 0) return SLOT_SYMBOLS[0];
    return strip[displayIndex[reelIdx] % strip.length];
  };

  const isGlass = variant === 'glass';

  return (
    <div className="w-full max-w-sm mx-auto relative">
      {/* Machine */}
      <div className={`rounded-2xl p-5 ${
        isGlass 
          ? 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl' 
          : 'bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 border-4 border-yellow-700 shadow-2xl'
      } ${winFlash ? 'animate-pulse ring-4 ring-yellow-300/80' : ''}`}>
        {/* Header */}
        <div className={`text-center mb-3 pb-2 border-b ${
          isGlass ? 'border-white/20' : 'border-yellow-700'
        }`}>
          <h3 className={`text-base font-black tracking-wider ${
            isGlass ? 'text-white' : 'text-yellow-900'
          }`}>
            🎰 MACHINE À SOUS 🎰
          </h3>
        </div>

        {/* Reels */}
        <div className={`flex justify-center gap-2 p-3 rounded-xl ${
          isGlass 
            ? 'bg-black/30 border border-white/10' 
            : 'bg-white border-4 border-yellow-800'
        }`}>
          {[0, 1, 2].map(reelIdx => (
            <div
              key={reelIdx}
              className={`w-20 h-24 flex items-center justify-center rounded-lg text-5xl transition-all duration-300 ${
                spinning[reelIdx] ? 'animate-pulse' : ''
              } ${
                winFlash ? (isGlass ? 'bg-yellow-400/20 border-yellow-400/50' : 'bg-yellow-100 border-yellow-400') : ''
              } ${
                isGlass 
                  ? 'bg-white/5 border border-white/20' 
                  : 'bg-gray-50 border-2 border-gray-300'
              }`}
            >
              <span className={`${spinning[reelIdx] ? 'animate-bounce' : 'transition-all duration-300'} ${winFlash ? 'scale-110' : ''}`}>
                {getCurrentSymbol(reelIdx).emoji}
              </span>
            </div>
          ))}
        </div>

        {/* Win flash text */}
        {winFlash && (
          <div className="text-center mt-3">
            <p className={`text-lg font-black animate-bounce ${
              isGlass ? 'text-yellow-300' : 'text-yellow-900'
            }`}>
              🎉 GAGNÉ ! 🎉
            </p>
          </div>
        )}

        {/* Spinning status */}
        {isSpinning && !stopped.every(Boolean) && (
          <div className="text-center mt-2">
            <p className={`text-sm font-semibold animate-pulse ${
              isGlass ? 'text-white/80' : 'text-yellow-900'
            }`}>
              La roue tourne...
            </p>
          </div>
        )}
      </div>

      {/* Prize Legend Toggle Button */}
      {prizes.length > 0 && !showLegend && (
        <button
          onClick={() => setShowLegend(true)}
          className={`mt-3 mx-auto flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 ${
            isGlass
              ? 'bg-white/10 backdrop-blur-lg border border-white/20 text-white/70 hover:bg-white/15'
              : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 shadow-sm'
          }`}
        >
          🏆 Voir les lots à gagner
        </button>
      )}

      {/* Prize Legend Overlay */}
      {prizes.length > 0 && showLegend && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          onClick={() => setShowLegend(false)}
        >
          {/* Backdrop */}
          <div className={`absolute inset-0 ${
            isGlass ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/50'
          }`} />

          {/* Panel */}
          <div
            className={`relative w-full max-w-xs rounded-2xl p-5 animate-in fade-in zoom-in-95 duration-200 ${
              isGlass
                ? 'bg-white/15 backdrop-blur-2xl border border-white/25 shadow-2xl'
                : 'bg-white border border-gray-200 shadow-2xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close hint */}
            <p className={`text-center text-[10px] mb-3 ${
              isGlass ? 'text-white/40' : 'text-gray-400'
            }`}>
              Touchez en dehors pour fermer
            </p>

            <h4 className={`text-sm font-bold mb-3 text-center ${
              isGlass ? 'text-white/90' : 'text-gray-800'
            }`}>
              🏆 Lots à gagner
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {prizes.map(prize => {
                const symbols = prizeSymbolMap.get(prize.id);
                if (!symbols) return null;
                return (
                  <div key={prize.id} className={`flex items-center gap-3 p-2.5 rounded-xl ${
                    isGlass ? 'bg-white/5 border border-white/10' : 'bg-gray-50'
                  }`}>
                    <div className="flex gap-0.5 text-xl shrink-0">
                      {symbols.map((s, i) => (
                        <span key={i}>{s.emoji}</span>
                      ))}
                    </div>
                    <span className={`text-xs font-medium ${
                      isGlass ? 'text-white/80' : 'text-gray-700'
                    }`}>
                      {prize.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowLegend(false)}
              className={`w-full mt-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                isGlass
                  ? 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/15'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              J'ai compris, fermer ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
