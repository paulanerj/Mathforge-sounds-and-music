# SpeedGrid Baseline Constitution

## PROJECT STATE & KNOWN GOOD SYSTEMS
This document locks down the current known-good behavior of SpeedGrid before additional features and systems are added. The current standalone SpeedGrid build is the authoritative baseline and demonstrates:
- Multi-touch interaction.
- Stable pointer isolation.
- Independent + combined touch modes.
- Fast swipe interpolation.
- Improved diagonal/corner detection.
- Stronger selection authority.
- Pure vertical gravity behavior.
- Clean tile initial colors.

## CORE IDENTITY
**SpeedGrid IS NOT CombineGrid.**
They belong to the same MathGrid suite but must not share gameplay logic or become tightly coupled. 

SpeedGrid is rapid, tactile, reactive, flow-state focused, and speed-recognition based. The player should feel momentum, rhythm, and velocity. The game should NEVER feel floaty, sluggish, or ambiguous.

## REGRESSION CHECKLIST
Before merging any new feature, verify the following:
- [ ] NO ghost moves or ghost selections.
- [ ] NO hover painting (moves only register while pointer is down).
- [ ] NO upper-left gravity (or sideways entry).
- [ ] NO x-axis drift during gravity.
- [ ] Stable multi-touch (pointers do not interfere in independent mode).
- [ ] Strict tile duplication prevention in combined mode.
- [ ] Stable and deterministic refill.
- [ ] Tiles are fully colored on the VERY FIRST frame (no grey/white flash).

## DEVELOPMENT PHASES
1. **Phase 1 — Freeze Current Baseline** (Current)
2. **Phase 2 — Visual Stabilization** (Palette, HUD, proportions, removal of debug leaks)
3. **Phase 3 — Game Feel Layer** (Tactile satisfaction, impacts, haptics, glow systems)
4. **Phase 4 — Target + Number Ecosystem** (New arithmetic modes, fractions, primes)
5. **Phase 5 — Progression + Player State** (XP, streaks, masteries)
6. **Phase 6 — Audio System** (Distinctive sounds, rhythmic reinforcement)
7. **Phase 7 — Engine Extraction** (Isolate shared utilities for MathGrid)
8. **Phase 8 — MathGrid Suite Integration** (CombineGrid alongside SpeedGrid)

**NON-NEGOTIABLE:** Never casually rewrite working gravity or input systems without strict adherence to these contracts.