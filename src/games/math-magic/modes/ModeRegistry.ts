import { MathMagicStrategy, ValidationPayload } from './MathMagicStrategy';
import { MathMagicState, MathMagicMode, MathMagicTile } from '../types';
import { MathMagicRules } from '../MathMagicRules';

export interface MathMagicModeDefinition extends MathMagicStrategy {
  mode: MathMagicMode;
  name: string;
  instructions: string;
  getTargetHUD(
    state: MathMagicState,
    gridOffset: { x: number; y: number }
  ): { hasTarget: boolean; value?: string | number };
}

export class DragDropMode implements MathMagicModeDefinition {
  mode = MathMagicMode.DRAG_DROP;
  name = 'Drag and Drop';
  instructions = 'Look at the Target Number. Drag the matching tile from your tray to the exact spot on the board where its two factors meet.';
  sweetspotMs = 3000;

  validate(state: MathMagicState, payload: ValidationPayload): boolean {
    if (!payload.sourceId) return false;
    const tile = state.tiles.find(t => t.id === payload.sourceId);
    if (!tile) return false;
    const colFactor = state.config.activeFactors[tile.currentX % state.config.activeFactors.length];
    const rowFactor = tile.currentY + state.config.startRow;
    return MathMagicRules.evaluateMatch(tile.product, [colFactor, rowFactor]);
  }

  getTargetHUD(state: MathMagicState, gridOffset: { x: number; y: number }) {
    return { hasTarget: false };
  }
}

export class RandomizedGridMode implements MathMagicModeDefinition {
  mode = MathMagicMode.RANDOMIZED_GRID;
  name = 'Randomized Grid';
  instructions = 'The rules are the same, but the numbers on the top and left edges have been shuffled! Pay close attention to the rows and columns to find the right spot.';
  sweetspotMs = 3000;

  validate(state: MathMagicState, payload: ValidationPayload): boolean {
    if (!payload.sourceId) return false;
    const tile = state.tiles.find(t => t.id === payload.sourceId);
    if (!tile) return false;
    const colFactor = state.config.activeFactors[tile.currentX % state.config.activeFactors.length];
    const rowFactor = tile.currentY + state.config.startRow;
    return tile.product === colFactor * rowFactor;
  }

  getTargetHUD(state: MathMagicState, gridOffset: { x: number; y: number }) {
    return { hasTarget: false };
  }
}

export class TrueFalseMode implements MathMagicModeDefinition {
  mode = MathMagicMode.TRUE_FALSE;
  name = 'True or False';
  instructions = 'Tap any grid space to reveal a math problem. Read carefully, then decide if the math is True or False!';
  sweetspotMs = 3000;

  validate(state: MathMagicState, payload: ValidationPayload): boolean {
    return !!payload.submittedValue;
  }

  getTargetHUD(state: MathMagicState, gridOffset: { x: number; y: number }) {
    return { hasTarget: false };
  }
}

export class MultipleChoiceMode implements MathMagicModeDefinition {
  mode = MathMagicMode.MULTIPLE_CHOICE;
  name = 'Multiple Choice';
  instructions = 'Tap any empty grid space to reveal a math problem, then choose the correct answer from the four options.';
  sweetspotMs = 2000;

  validate(state: MathMagicState, payload: ValidationPayload): boolean {
    if (!payload.tapId) return false;
    const tile = state.tiles.find(t => t.id === payload.tapId);
    if (!tile) return false;
    return tile.product === payload.submittedValue;
  }

  getTargetHUD(state: MathMagicState, gridOffset: { x: number; y: number }) {
    return { hasTarget: false };
  }
}

export class ReplaceMode implements MathMagicModeDefinition {
  mode = MathMagicMode.REPLACE;
  name = 'Missing Factor';
  instructions = 'Tap a grid space to reveal an incomplete equation. Use the keypad to type the exact missing number.';
  sweetspotMs = 2000;

  validate(state: MathMagicState, payload: ValidationPayload): boolean {
    if (!payload.tapId) return false;
    const tile = state.tiles.find(t => t.id === payload.tapId);
    if (!tile) return false;
    
    const f1 = state.config.activeFactors[tile.currentX % state.config.activeFactors.length];
    const f2 = tile.currentY + state.config.startRow;
    
    return payload.submittedValue === f1 || payload.submittedValue === f2;
  }

