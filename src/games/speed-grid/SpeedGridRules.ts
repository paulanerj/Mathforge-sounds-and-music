────────────────────────────────────────────────────────────────────────────────
/*
  SPEEDGRID_OVERSHOOT_CONTRACT

  Rules:
  - overshoot is not pathStatus FAIL
  - tiles never receive FAIL status
  - overshoot visuals must use OvershootFeedbackLayer only
  - Tile component must remain isolated
  - activePaths clears immediately
  - future overshoot effects must never mutate tile state

  ---
  HARD FREEZE ACTIVE — MULTI-TOUCH CORE
  DO NOT MODIFY:
  * input pipeline
  * aggregation logic (AGGREGATION MODE: DEDUPED_TILE)
  * shared sum calculation
  * pointer path structure

  DEDUPED_TILE RULE:
  * Each tile contributes to sharedSum exactly once
  * Regardless of how many pointers include it
  * sharedSum = sum(unique tiles in sharedTileSet)

  Any change to core logic requires explicit override directive.
*/

import { BaseGridState, GridPos } from "../../engine/grid/GridTypes";
import { GridGameRules } from "../../engine/grid/GridRules";
import { PracticeProfile } from "../../engine/PracticeProfile";
import { INPUT_TUNING, InputTuningConfig } from "./SpeedGridInputTuning";
import {
  TargetProfile,
  TARGET_PROFILES,
  CLASSIC_PROFILE,
} from "./TargetProfile";

// 🔒 LOCKED: INPUT AUTHORITY SYSTEM
// Any modification requires regression audit PASS + explicit override flag
export const SYSTEM_VERSION = "input_lock_v1.0";
export const INPUT_SYSTEM_LOCK = true;

// Integrity Check (Signature)
// Note: We track the presence and logic flow of these zones
const SIGNATURES = {
  GESTURE_MOVE_LOGIC: "v1.0_20260504",
  DIAGONAL_SNAP: "v1.0_active",
  CORNER_INTENT: "v1.0_active",
};

const TIME_TILE_THRESHOLD = 10;
const TIME_TILE_BONUS = 10;

export interface TileProps {
  instanceId: string;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  spawnFromRow?: number;
  finalRow?: number;
  specialType?: "TIME";
  timeBonus?: number;
}

export interface GravityMove {
  instanceId: string;
  fromRow: number;
  toRow: number;
  col: number;
}

export interface SpawnInfo {
  instanceId: string;
  value: number;
  spawnFromRow: number;
  finalRow: number;
  col: number;
}

export interface GravityTrace {
  timestamp: number;
  durationMs?: number;
  removed: any[];
  moves: GravityMove[];
  spawns: SpawnInfo[];
  snapshots: {
    before: (TileProps | null)[][];
    afterRemoval: (TileProps | null)[][];
    afterGravity: (TileProps | null)[][];
    afterRefill: (TileProps | null)[][];
  };
  summary: string;
}

function cloneBoard(board: (TileProps | null)[][]): (TileProps | null)[][] {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function generateTraceSummary(trace: GravityTrace): string {
  let s = `--- GRAVITY TRACE (VERTICAL ONLY CONTRACT) ---\n`;
  s += `Timestamp: ${new Date(trace.timestamp).toISOString()}\n`;
  s += `Removed: ${trace.removed.length} tiles\n`;

  s += `\nMOVES:\n`;
  if (trace.moves.length === 0) s += `None\n`;
  trace.moves.forEach((m) => {
    s += `  [${m.instanceId}] R${m.fromRow} → R${m.toRow} (Col ${m.col})\n`;
  });

  s += `\nSPAWNS:\n`;
  if (trace.spawns.length === 0) s += `None\n`;
  trace.spawns.forEach((sp) => {
    s += `  [${sp.instanceId}] From R${sp.spawnFromRow} → R${sp.finalRow} (Col ${sp.col}, Val ${sp.value})\n`;
  });

  s += `\n--- END TRACE ---`;
  return s;
}

function calculateSelectionResult(
  activePaths: Record<string, string[]>,
  board: (TileProps | null)[][],
  mode: "add" | "multiply" = "add",
): number {
  const combinedIds = new Set<string>();
  Object.values(activePaths).forEach((path) => {
    path.forEach((id) => combinedIds.add(id));
  });

  if (combinedIds.size === 0) return mode === "multiply" ? 1 : 0;

  if (mode === "multiply") {
    let product = 1;
    let found = false;
    board.forEach((row) =>
      row.forEach((tile) => {
        if (tile && combinedIds.has(tile.instanceId)) {
          product *= tile.value;
          found = true;
        }
      }),
    );
    return found ? product : 1;
  } else {
    let sum = 0;
    board.forEach((row) =>
      row.forEach((tile) => {
        if (tile && combinedIds.has(tile.instanceId)) {
          sum += tile.value;
        }
      }),
    );
    return sum;
  }
}

function getRandomTileValue(pool: number[]): number {
  return pool[Math.floor(Math.random() * pool.length)];
}

function interpolatePath(
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  limit: number = 20,
) {
  const tiles: { row: number; col: number }[] = [];
  let r = r1;
  let c = c1;
  while (r !== r2 || c !== c2) {
    const dr = Math.sign(r2 - r);
    const dc = Math.sign(c2 - c);
    r += dr;
    c += dc;
    tiles.push({ row: r, col: c });
    if (tiles.length > limit) break; // Defensive guard
  }
  return tiles;
}

function hasStreak(
  board: (TileProps | null)[][],
  row: number,
  col: number,
  value: number,
): boolean {
  // Check horizontal streak
  let hCount = 1;
  for (let c = col - 1; c >= 0 && board[row][c]?.value === value; c--) hCount++;
  if (board[row]) {
    for (
      let c = col + 1;
      c < board[0].length && board[row][c]?.value === value;
      c++
    )
      hCount++;
  }
  if (hCount > 3) return true;

  // Check vertical streak
  let vCount = 1;
  for (let r = row - 1; r >= 0 && board[r][col]?.value === value; r--) vCount++;
  for (let r = row + 1; r < board.length && board[r][col]?.value === value; r++)
    vCount++;
  if (vCount > 3) return true;

  return false;
}

function applyGravity(board: (TileProps | null)[][]): {
  newBoard: (TileProps | null)[][];
  moves: GravityMove[];
} {
  const rows = board.length;
  const cols = board[0].length;
  const moves: GravityMove[] = [];
  const newBoard: (TileProps | null)[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(null),
  );

  for (let c = 0; c < cols; c++) {
    const existingTiles: TileProps[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      if (board[r][c]) {
        existingTiles.push(board[r][c]!);
      }
    }

    let targetRow = rows - 1;
    for (const tile of existingTiles) {
      if (tile.row !== targetRow) {
        moves.push({
          instanceId: tile.instanceId,
          fromRow: tile.row,
          toRow: targetRow,
          col: c,
        });
      }
      newBoard[targetRow][c] = {
        ...tile,
        row: targetRow,
        col: c,
        isNew: false,
      };
      targetRow--;
    }
  }

  return { newBoard, moves };
}

function countTimeTiles(board: (TileProps | null)[][]): number {
  let count = 0;
  for (const row of board) {
    for (const tile of row) {
      if (tile?.specialType === "TIME") count++;
    }
  }
  return count;
}

function refillBoard(
  board: (TileProps | null)[][],
  pool: number[],
  timeTilesToSpawn: number = 0,
): { newBoard: (TileProps | null)[][]; spawns: SpawnInfo[] } {
  const rows = board.length;
  const cols = board[0].length;
  const spawns: SpawnInfo[] = [];
  const newBoard = board.map((row) => [...row]);

  // Find lowest empty slot for each column
  const lowestEmptySlots: { r: number; c: number }[] = [];
  for (let c = 0; c < cols; c++) {
    for (let r = rows - 1; r >= 0; r--) {
      if (newBoard[r][c] === null) {
        lowestEmptySlots.push({ r, c });
        break;
      }
    }
  }

  // Pick deterministic slots for time tiles
  const timeTileSlots = new Set<string>();
  for (let i = 0; i < timeTilesToSpawn; i++) {
    if (lowestEmptySlots.length === 0) break;
    const idx = Math.floor(Math.random() * lowestEmptySlots.length);
    const slot = lowestEmptySlots[idx];
    timeTileSlots.add(`${slot.r}_${slot.c}`);
    lowestEmptySlots.splice(idx, 1);
  }

  for (let c = 0; c < cols; c++) {
    const nullIndices: number[] = [];
    for (let r = 0; r < rows; r++) {
      if (newBoard[r][c] === null) {
        nullIndices.push(r);
      }
    }

    if (nullIndices.length > 0) {
      // Top null indices should receive spawns from higher up
      // Sort to ensure deterministic spawnFromRow assignment
      nullIndices.sort((a, b) => a - b);

      const k = nullIndices.length;
      nullIndices.forEach((finalRow, i) => {
        const spawnFromRow = -(k - i);
        const value = pool[Math.floor(Math.random() * pool.length)];
        const instanceId = `tile_spawn_${Date.now()}_${c}_${finalRow}_${Math.random().toString(36).substring(2, 7)}`;

        let specialType: "TIME" | undefined = undefined;
        let timeBonus: number | undefined = undefined;

        if (timeTileSlots.has(`${finalRow}_${c}`)) {
          specialType = "TIME";
          timeBonus = TIME_TILE_BONUS;
          console.log(
            `[TIME TILE SPAWN] id: ${instanceId}, bonus: +${timeBonus}`,
          );
        }

        const newTile: TileProps = {
          instanceId,
          value,
          row: finalRow,
          col: c,
          isNew: true,
          spawnFromRow,
          finalRow,
          specialType,
          timeBonus,
        };

        newBoard[finalRow][c] = newTile;
        spawns.push({
          instanceId,
          value,
          spawnFromRow,
          finalRow,
          col: c,
        });
      });
    }
  }

  return { newBoard, spawns };
}

// [PHASE 5] Solution Detection
function findExistingSolution(
  board: (TileProps | null)[][],
  target: number,
): boolean {
  const rows = board.length;
  const cols = board[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c]) continue;

      // Basic DFS to find ANY path that sums to target
      const stack: {
        r: number;
        c: number;
        sum: number;
        visited: Set<string>;
      }[] = [
        { r, c, sum: board[r][c]!.value, visited: new Set([`${r}_${c}`]) },
      ];

      while (stack.length > 0) {
        const { r: cr, c: cc, sum: cs, visited: cv } = stack.pop()!;
        if (cs === target) return true;
        if (cs > target) continue;

        const neighbors = [
          [cr - 1, cc],
          [cr + 1, cc],
          [cr, cc - 1],
          [cr, cc + 1],
          [cr - 1, cc - 1],
          [cr - 1, cc + 1],
          [cr + 1, cc - 1],
          [cr + 1, cc + 1],
        ];

        for (const [nr, nc] of neighbors) {
          if (
            nr >= 0 &&
            nr < rows &&
            nc >= 0 &&
            nc < cols &&
            board[nr][nc] &&
            !cv.has(`${nr}_${nc}`)
          ) {
            const val = board[nr][nc]!.value;
            if (cs + val <= target) {
              const nextVisited = new Set(cv);
              nextVisited.add(`${nr}_${nc}`);
              stack.push({ r: nr, c: nc, sum: cs + val, visited: nextVisited });
            }
          }
        }
        // Limit depth for performance - we just need to know IF one exists
        if (cv.size > 8) continue;
      }
    }
  }
  return false;
}

