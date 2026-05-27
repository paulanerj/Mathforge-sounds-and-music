import { applyGravity } from './GravitySystem';
import type { FallingTile, SpawnedPosition } from './GravitySystem';
import { applyBonusMaskGravity } from './BonusMaskSystem';
import { assertNoSystemLeak } from '../engine/ENGINE_CONTRACT';

function assertGravityContext() {
  assertNoSystemLeak('CombineGrid');
}

export interface GravityOrchestratorInput {
  grid: number[][];
  bonusMask: boolean[][];
  clearedPositions: ReadonlyArray<{ row: number; col: number }>;
  rows: number;
  cols: number;
  spawnValue: (col: number, spawnIndex: number) => number;
  spawnBonus: (col: number, spawnIndex: number) => boolean;
  generateNextTarget: (settledGrid: number[][]) => number;
}

export interface GravityOrchestratorResult {
  grid: number[][];
  bonusMask: boolean[][];
  target: number;
  fallingTiles: FallingTile[];
  spawnedPositions: SpawnedPosition[];
  spawnBonusMap: boolean[][];
}

export function runGravityOrchestrator(
  input: GravityOrchestratorInput,
): GravityOrchestratorResult {
  assertGravityContext();
  const {
    grid,
    bonusMask,
    clearedPositions,
    rows,
    cols,
    spawnValue,
    spawnBonus,
    generateNextTarget,
  } = input;

  const gravResult = applyGravity(grid, rows, cols, spawnValue, spawnBonus);

  const newBonusMask = applyBonusMaskGravity(
    bonusMask,
    grid,
    gravResult.spawnBonusMap,
    rows,
    cols,
    clearedPositions,
  );

  const newTarget = generateNextTarget(gravResult.grid);

  return {
    grid: gravResult.grid,
    bonusMask: newBonusMask,
    target: newTarget,
    fallingTiles: gravResult.fallingTiles,
    spawnedPositions: gravResult.spawnedPositions,
    spawnBonusMap: gravResult.spawnBonusMap,
  };
}