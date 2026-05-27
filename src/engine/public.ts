export { makePrng, randomSeed, randomInt, randomPick } from './rng';
export {
  PRACTICE_PROFILES,
  getProfile,
  DEFAULT_PROFILE_ID,
} from './PracticeProfile';
export type { PracticeProfile, ProfileId } from './PracticeProfile';
export { spawnTile, spawnBoard, spawnColumn, spawnTileWeighted, spawnTileZero, spawnTileCombineGrid, getBalancedBags, createTargetProfile, getCategorySequence, TargetCategory } from './SpawnEngine';
export type { SpawnedTile, TargetProfile } from './SpawnEngine';
export {
  createGrid,
  emptyGrid,
  gridFromSpawn,
  getCellValue,
  inBounds,
  setCell,
  clearCells,
  applyGravity,
  swapCells,
  isOrthoAdjacent,
  isChebyshevAdjacent,
  sumPositions,
  productPositions,
} from './GridEngine';
export type { GravityResult } from './GridEngine';
export { generateTarget, evaluate, chainMatchesTarget } from './TargetGenerator';
export type { EvalMode } from './TargetGenerator';
export { createSession, addScore, incrementRound, elapsedMs } from './EngineSession';
export type { EngineSession } from './EngineSession';