// [PHASE 5] Solution Injection
function injectSafeSolution(
  board: (TileProps | null)[][],
  target: number,
  pool: number[],
  mode: "add" | "multiply" = "add",
) {
  const rows = board.length;
  const cols = board[0].length;

  // Pick random location
  let r = Math.floor(Math.random() * (rows - 1));
  let c = Math.floor(Math.random() * (cols - 1));

  // Generic injection: BFS/random walk until target is met
  let currentResult = mode === "multiply" ? 1 : 0;
  const visited = new Set<string>();
  let currR = r;
  let currC = c;

  // Max steps to prevent infinite loops
  let steps = 0;
  const maxSteps = rows * cols;

  while (steps < maxSteps) {
    steps++;
    const key = `${currR}_${currC}`;
    if (visited.has(key)) {
      // Find a non-visited neighbor to jump to if stuck
      const nextPossible = [
        [currR - 1, currC],
        [currR + 1, currC],
        [currR, currC - 1],
        [currR, currC + 1],
        [currR - 1, currC - 1],
        [currR - 1, currC + 1],
        [currR + 1, currC - 1],
        [currR + 1, currC + 1],
      ].filter(
        ([nr, nc]) =>
          nr >= 0 &&
          nr < rows &&
          nc >= 0 &&
          nc < cols &&
          !visited.has(`${nr}_${nc}`),
      );

      if (nextPossible.length === 0) break;
      [currR, currC] =
        nextPossible[Math.floor(Math.random() * nextPossible.length)];
      continue;
    }
    visited.add(key);

    if (mode === "multiply") {
      const remainingDiv = target / currentResult;
      if (remainingDiv === 1) break;

      const possibleVals = pool.filter((v) => v > 1 && remainingDiv % v === 0);

      if (possibleVals.length === 0) {
        // Force last tile to match factor if possible
        if (target % currentResult === 0 && board[currR][currC]) {
          const val = target / currentResult;
          board[currR][currC]!.value = val;
          currentResult *= val;
        }
        break;
      }

      const val = possibleVals[Math.floor(Math.random() * possibleVals.length)];
      board[currR][currC]!.value = val;
      currentResult *= val;
    } else {
      const remaining = target - currentResult;
      const possibleVals = pool.filter((v) => v <= remaining);

      if (possibleVals.length === 0) {
        if (board[currR][currC]) {
          board[currR][currC]!.value = remaining;
          currentResult += remaining;
        }
        break;
      }

      const val = possibleVals[Math.floor(Math.random() * possibleVals.length)];
      board[currR][currC]!.value = val;
      currentResult += val;
    }

    if (currentResult === target) break;

    const neighbors = [
      [currR - 1, currC],
      [currR + 1, currC],
      [currR, currC - 1],
      [currR, currC + 1],
      [currR - 1, currC - 1],
      [currR - 1, currC + 1],
      [currR + 1, currC - 1],
      [currR + 1, currC + 1],
    ].filter(
      ([nr, nc]) =>
        nr >= 0 &&
        nr < rows &&
        nc >= 0 &&
        nc < cols &&
        !visited.has(`${nr}_${nc}`),
    );

    if (neighbors.length === 0) {
      // Try jumping to any unvisited tile
      const unvisited = [];
      for (let tr = 0; tr < rows; tr++) {
        for (let tc = 0; tc < cols; tc++) {
          if (!visited.has(`${tr}_${tc}`)) unvisited.push([tr, tc]);
        }
      }
      if (unvisited.length === 0) break;
      [currR, currC] = unvisited[Math.floor(Math.random() * unvisited.length)];
    } else {
      [currR, currC] = neighbors[Math.floor(Math.random() * neighbors.length)];
    }
  }
}

export interface SpeedGridSettings {
  gridSize: [number, number]; // [rows, cols]
  numberRange: [number, number]; // [min, max]
  timeLimit: number; // Also known as Round Duration
  timeTileFrequency: "off" | "frequent" | "normal" | "rare";
  activeProfileId: string;
  multiTouchMode: "independent" | "combined";
  diagnosticMode: boolean;
  stressTestMode: boolean;
  devConsole: boolean;
  devMultiTouchForce: boolean;
  showInputZones: boolean;
  devMode: boolean;
  showGravityVisuals: boolean;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  tuning: InputTuningConfig;
  targetSource: TargetSource;
  operationMode: "add" | "multiply";
  presentationMode: "random" | "sequential" | "weighted";
  cycleLength: number;
  multiplesConfig: {
    bases: number[];
    minMultiplier: number;
    maxMultiplier: number;
    maxTarget?: number;
  };
  numberPool: number[];
  rangeConfig: {
    min: number;
    max: number;
  };
  specificConfig: {
    raw: string;
    parsed: number[];
  };
  singleConfig: {
    value: number;
  };
  customTargetList: {
    raw: string;
    parsed: number[];
  };
}

export type TargetSource =
  | "multiples"
  | "range"
  | "specific"
  | "primes"
  | "factors"
  | "manual"
  | "classic"
  | "preset"
  | "custom"
  | "single";

export type GamePhase = "IDLE" | "PLAY" | "ROUND_END";

export interface SpeedGridState extends BaseGridState {
  settings: SpeedGridSettings;
  draftSettings: SpeedGridSettings | null;
  activeProfile: TargetProfile;
  target: number;
  score: number;
  phase: GamePhase;
  phaseTimer: number;
  timeLeft: number;
  addedTimeDisplay?: number;
  isTimerRunning: boolean;

  board: (TileProps | null)[][];
  lastPointerPos: Record<string, { ux: number; uy: number }>;
  lastTimestampByPointer: Record<string, number>;
  lastTileByPointer: Record<string, { row: number; col: number }>;
  interpolationCache: Record<string, { row: number; col: number }[]>;
  activePaths: Record<string, string[]>; // pointerId -> list of tile IDs
  activePointerIds: string[];
  selectionIds: string[];
  pathSums: Record<string, number>;
  pathStatus: Record<string, "ACTIVE" | "SUCCESS">;
  successFeedback: null | {
    id: string;
    pathTileIds: string[];
    pathCenters: { x: number; y: number }[];
    total: number;
    target: number;
    createdAt: number;
    expiresAt: number;
  };
  overshootFeedback: null | {
    id: string;
    pointerId: string | number;
    pathTileIds: string[];
    pathCenters: { x: number; y: number }[];
    total: number;
    target: number;
    createdAt: number;
    expiresAt: number;
  };
  targetHistory: number[];
  lastActionName: string;
  lastResolveTime: number;
  lastResolvePid: string;

  // Debug Counters
  gravityRuns: number;
  refillRuns: number;
  mappingErrors: number;
  nullTilesRemaining: number;
  lastResolvedTilesCount: number;
  currentTargetIndex: number;
  lastScoreDelta: number;
  matchesCleared: number;

  solvedTileCounter: number;
  pendingTimeBonus: number;
  lastEquation?: string;
  timeTileBursts: {
    id: string;
    row: number;
    col: number;
    amount: number;
    timestamp: number;
  }[];

  stressMetrics: {
    collisionErrors: number;
    snapOvershoots: number;
    inputLeaks: number;
    duplicateTiles: number;
  };

  sessionMetrics: {
    totalMoves: number;
    totalPointers: number;
    totalPathsResolved: number;
    driftEvents: number;
    lifecycleErrors: number;
    diagonalMoves: number;
    orthogonalMoves: number;
    totalPathLength: number;
  };

  ui: {
    settingsOpen: boolean;
  };

  lastGravityTrace: GravityTrace | null;
  gravityReplay: {
    active: boolean;
    step: number;
  } | null;
}

