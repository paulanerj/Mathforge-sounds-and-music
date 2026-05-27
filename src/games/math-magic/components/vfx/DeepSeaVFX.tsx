────────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState, useEffect } from 'react';
import { VFXQuality } from '../../types';
import { subscribeToVFXEvent } from './VFXEventBus';
import { Z_LAYERS } from '../../../../engine/layout/LayerTokens';

interface DeepSeaVFXProps {
  quality: VFXQuality;
}

export const DeepSeaVFX = ({ quality }: DeepSeaVFXProps) => {
  if (quality === 'off') return null;

  // Stream counts: High-quality gets 30 bubbles, Low gets 10 bubbles.
  const count = quality === 'high' ? 30 : 10;

  const bubbles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${(i * 17) % 100}%`,
      size: `${6 + ((i * 11) % 14)}px`, // 6px to 20px
      delay: `${((i * 5) % 15) / 2.5}s`, // 0s to 6s
      duration: `${5 + ((i * 7) % 8)}s`, // 5s to 13s Speed
      amplitude: `${15 + ((i * 13) % 25)}px`, // X-wobble amplitude
    }));
  }, [count]);

  // Jellyfish drift timing and presentation state
  const [jellyActive, setJellyActive] = useState(false);
  const [jellyTop, setJellyTop] = useState('35%');
  const [jellyDuration, setJellyDuration] = useState('20s');

  useEffect(() => {
    let timeoutId: any;

    const spawnJelly = () => {
      const verticalPoints = ['20%', '35%', '50%', '65%', '78%'];
      const randomY = verticalPoints[Math.floor(Math.random() * verticalPoints.length)];
      setJellyTop(randomY);

      // Drifts slowly over 16s to 24s
      const speedInSeconds = 16 + Math.floor(Math.random() * 9);
      setJellyDuration(`${speedInSeconds}s`);

      setJellyActive(true);

      const durationMs = speedInSeconds * 1000;
      
      timeoutId = setTimeout(() => {
        setJellyActive(false);

        // Rare spawn: interval between jellyfish passage cycles scales to 20s - 40s
        const randomRespawnDelay = 20000 + Math.random() * 20000;
        timeoutId = setTimeout(spawnJelly, randomRespawnDelay);
      }, durationMs);
    };

    // First visual sighting after 6 seconds
    timeoutId = setTimeout(spawnJelly, 6000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Bubble Burst State
  const [bubbleBurst, setBubbleBurst] = useState<{ id: number; cx: string; cy: string; items: any[] } | null>(null);
  const [leviathanPulse, setLeviathanPulse] = useState(false);

  useEffect(() => {
    let timeoutId: any;
    let pulseTimeoutId: any;

    const triggerBubbleBurst = (payload: { x: number; y: number }) => {
      const cx = `${payload.x}px`;
      const cy = `${payload.y}px`;

      const burstCount = quality === 'high' ? 24 : 10;

      const items = Array.from({ length: burstCount }, (_, i) => {
        const angle = (360 / burstCount) * i + (Math.random() * 15 - 7.5);
        const distance = 60 + Math.random() * 90;
        const rad = (angle * Math.PI) / 180;

        const tx = `${Math.cos(rad) * distance}px`;
        const ty = `${Math.sin(rad) * distance}px`;
        const size = `${6 + Math.random() * 12}px`;
        const delay = `${(Math.random() * 80) / 1000}s`;

        return {
          id: i + Date.now(),
          tx,
          ty,
          size,
          delay,
        };
      });

      setBubbleBurst({
        id: Date.now(),
        cx,
        cy,
        items,
      });

      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setBubbleBurst(null);
      }, 1200);

      // Trigger Leviathan bioluminescent flank flash
      setLeviathanPulse(true);
      if (pulseTimeoutId) clearTimeout(pulseTimeoutId);
      pulseTimeoutId = setTimeout(() => {
        setLeviathanPulse(false);
      }, 500);
    };

    const unsubscribe = subscribeToVFXEvent('TILE_SOLVED', triggerBubbleBurst);

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
      clearTimeout(pulseTimeoutId);
    };
  }, [quality]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" style={{ zIndex: Z_LAYERS.VFX_BACKGROUND }}>
      <style>{`
        @keyframes leviathanBreath {
          0%, 100% {
            transform: translate3d(-50%, 0, 0) translateY(0px) rotate(1deg);
          }
          50% {
            transform: translate3d(-50%, 0, 0) translateY(-15px) rotate(-1deg);
          }
        }
        .animate-leviathan-breath {
          animation: leviathanBreath 20s ease-in-out infinite;
        }
      `}</style>

      {/* Deep Lore: Colossal Bioluminescent Leviathan (Deep Sea) */}
      <div 
        className="absolute top-[28%] left-1/2 w-[85vw] max-w-[950px] h-[35dvh] pointer-events-none select-none opacity-45 overflow-visible flex items-center justify-center animate-leviathan-breath"
        style={{
          transformOrigin: 'center center',
          filter: 'drop-shadow(0 0 35px rgba(34, 211, 238, 0.35)) drop-shadow(0 0 15px rgba(8, 145, 178, 0.2))',
          zIndex: Z_LAYERS.VFX_BACKGROUND,
        }}
      >
        <svg 
          viewBox="0 0 1000 400" 
          className="w-full h-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Soft underwater teal-blue gradient for body */}
            <linearGradient id="leviathanBodyGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#0f4c6c" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="75%" stopColor="#0c4a6e" />
              <stop offset="100%" stopColor="#082f49" />
            </linearGradient>
            
            {/* Bioluminescent glow radial gradient */}
            <radialGradient id="biolumGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="35%" stopColor="#22d3ee" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#0891b2" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#083344" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Leviathan Path Profile */}
          <path 
            d="M 50,150 
               C 120,100, 260,80, 420,120 
               C 520,145, 620,170, 720,160 
               C 780,155, 830,130, 870,110 
               C 890,100, 915,85, 930,100 
               C 925,115, 910,125, 920,140 
               C 935,165, 960,155, 980,135 
               C 990,128, 985,160, 955,185 
               C 910,220, 875,195, 840,215 
               C 790,245, 730,285, 650,295 
               C 570,305, 480,265, 420,240 
               C 380,255, 330,280, 271,320 
               C 264,310, 262,295, 275,275 
               C 170,265, 100,230, 50,150 Z" 
            fill="url(#leviathanBodyGrad)" 
            opacity="0.9"
            stroke="#22d3ee"
            strokeWidth="3"
            strokeOpacity="0.45"
          />

          {/* Pectoral Fin Overlay */}
          <path 
            d="M 330,205 
               C 310,240, 260,290, 205,335 
               C 195,343, 200,325, 215,305 
               C 245,260, 310,200, 345,195 Q 330,205 330,205 Z" 
            fill="#0369a1" 
            opacity="0.65"
          />

          {/* Bioluminescent Dots along the beautiful flank curve */}
          <g>
            {[
              { cx: 160, cy: 155, r: 4.5 },
              { cx: 210, cy: 158, r: 5 },
              { cx: 270, cy: 165, r: 5.5 },
              { cx: 330, cy: 175, r: 6 },
              { cx: 395, cy: 188, r: 6.5 },
              { cx: 465, cy: 202, r: 6.5 },
              { cx: 535, cy: 214, r: 6 },
              { cx: 605, cy: 220, r: 5.5 },
              { cx: 670, cy: 222, r: 5 },
              { cx: 730, cy: 218, r: 4.5 },
              { cx: 785, cy: 208, r: 4 },
              { cx: 830, cy: 195, r: 3.5 }
            ].map((dot, idx) => (
              <circle
                key={idx}
                cx={dot.cx}
                cy={dot.cy}
                r={dot.r}
                fill="#22d3ee"
                style={{
                  transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity: leviathanPulse ? 1.0 : 0.45,
                  filter: leviathanPulse 
                    ? `drop-shadow(0 0 ${dot.r * 2.8}px #22d3ee) drop-shadow(0 0 ${dot.r * 1.2}px #ffffff)` 
                    : `drop-shadow(0 0 ${dot.r * 1.0}px #22d3ee)`,
                }}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Depth Layer 1: Volumetric "God Rays" swaying dynamically */}
      <div className="absolute top-0 left-0 right-0 w-full h-[65vh] overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-0 left-[-20%] w-[140%] h-full pointer-events-none flex justify-around origin-top">
          <div 
            className="w-[12vw] h-full bg-gradient-to-b from-cyan-400/20 via-teal-400/5 to-transparent animate-god-ray-sway" 
            style={{ animationDelay: '0s', animationDuration: '11s' }} 
          />
          <div 
            className="w-[18vw] h-full bg-gradient-to-b from-cyan-300/15 via-blue-400/5 to-transparent animate-god-ray-sway" 
            style={{ animationDelay: '-3s', animationDuration: '9s' }} 
          />
          <div 
            className="w-[15vw] h-full bg-gradient-to-b from-teal-300/18 via-cyan-400/4 to-transparent animate-god-ray-sway" 
            style={{ animationDelay: '-6s', animationDuration: '13s' }} 
          />
        </div>
      </div>

      {/* Depth Layer 2: Glassy Bubble Streams floating up with sinusoidal wobble */}
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute rounded-full border border-teal-300/50 bg-teal-400/10 animate-bubble-rise"
          style={{
            left: bubble.left,
            bottom: '-30px',
            width: bubble.size,
            height: bubble.size,
            '--rise-duration': bubble.duration,
            '--wobble-amp': bubble.amplitude,
            animationDelay: bubble.delay,
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.15)',
          } as React.CSSProperties}
        >
          {/* Internal specular bubble reflection */}
          <div className="absolute top-[2px] left-[2px] w-[30%] h-[30%] bg-white/70 rounded-full" />
        </div>
      ))}

      {/* Depth Layer 3: Bioluminescent Floating Parallax Jellyfish */}
      {jellyActive && (
        <div
          className="absolute pointer-events-none select-none animate-jellyfish-drift"
          style={{
            top: jellyTop,
            '--drift-duration': jellyDuration,
            filter: 'drop-shadow(0 0 12px rgba(45,212,191,0.85)) drop-shadow(0 0 4px rgba(56,189,248,1))',
            transform: 'translate3d(-20vw, 0, 0)',
          } as React.CSSProperties}
        >
          <svg viewBox="0 0 100 140" className="w-[72px] h-[100px] overflow-visible opacity-80">
            {/* Jellyfish Bell (cap) */}
            <path 
              d="M10,50 C10,15 90,15 90,50 C90,53 82,56 75,54 C68,52 64,55 58,57 C52,59 48,55 42,53 C36,51 32,56 26,58 C20,60 16,55 10,50 Z" 
              fill="url(#jelly-glow-grad)" 
            />
            {/* Swaying Tentacles */}
            <path d="M25,55 Q18,80 28,110 T24,135" stroke="rgba(45,212,191,0.7)" strokeWidth="2.5" fill="none" />
            <path d="M38,53 Q43,85 34,115 T38,138" stroke="rgba(56,189,248,0.75)" strokeWidth="2" fill="none" />
            <path d="M50,52 Q56,90 48,120 T52,136" stroke="rgba(255,255,255,0.8)" strokeWidth="3" fill="none" />
            <path d="M62,53 Q57,85 66,115 T62,138" stroke="rgba(56,189,248,0.75)" strokeWidth="2" fill="none" />
            <path d="M75,55 Q82,80 72,110 T76,135" stroke="rgba(45,212,191,0.7)" strokeWidth="2.5" fill="none" />

            <defs>
              <linearGradient id="jelly-glow-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      {/* Action Layer: Bubble Burst Overlay */}
      {bubbleBurst && (
        <div
          className="absolute"
          style={{
            left: bubbleBurst.cx,
            top: bubbleBurst.cy,
          }}
        >
          {bubbleBurst.items.map((bubble) => (
            <div
              key={bubble.id}
              className="absolute rounded-full border border-teal-300/60 bg-teal-400/20"
              style={{
                width: bubble.size,
                height: bubble.size,
                transformOrigin: 'center center',
                animation: 'bubble-burst 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
                animationDelay: bubble.delay,
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.6), 0 1px 3px rgba(0,0,0,0.2)',
                '--tx': bubble.tx,
                '--ty': bubble.ty,
              } as React.CSSProperties}
            >
              <div className="absolute top-[1.5px] left-[1.5px] w-[35%] h-[35%] bg-white/80 rounded-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
────────────────────────────────────────────────────────────────────────────────
