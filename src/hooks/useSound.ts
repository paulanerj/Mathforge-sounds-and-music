/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { playCrystalMathSound, CrystalMathSoundId } from '../audio/crystalMathSoundPack';

export const useSound = (
  soundMode: 'on' | 'quiet' | 'off',
  lastEvent: string,
  isTickingNeeded: boolean,
  isQMM: boolean = false,
  streakTier: number = 0
) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const tickIntervalRef = useRef<number | null>(null);
  const lastCorrectSoundTimeRef = useRef<number>(0);

  useEffect(() => {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) audioCtxRef.current = new AudioContextClass();
    return () => {
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const playSoundPack = useCallback((id: CrystalMathSoundId) => {
    if (soundMode === 'off' || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    let baseScale = isQMM ? 0.6 : 1.0;
    if (soundMode === 'quiet') {
      baseScale *= 0.3; // dramatically reduce all volumes in quiet mode
    }

    playCrystalMathSound(id, {
      audioCtx: ctx,
      output: ctx.destination,
      gainScale: baseScale
    });
  }, [soundMode, isQMM]);

  const sounds = useMemo(
    () => ({
      correct: () => {
        const now = Date.now();
        if (now - lastCorrectSoundTimeRef.current < 180) {
          // Rate limit: skip sound if inputs are happening too rapidly
          return;
        }
        lastCorrectSoundTimeRef.current = now;

        if (soundMode !== 'off' && typeof navigator !== 'undefined' && navigator.vibrate) {
          const baseVib = isQMM ? 15 : 30; // softer vibration
          navigator.vibrate(Math.min(baseVib + (streakTier * 5), 50));
        }

        if (streakTier > 3) {
            playSoundPack(isQMM ? 'qmm_fast_3' : 'correct_fast_3');
        } else if (streakTier > 1) {
            playSoundPack(isQMM ? 'qmm_fast_2' : 'correct_fast_2');
        } else if (streakTier > 0) {
            playSoundPack(isQMM ? 'qmm_fast_1' : 'correct_fast_1');
        } else {
            playSoundPack('correct_base');
        }
      },
      incorrect: () => {
        if (soundMode !== 'off' && typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(isQMM ? 30 : 60);
        }
        playSoundPack('wrong_soft');
      },
      modeChange: () => {
        playSoundPack('mode_change_soft');
      },
      click: () => {
        if (soundMode !== 'off' && typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(10);
        }
        playSoundPack('answer_tap');
      },
      win: () => {
        playSoundPack('level_complete');
      },
      stepComplete: () => {
        playSoundPack('ui_select');
      }
    }),
    [playSoundPack, soundMode, isQMM, streakTier]
  );

  useEffect(() => {
    if (soundMode === 'off') return;
    switch (lastEvent) {
      case 'correct':
        sounds.correct();
        break;
      case 'incorrect':
        sounds.incorrect();
        break;
      case 'mode_change':
        sounds.modeChange();
        break;
      case 'win':
        sounds.win();
        break;
      case 'start':
        sounds.modeChange();
        break;
      case 'step_advance':
        sounds.stepComplete();
        break;
    }
  }, [lastEvent, soundMode, sounds]);

  useEffect(() => {
    if (soundMode === 'off' || !isTickingNeeded) {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      return;
    }
    const tickCallback = () => playSoundPack('dark_tick');
    if (!tickIntervalRef.current) {
      tickCallback();
      tickIntervalRef.current = window.setInterval(tickCallback, 1000);
    }
    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };
  }, [soundMode, isTickingNeeded, playSoundPack]);

  return { playButtonClick: sounds.click };
};
