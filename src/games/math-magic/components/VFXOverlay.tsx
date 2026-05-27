────────────────────────────────────────────────────────────────────────────────
import React, { memo } from 'react';
import { CelestialVFX } from './vfx/CelestialVFX';
import { ForgeVFX } from './vfx/ForgeVFX';
import { DeepSeaVFX } from './vfx/DeepSeaVFX';
import { GlitchWaveVFX } from './vfx/GlitchWaveVFX';
import { CinnamorollVFX } from './vfx/CinnamorollVFX';
import { MonumentVFX } from './vfx/MonumentVFX';
import { KuromiVFX } from './vfx/KuromiVFX';
import { StageDiveVFX } from './vfx/StageDiveVFX';
import { MathMagicTheme, VFXQuality } from '../types';
import { Z_LAYERS } from '../../../engine/layout/LayerTokens';

interface VFXOverlayProps {
  activeTheme: MathMagicTheme;
  vfxQuality: VFXQuality;
}

/* --- MASTER SWITCHBOARD COMPONENT --- */

export const VFXOverlay = memo(
  ({ activeTheme, vfxQuality }: VFXOverlayProps) => {
    // Performance and Battery checklist: if quality state is 'off', return immediately
    if (vfxQuality === 'off') {
      return null;
    }

    // Render the specific visual effects strategy inside a root layer wrapper
    // enforcing absolute highest visual presentation layer with strictly "pointer-events-none" safety.
    return (
      <div 
        className="absolute inset-x-0 inset-y-0 w-full h-full pointer-events-none select-none overflow-hidden" 
        style={{ 
          pointerEvents: 'none',
          zIndex: Z_LAYERS.VFX_BACKGROUND
        }}
      >
        {(() => {
          switch (activeTheme) {
            case 'celestial-orbit':
              return <CelestialVFX quality={vfxQuality} />;
            case 'iron-forge':
              return <ForgeVFX quality={vfxQuality} />;
            case 'deep-sea':
              return <DeepSeaVFX quality={vfxQuality} />;
            case 'cinnamoroll':
              return <CinnamorollVFX quality={vfxQuality} />;
            case 'kuromi':
              return <KuromiVFX quality={vfxQuality} />;
            case 'glitch-wave':
              return <GlitchWaveVFX quality={vfxQuality} />;
            case 'stage-dive':
              return <StageDiveVFX quality={vfxQuality} />;
            case 'monument':
              return <MonumentVFX quality={vfxQuality} />;
            default:
              return null;
          }
        })()}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.activeTheme === nextProps.activeTheme && prevProps.vfxQuality === nextProps.vfxQuality;
  }
);
────────────────────────────────────────────────────────────────────────────────
