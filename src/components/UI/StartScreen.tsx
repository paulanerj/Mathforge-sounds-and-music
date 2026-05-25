/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { PracticePlanController } from '../../services/practicePlanController';

interface StartScreenProps {
  state: any;
  actions: any;
  setIsOptionsOpen: (v: boolean) => void;
  config: any;
  onNavigate: (s: 'home' | 'play_menu' | 'lesson_builder' | 'progress' | 'skill_map' | 'child_dashboard' | 'instructor_portal' | 'playing') => void;
}

import { playUISound } from '../../utils/uiSoundPlayer';

export const StartScreen = ({ state, actions, onNavigate, setIsOptionsOpen, config }: StartScreenProps) => {
  const [hasActiveLesson, setHasActiveLesson] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');

  useEffect(() => {
    if (PracticePlanController.hasActiveSession()) {
      setHasActiveLesson(true);
      setLessonTitle(PracticePlanController.getCurrentPlan()?.title || '');
    }
  }, []);

  const resumeLesson = () => {
    playUISound('uiNavigate');
    const level = PracticePlanController.getCurrentLevel();
    if (level) {
      const newConfig = PracticePlanController.mapLevelToAppConfig(level, config);
      actions.setConfig(newConfig);
      actions.startGame(newConfig);
      onNavigate('playing');
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center px-6 py-12 start-bg">
      <div className="z-10 flex flex-col items-center text-center text-slate-800 w-full max-w-sm">
        
        {/* SECTION 1 — TITLE */}
        <div className="flex justify-center items-center py-4 mb-8">
          <h1 
            className="tracking-tight mathforge-title"
            style={{ animation: 'enterUp 0.5s ease-out 0.1s both' }}
          >
            MathForge
          </h1>
        </div>
        
        {state.initError && (
          <div className="w-full max-w-md sa-card p-4 mb-8 text-sm leading-snug border-red-200 bg-red-50">
            <div className="font-black mb-1 text-red-600 uppercase tracking-widest text-[10px]">Error</div>
            <div className="opacity-90 mb-0 font-bold text-red-800">{state.initError}</div>
          </div>
        )}
        
        <div className="flex flex-col gap-4 w-full">
          {hasActiveLesson && (
            <button
              onClick={resumeLesson}
              className="splash-card w-full bg-emerald-600 hover:bg-emerald-700 text-white text-left flex flex-col gap-1 border border-emerald-500 cursor-pointer"
              style={{ animation: 'enterUp 0.5s ease-out 0.15s both' }}
            >
              <div className="text-xl font-black">Resume Lesson</div>
              <div className="text-sm font-medium opacity-90">{lessonTitle}</div>
            </button>
          )}

          {/* SECTION 2 — PRIMARY CARD */}
          <button
            onClick={() => { playUISound('uiNavigate'); onNavigate('play_menu'); }}
            className={`splash-card w-full ${hasActiveLesson ? 'bg-blue-50 text-blue-900 border-blue-200' : 'bg-blue-600 text-white border-blue-500'} hover:bg-blue-700 hover:text-white text-left flex flex-col gap-1 border cursor-pointer`}
            style={{ animation: 'enterUp 0.5s ease-out 0.2s both' }}
          >
            <div className="text-xl font-black">{hasActiveLesson ? 'Start New Training' : 'Continue Training'}</div>
            <div className="text-sm font-medium opacity-90">Pick up where you left off</div>
          </button>

          {/* SECTION 3 — SECONDARY CARD */}
          <button
            onClick={() => { playUISound('uiOpen'); setIsOptionsOpen(true); }}
            data-guide-id="settings-button"
            className="splash-card w-full bg-slate-50 hover:bg-white text-slate-800 flex flex-col gap-1 text-left border border-slate-200 cursor-pointer"
            style={{ animation: 'enterUp 0.5s ease-out 0.3s both' }}
          >
            <div className="text-lg font-black text-slate-700">Free Practice</div>
            <div className="text-sm font-medium text-slate-500">Choose what to practice</div>
          </button>

          {/* SECTION 4 — INSTRUCTOR CARD */}
          <button
            onClick={() => { playUISound('uiNavigate'); onNavigate('instructor_portal'); }}
            className="splash-card w-full bg-white hover:bg-slate-50 text-slate-800 flex flex-col gap-1 text-left border border-slate-200 mt-2 cursor-pointer"
            style={{ animation: 'enterUp 0.5s ease-out 0.4s both' }}
          >
            <div className="text-lg font-black text-slate-700">Instructor Portal</div>
            <div className="text-sm font-medium text-slate-500">Build lessons and track progress</div>
          </button>
        </div>
      </div>
    </div>
  );
};
