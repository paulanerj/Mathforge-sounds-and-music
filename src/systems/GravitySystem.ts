import { applyGravity as engineApplyGravity } from '../engine/GridEngine';
import type { GravityResult as EngineGravityResult } from '../engine/GridEngine';

export interface FallingTile {
  col: number;
  fromRow: number;
  toRow: number;
  value: number;
}

export interface SpawnedPosition {
  row: number;
  col: number;
  value: number;
}

export interface GravityApplicationResult {
  grid: number[][];
  fallingTiles: FallingTile[];
  spawnedPositions: SpawnedPosition[];
  spawnCountPerCol: number[];
  spawnBonusMap: boolean[][];
}

export function applyGravity(
  grid: number[][],
  rows: number,
  cols: number,
  spawnValue: (col: number, fillIndex: number) => number,
  spawnBonus: (col: number, fillIndex: number) => boolean,
): GravityApplicationResult {
  const before: number[][] = grid.map((r) => [...r]);
  const engineResult: EngineGravityResult = engineApplyGravity(grid, spawnValue);
  const after = engineResult.grid;

  const fallingTiles: FallingTile[] = [];
  const spawnedPositions: SpawnedPosition[] = [];
  const spawnCountPerCol: number[] = Array(cols).fill(0);
  const spawnBonusMap: boolean[][] = Array.from({ length: cols }, () => []);

  for (let c = 0; c < cols; c++) {
    const spawnCount = engineResult.colFills[c]?.length ?? 0;
    spawnCountPerCol[c] = spawnCount;

    for (let r = 0; r < spawnCount; r++) {
      spawnedPositions.push({ row: r, col: c, value: after[r][c] });
    }

    for (let i = 0; i < spawnCount; i++) {
      spawnBonusMap[c][i] = spawnBonus(c, i);
    }

    const beforeVals = before
      .map((row, ri) => ({ ri, v: row[c] }))
      .filter((x) => x.v !== 0)
      .reverse();

    let writeRow = rows - 1;
    for (const { ri: originalRow, v } of beforeVals) {
      if (writeRow < spawnCount) break;
      if (writeRow !== originalRow) {
        fallingTiles.push({
          col: c,
          fromRow: originalRow,
          toRow: writeRow,
          value: v,
        });
      }
      writeRow--;
    }
  }

  return {
    grid: after,
    fallingTiles,
    spawnedPositions,
    spawnCountPerCol,
    spawnBonusMap,
  };
}

export function clearAndGravity(
  grid: number[][],
  rows: number,
  cols: number,
  clearPositions: ReadonlyArray<{ row: number; col: number }>,
  spawnValue: (col: number, fillIndex: number) => number,
  spawnBonus: (col: number, fillIndex: number) => boolean,
): GravityApplicationResult {
  const cleared = grid.map((r, ri) =>
    r.map((v, ci) =>
      clearPositions.some((p) => p.row === ri && p.col === ci) ? 0 : v,
    ),
  );
  return applyGravity(cleared, rows, cols, spawnValue, spawnBonus);
}