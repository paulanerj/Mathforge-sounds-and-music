# MathForge Speed Grid Adaptive Music Studio — R4 operating guide

Status: experimental / sandbox only, no production game changes
Published studio: https://paulanerj.github.io/Mathforge-sounds-and-music/speedgrid-adaptive-music-lab.html
Known-good fallback speaker test: https://paulanerj.github.io/Mathforge-sounds-and-music/speedgrid-audio-check-r3.html

## First launch (Windows Chrome or Edge)
1. Open the **published studio URL directly** in a browser tab. Do not use a PNG, GitHub source-code preview, or HTML attachment preview.
2. Confirm that the **JAVASCRIPT READY** banner has turned green.
3. Click **TEST SPEAKERS — 3 tones**. This produces three short diagnostic notes, not generated backing music.
4. Click **PLAY / PAUSE RECORDED MP3** (or the native embedded audio control). This requests the existing repository track `./audio/music/main_menu_loop.mp3`. It is a single-track technical preview of audio delivery, not a full four-stem arrangement and is not evidence of musical quality.
5. Choose **Stone Garden** under compositions. The composition metadata and production prompt should update. Until a stem is attached, the app explicitly reports no recorded stems.
6. Click the simulated events: Path success, Overshoot, Time tile, Pause/thinking, Recovery sequence, Rapid solves, Round complete, Reset session. Director state and proposed mix levels will change, whether or not stems exist.
7. Optionally use **Start auto simulation** for sequential event demonstrations; always stop the simulation when done.
8. Once recorded stems exist, choose **Attach recorded stems**, upload one audio file for each of Atmosphere, Harmony, Motion, Wonder. Files stay in browser RAM, not on a server. After decoding completes, click **Play selected composition**.
9. Use separate per-layer mix cap sliders, music enabled, SFX enabled, and event simulations. Bar-synchronized gains will change on a shared Web Audio clock. The app checks loaded stem length differences and expected eight-bar duration.
10. **Download studio config (.json)** to save composition selection, HTTPS URLs, and mix caps; use **Import studio config (.json)** to restore. Local uploaded binary audio files cannot be exported inside configuration JSON and must be selected again.

## Recorded stem spec / first composition
**Stone Garden**: D major, 96 BPM, 4/4, eight bars (= 20.000 seconds). Four files, common start at bar 1 beat 1:
- `stone-garden_atmosphere.mp3`
- `stone-garden_harmony.mp3`
- `stone-garden_motion.mp3`
- `stone-garden_wonder.mp3`

Produce four **genuine aligned exports from the same multitrack piece**, not unrelated individual audio-generation outputs. Keep equal decoded durations; do not master each independently at loudness that creates clashes. License must cover commercial interactive games. Archive WAV masters and publish delivery MP3/OGG. Initial technical proof can use local file inputs: no Cloudflare, Vercel, or GitHub media upload required.

## Hosting decisions
- GitHub repository `paulanerj/Mathforge-sounds-and-music`, default branch `main`, serves the laboratory via its existing GitHub Pages Vite workflow.
- GitHub Pages copies files in `public/` into the deployed site root; `public/speedgrid-adaptive-music-lab.html` becomes `/speedgrid-adaptive-music-lab.html` under the project's published path.
- Vercel is **not** required for this standalone studio. Cloudflare R2 remains a possible later storage/CDN layer; it is **not configured** here.
- HTTPS stem URLs from other domains require appropriate CORS for fetch/decode. Failures must appear in diagnostics; no silent fallback.
- Do not interpret the real single-track MP3 preview as the new four-layer music.

## Architecture guardrails / SDK future
- Observed high-level game facts -> game-local audio adapter -> pure rule-based music director -> four-track sample engine.
- Do not connect the lab directly to the frozen gesture reducer, math evaluator, scoring engine, or SDK predecessor contracts.
- Speed Grid existing `SoundService` remains untouched by this R4 website.
- Mark classification as presentation only. Rapid solves, repeated overshoots, and pauses are NOT proof of mathematical mastery.
- Only after the music is accepted: build observational game adapter and run the frozen Speed Grid regression audit. No Gen2/SDK authority claim until contract reconciliation.

## Diagnostic distinctions
- **Buttons fail to increment click counter:** JavaScript/script-preview issue.
- **Click counter responds; audio context not running:** Browser audio activation or interruption issue.
- **AudioContext running but silent speakers:** Check browser mute, Windows sound output device, Volume Mixer.
- **Test tones work; repository MP3 does not:** File URL/deployment/MP3 codec issue.
- **MP3 works; stem playback fails:** Uploaded file decoding, HTTPS/CORS, missing stem, or duration mismatch; inspect diagnostics.
- **Director changes but no music:** No matching professionally recorded stems have been loaded yet; simulation still operates.
- **Music changes after several beats:** By design, the R4 layer envelope schedules on the next musical bar to avoid choppy transitions.

## Acceptance
A. Interactive published app, actual click response and three-note playback on user's Windows desktop.
B. Existing MP3 plays from deployed route.
C. Eight event buttons and auto simulation change director state, not game logic.
D. Four aligned stems load, synchronize, loop, and change gain on bars; independently verify audibility.
E. Save and reload config with URLs/caps.
F. Browser QA for actual Windows Chrome/Edge plus iPhone Safari before production promotion.

## Next project slice
Acquire or create **one musically acceptable Stone Garden recorded composition in four aligned stems**; audition with this R4 studio. Then audit live game-to-audio event adapter, not before.
