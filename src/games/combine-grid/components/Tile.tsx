import React from 'react';
import { BASE_RADIUS_PX, PAD, COLORS, SHADOWS } from '../uiTokens';
import { ZERO_TILE_VALUE, BOMB_TILE_VALUE, WILDCARD_ANIM } from '../constants';

interface ColorFamily {
  base: string;
  mid: string;
  top: string;
  marble: string;
}

const COLOR_FAMILIES: Record<number, ColorFamily> = {
  0: { base: '#D8CDBC', mid: '#E8DDCB', top: '#F5E6D3', marble: 'rgba(255,255,255,0.2)' }, // Zero/Neutral
  1: { base: '#D67A8A', mid: '#E88D8D', top: '#F4A4A4', marble: 'rgba(255,255,255,0.12)' }, // Pink
  2: { base: '#7AA8B8', mid: '#8DB8D0', top: '#A4D0E4', marble: 'rgba(255,255,255,0.12)' }, // Blue
  3: { base: '#8DB8D0', mid: '#A4D0E4', top: '#B8E0F4', marble: 'rgba(255,255,255,0.12)' }, // Lighter Blue
  4: { base: '#94B88D', mid: '#A8C69F', top: '#BCE0B4', marble: 'rgba(255,255,255,0.12)' }, // Green
  5: { base: '#E49450', mid: '#F8A460', top: '#FFB878', marble: 'rgba(255,255,255,0.12)' }, // Orange
  6: { base: '#D4B85F', mid: '#F4D06F', top: '#FFE484', marble: 'rgba(255,255,255,0.12)' }, // Yellow
  7: { base: '#C47A50', mid: '#D88D60', top: '#ECA478', marble: 'rgba(255,255,255,0.12)' }, // Terracotta
  8: { base: '#B87AA8', mid: '#CC8DB8', top: '#E0A4C8', marble: 'rgba(255,255,255,0.12)' }, // Purple
  9: { base: '#D67A7A', mid: '#E88D8D', top: '#F4A4A4', marble: 'rgba(255,255,255,0.12)' }, // Red
};

function getFamily(val: number): ColorFamily {
  if (val === ZERO_TILE_VALUE) {
    return { base: '#5D4280', mid: '#7B5EAF', top: '#9B81D8', marble: 'rgba(255,255,255,0.2)' };
  }
  if (val === 0) return COLOR_FAMILIES[0]!;
  const index = ((val - 1) % 9) + 1;
  return COLOR_FAMILIES[index] ?? COLOR_FAMILIES[1]!;
}

const backgroundCache = new Map<string, string>();