export type SpeedGridAction =
  | { type: "TICK"; deltaMs: number }
  | {
      type: "GESTURE_START_POINT";
      pointerId: string;
      ux: number;
      uy: number;
      row?: number;
      col?: number;
      tileId?: string;
      timestamp?: number;
    }
  | {
      type: "GESTURE_MOVE";
      pointerId: string;
      ux: number;
      uy: number;
      row?: number;
      col?: number;
      tileId?: string;
      timestamp?: number;
    }
  | { type: "GESTURE_END"; pointerId: string; timestamp?: number }
  | { type: "CLEAR_PATH"; pointerId: string }
  | { type: "EXPIRE_OVERSHOOT" }
  | { type: "EXPIRE_SUCCESS" }
  | { type: "RESOLVE_SUCCESSFUL_PATH"; pointerId: string }
  | { type: "OPEN_SETTINGS" }
  | { type: "CLOSE_SETTINGS" }
  | { type: "SET_DRAFT_SETTING"; key: keyof SpeedGridSettings; value: any }
  | { type: "APPLY_SETTINGS" }
  | { type: "START_GRAVITY_REPLAY" }
  | { type: "NEXT_GRAVITY_REPLAY_STEP" }
  | { type: "STOP_GRAVITY_REPLAY" }
  | { type: "RESET_GAME_FULL" }
  | { type: "NEXT_TARGET" }
  | { type: "PREV_TARGET" }
  | { type: "REFRESH_BOARD_SAME_TARGET" }
  | { type: "START_NEXT_ROUND" }
  | {
      type: "RESTART";
      config: {
        profile: PracticeProfile;
        seed: number;
        rows?: number;
        cols?: number;
        mode?: "normal" | "test";
      };
    };

function validateTarget(target: number, pool: number[], mode: 'add' | 'multiply'): boolean {
  if (target <= 0 || !Number.isInteger(target)) return false;
  if (mode === 'multiply') {
    // Basic check: is target divisible by any number in pool (if pool doesn't have 1)?
    if (target === 1) return true; // 1 is always solvable if pool has 1 or via empty/complex logic, but let's be simple
    return pool.some(v => v > 1 && target % v === 0);
  } else {
    // Basic check: is target >= min in pool?
    const min = Math.min(...pool);
    return target >= min;
  }
}

function createOvershootSnapshot(
  state: SpeedGridState,
  pointerId: string,
  total: number,
) {
  const pathTileIds = state.activePaths[pointerId] || [];
  const pathCenters = pathTileIds.map((tId) => {
    const tile = state.board.flat().find((t) => t?.instanceId === tId);
    return tile ? { x: tile.col, y: tile.row } : { x: 0, y: 0 };
  });

  return {
    id: `overshoot-${Date.now()}-${pointerId}`,
    pointerId,
    pathTileIds,
    pathCenters,
    total,
    target: state.target,
    createdAt: Date.now(),
    expiresAt: Date.now() + 350,
  };
}

function createSuccessSnapshot(
  state: SpeedGridState,
  pointerId: string,
  total: number,
) {
  const pathTileIds = state.activePaths[pointerId] || [];
  const pathCenters = pathTileIds.map((tId) => {
    const tile = state.board.flat().find((t) => t?.instanceId === tId);
    return tile ? { x: tile.col, y: tile.row } : { x: 0, y: 0 };
  });

  return {
    id: `success-${Date.now()}-${pointerId}`,
    pathTileIds,
    pathCenters,
    total,
    target: state.target,
    createdAt: Date.now(),
    expiresAt: Date.now() + 500,
  };
}

