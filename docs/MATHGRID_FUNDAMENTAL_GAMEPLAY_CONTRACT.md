# MATHGRID FUNDAMENTAL GAMEPLAY CONTRACT

## 1. Global No-Drift Principles
- **No Shared Game State:** SpeedGrid and CombineGrid maintain strictly isolated rules, reducers, and state logic.
- **One Active Engine:** Only one game mode is ever active at a time.
- **Pure Reducers:** No `Math.random` or side-effects in reducers; all random seeds and timers must be managed in the effect/component layer.
- **No Native Interrupts:** Native `alert()`, `window.confirm()`, and overscroll/bounce behaviors are strictly suppressed.
- **Authoritative State:** The reducer is the sole source of truth. UI must not show optimistic persistent changes without reducer confirmation (no ghost blanks).

## 2. SpeedGrid Locked Gameplay Contract
SpeedGrid's fast-paced, path-finding mechanics are locked:
- **Swipe/Path Input:** Players can drag continuously to trace paths summing to a target.
- **Multi-Touch Behavior:** Handled according to isolated input interpolation rules.
- **Gravity/Refill:** Column-based vertical gravity drops exist independently. 
- **Time Tiles:** Special tiles exist that grant time when cleared; frequency is balanced and constrained.
- **Round Duration:** Fixed base round duration extended dynamically.
- **Target Sequence / Next / Previous Logic:** Sequential targets pre-generated predictably based on RNG seed. 
- **Success Green Path:** Visual/audio feedback on matching target.
- **Overshoot Red Path:** Visual/audio feedback on exceeding target without penalty other than time lost trailing.
- **Haptics/Sound Settings:** Adjustable independent layers.
- **Settings Draft/Apply/Discard:** In-game configuration exists safely.
- **Mobile Layout / Glass Visual Baseline:** Maintained aesthetic standard without `transition: all` pollution.
- **Native Gesture Suppression:** Touch-action `none` enforced globally on boards.
- **No R0C0 contamination:** Math bounding safe limits on the top-left corner origin bug previously eradicated.
- **No tile fail-state pollution:** Failure paths clear gracefully without leaving rogue visual state values.

## 3. CombineGrid Locked Gameplay Contract
CombineGrid's slow, methodical merge puzzle rules are locked:
- **Input:** Single-active-pointer logic. Multi-touch is deflected safely. Non-adjacent merge attempts are rejected without mutating the board or triggering a ghost blank. Source and destination must come from the same pointer lifecycle.
- **Merge/Refill:** Valid adjacent merges commit synchronously. No permanent blank cells are ever permitted during active play; clear/refill sequences complete gracefully.
- **Wildcard:** Represented by `?`, internal value `ZERO_TILE_VALUE / 100`. Clears/refills organically via bag probability (not deterministic loops). Must not respawn itself artificially. Undo fully restores its state.
- **Bomb:** 3x3 explosive tile. Ignited exclusively by a tap (not drag). Destroyed 3x3 cells (including targets, frozen, trophies, other specials) regenerate seamlessly. Action completes definitively and can be Undone.
- **Undo:** Full, verified reverse capability up to a structural depth limit, restoring the board, phase, arrays, masks, and version to their prior states.
- **Endgame/Result:** Endgame is strictly triggered when `combinableTileCount <= 1`. A result splash screen must unequivocally appear after the trophy counting sequence. A silent finished board state is illegal. 
- **Versioning:** Result internal counting actions (`COUNT_NEXT_TROPHY`, `FINISH_COUNTING`) may bypass strict version validation to prevent lock-out.

## 4. Shared-System Safety Contract
- Modifying generic elements (`SoundService`, `HapticService`, `ParticleSystem`) demands validation in both games. 
- Sound oscillator capacities must respect browser audio context limits (Max 8 limit constraint). 
- Particle rendering logic remains decoupled from the physical HTML structure of specific tiles.

## 5. UI Polish Restrictions
- UI polish is intrinsically high risk and must explicitly state its bounds. 
- You may NOT adjust rendering techniques or animations that touch input handler execution flags, pointer locks, timer intervals, structural board layout, or reducer dispatches without providing extensive regression audits.

## 6. Performance Optimization Restrictions
- Fast-path tuning, memoization (`React.memo`), tile keys, reducer optimizations, and interval timing adjustments are high risk.
- They must not mutate gameplay semantics, and they require full-scope testing against ghost blanks, trailing actions, stale callbacks, or lost pointer tracking.

## 7. Required Regression Tests before Any Future Implementation
Run the [MATHGRID REQUIRED REGRESSION CHECKLIST](./MATHGRID_REQUIRED_REGRESSION_CHECKLIST.md) before and after.

## 8. Emergency Rollback / Branch Guidance
Should critical regressions be identified, revert cleanly rather than applying compound "band-aids". Ensure structural issues are separated from rendering bugs, referring directly to the locked contracts in `docs/combinegrid/` and `docs/speedgrid/`.