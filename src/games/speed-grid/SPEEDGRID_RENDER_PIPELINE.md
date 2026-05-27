# SPEEDGRID RENDER PIPELINE

## 1. THE PIPELINE ARCHITECTURE
The SpeedGrid UI is a controlled projection of the State. It follows a strict "Observe-Wait-Animate" flow.

## 2. COMPONENT RESPONSIBILITIES
- **SpeedGridGame**: Main container. Manages the high-level layout, HUD, and modality.
- **GridBoard**: Renders the tile grid. Performs NO logic; purely maps `board[r][c]` to `<Tile />`.
- **Tile**: Interactive atom. 
    - **Visual States**: Default, Selected, Success, Fail, Conflict.
    - **Authority**: Calculates its own pixel position `(x, y)` based on `row`, `col`, and `tileSize`.
    - **Animations**: Handles compression on touch (`scale: 0.97`) and spring-back on release.
- **SelectionTrail (Canvas)**: Dynamic overlay. Uses `ResizeObserver` to lock coordinates to the board. Computes quadratic curves for "liquid feel".

## 3. ANIMATION CONTRACTS
- **Gravity**: Must use vertical-only translation. No layout transitions allowed during gravity to prevent horizontal jitter.
- **Solve Success**: Tiny pause (vibe), followed by highlight, followed by immediate removal.
- **Solve Fail**: Immediate shake feedback, followed by path clearance.

## 4. PERFORMANCE CONSTRAINTS
- **Target**: Locked 60 FPS (Desktop), 55-60 FPS (Mobile).
- **Optimization**: 
    - Use `instanceId` for keys to prevent remounting.
    - Path rendering via Canvas to avoid DOM element explosion.
    - Particle pooling for `TimeTile` bursts to stabilize Garbage Collection.
- **Zero Thresholds**: Animations must be efficient enough that input latency remains <16ms.