import React, { useState } from 'react';
import { logRuntimeEvent } from '../../../utils/runtimeDebugLog';
import { TRAINING_GUIDES_ENABLED } from '../../../tutorials/tutorialFeatureFlags';
import { playUISound } from '../../../utils/uiSoundPlayer';
import { 
  X, 
  BookOpen, 
  Lightbulb, 
  Compass, 
  HelpCircle, 
  Info, 
  Sparkles,
  Heart,
  EyeOff,
  Zap,
  ChevronRight
} from 'lucide-react';

interface HelpMenuProps {
  currentMode: string;
  onClose: () => void;
  onShowDemo?: (targetId: string) => void;
  onStartTutorial?: (id: any) => void;
  completedTutorials?: Record<string, boolean>;
  currentScreen?: string;
}

const GENERAL_TIPS = [
  "Look at the center first. That tells you what kind of answer to find.",
  "If an answer turns green, tap it and keep going. That is the app helping you.",
  "In QMM, speed matters — but wrong guesses slow you down.",
  "In Dark Mode, use the rhythm. The answer buttons are hidden on purpose.",
  "If you feel stuck, pause and check Mode Help.",
  "In Survival Mode, slow down just enough to protect your lives.",
  "Quiet sounds can help you focus without getting annoying.",
  "Try to beat your own score, not just the timer."
];

