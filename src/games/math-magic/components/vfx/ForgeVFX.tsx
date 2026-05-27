────────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState, useEffect } from 'react';
import { VFXQuality } from '../../types';
import { subscribeToVFXEvent } from './VFXEventBus';
import { Z_LAYERS } from '../../../../engine/layout/LayerTokens';

interface ForgeVFXProps {
  quality: VFXQuality;
}

interface DripItem {
  id: number;
  left: string;
  top: string;
}

interface SparkItem {
  id: number;
  angle: string;
  tx: string;
  ty: string;
  width: string;
  height: string;
  delay: string;
}

export const ForgeVFX = ({ quality }: ForgeVFXProps) => {
  if (quality === 'off') return null;

  const [furnaceFlare, setFurnaceFlare] = useState(false);
  const [pulses, setPulses] = useState<{ id: number }[]>([]);

  // Embers distribution counts: High-quality gets 35 embers, Low gets 12.
  const count = quality === 'high' ? 35 : 12;

  const embers = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const sizeNum = 4 + ((i * 17 + 3) % 8); // 4px to 11px
      return {
        id: i,
        left: `${(i * 23 + 11) % 100}%`,
        size: `${sizeNum}px`,
        delay: `${((i * 7 + 13) % 30) / 10}s`, // 0s to 2.9s
        duration: `${1.8 + ((i * 13 + 5) % 25) / 10}s`, // 1.8s to 4.2s rapid drift duration
        sway: `${20 + ((i * 9 + 4) % 60)}px`, // X-sway width
      };
    });
  }, [count]);

  // Molten Iron Drips State & Loop
  const [activeDrip, setActiveDrip] = useState<DripItem | null>(null);

  useEffect(() => {
    let timeoutId: any;

    const triggerDrip = () => {
      const randomLeft = `${15 + Math.random() * 70}%`;
      const randomTop = `${20 + Math.random() * 40}%`; // drip forms around mid-to-top canvas near tiles
      
      setActiveDrip({
        id: Date.now(),
        left: randomLeft,
        top: randomTop,
      });

      // Clear drip after 1.2s animation finishes, then trigger next drip between 5s and 10s
      timeoutId = setTimeout(() => {
        setActiveDrip(null);
        const nextDelay = 5000 + Math.random() * 5000;
        timeoutId = setTimeout(triggerDrip, nextDelay);
      }, 1200);
    };

    timeoutId = setTimeout(triggerDrip, 3000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Anvil Sparks Shower State & Loop
  const [sparkBurst, setSparkBurst] = useState<{ x: string; y: string; items: SparkItem[] } | null>(null);

  useEffect(() => {
    let timeoutId: any;
    let flareTimeoutId: any;

    const triggerSparkShower = (payload: { x: number; y: number }) => {
      // Position explosive strikes exactly on the solved tile
      const spawnX = `${payload.x}px`;
      const spawnY = `${payload.y}px`;

      // Generate 15-20 distinct high-velocity sparks
      const sparkCount = quality === 'high' ? 18 : 8;
      const sparkItems = Array.from({ length: sparkCount }, (_, i) => {
        const angleValue = (360 / sparkCount) * i + (Math.random() * 15 - 7.5);
        const radius = 80 + Math.random() * 120; // Explosion travel radius
        
        // Calculate X and Y coordinates based on polar trigonometry
        const rad = (angleValue * Math.PI) / 180;
        const tx = `${Math.cos(rad) * radius}px`;
        const ty = `${Math.sin(rad) * radius}px`;

        return {
          id: i + Date.now(), // Ensure unique ID per burst
          angle: `${angleValue}deg`,
          tx,
          ty,
          width: `${12 + Math.random() * 16}px`,
          height: `${1.5 + Math.random() * 1.5}px`,
          delay: `${(Math.random() * 150) / 1000}s`, // Slight staggered release delay
        };
      });

      setSparkBurst({
        x: spawnX,
        y: spawnY,
        items: sparkItems,
      });

        // Sparks fly out very fast and fade. We clear them after 1.5 seconds.
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSparkBurst(null);
      }, 1500);

      // Trigger the glowing orange vents furnace flare on TILE_SOLVED
      setFurnaceFlare(true);
      if (flareTimeoutId) clearTimeout(flareTimeoutId);
      flareTimeoutId = setTimeout(() => {
        setFurnaceFlare(false);
      }, 1500);

      // Trigger molten pulse shockwave from furnace core
      const pulseId = Date.now() + Math.random();
      setPulses((p) => [...p, { id: pulseId }]);
      setTimeout(() => {
        setPulses((p) => p.filter((item) => item.id !== pulseId));
      }, 400);
    };

    const unsubscribe = subscribeToVFXEvent('TILE_SOLVED', triggerSparkShower);

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
      clearTimeout(flareTimeoutId);
    };
  }, [quality]);

  const [victoryBurstId, setVictoryBurstId] = useState<number | null>(null);

  useEffect(() => {
    let timeoutId: any;
    const handleVictory = () => {
      setVictoryBurstId(Date.now());
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setVictoryBurstId(null), 3500);
    };
    const unsubscribe = subscribeToVFXEvent('GAME_VICTORY', handleVictory);
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" style={{ zIndex: Z_LAYERS.VFX_BACKGROUND }}>
      <style>{`
        @keyframes forgeSteamBurst {
          0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
          10% { opacity: 0.9; }
          100% { transform: translate(-50%, -80vh) scale(2.0); opacity: 0; }
        }
        @keyframes forgeSparkBurst {
          0% { transform: translate(calc(-50% + 0px), 0px) rotate(0deg); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--driftX)), calc(-1 * var(--riseY))) rotate(var(--rot)); opacity: 0; }
        }
        @keyframes gearSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes gearSpinRev {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        .animate-gear-spin-custom {
          animation: gearSpin 25s linear infinite;
          transform-origin: center;
          transform-box: fill-box;
          will-change: transform;
        }
        .animate-gear-spin-rev-custom {
          animation: gearSpinRev 25s linear infinite;
          transform-origin: center;
          transform-box: fill-box;
          will-change: transform;
        }
        @keyframes moltenPulseAnim {
          0% {
            transform: scale(0.1);
            opacity: 1;
            filter: blur(2px);
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
            filter: blur(14px);
          }
        }
        .molten-pulse-wave {
          animation: moltenPulseAnim 0.4s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
          will-change: transform, opacity;
        }
      `}</style>
      {/* Colossal Blast Furnace Core Silhouette (Deep Lore) */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] max-w-[1100px] h-[60dvh] pointer-events-none select-none opacity-20 flex items-end justify-center overflow-visible"
        style={{
          transformOrigin: 'bottom center',
          zIndex: Z_LAYERS.VFX_BACKGROUND,
        }}
      >
        <svg 
          viewBox="0 0 1000 600" 
          className="w-full h-full overflow-visible"
          preserveAspectRatio="xMidYMax slice"
        >
          <defs>
            <linearGradient id="ventGlowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffedd5" />
              <stop offset="35%" stopColor="#f97316" />
              <stop offset="70%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#7c2d12" />
            </linearGradient>
            
            <linearGradient id="darkMetal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#221e1d" />
              <stop offset="40%" stopColor="#2e2a28" />
              <stop offset="60%" stopColor="#2e2a28" />
              <stop offset="100%" stopColor="#221e1d" />
            </linearGradient>
          </defs>

          {/* Large pipe connections */}
          <path d="M 120,600 L 280,330 L 280,200 L 240,160" fill="none" stroke="#221e1d" strokeWidth="22" strokeLinecap="round" />
          <path d="M 880,600 L 720,380 L 720,240" fill="none" stroke="#1c1917" strokeWidth="18" strokeLinecap="round" />

          {/* Left Piston Component */}
          <g transform="translate(190, 180)">
            <rect x="0" y="0" width="24" height="420" fill="#141211" rx="2" />
            <rect x="-6" y="-6" width="36" height="15" fill="#2d2524" rx="1" />
            <rect x="-6" y="410" width="36" height="15" fill="#2d2524" rx="1" />
            <rect 
              x="3" 
              y="60" 
              width="18" 
              height="110" 
              fill="#ea580c" 
              className="animate-piston-a"
              style={{
                filter: 'drop-shadow(0 0 8px #ea580c) drop-shadow(0 0 3px #f97316)'
              }}
            />
          </g>

          {/* Right Piston Component */}
          <g transform="translate(795, 230)">
            <rect x="0" y="0" width="24" height="370" fill="#141211" rx="2" />
            <rect x="-6" y="-6" width="36" height="15" fill="#2d2524" rx="1" />
            <rect x="-6" y="360" width="36" height="15" fill="#2d2524" rx="1" />
            <rect 
              x="3" 
              y="40" 
              width="18" 
              height="100" 
              fill="#ea580c" 
              className="animate-piston-b"
              style={{
                filter: 'drop-shadow(0 0 8px #ea580c) drop-shadow(0 0 3px #f97316)'
              }}
            />
          </g>

          {/* Tower Base Structure */}
          <path 
            d="M 310,600 L 360,190 L 430,130 L 570,130 L 640,190 L 690,600 Z" 
            fill="url(#darkMetal)" 
            stroke="#1c1917" 
            strokeWidth="6" 
          />

          {/* Reinforced heavy girders horizontally */}
          <rect x="350" y="270" width="300" height="18" fill="#1c1917" rx="3" />
          <rect x="330" y="400" width="340" height="18" fill="#1c1917" rx="3" />
          <rect x="315" y="520" width="370" height="18" fill="#1c1917" rx="3" />

          {/* High chimney smokestack */}
          <path d="M 450,130 L 450,30 L 550,30 L 550,130 Z" fill="#221e1d" stroke="#1c1917" strokeWidth="3" />
          <ellipse cx="500" cy="30" rx="50" ry="9" fill="#2d2524" stroke="#1c1917" strokeWidth="2.5" />

          {/* Glowing heat exhaust vents */}
          {/* Vent A - Chimney neck */}
          <rect 
            x="480" 
            y="170" 
            width="40" 
            height="65" 
            rx="4" 
            fill="url(#ventGlowGrad)"
            style={{
              transition: 'all 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: furnaceFlare ? 1.0 : 0.65,
              filter: furnaceFlare 
                ? 'drop-shadow(0 0 35px #ea580c) drop-shadow(0 0 15px #ea580c)' 
                : 'drop-shadow(0 0 8px #ea580c)',
            }}
          />

          {/* Vent B - Left Core Plate */}
          <rect 
            x="400" 
            y="310" 
            width="45" 
            height="140" 
            rx="5" 
            fill="url(#ventGlowGrad)"
            style={{
              transition: 'all 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: furnaceFlare ? 1.0 : 0.55,
              filter: furnaceFlare 
                ? 'drop-shadow(0 0 35px #ea580c) drop-shadow(0 0 15px #ea580c)' 
                : 'drop-shadow(0 0 7px #ea580c)',
            }}
          />

          {/* Vent C - Right Core Plate */}
          <rect 
            x="555" 
            y="310" 
            width="45" 
            height="140" 
            rx="5" 
            fill="url(#ventGlowGrad)"
            style={{
              transition: 'all 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: furnaceFlare ? 1.0 : 0.55,
              filter: furnaceFlare 
                ? 'drop-shadow(0 0 35px #ea580c) drop-shadow(0 0 15px #ea580c)' 
                : 'drop-shadow(0 0 7px #ea580c)',
            }}
          />

          {/* Central Reactor Door Vent */}
          <rect 
            x="470" 
            y="300" 
            width="60" 
            height="170" 
            rx="6" 
            fill="url(#ventGlowGrad)"
            style={{
              transition: 'all 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: furnaceFlare ? 1.0 : 0.7,
              filter: furnaceFlare 
                ? 'drop-shadow(0 0 45px #ea580c) drop-shadow(0 0 20px #ea580c)' 
                : 'drop-shadow(0 0 10px #ea580c)',
            }}
          />
        </svg>
      </div>

      <style>{`
        @keyframes pistonMoveA {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(85px); }
        }
        @keyframes pistonMoveB {
          0%, 100% { transform: translateY(50px); }
          50% { transform: translateY(-30px); }
        }
        .animate-piston-a {
          animation: pistonMoveA 10s ease-in-out infinite;
        }
        .animate-piston-b {
          animation: pistonMoveB 15s ease-in-out infinite;
        }
        @keyframes riseAndSway {
          0% {
            transform: translate3d(0, -10vh, 0) scale(0.8);
            opacity: 0;
          }
          10% {
            opacity: 0.95;
          }
          50% {
            transform: translate3d(var(--sway-width), 50vh, 0) scale(1.1);
            opacity: 0.95;
          }
          90% {
            opacity: 0.95;
          }
          100% {
            transform: translate3d(calc(var(--sway-width) * -0.3), 115vh, 0) scale(0.7);
            opacity: 0;
          }
        }
        .animate-sway-rise {
          animation: riseAndSway var(--rise-duration) ease-in-out infinite;
          will-change: transform, opacity;
        }

        /* Ambient background machinery pulse */
        @keyframes subtleMachineryPulse {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.14; }
        }
        .animate-machinery-pulse {
          animation: subtleMachineryPulse 10s ease-in-out infinite alternate;
        }
      `}</style>

      {/* Depth Layer 1: Machinery Parallax */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden animate-machinery-pulse flex items-center justify-between px-8 md:px-20" style={{ zIndex: Z_LAYERS.VFX_BACKGROUND }}>
        {/* Left industrial cog wheel */}
        <svg 
          viewBox="0 0 100 100" 
          className="w-40 h-40 md:w-56 md:h-56 stroke-[#3d2b1f]/35 fill-none animate-gear-spin-custom scale-110 opacity-70"
        >
          <circle cx="50" cy="50" r="30" strokeWidth="4" />
          <circle cx="50" cy="50" r="14" strokeWidth="3" />
          {/* Tooth elements around gear frame */}
          {Array.from({ length: 12 }).map((_, i) => (
            <rect 
              key={i}
              x="45" 
              y="10" 
              width="10" 
              height="15" 
              rx="2"
              fill="#3d2b1f"
              fillOpacity="0.45"
              transform={`rotate(${i * 30} 50 50)`} 
            />
          ))}
        </svg>

        {/* Right industrial cog wheel interlocking */}
        <svg 
          viewBox="0 0 100 100" 
          className="w-32 h-32 md:w-44 md:h-44 stroke-[#3d2b1f]/35 fill-none animate-gear-spin-rev-custom opacity-60 translate-y-20 md:translate-y-32"
        >
          <circle cx="50" cy="50" r="26" strokeWidth="4" />
          <circle cx="50" cy="50" r="10" strokeWidth="2" />
          {/* Interlocking cogs */}
          {Array.from({ length: 8 }).map((_, i) => (
            <rect 
              key={i}
              x="46" 
              y="12" 
              width="8" 
              height="12" 
              rx="1.5"
              fill="#3d2b1f"
              fillOpacity="0.4"
              transform={`rotate(${i * 45 + 22.5} 50 50)`} 
            />
          ))}
        </svg>
      </div>

      {/* Molten Pulse Radial Shockwave container */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[100vw] h-[60vh] overflow-hidden pointer-events-none select-none z-0 flex items-end justify-center">
        {pulses.map(pulse => (
          <div
            key={pulse.id}
            className="molten-pulse-wave absolute bottom-[-150px] w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,1)_0%,rgba(251,146,60,1)_35%,rgba(239,68,68,0.85)_65%,rgba(0,0,0,0)_100%)] shadow-[0_0_100px_rgba(234,88,12,0.95)]"
            style={{
              transformOrigin: 'center bottom',
            }}
          />
        ))}
      </div>

      {/* Fiery bottom ambient glow */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[18rem] bg-gradient-to-t from-[#ea580c]/25 via-[#f97316]/5 to-transparent pointer-events-none filter blur-[30px]"
      />

      {/* Heat Haze Distortion (distorting the bottom 15% of viewport) */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[15vh] w-full backdrop-blur-[1.5px] border-t border-orange-500/15 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(234,88,12,0.03) 0%, rgba(249,115,22,0.12) 100%)',
          animation: 'pulse 4s ease-in-out infinite alternate',
        }}
      />

      {/* Floating molten embers */}
      {embers.map((ember) => (
        <div
          key={ember.id}
          className="absolute rounded-full animate-sway-rise bg-orange-500 border border-red-500"
          style={{
            left: ember.left,
            top: '-20px',
            width: ember.size,
            height: ember.size,
            boxShadow: `0 0 ${parseInt(ember.size) * 1.5}px #f97316, 0 0 4px #ef4444`,
            '--rise-duration': ember.duration,
            '--sway-width': ember.sway,
            animationDelay: ember.delay,
          } as React.CSSProperties}
        />
      ))}

      {/* Depth Layer 3: Molten Iron Viscous Drips */}
      {activeDrip && (
        <div
          key={activeDrip.id}
          className="absolute bg-gradient-to-b from-white via-amber-400 to-orange-600 animate-iron-drip"
          style={{
            left: activeDrip.left,
            top: activeDrip.top,
            width: '8px',
            height: '18px',
            borderRadius: '50% 50% 40% 40% / 60% 60% 40% 40%',
            boxShadow: '0 0 10px #f97316, 0 0 4px #ffffff',
          }}
        />
      )}

      {/* Action Layer: Anvil Spark Shower Burst Overlay */}
      {sparkBurst && (
        <div
          className="absolute"
          style={{
            left: sparkBurst.x,
            top: sparkBurst.y,
          }}
        >
          {sparkBurst.items.map((spark) => (
            <div
              key={spark.id}
              className="absolute bg-gradient-to-r from-yellow-100 via-amber-300 to-orange-500 rounded-full"
              style={{
                width: spark.width,
                height: spark.height,
                transformOrigin: 'left center',
                animation: 'spark-burst 0.7s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
                animationDelay: spark.delay,
                boxShadow: '0 0 6px #f59e0b, 0 0 2px #ffffff',
                '--angle': spark.angle,
                '--tx': spark.tx,
                '--ty': spark.ty,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* GAME VICTORY: Big Forge Outburst */}
      {victoryBurstId && (
        <div className="absolute inset-0 z-[1500] pointer-events-none select-none">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`steam-${victoryBurstId}-${i}`}
              className="absolute bg-[radial-gradient(circle,rgba(255,255,255,0.7)0%,rgba(255,255,255,0.3)50%,rgba(255,255,255,0)70%)] rounded-full opacity-90 blur-[15px]"
              style={{
                left: `${100 * ((i * 31) % 100) / 100}%`,
                bottom: '-100px',
                width: `${150 + ((i * 17) % 200)}px`,
                height: `${150 + ((i * 17) % 200)}px`,
                transform: `translate(-50%, 0) scale(0.5)`,
                animation: `forgeSteamBurst 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
          {Array.from({ length: 45 }).map((_, i) => (
            <div
              key={`spark-${victoryBurstId}-${i}`}
              className="absolute bg-gradient-to-t from-[#ffcc00] to-[#ff4400] shadow-[0_0_12px_#ff4400,0_0_4px_#ffcc00]"
              style={{
                left: `${100 * ((i * 41) % 100) / 100}%`,
                bottom: '10px',
                width: `${3 + ((i * 7) % 6)}px`,
                height: `${3 + ((i * 7) % 6)}px`,
                transform: `translate(-50%, 0)`,
                animation: `forgeSparkBurst 1.8s cubic-bezier(0.1, 0.8, 0.2, 1) forwards`,
                animationDelay: `${((i * 13) % 1200) / 1000}s`,
                '--driftX': `${((i * 23) % 300) - 150}px`,
                '--riseY': `90vh`,
                '--rot': `${(i * 47) % 720}deg`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}
    </div>
  );
};
────────────────────────────────────────────────────────────────────────────────
