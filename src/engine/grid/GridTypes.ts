export interface GridPos {
  row: number;
  col: number;
}

export interface BaseGridState {
  rows: number;
  cols: number;
  board: any[][];
  selection: GridPos[];
  seed: number;
}