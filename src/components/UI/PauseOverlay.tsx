/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PracticePlanController } from '../../services/practicePlanController';
import { playUISound } from '../../utils/uiSoundPlayer';

export const PauseOverlay = ({ 
  state, 
  actions,
  onBackToLessonPlan,
  onExitToHome
}: { 
  state: any; 
  actions: any;
  onBackToLessonPlan?: () => void;
  onExitToHome?: () => void;
}) => {
  if (!(state.isPaused && state.status === 'playing')) return null;
  
  const hasActivePlan = !!PracticePlanController.getCurrentPlan();

  return (
    <div
      className="absolute inset-0 bg-[var(--color-overlay-scrim)] backdrop-blur-sm z-[100] flex items-center justify-center p-4"
    >
      <div className="bg-white p-8 rounded-3xl shadow-2xl border-4 border-slate-200 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 min-w-[280px]">
        <div className="text-slate-800 text-3xl font-black tracking-widest mb-4 text-center uppercase">PAUSED</div>
        
        <button 
          onClick={() => { playUISound('uiClose'); actions.togglePause(); }}
          className="w-full sa-btn bg-emerald-500 text-white font-black uppercase tracking-widest rounded-xl py-4 hover:scale-105 transition-transform"
        >
          ▶ Resume
        </button>

        <button 
          onClick={() => { playUISound('uiReset'); actions.startGame(); }}
          className="w-full sa-btn bg-blue-500 text-white font-black uppercase tracking-widest rounded-xl py-4 hover:scale-105 transition-transform"
        >
          ↺ Restart Activity
        </button>

        {hasActivePlan && onBackToLessonPlan && (
          <button 
            onClick={() => {
              playUISound('uiNavigate');
              onBackToLessonPlan();
            }}
            className="w-full sa-btn bg-purple-500 text-white font-black uppercase tracking-widest rounded-xl py-4 hover:scale-105 transition-transform"
          >
            📋 Back to Lesson Plan
          </button>
        )}

        <button 
          onClick={() => { playUISound('uiNavigate'); onExitToHome && onExitToHome(); }}
          className="w-full sa-btn bg-rose-500 text-white font-black uppercase tracking-widest rounded-xl py-4 hover:scale-105 transition-transform"
        >
          ✖ Exit to Home
        </button>
      </div>
    </div>
  );
};

