────────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState, useEffect } from 'react';
import { VFXQuality } from '../../types';
import { subscribeToVFXEvent } from './VFXEventBus';
import { Z_LAYERS } from '../../../../engine/layout/LayerTokens';

interface GlitchWaveVFXProps {
  quality: VFXQuality;
}

const GLITCH_GLYPHS = ['0', '1', '//', 'ERR', '0x9F', '>_', 'NUL', 'SYS', 'ALT', 'CRPT', '??', '!!', 'DISC', 'REBOOT'];

interface WireframeBuilding {
  id: number;
  x: number;
  width: number;
  height: number;
  glowColor: string;
  hasBillboard: boolean;
  billboardText: string;
}

export const GlitchWaveVFX = ({ quality }: GlitchWaveVFXProps) => {
  if (quality === 'off') return null;

  const count = quality === 'high' ? 28 : 9;

  // Stably generate falling data rain nodes
  const nodes = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const left = `${(i * 17 + 3) % 100}%`;
      // Staggered durations between 10s and 20s
      const duration = `${10 + ((i * 3) % 11)}s`;
      // Staggered delay up to 10 seconds to create steady flowing data rain
      const delay = `${((i * 7) % 20) / 2}s`;
      
      const glyph = GLITCH_GLYPHS[(i * 13) % GLITCH_GLYPHS.length];
      
      // Cyberpunk Color Palette: Matrix Cyan (#06b6d4), Jade Green (#059669), or Hot Pink (#ec4899)
      const colorIndex = i % 3;
      const color = colorIndex === 0 ? '#06b6d4' : colorIndex === 1 ? '#059669' : '#ec4899';
      
      const size = `${10 + ((i * 51) % 6)}px`; // 10px to 15px
      const maxOpacity = 0.1 + ((i * 17) % 3) * 0.08; // 0.1 to 0.26 opacity range

      return {
        id: i,
        left,
        duration,
        delay,
        glyph,
        color,
        size,
        maxOpacity,
      };
    });
  }, [count]);

  // Screen tracking error screen-tear active & positioning state
  const [fireTear, setFireTear] = useState(false);
  const [tearTop, setTearTop] = useState('20%');

  // Deep Lore Shockwave event state
  const [shockwaveActive, setShockwaveActive] = useState(false);

  useEffect(() => {
    let timeoutId: any;
    let shockwaveTimeout: any;

    const triggerScreenTear = () => {
      // Pick a random hot slice of the viewport (20%, 35%, 50%, 65%, 80%)
      const horizontalSlices = ['15%', '30%', '48%', '65%', '82%'];
      const randomSlice = horizontalSlices[Math.floor(Math.random() * horizontalSlices.length)];
      setTearTop(randomSlice);
      setFireTear(true);

      // Animation length is very fast (0.3s)
      timeoutId = setTimeout(() => {
        setFireTear(false);

        // Keep loop running every 8 to 15 seconds
        const randomWaitTime = 8000 + Math.random() * 7000;
        timeoutId = setTimeout(triggerScreenTear, randomWaitTime);
      }, 300);
    };

    // Release first tear anomaly 4 seconds inside game loaded
    timeoutId = setTimeout(triggerScreenTear, 4000);

    // Shockwave Echo Subscription
    const unsubscribe = subscribeToVFXEvent('TILE_SOLVED', () => {
      setShockwaveActive(true);
      if (shockwaveTimeout) clearTimeout(shockwaveTimeout);
      shockwaveTimeout = setTimeout(() => {
        setShockwaveActive(false);
      }, 150);
    });

    return () => {
      clearTimeout(timeoutId);
      if (shockwaveTimeout) clearTimeout(shockwaveTimeout);
      unsubscribe();
    };
  }, []);

  // Generate deterministic cyber skyline architecture
  const buildings = useMemo(() => {
    const list: WireframeBuilding[] = [];
    let currentX = -50;
    let id = 0;
    const texts = ['NUL', 'ERR', 'SYS', 'CRPT', 'NEON', 'CYBER', 'CTRL', 'DISC', 'PORT', 'CORE'];
    
    // We cover a bit of overflow for screen-panning margin
    while (currentX < 1150) {
      // Scale heights appropriately
      const width = 75 + ((id * 43) % 45); 
      const height = 90 + ((id * 67) % 95); 
      const glowColor = id % 2 === 0 ? '#06b6d4' : '#ec4899';
      const hasBillboard = (id * 23) % 10 > 5;
      const billboardText = texts[id % texts.length];

      list.push({
        id: id++,
        x: currentX,
        width,
        height,
        glowColor,
        hasBillboard,
        billboardText,
      });

      // overlap and deterministic advance
      currentX += width * (0.65 + (id % 4) * 0.08);
    }
    return list;
  }, []);

  // Locked to 100% static state to prevent repaints and flickering during transitions
  // Chromatic aberration splits red shadows left, cyan shadows right on solved hit for exactly 0.15s
  const megacityStyle: React.CSSProperties = shockwaveActive
    ? {
        transform: 'scale(1.01) skewX(-1deg)',
        filter: 'drop-shadow(-4px 0 0 rgba(236, 72, 153, 0.8)) drop-shadow(4px 0 0 rgba(34, 211, 238, 0.8)) brightness(1.35)',
        transition: 'none',
      }
    : {
        transform: 'none',
        filter: 'none',
        transition: 'filter 150ms ease-out, transform 150ms ease-out',
      };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none" style={{ zIndex: Z_LAYERS.VFX_BACKGROUND }}>
      {/* Glitch Tech Matrix Scanline Effect */}
      <div 
        className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent pointer-events-none"
        style={{
          top: '0%',
          animation: 'scanline 12s linear infinite'
        }}
      />
      
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-5vh); }
          100% { transform: translateY(105vh); }
        }
        @keyframes billboardFlicker {
          0%, 100% { opacity: 0.85; }
          45% { opacity: 0.85; }
          46% { opacity: 0.2; }
          47% { opacity: 0.9; }
          48% { opacity: 0.3; }
          49% { opacity: 0.85; }
          85% { opacity: 0.85; }
          86% { opacity: 0.15; }
          87% { opacity: 1; }
          88% { opacity: 0.85; }
        }
        .animate-billboard-flicker {
          animation: billboardFlicker var(--flicker-dur, 4s) ease-in-out infinite;
        }
      `}</style>

      {/* Sprawling Deep Lore: Wireframe Cyberpunk Skyline */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[38dvh] pointer-events-none select-none overflow-visible mix-blend-screen opacity-30"
        style={{
          ...megacityStyle,
          transformOrigin: 'bottom center',
          zIndex: Z_LAYERS.VFX_BACKGROUND,
        }}
      >
        <svg 
          viewBox="0 0 1000 300" 
          preserveAspectRatio="none" 
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="cyberSkylineGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d0e1c" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#020308" stopOpacity="0.95" />
            </linearGradient>
          </defs>
          
          {/* Sprawling background wireframe paths */}
          {buildings.map((b) => (
            <g key={b.id} className="opacity-75">
              {/* Solid building silhouette with subtle background color */}
              <rect
                x={b.x}
                y={300 - b.height}
                width={b.width}
                height={b.height}
                fill="url(#cyberSkylineGlow)"
                stroke={b.glowColor === '#06b6d4' ? 'rgba(6, 182, 212, 0.28)' : 'rgba(236, 72, 153, 0.28)'}
                strokeWidth="1.2"
              />
              
              {/* Internal wireframe grid details inside the building to look techy */}
              <line 
                x1={b.x + b.width / 2} 
                y1={300 - b.height} 
                x2={b.x + b.width / 2} 
                y2={300} 
                stroke={b.glowColor === '#06b6d4' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(236, 72, 153, 0.15)'} 
                strokeWidth="0.6" 
              />
              <line 
                x1={b.x} 
                y1={300 - b.height * 0.75} 
                x2={b.x + b.width} 
                y2={300 - b.height * 0.75} 
                stroke={b.glowColor === '#06b6d4' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(236, 72, 153, 0.15)'} 
                strokeWidth="0.6" 
              />
              <line 
                x1={b.x} 
                y1={300 - b.height * 0.4} 
                x2={b.x + b.width} 
                y2={300 - b.height * 0.4} 
                stroke={b.glowColor === '#06b6d4' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(236, 72, 153, 0.15)'} 
                strokeWidth="0.6" 
              />

              {/* Glowing Top-edge wireframe accent */}
              <line 
                x1={b.x} 
                y1={300 - b.height} 
                x2={b.x + b.width} 
                y2={300 - b.height} 
                stroke={b.glowColor} 
                strokeWidth="2.5" 
                style={{ filter: `drop-shadow(0 0 3px ${b.glowColor})` }}
              />
              
              {/* Faint Glowing Cyber Hologram Billboard */}
              {b.hasBillboard && (
                <g 
                  className="animate-billboard-flicker"
                  style={{
                    '--flicker-dur': `${3 + (b.id % 3) * 1.5}s`
                  } as React.CSSProperties}
                >
                  <rect
                    x={b.x + b.width * 0.1}
                    y={300 - b.height - 35}
                    width={b.width * 0.8}
                    height="20"
                    fill="rgba(3, 7, 18, 0.95)"
                    stroke={b.glowColor}
                    strokeWidth="1.2"
                    rx="2"
                    style={{ filter: `drop-shadow(0 0 3px ${b.glowColor})` }}
                  />
                  <text
                    x={b.x + b.width / 2}
                    y={300 - b.height - 21}
                    fill={b.glowColor}
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="900"
                    textAnchor="middle"
                    style={{ textShadow: `0 0 4px ${b.glowColor}` }}
                  >
                    {b.billboardText}
                  </text>
                  {/* Wire Support Stand for Billboard */}
                  <line 
                    x1={b.x + b.width * 0.35} 
                    y1={300 - b.height - 15} 
                    x2={b.x + b.width * 0.35} 
                    y2={300 - b.height} 
                    stroke={b.glowColor} 
                    strokeWidth="0.6" 
                    opacity="0.6" 
                  />
                  <line 
                    x1={b.x + b.width * 0.65} 
                    y1={300 - b.height - 15} 
                    x2={b.x + b.width * 0.65} 
                    y2={300 - b.height} 
                    stroke={b.glowColor} 
                    strokeWidth="0.6" 
                    opacity="0.6" 
                  />
                </g>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Falling corrupted ASCII terminal data nodes */}
      {nodes.map((node) => (
        <div
          key={node.id}
          className="absolute font-mono font-medium select-none pointer-events-none animate-data-fall"
          style={{
            left: node.left,
            top: '-10%',
            fontSize: node.size,
            color: node.color,
            textShadow: `0 0 4px ${node.color}55`,
            '--fall-duration': node.duration,
            '--max-opacity': node.maxOpacity,
            animationDelay: node.delay,
            transform: 'translate3d(0, 0, 0)',
          } as React.CSSProperties}
        >
          {node.glyph}
        </div>
      ))}

      {/* Screen Tear CRT Corruption Layer */}
      {fireTear && (
        <div
          className="absolute w-full h-20 mix-blend-difference pointer-events-none select-none animate-atomic-tear"
          style={{
            top: tearTop,
            background: 'linear-gradient(180deg, rgba(236,72,153,0.3) 0%, rgba(6,182,212,0.4) 50%, rgba(5,150,105,0.3) 100%)',
            boxShadow: '0 0 12px rgba(6, 182, 212, 0.4), inset 0 0 8px rgba(236, 72, 153, 0.4)',
          }}
        />
      )}
    </div>
  );
};
────────────────────────────────────────────────────────────────────────────────
