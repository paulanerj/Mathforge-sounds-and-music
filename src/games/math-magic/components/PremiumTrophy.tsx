import React from 'react';
import { TrophyPalette, THEME_PALETTES } from '../types';

interface PremiumTrophyProps {
  themeName: string;
  value: number | string;
}

export const PremiumTrophy = React.memo(({ themeName, value }: PremiumTrophyProps) => {
  const c = THEME_PALETTES[themeName] || THEME_PALETTES['theme-monument'];

  return (
    <div className="w-full h-full flex items-center justify-center animate-trophy-celebrate">
      <svg 
        viewBox="0 0 100 124" 
        className="w-[105%] h-[105%] drop-shadow-xl"
        overflow="visible"
      >
        {/* --- PORTAL / HALO (Top Section) --- */}
        <circle cx="50" cy="44" r="34" fill={c.k} />
        <circle cx="50" cy="44" r="32" fill={c.f} />
        <circle cx="50" cy="44" r="24" fill={c.k} />
        <circle cx="54" cy="48" r="28" fill={c.d} opacity={0.25} />
        <ellipse cx="36" cy="30" rx="14" ry="10" fill={c.h} opacity={0.28} transform="rotate(-25 36 30)" />
        <circle cx="50" cy="44" r="32" fill="none" stroke={c.h} strokeWidth={1.5} opacity={0.3} />
        <circle cx="50" cy="44" r="24" fill="none" stroke={c.d} strokeWidth={1} opacity={0.35} />
        <polygon points="18,44 26,44 26,32 18,32" fill={c.d} opacity={0.3} />
        <circle cx="38" cy="28" r="4" fill={c.h} opacity={0.4} />
        <circle cx="37" cy="27" r="1.5" fill="white" opacity={0.3} />

        {/* --- CONNECTOR (Middle Section) --- */}
        <polygon points="38,76 62,76 62,82 38,82" fill={c.a} />
        <polygon points="38,76 31,71 31,77 38,82" fill={c.d} />
        <polygon points="38,76 31,71 69,71 62,76" fill={c.l} opacity={0.22} />

        {/* --- BASE PEDESTAL (Bottom Section) --- */}
        <polygon points="14,94 7,89 7,103 14,108" fill={c.s} />
        <polygon points="14,94 7,89 93,89 86,94" fill={c.a} />
        <polygon points="14,94 86,94 86,108 14,108" fill={c.m} />
        <polygon points="14,108 7,103 93,103 86,108" fill={c.k} />
        <polygon points="28,82 21,77 21,89 28,94" fill={c.d} />
        <polygon points="28,82 21,77 79,77 72,82" fill={c.f} opacity={0.7} />
        <polygon points="28,82 72,82 72,94 28,94" fill={c.a} />
        <line x1="30" y1="88" x2="70" y2="88" stroke={c.l} strokeWidth={0.7} opacity={0.35} />

        {/* --- TARGET MATH VALUE --- */}
        <text 
          x="50" 
          y="46" 
          textAnchor="middle" 
          dominantBaseline="middle" 
          fill={c.h} 
          fontSize="36" 
          fontWeight="900"
          className="font-sans drop-shadow-md"
        >
          {value}
        </text>
      </svg>
    </div>
  );
});