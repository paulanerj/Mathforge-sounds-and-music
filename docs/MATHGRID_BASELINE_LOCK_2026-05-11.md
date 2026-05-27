────────────────────────────────────────────────────────────────────────────────
# MATHGRID BASELINE LOCK 2026-05-11

## 1. Current Protected Baseline Summary
This document serves as the absolute baseline snapshot for MathGrid (comprising SpeedGrid and CombineGrid) before the introduction of any new game modes. The current working systems are considered protected and must not be altered, refactored, or broken by new additions.

## 2. SpeedGrid Protected Systems
* Mobile layout fits vertically and horizontally.
* Drag-select (swiping) mechanics work flawlessly.
* Multi-touch input is fully supported.
* Gravity/Tile-refill logic functions correctly without leaving empty holes.
* Time tiles spawn appropriately and augment round time when collected.
* Success/Overshoot feedback works as expected.
* Settings (Apply/Discard) and balancing tuning correctly impact gameplay.
* Browser text-selection lockdown prevents accidental UI highlighting.

## 3. CombineGrid Protected Systems
* Mobile layout functions sufficiently for play.
* Merge/Swipe mechanics work correctly.
* Trophy creation succeeds across all targeted sums/multiples.
* Trophy swap functionality is completely stable.
* Blocked swap interactions have been restored and work as designed.
* Wildcard tiles render securely as `?` and process standard combine logic.
* Wildcard combine effects (spinning, popping, jitter) trigger correctly.
* Bomb functionality (fuse ignition, 3x3 destruction) is stable.
* Undo correctly captures state before irreversible mutations (including pre-bomb-ignition) and reverts single steps safely.
* Endgame transitions smoothly once conditions are met.
* Soundscapes and haptic feedback provide satisfactory tactile feedback.
* Browser text-selection lockdown is active.

## 4. Known Acceptable Imperfections
* CombineGrid mobile layout is "good enough" but may require deeper visual polish in the distant future.
* CombineGrid soundscapes use stub web audio synthesizers rather than premium layered samples.
* CombineGrid bombs lack an interactive fuse visual burning spark.
* Wildcard combination particle effects could be more polished.

## 5. Deferred Polish List
* Full Monument Valley-style synthetic soundscape replacement.
* Deep sound mastering and equalization.
* Deeper visual bomb refinement.
* General endgame results screen cross-game styling consistency.

## 6. No-Drift Rules
* No functional changes to SpeedGrid or CombineGrid mechanics whatsoever.
* No refactoring of shared layout tokens or state logic to "accommodate" a future game.
* No silent bug fixing without explicit feature branches or stated mandates.

## 7. New Game Mode Isolation Rules
* New game modes MUST be strongly partitioned from SpeedGrid and CombineGrid.
* Any shared code required by the new game mode must consume public, protected APIs of the shared utilities without modifying the upstream utility behavior.
* If a shared modification is unavoidable, it must be explicitly approved and comprehensively tested against all dependent games.

## 8. Regression Tests Required Before Any Future Merge
* Full execution of the `MATHGRID_PRE_NEW_MODE_REGRESSION_CHECKLIST.md` suite.
* Build compilation passes without TS errors.
* No regressions in core state machines for previous games.

## 9. Baseline Archive Note
* **Archive Date:** 2026-05-11
* **Purpose:** Solidifying a working restore point before the introduction of a new game mode.
* **Warning:** Do not overwrite casually. This source-of-truth snapshot is a known-good configuration.
────────────────────────────────────────────────────────────────────────────────
