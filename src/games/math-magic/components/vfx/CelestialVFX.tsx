import React, { useMemo, useState, useEffect } from 'react';
import { VFXQuality } from '../../types';
import { subscribeToVFXEvent } from './VFXEventBus';
import { Z_LAYERS } from '../../../../engine/layout/LayerTokens';

interface CelestialVFXProps {
  quality: VFXQuality;
}

export const CelestialVFX = ({ quality }: CelestialVFXProps) => {
  // If quality is off, immediately return null for zero overhead.
  if (quality === 'off') return null;

  // Starfield count: High quality gets 45 stars, Low gets 13.
  const count = quality === 'high' ? 45 : 13;

  // Staggered, pseudo-random but deterministic star coordinate generation
  const stars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      // Distribute naturally across screen space
      const left = `${(i * 19 + 7) % 100}%`;
      const top = `${(i * 29 + 13) % 100}%`;
      
      // Sizes ranging from 1px to 3px
      const sizeIndex = (i * 3) % 3;
      const size = sizeIndex === 0 ? '1px' : sizeIndex === 1 ? '2px' : '3px';
      
      // Twinkle dynamic timing settings
      const delay = `${((i * 7) % 15) / 3}s`; // Staggered delays: 0s to 5s
      const duration = `${1.5 + ((i * 11) % 10) / 4}s`; // Twinkle durations: 1.5s to 4s
      
      // High-contrast color palette: stark white and glowing cyan
      const color = i % 2 === 0 ? '#ffffff' : '#a5f3fc';

      return {
        id: i,
        left,
        top,
        size,
        delay,
        duration,
        color,
      };
    });
  }, [count]);

  // High-speed meteor recursive firing state
  const [fireMeteor, setFireMeteor] = useState(false);

  // Solar flare pulse state
  const [solarFlare, setSolarFlare] = useState(false);

  useEffect(() => {
    let timeoutId: any;

    const fireNextMeteor = () => {
      setFireMeteor(true);

      // Wait for the meteor animation to complete (2 seconds) before resetting
      timeoutId = setTimeout(() => {
        setFireMeteor(false);

        // Stagger next release by a randomized duration between 12 and 25 seconds
        const randomSecondsDelay = 12000 + Math.random() * 13000;
        timeoutId = setTimeout(fireNextMeteor, randomSecondsDelay);
      }, 2000);
    };

    // Queue up the first meteor strike 5 seconds after mount
    timeoutId = setTimeout(fireNextMeteor, 5000);

    // Shockwave Echo Subscription
    const unsubscribe = subscribeToVFXEvent('TILE_SOLVED', () => {
      setSolarFlare(true);
      const timer = setTimeout(() => {
        setSolarFlare(false);
      }, 1000); // Solar flare retracts over 1.0 second
      return () => clearTimeout(timer);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  // Compute the deep orbit celestial parallax coordinates (locked to static state)
  const deepOrbitStyle: React.CSSProperties = {};

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none" style={{ zIndex: Z_LAYERS.VFX_BACKGROUND }}>
      <style>{`
        @keyframes saturnSlowRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-saturn-spin {
          animation: saturnSlowRotate 240s linear infinite;
        }
        @keyframes moonLargeOrbit {
          0% { transform: translate(210px, 0px) scale(0.65); opacity: 0.45; }
          50% { transform: translate(-210px, -2px) scale(1.3); opacity: 1; }
          100% { transform: translate(210px, 0px) scale(0.65); opacity: 0.45; }
        }
        @keyframes moonSmallOrbit {
          0% { transform: translate(140px, 0px) scale(0.5); opacity: 0.3; }
          50% { transform: translate(-140px, -1px) scale(1.15); opacity: 1; }
          100% { transform: translate(140px, 0px) scale(0.5); opacity: 0.3; }
        }
        .animate-moon-large {
          animation: moonLargeOrbit 24s ease-in-out infinite;
        }
        .animate-moon-small {
          animation: moonSmallOrbit 10s ease-in-out infinite;
        }
        @keyframes driftUFO {
          0% { transform: translateX(-100px) translateY(0vh) scale(0.6); }
          50% { transform: translateX(110vw) translateY(15vh) scale(0.9); }
          100% { transform: translateX(110vw) translateY(15vh) scale(0.9); }
        }
        @keyframes driftAsteroid {
          0% { transform: translateX(100px) translateY(0vh) rotate(0deg); }
          100% { transform: translateX(-120vw) translateY(-25vh) rotate(-360deg); }
        }
      `}</style>

      {/* Nebula glowing orbs (only on 'high' quality for maximum GPU performance savings) */}
      {quality === 'high' && (
        <>
          <div 
            className="absolute top-[20%] left-[10%] w-[35vw] h-[35vw] rounded-full mix-blend-screen filter blur-[100px] opacity-25 pointer-events-none"
            style={{ 
              background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(0,0,0,0) 70%)',
              animation: 'pulse 15s ease-in-out infinite' 
            }} 
          />
          <div 
            className="absolute bottom-[20%] right-[10%] w-[45vw] h-[45vw] rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none"
            style={{ 
              background: 'radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(0,0,0,0) 70%)',
              animation: 'pulse 18s ease-in-out infinite alternate' 
            }} 
          />
        </>
      )}

      {/* Floating celestial stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full pointer-events-none animate-star-twinkle"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            backgroundColor: star.color,
            boxShadow: `0 0 ${parseInt(star.size) * 1.5}px ${star.color}`,
            animationDelay: star.delay,
            animationDuration: star.duration,
          } as React.CSSProperties}
        />
      ))}

      {/* UFO silhouette or slow-moving asteroid drift */}
      <div 
        className="absolute left-[-50px] top-[15%] h-[20px] w-[50px] z-[2] opacity-70 flex items-center justify-center pointer-events-none"
        style={{
          animation: 'driftUFO 25s linear infinite',
          animationDelay: '1s'
        }}
      >
        <svg viewBox="0 0 50 20" className="w-10 h-6 filter drop-shadow-[0_0_8px_#38bdf8]">
          <path d="M 15,12 L 35,12 L 38,15 L 12,15 Z M 20,8 L 30,8 L 32,11 L 18,11 Z" fill="#94a3b8" />
          <ellipse cx="25" cy="7" rx="5" ry="3" fill="#38bdf8" />
          <circle cx="16" cy="13" r="1.5" fill="#fcd34d" />
          <circle cx="25" cy="13" r="1.5" fill="#fcd34d" />
          <circle cx="34" cy="13" r="1.5" fill="#fcd34d" />
        </svg>
      </div>

      <div 
        className="absolute right-[-80px] bottom-[25%] h-[40px] w-[80px] z-[1] opacity-55 pointer-events-none"
        style={{
          animation: 'driftAsteroid 42s linear infinite',
          animationDelay: '6s'
        }}
      >
        <svg viewBox="0 0 80 40" className="w-[60px] h-[30px] filter drop-shadow-md">
          <path d="M 10,20 Q 15,5 35,8 T 70,20 T 45,35 T 10,20 Z" fill="#2d3748" />
          <circle cx="25" cy="15" r="3" fill="#1a202c" opacity="0.6" />
          <circle cx="48" cy="22" r="4" fill="#1a202c" opacity="0.6" />
          <circle cx="38" cy="14" r="2.5" fill="#1a202c" opacity="0.6" />
        </svg>
      </div>

      {/* Deep Lore: Colossal Saturn with Keplerian Orbiting Moon */}
      <div 
        className="absolute top-[-30px] right-[-50px] w-[500px] h-[500px] pointer-events-none select-none overflow-visible mix-blend-screen opacity-40"
        style={{ ...deepOrbitStyle, zIndex: Z_LAYERS.VFX_BACKGROUND }}
      >
        <svg 
          viewBox="0 0 500 500" 
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Ambient Saturn Planet Radial Gradient */}
            <radialGradient id="saturnBodyGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fee2e2" />     {/* soft glowing crust highlight */}
              <stop offset="25%" stopColor="#fde047" />    {/* sulfur peach cream */}
              <stop offset="60%" stopColor="#d97706" />    {/* ring shadow orange */}
              <stop offset="85%" stopColor="#78350f" />    {/* gas giant red brown */}
              <stop offset="100%" stopColor="#08071a" />   {/* deep cosmic shadow boundary */}
            </radialGradient>

            {/* Glowing Aura Sun/Solar Flare Gradient */}
            <radialGradient id="saturnAuraGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#ec4899" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#1e183a" stopOpacity="0" />
            </radialGradient>

            {/* Ring Linear Gradient for realistic space dust banding */}
            <linearGradient id="saturnRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.1" />
              <stop offset="12%" stopColor="#fef08a" stopOpacity="0.7" />
              <stop offset="30%" stopColor="#f59e0b" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#451a03" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.55" />
              <stop offset="88%" stopColor="#fde047" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.1" />
            </linearGradient>

            {/* Clipping definition to isolate the front curve of Saturn's rings */}
            <clipPath id="frontRingClip">
              <rect x="0" y="240" width="500" height="260" />
            </clipPath>
          </defs>

          {/* 1. Solar Flare Pulse / Glowing Outer Corona */}
          <circle 
            cx="250" 
            cy="250" 
            r="165" 
            fill="url(#saturnAuraGrad)" 
            className="transition-all"
            style={{
              transform: solarFlare ? 'scale(1.15)' : 'scale(1.0)',
              opacity: solarFlare ? 0.95 : 0.65,
              transition: solarFlare 
                ? 'transform 0.08s ease-out, opacity 0.08s ease-out' 
                : 'transform 1.0s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.0s cubic-bezier(0.16, 1, 0.3, 1)',
              transformOrigin: '250px 250px'
            }}
          />

          {/* Static Saturn System Group (Planet is static to respect the visual plane of its rings) */}
          <g 
            style={{ 
              transformOrigin: '250px 250px',
            }}
          >
            {/* 2. BACK RING: Renders behind the planet body */}
            <ellipse 
              cx="250" 
              cy="250" 
              rx="215" 
              ry="48" 
              fill="none" 
              stroke="url(#saturnRingGrad)" 
              strokeWidth="45" 
              opacity="0.85" 
              transform="rotate(-23 250 250)"
            />

            {/* 3. PLANET BODY */}
            <circle 
              cx="250" 
              cy="250" 
              r="105" 
              fill="url(#saturnBodyGrad)" 
              style={{ filter: 'drop-shadow(0 0 15px rgba(245, 158, 11, 0.25))' }}
            />

            {/* Atmospheric storm band overlay on body (aesthetic horizontal cloud tracks) */}
            <path d="M 148,220 Q 250,230 352,220" fill="none" stroke="#78350f" strokeWidth="4.5" opacity="0.32" />
            <path d="M 145,245 Q 250,256 355,245" fill="none" stroke="#fde047" strokeWidth="6" opacity="0.18" />
            <path d="M 148,270 Q 250,281 352,270" fill="none" stroke="#92400e" strokeWidth="3" opacity="0.28" />

            {/* 4. FRONT RING: Renders on top of the planet body, masked to lower quadrant */}
            <g clipPath="url(#frontRingClip)">
              <ellipse 
                cx="250" 
                cy="250" 
                rx="215" 
                ry="48" 
                fill="none" 
                stroke="url(#saturnRingGrad)" 
                strokeWidth="45" 
                opacity="0.85" 
                transform="rotate(-23 250 250)"
              />
            </g>
          </g>

          {/* 5. MULTIPLE KEPLERIAN ORBITING MOONS: Orbit along the same tilted plane as the rings (-23 degrees) */}
          <g transform="rotate(-23 250 250)" style={{ transformOrigin: '250px 250px' }}>
            {/* moon-large (slower, wider elliptical orbit) */}
            <circle
              cx="250"
              cy="250"
              r="13"
              className="animate-moon-large"
              fill="#e0f2fe"
              style={{
                filter: 'drop-shadow(0 0 10px #38bdf8) drop-shadow(0 0 2px #ffffff)',
                transformOrigin: '250px 250px'
              }}
            />
            {/* moon-small (faster, tighter orbit) */}
            <circle
              cx="250"
              cy="250"
              r="7.5"
              className="animate-moon-small"
              fill="#ecfeff"
              style={{
                filter: 'drop-shadow(0 0 6px #22d3ee) drop-shadow(0 0 1px #ffffff)',
                transformOrigin: '250px 250px'
              }}
            />
          </g>
        </svg>
      </div>

      {/* High-speed motion blur diagonal meteor element */}
      <div
        className={`absolute h-[2px] bg-gradient-to-r from-white via-[#a5f3fc] to-transparent pointer-events-none ${
          fireMeteor ? 'animate-meteor-strike' : 'hidden'
        }`}
        style={{
          width: '180px',
          boxShadow: '0 0 15px rgba(165, 243, 252, 0.9), 0 0 5px rgba(255, 255, 255, 1)',
        }}
      />
    </div>
  );
};