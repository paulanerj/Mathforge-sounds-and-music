/*
  HARD FREEZE ACTIVE — MULTI-TOUCH CORE
  DO NOT MODIFY:
  * input pipeline
  * aggregation logic
  * shared sum calculation
  * pointer path structure

  Any change to core logic requires explicit override directive.
*/

import React, { useReducer, useRef, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronDown,
  RotateCcw,
  Settings,
  Info,
  Trophy,
  Target,
  Zap,
  Clock,
  LayoutGrid,
  Activity,
  Trash2,
  X,
  Home,
  SkipBack,
  SkipForward,
} from "lucide-react";
import {
  SpeedGridRules,
  TileProps,
  SpeedGridState,
  SYSTEM_VERSION,
} from "./SpeedGridRules";
import { TARGET_PROFILES } from "./TargetProfile";
import { speedGridReducer } from "./SpeedGridReducer";
import { PRACTICE_PROFILES, DEFAULT_PROFILE_ID } from "../../engine/public";
import { TUNING_PRESETS } from "./SpeedGridInputTuning";
import { SoundService } from "../../systems/SoundService";
import { HapticService } from "../../systems/HapticService";

const GAP = 4;
const TILE_RADIUS = 12;
const BOARD_PADDING = 2; // Total padding on each side of the tile grid

// ─────────────────────────────────────────────────────────────────────────────
// snapTo8Way — 8-way directional snap for diagonal tile linking.
//
// Takes a (dx, dy) movement vector and returns the (dRow, dCol) offset
// for whichever of 8 compass directions (N, NE, E, SE, S, SW, W, NW)
// the vector points toward, using 45° cones so diagonal targets are
// just as easy to hit as orthogonal ones.
// ─────────────────────────────────────────────────────────────────────────────
function snapTo8Way(dx: number, dy: number): { dRow: number; dCol: number } {
  const deg = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
  const s   = Math.round(deg / 45) % 8;
  //                  E   SE   S   SW   W   NW   N   NE
  const DR = [ 0,  1,  1,  1,  0, -1, -1, -1];
  const DC = [ 1,  1,  0, -1, -1, -1,  0,  1];
  return { dRow: DR[s], dCol: DC[s] };
}

const POINTER_COLORS = [
  {
    id: 0,
    main: "#22d3ee",
    shadow: "rgba(34, 211, 238, 0.8)",
    bg: "bg-cyan-500",
    border: "border-cyan-400",
    text: "text-cyan-500",
  },
  {
    id: 1,
    main: "#fb923c",
    shadow: "rgba(251, 146, 60, 0.8)",
    bg: "bg-orange-500",
    border: "border-orange-400",
    text: "text-orange-500",
  },
  {
    id: 2,
    main: "#4ade80",
    shadow: "rgba(74, 222, 128, 0.8)",
    bg: "bg-green-500",
    border: "border-green-400",
    text: "text-green-500",
  },
  {
    id: 3,
    main: "#818cf8",
    shadow: "rgba(129, 140, 248, 0.8)",
    bg: "bg-indigo-500",
    border: "border-indigo-400",
    text: "text-indigo-500",
  },
];

const TILE_COLORS: Record<number, string> = {
  // Each tile keeps its color identity via a tinted translucent bg.
  // Standardized weight (200/60) for uniform translucency.
  // High-contrast text (slate-900) for identical readability.
  // Translucent white border (white/65) for the glass edge.
  1: "bg-[#fecdd3]/60 text-slate-900 border-white/65",       // Pink glass
  2: "bg-blue-200/60 text-slate-900 border-white/65",       // Blue glass
  3: "bg-sky-200/60 text-slate-900 border-white/65",        // Sky glass
  4: "bg-emerald-200/60 text-slate-900 border-white/65",    // Green glass
  5: "bg-orange-200/60 text-slate-900 border-white/65",     // Orange glass
  6: "bg-yellow-200/60 text-slate-900 border-white/65",     // Yellow glass
  7: "bg-amber-200/60 text-slate-900 border-white/65",      // Terracotta glass
  8: "bg-violet-200/60 text-slate-900 border-white/65",     // Purple glass
  9: "bg-[#fecaca]/60 text-slate-900 border-white/65",        // Red glass
};

const GLASS_CLASSES = "bg-white/40 backdrop-blur-md border border-white/20 border-t-white/80 border-l-white/80 shadow-xl shadow-black/25 overflow-hidden";
const CONTROL_GLASS = "bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/70 transition-all active:scale-95 shadow-sm";

