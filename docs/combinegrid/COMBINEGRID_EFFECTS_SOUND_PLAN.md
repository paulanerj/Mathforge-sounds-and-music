# CombineGrid Effects & Sound Implementation Plan

This document outlines the phased implementation plan for the final CombineGrid visual and audio polish features, ensuring stability and preventing drift in core logic.

## 1. Wildcard Tile Contract
The "zero special tile" concept is renamed to "Wildcard tile" visually and conceptually.
- **Visual Appearance**: Shows a `?` instead of `0`.
- **Styling**: Clearly special, slightly magical/mysterious. Can use a subtle texture/glow. Must fit existing CombineGrid tile geometry. Do not confuse with numbers, trophies, or bombs.
- **Mechanics**: Visually and conceptually a wildcard. Behaves functionally identically to the existing zero tile mechanics.

## 2. Wildcard Combine Behavior Contract
When a normal tile combines with a Wildcard tile:
1. Normal tile combines with Wildcard.
2. Effect snapshot captures both tiles visually.
3. Both involved tiles vibrate/shake together.
4. Vibration starts subtle and accelerates over ~1 second.
5. Buzzing/tremolo sound accelerates alongside the vibration.
6. Both tiles pop at the end.
7. Small cube/confetti particles burst.
8. Board state updates *after* the effect snapshot is captured.
9. Mechanics remain identical to previous zero behavior.

## 3. Blocked Tile Interaction Contract
When player tries to combine/swap with a blocked tile (that isn't a valid trophy swap):
- **Visuals**: No large animation, no confusing shake storms. Blocked tile briefly reduces opacity or flashes subtly.
- **Audio**: Short custom "blocked" sound.
- **Mechanics**: Interaction rejected cleanly. Trophy swap rules remain separate and allowed. Blocked/locked non-trophies must reject the interaction seamlessly.

## 4. Monument Valley Soundstyle Contract
- **Style**: Premium, tactile, sparse, elegant, Monument Valley-inspired.
- **Qualities**: Soft mallet/percussion, glass/ceramic/wood textures, gentle chimes, little mechanical clicks.
- **Restrictions**: No harsh arcade buzzers, no cheap generic beeps, no long noisy sounds. Pleasant even on repetition.
- **Sound Palette**: Kalimba, marimba, soft glass bell, ceramic tap, muted woodblock, tiny metallic chime, soft low thump (blocked), filtered tremolo/buzz (Wildcard).

## 5. Complete Event Inventory & Specific Sound Design Map
1. **button tap**: Warm click. Pitch range mid-high. 50-100ms.
2. **tile pick up**: Light ceramic pluck. Very short. Random pitch var allowed.
3. **tile drag start**: Soft wood block.
4. **tile hover/drag over valid target**: Very subtle soft chime/click.
5. **normal tile swap**: Muted wood block slide.
6. **valid merge below target**: Soft glass ping.
7. **exact target / trophy creation**: Layered soft glass chime + warm wooden tap. Upward interval, gentle shimmer tail. 450-650ms.
8. **trophy swap**: Smooth heavy slide lock. Lower pitch.
9. **blocked tile attempt**: Muted ceramic "tok". Very short, subtle downward pitch, 80-130ms. Accompanied by opacity dip visual.
10. **invalid move / illegal swap**: Dull thud/clack.
11. **Wildcard appears**: Subtle magical twinkle.
12. **Wildcard combine start**: Low vibration tone.
13. **Wildcard accelerating vibration**: Accelerating tremolo buzz, rising pitch.
14. **Wildcard pop/confetti**: Playful bonk-pop + cube confetti rustle.
15. **bomb appears**: Light heavy thud.
16. **bomb tap / fuse start**: Spark ignite.
17. **bomb fuse spark loop**: Sizzling spark cycle.
18. **bomb explosion**: Muted bass thud + glass shatter scatter.
19. **individual bomb-radius tile pop**: Quick bubble/ceramic pop.
20. **undo**: Reverse slide mechanism.
21. **endgame begins**: Soft multi-tone chime.
22. **trophy count tick**: Alternate between 5 distinct light percussion tones (kalimba/marimba). See rules below.
23. **star reveal**: Bright magical flourish.
24. **results screen reveal**: Soft swelling chord.
25. **restart / next round**: Premium thick click.

## 6. Endgame Trophy Count Sound Contract
During the endgame count-up:
- **Mechanics**: Each trophy counted triggers one sound.
- **Tones**: 5 distinct light percussion variants (kalimba, marimba, glass/wood taps) acting as one musical family.
- **Selection**: Rotate sequentially or pseudo-randomly among the 5 variants.
- **Pacing**: Subtle pitch variation prevents identical monotony.
- **Finale**: Final count/star reveal receives a deliberately brighter flourish.

## 7. Updated Implementation Phase Plan
**Phase 1: Wildcard visual rename/presentation** (IMPLEMENTED)
- Visuals only. Retain existing zero mechanics. Change `0` to `?` presentation. Internal value remains `ZERO_TILE_VALUE` (100). No reducer/rules or board representation changes.

**Phase 2: Wildcard combine animation V1** (IMPLEMENTED)
- Add accelerating vibration, pop, and cube/confetti effect. Also implemented V1 sound and haptics for Wildcard combine. Physics randomness audited and made deterministic to avoid re-render jitter.

**Phase 3: Wildcard tuning pass** (IMPLEMENTED)
- Tighter vibration crescendo, mathematical symbol particles, and improved "wooooop" pop sound.

**Phase 4: Blocked tile feedback** (IMPLEMENTED)
- Add opacity dip on blocked moves. Add custom "tok" blocked sound. Interception prioritized correctly below Trophy Swaps.

**Phase 5: Endgame trophy count sounds** (IMPLEMENTED)
- Wire the 5 rhythmic percussion variants to the counter.

**Phase 6: Bomb visual polish** (ACCEPTABLE FOR NOW / DEFERRED)
- Add full bomb sequence: arming, ticking, and explosion sound tuning. Currently acceptable.

**Phase 7: Hyper-polish pass** (DEFERRED)
- Full Monument Valley-style synthetic soundscape across all events replacing the Web Audio oscillator stubs.