# Generator Structure Review & Micro-Loop Guard Proposal

## 1. Generator Modularity

The generator is highly modular, separating pathfinding, difficulty scaling, and problem construction into distinct domains.

*   **Step Creation Flow:** Orchestrated by `ProblemGenerator.generateSequence` (or `buildPluginSequence`). It iterates through the requested `totalSteps`. For each step, it queries `PhaseScheduler` for the mode, `DifficultyEngine` for the difficulty vector, and `MathTraversalEngine` for the arithmetic path. It then packages these into a `GameStep` object.
*   **Traversal Engine Interaction:** `ProblemGenerator` calls `MathTraversalEngine.getNextValue(state, config)`. The `state` contains the `currentValue` and `traversalState`. The engine acts as a pure function, returning the next mathematical value, the operation used, and the updated `traversalState`.
*   **Modifier Insertion:** Handled by `decomposeStep` in `ProblemGenerator`. It takes the primary operation and value from the traversal engine and splits it into multiple symbolic modifiers (e.g., left, right, bottom) based on the `modifierCount` and `modifierMagnitude` from the difficulty vector. This increases working memory strain without changing the core arithmetic path.
*   **Distractor Generation:** `ProblemGenerator.generateDistractors` creates multiple-choice options. It uses the `correctAnswer`, the current mode, and the `distractorSimilarity` setting from the difficulty vector to generate plausible but incorrect answers (e.g., off-by-one, wrong multiple, sequence neighbors).

**Responsibilities:**
*   `problemGenerator.ts`: The high-level orchestrator. It manages the generation loop, calls sub-engines, decomposes operations into modifiers, generates distractors, and constructs the final `GameStep` array.
*   `mathEngine.ts`: The core deterministic traversal engine. It defines how the value changes from step to step (the arithmetic path) using specific plugins (skipcount, multiplication, pattern) and manages the internal `traversalState`.
*   `difficultyEngine.ts`: The difficulty resolver. It maps a global difficulty level and ramp phase to a specific `DifficultyVector` (controlling jump size, modifier count, distractor similarity, and timers).

## 2. Extension Points

The safest locations for future traversal behaviors are within `mathEngine.ts`, specifically by adding new plugin functions or extending existing ones.

*   **Additional Traversal Heuristics:** Create new functions (e.g., `fractionTraversal`, `algebraTraversal`) and register them in the `plugins` dictionary inside `MathTraversalEngine.getNextValue`.
*   **New Arithmetic Patterns / Pattern-Run Segments / Reverse Segments:** Implement these within the specific traversal heuristic functions (like `multiplicationPatternTraversal`). These functions have full control over their internal `traversalState` and can introduce new sub-phases (e.g., a `reverse-run` sub-phase) seamlessly.
*   **Safe Integration:** Because `MathTraversalEngine` is decoupled from `ProblemGenerator` and `DifficultyEngine`, new heuristics only need to conform to the return signature (`startNumber`, `nextValue`, `operation`, `value`, `traversalState`, `meta`). They do not need to interact with modifiers, distractors, or the UI.

## 3. Traversal State Model

*   **Storage and Passing:** Traversal state is stored in a plain object (`traversalState`). It is initialized by the heuristic on `stepIndex === 0` and returned in the result. `ProblemGenerator` holds this state in a local variable and passes it back into `MathTraversalEngine.getNextValue` on the next iteration.
*   **Fields in `GameStep.meta`:** The `meta` object contains `traversalState` (the state *after* the step), `difficultyPlan` (the difficulty vector and phase used), and heuristic-specific metadata (e.g., `sequence`, `isReverse`, `factor`, `table`).
*   **Reading and Updating:** The heuristic reads `state.traversalState` at the start of its execution. It mutates or replaces fields (e.g., `currentTable`, `stepsInCurrentTable`, `subPhase`, `recentFactors`) based on its internal logic, and returns the updated object for the next cycle.

## 4. Maintainability Risks

*   **Deeply Nested Heuristics:** `multiplicationPatternTraversal` utilizes a `while` loop with deep nesting for sub-phases and bounds checking. As more rules (like bridges, modifiers, reverse runs) are added, this function risks becoming a monolithic, hard-to-read block.
*   **Implicit State Coupling:** The `traversalState` is loosely typed (`any`). If a heuristic expects a field to exist but it was cleared or not initialized properly, it could lead to silent fallback triggers or erratic behavior.
*   **Difficulty Logic Leaking:** `mathEngine.ts` currently reads `config.difficultyLevel` directly to determine `maxMod` and `stepsToJump`. This slightly couples traversal logic with difficulty logic, which ideally should be fully encapsulated and passed via the `DifficultyVector`.

## 5. Recommended Safe Evolution Zones

The following parts of the system can evolve safely without modifying protected systems (reducer, DifficultyEngine, GameStep schema, UI geometry):

*   **`mathEngine.ts` (Traversal Plugins):** The individual traversal functions (e.g., `multiplicationPatternTraversal`, `skipCountTraversal`) can be heavily modified or expanded to introduce new mathematical paths.
*   **`problemGenerator.ts` (Distractors & Modifiers):** `generateDistractors` can be expanded with new distractor strategies for new modes, and `decomposeStep` can be updated to support new modifier layouts.
*   **`types.ts` (DifficultyVector Expansion):** Expanding the `DifficultyVector` interface to pass more explicit parameters to the math engine, reducing the need for the engine to read `config.difficultyLevel` directly.

---

## 6. Micro-Loop Avoidance Guard Proposal

To prevent the engine from oscillating between two numbers (e.g., 18 + 9 → 27, 27 - 9 → 18), we can implement a lightweight, deterministic guard.

**Where to Implement Safely:**
Inside the specific traversal heuristics in `mathEngine.ts` (e.g., `multiplicationPatternTraversal` and `skipCountTraversal`), right after the candidate `targetValue` is calculated and before the result is returned.

**Traversal State Information:**
Currently, `traversalState` does not explicitly store the previous numeric value across all heuristics. We need to add a `previousValue` field to `tState` that is updated at the end of each step.

**Simplest Deterministic Implementation Strategy:**
1.  **State Tracking:** At the end of the heuristic, before returning the result, set `tState.previousValue = currentValue`.
2.  **Collision Detection:** When calculating the candidate `targetValue` (e.g., `currentValue + direction * stepsToJump * currentTable`), check if `targetValue === tState.previousValue`.
3.  **Deterministic Resolution:** If it is a match, deterministically alter the candidate *without* calling `RandomService` again (to preserve RNG determinism). 
    *   *Primary Resolution:* Invert the direction (`direction = -direction`).
    *   *Fallback Resolution:* If the inverted direction goes out of bounds, deterministically adjust the jump size (e.g., `stepsToJump = (stepsToJump % maxSteps) + 1`).
4.  **Recalculate:** Recalculate `targetValue` with the adjusted parameters and proceed.
