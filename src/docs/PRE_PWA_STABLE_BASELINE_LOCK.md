# Pre-PWA Stable Baseline Lock

## Status
This is the accepted stable MathForge baseline before PWA/installability work begins.

## Manual Smoke Test Passed
The following user tests have been passed:
- Normal Mode correct/wrong
- QMM rapid answers
- Dark Mode tick/help/resume
- Dark Mode Sound Off silence
- Fail-Safe help/green answer
- Settings Sound Mode On/Quiet/Off
- Training Guides Coming Soon

## Systems That Must Not Drift
- core gameplay modes
- Pedagogical Fail-Safe
- Help / Quick Tips / Mode Help
- Training Guides disabled state
- Crystal Math sound baseline
- Sound Mode On / Quiet / Off
- Copy Debug Log
- runtime debug logging
- answer grid centering
- Dark Mode AnswerGrid hidden behavior
- audio lifecycle gating

## Training Guides Rule
Training Guides remain disabled and must not be re-enabled during PWA work.

## Sound Rule
Do not alter the Crystal Math baseline during PWA work.

## PWA Work Safety Rule
PWA changes must not affect gameplay state, reducer logic, sound logic, Help, Settings, or tutorial containment.
