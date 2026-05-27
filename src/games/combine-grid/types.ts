────────────────────────────────────────────────────────────────────────────────
import { GridPos as EngineGridPos } from '../../engine/grid/GridTypes';

export type GridPos = EngineGridPos;

export type GamePhase =
  | 'PLAY'
  | 'CLEARING'
  | 'COUNTING'
  | 'SUMMARY'
  | 'STALEMATE'
  | 'FINAL';

export type EvalMode = 'sum' | 'product';

export type GameMode = 'practice' | 'recipe' | 'free';
────────────────────────────────────────────────────────────────────────────────
