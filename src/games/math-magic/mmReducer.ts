────────────────────────────────────────────────────────────────────────────────
import { MathMagicState, MathMagicAction, MathMagicPhase, MathMagicMode, MathMagicTile } from './types';
import { StorageService } from './StorageService';
import { ModeRegistry } from './modes/ModeRegistry';

export const GRID_ROWS = 12;
export const GRID_COLS = 12;

function isPrime(num: number): boolean {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
}

function testPatternCondition(num: number, conditionType: string): boolean {
  switch (conditionType) {
    case 'MULTIPLES_OF_3': return num % 3 === 0;
    case 'MULTIPLES_OF_4': return num % 4 === 0;
    case 'MULTIPLES_OF_5': return num % 5 === 0;
    case 'EVENS': return num % 2 === 0;
    case 'ODDS': return num % 2 !== 0;
    case 'PRIMES': return isPrime(num);
    default: return false;
  }
}

function generatePatternForQuadrant(tiles: MathMagicTile[], qKey: string) {
  const [qx, qy] = qKey.split(',').map(Number);
  const qTiles = tiles.filter(t => t.homeX >= qx && t.homeX < qx + 6 && t.homeY >= qy && t.homeY < qy + 6);

  const patternOptions = [
    { type: 'MULTIPLES_OF_3', description: 'Multiples of 3' },
    { type: 'MULTIPLES_OF_4', description: 'Multiples of 4' },
    { type: 'MULTIPLES_OF_5', description: 'Multiples of 5' },
    { type: 'EVENS', description: 'Even Numbers' },
    { type: 'ODDS', description: 'Odd Numbers' },
    { type: 'PRIMES', description: 'Prime Numbers' },
  ] as const;

  // Try picking a pattern option that has matches, fallback to Even or Odd if none
  let chosen = patternOptions[Math.floor(Math.random() * patternOptions.length)];
  let matches = qTiles.filter(t => testPatternCondition(t.product, chosen.type));

  let limit = 0;
  while (matches.length < 3 && limit < 15) {
    chosen = patternOptions[Math.floor(Math.random() * patternOptions.length)];
    matches = qTiles.filter(t => testPatternCondition(t.product, chosen.type));
    limit++;
  }

  if (matches.length === 0) {
    chosen = { type: 'EVENS', description: 'Even Numbers' };
    matches = qTiles.filter(t => testPatternCondition(t.product, chosen.type));
  }

  return {
    type: chosen.type,
    description: chosen.description,
    targetCount: matches.length,
    foundIds: [] as string[],
  };
}

export function getSweetspotMs(mode: MathMagicMode): number {
  return ModeRegistry[mode]?.sweetspotMs ?? 2000;
}


export const initialMathMagicState: MathMagicState = {
  phase: MathMagicPhase.INIT,
  mode: MathMagicMode.DRAG_DROP,
  config: { cols: GRID_COLS, rows: GRID_ROWS, activeFactors: [1,2,3,4,5,6,7,8,9,10,11,12], startRow: 1, guides: true },
  tiles: [],
  score: 0,
  problemQueue: [],
  activeQuadrantTiles: { '0,0': null, '6,0': null, '0,6': null, '6,6': null },
  isSettingsOpen: false,
  isInfoOpen: false,
  moves: 0,
  startTime: null,
  endTime: null,
  comboCount: 0,
  sessionMaxCombo: 0,
  lastSolveTime: null,
  lastSolveDuration: null,
  problemStartTime: null,
  totalStars: 0,
  sessionResults: null,
};

function getNextQuadrantProblem(queue: string[], tiles: import('./types').MathMagicTile[], qKey: string): string | null {
  const [qx, qy] = qKey.split(',').map(Number);
  for (let i = queue.length - 1; i >= 0; i--) {
    const tid = queue[i];
    const t = tiles.find(x => x.id === tid);
    if (t && t.homeX >= qx && t.homeX < qx + 6 && t.homeY >= qy && t.homeY < qy + 6) {
       return queue.splice(i, 1)[0];
    }
  }
  return null;
}

