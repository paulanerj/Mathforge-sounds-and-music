export function applyBonusMaskGravity(
  oldMask: boolean[][],
  preGravGrid: number[][],
  spawnBonuses: boolean[][],
  rows: number,
  cols: number,
  clearedPositions: ReadonlyArray<{ row: number; col: number }>,
): boolean[][] {
  const clearedSet = new Set<string>(
    clearedPositions.map(({ row, col }) => `${row},${col}`),
  );

  return _computeBonusMask(
    oldMask,
    rows,
    cols,
    spawnBonuses,
    (r, c) => !clearedSet.has(`${r},${c}`),
  );
}

function _computeBonusMask(
  oldMask: boolean[][],
  rows: number,
  cols: number,
  spawnBonuses: boolean[][],
  isSurvivor: (r: number, c: number) => boolean,
): boolean[][] {
  const newMask: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false),
  );

  for (let c = 0; c < cols; c++) {
    const surviving: boolean[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      if (isSurvivor(r, c)) {
        surviving.push(oldMask[r][c]);
      }
    }
    for (let i = 0; i < surviving.length; i++) {
      newMask[rows - 1 - i][c] = surviving[i];
    }
    const spawnCount = rows - surviving.length;
    const colSpawns = spawnBonuses[c] ?? [];
    for (let i = 0; i < spawnCount; i++) {
      newMask[i][c] = colSpawns[i] ?? false;
    }
  }

  return newMask;
}