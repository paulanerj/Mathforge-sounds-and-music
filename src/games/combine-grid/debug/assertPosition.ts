import { GridPos } from '../../../engine/grid/GridTypes';

export function assertPosition(
  pos: GridPos | null | undefined, 
  board: any[][], 
  label = "UNKNOWN"
): void {
  if (!pos || typeof pos.row !== "number" || typeof pos.col !== "number") {
    throw new Error(`[INVALID POSITION] ${label} malformed: ${JSON.stringify(pos)}`);
  }

  const rows = board.length;
  const cols = board[0]?.length || 0;

  if (
    pos.row < 0 ||
    pos.col < 0 ||
    pos.row >= rows ||
    pos.col >= cols
  ) {
    throw new Error(
      `[OUT OF BOUNDS] ${label} (${pos.row},${pos.col}) on ${rows}x${cols}`
    );
  }
}

export function assertPositions(
  list: (GridPos | null | undefined)[], 
  board: any[][], 
  label = "UNKNOWN"
): void {
  if (!list) return;
  list.forEach((p, i) => assertPosition(p, board, `${label}[${i}]`));
}