const GravityReplayOverlay = ({
  trace,
  replay,
  dispatch,
  tileSize,
}: {
  trace: any;
  replay: { active: boolean; step: number };
  dispatch: React.Dispatch<any>;
  tileSize: number;
}) => {
  const steps = [
    { label: "BEFORE", board: trace.snapshots.before },
    { label: "AFTER REMOVAL", board: trace.snapshots.afterGravity }, // Truncating steps for brevity if needed
    { label: "AFTER GRAVITY", board: trace.snapshots.afterGravity },
    { label: "AFTER REFILL", board: trace.snapshots.afterRefill },
    { label: "FINAL STATE", board: trace.snapshots.afterRefill },
  ];

  const currentStep = steps[replay.step] || steps[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-xl p-4 flex flex-col items-center justify-center gap-6"
    >
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-xl font-black text-white uppercase tracking-tighter">
          Gravity Replay
        </h2>
        <div className="px-3 py-1 bg-blue-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
          STEP {replay.step + 1} / {steps.length}: {currentStep.label}
        </div>
      </div>

      <div className="w-full max-w-sm aspect-square bg-white/5 rounded-[2rem] p-4 border border-white/10 shadow-2xl overflow-hidden">
        <GridBoard
          board={currentStep.board}
          rows={currentStep.board.length}
          cols={currentStep.board[0].length}
          selectionIds={[]}
          activePaths={{}}
          pathStatus={{}}
          lastActionName="REPLAY"
          isLocked={false}
          showGravityVisuals={true}
          tileSize={tileSize * 0.6}
          dispatch={dispatch}
        />
      </div>

      <div className="flex gap-4 w-full max-w-sm">
        <button
          onClick={() => dispatch({ type: "STOP_GRAVITY_REPLAY" })}
          className="flex-1 py-4 bg-slate-800 text-slate-400 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-700 transition-colors"
        >
          Exit
        </button>
        <button
          onClick={() => dispatch({ type: "NEXT_GRAVITY_REPLAY_STEP" })}
          className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
        >
          {replay.step < steps.length - 1 ? "Next Step" : "Restart"}
        </button>
      </div>

      <div className="w-full max-w-sm p-4 bg-white/5 rounded-2xl border border-white/5 font-mono text-[9px] text-slate-400 overflow-y-auto max-h-[150px]">
        {trace.summary.split("\n").map((line: string, i: number) => (
          <div key={i} className="whitespace-pre-wrap">
            {line}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const ForensicTraceModal = ({
  trace,
  onClose,
}: {
  trace: any;
  onClose: () => void;
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(trace.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-slate-950 flex flex-col pt-safe"
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900 shadow-xl">
        <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          Gravity Forensics
        </h2>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] leading-relaxed text-slate-300 bg-slate-950 whitespace-pre-wrap">
        {trace.summary}
      </div>

      <div className="p-4 bg-slate-900 border-t border-white/10 flex gap-3">
        <button
          onClick={handleCopy}
          className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px]"
        >
          {copied ? "Copied!" : "Copy Trace"}
        </button>
      </div>
    </motion.div>
  );
};

const SettingsModal = ({
  isOpen,
  onClose,
  onRestart,
  state,
  dispatch,
}: {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  state: SpeedGridState;
  dispatch: React.Dispatch<any>;
}) => {
  const settings = state.draftSettings || state.settings;
  const isDirty = state.draftSettings !== null && JSON.stringify(state.draftSettings) !== JSON.stringify(state.settings);
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 flex items-end sm:items-center justify-center pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-5 max-h-[85dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-2">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Control Panel
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* TARGET CONFIGURATION SECTION */}
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">
                    Target Generation Mode
                  </span>
                  <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest bg-rose-50 px-1.5 py-0.5 rounded">Rebuilds Board</span>
                </div>
                
                <select 
                  value={settings.targetSource}
                  onChange={(e) => dispatch({ type: "SET_DRAFT_SETTING", key: "targetSource", value: e.target.value })}
                  className="w-full p-3 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-400 transition-all appearance-none cursor-pointer"
                >
                  <option value="classic">CLASSIC (1-9 Targets)</option>
                  <option value="preset">PRESET LIST</option>
                  <option value="custom">CUSTOM LIST (Manual)</option>
                  <option value="range">RANDOM RANGE</option>
                  <option value="single">SINGLE TARGET LOCK</option>
                  <option value="multiples">MULTIPLES (Factors)</option>
                  <option value="primes">PRIMES ONLY</option>
                  <option value="factors">FACTORS OF 100</option>
                </select>

                {/* MODE SPECIFIC CONTACTS */}
                {settings.targetSource === "custom" && (
                  <div className="space-y-3">
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-tight">Comma-separated Targets</span>
                    <input 
                      type="text"
                      placeholder="e.g. 21, 35, 42"
                      value={settings.customTargetList.raw}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const parsed = raw.split(',')
                          .map(s => parseInt(s.trim()))
                          .filter(n => !isNaN(n) && n > 0);
                        dispatch({ 
                          type: "SET_DRAFT_SETTING", 
                          key: "customTargetList", 
                          value: { raw, parsed: Array.from(new Set(parsed)) } 
                        });
                      }}
                      className="w-full p-3 bg-white border border-blue-200 rounded-xl text-xs font-mono"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {[10, 12, 15, 18, 20, 21, 24, 25, 27, 28, 30, 32, 35, 36, 40, 42, 45, 48, 54, 56, 63, 64, 72].map(n => {
                        const isIncluded = settings.customTargetList.parsed.includes(n);
                        return (
                          <button
                            key={n}
                            onClick={() => {
                              const current = settings.customTargetList.parsed;
                              const next = isIncluded ? current.filter(x => x !== n) : [...current, n];
                              dispatch({
                                type: "SET_DRAFT_SETTING",
                                key: "customTargetList",
                                value: { raw: next.join(', '), parsed: next.sort((a,b) => a-b) }
                              });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${isIncluded ? 'bg-blue-600 text-white' : 'bg-white text-blue-400 border border-blue-200'}`}
                          >
                            {n}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {settings.targetSource === "range" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-tight">Min Target</span>
                      <input 
                        type="text"
                        inputMode="numeric"
                        value={settings.rangeConfig.min}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^[0-9]+$/.test(val)) {
                            dispatch({ type: "SET_DRAFT_SETTING", key: "rangeConfig", value: { ...settings.rangeConfig, min: val }});
                          }
                        }}
                        className="w-full p-2.5 bg-white border border-blue-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-tight">Max Target</span>
                      <input 
                        type="text"
                        inputMode="numeric"
                        value={settings.rangeConfig.max}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^[0-9]+$/.test(val)) {
                            dispatch({ type: "SET_DRAFT_SETTING", key: "rangeConfig", value: { ...settings.rangeConfig, max: val }});
                          }
                        }}
                        className="w-full p-2.5 bg-white border border-blue-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>
                )}

                {settings.targetSource === "single" && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-tight">Target Value</span>
                    <input 
                      type="text"
                      inputMode="numeric"
                      value={settings.singleConfig.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^[0-9]+$/.test(val)) {
                          dispatch({ type: "SET_DRAFT_SETTING", key: "singleConfig", value: { value: val }});
                        }
                      }}
                      className="w-full p-3 bg-white border border-blue-200 rounded-xl text-xs font-black text-blue-600 text-center text-xl"
                    />
                  </div>
                )}
              </div>

              {settings.targetSource === "multiples" && (
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 space-y-4">
                  <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block">
                    Bases (Select multiples)
                  </span>
                  <div className="grid grid-cols-6 gap-1">
                    {Array.from({ length: 18 }, (_, i) => i + 2).map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          const bases = settings.multiplesConfig.bases || [];
                          const nextBases = bases.includes(n)
                            ? bases.filter((b) => b !== n)
                            : [...bases, n];
                          dispatch({
                            type: "SET_DRAFT_SETTING",
                            key: "multiplesConfig",
                            value: {
                              ...settings.multiplesConfig,
                              bases: nextBases,
                            },
                          });
                        }}
                        className={`h-8 rounded-md text-[10px] font-black transition-all ${settings.multiplesConfig.bases.includes(n) ? "bg-purple-600 text-white" : "bg-white text-purple-400 border border-purple-200"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                    Number Pool
                  </span>
                  <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest bg-rose-50 px-1.5 py-0.5 rounded">Rebuilds Board</span>
                </div>
                <div className="grid grid-cols-9 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        const pool = settings.numberPool || [];
                        const nextPool = pool.includes(n)
                          ? pool.filter((p) => p !== n)
                          : [...pool, n].sort();
                        if (nextPool.length === 0) return;
                        dispatch({
                          type: "SET_DRAFT_SETTING",
                          key: "numberPool",
                          value: nextPool,
                        });
                      }}
                      className={`aspect-square rounded-md text-xs font-black transition-all ${settings.numberPool.includes(n) ? "bg-slate-800 text-white" : "bg-white text-slate-300 border border-slate-200"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      Round Duration
                    </span>
                    <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest bg-rose-50 px-1.5 py-0.5 rounded">Resets Timer</span>
                  </div>
                  <select 
                    value={settings.timeLimit}
                    onChange={(e) => dispatch({ type: "SET_DRAFT_SETTING", key: "timeLimit", value: Number(e.target.value) })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value={30}>30s (Quick)</option>
                    <option value={60}>60s (Standard)</option>
                    <option value={90}>90s (Endurance)</option>
                    <option value={120}>120s (Marathon)</option>
                  </select>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      Time Tiles
                    </span>
                    <span className="text-[8px] font-black text-amber-500 uppercase bg-amber-50 px-1.5 py-0.5 rounded">Every N Tiles</span>
                  </div>
                  <select 
                    value={settings.timeTileFrequency}
                    onChange={(e) => dispatch({ type: "SET_DRAFT_SETTING", key: "timeTileFrequency", value: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="off">Off</option>
                    <option value="frequent">Frequent (5)</option>
                    <option value="normal">Normal (10)</option>
                    <option value="rare">Rare (15)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      Grid Size
                    </span>
                    <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest bg-rose-50 px-1.5 py-0.5 rounded">Rebuilds Board</span>
                  </div>
                  <select 
                    value={`${settings.gridSize[0]}x${settings.gridSize[1]}`}
                    onChange={(e) => {
                      const [r, c] = e.target.value.split('x').map(Number);
                      dispatch({ type: "SET_DRAFT_SETTING", key: "gridSize", value: [r, c] });
                    }}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="5x4">5x4 (Small)</option>
                    <option value="6x5">6x5 (Medium)</option>
                    <option value="7x5">7x5 (Standard)</option>
                    <option value="8x6">8x6 (Large)</option>
                  </select>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      Operation
                    </span>
                    <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest bg-rose-50 px-1.5 py-0.5 rounded">Rebuilds Board</span>
                  </div>
                  <select 
                    value={settings.operationMode}
                    onChange={(e) => dispatch({ type: "SET_DRAFT_SETTING", key: "operationMode", value: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="add">Addition</option>
                    <option value="multiply">Multiplication</option>
                  </select>
                </div>
              </div>

              {/* Live Settings Toggle Area */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                   <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">Multi-Touch</span>
                    <span className="text-[7px] font-black text-emerald-500 uppercase bg-emerald-50 px-1 py-0.5 rounded">LIVE</span>
                   </div>
                   <button 
                    onClick={() => dispatch({ type: "SET_DRAFT_SETTING", key: "multiTouchMode", value: settings.multiTouchMode === 'combined' ? 'independent' : 'combined' })}
                    className={`w-full py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${settings.multiTouchMode === 'combined' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}
                   >
                    {settings.multiTouchMode}
                   </button>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                   <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">Gravity HUD</span>
                    <span className="text-[7px] font-black text-emerald-500 uppercase bg-emerald-50 px-1 py-0.5 rounded">LIVE</span>
                   </div>
                   <button 
                    onClick={() => dispatch({ type: "SET_DRAFT_SETTING", key: "showGravityVisuals", value: !settings.showGravityVisuals })}
                    className={`w-full py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${settings.showGravityVisuals ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200'}`}
                   >
                    {settings.showGravityVisuals ? 'ON' : 'OFF'}
                   </button>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                   <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">Haptics</span>
                    <span className="text-[7px] font-black text-emerald-500 uppercase bg-emerald-50 px-1 py-0.5 rounded">LIVE</span>
                   </div>
                   <button 
                    onClick={() => dispatch({ type: "SET_DRAFT_SETTING", key: "hapticsEnabled", value: !settings.hapticsEnabled })}
                    className={`w-full py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${settings.hapticsEnabled ? 'bg-pink-500 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200'}`}
                   >
                    {settings.hapticsEnabled ? 'ON' : 'OFF'}
                   </button>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                   <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">Sound Effects</span>
                    <span className="text-[7px] font-black text-emerald-500 uppercase bg-emerald-50 px-1 py-0.5 rounded">LIVE</span>
                   </div>
                   <button 
                    onClick={() => dispatch({ type: "SET_DRAFT_SETTING", key: "soundEnabled", value: !settings.soundEnabled })}
                    className={`w-full py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${settings.soundEnabled ? 'bg-purple-500 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200'}`}
                   >
                    {settings.soundEnabled ? 'ON' : 'OFF'}
                   </button>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                   <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">Dev Mode</span>
                    <span className="text-[7px] font-black text-emerald-500 uppercase bg-emerald-50 px-1 py-0.5 rounded">LIVE</span>
                   </div>
                   <button 
                    onClick={() => dispatch({ type: "SET_DRAFT_SETTING", key: "devMode", value: !settings.devMode })}
                    className={`w-full py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${settings.devMode ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200'}`}
                   >
                    {settings.devMode ? 'ON' : 'OFF'}
                   </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    onRestart();
                    onClose();
                  }}
                  className="w-full py-3 bg-rose-50 text-rose-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-100 transition-colors border border-rose-200"
                >
                  RESTART ROUND IMMEDIATELY
                </button>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-colors"
                >
                  DISCARD
                </button>
                <button
                  onClick={() => dispatch({ type: "APPLY_SETTINGS" })}
                  disabled={!isDirty}
                  className={`flex-1 py-4 text-white rounded-xl font-black uppercase tracking-widest text-[11px] transition-all ${
                    isDirty 
                      ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_4px_20px_rgba(37,99,235,0.4)] translate-y-[-2px]' 
                      : 'bg-slate-300 cursor-not-allowed text-slate-500'
                  }`}
                >
                  {isDirty ? 'APPLY CHANGES' : 'NO CHANGES'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

declare global {
  interface Window {}
}

const RoundEndOverlay = ({
  isOpen,
  score,
  matchesCleared,
  nextTarget,
  lastActionName,
  onRestart,
}: {
  isOpen: boolean;
  score: number;
  matchesCleared: number;
  nextTarget: number;
  lastActionName: string;
  onRestart: () => void;
}) => {
  const [phase, setPhase] = useState<"IDLE" | "COUNTING" | "REVEAL" | "DONE">("IDLE");
  const [displayScore, setDisplayScore] = useState(0);
  const [displayMatches, setDisplayMatches] = useState(0);
  const [pulseTrigger, setPulseTrigger] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setPhase("COUNTING");
      setDisplayScore(0);
      setDisplayMatches(0);
      setPulseTrigger(0);
      
      if (matchesCleared === 0) {
         setDisplayScore(score);
         setPhase("REVEAL");
         setTimeout(() => setPhase("DONE"), 500);
         return;
      }
      
      let currentMatch = 0;
      const delayTimeout = setTimeout(() => {
        const interval = setInterval(() => {
           currentMatch++;
           if (currentMatch <= matchesCleared) {
              setDisplayMatches(currentMatch);
              setDisplayScore(Math.floor((score / matchesCleared) * currentMatch));
              setPulseTrigger(prev => prev + 1);
              try {
                // Use available SpeedGrid tick
                SoundService.playTick(true);
              } catch (e) {}
           } else {
              setDisplayScore(score);
              clearInterval(interval);
              setTimeout(() => {
                 setPhase("REVEAL");
                 try {
                   // Use available SpeedGrid success sound
                   SoundService.playSuccess(true);
                 } catch (e) {}
                 setTimeout(() => setPhase("DONE"), 800);
              }, 400); // Pause before final reveal
           }
        }, 250); // slow and deliberate: 250ms per item
        return () => clearInterval(interval);
      }, 400); // Initial entrance delay

      return () => {
        clearTimeout(delayTimeout);
      }
    } else {
      setPhase("IDLE");
    }
  }, [isOpen, matchesCleared, score]);

  return (
    <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xl p-6 flex flex-col items-center justify-center pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      >
        <motion.div
          initial={{ scale: 0.9, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 30, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className={`w-full max-w-sm rounded-[2rem] p-8 flex flex-col items-center gap-8 text-center ${GLASS_CLASSES} overflow-visible`}
        >
          <div className="space-y-4">
            <motion.div 
              animate={{ 
                scale: pulseTrigger > 0 ? [1, 1.2, 1] : 1,
                rotate: phase === "REVEAL" ? [0, -10, 10, -10, 0] : 0,
              }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-amber-400/20 rounded-2xl border border-amber-400/30 relative"
            >
              <Trophy className="w-8 h-8 text-amber-500 fill-amber-500/10 relative z-10" />
              {/* Pulse ring */}
              <AnimatePresence>
                {pulseTrigger > 0 && phase === "COUNTING" && (
                   <motion.div 
                      key={pulseTrigger}
                      initial={{ opacity: 0.8, scale: 0.8 }}
                      animate={{ opacity: 0, scale: 2 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="absolute inset-0 border-2 border-amber-400 rounded-2xl"
                   />
                )}
              </AnimatePresence>
              {/* Final reveal burst */}
              <AnimatePresence>
                {phase === "REVEAL" && (
                   <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: [0, 1, 0], scale: [0.8, 2.5] }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute inset-0 bg-amber-400/50 rounded-full blur-xl"
                   />
                )}
              </AnimatePresence>
            </motion.div>
            
            <AnimatePresence mode="popLayout">
              {phase !== "IDLE" && (
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-black text-slate-800 uppercase tracking-tighter"
                >
                  {phase === "DONE" || phase === "REVEAL" ? "Round Complete" : "Evaluating..."}
                </motion.h2>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full relative z-10">
            <motion.div 
              animate={{
                scale: phase === "REVEAL" ? [1, 1.05, 1] : 1,
                borderColor: phase === "REVEAL" ? ["rgba(255,255,255,0.2)", "rgba(59,130,246,0.6)", "rgba(255,255,255,0.2)"] : "rgba(255,255,255,0.2)"
              }}
              transition={{ duration: 0.5 }}
              className="p-4 bg-white/40 rounded-2xl flex flex-col items-center border border-white/20 relative overflow-hidden"
            >
              <AnimatePresence>
                 {phase === "REVEAL" && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.2, 0] }}
                      transition={{ duration: 0.8 }}
                      className="absolute inset-0 bg-blue-400"
                    />
                 )}
              </AnimatePresence>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">
                Final Score
              </span>
              <span className="text-3xl font-black text-slate-800 tabular-nums relative z-10">
                {displayScore}
              </span>
            </motion.div>
            
            <motion.div 
              animate={{
                scale: pulseTrigger > 0 ? [1, 1.05, 1] : 1,
              }}
              transition={{ duration: 0.2 }}
              className="p-4 bg-white/40 rounded-2xl flex flex-col items-center border border-white/20 relative"
            >
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">
                Clearances
              </span>
              <span className="text-3xl font-black text-slate-800 tabular-nums relative z-10">
                {displayMatches}
              </span>
            </motion.div>
          </div>

          <AnimatePresence>
            {phase === "DONE" && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                onClick={onRestart}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-blue-500 shadow-[0_8px_30px_rgba(37,99,235,0.4)] active:scale-95 transition-all outline-none focus:ring-4 focus:ring-blue-400/30 overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent flex items-center animate-[shimmer_2s_infinite]" />
                <span className="relative z-10">
                  {lastActionName === "RESOLVE_SUCCESS" 
                    ? `CONTINUE • NEXT TARGET: ${nextTarget}`
                    : "RETRY ROUND"
                  }
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
  );
};

const ValidationHUD = ({
  pathSums,
  activePaths,
  target,
}: {
  pathSums: Record<string, number>;
  activePaths: Record<string, string[]>;
  target: number;
}) => {
  const activePids = Object.keys(activePaths);
  const sums = Object.values(pathSums);
  const commonSum = sums.length > 0 ? sums[0] : 0;
  const isMatch = commonSum === target;

  return (
    <div className="absolute top-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center gap-2">
      {activePids.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: isMatch ? 1.2 : 1, y: 0 }}
          className={`px-6 py-3 rounded-2xl text-sm font-black shadow-2xl border-2 ${isMatch ? "bg-emerald-500 text-white border-emerald-300" : "bg-white text-slate-900 border-slate-200"}`}
        >
          {commonSum} / {target}
        </motion.div>
      )}
    </div>
  );
};

interface TileComponentProps {
  instanceId: string;
  value: number;
  isSelected: boolean;
  status: "ACTIVE" | "SUCCESS" | null;
  isLocked: boolean;
  pointerIndex: number;
  activePaths: Record<string, string[]>;
  row: number;
  col: number;
  isNew?: boolean;
  spawnFromRow?: number;
  showGravityVisuals?: boolean;
  tileSize: number;
  specialType?: "TIME";
  timeBonus?: number;
  isBottomRow?: boolean;
  lastActionName: string;
}

const Tile: React.FC<TileComponentProps> = ({
  instanceId,
  value,
  isSelected,
  status,
  isLocked,
  pointerIndex,
  activePaths,
  row,
  col,
  isNew,
  spawnFromRow,
  showGravityVisuals,
  tileSize,
  specialType,
  timeBonus,
  isBottomRow,
  lastActionName,
}) => {
// --- VISUAL STATE OWNERSHIP MAP (TILE) ---
// * Border highlight: `color.border` applied via activePaths pointer.
// * Trail linkage: outside Tile component, inside `SpeedGridGame.tsx` canvas render pass.

// --- TILE COMPONENT DEV TRACE ---
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      if ((status as any) === "FAIL") {
        throw new Error("OVERSHOOT_TILE_CONTAMINATION: Tile received FAIL status");
      }
      const el = document.getElementById(`tile-${instanceId}`);
      if (el) {
        const classes = el.outerHTML.toLowerCase();
        // Check for common fail styling classes that stringify
        if (classes.match(/bg-red|bg-rose|bg-\\[#ff0000\\]|overshoot/)) {
          throw new Error("OVERSHOOT_TILE_CONTAMINATION: Tile received forbidden overshoot class");
        }
      }
    }
  });

  const color = POINTER_COLORS[pointerIndex % POINTER_COLORS.length];
  const glowShadow = isSelected ? `0 0 40px ${color.shadow}` : "";
  const selectedColorClass = isSelected
    ? `${color.bg}/40 bg-gradient-to-br from-white/60 to-white/10 text-slate-900 ring-2 ring-white/30`
    : "";
  const statusColors = {
    SUCCESS:
      "bg-emerald-500/40 bg-gradient-to-br from-white/60 to-white/10 text-emerald-950 ring-2 ring-white/40",
  };

  const touchingPointers = Object.entries(activePaths)
    .filter(([, path]) => (path as string[]).includes(instanceId))
    .map(([pid]) => parseInt(pid));
  const isMultiTouched = touchingPointers.length > 1;

  // ── GLASS ELEVATION & BEVEL SHADOW ──────────────────────────────────────
  // Simulates the physical thickness of a glass tile:
  //   inset top + left: specular white highlight (light source from top-left)
  //   inset bottom + right: slight darkening (glass edge away from light)
  //   outer 0 8px 20px: main elevation shadow (floats above board)
  //   outer 0 2px 6px: close contact shadow (grounds the tile)
  // ─────────────────────────────────────────────────────────────────────────
  const baseGlassShadow = [
    "inset 0 1.5px 0 rgba(255,255,255,0.88)",
    "inset 1.5px 0 0 rgba(255,255,255,0.55)",
    "inset 0 -1px 0 rgba(0,0,0,0.10)",
    "inset -1px 0 0 rgba(0,0,0,0.07)",
    "0 8px 24px rgba(0,0,0,0.18)",
    "0 2px 6px rgba(0,0,0,0.10)",
  ].join(", ");

  // Pixel positions — the single source of truth for layout
  const targetX = col * (tileSize + GAP);
  const targetY = row * (tileSize + GAP);

  // Apply toggles
  const disableAnimations = row === 0 && col === 0;

  // For spawned tiles: start stacked above the board at the correct slot height.
  const spawnY =
    isNew && spawnFromRow != null ? spawnFromRow * (tileSize + GAP) : undefined;

  if (specialType === "TIME") {
    return (
      <motion.div
        id={`tile-${instanceId}`}
        initial={
          isNew && spawnY != null
            ? { x: targetX, y: spawnY, opacity: 0, scale: 0.9 }
            : false
        }
        animate={{
          x: targetX,
          y: targetY,
          opacity: 1,
          scale: 1,
          boxShadow: isBottomRow 
            ? "0 12px 28px rgba(0,0,0,0.3), 0 0 25px rgba(34,211,238,0.6)" 
            : isSelected 
              ? `0 12px 24px rgba(0,0,0,0.25)${glowShadow ? ', ' + glowShadow : ''}` 
              : "0 8px 16px rgba(0,0,0,0.25)",
        }}
        exit={{ scale: 0.4, opacity: 0, transition: { duration: 0.12 } }}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: tileSize,
          height: tileSize,
          borderRadius: TILE_RADIUS,
        }}
        transition={{
          x: { type: "spring", damping: 28, stiffness: 380 },
          y: { type: "spring", damping: 28, stiffness: 380 },
          scale: { type: "spring", damping: 14, stiffness: 500 },
          opacity: { duration: 0.18 },
        }}
        className={`
          flex items-center justify-center border border-white/20 border-t-white/80 border-l-white/80 transform-gpu relative overflow-hidden
          ${
            isBottomRow
              ? "bg-cyan-400/40 bg-gradient-to-br from-white/50 to-white/5"
              : "bg-cyan-900/40 bg-gradient-to-br from-white/50 to-white/5"
          }
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
        {isBottomRow ? (
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 ring-2 ring-white/50"
            style={{ borderRadius: TILE_RADIUS }}
          />
        ) : (
          <motion.div
            animate={{ y: ["-100%", "200%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent w-full h-[50%]"
          />
        )}
        <Clock
          className={`w-1/2 h-1/2 relative z-10 ${isBottomRow ? "text-cyan-950" : "text-cyan-400"}`}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      id={`tile-${instanceId}`}
      initial={
        isNew && spawnY != null
          ? { x: targetX, y: spawnY, opacity: 0, scale: 0.9 }
          : false
      }
      animate={{
        x: targetX,
        y: targetY,
        opacity: 1,
        scale:
          status === "SUCCESS" && !disableAnimations ? 1.1 : isSelected && (status === "ACTIVE" || !status) && !disableAnimations ? 0.97 : 1,
        boxShadow: isMultiTouched
          ? `0 0 30px rgba(255,255,255,1), ${baseGlassShadow}`
          : isSelected && (status === "ACTIVE" || !status)
            ? `0 0 40px ${color.shadow}, ${baseGlassShadow}`
            : baseGlassShadow,
      }}
      exit={{ scale: 0.4, opacity: 0, transition: { duration: 0.12 } }}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: tileSize,
        height: tileSize,
        borderRadius: TILE_RADIUS,
      }}
      transition={disableAnimations ? { duration: 0 } : {
        x: { type: "spring", damping: 28, stiffness: 380 },
        y: { type: "spring", damping: 28, stiffness: 380 },
        scale: { type: "spring", damping: 14, stiffness: 500 },
        opacity: { duration: 0.18 },
      }}
      className={`
        flex items-center justify-center text-4xl font-black border relative overflow-hidden transform-gpu
        ${
          isSelected
            ? `${status === "SUCCESS" ? statusColors.SUCCESS : selectedColorClass}`
            : value
              ? TILE_COLORS[value as keyof typeof TILE_COLORS]
              : "bg-white/10 bg-gradient-to-br from-white/30 to-white/5 text-slate-400"
        }
        ${isLocked ? "grayscale opacity-50" : ""}
        ${showGravityVisuals && isNew ? "ring-2 ring-yellow-400/80" : ""}
      `}
    >
      {/* Primary glass sheen: top-left light catch, fades to clear bottom-right */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent pointer-events-none" />
      {/* Top specular ridge: mimics the bright edge of thick glass */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-white/90 pointer-events-none" />
      {/* Left specular edge: secondary light catch */}
      <div className="absolute top-0 left-0 bottom-0 w-[1px] bg-white/50 pointer-events-none" />
      {/* Bottom refraction shadow: glass is thicker at edges, bends light downward */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{ background: "rgba(0,0,0,0.08)" }}
      />
      {showGravityVisuals && isNew && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-950 text-[7px] font-black px-1 rounded whitespace-nowrap z-50">
          ↓{spawnFromRow}
        </div>
      )}

      <motion.span
        key={value}
        initial={{ scale: 0.6 }}
        animate={{ scale: isSelected && !disableAnimations ? 1.15 : 1 }}
        className="relative z-10 select-none"
      >
        {value}
      </motion.span>

      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 1.9, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={disableAnimations ? { duration: 0 } : { duration: 0.28 }}
            className={`absolute inset-0 border-4 ${
              isMultiTouched ? "border-white" : color.border
            } pointer-events-none`}
            style={{ borderRadius: TILE_RADIUS }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const PerformanceOverlay = ({ state }: { state: SpeedGridState }) => {
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);
  const renderCountRef = useRef(0);
  renderCountRef.current++;

  useEffect(() => {
    let frameCount = 0;
    let t0 = performance.now();
    let rafId: number;
    let lastFrameTime = performance.now();

    const loop = () => {
      const t1 = performance.now();
      frameCount++;
      setFrameTime(t1 - lastFrameTime);
      lastFrameTime = t1;

      if (t1 - t0 >= 1000) {
        setFps(Math.round((frameCount * 1000) / (t1 - t0)));
        frameCount = 0;
        t0 = t1;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  if (!state.settings.devMode) return null;

  const tileCount = state.board.flat().filter(Boolean).length;
  const particleCount = state.timeTileBursts?.length || 0;
  const pointerCount = Object.keys(state.activePaths).length;

  return (
    <div className="fixed top-2 right-2 bg-black/80 backdrop-blur-md text-green-400 font-mono text-[9px] p-2 rounded z-[500] pointer-events-none w-48 shadow-lg border border-white/10 uppercase tracking-widest divide-y divide-white/10">
      <div className="flex justify-between py-1">
        <span className="text-white/50">FPS:</span>
        <span className={fps >= 55 ? 'text-green-400' : 'text-red-400'}>{fps}</span>
      </div>
      <div className="flex justify-between py-1">
        <span className="text-white/50">Frame Ms:</span>
        <span>{frameTime.toFixed(1)}</span>
      </div>
      <div className="flex justify-between py-1">
        <span className="text-white/50">Pointers:</span>
        <span>{pointerCount}</span>
      </div>
      <div className="flex justify-between py-1">
        <span className="text-white/50">Gravity Ms:</span>
        <span>{state.lastGravityTrace?.durationMs ? state.lastGravityTrace.durationMs.toFixed(1) : '0.0'}*</span>
      </div>
      <div className="flex justify-between py-1">
        <span className="text-white/50">Renders:</span>
        <span>{renderCountRef.current}</span>
      </div>
      <div className="flex justify-between py-1">
        <span className="text-white/50">Tiles:</span>
        <span>{tileCount}</span>
      </div>
      <div className="flex justify-between py-1">
        <span className="text-white/50">Particles:</span>
        <span>{particleCount}</span>
      </div>
    </div>
  );
};

const ParticlePool = ({ bursts, tileSize, cols }: { bursts: any[], tileSize: number, cols: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<HTMLDivElement[]>([]);
  const lastProcessedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!containerRef.current || tileSize <= 0) return;
    
    // Ensure 10 pool elements exist
    while (elementsRef.current.length < 10) {
      const el = document.createElement("div");
      el.className = "absolute z-50 flex items-center justify-center font-black text-white text-3xl tabular-nums pointer-events-none drop-shadow-[0_0_12px_rgba(34,211,238,1)]";
      el.style.transform = "translate(-50%, -50%)";
      el.style.opacity = "0";
      
      const innerBlur = document.createElement("span");
      innerBlur.className = "absolute inset-0 text-cyan-400 blur-[4px]";
      
      const innerFront = document.createElement("span");
      innerFront.className = "relative z-10";
      
      const wrapper = document.createElement("div");
      wrapper.className = "relative";
      wrapper.appendChild(innerBlur);
      wrapper.appendChild(innerFront);
      el.appendChild(wrapper);
      
      containerRef.current.appendChild(el);
      elementsRef.current.push(el);
    }

    const unhandled = bursts.filter(b => !lastProcessedRef.current.has(b.id));
    if (unhandled.length === 0) return;

    unhandled.forEach((burst, idx) => {
      lastProcessedRef.current.add(burst.id);
      
      const elIndex = (lastProcessedRef.current.size - 1) % 10;
      const el = elementsRef.current[elIndex];
      if (!el) return;

      const innerBlur = el.querySelector("span:first-child");
      const innerFront = el.querySelector("span:last-child");
      if (innerBlur) innerBlur.textContent = `+${burst.amount}`;
      if (innerFront) innerFront.textContent = `+${burst.amount}`;

      const tx = burst.col * (tileSize + GAP) + tileSize / 2;
      const ty = burst.row * (tileSize + GAP) + tileSize / 2;
      const targetX = (cols * (tileSize + GAP)) / 2;
      const targetY = -150;

      el.animate([
        { left: `${tx}px`, top: `${ty}px`, opacity: 1, transform: "translate(-50%, -50%) scale(0.5) rotate(0deg)" },
        { left: `${tx + (Math.random() * 60 - 30)}px`, top: `${ty - 60}px`, opacity: 1, transform: `translate(-50%, -50%) scale(1.8) rotate(${(Math.random() - 0.5) * 90}deg)`, offset: 0.4 },
        { left: `${targetX}px`, top: `${targetY}px`, opacity: 0, transform: "translate(-50%, -50%) scale(0.5) rotate(0deg)" }
      ], {
        duration: 650,
        easing: "ease-in",
        fill: "forwards"
      });
    });
    
    // Prune the set
    if (lastProcessedRef.current.size > 50) {
      const recentIds = new Set(bursts.map(b => b.id));
      for (const id of lastProcessedRef.current) {
        if (!recentIds.has(id)) lastProcessedRef.current.delete(id);
      }
    }

  }, [bursts, tileSize, cols]);

  return <div ref={containerRef} className="absolute inset-0 z-50 pointer-events-none" />;
};

const HUD = ({
  score,
  timeLeft,
  lastScoreDelta,
  addedTimeDisplay,
  target,
  lastEquation,
  isDragging,
}: {
  score: number;
  timeLeft: number;
  lastScoreDelta: number;
  addedTimeDisplay?: number;
  target: number;
  lastEquation?: string;
  isDragging?: boolean;
}) => (
  <div className="flex flex-col z-50 w-full relative p-2 sm:p-4 pb-0 items-center">
    <div className={`grid grid-cols-3 w-full max-w-xl gap-2 p-1 rounded-2xl ${GLASS_CLASSES}`}>
      <div className="flex flex-col items-center justify-center p-2 bg-white/40 rounded-xl border border-white/20">
        <span className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
          Target
        </span>
        <span className="text-xl sm:text-2xl font-black text-blue-600 leading-none">
          {target}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center p-2 bg-white/40 rounded-xl border border-white/20 relative overflow-hidden">
        <div className="flex flex-col items-center -translate-y-1 sm:-translate-y-1.5">
          <span className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
            Time
          </span>
          <motion.div
            key={`time-${addedTimeDisplay || 0}-${Math.ceil(timeLeft)}`}
            className={`text-xl sm:text-2xl font-black tabular-nums leading-none ${timeLeft < 10 ? "text-rose-500 animate-pulse" : "text-slate-800"}`}
          >
            {Math.ceil(timeLeft)}
            <AnimatePresence>
              {addedTimeDisplay && addedTimeDisplay > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ scale: 1.2, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-0 right-1 text-[9px] sm:text-[10px] font-black text-cyan-500"
                >
                  +{addedTimeDisplay}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-2 bg-white/40 rounded-xl border border-white/20">
        <span className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
          Score
        </span>
        <motion.div
          key={`score-${score}`}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-xl sm:text-2xl font-black text-slate-800 leading-none relative"
        >
          {score}
          <AnimatePresence>
            {lastScoreDelta > 0 && (
              <motion.span
                animate={{ y: -15, opacity: 0 }}
                className="absolute -top-3 -right-3 text-[9px] text-emerald-500 font-black"
              >
                +{lastScoreDelta}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>

    {/* Equation Pill */}
    {lastEquation && (
      <div 
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-20"
        style={{ top: 'calc(100% - 15px)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`px-6 py-2 rounded-full border backdrop-blur-md transition-all duration-300 ${
            isDragging 
              ? "bg-slate-800/30 border-white/10 text-white/70 shadow-sm" 
              : "bg-slate-800/75 border-white/20 text-white shadow-lg"
          }`}
        >
          <span className="text-xs sm:text-sm font-black tracking-widest whitespace-nowrap uppercase drop-shadow-sm">
            {lastEquation}
          </span>
        </motion.div>
      </div>
    )}
  </div>
);

const GridBoard = ({
  board,
  rows,
  cols,
  selectionIds,
  activePaths,
  pathStatus,
  lastActionName,
  isLocked,
  showGravityVisuals,
  tileSize,
  dispatch,
}: {
  board: (TileProps | null)[][];
  rows: number;
  cols: number;
  selectionIds: string[];
  activePaths: Record<string, string[]>;
  pathStatus: Record<string, "ACTIVE" | "SUCCESS">;
  lastActionName: string;
  isLocked: boolean;
  showGravityVisuals?: boolean;
  tileSize: number;
  dispatch: React.Dispatch<any>;
}) => {
  // Exact pixel dimensions — no padding, no rounding artifacts
  const boardW = cols * (tileSize + GAP) - GAP;
  const boardH = rows * (tileSize + GAP) - GAP;

  return (
    <div
      className={`bg-white rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100 transition-all duration-500 flex items-center justify-center p-[2px] ${
        isLocked ? "opacity-40 grayscale-[0.2]" : ""
      }`}
      style={{
        position: "relative",
        width: boardW + BOARD_PADDING * 2,
        height: boardH + BOARD_PADDING * 2,
      }}
    >
      <div style={{ position: "relative", width: boardW, height: boardH }}>
        <AnimatePresence>
          {board
            .flat()
            .filter(Boolean)
            .map((tile) => {
              const isSelected =
                !!tile && selectionIds.includes(tile.instanceId);

              let tileStatus: "ACTIVE" | "SUCCESS" | null = null;
              let pointerIndex = 0;

              if (tile && isSelected) {
                const activePids = Object.keys(activePaths);
                const pid = [...activePids]
                  .reverse()
                  .find((id) => activePaths[id]?.includes(tile.instanceId));
                if (pid) {
                  tileStatus = pathStatus[pid] || "ACTIVE";
                  pointerIndex = activePids.indexOf(pid);
                }
              }

              return (
                <Tile
                  key={tile!.instanceId}
                  instanceId={tile!.instanceId}
                  value={tile!.value}
                  isSelected={isSelected}
                  status={tileStatus}
                  isLocked={isLocked}
                  pointerIndex={pointerIndex}
                  activePaths={activePaths}
                  row={tile!.row}
                  col={tile!.col}
                  isNew={tile!.isNew}
                  spawnFromRow={tile!.spawnFromRow}
                  showGravityVisuals={showGravityVisuals}
                  tileSize={tileSize}
                  specialType={tile!.specialType}
                  timeBonus={tile!.timeBonus}
                  isBottomRow={tile!.row === rows - 1}
                  lastActionName={lastActionName}
                />
              );
            })}
        </AnimatePresence>
      </div>
    </div>
  );
};

const OvershootFeedbackLayer = ({
  feedback,
  tileSize,
  devMode,
}: {
  feedback: {
    id: string;
    pointerId: string | number;
    pathTileIds: string[];
    pathCenters: { x: number; y: number }[];
    total: number;
    target: number;
    createdAt: number;
    expiresAt: number;
  };
  tileSize: number;
  devMode: boolean;
}) => {
  if (tileSize <= 0) return null;

  const tilePitch = tileSize + GAP;
  const half = tileSize / 2;
  
  const points = feedback.pathCenters.map(p => {
    const px = p.x * tilePitch + half + BOARD_PADDING;
    const py = p.y * tilePitch + half + BOARD_PADDING;
    return `${px},${py}`;
  }).join(' ');

  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
       {devMode && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: [0.9, 1.1, 1], opacity: 1 }}
               exit={{ scale: 1.1, opacity: 0 }}
               className="bg-red-600/95 text-white font-mono text-[10px] sm:text-xs px-4 py-2 rounded-xl shadow-2xl uppercase font-black tracking-widest text-center"
            >
              TOO MUCH!<br/>
              {feedback.total} &gt; {feedback.target}
            </motion.div>
         </div>
       )}

       {points && (
         <svg className="absolute inset-0 w-full h-full overflow-visible">
            <motion.polyline
               points={points}
               fill="none"
               stroke="#ef4444" // red-500
               strokeWidth="20"
               strokeLinecap="round"
               strokeLinejoin="round"
               initial={{ opacity: 0.8, pathLength: 0 }}
               animate={{ 
                  opacity: [0.8, 0], 
                  pathLength: 1,
                  strokeWidth: [20, 24, 10]
               }}
               transition={{ duration: 0.24, ease: "easeOut" }}
            />
         </svg>
       )}
    </div>
  );
};

const SuccessFeedbackLayer = ({
  feedback,
  tileSize
}: {
  feedback: {
    id: string;
    pathCenters: { x: number; y: number }[];
    total: number;
    target: number;
    createdAt: number;
    expiresAt: number;
  };
  tileSize: number;
}) => {
  if (tileSize <= 0) return null;

  const tilePitch = tileSize + GAP;
  const half = tileSize / 2;
  
  const points = feedback.pathCenters.map(p => {
    const px = p.x * tilePitch + half + BOARD_PADDING;
    const py = p.y * tilePitch + half + BOARD_PADDING;
    return `${px},${py}`;
  }).join(' ');

  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
       {points && (
         <svg className="absolute inset-0 w-full h-full overflow-visible">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {/* Glow backing */}
            <motion.polyline
               points={points}
               fill="none"
               stroke="#10b981"
               strokeWidth="28"
               strokeLinecap="round"
               strokeLinejoin="round"
               initial={{ opacity: 0 }}
               animate={{ opacity: [0, 0.4, 0] }}
               transition={{ duration: 0.5 }}
               style={{ filter: 'url(#glow)' }}
            />
            {/* Main line */}
            <motion.polyline
               points={points}
               fill="none"
               stroke="#10b981" // emerald-500
               strokeWidth="16"
               strokeLinecap="round"
               strokeLinejoin="round"
               initial={{ opacity: 1, pathLength: 0 }}
               animate={{ opacity: 0, pathLength: 1 }}
               transition={{ duration: 0.5, ease: "easeInOut" }}
            />
         </svg>
       )}
    </div>
  );
};

export default function SpeedGridGame({ onBack }: { onBack?: () => void }) {
  const [state, dispatch] = useReducer(speedGridReducer, null, () =>
    SpeedGridRules.generateInitialState({
      profile: PRACTICE_PROFILES[DEFAULT_PROFILE_ID],
      seed: Date.now(),
      mode: "normal",
    }),
  );

  const [isDockExpanded, setIsDockExpanded] = useState(false);
  const [tileSize, setTileSize] = useState(() => {
    // Initial size estimation to prevent "resize jump" on mount
    if (typeof window === "undefined") return 60;
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Estimate based on current grid config (approx h offset for HUD/Header + BottomNav)
    return Math.floor(Math.min((w - 16) / state.cols, (h - 220) / state.rows));
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePointersRef = useRef<Set<string>>(new Set());
  const cleanupTimersRef = useRef<Record<string, number>>({});
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  const pointerColorMapRef = useRef<Map<string, number>>(new Map());

  const handleRestart = () => {
    SoundService.playButtonTap(state.settings.soundEnabled);
    if (state.phase === "ROUND_END") {
      dispatch({ type: "START_NEXT_ROUND" });
    } else {
      dispatch({
        type: "RESTART",
        config: {
          profile: PRACTICE_PROFILES[DEFAULT_PROFILE_ID],
          seed: Date.now(),
          mode: "normal",
        },
      });
    }
  };

  const getPointerColor = (pid: string) => {
    if (!pointerColorMapRef.current.has(pid)) {
      const usedIndices = new Set(pointerColorMapRef.current.values());
      let nextIdx = 0;
      while (usedIndices.has(nextIdx)) nextIdx++;
      pointerColorMapRef.current.set(pid, nextIdx % POINTER_COLORS.length);
    }
    return POINTER_COLORS[pointerColorMapRef.current.get(pid)!];
  };

  const drawAllPaths = () => {
    if (!canvasRef.current || !boardRef.current || tileSize <= 0) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    if (canvasRef.current.width !== boardRect.width) canvasRef.current.width = boardRect.width;
    if (canvasRef.current.height !== boardRect.height) canvasRef.current.height = boardRect.height;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    const tilePitch = tileSize + GAP;
    const half = tileSize / 2;
    const padding = BOARD_PADDING;

    // STEP 2: Render standard paths
    Object.entries(state.activePaths).forEach(([pid, path]) => {
      const status = state.pathStatus[pid];
      const typedPath = path as string[];
      if (typedPath.length < 1) return;

      const color = getPointerColor(pid);
      ctx.beginPath();

      if (status === "SUCCESS") {
        ctx.strokeStyle = "#10b981"; // emerald-500
        ctx.lineWidth = 18;
        ctx.shadowBlur = 30;
        ctx.shadowColor = "rgba(16,185,129,0.8)";
      } else {
        ctx.strokeStyle = color.main;
        ctx.lineWidth = 10;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color.shadow;
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const points: {x: number, y: number}[] = [];
      typedPath.forEach((tileId) => {
        const liveTile = state.board
          .flat()
          .find((t) => t?.instanceId === tileId);
        if (liveTile) {
           points.push({
             x: liveTile.col * tilePitch + half + padding,
             y: liveTile.row * tilePitch + half + padding
           });
        }
      });

      // Add live finger tracking to trail for "liquid feel"
      if (status !== "SUCCESS" && activePointersRef.current.has(pid)) {
        const pos = state.lastPointerPos[pid];
        if (pos && boardRef.current) {
          const rect = boardRef.current.getBoundingClientRect();
          points.push({
            x: pos.ux * rect.width,
            y: pos.uy * rect.height
          });
        }
      }

      if (points.length < 2) {
        ctx.shadowBlur = 0;
        return;
      }

      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.stroke();
    });
  };

  useEffect(() => {
    let rafId: number;
    const render = () => {
      drawAllPaths();
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [state.activePaths, state.pathStatus, state.lastPointerPos, tileSize]);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const { width, height } = container.getBoundingClientRect();
      const sideMargin = 2; // Minimal horizontal padding for mobile maximization
      const safeWidth = Math.max(0, width - sideMargin * 2);
      const safeHeight = Math.max(0, height - sideMargin * 2);

      const maxTileW = (safeWidth - (state.cols - 1) * GAP) / state.cols;
      const maxTileH = (safeHeight - (state.rows - 1) * GAP) / state.rows;

      const calcTileSize = Math.max(
        10, // Ensure a minimum tile size
        Math.floor(Math.min(maxTileW, maxTileH)),
      );

      setTileSize(calcTileSize);
    };

    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    updateSize();

    window.addEventListener("resize", updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [state.rows, state.cols]);

  useEffect(() => {
    let lastTime = Date.now();
    let rafId: number;
    const tick = () => {
      const now = Date.now();
      if (state.isTimerRunning && state.phase === "PLAY") {
        dispatch({ type: "TICK", deltaMs: now - lastTime });
      }
      lastTime = now;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [state.isTimerRunning, state.phase]);

  useEffect(() => {
    if (state.settings.devMode && boardRef.current && tileSize > 0) {
      // Validate after layout
      const timer = setTimeout(() => {
        if (!boardRef.current) return;
        const rect = boardRef.current.getBoundingClientRect();

        if (rect.bottom > window.innerHeight) {
          console.error(
            `MOBILE_OVERFLOW_ERROR: Board bottom (${rect.bottom}) exceeds viewport (${window.innerHeight})`,
          );
        }
        if (rect.right > window.innerWidth) {
          console.error(
            `MOBILE_WIDTH_OVERFLOW: Board right (${rect.right}) exceeds viewport (${window.innerWidth})`,
          );
        }

        const expectedW = state.cols * (tileSize + GAP) - GAP;
        const expectedH = state.rows * (tileSize + GAP) - GAP;
        if (
          boardRef.current.scrollWidth > expectedW ||
          boardRef.current.scrollHeight > expectedH
        ) {
          console.error(
            `TILE_CLIPPING_ERROR: Board internal scroll bounds exceed logical bounds`,
          );
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [tileSize, state.settings.devMode, state.rows, state.cols]);

  const prevTotalTilesRef = useRef<number>(0);
  useEffect(() => {
    const totalTiles = Object.values(state.activePaths).reduce((acc, path) => acc + path.length, 0);
    if (totalTiles > prevTotalTilesRef.current) {
      SoundService.playTick(state.settings.soundEnabled);
    }
    prevTotalTilesRef.current = totalTiles;
  }, [state.activePaths, state.settings.soundEnabled]);

  useEffect(() => {
    Object.entries(state.pathStatus).forEach(([pid, status]) => {
      const existingTimer = cleanupTimersRef.current[pid];
      
      if (status === "SUCCESS" && !existingTimer) {
        const delay = 350;
        cleanupTimersRef.current[pid] = window.setTimeout(() => {
          dispatch({ type: "RESOLVE_SUCCESSFUL_PATH", pointerId: pid });
          delete cleanupTimersRef.current[pid];
        }, delay);
      } else if (status === "ACTIVE" && existingTimer) {
        clearTimeout(existingTimer);
        delete cleanupTimersRef.current[pid];
      }
    });

    Object.keys(cleanupTimersRef.current).forEach((pid) => {
      if (!state.pathStatus[pid]) {
        clearTimeout(cleanupTimersRef.current[pid]);
        delete cleanupTimersRef.current[pid];
      }
    });
  }, [state.pathStatus, dispatch]);

  useEffect(() => {
    if (state.overshootFeedback) {
      HapticService.playOvershoot(state.settings.hapticsEnabled);
      SoundService.playOvershoot(state.settings.soundEnabled);
      const timer = window.setTimeout(() => {
        dispatch({ type: "EXPIRE_OVERSHOOT" });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [state.overshootFeedback, dispatch, state.settings.hapticsEnabled, state.settings.soundEnabled]);

  useEffect(() => {
    if (state.successFeedback) {
      HapticService.playSuccess(state.settings.hapticsEnabled);
      SoundService.playSuccess(state.settings.soundEnabled);
      const timer = window.setTimeout(() => {
        dispatch({ type: "EXPIRE_SUCCESS" });
      }, 320);
      return () => clearTimeout(timer);
    }
  }, [state.successFeedback, dispatch, state.settings.hapticsEnabled, state.settings.soundEnabled]);

  const prevTimeTileIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (state.timeTileBursts && state.timeTileBursts.length > 0) {
      const latestBurst = state.timeTileBursts[state.timeTileBursts.length - 1];
      if (latestBurst.id !== prevTimeTileIdRef.current) {
        prevTimeTileIdRef.current = latestBurst.id;
        HapticService.playTimeCollect(state.settings.hapticsEnabled);
        SoundService.playTimeCollect(state.settings.soundEnabled);
      }
    }
  }, [state.timeTileBursts, state.settings.hapticsEnabled, state.settings.soundEnabled]);

  useEffect(() => {
    return () => { Object.values(cleanupTimersRef.current).forEach((t) => clearTimeout(t)) };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    SoundService.unlock();
    if (state.phase === "ROUND_END") return;
    const pid = e.pointerId.toString();
    activePointersRef.current.add(pid);

    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      const padding = BOARD_PADDING;
      const innerWidth = rect.width - padding * 2;
      const innerHeight = rect.height - padding * 2;
      
      const rawUx = (e.clientX - (rect.left + padding)) / innerWidth;
      const rawUy = (e.clientY - (rect.top + padding)) / innerHeight;

      const isOutside = rawUx < 0 || rawUx >= 1 || rawUy < 0 || rawUy >= 1;
      const ux = Math.max(0, Math.min(0.999, rawUx));
      const uy = Math.max(0, Math.min(0.999, rawUy));

      let r: number | undefined = undefined;
      let c: number | undefined = undefined;
      let tileId: string | undefined = undefined;

      if (!isOutside) {
        r = Math.floor(uy * state.rows);
        c = Math.floor(ux * state.cols);
        tileId = state.board[r]?.[c]?.instanceId;
      }

      dispatch({
        type: "GESTURE_START_POINT",
        pointerId: pid,
        ux,
        uy,
        row: r,
        col: c,
        tileId,
      });
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (state.phase !== "PLAY") return;
    const pid = e.pointerId.toString();
    if (!activePointersRef.current.has(pid)) return;

    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      const padding = BOARD_PADDING;
      const innerWidth = rect.width - padding * 2;
      const innerHeight = rect.height - padding * 2;
      
      const rawUx = (e.clientX - (rect.left + padding)) / innerWidth;
      const rawUy = (e.clientY - (rect.top + padding)) / innerHeight;

      const isOutside = rawUx < 0 || rawUx >= 1 || rawUy < 0 || rawUy >= 1;
      const ux = Math.max(0, Math.min(0.999, rawUx));
      const uy = Math.max(0, Math.min(0.999, rawUy));

      let r: number | undefined = undefined;
      let c: number | undefined = undefined;
      let tileId: string | undefined = undefined;

      if (!isOutside) {
        const lastTile = state.lastTileByPointer[pid];

        if (lastTile) {
          // ── ANGLE-BASED 8-WAY SNAP ───────────────────────────────────────
          // Compute the pixel center of the last confirmed tile, then measure
          // the angle from it to the current pointer. Snap to the nearest
          // 45° sector to determine which neighbor to move into.
          // This replaces floor()-based cell detection which fails at corners.
          const cellStride = tileSize + GAP;
          const cx = rect.left + BOARD_PADDING + lastTile.col * cellStride + tileSize / 2;
          const cy = rect.top  + BOARD_PADDING + lastTile.row * cellStride + tileSize / 2;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          const dist = Math.hypot(dx, dy);

          // Dead zone: finger must move at least 25% of a tile before we
          // commit to a direction. Prevents jitter registering false moves.
          if (dist >= tileSize * 0.25) {
            const { dRow, dCol } = snapTo8Way(dx, dy);
            const nr = lastTile.row + dRow;
            const nc = lastTile.col + dCol;
            if (nr >= 0 && nr < state.rows && nc >= 0 && nc < state.cols) {
              r       = nr;
              c       = nc;
              tileId  = state.board[r]?.[c]?.instanceId;
            }
          }
          // If dist < threshold: r/c/tileId stay undefined.
          // The reducer sees no new tile coords → no movement. Correct behavior.
          // ─────────────────────────────────────────────────────────────────
        } else {
          // Fallback: no last tile yet (gesture just started, reducer hasn't
          // confirmed the first tile back yet). Use floor-based resolution —
          // same as the original code. This path is rarely hit.
          r      = Math.floor(uy * state.rows);
          c      = Math.floor(ux * state.cols);
          tileId = state.board[r]?.[c]?.instanceId;
        }
      }

      dispatch({
        type: "GESTURE_MOVE",
        pointerId: pid,
        ux,
        uy,
        row: r,
        col: c,
        tileId,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const pid = e.pointerId.toString();
    activePointersRef.current.delete(pid);
    dispatch({ type: "GESTURE_END", pointerId: pid });
  };

  return (
    <div
      className="flex flex-col w-full h-[100dvh] font-sans touch-none overflow-hidden relative pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
      style={{
        background:
          "linear-gradient(145deg, #c7d2fe 0%, #a5f3fc 28%, #bbf7d0 52%, #fde68a 76%, #fbcfe8 100%)",
      }}
    >
      <AnimatePresence>
        {isTraceModalOpen && state.lastGravityTrace && (
          <ForensicTraceModal
            trace={state.lastGravityTrace}
            onClose={() => setIsTraceModalOpen(false)}
          />
        )}
        {state.gravityReplay?.active && state.lastGravityTrace && (
          <GravityReplayOverlay
            trace={state.lastGravityTrace}
            replay={state.gravityReplay}
            dispatch={dispatch}
            tileSize={tileSize}
          />
        )}
      </AnimatePresence>

      <PerformanceOverlay state={state} />
      <HUD
        score={state.score}
        timeLeft={state.timeLeft}
        lastScoreDelta={state.lastScoreDelta}
        addedTimeDisplay={state.addedTimeDisplay}
        target={state.target}
        lastEquation={state.lastEquation}
        isDragging={Object.keys(state.activePaths).length > 0}
      />

      <SettingsModal
        isOpen={state.ui.settingsOpen}
        onClose={() => dispatch({ type: "CLOSE_SETTINGS" })}
        onRestart={handleRestart}
        state={state}
        dispatch={dispatch}
      />

      {state.settings.diagnosticMode && (
        <ValidationHUD
          pathSums={state.pathSums}
          activePaths={state.activePaths}
          target={state.target}
        />
      )}

      <main
        ref={containerRef}
        className="flex-1 flex flex-col items-center justify-center min-h-0 min-w-0 w-full relative pt-6 sm:pt-8 px-1 pb-4 sm:pb-6"
      >
        {/* Board is only mounted once tileSize is known so tiles never flash from (0,0) */}
        {tileSize > 0 && (
          <div
            ref={boardRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            className="relative touch-none select-none z-10 -translate-y-2"
            style={{
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
              // Exact tile area — accounts for board internal padding
              width: state.cols * (tileSize + GAP) - GAP + BOARD_PADDING * 2,
              height: state.rows * (tileSize + GAP) - GAP + BOARD_PADDING * 2,
            }}
          >
            <GridBoard
              board={state.board}
              rows={state.rows}
              cols={state.cols}
              selectionIds={state.selectionIds}
              activePaths={state.activePaths}
              pathStatus={state.pathStatus}
              lastActionName={state.lastActionName}
              isLocked={state.phase === "ROUND_END"}
              showGravityVisuals={state.settings.showGravityVisuals}
              tileSize={tileSize}
              dispatch={dispatch}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 z-30 pointer-events-none"
            />
            {/* Particle Overlay */}
            <ParticlePool bursts={state.timeTileBursts} tileSize={tileSize} cols={state.cols} />
            {state.overshootFeedback && (
              <OvershootFeedbackLayer feedback={state.overshootFeedback} tileSize={tileSize} devMode={state.settings.devMode} />
            )}
            {state.successFeedback && (
              <SuccessFeedbackLayer feedback={state.successFeedback} tileSize={tileSize} />
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation Row */}
      <div className="shrink-0 w-full z-50 pointer-events-none flex flex-col items-center justify-start pb-[max(env(safe-area-inset-bottom),8px)] h-12 sm:h-14">
        <div className="relative flex flex-col items-center w-full max-w-sm -mt-[5px]">
          <AnimatePresence>
            {isDockExpanded && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2">
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  className={`flex items-center justify-center gap-2 sm:gap-4 p-2 px-3 sm:px-4 rounded-3xl pointer-events-auto origin-bottom ${GLASS_CLASSES}`}
                >
              <button
                onClick={() => {
                  SoundService.playButtonTap(state.settings.soundEnabled);
                  onBack?.();
                }}
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl ${CONTROL_GLASS}`}
              >
                <Home className="w-5 h-5 text-slate-600" />
              </button>

              <div className="flex gap-2 bg-black/5 p-1 rounded-2xl border border-black/5">
                {state.settings.devMode && (
                  <button
                    onClick={() => {
                      const debugTrace = `COPY TARGET DEBUG
Current target: ${state.target} (Index: ${state.currentTargetIndex})
History: ${JSON.stringify(state.targetHistory)}
Board solvable for: ${state.target}
Profile targets (+ pool): ${state.activeProfile.targets.length}
Target mode: ${state.settings.targetSource}
Phase: ${state.phase}
Matches cleared: ${state.matchesCleared}
Last action: ${state.lastActionName}`;
                      console.log(debugTrace);
                      alert(debugTrace);
                    }}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-teal-400 text-teal-950 rounded-xl shadow-sm active:scale-95"
                  >
                    <Target className="w-5 h-5" />
                  </button>
                )}
                {state.settings.devMode && state.lastGravityTrace && (
                  <button
                    onClick={() => setIsTraceModalOpen(true)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-yellow-400 text-yellow-950 rounded-xl shadow-sm active:scale-95`}
                  >
                    <Zap className="w-5 h-5 fill-current" />
                  </button>
                )}
                <button
                  onClick={() => {
                    SoundService.playButtonTap(state.settings.soundEnabled);
                    dispatch({ type: "PREV_TARGET" });
                  }}
                  className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl ${CONTROL_GLASS}`}
                >
                  <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                </button>
                <button
                  onClick={() => {
                    SoundService.playButtonTap(state.settings.soundEnabled);
                    dispatch({ type: "REFRESH_BOARD_SAME_TARGET" });
                  }}
                  className={`w-12 h-10 sm:w-14 sm:h-12 flex items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all outline-none border border-blue-400`}
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => {
                    SoundService.playButtonTap(state.settings.soundEnabled);
                    dispatch({ type: "NEXT_TARGET" });
                  }}
                  className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl ${CONTROL_GLASS}`}
                >
                  <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                </button>
              </div>

              <button
                onClick={() => {
                  SoundService.playButtonTap(state.settings.soundEnabled);
                  dispatch({ type: "OPEN_SETTINGS" });
                  setIsDockExpanded(false);
                }}
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl ${CONTROL_GLASS}`}
              >
                <Settings className="w-5 h-5 text-slate-600" />
              </button>
            </motion.div>
              </div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsDockExpanded(!isDockExpanded)}
            className={`pointer-events-auto flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl transition-all duration-300 active:scale-95 ${
              isDockExpanded 
                ? "bg-slate-800 text-white" 
                : "bg-white/80 backdrop-blur-md border border-white/60 text-slate-600 hover:bg-white/90"
            } ${Object.keys(state.activePaths).length > 0 && !isDockExpanded ? "opacity-30" : "opacity-100"}`}
          >
            {isDockExpanded ? <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8" /> : <Settings className="w-6 h-6 sm:w-8 sm:h-8" />}
          </button>
        </div>
      </div>

      <RoundEndOverlay
        isOpen={state.phase === "ROUND_END"}
        score={state.score}
        matchesCleared={state.matchesCleared}
        nextTarget={state.target}
        lastActionName={state.lastActionName}
        onRestart={handleRestart}
      />
    </div>
  );
}