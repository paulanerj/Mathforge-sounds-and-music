# CombineGrid Current State Audit (2026-05-11)

> [!IMPORTANT]
> **This document is for historical audit purposes.**
> For the authoritative rules and architectural constraints, see:
> [COMBINEGRID_STABILIZATION_BASELINE.md](./COMBINEGRID_STABILIZATION_BASELINE.md)

## COMBINEGRID POLISHED BASELINE (READY FOR NEXT GAME)

CombineGrid is currently ready for next-game expansion. Core mechanics are stable enough to proceed, and future hyper-polish is deferred.

**Recent Improvements:**
- **COMBINEGRID SELECTED CODED SOUND EFFECTS BASELINE**: Selected coded effects integrated (merge, blocked, trophy, wildcard pop, endgame tick, endgame splash). Bomb explosion volume was adjusted safely from handoff draft (gains lowered to 0.35/0.2) to prevent speaker distortion. Ambient music was deferred entirely in this pass (to keep the scope tight). Strict bomb fuse cleanup lifecycle enforced. SpeedGrid sound compatibility perfectly preserved. `SoundService` wholesale replacement explicitly avoided.
- **SOUND DESIGN DRAFT REVIEWED & INTEGRATED**: Successfully audited and integrated safe portions of the Sound Design Draft.
  - **Accepted**: Game-specific methods (`playCombineGridTrophy`, `playCombineGridMerge`, etc.), localized bomb fuse logic, ambient loop scaffolding.
  - **Rejected/Deferred**: Wholesale `SoundService` replacement, global volume tweaks, or generic method re-assignments (SpeedGrid methods remain strictly preserved).
- **AMBIENT MUSIC SAFETY RULE**: Ambient music must start only after user interaction, exactly one loop may run at a time (guarded against stacking), and it must clean up correctly on unmount/toggle. Low volume and no oscillator leaks allowed.
- **BOMB FUSE CLEANUP RULE**: The bomb fuse audio loop must clearly stop when a bomb explodes, on undo, on restart, and on unmount, with strict tracking to prevent layering multiple active fuse sounds.
- **AUDIO-ONLY RANDOMNESS EXCEPTION**: Use of `Math.random()` is permitted *only* for varying audio frequencies and textures in `SoundService`. It must never leak into gameplay paths, reducer logic, spawn tables, or sequence generation.
- **COMBINEGRID SOUND POLISH PHASE 1A LOCKED BASELINE**: Ambient/music layer works (soothing low-volume ambient loop), trophy sound upgraded and accepted, core sound effects improved. Settings toggles support SFX and Music individually. Audio remains subtle, child-friendly, and non-fatiguing. Future music work will happen through a dedicated music/audio design handoff. No gameplay behavior changed.
- **COMBINEGRID SOUND POLISH PHASE 1A BASELINE**: Added soothing ambient music background loop, distinct settings toggles for SFX/Music, and upgraded trophy/interaction sounds using child-friendly wooden and acoustic tones. Strict checks prevent loops overlapping and ensure audio context is efficiently unlocked. SpeedGrid compatibility preserved.
- Trophy sound shortened (avoids sound fatigue).
- Input latency and general rapid play responsiveness (stalemate delay removed) fixed.
- Visual effects decoupled from input locks.
- Bomb sound sequence added.

**Wildcard**
- Renders as `?` internally representing `ZERO_TILE_VALUE` (100).
- Combine effect has a tight accelerating vibration, spinning coin wobble, and pops.
- Stable and distinct.

**Bomb Current Status**
- Tap starts fuse. Ignites, waits 1s, clears 3x3 radius area.
- Works reliably, including visual polish and sound sequence.

**Endgame Current Status**
- Checked continuously if combinableCount <= 1.
- Automatically transitions to Counting Phase and tallies score. Sounds play during tally. Plays full Result Splash with Stars and Trophies.

**Undo Current Status (LOCKED)**
- **Reliability Rule**: Undo must restore board immediately. No blank tiles allowed. No interaction required to refresh.
- **UNDO GHOST TILE ROOT CAUSE — LOCKED**: 
  - `snapshotState` captured transient interaction state if captured during interaction.
  - Specifically, active `dragSource`, `selection`, `selectionVal`, or related UI pointer state could persist inside the undo snapshot.
  - When UNDO restored the snapshot, board values were correct, but `Tile.tsx` treated the restored source tile as an active drag source.
  - Active drag source tiles render hidden/zero-opacity.
  - This created the apparent blank tile until later interaction cleared the stale drag state.
