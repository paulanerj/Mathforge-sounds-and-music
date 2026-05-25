# Stabilization Checkpoint After Sound Pass

## Date / Context
This checkpoint records the accepted stable state after:
- tutorial containment
- audio lifecycle fixes
- Sound Design Pass 1
- Sound Design Pass 2
- Sound Design Pass 3
- final sound coverage verification

## Current Accepted User-Facing Systems

The following systems are enabled and stable:

- core gameplay modes
- Pedagogical Fail-Safe
- Help button
- Quick Tips
- Mode Help
- Copy Debug Log
- Sound Mode: On / Quiet / Off
- default Sound Mode: Quiet
- broad UI/menu/settings/lesson-builder sound coverage
- Dark Mode tick lifecycle gating
- softened and rate-limited correct-answer feedback

## Current Disabled / Quarantined Systems

The following systems are disabled:

- Training Guides
- Start Guide
- Replay Guide
- Tutorial Overlay Demo
- any HelpMenu path that launches TutorialOverlay
- any normal user-facing path that calls useTutorialDirector.startTutorial

Training Guides are intentionally disabled behind Coming Soon because the interactive guide launcher caused frozen UI states.

## Tutorial Infrastructure Present but Quarantined

The following tutorial files and systems are present in the codebase but not user-accessible:

- src/tutorials/useTutorialDirector.ts
- src/tutorials/tutorialScripts.ts
- src/tutorials/components/TutorialOverlay.tsx
- src/tutorials/components/TutorialTooltip.tsx
- src/tutorials/components/TutorialSpotlight.tsx
- src/tutorials/useTutorialFreezeAdapter.ts
- src/tutorials/tutorialFeatureFlags.ts
- TRAINING_GUIDES_ENABLED = false

## Sound System Accepted State

- src/utils/uiSoundPlayer.ts exists as the central UI sound utility.
- Sound Mode supports On / Quiet / Off.
- Quiet is default.
- Sound Mode Off must silence:
  - gameplay sounds
  - UI sounds
  - Dark Mode tick
  - haptics/vibration
- correct-answer feedback is softened and rate-limited.
- Dark Mode tick must obey lifecycle gating.
- UI controls should use playUISound or the approved sound API.

## Sound Coverage Policy

Every deliberate player-forward action should have subtle sound feedback unless intentionally silent.

Player-forward actions include:

- buttons
- tabs
- menu open/close
- settings toggles
- segmented controls
- dropdown/select changes
- save/apply/cancel/reset
- add/delete/reorder lesson steps
- navigation/back/home/start
- disabled/blocked actions
- copy/export/import actions
- answer taps
- pause/resume/restart
- help/menu interactions

Intentionally silent:

- hover-only behavior
- passive render/update
- background effects
- scrolling/panning
- slider drag every pixel
- disabled controls that cannot be clicked
- native input focus if not worth custom sound

Special note:
The Help Menu “Next Tip” button was previously marked intentionally silent. If future UX testing says it feels dead, add a tiny uiTap.

## Debug Logging State

- src/utils/runtimeDebugLog.ts exists.
- Copy Debug Log is available in Help.
- Debug log is capped to recent events.
- It should capture important transition/debug events without spamming ordinary render cycles.
- Training Guides disabled clicks should log trainingGuidesComingSoonClicked or equivalent.

## Current Known Risks

1. Training Guides / interactive tutorial launch remains unstable underneath the containment wall.
2. useTutorialDirector / TutorialOverlay should not be considered production-ready.
3. Future coders must not re-enable Training Guides without passing the re-enable checklist.
4. Lifecycle interactions among Help, Settings, Pause, Dark Mode, audio, and navigation remain important and must be tested after changes.
5. Sound coverage is approved, but future new buttons must use the sound API.
6. Slider/range sound must remain non-spammy.

## Re-Enable Training Guides Requirements

Training Guides may only be re-enabled after all of these pass:

1. Start Guide launches without freeze.
2. Tutorial close always restores pointer-events.
3. realAction steps do not deadlock.
4. Help → Tutorial → Close passes.
5. Pause → Help → Tutorial → Close passes.
6. Dark Mode → Help → Tutorial → Close passes.
7. Tutorial → Settings passes.
8. Tutorial → Home/Menu passes.
9. currentScreen navigation dismisses tutorial safely.
10. Audio stops under tutorial/help/settings/menu.
11. Sound Mode Off remains silent.
12. mobile/tablet layouts remain stable.
13. debug log captures tutorial launch/close/fail states.
14. no blank UI fallback appears during normal use.
15. no user-facing launch path runs while TRAINING_GUIDES_ENABLED = false.

## Regression Checklist Before Future Feature Work

Future feature work must test:

- Normal Mode
- QMM
- Dark Mode
- Hidden Mode
- Survival Mode
- Pedagogical Fail-Safe
- Help open/close
- Settings open/close
- Pause/resume/restart/home
- Sound Mode On / Quiet / Off
- Dark Mode tick lifecycle
- UI sound coverage for any new button
- Training Guides remain disabled unless explicitly approved
- answer grid centering
- center coin centering
- mobile and tablet viewports

## Recommended Next Work

1. Static Help / Quick Tips / Mode Help content refinement.
2. Lifecycle transition matrix / QA checklist.
3. Sound micro-polish only if user finds remaining irritating events.
4. Training Guides repair branch later, not now.
5. PWA/installability later after gameplay/support systems stabilize.
