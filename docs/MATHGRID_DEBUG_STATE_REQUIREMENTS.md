# MATHGRID DEBUG STATE REQUIREMENTS

## Specification Scope
To guarantee consistency during defect isolation across the MathGrid platform, robust textual snapshotting is required. Debug state payloads exported by the system MUST surface the following detailed keys corresponding to each distinctive game layer.

## SpeedGrid Export Requirements
A verified SpeedGrid JSON debug dump must include:
- **Current Target**: Real-time numeric target the player seeks.
- **Target History/Index**: Progression representation denoting positional standing.
- **Next Target**: Predictable subsequent integer, if properly committed to game state.
- **Board State**: 2D array representation integer values defining the tiles.
- **Phase/Result State**: Enumerated sequence defining play cycle readiness.
- **Active Paths**: Defined coordinates encompassing the player's tracking drag array.
- **Feedback Layers**: Enumerated state of the green (success) and red (overshoot) verification overlays.
- **Settings**: Specific tuning variations the player has attached (Haptics, Colors, Audio).
- **Timer/Time Tile State**: Precise remaining ms bounds and instances of time-accruing tiles on internal grids.

## CombineGrid Export Requirements
A verified CombineGrid JSON debug dump must include:
- **Board**: Matrix mapping defining spatial alignment.
- **Phase**: Primary temporal mode restricting behavior logic (PLAY, COUNTING, SUMMARY, etc.).
- **ActivePointerId**: ID defining exclusive pointer input lock ownership to suppress multi-touch collisions.
- **Drag Source**: Array coordinate corresponding to the original tile engaged.
- **Selected Tile**: Actively touched grid position resolving interactions.
- **Last Attempted Action**: Payload identifier representing the most recent event.
- **Last Rejected Action Reason**: Contextual payload explicitly defining failed state execution triggers (e.g. Adjacency, Phase Invalid).
- **Clear/Refill Positions**: Ephemeral 2D vectors actively processed for CSS mutation mappings.
- **Timer Count**: Quantitative accumulation of engaged `safeSetTimeout`/`safeSetInterval` events.
- **Pending Timer Labels**: Mapped string/ID markers characterizing what timers dictate (where available).
- **CombinableTileCount**: Pre-computed algorithmic count defining possible board actions remaining natively. 
- **Trophy Count**: Trackable progression sum resolving meta progress visually.
- **Result Screen Visible**: Concrete Boolean tracking actual endgame validation component visibility.
- **Last 30 Actions**: Bounded historic tracking for action playback assessment.