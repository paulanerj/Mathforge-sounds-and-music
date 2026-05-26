import { BoardMode, EquationMode, OperationType } from './types';

export const BOMB_NUMBERS = [13, 17, 23, 37, 43, 53, 67, 79];

export const OPERATIONS = [
  { id: OperationType.Equa, label: 'Equations', hint: 'Select operands first, then the answer tile last.' },
  { id: OperationType.Odd, label: 'Odd Sequence', hint: 'Example: 3, 5, 7' },
  { id: OperationType.Even, label: 'Even Sequence', hint: 'Example: 2, 4, 6' },
  { id: OperationType.Mult, label: 'Multiples', hint: 'Example: 3, 6, 9' },
  { id: OperationType.Fac, label: 'Factors', hint: 'Example: 2, 3, 6 are factors of 6' },
  { id: OperationType.Prm, label: 'Primes', hint: 'Example: 2, 3, 5' },
  { id: OperationType.Fib, label: 'Fibonacci', hint: 'Select in order: 1, 1, 2, 3...' },
  { id: OperationType.Tri, label: 'Triangular', hint: 'Example: 1, 3, 6, 10' }
];

export const EQUATION_MODE_OPTIONS = [
  { id: EquationMode.SumOnly, label: '+ Sum', description: 'Only addition equations count.' },
  { id: EquationMode.ProductOnly, label: '× Multiply', description: 'Only multiplication equations count.' },
  { id: EquationMode.Auto, label: '+/× Mixed', description: 'Addition, multiplication, and simple 3-tile subtraction/division.' }
];

export const BOARD_MODE_OPTIONS = [
  { id: BoardMode.Normal, label: 'Normal', description: 'Tiles fall and new tiles refill from the top.' },
  { id: BoardMode.ClearBoard, label: 'Clear Board', description: 'Tiles fall, but no new tiles respawn. Clear everything.' }
];

export const GAME_DEFAULTS = {
  ROWS: 8,
  COLS: 6,
  MIN_NUM: 1,
  MAX_NUM: 12,
  BOMB_ENABLED: true,
  BOMB_SPAWN_CHANCE: 0.08,
  BOMB_RADIUS: 1,
  BOMB_BONUS: 20
};

export const UI_CONSTANTS = {
  SWIPE_THRESHOLD: 30,
  LONG_PRESS_THRESHOLD: 10,
  CLEAR_ANIMATION_MS: 360
};
