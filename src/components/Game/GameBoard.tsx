/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 🔒 STABLE BASELINE FILE
 * Do not modify without explicit architecture change approval.
 * Changes here can break the entire app.
 */
import React from 'react';
import { AppConfig, GameStep } from '../../types';
import { VisualStep } from '../../contracts/visualStep';
import { CircleRenderer } from '../../renderers/CircleRenderer';
import { MinimalRenderer } from '../../renderers/MinimalRenderer';
import { playUISound } from '../../utils/uiSoundPlayer';
import { AnswerGrid } from './AnswerGrid';
import { GameLayout } from '../../layouts/GameLayout';
import { normalizeOptions } from '../../utils/normalizeOptions';
import { RendererProps } from '../../renderers/RendererProps';

export interface GameBoardProps {
  state: any;
  visualStep: VisualStep | null;
  actions: any;
  config: AppConfig;
  distractors: number[];
  flashState: 'correct' | 'incorrect' | null;
  localClicked: number | null;
  setLocalClicked: (n: number | null) => void;
  currentStep: GameStep | null;
  rhythmState?: { chainLength: number; chainMultiplier: number; maxChain: number };
  uiSkin?: 'default' | 'forge';
  uiRenderer?: 'circle' | 'minimal';
  topBar?: React.ReactNode;
  footer?: React.ReactNode;
  isTutorialActionStep?: boolean;
}

const rendererMap: Record<'circle' | 'minimal', React.FC<RendererProps>> = {
  circle: CircleRenderer,
  minimal: MinimalRenderer,
};

export const GameBoard: React.FC<GameBoardProps> = ({
  state,
  visualStep,
  actions,
  config,
  distractors,
  flashState,
  localClicked,
  setLocalClicked,
  currentStep,
  rhythmState,
  uiSkin = 'default',
  uiRenderer = 'circle',
  topBar,
  footer,
  isTutorialActionStep = false,
}) => {
  if (!visualStep) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-slate-900/80 backdrop-blur rounded-3xl border-4 border-rose-500 shadow-2xl relative z-50 mt-20">
        <h1 className="text-white text-3xl font-black mb-6 uppercase tracking-tighter text-center">Game state needs a reset.</h1>
        <div className="flex gap-4 w-full">
          <button onClick={() => { playUISound('uiReset'); actions.earlyExit(); }} className="flex-1 sa-btn px-6 py-4 bg-rose-500 text-white font-black rounded-xl hover:scale-105 transition-transform uppercase tracking-wider">
            Restart
          </button>
          <button onClick={() => {
            playUISound('uiNavigate');
            if (actions.exitToIdle) actions.exitToIdle();
            // In a deeper real implementation this might use navigateTo Home
          }} className="flex-1 sa-btn px-6 py-4 bg-white text-slate-800 font-black rounded-xl hover:scale-105 transition-transform uppercase tracking-wider hidden">
            Home
          </button>
        </div>
      </div>
    );
  }

  // 🔒 DEV GUARD: Freeze visualStep in development to prevent accidental mutations
  if (process.env.NODE_ENV === 'development') {
    Object.freeze(visualStep);
    if (visualStep.options) Object.freeze(visualStep.options);
  }

  const currentRenderer = config?.minimalUI ? 'minimal' : uiRenderer;
  const ActiveRenderer = rendererMap[currentRenderer];
  const displayOptions = normalizeOptions(visualStep.options);

  if (process.env.NODE_ENV === 'development') {
    console.log('[RENDERER ACTIVE]', currentRenderer);
  }

  // Derive mode and timer to strictly match prompt requirements
  const mode = visualStep.mode;
  const timer = currentStep?.timerSeconds ? {
    total: currentStep.timerSeconds,
    remaining: state.virtualTime || 0
  } : undefined;

  return (
    <GameLayout
      topBar={topBar}
      centerArea={
        <div className="center-area flex items-center justify-center w-full h-full">
          <ActiveRenderer
            visualStep={visualStep}
            mode={mode}
            uiSkin={uiSkin}
            timer={timer}
            flashState={flashState}
            chainLength={rhythmState?.chainLength || 0}
            streakTier={visualStep.streakTier || 0}
            streakCount={state.streakCount || 0}
            onCenterClick={actions.advanceDarkStepNow}
          />
        </div>
      }
      answerArea={
        <AnswerGrid
          distractors={displayOptions}
          state={state}
          flashState={flashState}
          isDark={visualStep.mode === 'DM'}
          actions={actions}
          localClicked={localClicked}
          setLocalClicked={setLocalClicked}
          currentStep={currentStep}
          config={config}
          uiSkin={uiSkin as "default" | "forge"}
          isTutorialActionStep={isTutorialActionStep}
        />
      }
      footer={footer}
    />
  );
};