  getTargetHUD(state: MathMagicState, gridOffset: { x: number; y: number }) {
    return { hasTarget: false };
  }
}

export class KeypadMode implements MathMagicModeDefinition {
  mode = MathMagicMode.KEYPAD;
  name = 'Keypad Equation';
  instructions = 'Tap a grid space to reveal an incomplete equation. Use the keypad to type the exact missing number.';
  sweetspotMs = 5000;

  validate(state: MathMagicState, payload: ValidationPayload): boolean {
    if (!payload.tapId) return false;
    const tile = state.tiles.find(t => t.id === payload.tapId);
    if (!tile) return false;
    
    const f1 = state.config.activeFactors[tile.currentX % state.config.activeFactors.length];
    const f2 = tile.currentY + state.config.startRow;
    return (f1 * f2) === payload.submittedValue;
  }

  getTargetHUD(state: MathMagicState, gridOffset: { x: number; y: number }) {
    return { hasTarget: false };
  }
}

export class ReverseSeekMode implements MathMagicModeDefinition {
  mode = MathMagicMode.REVERSE_SEEK;
  name = 'Reverse Seek';
  instructions = 'The Target gives you the answer! Tap the grid space that multiplies together to make that exact number.';
  sweetspotMs = 2000;

  validate(state: MathMagicState, payload: ValidationPayload): boolean {
    if (!payload.tapId) return false;
    const tile = state.tiles.find(t => t.id === payload.tapId);
    if (!tile) return false;
    
    const qx = Math.floor(tile.homeX / 6) * 6;
    const qy = Math.floor(tile.homeY / 6) * 6;
    const qKey = `${qx},${qy}`;
    const activeId = state.activeQuadrantTiles[qKey];
    const activeProduct = activeId ? state.tiles.find(t => t.id === activeId)?.product : null;
    
    return tile.product === activeProduct;
  }

  getTargetHUD(state: MathMagicState, gridOffset: { x: number; y: number }) {
    const qKey = `${gridOffset.x},${gridOffset.y}`;
    const activeId = state.activeQuadrantTiles[qKey];
    const activeTile = activeId ? state.tiles.find(t => t.id === activeId) : null;
    return { hasTarget: true, value: activeTile ? activeTile.product : '--' };
  }
}

export class MultiplicationFinderMode implements MathMagicModeDefinition {
  mode = MathMagicMode.MULTIPLICATION_FINDER;
  name = 'Multiplication Finder';
  instructions = 'The grid is fully revealed! Look at the equation at the top, solve it in your head, and tap the correct answer on the board.';
  sweetspotMs = 3000;
  isGridPopulated = true;
  interactionType: 'tap' | 'drag' = 'tap';

  validate(state: MathMagicState, payload: ValidationPayload): boolean {
    if (!payload.tapId) return false;
    const tile = state.tiles.find(t => t.id === payload.tapId);
    if (!tile) return false;
    const qx = Math.floor(tile.homeX / 6) * 6;
    const qy = Math.floor(tile.homeY / 6) * 6;
    const qKey = `${qx},${qy}`;
    const activeId = state.activeQuadrantTiles[qKey];
    const activeProduct = activeId ? state.tiles.find(t => t.id === activeId)?.product : null;
    return tile.product === activeProduct;
  }

  getTargetHUD(state: MathMagicState, gridOffset: { x: number; y: number }) {
    const qKey = `${gridOffset.x},${gridOffset.y}`;
    const activeId = state.activeQuadrantTiles[qKey];
    const activeTile = activeId ? state.tiles.find(t => t.id === activeId) : null;
    return { hasTarget: true, value: activeTile ? `${activeTile.f1} × ${activeTile.f2} = ?` : '-- × -- = ?' };
  }
}

export class AdditionFinderMode implements MathMagicModeDefinition {
  mode = MathMagicMode.ADDITION_FINDER;
  name = 'Addition Finder';
  instructions = "Solve the addition problem at the top, then find that number's spot on the multiplication board!";
  sweetspotMs = 3000;
  isGridPopulated = true;
  interactionType: 'tap' | 'drag' = 'tap';

