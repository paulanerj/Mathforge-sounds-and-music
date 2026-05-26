export enum OperationType {
  Odd = 'Odd',
  Even = 'Even',
  Mult = 'Mult',
  Fac = 'Fac',
  Prm = 'Prm',
  Equa = 'Equa',
  Fib = 'Fib',
  Tri = 'Tri'
}

export enum EquationMode {
  Auto = 'Auto',
  SumOnly = 'SumOnly',
  ProductOnly = 'ProductOnly'
}

export enum BoardMode {
  Normal = 'Normal',
  ClearBoard = 'ClearBoard'
}

export interface TileData {
  id: string;
  value: number | null;
  row: number;
  col: number;
  isBomb: boolean;
  isEmpty: boolean;
}

export interface ValidationResult {
  valid: boolean;
  points: number;
  message: string;
}

export interface GameSettings {
  rows: number;
  cols: number;
  minNumber: number;
  maxNumber: number;
  bombEnabled: boolean;
  bombSpawnChance: number;
  bombNumbers: number[];
  bombRadius: number;
  bombBonus: number;
}

export interface ScoreRecord {
  timestamp: number;
  score: number;
  mode: BoardMode;
  operation: OperationType;
}

export type GridType = TileData[][];

export interface Coordinates {
  r: number;
  c: number;
}

export interface MoveResolution {
  grid: GridType;
  removedCount: number;
  bombCount: number;
  blastCount: number;
}
