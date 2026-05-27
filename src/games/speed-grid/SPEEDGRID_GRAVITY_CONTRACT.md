# SPEEDGRID GRAVITY CONTRACT

## 1. THE VERTICAL MANDATE
Each column is a sealed "Vertical Tube". Tiles fall strictly along the Y-axis. No horizontal drift, diagonal entry, or column-hopping is permitted under any circumstances.

## 2. THE GRAVITY PIPELINE (ATOMIC STEPS)

### STEP 1: REMOVAL
Resolved tiles are flagged for removal. They animate out (Visual) and are set to `null` in the board map (Logical).

### STEP 2: COLLAPSE
In every column, existing non-null tiles "fall" into the empty slots below them.
- **Contract**: A tile at `r1, c` moving to `r2, c` preserves its `instanceId`. The `instanceId` is the anchor for the visual animation.

### STEP 3: REFILL
The top of every column is filled with new tiles.
- **Contract**: Spawning must happen "above" the top row (e.g., Logical row -1, -2). They fall into place as if entering from a hidden reservoir.

## 3. STABLE RENDERING
- **No Reflow**: Gravity must not trigger a React `key` change for existing tiles. Tiles must be keyed by `instanceId`.
- **Vertical-Only CSS**: Translation must be calculated as `y: Math.floor(row * (tileSize + gap))`. The `x` position must remain constant: `x: Math.floor(col * (tileSize + gap))`.

## 4. FORBIDDEN BEHAVIORS
- **Diagonal Fall**: Tiles must never slide from one column to another.
- **Horizontal Refill**: Tiles must never enter from the sides.
- **Teleporting**: Tiles must have a smooth Y-translation.
- **Layout Jitter**: Toggling gravity visuals must not move logical board elements.