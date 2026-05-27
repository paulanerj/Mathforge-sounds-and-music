────────────────────────────────────────────────────────────────────────────────
import { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { mmReducer, initialMathMagicState } from '../mmReducer';
import { MathMagicMode, MathMagicPhase, MathMagicTile } from '../types';
import { MathMagicRules } from '../MathMagicRules';
import { StorageService } from '../StorageService';
import { ModeRegistry } from '../modes/ModeRegistry';
import { SensoryManager, SensoryEvent } from '../SensoryManager';
import { MathMagicVFX } from '../MathMagicVFX';
import { emitVFXEvent } from '../components/vfx/VFXEventBus';

export function useGameEngine() {
  const [state, dispatch] = useReducer(mmReducer, initialMathMagicState);
  const gridRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });
  const prevOffsetRef = useRef({ x: 0, y: 0 });
  const [slideAnimation, setSlideAnimation] = useState('');
  const [pulseTarget, setPulseTarget] = useState(false);
  const [cascadeOverlay, setCascadeOverlay] = useState(false);
  const [flowStateTrigger, setFlowStateTrigger] = useState<{ id: string, x: number, y: number, color: string } | null>(null);

  const [theme, setTheme] = useState<'monument' | 'iron-forge' | 'stage-dive' | 'cinnamoroll' | 'kuromi' | 'glitch-wave' | 'celestial-orbit' | 'deep-sea'>(
    () => (localStorage.getItem('activeTheme') as any) || 'monument'
  );

  const [vfxQuality, setVfxQuality] = useState<'high' | 'low' | 'off'>(
    () => (localStorage.getItem('vfxQuality') as any) || 'high'
  );

  const handleVfxQualityChange = (quality: 'high' | 'low' | 'off') => {
    setVfxQuality(quality);
    localStorage.setItem('vfxQuality', quality);
  };

  const handleThemeChange = (newTheme: 'monument' | 'iron-forge' | 'stage-dive' | 'cinnamoroll' | 'kuromi' | 'glitch-wave' | 'celestial-orbit' | 'deep-sea') => {
    setTheme(newTheme);
    localStorage.setItem('activeTheme', newTheme);
    document.body.className = `theme-${newTheme}`;
  };

  useEffect(() => {
    document.body.className = `theme-${theme}`;
    return () => {
      document.body.className = '';
    };
  }, [theme]);

  const [corruptedTileId, setCorruptedTileId] = useState<string | null>(null);
  const [celestialWarpStep, setCelestialWarpStep] = useState<'idle' | 'align' | 'warp' | 'tunnel' | 'done'>('idle');
  
  const triggerCorruptTile = (tileId: string) => {
    if (theme === 'glitch-wave') {
      setCorruptedTileId(tileId);
      setTimeout(() => {
        setCorruptedTileId(null);
      }, 150);
    }
  };

  const activeProduct = state.mode === MathMagicMode.REVERSE_SEEK || state.mode === MathMagicMode.MULTIPLICATION_FINDER || state.mode === MathMagicMode.ADDITION_FINDER ? 
    state.tiles.find(t => t.id === state.activeQuadrantTiles[`${gridOffset.x},${gridOffset.y}`])?.product 
    : null;

  const activeTileFinder = state.mode === MathMagicMode.MULTIPLICATION_FINDER || state.mode === MathMagicMode.ADDITION_FINDER ? 
    state.tiles.find(t => t.id === state.activeQuadrantTiles[`${gridOffset.x},${gridOffset.y}`]) 
    : null;

  useEffect(() => {
    if (activeProduct !== null && activeProduct !== undefined) {
      setPulseTarget(true);
      const t = setTimeout(() => setPulseTarget(false), 400);
      return () => clearTimeout(t);
    }
  }, [activeProduct]);

  useEffect(() => {
    if (state.phase === MathMagicPhase.SUMMARY) {
      if (theme !== 'celestial-orbit') {
        SensoryManager.dispatch(SensoryEvent.ON_VICTORY, { theme });
      }
      setCascadeOverlay(true);
      if (theme === 'iron-forge') {
        emitVFXEvent('GAME_VICTORY', { theme });
      } else if (theme === 'cinnamoroll') {
        emitVFXEvent('GAME_VICTORY', { theme });
      } else if (theme === 'kuromi') {
        emitVFXEvent('GAME_VICTORY', { theme });
      } else if (theme === 'glitch-wave') {
        MathMagicVFX.launchGlitchWaveVFX();
      } else if (theme === 'deep-sea') {
        MathMagicVFX.launchDeepSeaVFX();
      }
    } else {
      setCascadeOverlay(false);
    }
  }, [state.phase, theme]);

  useEffect(() => {
    if (state.phase === MathMagicPhase.SUMMARY && theme === 'celestial-orbit') {
      setCelestialWarpStep('align');
      
      const t1 = setTimeout(() => {
        setCelestialWarpStep('warp');
        SensoryManager.dispatch(SensoryEvent.ON_VICTORY, { theme });
        
        const t2 = setTimeout(() => {
          setCelestialWarpStep('tunnel');
          
          const t3 = setTimeout(() => {
            setCelestialWarpStep('done');
          }, 1000);
          return () => clearTimeout(t3);
        }, 1200);
        return () => clearTimeout(t2);
      }, 1000);
      
      return () => {
        clearTimeout(t1);
      };
    } else {
      setCelestialWarpStep('idle');
    }
  }, [state.phase, theme]);

  const pendingAudioPlay = useRef<null | { clientX?: number, clientY?: number, color: string }>(null);

  const handleSuccessCombo = useCallback((targetId: string, destRect: DOMRect | null, f1: number, f2: number, product: number, color: string, clientX?: number, clientY?: number) => {
      const now = Date.now();
      pendingAudioPlay.current = { clientX, clientY, color };

      dispatch({ type: 'LOCK_TILE', id: targetId, timestamp: now });

      if (destRect) {
         MathMagicVFX.createSparkles(destRect, color, 16, theme);
         
         const cx = destRect.left + destRect.width / 2;
         const cy = destRect.top + destRect.height / 2;
         
         // Dispatch Custom Event for VFX overlays
         window.dispatchEvent(new CustomEvent('MATH_MAGIC_TILE_SOLVED', { detail: { x: cx, y: cy } }));
         
         const activeBarRect = document.getElementById('last-eq-pill')?.getBoundingClientRect();
         if (activeBarRect) MathMagicVFX.equationToast(destRect, activeBarRect, f1, f2, product);
      }
  }, [theme]);

  useEffect(() => {
    if (state.lastSolveTime && pendingAudioPlay.current) {
      import('../mmReducer').then(({ getSweetspotMs }) => {
        const threshold = getSweetspotMs(state.mode);
        const { clientX, clientY, color } = pendingAudioPlay.current!;
        pendingAudioPlay.current = null;
        
        const isFast = state.lastSolveDuration !== null && state.lastSolveDuration <= threshold;
        const combo = state.comboCount;

        SensoryManager.dispatch(SensoryEvent.ON_MATCH_SUCCESS, { combo, isFast });

        if (combo >= 10 && clientX && clientY) {
            setFlowStateTrigger({ id: Date.now().toString(), x: clientX, y: clientY, color });
            setTimeout(() => setFlowStateTrigger(null), 1500);
        }
      });
    }
  }, [state.lastSolveTime, state.comboCount, state.lastSolveDuration, state.mode]);

  const ptr = useRef({
    id: null as number | null,
    targetId: null as string | null,
    startX: 0, startY: 0,
    currX: 0, currY: 0,
    prevX: 0, prevY: 0,
    clickOffsetX: 0, clickOffsetY: 0, ghostOff: 0,
    moved: false,
    state: 'IDLE' as 'IDLE' | 'HOLDING' | 'DRAGGING',
    hoverX: null as number | null,
    hoverY: null as number | null,
    gX: 0, gY: 0,
    gVx: 0, gVy: 0,
    pX: 0, pY: 0
  });

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (state.phase === MathMagicPhase.PLAY && state.startTime) {
      const interval = setInterval(() => {
        setElapsed(Date.now() - state.startTime!);
      }, 100);
      return () => clearInterval(interval);
    } else if (state.phase === MathMagicPhase.SUMMARY && state.endTime && state.startTime) {
      setElapsed(state.endTime - state.startTime);
    } else if (state.phase === MathMagicPhase.INIT) {
      setElapsed(0);
    }
  }, [state.phase, state.startTime, state.endTime]);

  const formatTime = (ms: number) => {
    const totalsec = Math.floor(ms / 1000);
    const min = Math.floor(totalsec / 60);
    const sec = totalsec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const generateTiles = useCallback((mode: MathMagicMode, config: any) => {
    const cols = 12;
    const rows = 12;
    const activeFactors = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const startRow = 1;
    const newTiles: MathMagicTile[] = [];
    
    for(let y=0; y<rows; y++) {
      for(let x=0; x<cols; x++) {
        const f1 = activeFactors[x];
        const f2 = y + startRow;
        const val = f1 * f2;
        newTiles.push({
          id: `T${x}_${y}`,
          homeX: x, homeY: y,
          currentX: x, currentY: y,
          f1: f1,
          f2: f2,
          product: val,
          state: 'hidden' as const,
          color: MathMagicRules.getModeColor(mode, x, y)
        });
      }
    }
    
    if (mode === MathMagicMode.DRAG_DROP || mode === MathMagicMode.RANDOMIZED_GRID) {
       const quadrants = [
         { x: 0, y: 0 },
         { x: 6, y: 0 },
         { x: 0, y: 6 },
         { x: 6, y: 6 }
       ];
       quadrants.forEach(q => {
         const quadTiles = newTiles.filter(t => t.currentX >= q.x && t.currentX < q.x + 6 && t.currentY >= q.y && t.currentY < q.y + 6);
         const pos = quadTiles.map(t => ({x: t.currentX, y: t.currentY}));
         for(let i=pos.length-1; i>0; i--) {
           const j = Math.floor(Math.random()*(i+1));
           [pos[i], pos[j]] = [pos[j], pos[i]];
         }
         quadTiles.forEach((t, i) => {
           t.currentX = pos[i].x;
           t.currentY = pos[i].y;
         });
       });
    }
    return newTiles;
  }, []);

  useEffect(() => {
    const newTiles = generateTiles(state.mode, state.config);
    const data = StorageService.getData();
    dispatch({ type: 'INIT_GAME', mode: state.mode, config: state.config, tiles: newTiles, totalStars: data.starsEarned });
  }, []);

  useEffect(() => {
    const prev = prevOffsetRef.current;
    if (prev.x !== gridOffset.x || prev.y !== gridOffset.y) {
      const dx = gridOffset.x - prev.x;
      const dy = gridOffset.y - prev.y;
      let anim = '';
      if (Math.abs(dx) >= Math.abs(dy)) {
        if (dx > 0) {
          anim = 'animate-slide-in-right';
        } else if (dx < 0) {
          anim = 'animate-slide-in-left';
        }
      } else {
        if (dy > 0) {
          anim = 'animate-slide-in-down';
        } else if (dy < 0) {
          anim = 'animate-slide-in-up';
        }
      }
      setSlideAnimation(anim);
      prevOffsetRef.current = { x: gridOffset.x, y: gridOffset.y };
    }
  }, [gridOffset.x, gridOffset.y]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>, tileId: string) => {
    if (ptr.current.state !== 'IDLE' || ptr.current.id !== null) return;
    const tile = state.tiles.find(t => t.id === tileId);
    if (!tile || tile.state === 'locked') return;

    const el = (e.target as HTMLElement).closest('.tile') as HTMLElement;
    if (!el || !ghostRef.current) return;

    console.log("[MathMagic] Pointer DOWN on tile:", tileId);

    ptr.current.id = e.pointerId;
    ptr.current.targetId = tileId;
    ptr.current.startX = e.clientX;
    ptr.current.startY = e.clientY;
    ptr.current.currX = e.clientX;
    ptr.current.currY = e.clientY;
    ptr.current.prevX = e.clientX;
    ptr.current.prevY = e.clientY;

    const rect = el.getBoundingClientRect();
    ptr.current.clickOffsetX = (rect.left + rect.width / 2) - e.clientX;
    ptr.current.clickOffsetY = (rect.top + rect.height / 2) - e.clientY;
    
    ptr.current.state = 'HOLDING';
    el.setPointerCapture(e.pointerId);

    const isDragMode = state.mode === MathMagicMode.DRAG_DROP || state.mode === MathMagicMode.RANDOMIZED_GRID;

    if (!isDragMode) {
      e.stopPropagation();

      if (state.mode === MathMagicMode.REVERSE_SEEK || state.mode === MathMagicMode.MULTIPLICATION_FINDER || state.mode === MathMagicMode.ADDITION_FINDER || state.mode === MathMagicMode.PATTERN_SWEEPER) {
          const strategy = ModeRegistry[state.mode];
          if (strategy) {
              const isValid = strategy.validate(state, { tapId: tileId });
              if (isValid) {
                 const sourceRect = el.getBoundingClientRect();
                 const cx = sourceRect.left + sourceRect.width/2;
                 const cy = sourceRect.top + sourceRect.height/2;
                 handleSuccessCombo(tileId, sourceRect, tile.f1, tile.f2, tile.product, tile.color, cx, cy);

                 if (state.mode === MathMagicMode.PATTERN_SWEEPER) {
                    const qx = Math.floor(tile.homeX / 6) * 6;
                    const qy = Math.floor(tile.homeY / 6) * 6;
                    const qKey = `${qx},${qy}`;
                    const activePattern = state.activePatterns?.[qKey];
                    if (activePattern) {
                       const foundIdsCount = activePattern.foundIds.length + 1;
                       if (foundIdsCount >= activePattern.targetCount) {
                          SensoryManager.dispatch(SensoryEvent.ON_VICTORY, { theme });
                          setCascadeOverlay(true);
                          setTimeout(() => setCascadeOverlay(false), 1800);
                          
                          if (theme === 'iron-forge') emitVFXEvent('GAME_VICTORY', { theme });
                          else if (theme === 'cinnamoroll') emitVFXEvent('GAME_VICTORY', { theme });
                          else if (theme === 'kuromi') emitVFXEvent('GAME_VICTORY', { theme });
                          else if (theme === 'glitch-wave') MathMagicVFX.launchGlitchWaveVFX();
                          else if (theme === 'deep-sea') MathMagicVFX.launchDeepSeaVFX();
                          
                          setTimeout(() => {
                            dispatch({ type: 'CLEAR_QUADRANT', qKey, timestamp: Date.now() });
                          }, 450);
                       }
                    }
                 }
              } else {
                 SensoryManager.dispatch(SensoryEvent.ON_MATCH_FAIL, {});
                 triggerCorruptTile(tileId);
                 dispatch({ type: 'ERROR_COMBO_RESET' });
              }
          }
      } else {
         dispatch({ type: 'OPEN_MODAL', id: tileId, timestamp: Date.now() });
      }
      
      ptr.current.state = 'IDLE';
      ptr.current.id = null;
      return; 
    }

    ptr.current.state = 'DRAGGING';
    ptr.current.moved = false;
    setDraggedId(tileId);

    SensoryManager.dispatch(SensoryEvent.ON_TILE_PICKUP, { theme });

    const ghost = ghostRef.current;
    ghost.style.display = 'flex';
    ghost.style.left = `${ptr.current.currX + ptr.current.clickOffsetX}px`;
    ghost.style.top = `${ptr.current.currY + ptr.current.clickOffsetY - 45}px`;

    ptr.current.ghostOff = -45;
    ptr.current.pX = ptr.current.currX + ptr.current.clickOffsetX;
    ptr.current.pY = ptr.current.currY + ptr.current.clickOffsetY - 45;
    ptr.current.gX = ptr.current.pX;
    ptr.current.gY = ptr.current.pY;
    ptr.current.gVx = 0;
    ptr.current.gVy = 0;

    const runCelestialDrift = () => {
      if (ptr.current.state !== 'DRAGGING' || !ghostRef.current || theme !== 'celestial-orbit') return;
      
      const targetX = ptr.current.pX;
      const targetY = ptr.current.pY;
      
      const spring = 0.16;
      const friction = 0.84;
      
      const ax = (targetX - ptr.current.gX) * spring;
      const ay = (targetY - ptr.current.gY) * spring;
      
      ptr.current.gVx = (ptr.current.gVx + ax) * friction;
      ptr.current.gVy = (ptr.current.gVy + ay) * friction;
      
      ptr.current.gX += ptr.current.gVx;
      ptr.current.gY += ptr.current.gVy;
      
      if (ghostRef.current) {
        ghostRef.current.style.left = `${ptr.current.gX}px`;
        ghostRef.current.style.top = `${ptr.current.gY}px`;
        
        const tiltX = Math.max(-25, Math.min(25, -ptr.current.gVy * 1.1));
        const tiltY = Math.max(-25, Math.min(25, ptr.current.gVx * 1.1));
        ghostRef.current.style.transform = `perspective(800px) translate(-50%, calc(-50% - 45px)) scale(1.14) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      }
      
      requestAnimationFrame(runCelestialDrift);
    };

    if (theme === 'celestial-orbit') {
      requestAnimationFrame(runCelestialDrift);
    }

    let moveLogged = false;

    const handlePointerMove = (eMove: PointerEvent) => {
      if (eMove.pointerId !== ptr.current.id) return;
      
      ptr.current.currX = eMove.clientX;
      ptr.current.currY = eMove.clientY;

      if (ptr.current.state === 'DRAGGING' && ghostRef.current && gridRef.current) {
        eMove.preventDefault();
        
        if (!moveLogged) {
          console.log("[MathMagic] Pointer MOVE, ghost updated");
          moveLogged = true;
        }

        if (!ptr.current.moved && Math.hypot(eMove.clientX - ptr.current.startX, eMove.clientY - ptr.current.startY) > 6) {
          ptr.current.moved = true;
        }

        if (theme !== 'celestial-orbit') {
          ghostRef.current.style.left = `${eMove.clientX + ptr.current.clickOffsetX}px`;
          ghostRef.current.style.top = `${eMove.clientY + ptr.current.clickOffsetY - 45}px`;

          const deltaX = eMove.clientX - ptr.current.prevX;
          const deltaY = eMove.clientY - ptr.current.prevY;
          
          const tiltX = Math.max(-30, Math.min(30, -deltaY * 1.5));
          const tiltY = Math.max(-30, Math.min(30, deltaX * 1.5));
          ghostRef.current.style.transform = `perspective(800px) translate(-50%, calc(-50% - 45px)) scale(1.14) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
        } else {
          ptr.current.pX = eMove.clientX + ptr.current.clickOffsetX;
          ptr.current.pY = eMove.clientY + ptr.current.clickOffsetY - 45;
        }

        ptr.current.prevX = eMove.clientX;
        ptr.current.prevY = eMove.clientY;

        const hit = MathMagicRules.resolveDrop(
          gridRef.current.getBoundingClientRect(),
          eMove.clientX, eMove.clientY,
          6, 6,
          gridRef.current
        );

        if (hit) {
          const logicalX = hit.x + gridOffset.x;
          const logicalY = hit.y + gridOffset.y;
          
          if (state.config.guides && state.mode === MathMagicMode.DRAG_DROP) {
            if (ptr.current.hoverX !== logicalX) {
              if (ptr.current.hoverX !== null) document.getElementById(`hdr-col-${ptr.current.hoverX}`)?.classList.remove('bg-amber-100', 'shadow-[inset_0_0_12px_rgba(251,191,36,0.3)]', 'rounded-none');
              document.getElementById(`hdr-col-${logicalX}`)?.classList.add('bg-amber-100', 'shadow-[inset_0_0_12px_rgba(251,191,36,0.3)]', 'rounded-none');
              ptr.current.hoverX = logicalX;
            }
            if (ptr.current.hoverY !== logicalY) {
              if (ptr.current.hoverY !== null) document.getElementById(`hdr-row-${ptr.current.hoverY}`)?.classList.remove('bg-amber-100', 'shadow-[inset_0_0_12px_rgba(251,191,36,0.3)]', 'rounded-none');
              document.getElementById(`hdr-row-${logicalY}`)?.classList.add('bg-amber-100', 'shadow-[inset_0_0_12px_rgba(251,191,36,0.3)]', 'rounded-none');
              ptr.current.hoverY = logicalY;
            }
          }

          const hitTile = state.tiles.find(t => t.currentX === logicalX && t.currentY === logicalY);
          if (hitTile && hitTile.id !== ptr.current.targetId && hitTile.state !== 'locked') {
            setHoveredId(hitTile.id);
          } else {
            setHoveredId(null);
          }
        } else {
          setHoveredId(null);
          if (ptr.current.hoverX !== null) {
            document.getElementById(`hdr-col-${ptr.current.hoverX}`)?.classList.remove('bg-amber-100', 'shadow-[inset_0_0_12px_rgba(251,191,36,0.3)]', 'rounded-md');
            ptr.current.hoverX = null;
          }
          if (ptr.current.hoverY !== null) {
            document.getElementById(`hdr-row-${ptr.current.hoverY}`)?.classList.remove('bg-amber-100', 'shadow-[inset_0_0_12px_rgba(251,191,36,0.3)]', 'rounded-md');
            ptr.current.hoverY = null;
          }
        }
      }
    };

    const handlePointerUp = (eUp: PointerEvent | TouchEvent | MouseEvent) => {
      if ('pointerId' in eUp && eUp.pointerId !== ptr.current.id && eUp.type !== 'pointerleave') return;
      const targetId = ptr.current.targetId;
      
      const clientX = 'clientX' in eUp ? eUp.clientX : ptr.current.currX;
      const clientY = 'clientY' in eUp ? eUp.clientY : ptr.current.currY;
      
      console.log("[MathMagic] Pointer UP/LEAVE, resolving at:", { x: clientX, y: clientY });

      if (ptr.current.state === 'DRAGGING' && ptr.current.moved && targetId && gridRef.current) {
        const hit = MathMagicRules.resolveDrop(
          gridRef.current.getBoundingClientRect(),
          clientX, clientY,
          6, 6,
          gridRef.current
        );

        if (hit) {
          const logicalX = hit.x + gridOffset.x;
          const logicalY = hit.y + gridOffset.y;
          const hitTile = state.tiles.find(t => t.currentX === logicalX && t.currentY === logicalY);
          if (hitTile && hitTile.id === targetId) {
             const t = state.tiles.find(x => x.id === targetId)!;
             const colFact = state.config.activeFactors[t.currentX % state.config.activeFactors.length];
             const rowFact = t.currentY + state.config.startRow;
             const isValid = state.mode === MathMagicMode.RANDOMIZED_GRID ? (t.product === colFact * rowFact) : MathMagicRules.evaluateMatch(t.product, [colFact, rowFact]);

             if (isValid) {
               handleSuccessCombo(targetId, MathMagicRules.getCellRect(gridRef.current, hit.x, hit.y), t.f1, t.f2, t.product, t.color, clientX, clientY);
             } else {
               SensoryManager.dispatch(SensoryEvent.ON_MATCH_FAIL, {});
               triggerCorruptTile(targetId);
               dispatch({ type: 'ERROR_COMBO_RESET' });
             }
          } else if (hitTile && hitTile.state !== 'locked') {
            dispatch({ type: 'SWAP_TILES', sourceId: targetId, targetId: hitTile.id });
            SensoryManager.dispatch(SensoryEvent.ON_TILE_SWAP, undefined);
            const t = state.tiles.find(x => x.id === targetId)!;
            const h = hitTile;
            
            const tf1 = state.config.activeFactors[h.currentX % state.config.activeFactors.length];
            const tf2 = h.currentY + state.config.startRow;
            const hf1 = state.config.activeFactors[t.currentX % state.config.activeFactors.length];
            const hf2 = t.currentY + state.config.startRow;

            const tValid = state.mode === MathMagicMode.RANDOMIZED_GRID ? (t.product === tf1 * tf2) : MathMagicRules.evaluateMatch(t.product, [tf1, tf2]);
            
            if (tValid) {
               handleSuccessCombo(t.id, MathMagicRules.getCellRect(gridRef.current, hit.x, hit.y), tf1, tf2, t.product, t.color, clientX, clientY);
            } else {
               SensoryManager.dispatch(SensoryEvent.ON_MATCH_FAIL, {});
               triggerCorruptTile(t.id);
               dispatch({ type: 'ERROR_COMBO_RESET' });
            }
          }
        } else {
           SensoryManager.dispatch(SensoryEvent.ON_MATCH_FAIL, {});
           dispatch({ type: 'ERROR_COMBO_RESET' });
        }
      }

      let driftActive = false;
      if (theme === 'celestial-orbit' && ptr.current.state === 'DRAGGING' && ptr.current.moved && ghostRef.current) {
        driftActive = true;
        const ghost = ghostRef.current;
        const finalTileId = targetId;
        
        let gx = ptr.current.gX;
        let gy = ptr.current.gY;
        let gvx = ptr.current.gVx;
        let gvy = ptr.current.gVy;
        
        const startTime = Date.now();
        const duration = 250;
        
        const animateClestialDrift = () => {
          const elapsed = Date.now() - startTime;
          if (elapsed < duration) {
            gvx *= 0.88;
            gvy *= 0.88;
            gx += gvx;
            gy += gvy;
            if (ghost) {
              ghost.style.left = `${gx}px`;
              ghost.style.top = `${gy}px`;
              const tiltX = Math.max(-25, Math.min(25, -gvy * 0.9));
              const tiltY = Math.max(-25, Math.min(25, gvx * 0.9));
              ghost.style.transform = `perspective(800px) translate(-50%, calc(-50% - 45px)) scale(1.14) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
            }
            requestAnimationFrame(animateClestialDrift);
          } else {
            let snapTargetX = gx;
            let snapTargetY = gy;
            if (finalTileId) {
              const tileEl = document.querySelector(`[data-id="${finalTileId}"]`);
              if (tileEl) {
                const r = tileEl.getBoundingClientRect();
                snapTargetX = r.left + r.width / 2;
                snapTargetY = r.top + r.height / 2 - 45;
              }
            }
            
            const snapStartTime = Date.now();
            const snapDuration = 80;
            const startX = gx;
            const startY = gy;
            
            const animateCelestialSnap = () => {
              const snapElapsed = Date.now() - snapStartTime;
              if (snapElapsed < snapDuration) {
                const t = snapElapsed / snapDuration;
                const ease = 1 - Math.pow(1 - t, 3);
                const curX = startX + (snapTargetX - startX) * ease;
                const curY = startY + (snapTargetY - startY) * ease;
                if (ghost) {
                  ghost.style.left = `${curX}px`;
                  ghost.style.top = `${curY}px`;
                  ghost.style.transform = `perspective(800px) translate(-50%, calc(-50% - 45px)) scale(${1.14 - 0.14 * ease}) rotateX(0deg) rotateY(0deg)`;
                }
                requestAnimationFrame(animateCelestialSnap);
              } else {
                if (ghost) {
                  ghost.style.display = 'none';
                  ghost.style.transform = 'perspective(800px) translate(-50%, calc(-50% - 45px)) scale(1.14) rotateX(0deg) rotateY(0deg)';
                }
                setDraggedId(null);
                setHoveredId(null);
              }
            };
            animateCelestialSnap();
          }
        };
        animateClestialDrift();
      }

      if (!driftActive) {
        if (ghostRef.current) {
          ghostRef.current.style.display = 'none';
          ghostRef.current.style.transform = 'perspective(800px) translate(-50%, calc(-50% - 45px)) scale(1.14) rotateX(0deg) rotateY(0deg)';
        }
        setDraggedId(null);
        setHoveredId(null);
      }
      ptr.current.id = null;
      ptr.current.state = 'IDLE';
      ptr.current.targetId = null;
      if (ptr.current.hoverX !== null) {
        document.getElementById(`hdr-col-${ptr.current.hoverX}`)?.classList.remove('bg-amber-100', 'shadow-[inset_0_0_12px_rgba(251,191,36,0.3)]', 'rounded-none');
        ptr.current.hoverX = null;
      }
      if (ptr.current.hoverY !== null) {
        document.getElementById(`hdr-row-${ptr.current.hoverY}`)?.classList.remove('bg-amber-100', 'shadow-[inset_0_0_12px_rgba(251,191,36,0.3)]', 'rounded-none');
        ptr.current.hoverY = null;
      }

      window.removeEventListener('pointermove', handlePointerMove as any);
      window.removeEventListener('pointerup', handlePointerUp as any);
      window.removeEventListener('pointercancel', handlePointerUp as any);
      window.removeEventListener('pointerleave', handlePointerUp as any);
      document.body.removeEventListener('mouseleave', handlePointerUp as any);
      document.body.removeEventListener('touchend', handlePointerUp as any);
      document.body.removeEventListener('touchcancel', handlePointerUp as any);
    };

    window.addEventListener('pointermove', handlePointerMove as any, { passive: false });
    window.addEventListener('pointerup', handlePointerUp as any);
    window.addEventListener('pointercancel', handlePointerUp as any);
    window.addEventListener('pointerleave', handlePointerUp as any);
    document.body.addEventListener('mouseleave', handlePointerUp as any);
    document.body.addEventListener('touchend', handlePointerUp as any);
    document.body.addEventListener('touchcancel', handlePointerUp as any);

  }, [state, theme, gridOffset, handleSuccessCombo]);

  const cycleMode = (dir: number) => {
    const modes = Object.values(MathMagicMode);
    const currIdx = modes.indexOf(state.mode);
    const nextIdx = (currIdx + dir + modes.length) % modes.length;
    const nextMode = modes[nextIdx];
    const newTiles = generateTiles(nextMode, state.config);
    dispatch({ type: 'REBUILD_GRID', mode: nextMode, config: state.config, tiles: newTiles });
  };

  const refreshBoard = () => {
    SensoryManager.dispatch(SensoryEvent.ON_GRID_REFRESH, undefined);
    const newTiles = generateTiles(state.mode, state.config);
    dispatch({ type: 'REBUILD_GRID', mode: state.mode, config: state.config, tiles: newTiles });
  };

  return {
    state,
    dispatch,
    gridRef,
    ghostRef,
    draggedId,
    hoveredId,
    gridOffset,
    slideAnimation,
    pulseTarget,
    cascadeOverlay,
    flowStateTrigger,
    theme,
    vfxQuality,
    handleVfxQualityChange,
    corruptedTileId,
    celestialWarpStep,
    elapsed,
    setGridOffset,
    handleThemeChange,
    handlePointerDown,
    cycleMode,
    refreshBoard,
    formatTime,
    activeProduct,
    activeTileFinder,
    setDraggedId,
    setHoveredId,
    setSlideAnimation,
    setPulseTarget,
    setCascadeOverlay,
    setCelestialWarpStep,
    setCorruptedTileId,
    generateTiles,
    handleSuccessCombo
  };
}
────────────────────────────────────────────────────────────────────────────────