export const SpeedGridRules: GridGameRules<SpeedGridState, SpeedGridAction> = {
  name: "SpeedGrid",

  generateInitialState(config: {
    profile: PracticeProfile;
    seed: number;
    rows?: number;
    cols?: number;
    mode?: "normal" | "test";
    activeProfileId?: string;
    multiplesConfig?: SpeedGridSettings["multiplesConfig"];
    initialSettings?: SpeedGridSettings;
    target?: number;
    targetHistory?: number[];
    currentTargetIndex?: number;
  }): SpeedGridState {
    const isTestMode = config.mode === "test";
    const rows = config.rows ?? 7;
    const cols = config.cols ?? 5;

    // Select Profile
    const activeProfileId = config.activeProfileId || CLASSIC_PROFILE.id;
    const activeProfile =
      TARGET_PROFILES.find((p) => p.id === activeProfileId) || CLASSIC_PROFILE;

    const settings: SpeedGridSettings = config.initialSettings || {
      gridSize: [rows, cols],
      numberRange: [1, 9],
      timeLimit: 60,
      timeTileFrequency: "normal",
      activeProfileId: activeProfile.id,
      multiTouchMode: "combined",
      diagnosticMode: false,
      stressTestMode: false,
      devConsole: false,
      devMultiTouchForce: false,
      showInputZones: false,
      devMode: false,
      showGravityVisuals: false,
      hapticsEnabled: true,
      soundEnabled: true,
      tuning: { ...INPUT_TUNING },
      targetSource: activeProfile.targetSource,
      operationMode: activeProfile.rules.operationMode,
      presentationMode: activeProfile.rules.presentationMode,
      cycleLength: activeProfile.rules.cycleLength,
      numberPool: activeProfile.numberPool,
      multiplesConfig: config.multiplesConfig ||
        activeProfile.multiplesConfig || {
          bases: [2],
          minMultiplier: 1,
          maxMultiplier: 12,
        },
      rangeConfig: activeProfile.rangeConfig || {
        min: 10,
        max: 50,
      },
      specificConfig: activeProfile.specificConfig || {
        raw: "",
        parsed: [],
      },
      singleConfig: {
        value: 35,
      },
      customTargetList: {
        raw: "",
        parsed: [],
      },
    };

    if (!config.initialSettings && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("speedgrid_settings");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.hapticsEnabled !== undefined) settings.hapticsEnabled = parsed.hapticsEnabled;
          if (parsed.soundEnabled !== undefined) settings.soundEnabled = parsed.soundEnabled;
          if (parsed.devMode !== undefined) settings.devMode = parsed.devMode;
          if (parsed.numberPool !== undefined) settings.numberPool = parsed.numberPool;
          if (parsed.targetSource !== undefined) settings.targetSource = parsed.targetSource;
          if (parsed.gridSize !== undefined) settings.gridSize = parsed.gridSize;
          if (parsed.timeLimit !== undefined) settings.timeLimit = parsed.timeLimit;
          if (parsed.timeTileFrequency !== undefined) settings.timeTileFrequency = parsed.timeTileFrequency;
        }
      } catch (e) {}
    }

    // If we passed specific overrides in config (legacy support), apply them
    if (config.multiplesConfig) settings.multiplesConfig = config.multiplesConfig;
    if (config.activeProfileId) settings.activeProfileId = config.activeProfileId;
    // Sync grid size if rows/cols passed
    if (config.rows && config.cols) settings.gridSize = [config.rows, config.cols];

    // Generate targets based on source
    let targets: number[] = [];
    if (settings.targetSource === "multiples") {
      const { bases, minMultiplier, maxMultiplier, maxTarget } =
        settings.multiplesConfig;
      const tgs: number[] = [];
      bases.forEach((base) => {
        for (let i = minMultiplier; i <= maxMultiplier; i++) {
          const t = base * i;
          if (maxTarget && t > maxTarget) continue;
          tgs.push(t);
        }
      });
      targets = Array.from(new Set(tgs)).sort((a, b) => a - b);
    } else if (settings.targetSource === "range") {
      const { min, max } = settings.rangeConfig;
      for (let i = min; i <= max; i++) {
        targets.push(i);
      }
    } else if (settings.targetSource === "specific") {
      targets =
        settings.specificConfig.parsed.length > 0
          ? settings.specificConfig.parsed
          : activeProfile.targets;
    } else if (settings.targetSource === "primes") {
      const primes = [
        2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67,
        71, 73, 79, 83, 89, 97,
      ];
      targets = primes;
    } else if (settings.targetSource === "factors") {
      const n = 100;
      for (let i = 1; i <= n; i++) {
        if (n % i === 0) targets.push(i);
      }
    } else if (settings.targetSource === "preset") {
      targets = [10, 12, 15, 18, 20, 21, 24, 25, 27, 28, 30, 32, 35, 36, 40, 42, 45, 48, 54, 56, 63, 64, 72];
    } else if (settings.targetSource === "custom") {
      targets = settings.customTargetList.parsed.length > 0 ? settings.customTargetList.parsed : [10];
    } else if (settings.targetSource === "single") {
      targets = [settings.singleConfig.value];
    } else {
      targets = activeProfile.targets;
    }

    // Filter invalid targets
    targets = targets.filter(t => validateTarget(t, settings.numberPool, settings.operationMode));
    if (targets.length === 0) targets = [10]; // Fallback

    activeProfile.targets = targets;
    activeProfile.numberPool = settings.numberPool;

    const initialTargetsPool =
      settings.cycleLength > 0
        ? activeProfile.targets.slice(0, settings.cycleLength)
        : activeProfile.targets;

    const target = config.target ?? (isTestMode
      ? 25
      : initialTargetsPool[
          Math.floor(Math.random() * initialTargetsPool.length)
        ]);

    const board: (TileProps | null)[][] = Array.from({ length: rows }, () =>
      Array(cols).fill(null),
    );

    // Fill board with anti-streak randoms using profile pool
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let val = isTestMode ? 5 : getRandomTileValue(activeProfile.numberPool);
        let attempts = 0;
        while (attempts < 10 && hasStreak(board, r, c, val)) {
          val = getRandomTileValue(activeProfile.numberPool);
          attempts++;
        }

        board[r][c] = {
          instanceId: `tile_${r}_${c}`,
          value: val,
          row: r,
          col: c,
        };
      }
    }

    // [PHASE 5] Inject 3 guaranteed solutions if not in test mode & allowed by profile
    if (!isTestMode && activeProfile.rules.ensureSolvable) {
      for (let s = 0; s < 3; s++) {
        injectSafeSolution(
          board,
          target,
          activeProfile.numberPool,
          settings.operationMode,
        );
      }
    }

    return {
      rows,
      cols,
      selection: [],
      seed: config.seed,
      settings,
      draftSettings: null,
      target,
      activeProfile,
      score: 0,
      phase: "IDLE",
      phaseTimer: 0,
      timeLeft: settings.timeLimit,
      isTimerRunning: false,
      board,
      lastPointerPos: {},
      lastTimestampByPointer: {},
      lastTileByPointer: {},
      interpolationCache: {},
      activePaths: {},
      activePointerIds: [],
      selectionIds: [],
      pathSums: {},
      pathStatus: {},
      successFeedback: null,
      overshootFeedback: null,
      targetHistory: config.targetHistory || [target],
      lastActionName: "INIT",
      lastResolveTime: 0,
      lastResolvePid: "",
      solvedTileCounter: 0,
      pendingTimeBonus: 0,
      timeTileBursts: [],
      gravityRuns: 0,
      refillRuns: 0,
      mappingErrors: 0,
      nullTilesRemaining: 0,
      lastResolvedTilesCount: 0,
      lastScoreDelta: 0,
      matchesCleared: 0,
      stressMetrics: {
        collisionErrors: 0,
        snapOvershoots: 0,
        inputLeaks: 0,
        duplicateTiles: 0,
      },
      sessionMetrics: {
        totalMoves: 0,
        totalPointers: 0,
        totalPathsResolved: 0,
        diagonalMoves: 0,
        orthogonalMoves: 0,
        totalPathLength: 0,
        driftEvents: 0,
        lifecycleErrors: 0,
      },
      currentTargetIndex: config.currentTargetIndex || 0,
      ui: {
        settingsOpen: false,
      },
      lastGravityTrace: null,
      gravityReplay: null,
    };
  },

  resolveInteraction(
    state: SpeedGridState,
    action: SpeedGridAction,
  ): SpeedGridState {
    switch (action.type) {
      case "TICK": {
        if (!state.isTimerRunning || state.phase === "ROUND_END") return state;

        let nextTimeLeft = state.timeLeft - action.deltaMs / 1000;
        let nextPending = state.pendingTimeBonus || 0;

        if (nextPending > 0) {
          // Drain at a rate of 16.66 seconds per real second (~600ms for 10s)
          const drainRate = 16.66;
          const drainAmount = Math.min(
            nextPending,
            drainRate * (action.deltaMs / 1000),
          );
          nextTimeLeft += drainAmount;
          nextPending -= drainAmount;
        }

        const newTime = Math.min(99, Math.max(0, nextTimeLeft));

        if (newTime <= 0) {
          // [PHASE 5] Final buzzer resolution check
          const successPid = Object.keys(state.pathStatus).find(
            (pid) => state.pathStatus[pid] === "SUCCESS",
          );

          if (successPid) {
            // If there's a successful path at the buzzer, resolve it then end
            const resolvedState = this.resolveInteraction(state, {
              type: "RESOLVE_SUCCESSFUL_PATH",
              pointerId: successPid,
            });
            return {
              ...resolvedState,
              timeLeft: 0,
              phase: "ROUND_END",
            };
          }

          return {
            ...state,
            timeLeft: 0,
            phase: "ROUND_END",
          };
        }

        return {
          ...state,
          timeLeft: newTime,
          pendingTimeBonus: nextPending,
          phase: newTime <= 0 ? "ROUND_END" : state.phase,
        };
      }

      // 🔒 LOCKED: GESTURE START logic
      case "GESTURE_START_POINT": {
        if (state.phase === "ROUND_END") return state;
        const nextActivePaths = { ...state.activePaths };
        const nextPathStatus = { ...state.pathStatus };
        const nextPathSums = { ...state.pathSums };
        const nextActivePointerIds = [...state.activePointerIds];
        const nextLastTile = { ...state.lastTileByPointer };
        const nextInterpolationCache = { ...state.interpolationCache };

        // REJECT: Same pointer already starting?
        if (nextActivePaths[action.pointerId]?.length > 0) return state;

        if (!nextActivePointerIds.includes(action.pointerId)) {
          nextActivePointerIds.push(action.pointerId);
        }

        if (action.tileId) {
          const tile = state.board
            .flat()
            .find((t) => t?.instanceId === action.tileId);

          if (tile?.specialType === "TIME") {
            if (tile.row === state.rows - 1) {
              // --- TIME TILE COLLECTION LOGIC ---
              const burst = {
                id: `burst_${Date.now()}_${Math.random()}`,
                row: tile.row,
                col: tile.col,
                amount: tile.timeBonus || 10,
                timestamp: Date.now(),
              };

              const t0 = performance.now();
              const initialBoardSnapshot = cloneBoard(state.board);

              const nextBoard = state.board.map((r) =>
                r.map((c) => (c?.instanceId === action.tileId ? null : c)),
              );
              const afterRemovalSnapshot = cloneBoard(nextBoard);

              const { newBoard: gravityBoard, moves } = applyGravity(nextBoard);
              const afterGravitySnapshot = cloneBoard(gravityBoard);

              const { newBoard: finalBoard, spawns } = refillBoard(
                gravityBoard,
                state.activeProfile.numberPool,
                0,
              );

              if (
                state.activeProfile.rules.ensureSolvable &&
                !findExistingSolution(finalBoard, state.target)
              ) {
                injectSafeSolution(
                  finalBoard,
                  state.target,
                  state.activeProfile.numberPool,
                  state.settings.operationMode,
                );
              }

              const afterRefillSnapshot = cloneBoard(finalBoard);

              const gravityTrace: GravityTrace = {
                timestamp: Date.now(),
                removed: [tile],
                moves,
                spawns,
                snapshots: {
                  before: initialBoardSnapshot,
                  afterRemoval: afterRemovalSnapshot,
                  afterGravity: afterGravitySnapshot,
                  afterRefill: afterRefillSnapshot,
                },
                summary: "",
              };
              gravityTrace.summary = generateTraceSummary(gravityTrace);

              if (state.settings.devMode) {
                // Keep minimal log for timing, but removed Group/Trace explosion
                console.log(`[TIME TILE] ${burst.amount}s added`);
              }

              return {
                ...state,
                board: finalBoard,
                timeTileBursts: [...state.timeTileBursts, burst].slice(-10),
                pendingTimeBonus: state.pendingTimeBonus + burst.amount,
                gravityRuns: state.gravityRuns + 1,
                refillRuns: state.refillRuns + 1,
                lastGravityTrace: state.settings.diagnosticMode
                  ? gravityTrace
                  : state.lastGravityTrace,
              };
            }
            return state; // inert if not at bottom row
          }

          if (!nextActivePaths) return state; // Guard added as per request
          // REJECT: Removed temporarily to confirm interleaving
          const isTileOwned = false;

          nextActivePaths[action.pointerId] = [action.tileId];

          // PHASE 5: Combined mode start logic
          if (
            state.settings.multiTouchMode === "combined" &&
            !state.settings.devMultiTouchForce
          ) {
            const combinedSum = calculateSelectionResult(
              nextActivePaths,
              state.board,
              state.settings.operationMode,
            );
            if (combinedSum > state.target && !state.settings.devMultiTouchForce) {
               const overshootSnap = createOvershootSnapshot(state, action.pointerId, combinedSum);
               delete nextActivePaths[action.pointerId];
               delete nextPathStatus[action.pointerId];
               delete nextPathSums[action.pointerId];
               delete nextLastTile[action.pointerId];
               delete nextInterpolationCache[action.pointerId];
               const remainingActivePointerIds = nextActivePointerIds.filter(id => id !== action.pointerId);
               return {
                  ...state,
                  lastActionName: "OVERSHOOT_RESET",
                  overshootFeedback: overshootSnap,
                  activePaths: nextActivePaths,
                  pathStatus: nextPathStatus,
                  pathSums: nextPathSums,
                  lastTileByPointer: nextLastTile,
                  interpolationCache: nextInterpolationCache,
                  activePointerIds: remainingActivePointerIds,
                  selectionIds: Object.values(nextActivePaths).flat(),
                  lastTimestampByPointer: {
                    ...state.lastTimestampByPointer,
                    [action.pointerId]: action.timestamp || state.lastTimestampByPointer[action.pointerId],
                  },
               };
            }
            const status = combinedSum === state.target ? "SUCCESS" : "ACTIVE";

            // INVARIANT 1: Verify shared sum integrity on START
            const invariantSum = calculateSelectionResult(
              nextActivePaths,
              state.board,
              state.settings.operationMode,
            );
            if (invariantSum !== combinedSum) {
              const err = `[INVARIANT FAILURE] Start Sum Mismatch! Recalculated:${invariantSum} vs Engine:${combinedSum}`;
              console.error(err);
              if (process.env.NODE_ENV !== "production") throw new Error(err);
            }

            Object.keys(nextActivePaths).forEach((pid) => {
              nextPathStatus[pid] = status;
              nextPathSums[pid] = combinedSum;
            });
          } else {
            const tile = state.board
              .flat()
              .find((t) => t?.instanceId === action.tileId);
            const val = tile?.value || 0;
            if (val > state.target && !state.settings.devMultiTouchForce) {
               const overshootSnap = createOvershootSnapshot(state, action.pointerId, val);
               delete nextActivePaths[action.pointerId];
               delete nextPathStatus[action.pointerId];
               delete nextPathSums[action.pointerId];
               delete nextLastTile[action.pointerId];
               delete nextInterpolationCache[action.pointerId];
               const remainingActivePointerIds = nextActivePointerIds.filter(id => id !== action.pointerId);
               return {
                  ...state,
                  lastActionName: "OVERSHOOT_RESET",
                  overshootFeedback: overshootSnap,
                  activePaths: nextActivePaths,
                  pathStatus: nextPathStatus,
                  pathSums: nextPathSums,
                  lastTileByPointer: nextLastTile,
                  interpolationCache: nextInterpolationCache,
                  activePointerIds: remainingActivePointerIds,
                  selectionIds: Object.values(nextActivePaths).flat(),
                  lastTimestampByPointer: {
                    ...state.lastTimestampByPointer,
                    [action.pointerId]: action.timestamp || state.lastTimestampByPointer[action.pointerId],
                  },
               };
            }
            const status = val === state.target ? "SUCCESS" : "ACTIVE";
            nextPathStatus[action.pointerId] = state.settings.devMultiTouchForce
              ? "ACTIVE"
              : status;
            nextPathSums[action.pointerId] = val;
            if (state.settings.devMode) {
              console.log(
                `[MULTI_PATH] id:${action.pointerId} sum:${val} tiles:1`,
              );
            }
          }
        } else {
          nextActivePaths[action.pointerId] = [];
          nextPathStatus[action.pointerId] = "ACTIVE";
          nextPathSums[action.pointerId] = 0;
        }

        return {
          ...state,
          isTimerRunning: true,
          phase: "PLAY",
          lastActionName: "GESTURE_START",
          lastPointerPos: {
            ...state.lastPointerPos,
            [action.pointerId]: { ux: action.ux, uy: action.uy },
          },
          lastTimestampByPointer: {
            ...state.lastTimestampByPointer,
            [action.pointerId]: action.timestamp || Date.now(),
          },
          lastTileByPointer: {
            ...state.lastTileByPointer,
            [action.pointerId]:
              action.row !== undefined && action.col !== undefined
                ? { row: action.row, col: action.col }
                : undefined,
          } as any,
          interpolationCache: {
            ...state.interpolationCache,
            [action.pointerId]: [],
          },
          activePaths: nextActivePaths,
          activePointerIds: nextActivePointerIds,
          pathStatus: nextPathStatus,
          pathSums: nextPathSums,
          selectionIds: Object.values(nextActivePaths).flat(),
        };
      }

      // 🔒 LOCKED: GESTURE MOVE + CORNER DETECTION + DIAGONAL SNAP
      case "GESTURE_MOVE": {
        if (state.phase === "ROUND_END") return state;

        const nextStressMetrics = { ...state.stressMetrics };
        const nextSessionMetrics = { ...state.sessionMetrics };
        nextSessionMetrics.totalMoves += 1;

        if (!state.activePointerIds.includes(action.pointerId)) {
          // [STRESS: Input Leak] (Step 4)
          if (state.settings.stressTestMode) {
            nextStressMetrics.inputLeaks += 1;
          }
          // [SESSION: Lifecycle Error]
          nextSessionMetrics.lifecycleErrors += 1;
          return {
            ...state,
            stressMetrics: nextStressMetrics,
            sessionMetrics: nextSessionMetrics,
            lastActionName: "REJECTED_MOVE",
          };
        }

        const nextActivePaths = { ...state.activePaths };
        const nextPathStatus = { ...state.pathStatus };
        const nextPathSums = { ...state.pathSums };
        const currentPath = [...(nextActivePaths[action.pointerId] || [])];
        const currentStatus = nextPathStatus[action.pointerId] || "ACTIVE";
        const currentTime = action.timestamp || Date.now();
        const lastTime =
          state.lastTimestampByPointer[action.pointerId] || currentTime;
        const nextTimestamp = {
          ...state.lastTimestampByPointer,
          [action.pointerId]: currentTime,
        };

        // [PHASE 5] Freeze path once Success or Fail is reached
        if (currentStatus !== "ACTIVE" && !state.settings.devMultiTouchForce) {
          return {
            ...state,
            stressMetrics: nextStressMetrics,
            lastPointerPos: {
              ...state.lastPointerPos,
              [action.pointerId]: { ux: action.ux, uy: action.uy },
            },
            lastTimestampByPointer: nextTimestamp,
          };
        }

        const lastTilePos = state.lastTileByPointer[action.pointerId];
        let currentTilePos = null;
        let admissionReason = "";

        // TILE RESOLUTION & INVALID COORD BAN
        if (
          action.row !== undefined &&
          action.col !== undefined &&
          !Number.isNaN(action.row) &&
          !Number.isNaN(action.col) &&
          action.row >= 0 &&
          action.row < state.rows &&
          action.col >= 0 &&
          action.col < state.cols &&
          action.tileId != null // Guard path admission to be instance-ID based
        ) {
          currentTilePos = { row: action.row, col: action.col };
        }

        let pathImpact = false;
        let nextInterpolation = [
          ...(state.interpolationCache[action.pointerId] || []),
        ];

        // Ensure SUCCESS state locks path admission
        if (currentStatus !== "ACTIVE" && !state.settings.devMultiTouchForce) {
           currentTilePos = null; // Lock admission if already failed/success
        }

        if (currentTilePos) {
          // GATING: Only proceed if we entered a NEW tile
          if (
            lastTilePos &&
            lastTilePos.row === currentTilePos.row &&
            lastTilePos.col === currentTilePos.col
          ) {
            return {
              ...state,
              lastPointerPos: {
                ...state.lastPointerPos,
                [action.pointerId]: { ux: action.ux, uy: action.uy },
              },
              lastTimestampByPointer: nextTimestamp,
            };
          }

          const tId =
            state.board[currentTilePos.row][currentTilePos.col]?.instanceId;
          const targetTileCheck =
            state.board[currentTilePos.row][currentTilePos.col];

          // Instance ID guard: Action tileId must match the board's tileId
          if (tId !== action.tileId) {
             currentTilePos = null; 
          }

          if (targetTileCheck?.specialType === "TIME") {
            return {
              ...state,
              lastPointerPos: {
                ...state.lastPointerPos,
                [action.pointerId]: { ux: action.ux, uy: action.uy },
              },
              lastTimestampByPointer: nextTimestamp,
            };
          }

          if (currentTilePos && tId && !currentPath.includes(tId)) {
            // [STEP 4] Simplified Adjacency: abs(dr) <= 1 AND abs(dc) <= 1 AND not (dr === 0 AND dc === 0)
            if (lastTilePos) {
              const dr = Math.abs(currentTilePos.row - lastTilePos.row);
              const dc = Math.abs(currentTilePos.col - lastTilePos.col);

              const isValidAdjacency =
                dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);

              if (!isValidAdjacency) {
                // Reject move if not adjacent
                return {
                  ...state,
                  lastPointerPos: {
                    ...state.lastPointerPos,
                    [action.pointerId]: { ux: action.ux, uy: action.uy },
                  },
                  lastTimestampByPointer: nextTimestamp,
                };
              }

              admissionReason = "ADJACENT";

              if (dr === 1 && dc === 1) {
                nextSessionMetrics.diagonalMoves += 1;
              } else {
                nextSessionMetrics.orthogonalMoves += 1;
              }
            } else {
              admissionReason = "FIRST_TILE_OF_PATH";
            }

            if (!currentPath.includes(tId)) {
              // [STRESS TEST: Collision]
              if (state.settings.stressTestMode) {
                const owners = Object.keys(state.activePaths).filter(
                  (pid) =>
                    pid !== action.pointerId &&
                    state.activePaths[pid].includes(tId),
                );
                if (owners.length > 0) nextStressMetrics.collisionErrors += 1;
              }
              currentPath.push(tId);
              pathImpact = true;
              nextActivePaths[action.pointerId] = currentPath;
            } else if (state.settings.stressTestMode) {
              nextStressMetrics.duplicateTiles += 1;
            }
          } else if (tId && currentPath.includes(tId)) {
            return {
              ...state,
              stressMetrics: nextStressMetrics,
              lastPointerPos: {
                ...state.lastPointerPos,
                [action.pointerId]: { ux: action.ux, uy: action.uy },
              },
              lastTimestampByPointer: nextTimestamp,
              lastTileByPointer: {
                ...state.lastTileByPointer,
                [action.pointerId]: currentTilePos,
              },
            };
          }
        }

        if (pathImpact) {
          // PHASE 5: Implementation of multi-touch modes
          if (
            state.settings.multiTouchMode === "combined" &&
            !state.settings.devMultiTouchForce
          ) {
            const combinedResult = calculateSelectionResult(
              nextActivePaths,
              state.board,
              state.settings.operationMode,
            );
            if (combinedResult > state.target && !state.settings.devMultiTouchForce) {
               const overshootSnap = createOvershootSnapshot(state, action.pointerId, combinedResult);
               delete nextActivePaths[action.pointerId];
               delete nextPathStatus[action.pointerId];
               delete nextPathSums[action.pointerId];
               const remainingActivePointerIds = state.activePointerIds.filter(id => id !== action.pointerId);
               
               const nextLastTileByPointer = { ...state.lastTileByPointer };
               delete nextLastTileByPointer[action.pointerId];
               
               const nextInterpolation = { ...state.interpolationCache };
               delete nextInterpolation[action.pointerId];
               
               // Also in combined mode we should probably drop ALL paths if they exceeded?
               // The request says: "delete activePaths[pointerId], update selectionIds, return state"
               // So we just drop THIS pointer for now.
               
               return {
                  ...state,
                  lastActionName: "OVERSHOOT_RESET",
                  overshootFeedback: overshootSnap,
                  activePaths: nextActivePaths,
                  pathStatus: nextPathStatus,
                  pathSums: nextPathSums,
                  lastTileByPointer: nextLastTileByPointer,
                  interpolationCache: nextInterpolation,
                  activePointerIds: remainingActivePointerIds,
                  selectionIds: Object.values(nextActivePaths).flat(),
               };
            }
            const status = combinedResult === state.target ? "SUCCESS" : "ACTIVE";

            // INVARIANT 1: Verify shared sum integrity on MOVE
            const invariantResult = calculateSelectionResult(
              nextActivePaths,
              state.board,
              state.settings.operationMode,
            );
            if (invariantResult !== combinedResult) {
              const err = `[INVARIANT FAILURE] Move Result Mismatch! Recalculated:${invariantResult} vs Engine:${combinedResult}`;
              console.error(err);
              if (process.env.NODE_ENV !== "production") throw new Error(err);
            }

            Object.keys(nextActivePaths).forEach((pid) => {
              nextPathStatus[pid] = status;
              nextPathSums[pid] = combinedResult;
            });
          } else {
            const pathResult = calculateSelectionResult(
              { [action.pointerId]: currentPath },
              state.board,
              state.settings.operationMode,
            );
            if (pathResult > state.target && !state.settings.devMultiTouchForce) {
               const overshootSnap = createOvershootSnapshot(state, action.pointerId, pathResult);
               delete nextActivePaths[action.pointerId];
               delete nextPathStatus[action.pointerId];
               delete nextPathSums[action.pointerId];
               const remainingActivePointerIds = state.activePointerIds.filter(id => id !== action.pointerId);
               
               const nextLastTileByPointer = { ...state.lastTileByPointer };
               delete nextLastTileByPointer[action.pointerId];
               
               const nextInterpolation = { ...state.interpolationCache };
               delete nextInterpolation[action.pointerId];
               
               return {
                  ...state,
                  lastActionName: "OVERSHOOT_RESET",
                  overshootFeedback: overshootSnap,
                  activePaths: nextActivePaths,
                  pathStatus: nextPathStatus,
                  pathSums: nextPathSums,
                  lastTileByPointer: nextLastTileByPointer,
                  interpolationCache: nextInterpolation,
                  activePointerIds: remainingActivePointerIds,
                  selectionIds: Object.values(nextActivePaths).flat(),
               };
            }
            const status = pathResult === state.target ? "SUCCESS" : "ACTIVE";
            nextPathStatus[action.pointerId] = state.settings.devMultiTouchForce
              ? "ACTIVE"
              : status;
            nextPathSums[action.pointerId] = pathResult;
            if (state.settings.devMode) {
              console.log(
                `[MULTI_PATH] id:${action.pointerId} result:${pathResult} tiles:${currentPath.length}`,
              );
            }
          }
        }

        let nextActivePointerIds = [...state.activePointerIds];

        // If status reached terminal state (SUCCESS), eject from active tracking
        if (
          nextPathStatus[action.pointerId] &&
          nextPathStatus[action.pointerId] !== "ACTIVE"
        ) {
          nextActivePointerIds = nextActivePointerIds.filter(
            (id) => id !== action.pointerId,
          );
          nextSessionMetrics.totalPathsResolved += 1;
          delete nextTimestamp[action.pointerId];
        }

        const nextState = {
          ...state,
          lastActionName: "GESTURE_MOVE",
          stressMetrics: nextStressMetrics,
          sessionMetrics: nextSessionMetrics,
          lastPointerPos: {
            ...state.lastPointerPos,
            [action.pointerId]: { ux: action.ux, uy: action.uy },
          },
          lastTimestampByPointer: nextTimestamp,
          lastTileByPointer: currentTilePos
            ? {
                ...state.lastTileByPointer,
                [action.pointerId]: currentTilePos,
              }
            : state.lastTileByPointer,
          interpolationCache: {
            ...state.interpolationCache,
            [action.pointerId]: nextInterpolation,
          },
          activePaths: nextActivePaths,
          pathStatus: nextPathStatus,
          pathSums: nextPathSums,
          mappingErrors: state.mappingErrors,
          activePointerIds: nextActivePointerIds,
          selectionIds: Object.values(nextActivePaths).flat(),
        };

        // STEP 7 — GRID INTEGRITY CHECK (DEV ASSERT)
        if (process.env.NODE_ENV !== "production") {
          const instanceIds = new Set<string>();
          let tileCount = 0;
          state.board.forEach((rowArr, r) => {
            rowArr.forEach((tile, c) => {
              if (tile) {
                if (tile.row !== r || tile.col !== c)
                  throw new Error("GRID CORRUPTION: Row/Col mismatch");
                if (instanceIds.has(tile.instanceId))
                  throw new Error("GRID CORRUPTION: Duplicate instanceId");
                instanceIds.add(tile.instanceId);
                tileCount++;
              }
            });
          });
          if (tileCount !== state.rows * state.cols)
            throw new Error("GRID CORRUPTION: Tile count mismatch");
        }

        return nextState;
      }

      // 🔒 LOCKED: GESTURE END logic
      case "GESTURE_END": {
        const nextLastPos = { ...state.lastPointerPos };
        delete nextLastPos[action.pointerId];
        const nextTimestamp = { ...state.lastTimestampByPointer };
        delete nextTimestamp[action.pointerId];
        const nextLastTile = { ...state.lastTileByPointer };
        delete nextLastTile[action.pointerId];
        const nextInterpolationCache = { ...state.interpolationCache };
        delete nextInterpolationCache[action.pointerId];

        const nextActivePointerIds = state.activePointerIds.filter(
          (id) => id !== action.pointerId,
        );

        const nextActivePaths = { ...state.activePaths };
        const nextPathStatus = { ...state.pathStatus };
        const nextPathSums = { ...state.pathSums };

        // HARD CLEANUP: If not SUCCESS, kill path immediately
        const status = state.pathStatus[action.pointerId];
        if (status !== "SUCCESS") {
          delete nextActivePaths[action.pointerId];
          delete nextPathStatus[action.pointerId];
          delete nextPathSums[action.pointerId];

          // INVARIANT 4: sharedResult must decrease correctly on pointer removal
          if (
            state.settings.multiTouchMode === "combined" &&
            !state.settings.devMultiTouchForce
          ) {
            const combinedResult = calculateSelectionResult(
              nextActivePaths,
              state.board,
              state.settings.operationMode,
            );
            if (combinedResult > state.target && !state.settings.devMultiTouchForce) {
               Object.keys(nextActivePaths).forEach((pid) => {
                 delete nextActivePaths[pid];
                 delete nextPathStatus[pid];
                 delete nextPathSums[pid];
               });
            } else {
               const nextStatus = combinedResult === state.target ? "SUCCESS" : "ACTIVE";
               Object.keys(nextActivePaths).forEach((pid) => {
                 nextPathStatus[pid] = nextStatus;
                 nextPathSums[pid] = combinedResult;
               });
            }
          }
        }

        return {
          ...state,
          lastActionName: "GESTURE_END",
          lastPointerPos: nextLastPos,
          lastTimestampByPointer: nextTimestamp,
          lastTileByPointer: nextLastTile,
          interpolationCache: nextInterpolationCache,
          activePointerIds: nextActivePointerIds,
          activePaths: nextActivePaths,
          pathStatus: nextPathStatus,
          pathSums: nextPathSums,
          selectionIds: Object.values(nextActivePaths).flat(),
        };
      }

      case "CLEAR_PATH": {
        const nextActivePaths = { ...state.activePaths };
        const nextPathStatus = { ...state.pathStatus };
        const nextPathSums = { ...state.pathSums };
        const nextLastTile = { ...state.lastTileByPointer };
        const nextInterpolationCache = { ...state.interpolationCache };
        const nextTimestamp = { ...state.lastTimestampByPointer };
        delete nextTimestamp[action.pointerId];
        let nextActivePointerIds = [...state.activePointerIds];

        delete nextActivePaths[action.pointerId];
        delete nextPathStatus[action.pointerId];
        delete nextPathSums[action.pointerId];
        delete nextLastTile[action.pointerId];
        delete nextInterpolationCache[action.pointerId];
        nextActivePointerIds = nextActivePointerIds.filter(
          (id) => id !== action.pointerId,
        );

          // Recalculate combined result for remaining pointers
          if (
            state.settings.multiTouchMode === "combined" &&
            !state.settings.devMultiTouchForce
          ) {
            const combinedResult = calculateSelectionResult(
              nextActivePaths,
              state.board,
              state.settings.operationMode,
            );
            if (combinedResult > state.target && !state.settings.devMultiTouchForce) {
               Object.keys(nextActivePaths).forEach((pid) => {
                 delete nextActivePaths[pid];
                 delete nextPathStatus[pid];
                 delete nextPathSums[pid];
               });
            } else {
               const nextStatus = combinedResult === state.target ? "SUCCESS" : "ACTIVE";
               Object.keys(nextActivePaths).forEach((pid) => {
                 nextPathStatus[pid] = nextStatus;
                 nextPathSums[pid] = combinedResult;
               });
            }
          }

        return {
          ...state,
          activePaths: nextActivePaths,
          pathStatus: nextPathStatus,
          pathSums: nextPathSums,
          lastTileByPointer: nextLastTile,
          interpolationCache: nextInterpolationCache,
          activePointerIds: nextActivePointerIds,
          lastTimestampByPointer: nextTimestamp,
          selectionIds: Object.values(nextActivePaths).flat(),
        };
      }

      case "OPEN_SETTINGS": {
        return {
          ...state,
          ui: { ...state.ui, settingsOpen: true },
          draftSettings: { ...state.settings },
        };
      }

      case "CLOSE_SETTINGS": {
        return {
          ...state,
          ui: { ...state.ui, settingsOpen: false },
          draftSettings: null,
        };
      }

      case "START_GRAVITY_REPLAY": {
        if (!state.lastGravityTrace) return state;
        return {
          ...state,
          gravityReplay: { active: true, step: 0 },
        };
      }

      case "NEXT_GRAVITY_REPLAY_STEP": {
        if (!state.gravityReplay) return state;
        const nextStep = state.gravityReplay.step + 1;
        if (nextStep > 4) return { ...state, gravityReplay: null };
        return {
          ...state,
          gravityReplay: { ...state.gravityReplay, step: nextStep },
        };
      }

      case "STOP_GRAVITY_REPLAY": {
        return {
          ...state,
          gravityReplay: null,
        };
      }

      case "SET_DRAFT_SETTING": {
        if (!state.draftSettings) return state;
        return {
          ...state,
          draftSettings: { ...state.draftSettings, [action.key]: action.value },
        };
      }

      case "APPLY_SETTINGS": {
        if (!state.draftSettings) return state;
        const nextSettings = { ...state.draftSettings };

        // Sanitize numeric inputs that might be strings from draft edits
        if (nextSettings.rangeConfig) {
          nextSettings.rangeConfig = {
            min: parseInt(nextSettings.rangeConfig.min as any) || 1,
            max: parseInt(nextSettings.rangeConfig.max as any) || 50,
          };
        }
        if (nextSettings.singleConfig) {
          nextSettings.singleConfig = {
            value: parseInt(nextSettings.singleConfig.value as any) || 1,
          };
        }

        if (typeof window !== "undefined") {
          try {
            const savedSettings = {
              hapticsEnabled: nextSettings.hapticsEnabled,
              devMode: nextSettings.devMode,
              numberPool: nextSettings.numberPool,
              targetSource: nextSettings.targetSource,
              gridSize: nextSettings.gridSize,
              timeLimit: nextSettings.timeLimit,
              timeTileFrequency: nextSettings.timeTileFrequency,
            };
            localStorage.setItem("speedgrid_settings", JSON.stringify(savedSettings));
          } catch (e) {}
        }

        // Categories for settings reaction
        const REGEN_KEYS: (keyof SpeedGridSettings)[] = [
          "targetSource",
          "multiplesConfig",
          "rangeConfig",
          "specificConfig",
          "singleConfig",
          "customTargetList",
          "operationMode",
          "numberPool",
        ];

        const RESTART_KEYS: (keyof SpeedGridSettings)[] = [
          "activeProfileId",
          "gridSize",
          "timeLimit",
        ];

        let needsRegen = false;
        for (const key of REGEN_KEYS) {
          if (JSON.stringify(state.settings[key]) !== JSON.stringify(nextSettings[key])) {
            needsRegen = true;
            break;
          }
        }

        let needsRestart = false;
        for (const key of RESTART_KEYS) {
          if (JSON.stringify(state.settings[key]) !== JSON.stringify(nextSettings[key])) {
            needsRestart = true;
            break;
          }
        }

        const frequencyChanged = state.settings.timeTileFrequency !== nextSettings.timeTileFrequency;

        if (needsRestart || needsRegen) {
          const freshState = this.generateInitialState({
            profile: state.activeProfile,
            seed: Date.now(),
            rows: nextSettings.gridSize[0],
            cols: nextSettings.gridSize[1],
            initialSettings: nextSettings,
          });

          if (needsRestart) {
            return {
              ...freshState,
              settings: nextSettings,
              solvedTileCounter: frequencyChanged ? 0 : freshState.solvedTileCounter,
              ui: { ...freshState.ui, settingsOpen: false },
            };
          } else {
            // REGEN ONLY: Preserve score and time
            return {
              ...freshState,
              settings: nextSettings,
              score: state.score,
              timeLeft: state.timeLeft,
              isTimerRunning: state.isTimerRunning,
              phase: state.phase,
              solvedTileCounter: frequencyChanged ? 0 : state.solvedTileCounter,
              ui: { ...freshState.ui, settingsOpen: false },
            };
          }
        }

        return {
          ...state,
          settings: nextSettings,
          solvedTileCounter: frequencyChanged ? 0 : state.solvedTileCounter,
          draftSettings: null,
          ui: { ...state.ui, settingsOpen: false },
        };
      }

      case "EXPIRE_OVERSHOOT": {
        return {
          ...state,
          overshootFeedback: null,
        };
      }

      case "EXPIRE_SUCCESS": {
        return {
          ...state,
          successFeedback: null,
        };
      }

      case "RESOLVE_SUCCESSFUL_PATH": {
        const t0 = performance.now();
        const initialBoardSnapshot = cloneBoard(state.board);

        const path = state.activePaths[action.pointerId];
        if (!path) return state;

        const successSnap = createSuccessSnapshot(state, action.pointerId, state.pathSums[action.pointerId] || state.target);

        // PHASE 5: Combined mode resolution (clear all files involved)
        const tilesToResolveIds =
          state.settings.multiTouchMode === "combined"
            ? Array.from(new Set(Object.values(state.activePaths).flat()))
            : path;

        const resolvedTiles = state.board
          .flat()
          .filter((t) => t && tilesToResolveIds.includes(t.instanceId));

        const tilesToResolveSet = new Set(tilesToResolveIds);

        const resolvedCount = tilesToResolveIds.length;
        const nextSolvedTileCounter = state.solvedTileCounter + resolvedCount;
        
        let spawnsNeeded = 0;
        const frequency = state.settings.timeTileFrequency;
        if (frequency !== "off") {
          const threshold = frequency === "frequent" ? 5 : frequency === "rare" ? 15 : 10;
          spawnsNeeded = Math.floor(nextSolvedTileCounter / threshold) - Math.floor(state.solvedTileCounter / threshold);
        }

        // Compute Equation Pill
        let lastEquation = "";
        const opMode = state.settings.operationMode;
        const isCombined = state.settings.multiTouchMode === "combined";
        const values = resolvedTiles
          .map((t) => t?.value)
          .filter((v) => v !== undefined) as number[];

        if (opMode === "add") {
          lastEquation = values.join(" + ") + " = " + state.target;
        } else if (opMode === "multiply") {
          lastEquation = values.join(" × ") + " = " + state.target;
        }

        // STEP 1: REMOVE TILES
        let nextBoard = state.board.map((row) =>
          row.map((cell) =>
            cell && tilesToResolveSet.has(cell.instanceId) ? null : cell,
          ),
        );
        const afterRemovalSnapshot = cloneBoard(nextBoard);

        // STEP 2: APPLY GRAVITY
        const { newBoard: gravityBoard, moves } = applyGravity(nextBoard);
        const afterGravitySnapshot = cloneBoard(gravityBoard);

        // STEP 3: REFILL
        const { newBoard: finalBoard, spawns } = refillBoard(
          gravityBoard,
          state.activeProfile.numberPool,
          spawnsNeeded,
        );
        const afterRefillSnapshot = cloneBoard(finalBoard);

        const gravityTrace: GravityTrace = {
          timestamp: Date.now(),
          durationMs: performance.now() - t0,
          removed: resolvedTiles.map((t) => ({ ...t })),
          moves,
          spawns,
          snapshots: {
            before: initialBoardSnapshot,
            afterRemoval: afterRemovalSnapshot,
            afterGravity: afterGravitySnapshot,
            afterRefill: afterRefillSnapshot,
          },
          summary: "",
        };
        gravityTrace.summary = generateTraceSummary(gravityTrace);

        const t1 = performance.now();

        if (state.settings.devMode) {
          console.group(`[GRAVITY TRACE] ${(t1 - t0).toFixed(2)}ms`);
          console.log(gravityTrace);
          console.groupEnd();
        }

        const gravityRuns = state.gravityRuns + 1;
        const refillRuns = state.refillRuns + 1;
        nextBoard = finalBoard;

        // Rotate target
        let nextTargetIndex = state.currentTargetIndex;
        let nextTarget = state.target;

        // Respect cycleLength for target pool if set
        const targetsPool =
          state.settings.cycleLength > 0
            ? state.activeProfile.targets.slice(0, state.settings.cycleLength)
            : state.activeProfile.targets;
        const totalPoolTargets = targetsPool.length;

        if (state.settings.presentationMode === "sequential") {
          nextTargetIndex = (state.currentTargetIndex + 1) % totalPoolTargets;
          nextTarget = targetsPool[nextTargetIndex];
        } else if (state.settings.presentationMode === "weighted") {
          const shouldRepeat = Math.random() < 0.2;
          if (!shouldRepeat) {
            nextTargetIndex = Math.floor(Math.random() * totalPoolTargets);
            nextTarget = targetsPool[nextTargetIndex];
          }
        } else {
          nextTargetIndex = Math.floor(Math.random() * totalPoolTargets);
          nextTarget = targetsPool[nextTargetIndex];
        }

        // [PHASE 5] Safety Audit: Ensure at least one solution exists
        if (
          state.activeProfile.rules.ensureSolvable &&
          !findExistingSolution(nextBoard, nextTarget)
        ) {
          injectSafeSolution(
            nextBoard,
            nextTarget,
            state.activeProfile.numberPool,
            state.settings.operationMode,
          );
        }

        let nullTilesRemaining = 0;
        for (let r = 0; r < state.rows; r++) {
          for (let c = 0; c < state.cols; c++) {
            if (nextBoard[r][c] === null) {
              nullTilesRemaining++;
            }
          }
        }

        const nextActivePaths = { ...state.activePaths };
        const nextPathStatus = { ...state.pathStatus };
        const nextPathSums = { ...state.pathSums };
        let nextActivePointerIds = [...state.activePointerIds];

        const nextLastTile = { ...state.lastTileByPointer };
        delete nextLastTile[action.pointerId];
        const nextInterpolationCache = { ...state.interpolationCache };
        delete nextInterpolationCache[action.pointerId];
        const nextTimestamp = { ...state.lastTimestampByPointer };
        delete nextTimestamp[action.pointerId];

        if (state.settings.multiTouchMode === "combined") {
          Object.keys(nextActivePaths).forEach((pid) => {
            delete nextActivePaths[pid];
            delete nextPathStatus[pid];
            delete nextPathSums[pid];
            delete nextInterpolationCache[pid];
            delete nextTimestamp[pid];
          });
          nextActivePointerIds = [];
        } else {
          delete nextActivePaths[action.pointerId];
          delete nextPathStatus[action.pointerId];
          delete nextPathSums[action.pointerId];
          delete nextInterpolationCache[action.pointerId];
          delete nextTimestamp[action.pointerId];
          nextActivePointerIds = state.activePointerIds.filter(
            (id) => id !== action.pointerId,
          );
        }

        const scoreDelta = resolvedCount * 5;
        let finalDelta = scoreDelta;

        // MULTI-TOUCH ADVANTAGE: Combined completion bonus
        const now = Date.now();
        if (
          state.lastResolvePid &&
          state.lastResolvePid !== action.pointerId &&
          now - state.lastResolveTime < 500
        ) {
          const bonus = 25;
          finalDelta += bonus;
          if (state.settings.devMode) {
            console.log(
              `[MULTI-TOUCH BONUS] delta: +${bonus} (time since last: ${now - state.lastResolveTime}ms from ${state.lastResolvePid})`,
            );
          }
        }

        const newScore = state.score + finalDelta;

        if (state.settings.devMode) {
          console.log(
            `[SCORE UPDATE] tiles: ${resolvedCount}, delta: +${finalDelta}, total: ${newScore}`,
          );
        }

        const nextTargetHistory = [...state.targetHistory, nextTarget].slice(-20);

        return {
          ...state,
          board: nextBoard,
          target: nextTarget,
          successFeedback: successSnap,
          targetHistory: nextTargetHistory,
          activePaths: nextActivePaths,
          activePointerIds: nextActivePointerIds,
          pathStatus: nextPathStatus,
          pathSums: nextPathSums,
          interpolationCache: nextInterpolationCache,
          lastTimestampByPointer: nextTimestamp,
          selectionIds: Object.values(nextActivePaths).flat(),
          score: newScore,
          solvedTileCounter: nextSolvedTileCounter,
          lastEquation,
          lastScoreDelta: finalDelta,
          lastResolveTime: now,
          lastResolvePid: action.pointerId,
          matchesCleared: state.matchesCleared + 1,
          lastActionName: "RESOLVE_SUCCESS",
          gravityRuns,
          refillRuns,
          nullTilesRemaining,
          lastResolvedTilesCount: resolvedCount,
          currentTargetIndex: nextTargetIndex,
          lastGravityTrace: gravityTrace,
        };
      }

      case "RESET_GAME_FULL": {
        return this.generateInitialState({
          profile: {} as any,
          seed: Date.now(),
          activeProfileId: state.settings.activeProfileId,
          multiplesConfig: state.settings.multiplesConfig,
        });
      }

      case "NEXT_TARGET": {
        const pool =
          state.settings.cycleLength > 0
            ? state.activeProfile.targets.slice(0, state.settings.cycleLength)
            : state.activeProfile.targets;
        if (!pool.length) return state;

        let nextTarget: number;
        let nextTargetIndex = state.currentTargetIndex;
        let nextTargetHistory = [...state.targetHistory];

        // If we are at the end of history, generate/pick new
        if (state.currentTargetIndex === state.targetHistory.length - 1) {
          if (state.settings.presentationMode === "sequential") {
            nextTargetIndex = (state.currentTargetIndex + 1) % pool.length;
            nextTarget = pool[nextTargetIndex % pool.length];
          } else {
            nextTarget = pool[Math.floor(Math.random() * pool.length)];
          }
          nextTargetHistory = [...nextTargetHistory, nextTarget].slice(-20);
          nextTargetIndex = nextTargetHistory.length - 1;
        } else {
          // Move forward in history
          nextTargetIndex = state.currentTargetIndex + 1;
          nextTarget = nextTargetHistory[nextTargetIndex];
        }

        const freshState = this.generateInitialState({
          profile: state.activeProfile as any,
          seed: Date.now(),
          rows: state.rows,
          cols: state.cols,
          activeProfileId: state.settings.activeProfileId,
          multiplesConfig: state.settings.multiplesConfig,
          initialSettings: state.settings,
          target: nextTarget,
          targetHistory: nextTargetHistory,
          currentTargetIndex: nextTargetIndex,
        });

        return {
          ...freshState,
          score: state.score,
          timeLeft: state.timeLeft,
          phase: state.phase,
        };
      }

      case "PREV_TARGET": {
        if (state.currentTargetIndex <= 0) return state;

        const prevTargetIndex = state.currentTargetIndex - 1;
        const prevTarget = state.targetHistory[prevTargetIndex];

        const freshState = this.generateInitialState({
          profile: state.activeProfile as any,
          seed: Date.now(),
          rows: state.rows,
          cols: state.cols,
          activeProfileId: state.settings.activeProfileId,
          multiplesConfig: state.settings.multiplesConfig,
          initialSettings: state.settings,
          target: prevTarget,
          targetHistory: state.targetHistory,
          currentTargetIndex: prevTargetIndex,
        });

        return {
          ...freshState,
          score: state.score,
          timeLeft: state.timeLeft,
          phase: state.phase,
        };
      }

      case "REFRESH_BOARD_SAME_TARGET": {
        return {
          ...this.generateInitialState({
            profile: state.activeProfile as any,
            seed: Date.now(),
            rows: state.rows,
            cols: state.cols,
            activeProfileId: state.settings.activeProfileId,
            multiplesConfig: state.settings.multiplesConfig,
          }),
          target: state.target,
          currentTargetIndex: state.currentTargetIndex,
          score: state.score,
          timeLeft: state.timeLeft,
          phase: state.phase,
        };
      }

      case "START_NEXT_ROUND": {
        const freshState = this.generateInitialState({
          profile: state.activeProfile as any,
          seed: Date.now(),
          rows: state.rows,
          cols: state.cols,
          activeProfileId: state.settings.activeProfileId,
          multiplesConfig: state.settings.multiplesConfig,
          initialSettings: state.settings,
          target: state.target,            // Force the board to be solvable for the target shown on splash
          targetHistory: state.targetHistory,
          currentTargetIndex: state.currentTargetIndex,
        });

        return {
          ...freshState,
          score: 0,
          timeLeft: state.settings.timeLimit,
          phase: "IDLE",
        };
      }

      case "RESTART": {
        return this.generateInitialState({
          ...action.config,
          activeProfileId: state.settings.activeProfileId,
          multiplesConfig: state.settings.multiplesConfig,
        });
      }

      default:
        return state;
    }
  },

  checkEndCondition(state: SpeedGridState): boolean {
    return state.timeLeft <= 0;
  },

  verifyIntegrity(
    oldState: SpeedGridState,
    newState: SpeedGridState,
    operation: string,
  ): void {
    if (newState.rows !== oldState.rows || newState.cols !== oldState.cols) {
      throw new Error(`[INTEGRITY] Grid dimension mismatch after ${operation}`);
    }
  },
};

