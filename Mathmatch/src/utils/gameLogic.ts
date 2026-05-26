import { BoardMode, EquationMode, GameSettings, GridType, MoveResolution, OperationType, TileData, ValidationResult } from '../types';

const MIN_SEQ_LEN = 3;

export const generateId = (): string => {
  return Math.random().toString(36).slice(2, 11);
};

export const generateNumber = (min: number, max: number): number => {
  const safeMin = Math.ceil(Math.min(min, max));
  const safeMax = Math.floor(Math.max(min, max));
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const normalizeSettings = (settings: GameSettings): GameSettings => {
  const rows = clamp(Math.round(settings.rows), 3, 12);
  const cols = clamp(Math.round(settings.cols), 3, 12);
  const minNumber = Math.round(settings.minNumber);
  const maxNumber = Math.max(minNumber, Math.round(settings.maxNumber));

  return {
    ...settings,
    rows,
    cols,
    minNumber,
    maxNumber,
    bombSpawnChance: clamp(settings.bombSpawnChance, 0, 1),
    bombRadius: clamp(Math.round(settings.bombRadius), 0, 3),
    bombBonus: clamp(Math.round(settings.bombBonus), 0, 500)
  };
};

export const shouldSpawnBomb = (value: number, settings: GameSettings): boolean => {
  return (
    settings.bombEnabled &&
    settings.bombNumbers.includes(value) &&
    Math.random() < settings.bombSpawnChance
  );
};

export const createTile = (row: number, col: number, settings: GameSettings): TileData => {
  const value = generateNumber(settings.minNumber, settings.maxNumber);
  return {
    id: generateId(),
    value,
    row,
    col,
    isBomb: shouldSpawnBomb(value, settings),
    isEmpty: false
  };
};

export const createEmptyTile = (row: number, col: number): TileData => {
  return {
    id: `empty-${row}-${col}-${generateId()}`,
    value: null,
    row,
    col,
    isBomb: false,
    isEmpty: true
  };
};

export const getTileColor = (value: number | null): string => {
  if (value === null) return 'transparent';
  return `hsl(${(value * 137.5) % 360}, 70%, 42%)`;
};

export const createGrid = (settingsInput: GameSettings): GridType => {
  const settings = normalizeSettings(settingsInput);
  const grid: GridType = [];

  for (let r = 0; r < settings.rows; r++) {
    const row: TileData[] = [];
    for (let c = 0; c < settings.cols; c++) {
      row.push(createTile(r, c, settings));
    }
    grid.push(row);
  }

  return grid;
};

export const flattenGrid = (grid: GridType): TileData[] => grid.flat();

export const getTilesByIds = (grid: GridType, ids: string[]): TileData[] => {
  const idSet = new Set(ids);
  return flattenGrid(grid).filter(tile => idSet.has(tile.id));
};

export const refillGrid = (
  currentGrid: GridType,
  idsToRemove: string[],
  settingsInput: GameSettings,
  boardMode: BoardMode
): GridType => {
  const settings = normalizeSettings(settingsInput);
  const removeSet = new Set(idsToRemove);
  const newGrid: GridType = Array.from({ length: settings.rows }, () => Array<TileData>(settings.cols));

  for (let c = 0; c < settings.cols; c++) {
    const survivors = currentGrid
      .flat()
      .filter(tile => tile.col === c && !tile.isEmpty && !removeSet.has(tile.id))
      .sort((a, b) => a.row - b.row)
      .map(tile => ({ ...tile }));

    const missingCount = settings.rows - survivors.length;

    if (boardMode === BoardMode.ClearBoard) {
      for (let r = 0; r < missingCount; r++) {
        newGrid[r][c] = createEmptyTile(r, c);
      }

      survivors.forEach((tile, index) => {
        const row = missingCount + index;
        newGrid[row][c] = {
          ...tile,
          row,
          col: c,
          isEmpty: false
        };
      });
    } else {
      const newTiles: TileData[] = [];
      for (let i = 0; i < missingCount; i++) {
        const tile = createTile(-1 - i, c, settings);
        newTiles.push(tile);
      }

      const finalStack = [...newTiles.reverse(), ...survivors];
      finalStack.forEach((tile, row) => {
        newGrid[row][c] = {
          ...tile,
          row,
          col: c,
          isEmpty: false
        };
      });
    }
  }

  return newGrid;
};

export const swapTilesInGrid = (
  grid: GridType,
  sourceId: string,
  delta: { r: number; c: number },
  settingsInput: GameSettings
): GridType | null => {
  const settings = normalizeSettings(settingsInput);
  const flatGrid = flattenGrid(grid);
  const sourceTile = flatGrid.find(tile => tile.id === sourceId);

  if (!sourceTile || sourceTile.isEmpty) return null;

  const targetR = sourceTile.row + delta.r;
  const targetC = sourceTile.col + delta.c;

  if (targetR < 0 || targetR >= settings.rows || targetC < 0 || targetC >= settings.cols) {
    return null;
  }

  const targetTile = flatGrid.find(tile => tile.row === targetR && tile.col === targetC);
  if (!targetTile || targetTile.isEmpty) return null;

  const newGrid = grid.map(row => row.map(tile => ({ ...tile })));

  newGrid[sourceTile.row][sourceTile.col] = {
    ...targetTile,
    row: sourceTile.row,
    col: sourceTile.col
  };

  newGrid[targetR][targetC] = {
    ...sourceTile,
    row: targetR,
    col: targetC
  };

  return newGrid;
};

const isConsecutive = (arr: number[], step = 1): boolean => {
  if (arr.length < 2) return true;
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i + 1] !== arr[i] + step) return false;
  }
  return true;
};

