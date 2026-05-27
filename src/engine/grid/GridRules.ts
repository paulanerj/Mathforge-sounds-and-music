────────────────────────────────────────────────────────────────────────────────
import { GridPos, BaseGridState } from './GridTypes';

export interface GridGameRules<S extends BaseGridState, A> {
  readonly name: string;
  generateInitialState(config: any): S;
  resolveInteraction(state: S, action: A): S;
  checkEndCondition(state: S): boolean;
  verifyIntegrity(oldState: S, newState: S, action: string, expectedPositions: GridPos[]): void;
  isValidPos?(pos: GridPos | null | undefined, state: S): pos is GridPos;
}
────────────────────────────────────────────────────────────────────────────────