- **Fix**: `snapshotState` and `UNDO` now explicitly zero out all transient UI state (`dragSource`, `selection`, `ignitedBombPos`, `clearingPositions`).
- **UNDO SNAPSHOT SANITIZATION CONTRACT — LOCKED**:
  - Snapshots must store gameplay-restorable state only.
  - Snapshots must NOT preserve active drag state (`dragSource`).
  - Snapshots must NOT preserve active selection state (`selection`, `selectionVal`).
  - Snapshots must NOT preserve ignited bomb state (`ignitedBombPos`).
  - Snapshots must NOT preserve transient visual arrays (`clearingPositions`, `respawnPositions`).
  - `UNDO` must restore board/masks/score/target but force interaction state to rest.
  - `UNDO` must clear component-local animation/visual states (in `CombineGridGame.tsx` handler).
  - `UNDO` must NOT depend on user touch/rerender to become visually correct.
- **Sync Hardware**: `Board` rendering key includes `state.version` to force clean DOM state on restoration.

**Recipe Mode Status**
- **Deterministic Targets**: Target sequence `recipeTargets` is respected.
- **Progression**: `recipeIndex` increments on `ADVANCE_ROUND` (Next Level) and is preserved on `PLAY_AGAIN` (Retry).
- **Parsing**: Target list in settings supports commas, spaces, and newlines.

**Mobile Layout Current Status**
- Responsive button sizes using `clamp`, compact grid layout maximizing view width seamlessly.

**Deferred Polish Items**
- Final hyper-polish pass later.
- Deeper sound mastering later.
- Final bomb visual refinement later.
- Final results screen polish later.
- Cross-game style consistency later.

---

## PERFORMANCE STABILIZATION BASELINE (2026-05-13)

Current build enforces strict performance caps to ensure smooth mobile play on devices like iPhone 12.

**Key Changes:**
- **Stripped Result Effects**: Removed expensive per-trophy particle bursts during the counting phase.
- **Simplified Trophy Counting**: Transitioned to a "simple" count-up mode (max 700ms) without exhaustive grid-sweep particles or per-trophy sounds.
- **Particle Budgets enforced**: 
  - Max total bomb particles: 36.
  - Particles per tile: 2-3.
  - Duration: 450ms.
- **CSS Optimized**: 
  - Removed `backdrop-filter` (blur) from result and modal overlays.
  - Replaced expensive `box-shadow` animations with simple `transform` or `opacity`.
  - Removed `filter` effects from individual tiles and trophy icons.
- **Haptic/Sound Optimization**: Removed repeated oscillator and sound calls during trophy counting to prevent audio buffer congestion.

---

## COMBINEGRID SOUND CONTRACT (2026-05-13)

Sound is a protected subsystem. Regression testing must be performed after any UI or performance changes.

**Rules:**
- **Persistence**: User sound setting must be respected. Default is ON.
- **Unlocking**: `SoundService.unlock()` must be called on `pointerdown` of the game surface to ensure AudioContext resume on mobile.
- **Minimalism**: In result screens, per-trophy tally sounds are disabled for performance/UX. Use single "Round Complete" and "Session Complete" sounds instead.
- **Shared Compatibility**: `SoundService.ts` is shared with SpeedGrid. Do NOT remove or rename existing methods used by either game.
- **Volume Baseline**: 
  - Master Gain: 0.8
  - UI Taps: 0.15 (Triangle)
  - Merges: 0.2 (Sine) + 0.15 (Mallet)
  - Trophies: 0.5 (Sine) + 0.25 (Mallet)

---

## PERFORMANCE HARDENING BASELINE (2026-05-13)

Implemented strict drift-resistant constants and performance optimizations:
- **TILE_TRANSITION_CONTRACT**: No `transition: all` allowed in Tile.tsx. Background/gradient transitions are expensive on mobile. Only transform, box-shadow, and opacity are allowed to animate.
- **WILDCARD_ANIM_CONTRACT**: Magic numbers for the Wildcard animation have been extracted to `constants.ts` (`WILDCARD_ANIM`).
- **INPUT_LOCK_CONTRACT**: Animation and phase conditions that block input are represented in a unified `computeInputLocked` helper.
- **SOUND SERVICE SHARED WARNING**: `SoundService` is shared. Fuse oscillator count capped to 8 to prevent audio node exhaustion. Do NOT rename SpeedGrid sound methods.
- **LOGGING CONTRACT**: Added `cgLog` helper; noisy logs are now gated behind `process.env.NODE_ENV !== 'production'`.

---

## COMBINEGRID POLISH PHASE 1 BASELINE (2026-05-13)

This baseline locks the UI and visual cosmetic improvements. No mechanical or rule-based drift occurred.

