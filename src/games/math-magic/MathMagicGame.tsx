import React, { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { mmReducer, initialMathMagicState } from './mmReducer';
import { MathMagicMode, MathMagicPhase, MathMagicTile, getModeThreshold } from './types';
import { Tile } from './components/Tile';
import { InteractionGhost } from './components/InteractionGhost';
import { MathMagicRules } from './MathMagicRules';
import { StorageService } from './StorageService';
import { DragDropMode, ModeRegistry } from './modes/ModeRegistry';
import { SensoryManager, SensoryEvent } from './SensoryManager';
import { useGameEngine } from './hooks/useGameEngine';

import { MathMagicModal } from './components/MathMagicModal';
import { MathMagicSettings } from './components/MathMagicSettings';
import { SessionSummary } from './components/SessionSummary';
import { VFXOverlay } from './components/VFXOverlay';
import { Settings, Info, ChevronLeft, Home, RefreshCw, Calculator, Grid3X3, ListOrdered, Shapes, Music, Shuffle, Search, Filter } from 'lucide-react';
import { MathMagicVFX } from './MathMagicVFX';

const dragModeStrategy = new DragDropMode();

const GUIDE_FONT_SCALE = 2.5;

const MM_GLASS = "bg-[var(--card-bg)]/90 backdrop-blur-md border border-[var(--border-color)] drop-shadow-2xl shadow-2xl shadow-[var(--shadow-color)] rounded-xl overflow-hidden";
const MM_CONTROL = "flex items-center justify-center p-2.5 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--ctrl-hover-bg)] hover:text-[var(--ctrl-hover-text)] transition-all cursor-pointer shadow-sm active:scale-95 rounded-xl disabled:opacity-40 disabled:pointer-events-none";

const getModePillStyle = (mode: MathMagicMode, theme: 'monument' | 'iron-forge' | 'stage-dive' | 'cinnamoroll' | 'kuromi' | 'glitch-wave' | 'celestial-orbit' | 'deep-sea') => {
  if (theme === 'deep-sea') {
    return {
      pillBg: 'bg-[#020617] text-[#2dd4bf] border-[#0d9488] shadow-[0_0_15px_rgba(20,184,166,0.35)] rounded-none',
      btnBg: 'bg-[#0f172a] text-[#38bdf8] hover:bg-[#020617] border-[#0d9488]/70 rounded-none',
      dot: 'bg-[#2dd4bf]'
    };
  }

  if (theme === 'celestial-orbit') {
    return {
      pillBg: 'bg-[#0b0f19] text-[#fbbf24] border-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.25)] rounded-none',
      btnBg: 'bg-[#1e293b] text-[#38bdf8] hover:bg-[#0f172a] border-[#38bdf8]/50 rounded-none',
      dot: 'bg-[#fbbf24]'
    };
  }

  if (theme === 'glitch-wave') {
    return {
      pillBg: 'bg-black text-[#00ff00] border-[#00ff00] shadow-[0_0_12px_rgba(0,255,0,0.3)] rounded-none',
      btnBg: 'bg-black text-[#00ffff] hover:bg-[#111111] border-[#00ffff] rounded-none',
      dot: 'bg-[#00ff00]'
    };
  }

  if (theme === 'kuromi') {
    return {
      pillBg: 'bg-[#7e22ce] text-white border-[#ec4899] shadow-[0_4px_12px_rgba(236,72,153,0.15)] rounded-none',
      btnBg: 'bg-[#ec4899] text-white hover:bg-[#a855f7] border-[#ec4899] rounded-none',
      dot: 'bg-white'
    };
  }

  if (theme === 'cinnamoroll') {
    return {
      pillBg: 'bg-white text-[#173A64] border-[#BAD9EA] shadow-[0_4px_12px_rgba(23,58,100,0.06)]',
      btnBg: 'bg-[#F7C7D9] text-[#173A64] hover:bg-[#CFEFFF] border-[#BAD9EA]',
      dot: 'bg-[#173A64]'
    };
  }

  switch (mode) {
    case MathMagicMode.DRAG_DROP:
      return {
        pillBg: 'bg-emerald-100/90 text-emerald-900 border-emerald-300 shadow-emerald-200/20',
        btnBg: 'bg-emerald-600 text-white hover:bg-emerald-500 border-emerald-500',
        dot: 'bg-emerald-500'
      };
    case MathMagicMode.TRUE_FALSE:
      return {
        pillBg: 'bg-violet-100/90 text-violet-900 border-violet-300 shadow-violet-200/20',
        btnBg: 'bg-violet-600 text-white hover:bg-violet-500 border-violet-500',
        dot: 'bg-violet-500'
      };
    case MathMagicMode.MULTIPLICATION_FINDER:
    case MathMagicMode.ADDITION_FINDER:
    case MathMagicMode.PATTERN_SWEEPER:
      return {
        pillBg: 'bg-amber-100/90 text-amber-900 border-amber-300 shadow-amber-200/20',
        btnBg: 'bg-amber-600 text-white hover:bg-amber-500 border-amber-500',
        dot: 'bg-amber-500'
      };
    case MathMagicMode.RANDOMIZED_GRID:
      return {
        pillBg: 'bg-blue-100/90 text-blue-900 border-blue-300 shadow-blue-200/20',
        btnBg: 'bg-blue-600 text-white hover:bg-blue-500 border-blue-500',
        dot: 'bg-blue-500'
      };
    case MathMagicMode.MULTIPLE_CHOICE:
      return {
        pillBg: 'bg-indigo-100/90 text-indigo-900 border-indigo-300 shadow-indigo-200/20',
        btnBg: 'bg-[#4338ca] text-white hover:bg-[#4f46e5] border-[#4f46e5]',
        dot: 'bg-indigo-500'
      };
    case MathMagicMode.REPLACE:
      return {
        pillBg: 'bg-fuchsia-100/90 text-fuchsia-900 border-fuchsia-300 shadow-fuchsia-200/20',
        btnBg: 'bg-fuchsia-600 text-white hover:bg-fuchsia-500 border-fuchsia-500',
        dot: 'bg-fuchsia-500'
      };
    case MathMagicMode.KEYPAD:
      return {
        pillBg: 'bg-teal-100/90 text-teal-900 border-teal-300 shadow-teal-200/20',
        btnBg: 'bg-teal-600 text-white hover:bg-teal-500 border-teal-500',
        dot: 'bg-teal-500'
      };
    case MathMagicMode.REVERSE_SEEK:
    default:
      return {
        pillBg: 'bg-slate-100/90 text-slate-800 border-slate-300 shadow-slate-200/20',
        btnBg: 'bg-slate-600 text-white hover:bg-slate-500 border-slate-500',
        dot: 'bg-slate-500'
      };
  }
};

const LightSpeedTunnel = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let iframeResizeId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const numLines = 80;
    const lines = Array.from({ length: numLines }, () => {
      const angle = Math.random() * Math.PI * 2;
      return {
        x: width / 2,
        y: height / 2,
        angle,
        speed: Math.random() * 25 + 15,
        length: Math.random() * 80 + 30,
        opacity: Math.random() * 0.5 + 0.5,
        color: Math.random() > 0.82 ? '#38bdf8' : '#ffffff'
      };
    });

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(0, 0, width, height);

      lines.forEach(line => {
        ctx.beginPath();
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = line.opacity;

        const startX = line.x;
        const startY = line.y;
        const endX = line.x + Math.cos(line.angle) * line.length;
        const endY = line.y + Math.sin(line.angle) * line.length;

        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        line.x += Math.cos(line.angle) * line.speed;
        line.y += Math.sin(line.angle) * line.speed;
        line.length += 3.5;

        if (line.x < 0 || line.x > width || line.y < 0 || line.y > height) {
          line.x = width / 2;
          line.y = height / 2;
          line.angle = Math.random() * Math.PI * 2;
          line.speed = Math.random() * 25 + 15;
          line.length = Math.random() * 80 + 30;
          line.opacity = Math.random() * 0.5 + 0.5;
        }
      });

      iframeResizeId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(iframeResizeId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[150] bg-black bg-opacity-95" />;
};

export default function MathMagicGame({ onBack }: { onBack?: () => void }) {
  const {
    state,
    dispatch,
    gridRef,
    ghostRef,
    draggedId,
    hoveredId,
    gridOffset,
    slideAnimation,
    pulseTarget,
    cascadeOverlay,
    flowStateTrigger,
    theme,
    vfxQuality,
    handleVfxQualityChange,
    corruptedTileId,
    celestialWarpStep,
    elapsed,
    setGridOffset,
    handleThemeChange,
    handlePointerDown,
    cycleMode,
    refreshBoard,
    formatTime,
    activeProduct,
    activeTileFinder,
    setDraggedId,
    setHoveredId,
    setSlideAnimation,
    setPulseTarget,
    setCascadeOverlay,
    setCelestialWarpStep,
    setCorruptedTileId,
    generateTiles,
    handleSuccessCombo
  } = useGameEngine();

  const [panningState, setPanningState] = useState<{
    isPanning: boolean;
    fromOffset: { x: number; y: number };
    toOffset: { x: number; y: number };
    triggerTranslate: boolean;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const panTimersRef = useRef<{ frame: any; done: any }>({ frame: null, done: null });

  const triggerQuadrantTransition = (targetOffset: { x: number; y: number }) => {
    if (panningState?.isPanning) return;
    if (targetOffset.x === gridOffset.x && targetOffset.y === gridOffset.y) return;

    if (panTimersRef.current.frame) clearTimeout(panTimersRef.current.frame);
    if (panTimersRef.current.done) clearTimeout(panTimersRef.current.done);

    const dx = Math.sign(targetOffset.x - gridOffset.x);
    const dy = Math.sign(targetOffset.y - gridOffset.y);

    // Directly mutate CSS Variables on DOM element to completely bypass React Virtual DOM and prevent repaints
    if (containerRef.current) {
      containerRef.current.style.setProperty('--pan-x-bg', `${-dx * 3.5}vw`);
      containerRef.current.style.setProperty('--pan-y-bg', `${-dy * 3.5}vh`);
      containerRef.current.style.setProperty('--pan-x-fg', `${-dx * 120}vw`);
      containerRef.current.style.setProperty('--pan-y-fg', `${-dy * 120}vh`);
      containerRef.current.style.setProperty('--pan-transition', 'transform 430ms cubic-bezier(0.25, 1, 0.5, 1)');
    }

    setPanningState({
      isPanning: true,
      fromOffset: { x: gridOffset.x, y: gridOffset.y },
      toOffset: targetOffset,
      triggerTranslate: false
    });

    panTimersRef.current.frame = setTimeout(() => {
      setPanningState(prev => prev ? { ...prev, triggerTranslate: true } : null);
    }, 40);

    panTimersRef.current.done = setTimeout(() => {
      setGridOffset(targetOffset);
      setPanningState(null);

      // Reset CSS custom properties back to base state directly on DOM
      if (containerRef.current) {
        containerRef.current.style.setProperty('--pan-x-bg', '0px');
        containerRef.current.style.setProperty('--pan-y-bg', '0px');
        containerRef.current.style.setProperty('--pan-x-fg', '0px');
        containerRef.current.style.setProperty('--pan-y-fg', '0px');
        containerRef.current.style.setProperty('--pan-transition', 'none');
      }
    }, 460);
  };

  useEffect(() => {
    return () => {
      if (panTimersRef.current.frame) clearTimeout(panTimersRef.current.frame);
      if (panTimersRef.current.done) clearTimeout(panTimersRef.current.done);
    };
  }, []);

  const [gridSize, setGridSize] = useState({ tsz: 64, hs: 32, gap: 7, gpadH: 10, gpadV: 10 });

  useEffect(() => {
    const calc = () => {
      const hudH = document.getElementById('hud-container')?.offsetHeight || 50;
      const ctrlH = document.getElementById('bottom-controls')?.offsetHeight || 72;
      
      const bottomPadding = 4;
      const gpadV = 4;
      const isMobile = window.innerWidth < 600;
      const gap = isMobile ? 4 : 8;
      const maxHdr = isMobile ? 18 : 32;
      
      const availW = Math.min(window.innerWidth - 8, 896);
      const availH = window.innerHeight - hudH - ctrlH - bottomPadding;
      
      const cols = 6;
      const rows = 6;
      const th = Math.floor((availH - 2 * gpadV - maxHdr - rows * gap) / rows);
      const tw = Math.floor((availW - 8 - maxHdr - cols * gap) / cols);
      
      const isTabletOrLarger = window.innerWidth >= 768;
      const thAdjusted = isTabletOrLarger ? th - 10 : th;
      const twAdjusted = isTabletOrLarger ? tw - 10 : tw;
      const MAX_TILE_SIZE = isTabletOrLarger ? 130 : 100;
      const sz = Math.max(28, Math.min(twAdjusted, thAdjusted, MAX_TILE_SIZE));
      const hs = Math.max(12, Math.min(maxHdr, Math.round(sz * 0.4)));
      
      let gpadH = Math.floor((availW - hs - cols * sz - (cols - 1) * gap) / 2);
      gpadH = Math.max(4, gpadH);

      setGridSize({ tsz: sz, hs, gap, gpadH, gpadV });
    };

    const timer = setTimeout(calc, 50); // slight delay to ensure elements are rendered
    window.addEventListener('resize', calc);
    return () => {
      window.removeEventListener('resize', calc);
      clearTimeout(timer);
    };
  }, [state.mode]);



  const draggedContextTile = state.tiles.find(t => t.id === draggedId) || null;
  const pillStyle = getModePillStyle(state.mode, theme);

  // Styling token overrides for --tile-size etc.
  const cssVars = {
    '--tile-size': `${gridSize.tsz}px`,
    '--hdr-size': `${gridSize.hs}px`,
    '--gap': `${gridSize.gap}px`,
    '--gpad': `${gridSize.gpadV}px ${gridSize.gpadH}px`
  } as React.CSSProperties;

  const isPanning = !!panningState;

  const renderGrid = (ox: number, oy: number, isInteractive: boolean, hasRef: boolean = false) => {
    return (
      <div 
        key={`grid-${ox}-${oy}`}
        ref={hasRef ? gridRef : undefined}
        className="grid bg-transparent border border-[#e6dbb8]/30 rounded-none shadow-[0_20px_60px_rgba(61,43,31,0.08)] gap-[var(--gap)] p-2 sm:p-4 shrink-0 relative z-10"
        style={{
          gridTemplateColumns: 'var(--hdr-size) repeat(6, var(--tile-size))',
          gridTemplateRows: 'var(--hdr-size) repeat(6, var(--tile-size))'
        }}
      >
        {/* Headers */}
        <div style={{ gridColumn: 1, gridRow: 1 }} />
        {Array.from({ length: 6 }).map((_, x) => {
          const logicalX = x + ox;
          return (
            <div key={`col-${x}`} id={`hdr-col-${logicalX}`}
              className={`flex items-center justify-center font-black transition-all md:pt-3 md:pb-1 ${
                state.config.guides && draggedId && state.tiles.find(t => t.id === draggedId)?.homeX === logicalX && (state.mode === MathMagicMode.DRAG_DROP)
                ? 'bg-[#8ec5ae]/20 text-[#4a8a72] rounded-none' : ''
              }`}
              style={{
                gridColumn: x + 2, gridRow: 1,
                color: `hsl(${188 + ((logicalX * 6) % 22)}, 38%, ${70 + logicalX % 5}%)`,
                fontSize: `calc(var(--hdr-size) * 0.4 * ${GUIDE_FONT_SCALE})`,
              }}
            >
              {state.config.activeFactors[logicalX % state.config.activeFactors.length]}
            </div>
          );
        })}
        {Array.from({ length: 6 }).map((_, y) => {
          const logicalY = y + oy;
          return (
            <div key={`row-${y}`} id={`hdr-row-${logicalY}`}
              className={`flex items-center justify-center font-black transition-all ${
                state.config.guides && draggedId && state.tiles.find(t => t.id === draggedId)?.homeY === logicalY && (state.mode === MathMagicMode.DRAG_DROP)
                ? 'bg-[#a8a6cf]/20 text-[#626098] rounded-none' : ''
              }`}
              style={{
                gridColumn: 1, gridRow: y + 2,
                color: `hsl(${188 + ((logicalY * 4) % 22)}, 38%, ${70 + logicalY % 5}%)`,
                fontSize: `calc(var(--hdr-size) * 0.4 * ${GUIDE_FONT_SCALE})`,
              }}
            >
              {logicalY + state.config.startRow}
            </div>
          );
        })}

        {/* Tiles */}
        {state.tiles.map(tile => {
          const displayX = tile.currentX - ox;
          const displayY = tile.currentY - oy;
          const isVisible = displayX >= 0 && displayX < 6 && displayY >= 0 && displayY < 6;
          if (!isVisible) return null;
          return (
            <Tile
              key={`${ox}_${oy}_${tile.id}`}
              tile={tile}
              displayX={displayX}
              displayY={displayY}
              mode={state.mode}
              isDragged={draggedId === tile.id}
              isDropTarget={hoveredId === tile.id}
              onPointerDown={isInteractive ? handlePointerDown : undefined}
              theme={theme}
              isCorrupted={corruptedTileId === tile.id}
              celestialWarpStep={celestialWarpStep}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`relative z-[0] theme-${theme} theme-transition w-full h-[100dvh] flex flex-col items-center text-[var(--text-main)] overflow-hidden select-none touch-none`} 
      style={{ 
        WebkitUserSelect: 'none', 
        WebkitTouchCallout: 'none', 
        userSelect: 'none'
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <VFXOverlay activeTheme={theme} vfxQuality={vfxQuality} />

      {/* Background Parallax Layer 1 (Distant Backdrop) */}
      <div 
        className="absolute inset-0 theme-bg-gradient z-[-100] pointer-events-none"
      />
      {theme === 'glitch-wave' && (
        <div className="pointer-events-none fixed inset-0 z-[9999] opacity-[0.06] animate-scanlines" />
      )}

      {theme === 'celestial-orbit' && celestialWarpStep === 'tunnel' && (
        <LightSpeedTunnel />
      )}
      <style>{`
        .theme-transition {
          --pan-x-bg: 0px;
          --pan-y-bg: 0px;
          --pan-x-fg: 0px;
          --pan-y-fg: 0px;
          --pan-transition: none;
        }
        .pan-transition {
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes shineSweep {
          0% { left: -100%; }
          20% { left: 200%; }
          100% { left: 200%; }
        }
        @keyframes sandPulse {
          0%, 100% { box-shadow: 0 0 14px rgba(180,130,20,0.20), inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 0 rgba(120,53,15,0.20); }
          50% { box-shadow: 0 0 28px rgba(180,130,20,0.38), inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 0 rgba(120,53,15,0.20); }
        }
        @keyframes slideInRight {
          from { transform: translate3d(50px, 0, 0); opacity: 0; }
          to { transform: translate3d(0, 0, 0); opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translate3d(-50px, 0, 0); opacity: 0; }
          to { transform: translate3d(0, 0, 0); opacity: 1; }
        }
        @keyframes slideInDown {
          from { transform: translate3d(0, 50px, 0); opacity: 0; }
          to { transform: translate3d(0, 0, 0); opacity: 1; }
        }
        @keyframes slideInUp {
          from { transform: translate3d(0, -50px, 0); opacity: 0; }
          to { transform: translate3d(0, 0, 0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInRight 250ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          backface-visibility: hidden;
          will-change: transform, opacity;
        }
        .animate-slide-in-left {
          animation: slideInLeft 250ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          backface-visibility: hidden;
          will-change: transform, opacity;
        }
        .animate-slide-in-down {
          animation: slideInDown 250ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          backface-visibility: hidden;
          will-change: transform, opacity;
        }
        .animate-slide-in-up {
          animation: slideInUp 250ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          backface-visibility: hidden;
          will-change: transform, opacity;
        }
        @keyframes targetPopGlow {
          0% { transform: scale(1); box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); background-color: white; }
          40% { transform: scale(1.15); box-shadow: 0 0 25px 8px rgba(74, 222, 128, 0.5); background-color: #dcfce7; }
          100% { transform: scale(1); box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); background-color: white; }
        }
        .animate-target-pop {
          animation: targetPopGlow 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes cascadeSweep {
          to { transform: rotate(45deg) translateX(100%); }
        }
        @keyframes flowStateRise {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          20% { transform: translate(-50%, -90%) scale(1.1); opacity: 1; }
          40% { transform: translate(-50%, -100%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -200%) scale(1.2); opacity: 0; }
        }
        @keyframes cinnamorollFloat {
          0%, 100% { transform: translateY(0px) scale(1); filter: drop-shadow(0 2px 4px rgba(23, 58, 100, 0.05)); }
          50% { transform: translateY(-4px) scale(1.02); filter: drop-shadow(0 6px 12px rgba(23, 58, 100, 0.12)); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div 
        className="w-full max-w-full md:max-w-3xl lg:max-w-4xl mx-auto flex flex-col flex-1 pb-2 sm:pb-4 min-h-0"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Upper Area: Meta-Data HUD */}
        <div id="hud-container" className="shrink-0 w-full px-4 pt-4 pb-2 sm:pt-6 sm:pb-3 bg-[var(--hud-bg)] backdrop-blur-sm border-b border-[var(--border-color)] flex justify-between items-center z-10">
          <div className="flex items-center gap-3 sm:gap-4">
            {(state.mode === MathMagicMode.REVERSE_SEEK || state.mode === MathMagicMode.MULTIPLICATION_FINDER || state.mode === MathMagicMode.ADDITION_FINDER || state.mode === MathMagicMode.PATTERN_SWEEPER) && (() => {
              const qKey = `${gridOffset.x},${gridOffset.y}`;
              const activePattern = state.activePatterns?.[qKey];
              const label = state.mode === MathMagicMode.PATTERN_SWEEPER ? (activePattern ? `${Math.max(0, activePattern.targetCount - activePattern.foundIds.length)} REMAINING` : 'RULE') : 'Target';
              const displayVal = state.mode === MathMagicMode.PATTERN_SWEEPER ? (
                activePattern ? activePattern.description.toUpperCase() : '--'
              ) : (
                state.mode === MathMagicMode.REVERSE_SEEK ? (activeProduct ?? '--') : (
                   state.mode === MathMagicMode.MULTIPLICATION_FINDER ? 
                      (activeTileFinder ? `${activeTileFinder.f1} × ${activeTileFinder.f2} = ?` : '-- × -- = ?') :
                      (activeTileFinder ? `${activeTileFinder.f1} + ${activeTileFinder.f2} = ?` : '-- + -- = ?')
                )
              );

              if (theme === 'cinnamoroll') {
                return (
                  /* Elegant Cinnamoroll Cloud Medallion Coin */
                  <div 
                    className={`relative flex items-center justify-center px-4 py-1 mr-2 ${pulseTarget ? 'animate-target-pop' : ''}`} 
                    style={{ animation: 'cinnamorollFloat 3s ease-in-out infinite' }}
                  >
                    {/* Left Side Puff Winglet */}
                    <div className="absolute left-[-6px] w-[14px] h-3 bg-[#DDF3FF] rounded-full opacity-90 filter blur-[0.5px]" />
                    {/* Right Side Puff Winglet */}
                    <div className="absolute right-[-6px] w-[14px] h-3 bg-[#DDF3FF] rounded-full opacity-90 filter blur-[0.5px]" />
                    {/* Central Soft Cloud Medallion */}
                    <div className="relative bg-white border border-[#BAD9EA] rounded-full px-3 py-0.5 flex flex-col items-center justify-center shadow-sm select-none z-10">
                      <span className="text-[7px] sm:text-[7.5px] font-extrabold uppercase tracking-widest text-[#53759E] leading-tight">
                        {label}
                      </span>
                      <span className="text-sm sm:text-base font-black text-[#173A64] leading-none tracking-tight whitespace-nowrap">
                        {displayVal}
                      </span>
                    </div>
                  </div>
                );
              }

              if (theme === 'kuromi') {
                return (
                  /* Sharp, Mischievous Gothic Medallion */
                  <div 
                    className={`relative bg-[#7e22ce] border-2 border-[#ec4899] px-3.5 py-1 mr-2 flex flex-col items-center justify-center shadow-[0_4px_12px_rgba(236,72,153,0.15)] select-none z-10 ${pulseTarget ? 'animate-target-pop' : ''}`} 
                    style={{ borderRadius: '0px' }}
                  >
                    <span className="text-[7px] sm:text-[7.5px] font-extrabold uppercase tracking-widest text-[#ec4899] leading-tight">
                      {label}
                    </span>
                    <span className="text-sm sm:text-base font-black text-white leading-none tracking-tight whitespace-nowrap">
                      {displayVal}
                    </span>
                  </div>
                );
              }

              return (
                <div className={`bg-[var(--target-box-bg)] rounded shadow-sm border border-[var(--target-box-border)] px-2 py-0.5 flex flex-col items-center justify-center ${pulseTarget ? 'animate-target-pop' : ''}`}>
                  <span className="text-[7px] sm:text-[7.5px] font-bold uppercase tracking-widest text-[var(--text-muted)] leading-tight">
                    {label}
                  </span>
                  <span className="text-base sm:text-lg font-black text-[var(--text-primary)] leading-none whitespace-nowrap">
                    {displayVal}
                  </span>
                </div>
              );
            })()}
            <div className="flex flex-col">
              <span className="font-bold text-[var(--text-muted)] tracking-widest uppercase text-[9px] sm:text-[10px] leading-tight">Active Quadrant</span>
              <span className="font-mono text-base sm:text-lg font-black text-[var(--text-primary)] leading-tight">
                {gridOffset.x + 1}–{gridOffset.x + 6} × {gridOffset.y + state.config.startRow}–{gridOffset.y + 5 + state.config.startRow}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex flex-col items-end">
              <span className="font-bold text-[var(--text-muted)] tracking-widest uppercase text-[9px] sm:text-[10px] leading-tight">Stars</span>
              <span className="font-mono text-base sm:text-lg font-black text-amber-500 tracking-tight leading-tight flex items-center gap-1">
                ⭐ {state.totalStars}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-bold text-[var(--text-muted)] tracking-widest uppercase text-[9px] sm:text-[10px] leading-tight">Time</span>
              <span className="font-mono text-base sm:text-lg font-black text-[#8ec5ae] tracking-tight leading-tight">{formatTime(elapsed)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-bold text-[var(--text-muted)] tracking-widest uppercase text-[9px] sm:text-[10px] leading-tight">SCORE</span>
              <span className="font-mono text-base sm:text-lg font-black text-[var(--active-marker)] tracking-tight leading-tight">{state.score}/{state.tiles.length}</span>
            </div>
          </div>
        </div>
        
        {/* Arena */}
        <div 
          className="flex-1 min-h-0 flex flex-col justify-center items-center relative z-0 w-full overflow-hidden md:overflow-visible" 
          style={cssVars}
        >
          {cascadeOverlay && (
             <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden">
                 {theme === 'stage-dive' ? (
                   <>
                     <div 
                        className="w-[200%] h-[200%] absolute top-[-50%] left-[-50%] bg-gradient-to-r from-transparent via-[#06b6d4]/40 to-transparent mix-blend-screen shadow-[0_0_20px_#06b6d4]"
                        style={{
                            transform: 'rotate(45deg) translateX(-100%)',
                            animation: 'cascadeSweep 0.8s ease-in-out forwards'
                        }}
                     />
                     <div 
                        className="w-[200%] h-[200%] absolute top-[-50%] left-[-50%] bg-gradient-to-b from-transparent via-[#d946ef]/40 to-transparent mix-blend-screen shadow-[0_0_20px_#d946ef]"
                        style={{
                            transform: 'rotate(-45deg) translateY(-100%)',
                            animation: 'cascadeSweep 0.8s ease-in-out forwards 0.2s'
                        }}
                     />
                   </>
                 ) : theme === 'kuromi' ? (
                   <>
                     <div 
                        className="w-[200%] h-[200%] absolute top-[-50%] left-[-50%] bg-gradient-to-r from-transparent via-[#ec4899]/50 to-transparent mix-blend-screen shadow-[0_0_35px_#ec4899]"
                        style={{
                            transform: 'rotate(45deg) translateX(-100%)',
                            animation: 'cascadeSweep 0.5s cubic-bezier(0.15, 0.85, 0.35, 1) forwards'
                        }}
                     />
                     <div 
                        className="w-[200%] h-[200%] absolute top-[20%] left-[-50%] bg-gradient-to-r from-transparent via-[#7e22ce]/50 to-transparent mix-blend-screen shadow-[0_0_35px_#7e22ce]"
                        style={{
                            transform: 'rotate(-45deg) translateX(100%)',
                            animation: 'cascadeSweep 0.5s cubic-bezier(0.15, 0.85, 0.35, 1) forwards 0.15s'
                        }}
                     />
                   </>
                 ) : (
                     <div 
                        className="w-[200%] h-[200%] absolute top-[-50%] left-[-50%] bg-gradient-to-r from-transparent via-amber-200/50 to-transparent mix-blend-overlay"
                        style={{
                            transform: 'rotate(45deg) translateX(-100%)',
                            animation: 'cascadeSweep 1s ease-in-out forwards'
                        }}
                     />
                 )}
             </div>
          )}
          {flowStateTrigger && (
             <div 
               className="fixed z-50 pointer-events-none drop-shadow-2xl whitespace-nowrap"
               style={{
                 left: flowStateTrigger.x,
                 top: flowStateTrigger.y,
                 transform: 'translate(-50%, -50%)',
                 animation: 'flowStateRise 1.5s ease-out forwards'
               }}
             >
                <div className="text-4xl md:text-5xl lg:text-7xl font-black italic tracking-tighter" style={{ color: flowStateTrigger.color, WebkitTextStroke: '2px #3d2b1f' }}>
                   UNSTOPPABLE!
                </div>
             </div>
          )}
          {state.comboCount >= 10 && (
            <div className="mb-4 shrink-0 animate-bounce">
              <span className="unstoppable-banner text-xl sm:text-2xl font-black italic tracking-widest text-[var(--text-main)] uppercase px-4 py-2 bg-[var(--grid-bg)] border-2 border-[var(--border-color)] rounded-none select-none" style={{ boxShadow: '4px 4px 0 var(--border-color)' }}>
                🔥 UNSTOPPABLE 🔥
              </span>
            </div>
          )}
          {(!panningState || !panningState.isPanning) ? (
            renderGrid(gridOffset.x, gridOffset.y, true, true)
          ) : (() => {
            const dx = Math.sign(panningState.toOffset.x - panningState.fromOffset.x);
            const dy = Math.sign(panningState.toOffset.y - panningState.fromOffset.y);
            return (
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                <div 
                  className="relative flex items-center justify-center"
                  style={{
                    width: '100%',
                    height: '100%',
                    transition: 'transform 430ms cubic-bezier(0.16, 1, 0.3, 1)',
                    transform: panningState.triggerTranslate ? `translate3d(${-dx * 100}%, ${-dy * 100}%, 0)` : 'translate3d(0, 0, 0)'
                  }}
                >
                  {/* Outgoing Grid */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {renderGrid(panningState.fromOffset.x, panningState.fromOffset.y, false, false)}
                  </div>
                  {/* Incoming Grid */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      transform: `translate3d(${dx * 100}%, ${dy * 100}%, 0)`
                    }}
                  >
                    {renderGrid(panningState.toOffset.x, panningState.toOffset.y, false, false)}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Lower Area: Minimalist Mode Indicator (Overhauled Bulbous Tube/Bowl Style with Unified Hit-Area) */}
        <div className="w-full flex justify-center my-4 sm:my-5">
           <button 
              onClick={() => {
                SensoryManager.dispatch(SensoryEvent.ON_MODAL_OPEN, undefined);
                dispatch({ type: 'OPEN_INFO' });
              }}
              className="relative flex items-center h-16 cursor-pointer select-none active:scale-95 active:brightness-95 hover:brightness-105 hover:scale-102 transition-all duration-150 group"
              title="Instructional Tooltip & Mode Rules"
           >
             {/* The "Tube" (Pill Container) */}
             <div className={`flex items-center pl-6 pr-16 h-12 sm:h-14 rounded-full border shadow-lg transition-all duration-300 ${pillStyle.pillBg}`}>
               <span className={`w-3 h-3 rounded-full mr-3 animate-pulse ${pillStyle.dot}`}></span>
               <span className="font-extrabold uppercase tracking-widest text-xs sm:text-sm">
                  Mode: {state.mode.replace(/_/g, ' ')}
               </span>
             </div>
             
             {/* The "Bowl" (? Info Indicator) */}
             <div 
                className={`absolute right-[-14px] flex items-center justify-center w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 shadow-xl transition-all duration-300 ${pillStyle.btnBg}`}
                style={{ zIndex: 10 }}
              >
                <span className="text-2xl sm:text-3xl font-black font-sans leading-none">?</span>
             </div>
           </button>
        </div>

        {/* Ultra-Fat-Finger Bottom Bar */}
        <div id="bottom-controls" className="w-full flex justify-center items-center z-10 gap-2 sm:gap-6 max-w-full md:max-w-3xl mx-auto pb-4 px-2">
          <button 
            disabled={draggedId !== null}
            className={`${MM_CONTROL} w-14 h-14 sm:w-20 sm:h-20 shrink-0 rounded-2xl`}
            onClick={() => {
              SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined);
              onBack?.();
            }}
          >
            <Home size={28} className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          {/* Quadrant Selector */}
          <div className="relative w-16 h-16 sm:w-24 sm:h-24 shrink-0 mx-2 z-20">
            <div className="absolute inset-x-0 bottom-0 top-0 grid grid-cols-2 gap-1 bg-[#fefbf0] border-2 border-[#e6dbb8] p-1.5 shadow-lg rounded-xl overflow-hidden scale-[1.2] origin-bottom">
              <button 
                disabled={draggedId !== null || isPanning}
                onClick={() => { SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined); triggerQuadrantTransition({ x: 0, y: 0 }); }}
                className={`rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${gridOffset.x === 0 && gridOffset.y === 0 ? 'bg-[#b07d5a]' : 'bg-[#e6dbb8]/40 hover:bg-[#e6dbb8]'}`}
              />
              <button 
                disabled={draggedId !== null || isPanning}
                onClick={() => { SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined); triggerQuadrantTransition({ x: 6, y: 0 }); }}
                className={`rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${gridOffset.x === 6 && gridOffset.y === 0 ? 'bg-[#b07d5a]' : 'bg-[#e6dbb8]/40 hover:bg-[#e6dbb8]'}`}
              />
              <button 
                disabled={draggedId !== null || isPanning}
                onClick={() => { SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined); triggerQuadrantTransition({ x: 0, y: 6 }); }}
                className={`rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${gridOffset.x === 0 && gridOffset.y === 6 ? 'bg-[#b07d5a]' : 'bg-[#e6dbb8]/40 hover:bg-[#e6dbb8]'}`}
              />
              <button 
                disabled={draggedId !== null || isPanning}
                onClick={() => { SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined); triggerQuadrantTransition({ x: 6, y: 6 }); }}
                className={`rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${gridOffset.x === 6 && gridOffset.y === 6 ? 'bg-[#b07d5a]' : 'bg-[#e6dbb8]/40 hover:bg-[#e6dbb8]'}`}
              />
            </div>
          </div>
          
          <button 
            disabled={draggedId !== null || isPanning}
            className={`${MM_CONTROL} w-14 h-14 sm:w-20 sm:h-20 shrink-0 rounded-2xl`}
            onClick={refreshBoard}
          >
            <RefreshCw size={28} className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          {/* Mode Cycler */}
          <button 
            disabled={draggedId !== null || isPanning}
            onClick={() => {
              SensoryManager.dispatch(SensoryEvent.ON_BUTTON_CLICK, undefined);
              cycleMode(1);
            }}
            className={`${MM_CONTROL} w-14 h-14 sm:w-20 sm:h-20 shrink-0 rounded-2xl`}
          >
            {state.mode === MathMagicMode.DRAG_DROP && <Grid3X3 size={28} className="w-6 h-6 sm:w-8 sm:h-8" />}
            {state.mode === MathMagicMode.RANDOMIZED_GRID && <Shuffle size={28} className="w-6 h-6 sm:w-8 sm:h-8" />}
            {state.mode === MathMagicMode.KEYPAD && <Calculator size={28} className="w-6 h-6 sm:w-8 sm:h-8" />}
            {state.mode === MathMagicMode.MULTIPLE_CHOICE && <ListOrdered size={28} className="w-6 h-6 sm:w-8 sm:h-8" />}
            {state.mode === MathMagicMode.REPLACE && <Shapes size={28} className="w-6 h-6 sm:w-8 sm:h-8" />}
            {state.mode === MathMagicMode.REVERSE_SEEK && <Music size={28} className="w-6 h-6 sm:w-8 sm:h-8" />}
            {state.mode === MathMagicMode.TRUE_FALSE && <Calculator size={28} className="w-6 h-6 sm:w-8 sm:h-8" />}
            {state.mode === MathMagicMode.MULTIPLICATION_FINDER && <Search size={28} className="w-6 h-6 sm:w-8 sm:h-8" />}
            {state.mode === MathMagicMode.ADDITION_FINDER && <Search size={28} className="w-6 h-6 sm:w-8 sm:h-8" />}
            {state.mode === MathMagicMode.PATTERN_SWEEPER && <Filter size={28} className="w-6 h-6 sm:w-8 sm:h-8" />}
          </button>

          <button 
            disabled={draggedId !== null}
            onClick={() => {
              SensoryManager.dispatch(SensoryEvent.ON_MODAL_OPEN, undefined);
              dispatch({ type: 'OPEN_SETTINGS' });
            }}
            className={`${MM_CONTROL} w-14 h-14 sm:w-20 sm:h-20 shrink-0 rounded-2xl`}
          >
            <Settings size={28} className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        </div>
      </div>
      
      {/* Info Modal */}
      {state.isInfoOpen && (
        <div 
          className="fixed inset-0 bg-[#3d2b1f]/60 backdrop-blur-sm z-[2200] flex items-center justify-center p-4"
          onClick={() => {
            SensoryManager.dispatch(SensoryEvent.ON_MODAL_CLOSE, undefined);
            dispatch({ type: 'CLOSE_INFO' });
          }}
        >
          <div 
            className={`${MM_GLASS} p-0 max-w-xl sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-orange-200/50 shadow-2xl`}
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[#a8a6cf] p-6 flex items-center justify-between">
               <h3 className="text-xl sm:text-2xl font-black flex items-center gap-3 text-white uppercase tracking-widest">
                <Info size={24} />
                Instructional Tooltip
              </h3>
              <button 
                onClick={() => {
                  SensoryManager.dispatch(SensoryEvent.ON_MODAL_CLOSE, undefined);
                  dispatch({ type: 'CLOSE_INFO' });
                }}
                className="text-white/80 hover:text-white"
              >
                <ChevronLeft className="-rotate-90 w-8 h-8" />
              </button>
            </div>
            <div className="p-8 sm:p-10">
              <div className="bg-[#f5eedc] border-l-8 border-[#a8a6cf] p-6 rounded mb-6">
                <p className="text-xl sm:text-2xl font-black text-[#3d2b1f] leading-relaxed">
                  {ModeRegistry[state.mode].instructions}
                </p>
              </div>
              <p className="text-base sm:text-lg text-[#8a7968] font-bold leading-relaxed uppercase tracking-wide opacity-95">
                Explore the grid to solve multiplication problems. Complete the entire board to win your golden trophy!
              </p>
              <button 
                onClick={() => {
                  SensoryManager.dispatch(SensoryEvent.ON_MODAL_CLOSE, undefined);
                  dispatch({ type: 'CLOSE_INFO' });
                }}
                className="w-full mt-8 py-5 bg-[#3d2b1f] text-white font-black rounded-xl hover:bg-[#5a4030] transition-colors uppercase tracking-widest text-base sm:text-lg"
              >
                Return to Game
              </button>
            </div>
          </div>
        </div>
      )}

      <InteractionGhost tile={draggedContextTile} mode={state.mode} theme={theme} ghostRef={ghostRef} />
      
      {state.phase === MathMagicPhase.MODAL_ACTIVE && (
          <MathMagicModal 
             state={state}
             onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
             onResolve={(id, submittedValue) => {
                // Ensure coordinates passed to the state update include the current gridOffset (logicalX = visualX + gridOffset.x)
                let targetId = id;
                const match = id.match(/^T(\d+)_(\d+)$/);
                if (match) {
                   const rx = parseInt(match[1], 10);
                   const ry = parseInt(match[2], 10);
                   // Ensure fallback compatibility if logical coordinates were already provided
                   const logicalX = rx < 6 ? rx + gridOffset.x : rx;
                   const logicalY = ry < 6 ? ry + gridOffset.y : ry;
                   targetId = `T${logicalX}_${logicalY}`;
                }

                const strategy = ModeRegistry[state.mode];
                if (strategy) {
                       const isValid = strategy.validate(state, { tapId: targetId, submittedValue });
                       if (isValid) {
                           const sourceTile = state.tiles.find(t => t.id === targetId);
                           if (sourceTile) {
                             setTimeout(() => {
                               const sourceRect = document.querySelector(`[data-id="${targetId}"]`)?.getBoundingClientRect();
                               const cx = sourceRect ? sourceRect.left + sourceRect.width/2 : undefined;
                               const cy = sourceRect ? sourceRect.top + sourceRect.height/2 : undefined;
                               handleSuccessCombo(targetId, sourceRect || null, sourceTile.f1, sourceTile.f2, sourceTile.product, sourceTile.color, cx, cy);
                             }, 50);
                           } else {
                               handleSuccessCombo(targetId, null, 1, 1, 1, '#FFF', undefined, undefined); 
                           }
                       } else {
                           SensoryManager.dispatch(SensoryEvent.ON_MATCH_FAIL, {});
                           dispatch({ type: 'ERROR_COMBO_RESET' });
                           dispatch({ type: 'CLOSE_MODAL' });
                       }
                } else {
                    dispatch({ type: 'CLOSE_MODAL' });
                }
             }}
          />
       )}
       


         {state.isSettingsOpen && (
         <MathMagicSettings
           state={state}
           onClose={() => dispatch({ type: 'CLOSE_SETTINGS' })}
            activeTheme={theme}
             vfxQuality={vfxQuality}
             onVfxQualityChange={handleVfxQualityChange}
            onThemeChange={handleThemeChange}
           onApply={(mode, config) => {
              const newTiles = generateTiles(mode, config);
              dispatch({ type: 'REBUILD_GRID', mode, config, tiles: newTiles });
           }}
         />
       )}
       
       {state.phase === MathMagicPhase.SUMMARY && (theme !== 'celestial-orbit' || celestialWarpStep === 'done') && (
         <SessionSummary state={state} dispatch={dispatch} onPlayAgain={refreshBoard} />
       )}
    </div>
  );
}