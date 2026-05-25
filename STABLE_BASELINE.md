# MathForge Stable Baseline

This document defines the official stable architecture and visual invariants for the MathForge application.

## 1. Architecture Flow
The data pipeline is strictly unidirectional:
**Engine** (State) → **GameStep** (Logic) → **VisualStep** (Contract) → **GameBoard** (Layout) → **ActiveRenderer** (Current: CircleRenderer) → **AnswerGrid** (Interaction)

## 2. Locked Core Files
The following files are part of the stable baseline and should not be modified without explicit architecture approval:
- `src/renderers/CircleRenderer.tsx`: Main gameplay visual implementation.
- `src/components/Game/GameBoard.tsx`: Architectural shell and layout band controller.
- `src/adapters/gameToVisualAdapter.ts`: The translation layer between logic and visuals.

## 3. UI Geometry & Sizing
- **scaleFactor**: All gameplay elements must scale relative to the container size using `useScaleFactor`.
- **Sizing Logic**: Constants from `uiGeometry.ts` are the source of truth for proportions.

## 4. Gameplay Invariants
### Mixed Arithmetic
- **Range Clamping**: The `currentNumber` must always be clamped based on `difficultyLevel`.
- **Drift Protection**: Logic must prevent numbers from drifting out of range during multi-step problems.

### Answer Choices
- **Minimum Options**: Always provide at least 3 choices.
- **Sorting**: Options must be sorted in ascending order.
- **Integrity**: The `correctAnswer` must ALWAYS be present in the options list.

## 5. Experimental Rules
New features or renderers must be built in `/src/experimental/` and cannot be imported into core files until they pass the stability audit.
