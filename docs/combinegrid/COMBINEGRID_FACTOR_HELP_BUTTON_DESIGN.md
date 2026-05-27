────────────────────────────────────────────────────────────────────────────────
# CombineGrid Factor Help Button Design & State Contract

## 1. Factor Help Modes Designed

*   **Always-On Support**: Factor List ON, Factor Dots ON. Easiest mode providing continuous visual guidance.
*   **Recall Mode**: Factor List ON, Factor Dots OFF. Encourages working memory and visual scanning without immediate visual answers on the tiles.
*   **Temporary Reveal Mode**: Factor Dots OFF by default. A temporary Factor Help button reveals factor dots for a short duration upon request.
*   **Check Mode (Future)**: Learner selects a sequence or tile first, then asks for a check to verify if it's a correct factor/formula.
*   **Advanced Distractor Mode**: Optional Distractor Dots ON. Mark non-factors with a muted amber dot to train discrimination.

## 2. Factor Help Button Placement

**Recommendation: Option A / D Hybrid**
Place a small floating "Hint" or "Show Factors" pill button inline with or adjacent to the factor recipe list HUD area. 
*   **Why**: It provides contextual relevance without shrinking the grid or competing with the trophy/score HUD. It avoids replacing existing UI destructively and remains accessible on mobile.

## 3. Temporary Reveal State Contract

*   **State Implementation**: `isFactorHelpActive: boolean` managed purely via React local state (`useState`). This prevents emitting Redux/engine actions.
*   **Lifecycle**:
    *   Reveal must clear automatically after a timeout.
    *   Reveal must clear instantly upon unmount, target change, or round completion.
    *   Reveal must be purely visual (applies the same mapping as `showFactorDots` dynamically).
    *   Timeout references must be cleared properly `clearTimeout(timerRef.current)`.

## 4. Temporary Reveal Timing

*   **Duration**: 3.5 seconds. Long enough to scan the visible board, short enough to force retrieval practice later.
*   **Retriggering**: Repeated taps reset the 3.5-second timer.
*   **Transitions**: 300ms fade-in/fade-out for the dots to avoid jarring flashes.
*   **Cooldown**: None initially, to prevent frustrating the learner.

## 5. Settings Interaction Design

*   **Override Logic**: If `showFactorDots` is ON, the reveal button is hidden or disabled (dots are already visible). If `showFactorDots` is OFF, the button temporarily forces the factor dots to render as if it were ON.
*   **New Setting**: A toggle for `showFactorHelpButton` (Default OFF for Phase 2B, or default ON if `showFactorDots` defaults to OFF in the future).
*   **Distractors**: The reveal button should only reveal distractor dots if the `showDistractorDots` setting is independently enabled or via a specific preset.

## 6. Pedagogical Recommendation

*   **Beginner**: Always-On Support (List ON, Dots ON) to introduce the concept.
*   **Intermediate (Recommended Learning Default)**: Recall Mode + Temporary Reveal. (List ON, Dots OFF, Button ON). This encourages the learner to memorize the recipes and scan the board, using the button only when stuck.
*   **Advanced**: All aids OFF.

## 7. Risk Assessment

*   **Low Risk**: Visual-only button, temporary factor dot reveal using local component state with no reducer involvement.
*   **Medium Risk**: Managing the timed reveal state across renders, overlay interactions, and ensuring unmount cleanup.
*   **High Risk (DO NOT DO YET)**: Adaptive modes that change based on player performance, or altering board initialization logic to guarantee factor scaffolding. 

## 8. Implementation Plan

*   **Phase 2B (Next)**: Implement the Factor Help button with visual-only temporary reveal. Add local React state for the timer. No reducer or spawn changes. No mode presets yet.
*   **Phase 2C**: Introduce pedagogical mode presets in the settings to easily switch between "Beginner", "Intermediate", and "Advanced" visibility states.
*   **Phase 3**: Audit factor scaffold board initialization and adjust spawn guarantees if target factors are missing.
────────────────────────────────────────────────────────────────────────────────
