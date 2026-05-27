# SpeedGrid Sound Contract

This document defines the audio identity and performance constraints for SpeedGrid.

## 1. Sound Aesthetic
- **Direction:** Fast, clean, subtle, and kinetic.
- **Texture:** Non-fatiguing, earthy or glassy tones.
- **Prohibitions:** 
    - No harsh arcade-style sawtooth "beeps".
    - No loud synthetic alarms or jarring sirens.
    - No sounds that exceed 500ms for common interactions (ticks/merges).

## 2. Shared System Safety (SoundService.ts)
- **Shared Warning:** `SoundService.ts` is a critical shared resource.
- **No Destructive Edits:** Do not rename or remove methods currently used by CombineGrid (e.g., `playExplosion`, `playFuse`).
- **Oscillator Budget:** Maintain the 8-oscillator limit for complex sounds to prevent audio node exhaustion on mobile.

## 3. Event Map Intent

### 3.1 Gameplay Feedback
- **Success:** A rewarding, layered chime or interval (e.g., upward sine ramp).
- **Overshoot:** A muffled, low-frequency warning (e.g., short subtractive thump).
- **Time Collect:** A distinct, shimmering "sparkle" or glassy pitch-up.

### 3.2 UI & Controls
- **Buttons:** Crisp, short "tick" or "tok" (subtle triangle/sine transient).
- **Gravity/Refill:** High caution requested. Avoid noisy "falling" sounds that overlap into a drone during large collapses. Prefer discrete, tiny impacts or silence.

## 4. Player Controls
- **Mute Isolation:** The global sound setting must disable ALL SpeedGrid sounds.
- **Unlock Requirement:** `SoundService.unlock()` must be called on the first `pointerdown` and every `play` request to satisfy browser autoplay policies.

## 5. Verification Requirements
- Cross-game smoke test is mandatory after `SoundService` modifications.
- Verify SpeedGrid sounds do not bleed into CombineGrid silent modes.
- Build pass required.