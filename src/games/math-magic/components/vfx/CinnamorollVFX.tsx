────────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState, useEffect } from 'react';
import { VFXQuality } from '../../types';
import { subscribeToVFXEvent } from './VFXEventBus';
import { Z_LAYERS } from '../../../../engine/layout/LayerTokens';

interface CinnamorollVFXProps {
  quality: VFXQuality;
}

interface CloudItem {
  id: number;
  top: string;
  delay: string;
  duration: string;
  scale: number;
  opacity: number;
}

interface FloatingTreat {
  id: number;
  type: 'teacup' | 'lollipop' | 'star';
  startX: string;
  endX: string;
  distX: number;
  top: string;
  duration: string;
}

interface ConfettiItem {
  id: number;
  tx: string;
  ty: string;
  rot: string;
  shape: 'sprinkle' | 'heart' | 'star' | 'circle';
  color: string;
  size: string;
  delay: string;
}

export const CinnamorollVFX = ({ quality }: CinnamorollVFXProps) => {
  if (quality === 'off') return null;

  // Cloud layer: High gets 10 clouds, Low gets 4.
  const cloudCount = quality === 'high' ? 10 : 4;

  const clouds = useMemo(() => {
    return Array.from({ length: cloudCount }, (_, i) => {
      // Direct, proportional vertically-staggered distribution
      const top = `${12 + (i * 71) % 70}%`;
      const delay = `${((i * 13) % 40) - 20}s`; // Some start partially on-screen
      const duration = `${35 + (i * 7) % 25}s`;
      const scale = 0.6 + ((i * 19) % 5) * 0.15; // scales 0.6 to 1.2
      const opacity = 0.4 + ((i * 7) % 3) * 0.15; // opacities 0.4 to 0.7 for high contrast

      return {
        id: i,
        top,
        delay,
        duration,
        scale,
        opacity,
      };
    });
  }, [cloudCount]);

  // Wildlife Treat Parallax State
  const [activeTreat, setActiveTreat] = useState<FloatingTreat | null>(null);

  useEffect(() => {
    let timeoutId: any;

    const spawnTreat = () => {
      const types: ('teacup' | 'lollipop' | 'star')[] = ['teacup', 'lollipop', 'star'];
      const randomType = types[Math.floor(Math.random() * types.length)];

      const goRight = Math.random() > 0.5;
      const startX = goRight ? '-15vw' : '115vw';
      const endX = goRight ? '115vw' : '-15vw';
      const distX = goRight ? 130 : -130;

      const randomY = `${25 + Math.random() * 45}%`;
      const randomDuration = `${14 + Math.floor(Math.random() * 8)}s`; // floats over 14s to 22s

      setActiveTreat({
        id: Date.now(),
        type: randomType,
        startX,
        endX,
        distX,
        top: randomY,
        duration: randomDuration,
      });

      // Reset treat and queue the next encounter
      timeoutId = setTimeout(() => {
        setActiveTreat(null);
        const nextDelay = 15000 + Math.random() * 10000;
        timeoutId = setTimeout(spawnTreat, nextDelay);
      }, 23000);
    };

    // First treat sighting after 5 seconds
    timeoutId = setTimeout(spawnTreat, 5000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // "Sugar Rush" Confetti Burst State
  const [sugarConfetti, setSugarConfetti] = useState<{ id: number; cx: string; cy: string; items: ConfettiItem[] } | null>(null);
  const [pastelBubbles, setPastelBubbles] = useState<{ id: number; cx: string; cy: string }[]>([]);

  useEffect(() => {
    let timeoutId: any;

    const triggerSugarRush = (payload: { x: number; y: number }) => {
      const cx = `${payload.x}px`;
      const cy = `${payload.y}px`;

      const candyCount = quality === 'high' ? 24 : 10;
      const palette = ['#ff70a6', '#ff9770', '#ffd670', '#e9ff70', '#70d6ff', '#ffffff'];

      const items = Array.from({ length: candyCount }, (_, i) => {
        const angle = (360 / candyCount) * i + (Math.random() * 15 - 7.5);
        const distance = 90 + Math.random() * 130;
        const rad = (angle * Math.PI) / 180;

        const tx = `${Math.cos(rad) * distance}px`;
        const ty = `${Math.sin(rad) * distance}px`;
        
        const rot = `${180 + Math.random() * 360}deg`;
        const size = `${8 + (i * 7) % 8}px`; // 8px to 15px

        const shapes: ('sprinkle' | 'heart' | 'star' | 'circle')[] = ['sprinkle', 'heart', 'star', 'circle'];
        const shape = shapes[(i * 11) % shapes.length];
        const color = palette[(i * 13) % palette.length];
        const delay = `${(Math.random() * 100) / 1000}s`;

        return {
          id: i + Date.now(), // Ensure unique id
          tx,
          ty,
          rot,
          shape,
          color,
          size,
          delay,
        };
      });

      setSugarConfetti({
        id: Date.now(),
        cx,
        cy,
        items,
      });

      // Trigger "Pastel Bubble" radial swell
      const bubbleId = Date.now() + Math.random();
      setPastelBubbles((prev) => [...prev, { id: bubbleId, cx, cy }]);
      setTimeout(() => {
        setPastelBubbles((prev) => prev.filter((b) => b.id !== bubbleId));
      }, 1000);

      // Clear explosion after 1.5 seconds
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSugarConfetti(null);
      }, 1500);
    };

    const unsubscribe = subscribeToVFXEvent('TILE_SOLVED', triggerSugarRush);

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [quality]);

  const [victoryBurstId, setVictoryBurstId] = useState<number | null>(null);

  useEffect(() => {
    let timeoutId: any;
    const handleVictory = () => {
      setVictoryBurstId(Date.now());
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setVictoryBurstId(null), 5500); // 5.2s max duration
    };
    const unsubscribe = subscribeToVFXEvent('GAME_VICTORY', handleVictory);
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none" style={{ zIndex: Z_LAYERS.VFX_BACKGROUND }}>
      <style>{`
        @keyframes cinnaCloudRise {
          0% { transform: translate(calc(-50% + var(--driftX)), 10vh) scale(1.35); opacity: 0; }
          10% { opacity: 0.9; }
          100% { transform: translate(calc(-50% + var(--driftX)), -120vh) scale(1.35); opacity: 0; }
        }
        @keyframes cinnaStarFall {
          0% { transform: translate(var(--driftX), -10vh) rotate(0deg); opacity: 0; }
          5% { opacity: 1; }
          100% { transform: translate(var(--driftX), 120vh) rotate(var(--rot)); opacity: 0; }
        }
        @keyframes cinnaWheel {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes cinnaSugarRing {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes cinnaSlowCloud {
          0% { transform: translateX(110vw); }
          100% { transform: translateX(-110vw); }
        }
        @keyframes cinnaSlowCloud2 {
          0% { transform: translateX(110vw); }
          100% { transform: translateX(-110vw); }
        }
        @keyframes pastelBubbleSwell {
          0% { transform: translate(-50%, -50%) scale(0.1); opacity: 0.95; }
          100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
        }
        .animate-pastel-bubble {
          animation: pastelBubbleSwell 1.0s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
          will-change: transform, opacity;
        }
      `}</style>
      {/* Pastel Bubble Shockwaves */}
      {pastelBubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="animate-pastel-bubble absolute rounded-full pointer-events-none select-none"
          style={{
            left: bubble.cx,
            top: bubble.cy,
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(253,244,255,0.7) 30%, rgba(244,114,182,0.3) 60%, rgba(244,114,182,0) 100%)',
            boxShadow: '0 0 35px rgba(253,244,255,0.4), inset 0 0 15px rgba(244,114,182,0.15)',
          }}
        />
      ))}

      {/* Deep Lore: The Dreamscape Ferris Wheel */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none opacity-40 overflow-hidden">
        {/* Soft atmospheric clouds behind the wheel */}
        <div className="absolute top-[30%] left-[10%] w-[50vw]" style={{ animation: 'cinnaSlowCloud 80s linear infinite', opacity: 0.5 }}>
          <svg viewBox="0 0 120 80" className="w-full h-full fill-[#bae6fd] blur-[2px]">
            <path d="M30,60 C15,60 10,48 18,38 C12,25 28,15 42,22 C52,10 78,8 88,20 C102,15 112,28 106,40 C114,50 105,60 90,60 Z" />
          </svg>
        </div>
        <div className="absolute top-[50%] right-[15%] w-[60vw]" style={{ animation: 'cinnaSlowCloud2 100s linear infinite', opacity: 0.4 }}>
          <svg viewBox="0 0 120 80" className="w-full h-full fill-[#fbcfe8] blur-[4px]">
            <path d="M30,60 C15,60 10,48 18,38 C12,25 28,15 42,22 C52,10 78,8 88,20 C102,15 112,28 106,40 C114,50 105,60 90,60 Z" />
          </svg>
        </div>
        
        {/* The Ferris Wheel Container */}
        <div className="absolute bottom-[-10vh] left-1/2 -translate-x-1/2 w-[80vh] h-[80vh] flex items-center justify-center">
          {/* Static Support Structure */}
          <svg viewBox="0 0 100 100" className="absolute w-[60%] h-full bottom-0 origin-bottom" style={{ transform: 'translateY(10%)' }}>
            <path d="M50 40 L20 100 L80 100 Z" fill="none" stroke="#fdf4ff" strokeWidth="3" opacity="0.8" />
            <path d="M50 40 L35 100 M50 40 L65 100" stroke="#fce7f3" strokeWidth="2" opacity="0.6" />
            <circle cx="50" cy="40" r="4" fill="#bae6fd" />
          </svg>
          
          {/* Rotating Inner Wheel */}
          <div className="absolute w-full h-full rounded-full border-[8px] border-[#fdf4ff] shadow-[0_0_30px_rgba(251,207,232,0.5)]" style={{ animation: 'cinnaWheel 120s linear infinite', willChange: 'transform' }}>
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {Array.from({ length: 12 }).map((_, i) => (
                <g key={i} style={{ transformOrigin: '50px 50px', transform: `rotate(${i * 30}deg)` }}>
                  <line x1="50" y1="50" x2="50" y2="0" stroke="#bae6fd" strokeWidth="1.5" opacity="0.7" />
                  <circle cx="50" cy="0" r="3" fill="#fbcfe8" />
                </g>
              ))}
              <circle cx="50" cy="50" r="45" fill="none" stroke="#fbcfe8" strokeWidth="2" opacity="0.5" />
            </svg>
          </div>
          
          {/* Shockwave Echo (Sugar Ring) */}
          {sugarConfetti && (
            <div className="absolute w-full h-full rounded-full border-4 border-white opacity-0" style={{ animation: 'cinnaSugarRing 0.8s ease-out forwards', boxShadow: '0 0 40px 20px rgba(251,207,232,0.6), inset 0 0 40px 20px rgba(251,207,232,0.6)' }} />
          )}
        </div>
      </div>

      {/* Depth Layer 2: Plump Cloud Parallax */}
      {clouds.map((cloud) => (
        <div
          key={cloud.id}
          className="absolute animate-cloud-drift select-none pointer-events-none"
          style={{
            top: cloud.top,
            width: `${140 * cloud.scale}px`,
            height: `${70 * cloud.scale}px`,
            opacity: cloud.opacity,
            animationDelay: cloud.delay,
            '--drift-duration': cloud.duration,
            transform: 'translate3d(-300px, 0, 0)',
          } as React.CSSProperties}
        >
          <svg viewBox="0 0 120 80" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="cloud-pink-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="85%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#fbcfe8" />
              </linearGradient>
            </defs>
            <path 
              d="M30,60 C15,60 10,48 18,38 C12,25 28,15 42,22 C52,10 78,8 88,20 C102,15 112,28 106,40 C114,50 105,60 90,60 Z" 
              fill="url(#cloud-pink-grad)"
              className="drop-shadow-[0_6px_10px_rgba(244,114,182,0.35)]"
            />
          </svg>
        </div>
      ))}

      {/* Depth Layer 3: Winged Teacups & Sweet Wildlife Parallax */}
      {activeTreat && (
        <div
          className="absolute pointer-events-none select-none animate-sweet-float"
          style={{
            top: activeTreat.top,
            '--start-x': activeTreat.startX,
            '--end-x': activeTreat.endX,
            '--dist-x': `${activeTreat.distX}vw`,
            '--float-duration': activeTreat.duration,
            filter: 'drop-shadow(0 0 14px rgba(255, 255, 255, 0.9)) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))',
            transform: `translate3d(${activeTreat.startX}, 110vh, 0)`,
          } as React.CSSProperties}
        >
          {activeTreat.type === 'teacup' && (
            <svg viewBox="0 0 100 100" className="w-16 h-16 overflow-visible">
              {/* Left Angel Wing */}
              <path 
                d="M30,45 C15,30 5,35 12,18 C20,10 28,25 30,45 Z" 
                fill="#ffffff" 
                stroke="#ffafd2" 
                strokeWidth="2" 
              />
              {/* Right Angel Wing */}
              <path 
                d="M70,45 C85,30 95,35 88,18 C80,10 72,25 70,45 Z" 
                fill="#ffffff" 
                stroke="#ffafd2" 
                strokeWidth="2" 
              />
              {/* Teacup handle */}
              <path 
                d="M66,42 C80,45 74,65 62,60" 
                fill="none" 
                stroke="#38bdf8" 
                strokeWidth="3.5" 
                strokeLinecap="round"
              />
              {/* Teacup shape */}
              <path 
                d="M32,40 C32,66 68,66 68,40 Z" 
                fill="#bae6fd" 
                stroke="#38bdf8" 
                strokeWidth="2.5" 
              />
              {/* Heart embellishment */}
              <path 
                d="M50,44 C48,40 44,40 44,44 C44,48 50,52 50,52 C50,52 56,48 56,44 C56,40 52,40 50,44 Z" 
                fill="#ec4899" 
              />
            </svg>
          )}

          {activeTreat.type === 'lollipop' && (
            <svg viewBox="0 0 60 100" className="w-12 h-20 overflow-visible">
              {/* Stick */}
              <rect x="27" y="50" width="6" height="42" rx="3" fill="#ffe4e6" stroke="#f43f5e" strokeWidth="1" />
              {/* Swirling Head */}
              <circle cx="30" cy="30" r="22" fill="#fed7aa" stroke="#f97316" strokeWidth="2.5" />
              {/* Spiral Details */}
              <path 
                d="M30,30 A16,16 0 0,0 30,14 A12,12 0 0,0 30,22 A8,8 0 0,0 30,28 A4,4 0 0,0 30,30" 
                fill="none" 
                stroke="#ffffff" 
                strokeWidth="3" 
                strokeLinecap="round" 
              />
              {/* Ribbon bow */}
              <path 
                d="M18,50 C12,46 15,58 30,51 C45,58 48,46 42,50 C36,54 24,54 18,50 Z" 
                fill="#ec4899" 
              />
            </svg>
          )}

          {activeTreat.type === 'star' && (
            <svg viewBox="0 0 100 100" className="w-14 h-14 overflow-visible">
              <path 
                d="M50,15 L62,38 L87,41 L68,58 L74,83 L50,70 L26,83 L32,58 L13,41 L38,38 Z" 
                fill="#fef08a" 
                stroke="#eab308" 
                strokeWidth="2.5"
                strokeLinejoin="round" 
              />
              {/* Sweet blushed face details */}
              <circle cx="41" cy="49" r="2.5" fill="#f43f5e" />
              <circle cx="59" cy="49" r="2.5" fill="#f43f5e" />
              <path d="M48,55 Q50,57 52,55" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </div>
      )}

      {/* Action Layer: "Sugar Rush" Confetti Explosion */}
      {sugarConfetti && (
        <div
          className="absolute"
          style={{
            left: sugarConfetti.cx,
            top: sugarConfetti.cy,
          }}
        >
          {sugarConfetti.items.map((candy) => (
            <div
              key={candy.id}
              className="absolute pointer-events-none"
              style={{
                width: candy.size,
                height: candy.size,
                animation: 'sugar-burst 0.9s cubic-bezier(0.1, 0.8, 0.25, 1) forwards',
                animationDelay: candy.delay,
                '--tx': candy.tx,
                '--ty': candy.ty,
                '--rot': candy.rot,
              } as React.CSSProperties}
            >
              {candy.shape === 'heart' && (
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path 
                    d="M12,35 C12,17 38,17 50,32 C62,17 88,17 88,35 C88,58 50,85 50,85 C50,85 12,58 12,35 Z" 
                    fill={candy.color} 
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="4"
                  />
                </svg>
              )}

              {candy.shape === 'star' && (
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path 
                    d="M50,10 L63,35 L90,38 L70,57 L75,85 L50,72 L25,85 L30,57 L10,38 L37,35 Z" 
                    fill={candy.color} 
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="4"
                  />
                </svg>
              )}

              {candy.shape === 'sprinkle' && (
                <div 
                  className="w-full h-[60%] rounded-full" 
                  style={{ 
                    backgroundColor: candy.color, 
                    transform: 'rotate(25deg)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }} 
                />
              )}

              {candy.shape === 'circle' && (
                <div 
                  className="w-full h-full rounded-full" 
                  style={{ 
                    backgroundColor: candy.color,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }} 
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* GAME VICTORY: Cinnamoroll Happy Clouds and Falling Candies */}
      {victoryBurstId && (
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" style={{ zIndex: Z_LAYERS.VFX_TRIGGERED }}>
          {/* 1. Rising Lazy Clouds */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`v-cloud-${victoryBurstId}-${i}`}
              className="absolute bg-white/90 rounded-[100px] shadow-[0_10px_30px_rgba(186,217,234,0.4)] blur-[4px]"
              style={{
                left: `${(i * 31) % 100}%`,
                bottom: '-150px',
                width: `${85 + ((i * 17) % 100)}px`,
                height: `${(85 + ((i * 17) % 100)) * 0.6}px`,
                animation: `cinnaCloudRise 5s ease-out forwards`,
                animationDelay: `${i * 0.35}s`,
                '--driftX': `${((i * 43) % 150) - 75}px`,
              } as React.CSSProperties}
            >
              <div className="absolute bg-white/90 rounded-full" style={{ width: '60%', height: '100%', top: '-30%', left: '15%' }} />
              <div className="absolute bg-white/90 rounded-full" style={{ width: '50%', height: '83%', top: '-20%', right: '15%' }} />
            </div>
          ))}

          {/* 2. Slow Falling Stars and Spirals */}
          {Array.from({ length: 40 }).map((_, i) => {
            const colors = ['#BAD9EA', '#FFFFFF', '#CFEFFF', '#F7C7D9', '#F6E7D4'];
            const color = colors[(i * 7) % colors.length];
            const size = 10 + ((i * 13) % 16);
            const isSpiral = ((i * 17) % 100) > 60;
            return (
              <div
                key={`v-star-${victoryBurstId}-${i}`}
                className="absolute flex items-center justify-center top-[-50px]"
                style={{
                  left: `${(i * 23) % 100}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  animation: `cinnaStarFall 3.8s ease-in-out forwards`,
                  animationDelay: `${((i * 31) % 1500) / 1000}s`,
                  '--driftX': `${((i * 47) % 200) - 100}px`,
                  '--rot': `${(i * 53) % 540}deg`,
                } as React.CSSProperties}
              >
                {isSpiral ? (
                  <span style={{ color, fontSize: `${size}px`, fontWeight: 800 }}>🌀</span>
                ) : (
                  <span style={{ color, fontSize: `${size}px` }}>✦</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
────────────────────────────────────────────────────────────────────────────────
