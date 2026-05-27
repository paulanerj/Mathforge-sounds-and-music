────────────────────────────────────────────────────────────────────────────────
# MATHGRID HIGH RISK FILE MAP

This map identifies the most vulnerable files in the MathGrid suite and the systems they put at risk if modified without rigorous validation.

## SpeedGrid High Risk

* **`src/games/speed-grid/SpeedGridGame.tsx`**
  - **Why:** Controls the primary React lifecycle, input loop, rendering bindings, feedback overlays, and game phase management.
  - **Risk:** Stale closures, missing dependency array items, swallowed errors, broken inputs, layout shifts.
  - **Checks:** Gravity, Time logic, Target rendering, Touch inputs, Screen resizing.

* **`src/games/speed-grid/SpeedGridRules.ts`**
  - **Why:** Central reducer dispatch hub defining valid state mutations.
  - **Risk:** Breaking target sequences, illegal board mutations, score inflation.
  - **Checks:** Target path generation, Success/Fail validation, Board resets.

* **`src/games/speed-grid/TargetProfile.ts`**
  - **Why:** Determines difficulty, next sequence algorithms, and progression mechanics.
  - **Risk:** Undesirable number plateaus, impossible targets, crashing loops.
  - **Checks:** Random seeding consistency, level progression targets.

* **`src/games/speed-grid/SpeedGridInputTuning.ts`**
  - **Why:** Magic numbers dictating pointer speeds, raycasting thresholds, and timing tolerance.
  - **Risk:** Spongy or unresponsive inputs across different mobile/desktop hardware profiles.
  - **Checks:** Swipe resolution on minimum thresholds.

## CombineGrid High Risk

* **`src/games/combine-grid/CombineGridGame.tsx`**
  - **Why:** Heavily coupled combination of UI layout, pointer drag-and-drop state machines, wildcard/bomb animations, and effect timers.
  - **Risk:** Input blocking, ghost blanks, stale callback execution leading to desyncs, missing result screens.
  - **Checks:** Single pointer constraints, visual snapbacks, correct result transitions.

* **`src/games/combine-grid/CombineGridRules.ts`**
  - **Why:** Core game rules containing merge math, destruction radii, tile spawns, selection processing, and endgame conditions.
  - **Risk:** Invalid adjacency combinations, infinite recursion loops on refill, incorrectly mutated specials (frozen, trophies).
  - **Checks:** Wildcard spawn limits, endgame triggering correctly, strict adjacency enforcements.

* **`src/games/combine-grid/cgReducer.ts`**
  - **Why:** Connects action execution to rule evaluations and handles generic wrapper logic including the Action-Version gate and History mechanism.
  - **Risk:** Memory leaks via unbounded history, swallowed state logic errors, versioning failure rendering the app unresponsive.
  - **Checks:** Undo operations correctly traversing history, non-TICK structural actions generating appropriate new versions.

* **`src/games/combine-grid/components/Tile.tsx`**
  - **Why:** Highly specialized generic component handling animation orchestration.
  - **Risk:** Excessive reconciliation calls tanking FPS, Z-index stacking collisions, broken animations leading to invisible state.
  - **Checks:** Rendering stability, Wildcard `?` animation loop reliability.

* **`src/games/combine-grid/components/Board.tsx`**
  - **Why:** Orchestrator that feeds precise positioning constraints derived from CSS.
  - **Risk:** Grid misalignment, touch-target mismatch versus visual footprint.
  - **Checks:** Native touch deflection, CSS alignment under reflow.

## Shared High Risk

* **`src/systems/SoundService.ts`**
  - **Why:** Global WebAudio initialization and processing.
  - **Risk:** Oscillator limit crash, audio context lockout on iOS without properly bound touch events. SpeedGrid regressions if method signatures change. Tracking `ambientGain` accurately cleanly handles CombineGrid background looping. Bomb fuse state logic can leak.
  - **Checks:** Fast rapid tapping triggering overlapping polyphony bounds correctly. CombineGrid music toggle correctness. SpeedGrid ticks/wins still function. Bomb fuse cleans up predictably. `Math.random()` usage isolated to audio texture and strictly avoids gameplay leakage.

* **`src/engine/ENGINE_CONTRACT.ts`**
  - **Why:** Contains cross-game state assertion routines and foundational interface validations.
  - **Risk:** A change here globally invalidates Reducer stability guarantees.
  - **Checks:** Smoke test both game modes.

* **`src/index.css`**
  - **Why:** Global Tailwind entry point and root variable overrides.
  - **Risk:** Disruption to glass effects, touch-action blockages, scrolling suppression failures.
  - **Checks:** Scroll suppression across environments, layout bounds.
────────────────────────────────────────────────────────────────────────────────
