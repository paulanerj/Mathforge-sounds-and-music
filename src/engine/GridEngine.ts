────────────────────────────────────────────────────────────────────────────────
import type { SpawnedTile } from './SpawnEngine';

export function createGrid(
  rows: number,
  cols: number,
  fill: (row: number, col: number) => number,
): number[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => fill(r, c)),
  );
}

export function emptyGrid(rows: number, cols: number): number[][] {
  return createGrid(rows, cols, () => 0);
}

export function gridFromSpawn(
  rows: number,
  cols: number,
  tiles: SpawnedTile[],
): number[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => tiles[r * cols + c].value),
  );
}

export function getCellValue(grid: number[][], row: number, col: number): number {
  return grid[row]?.[col] ?? 0;
}

export function inBounds(
  grid: number[][],
  row: number,
  col: number,
): boolean {
  return row >= 0 && row < grid.length && col >= 0 && col < (grid[0]?.length ?? 0);
}

export function setCell(
  grid: number[][],
  row: number,
  col: number,
  value: number,
): number[][] {
  return grid.map((r, ri) =>
    ri === row ? r.map((v, ci) => (ci === col ? value : v)) : r,
  );
}

export function clearCells(
  grid: number[][],
  positions: ReadonlyArray<{ row: number; col: number }>,
): number[][] {
  const posSet = new Set(positions.map((p) => `${p.row},${p.col}`));
  return grid.map((r, ri) =>
    r.map((v, ci) => (posSet.has(`${ri},${ci}`) ? 0 : v)),
  );
}

export interface GravityResult {
  grid: number[][];
  colFills: number[][];
}

export function applyGravity(
  grid: number[][],
  spawnValue: (col: number, fillIndex: number) => number,
): GravityResult {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const next: number[][] = grid.map((r) => [...r]);
  const colFills: number[][] = Array.from({ length: cols }, () => []);

  for (let c = 0; c < cols; c++) {
    let writeRow = rows - 1;
    for (let r = rows - 1; r >= 0; r--) {
      if (next[r][c] !== 0) {
        next[writeRow][c] = next[r][c];
        if (writeRow !== r) next[r][c] = 0;
        writeRow--;
      }
    }
    let fillIndex = 0;
    for (let r = 0; r <= writeRow; r++) {
      const val = spawnValue(c, fillIndex);
      next[r][c] = val;
      colFills[c].push(val);
      fillIndex++;
    }
  }

  return { grid: next, colFills };
}

export function swapCells(
  grid: number[][],
  a: { row: number; col: number },
  b: { row: number; col: number },
): number[][] {
  const va = getCellValue(grid, a.row, a.col);
  const vb = getCellValue(grid, b.row, b.col);
  return setCell(setCell(grid, a.row, a.col, vb), b.row, b.col, va);
}

export function isOrthoAdjacent(
  ar: number, ac: number,
  br: number, bc: number,
): boolean {
  return (Math.abs(ar - br) === 1 && ac === bc) ||
         (ar === br && Math.abs(ac - bc) === 1);
}

export function isChebyshevAdjacent(
  ar: number, ac: number,
  br: number, bc: number,
): boolean {
  return Math.max(Math.abs(ar - br), Math.abs(ac - bc)) === 1;
}

export function sumPositions(
  grid: number[][],
  positions: ReadonlyArray<{ row: number; col: number }>,
): number {
  return positions.reduce((acc, p) => acc + getCellValue(grid, p.row, p.col), 0);
}

export function productPositions(
  grid: number[][],
  positions: ReadonlyArray<{ row: number; col: number }>,
): number {
  return positions.reduce((acc, p) => acc * getCellValue(grid, p.row, p.col), 1);
}
────────────────────────────────────────────────────────────────────────────────
