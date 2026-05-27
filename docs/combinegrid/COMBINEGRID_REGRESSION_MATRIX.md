# CombineGrid Regression Matrix

| Test Case | Interaction | Target | Initial Board | Action | Expected Result | Result State |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Normal Merge (Below)** | Drag Drop | 24 | [2, 3, ...] | 2 -> 3 | Cell becomes 6 | `board[dst] = 6`, `board[src] = 0` |
| **Identity Merge (1xN)** | Drag Drop | 24 | [1, 8, ...] | 1 -> 8 | Cell remains 8 | `board[dst] = 8`, `board[src] = 0` |
| **Identity Merge (Nx1)** | Drag Drop | 24 | [8, 1, ...] | 8 -> 1 | Cell remains 8 | `board[dst] = 8`, `board[src] = 0` |
| **Identity Merge (1xT)** | Drag Drop | 24 | [1, 24, ...] | 1 -> 24 | Trophy creation | `trophyMask[dst] = true`, `board[dst] = 24` |
| **Trophy Creation (Exact)**| Drag Drop | 24 | [4, 6, ...] | 4 -> 6 | Trophy creation | `trophyMask[dst] = true`, `board[dst] = 24` |
| **Trophy Creation (Tap)** | Tap | 24 | [4, 6, ...] | Tap 4, Tap 6 | Trophy creation | `board[4]=0, board[6]=0`, `score += 10` |
| **Invalid Merge (Over)** | Drag Drop | 24 | [8, 4, ...] | 8 -> 4 | Frozen tile (32) | `frozenMask[dst] = true`, `board[dst] = 32` |
| **Trophy Swap** | Drag Drop | 24 | [T, 2, ...] | T -> 2 | Position swap | `board[src]=2, board[dst]=T` |
| **Bomb Swap** | Drag Drop | 24 | [B, 2, ...] | B -> 2 | Position swap | `board[src]=2, board[dst]=B` |
| **Bomb Radius CLI** | Static | 24 | [3,3] = B | Trigger B | 3x3 Area affects [2..4, 2..4] | Verified in code logic |
| **Destroyed = 0** | Explode | 24 | [3,4] = 5 | B explodes | [3,4] becomes 0 | Verified: `nextBoard[p.row][p.col] = 0` |
| **0 is Empty (Reg)** | Render | 24 | board[r,c]=0 | Render | Cell shows `·` | Verified in `Tile.tsx` |
| **100 is Wildcard (`?`)**| Render | 24 | board[r,c]=100| Render | Cell shows `?` | Verified in `Tile.tsx` |
| **Trophy Destructible**| Explode | 24 | B adj T | B explodes | T is destroyed (becomes 0) | **DESIGN CORRECTED**: Risk/Reward Policy |
| **Frozen Destructible**| Explode | 24 | B adj F | B explodes | F is destroyed (becomes 0) | **DESIGN CORRECTED**: Risk/Reward Policy |
| **Bomb Center Clear** | Explode | 24 | [r,c] = B | B explodes | [r,c] becomes 0 | Verified: Center is always cleared |
| **Undo After Blast** | Undo | 24 | Post Blast | UNDO | Board restores perfectly | Snapshots verify board + 3 masks |
| **Respawn Refill** | Explode | 24 | Cell = 0 | Complete Clear| New Tile Generated | Verified: `CLEAR_COMPLETE` fills 0s |
| **Wildcard Behavior** | Drag Drop | 24 | [?, 5, ...] | ? -> 5 | Both cells cleared | `board[src]=0, board[dst]=0` (same as zero) |
| **Wildcard Vibrate** | Animation | 24 | [?, 5, ...] | ? -> 5 | Both tiles vibrate | `isWildcardAnimated` true for 1000ms |
| **Wildcard Pop/Confetti** | Effects | 24 | [?, 5, ...] | ? -> 5 | Pop and particles emit | Verified in `emitParticles` calls |
| **Wildcard Sound** | Audio | 24 | [?, 5, ...] | ? -> 5 | Vibrate + Pop sound plays | `playWildcardVibrate`, `playWildcardPop` |
| **Wildcard Mutate Sync** | Event | 24 | [?, 5, ...] | ? -> 5 | Board updates *after* 1000ms | Delay verified before `dispatch(DRAG_DROP)` |
| **Wildcard Excludes Normal** | Rules | 24 | [2, 3, ...] | 2 -> 3 | Normal merge | No vibration, `isWildcardCombine` is false |
| **Wildcard Excludes Trophy** | Rules | 24 | [T, ?, ...] | T -> ? | Trophy swap | No vibration, `isWildcardCombine` is false |
| **Wildcard Excludes Bomb** | Rules | 24 | [B, ?, ...] | B -> ? | Bomb swap | No vibration, `isWildcardCombine` is false |
| **Undo Menu Restored** | Undo | 24 | Any | Valid move | Undo active | Undo button enabled |
| **Undo Ignore Invalid**| Undo | 24 | [4, 5, ...] | 4 -> 5 | Snapshot discarded | Invalid move does not record identical history |
| **Undo After Bomb** | Undo | 24 | B exploded | UNDO | Board fully restored | Board, B cell, T, F, Z all restored properly |
| **Undo Merge** | Undo | 24 | [0, 6, ...] | UNDO | Restore 2, 3 | `board[src]=2, board[dst]=3` |
| **Undo Trophy** | Undo | 24 | [0, T, ...] | UNDO | Restore 4, 6 | `board[src]=4, board[dst]=6`, `score` rolls back |
| **Undo Bomb** | Undo | 24 | [.., 0, ..] | UNDO | Restore before explode | All 9 cells restored, `counts/masks` restored |
| **Undo Wildcard** | Undo | 24 | [0, 0, ...] | UNDO | Restore ?, 5 | `board[src]=?, board[dst]=5` |
| **Solvability Check** | Gen | 24 | [1, 2, 3, 5, 7, 11] | Initial | Fails generator | Generator retries until target or pair exists|
| **Stalemate Check** | Refill | 24 | No moves | Resolve | Respawn logic | New tiles injected via `RESOLVE_STALEMATE` (Endgame NOT triggered) |
| **5 Tiles Left** | Count | 24 | 5 tiles | Continue | Game continues | PlayableCount > 1 |
| **2 Tiles Left** | Count | 24 | 2 tiles | Continue | Game continues | PlayableCount > 1 |
| **1 Tile Left** | Count | 24 | 1 tile | Endgame | Round ends | PlayableCount <= 1 |
| **0 Tiles Left** | Count | 24 | 0 tiles | Endgame | Round ends | PlayableCount <= 1 |
| **Trophies + 2 Playable** | Count | 24 | 10T + 2P | Continue | Game continues | PlayableCount filters trophies |
| **No Solution BUT 2 Tiles** | Count | 24 | [2, 3] (Target 100) | Continue | Game continues | No check for solution |
| **Bomb + 1 Playable** | Count | 24 | 1B + 1P | Endgame | Round ends | Bombs do not block endgame |
| **Grid Layout Fit** | Resize | 24 | Layout | Change device size | Board expands | Board maximizes screen width seamlessly |
| **Trophy Swap Blocked** | Drag Drop | 24 | [T, F, ...] | T -> F | Swap successful | `board[src]=F, board[dst]=T` despite F being locked |
| **Rapid Merge Lock** | Interaction| 24 | [2,3] + [2,4] | Fast drags | Next drag works instantly | Input lock removed |
| **Wildcard Lock** | Interaction| 24 | [?,5] | ? -> 5 | 1000ms lock | Only effects wildcard |
| **Blocked Feedback** | Drag Drop | 24 | [2, F, ...] | 2 -> F | Rejected but no swap | Blocked anim & sound, no swap |
| **Mobile Button Sizes** | Layout | 24 | Resize | Phone to Tablet | Buttons scale | using `clamp` |
| **Out-of-Bounds Drag**    | Interaction| 24 | Any Tile      | Drag off board | Cancel cleanly | `dragSource` null, ghost removed, no mutation |
| **Far Drag (Non-Adj)**     | Interaction| 24 | [r,c]         | Drag 5 cells away| Assist resolves | **NEW**: Resolves to adjacent in drag dir |
| **Overswipe (Horizontal)** | Interaction| 24 | [r,c] -> [r,c+2] | Drag right +2 | Resolves [r,c+1] | `handlePointerUp` directional resolution |
| **Overswipe (In-Bounds)**  | Interaction| 24 | Edge cell drag out | Drag past edge | Cancel safely | Bounds check prevents out-of-bounds dst |
| **Sound: Subtle Tap**      | Interaction| 24 | Bottom buttons | Tap button | Soft wooden click | `playSubtleTap` used for all UI |
| **Sound: Earthy Merge**    | Interaction| 24 | Merge | Normal merge | Wooden thump | `playMerge` uses mallet/warm sine |
| **Sound: Wildcard Pop**    | Interaction| 24 | ? -> 5 | Resolve | Single subtle pop | `playWildcardPop` simplified |
| **Sound: Trophy creation** | Interaction| 24 | Capture exact | Create T | Low warm drum | `playTrophy` redesigned |
| **Sound: Bomb Fuse**       | Audio       | 24 | Fuse start    | Tap Bomb | Hissing texture | `playArmedTick` + `playFuse` |
| **Sound: Bomb Explosion**  | Audio       | 24 | Fuse end      | Explode  | Deep muffled thump | `playExplosion` |
| **Sound: Undo**           | Audio       | 24 | Undo tap      | Undo     | Soft acoustic pluck | `playUndo` |
| **Sound: Settings Interaction** | Audio    | 24 | Settings      | Toggle   | Soft tap | respects setting |
| **Sound: Test Button**     | Audio       | 24 | Settings      | Tap TEST | Test audible | Proves WebAudio live |
| **Sound: SpeedGrid Check** | Integration | 24 | SpeedGrid     | Play SG  | SG sounds ok | Verified via audit |
| **Pointer Cancel mid-drag** | Interaction| 24 | Any Tile      | Blur/Cancel    | Cancel cleanly | `dragSource` null, state recovered |
| **Bomb Explosion Ripple**| Animation   | 24 | Trigger B     | Explode  | 3-stage ripple   | **LOCKED BASELINE**: Center -> Ortho -> Corner |
| **Ripple Input Lock**  | Interaction | 24 | During Ripple | Tap/Drag | Inputs blocked   | **LOCKED BASELINE**: `isInputLocked` prevents mutation |
| **Undo after Ripple**  | Undo        | 24 | Post Blast    | UNDO     | Perfect restore  | **LOCKED BASELINE**: Restores bomb + all 9 cells |
| **Result Screen Smoothness** | UI | Any | Game Over | Show Result | Opens instantly | No particle lag, backdrop blur removed |
| **Bomb Particle Cap** | Animation | Any | B Explodes | Visual | Capped particles | Max 36 total, no hover-drop lag |
| **Trophy Count Speed** | UI | Any | Counting | Tally | Fast count-up | Under 700ms, no per-trophy sound spam |
| **Input Responsiveness** | Interaction | Any | Post Effect | Drag/Tap | Responds instantly | No lingering intervals after effects |
| **Sound ON: Merge** | Audio | Any | Play | Merge Tiles | Audible thump | Volume baseline 0.2 + 0.15 |
| **Sound ON: Button** | Audio | Any | Settings | Tap Button | Audible tick | Triangle wave preferred |
| **Sound OFF: All** | Audio | Any | Settings | Toggle OFF | Total silence | `settings.sound` respects UI state |
| **Audio Unlock** | Audio | Any | New Tab | First Tap | Sounds play | `unlock()` on pointerdown/up |
| **SpeedGrid Sound** | Shared | Any | SpeedGrid | Any | Compatible | SpeedGrid sound pipeline intact |
| **Reducer Invalid Defense** | Reducer    | 24 | Any           | Bad pos action | No crash       | Reducer catches error, returns previous state |
| **No Transition All** | Render | Any | Tile State | Move/Spawn | Smooth perf | No expensive layout recalculations |
| **Tile Cache Active** | Render | Any | Tile Color | Move | Cached string returned | Visuals unchanged, no memory leak |
| **No Alert Copy** | Debug | Any | Settings | Copy Debug | Toast shown | Does not block main thread |
| **Gated Logging** | Perf | Any | Interaction | Pointer | No console spam | `cgLog` suppresses logs in production |
| **Oscillator Capped** | Audio | Any | Play Bomb | Tap Bomb | Smooth framerate | `MAX_FUSE_OSCILLATORS` limits nodes to 8 |
| **Wildcard Constants** | Config | Any | Constants | Drag Wildcard | Visuals match | `WILDCARD_ANIM` used successfully |
| **Input Lock Abstraction** | Refactor | Any | Effect | Play Anim | Lock respected | `computeInputLocked` works flawlessly |
| **HUD No-Wrap**          | UI         | Any | Long Equation | HUD Render | Stays 1 row    | `whiteSpace: nowrap` & layout group locks |
| **Nav Grouping**        | UI         | Any | Game Controls | Interaction| Accessible     | Grouped by context (Nav/Target/Meta) |
| **Result Screen Stagger**| Animation  | Any | Endgame      | Show Summary| Smooth Entry   | Staggered spring animations verified |
| **WC Bond Line**        | Visual     | Any | ? Combine    | Vibrate     | Line visible   | Visual-only SVG line connects tiles |
| **SpeedGrid Sound Comp** | Shared     | Any | SpeedGrid    | Success     | Sound works    | `SoundService` legacy methods untouched |
| **Global CSS cg-Prefix**| Shared     | Any | index.css    | Audit       | Scoped         | All new classes/anims use `cg-` prefix |
| **Wildcard Refill Varied**| Refill | 24 | [?, 5, ...] | Resolve | New tiles vary | Verified: Replacement tiles draw from balanced bag |
| **Wildcard Refill Non-Deterministic** | Refill | 24 | [?, 5, ...] | Resolve | Not always ? | Replacement is rarely `?` (approx 2.8% probability) |
| **Multi-Touch Disjointed** | Input | Any | [r1,c1], [r2,c2] | Touch both | No merge | Secondary pointer ignored or interaction cancelled |
| **Multi-Touch Mixed Drag** | Input | Any | [r1,c1] drag | Touch [r2,c2] | No mixed merge | One pointer authority; second finger cannot participate in merge |
| **Non-Active Release** | Input | Any | [r1,c1] drag | Lift finger 2 | No mutation | Only active pointer release can dispatch actions |
| **Tap Adjacency Guard** | Input | Any | [r1,c1], [r2,c2] | Tap far tiles | No merge | Second tap must be adjacent to resolve; otherwise selects or cancels |
| **Stale Version Guard** | Reducer | Any | Version 10 | Action Ver 9 | Rejected | Reducer ignores actions with old version tokens |
| **Timer Cleanup** | Lifecycle | Any | Unmount | Unmount | Timers cleared | `useEffect` cleanup removes all tracked timers/intervals |
| **Timer Growth Limit** | lifecycle | Any | Play N rounds | Normal Play | Count < 20 | Timer count does not grow unbounded during play |
| **Debug Info Coverage**| Debug | Any | UI | Copy Debug | version included| Debug JSON includes version, activePointerId, timers |
| **Trophy Count Version Independence** | Reducer | Any | Counting | COUNT_NEXT_TROPHY | Validated | Version mismatch ignored to prevent counting stall |
| **Result Splash Depth** | UI | Any | SUMMARY phase | Render | Visible | `zIndex: 10000` and `relative` container ensure visibility |
| **Endgame Fallback Guard** | Lifecycle | Any | COUNTING stuck | Wait 10s | SUMMARY shown | Auto-transition to SUMMARY as safety fallback |
| **Debug Finish Trace** | Debug | Any | SUMMARY phase | Copy Debug | State visible | `resultScreenVisible` and `countingIndex` in debug |
| **Factor Indicators (ON)** | UI | Any | Render | Default settings | Visible on factors | Emerald dot shows on factors. |
| **Factor Dots (Settings)** | UI | Any | Settings | Toggle Factor Dots | Dots hide/show | Settings instantly toggle factor dots natively independently. |
| **Distractor Dots (Settings)** | UI | Any | Settings | Toggle Distractor Dots | Amber dots hide/show | Settings instantly toggle muted amber helper dots on non-factor plain tiles. |
| **Factor List (Settings)** | UI | Any | Settings | Toggle Factor List | Recipes hide/show | Settings instantly toggle recipe visual assistance explicitly. |
| **Factor Help Temporary Reveal** | UI | Target | Interaction | Tap Factor Help | Dots reveal 3.5s | Factor dots temporarily show if settings have them hidden. |
| **Factor Info Layout** | UI | Layout | Toggle Factor List | OFF/ON | No ghost area | The factor info cleanly disappears and doesn't leave an empty vertical gap. |
| **Factor Info Top Slot** | UI | Layout | Inspect | View | Info in center top | Verified info occupies the old equation pill slot without adding board height. |
| **Factor Info Phone Display** | UI | Layout | Inspect | View | Readable | Factor recipes are readable on mobile layouts with high contrast and no compression. |
| **Factor Info Recipe Cap** | UI | Target | Info shown | Inspect | Max 3 pairs | Top recipe list is capped at 3 prioritized combinations (2-factor first). |
| **Equation Popup Trophy** | UI | Target | Merge | Trophy created | Popup appears | Equation popup shows briefly ONLY on successful target combinations. |
| **Equation Popup Dismiss** | UI | Timeout | Wait | 1.5s passes | Popup disappears | Verified the popup clears away. |
| **Ordinary Merge Equation** | UI | Target | Merge | Non-trophy merge | No popup | Equation popup does not fire on standard sub-target merges. |
| **Equation Popup Origin Base** | UI | Target | Merge | Trophy created | Point of origin | Verified trophy popup originates accurately at the combine point. |
| **Equation Popup Center Final** | UI | Target | Popup running | Path | Center of board | Verified popup travels to the center of the board and disappears without anchoring in HUD. |
| **Popup Runs Cleanly** | Integration | HUD | Interaction | Popup runs | Slot stable | Verified factor slot remains stable during equation popup overlay. |
| **Factor Recipes Update** | UI | Target changes | Render | New Target | Recipes update | UI shows valid factor expressions for new target. |
| **Factor/Distractor Exclusivity** | UI | Any | Render | Any tile | Only 1 dot max | Factor and distractor dots never appear on the same tile simultaneously. |
| **Factor Indicators Exclusions** | UI | Any | Render | Tiles: `?`, `B`, Trophy, Frozen | No dot on special | Verified conditional exclusions. |
| **Combine Gameplay Check** | Integration | Any | Play | Merge/Undo/Bomb | Fully unaffected | Visual aids do not interfere with standard mechanics. |
| **Stale User Input (Counting)** | Interaction | Phase: COUNTING | TAP/DRAG | Action v9 vs State v10 | Rejected | User inputs must still match version even during count-up. |
| **Internal Sequence (Relaxed)** | Engine | Phase: COUNTING | Interval dispatches | Action v10 vs State v11 | Accepted | Internal counting dispatches bypass version check to prevent stalls. |
| **Undo Blank Tile Fix** | Undo | Any | Merge A+B | UNDO | Board restored instantly | `clearingPositions` is empty in snapshot and on restore. |
| **Undo Restore Sync** | Undo | Any | Any | UNDO | Sync rerender | `Board` key uses `state.version` to force clean render. |
| **Undo Ghost Check** | Undo | Drag | Merge | UNDO | Content visible | `dragSource` nulled in snapshot/restore to prevent empty ghost. |
| **Undo Selection Check** | Undo | Tap | Merge | UNDO | Clean selection | `selection` nulled in snapshot/restore to prevent partial selection stick. |
| **Undo Repeated Check** | Undo | Any | 10 Merges | 10 UNDOs | No Blank | Multi-step undo is stable for 10 cycles (if depth allowed). |
| **Undo Trophy Check** | Undo | Any | Capture | UNDO | Restore Pair | Pre-trophy board restored with no blank. |
| **Undo Wildcard Check** | Undo | Any | ? Merge | UNDO | Restore ? | Pre-wildcard board restored with no blank. |
| **Undo Bomb Check** | Undo | Any | Explode | UNDO | Restore B | Pre-bomb board restored with no blank. |
| **Undo Clear Local State** | Undo | Any | Animation | UNDO | Reset Visuals | Transient component state (popping, blocked, etc.) cleared on UNDO. |
| **Undo Recipe Check** | Undo | Recipe | Next Target | UNDO | Prev Target | target sequence state preserved/restored correctly. |
| **Factor List Contrast** | Guidance | Any | Toggle ON | Readable | High | Pills use high-contrast cream/dark-brown theme. |
| **Factor List Cap (Phone)** | Guidance | Any | Target w/ 6 factors | Show 3 | Capped | Mobile defaults to 2-3 recipes to preserve single-line readable fit. |
| **Factor List Cap (Wide)** | Guidance | Any | Target w/ 6 factors | Show 4 | Capped | Tablet/Desktop shows up to 4 recipes for deeper support, single-line. |
| **Factor List Prioritization** | Guidance | Any | Target 24 | 4x6, 3x8... | Ordered | Pairs with smaller diff (squares/near-squares) show first. |
| **Factor List Layout Stable 36** | Guidance | Any | Target 36 | 1 Row Max | Stable | Factor lists never wrap into a second row (`flex-nowrap`). |
| **Factor List Layout Stable 48** | Guidance | Any | Target 48 | 1 Row Max | Stable | Factor lists never wrap into a second row (`flex-nowrap`). |
| **Factor List Layout Stable 54** | Guidance | Any | Target 54 | 1 Row Max | Stable | Factor lists never wrap into a second row (`flex-nowrap`). |
| **Factor List Layout Stable 60** | Guidance | Any | Target 60 | 1 Row Max | Stable | Factor lists never wrap into a second row (`flex-nowrap`). |
| **Factor List Independent** | Guidance | Any | Toggle Factors/Dots | Independent | Visual | Factors list toggle does not affect Dots toggle state, no ghost row when off. |
| **Recipe Comma Parsing** | Settings | Recipe | "12, 15, 18" | Apply & Restart | Target is 12 | Comma/space/newline parsing works. |
| **Recipe Next Target** | Interaction | Recipe | 12 Cleared | Next Level | Target is 15 | `recipeIndex` increments correctly. |
| **Recipe Retry Same** | Interaction | Recipe | 12 Cleared | Retry | Target is 12 | `recipeIndex` is preserved on retry. |
| **Ambient Music Start** | Sound | Any | 1st User Gesture | Ambient loop on | Played | Requires explicit user interaction to unlock AudioContext. |
| **Ambient Music Stacking** | Sound | Any | Multiple clicks | 1 Loop | Checked | `ambientGain` guards prevent overlapping background tracks. |
| **Music Toggle** | Settings | Any | Music OFF | Ambient stops | Muted | Music stops immediately entirely safely via stopCombineGridAmbient. |
| **CombineGrid Merge Sound** | Sound | Any | Merge valid | Wooden Click | Played | Uses `playCombineGridMerge` securely implemented. |
| **CombineGrid Blocked Sound**| Sound | Any | Merge invalid | Double Thud | Played | Uses `playCombineGridBlocked` double square thud. |
| **CombineGrid Trophy Sound** | Sound | Any | Capture Trophy | Trophy Sound | Played | Uses selected handoff procedural sequence. |
| **CombineGrid Wildcard Pop** | Sound | Any | Combine Wildcard | Triangle Pop | Played | Wildcard pops using newly selected coded sound. |
| **CombineGrid Trophy Tally** | Sound | Endgame | Round end | Ascending Tick | Played | Handled via `playEndgameCountTick`. |
| **CombineGrid Splash Reveal**| Sound | Endgame | Revealing Stats | Pluck Cascade | Played | Handled via `playEndgame`. |
| **Sound Toggle Effect** | Settings | Any | Sound OFF | Actions Silent | Muted | All local interaction sound methods halt, music unaffected if standalone. |
| **Sound Bomb Fuse Cleanup** | Sound | Any | Explode / Undo / Restart | Fuse Stops | Checked | Bomb fuse does not continue indefinitely. Tracked via `bombFuseNodes`. |
| **Safe Bomb Explosion** | Sound | Bomb | Boom | Crack+Thud | Checked | Uses modified gains (0.35/0.2) instead of handoff clipping (1.5). |
| **SpeedGrid Compatibility** | Sound | SpeedGrid | Any Move | Uses old ticks | Preserved | Shared `SoundService.ts` changes do not break or rename SpeedGrid methods. |