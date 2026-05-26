import React from 'react';
import { X } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ScoreRecord } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ScoreRecord[];
}

const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, history }) => {
  if (!isOpen) return null;

  const data = history.map((record, index) => ({
    name: index + 1,
    score: record.score,
    mode: record.mode,
    operation: record.operation,
    time: new Date(record.timestamp).toLocaleTimeString()
  }));

  const maxScore = history.length ? Math.max(...history.map(record => record.score), 0) : 0;
  const avgScore = history.length ? Math.round(history.reduce((sum, record) => sum + record.score, 0) / history.length) : 0;

  return (
    <div className="modal-backdrop">
      <div className="modal-card stats-card">
        <div className="modal-header">
          <h2>Score History</h2>
          <button onClick={onClose} className="icon-button" aria-label="Close stats">
            <X size={22} />
          </button>
        </div>

        <div className="stats-body">
          {history.length < 2 ? (
            <div className="empty-chart">Play more games to see your history.</div>
          ) : (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }} />
                  <Area type="monotone" dataKey="score" stroke="#818CF8" fill="#4F46E5" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="stat-grid">
            <div className="stat-card"><span>Games Saved</span><strong>{history.length}</strong></div>
            <div className="stat-card"><span>High Score</span><strong>{maxScore}</strong></div>
            <div className="stat-card"><span>Average</span><strong>{avgScore}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsModal;