const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
};

const isTriangular = (n: number): boolean => {
  if (n < 1) return false;
  const k = (Math.sqrt(8 * n + 1) - 1) / 2;
  return Number.isInteger(k);
};

const validateEquation = (values: number[], equationMode: EquationMode): ValidationResult => {
  const result = values[values.length - 1];
  const operands = values.slice(0, values.length - 1);

  const sum = operands.reduce((a, b) => a + b, 0);
  const product = operands.reduce((a, b) => a * b, 1);

  if (equationMode === EquationMode.SumOnly) {
    return sum === result
      ? { valid: true, points: values.length * 20, message: `Sum Equation (${sum})` }
      : { valid: false, points: 0, message: 'Need a valid sum equation' };
  }

  if (equationMode === EquationMode.ProductOnly) {
    return product === result
      ? { valid: true, points: values.length * 25, message: `Product Equation (${product})` }
      : { valid: false, points: 0, message: 'Need a valid multiplication equation' };
  }

  if (sum === result) return { valid: true, points: values.length * 20, message: `Sum Equation (${sum})` };
  if (product === result) return { valid: true, points: values.length * 25, message: `Product Equation (${product})` };

  if (values.length === 3) {
    if (values[0] - values[1] === values[2]) return { valid: true, points: 30, message: 'Subtraction Equation' };
    if (values[1] !== 0 && values[0] / values[1] === values[2]) return { valid: true, points: 30, message: 'Division Equation' };
  }

  return { valid: false, points: 0, message: 'Invalid equation' };
};

