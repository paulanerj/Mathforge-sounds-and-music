import { MathMagicState, MathMagicTile } from '../types';

export interface ValidationPayload {
  sourceId?: string;
  targetId?: string;
  dropX?: number;
  dropY?: number;
  tapId?: string;
  submittedValue?: number | boolean;
}

export interface MathMagicStrategy {
  sweetspotMs: number;
  isGridPopulated?: boolean;
  interactionType?: 'tap' | 'drag';
  validate(state: MathMagicState, payload: ValidationPayload): boolean;
}