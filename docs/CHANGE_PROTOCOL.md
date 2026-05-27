# CHANGE PROTOCOL GUARDRAILS

To prevent entropy and unmanageable code drift in MathGrid, the following strict guardrails govern all implementation passes.

1. **One Game At A Time:** Execution sprints must target ONLY ONE game logic segment. Global, multi-game sweeps are strictly forbidden.
2. **One Mechanic At A Time:** Implementation should solve isolated mechanic issues before chaining complex additions.
3. **No Mixed Feature + Refactor Passes:** You may either build a feature, or you may refactor. You cannot perform both operations in the same implementation window.
4. **No Shared-System Edits Without Explicit Approval:** If a method resides in `/src/systems/*` or `/src/utils/*`, it cannot be modified unless explicitly commanded by prompt instructions.
5. **No "Audit Only" Task May Change Code:** If instructed to strictly audit or assess the codebase, modifying source code files in any context is disallowed.
6. **Every Implementation Must Return Changed Files:** At completion, list explicitly what files were modified.
7. **Every Implementation Must Report Touched Systems:** Document exactly which game systems were structurally traversed or affected.
8. **Every Implementation Must Report Regression Tests Run:** Verify that the prescribed manual/automated tests have been adhered to before continuing.
9. **Timeout / Failure Fallback:** If a requested task hits execution limits or timeouts after a file edit, the immediate subsequent task must be a containment or revert audit.

## GOLDEN BASELINE RULE

Any future implementation must state whether it touches:
* SpeedGrid
* CombineGrid
* shared systems
* engine contracts
* SoundService
* board representation
* input handling
* endgame detection
* bomb/wildcard mechanics

If a future task touches any locked system, it must include a regression test plan before implementation.

## COMBINEGRID ANTI-DRIFT COMPLIANCE

Before modifying CombineGrid input, bomb/wildcard, or performance-sensitive rendering, coder must read the corresponding CombineGrid contract document:
* `docs/combinegrid/COMBINEGRID_INPUT_CONTRACT.md`
* `docs/combinegrid/COMBINEGRID_BOMB_WILDCARD_CONTRACT.md`
* `docs/combinegrid/COMBINEGRID_PERFORMANCE_CONTRACT.md`

### UI POLISH DRIFT WARNING
UI polish in CombineGrid is high risk because `CombineGridGame.tsx` contains UI, input handling, animation state, timers, and board action dispatch paths. Any future UI polish must explicitly state whether it touches:
- Pointer handling
- Timer/Interval handling (`safeSetTimeout`, etc.)
- Reducer dispatch logic
- Board layout or tile rendering
- Input lock logic (`computeInputLocked`)
- Wildcard/Bomb animation state tracking

#### UNDO SNAPSHOTS MUST BE SANITIZED
Any future change to:
- `snapshotState` in `cgReducer.ts`
- `UNDO` reducer branch
- `Tile` drag-source rendering
- selection/drag state management
- local animation cleanup in `CombineGridGame.tsx`
- Board key/render strategy

MUST run the full undo ghost-tile regression suite. Snapshots must never preserve transient interaction state.

Any UI polish affecting these areas REQUIRES input regression tests (Multi-Pointer rejection, Adjacency check, Stale callback check).

## UI POLISH IS HIGH RISK

Any UI polish task must state whether it touches:
* input handlers
* pointer/touch logic
* reducer dispatch
* clear/refill state
* timer callbacks
* result/endgame phase
* board layout constants
* tile rendering
* shared CSS
* shared SoundService

If yes, it must include regression tests before and after.

UI polish must not be combined with:
* gameplay rule changes
* spawn/refill changes
* input logic changes
* performance refactors

## PERFORMANCE OPTIMIZATION IS HIGH RISK

Any performance optimization must state whether it touches:
* React state timing
* animation timing
* timers
* memoization
* tile keys
* board render identity
* clear/refill visuals
* reducer dispatch
* particle systems
* sound oscillator counts

Performance work must not change gameplay semantics.

## SPEEDGRID ANTI-DRIFT COMPLIANCE

Before modifying SpeedGrid feedback or sound systems, coder must read the matching SpeedGrid contract document:
* `docs/speedgrid/SPEEDGRID_FEEDBACK_CONTRACT.md`
* `docs/speedgrid/SPEEDGRID_SOUND_CONTRACT.md`