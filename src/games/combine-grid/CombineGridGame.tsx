import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  Home,
  ChevronLeft,
  ChevronRight,
  Undo2,
  RefreshCw,
  Settings as SettingsIcon,
} from 'lucide-react';
import './animations.css';
import { motion, AnimatePresence } from 'motion/react';
import Board from './components/Board';
import SummaryScreen from './components/ResultScreen';
import { EquationPill } from '../../components/EquationPill';
import { SoundService } from '../../systems/SoundService';
import { HapticService } from '../../systems/HapticService';
import { Z_LAYERS } from '../../engine/layout/LayerTokens';
import * as LT from './layoutTokens';
import {
  ROWS,
  COLS,
  ROUNDS_PER_SESSION,
  ROUND_DURATION_SECS,
  ROUND_OVER_AUTOADVANCE_MS,
  ZERO_TILE_VALUE,
  BOMB_TILE_VALUE,
  BOMB_FUSE_MS,
  CG_MAX_BOMB_PARTICLES,
  CG_PARTICLES_PER_TILE,
  CG_PARTICLE_DURATION_MS,
  CG_RESULT_PARTICLES_ENABLED,
  CG_RESULT_COUNT_MODE,
  WILDCARD_ANIM,
} from './constants';
import { GridPos, EvalMode, GameMode } from './types';
import { initGame, reducer, CGState, Action } from './cgReducer';
import {
  countCombinableTiles,
  isCombinableTile,
  hasBombs,
  isRoundComplete
} from './services/GridService';
import { makePrng, randomSeed, spawnBoard, gridFromSpawn, generateTarget, getProfile, DEFAULT_PROFILE_ID } from '../../engine/public';
import Tile, { tileBackground, DRAG_SRC_SHADOW } from './components/Tile';
import { SessionController } from '../../platform/session/SessionController';

// LOGGING_CONTRACT
const cgLog = (msg: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production') {
    if (data) console.log(msg, data);
    else console.log(msg);
  }
};

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  rotation: number;
  rotationSpeed: number;
  content?: string;
}

const PARTICLE_COLORS = [
  '#fbbf24', '#f59e0b', '#ef4444', '#22c55e',
  '#60a5fa', '#a78bfa', '#f472b6', '#fb923c',
];

const BOMB_PARTICLE_COLORS = ['#ef4444', '#f97316', '#fbbf24', '#451a03'];
const TROPHY_PARTICLE_COLORS = ['#FFD700', '#FFFACD', '#DAA520'];

const BOARD_PAD = 6;

const CG_EQUATION_POPUP = {
  DURATION_MS: 1500,
  FONT_SIZE_PX: 20,
  MIN_WIDTH_PX: 140,
  PADDING_X_PX: 20,
  PADDING_Y_PX: 12,
  SCALE_START: 0.8,
  SCALE_PEAK: 1.1,
};

import { FactorRecipeList } from './components/FactorRecipeList';

