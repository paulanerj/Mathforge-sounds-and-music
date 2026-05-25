# Tutorial Containment Status

## Current Status
Training Guides are intentionally disabled behind a Coming Soon state.

## Why Disabled
The Start Guide / Training Guide path caused frozen UI states involving tutorial overlays, pointer-events, pause/freeze state, and gameplay transitions.

## Still Enabled
- Help
- Quick Tips
- Mode Help
- Copy Debug Log

## Still Present but Quarantined
- TutorialOverlay
- TutorialTooltip
- TutorialSpotlight
- useTutorialDirector
- tutorialScripts
- tutorial completion persistence

## User-Facing Launch Policy
No normal user-facing path may call:
- useTutorialDirector.startTutorial
- TutorialOverlay demo launch
- tutorial script launch

until the tutorial system is formally repaired and re-approved.

## Debug Policy
Copy Debug Log remains available so future crashes can be diagnosed.

## Re-enable Requirements
Training Guides may only be re-enabled after:
1. lifecycle transition matrix passes
2. tutorial launch/close passes
3. realAction pointer-events passes
4. Dark Mode guide passes
5. paused-state guide passes
6. settings/home/menu exit during tutorial passes
7. mobile/tablet responsive validation passes
8. no audio leak
9. no blank UI fallback
10. no stuck pointer-events state
