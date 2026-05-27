────────────────────────────────────────────────────────────────────────────────
import { GridPos } from '../types';

export function toggleTile(current: GridPos[], pos: GridPos): GridPos[] {
  const idx = current.findIndex((p) => p.row === pos.row && p.col === pos.col);
  if (idx !== -1) return current.filter((_, i) => i !== idx);
  return [...current, pos];
}

export function isSelected(selection: GridPos[], pos: GridPos): boolean {
  return selection.some((p) => p && p.row === pos.row && p.col === pos.col);
}

export function selectionIndex(selection: GridPos[], pos: GridPos): number {
  return selection.findIndex((p) => p && p.row === pos.row && p.col === pos.col);
}
────────────────────────────────────────────────────────────────────────────────
