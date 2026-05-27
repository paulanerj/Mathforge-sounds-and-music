────────────────────────────────────────────────────────────────────────────────
export type MathMagicTheme = 'monument' | 'iron-forge' | 'stage-dive' | 'cinnamoroll' | 'kuromi' | 'glitch-wave' | 'celestial-orbit' | 'deep-sea';
export type VFXQuality = 'high' | 'low' | 'off';

export interface TrophyPalette {
  f: string; // Face
  d: string; // Depth/Extrusion
  h: string; // Highlight
  a: string; // Accent
  k: string; // Dark core/shadow
  m: string; // Mid-tone
  s: string; // Deep shadow
  l: string; // Light overlay
}

export const THEME_PALETTES: Record<string, TrophyPalette> = {
  'theme-monument': { f: '#FFD740', d: '#E65100', h: '#FFF9C4', a: '#FF8F00', k: '#4E342E', m: '#FFC107', s: '#BF360C', l: '#FFE082' },
  'theme-iron-forge': { f: '#CD7F32', d: '#6D3B0D', h: '#F5DEB3', a: '#A0522D', k: '#3E1F00', m: '#B87333', s: '#2D1400', l: '#DEB887' },
  'theme-celestial-orbit': { f: '#D8D8D8', d: '#484848', h: '#FFFFFF', a: '#9E9E9E', k: '#1A1A1A', m: '#BDBDBD', s: '#161616', l: '#F0F0F0' },
  'theme-deep-sea': { f: '#1E88E5', d: '#0A2472', h: '#BBDEFB', a: '#1565C0', k: '#050E30', m: '#1976D2', s: '#03086E', l: '#90CAF9' },
  'theme-stage-dive': { f: '#ec4899', d: '#831843', h: '#fbcfe8', a: '#be185d', k: '#4c0519', m: '#db2777', s: '#25040e', l: '#f9a8d4' },
  'theme-kuromi': { f: '#ec4899', d: '#831843', h: '#fbcfe8', a: '#be185d', k: '#4c0519', m: '#db2777', s: '#25040e', l: '#f9a8d4' },
  'theme-glitch-wave': { f: '#22d3ee', d: '#164e63', h: '#cffafe', a: '#0891b2', k: '#083344', m: '#06b6d4', s: '#042f2e', l: '#a5f3fc' },
};

export enum MathMagicPhase {
  INIT = 'INIT',
  PLAY = 'PLAY',
  MODAL_ACTIVE = 'MODAL_ACTIVE',
  SUMMARY = 'SUMMARY',
}

export enum MathMagicMode {
  DRAG_DROP = 'DRAG_DROP',
  RANDOMIZED_GRID = 'RANDOMIZED_GRID',
  TRUE_FALSE = 'TRUE_FALSE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  REPLACE = 'REPLACE',
  KEYPAD = 'KEYPAD',
  REVERSE_SEEK = 'REVERSE_SEEK',
  MULTIPLICATION_FINDER = 'MULTIPLICATION_FINDER',
  ADDITION_FINDER = 'ADDITION_FINDER',
  PATTERN_SWEEPER = 'PATTERN_SWEEPER',
}

export interface MathMagicTile {
  id: string;
  homeX: number;
  homeY: number;
  currentX: number;
  currentY: number;
  f1: number;
  f2: number;
  product: number; // Pedagogical Rule: Tiles never show equation, only product
  state: 'hidden' | 'locked';
  color: string;
  isSolved?: boolean;
}

export interface MathMagicConfig {
  cols: number;
  rows: number;
  activeFactors: number[];
  startRow: number;
  guides: boolean;
}

export interface MathMagicState {
  phase: MathMagicPhase;
  mode: MathMagicMode;
  config: MathMagicConfig;
  tiles: MathMagicTile[];
  score: number;
  problemQueue: string[];
  activeQuadrantTiles: Record<string, string | null>;
  activeTileId?: string | null; // For modal interaction
  isSettingsOpen: boolean;
  isInfoOpen: boolean;
  moves: number;
  startTime: number | null;
  endTime: number | null;
  comboCount: number;
  sessionMaxCombo: number;
  lastSolveTime: number | null;
  lastSolveDuration: number | null;
  problemStartTime: number | null;
  totalStars: number;
  sessionResults: {
    timeBroken: boolean;
    newMaxCombo: boolean;
    earnedStars: number;
    breakdown: { base: number; time: number; combo: number; };
    totalStars: number;
  } | null;
  activePatterns?: Record<string, {
    type: 'MULTIPLES_OF_3' | 'MULTIPLES_OF_4' | 'MULTIPLES_OF_5' | 'PRIMES' | 'EVENS' | 'ODDS';
    description: string;
    targetCount: number;
    foundIds: string[];
  }>;
}

export function getModeThreshold(mode: MathMagicMode): number {
  switch (mode) {
    case MathMagicMode.DRAG_DROP:
    case MathMagicMode.RANDOMIZED_GRID:
    case MathMagicMode.TRUE_FALSE:
      return 3000;
    default:
      return 5000;
  }
}

export type MathMagicAction =
  | { type: 'INIT_GAME'; mode: MathMagicMode; config: MathMagicConfig; tiles: MathMagicTile[]; totalStars: number }
  | { type: 'START_GAME'; mode: MathMagicMode; config: MathMagicConfig; tiles: MathMagicTile[] }
  | { type: 'SWAP_TILES'; sourceId: string; targetId: string }
  | { type: 'LOCK_TILE'; id: string; timestamp: number }
  | { type: 'SET_PROBLEM_START_TIME'; timestamp: number }
  | { type: 'RESOLVE_SESSION'; results: MathMagicState['sessionResults']; totalStars: number }
  | { type: 'TAP_RESOLVE'; id: string }
  | { type: 'OPEN_MODAL'; id: string; timestamp: number }
  | { type: 'CLOSE_MODAL' }
  | { type: 'OPEN_SETTINGS' }
  | { type: 'CLOSE_SETTINGS' }
  | { type: 'OPEN_INFO' }
  | { type: 'CLOSE_INFO' }
  | { type: 'ERROR_COMBO_RESET' }
  | { type: 'CLEAR_QUADRANT'; qKey: string; timestamp: number }
  | { type: 'REBUILD_GRID'; config: MathMagicConfig; mode: MathMagicMode; tiles: MathMagicTile[] };
────────────────────────────────────────────────────────────────────────────────
