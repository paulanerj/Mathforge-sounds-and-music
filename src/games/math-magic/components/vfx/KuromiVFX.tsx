import React, { useMemo, useState, useEffect } from 'react';
import { VFXQuality } from '../../types';
import { subscribeToVFXEvent } from './VFXEventBus';
import { Z_LAYERS } from '../../../../engine/layout/LayerTokens';

interface KuromiVFXProps {
  quality: VFXQuality;
}

export const KuromiVFX = ({ quality }: KuromiVFXProps) => {
  const [lightningHit, setLightningHit] = useState<{ id: number; cx: string; cy: string } | null>(null);
  const [shatteredMoons, setShatteredMoons] = useState<{ id: number; cx: string; cy: string }[]>([]);

  useEffect(() => {
    let timeoutId: any;

    const triggerLightning = (payload: { x: number; y: number }) => {
      const cx = `${payload.x}px`;
      const cy = `${payload.y}px`;

      setLightningHit({
        id: Date.now(),
        cx,
        cy,
      });

      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setLightningHit(null);
      }, 500); // Quick flash

      // Trigger "Shattered Moon" fractal burst
      const moonId = Date.now() + Math.random();
      setShatteredMoons((prev) => [...prev, { id: moonId, cx, cy }]);
      setTimeout(() => {
        setShatteredMoons((prev) => prev.filter((m) => m.id !== moonId));
      }, 400);
    };

    const unsubscribe = subscribeToVFXEvent('TILE_SOLVED', triggerLightning);
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const [victoryBurstId, setVictoryBurstId] = useState<number | null>(null);

  useEffect(() => {
    let timeoutId: any;
    const handleVictory = () => {
      setVictoryBurstId(Date.now());
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setVictoryBurstId(null), 3000); // Max eruption duration
    };
    const unsubscribe = subscribeToVFXEvent('GAME_VICTORY', handleVictory);
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const count = quality === 'high' ? 14 : 6;
  const petals = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${(i * 23 + 7) % 100}%`,
    top: `${-10 - ((i * 11) % 20)}%`,
    delay: `${(i * 3) % 10}s`,
    duration: `${6 + (i * 5) % 8}s`,
    isSkull: i % 3 === 0,
    size: `${15 + (i * 13) % 15}px`,
  })), [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" style={{ zIndex: Z_LAYERS.VFX_BACKGROUND }}>
      <style>{`
        @keyframes kuromiFall {
          0% { transform: translateY(-50px) rotate(0deg); opacity: 0.8; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
        @keyframes lightningStrike {
          0% { opacity: 1; transform: scale(1) rotate(0deg); filter: brightness(2) drop-shadow(0 0 20px #8b5cf6); }
          10% { opacity: 0; }
          20% { opacity: 1; transform: scale(1.1) rotate(15deg); }
          30% { opacity: 0; }
          40% { opacity: 0.8; transform: scale(0.9) rotate(-10deg); }
          50% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes emberRise {
          0% { transform: translate(0, 0); opacity: 0; }
          20% { opacity: 0.9; }
          80% { opacity: 0.9; }
          100% { transform: translate(var(--driftX), -60vh); opacity: 0; }
        }
        @keyframes moonFlare {
          0% { opacity: 1; filter: drop-shadow(0 0 40px #d946ef) drop-shadow(0 0 80px #8b5cf6); }
          100% { opacity: 0.4; filter: none; }
        }
        @keyframes gothicFlicker {
          0%, 100% {
            filter: brightness(1.0) drop-shadow(0 0 5px rgba(126, 34, 206, 0.2));
          }
          45% {
            filter: brightness(1.0) drop-shadow(0 0 5px rgba(126, 34, 206, 0.2));
          }
          50% {
            filter: brightness(1.6) drop-shadow(0 0 14px rgba(217, 70, 239, 0.7));
          }
          52% {
            filter: brightness(0.9) drop-shadow(0 0 3px rgba(126, 34, 206, 0.1));
          }
          54% {
            filter: brightness(1.4) drop-shadow(0 0 12px rgba(217, 70, 239, 0.55));
          }
          58% {
            filter: brightness(1.0) drop-shadow(0 0 5px rgba(126, 34, 206, 0.2));
          }
          85% {
            filter: brightness(1.0) drop-shadow(0 0 5px rgba(126, 34, 206, 0.2));
          }
          90% {
            filter: brightness(1.7) drop-shadow(0 0 16px rgba(217, 70, 239, 0.8));
          }
          92% {
            filter: brightness(1.1) drop-shadow(0 0 4px rgba(126, 34, 206, 0.15));
          }
          94% {
            filter: brightness(1.0) drop-shadow(0 0 5px rgba(126, 34, 206, 0.2));
          }
        }
        .animate-gothic-flicker {
          animation: gothicFlicker 8s infinite;
          will-change: filter;
        }
        @keyframes shatteredMoonSwell {
          0% {
            transform: translate(-50%, -50%) scale(0.1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.2) rotate(45deg);
            opacity: 0;
          }
        }
        @keyframes shardFly {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0.5);
            opacity: 0;
          }
        }
        .animate-shattered-moon {
          animation: shatteredMoonSwell 0.4s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
          will-change: transform, opacity;
        }
        .animate-shard {
          animation: shardFly 0.4s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
          will-change: transform, opacity;
        }
      `}</style>

      {/* Shattered Moon Fractal Burst */}
      {shatteredMoons.map((moon) => (
        <div
          key={moon.id}
          className="animate-shattered-moon absolute pointer-events-none select-none"
          style={{
            left: moon.cx,
            top: moon.cy,
            width: '140px',
            height: '140px',
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(217,70,239,0.15) 40%, rgba(0,0,0,0) 70%)',
          }}
        >
          {/* Neon Purple/Magenta Crest & Jagged moon shard lines */}
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            {/* Draw a jagged moon outline */}
            <path
              d="M30,15 A35,35 0 0,0 70,85 A35,35 0 0,1 30,15 Z"
              fill="none"
              stroke="#ec4899"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 8px #d946ef)' }}
            />
            {/* Inner fracture lines */}
            <line x1="45" y1="20" x2="52" y2="40" stroke="#a855f7" strokeWidth="2.5" />
            <line x1="52" y1="40" x2="35" y2="55" stroke="#ec4899" strokeWidth="2.5" />
            <line x1="35" y1="55" x2="60" y2="75" stroke="#a855f7" strokeWidth="2" />
            {/* Tiny shattered dust shards flying out */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (360 / 8) * i;
              const rad = (angle * Math.PI) / 180;
              const tx = `${Math.cos(rad) * 60}px`;
              const ty = `${Math.sin(rad) * 60}px`;
              return (
                <polygon
                  key={i}
                  points="50,45 55,50 48,55"
                  fill={i % 2 === 0 ? '#ec4899' : '#a855f7'}
                  className="animate-shard origin-center"
                  style={{
                    '--tx': tx,
                    '--ty': ty,
                    transformBox: 'fill-box',
                  } as React.CSSProperties}
                />
              );
            })}
          </svg>
        </div>
      ))}

      {/* Deep Lore: The Shattered Moon and Ruined Clocktower */}
      <div className="absolute inset-0 pointer-events-none opacity-80 overflow-hidden">
        {/* Massive, fractured gothic moon (Top Right) */}
        <div className="absolute top-[-10vh] right-[-10vw] w-[60vh] h-[60vh] rounded-full bg-[#11051c] shadow-[inset_-20px_-20px_60px_rgba(139,92,246,0.3),_0_0_50px_rgba(236,72,153,0.1)]">
          {/* Moon Craters / Texture */}
          <div className="absolute top-[20%] right-[30%] w-[15vh] h-[15vh] rounded-full bg-[#0a020f] opacity-50" />
          <div className="absolute top-[50%] right-[50%] w-[8vh] h-[8vh] rounded-full bg-[#0a020f] opacity-40" />
          
          {/* Deep Cracks */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-40">
            <path d="M40 0 L45 20 L35 35 L50 60 L45 80 L60 100" fill="none" stroke="#2e0a4f" strokeWidth="2" />
            <path d="M50 60 L70 55 L85 70 L100 65" fill="none" stroke="#2e0a4f" strokeWidth="1.5" />
            <path d="M35 35 L20 40 L5 30" fill="none" stroke="#2e0a4f" strokeWidth="1" />
          </svg>

          {/* Shockwave Echo (Moon Flare) */}
          {lightningHit && (
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ animation: 'moonFlare 0.2s ease-out forwards' }}>
              <path d="M40 0 L45 20 L35 35 L50 60 L45 80 L60 100" fill="none" stroke="#d946ef" strokeWidth="3" />
              <path d="M50 60 L70 55 L85 70 L100 65" fill="none" stroke="#d946ef" strokeWidth="2" />
              <path d="M35 35 L20 40 L5 30" fill="none" stroke="#d946ef" strokeWidth="1.5" />
            </svg>
          )}
        </div>

        {/* Jagged, Ruined Clocktower (Bottom Left) */}
        <div className="absolute bottom-[-5vh] left-[-5vw] w-[40vw] max-w-[400px] h-[55vh] flex items-end animate-gothic-flicker">
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0 100 L0 20 L15 15 L15 30 L25 25 L30 40 L40 35 L40 100 Z" fill="#09020d" />
            <path d="M40 100 L40 50 L50 55 L55 45 L65 60 L60 100 Z" fill="#0c0411" />
            
            {/* Ambient neon window/backlight overlay */}
            <path d="M12 45 L18 45 L18 60 L12 60 Z" fill="#ec4899" opacity="0.15" />
            <path d="M22 55 L28 55 L28 75 L22 75 Z" fill="#7e22ce" opacity="0.25" />

            {/* Clock Face Rim (Ruined) */}
            <path d="M20 30 A10 10 0 0 1 40 30" fill="none" stroke="#1c072b" strokeWidth="2" />
            <line x1="30" y1="30" x2="25" y2="25" stroke="#2e0a4f" strokeWidth="1" />
          </svg>

          {/* Drifting Embers */}
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={`ember-${i}`}
              className="absolute bg-[#d946ef] rounded-full blur-[1px]"
              style={{
                left: `${20 + ((i * 13) % 40)}%`,
                bottom: '40%',
                width: `${2 + ((i * 7) % 4)}px`,
                height: `${2 + ((i * 7) % 4)}px`,
                animation: `emberRise ${8 + ((i * 11) % 6)}s linear infinite`,
                animationDelay: `${-((i * 17) % 15)}s`,
                '--driftX': `${((i * 23) % 100) - 50}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      {/* Falling Petals / Skulls */}
      {petals.map(petal => (
        <div key={petal.id}
          className="absolute flex items-center justify-center opacity-80"
          style={{
            left: petal.left,
            top: petal.top,
            width: petal.size,
            height: petal.size,
            animation: `kuromiFall ${petal.duration} linear infinite`,
            animationDelay: petal.delay,
            color: petal.isSkull ? '#1a1a1a' : '#ec4899', /* Black skull or pink petal */
            textShadow: petal.isSkull ? '0 0 5px #7e22ce' : '0 0 8px #be185d',
            fontSize: petal.size
          }} 
        >
          {petal.isSkull ? '💀' : '✿'}
        </div>
      ))}

      {/* Lightning Burst */}
      {lightningHit && (
        <div className="absolute flex items-center justify-center animate-[lightningStrike_0.5s_ease-out_forwards]"
          style={{ left: lightningHit.cx, top: lightningHit.cy, width: 0, height: 0 }}
        >
          {/* Create jagged sharp vectors for lightning flash */}
          <div className="absolute w-32 h-2 bg-[#d946ef] rounded-full blur-[2px]" style={{ transform: 'rotate(25deg)' }} />
          <div className="absolute w-24 h-2 bg-[#8b5cf6] rounded-full blur-[2px]" style={{ transform: 'rotate(-45deg)' }} />
          <div className="absolute w-40 h-[3px] bg-white rounded-full blur-[1px]" style={{ transform: 'rotate(25deg)' }} />
          <div className="absolute w-20 h-[3px] bg-white rounded-full blur-[1px]" style={{ transform: 'rotate(-45deg)' }} />
          <div className="absolute w-16 h-16 bg-[#e879f9]/40 rounded-full blur-[20px]" />
        </div>
      )}

      {/* GAME VICTORY: Lightning Strikes and Hot Pink Eruptions */}
      {victoryBurstId && (
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" style={{ zIndex: Z_LAYERS.VFX_TRIGGERED }}>
          {/* Laser Flash sequence */}
          <div className="absolute inset-0 bg-white" style={{ animation: 'kFlash1 0.16s ease-out forwards' }} />
          <div className="absolute inset-0 bg-[#ec4899]" style={{ animation: 'kFlash2 0.21s ease-out forwards', animationDelay: '0.05s', opacity: 0 }} />
          <div className="absolute top-[-20%] bottom-[-20%] w-[120px] bg-[linear-gradient(90deg,transparent,#FFFFFF,#ec4899,#a855f7,#FFFFFF,transparent)] shadow-[0_0_40px_#ec4899,0_0_15px_#FFFFFF] rotate-[20deg] skew-x-[-20deg]" style={{ animation: 'kLaser 0.6s cubic-bezier(0.15,0.85,0.35,1) forwards', left: '-150px' }} />

          <style>{`
            @keyframes kFlash1 { 0% { opacity: 0.95; } 100% { opacity: 0; } }
            @keyframes kFlash2 { 0% { opacity: 0.8; } 100% { opacity: 0; } }
            @keyframes kLaser { 0% { left: -150px; } 100% { left: 130%; } }
            @keyframes kErupt {
              0% { transform: translate(var(--driftX), 10vh) rotate(0deg) scale(0.5); opacity: 1; }
              100% { transform: translate(var(--driftX), -120vh) rotate(var(--rot)) scale(1.4); opacity: 0; }
            }
          `}</style>
          
          {/* Erupting Jester Hats and Hearts */}
          {Array.from({ length: 45 }).map((_, i) => {
            const colors = ['#ec4899', '#7e22ce', '#a855f7', '#FFFFFF', '#111111'];
            const color = colors[(i * 3) % colors.length];
            const size = 14 + ((i * 7) % 18);
            const isJester = ((i * 11) % 100) > 50;

            return (
              <div
                key={`k-erupt-${victoryBurstId}-${i}`}
                className="absolute bottom-[-50px] flex items-center justify-center"
                style={{
                  left: `${(i * 31) % 100}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  animation: `kErupt 2.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards`,
                  animationDelay: `${((i * 17) % 1200) / 1000}s`,
                  '--driftX': `${((i * 19) % 350) - 175}px`,
                  '--rot': `${((i * 23) % 720) - 360}deg`,
                } as React.CSSProperties}
              >
                {isJester ? (
                  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C13 4.5 16 5 18 4C17 6.5 15 9 12 10C9 9 7 6.5 6 4C8 5 11 4.5 12 2Z" fill="#111111"/>
                    <circle cx="12" cy="1" r="1.2" fill="#ec4899"/>
                    <circle cx="19" cy="3" r="1.2" fill="#ec4899"/>
                    <circle cx="5" cy="3" r="1.2" fill="#ec4899"/>
                    <path d="M5 12C5 12 12 6 19 12C16 16 8 16 5 12Z" fill="#111111"/>
                    <circle cx="12" cy="11" r="1.8" fill="#ec4899"/>
                  </svg>
                ) : (
                  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#ec4899"/>
                    <path d="M4 6l2.5 1.5M20 6l-2.5 1.5M3 11l3 0M21 11l-3 0" stroke="#111111" strokeWidth="2.2" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};