export const HelpMenu: React.FC<HelpMenuProps> = ({ 
  currentMode, 
  onClose, 
  onShowDemo,
  onStartTutorial,
  completedTutorials = {},
  currentScreen
}) => {
  const [activeTab, setActiveTab] = useState<'mode' | 'tutorials'>('mode');
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const nextTip = () => {
    playUISound('uiTap');
    setCurrentTipIndex((prev) => (prev + 1) % GENERAL_TIPS.length);
  };

  const getModeHelp = (mode: string) => {
    switch (mode?.toLowerCase()) {
      case 'normal':
        return {
          title: "Normal Mode",
          description: "Read the math problem in the center coin, then find and tap the correct answer in the grid.",
          guideline: [
            "Focus on accuracy first. Take your time to get it right.",
            "Pedagogical Fail-Safe helps when you miss. The right answer turns green, and the other answers fade out. Tap the green answer to keep going. This stops guessing and helps your brain see the correct answer."
          ],
          icon: <Sparkles className="w-6 h-6 text-emerald-500 animate-pulse" />
        };
      case 'qmm':
        return {
          title: "Quick Math Mode (QMM)",
          description: "Think fast! The game moves quicker here.",
          guideline: [
            "Try to recognize patterns quickly instead of counting.",
            "Don't just guess randomly! Wrong guesses will slow you down.",
            "Pedagogical Fail-Safe helps when you miss so you can learn the right answer."
          ],
          icon: <Zap className="w-6 h-6 text-amber-500" />
        };
      case 'dark':
        return {
          title: "Dark Mode",
          description: "Notice something missing? The answer grid is hidden on purpose in this mode.",
          guideline: [
            "Focus on the center coin and the rhythm.",
            "Tap the center coin slowly to the beat to enter your answer."
          ],
          icon: <EyeOff className="w-6 h-6 text-indigo-500" />
        };
      case 'hidden':
        return {
          title: "Hidden Mode",
          description: "Some of the numbers are hidden, so you have to be a detective.",
          guideline: [
            "Look closely at the clues and numbers you CAN see to find the pattern.",
            "Don't panic if not everything is visible. Take your time to figure it out.",
            "Pedagogical Fail-Safe helps when you miss so you can learn the right answer."
          ],
          icon: <HelpCircle className="w-6 h-6 text-rose-500" />
        };
      case 'survival':
        return {
          title: "Survival Mode",
          description: "You have a limited number of hearts (lives).",
          guideline: [
            "Protect your lives! Rushing and making mistakes will cost you more than slowing down.",
            "Pedagogical Fail-Safe helps when you miss. The right answer turns green, and the other answers fade out. Tap the green answer to keep going. This stops guessing and helps your brain see the correct answer."
          ],
          icon: <Heart className="w-6 h-6 text-red-500 fill-red-500" />
        };
      default:
        return {
          title: "Standard Mode Guide",
          description: "Look at the math question in the center and tap the right answer.",
          guideline: [
            "Take your time and think it through.",
            "Try out different options in the Settings menu."
          ],
          icon: <Compass className="w-6 h-6 text-sky-500" />
        };
    }
  };

  const modeHelp = getModeHelp(currentMode);

  return (
    <div 
      className="absolute inset-0 bg-slate-950/70 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        // Prevent click-throughs from hitting elements underneath
        e.stopPropagation();
      }}
    >
      <div 
        className="bg-white dark:bg-slate-900 border-4 border-slate-300 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/60 p-2 rounded-xl">
              <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-slate-900 dark:text-white text-2xl font-black uppercase tracking-tight">MathForge Coach</h2>
          </div>
          <button 
            onClick={() => { playUISound('helpClose'); onClose(); }}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Close panel"
         >
            <X className="w-6 h-6 text-slate-500 hover:text-slate-800 dark:hover:text-white" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
          <button
            onClick={() => { playUISound('uiSelect'); setActiveTab('mode'); }}
            className={`flex-1 py-2.5 text-center text-sm font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              activeTab === 'mode'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Quick Tip
          </button>
          <button
            onClick={() => {
              if (TRAINING_GUIDES_ENABLED) {
                playUISound('uiSelect');
                setActiveTab('tutorials');
              } else {
                playUISound('trainingGuidesBlocked');
                logRuntimeEvent('trainingGuidesComingSoonClicked', 'HelpMenu', {
                  currentMode,
                  activeTab
                });
                alert("Training Guides are coming soon. For now, use Quick Tips and Mode Help — they are ready.");
              }
            }}
            className={`flex-1 py-1 text-center text-sm font-black uppercase tracking-wider rounded-lg transition-all flex flex-col items-center justify-center ${
              TRAINING_GUIDES_ENABLED && activeTab === 'tutorials'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                : !TRAINING_GUIDES_ENABLED
                  ? 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>Training Guides</span>
            {!TRAINING_GUIDES_ENABLED && <span className="text-[9px] font-bold uppercase text-indigo-400 tracking-widest mt-0.5 opacity-80 border border-indigo-400/30 rounded px-1">Coming Soon</span>}
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'mode' ? (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200 pt-2">
              <div className="flex items-start gap-4 bg-indigo-50/80 dark:bg-indigo-950/30 p-5 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/40">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/60 rounded-xl shrink-0">
                  {modeHelp.icon}
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-indigo-900 dark:text-indigo-100 text-lg font-black uppercase tracking-tight">{modeHelp.title}</h3>
                  <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold leading-relaxed">{modeHelp.description}</p>
                </div>
              </div>

              <div className="space-y-3 px-1">
                <h4 className="text-slate-800 dark:text-slate-200 text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-500" />
                  Coach Rules
                </h4>
                <ul className="space-y-2.5">
                  {modeHelp.guideline.map((line, idx) => (
                    <li key={idx} className="flex gap-3 text-slate-700 dark:text-slate-300 text-sm font-semibold leading-relaxed">
                      <span className="text-indigo-500 font-black shrink-0 text-lg leading-none">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dynamic Quick Tip Box */}
              <div className="mt-2 bg-amber-50/80 dark:bg-amber-950/20 border-[3px] border-amber-200 dark:border-amber-900/50 p-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-black text-sm uppercase tracking-wider">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    Coach Tip
                  </div>
                  <button 
                    onClick={nextTip}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 text-xs font-black uppercase tracking-wider hover:underline cursor-pointer"
                  >
                    Next Tip →
                  </button>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm font-bold italic leading-relaxed relative z-10">
                  "{GENERAL_TIPS[currentTipIndex]}"
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200 pt-2">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-sm font-black uppercase tracking-wider">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                Training Missions
              </div>
              <div className="space-y-3">
                {[
                  { id: 'app_basics', title: 'App Basics', desc: 'Learn the core flow of the game.', reqMode: 'Any' },
                  { id: 'normal_mode_basics', title: 'Normal Mode Guide', desc: 'Solve the center coin and pick the right answer.', reqMode: 'normal' },
                  { id: 'qmm_basics', title: 'QMM Guide', desc: 'Fast thinking with moving modifiers.', reqMode: 'qmm' },
                  { id: 'dark_mode_basics', title: 'Dark Mode Guide', desc: 'Listen to the rhythm and tap the center coin.', reqMode: 'dark' },
                  { id: 'survival_mode_basics', title: 'Survival Mode Guide', desc: 'Do not run out of hearts!', reqMode: 'survival' }
                ].map((tut) => {
                  const isCompleted = !!completedTutorials[tut.id];
                  const isPlayable = 
                    tut.id === 'app_basics' || 
                    (currentScreen === 'playing' && currentMode?.toLowerCase() === tut.reqMode);

                  return (
                    <div 
                      key={tut.id} 
                      className={`p-4 bg-white dark:bg-slate-800 border-[3px] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm ${
                        isCompleted ? 'border-emerald-200 dark:border-emerald-900/60 shadow-emerald-100 dark:shadow-none' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-slate-900 dark:text-slate-100 text-sm font-black uppercase tracking-tight">{tut.title}</span>
                          {isCompleted && (
                            <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/50">
                              ✓ Completed
                            </span>
                          )}
                        </div>
                        <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">{tut.desc}</div>
                        <div className="text-indigo-500 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                          Mission Mode: {tut.reqMode}
                        </div>
                      </div>

                      <div className="bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-widest px-4 py-2.5 rounded-xl whitespace-nowrap shrink-0 text-center flex items-center justify-center gap-1 opacity-70">
                        Coming Soon
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-slate-400 text-[11px] mt-2 italic">
                Training Guides are coming soon. For now, use Quick Tips and Mode Help — they are ready.
              </p>
              {/* Demo button removed temporarily */}
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex gap-3 pt-4 border-t-2 border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={() => {
              playUISound('copyDebugLog');
              const logObj = (window as any)?.__MATHFORGE_DEBUG_LOG__;
              if (logObj?.copy) {
                logObj.copy();
                alert("Debug log copied to clipboard.");
              }
            }}
            className="flex-shrink-0 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            Copy Log
          </button>
          <button
            onClick={() => { playUISound('helpClose'); onClose(); }}
            className="flex-1 sa-btn bg-emerald-500 hover:bg-emerald-600 border-b-4 border-emerald-600 text-white font-black uppercase tracking-widest rounded-xl py-3.5 text-sm active:border-b-0 active:translate-y-1 transition-all cursor-pointer text-center flex items-center justify-center gap-2"
          >
            Resume <ChevronRight className="w-5 h-5"/>
          </button>
        </div>
      </div>
    </div>
  );
};