export default function CombineGridGame({ onBack }: { onBack?: () => void }) {
  const profile = useMemo(() => getProfile('medium'), []);
  const prngSeedRef = useRef(randomSeed());
  const prngRef = useRef(makePrng(prngSeedRef.current));
  const [settings, setSettings] = useState({
    sound: true,
    haptics: true,
    music: false,
    animationIntensity: 1,
    targetMode: 'product' as EvalMode,
    rows: ROWS,
    cols: COLS,
    gameMode: 'practice' as GameMode,
    practiceGroups: [2, 3, 4, 5, 6],
    recipeTargets: [12, 15, 24, 32, 56],
    showFactorList: true,
    showFactorDots: true,
    showDistractorDots: false,
  });

  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => initGame(
      profile, 
      prngRef.current, 
      prngSeedRef.current, 
      settings.targetMode, 
      settings.rows, 
      settings.cols,
      settings.gameMode,
      settings.practiceGroups,
      settings.recipeTargets,
      0
    ),
  );

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [factorHelpRevealActive, setFactorHelpRevealActive] = useState(false);
  const factorHelpTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [popupEquation, setPopupEquation] = useState<typeof state.lastEquation | null>(null);
  const popupTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [localSettings, setLocalSettings] = useState<any>(null);
  const [settingsTab, setSettingsTab] = useState<'gameplay' | 'logs'>('gameplay');

  const openSettings = () => {
    setLocalSettings({
      ...settings,
      practiceGroups: settings.practiceGroups.join(', '),
      recipeTargets: settings.recipeTargets.join(', '),
      rows: settings.rows.toString(),
      cols: settings.cols.toString(),
    });
    setIsSettingsOpen(true);
  };

  useEffect(() => {
    if (state.lastEquation && state.lastEquation.id.startsWith('merge-trophy-')) {
      setPopupEquation(state.lastEquation);
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
      popupTimerRef.current = setTimeout(() => {
        setPopupEquation(null);
        popupTimerRef.current = null;
      }, CG_EQUATION_POPUP.DURATION_MS);
    }
  }, [state.lastEquation]);

  useEffect(() => {
    return () => {
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
  }, []);

  const triggerFactorHelp = useCallback(() => {
    setFactorHelpRevealActive(true);
    if (factorHelpTimerRef.current) {
      clearTimeout(factorHelpTimerRef.current);
    }
    factorHelpTimerRef.current = setTimeout(() => {
      setFactorHelpRevealActive(false);
      factorHelpTimerRef.current = null;
    }, 3500); // 3.5 seconds
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (factorHelpTimerRef.current) {
        clearTimeout(factorHelpTimerRef.current);
      }
    };
  }, []);

  // Clear on target change or restart
  useEffect(() => {
    setFactorHelpRevealActive(false);
    if (factorHelpTimerRef.current) {
      clearTimeout(factorHelpTimerRef.current);
      factorHelpTimerRef.current = null;
    }
  }, [state.target]);

  const [logs, setLogs] = useState<string[]>(state.logEvents || []);
  useEffect(() => {
    if (state.logEvents) {
      const reversed = [...state.logEvents].reverse();
      setLogs(reversed);
    }
  }, [state.logEvents]);

  

  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const handler = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const boardWidth = useMemo(() => {
    const targetW = windowSize.w * LT.BOARD_WIDTH_PCT;
    return Math.min(targetW, LT.BOARD_MAX_WIDTH);
  }, [windowSize.w]);

  const tileSize = useMemo(() => {
    const maxBoardW = boardWidth;
    const maxBoardH = windowSize.h - LT.HUD_HEIGHT - LT.CONTROL_BAR_HEIGHT - (LT.LAYOUT_GAP * 2);
    
    const tileSizeW = Math.floor((maxBoardW - (LT.BOARD_PADDING * 2) - (settings.cols - 1) * LT.TILE_GAP) / settings.cols);
    const tileSizeH = Math.floor((maxBoardH - (LT.BOARD_PADDING * 2) - (settings.rows - 1) * LT.TILE_GAP) / settings.rows);
    
    const size = Math.min(tileSizeW, tileSizeH);

    if (process.env.NODE_ENV !== 'production') {
      cgLog("COMBINEGRID_LAYOUT_DEBUG", {
        viewportWidth: windowSize.w,
        viewportHeight: windowSize.h,
        topHudHeight: LT.HUD_HEIGHT,
        bottomNavHeight: LT.CONTROL_BAR_HEIGHT,
        availableBoardWidth: maxBoardW,
        availableBoardHeight: maxBoardH,
        computedTileSize: size,
        cols: settings.cols,
        rows: settings.rows,
        widthUtilizationPercent: Math.round(((settings.cols * size + (settings.cols - 1) * LT.TILE_GAP + LT.BOARD_PADDING * 2) / windowSize.w) * 100),
        heightUtilizationPercent: Math.round(((settings.rows * size + (settings.rows - 1) * LT.TILE_GAP + LT.BOARD_PADDING * 2) / maxBoardH) * 100),
      });
    }

    return size;
  }, [boardWidth, windowSize.h, settings.rows, settings.cols]);

  const actualBoardWidth = useMemo(() => {
    return (settings.cols * tileSize) + (settings.cols - 1) * LT.TILE_GAP + (LT.BOARD_PADDING * 2);
  }, [tileSize, settings.cols]);

  const isMounted = useRef(true);
  const activeTimers = useRef<Set<NodeJS.Timeout | number>>(new Set());
  const activePointerId = useRef<number | null>(null);

  const safeSetTimeout = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(() => {
      activeTimers.current.delete(id);
      if (isMounted.current) fn();
    }, delay);
    activeTimers.current.add(id);
    return id;
  }, []);

  const safeClearTimeout = useCallback((id: NodeJS.Timeout | number | undefined | null) => {
    if (id !== undefined && id !== null) {
      clearTimeout(id as any);
      activeTimers.current.delete(id);
    }
  }, []);

  const safeSetInterval = useCallback((fn: () => void, delay: number) => {
    const id = setInterval(() => {
      if (isMounted.current) fn();
      else {
        clearInterval(id);
        activeTimers.current.delete(id);
      }
    }, delay);
    activeTimers.current.add(id);
    return id;
  }, []);

  const safeClearInterval = useCallback((id: NodeJS.Timeout | number | undefined | null) => {
    if (id !== undefined && id !== null) {
      clearInterval(id as any);
      activeTimers.current.delete(id);
    }
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const hudPillRef = useRef<HTMLDivElement>(null);

  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const [hoverPos, setHoverPos] = useState<GridPos | null>(null);
  const [poppingPos, setPoppingPos] = useState<GridPos | null>(null);
  const [spawnedPositions, setSpawnedPositions] = useState<GridPos[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [boardShaking, setBoardShaking] = useState(false);
  const [wildcardAnimPos, setWildcardAnimPos] = useState<GridPos[]>([]);
  const [wildcardAnimProgress, setWildcardAnimProgress] = useState(0);
  const [blockedAnimPos, setBlockedAnimPos] = useState<GridPos[]>([]);

  // Equation state
  const [hudFlash, setHudFlash] = useState(false);
  const [countingIndex, setCountingIndex] = useState(-1);
  const [countedTrophies, setCountedTrophies] = useState<GridPos[]>([]);

  // Bomb state
  const [bombFuseProgress, setBombFuseProgress] = useState(0);
  const [explodingPositions, setExplodingPositions] = useState<GridPos[]>([]);

  // INPUT_LOCK_CONTRACT
  const computeInputLocked = (
    phase: string,
    ignitedBombPos: GridPos | null,
    wildcardAnimPosCount: number,
    explodingPositionsCount: number
  ) => {
    return (phase !== 'PLAY' && phase !== 'CLEARING') || ignitedBombPos !== null || wildcardAnimPosCount > 0 || explodingPositionsCount > 0;
  };

  const isInputLocked = computeInputLocked(state.phase, state.ignitedBombPos, wildcardAnimPos.length, explodingPositions.length);


  const sessionRef = useRef(new SessionController('CombineGrid'));
  const session = sessionRef.current;

  const emitParticles = useCallback((cx: number, cy: number, colors: string[], count: number, isTrophy = false, isMath = false) => {
    if (count <= 0) return;
    
    // Performance Guard: Limit total particles in the system if things get crazy
    // But mostly we rely on the callers (bomb/result) to pass a lower count.

    const symbols = ['+', '−', '×', '÷', '=', '?'];
    const burst: Particle[] = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;
      const speed = isMath ? (2 + Math.random() * 4) : (4 + Math.random() * 8);
      const size = isTrophy ? (12 + Math.random() * 8) : (isMath ? (12 + Math.random() * 12) : (4 + Math.random() * 6));
      return {
        id: Math.random() + i,
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isMath ? 1 : 2), 
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * (isMath ? 5 : 20),
        content: isMath ? symbols[Math.floor(Math.random() * symbols.length)] : undefined,
      };
    });

    setParticles((prev) => [...prev, ...burst]);

    let currentLife = 1;
    // Faster fade out for performance
    const fadeRate = 1000 / (isTrophy ? 600 : CG_PARTICLE_DURATION_MS) * 0.025; 
    
    const interval = safeSetInterval(() => {
      currentLife -= fadeRate;
      if (currentLife <= 0) {
        safeClearInterval(interval);
        setParticles((prev) => prev.filter((p) => !burst.some((b) => b.id === p.id)));
      } else {
        setParticles((prev) => prev.map(p => {
          if (!burst.some(b => b.id === p.id)) return p;
          return {
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.25, 
            life: currentLife,
            rotation: p.rotation + p.rotationSpeed,
          };
        }));
      }
    }, 25);
  }, [safeSetInterval]);

  const emitTrophyParticles = useCallback((dst: GridPos) => {
    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return;

    const cellSize = tileSize + LT.TILE_GAP;
    const cx = boardRect.left + LT.BOARD_PADDING + dst.col * cellSize + tileSize / 2;
    const cy = boardRect.top  + LT.BOARD_PADDING + dst.row * cellSize + tileSize / 2;

    emitParticles(cx, cy, TROPHY_PARTICLE_COLORS, 20, true);
  }, [tileSize, emitParticles]);

  const handleBombExplosionRipple = useCallback((center: GridPos, onFinish: () => void) => {
    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) {
      onFinish();
      return;
    }

    const cellSize = tileSize + LT.TILE_GAP;
    const getPos = (r: number, c: number) => ({
      x: boardRect.left + LT.BOARD_PADDING + c * cellSize + tileSize / 2,
      y: boardRect.top  + LT.BOARD_PADDING + r * cellSize + tileSize / 2,
    });

    const affected: { pos: GridPos; dist: number }[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = center.row + dr;
        const c = center.col + dc;
        if (r >= 0 && r < state.rows && c >= 0 && c < state.cols) {
          const dist = Math.abs(dr) + Math.abs(dc);
          affected.push({ pos: { row: r, col: c }, dist });
        }
      }
    }

    // Group by distance
    const groups = [0, 1, 2].map(d => affected.filter(a => a.dist === d));

    groups.forEach((group, i) => {
      if (group.length === 0) return;
      const delay = i * 80;
      safeSetTimeout(() => {
        setExplodingPositions(prev => [...prev, ...group.map(g => g.pos)]);
        group.forEach(g => {
          const screenPos = getPos(g.pos.row, g.pos.col);
          const val = state.board[g.pos.row][g.pos.col];
          const isTrophy = state.trophyMask[g.pos.row][g.pos.col];
          const colors = g.dist === 0 ? BOMB_PARTICLE_COLORS 
            : isTrophy ? TROPHY_PARTICLE_COLORS 
            : [tileBackground(val, false)];
          
          // PART 6: BOMB PARTICLE BUDGET
          const pCount = g.dist === 0 ? 12 : CG_PARTICLES_PER_TILE;
          emitParticles(screenPos.x, screenPos.y, colors, pCount, false);
        });
      }, delay);
    });

    safeSetTimeout(() => {
      setExplodingPositions([]);
      onFinish();
    }, 450);
  }, [state.rows, state.cols, state.board, state.trophyMask, tileSize, emitParticles, safeSetTimeout]);

  useEffect(() => {
    if (state.ignitedBombPos) {
      const pos = state.ignitedBombPos;
      const startTimeVersion = state.version;
      SoundService.playCombineGridBombFuse(settings.sound); HapticService.playArmedTick(settings.haptics);
      setBombFuseProgress(0);
      
      const startTime = Date.now();
      const interval = safeSetInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / BOMB_FUSE_MS, 1);
        setBombFuseProgress(progress);
        
        if (progress >= 1) {
          safeClearInterval(interval);
          SoundService.playCombineGridBombExplosion(settings.sound); HapticService.playExplosion(settings.haptics);
          
          handleBombExplosionRipple(pos, () => {
            cgLog("BOMB_EXPLOSION_COMPLETE", { center: pos });
            dispatch({ type: 'BOMB_EXPLODE', center: pos, version: startTimeVersion });
            // Note: BOMB_EXPLODE above increments version, so CLEAR_COMPLETE should use version+1 if combined, 
            // but here we just rely on BOMB_EXPLODE running first. 
            // Actually, we should probably let BOMB_EXPLODE trigger CLEAR_COMPLETE in the reducer or sequentially.
            // For now, BOMB_EXPLODE increments version, so following dispatch needs no version or the +1.
            dispatch({ type: 'CLEAR_COMPLETE', profile, seed: Math.floor(makePrng(prngSeedRef.current)() * 1000000), version: startTimeVersion + 1 });
            setBoardShaking(true);
            safeSetTimeout(() => setBoardShaking(false), 200);
          });
        }
      }, 16);
      return () => clearInterval(interval);
    } else {
      setBombFuseProgress(0);
    }
  }, [state.ignitedBombPos, handleBombExplosionRipple, safeSetInterval, safeSetTimeout, dispatch, settings.sound, settings.haptics, profile]);

  useEffect(() => {
    isMounted.current = true;
    cgLog("GAME_INIT", { seed: state.seed, target: state.target, mode: state.gameMode });
    return () => {
      isMounted.current = false;
      SoundService.stopCombineGridBombFuse();
      activeTimers.current.forEach(id => {
        clearTimeout(id as any);
        clearInterval(id as any);
      });
      activeTimers.current.clear();
    };
  }, []);

  useEffect(() => {
    if (state.phase === 'SUMMARY' || state.phase === 'FINAL') {
      const result = session.end();
      if (result) {
        cgLog("[SESSION RESULT]", result);
        cgLog("[TELEMETRY EVENTS]", result.events);
      }
    }
  }, [state.phase]);

  useEffect(() => {
    let lastTime = performance.now();
    let rafId: number;

    const tick = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      const s = state;
      const needsTick = s.phase === 'PLAY' || s.phase === 'CLEARING';
      
      if (needsTick && delta > 0) {
        dispatch({ 
          type: 'TICK', 
          deltaMs: delta, 
          profile 
        } as any);
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [state.phase, profile, dispatch]);

  useEffect(() => {
    if (state.phase !== 'COUNTING') {
      setCountingIndex(-1);
      setCountedTrophies([]);
      return;
    }

    if (state.countedTrophies.length === 0) {
      dispatch({ type: 'FINISH_COUNTING', version: state.version });
      return;
    }

    const versionAtSchedule = state.version;

    // PART 3: SIMPLIFY TROPHY COUNT SEQUENCE
    if (CG_RESULT_COUNT_MODE === "instant") {
      setCountedTrophies([...state.countedTrophies]);
      SoundService.playEndgame(settings.sound);
      dispatch({ type: 'FINISH_COUNTING', version: versionAtSchedule });
      return;
    }

    // "simple" mode: quick count without grid interaction
    let localIdx = 0;
    const intervalTime = 250; // Slower, deliberate counting
    
    // Initial completion pause before counting starts
    const initialPause = 500;
    
    let tallyInterval: any;
    let fallbackTimeout: any;

    const initialTimeout = safeSetTimeout(() => {
      // PART 4 — TROPHY COUNT COMPLETION GUARD
      // Absolute safety timeout: transition to summary if still counting after 10 seconds
      fallbackTimeout = safeSetTimeout(() => {
         console.warn("[ENDGAME GUARD] Counting took too long, forcing SUMMARY transition.");
         dispatch({ type: 'FINISH_COUNTING' }); 
      }, 10000);

      tallyInterval = safeSetInterval(() => {
        if (localIdx < state.countedTrophies.length) {
          const pos = state.countedTrophies[localIdx];
          if (pos) {
            setCountingIndex(localIdx);
            setCountedTrophies(prev => [...prev, pos]);
            
            // Performance-safe sparkle
            if (CG_RESULT_PARTICLES_ENABLED) {
              const boardRect = boardRef.current?.getBoundingClientRect();
              if (boardRect) {
                const cellSize = tileSize + LT.TILE_GAP;
                const cx = boardRect.left + LT.BOARD_PADDING + pos.col * cellSize + tileSize / 2;
                const cy = boardRect.top  + LT.BOARD_PADDING + pos.row * cellSize + tileSize / 2;
                emitParticles(cx, cy, TROPHY_PARTICLE_COLORS, 8, true);
              }
            }

            // Play count sound
            SoundService.playTick(settings.sound);
          }
          
          dispatch({ type: 'COUNT_NEXT_TROPHY', version: versionAtSchedule });
          localIdx++;
        } else {
          if (tallyInterval) safeClearInterval(tallyInterval);
          
          safeSetTimeout(() => {
            SoundService.playEndgame(settings.sound); HapticService.playEndgame(settings.haptics);
            setBoardShaking(true);
            safeSetTimeout(() => setBoardShaking(false), 500);
            dispatch({ type: 'FINISH_COUNTING', version: versionAtSchedule });
          }, 600); // Deliberate pause before showing results
        }
      }, intervalTime); 
    }, initialPause);

    return () => {
      clearTimeout(initialTimeout);
      if (tallyInterval) safeClearInterval(tallyInterval);
      if (fallbackTimeout) safeClearTimeout(fallbackTimeout);
    };
  }, [state.phase, state.countedTrophies, safeSetInterval, safeSetTimeout, emitParticles, tileSize]);

  useEffect(() => {
    // legacy STALEMATE handling removed
  }, []);

  useEffect(() => {
    SoundService.setCombineGridMusicEnabled(settings.music);
    return () => {
      SoundService.stopCombineGridAmbient();
    };
  }, [settings.music]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const time = performance.now();
    SoundService.unlock();
    
    // MULTI-TOUCH GUARD: Ignore additional pointers
    if (activePointerId.current !== null) {
      return;
    }

    session.recordAction('pointer_down');
    if (!session.active) session.start();

    if (state.phase !== 'PLAY' && state.phase !== 'CLEARING' || isInputLocked) {
      cgLog("INPUT_TRACE: Blocked by phase=", { phase: state.phase, isInputLocked });
      return;
    }
    const tileEl = (e.target as HTMLElement).closest('[data-row]') as HTMLElement | null;
    if (!tileEl) return;

    const row = parseInt(tileEl.dataset.row ?? '-1', 10);
    const col = parseInt(tileEl.dataset.col ?? '-1', 10);
    
    // Position Safety Guard
    if (row < 0 || row >= state.rows || col < 0 || col >= state.cols) {
      console.warn("INPUT_TRACE: pointerDown out of bounds", { row, col });
      return;
    }

    const val = state.board[row][col];
    cgLog("INPUT_TRACE: pointerDown", { row, col, val, time });
    
    if (val === 0) {
      cgLog("INPUT_TRACE: Blocked by val=0");
      return;
    }
    
    if (val === BOMB_TILE_VALUE && !state.ignitedBombPos) {
      cgLog("INPUT_TRACE: Ignite bomb");
      dispatch({ type: 'IGNITE_BOMB', pos: { row, col } });
      return;
    }

    e.preventDefault();
    
    // LOCK POINTER
    activePointerId.current = e.pointerId;
    
    cgLog("INPUT_TRACE: DRAG_START", { row, col, val, time, pointerId: e.pointerId });
    SoundService.playPickup(settings.sound); HapticService.playPickup(settings.haptics);
    dispatch({ type: 'DRAG_START', pos: { row, col } });
    setGhostPos({ x: e.clientX, y: e.clientY });
    setHoverPos(null);
    containerRef.current?.setPointerCapture(e.pointerId);
  }, [state.phase, state.board, state.rows, state.cols, state.ignitedBombPos, dispatch, isInputLocked]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current === null || e.pointerId !== activePointerId.current) return;
    if (state.dragSource === null) return;
    setGhostPos({ x: e.clientX, y: e.clientY });

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const tileEl = el?.closest('[data-row]') as HTMLElement | null;
    if (tileEl) {
      const row = parseInt(tileEl.dataset.row ?? '-1', 10);
      const col = parseInt(tileEl.dataset.col ?? '-1', 10);
      if (row >= 0 && row < state.rows && col >= 0 && col < state.cols) {
        setHoverPos({ row, col });
        return;
      }
    }
    setHoverPos(null);
  }, [state.dragSource, state.rows, state.cols]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    SoundService.unlock();
    const time = performance.now();
    
    if (activePointerId.current === null || e.pointerId !== activePointerId.current) {
      return;
    }

    // RELEASE POINTER
    activePointerId.current = null;

    if (state.dragSource === null) {
      setGhostPos(null);
      return;
    }

    containerRef.current?.releasePointerCapture(e.pointerId);

    const boardRect = boardRef.current?.getBoundingClientRect();
    let row = -1;
    let col = -1;

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const tileEl = el?.closest('[data-row]') as HTMLElement | null;

    if (tileEl) {
      row = parseInt(tileEl.dataset.row ?? '-1', 10);
      col = parseInt(tileEl.dataset.col ?? '-1', 10);
    } else if (boardRect) {
      const cellSize = tileSize + LT.TILE_GAP;
      row = Math.floor((e.clientY - boardRect.top - LT.BOARD_PADDING) / cellSize);
      col = Math.floor((e.clientX - boardRect.left - LT.BOARD_PADDING) / cellSize);
    }

    if (row !== -1 && col !== -1) {
      const src = state.dragSource;
      const versionAtRelease = state.version;
      
      const srcVal = state.board[src.row][src.col];
      const dstVal = state.board[row][col];
      
      const dr = row - src.row;
      const dc = col - src.col;
      const isDirectAdj = Math.max(Math.abs(dr), Math.abs(dc)) === 1;

      // Ensure we have a valid action before proceeding
      const isMerge = srcVal > 0 && dstVal > 0 && dstVal < 99 && (src.row !== row || src.col !== col);
      
      let dst: GridPos | null = { row, col };
      if (!isDirectAdj && (dr !== 0 || dc !== 0)) {
        dst = { 
          row: src.row + Math.sign(dr), 
          col: src.col + Math.sign(dc) 
        };
      }

      // Verify resolved dst is in bounds
      if (dst && (dst.row < 0 || dst.row >= state.rows || dst.col < 0 || dst.col >= state.cols)) {
        dst = null;
      }

      if (dst && (dst.row === src.row && dst.col === src.col)) {
        dst = null;
      }

      if (dst) {
        // Verify source still valid in case of race condition or stall
        if (src.row < 0 || src.row >= state.rows || src.col < 0 || src.col >= state.cols) {
          console.warn("INPUT_TRACE: handlePointerUp src out of bounds", src);
          dispatch({ type: 'DRAG_CANCEL' });
          setGhostPos(null); setHoverPos(null);
          return;
        }

        const srcVal = state.board[src.row][src.col];
        const dstVal = state.board[dst.row][dst.col];
        const result = srcVal * dstVal;
        
        // Final adj check after resolution
        const isAdj = Math.max(
          Math.abs(src.row - dst.row),
          Math.abs(src.col - dst.col),
        ) === 1;

        cgLog("INPUT_TRACE: handlePointerUp resolve", { src, dst, isAdj, isDirectAdj, srcVal, dstVal, time });

        const isWildcardCombine = isAdj
          && (srcVal === ZERO_TILE_VALUE || dstVal === ZERO_TILE_VALUE)
          && srcVal > 0 && dstVal > 0
          && !(srcVal === BOMB_TILE_VALUE || dstVal === BOMB_TILE_VALUE)
          && !(state.trophyMask[src.row][src.col] || state.trophyMask[dst.row][dst.col])
          && !(state.frozenMask[src.row][src.col] || state.frozenMask[dst.row][dst.col]);

        const isTrophySwap = isAdj && (state.trophyMask[src.row][src.col] || state.trophyMask[dst.row][dst.col]);
        const isBlocked = isAdj && !isTrophySwap && (state.frozenMask[src.row][src.col] || state.frozenMask[dst.row][dst.col]);

        if (isBlocked) {
          cgLog("BLOCKED", { src, dst });
          SoundService.playCombineGridBlocked(settings.sound); HapticService.playBlocked(settings.haptics);
          setBlockedAnimPos([src, dst]);
          safeSetTimeout(() => setBlockedAnimPos([]), 200);
          setGhostPos(null);
          setHoverPos(null);
          dispatch({ type: 'DRAG_CANCEL' });
          return;
        }

        if (isWildcardCombine) {
          session.recordMove('wildcard_combine');
          setWildcardAnimPos([src, dst]);
          dispatch({ type: 'DRAG_CANCEL' });
          let timerVal = 0;
          const duration = WILDCARD_ANIM.DURATION_MS;
          
          const intervalId = safeSetInterval(() => {
            timerVal += WILDCARD_ANIM.TICK_MS;
            const progress = timerVal / duration;
            setWildcardAnimProgress(progress);
            if (settings.sound) SoundService.playWildcardVibrate(settings.sound, progress);
            if (settings.haptics) HapticService.playWildcardVibrate(settings.haptics, progress);
            
            if (timerVal >= duration) {
              safeClearInterval(intervalId);
              
              // STALE CALLBACK GUARD: Ensure board hasn't mutation since we started
              // In this case, we check if version changed or if positions are still valid zeros
              // But version alone is the strongest check for "nothing else happened"
              
              SoundService.playCombineGridWildcardPop(settings.sound);
              HapticService.playWildcardPop(settings.haptics);
              const boardRect2 = boardRef.current?.getBoundingClientRect();
              if (boardRect2) {
                  const cellSize = tileSize + LT.TILE_GAP;
                  const cxSrc = boardRect2.left + LT.BOARD_PADDING + src.col * cellSize + tileSize / 2;
                  const cySrc = boardRect2.top + LT.BOARD_PADDING + src.row * cellSize + tileSize / 2;
                  const cxDst = boardRect2.left + LT.BOARD_PADDING + dst.col * cellSize + tileSize / 2;
                  const cyDst = boardRect2.top + LT.BOARD_PADDING + dst.row * cellSize + tileSize / 2;
                  
                  // Pop both together
                  emitParticles(cxSrc, cySrc, PARTICLE_COLORS, 6, false, true);
                  emitParticles(cxDst, cyDst, PARTICLE_COLORS, 6, false, true);
              }
              
              setWildcardAnimPos([]);
              dispatch({ type: 'DRAG_DROP', src, dst, version: versionAtRelease });
              dispatch({ type: 'CLEAR_COMPLETE', profile, seed: Math.floor(makePrng(prngSeedRef.current)() * 1000000), version: versionAtRelease + 1 });
            }
          }, WILDCARD_ANIM.TICK_MS);
          setGhostPos(null); setHoverPos(null);
          return;
        }

        if (isAdj && result === state.target && !state.trophyMask[src.row][src.col] && !state.trophyMask[dst.row][dst.col]) {
          session.recordMove('capture_trophy');
          session.recordTrophy(result);
          SoundService.playCombineGridTrophy(settings.sound); HapticService.playTrophy(settings.haptics);
          emitTrophyParticles(dst);
          cgLog("MERGE_TROPHY", { src, dst, srcVal, dstVal, result });
          setHudFlash(true);
          safeSetTimeout(() => setHudFlash(false), 400);
        } else if (isAdj && (state.trophyMask[src.row][src.col] || state.trophyMask[dst.row][dst.col])) {
          session.recordMove('slide_trophy');
          SoundService.playCombineGridMerge(settings.sound); HapticService.playMerge(settings.haptics);
          cgLog("SLIDE", { src, dst });
        } else if (isAdj && result > 0) {
          if (result > state.target) {
            session.recordMove('overshoot');
            SoundService.playCombineGridBlockedCreated(settings.sound); HapticService.playBlockedCreated(settings.haptics);
            cgLog("OVERSHOOT", { src, dst, result });
            setBlockedAnimPos([src, dst]);
            safeSetTimeout(() => setBlockedAnimPos([]), 200);
            setBoardShaking(true);
            safeSetTimeout(() => setBoardShaking(false), 200);
          } else {
            session.recordMove('merge_tiles');
            SoundService.playCombineGridMerge(settings.sound); HapticService.playMerge(settings.haptics);
            cgLog("MERGE", { src, dst, srcVal, dstVal, result });
            setHudFlash(true);
            safeSetTimeout(() => setHudFlash(false), 400);
          }
        } else {
          // Reject if still not adjacent after resolving
          cgLog("INPUT_TRACE: Rejecting invalid drop after resolution", { isAdj, src, dst });
          session.recordMoveInvalid('invalid_drop');
          SoundService.playCombineGridBlocked(settings.sound);
          dispatch({ type: 'DRAG_CANCEL' });
          setGhostPos(null); setHoverPos(null);
          return;
        }

        dispatch({ type: 'DRAG_DROP', src, dst, version: versionAtRelease });
        
        // Only dispatch CLEAR_COMPLETE if we triggered a merge/clear phase
        const isMergeOrWildcard = result > 0 || isWildcardCombine;
        if (isMergeOrWildcard) {
           dispatch({ type: 'CLEAR_COMPLETE', profile, seed: Math.floor(makePrng(prngSeedRef.current)() * 1000000), version: versionAtRelease + 1 });
        }

        setPoppingPos(dst);
        safeSetTimeout(() => setPoppingPos(null), 380);
      } else {
        cgLog("INPUT_TRACE: Could not resolve valid target", { row, col });
        dispatch({ type: 'DRAG_CANCEL' });
      }
    } else {
      cgLog("INPUT_TRACE: Pointer outside board on release");
      dispatch({ type: 'DRAG_CANCEL' });
    }

    setGhostPos(null);
    setHoverPos(null);
  }, [state.dragSource, state.board, state.target, state.trophyMask, state.frozenMask, state.rows, state.cols, state.version, state.mode, tileSize, profile, emitTrophyParticles, dispatch]);

  const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== null && e.pointerId === activePointerId.current) {
        activePointerId.current = null;
        if (state.dragSource !== null) dispatch({ type: 'DRAG_CANCEL' });
        setGhostPos(null);
        setHoverPos(null);
    }
  }, [state.dragSource]);

  const dropTarget: GridPos | null = (() => {
    if (state.dragSource === null || hoverPos === null) return null;
    const adjacent =
      Math.max(
        Math.abs(hoverPos.row - state.dragSource.row),
        Math.abs(hoverPos.col - state.dragSource.col),
      ) === 1;
    return adjacent ? hoverPos : null;
  })();

  const tileOverlay: { label: string; color: string } | null = (() => {
    if (state.dragSource === null || dropTarget === null) return null;
    const srcVal = state.board[state.dragSource.row][state.dragSource.col];
    const dstVal = state.board[dropTarget.row][dropTarget.col];
    if (dstVal === 0 || dstVal >= 99) return null;
    const result = srcVal * dstVal;
    const color =
      result === state.target ? '#22c55e' : result > state.target ? '#ef4444' : '#d1d5db';
    return { label: `${srcVal} × ${dstVal} = ${result}`, color };
  })();

  const mergeHighlight: 'invalid' | 'valid' | 'trophy' | null = (() => {
    if (state.dragSource === null || dropTarget === null) return null;
    const srcVal = state.board[state.dragSource.row][state.dragSource.col];
    const dstVal = state.board[dropTarget.row][dropTarget.col];
    if (dstVal === 0 || dstVal >= 99) return null;
    const result = srcVal * dstVal;
    if (result === state.target) return 'trophy';
    if (result > state.target)  return 'invalid';
    return 'valid';
  })();

  const lastInteractionRef = useRef(Date.now());
  
  useEffect(() => {
    if (isInputLocked) return;
    lastInteractionRef.current = Date.now();
  }, [isInputLocked]);

  useEffect(() => {
    const interval = safeSetInterval(() => {
      const now = Date.now();
      const idleTime = now - lastInteractionRef.current;
      
      const hasActiveOverlay = isSettingsOpen || isDebugOpen || state.phase === 'SUMMARY' || state.phase === 'FINAL';
      const hasActiveAnimation = state.phase === 'CLEARING' || state.phase === 'COUNTING' || particles.length > 0;
      
      if (isInputLocked && idleTime > 5000 && !hasActiveOverlay && !hasActiveAnimation) {
        console.warn("COMBINEGRID_INPUT_LOCK_STUCK", {
          phase: state.phase,
          ignitedBomb: state.ignitedBombPos,
          idleTime
        });
      }
    }, 2000);
    return () => safeClearInterval(interval);
  }, [isInputLocked, isSettingsOpen, isDebugOpen, state.phase, state.ignitedBombPos, particles.length, safeSetInterval, safeClearInterval]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    safeSetTimeout(() => setToastMsg(null), 3000);
  }, [safeSetTimeout]);

  const copyDebugState = () => {
    const hDepth = (() => {
      let d = 0; let h = state.history; while (h && d < 100) { d++; h = h.history; } return d;
    })();
    
    const combinableList: { pos: GridPos; val: number }[] = [];
    let zeroCount = 0;
    let emptyCount = 0;
    let frozenCount = 0;
    let trophyInMask = 0;
    
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const val = state.board[r][c];
        if (isCombinableTile(state.board, state.trophyMask, state.frozenMask, r, c)) {
          combinableList.push({ pos: { row: r, col: c }, val });
        }
        if (val === ZERO_TILE_VALUE) zeroCount++;
        if (val === 0) emptyCount++;
        if (state.frozenMask[r][c]) frozenCount++;
        if (state.trophyMask[r][c]) trophyInMask++;
      }
    }

    const debug = {
      target: state.target,
      boardValues: state.board,
      trophyCount: state.trophyCount,
      trophyInMask,
      bombCount: state.board.flat().filter(v => v === BOMB_TILE_VALUE).length,
      zeroCount,
      emptyCount,
      frozenCount,
      combinableTileCount: combinableList.length,
      combinableTiles: combinableList,
      phase: state.phase,
      version: state.version,
      dragSource: state.dragSource,
      selection: state.selection,
      selectionVal: state.selectionVal,
      activePointerId: activePointerId.current,
      countingIndex: state.countingIndex,
      countedTrophiesCount: state.countedTrophies.length,
      timeLeft: state.timeLeft,
      historyDepth: hDepth,
      historySummary: state.history ? {
        version: state.history.version,
        dragSource: state.history.dragSource,
        selection: state.history.selection,
        clearingPositionsCount: state.history.clearingPositions?.length || 0,
      } : null,
      lastAction: state.logEvents?.[state.logEvents.length - 1] || 'None',
      recentLog: state.logEvents?.slice(-30).reverse() || [],
      inputLockReason: isInputLocked ? {
        phase: state.phase,
        ignitedBomb: state.ignitedBombPos !== null,
        wildcardAnimActive: wildcardAnimPos.length > 0,
        explodingActive: explodingPositions.length > 0
      } : 'None',
      activeTimersCount: activeTimers.current.size,
      reasonEndgame: isRoundComplete(state.board, state.target, state.mode, state.trophyMask, state.frozenMask) 
        ? "Condition Met: combinableCount <= 1" 
        : "Not triggered",
      isInputLocked,
      ignitedBomb: state.ignitedBombPos,
      resultScreenVisible: state.phase === 'SUMMARY' || state.phase === 'FINAL',
      perf: {
        activeParticles: particles.length,
        resultParticlesEnabled: CG_RESULT_PARTICLES_ENABLED,
        bombParticleCap: CG_MAX_BOMB_PARTICLES,
        resultCountMode: CG_RESULT_COUNT_MODE,
      }
    };
    navigator.clipboard.writeText(JSON.stringify(debug, null, 2));
    showToast("Endgame debug state copied to clipboard!");
  };

  const copyPerfState = () => {
    const perfState = {
      activeParticles: particles.length,
      wildcardAnimPosCount: wildcardAnimPos.length,
      blockedAnimPosCount: blockedAnimPos.length,
      explodingPositionsCount: explodingPositions.length,
      countedTrophiesCount: countedTrophies.length,
      timers: activeTimers.current.size,
      activePointerId: activePointerId.current,
      inputLocked: isInputLocked,
      phase: state.phase,
      version: state.version
    };
    navigator.clipboard.writeText(JSON.stringify(perfState, null, 2));
    showToast("Performance state copied!");
  };

  const timerPct = state.timeLeft / ROUND_DURATION_SECS;
  const timerColor =
    state.timeLeft <= 10 ? '#ef4444' : state.timeLeft <= 20 ? '#f97316' : '#22c55e';

  const ghostVal = ghostPos && state.dragSource ? state.board[state.dragSource.row][state.dragSource.col] : 0;
  const ghostBg = state.dragSource ? tileBackground(ghostVal, false) : '#c2410c';
  const ghostRadius = Math.min(16, tileSize * 0.28);

  return (
    <div
      ref={containerRef}
      className="mathgrid-game-surface"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'Nunito, sans-serif',
        overflow: 'hidden',
        touchAction: 'none',
        background: 'transparent',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <AnimatePresence>
        {(state.phase === 'SUMMARY' || state.phase === 'FINAL') && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10000 }}>
            <SummaryScreen
              trophies={state.trophyCount}
              points={state.roundScore}
              timeTaken={ROUND_DURATION_SECS - state.timeLeft}
              stars={Math.min(5, Math.floor(state.trophyCount / 4) + (state.timeLeft > 30 ? 1 : 0))}
              target={state.target}
              isFinal={state.phase === 'FINAL'}
              onContinue={() => {
                SoundService.playSubtleTap(settings.sound);
                const nextSeed = (state.seed * 91438) % 2147483647;
                dispatch({ type: 'ADVANCE_ROUND', profile, seed: nextSeed });
              }}
              onRestart={() => {
                session.reset();
                session.start();
                SoundService.playSubtleTap(settings.sound);
                dispatch({ 
                  type: 'PLAY_AGAIN', 
                  newState: initGame(profile, prngRef.current, randomSeed(), state.mode, state.rows, state.cols, state.gameMode, state.practiceGroups, state.recipeTargets, state.recipeIndex)
                });
              }}
              onHome={() => {
                SoundService.playSubtleTap(settings.sound);
                onBack?.();
              }}
            />
          </div>
        )}
      </AnimatePresence>

      <div id="game-hud-top" style={{
        width: '100%',
        maxWidth: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px',
        boxSizing: 'border-box',
        height: LT.HUD_HEIGHT,
        gap: 8,
        borderBottom: '1px solid rgba(93, 64, 55, 0.1)',
        background: 'rgba(245, 230, 211, 0.5)',
      }}>
        <div id="target-display-box" style={{ 
          background: '#5D4037', 
          color: '#fff', 
          padding: '2px 12px', 
          borderRadius: 12, 
          textAlign: 'center',
          minWidth: 70,
          boxShadow: '0 3px 0 #3E2723',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 42,
        }}>
          <div style={{ fontSize: 8, fontWeight: 800, opacity: 0.8, letterSpacing: 0.5, lineHeight: 1, marginBottom: 2 }}>TARGET</div>
          <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }}>{state.target}</div>
        </div>

        <div id="equation-display-area" style={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            position: 'relative',
            zIndex: Z_LAYERS.EQUATION_PILL,
            overflow: 'hidden',
            gap: 2
        }}>
          <FactorRecipeList target={state.target} showFactorList={settings.showFactorList} />
          
          {!settings.showFactorDots && (
            <button
              onClick={triggerFactorHelp}
              style={{
                pointerEvents: 'auto',
                padding: '2px 8px',
                borderRadius: 16,
                background: factorHelpRevealActive ? '#22c55e' : 'rgba(255,255,255,0.4)',
                border: factorHelpRevealActive ? '1px solid #16a34a' : '1px solid rgba(255,255,255,0.6)',
                color: factorHelpRevealActive ? '#fff' : '#5D4037',
                fontSize: 10,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                boxShadow: factorHelpRevealActive ? '0 0 8px rgba(34, 197, 94, 0.4)' : 'none'
              }}
            >
              {factorHelpRevealActive ? 'Showing Factors' : 'Factor Help ?'}
            </button>
          )}
        </div>

        <div id="trophy-counter-box" style={{ 
          display: 'flex', 
          backgroundColor: '#FFFFFF',
          padding: '2px 10px',
          borderRadius: 12,
          border: '1px solid rgba(93, 64, 55, 0.15)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          alignItems: 'center',
          gap: 6,
          height: 38,
        }}>
          <span style={{ fontSize: 16 }}>🏆</span>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#5D4037', fontVariantNumeric: 'tabular-nums' }}>
            {state.trophyCount}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%' }}>
        {/* factor info was here previously */}
      </div>

      <div style={{ 
        width: '100%',
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'center',
        padding: '0px',
        marginTop: 4,
        position: 'relative'
      }}>
        <Board
          key={`cg-board-${state.version}`}
          grid={state.board}
          tileSize={tileSize}
          target={state.target}
          showFactorDots={settings.showFactorDots || factorHelpRevealActive}
          showDistractorDots={settings.showDistractorDots}
          selection={state.selection.filter(p => p && typeof p.row === 'number')}
          clearingPositions={state.clearingPositions.filter(p => p && typeof p.row === 'number')}
          trophyMask={state.trophyMask}
          frozenMask={state.frozenMask}
          ignitedBombPos={state.ignitedBombPos}
          bombFuseProgress={bombFuseProgress}
          dragSource={state.dragSource}
          dropTarget={dropTarget}
          poppingPos={poppingPos}
          spawnedPositions={spawnedPositions.filter(p => p && typeof p.row === 'number')}
          countingIndex={countingIndex}
          countedTrophies={countedTrophies.filter(p => p && typeof p.row === 'number')}
          mergeHighlight={mergeHighlight}
          isShaking={boardShaking}
          wildcardAnimPos={wildcardAnimPos}
          wildcardAnimProgress={wildcardAnimProgress}
          blockedAnimPos={blockedAnimPos}
          explodingPositions={explodingPositions}
          boardRef={boardRef}
        />

        <AnimatePresence>
          {popupEquation && (
            <motion.div
              key={popupEquation.id}
              initial={{ opacity: 0, 
                x: `calc(-50% + ${popupEquation.pos ? (popupEquation.pos.col - state.cols / 2 + 0.5) * tileSize : 0}px)`, 
                y: popupEquation.pos ? (popupEquation.pos.row + 0.5) * tileSize + BOARD_PAD : 40, 
                scale: CG_EQUATION_POPUP.SCALE_START 
              }}
              animate={{ opacity: 1, 
                x: `calc(-50% + 0px)`, 
                y: (state.rows / 2) * tileSize + BOARD_PAD, 
                scale: CG_EQUATION_POPUP.SCALE_PEAK 
              }}
              exit={{ opacity: 0, 
                x: `calc(-50% + 0px)`, 
                y: (state.rows / 2) * tileSize + BOARD_PAD, 
                scale: CG_EQUATION_POPUP.SCALE_START 
              }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                zIndex: Z_LAYERS.MODAL_OVERLAY - 1,
                pointerEvents: 'none',
                background: 'white',
                padding: `${CG_EQUATION_POPUP.PADDING_Y_PX}px ${CG_EQUATION_POPUP.PADDING_X_PX}px`,
                borderRadius: 100,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15), inset 0 -2px 0 rgba(0,0,0,0.05)',
                fontWeight: 900,
                fontSize: CG_EQUATION_POPUP.FONT_SIZE_PX,
                color: '#5D4037',
                whiteSpace: 'nowrap',
                border: '2px solid rgba(93, 64, 55, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: CG_EQUATION_POPUP.MIN_WIDTH_PX,
                gap: 8
              }}
            >
              {popupEquation.values.map((v, i) => (
                <React.Fragment key={i}>
                  <span>{v}</span>
                  {i < popupEquation.values.length - 1 && (
                    <span style={{ opacity: 0.5, fontSize: CG_EQUATION_POPUP.FONT_SIZE_PX * 0.8 }}>×</span>
                  )}
                </React.Fragment>
              ))}
              <span style={{ opacity: 0.4, fontSize: CG_EQUATION_POPUP.FONT_SIZE_PX * 0.8 }}>=</span>
              <span style={{ color: '#22c55e', textShadow: '0 2px 4px rgba(34, 197, 94, 0.3)' }}>{popupEquation.target}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ flex: 1 }} />

      <div id="game-controls-bottom" style={{
        width: '100%',
        maxWidth: 800,
        height: LT.CONTROL_BAR_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '0 8px 12px 8px',
        boxSizing: 'border-box',
        zIndex: Z_LAYERS.BASE,
        position: 'relative'
      }}>
        {process.env.NODE_ENV !== 'production' && (
          <button
            onClick={() => setIsDebugOpen(!isDebugOpen)}
            style={{
              position: 'absolute',
              left: 4,
              bottom: -10,
              padding: '2px 6px',
              fontSize: 8,
              background: 'rgba(0,0,0,0.3)',
              color: 'rgba(255,255,255,0.5)',
              border: 'none',
              borderRadius: 4,
              zIndex: 9999,
              cursor: 'pointer'
            }}
          >
            DEBUG
          </button>
        )}

        <AnimatePresence>
          {isDebugOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                position: 'fixed',
                bottom: LT.CONTROL_BAR_HEIGHT + 20,
                left: 16,
                right: 16,
                background: 'rgba(0,0,0,0.9)',
                color: '#0f0',
                padding: 12,
                borderRadius: 12,
                fontSize: 10,
                maxHeight: 200,
                overflowY: 'auto',
                zIndex: 9999,
                fontFamily: 'monospace',
                border: '1px solid #333',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, borderBottom: '1px solid #333', paddingBottom: 4 }}>
                <strong>WATCHDOG V{state.version}</strong>
                <button onClick={copyDebugState} style={{ background: '#333', color: '#0f0', border: 'none', padding: '2px 8px', borderRadius: 4, fontSize: 9 }}>COPY STATE</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <div>Phase: {state.phase}</div>
                <div>Target/🏆: {state.target} / {state.trophyCount}</div>
                <div>Combinable: {countCombinableTiles(state.board, state.trophyMask, state.frozenMask)}</div>
                <div>Bombs: {hasBombs(state.board) ? 'YES' : 'NO'}</div>
                <div>Particles: {particles.length}</div>
              </div>
              <div style={{ marginTop: 8, color: '#aaa', fontSize: 9 }}>
                Recent Activity:
                {state.logEvents?.slice(-2).reverse().map((l, i) => (
                  <div key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>• {l}</div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div id="nav-group-main" style={{ 
          display: 'flex', 
          gap: 8,
          background: 'rgba(255,255,255,0.4)',
          padding: '6px',
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.6)',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <button
            id="btn-home"
            onClick={() => {
              cgLog("UI: HOME CLICK");
              SoundService.playSubtleTap(settings.sound);
              onBack?.();
            }}
            style={{
              width: LT.BUTTON_SIZE,
              height: LT.BUTTON_SIZE,
              borderRadius: 20,
              border: 'none',
              background: LT.COLORS.buttonBg,
              boxShadow: `0 5px 0 ${LT.COLORS.buttonShadow}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: LT.COLORS.iconColor,
              position: 'relative',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(3px)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            title="Home"
          >
            <Home size={30} strokeWidth={2.5} />
          </button>

          <button
            id="btn-undo"
            onClick={() => {
              if (state.history && !isInputLocked) {
                cgLog("UI: UNDO CLICK");
                SoundService.playCombineGridUndo(settings.sound); HapticService.playUndo(settings.haptics);
                
                // EMERGENCY UNDO FIX: Clear all local transient states
                setPopupEquation(null);
                setFactorHelpRevealActive(false);
                setHoverPos(null);
                setGhostPos(null);
                setPoppingPos(null);
                setBlockedAnimPos([]);
                setWildcardAnimPos([]);
                setExplodingPositions([]);
                activePointerId.current = null;
                
                console.log("DIAGNOSTIC: UNDO CLICK", {
                  version: state.version,
                  hasHistory: !!state.history,
                  dragSource: state.history?.dragSource,
                  selection: state.history?.selection,
                  clearingPositions: state.history?.clearingPositions,
                  boardAtBlank: state.history?.board?.[0]?.[0] // example
                });
                dispatch({ type: 'UNDO' });
              }
            }}
            disabled={!state.history || isInputLocked}
            style={{
              width: LT.BUTTON_SIZE,
              height: LT.BUTTON_SIZE,
              borderRadius: 20,
              border: 'none',
              background: (state.history && !isInputLocked) ? LT.COLORS.buttonBg : '#E0D8CC',
              boxShadow: (state.history && !isInputLocked) ? `0 5px 0 ${LT.COLORS.buttonShadow}` : '0 5px 0 #D0C0A0',
              cursor: (state.history && !isInputLocked) ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: (state.history && !isInputLocked) ? 1 : 0.5,
              color: LT.COLORS.iconColor,
              position: 'relative',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => (state.history && !isInputLocked) && (e.currentTarget.style.transform = 'translateY(3px)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            title="Undo"
          >
            <Undo2 size={30} strokeWidth={2.5} />
          </button>
        </div>

        <div id="nav-group-targets" style={{ 
          display: 'flex', 
          gap: 6,
          background: 'rgba(255,255,255,0.4)',
          padding: '6px',
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.6)',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <button
            id="btn-prev-target"
            onClick={() => {
              cgLog("UI: PREV_TARGET CLICK");
              SoundService.playSubtleTap(settings.sound); 
              dispatch({ type: 'PREV_TARGET', profile, prng: prngRef.current });
            }}
            style={{
              width: LT.BUTTON_SIZE,
              height: LT.BUTTON_SIZE,
              borderRadius: 20,
              border: 'none',
              background: LT.COLORS.buttonBg,
              boxShadow: `0 5px 0 ${LT.COLORS.buttonShadow}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: LT.COLORS.iconColor,
              position: 'relative',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(3px)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            title="Previous Problem"
          >
            <ChevronLeft size={30} strokeWidth={2.5} />
          </button>

          <button
            id="btn-next-target"
            onClick={() => {
              cgLog("UI: NEXT_TARGET CLICK");
              SoundService.playSubtleTap(settings.sound); 
              dispatch({ type: 'NEXT_TARGET', profile, prng: prngRef.current });
            }}
            style={{
              width: LT.BUTTON_SIZE,
              height: LT.BUTTON_SIZE,
              borderRadius: 20,
              border: 'none',
              background: LT.COLORS.buttonBg,
              boxShadow: `0 5px 0 ${LT.COLORS.buttonShadow}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: LT.COLORS.iconColor,
              position: 'relative',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(3px)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            title="Next Problem"
          >
            <ChevronRight size={30} strokeWidth={2.5} />
          </button>
        </div>

        <div id="nav-group-meta" style={{ 
          display: 'flex', 
          gap: 8,
          background: 'rgba(255,255,255,0.4)',
          padding: '6px',
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.6)',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <button
            id="btn-restart"
            onClick={() => {
              if (isInputLocked) return;
              cgLog("UI: RESTART CLICK");
              SoundService.playSubtleTap(settings.sound);
              dispatch({
                type: 'PLAY_AGAIN',
                newState: initGame(
                  profile,
                  prngRef.current,
                  randomSeed(),
                  state.mode,
                  state.rows,
                  state.cols,
                  state.gameMode,
                  state.practiceGroups,
                  state.recipeTargets,
                  state.recipeIndex
                )
              });
            }}
            disabled={isInputLocked}
            style={{
              width: LT.BUTTON_SIZE,
              height: LT.BUTTON_SIZE,
              borderRadius: 20,
              border: 'none',
              background: !isInputLocked ? LT.COLORS.buttonBg : '#E0D8CC',
              boxShadow: !isInputLocked ? `0 5px 0 ${LT.COLORS.buttonShadow}` : '0 5px 0 #D0C0A0',
              cursor: !isInputLocked ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !isInputLocked ? 1 : 0.5,
              color: LT.COLORS.iconColor,
              position: 'relative',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => (!isInputLocked) && (e.currentTarget.style.transform = 'translateY(3px)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            title="Restart"
          >
            <RefreshCw size={30} strokeWidth={2.5} />
          </button>

          <button
            id="btn-settings"
            onClick={() => {
              cgLog("UI: SETTINGS CLICK");
              SoundService.playSubtleTap(settings.sound);
              openSettings();
            }}
            style={{
              width: LT.BUTTON_SIZE,
              height: LT.BUTTON_SIZE,
              borderRadius: 20,
              border: 'none',
              background: LT.COLORS.buttonBg,
              boxShadow: `0 5px 0 ${LT.COLORS.buttonShadow}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: LT.COLORS.iconColor,
              position: 'relative',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(3px)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            title="Settings"
          >
            <SettingsIcon size={30} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {tileOverlay && ghostPos && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              position: 'fixed',
              left: Math.max(100, Math.min(window.innerWidth - 100, ghostPos.x)),
              top: Math.max(80, ghostPos.y - 80), 
              transform: 'translateX(-50%)',
              background: '#333',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 16,
              fontSize: 18,
              fontWeight: 800,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: Z_LAYERS.DRAG_OVERLAY,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              border: `2px solid ${tileOverlay.color}`,
            }}
          >
            {tileOverlay.label}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && localSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: Z_LAYERS.MODAL_OVERLAY,
            }}
            onClick={() => setIsSettingsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              style={{
                width: '90%',
                maxWidth: 400,
                maxHeight: '80vh',
                background: '#F5E6D3',
                borderRadius: 24,
                padding: 24,
                boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                display: 'flex', flexDirection: 'column', gap: 20,
                overflow: 'hidden',
              }}
              onClick={e => e.stopPropagation()}
              onPointerDown={e => e.stopPropagation()}
            >
              <div style={{ fontSize: 24, fontWeight: 900, color: '#5D4037', textAlign: 'center' }}>SETTINGS</div>
              
              <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.05)', padding: 4, borderRadius: 12 }}>
                <button 
                  onClick={() => setSettingsTab('gameplay')}
                  style={{ 
                    flex: 1, padding: '8px', borderRadius: 8, border: 'none', 
                    background: settingsTab === 'gameplay' ? '#fff' : 'transparent',
                    color: '#5D4037', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Gameplay
                </button>
                <button 
                  onClick={() => setSettingsTab('logs')}
                  style={{ 
                    flex: 1, padding: '8px', borderRadius: 8, border: 'none', 
                    background: settingsTab === 'logs' ? '#fff' : 'transparent',
                    color: '#5D4037', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Logs
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
                {settingsTab === 'gameplay' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#5D4037', opacity: 0.6 }}>GAME MODE</div>
                      <div style={{ fontSize: 10, color: '#5D4037', opacity: 0.5, marginTop: -4 }}>Session will reset on change</div>
                      <select 
                        value={localSettings.gameMode}
                        onChange={(e) => setLocalSettings({ ...localSettings, gameMode: e.target.value as GameMode })}
                        style={{ padding: 12, borderRadius: 12, border: '2px solid #D8CDBC', background: '#fff', fontWeight: 700 }}
                      >
                        <option value="practice">Practice Mode (Multiples)</option>
                        <option value="recipe">Recipe Mode (Fixed Targets)</option>
                        <option value="free">Free Mode (Random Achievable)</option>
                      </select>
                    </div>

                    {localSettings.gameMode === 'practice' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#5D4037', opacity: 0.6 }}>PRACTICE GROUPS</div>
                        <div style={{ fontSize: 10, color: '#5D4037', opacity: 0.5, marginTop: -4 }}>Targets will be multiples of these numbers</div>
                        <input 
                          type="text" 
                          value={localSettings.practiceGroups} 
                          onChange={(e) => setLocalSettings({ ...localSettings, practiceGroups: e.target.value })}
                          placeholder="e.g. 2, 3, 4, 5"
                          style={{ padding: 12, borderRadius: 12, border: '2px solid #D8CDBC', background: '#fff', fontWeight: 700 }}
                        />
                        <div style={{ fontSize: 9, color: '#5D4037', opacity: 0.4 }}>Use commas or spaces to separate</div>
                      </div>
                    )}

                    {localSettings.gameMode === 'recipe' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#5D4037', opacity: 0.6 }}>RECIPE TARGETS</div>
                        <div style={{ fontSize: 10, color: '#5D4037', opacity: 0.5, marginTop: -4 }}>Fixed sequence of targets to solve</div>
                        <input 
                          type="text" 
                          value={localSettings.recipeTargets} 
                          onChange={(e) => setLocalSettings({ ...localSettings, recipeTargets: e.target.value })}
                          placeholder="e.g. 12, 24, 36"
                          style={{ padding: 12, borderRadius: 12, border: '2px solid #D8CDBC', background: '#fff', fontWeight: 700 }}
                        />
                        <div style={{ fontSize: 9, color: '#5D4037', opacity: 0.4 }}>Use commas or spaces to separate</div>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#5D4037', opacity: 0.6 }}>TARGET MODE</div>
                      <select 
                        value={localSettings.targetMode}
                        onChange={(e) => setLocalSettings({ ...localSettings, targetMode: e.target.value as EvalMode })}
                        style={{ padding: 12, borderRadius: 12, border: '2px solid #D8CDBC', background: '#fff', fontWeight: 700 }}
                      >
                        <option value="product">Product Mode (Multiplication)</option>
                        <option value="sum">Sum Mode (Addition)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(255,255,255,0.5)', padding: 12, borderRadius: 12, border: '1px solid rgba(93, 64, 55, 0.1)' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#5D4037', opacity: 0.8 }}>Factor Help</div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#5D4037' }}>Show Factor List</div>
                          <div style={{ fontSize: 10, color: '#5D4037', opacity: 0.6, marginTop: 2 }}>Recipe hints for target numbers</div>
                        </div>
                        <button 
                          onClick={() => setLocalSettings({...localSettings, showFactorList: !localSettings.showFactorList})}
                          style={{
                            width: 48, height: 28, borderRadius: 14, border: 'none',
                            background: localSettings.showFactorList ? '#22c55e' : '#D8CDBC',
                            position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
                          }}
                        >
                          <div style={{
                            width: 24, height: 24, borderRadius: 12, background: '#fff',
                            position: 'absolute', top: 2, left: localSettings.showFactorList ? 22 : 2,
                            transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#5D4037' }}>Show Factor Dots</div>
                          <div style={{ fontSize: 10, color: '#5D4037', opacity: 0.6, marginTop: 2 }}>Mark tiles that divide the target</div>
                        </div>
                        <button 
                          onClick={() => setLocalSettings({...localSettings, showFactorDots: !localSettings.showFactorDots})}
                          style={{
                            width: 48, height: 28, borderRadius: 14, border: 'none',
                            background: localSettings.showFactorDots ? '#22c55e' : '#D8CDBC',
                            position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
                          }}
                        >
                          <div style={{
                            width: 24, height: 24, borderRadius: 12, background: '#fff',
                            position: 'absolute', top: 2, left: localSettings.showFactorDots ? 22 : 2,
                            transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#5D4037' }}>Show Distractor Dots</div>
                          <div style={{ fontSize: 10, color: '#5D4037', opacity: 0.6, marginTop: 2 }}>Mark non-factors</div>
                        </div>
                        <button 
                          onClick={() => setLocalSettings({...localSettings, showDistractorDots: !localSettings.showDistractorDots})}
                          style={{
                            width: 48, height: 28, borderRadius: 14, border: 'none',
                            background: localSettings.showDistractorDots ? '#22c55e' : '#D8CDBC',
                            position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
                          }}
                        >
                          <div style={{
                            width: 24, height: 24, borderRadius: 12, background: '#fff',
                            position: 'absolute', top: 2, left: localSettings.showDistractorDots ? 22 : 2,
                            transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#5D4037', opacity: 0.6 }}>GRID SIZE</div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, fontWeight: 700 }}>ROWS</div>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            value={localSettings.rows} 
                            onChange={(e) => setLocalSettings({ ...localSettings, rows: e.target.value })}
                            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ccc' }} 
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, fontWeight: 700 }}>COLS</div>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            value={localSettings.cols} 
                            onChange={(e) => setLocalSettings({ ...localSettings, cols: e.target.value })}
                            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ccc' }} 
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                        <span style={{ fontWeight: 700, color: '#5D4037' }}>Sound Effects</span>
                        <input 
                          type="checkbox" 
                          checked={localSettings.sound} 
                          onChange={e => setLocalSettings({ ...localSettings, sound: e.target.checked })}
                          style={{ width: 24, height: 24, cursor: 'pointer' }}
                        />
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                        <span style={{ fontWeight: 700, color: '#5D4037' }}>Background Music</span>
                        <input 
                          type="checkbox" 
                          checked={localSettings.music} 
                          onChange={e => setLocalSettings({ ...localSettings, music: e.target.checked })}
                          style={{ width: 24, height: 24, cursor: 'pointer' }}
                        />
                      </label>
                      <button
                        onClick={() => {
                          cgLog("UI: TEST SOUND CLICK");
                          SoundService.playTestSound(localSettings.sound);
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 12,
                          border: 'none',
                          background: '#5D4037',
                          color: '#fff',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        TEST SOUND
                      </button>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                        <span style={{ fontWeight: 700, color: '#5D4037' }}>Haptics</span>
                        <input 
                          type="checkbox" 
                          checked={localSettings.haptics} 
                          onChange={e => setLocalSettings({ ...localSettings, haptics: e.target.checked })}
                          style={{ width: 24, height: 24, cursor: 'pointer' }}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#5D4037', opacity: 0.6 }}>SESSION LOGS</div>
                      <button onClick={() => setLogs([])} style={{ fontSize: 10, background: 'none', border: 'none', color: '#D67A7A', fontWeight: 800, cursor: 'pointer' }}>CLEAR</button>
                    </div>
                    <div style={{ background: '#fff', padding: 12, borderRadius: 12, fontSize: 10, fontFamily: 'monospace', minHeight: 180, overflowX: 'auto', marginBottom: 8 }}>
                      {logs.length === 0 ? <div style={{ opacity: 0.3 }}>No logs yet...</div> : logs.map((log, i) => <div key={i} style={{ marginBottom: 4, borderBottom: '1px solid #eee', paddingBottom: 2, whiteSpace: 'pre-wrap' }}>{log}</div>)}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        onClick={copyPerfState}
                        style={{ flex: 1, padding: '8px', fontSize: 10, borderRadius: 8, background: '#5D4037', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                      >
                        COPY PERF DEBUG
                      </button>
                      <button 
                        onClick={() => {
                          const soundState = SoundService.getDebugState();
                          const debug = {
                            settings: settings,
                            sound: soundState,
                            lastLog: logs[0] || 'none'
                          };
                          navigator.clipboard.writeText(JSON.stringify(debug, null, 2));
                          showToast("Sound debug state copied!");
                        }}
                        style={{ flex: 1, padding: '8px', fontSize: 10, borderRadius: 8, background: '#5D4037', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                      >
                        COPY SOUND DEBUG
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button 
                  onClick={() => {
                    const finalRows = parseInt(localSettings.rows) || ROWS;
                    const finalCols = parseInt(localSettings.cols) || COLS;
                    
                    // Improved parsing: split by commas, spaces, or newlines
                    const parseList = (str: string) => {
                      return str
                        .split(/[,\s]+/) // Split by comma OR whitespace
                        .map(s => parseInt(s.trim()))
                        .filter(n => !isNaN(n) && n > 0);
                    };

                    const finalPracticeGroups = parseList(localSettings.practiceGroups);
                    const finalRecipeTargets = parseList(localSettings.recipeTargets);

                    const finalSettings = {
                      ...localSettings,
                      rows: finalRows,
                      cols: finalCols,
                      practiceGroups: finalPracticeGroups.length > 0 ? finalPracticeGroups : settings.practiceGroups,
                      recipeTargets: finalRecipeTargets.length > 0 ? finalRecipeTargets : settings.recipeTargets,
                    };

                    setSettings(finalSettings);
                    SoundService.playSubtleTap(finalSettings.sound);
                    prngSeedRef.current = randomSeed();
                    prngRef.current = makePrng(prngSeedRef.current);
                    dispatch({ 
                      type: 'RESET_SESSION', 
                      newState: initGame(
                        profile, 
                        prngRef.current, 
                        prngSeedRef.current, 
                        finalSettings.targetMode, 
                        finalSettings.rows, 
                        finalSettings.cols,
                        finalSettings.gameMode,
                        finalSettings.practiceGroups,
                        finalSettings.recipeTargets,
                        0
                      ) 
                    });
                    setIsSettingsOpen(false);
                    cgLog(`Session reset: ${finalSettings.gameMode} mode, ${finalSettings.targetMode} eval, ${finalSettings.rows}x${finalSettings.cols}`);
                  }}
                  style={{
                    padding: '12px', borderRadius: 12, background: '#D67A7A', color: '#fff',
                    fontWeight: 800, border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 0 #B65A5A'
                  }}
                >
                  APPLY & RESTART
                </button>

                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  style={{
                    padding: '12px', borderRadius: 12, background: '#D8CDBC', color: '#5D4037',
                    fontWeight: 800, border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 0 #B8A888'
                  }}
                >
                  CLOSE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              bottom: 40,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#333',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 800,
              zIndex: 10000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {ghostPos && state.dragSource && (
        <div
          style={{
            position: 'fixed',
            left: ghostPos.x - tileSize / 2,
            top: ghostPos.y - tileSize / 2,
            width: tileSize,
            height: tileSize,
            background: ghostBg,
            borderRadius: ghostRadius,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: tileSize * 0.4,
            fontWeight: 900,
            color: '#fff',
            pointerEvents: 'none',
            zIndex: Z_LAYERS.DRAG_OVERLAY,
            boxShadow: DRAG_SRC_SHADOW,
            opacity: 0.9,
          }}
        >
          {state.trophyMask[state.dragSource.row][state.dragSource.col] ? (
            <svg width={tileSize * 0.6} height={tileSize * 0.6} viewBox="0 0 24 24" fill="#fff">
              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v3c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1c2.45-.3 4.39-2.39 4.39-4.94V7c0-1.1-.9-2-2-2zM5 10V7h2v3c0 1.21-.88 2.22-2 2.39V10zm14 0c-1.12-.17-2-1.18-2-2.39V7h2v3z" />
            </svg>
          ) : (
            ghostVal
          )}
        </div>
      )}

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: Z_LAYERS.PARTICLES }}>
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              background: p.content ? 'transparent' : p.color,
              color: p.color,
              fontSize: p.size,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: p.life,
              transform: `rotate(${p.rotation}deg)`,
              whiteSpace: 'nowrap',
            }}
          >
            {p.content}
          </div>
        ))}
      </div>
    </div>
  );
}