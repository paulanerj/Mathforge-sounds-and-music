import React from 'react';
import { createPortal } from 'react-dom';
import { MathMagicTile, MathMagicMode, MathMagicTheme } from '../types';

interface InteractionGhostProps {
  tile: MathMagicTile | null;
  mode: MathMagicMode;
  theme?: MathMagicTheme;
  ghostRef: React.RefObject<HTMLDivElement>;
}

export const InteractionGhost = React.memo(({ tile, mode, theme, ghostRef }: InteractionGhostProps) => {
  let themeClasses = '';
  switch (theme) {
    case 'monument':
    case 'iron-forge':
      themeClasses = 'drop-shadow-2xl scale-105';
      break;
    case 'deep-sea':
      themeClasses = 'animate-water-ripple';
      break;
    case 'glitch-wave':
    case 'stage-dive':
      themeClasses = 'animate-rapid-shake text-shadow-chromatic';
      break;
    default:
      break;
  }

  return createPortal(
    <div
      ref={ghostRef as React.RefObject<HTMLDivElement>}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      className={`fixed flex items-center justify-center font-black rounded-none pointer-events-none z-[99999] overflow-hidden whitespace-nowrap px-6 py-4 select-none mathmagic-ghost ${themeClasses}`}
      style={{
        display: 'none',
        boxShadow: '0 16px 40px rgba(61,43,31,0.22), 0 0 0 2px rgba(253,246,227,0.6)',
        borderBottom: '3px solid rgba(61,43,31,0.16)',
        transform: 'translate(-50%, calc(-50% - 45px)) rotate(-5deg)',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        userSelect: 'none'
      }}
    >
      {/* Background with shiny effect */}
      <div 
        className="absolute inset-0 rounded-inherit z-0" 
        style={{
          background: 'linear-gradient(155deg, rgba(255,255,255,0.22) 0%, transparent 55%)'
        }}
      />
      {/* Ghost Content */}
      <span className="text-5xl font-black text-[#3d2b1f] relative z-10 leading-none">
        {mode === MathMagicMode.DRAG_DROP && tile ? `${tile.f1} × ${tile.f2}` : tile?.product}
      </span>
      <span className="text-3xl font-extrabold text-[rgba(61,43,31,0.6)] ml-3 relative z-10">
        {mode === MathMagicMode.DRAG_DROP && tile ? `= ${tile.product}` : tile ? `${tile.f1} × ${tile.f2}` : ''}
      </span>
    </div>,
    document.body
  );
});