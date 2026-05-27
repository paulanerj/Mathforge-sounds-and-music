# CombineGrid Factor Guidance Contract

## Overview

Factor guidance is a pedagogical scaffold designed to help learners identify factors of a target number within the grid. The feature is completely visual and read-only, interacting with existing state but not mutating it.

## Phase 2A Feature Baseline

The settings have been split to allow granular pedagogical modes.

- **Factor Recipe List**: Supports memory, rehearsal, and strategy formulation. Provides combinations of factors that multiply to the target (e.g., `4 × 6`, `2 × 2 × 6`). Displayed as a compact list near the top of the grid/HUD area. Controlled by `showFactorList` (Default ON).
- **Factor Dots**: Visual recognition aid. A subtle green dot (emerald tone) is rendered in the top-right corner of grid squares that contain a perfect mathematical factor of the current target number. Controlled by `showFactorDots` (Default ON).
- **Distractor Dots**: Advanced checking/training aid. A muted amber dot on normal number tiles that are NOT factors of the current target. Controlled by `showDistractorDots` (Default OFF).

## Phase 2B Feature Baseline (Factor Help Button)

Provides a temporary reveal for learners using the "Recall Mode" (List ON, Dots OFF). 

- **Factor Help Button**: If `showFactorDots` is OFF, a "Factor Help ?" button appears near the factor list.
- **Temporary Reveal**: Tapping the button temporarily reveals factor dots across the board.
- **Duration**: Reveal lasts for 3.5 seconds before automatically hiding. Repeated taps restart the timer.
- **State Cleanup**: The reveal strictly resets on component unmount, target changes, or new rounds. It uses local React component state, avoiding reducer state mutations, ensuring pure visual-level functionality.

## Phase 2B/2C Layout Refinements

- **Permanent Equation Pill Removed**: The permanent equation HUD element previously shown in the top header is removed to make space for factor information.
- **Factor Info Relocated**: The Factor Recipe List occupies the central header slot (the old equation pill location) to maintain an optimal visual hierarchy without pushing the board down.
- **Trophy Equation Popup**: A transient equation popup only appears briefly when a successful trophy is made. It originates from the combine point (tile location) and travels to the center of the board where it vanishes after ~1.5s, avoiding any permanent static clutter or HUD anchoring.
- **Factor Recipe Display Cap & Readability**: 
  - **Prioritize Readability**: Factor recipe pills must prioritize readability over quantity. 
  - **Single Line Fits**: Factor pills MUST fit in a single line to preserve header height and prevent pushing the grid down.
  - **Pill Style**: Use high-contrast background (#FFFDF9) and text (#2D1B1B) with extra-bold weights.
  - **Responsive Capping**: Mobile layout shows a max of 2-3 prioritized recipes depending on screen width. Tablet/Desktop allows up to 4 if space permits. Measurement uses a scoped `resize` listener that is cleaned up on unmount to prevent layout thrashing and maintain safety.
  - **No Wrap & No Ghost Row**: Layout enforced via `flex-nowrap`, `shrink-0`, and responsive cap to prevent multi-line grid shift. Hidden lists leave no ghost rows.
  - **Prioritization Rule**: 
    1. Clean 2-factor pairs (e.g., 4 x 4) first.
    2. Most balanced/common pairs (smallest difference between factors) preferred.
    3. Additional factor pairs if space allows.
    4. One simple 3-factor recipe (e.g., 2 x 2 x 4) only if space remains and pairs are exhausted.
  - **No Scaling**: Do not reduce text size below readable sizes (e.g., 14px on phone, 16px wide) to fit more recipes; instead, truncate the list.

## Pedagogical Modes

- **Easiest Support**: Factor List ON + Factor Dots ON.
- **Stronger Recall**: Factor List ON + Factor Dots OFF.
- **Visual Search**: Factor List OFF + Factor Dots ON.
- **Advanced Checking**: Distractor Dots ON (with or without others).

## Behavioral Requirements

1. **Visual-Only**: The feature must not change board state under any circumstances.
2. **Spawn Independence**: The feature must not change tile spawn logic or probabilities.
3. **Mechanical Independence**: The feature must not alter merge, wildcard, bomb, undo, or endgame rules.
4. **Settings Independence**: Granular settings do not break or conflict with existing settings.

## Exclusions & Edge Cases

Factor and Distractor indicators must **NOT** appear on:
- Wildcards (`?`)
- Bombs (`B`)
- Frozen tiles
- Trophies
- Empty cells (`0`)

Indicators must remain visually distinct from existing cues (e.g., success, selected state). Indicators must never appear on the same tile simultaneously.

## Settings Controls

- **Factor Help Group**: Settings menu now includes a "Factor Help" section.
- **Redux/Engine Bypass**: Toggling settings works reactively via props and does not enforce a board regeneration or a reducer state modification.