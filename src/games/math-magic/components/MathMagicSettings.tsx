────────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { MathMagicConfig, MathMagicMode, MathMagicState } from '../types';
import { MathMagicRules } from '../MathMagicRules';
import { SensoryManager, SensoryEvent } from '../SensoryManager';

interface MathMagicSettingsProps {
  state: MathMagicState;
  onApply: (mode: MathMagicMode, config: MathMagicConfig) => void;
  onClose: () => void;
  activeTheme: 'monument' | 'iron-forge' | 'stage-dive' | 'cinnamoroll' | 'kuromi' | 'glitch-wave' | 'celestial-orbit' | 'deep-sea';
  onThemeChange: (theme: 'monument' | 'iron-forge' | 'stage-dive' | 'cinnamoroll' | 'kuromi' | 'glitch-wave' | 'celestial-orbit' | 'deep-sea') => void;
  vfxQuality: 'high' | 'low' | 'off';
  onVfxQualityChange: (quality: 'high' | 'low' | 'off') => void;
}

export const MathMagicSettings = ({ state, onClose, onApply, activeTheme, onThemeChange, vfxQuality, onVfxQualityChange }: MathMagicSettingsProps) => {
  const [mode, setMode] = useState<MathMagicMode>(state.mode);
  const [size, setSize] = useState(`${state.config.cols},${state.config.rows}`);
  const [factorsStr, setFactorsStr] = useState(state.config.activeFactors.join(', '));
  const [guides, setGuides] = useState(state.config.guides ? 'ON' : 'OFF');

  const [previewMin, setPreviewMin] = useState(0);
  const [previewMax, setPreviewMax] = useState(0);
  const [previewFactors, setPreviewFactors] = useState<number[]>([]);

  useEffect(() => {
    const [c, r] = size.split(',').map(Number);
    const parsedFactors = MathMagicRules.parseFactors(factorsStr);
    const shown = Array.from({ length: c }, (_, i) => parsedFactors[i % parsedFactors.length]);
    setPreviewFactors(shown);
    setPreviewMin(Math.min(...shown) * 1);
    setPreviewMax(Math.max(...shown) * r);
  }, [size, factorsStr]);

  const handleApply = () => {
    const config: MathMagicConfig = {
      cols: 12,
      rows: 12,
      activeFactors: [1,2,3,4,5,6,7,8,9,10,11,12],
      startRow: 1, // Fixed to 1 as per originally hardcoded
      guides: guides === 'ON'
    };
    onApply(mode, config);
  };

  return (
    <div 
      className="fixed inset-0 bg-[#281c12]/50 backdrop-blur-sm flex justify-center items-center z-[2100]" 
      onClick={() => {
        SensoryManager.dispatch(SensoryEvent.ON_MODAL_CLOSE, undefined);
        onClose();
      }}
    >
      <div 
        className="bg-[#fefbf0] border border-[#e6dbb8] rounded-xl p-6 w-[90%] max-w-[360px] drop-shadow-2xl shadow-2xl shadow-[#3d2b1f]/30 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-black mb-4 text-[#3d2b1f] tracking-wide">⚙️ Settings</h2>
        
        <div className="mb-3">
          <label className="block text-xs font-extrabold text-[#8a7968] uppercase tracking-wide mb-1">Game Mode</label>
          <select 
            value={mode}
            onChange={(e) => {
              SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined);
              setMode(e.target.value as MathMagicMode);
            }}
            className="w-full p-2 font-[Nunito] text-base font-extrabold bg-[#fdf6e3] border border-[#e6dbb8] rounded text-[#3d2b1f] focus:outline-none focus:border-[#a8a6cf] focus:shadow-[0_0_0_3px_rgba(168,166,207,0.2)]"
          >
            <option value="DRAG_DROP">🎯 Drag & Drop — place tiles on the right spot!</option>
            <option value="RANDOMIZED_GRID">🔀 Scrambled — sort all the products!</option>
            <option value="TRUE_FALSE">✅ True or False — tap and decide!</option>
            <option value="MULTIPLE_CHOICE">🔠 Multiple Choice — pick the answer!</option>
            <option value="REPLACE">🔍 Find the Missing — be a math detective!</option>
            <option value="KEYPAD">⌨️ Keypad — type the answer!</option>
            <option value="REVERSE_SEEK">🔍 Target Hunt — Find the answer!</option>
            <option value="MULTIPLICATION_FINDER">✖️ Multiplication Finder — Tap the answer grid!</option>
            <option value="ADDITION_FINDER">➕ Addition Finder — Tap the answer grid!</option>
            <option value="PATTERN_SWEEPER">🔍 Pattern Sweeper — Tap matching patterns!</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-extrabold text-[#8a7968] uppercase tracking-wide mb-1">Grid Guides (Crosshairs)</label>
          <select 
            value={guides}
            onChange={(e) => {
              SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined);
              setGuides(e.target.value);
            }}
            className="w-full p-2 font-[Nunito] text-base font-extrabold bg-[#fdf6e3] border border-[#e6dbb8] rounded text-[#3d2b1f] focus:outline-none focus:border-[#a8a6cf] focus:shadow-[0_0_0_3px_rgba(168,166,207,0.2)]"
          >
            <option value="ON">✨ On (Super Helpful!)</option>
            <option value="OFF">💪 Off (Extra Challenge!)</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-extrabold text-[#8a7968] uppercase tracking-wide mb-1">VFX Particles Quality</label>
          <select 
            value={vfxQuality}
            onChange={(e) => {
              SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined);
              onVfxQualityChange(e.target.value as 'high' | 'low' | 'off');
            }}
            className="w-full p-2 font-[Nunito] text-base font-extrabold bg-[#fdf6e3] border border-[#e6dbb8] rounded text-[#3d2b1f] focus:outline-none focus:border-[#a8a6cf] focus:shadow-[0_0_0_3px_rgba(168,166,207,0.2)]"
          >
            <option value="high">🌌 High (Full Effects!)</option>
            <option value="low">⚡ Low (Eco / Better Battery!)</option>
            <option value="off">🚫 Off (Zero VFX Overhead!)</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-extrabold text-[#8a7968] uppercase tracking-wide mb-1.5">Appearance (Theme)</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined);
                onThemeChange('monument');
              }}
              className={`p-2 font-bold border rounded text-[10px] sm:text-xs transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                activeTheme === 'monument'
                  ? 'bg-[#3d2b1f] text-white border-transparent shadow-md font-black'
                  : 'bg-[#fdf6e3] text-[#3d2b1f] border-[#e6dbb8] hover:bg-[#e6dbb8]/30'
              }`}
            >
              <span className="text-sm">🏜️</span> Monument
            </button>
            <button
              type="button"
              onClick={() => {
                SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined);
                onThemeChange('iron-forge');
              }}
              className={`p-2 font-bold border rounded text-[10px] sm:text-xs transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                activeTheme === 'iron-forge'
                  ? 'bg-[#ea580c] text-white border-transparent shadow-md font-black'
                  : 'bg-[#fdf6e3] text-[#3d2b1f] border-[#e6dbb8] hover:bg-[#e6dbb8]/30'
              }`}
            >
              <span className="text-sm">🌋</span> Iron Forge
            </button>
            <button
              type="button"
              onClick={() => {
                SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined);
                onThemeChange('stage-dive');
              }}
              className={`p-2 font-bold border rounded text-[10px] sm:text-xs transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                activeTheme === 'stage-dive'
                  ? 'bg-[#06b6d4] text-black border-transparent shadow-md font-black'
                  : 'bg-[#fdf6e3] text-[#3d2b1f] border-[#e6dbb8] hover:bg-[#e6dbb8]/30'
              }`}
            >
              <span className="text-sm">🎸</span> Stage Dive
            </button>
            <button
              type="button"
              onClick={() => {
                SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined);
                onThemeChange('cinnamoroll');
              }}
              className={`p-2 font-bold border rounded text-[10px] sm:text-xs transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                activeTheme === 'cinnamoroll'
                  ? 'bg-[#BAD9EA] text-[#173A64] border-transparent shadow-md font-black'
                  : 'bg-[#fdf6e3] text-[#3d2b1f] border-[#e6dbb8] hover:bg-[#e6dbb8]/30'
              }`}
            >
              <span className="text-sm">☁️</span> Cinnamoroll
            </button>
            <button
              type="button"
              onClick={() => {
                SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined);
                onThemeChange('kuromi');
              }}
              className={`p-2 font-bold border rounded-none text-[10px] sm:text-xs transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                activeTheme === 'kuromi'
                  ? 'bg-[#7e22ce] text-white border-transparent shadow-md font-black'
                  : 'bg-[#1a0f1f]/90 text-[#ec4899] border-[#ec4899]/60 hover:bg-[#20112b]'
              }`}
              style={{ borderRadius: '0px' }}
            >
              <div className="flex items-center gap-1 px-1">
                <span className="text-sm">😈</span>
                <span className="font-extrabold tracking-wide uppercase">Kuromi</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined);
                onThemeChange('glitch-wave');
              }}
              className={`p-2 font-bold border rounded-none text-[10px] sm:text-xs transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                activeTheme === 'glitch-wave'
                  ? 'bg-black text-[#00ff00] border-[#00ff00] shadow-[0_0_10px_rgba(0,255,0,0.5)] font-black'
                  : 'bg-black border-[#00ffff]/60 text-[#00ffff] hover:bg-[#111111]'
              }`}
              style={{ borderRadius: '0px' }}
            >
              <div className="flex items-center gap-1 px-1">
                <span className="text-sm">👾</span>
                <span className="font-extrabold tracking-wide uppercase">Glitch Wave</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined);
                onThemeChange('celestial-orbit');
              }}
              className={`p-2 font-bold border rounded-none text-[10px] sm:text-xs transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                activeTheme === 'celestial-orbit'
                  ? 'bg-[#0f172a] text-[#fbbf24] border-[#fbbf24] shadow-[0_0_12px_rgba(251,191,36,0.5)] font-black'
                  : 'bg-[#0f172a] border-[#38bdf8]/40 text-[#38bdf8] hover:bg-[#1e293b]'
              }`}
              style={{ borderRadius: '0px' }}
            >
              <div className="flex items-center gap-1 px-1">
                <span className="text-sm">🌌</span>
                <span className="font-extrabold tracking-wide uppercase">Celestial Orbit</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined);
                onThemeChange('deep-sea');
              }}
              className={`p-2 font-bold border rounded-none text-[10px] sm:text-xs transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                activeTheme === 'deep-sea'
                  ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white border-transparent shadow-[0_0_15px_rgba(20,184,166,0.6)] font-black'
                  : 'bg-[#030712] border-[#0d9488]/50 text-[#0d9488] hover:bg-[#0c1d36]'
              }`}
              style={{ borderRadius: '0px' }}
            >
              <div className="flex items-center gap-1 px-1">
                <span className="text-sm">🐙</span>
                <span className="font-extrabold tracking-wide uppercase">Deep Sea</span>
              </div>
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-auto text-sm">
          <button 
            onClick={() => {
              SensoryManager.dispatch(SensoryEvent.ON_MODAL_CLOSE, undefined);
              onClose();
            }}
            className="flex-1 p-2 font-extrabold border border-[#e6dbb8] rounded bg-[#f5eedc] text-[#8a7968] transition-colors hover:bg-[#e6dbb8] hover:text-[#3d2b1f]"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              SensoryManager.dispatch(SensoryEvent.ON_MODAL_CLOSE, undefined);
              handleApply();
            }}
            className="flex-[2] p-2 font-black border-none rounded bg-[#a8a6cf] text-[#3d2b1f] cursor-pointer transition-transform hover:opacity-90 hover:scale-[1.02]"
          >
            Let's Go! 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
────────────────────────────────────────────────────────────────────────────────
