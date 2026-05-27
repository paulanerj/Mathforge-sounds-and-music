import { PracticeProfile } from '../../engine/PracticeProfile';
import { ROWS, COLS, BOMB_TILE_VALUE } from './constants';
import type { EvalMode, GameMode } from './types';
import { validateBoard, countCombinableTiles, hasBombs } from './services/GridService';
import { makePrng } from '../../engine/public';
import { CombineGridRules, CGState, Action } from './CombineGridRules';
import { GridPos } from '../../engine/grid/GridTypes';
import { assertNoSystemLeak } from '../../engine/ENGINE_CONTRACT';

import { diffBoards, enforceStaticLaw } from './debug/cgBoardDiff';
import { assertPosition, assertPositions } from './debug/assertPosition';

export type { CGState, Action }; 

function clone2D<T>(arr: T[][]): T[][] {
  return arr.map(r => [...r]);
}

function snapshotState(state: CGState): CGState {
  const clonePosList = (list: GridPos[]) => list.map(p => ({ row: p.row, col: p.col }));
  
  return {
    ...state,
    board: clone2D(state.board),
    bonusMask: clone2D(state.bonusMask),
    trophyMask: clone2D(state.trophyMask),
    frozenMask: clone2D(state.frozenMask),
    
    roundScores: [...state.roundScores],
    // CRITICAL: History snapshot MUST be clean of transient visual states
    clearingPositions: [],
    respawnPositions: [],
    zeroRespawnPositions: [],
    factorBag: [...state.factorBag],
    distractorBag: [...state.distractorBag],
    oneBag: [...state.oneBag],
    zeroBag: [...state.zeroBag],
    categoryBag: [...state.categoryBag],
    recentSpawns: [...state.recentSpawns],
    logEvents: [...state.logEvents],
    countedTrophies: clonePosList(state.countedTrophies || []),
    
    counts: { ...(state.counts || {}) },
    
    dragSource: null,
    selection: [],
    selectionVal: 0,
    ignitedBombPos: null,
    
    history: null, 
  };
}

function truncateHistory(state: CGState, maxDepth: number = 1): CGState | null {
  if (!state.history || maxDepth <= 0) return null;
  return {
    ...state.history,
    history: truncateHistory(state.history, maxDepth - 1)
  };
}

function validateMaskAlignment(state: CGState): void {
  const { board, trophyMask, frozenMask, bonusMask, rows, cols } = state;
  
  const check = (mask: any[][], name: string) => {
    if (!mask || mask.length !== rows) {
      throw new Error(`[UNDO MASK MISALIGNMENT] ${name} row count mismatch`);
    }
    for (let r = 0; r < rows; r++) {
      if (!mask[r] || mask[r].length !== cols) {
        throw new Error(`[UNDO MASK MISALIGNMENT] ${name} row ${r} column count mismatch`);
      }
    }
  };

  check(board, "board");
  check(trophyMask, "trophyMask");
  check(frozenMask, "frozenMask");
  check(bonusMask, "bonusMask");
}

function freezeBoard(state: CGState) {
  if (process.env.NODE_ENV !== 'production') {
    Object.freeze(state.board);
    state.board.forEach(r => Object.freeze(r));
    Object.freeze(state.trophyMask);
    state.trophyMask.forEach(r => Object.freeze(r));
    Object.freeze(state.frozenMask);
    state.frozenMask.forEach(r => Object.freeze(r));
    Object.freeze(state.bonusMask);
    state.bonusMask.forEach(r => Object.freeze(r));
  }
}

