import React, { useMemo, useState, useEffect } from 'react';
import { VFXQuality } from '../../types';
import { subscribeToVFXEvent } from './VFXEventBus';
import { Z_LAYERS } from '../../../../engine/layout/LayerTokens';

interface StageDiveVFXProps {
  quality: VFXQuality;
}

export const StageDiveVFX = ({ quality }: StageDiveVFXProps) => {
  const [sonicBoom, setSonicBoom] = useState<{ id: number; cx: string; cy: string } | null>(null);
  const [strobeActive, setStrobeActive] = useState(false);

  useEffect(() => {
    let timeoutId: any;
    let strobeTimeoutId: any;

    const triggerBoom = (payload: { x: number; y: number }) => {
      setSonicBoom({
        id: Date.now(),
        cx: `${payload.x}px`,
        cy: `${payload.y}px`,
      });

      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSonicBoom(null);
      }, 800); // Ring expansion duration

      // Trigger high-energy strobe flash
      setStrobeActive(true);
      if (strobeTimeoutId) clearTimeout(strobeTimeoutId);
      strobeTimeoutId = setTimeout(() => {
        setStrobeActive(false);
      }, 150);
    };

    const unsubscribe = subscribeToVFXEvent('TILE_SOLVED', triggerBoom);
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
      clearTimeout(strobeTimeoutId);
    };
  }, []);

  const count = quality === 'high' ? 12 : 6;

  // Lasers beams definition
  const lasers = [
    { id: 1, color: 'from-[#06b6d4]/40 via-[#06b6d4]/10 to-transparent', origin: 'left bottom', left: '15%', anim: 'animate-laser-sweep-a' },
    { id: 2, color: 'from-[#ec4899]/40 via-[#ec4899]/10 to-transparent', origin: 'right bottom', right: '15%', anim: 'animate-laser-sweep-b' },
    { id: 3, color: 'from-[#a3e635]/35 via-[#a3e635]/10 to-transparent', origin: 'center bottom', left: '40%', anim: 'animate-laser-sweep-c' },
    { id: 4, color: 'from-[#d946ef]/45 via-[#d946ef]/15 to-transparent', origin: 'center bottom', left: '60%', anim: 'animate-laser-sweep-d' },
  ];

  // Deterministic falling confetti
  const confettiCount = quality === 'high' ? 3 : 1;
  const confetti = useMemo(() => {
    const colors = [
      'bg-[#06b6d4]', // cyan
      'bg-[#ec4899]', // magenta
      'bg-[#a3e635]', // lime green
      'bg-[#fbbf24]', // amber
      'bg-[#8b5cf6]', // violet
      'bg-[#ef4444]', // red
    ];
    return Array.from({ length: confettiCount }).map((_, i) => {
      const left = `${(i * 29 + 13) % 100}%`;
      const color = colors[(i * 11 + 7) % colors.length];
      const width = `${6 + ((i * 7 + 4) % 6)}px`;
      const height = `${10 + ((i * 5 + 3) % 10)}px`;
      const delay = `${((i * 13 + 5) % 40) / 10}s`; // 0s to 3.9s delay
      const duration = `${3.5 + ((i * 17 + 9) % 35) / 10}s`; // 3.5s to 6.9s fall duration
      const rot = `${(i * 43 + 12) % 360}deg`;
      const swingWidth = `${25 + ((i * 13 + 3) % 45)}px`; // drift left-right
      return {
        id: i,
        left,
        color,
        width,
        height,
        delay,
        duration,
        rot,
        swingWidth,
      };
    });
  }, [confettiCount]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" style={{ zIndex: Z_LAYERS.VFX_BACKGROUND }}>
      <style>{`
        @keyframes eqBouncePulse {
          0%, 100% { height: 10%; filter: hue-rotate(0deg); opacity: 0.1; }
          50% { height: 60%; filter: hue-rotate(90deg); opacity: 0.3; text-shadow: 0 0 20px cyan; }
        }
        .animate-eq-pulse {
          animation: eqBouncePulse var(--duration) ease-in-out infinite;
        }
        @keyframes sonicBoomExp {
          0% {
            transform: translate(-50%, -50%) scale(0.1);
            opacity: 1;
            border-width: 10px;
          }
          100% {
            transform: translate(-50%, -50%) scale(3);
            opacity: 0;
            border-width: 1px;
          }
        }
        @keyframes laserSweepA {
          0% { transform: rotate(-35deg); }
          100% { transform: rotate(35deg); }
        }
        @keyframes laserSweepB {
          0% { transform: rotate(35deg); }
          100% { transform: rotate(-35deg); }
        }
        @keyframes laserSweepC {
          0% { transform: rotate(-45deg); }
          100% { transform: rotate(15deg); }
        }
        @keyframes laserSweepD {
          0% { transform: rotate(-15deg); }
          100% { transform: rotate(45deg); }
        }
        .animate-laser-sweep-a {
          animation: laserSweepA 6s ease-in-out infinite alternate;
          will-change: transform;
        }
        .animate-laser-sweep-b {
          animation: laserSweepB 7s ease-in-out infinite alternate;
          will-change: transform;
        }
        .animate-laser-sweep-c {
          animation: laserSweepC 5.5s ease-in-out infinite alternate;
          will-change: transform;
        }
        .animate-laser-sweep-d {
          animation: laserSweepD 6.5s ease-in-out infinite alternate;
          will-change: transform;
        }
        @keyframes confettiFall {
          0% {
            transform: translate3d(0, -10vh, 0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translate3d(var(--swing-width), 115vh, 0) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confettiFall var(--fall-duration) linear infinite;
          will-change: transform, opacity;
        }
        @keyframes crowdBob {
          0%, 100% { transform: translateY(0) scaleY(1); }
          50% { transform: translateY(-5px) scaleY(1.04); }
        }
        @keyframes crowdSwing {
          0%, 100% { transform: rotate(-2.5deg) translateY(0); }
          50% { transform: rotate(2.5deg) translateY(-3px); }
        }
        .animate-crowd-bob {
          animation: crowdBob 4s ease-in-out infinite;
          transform-origin: bottom center;
          will-change: transform;
        }
        .animate-crowd-swing {
          animation: crowdSwing 3s ease-in-out infinite;
          transform-origin: bottom center;
          will-change: transform;
        }
        @keyframes strobeFlicker {
          0% { opacity: 0.8; }
          25% { opacity: 0.15; }
          50% { opacity: 0.7; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* Sweeping Laser Beams */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden h-[100vh]">
        {lasers.map((laser) => (
          <div
            key={laser.id}
            className={`absolute bottom-[-180px] w-8 md:w-16 h-[170vh] bg-gradient-to-t ${laser.color} ${laser.anim} blur-[1.5px]`}
            style={{
              transformOrigin: laser.origin,
              left: laser.left,
              right: laser.right,
              boxShadow: '0 0 35px rgba(255, 255, 255, 0.08)',
            }}
          />
        ))}
      </div>

      {/* Falling Confetti Layer */}
      {confetti.map((c) => (
        <div
          key={c.id}
          className={`absolute animate-confetti ${c.color} rounded-sm`}
          style={{
            left: c.left,
            top: '-20px',
            width: c.width,
            height: c.height,
            '--fall-duration': c.duration,
            '--swing-width': c.swingWidth,
            animationDelay: c.delay,
            transform: `rotate(${c.rot})`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          } as React.CSSProperties}
        />
      ))}

      {/* Concert Audience Crowd Silhouette */}
      <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none select-none overflow-hidden z-10 flex items-end justify-center">
        {/* Layer 1 (Back/Deep) - Waving crowds */}
        <svg
          viewBox="0 0 1000 100"
          className="absolute bottom-0 w-full h-full fill-[#0c0413] opacity-65 translate-y-2 animate-crowd-bob"
          preserveAspectRatio="none"
          style={{ animationDuration: '4.8s' }}
        >
          <path d="M 0,100 L 0,80 Q 25,65 50,75 Q 75,85 100,70 Q 125,55 150,70 Q 175,85 200,60 Q 225,35 250,55 Q 275,75 300,65 Q 325,55 350,65 Q 375,75 400,50 Q 425,25 450,45 Q 475,65 500,55 Q 525,45 550,60 Q 575,75 600,45 Q 625,15 650,35 Q 675,55 700,50 Q 725,45 750,55 Q 775,65 800,40 Q 825,15 850,35 Q 875,55 900,45 Q 925,35 950,50 Q 975,65 1000,50 L 1000,100 Z" />
        </svg>

        {/* Layer 2 (Front) - Waving hands & bodies */}
        <svg
          viewBox="0 0 1000 100"
          className="absolute bottom-0 w-full h-24 fill-[#060209] translate-y-1 animate-crowd-swing"
          preserveAspectRatio="none"
          style={{ animationDuration: '3.6s' }}
        >
          <path d="M 0,100 L 0,85 C 30,75 45,95 70,80 C 85,70 100,60 115,75 C 135,95 155,85 175,70 C 195,55 210,40 230,55 C 255,75 270,90 295,80 C 315,70 330,50 350,65 C 375,85 390,95 415,85 C 435,75 450,55 470,68 C 495,85 510,95 535,80 C 555,70 570,50 590,65 C 615,85 630,95 655,85 C 675,75 690,55 710,68 C 735,85 750,95 775,80 C 795,70 810,50 830,65 C 855,85 870,95 895,85 C 915,75 930,55 950,68 C 975,85 990,95 1000,80 L 1000,100 Z" />
          <path d="M 120,80 L 130,50 L 140,80 Z" />
          <path d="M 280,85 L 290,45 L 300,85 Z" />
          <path d="M 460,80 L 470,40 L 485,85 Z" />
          <path d="M 640,80 L 650,42 L 665,85 Z" />
          <path d="M 810,85 L 820,48 L 835,85 Z" />
        </svg>
      </div>

      {/* Deep Background Eq Bars */}
      <div className="absolute inset-x-0 bottom-0 top-[40%] flex justify-around items-end px-4 z-0 pointer-events-none">
        {Array.from({ length: count }).map((_, i) => (
          <div 
            key={i}
            className="w-[5%] max-w-[40px] bg-gradient-to-t from-[#06b6d4] via-[#8b5cf6] to-[#ec4899] rounded-t-lg animate-eq-pulse shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            style={{
              '--duration': `${0.5 + (i * 0.15) % 1.5}s`,
              animationDelay: `${i * 0.05}s`
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Concert Strobe Flash */}
      {strobeActive && (
        <div 
          className="absolute inset-0 bg-white/80 dark:bg-[#ec4899]/50 mix-blend-screen pointer-events-none select-none"
          style={{ 
            zIndex: Z_LAYERS.VFX_BACKGROUND + 10,
            animation: 'strobeFlicker 0.15s ease-out forwards'
          }}
        />
      )}

      {/* TILE_SOLVED Laser Ring */}
      {sonicBoom && (
        <div className="absolute z-20" style={{ left: sonicBoom.cx, top: sonicBoom.cy }}>
          <div 
            className="absolute rounded-full border-[#06b6d4] drop-shadow-[0_0_15px_#06b6d4]"
            style={{ 
              width: '120px', 
              height: '120px',
              animation: 'sonicBoomExp 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards'
            }} 
          />
          <div 
            className="absolute rounded-full border-[#ec4899] drop-shadow-[0_0_20px_#ec4899]"
            style={{ 
              width: '180px', 
              height: '180px',
              animation: 'sonicBoomExp 0.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
              animationDelay: '0.1s'
            }} 
          />
        </div>
      )}
    </div>
  );
};