# Tutorial System Accepted Baseline

## Status
The expanded T6 implementation is accepted as the new tutorial baseline. The system provides a robust, non-blocking, and mode-aware tutorial framework running alongside the game logic.

## Accepted Components
- `src/tutorials/tutorialScripts.ts`
- `src/tutorials/useTutorialDirector.ts`
- `src/tutorials/components/TutorialOverlay.tsx`
- `src/tutorials/components/TutorialTooltip.tsx`
- `src/tutorials/components/TutorialSpotlight.tsx`
- `src/components/UI/Help/HelpMenu.tsx`
- `src/tutorials/useTutorialFreezeAdapter.ts`

## Architecture Boundary
- Tutorial state stays outside `gameReducer.ts`.
- Tutorial completion persistence stays isolated from lesson/session persistence.
- Gameplay reducer and `GameState` must remain clean and unaware of the tutorial.
- Tutorials may freeze gameplay through `useTutorialFreezeAdapter` only, without modifying core engine timing loops directly.
- Dark Mode must use `dark-mode-center-action`, not hidden `AnswerGrid` targets.

## Current Persistence
- **localStorage key**: `mf_tutorial_completion_v1`
- **Purpose**: Persist tutorial completion status.
- Must not overlap with lesson, session, or progression storage.

## Regression Rules
Future changes must verify:
- Normal Mode
- QMM / Quick Math Mode
- Dark Mode
- Hidden Mode
- Survival Mode
- Pedagogical Fail-Safe
- Help open/close behavior
- Tutorial open/close and interruptions
- Answer grid centering
- Mobile and tablet responsive layouts using the rigid geometry boundaries
