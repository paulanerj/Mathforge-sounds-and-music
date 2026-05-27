# COMBINEGRID RESULT SPLASH CONTRACT

## OBJECTIVE
Ensure the result splash (SummaryScreen) always appears at the end of a CombineGrid round, regardless of edge cases in trophy counting or version state.

## ENDGAME TRIGGER
- Condition: `combinableTileCount <= 1`
- Detection: Handled in `cgReducer.ts` via `GridService.isRoundComplete`.
- Phase Transition: `PLAY` -> `COUNTING`.

## TROPHY COUNTING FLOW
1. **Initiation**: Reducer identifies endgame, calculates `countedTrophies`, and sets phase to `COUNTING`.
2. **Visual Sequence**: 
   - `CombineGridGame.tsx` effect detects `COUNTING` phase.
   - Dispatches `COUNT_NEXT_TROPHY` repeatedly with a 250ms interval.
   - Each count increments `scoringIndex` and state `version`.
3. **Completion**:
   - Once all trophies are counted, dispatches `FINISH_COUNTING`.
   - Phase transitions to `SUMMARY`.
4. **Safety Guard**: 
   - An absolute 10-second timeout exists to force `SUMMARY` if the interval gets stuck.
   - `COUNT_NEXT_TROPHY` and `FINISH_COUNTING` (and other internal actions in `isInternalAction` array) are exempt from strict stale-version rejection in the reducer to prevent accidental blocks during sequential automated updates.
   - **Strict User Logic**: All user-driven actions (`TAP_TILE`, `DRAG_DROP`, `IGNITE_BOMB`, `UNDO`) still require a matching version token to commit.

## RESULT SCREEN (SummaryScreen) DISPLAY
- **Visibility**: Rendered when `phase === 'SUMMARY' || phase === 'FINAL'`.
- **Layering**: 
  - Wrapped in a container with `zIndex: 10000`.
  - Main game surface has `position: relative` to ensure correct absolute positioning.
- **Interactions**:
  - `Next Level`: Advances to next round/seed.
  - `Retry`: Restarts current round.
  - `Quit`: Returns to home screen.

## REGRESSION PREVENTION
- **Version Mismatch**: Reducer must NOT reject `FINISH_COUNTING` if dispatched from the effect with an older version token, as the counting process itself increments the version.
- **Empty Trophies**: If no trophies exist, `FINISH_COUNTING` is dispatched immediately.
- **Stuck State**: Fallback timer ensures the player is never trapped looking at a finished board with no UI.