### 1. HUD & Navigation Polish
- **Grouped Controls**: Bottom buttons are now logically clustered into "Nav", "Targets", and "Meta" groups with a unified blurred background.
- **Improved HUD Row**: Top HUD uses a more distinct target box, trophy counter, and center-aligned equation display with entry/exit animations.
- **Equation Pill**: High-contrast pill with distinct font weights for values and target. Locked against line-wrap.
- **Watchdog Overlay**: Integrated a dev-only debug monitoring system (Watchdog) that tracks phase, combinable tiles, and history depth.

### 2. Result Screen Modernization
- **Theme**: Dark, semi-transparent backdrop with high-profile contrast for stats.
- **Staggered Animations**: Stats, stars, and buttons enter with coordinated spring offsets.
- **ActionButton Polish**: Clearer visual hierarchy between "Continue" and "Quit/Restart" actions.

### 3. Visual Clarity Improvements
- **Wildcard Bond Line**: An SVG line connects the wildcard and its partner during the 1000ms vibration phase to clarify the multi-tile target.
- **Blast Visuals**: Updated `cgTileBlast` animation for sharper destruction feedback.
- **Particle Rhythm**: Verified that particle bursts align with tile pops without overlapping render cycles.

### 4. Shared Safety Verified
- **index.css**: All animations are `cg-` prefixed. No global element leaks.
- **SoundService**: Type-safe `resume()` check added. Legacy SpeedGrid signatures preserved.

---

## 1. File Inventory & Architecture

### Core Logic
- `src/games/combine-grid/CombineGridRules.ts`: Master rules engine, merge logic, and invariants.
- `src/games/combine-grid/cgReducer.ts`: Reducer with snapshot-based UNDO support and state transition assertions.
- `src/games/combine-grid/CombineGridSpawnStrategy.ts`: Strategy for selecting tile categories (Factors, Distractors, Zeros, Bombs).

### Components & UI
- `src/games/combine-grid/CombineGridGame.tsx`: Main game component, handles pointer orchestration and HUD.
- `src/games/combine-grid/components/Board.tsx`: Grid rendering component.
- `src/games/combine-grid/components/Tile.tsx`: Individual tile rendering with state-based styling.
- `src/games/combine-grid/components/ResultScreen.tsx`: End-of-round summary and scoring display.
- `src/games/combine-grid/components/GameErrorBoundary.tsx`: Stability wrapper.

### Services & Utilities
- `src/games/combine-grid/services/GridService.ts`: Low-level grid queries (solvability, move validation, status checks).
- `src/games/combine-grid/services/SelectionService.ts`: Selection state helpers.
- `src/games/combine-grid/constants.ts`: Game-specific constants (BOMB_TILE_VALUE=99, ZERO_TILE_VALUE=100).
- `src/games/combine-grid/types.ts`: CG-specific TypeScript interfaces.
- `src/games/combine-grid/uiTokens.ts` / `layoutTokens.ts`: Styling and layout configuration.

### Debug & Quality Control
- `src/games/combine-grid/debug/assertPosition.ts`: Spatial validation helpers.
- `src/games/combine-grid/debug/cgBoardDiff.ts`: Detects illegal board mutations.
- `src/games/combine-grid/debug/cgSpawnAudit.ts`: Enforces mathematical density and solvability thresholds.

---

## 2. Working Systems Status

| System | Status | Notes |
| :--- | :--- | :--- |
| **Board Generation** | STABLE | Uses `SpawnAudit` with retries to ensure playable starting boards. |
| **Target Generation** | STABLE | Factors based on practice profiles and recipe targets. |
| **Merge Logic** | STABLE | Product, Identity (1xN), Frozen (>Target), and Trophy (Target) variants. |
| **Trophy System** | STABLE | Creation, locking (trophyMask), and swapping behavior verified. |
| **Undo System** | STABLE | Snapshot-based restoration in `cgReducer.ts`. |
| **Score/Tally** | STABLE | Animated counting phase at round end. |
| **Bomb Mechanics** | PARTIAL | 3x3 explosion logic exists; integrated into Drag/Drop. Needs more stress testing. |
| **Zero Mechanics** | STABLE | Sentinel value (100) that clears neighbors/self on merge. |
| **Gravity / Refill** | **UNKNOWN** | Currently uses **In-Place Respawn**. Tiles do not fall; they just pop into empty slots. |
| **Interaction** | STABLE | Drag/Drop and Tap selection both supported and isolated. |

---

## 3. Engine Boundary & Dependencies

- **Isolation**: No direct dependencies on `src/games/speed-grid`.
- **Shared Systems**:
  - `src/engine/SpawnEngine.ts`: Shared bag-based spawning logic.
  - `src/engine/PracticeProfile.ts`: Shared difficulty settings.
  - `src/components/EquationPill.tsx`: Shared mathematical feedback UI.
