import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { BOMB_NUMBERS } from '../constants';
import { GameSettings } from '../types';
import { normalizeSettings } from '../utils/gameLogic';

interface SettingsProps {
  isOpen: boolean;
  settings: GameSettings;
  onApply: (settings: GameSettings) => void;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, settings, onApply, onClose }) => {
  const [draft, setDraft] = useState<GameSettings>(settings);

  useEffect(() => {
    if (isOpen) setDraft(settings);
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const update = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const toggleBombNumber = (value: number) => {
    setDraft(prev => {
      const exists = prev.bombNumbers.includes(value);
      return {
        ...prev,
        bombNumbers: exists ? prev.bombNumbers.filter(n => n !== value) : [...prev.bombNumbers, value].sort((a, b) => a - b)
      };
    });
  };

  const applySettings = () => {
    onApply(normalizeSettings(draft));
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card settings-card">
        <div className="modal-header">
          <h2>Settings</h2>
          <button onClick={onClose} className="icon-button" aria-label="Close settings">
            <X size={22} />
          </button>
        </div>

        <div className="settings-body">
          <section className="settings-section">
            <h3>Board Size</h3>
            <div className="settings-grid-two">
              <label className="field-label">
                Rows
                <input type="number" min={3} max={12} value={draft.rows} onChange={event => update('rows', Number(event.target.value))} />
              </label>
              <label className="field-label">
                Columns
                <input type="number" min={3} max={12} value={draft.cols} onChange={event => update('cols', Number(event.target.value))} />
              </label>
              <label className="field-label">
                Min Number
                <input type="number" value={draft.minNumber} onChange={event => update('minNumber', Number(event.target.value))} />
              </label>
              <label className="field-label">
                Max Number
                <input type="number" value={draft.maxNumber} onChange={event => update('maxNumber', Number(event.target.value))} />
              </label>
            </div>
          </section>

          <section className="settings-section">
            <div className="section-heading-row">
              <h3>Bomb Tiles</h3>
              <label className="switch-label">
                <input type="checkbox" checked={draft.bombEnabled} onChange={event => update('bombEnabled', event.target.checked)} />
                Enabled
              </label>
            </div>

            <label className="field-label">
              Bomb spawn chance: {Math.round(draft.bombSpawnChance * 100)}%
              <input
                type="range"
                min={0}
                max={50}
                step={1}
                disabled={!draft.bombEnabled}
                value={Math.round(draft.bombSpawnChance * 100)}
                onChange={event => update('bombSpawnChance', Number(event.target.value) / 100)}
              />
              <span className="helper-text">Chance that a generated bomb-number tile becomes a bomb. Applies to the starting board and normal-mode refills.</span>
            </label>

            <div className="settings-grid-two">
              <label className="field-label">
                Blast Radius
                <input type="number" min={0} max={3} value={draft.bombRadius} onChange={event => update('bombRadius', Number(event.target.value))} />
              </label>
              <label className="field-label">
                Bomb Bonus
                <input type="number" min={0} max={500} value={draft.bombBonus} onChange={event => update('bombBonus', Number(event.target.value))} />
              </label>
            </div>

            <div className="bomb-chip-wrap">
              {BOMB_NUMBERS.map(number => (
                <button
                  key={number}
                  type="button"
                  className={draft.bombNumbers.includes(number) ? 'bomb-chip bomb-chip-active' : 'bomb-chip'}
                  onClick={() => toggleBombNumber(number)}
                >
                  {number}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="secondary-button">Cancel</button>
          <button onClick={applySettings} className="primary-button">Apply & Reset Board</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
