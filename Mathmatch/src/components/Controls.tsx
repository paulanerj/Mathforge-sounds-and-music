import React from 'react';
import { BarChart2, ChevronDown, RotateCcw, Search, Settings, Trophy } from 'lucide-react';
import { OPERATIONS } from '../constants';
import { BoardMode, EquationMode, OperationType } from '../types';
import { BOARD_MODE_OPTIONS, EQUATION_MODE_OPTIONS } from '../constants';

interface ControlsProps {
  currentOp: OperationType;
  equationMode: EquationMode;
  boardMode: BoardMode;
  score: number;
  message: string;
  playableTiles: number;
  onOpChange: (op: OperationType) => void;
  onEquationModeChange: (mode: EquationMode) => void;
  onBoardModeChange: (mode: BoardMode) => void;
  onClear: () => void;
  onAutoScan: () => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  currentOp,
  equationMode,
  boardMode,
  score,
  message,
  playableTiles,
  onOpChange,
  onEquationModeChange,
  onBoardModeChange,
  onClear,
  onAutoScan,
  onOpenSettings,
  onOpenStats
}) => {
  return (
    <header className="controls-wrap">
      <div className="top-bar">
        <div className="icon-group">
          <button onClick={onOpenSettings} className="icon-button" aria-label="Settings">
            <Settings size={20} />
          </button>
          <button onClick={onOpenStats} className="icon-button" aria-label="Statistics">
            <BarChart2 size={20} />
          </button>
        </div>

        <div className="score-pill">
          <Trophy size={20} />
          <span>{score.toLocaleString()}</span>
        </div>
      </div>

      <div className="mode-panel">
        <div className="select-wrap">
          <select value={currentOp} onChange={event => onOpChange(event.target.value as OperationType)}>
            {OPERATIONS.map(operation => (
              <option key={operation.id} value={operation.id}>
                {operation.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="select-chevron" />
        </div>

        <div className="operation-hint">{OPERATIONS.find(operation => operation.id === currentOp)?.hint}</div>

        <div className="segmented-block">
          <span className="segmented-label">Equation</span>
          <div className="segmented-row">
            {EQUATION_MODE_OPTIONS.map(option => (
              <button
                key={option.id}
                type="button"
                className={equationMode === option.id ? 'segment segment-active' : 'segment'}
                onClick={() => onEquationModeChange(option.id)}
                title={option.description}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="segmented-block">
          <span className="segmented-label">Board</span>
          <div className="segmented-row">
            {BOARD_MODE_OPTIONS.map(option => (
              <button
                key={option.id}
                type="button"
                className={boardMode === option.id ? 'segment segment-active' : 'segment'}
                onClick={() => onBoardModeChange(option.id)}
                title={option.description}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="action-row">
          <button onClick={onClear} className="secondary-button">
            <RotateCcw size={16} /> Reset
          </button>
          <button onClick={onAutoScan} className="primary-button" title="Costs 50 points and selects a valid move if one is found.">
            <Search size={16} /> Scan (-50)
          </button>
        </div>
      </div>

      <div className="status-row">
        <span>{message}</span>
        <span>{playableTiles} playable tiles</span>
      </div>
    </header>
  );
};

export default Controls;
