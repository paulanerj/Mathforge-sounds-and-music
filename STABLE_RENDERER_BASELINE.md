# MathForge Stable Renderer Baseline

This document serves as the constitutional baseline, motion governance layer, and anti-drift reference for the MathForge renderer system. It defines what exists, why it exists, what must never be broken, and how the renderer may safely evolve.

## System Overview
The MathForge renderer is explicitly decoupled from the core gameplay logic. The game engine produces a stateless `VisualStep` contract, which the renderer acts upon. 

- **Renderer Separation:** The renderer knows nothing of game rules, progression, or state mutation. It only visualizes the current `VisualStep`.
- **Gameplay Separation:** Gameplay logic never dictates CSS, transforms, or animation specifics.
- **AnswerGrid Separation:** The input layer (`AnswerGrid`) remains positionally and architecturally distinct from the mathematical presentation layer (`CircleRenderer`), preventing layout collisions or motion fatigue during intense interaction.
- **Skin System:** The renderer supports thematic reskinning (`nm`, `forge`, `qmm`) without altering structural motion logic or gameplay behavior.
- **Motion System:** A custom CSS animation system that relies on carefully timed hardware-accelerated transforms rather than JavaScript-heavy ticker loops.

## Core Architecture
The frontend visualization architecture is composed of specific, highly focused React components:

- **`CircleRenderer.tsx`:** The orchestration container. It manages context, scaling, and the layout positioning of the center coin and its modifiers. It controls when atmospheric and structural motion is suppressed to maintain focus.
- **`CenterCoin.tsx`:** The primary hero element. It displays the active math target or state. It owns the vertical-axis flip illusion, structural timing, and pressure-driven ring SVG.
- **`ModifierBadge.tsx`:** Secondary visual components that orbit the center coin (Top, Right, Bottom, Left). They own the horizontal-axis flip illusion and operate independently based on the orchestration logic provided by the `CircleRenderer`.
- **`SkinLayer.tsx`:** A semantic wrapper that injects CSS custom properties to dynamically theme the `CircleRenderer` context without modifying component logic.
- **`RendererProps.tsx`:** The interface defining what context the renderer receives (step data, UI modes, pause states, combo states).

*Why this exists:* This highly decoupled structure prevents "god components" and ensures that modifying an animation on a badge does not accidentally break the input grid or the timing ring.

## Motion Philosophy
The renderer should feel like a **precision mechanical math instrument**. It is engineered, tactile, and restrained. It is NOT an arcade machine, a casino UI, or a toy animation system.

- **Motion Hierarchy:**
  1. *Flip Transitions (Highest):* Core value changes.
  2. *Timing Pressure (Secondary):* Tightening highlights and slow ring countdowns.
  3. *Idle Atmospheric Drift (Lowest):* Gentle mechanical breathing when idle.
- **Restraint Philosophy:** Motion exists to reinforce focus, pressure, and momentum. It must never compete for attention to the detriment of cognition. 
- **Pressure Philosophy:** Tension escalates aggressively only at the tail end of the timer. The first 70% is restrained; the final 30% tightens contrast and speeds up subtle rotations.
- **QMM Philosophy:** Quick Math Mode requires absolute visual purity. Atmospheric motion is suppressed, glows are removed, and idle drift is killed to maximize cognitive speed and readability.
- **Motion Suppression:** During full value flips (the highest priority), idle and atmospheric motions are temporarily suppressed. This ensures the transition is visually dominant and avoids "motion stacking chaos".

## Dual-Axis System
We enforce a strict axis contrast between primary and secondary elements to maximize readability and physical believability during complex transitions.

- **Center Coin (Vertical-Axis Illusion):**
  - Uses horizontal compression (`scaleX(0)`) to simulate a coin spinning rapidly on its vertical axis.
- **Modifiers (Horizontal-Axis Illusion):**
  - Uses vertical compression (`scaleY(min-height)`) to simulate hinged mechanical plates flipping up and down on a horizontal axis.

*Why this matters:* If both flipped on the same axis, it would look like a 2D digital crossfade or a flat visual glitch. Opposing axes give the renderer depth and weight, reinforcing the tactile physical machine metaphor.

## Midpoint Value Swap Rule
**FROZEN INVARIANT:** The actual DOM text/values must *only* swap precisely at the midpoint of the flip animation (when scale approaches 0/min-height).

