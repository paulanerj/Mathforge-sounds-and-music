# MathGrid Stabilization Baseline (2026-05-11)

This document establishes the authoritative baseline for the MathGrid suite, encompassing both **SpeedGrid** and **CombineGrid**. These games must remain isolated to prevent feature drift and cross-game regressions.

---

## 1. GLOBAL ARCHITECTURAL PRINCIPLES

1. **Isolation Contract**: SpeedGrid and CombineGrid belong to the same suite but share NO gameplay logic. SpeedGrid is rapid and reactive; CombineGrid is strategic and board-state focused.
2. **Shared Engine Usage**:
   - `src/engine/PracticeProfile.ts`: Authoritative mathematical recipes.
   - `src/engine/GridEngine.ts`: Core board generation and validation primitives.
   - `src/engine/SpawnEngine.ts`: Bag-based replenishment systems.
3. **No-Drift Policy**: Any change to shared files MUST be verified against BOTH games.
4. **Mobile-First Geometry**: Both games must utilize 100% of available viewport width on mobile devices, using dynamic tile sizing based on screen dimensions.

---

## 2. SPEEDGRID STABILIZED SYSTEMS

SpeedGrid is currently in a "Feature Freeze" state regarding core mechanics.

| System | Status | Key Contract |
| :--- | :--- | :--- |
| **Grid Refill** | LOCKED | Pure vertical gravity (`GRAVITY_CONTRACT.md`). No diagonal drift. |
| **Input Authority** | LOCKED | Multi-touch support with pointer isolation (`MULTITOUCH_CONTRACT.md`). |
| **Selection Feedback** | LOCKED | Instant color change on path; overshoot feedback is visual-only (no state change). |
| **Time Tiles** | LOCKED | Spezialized `specialType: 'time'`. Collectible via tap, non-selectable in paths. |
| **Settings Lifecycle** | LOCKED | Transactional Draft/Apply model. Categorized as LIVE, REGEN, or RESTART. |
| **Board Integrity** | LOCKED | R0C0 contamination fixed; 3+ solutions guaranteed at start. |

---

## 3. COMBINEGRID STABILIZED SYSTEMS (READY FOR NEXT GAME)

CombineGrid is currently in a "Mechanics Freeze" state and is considered ready for next-game expansion. Core mechanics are stable enough to proceed, and future hyper-polish is deferred.

| System | Status | Key Contract |
| :--- | :--- | :--- |
| **Endgame Trigger** | LOCKED | `combinableTileCount <= 1`. Adjacency/Solutions ignored. |
| **Bomb Mechanics** | LOCKED | 3x3 destructive radius. 2s fuse. Destroys ALL (Trophies/Frozen/Normal). |
| **Undo System** | LOCKED | Pre-action snapshots. Depths limit = 5. Restores masks + board. |
| **Zero Sentinel** | LOCKED | Clearing agent. Combinable for endgame. |
| **Layout** | LOCKED | Compact HUD + Full-width mobile grid. |

---

## 4. SHARED SYSTEMS MAP

| Path | Responsibility | Games Affected |
| :--- | :--- | :--- |
| `src/engine/` | Math recipes, RNG, RNG-based spawning, Target generation. | BOTH |
| `src/components/` | Shared UI primitives (Buttons, Modal Wrappers, EquationPills). | BOTH |
| `src/systems/` | Global state, Audio managers (Draft), Session controllers. | BOTH |

---

## 5. HARD NO-DRIFT RULES

### SpeedGrid
- **Visual-Only Overshoot**: Never modify the `Tile` state in the reducer for an overshoot. Feedback must be handled by the transient overlay layer.
- **Pointer Isolation**: Interaction must never "bleed" between multiple pointers.
- **Strict Settings Apply**: Never apply settings changes until the "Apply" transaction is committed.

### CombineGrid
- **Endgame Simplicity**: Never re-introduce `hasSolution` or adjacency checks into the endgame trigger.
- **Destructive Bombs**: Bombs must always destroy Trophies and Frozen tiles to maintain risk/reward balance.
- **Mask Separation**: `trophyMask` and `frozenMask` MUST stay separate from the `board` values array to ensure UNDO reliability.

---

## 6. PRE-POLISH REGRESSION CHECKLIST

*Detailed checklist available in [MATHGRID_REGRESSION_CHECKLIST.md](./MATHGRID_REGRESSION_CHECKLIST.md).*

