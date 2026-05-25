/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SettingsStore } from '../services/storage';
import { playCrystalMathSound, CrystalMathSoundId } from '../audio/crystalMathSoundPack';

export type UISoundKind =
  | 'uiTap'
  | 'uiOpen'
  | 'uiClose'
  | 'uiConfirm'
  | 'uiCancel'
  | 'uiBlocked'
  | 'uiToggle'
  | 'uiSelect'
  | 'uiSave'
  | 'uiReset'
  | 'uiNavigate'
  | 'settingChanged'
  | 'settingApplied'
  | 'soundModeChanged'
  | 'helpOpen'
  | 'helpClose'
  | 'trainingGuidesBlocked'
  | 'copyDebugLog';

// Map UISoundKind to CrystalMathSoundId
const UI_SOUND_MAP: Record<UISoundKind, CrystalMathSoundId> = {
  uiTap: 'ui_tap',
  uiOpen: 'ui_open',
  uiClose: 'ui_close',
  uiConfirm: 'ui_select', // A positive/submit sound
  uiCancel: 'ui_close',
  uiBlocked: 'ui_blocked',
  uiToggle: 'ui_tap',
  uiSelect: 'ui_select',
  uiSave: 'ui_select',
  uiReset: 'ui_close',
  uiNavigate: 'ui_tap',
  settingChanged: 'ui_tap',
  settingApplied: 'ui_select',
  soundModeChanged: 'ui_select',
  helpOpen: 'ui_open',
  helpClose: 'ui_close',
  trainingGuidesBlocked: 'ui_blocked',
  copyDebugLog: 'ui_select',
};

let audioCtx: AudioContext | null = null;
let lastSoundTimes: Record<string, number> = {};

function getContext() {
  if (audioCtx) return audioCtx;
  const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (AudioContextClass) {
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

export const playUISound = (kind: UISoundKind) => {
  const config = SettingsStore.load();
  const soundMode = config.soundMode || (config.isMuted ? 'off' : 'quiet');

  if (soundMode === 'off') return;

  const now = Date.now();
  // Rate-limiting to prevent overlap spam for identical events
  if (lastSoundTimes[kind] && now - lastSoundTimes[kind] < 50) {
    return;
  }
  lastSoundTimes[kind] = now;

  let gainScale = soundMode === 'quiet' ? 0.3 : 1.0;

  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const soundId = UI_SOUND_MAP[kind] || 'ui_tap';

  playCrystalMathSound(soundId, {
    audioCtx: ctx,
    output: ctx.destination,
    gainScale,
  });
};
