import type { FallingTile, SpawnedPosition } from './GravitySystem';

export type SpawnStyle = 'fall-in' | 'pop' | 'instant';

export interface FallAnimFrame {
  kind: 'fall';
  col: number;
  fromRow: number;
  toRow: number;
  distanceRows: number;
  value: number;
  delayMs: number;
  durationMs: number;
}

export interface SpawnAnimFrame {
  kind: 'spawn';
  row: number;
  col: number;
  value: number;
  spawnIndex: number;
  style: SpawnStyle;
  delayMs: number;
  durationMs: number;
}

export type GravityAnimFrame = FallAnimFrame | SpawnAnimFrame;

const BASE_FALL_MS = 60;
const PER_ROW_MS = 30;
const SPAWN_FALL_MS = 180;
const COL_STAGGER_MS = 20;
const SPAWN_ROW_STAGGER_MS = 25;

export function buildGravityFrames(
  fallingTiles: FallingTile[],
  spawnedPositions: SpawnedPosition[],
  spawnStyle: SpawnStyle = 'fall-in',
): GravityAnimFrame[] {
  const frames: GravityAnimFrame[] = [];
  const colFallEndMs: Record<number, number> = {};

  for (const ft of fallingTiles) {
    const distance = ft.toRow - ft.fromRow;
    const delayMs = ft.col * COL_STAGGER_MS;
    const durationMs = BASE_FALL_MS + distance * PER_ROW_MS;
    const endMs = delayMs + durationMs;

    frames.push({
      kind: 'fall',
      col: ft.col,
      fromRow: ft.fromRow,
      toRow: ft.toRow,
      distanceRows: distance,
      value: ft.value,
      delayMs,
      durationMs,
    });

    colFallEndMs[ft.col] = Math.max(colFallEndMs[ft.col] ?? 0, endMs);
  }

  const byCol: Record<number, SpawnedPosition[]> = {};
  for (const sp of spawnedPositions) {
    (byCol[sp.col] ??= []).push(sp);
  }

  for (const [colStr, positions] of Object.entries(byCol)) {
    const col = Number(colStr);
    const sorted = [...positions].sort((a, b) => a.row - b.row);
    const fallEndMs = colFallEndMs[col] ?? 0;

    sorted.forEach((sp, idx) => {
      const delayMs = fallEndMs + idx * SPAWN_ROW_STAGGER_MS;
      frames.push({
        kind: 'spawn',
        row: sp.row,
        col: sp.col,
        value: sp.value,
        spawnIndex: idx,
        style: spawnStyle,
        delayMs,
        durationMs: SPAWN_FALL_MS,
      });
    });
  }

  return frames;
}

export function gravityAnimTotalMs(frames: GravityAnimFrame[]): number {
  if (frames.length === 0) return 0;
  return Math.max(...frames.map((f) => f.delayMs + f.durationMs));
}