1. **SpeedGrid**: Solve 5 targets; trigger overshoot; collect 2 time tiles; verify layout on mobile.
2. **CombineGrid**: Create 1 trophy; explode 1 bomb; use undo; verify endgame triggers correctly.
3. **Cross-Game**: Switch games twice; verify session persistence (if implemented).

---

## 7. POLISH BACKLOG (SAFE TO MODIFY)

- Audio cues and haptic vibration feedback.
- Particle effect density and colors.
- UI Border-radius and shadow refinements.
- Transition animations between game phases.

---

## 8. DEFERRED ARCHITECTURE (FORBIDDEN TO MODIFY)

- NO CombineGrid gravity refactor.
- NO Shared layout refactor that breaks individual game isolation.
- NO major rewrite of the `SpawnEngine`.

---

## 9. SOURCE FILE INVENTORY

### SpeedGrid Ownership
- `src/games/speed-grid/SpeedGridGame.tsx`: Main game component.
- `src/games/speed-grid/SpeedGridReducer.ts`: HUD & layout state management.
- `src/games/speed-grid/SpeedGridRules.ts`: Core simulation & refilled gravity logic.
- `src/games/speed-grid/SpeedGridInputTuning.ts`: Multi-touch constants.
- `docs/speedgrid/**/*`: All SpeedGrid-specific documentation.

### CombineGrid Ownership
- `src/games/combine-grid/CombineGridGame.tsx`: Main game component.
- `src/games/combine-grid/cgReducer.ts`: State management and Undo logic.
- `src/games/combine-grid/CombineGridRules.ts`: Board simulation & merge rules.
- `src/games/combine-grid/services/GridService.ts`: Static board utility services.
- `docs/combinegrid/**/*`: All CombineGrid-specific documentation.

### Shared Systems (High Risk)
- `src/engine/PracticeProfile.ts`: Math difficulty recipes.
- `src/engine/GridEngine.ts`: Shared solvability and board generation.
- `src/engine/SpawnEngine.ts`: Shared refill/replenishment primitives.

---

## 10. AUDIO/HAPTICS V1 WIRING STATUS

**SpeedGrid:**
- button tap: WIRED
- selection/path event: WIRED (tick)
- success: WIRED
- overshoot: WIRED
- time tile ready: NOT WIRED
- time tile collect: WIRED

**CombineGrid:**
- button tap: WIRED
- merge/swipe: WIRED
- trophy creation: WIRED
- bomb fuse: WIRED
- bomb explosion: WIRED
- undo: WIRED
- endgame/results: WIRED

---

## 11. AUDIO/HAPTICS V1 CONTRACT

Rules:
* shared SoundService is the single source of truth
* shared HapticService is the single source of truth
* sounds are generated locally / no external audio URLs
* audio unlock occurs on user gesture
* sound setting controls sound only
* haptics setting controls vibration only
* sound/haptics never block gameplay
* sounds may be redesigned later without changing game mechanics

---

## 12. GUARDRAIL ASSERTIONS AUDIT

| Game | Guardrail | Status | Verification Message |
| :--- | :--- | :--- | :--- |
| **SpeedGrid** | Overshoot Contamination | **EXISTS** | `OVERSHOOT_TILE_CONTAMINATION` (Game.tsx) |
| **SpeedGrid** | Grid Corruption | **EXISTS** | `GRID CORRUPTION: Row/Col mismatch` (Rules.ts) |
| **SpeedGrid** | R0C0 Isolation | **IMPLICIT** | Selection logic isolates first index by `instanceId`. |
| **CombineGrid** | Premature Endgame | **EXISTS** | `PREMATURE_ENDGAME_BLOCKED` (cgReducer.ts) |
| **CombineGrid** | Undo Integrity | **EXISTS** | `UNDO INTEGRITY FAILURE` (cgReducer.ts) |
| **CombineGrid** | Board Corruption | **EXISTS** | `Solver called with invalid board` (GridService.ts) |

---

## 13. SOUND DESIGN BACKLOG (DESIGN V2)

**Goal:**
Replace rough placeholder tones with more polished, game-appropriate sounds.

**Potential improvements:**
* softer button click
* cleaner success chime
* less harsh overshoot warning
* better bomb fuse
* better bomb explosion
* rewarding trophy sound
* time tile shimmer/reward
* better volume balance
* reduced repetition fatigue

---

*Status: MATHGRID SUITE STABILIZED (2026-05-11)*