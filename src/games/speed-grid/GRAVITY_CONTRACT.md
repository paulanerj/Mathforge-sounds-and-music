# SpeedGrid Gravity Contract

## CORE RULE
**Each column is an independent vertical tube.**
Nothing may visually move sideways during gravity.

- **Correct:** Tiles fall vertically; refill enters from above the SAME column; x-position remains constant during fall.
- **Incorrect:** Upper-left refill, diagonal entry, lateral slide, teleporting, or layout drift.

## TRUE GRAVITY PIPELINE

### STEP 1 — REMOVE
Resolved tiles animate out and become null. No downward movement occurs yet.

### STEP 2 — GRAVITY
Within each column completely independently, tiles collapse downward. There is absolutely NO horizontal or diagonal influence.

### STEP 3 — REFILL
New tiles spawn strictly ABOVE their own column and fall downward into empty slots. They preserve a strict x-lock for the entire duration of the animation.