- **Key Difference**: `CombineGrid` uses `number[][]` for the board, whereas `SpeedGrid` uses specialized `Tile` objects with `instanceId`. This makes CG more robust to ID stale-ness but harder to animate with gravity.

---

## 4. Invariants & Stability

- **Spatial Integrity**: Every move is checked against `assertPosition`.
- **Static Law**: `enforceStaticLaw` ensures no cell outside the active interaction is modified.
- **Valid Transition**: `assertStateTransition` (Engine Contract) ensures data type safety.
- **Solvability**: `hasSolution` is checked after every refill to prevent dead-board states.

---

## 5. Risk Areas

1. **Refill Static-ness**: Lack of gravity makes the board feel "dead" compared to SpeedGrid.
2. **Solvability Depth**: Current `hasSolution` only checks target pairs; does not guarantee a full board clear is possible.
3. **Architecture Fork**: The `number[][]` representation is diverging significantly from the `TileObject[][]` pattern used in the rest of the engine.
4. **Bomb Interaction**: Explosions near board edges or intersecting with trophies need rigorous edge-case validation.

---

## 6. BOMB RISK/REWARD DESTRUCTION CONTRACT (AUDIT VERIFIED)

A bomb is a special destructive tile that clears ALL in-bounds tiles in a 3x3 radius, creating a high-stakes choice for the player.

### 6.1 Blast Area Contract
- **Center**: (r, c)
- **Radius**: 3x3 square (r-1..r+1, c-1..c+1).
- **Bounds**: Clipping is enforced at board edges/corners. No out-of-bounds mutations.

### 6.2 Destruction Policy (Risk/Reward)
- **EVERYTHING IS DESTROYED**: Trophies, Frozen tiles, Zeros, Normal tiles, and the Bomb itself.
- **Strategic Risk**: The player must decide if clearing a dense area justifies losing adjacent Trophies or Frozen progress.

### 6.3 Action Sequence
1. **Ignition**: Tap starts 2s fuse.
2. **Explosion**: `BOMB_EXPLODE` action sets all 3x3 cells to `0` (Empty) and clears all masks.
3. **Clearing**: Transition to `CLEARING` phase (200ms).
4. **Respawn**: transition to `CLEAR_COMPLETE`. All `clearingPositions` are refilled with new tiles from the generation bags.

### 6.4 Zero/Empty Delineation
- `0` = Empty/Destroyed (Transitional state during clearing).
- `100` = Playable Zero (Destroyable just like any other tile).
- Cells currently marked `0` are NOT playable and act as voids awaiting refill.

### 6.5 Undo Contract
- UNDO restores the exact board snapshot before the explosion was processed.
- Restores: Board values, Trophy Mask, Frozen Mask, Bonus Mask, and Score.

---

## 7. Regression Checklist

- [ ] Verify starting board has at least one valid target pair.
- [ ] Verify 1xN merge results in N.
- [ ] Verify NxM (where N*M > Target) results in a Frozen tile.
- [ ] Verify NxM (where N*M == Target) results in a Trophy.
- [ ] Verify Trophies can be swapped with normal tiles but not merged.
- [ ] Verify Zeros clear themselves and neighbors.
- [ ] Verify UNDO restores board, masks, and score perfectly.
- [x] Verify stalemate resolution activates if no moves remain. (Now triggers round end)
- [ ] Verify round-end tally counts all trophies correctly.
- [x] Verify wildcard clear does not deterministically respawn a wildcard.
- [x] Verify replacement tiles vary based on standard probabilities.

---

## 8. FREEZE / LOCKUP FORENSIC AUDIT (2026-05-11)

### 8.1 Suspected Causes
1. **Unbounded History Leak (CONFIRMED)**: The `cgReducer.ts` was creating an infinite linked list of full state clones in `state.history`. As play progressed (reaching ~12 trophies), the state object grew exponentially in memory footprint, likely causing GC thrashing or a browser-level hang.
2. **Stalemate Deadlock (CONFIRMED)**: If a board was solvable via non-adjacent moves (`hasSolution` = true) but had no adjacent moves (`hasValidMoves` = false), the phase would remain `PLAY` but the user could not move anything. This appeared as a "hang" where no grid interactions worked.

