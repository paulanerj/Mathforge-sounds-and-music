# MathGrid Music & Sound Design Handoff

## 1. Project Overview
- MathGrid contains multiple math games.
- Current primary games: CombineGrid and SpeedGrid.
- Sound must support learning, reward, and focus.

## 2. Overall Sound Identity
- Warm, acoustic, tactile, child-friendly.
- Magical but not distracting.
- Earthy percussion (wood, marimba, glockenspiel, etc.).
- Soft glass/ceramic, soft chime.
- Gentle ambient pads.
- **NO** harsh arcade beeps.
- **NO** annoying loops.

## 3. CombineGrid Sound Direction
- Calm puzzle focus.
- Factor/trophy achievement should feel rewarding.
- Trophy sound should be celebratory but short.
- Wildcard should have a small wind-up/pop.
- Bomb should have a fuse/explosion but not be frightening.
- Undo should feel like a gentle reverse pop.
- Background music should be soothing and low-volume.

## 4. SpeedGrid Sound Direction
- Faster, kinetic, light percussion.
- Quick success rewards.
- Overshoot warning must be clear but not harsh.
- Time tile collection should feel valuable.
- Background music (if used) should be more rhythmic but still non-fatiguing.

## 5. Audio Constraints
- Browser Web Audio friendly.
- Must not autoplay before user gesture (browser limitation constraints).
- Must support separate mute and music toggles.
- Must not stack loops.
- Must not create oscillator leaks.
- Should scale well to mobile speakers.
- Short sound effects are preferred over long samples.
- Ambient loop should be subtle.

## 6. Deliverables Desired (from future thread)
- Sound palette specification.
- Event-by-event sound map.
- Background loop concepts.
- Web Audio implementation ideas.
- Optional generated audio asset specs.
- Volume/mixing recommendations.
- Child-friendly repetition rules.

## 7. Integration Constraints
- `SoundService.ts` is a shared-risk file across games.
- SpeedGrid compatibility must be preserved.
- Sounds must be added as game-specific methods where possible to avoid conflicts.
- No gameplay logic changes can be made by audio layers.