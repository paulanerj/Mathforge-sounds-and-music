# Crystal Math Sound Baseline Lock

## Status
The current Crystal Math sound profile is accepted as the active MathForge sound baseline.

## Accepted Palette
- Active palette: Crystal Math
- Purpose: clean, bright, glass-like, math-focused sound identity
- Default mode: Quiet
- Sound Mode options: On / Quiet / Off

## Accepted Sound Behavior
- UI taps/selects/open/close use Crystal Math-style sounds.
- Correct/wrong gameplay sounds use Crystal Math-style sounds.
- QMM rapid-answer sounds are rate-limited and not harsh.
- Dark Mode tick is lifecycle-gated.
- Sound Mode Off silences all game sounds, UI sounds, ticks, and haptics.
- Training Guides blocked click uses a soft blocked sound.

## Mode-Change Sound Rule
Mode-change / board-initialization must use a subtle ready cue. 

It must not use:
- level_complete
- win
- long arpeggio
- multi-note reward phrase
- completion/fanfare sound

The longer “da da da do do da” style sound is acceptable only for:
- session complete
- level complete
- end-of-round splash
- achievement/reward moment

## Do Not Change Without Approval
Future coders must not alter the current sound profile unless the user explicitly requests a new sound pass.

## Regression Checklist
Future changes must verify:
- Sound Mode On
- Sound Mode Quiet
- Sound Mode Off
- Normal Mode correct/wrong sounds
- QMM rapid answers
- Dark Mode tick lifecycle
- Help open/close sounds
- Settings sounds
- Training Guides Coming Soon blocked sound
- Lesson Builder/menu sounds
- mode-change / board-init sound remains subtle
- completion sound remains reserved for completion events
