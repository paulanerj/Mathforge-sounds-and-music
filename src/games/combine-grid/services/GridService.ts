────────────────────────────────────────────────────────────────────────────────
import { GridPos, EvalMode } from '../types';
import { evaluate } from '../../../engine/public';
import { ZERO_TILE_VALUE, BOMB_TILE_VALUE } from '../constants';

export function evaluateSelection(
  board: number[][],
  selection: GridPos[],
  mode: EvalMode,
): number {
  if (selection.length === 0) return mode === 'sum' ? 0 : 1;
  const vals = selection.map(({ row, col }) => board[row][col]);
  return evaluate(vals, mode);
}

export function hasValidMoves(
  board: number[][],
  target: number,
  mode: EvalMode,
  trophyMask: boolean[][],
  frozenMask: boolean[][],
): boolean {
  if (!board || board.length === 0) return false;
  const rows = board.length;
  const cols = board[0].length;

  const getVal = (r: number, c: number) => board[r][c];
  const inBounds = (r: number, c: number) => r >= 0 && r < rows && c >= 0 && c < cols;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!isCombinableTile(board, trophyMask, frozenMask, r, c) && getVal(r, c) !== ZERO_TILE_VALUE) continue;
      
      const val = getVal(r, c);
      if (val === 0) continue;

      const neighbors = [
        { r: r + 1, c: c },
        { r: r - 1, c: c },
        { r: r, c: c + 1 },
        { r: r, c: c - 1 },
      ];

      for (const n of neighbors) {
        if (!inBounds(n.r, n.c)) continue;
        if (!isCombinableTile(board, trophyMask, frozenMask, n.r, n.c) && getVal(n.r, n.c) !== ZERO_TILE_VALUE) continue;
        
        const nVal = getVal(n.r, n.c);
        if (nVal === 0) continue;

        if (mode === 'product' && val * nVal === target) return true;
        if (mode === 'sum' && val + nVal === target) return true;

        if (mode === 'product' && (val === 1 || nVal === 1)) return true;

        if (val === ZERO_TILE_VALUE || nVal === ZERO_TILE_VALUE) return true;
      }
    }
  }

  return false;
}

export function isCombinableTile(
  board: number[][],
  trophyMask: boolean[][],
  frozenMask: boolean[][],
  r: number,
  c: number,
): boolean {
  if (!trophyMask || !frozenMask) {
    return false;
  }
  if (!trophyMask[r] || !frozenMask[r]) {
    return false;
  }

  const isTrophy = trophyMask[r][c];
  const isFrozen = frozenMask[r][c];
  
  const val = board[r][c];
  const isBomb = val === BOMB_TILE_VALUE;
  const isEmpty = val === 0;

  // Combinable tiles are those that are NOT trophies, NOT frozen, NOT bombs, and NOT empty.
  // This includes regular number tiles and the Zero sentinel.
  return !isTrophy && !isFrozen && !isBomb && !isEmpty;
}

export function hasBombs(board: number[][]): boolean {
  return board.some(row => row.some(v => v === BOMB_TILE_VALUE));
}

export function countCombinableTiles(
  board: number[][],
  trophyMask: boolean[][],
  frozenMask: boolean[][],
): number {
  let count = 0;
  const rows = board.length;
  const cols = board[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (isCombinableTile(board, trophyMask, frozenMask, r, c)) {
        count++;
      }
    }
  }

  return count;
}

export function isRoundComplete(
  board: number[][],
  _target: number,
  _mode: EvalMode,
  trophyMask: boolean[][],
  frozenMask: boolean[][],
): boolean {
  const combinableCount = countCombinableTiles(board, trophyMask, frozenMask);
  
  // The board is finished when there is only ONE playable/combinable tile left.
  // Adjacency and solvability are ignored for the endgame trigger.
  // Bombs do NOT block the endgame here if the user wants it to end with 1 tile left.
  if (combinableCount <= 1) {
    console.log("[ROUND END] Level complete: 1 or fewer combinable tiles left.");
    return true;
  }

  return false;
}

export function hasSolution(
  board: number[][],
  target: number,
  mode: EvalMode,
  trophyMask: boolean[][] = [],
  frozenMask: boolean[][] = [],
): boolean {
  if (!board || board.length === 0) {
    throw new Error("Solver called with invalid board");
  }
  const vals: number[] = [];
  const rows = board.length;
  const cols = board[0].length;
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const playable = isCombinableTile(board, trophyMask, frozenMask, r, c);

      if (playable) {
        const v = board[r][c];
        if (v !== ZERO_TILE_VALUE) {
          vals.push(v);
        }
      }
    }
  }

  for (let i = 0; i < vals.length; i++) {
    if (vals[i] === target) return true;
    for (let j = i + 1; j < vals.length; j++) {
      const pair = mode === 'sum' ? vals[i] + vals[j] : vals[i] * vals[j];
      if (pair === target) return true;
    }
  }
  return false;
}

export function validateBoard(board: number[][], rows: number, cols: number): void {
  if (!board) throw new Error("Board is null or undefined");
  if (!Array.isArray(board)) throw new Error("Board is not an array");
  if (board.length !== rows) {
    throw new Error(`Board row count mismatch: expected ${rows}, got ${board.length}`);
  }

  for (let r = 0; r < rows; r++) {
    const row = board[r];
    if (!Array.isArray(row)) {
      throw new Error(`Board row ${r} is not an array`);
    }
    if (row.length !== cols) {
      throw new Error(`Board row ${r} column count mismatch: expected ${cols}, got ${row.length}`);
    }

    for (let c = 0; c < cols; c++) {
      const tile = row[c];
      if (tile === undefined) {
        throw new Error(`Undefined tile detected at [${r}, ${c}]`);
      }
      if (tile === null) {
        throw new Error(`Null tile detected at [${r}, ${c}]`);
      }
      if (typeof tile !== 'number') {
        throw new Error(`Non-number tile detected at [${r}, ${c}]: ${typeof tile}`);
      }
    }
  }
}
────────────────────────────────────────────────────────────────────────────────