export function reducer(state: CGState, action: Action): CGState {
  assertNoSystemLeak('CombineGrid');

  freezeBoard(state);

  const isInternalAction = [
    'TICK', 'CLEAR_COMPLETE', 'COUNT_NEXT_TROPHY', 
    'FINISH_COUNTING', 'BOMB_EXPLODE', 'RESOLVE_STALEMATE'
  ].includes(action.type);
  
  if ('version' in action && typeof action.version === 'number') {
    if (!isInternalAction && action.version !== state.version) {
      console.warn(`[STALE DISPATCH] Ignoring action ${action.type} (Action v${action.version} vs State v${state.version})`);
      return state;
    }
  }

  if (!state.board || state.board.length !== state.rows) {
    throw new Error('INVALID BOARD STATE: Board is missing or corrupted');
  }

  const prevBoard = clone2D(state.board);
  const prevTrophy = clone2D(state.trophyMask);
  const prevFrozen = clone2D(state.frozenMask);
  const prevBonus = clone2D(state.bonusMask);

  if (action.type === 'UNDO') {
    if (!state.history) {
      console.warn("[UNDO] No history to restore");
      return state;
    }

    const restored = state.history;
    validateMaskAlignment(restored);
    const nextVersion = (state.version || 0) + 1;
    
    return { 
      ...restored, 
      version: nextVersion,
      clearingPositions: [],
      ignitedBombPos: null,
      respawnPositions: [],
      zeroRespawnPositions: [],
      dragSource: null,
      selection: [],
      selectionVal: 0
    };
  }

  let resultState = state;
  try {
    switch (action.type) {
      case 'TAP_TILE':
      case 'DRAG_START':
      case 'SPAWN_BOMB':
      case 'IGNITE_BOMB':
        assertPosition(action.pos, state.board, `${action.type}.pos`);
        break;
      case 'DRAG_DROP':
        assertPosition(action.src, state.board, 'DRAG_DROP.src');
        assertPosition(action.dst, state.board, 'DRAG_DROP.dst');
        break;
      case 'BOMB_EXPLODE':
        assertPosition(action.center, state.board, 'BOMB_EXPLODE.center');
        break;
      case 'CLEAR_COMPLETE':
        assertPositions(state.clearingPositions, state.board, 'state.clearingPositions');
        break;
    }

    const nextState = CombineGridRules.resolveInteraction(state, action);
    
    if (nextState === state && action.type !== 'TICK' && action.type !== 'DRAG_CANCEL' && action.type !== 'DRAG_START') {
      const knownActions = [
        'TICK', 'TAP_TILE', 'DRAG_START', 'DRAG_DROP', 'DRAG_CANCEL',
        'CLEAR_COMPLETE', 'ADVANCE_ROUND', 'RESOLVE_STALEMATE',
        'BOMB_EXPLODE', 'IGNITE_BOMB', 'SPAWN_BOMB', 'NEXT_TARGET', 'PREV_TARGET',
        'COUNT_NEXT_TROPHY', 'FINISH_COUNTING', 'RESET_SESSION',
        'PLAY_AGAIN', 'UNDO'
      ];
      if (!knownActions.includes(action.type)) {
         throw new Error(`[UI CONTRACT VIOLATION] Unhandled action: ${action.type}`);
      }
    }

    const isResetAction = [
      'PLAY_AGAIN', 'RESET_SESSION', 'ADVANCE_ROUND', 
      'NEXT_TARGET', 'PREV_TARGET', 'UNDO'
    ].includes(action.type);

    if (!isResetAction && nextState.board !== state.board) {
      const diffs = diffBoards(
        prevBoard, nextState.board,
        prevTrophy, nextState.trophyMask,
        prevFrozen, nextState.frozenMask,
        prevBonus, nextState.bonusMask
      );

      if (diffs.length > 0) {
        let allowed: GridPos[] = [];
        
        switch (action.type) {
          case 'TAP_TILE':
            allowed = [...state.selection, action.pos];
            break;
          case 'DRAG_DROP':
            allowed = [action.src, action.dst];
            diffs.forEach(d => {
               if (nextState.board[d.row][d.col] === BOMB_TILE_VALUE) allowed.push({ row: d.row, col: d.col });
            });
            break;
          case 'BOMB_EXPLODE':
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                const r = action.center.row + dr, c = action.center.col + dc;
                if (r >= 0 && r < state.rows && c >= 0 && c < state.cols) allowed.push({ row: r, col: c });
              }
            }
            break;
          case 'CLEAR_COMPLETE':
            allowed = state.clearingPositions;
            break;
          case 'SPAWN_BOMB':
            allowed = [action.pos];
            break;
          case 'TICK':
            allowed = [];
            break;
          case 'RESOLVE_STALEMATE':
            allowed = [];
            break;
          case 'COUNT_NEXT_TROPHY':
            allowed = [];
            break;
        }

        enforceStaticLaw(action.type, diffs, allowed);
        
        diffs.forEach(d => {
          assertPosition({ row: d.row, col: d.col }, nextState.board, "diff result");
        });
      }
    }
    
    resultState = nextState;
    if (nextState !== state) {
      const isUndoableAction = action.type === 'DRAG_DROP' || action.type === 'IGNITE_BOMB' || action.type === 'TAP_TILE';
      const stateChangedMeaningfully = nextState.board !== state.board || nextState.trophyMask !== state.trophyMask || nextState.frozenMask !== state.frozenMask || nextState.bonusMask !== state.bonusMask || nextState.ignitedBombPos !== state.ignitedBombPos;
      
      if (isUndoableAction && stateChangedMeaningfully) {
        const snapshot = snapshotState(state);
        resultState = { ...nextState, history: snapshot };
      } else {
        resultState = { ...nextState, history: state.history };
      }

      // VERSION_CONTROL_CONTRACT: 
      // Do not increment version on TICK or other purely visual/timer changes.
      // Interactions that mutate the board should have their version incremented in CombineGridRules.
      // If a mutation occurred but rules didn't increment it, we do it here as a safety measure,
      // but NOT for TICK.
      const isStructuralAction = action.type !== 'TICK' && action.type !== 'DRAG_START' && action.type !== 'DRAG_CANCEL';
      if (isStructuralAction && resultState.version === state.version) {
        resultState.version = (state.version || 0) + 1;
      }
    }

    validateBoard(resultState.board, resultState.rows, resultState.cols);
  } catch (err: any) {
    console.error("REDUCER CRASH:", err);
    return { ...state, logEvents: [...state.logEvents, `CRASH: ${err.message}`].slice(-50) };
  }

  if (CombineGridRules.checkEndCondition(resultState)) {
    if (resultState.phase === 'PLAY' || resultState.phase === 'STALEMATE') {
      const combinableCount = countCombinableTiles(resultState.board, resultState.trophyMask, resultState.frozenMask);
      
      if (process.env.NODE_ENV !== 'production' && combinableCount > 1) {
        console.error("PREMATURE_ENDGAME_BLOCKED", {
          combinableTileCount: combinableCount,
          phase: resultState.phase,
          target: resultState.target
        });
        return resultState; // Block transition
      }

      const trophies: GridPos[] = [];
      for (let r = 0; r < resultState.rows; r++) {
        for (let c = 0; c < resultState.cols; c++) {
          if (resultState.trophyMask[r][c]) trophies.push({ row: r, col: c });
        }
      }
      trophies.sort((a, b) => (a.row !== b.row) ? a.row - b.row : a.col - b.col);

      resultState = {
        ...resultState,
        phase: 'COUNTING',
        countingIndex: 0,
        countedTrophies: trophies,
        selection: [],
        selectionVal: 0,
        dragSource: null,
      };

      // Transition to counting should also increment version
      resultState.version = (resultState.version || 0) + 1;
    }
  }

  return resultState;
}

export function initGame(
  profile: PracticeProfile,
  prng: () => number,
  seed: number,
  mode: EvalMode = 'product',
  rows: number = ROWS,
  cols: number = COLS,
  gameMode: GameMode = 'practice',
  practiceGroups: number[] = [2, 3, 4, 5, 6],
  recipeTargets: number[] = [12, 15, 24, 32, 56],
  recipeIndex: number = 0,
  overrideTarget?: number
): CGState {
  const state = CombineGridRules.generateInitialState({
    profile, prng, seed, mode, rows, cols, gameMode, practiceGroups, recipeTargets, recipeIndex, overrideTarget
  });
  return { ...state, version: 1 };
}