  validate(state: MathMagicState, payload: ValidationPayload): boolean {
    if (!payload.tapId) return false;
    const tile = state.tiles.find(t => t.id === payload.tapId);
    if (!tile) return false;
    const qx = Math.floor(tile.homeX / 6) * 6;
    const qy = Math.floor(tile.homeY / 6) * 6;
    const qKey = `${qx},${qy}`;
    const activeId = state.activeQuadrantTiles[qKey];
    const activeTile = activeId ? state.tiles.find(t => t.id === activeId) : null;
    if (!activeTile) return false;
    const expectedSum = activeTile.f1 + activeTile.f2;
    return tile.product === expectedSum;
  }

  getTargetHUD(state: MathMagicState, gridOffset: { x: number; y: number }) {
    const qKey = `${gridOffset.x},${gridOffset.y}`;
    const activeId = state.activeQuadrantTiles[qKey];
    const activeTile = activeId ? state.tiles.find(t => t.id === activeId) : null;
    return { hasTarget: true, value: activeTile ? `${activeTile.f1} + ${activeTile.f2} = ?` : '-- + -- = ?' };
  }
}

export function isPrime(num: number): boolean {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
}

export function testPatternCondition(num: number, conditionType: string): boolean {
  switch (conditionType) {
    case 'MULTIPLES_OF_3': return num % 3 === 0;
    case 'MULTIPLES_OF_4': return num % 4 === 0;
    case 'MULTIPLES_OF_5': return num % 5 === 0;
    case 'EVENS': return num % 2 === 0;
    case 'ODDS': return num % 2 !== 0;
    case 'PRIMES': return isPrime(num);
    default: return false;
  }
}

export class PatternSweeperMode implements MathMagicModeDefinition {
  mode = MathMagicMode.PATTERN_SWEEPER;
  name = 'Pattern Sweeper';
  instructions = "Tap tiles on the board that match the active pattern condition shown at the top. Sweep the grid and find them all!";
  sweetspotMs = 3000;
  isGridPopulated = true;
  interactionType: 'tap' | 'drag' = 'tap';

  validate(state: MathMagicState, payload: ValidationPayload): boolean {
    if (!payload.tapId) return false;
    const tile = state.tiles.find(t => t.id === payload.tapId);
    if (!tile) return false;
    const qx = Math.floor(tile.homeX / 6) * 6;
    const qy = Math.floor(tile.homeY / 6) * 6;
    const qKey = `${qx},${qy}`;
    const activePattern = state.activePatterns?.[qKey];
    if (!activePattern) return false;
    return testPatternCondition(tile.product, activePattern.type);
  }

  getTargetHUD(state: MathMagicState, gridOffset: { x: number; y: number }) {
    const qKey = `${gridOffset.x},${gridOffset.y}`;
    const activePattern = state.activePatterns?.[qKey];
    if (!activePattern) return { hasTarget: false, value: '--' };
    const remaining = Math.max(0, activePattern.targetCount - activePattern.foundIds.length);
    return { hasTarget: true, value: `${activePattern.description.toUpperCase()} (${remaining} left)` };
  }
}

export const ModeRegistry: Record<MathMagicMode, MathMagicModeDefinition> = {
  [MathMagicMode.DRAG_DROP]: new DragDropMode(),
  [MathMagicMode.RANDOMIZED_GRID]: new RandomizedGridMode(),
  [MathMagicMode.TRUE_FALSE]: new TrueFalseMode(),
  [MathMagicMode.MULTIPLE_CHOICE]: new MultipleChoiceMode(),
  [MathMagicMode.REPLACE]: new ReplaceMode(),
  [MathMagicMode.KEYPAD]: new KeypadMode(),
  [MathMagicMode.REVERSE_SEEK]: new ReverseSeekMode(),
  [MathMagicMode.MULTIPLICATION_FINDER]: new MultiplicationFinderMode(),
  [MathMagicMode.ADDITION_FINDER]: new AdditionFinderMode(),
  [MathMagicMode.PATTERN_SWEEPER]: new PatternSweeperMode(),
};