export function mmReducer(state: MathMagicState, action: MathMagicAction): MathMagicState {
  switch (action.type) {
    case 'INIT_GAME':
      return {
        ...state,
        phase: MathMagicPhase.PLAY,
        mode: action.mode,
        config: {
          ...action.config,
          cols: GRID_COLS,
          rows: GRID_ROWS
        },
        tiles: action.tiles,
        score: 0,
        problemQueue: [...action.tiles].map(t => t.id).sort(() => Math.random() - 0.5),
        activeQuadrantTiles: {
          '0,0': getNextQuadrantProblem([...action.tiles].map(t => t.id).sort(() => Math.random() - 0.5), action.tiles, '0,0'),
          '6,0': getNextQuadrantProblem([...action.tiles].map(t => t.id).sort(() => Math.random() - 0.5), action.tiles, '6,0'),
          '0,6': getNextQuadrantProblem([...action.tiles].map(t => t.id).sort(() => Math.random() - 0.5), action.tiles, '0,6'),
          '6,6': getNextQuadrantProblem([...action.tiles].map(t => t.id).sort(() => Math.random() - 0.5), action.tiles, '6,6'),
        },
        activePatterns: action.mode === MathMagicMode.PATTERN_SWEEPER ? {
          '0,0': generatePatternForQuadrant(action.tiles, '0,0'),
          '6,0': generatePatternForQuadrant(action.tiles, '6,0'),
          '0,6': generatePatternForQuadrant(action.tiles, '0,6'),
          '6,6': generatePatternForQuadrant(action.tiles, '6,6'),
        } : undefined,
        isSettingsOpen: false,
        isInfoOpen: false,
        moves: 0,
        startTime: Date.now(),
        endTime: null,
        comboCount: 0,
        sessionMaxCombo: 0,
        lastSolveTime: null,
        lastSolveDuration: null,
        problemStartTime: Date.now(),
        totalStars: action.totalStars,
        sessionResults: null,
      };

    case 'START_GAME':
    case 'REBUILD_GRID': {
      const problemQueue = [...action.tiles].map(t => t.id).sort(() => Math.random() - 0.5);
      const activeQuadrantTiles = {
        '0,0': getNextQuadrantProblem(problemQueue, action.tiles, '0,0'),
        '6,0': getNextQuadrantProblem(problemQueue, action.tiles, '6,0'),
        '0,6': getNextQuadrantProblem(problemQueue, action.tiles, '0,6'),
        '6,6': getNextQuadrantProblem(problemQueue, action.tiles, '6,6'),
      };

      return {
        ...state,
        phase: MathMagicPhase.PLAY,
        mode: action.mode,
        config: {
          ...action.config,
          cols: GRID_COLS,
          rows: GRID_ROWS
        },
        tiles: action.tiles,
        score: 0,
        problemQueue,
        activeQuadrantTiles,
        activePatterns: action.mode === MathMagicMode.PATTERN_SWEEPER ? {
          '0,0': generatePatternForQuadrant(action.tiles, '0,0'),
          '6,0': generatePatternForQuadrant(action.tiles, '6,0'),
          '0,6': generatePatternForQuadrant(action.tiles, '0,6'),
          '6,6': generatePatternForQuadrant(action.tiles, '6,6'),
        } : undefined,
        isSettingsOpen: false,
        isInfoOpen: false,
        moves: 0,
        startTime: Date.now(),
        endTime: null,
        comboCount: 0,
        sessionMaxCombo: 0,
        lastSolveTime: null,
        lastSolveDuration: null,
        problemStartTime: Date.now(),
        sessionResults: null,
      };
    }
    
    case 'SWAP_TILES': {
      const { sourceId, targetId } = action;
      const srcTile = state.tiles.find(t => t.id === sourceId);
      const tgtTile = state.tiles.find(t => t.id === targetId);
      
      if (!srcTile || !tgtTile) return state;

      const newTiles = state.tiles.map(tile => {
        if (tile.id === sourceId) {
          return { ...tile, currentX: tgtTile.currentX, currentY: tgtTile.currentY };
        }
        if (tile.id === targetId) {
          return { ...tile, currentX: srcTile.currentX, currentY: srcTile.currentY };
        }
        return tile;
      });
      
      return { ...state, tiles: newTiles, moves: state.moves + 1 };
    }
    
    case 'LOCK_TILE': {
      const idx = state.tiles.findIndex(t => t.id === action.id);
      if (idx === -1) return state;
      const newTiles = [...state.tiles];
      newTiles[idx] = { ...newTiles[idx], state: 'locked', isSolved: true };
      const newScore = state.score + 1;
      const phase = newScore >= state.tiles.length ? MathMagicPhase.SUMMARY : MathMagicPhase.PLAY;
      
      const lockedTile = newTiles[idx];
      const qx = Math.floor(lockedTile.homeX / 6) * 6;
      const qy = Math.floor(lockedTile.homeY / 6) * 6;
      const qKey = `${qx},${qy}`;

      let activePatterns = state.activePatterns;
      if (state.mode === MathMagicMode.PATTERN_SWEEPER && activePatterns) {
        const pat = activePatterns[qKey];
        if (pat && !pat.foundIds.includes(action.id)) {
          activePatterns = {
            ...activePatterns,
            [qKey]: {
              ...pat,
              foundIds: [...pat.foundIds, action.id]
            }
          };
        }
      }
      
      const nextProblemQueue = [...state.problemQueue];
      const nextActiveQuadrantTiles = { ...state.activeQuadrantTiles };
      
      const activeId = state.activeQuadrantTiles[qKey];
      const activeTile = activeId ? newTiles.find(t => t.id === activeId) : null;
      const isAdditionFinderSolved = state.mode === MathMagicMode.ADDITION_FINDER && activeTile && (lockedTile.product === activeTile.f1 + activeTile.f2);
      const isStandardFinderSolved = (state.mode === MathMagicMode.REVERSE_SEEK || state.mode === MathMagicMode.MULTIPLICATION_FINDER) && activeId === action.id;

      if (isAdditionFinderSolved || isStandardFinderSolved) {
          nextActiveQuadrantTiles[qKey] = getNextQuadrantProblem(nextProblemQueue, newTiles, qKey);
      }
      
      const now = action.timestamp;
      const problemStartTime = state.problemStartTime || state.startTime || now;
      const solveDuration = now - problemStartTime;
      const threshold = getSweetspotMs(state.mode);
      
      let comboCount = state.comboCount;
      if (solveDuration <= threshold) {
        comboCount = Math.min(10, comboCount + 1);
      } else {
        comboCount = Math.max(0, comboCount - 1);
      }

      console.log('Solve Duration:', solveDuration, 'Threshold:', threshold, 'Old Combo:', state.comboCount, 'New Combo:', comboCount);

      
      let sessionMaxCombo = state.sessionMaxCombo;
      if (comboCount > sessionMaxCombo) {
        sessionMaxCombo = comboCount;
      }
      
      let sessionResults = state.sessionResults;
      let totalStars = state.totalStars;
      
      if (phase === MathMagicPhase.SUMMARY && !sessionResults) {
        const timeMs = now - (state.startTime || now);
        const quadrantKey = `12x12`;
        sessionResults = StorageService.saveSession(state.mode, quadrantKey, timeMs, sessionMaxCombo);
        totalStars = sessionResults.totalStars;
      }
      
      return { 
        ...state, 
        tiles: newTiles, 
        score: newScore, 
        phase, 
        activeTileId: null, 
        problemQueue: nextProblemQueue,
        activeQuadrantTiles: nextActiveQuadrantTiles,
        activePatterns,
        moves: state.moves + 1,
        endTime: phase === MathMagicPhase.SUMMARY ? now : state.endTime,
        comboCount,
        sessionMaxCombo,
        lastSolveTime: now,
        lastSolveDuration: solveDuration,
        problemStartTime: now,
        sessionResults,
        totalStars,
      };
    }
    
    case 'RESOLVE_SESSION': {
      return {
        ...state,
        sessionResults: action.results,
        totalStars: action.totalStars
      };
    }

    case 'CLEAR_QUADRANT': {
      const { qKey } = action;
      const [qx, qy] = qKey.split(',').map(Number);
      
      const newTiles = state.tiles.map(t => {
        if (t.homeX >= qx && t.homeX < qx + 6 && t.homeY >= qy && t.homeY < qy + 6) {
          return { ...t, state: 'locked' as const, isSolved: true };
        }
        return t;
      });

      const newScore = newTiles.filter(t => t.state === 'locked').length;
      const phase = newScore >= newTiles.length ? MathMagicPhase.SUMMARY : MathMagicPhase.PLAY;

      let sessionResults = state.sessionResults;
      let totalStars = state.totalStars;
      if (phase === MathMagicPhase.SUMMARY && !sessionResults) {
        const now = action.timestamp;
        const timeMs = now - (state.startTime || now);
        const quadrantKey = `12x12`;
        sessionResults = StorageService.saveSession(state.mode, quadrantKey, timeMs, state.sessionMaxCombo);
        totalStars = sessionResults.totalStars;
      }

      return {
        ...state,
        tiles: newTiles,
        score: newScore,
        phase,
        moves: state.moves + 1,
        startTime: state.startTime || action.timestamp,
        endTime: phase === MathMagicPhase.SUMMARY ? action.timestamp : state.endTime,
        sessionResults,
        totalStars,
      };
    }
    
    case 'OPEN_MODAL':
      return { ...state, phase: MathMagicPhase.MODAL_ACTIVE, activeTileId: action.id, problemStartTime: action.timestamp };
      
    case 'SET_PROBLEM_START_TIME':
      return { ...state, problemStartTime: action.timestamp };
      
    case 'CLOSE_MODAL':
      return { ...state, phase: MathMagicPhase.PLAY, activeTileId: null };
    
    case 'OPEN_SETTINGS':
      return { ...state, isSettingsOpen: true };
      
    case 'CLOSE_SETTINGS':
      return { ...state, isSettingsOpen: false };

    case 'OPEN_INFO':
      return { ...state, isInfoOpen: true };

    case 'CLOSE_INFO':
      return { ...state, isInfoOpen: false };
      
    case 'ERROR_COMBO_RESET':
      return { ...state, comboCount: 0 };
    
    default:
      return state;
  }
}

────────────────────────────────────────────────────────────────────────────────
