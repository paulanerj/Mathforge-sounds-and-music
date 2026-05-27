────────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { MathMagicState, MathMagicMode } from '../types';
import { SensoryManager, SensoryEvent } from '../SensoryManager';

interface MathMagicModalProps {
  state: MathMagicState;
  onResolve: (id: string, submittedValue: number | boolean) => void;
  onClose: () => void;
}

export const MathMagicModal = ({ state, onResolve, onClose }: MathMagicModalProps) => {
  const [options, setOptions] = useState<number[]>([]);
  const [keypadInput, setKeypadInput] = useState<string>('');
  const [isError, setIsError] = useState(false);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCanClose(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const tile = state.activeTileId ? state.tiles.find(t => t.id === state.activeTileId) : null;

  useEffect(() => {
    if (!tile) return;
    
    // Generate options for Multiple Choice and Replace
    if (state.mode === MathMagicMode.MULTIPLE_CHOICE || state.mode === MathMagicMode.REPLACE) {
      const correct = state.mode === MathMagicMode.MULTIPLE_CHOICE 
          ? tile.product 
          : (Math.random() > 0.5 
              ? state.config.activeFactors[tile.currentX % state.config.activeFactors.length]
              : tile.currentY + state.config.startRow);
              
      const uniq = (v: number, ex: number[]) => {
          let n = v;
          while (n <= 0 || ex.includes(n)) {
              n += (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1);
          }
          return n;
      };
      const d1 = uniq(correct + 1, [correct]);
      const d2 = uniq(correct - 1, [correct, d1]);
      const d3 = uniq(correct + 2, [correct, d1, d2]);
      const opts = [correct, d1, d2, d3];
      for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]];
      }
      setOptions(opts);
    }
  }, [tile, state.mode]);

  if (!tile) return null;

  const f1 = state.config.activeFactors[tile.currentX % state.config.activeFactors.length];
  const f2 = tile.currentY + state.config.startRow;

  const handleKeypad = (val: string) => {
    SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined);
    if (val === 'del') {
      setKeypadInput(prev => prev.slice(0, -1));
      setIsError(false);
    } else if (val === 'clr') {
      setKeypadInput('');
      setIsError(false);
    } else {
      const next = keypadInput + val;
      const targetStr = String(tile.product);
      if (targetStr.startsWith(next)) {
        setKeypadInput(next);
        setIsError(false);
        if (next === targetStr) {
          onResolve(tile.id, parseInt(next, 10));
        }
      } else {
        setIsError(true);
        setTimeout(() => {
            onResolve(tile.id, -1); // Wrong!
        }, 300);
      }
    }
  };

  const renderContent = () => {
    switch (state.mode) {
      case MathMagicMode.TRUE_FALSE:
        // For visual brevity we just hardcode displayed, here we let modal pick.
        // Actually, TRUE_FALSE would need to present a random right or wrong answer.
        // But for simplicity let's just make True/False straightforward.
        const showCorrect = Math.random() < 0.6;
        let displayed = tile.product;
        if (!showCorrect) {
             let off = Math.floor(Math.random() * 9) + 1;
             if (Math.random() > 0.5 && tile.product - off > 0) off = -off;
             displayed = tile.product + off;
        }
        
        return (
          <>
            <div className="bg-[#f5eedc] border border-[#e6dbb8] rounded-md p-4 mb-4 text-center">
              <div className="text-xs font-extrabold text-[#8a7968] uppercase tracking-wider mb-1">Col × Row</div>
              <div className="text-4xl font-black leading-tight text-[#3d2b1f] mb-0">
                {f1} × {f2} = {displayed}
              </div>
            </div>
            <p className="text-sm text-[#8a7968] font-bold mb-1 text-center">Is this right? 🤔</p>
            <div className="flex gap-2 mt-3">
              <button 
                onClick={() => {
                  SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined);
                  onResolve(tile.id, showCorrect ? true : false);
                }} 
                className="flex-1 p-3 text-lg font-black border border-[#a8d4c2] rounded-md cursor-pointer transition-transform bg-[#c8e6da] text-[#2a5c45] shadow-[0_2px_0_#a8d4c2] hover:shadow-[0_4px_0_#a8d4c2] hover:-translate-y-px active:scale-95"
              >
                ✓ TRUE!
              </button>
              <button 
                onClick={() => {
                  SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined);
                  onResolve(tile.id, !showCorrect ? true : false);
                }} 
                className="flex-1 p-3 text-lg font-black border border-[#d4a4a4] rounded-md cursor-pointer transition-transform bg-[#e8c4c4] text-[#6b2b2b] shadow-[0_2px_0_#d4a4a4] hover:shadow-[0_4px_0_#d4a4a4] hover:-translate-y-px active:scale-95"
              >
                ✗ FALSE!
              </button>
            </div>
          </>
        );
      
      case MathMagicMode.MULTIPLE_CHOICE:
      case MathMagicMode.REPLACE:
        return (
          <>
            <div className="bg-[#f5eedc] border border-[#e6dbb8] rounded-md p-4 mb-3 text-center">
              <div className="text-xs font-extrabold text-[#8a7968] uppercase tracking-wider mb-1">
                {state.mode === MathMagicMode.REPLACE ? 'Find the missing number! 🔍' : 'Col × Row'}
              </div>
              <div className="text-4xl font-black leading-tight text-[#3d2b1f] mb-0">
                {state.mode === MathMagicMode.REPLACE 
                  ? (options.includes(f1) ? `? × ${f2} = ${tile.product}` : `${f1} × ? = ${tile.product}`) 
                  : `${f1} × ${f2} = ?`}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined);
                    onResolve(tile.id, opt);
                  }}
                  className="p-3 text-2xl font-black border border-[#e6dbb8] rounded-md cursor-pointer bg-[#fefbf0] text-[#3d2b1f] shadow-[0_2px_0_#e6dbb8] transition-all hover:bg-[#f5eedc] hover:border-[#a8a6cf] hover:shadow-[0_3px_0_#a8a6cf] active:scale-95"
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        );

      case MathMagicMode.KEYPAD:
        return (
          <>
            <div className="bg-[#f5eedc] border border-[#e6dbb8] rounded-md p-3 mb-2 text-center">
              <div className="text-xs font-extrabold text-[#8a7968] uppercase tracking-wider mb-1">Col × Row</div>
              <div className="text-3xl font-black leading-tight text-[#3d2b1f] mb-0">{f1} × {f2} = ?</div>
            </div>
            
            <div className={`border rounded p-2 text-center text-3xl font-black mb-3 min-h-[58px] tracking-[4px] transition-colors ${isError ? 'border-[#c97d7d] bg-[#f5e8e8]' : 'border-[#e6dbb8] bg-[#fdf6e3]'}`}>
              {isError ? '✗' : (keypadInput || '?')}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(n => (
                <button key={n} onClick={() => handleKeypad(n.toString())} className="p-3 text-xl font-black border border-[#e6dbb8] rounded cursor-pointer bg-[#fefbf0] text-[#3d2b1f] shadow-[0_2px_0_#e6dbb8] active:translate-y-0.5 active:shadow-none hover:bg-[#f5eedc] hover:border-[#a8a6cf] hover:shadow-[0_3px_0_#a8a6cf]">
                  {n}
                </button>
              ))}
              <button onClick={() => handleKeypad('del')} className="p-3 text-lg font-black border border-[#e6dbb8] rounded cursor-pointer bg-[#f5eedc] text-[#8a7968] shadow-[0_2px_0_#e6dbb8] active:translate-y-0.5 active:shadow-none">⌫</button>
              <button onClick={() => handleKeypad('0')} className="p-3 text-xl font-black border border-[#e6dbb8] rounded cursor-pointer bg-[#fefbf0] text-[#3d2b1f] shadow-[0_2px_0_#e6dbb8] active:translate-y-0.5 active:shadow-none">0</button>
              <button onClick={() => handleKeypad('clr')} className="p-3 text-sm font-black border border-[#e6dbb8] rounded cursor-pointer bg-[#f5eedc] text-[#c97d7d] shadow-[0_2px_0_#e6dbb8] active:translate-y-0.5 active:shadow-none">CLR</button>
            </div>
          </>
        );
        
      default:
        return <div>Unknown Mode</div>;
    }
  };

  return (
    <div 
       className="fixed inset-0 bg-[#281c12]/50 backdrop-blur-sm flex justify-center items-center z-[9999]" 
       onPointerDown={(e) => {
         if (!canClose) return;
         SensoryManager.dispatch(SensoryEvent.ON_MODAL_CLOSE, undefined);
         onClose();
       }}
    >
      <div 
        className="bg-[#fefbf0] border border-[#e6dbb8] rounded-xl p-6 w-[90%] max-w-[360px] drop-shadow-2xl shadow-2xl shadow-[#3d2b1f]/30"
        onPointerDown={e => e.stopPropagation()}
      >
        {renderContent()}
      </div>
    </div>
  );
};
────────────────────────────────────────────────────────────────────────────────
