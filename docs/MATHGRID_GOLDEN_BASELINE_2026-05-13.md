────────────────────────────────────────────────────────────────────────────────
# MATHGRID GOLDEN BASELINE (2026-05-13)

This document establishes the verified, state-of-the-art Golden Baseline for the MathGrid suite. No further modifications are permitted to the stabilized mechanics without explicit instruction and robust regression testing.

## 1. Verification Summary

After the latest optimization passes, the following aspects were verified successfully:

* Build passes: Yes
* SpeedGrid smoke test passed: Yes
* CombineGrid merge verified: Yes
* CombineGrid trophy verified: Yes
* CombineGrid wildcard verified: Yes
* CombineGrid bomb verified: Yes
* CombineGrid undo verified: Yes
* CombineGrid endgame verified: Yes
* CombineGrid sound setting verified: Yes
* Mobile layout verified: Yes
* Regressions found: None

### POST-REGRESSION VERIFIED GAMEPLAY LOCK

The user-verified state includes:
* CombineGrid merge works
* two-finger invalid touch safe
* wildcard works
* bomb works
* undo works
* result splash appears after full game
* SpeedGrid target sequence repaired
* future changes must obey new fundamental gameplay contract

## 2. SpeedGrid Locked Systems

SpeedGrid is mathematically isolated from CombineGrid. Its systems are **locked**:

* **Input Pipeline:** Single/multi-touch interpolation logic.
* **Vertical Gravity:** Independent column tiles dropping.
* **Target Engine:** Multiples/Range settings generation.
* **Refill Mechanics**: Strict non-interfering spawns.

## 3. CombineGrid Locked Systems

CombineGrid is structurally and mechanically isolated. Its systems are **locked**:

* **Valid Merging:** Adjacent factor reduction to target.
* **Trophy Creation/Swap:** Direct resolution and free movement.
* **Undo:** Complete immutable snapshots up to a capped depth.
* **Endgame Transition:** Validated exclusively via combinable tile count `≤ 1` (no adjacency math in endgame trigger).
* **Wildcards:** Vibration animations and popping/reset logic stable.
* **Bombs:** Full 3x3 blast destruction including frozen/trophy state.

## 4. Shared Systems Verified

The following cross-game architectures were verified safe and functional for both games:

* `SoundService`: Synthesized tones for both engines perform without collision. Max 8 oscillators constraint verified.
* `HapticService`: Cross-platform touch vibration.
* `ParticleSystem`: Active visual overlays.
* `GameSelector`: Entry screen selection routing.
* UI and layout tokens preventing vertical screen bleed.

## 5. Current No-Touch Boundaries

Any task affecting these segments must explicitly document its impact according to the **GOLDEN BASELINE RULE**. Coders **MUST** read and adhere to the following anti-drift contracts:

* **Input Handling:** [COMBINEGRID_INPUT_CONTRACT.md](./combinegrid/COMBINEGRID_INPUT_CONTRACT.md)
* **Bombs & Wildcards:** [COMBINEGRID_BOMB_WILDCARD_CONTRACT.md](./combinegrid/COMBINEGRID_BOMB_WILDCARD_CONTRACT.md)
* **Performance & Rendering:** [COMBINEGRID_PERFORMANCE_CONTRACT.md](./combinegrid/COMBINEGRID_PERFORMANCE_CONTRACT.md)

* Do NOT share React hooks directly between games.
* Do NOT use SpeedGrid `Gravity*` in CombineGrid.
* Do NOT use `Math.random` inside Reducer dispatches or state logic.
* Do NOT invoke `alert()`.
* Do NOT write `transition: all`.

## 6. Deferred Work — DO NOT IMPLEMENT YET

The following items are structurally mapped but deferred for future iterations:

1. Migrate CombineGrid particles to canvas.
2. Replace wildcard React interval with RAF + CSS variable.
3. Extract CombineGrid input handlers into `useCombineGridInput`.
4. Further bomb visual/sound polish.
5. End-of-round splash polish.
6. Possible future CombineGrid gravity/refill architecture.
7. New game mode exploration.

## 7. Required Regression Tests

If a future task touches any locked system, it must include a regression test plan before implementation.

## COMBINEGRID ANTI-DRIFT COMPLIANCE

Before modifying CombineGrid input, bomb/wildcard, or performance-sensitive rendering, coder must read the corresponding CombineGrid contract document:
* `docs/combinegrid/COMBINEGRID_INPUT_CONTRACT.md`
* `docs/combinegrid/COMBINEGRID_BOMB_WILDCARD_CONTRACT.md`
* `docs/combinegrid/COMBINEGRID_PERFORMANCE_CONTRACT.md`

## SPEEDGRID ANTI-DRIFT COMPLIANCE

Before modifying SpeedGrid feedback or sound systems, coder must read the matching SpeedGrid contract document:
* `docs/speedgrid/SPEEDGRID_FEEDBACK_CONTRACT.md`
* `docs/speedgrid/SPEEDGRID_SOUND_CONTRACT.md`
────────────────────────────────────────────────────────────────────────────────
