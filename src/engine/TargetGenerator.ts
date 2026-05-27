import type { PracticeProfile } from './PracticeProfile';
import { randomInt, randomShuffle } from './rng';

export type EvalMode = 'sum' | 'product';

export function generateTarget(
  grid: number[][],
  rows: number,
  cols: number,
  mode: EvalMode,
  profile: PracticeProfile,
  prng: () => number,
): number {
  const targetMin = mode === 'sum' ? profile.targetSumMin : profile.targetProductMin;
  const targetMax = mode === 'sum' ? profile.targetSumMax : profile.targetProductMax;

  const cells: { r: number; c: number; v: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = grid[r]?.[c] ?? 0;
      if (v > 0 && v < 99) cells.push({ r, c, v }); 
    }
  }

  if (cells.length < 2) return 10;

  const MAX_ATTEMPTS = 20;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const startIdx = Math.floor(prng() * cells.length);
    const start = cells[startIdx];
    const path: { r: number; c: number; v: number }[] = [start];
    const visited = new Set<string>([`${start.r},${start.c}`]);

    const targetLen = randomInt(prng, 2, 3);
    for (let step = 1; step < targetLen; step++) {
      const last = path[path.length - 1];
      const neighbours = [
        { r: last.r - 1, c: last.c },
        { r: last.r + 1, c: last.c },
        { r: last.r,     c: last.c - 1 },
        { r: last.r,     c: last.c + 1 },
      ].filter(
        ({ r, c }) =>
          r >= 0 && r < rows &&
          c >= 0 && c < cols &&
          !visited.has(`${r},${c}`) &&
          (grid[r]?.[c] ?? 0) > 0 && (grid[r]?.[c] ?? 0) < 99,
      );
      if (neighbours.length === 0) break;
      const next = neighbours[Math.floor(prng() * neighbours.length)];
      path.push({ r: next.r, c: next.c, v: grid[next.r][next.c] });
      visited.add(`${next.r},${next.c}`);
    }

    if (path.length < 2) continue;

    const result = evaluate(path.map((p) => p.v), mode);
    if (result >= targetMin && result <= targetMax) return result;
  }

  const shuffled = randomShuffle(prng, cells);
  const cellMap = new Map<string, { r: number; c: number; v: number }>();
  for (const cell of shuffled) cellMap.set(`${cell.r},${cell.c}`, cell);
  for (const a of shuffled) {
    const orthoNeighbours = [
      { r: a.r - 1, c: a.c },
      { r: a.r + 1, c: a.c },
      { r: a.r, c: a.c - 1 },
      { r: a.r, c: a.c + 1 },
    ];
    for (const nb of orthoNeighbours) {
      const b = cellMap.get(`${nb.r},${nb.c}`);
      if (b) {
        const fallback = evaluate([a.v, b.v], mode);
        if (fallback >= 2) return fallback;
      }
    }
  }

  return 10;
}

export function evaluate(values: number[], mode: EvalMode): number {
  if (mode === 'sum') {
    return values.reduce((a, b) => a + b, 0);
  }
  return values.reduce((a, b) => a * b, 1);
}

export function chainMatchesTarget(
  values: number[],
  target: number,
  mode: EvalMode,
): boolean {
  return evaluate(values, mode) === target;
}