const VALIDATION_STRATEGIES: Record<Exclude<OperationType, OperationType.Equa>, (values: number[], sorted: number[]) => ValidationResult> = {
  [OperationType.Odd]: (values, sorted) => {
    if (values.some(n => n % 2 === 0)) return { valid: false, points: 0, message: 'Must be all odd numbers' };
    if (!isConsecutive(sorted, 2)) return { valid: false, points: 0, message: 'Must be consecutive odd numbers' };
    return { valid: true, points: values.length * 10, message: 'Odd Sequence!' };
  },
  [OperationType.Even]: (values, sorted) => {
    if (values.some(n => n % 2 !== 0)) return { valid: false, points: 0, message: 'Must be all even numbers' };
    if (!isConsecutive(sorted, 2)) return { valid: false, points: 0, message: 'Must be consecutive even numbers' };
    return { valid: true, points: values.length * 10, message: 'Even Sequence!' };
  },
  [OperationType.Prm]: values => {
    if (values.some(n => !isPrime(n))) return { valid: false, points: 0, message: 'Must be all primes' };
    return { valid: true, points: values.length * 15, message: 'Prime Sequence!' };
  },
  [OperationType.Mult]: (values, sorted) => {
    if (sorted[0] === 0) return { valid: false, points: 0, message: 'Cannot start multiples with 0' };
    const base = sorted[0];
    if (values.some(n => n % base !== 0)) return { valid: false, points: 0, message: `Must be multiples of ${base}` };
    const multipliers = sorted.map(n => n / base);
    if (!isConsecutive(multipliers, 1)) return { valid: false, points: 0, message: 'Must be consecutive multiples' };
    return { valid: true, points: values.length * 12, message: 'Valid Multiples!' };
  },
  [OperationType.Fac]: (values, sorted) => {
    const maxVal = sorted[sorted.length - 1];
    if (maxVal === 0) return { valid: false, points: 0, message: 'Max factor target cannot be 0' };
    if (values.some(n => n === 0 || maxVal % n !== 0)) return { valid: false, points: 0, message: `Must be factors of ${maxVal}` };
    return { valid: true, points: values.length * 12, message: 'Valid Factors!' };
  },
  [OperationType.Fib]: values => {
    for (let i = 2; i < values.length; i++) {
      if (values[i] !== values[i - 1] + values[i - 2]) {
        return { valid: false, points: 0, message: 'Broken Fibonacci sequence' };
      }
    }
    return { valid: true, points: values.length * 15, message: 'Fibonacci Sequence!' };
  },
  [OperationType.Tri]: (values, sorted) => {
    if (values.some(n => !isTriangular(n))) return { valid: false, points: 0, message: 'All must be triangular numbers' };
    const indices = sorted.map(n => Math.round((Math.sqrt(8 * n + 1) - 1) / 2));
    if (!isConsecutive(indices, 1)) return { valid: false, points: 0, message: 'Must be consecutive triangular numbers' };
    return { valid: true, points: values.length * 15, message: 'Triangular Sequence!' };
  }
};

export const validateSequence = (
  op: OperationType,
  values: number[],
  equationMode: EquationMode
): ValidationResult => {
  if (values.length < MIN_SEQ_LEN) {
    return { valid: false, points: 0, message: `Need ${MIN_SEQ_LEN}+ non-bomb tiles` };
  }

  if (op === OperationType.Equa) {
    return validateEquation(values, equationMode);
  }

  const strategy = VALIDATION_STRATEGIES[op];
  if (!strategy) return { valid: false, points: 0, message: 'Unknown operation' };

  const sorted = [...values].sort((a, b) => a - b);
  return strategy(values, sorted);
};

export const getExplosionIds = (grid: GridType, bombTiles: TileData[], settingsInput: GameSettings): string[] => {
  const settings = normalizeSettings(settingsInput);
  const ids = new Set<string>();

  if (!settings.bombEnabled || settings.bombRadius <= 0) {
    bombTiles.forEach(tile => ids.add(tile.id));
    return [...ids];
  }

  for (const bomb of bombTiles) {
    for (const tile of flattenGrid(grid)) {
      if (tile.isEmpty) continue;
      const dr = Math.abs(tile.row - bomb.row);
      const dc = Math.abs(tile.col - bomb.col);
      const inSquareBlast = Math.max(dr, dc) <= settings.bombRadius;
      if (inSquareBlast) ids.add(tile.id);
    }
  }

  return [...ids];
};

export const resolveClearedTiles = (
  grid: GridType,
  selectedIds: string[],
  settings: GameSettings,
  boardMode: BoardMode
): MoveResolution => {
  const selectedTiles = getTilesByIds(grid, selectedIds).filter(tile => !tile.isEmpty);
  const bombs = selectedTiles.filter(tile => tile.isBomb);
  const normals = selectedTiles.filter(tile => !tile.isBomb);
  const removeIds = new Set(normals.map(tile => tile.id));

  if (bombs.length > 0) {
    getExplosionIds(grid, bombs, settings).forEach(id => removeIds.add(id));
  }

  const gridAfterClear = refillGrid(grid, [...removeIds], settings, boardMode);
  const blastCount = [...removeIds].filter(id => !normals.some(tile => tile.id === id)).length;

  return {
    grid: gridAfterClear,
    removedCount: removeIds.size,
    bombCount: bombs.length,
    blastCount
  };
};

export const isBoardCleared = (grid: GridType): boolean => {
  return flattenGrid(grid).every(tile => tile.isEmpty);
};

export const countPlayableTiles = (grid: GridType): number => {
  return flattenGrid(grid).filter(tile => !tile.isEmpty).length;
};
