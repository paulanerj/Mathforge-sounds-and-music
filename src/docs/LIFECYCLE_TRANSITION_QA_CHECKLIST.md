# Lifecycle Transition QA Checklist

## Purpose
This checklist protects the app from mixed-state bugs involving gameplay, pause, Help, Settings, audio, Dark Mode, Fail-Safe, navigation, and disabled Training Guides. It defines the core state transitions that must remain stable and thoroughly tested prior to and after feature work.

## Current Stable Systems
- Core gameplay modes (Normal, QMM, Dark, Hidden, Survival)
- Pedagogical Fail-Safe
- Help button, Quick Tips, and Mode Help
- Copy Debug Log
- Sound Mode (On / Quiet / Off - Default: Quiet)
- UI sound coverage
- Audio lifecycle gating
- Static Help content refined for 9–10-year-olds

## Disabled Systems
- Training Guides
- Start Guide
- Replay Guide
- Tutorial Overlay Demo
- HelpMenu path to TutorialOverlay
- HelpMenu path to `useTutorialDirector.startTutorial`

## General Rules
- Help freezes gameplay and resumes safely.
- Settings should stop active gameplay audio.
- Home/Menu navigation should stop audio and clear overlays.
- Training Guides must remain Coming Soon.
- Sound Mode Off must silence UI sounds, gameplay sounds, Dark Mode tick, and haptics.
- Fail-Safe correction must survive Help open/close.
- Dark Mode must never expose the AnswerGrid.
- No blank center UI should appear.
- No stuck pointer-events state should occur.

## Specific Test Cases & Verification Results

### 1. Normal Mode transitions
- [ ] Start Normal Mode → correct answer → Help → Resume
- [ ] Start Normal Mode → Pause → Help → Close Help
- [ ] Start Normal Mode → Settings → Apply → Resume
- [ ] Start Normal Mode → Restart
- [ ] Start Normal Mode → Home/Menu

**Status**: [NEEDS MANUAL USER TEST]

### 2. QMM transitions
- [ ] Start QMM → rapid answers → Help → Resume
- [ ] QMM → Pause → Settings → Apply
- [ ] QMM → Sound Off → rapid answers
- [ ] QMM → Restart

**Status**: [NEEDS MANUAL USER TEST]

### 3. Dark Mode transitions
- [ ] Start Dark Mode → confirm AnswerGrid hidden
- [ ] Dark Mode → Help → Resume
- [ ] Dark Mode → Settings → Apply
- [ ] Dark Mode → Pause → Help → Close
- [ ] Dark Mode → Sound Off → confirm no tick
- [ ] Dark Mode → Home/Menu → confirm tick stopped
- [ ] Dark Mode → Restart → no blank UI

**Status**: [NEEDS MANUAL USER TEST]

### 4. Hidden Mode transitions
- [ ] Hidden Mode → Help → Resume
- [ ] Hidden Mode → Settings → Apply
- [ ] Hidden Mode → Fail-Safe if wrong answer occurs

**Status**: [NEEDS MANUAL USER TEST]

### 5. Survival Mode transitions
- [ ] Survival → wrong answer → life/strike changes correctly
- [ ] Survival → Help → Resume
- [ ] Survival → Pause → Help → Close
- [ ] Survival → Home/Menu
- [ ] Survival → Restart

**Status**: [NEEDS MANUAL USER TEST]

### 6. Pedagogical Fail-Safe transitions
- [ ] Wrong answer → green correct answer appears
- [ ] Fail-Safe active → Help → Close Help → green answer still works
- [ ] Fail-Safe active → Settings → Apply → no crash
- [ ] Fail-Safe active → Sound Off → green answer works silently
- [ ] Fail-Safe active → repeated grey button taps → blocked sound only if sound enabled

**Status**: [NEEDS MANUAL USER TEST]

### 7. Help Menu transitions
- [ ] Help opens
- [ ] Quick Tips Next works
- [ ] Mode Help works
- [ ] Copy Debug Log works
- [ ] Training Guides disabled click shows Coming Soon
- [ ] Help close resumes correctly
- [ ] Help does not launch TutorialOverlay

**Status**: [PASS] (Verified via code inspection)

### 8. Settings transitions
- [ ] Open Settings from gameplay
- [ ] Change Sound Mode
- [ ] Change gameplay settings
- [ ] Apply
- [ ] Cancel/close
- [ ] Confirm audio stops while Settings is open
- [ ] Confirm no blank UI after applying

**Status**: [NEEDS MANUAL USER TEST]

### 9. Sound Mode transitions
- [ ] Sound Mode On: sounds audible
- [ ] Sound Mode Quiet: sounds soft
- [ ] Sound Mode Off: no UI/gameplay/tick/haptics
- [ ] Toggle Sound Mode during Dark Mode
- [ ] Toggle Sound Mode during Help
- [ ] Toggle Sound Mode during Settings

**Status**: [NEEDS MANUAL USER TEST]

### 10. Disabled Training Guides transitions
- [ ] Training Guides visible
- [ ] Coming Soon badge visible
- [ ] Click produces friendly message
- [ ] Click logs event
- [ ] No TutorialOverlay opens
- [ ] No `useTutorialDirector.startTutorial` launches

**Status**: [PASS] (Verified via code inspection)

### 11. Navigation / Home / Restart transitions
- [ ] Gameplay → Home/Menu
- [ ] Gameplay → Restart
- [ ] Help → Home/Menu if available
- [ ] Settings → Home/Menu if available
- [ ] Pause → Home/Menu
- [ ] Confirm no lingering audio
- [ ] Confirm no stuck overlay

**Status**: [NEEDS MANUAL USER TEST]

### 12. Responsive layout checks
For screen sizes: 360x740, 390x844, 430x932, 768x1024, 1024x768:
- [ ] answer grid centered
- [ ] center coin centered
- [ ] footer centered
- [ ] Help readable
- [ ] Settings readable
- [ ] no blank center UI
- [ ] no overflow trapping controls

**Status**: [NEEDS MANUAL USER TEST]

## Debug Log Usage

If a lifecycle bug or frozen state appears, please copy the debug log to help pinpoint the issue:

1. Open Help.
2. Tap "Copy Log" at the bottom.
3. Paste the result into the project manager chat.
4. Include what you clicked right before the bug occurred.