### 8.2 Fixes Applied
1. **History Capping**: Added `truncateHistory` helper to `cgReducer.ts` and set a max history depth of 5 steps.
2. **Advanced Stalemate Detection**: Updated `isRoundComplete` in `GridService.ts` to detect when no valid moves are possible (and no bombs are active). This now triggers an automatic round end (Counting Phase) rather than leaving the user stuck.
3. **Debug Watchdog Instrumentation**: Added a `DEBUG` toggle to the UI (dev-only) that shows real-time metrics:
   - Phase / Version / Target
   - Playable Tiles / Bomb Count / Particles / Timers
   - Real-time History Depth monitor
   - Action Log buffer

### 8.3 Remaining Risks
- **Large Boards**: 6x6 is stable, but larger boards with many trophies might hit solvability time-outs if moved to 10x10+ without optimization.
- **Particle Overhead**: Extremely high explosion counts (chain reactions) could still cause frame drops.

### 8.4 How to Capture Debug State
If the app slows or locks:
1. Press the small **DEBUG** button at bottom-left (dev only).
2. Look at **History** depth (should stay at 5).
3. Check **Timers** count (should be small, <10).
4. Click **COPY** to put the full diagnostic JSON on your clipboard for reporting.

---

## 10. SIMPLIFIED ENDGAME CONTRACT (2026-05-11)

### 10.1 Playable Tile Count Rule
- **Primary condition**: The board round is considered finished when the number of **combinable tiles** is **≤ 1**.
- **Exclusions**:
  - Trophies (captured solutions) are **NOT** combinable.
  - Frozen tiles (blocked invalid merges) are **NOT** combinable.
  - **Bombs**: Bombs are NOT combinable and **do NOT block** the endgame trigger when combinableCount ≤ 1. (Decision: Even if a bomb exists, 1 or fewer number tiles cannot be merged, so the level ends).
  - Empty cells (value 0) do not count.
- **Inclusions**:
  - Regular number tiles and "Zero" tiles (`100`) are combinable.

### 10.2 Detection Philosophy
- **No Adjacency Check**: Adjacency does NOT matter for the endgame trigger.
- **No Target Check**: Whether an exact target solution exists does NOT matter for the endgame trigger.
- **Minimalist**: If 2+ combinable tiles remain, the game continues. If the user is stuck (no adjacent moves), they must wait for the timer or use a bomb.

