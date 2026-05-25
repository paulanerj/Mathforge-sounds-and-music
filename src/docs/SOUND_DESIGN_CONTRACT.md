# Sound Design Contract

## Goals
- support focus
- avoid fatigue
- reward progress
- never punish harshly
- respect pause/help/settings/navigation lifecycle

## Sound Categories
1. ordinary input/tap
2. correct answer
3. wrong answer
4. fail-safe reveal
5. streak/milestone
6. level complete
7. Dark Mode tick
8. menu/help feedback

## UI Interaction Sound Coverage
- every major user choice should have subtle feedback
- common UI sounds must be much quieter than gameplay reward sounds
- Settings menu should not feel dead/silent
- sliders must not spam
- blocked/unavailable actions use soft blocked sound
- Sound Mode Off disables all UI sounds
- Quiet mode is default and must remain comfortable

## Current Accepted Baseline
- Crystal Math is accepted as the active palette.
- Do not continue experimental sound redesign unless explicitly requested.
- The subtle mode-change cue is locked.
- Completion phrases must not be reused for frequent transitions.

## Rules
- correct-answer sound must be soft and rate-limited
- QMM must avoid machine-gun beeps
- Dark Mode tick must obey lifecycle gating
- wrong answer sound must be gentle, not shaming
- stronger sounds reserved for milestones/completion
- sound must stop in Help, Settings, Pause, Menu, or inactive gameplay
- haptics should not fire too aggressively

## Interaction Coverage Standard
- Every player-forward click/tap should have sound feedback.
- Silent player-forward controls are considered bugs unless explicitly documented.
- Sound Mode Off disables all UI sounds and haptics.
- Sliders/ranges require special handling to avoid spam.
- Disabled-but-clickable controls use soft blocked feedback.
- Passive disabled controls that cannot receive clicks do not need sound.
