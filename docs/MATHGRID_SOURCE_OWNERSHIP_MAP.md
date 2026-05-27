# MATHGRID SOURCE OWNERSHIP MAP

This document tracks the explicit ownership boundaries of files across the MathGrid project. To prevent regression, code modification must respect these boundaries.

## SpeedGrid-Owned Files
**Do not touch unless modifying SpeedGrid directly.**
* **Rules / Reducer:** `src/games/speed-grid/SpeedGridReducer.ts`, `src/games/speed-grid/SpeedGridRules.ts`
* **Components:** `src/games/speed-grid/SpeedGridGame.tsx`, `src/games/speed-grid/components/*`
* **Layout / Constants:** `src/games/speed-grid/SpeedGridInputTuning.ts`, `src/games/speed-grid/TargetProfile.ts`
* **Docs:** Relevant sections in `docs/` concerning SpeedGrid.

* **Constraint:** Owned by SpeedGrid only. Do not modify during CombineGrid work.

## CombineGrid-Owned Files
**Do not touch unless modifying CombineGrid directly.**
* **Rules / Reducer:** `src/games/combine-grid/cgReducer.ts`, `src/games/combine-grid/CombineGridRules.ts`, `src/games/combine-grid/CombineGridSpawnStrategy.ts`
* **Components:** `src/games/combine-grid/CombineGridGame.tsx`, `src/games/combine-grid/components/*`
* **Layout / Constants:** `src/games/combine-grid/constants.ts`, `src/games/combine-grid/layoutTokens.ts`, `src/games/combine-grid/uiTokens.ts`
* **Docs:** Relevant sections in `docs/` concerning CombineGrid.

* **Constraint:** Owned by CombineGrid only.

## Shared System Files
**Extreme caution required.**

### `src/systems/SoundService.ts`
* **Used by:** SpeedGrid, CombineGrid
* **Constraint:** Requires cross-game smoke test if changed. Safe to modify ONLY when adding new segregated methods. DO NOT change existing synth parameters or logic.

### `src/systems/HapticService.ts`
* **Used by:** SpeedGrid, CombineGrid
* **Constraint:** Requires cross-game smoke test if changed. Safe to modify ONLY when adding new segregated methods. DO NOT modify existing patterns.

### `src/engine/ENGINE_CONTRACT.ts`
* **Used by:** SpeedGrid, CombineGrid
* **Constraint:** Requires cross-game smoke test if changed.

### Shared Engine Files (`src/engine/*`)
* **Used by:** SpeedGrid, CombineGrid
* **Constraint:** Requires cross-game smoke test if changed. NO modifications unless explicitly mandated. Deep integration testing on both respective game physics and scoring pipelines is required.

### `src/components/EquationPill.tsx`
* **Used by:** SpeedGrid, CombineGrid
* **Constraint:** Requires cross-game smoke test if changed.

### Other Shared Systems (e.g., `src/systems/*`, `src/platform/*`)
* **Used by:** SpeedGrid, CombineGrid
* **Constraint:** Requires cross-game smoke test if changed. Code modifications must not break UI rendering or game lifecycle.