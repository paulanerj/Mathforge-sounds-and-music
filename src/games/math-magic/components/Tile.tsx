────────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { MathMagicTile, MathMagicMode } from '../types';
import { MousePointer2, Pointer } from 'lucide-react';
import { PremiumTrophy } from './PremiumTrophy';

interface TileProps {
  tile: MathMagicTile;
  displayX: number;
  displayY: number;
  mode: MathMagicMode;
  isDragged: boolean;
  isDropTarget: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>, tileId: string) => void;
  theme?: string;
  isCorrupted?: boolean;
  celestialWarpStep?: 'idle' | 'align' | 'warp' | 'tunnel' | 'done';
}

export const Tile = React.memo(({ tile, displayX, displayY, mode, isDragged, isDropTarget, onPointerDown, theme, isCorrupted, celestialWarpStep }: TileProps) => {
  const isLocked = tile.state === 'locked';
  const isGlitchWave = theme === 'glitch-wave';
  const isCelestial = theme === 'celestial-orbit';
  const isDeepSea = theme === 'deep-sea';
  
  // Decide if this grid tile is interactable.
  const isGridInteractable = !isLocked;

  const isEven = (displayX + displayY) % 2 === 0;

  const classNames = [
    "tile touch-none border-b-[3px]",
    isLocked
      ? "is-locked !bg-transparent cursor-default pointer-events-none"
      : "tile-active border-[rgba(255,255,255,0.1)] text-[#3d2b1f]",
    isGridInteractable ? "cursor-pointer" : "cursor-default",
    !isLocked && !isDragged && isGridInteractable && "hover:-translate-y-[2px] hover:scale-105 hover:shadow-[0_8px_20px_rgba(61,43,31,0.18)] active:-translate-y-[0px] active:scale-[0.96] active:border-b-0 active:mt-[3px] active:shadow-[inset_0_4px_12px_rgba(0,0,0,0.18)]",
    isDragged && "opacity-25 scale-[0.86]",
    isDropTarget && "scale-[1.35] -translate-y-[6px] z-20 shadow-[0_0_0_2px_#fefbf0,0_0_0_4px_#8ec5ae,0_10px_28px_rgba(142,197,174,0.35)]"
  ].filter(Boolean).join(" ");

  const getRandomCorruptStr = () => {
    const chars = ['&', '#', '$', '%', '@', '!'];
    return Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const [rezzingState, setRezzingState] = React.useState<'idle' | 'dissolving' | 'rezzed'>('idle');

  React.useEffect(() => {
    if (isLocked) {
      if (isGlitchWave) {
        setRezzingState('dissolving');
        const timer = setTimeout(() => {
          setRezzingState('rezzed');
        }, 350);
        return () => clearTimeout(timer);
      } else {
        setRezzingState('rezzed');
      }
    } else {
      setRezzingState('idle');
    }
  }, [isLocked, isGlitchWave]);

  const renderFace = () => {
    if (isCorrupted) {
      return (
        <div className="flex flex-col items-center">
          <span 
            className="text-[calc(var(--tile-size)*0.4)] font-mono leading-none text-[#00ff00] pointer-events-none font-black text-center"
            style={{ textShadow: '-1.5px 0 #ff00ff, 1.5px 0 #00ffff' }}
          >
            {getRandomCorruptStr()}
          </span>
        </div>
      );
    }

    if (mode === MathMagicMode.RANDOMIZED_GRID || mode === MathMagicMode.MULTIPLICATION_FINDER || mode === MathMagicMode.ADDITION_FINDER || mode === MathMagicMode.PATTERN_SWEEPER) {
      return (
        <div className="flex flex-col items-center">
          <span 
            className="text-[calc(var(--tile-size)*0.38)] leading-none text-current pointer-events-none text-center flex items-center justify-center font-black"
            style={{ textShadow: isGlitchWave ? '0 0 10px rgba(34,211,238,0.8)' : '0 1px 3px rgba(255,255,255,0.5), 0 0 6px rgba(255,255,255,0.3)' }}
          >
            {tile.product}
          </span>
        </div>
      );
    }
    return mode === MathMagicMode.DRAG_DROP ? (
      <MousePointer2 className="w-[1.4em] h-[1.4em] opacity-65 pointer-events-none fill-current stroke-current" />
    ) : (
      <Pointer className="w-[1.5em] h-[1.5em] opacity-65 pointer-events-none fill-current stroke-current" />
    );
  };

  let currentStyle: React.CSSProperties = isLocked
    ? {
        borderColor: 'var(--tile-locked-border, rgba(120,53,15,0.2))',
        borderBottom: 'var(--tile-locked-border-bottom, 4px solid rgba(120,53,15,0.2))',
        boxShadow: 'var(--tile-locked-shadow, 0 0 22px rgba(251,191,36,0.3), inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 0 rgba(120,53,15,0.2))',
        borderRadius: 'var(--tile-locked-radius, 0px)',
        color: 'var(--tile-locked-color, #451a03)',
        animation: 'var(--tile-locked-animation, sandPulse 3s ease-in-out infinite)',
      }
    : {
        borderColor: 'var(--tile-active-border, rgba(61,43,31,0.16))',
        borderBottom: 'var(--tile-active-border-bottom, 3.5px solid rgba(61,43,31,0.16))',
        boxShadow: 'var(--tile-active-shadow, 0 4px 0 rgba(0,0,0,0.18))',
        borderRadius: 'var(--tile-active-radius, 0px)',
        color: 'var(--tile-active-color, #3d2b1f)',
      };

  if (isCelestial && celestialWarpStep && celestialWarpStep !== 'idle') {
    if (celestialWarpStep === 'align') {
      currentStyle = {
        ...currentStyle,
        transform: 'rotate(0deg) scale(0.98)',
        transition: 'transform 1s cubic-bezier(0.1, 0.8, 0.2, 1)',
      };
    } else if (celestialWarpStep === 'warp') {
      currentStyle = {
        ...currentStyle,
        transform: 'scaleY(65) scaleX(0.012) translateY(-120px)',
        clipPath: 'polygon(45% 0%, 55% 0%, 55% 100%, 45% 100%)',
        backgroundColor: '#ffffff',
        backgroundImage: 'none',
        borderColor: '#ffffff',
        boxShadow: '0 0 50px #ffffff, 0 0 100px #38bdf8',
        opacity: 0,
        transition: 'transform 1.2s cubic-bezier(0.8, 0, 1, 1), opacity 1.1s ease-in, background-color 0.4s ease',
      };
    }
  }

  return (
    <div
      data-id={tile.id}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        if (!isGridInteractable && !isDropTarget) return;
        const isDragMode = mode === MathMagicMode.DRAG_DROP || mode === MathMagicMode.RANDOMIZED_GRID;
        if (!isDragMode) {
          e.stopPropagation();
        } else {
          e.preventDefault();
        }
        onPointerDown(e, tile.id);
      }}
      className={`relative w-full h-full flex items-center justify-center rounded-none overflow-hidden border border-white/20 transition-all duration-150 ${classNames}`}
      style={{
        gridColumn: displayX + 2,
        gridRow: displayY + 2,
        ...currentStyle
      }}
    >
      {/* The Frosted Glass Background */}
      <div className="absolute inset-0 z-0 backdrop-blur-md bg-white/10 dark:bg-black/20 rounded-none pointer-events-none" />
      
      {/* Dynamic Background Overlays (Deep Sea, Glitch, etc.) */}
      {isDeepSea && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-40 select-none bg-[linear-gradient(45deg,rgba(20,184,166,0.1),rgba(34,211,238,0.25),rgba(20,184,166,0.1))] bg-[length:200%_200%] animate-causticShimmer" />
      )}
      {!isLocked && <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none z-0" />}
      {!isLocked && <div className="absolute bottom-0 left-0 right-0 h-[28%] bg-[rgba(61,43,31,0.06)] pointer-events-none z-0" />}

      {isLocked && (
        <div 
          className="absolute top-0 w-[40%] h-full bg-gradient-to-r from-white/0 via-white/40 to-white/0 pointer-events-none z-10 skew-x-[-20deg]"
          style={{ animation: 'shineSweep 4s ease-in-out infinite', left: '200%' }}
        />
      )}

      {/* The Math & Icon Content */}
      <div className={`relative z-10 flex flex-col items-center justify-center w-full h-full text-current drop-shadow-md pointer-events-none ${isGlitchWave ? 'text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.8)]' : ''}`}>
        {isLocked ? (
          rezzingState === 'dissolving' ? (
            <span className="tile-locked-text text-[calc(var(--tile-size)*0.38)] relative z-20 text-[#00ff00] font-mono tracking-widest animate-pulse">
              ████
            </span>
          ) : (
            <div className="absolute inset-0 pointer-events-none z-20 overflow-visible flex items-center justify-center">
              <PremiumTrophy themeName={`theme-${theme || 'monument'}`} value={tile.product} />
            </div>
          )
        ) : (
          renderFace()
        )}
      </div>
    </div>
  );
});
────────────────────────────────────────────────────────────────────────────────