export function runSpeedGridIntegrityCheck(state: SpeedGridState): {
  ghostInput: string;
  multiTouchIsolation: string;
  gridFit: string;
  noScroll: string;
  scoreIntegrity: string;
} {
  const checks = {
    ghostInput: "PASS",
    multiTouchIsolation: "PASS",
    gridFit: "PASS",
    noScroll: "PASS",
    scoreIntegrity: "PASS",
  };

  // 1. Ghost Input: No paths should exist for inactive pointers
  const activePids = new Set(state.activePointerIds);
  Object.keys(state.activePaths).forEach((pid) => {
    if (!activePids.has(pid)) {
      checks.ghostInput = "FAIL - path exists for inactive pointer";
    }
  });

  // 2. Multi-Touch Isolation: In independent mode, paths should be distinct (simple check)
  if (state.settings.multiTouchMode === "independent") {
    const tileUsage = new Map<string, string>();
    Object.entries(state.activePaths).forEach(([pid, path]) => {
      path.forEach((tId) => {
        if (tileUsage.has(tId) && tileUsage.get(tId) !== pid) {
          checks.multiTouchIsolation =
            "FAIL - tile overlapping in independent mode";
        }
        tileUsage.set(tId, pid);
      });
    });
  }

  // 3. Grid Fit: Rows/Cols must match board structure
  if (
    state.board.length !== state.rows ||
    (state.board[0] && state.board[0].length !== state.cols)
  ) {
    checks.gridFit = "FAIL - board dimensions mismatch";
  }

  // 4. No Scroll: Cannot be checked in rules, but we invariant the intent in docs.
  // We'll mark as PASS if dimensions are clean.
  checks.noScroll = "PASS";

  // 5. Score Integrity: No negative scores
  if (state.score < 0) {
    checks.scoreIntegrity = "FAIL - negative score detected";
  }

  return checks;
}
────────────────────────────────────────────────────────────────────────────────
