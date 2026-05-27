import React, { useMemo, useState, useEffect } from 'react';
import { VFXQuality } from '../../types';
import { subscribeToVFXEvent } from './VFXEventBus';
import { Z_LAYERS } from '../../../../engine/layout/LayerTokens';

interface MonumentVFXProps {
  quality: VFXQuality;
}

export const MonumentVFX = ({ quality }: MonumentVFXProps) => {
  const [shatterBurst, setShatterBurst] = useState<{ id: number; cx: string; cy: string; items: any[] } | null>(null);
  const [resonateActive, setResonateActive] = useState(false);

  useEffect(() => {
    let timeoutId: any;
    let resonanceTimer: any;

    const triggerShatter = (payload: { x: number; y: number }) => {
      const cx = `${payload.x}px`;
      const cy = `${payload.y}px`;

      const pieceCount = quality === 'high' ? 18 : 8;
      
      const items = Array.from({ length: pieceCount }, (_, i) => {
        const angle = (360 / pieceCount) * i + (((i * 13) % 20) - 10);
        const distance = 80 + ((i * 17) % 60);
        const rad = (angle * Math.PI) / 180;
        
        const tx = `${Math.cos(rad) * distance}px`;
        const ty = `${Math.sin(rad) * distance + 50}px`; // Add vertical gravity bias
        
        return {
          id: i,
          tx,
          ty,
          rot: `${(i * 47) % 360}deg`,
          delay: `${((i * 7) % 100) / 1000}s`,
          size: `${4 + ((i * 11) % 12)}px`
        };
      });

      setShatterBurst({
        id: Date.now(),
        cx,
        cy,
        items
      });

      setResonateActive(true);
      if (resonanceTimer) clearTimeout(resonanceTimer);
      resonanceTimer = setTimeout(() => {
        setResonateActive(false);
      }, 800);

      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setShatterBurst(null);
      }, 1500);
    };

    const unsubscribe = subscribeToVFXEvent('TILE_SOLVED', triggerShatter);
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
      clearTimeout(resonanceTimer);
    };
  }, [quality]);

  const count = quality === 'high' ? 12 : 5;
  const shapes = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${(i * 19 + 7) % 100}%`,
    top: `${(i * 31 + 13) % 100}%`,
    delay: `${(i * 3) % 5}s`,
    duration: `${30 + ((i * 7) % 20)}s`,
    size: `${20 + ((i * 11) % 40)}px`,
  })), [count]);

  const dustParticles = useMemo(() => {
    const pCount = quality === 'high' ? 18 : 8;
    return Array.from({ length: pCount }, (_, i) => {
      const size = 3 + ((i * 5) % 6);
      const isTriangle = i % 2 === 0;
      return {
        id: i,
        left: `${2 + ((i * 17) % 96)}%`,
        size,
        isTriangle,
        duration: `${22 + ((i * 13) % 20)}s`,
        delay: `${-((i * 11) % 25)}s`,
        driftX: `${((i * 23) % 40) - 20}px`
      };
    });
  }, [quality]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" style={{ zIndex: Z_LAYERS.VFX_BACKGROUND }}>
      <style>{`
        @keyframes monumentFloat {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0.2; }
          50% { transform: translate3d(20px, -40px, 0) rotate(180deg); opacity: 0.5; }
          100% { transform: translate3d(0, -80px, 0) rotate(360deg); opacity: 0.2; }
        }
        @keyframes sandShatter {
          0% { 
            transform: translate3d(0,0,0) scale(1) rotate(0deg); 
            opacity: 1; 
          }
          100% { 
            transform: translate3d(var(--tx), var(--ty), 0) scale(0.2) rotate(var(--rot)); 
            opacity: 0; 
          }
        }
        @keyframes dustFloatUp {
          0% {
            transform: translateY(110vh) translateX(0) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 0.35;
          }
          85% {
            opacity: 0.35;
          }
          100% {
            transform: translateY(-10vh) translateX(var(--drift-x, 20px)) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* The Golden Monolith Background Container (Static Backdrop) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden" style={{ zIndex: Z_LAYERS.VFX_BACKGROUND }}>
        {/* Warm God Rays Piercing from Top-Left */}
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox="0 0 1000 1000" 
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="godRayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.25" />
              <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon 
            points="0,0 300,0 850,1000 0,1000" 
            fill="url(#godRayGrad)"
            style={{
              transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: resonateActive ? 0.6 : 0.18
            }}
          />
          <polygon 
            points="0,0 0,350 1000,950 1000,450" 
            fill="url(#godRayGrad)"
            style={{
              transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: resonateActive ? 0.5 : 0.14
            }}
          />
          <polygon 
            points="0,0 180,0 1000,800 700,1000" 
            fill="url(#godRayGrad)"
            style={{
              transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: resonateActive ? 0.55 : 0.16
            }}
          />
        </svg>

        {/* Impossible Geometry: Golden Segmented Tribar Monolith */}
        <div
          style={{
            width: 'min(75vw, 480px)',
            height: 'min(75vw, 480px)',
            opacity: 0.3,
            transform: resonateActive ? 'scale(1.04)' : 'scale(1.0)',
            filter: resonateActive 
              ? 'drop-shadow(0 0 45px rgba(251, 191, 36, 0.85)) drop-shadow(0 0 15px rgba(217, 119, 6, 0.45))' 
              : 'drop-shadow(0 0 25px rgba(120, 53, 15, 0.25)) drop-shadow(0 0 10px rgba(251, 191, 36, 0.1))',
            transition: resonateActive 
              ? 'all 0.08s cubic-bezier(0, 0, 0.2, 1)' 
              : 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="flex items-center justify-center overflow-visible"
        >
          <svg 
            viewBox="0 0 600 600" 
            className="w-full h-full overflow-visible"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="goldFacGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              <linearGradient id="goldFacGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="goldFacGrad3" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ca8a04" />
                <stop offset="50%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>
            </defs>

            <g stroke="#fbbf24" strokeWidth="2.5" strokeOpacity="0.45" fill="none">
              {/* Face Segment 1 */}
              <path 
                d="M 300,50 L 510,410 L 450,445 L 300,185 L 140,460 L 90,410 Z" 
                fill="url(#goldFacGrad1)" 
              />
              {/* Face Segment 2 */}
              <path 
                d="M 90,410 L 300,185 L 300,95 L 40,435 L 290,575 L 340,515 Z" 
                fill="url(#goldFacGrad2)" 
              />
              {/* Face Segment 3 */}
              <path 
                d="M 290,575 L 140,460 L 205,420 L 300,490 L 510,410 L 450,445 Z" 
                fill="url(#goldFacGrad3)" 
              />
            </g>
          </svg>
        </div>
      </div>

      {/* Floating Geometric Dust ascending gracefully in the atmosphere / foreground */}
      {dustParticles.map(p => (
        <div
          key={p.id}
          className="absolute bg-[#fbbf24]/30"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            clipPath: p.isTriangle ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
            borderRadius: p.isTriangle ? 'none' : '2px',
            animation: `dustFloatUp ${p.duration} linear infinite`,
            animationDelay: p.delay,
            '--drift-x': p.driftX,
          } as React.CSSProperties}
        />
      ))}

      {/* Deep Background Shapes (Ambient floating structures) */}
      {shapes.map(shape => (
        <div key={shape.id}
          className="absolute border border-[#e6dbb8]/40"
          style={{
            left: shape.left,
            top: shape.top,
            width: shape.size,
            height: shape.size,
            animation: `monumentFloat ${shape.duration} ease-in-out infinite alternate`,
            animationDelay: shape.delay,
            borderRadius: shape.id % 2 === 0 ? '4px' : '50%'
          }} 
        />
      ))}

      {/* TILE_SOLVED Burst */}
      {shatterBurst && (
        <div className="absolute" style={{ left: shatterBurst.cx, top: shatterBurst.cy }}>
          {shatterBurst.items.map(piece => (
            <div key={piece.id}
              className="absolute bg-[#e6dbb8] shadow-[0_0_10px_#e6dbb8]"
              style={{
                width: piece.size,
                height: piece.size,
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                animation: 'sandShatter 1s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
                animationDelay: piece.delay,
                '--tx': piece.tx,
                '--ty': piece.ty,
                '--rot': piece.rot,
                transformOrigin: 'center center'
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}
    </div>
  );
};