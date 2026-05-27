────────────────────────────────────────────────────────────────────────────────
export interface ChainPos {
  row: number;
  col: number;
}

export interface ChainState {
  positions: ChainPos[];
  isActive: boolean;
}

export function isOrthoAdjacent(a: ChainPos, b: ChainPos): boolean {
  return (
    (Math.abs(a.row - b.row) === 1 && a.col === b.col) ||
    (a.row === b.row && Math.abs(a.col - b.col) === 1)
  );
}

export function isChebyshevAdjacent(a: ChainPos, b: ChainPos): boolean {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col)) === 1;
}

export function emptyChain(): ChainState {
  return { positions: [], isActive: false };
}

export function startChain(pos: ChainPos): ChainState {
  return { positions: [pos], isActive: true };
}

export function tryExtend(
  state: ChainState,
  pos: ChainPos,
  adjacentFn: (a: ChainPos, b: ChainPos) => boolean = isChebyshevAdjacent,
): ChainState {
  if (!state.isActive || state.positions.length === 0) return state;

  const positions = state.positions;
  const last = positions[positions.length - 1];

  if (positions.length >= 2) {
    const secondToLast = positions[positions.length - 2];
    if (secondToLast.row === pos.row && secondToLast.col === pos.col) {
      return { ...state, positions: positions.slice(0, -1) };
    }
  }

  if (positions.some((p) => p.row === pos.row && p.col === pos.col)) {
    return state;
  }

  if (!adjacentFn(last, pos)) return state;

  return { ...state, positions: [...positions, pos] };
}

export function commitChain(state: ChainState): ChainState {
  return { ...state, isActive: false };
}

export function clearChain(): ChainState {
  return emptyChain();
}

export function isInChain(state: ChainState, pos: ChainPos): boolean {
  return state.positions.some((p) => p.row === pos.row && p.col === pos.col);
}

export function chainIndexOf(state: ChainState, pos: ChainPos): number {
  return state.positions.findIndex((p) => p.row === pos.row && p.col === pos.col);
}

export function chainLength(state: ChainState): number {
  return state.positions.length;
}

export function isChainReadyToEvaluate(
  state: ChainState,
  minLength = 2,
): boolean {
  return !state.isActive && state.positions.length >= minLength;
}
────────────────────────────────────────────────────────────────────────────────
