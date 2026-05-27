import { GridPos } from '../../../engine/grid/GridTypes';

export interface BoardDiff {
  row: number;
  col: number;
  fromValue: number;
  toValue: number;
  fromTrophy: boolean;
  toTrophy: boolean;
  fromFrozen: boolean;
  toFrozen: boolean;
  fromBonus: boolean;
  toBonus: boolean;
}

export function diffBoards(
  prevBoard: number[][],
  nextBoard: number[][],
  prevTrophy: boolean[][],
  nextTrophy: boolean[][],
  prevFrozen: boolean[][],
  nextFrozen: boolean[][],
  prevBonus: boolean[][],
  nextBonus: boolean[][]
): BoardDiff[] {
  const diffs: BoardDiff[] = [];
  const rows = prevBoard.length;
  const cols = prevBoard[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const vA = prevBoard[r][c];
      const vB = nextBoard[r][c];
      const tA = prevTrophy[r][c];
      const tB = nextTrophy[r][c];
      const fA = prevFrozen[r][c];
      const fB = nextFrozen[r][c];
      const bA = prevBonus[r][c];
      const bB = nextBonus[r][c];

      if (vA !== vB || tA !== tB || fA !== fB || bA !== bB) {
        diffs.push({
          row: r,
          col: c,
          fromValue: vA,
          toValue: vB,
          fromTrophy: tA,
          toTrophy: tB,
          fromFrozen: fA,
          toFrozen: fB,
          fromBonus: bA,
          toBonus: bB
        });
      }
    }
  }

  return diffs;
}

export function enforceStaticLaw(
  actionType: string,
  diffs: BoardDiff[],
  allowed: GridPos[]
) {
  const allowedSet = new Set(allowed.map(p => `${p.row}-${p.col}`));

  for (const d of diffs) {
    const key = `${d.row}-${d.col}`;
    if (!allowedSet.has(key)) {
      const msg = `[STATIC BOARD LAW VIOLATION]\nCase: ${actionType}\nIllegal cell: ${key}\nValue: ${d.fromValue} -> ${d.toValue}`;
      console.error(msg);
      throw new Error(msg);
    }
  }
}