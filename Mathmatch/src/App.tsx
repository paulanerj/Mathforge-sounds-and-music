import React, { useMemo, useState } from 'react';
import Controls from './components/Controls';
import Grid from './components/Grid';
import Settings from './components/Settings';
import StatsModal from './components/StatsModal';
import { BOMB_NUMBERS, GAME_DEFAULTS, UI_CONSTANTS } from './constants';
import { BoardMode, EquationMode, GameSettings, GridType, OperationType, ScoreRecord } from './types';
import {
  countPlayableTiles,
  createGrid,
  flattenGrid,
  getTilesByIds,
  isBoardCleared,
  refillGrid,
  resolveClearedTiles,
  swapTilesInGrid,
  validateSequence
} from './utils/gameLogic';
import './styles.css';

const INITIAL_SETTINGS: GameSettings = {
  rows: GAME_DEFAULTS.ROWS,
  cols: GAME_DEFAULTS.COLS,
  minNumber: GAME_DEFAULTS.MIN_NUM,
  maxNumber: GAME_DEFAULTS.MAX_NUM,
  bombEnabled: GAME_DEFAULTS.BOMB_ENABLED,
  bombSpawnChance: GAME_DEFAULTS.BOMB_SPAWN_CHANCE,
  bombNumbers: BOMB_NUMBERS,
  bombRadius: GAME_DEFAULTS.BOMB_RADIUS,
  bombBonus: GAME_DEFAULTS.BOMB_BONUS
};