### 10.3 Transition Flow
When finished:
1. Input is locked (`state.phase = 'COUNTING'`).
2. Trophies are counted one-by-one with an animation.
3. Upon completion, `FINISH_COUNTING` is dispatched.
4. `state.phase` becomes `SUMMARY` (or `FINAL` if it's the last round).
5. The Results Splash overlays the board.

### 10.4 Debug Watchdog
- Dev-only **DEBUG** button provided.
- **Diagnostic JSON**: Includes target, board values, trophy counts, bomb counts, zero counts, combinable counts + list, phase, version, and reason for endgame trigger.
- **Premature Guard**: Dev mode logs `PREMATURE_ENDGAME_BLOCKED` if an endgame transition is attempted while `combinableCount > 1`.

---

## 11. MOBILE LAYOUT CONTRACT (2026-05-11)

### 11.1 Compact HUD
- **Target Box**: Rectangular and compact.
- **Equation Pill**: Fixed font size (14px) and contained to prevent wrap.
- **Trophy Counter**: Displayed as a simple count (`🏆 N`) instead of stars during active gameplay.
- **No Gameplay Stars**: Stars only appear in the final/round results splash.

### 11.2 Optimized Layout
- **Fullscreen Utilization**: Grid uses `1.0` of available viewport width.
- **Dynamic Sizing**: Tile size is calculated as `min(availableWidth / cols, availableHeight / rows)` to maximize size regardless of aspect ratio.
- **Reduced Gaps**: `TILE_GAP` and `BOARD_PADDING` reduced to `3px` and `2px` respectively.
- **Top-Aligned Vertical Stack**: HUD and Board are pushed together at the top, with extra space pushed below the board towards the footer.
- **Rounded Geometry**: Tiles and board use reduced border radii (`6px` and `8px`) for a modern, dense look.

### 11.3 Debug Watchdog
- Dev-only **DEBUG** button provided.

## 20. WILDCARD REFILL CONTRACT (2026-05-15)

To prevent deterministic wildcard loops and ensure game balance:
- **Value Resolution**: Wildcard interactions must clear involved cells to `0` (Empty) before initiating refill.
- **Source Identification**: All non-bomb refill operations (including those involving wildcards) are treated as `MERGE` refills.
- **Probability Rule**: Replacement tiles must be drawn from the standard balanced category bag. Wildcards may only reappear if selected by the normal spawn probability (approx 2.8% in a full bag).
- **Identity Dissociation**: The previous existence of a wildcard at a position must NOT influence the value of its replacement.
- **Undo Integrity**: UNDO must restore the original wildcard and its partner exactly as they were before the interaction.
## 21. POST-MULTITOUCH FIX STABLE BASELINE (2026-05-15)

CombineGrid reached a critical stabilization point after resolving ghost merges and timer leaks.

### 21.1 Input Authority
- **Single-Active-Pointer**: Verified. One pointer at a time.
- **Adjacency Enforcement**: Reducer rejects any multi-tile interaction where source and destination are not orthogonal neighbors.
- **Multi-Touch Deflection**: Secondary touches while one is active are ignored.

### 21.2 State Integrity
- **Versioning**: `state.version` increments on every lifecycle change.
- **Stale Guard**: Reducer rejects `DRAG_DROP`, `BOMB_EXPLODE`, and `CLEAR_COMPLETE` if the incoming version check fails.
- **Timer Management**: `safeSetTimeout` and `safeSetInterval` wrap native timers to ensure mid-flight cleanup on unmount or cancellation.

### 21.3 Feature Baseline
- **Wildcard Refill**: Randomly varied based on balanced bag; no deterministic loop.
- **Bomb Mechanics**: 3x3 destruction with staggered ripple animation.
- **Undo**: Restores board, masks, and version properly.
- **Endgame**: Triggers when `combinableCount <= 1`.

## 22. FACTOR GUIDANCE PHASE 1 BASELINE (2026-05-15)

Added visual learning aids to help players identify factors.
- **Pure Helpers**: Deterministic stateless generation of factor pairs and recipes up to 3 factors. `getFactors`, `getFactorPairs`, `getFactorRecipes`.
- **Tile Indicator**: A subtle emerald green dot in the top-right corner marks tiles that perfectly divide the target. Must not show on wildcard, bomb, trophy, or frozen tiles.
- **Recipe List**: A compact display under the HUD showing valid factor combinations (e.g. `4 x 6`, `2 x 2 x 6`). Updates reactively based on target.
- **Performance**: Visual only, memoized safely, no expensive shadows.
- **Settings Toggle**: `showFactors` toggle in settings (Default ON) hides both indicators and recipes instantly.
- **No Gameplay Changes**: No changes to board spawn frequencies, representation, or merge logic. SpeedGrid remains fully untouched.

## 23. FACTOR GUIDANCE PEDAGOGY NOTES (2026-05-15)

The factor guidance feature emerged from formally observing a child player struggling to determine which numbers were valid factors for a target.

- **Delayed Recall Support**: The factor recipe list supports working memory and delayed recall. The learner can observe valid factor combinations (recipes) and then independently scan the grid for those components.
- **Visual Recognition Support**: The green factor dots directly support visual recognition, reducing the cognitive load of division calculations.
- **Risk of Bypassing Recall**: A known pedagogical risk is that if green dots are always visible, the player might bypass mental recall entirely and play purely via matching dots. 
- **Future Direction**: Future iterations of settings should allow separate granular control over the recipe list versus the grid dots. Additionally, replacing always-on dots with an on-demand "Hint" or "Factor Help" button may provide a stronger pedagogical scaffold, prompting active engagement before providing the answer.

## 24. FACTOR GUIDANCE PHASE 2A LOCKED BASELINE (2026-05-15)

User-verified factor guidance settings split into granular pedagogical modes:
- **Show Factor List**: Controls the recipe list near the top (Default ON).
- **Show Factor Dots**: Controls the green dots on factor tiles (Default ON).
- **Show Distractor Dots**: Controls a muted amber dot on normal non-factor tiles (Default OFF) for advanced checking/training.
- Settings are now grouped under a "Factor Help" section in settings.
- Feature remains visual and read-only with no gameplay impact or spawn logic changes.
- Future expansion should be done as separate phases.

## 25. FACTOR HELP BUTTON PHASE 2B BASELINE (2026-05-15)

Added an on-demand Factor Help button that overrides the `showFactorDots` setting if it is OFF.
- Provides a transient 3.5s visual reveal of the factor dots without changing permanent settings or triggering reducer actions.
- Encourages the "Recall Mode" setting structure where a user can try to remember factors, but safely check them temporarily.
- Timer safely cleans up on target changes and unmounts.

## 26. FACTOR INFO / TROPHY EQUATION POPUP BASELINE (2026-05-15)

- Removed permanent equation pill from top slot.
- Relocated Factor Info into the old equation pill slot, providing native flexibility without expanding the board vertically ("No ghost area").
- Factor dots/list toggles are preserved and safe.
- Equation popup is now a transient modal overlay that appears exclusively on successful target (trophy) combinations, lasting ~1.5 seconds.
- Transient equation does not trigger on ordinary block merges.

## 27. BOARD-CENTER TROPHY EQUATION POPUP BASELINE (2026-05-15)

- Improved the motion path of the trophy equation popup. 
- The popup now originates precisely at the valid combine location on the board.
- Travels smoothly towards the center of the board.
- Avoids UI overlap in the top HUD or interference with the controls at the bottom before fading away cleanly.

## 28. FUTURE TODO — COMBINEGRID TARGET SEQUENCE

- **Result Screen Announcement**: The result screen should eventually announce the actual, deterministic next target number.
- **Commitment Rule**: Next target value must be committed in state BEFORE being displayed to the user on the result screen.
- **Loading Guarantee**: "NEXT LEVEL" action must load the exact target number displayed on the preceding result screen.
- **Deterministic Navigation**: Transition between targets (previous/next) should eventually move away from semi-random generation towards a deterministic sequence or history-aware list.
- **No Guessing**: The result screen must never guess or predict a next target (e.g., removing legacy `target * 2` logic).

Note: The "zero special tile" is being renamed/reframed as "Wildcard" (`?`) for user-facing design, although the underlying mechanics remain the same for now.

When a normal tile combines with a Wildcard tile:
1. The zero-combine interaction begins.
2. Both involved tiles remain visually connected/active.
3. Both tiles begin vibrating/shaking.
4. Shake starts subtle and gets faster/more intense over about 1 second.
5. A buzzing sound starts and accelerates with the vibration.
6. At the end, both tiles pop.
7. Final sound should be a playful “bonk-pop” or “spring-pop.”
8. Small cube/confetti particles burst from the tile positions.
9. Board then updates according to the existing zero behavior.
10. This should feel like a special feature, not a generic clear.
- Effect duration: ~900–1100ms. No board mutation before snapshot. Undo restores pre-zero state.

---

## 13. TROPHY SWAP CONTRACT

Trophy swaps must be bidirectional.
- Allowed: normal tile to trophy, trophy to normal, zero to trophy, trophy to zero, bomb to trophy, trophy to bomb.
- Rule: If one of the two cells is a trophy and the other is a movable tile, the two cells swap.
- Trophy should not accidentally merge as a number.

---

## 14. BOMB TAP VS DRAG CONTRACT

A. Tap bomb:
- starts fuse -> bomb is armed -> explodes after fuse.

B. Drag/swap bomb:
- bomb can be moved/swapped if legal (especially bidirectionally with trophy).
- dragging a bomb must NOT start the fuse.

Distinction:
- pointer down on bomb starts a pending interaction, not fuse immediately.
- if pointer moves beyond drag threshold, treat as drag/swap.
- if pointer releases without drag threshold, treat as tap and start fuse.
- if bomb is already armed, it cannot be moved.

---

## 15. BOMB FUSE / EXPLOSION VISUAL CONTRACT

1. Player taps bomb.
2. Bomb enters armed/fuse state.
3. Wick throws flame/sparkler particles.
4. Fuse tip gets a glowing red cherry.
5. Fuse lasts about 2 seconds.
6. Bomb explodes in a bright flash.
7. Explosion affects 3x3 in-bounds blast radius.
8. Affected tiles do not pop exactly simultaneously. Each has a small individual pop (variance 0–100ms).
9. Particles are small cubes/confetti-like pieces.
10. Destroyed tiles visibly disappear/transition into regenerated tiles. Bomb disappears.
11. Undo restores pre-bomb state.
- No chain reaction. No long blocking animation. Visual matches board state. Bomb cannot be retriggered or moved while armed.

---

## 16. COMBINEGRID SOUND DESIGN CONTRACT (MONUMENT VALLEY STYLE)

Style: Soft, premium, glass/wood/ceramic-like tactile soundscape. Light percussion, gentle marimba/kalimba/glockenspiel tones, tiny crystalline chimes. No harsh arcade beeps. Short, pleasant, non-fatiguing.

### Event Map
1. button tap: Warm click.
2. tile pick up / drag start: Light ceramic pluck.
3. tile swap: Muted wood block slide.
4. valid merge below target: Soft glass ping.
5. exact target / trophy creation: Premium upward chime (see below).
6. invalid move: Dull thud/clack.
7. zero-combine start: Low vibration tone.
8. zero-combine buzz: Accelerating/pitch-rising rattle.
9. zero-combine bonk-pop: Playful spring/wood pop.
10. zero-combine confetti: Light paper rustle/shimmer.
11. trophy swap: Smooth heavy slide lock.
12. bomb tap/fuse start: Spark ignite.
13. bomb fuse sparks: Soft sizzling loop.
14. bomb explosion: Muted bass thud + glass shatter.
15. individual tile pop: Quick bubble/ceramic pop.
16. undo: Reverse slide mechanism.
17. endgame begins: Soft chime.
18. trophy counting tick: Marimba/kalimba tones (see below).
19. star/result reveal: Bright flourish.
20. restart/next button: Premium click.

### Premium Trophy Sound
Reward moment, slightly magical. Polished glass/metal/wood chime. Quick upward interval with gentle shimmer tail. Under 700ms. Web Audio implementation suggested.

---

## 18. BOMB RIPPLE BASELINE CONTRACT (2026-05-12)

This contract defines the officially approved behavior and visual timing for the CombineGrid bomb.

### Gameplay Rules
- **Risk/Reward**: Bomb is a destructive tile that clears a 3x3 radius. Players must decide if clearing a dense area justifies losing progress (Trophies/Frozen).
- **Destruction Coverage**: Destroys everything in the 3x3 blast zone (Normal, Zero, Trophy, Frozen, Bomb Center).
- **Trigger**: Single tap ignites the fuse. Dragging/swapping a bomb does NOT ignite it.
- **Lock Window**: Input is fully locked during the 450ms visual ripple. Undo is disabled during this window to prevent state corruption.
- **Resolution**: Reducer destruction (setting cells to 0) occurs *after* the visual ripple finishes.

### Visual Timing Sequence
- **Phase 1 (0ms)**: Center tile explodes (Blast animation + large debris).
- **Phase 2 (~80ms)**: Orthogonal neighbors (Top, Bottom, Left, Right) explode.
- **Phase 3 (~160ms)**: Corner tiles explode.
- **Total Duration**: ~450ms until the board resolves and refills.

### Visual Polish
- **cgTileBlast**: Tiles pop, shrink, and fade using a custom CSS animation.
- **Staggered Particles**: Particles emit in a ripple pattern matching the explosion sequence.
- **Consistent Physics**: Explosion feels tactile and "crunchy" but stays within the earthy CombineGrid aesthetic.

### Undo Restoration
- Undo after a ripple restores:
  - The Bomb in its pre-ignited state.
  - All 9 cells with their original values and masks (Trophy, Frozen, etc.).
  - The exact score before the explosion.

---

## 19. COMBINEGRID LOCKED BASELINE (2026-05-12)

CombineGrid is firmly locked in preparation for further systems development.
This is an explicit stabilization and anti-regression boundary.

### Gameplay Contracts
- **Normal Merge**: Allowed if adjacent.
- **Trophies**: Exact target factor matches create a trophy.
- **Invalid Move Defense**: Reject and animate blocked (safely handles zero payload gracefully).
- **Directional Overswipe Assist**: If player drags past an adjacent tile and releases in a clear direction, math auto-resolves to the adjacent intended tile.
- **Wildcard / Zero**: 1.5s lock resolving simultaneously with a single subtle pop.
- **Undo**: Restores exact board snapshot flawlessly.
- **Endgame**: Triggers *only* when `combinableCount <= 1`. Does not trigger prematurely.

### Bomb Risk/Reward Contract
- **Fuse / Explosion**: Tap begins fuse. Explodes 3x3 radius.
- **Destruction**: Destroys everything in blast zone.
- **Undo**: Safely reverts blast and restores everything including bomb.

### Sound Palette Contract
- Earthy, acoustic, subtle, warm wooden percussion. No harsh arcade synthetic beeps.
- Wildcard/Zero is a subtle unified pop.
- Invalid drag is a muffled thump.
- Bottom buttons are a soft wood tap.
- CombineGrid specific sound overrides have their own configurations.

### Sound Pipeline Contract
- **Audio Unlock**: `SoundService.unlock()` called on `CombineGridGame` mount and every sound request.
- **Context State**: Attempts `resume()` if suspended.
- **Setting**: `settings.sound` (boolean) passed to all `play` methods.
- **Persistence**: Settings persisted via `localStorage` (inherited from SpeedGrid pattern).
- **Testability**: `TEST SOUND` button provided in settings to bypass gameplay state.

### Mobile Layout Contract
- Board occupies max mobile width.
- Buttons dynamically cluster.

### Shared System Warnings
- `SoundService`: `playSubtleTap` added alongside `playButtonTap` to avoid rewriting SpeedGrid's current UI tap. If modifying `SoundService`, ensure SpeedGrid legacy methods remain intact.
- `ENGINE_CONTRACT`: Spawn rules modified to allow `requested=0, provided=0` as a healthy state during zero-refill cycles. This does not weaken SpeedGrid logic which relies on standard `>0` logic.

**DO NOT CHANGE THESE CONTRACTS WITHOUT EXPLICIT REGRESSION TESTING.**