*Why this exists:* Swapping a value while the face is visible completely destroys the physical illusion. The user must perceive the new value as being written on the "back" of the coin/plate.

## Transform Isolation Rule
**CRITICAL INVARIANT:** Static positioning and dynamic animations must *never* share the same CSS `transform` declaration.

- **Wrapper Transforms:** Used for absolute positioning (e.g., placing the badge on the coordinate grid).
- **Animation Transforms:** Handled by inner DOM nodes (e.g., `.mf-modifier-body` animating `scaleY()`).

*Why this exists:* If an animation applies a transform to an element that relies on `translate(-50%, -50%)` for centering, those coordinates are overwritten, causing layout teleportation and structural breakage. Transforms must remain strictly isolated across separate DOM layers.

## Responsive Scaling System
- `scaleFactor` mathematically calculates the optimal sizing based exclusively on the gameplay area container.
- **Exclusion:** Core navigation and toolbars are excluded from the `scaleFactor` math.
- **Tablet & Mobile:** The renderer scales smoothly across devices. UI spacing relies on viewport relative calculations instead of hardcoded magic numbers, ensuring the physical machine doesn't overflow or shrink unnecessarily.

## QMM Rules
Quick Math Mode (QMM) is governed by absolute asceticism.
- Reduced atmospheric motion (No slow ring spins).
- Zero idle drift.
- Minimized glow and shadows.
- Focus-first philosophy: Remove all aesthetic distractions so users can read and solve at maximum speed.

## Performance Rules
All motion and rendering updates must remain performant.
- **Transforms & Opacity Only:** Use `transform`, `scale`, `rotate`, and `opacity` for animations. Avoid animating `width`, `height`, `margin`, or `padding` to prevent layout thrashing and reflows.
- **GPU-Friendly Constraints:** Animation must be easily handed off to the compositor layer.
- **Avoid Render-loop JavaScript:** Do not use `requestAnimationFrame` for stylistic movement. Rely on CSS keyframes.
- **Shadow Limitations:** Avoid excessive, overlapping, blurring `box-shadow` recalculations during high-frequency flips, especially on mobile.

## Forbidden Future Drift
**DO NOT:**
- Add random floating particles or confetti on success.
- Add excessive, bleeding glows.
- Add bouncy, elastic, or overshoot easing (e.g., `cubic-bezier` shapes that break 1.0 or 0.0 bounds significantly).
- Add casino-style slot-machine sound effects or visual feedback.
- Animate the `AnswerGrid` (shaking, pulsating)—it must remain a rock-solid target for user input.
- Overload user cognition. The system must stay focused on mathematical clarity.

## Approved Future Evolution
Safe evolutionary paths for the renderer include:
- **Sound Identity:** A restrained, mechanical UI soundscape that matches the physical motion.
- **Cosmetic Skins:** New thematic layers (e.g., Dark Mode variants, sleek modern themes) that respect the existing unified DOM structure.
- **Progression Systems:** Polished victory screens or level-up overlays rendered *outside* the core combat loop.
- **Optional Future Renderers:** Entirely new implementations of the `visualStep` payload, provided they don't corrupt the structural logic of `CircleRenderer`.

## Current Stable File Map
- `src/renderers/CircleRenderer.tsx`
- `src/renderers/components/CenterCoin.tsx`
- `src/renderers/components/ModifierBadge.tsx`
- `src/renderers/components/EnergyRing.tsx`
- `src/renderers/RendererProps.tsx`
- `src/contracts/visualStep.ts`
- `src/index.css` (MathForge flip keyframes and specific modifier CSS)

## Stable Invariants
1. **Gameplay Decouplement:** Gameplay logic and Renderer are strictly separated through `VisualStep`.
2. **Midpoint Swap:** Values swap ONLY when hidden.
3. **Transform Isolation:** Positioning transforms and animation transforms must exist on separate DOM elements.
4. **Motion Hierarchy:** Flips > Pressure > Idle Drift.
5. **QMM Restraint:** QMM is pure, fast, and distraction-free.

## Final Renderer Philosophy Summary
The MathForge renderer is built to feel heavy, precise, and intentional. It mimics engineered hardware operating under pressure, with tactical restraints placed on unnecessary motion. It is not designed to entertain the eyes; it is designed to **elevate focus**, creating a premium, tactile space where cognition can peak without distraction.