const buildSelectedValues = (grid: GridType, selectedIds: string[]): number[] => {
  return getTilesByIds(grid, selectedIds)
    .filter(tile => !tile.isEmpty && !tile.isBomb && tile.value !== null)
    .map(tile => tile.value as number);
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<GameSettings>(INITIAL_SETTINGS);
  const [grid, setGrid] = useState<GridType>(() => createGrid(INITIAL_SETTINGS));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clearingIds, setClearingIds] = useState<string[]>([]);
  const [currentOp, setCurrentOp] = useState<OperationType>(OperationType.Equa);
  const [equationMode, setEquationMode] = useState<EquationMode>(EquationMode.SumOnly);
  const [boardMode, setBoardMode] = useState<BoardMode>(BoardMode.Normal);
  const [score, setScore] = useState<number>(0);
  const [message, setMessage] = useState<string>('Select 3+ tiles. Tap a selected tile again to submit.');
  const [history, setHistory] = useState<ScoreRecord[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  const playableTiles = useMemo(() => countPlayableTiles(grid), [grid]);

  const resetGame = (nextSettings = settings, nextBoardMode = boardMode) => {
    setGrid(createGrid(nextSettings));
    setSelectedIds([]);
    setClearingIds([]);
    setScore(0);
    setBoardMode(nextBoardMode);
    setMessage('New board ready. Select 3+ tiles.');
  };

  const finalizeScoreHistory = (nextScore: number) => {
    setHistory(prev => [
      ...prev,
      {
        timestamp: Date.now(),
        score: nextScore,
        mode: boardMode,
        operation: currentOp
      }
    ].slice(-30));
  };

  const submitSelection = (ids: string[]) => {
    const values = buildSelectedValues(grid, ids);
    const validation = validateSequence(currentOp, values, equationMode);

    if (!validation.valid) {
      setMessage(validation.message);
      return;
    }

    const selectedTiles = getTilesByIds(grid, ids).filter(tile => !tile.isEmpty);
    const bombCount = selectedTiles.filter(tile => tile.isBomb).length;
    const resolution = resolveClearedTiles(grid, ids, settings, boardMode);
    const bombBonus = resolution.bombCount * settings.bombBonus + resolution.blastCount * Math.floor(settings.bombBonus / 2);
    const gained = validation.points + bombBonus;
    const nextScore = score + gained;

    setClearingIds(flattenGrid(grid).filter(tile => {
      const afterTile = flattenGrid(resolution.grid).find(next => next.id === tile.id);
      return !afterTile || afterTile.row !== tile.row || afterTile.col !== tile.col;
    }).map(tile => tile.id));

    setMessage(`${validation.message} +${gained}${bombCount ? ` (${bombCount} bomb${bombCount > 1 ? 's' : ''})` : ''}`);
    setSelectedIds([]);
    setScore(nextScore);

    window.setTimeout(() => {
      setGrid(resolution.grid);
      setClearingIds([]);

      if (boardMode === BoardMode.ClearBoard && isBoardCleared(resolution.grid)) {
        setMessage('Board cleared! Perfect clear.');
        finalizeScoreHistory(nextScore);
      }
    }, UI_CONSTANTS.CLEAR_ANIMATION_MS);
  };

  const handleTileClick = (id: string) => {
    if (clearingIds.length > 0) return;
    const tile = flattenGrid(grid).find(candidate => candidate.id === id);
    if (!tile || tile.isEmpty) return;

    if (selectedIds.includes(id)) {
      if (selectedIds.length >= 3) {
        submitSelection(selectedIds);
      } else {
        setSelectedIds(prev => prev.filter(existing => existing !== id));
        setMessage('Need 3+ selected tiles before submitting.');
      }
      return;
    }

    setSelectedIds(prev => [...prev, id]);
  };

  const handleTileSwap = (id: string, delta: { r: number; c: number }) => {
    if (clearingIds.length > 0) return;
    const nextGrid = swapTilesInGrid(grid, id, delta, settings);
    if (!nextGrid) {
      setMessage('That swap is blocked. Empty cells and edges cannot be swapped into.');
      return;
    }
    setGrid(nextGrid);
    setSelectedIds([]);
    setMessage('Tile swapped. Build your next sequence.');
  };

  const handleApplySettings = (nextSettings: GameSettings) => {
    setSettings(nextSettings);
    setIsSettingsOpen(false);
    resetGame(nextSettings, boardMode);
  };

  const handleBoardModeChange = (nextMode: BoardMode) => {
    resetGame(settings, nextMode);
  };

  const handleOpChange = (nextOp: OperationType) => {
    setCurrentOp(nextOp);
    setSelectedIds([]);
    setMessage('Operation changed. Selection cleared.');
  };

  const autoScan = () => {
    if (score < 50) {
      setMessage('Scan costs 50 points.');
      return;
    }

    const playable = flattenGrid(grid).filter(tile => !tile.isEmpty && !tile.isBomb);

    for (let a = 0; a < playable.length; a++) {
      for (let b = a + 1; b < playable.length; b++) {
        for (let c = b + 1; c < playable.length; c++) {
          const candidate = [playable[a], playable[b], playable[c]];
          const values = candidate.map(tile => tile.value as number);
          const result = validateSequence(currentOp, values, equationMode);
          if (result.valid) {
            setScore(prev => prev - 50);
            setSelectedIds(candidate.map(tile => tile.id));
            setMessage(`Scan found: ${values.join(', ')}. Tap any selected tile to submit.`);
            return;
          }
        }
      }
    }

    setScore(prev => prev - 50);
    setMessage('Scan found no 3-tile move. Try swapping tiles or changing modes.');
  };

  const saveCurrentScore = () => {
    finalizeScoreHistory(score);
    setMessage('Score saved to history.');
  };

  return (
    <main className="app-shell">
      <Controls
        currentOp={currentOp}
        equationMode={equationMode}
        boardMode={boardMode}
        score={score}
        message={message}
        playableTiles={playableTiles}
        onOpChange={handleOpChange}
        onEquationModeChange={setEquationMode}
        onBoardModeChange={handleBoardModeChange}
        onClear={() => resetGame()}
        onAutoScan={autoScan}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
      />

      <section className="game-area">
        <Grid
          grid={grid}
          selectedIds={selectedIds}
          clearingIds={clearingIds}
          onTileClick={handleTileClick}
          onTileSwap={handleTileSwap}
          rows={settings.rows}
          cols={settings.cols}
        />
      </section>

      <footer className="bottom-bar">
        <button className="secondary-button" onClick={() => setSelectedIds([])}>Clear Selection</button>
        <button className="secondary-button" onClick={saveCurrentScore}>Save Score</button>
      </footer>

      <Settings isOpen={isSettingsOpen} settings={settings} onApply={handleApplySettings} onClose={() => setIsSettingsOpen(false)} />
      <StatsModal isOpen={isStatsOpen} history={history} onClose={() => setIsStatsOpen(false)} />
    </main>
  );
};

export default App;