export function tileBackground(val: number, isTrophy: boolean, isFrozen?: boolean): string {
  const cacheKey = `${val}-${isTrophy}-${!!isFrozen}`;
  if (backgroundCache.has(cacheKey)) {
    return backgroundCache.get(cacheKey)!;
  }

  let result = '';
  if (isTrophy) {
    result = [
      'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 50%)',
      'linear-gradient(148deg, #FFD700 0%, #F8A460 100%)',
    ].join(', ');
  } else if (isFrozen) {
    result = [
      'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)',
      'linear-gradient(148deg, #4A5568 0%, #2D3748 100%)', 
      'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)', 
    ].join(', ');
  } else if (val === BOMB_TILE_VALUE) {
    result = [
      'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)',
      'linear-gradient(148deg, #E88D8D 0%, #D67A7A 100%)',
    ].join(', ');
  } else if (val <= 0 && val !== ZERO_TILE_VALUE) {
    result = '#f5e6d3';
  } else {
    const f = getFamily(val);
    result = [
      `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
      `radial-gradient(ellipse at 70% 70%, ${f.marble} 0%, transparent 40%)`,
      `linear-gradient(148deg, ${f.top} 0%, ${f.mid} 45%, ${f.base} 100%)`,
    ].join(', ');
  }

  backgroundCache.set(cacheKey, result);
  return result;
}

export const DRAG_SRC_SHADOW = SHADOWS.drag;

const BASE_SHADOW = SHADOWS.base;
const SEL_SHADOW =
  '0 0 0 4px rgba(255,255,255,0.9), 0 8px 20px rgba(0,0,0,0.12)';
const TROPHY_SHADOW = SHADOWS.trophy;
const FROZEN_SHADOW = SHADOWS.frozen;
const DROP_INVALID_SHADOW =
  '0 0 0 4px rgba(239,68,68,0.4), 0 8px 20px rgba(0,0,0,0.12)';
const DROP_VALID_SHADOW =
  '0 0 0 4px rgba(96,165,250,0.4), 0 8px 20px rgba(0,0,0,0.12)';
const DROP_TROPHY_SHADOW =
  '0 0 0 4px rgba(255,215,0,0.4), 0 8px 20px rgba(0,0,0,0.12)';
const BOMB_SHADOW =
  '0 4px 8px rgba(0,0,0,0.1), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.4)';

interface TileProps {
  val: number;
  size: number;
  row: number;
  col: number;
  selected: boolean;
  clearing: boolean;
  isDragSource?: boolean;
  isDropTarget?: boolean;
  isTrophy?: boolean;
  isFrozen?: boolean;
  isFactorIndicator?: boolean;
  isDistractorIndicator?: boolean;
  isBombLit?: boolean;
  isPopping?: boolean;
  isSpawning?: boolean;
  isCounting?: boolean;
  isCounted?: boolean;
  isWildcardAnimated?: boolean;
  wildcardAnimProgress?: number;
  isBlockedAnimated?: boolean;
  isExploding?: boolean;
  mergeHighlight?: 'invalid' | 'valid' | 'trophy';
  key?: string;
}

function TrophyIcon({ size }: { size: number }) {
  const s = size * 0.55;
  return (
    <div style={{ position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', width: s, height: s, borderBottom: '2px solid rgba(255,215,0,0.2)' }}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 9V2H18V9C18 12.3137 15.3137 15 12 15C8.68629 15 6 12.3137 6 9Z" fill="#FFD700" stroke="#B8860B" strokeWidth="1"/>
        <path d="M6 5H4C2.89543 5 2 5.89543 2 7V8C2 9.10457 2.89543 10 4 10H6" stroke="#B8860B" strokeWidth="1"/>
        <path d="M18 5H20C21.1046 5 22 5.89543 22 7V8C22 9.10457 21.1046 10 20 10H18" stroke="#B8860B" strokeWidth="1"/>
        <path d="M12 15V22" stroke="#B8860B" strokeWidth="1.5"/>
        <path d="M7 22H17" stroke="#B8860B" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}

function BombIcon({ size, isLit }: { size: number; isLit: boolean }) {
  const s = size * 0.6;
  return (
    <svg
      width={s} height={s}
      viewBox="0 0 40 40"
      fill="none"
      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
    >
      <circle cx="20" cy="24" r="14" fill="#333" />
      <circle cx="15" cy="18" r="4" fill="rgba(255,255,255,0.15)" />
      <rect x="17" y="6" width="6" height="6" rx="1" fill="#444" />
      <path
        d="M20 6 Q25 0 30 4"
        stroke={isLit ? '#FFD700' : '#666'}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        style={isLit ? { animation: 'cgFuseGlow 0.4s ease-in-out infinite' } : undefined}
      />
    </svg>
  );
}

function TileNumber({
  val, size, isTrophy, isFrozen,
}: { val: number; size: number; isTrophy: boolean; isFrozen: boolean }) {
  const display = isTrophy
    ? String(val)
    : isFrozen
    ? String(val)
    : val === ZERO_TILE_VALUE
    ? '?'
    : val <= 0
    ? '·'
    : String(val);

  const isLightTile = val === 1;
  
  const color = isTrophy
    ? '#5D4037'
    : isFrozen
    ? '#A0AEC0'
    : isLightTile 
    ? '#8B7D6B' 
    : 'rgba(255, 255, 255, 0.95)';

  const textShadow = isTrophy
    ? '0 1px 0 rgba(255,255,255,0.4)'
    : isLightTile
    ? '0 1px 1px rgba(255,255,255,0.8), 0 -1px 1px rgba(0,0,0,0.1)'
    : '0 1px 1px rgba(0,0,0,0.2), 0 -1px 1px rgba(255,255,255,0.3)';

  return (
    <span
      style={{
        position: 'relative',
        zIndex: 2,
        fontSize: size * (isTrophy ? 0.32 : 0.48),
        fontWeight: 800,
        color,
        textShadow,
        letterSpacing: '-0.03em',
        lineHeight: 1,
        marginTop: isTrophy ? '38%' : 0,
        fontFamily: 'inherit',
      }}
    >
      {display}
    </span>
  );
}

export const Tile = React.memo(function Tile({
  val,
  size,
  row,
  col,
  selected,
  clearing,
  isDragSource,
  isDropTarget,
  isTrophy,
  isFrozen,
  isFactorIndicator,
  isDistractorIndicator,
  isBombLit,
  isPopping,
  isSpawning,
  isCounting,
  isCounted,
  isWildcardAnimated,
  wildcardAnimProgress = 0,
  isBlockedAnimated,
  isExploding,
  mergeHighlight,
}: TileProps) {
  if (val === undefined || val === null) {
    console.error(`Undefined tile detected at [${row}, ${col}]`);
    return null;
  }

  const radius = size * 0.12;
  const isBomb = val === BOMB_TILE_VALUE;
  const isZero = val === ZERO_TILE_VALUE;

  const dropTargetShadow =
    mergeHighlight === 'invalid' ? DROP_INVALID_SHADOW
    : mergeHighlight === 'trophy' ? DROP_TROPHY_SHADOW
    : DROP_VALID_SHADOW;

  const countingShadow = '0 0 30px rgba(255, 215, 0, 0.8), 0 0 10px rgba(255, 255, 255, 0.4)';
  const countedShadow = '0 0 15px rgba(255, 215, 0, 0.4)';

  const boxShadow = isCounting
    ? countingShadow
    : isCounted
    ? countedShadow
    : isTrophy
    ? TROPHY_SHADOW
    : isFrozen
    ? FROZEN_SHADOW
    : isBomb
    ? BOMB_SHADOW
    : isDragSource
    ? 'inset 0 4px 12px rgba(0,0,0,0.4)' 
    : isDropTarget
    ? dropTargetShadow
    : selected
    ? SEL_SHADOW
    : BASE_SHADOW;

  const border = 'none';

  const baseScale = isDragSource || isDropTarget || selected || isCounting ? 'scale(1.15)' : 'scale(1)';

  const animation = isExploding
    ? 'cgTileBlast 0.4s ease-out forwards'
    : isCounting
    ? 'cgTilePop 0.3s ease-out'
    : isSpawning
    ? 'cgTileSpawn 0.4s ease-out'
    : isPopping
    ? 'cgTilePop 0.3s ease-out'
    : isTrophy
    ? 'cgTrophyPulse 2s ease-in-out infinite'
    : isBomb && !isBombLit
    ? 'cgBombIdle 2.5s ease-in-out infinite'
    : undefined;

  const cursor = isFrozen ? 'default' : 'pointer';

  const bg = isDragSource 
    ? 'rgba(0,0,0,0.25)' 
    : isCounted
    ? 'linear-gradient(148deg, #FFD700 0%, #FFB878 100%)'
    : tileBackground(val, isTrophy ?? false, isFrozen);

  let finalTransform = animation ? undefined : baseScale;
  if (isWildcardAnimated) {
    // Tight accelerating vibration
    // Use power of progress to ramp up frequency rapidly at the end
    const freq = WILDCARD_ANIM.SHAKE_FREQ_BASE + Math.pow(wildcardAnimProgress, 4) * WILDCARD_ANIM.SHAKE_FREQ_MULT;
    // Amplitude starts subtle, gets slightly more intense, then tightens
    const amp = wildcardAnimProgress < WILDCARD_ANIM.AMP_BREAKPOINT 
      ? (WILDCARD_ANIM.AMP_START_BASE + wildcardAnimProgress * WILDCARD_ANIM.AMP_START_MULT) 
      : (WILDCARD_ANIM.AMP_END_BASE - (wildcardAnimProgress - WILDCARD_ANIM.AMP_BREAKPOINT) * WILDCARD_ANIM.AMP_END_MULT); 
    
    const t = wildcardAnimProgress * freq + row * WILDCARD_ANIM.ROW_OFFSET_MULT + col * WILDCARD_ANIM.COL_OFFSET_MULT;
    const shakeX = Math.sin(t) * amp;
    const shakeY = Math.cos(t * WILDCARD_ANIM.Y_PHASE_OFFSET) * amp;
    
    // Slight scale up during the crescendo
    const grow = WILDCARD_ANIM.GROW_BASE + wildcardAnimProgress * WILDCARD_ANIM.GROW_MULT;
    finalTransform = `translate(${shakeX}px, ${shakeY}px) scale(${grow})`;
  }

  return (
    <button
      data-row={row}
      data-col={col}
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: radius,
        padding: PAD,
        border,
        background: bg,
        boxShadow,
        opacity: clearing ? 0 : (isBlockedAnimated ? 0.3 : 1),
        // TILE_TRANSITION_CONTRACT
        transition: isWildcardAnimated ? 'none' : 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transform: finalTransform,
        animation,
        cursor,
        userSelect: 'none',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
      }}
    >
      {!isDragSource && (
        <>
          {isTrophy && <TrophyIcon size={size} />}
          {isBomb && <BombIcon size={size} isLit={isBombLit ?? false} />}
          {!isBomb && (
            <TileNumber
              val={val}
              size={size}
              isTrophy={isTrophy ?? false}
              isFrozen={isFrozen ?? false}
            />
          )}
          {isFrozen && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.1)',
              borderRadius: radius,
              pointerEvents: 'none',
              boxShadow: 'inset 0 0 15px rgba(0,0,0,0.4)',
            }} />
          )}
          {isFactorIndicator && (
             <div style={{
               position: 'absolute',
               top: size * 0.08,
               right: size * 0.08,
               width: size * 0.1,
               height: size * 0.1,
               minWidth: 4,
               minHeight: 4,
               maxWidth: 8,
               maxHeight: 8,
               borderRadius: '50%',
               backgroundColor: '#10b981', /* emerald green */
               opacity: 0.65,
               pointerEvents: 'none',
             }} />
          )}
          {isDistractorIndicator && (
             <div style={{
               position: 'absolute',
               top: size * 0.08,
               right: size * 0.08,
               width: size * 0.1,
               height: size * 0.1,
               minWidth: 4,
               minHeight: 4,
               maxWidth: 8,
               maxHeight: 8,
               borderRadius: '50%',
               backgroundColor: '#d97706', /* muted amber */
               opacity: 0.5,
               pointerEvents: 'none',
             }} />
          )}
        </>
      )}
    </button>
  );
});

export default Tile;