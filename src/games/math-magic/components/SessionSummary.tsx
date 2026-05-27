import React, { useEffect, useState } from 'react';
import { MathMagicState, MathMagicAction } from '../types';
import { SensoryManager, SensoryEvent } from '../SensoryManager';

export function SessionSummary({ state, dispatch, onPlayAgain }: { state: MathMagicState, dispatch: React.Dispatch<MathMagicAction>, onPlayAgain: () => void }) {
  const [finalTime, setFinalTime] = useState(0);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (state.endTime && state.startTime) {
       setFinalTime(state.endTime - state.startTime);
    }
  }, [state.startTime, state.endTime]);

  if (isHidden) {
      return (
          <div className="absolute bottom-6 right-6 z-[2000]">
              <button 
                onClick={() => setIsHidden(false)}
                className="bg-[#3d2b1f] text-white px-6 py-4 rounded-full font-black drop-shadow-xl active:scale-95 transition-all text-sm uppercase tracking-widest"
              >
                  Results
              </button>
          </div>
      );
  }

  const formatTime = (ms: number) => {
    const totalsec = Math.floor(ms / 1000);
    const min = Math.floor(totalsec / 60);
    const sec = totalsec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const results = state.sessionResults;

  return (
    <div 
      className="absolute inset-0 bg-[#3d2b1f]/0 backdrop-blur-none z-[2000] flex items-center justify-center p-4"
      style={{ animation: 'summaryOverlayFadeIn 0.5s ease-out 1.2s forwards' }}
    >
      <style>{`
         @keyframes summaryOverlayFadeIn {
            to { background-color: rgba(61,43,31,0.6); backdrop-filter: blur(4px); }
         }
         @keyframes summaryScaleUp {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
         }
         @keyframes growStars {
            0% { transform: scale(1); }
            50% { transform: scale(1.3); text-shadow: 0 0 10px rgba(251,191,36,0.8); }
            100% { transform: scale(1); }
         }
      `}</style>
      <div 
        className="bg-[#fefbf0] border-2 border-[#e6dbb8] p-6 lg:p-8 rounded-2xl drop-shadow-2xl shadow-2xl shadow-[#3d2b1f]/30 max-w-sm w-full text-center opacity-0"
        style={{ animation: 'summaryScaleUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) 1.2s forwards' }}
      >
        <h2 className="text-3xl font-black text-[#5a4030] mb-2 uppercase tracking-wide">Score!</h2>
        <div className="text-sm font-bold text-[#8a7968] uppercase tracking-widest mb-6 border-b border-[#e6dbb8] pb-4">
          Session Complete
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center bg-[#fdf6e3] p-4 rounded-xl border border-[#e6dbb8]">
            <span className="font-bold text-[#8a7968] uppercase text-xs tracking-wider">Time</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-black text-[#3d2b1f]">{formatTime(finalTime)}</span>
              {results?.timeBroken && <span className="bg-amber-400 text-amber-900 border border-amber-500 text-[10px] font-black uppercase px-2 py-0.5 rounded-none shadow-sm animate-pulse">NEW RECORD!</span>}
            </div>
          </div>
          <div className="flex justify-between items-center bg-[#fdf6e3] p-4 rounded-xl border border-[#e6dbb8]">
            <span className="font-bold text-[#8a7968] uppercase text-xs tracking-wider">Max Combo</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-black text-[#3d2b1f]">{state.sessionMaxCombo}</span>
              {results?.newMaxCombo && <span className="bg-amber-400 text-amber-900 border border-amber-500 text-[10px] font-black uppercase px-2 py-0.5 rounded-none shadow-sm animate-pulse">NEW RECORD!</span>}
            </div>
          </div>
        </div>

        {results && (
          <div className="border border-[#e6dbb8] bg-[#f5eedc] rounded-xl p-4 mb-8 text-left">
             <div className="font-black text-[#5a4030] uppercase text-sm mb-3 text-center tracking-widest">Stars Earned</div>
             <div className="space-y-2 text-sm font-bold text-[#8a7968]">
                <div className="flex justify-between">
                   <span>Session Clear</span>
                   <span className="text-[#3d2b1f] font-black">+ {results.breakdown.base}</span>
                </div>
                {results.breakdown.time > 0 && (
                  <div className="flex justify-between text-amber-600">
                     <span>Time Record</span>
                     <span className="font-black">+ {results.breakdown.time}</span>
                  </div>
                )}
                {results.breakdown.combo > 0 && (
                  <div className="flex justify-between text-amber-600">
                     <span>Epic Combo</span>
                     <span className="font-black">+ {results.breakdown.combo}</span>
                  </div>
                )}
                <div className="border-t border-[#e6dbb8] pt-2 mt-2 flex justify-between items-center text-lg">
                   <span className="font-black text-[#3d2b1f] uppercase tracking-wider text-xs">Total payout</span>
                   <span className="font-black text-amber-500 flex items-center gap-1" style={{ animation: 'growStars 0.6s ease 2s' }}>
                      +{results.earnedStars} <span className="text-xl">⭐</span>
                   </span>
                </div>
             </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => {
              SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined);
              onPlayAgain();
            }}
            className="w-full h-16 sm:h-20 bg-[#3d2b1f] text-white font-black text-xl rounded-none hover:bg-[#5a4030] transition-colors uppercase tracking-widest active:scale-[0.98]"
          >
            Play Again
          </button>
          <button 
            onClick={() => {
              SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined);
              setIsHidden(true);
            }}
            className="w-full h-16 sm:h-20 bg-transparent text-[#3d2b1f] border-2 border-[#3d2b1f] font-black text-xl rounded-none hover:bg-[#3d2b1f]/5 transition-colors uppercase tracking-widest active:scale-[0.98]"
          >
            Explore Board
          </button>
        </div>
      </div>
    </div>
  );
}