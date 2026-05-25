/**
 * Crystal Math Sound Pack
 *
 * Active MathForge sound pack.
 *
 * Source identity:
 * - clean
 * - glassy
 * - sine-based
 * - precise
 * - bright but not piercing
 *
 * This module does not create an AudioContext.
 * It receives the app's existing AudioContext and output node.
 */

export type CrystalMathSoundId =
  | 'ui_tap'
  | 'ui_select'
  | 'ui_open'
  | 'ui_close'
  | 'ui_blocked'
  | 'answer_tap'
  | 'correct_base'
  | 'correct_fast_1'
  | 'correct_fast_2'
  | 'correct_fast_3'
  | 'wrong_soft'
  | 'dark_tick'
  | 'mode_change_soft'
  | 'qmm_fast_1'
  | 'qmm_fast_2'
  | 'qmm_fast_3'
  | 'fail_safe_reveal'
  | 'level_complete';

export interface CrystalMathSoundMeta {
  id: CrystalMathSoundId;
  category: 'ui' | 'gameplay' | 'mode' | 'reward';
  durationMs: number;
  fatigueRisk: 'low' | 'medium';
  description: string;
  usage: string;
}

export const CRYSTAL_MATH_SOUND_META: Record<CrystalMathSoundId, CrystalMathSoundMeta> = {
  ui_tap: {
    id: 'ui_tap',
    category: 'ui',
    durationMs: 48,
    fatigueRisk: 'low',
    description: 'Tiny glass tap for ordinary UI clicks.',
    usage: 'Buttons, small taps, low-importance UI actions.',
  },
  ui_select: {
    id: 'ui_select',
    category: 'ui',
    durationMs: 95,
    fatigueRisk: 'low',
    description: 'Small two-note glass selection sound.',
    usage: 'Tabs, segmented choices, dropdown selections.',
  },
  ui_open: {
    id: 'ui_open',
    category: 'ui',
    durationMs: 140,
    fatigueRisk: 'low',
    description: 'Short upward glass glide for opening panels.',
    usage: 'Opening Help, Settings, menus, overlays.',
  },
  ui_close: {
    id: 'ui_close',
    category: 'ui',
    durationMs: 100,
    fatigueRisk: 'low',
    description: 'Short downward glass glide for closing panels.',
    usage: 'Closing menus, back/cancel, returning from overlays.',
  },
  ui_blocked: {
    id: 'ui_blocked',
    category: 'ui',
    durationMs: 135,
    fatigueRisk: 'low',
    description: 'Soft unavailable sound, not harsh or punishing.',
    usage: 'Coming Soon, disabled/blocked actions, greyed fail-safe taps.',
  },
  answer_tap: {
    id: 'answer_tap',
    category: 'gameplay',
    durationMs: 45,
    fatigueRisk: 'low',
    description: 'Tiny sparkle tap for answer-button contact.',
    usage: 'Optional answer touch feedback before correct/incorrect resolution.',
  },
  correct_base: {
    id: 'correct_base',
    category: 'gameplay',
    durationMs: 235,
    fatigueRisk: 'low',
    description: 'Clean two-note correct-answer chime.',
    usage: 'Standard correct answer when no speed tier is active.',
  },
  correct_fast_1: {
    id: 'correct_fast_1',
    category: 'gameplay',
    durationMs: 235,
    fatigueRisk: 'low',
    description: 'First fast-success tier with a light rising sparkle.',
    usage: 'Correct answer under the fast threshold, first speed tier.',
  },
  correct_fast_2: {
    id: 'correct_fast_2',
    category: 'gameplay',
    durationMs: 240,
    fatigueRisk: 'medium',
    description: 'Second fast-success tier with brighter crystal layer.',
    usage: 'Second consecutive fast correct answer.',
  },
  correct_fast_3: {
    id: 'correct_fast_3',
    category: 'gameplay',
    durationMs: 250,
    fatigueRisk: 'medium',
    description: 'Third fast-success tier with extra sparkle burst.',
    usage: 'Third or higher consecutive fast correct answer.',
  },
  wrong_soft: {
    id: 'wrong_soft',
    category: 'gameplay',
    durationMs: 210,
    fatigueRisk: 'low',
    description: 'Soft descending tone for incorrect answers.',
    usage: 'Wrong answer feedback; should not shame or alarm the learner.',
  },
  dark_tick: {
    id: 'dark_tick',
    category: 'mode',
    durationMs: 24,
    fatigueRisk: 'medium',
    description: 'Very short crystal tick for Dark Mode rhythm.',
    usage: 'Dark Mode ticking only while gameplay is actively running.',
  },
  mode_change_soft: {
    id: 'mode_change_soft',
    category: 'ui',
    durationMs: 120,
    fatigueRisk: 'low',
    description: 'Tiny Crystal Math ready cue for mode changes and board initialization.',
    usage: 'Played when a game board initializes or mode changes. Must stay subtle because it can happen frequently.',
  },
  qmm_fast_1: {
    id: 'qmm_fast_1',
    category: 'mode',
    durationMs: 235,
    fatigueRisk: 'low',
    description: 'QMM fast tier 1 alias of Crystal Math fast success.',
    usage: 'QMM first fast correct answer.',
  },
  qmm_fast_2: {
    id: 'qmm_fast_2',
    category: 'mode',
    durationMs: 240,
    fatigueRisk: 'medium',
    description: 'QMM fast tier 2 alias of Crystal Math fast success.',
    usage: 'QMM second fast correct answer.',
  },
  qmm_fast_3: {
    id: 'qmm_fast_3',
    category: 'mode',
    durationMs: 250,
    fatigueRisk: 'medium',
    description: 'QMM fast tier 3 alias of Crystal Math fast success.',
    usage: 'QMM third or higher fast correct answer.',
  },
  fail_safe_reveal: {
    id: 'fail_safe_reveal',
    category: 'gameplay',
    durationMs: 315,
    fatigueRisk: 'low',
    description: 'Helpful rising reveal sound for green fail-safe answer.',
    usage: 'When Pedagogical Fail-Safe reveals the required correct answer.',
  },
  level_complete: {
    id: 'level_complete',
    category: 'reward',
    durationMs: 1050,
    fatigueRisk: 'medium',
    description: 'Crystal completion phrase for level/session success.',
    usage: 'Level complete, session complete, strong reward moment.',
  },
};

export interface CrystalMathPlayOptions {
  audioCtx: AudioContext;
  output: AudioNode;
  gainScale?: number;
}

function safeGain(value: number, scale = 1): number {
  return Math.max(0.0001, value * scale);
}

function osc(
  audioCtx: AudioContext,
  output: AudioNode,
  freq: number,
  type: OscillatorType,
  dur: number,
  gain: number,
  attack = 0.004,
  release = 0.04
): void {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = freq;

  const t = audioCtx.currentTime;
  gainNode.gain.setValueAtTime(0, t);
  gainNode.gain.linearRampToValueAtTime(gain, t + attack);
  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    t + Math.max(dur - release, attack + 0.01)
  );

  oscillator.connect(gainNode);
  gainNode.connect(output);

  oscillator.start(t);
  oscillator.stop(t + dur + 0.02);
}

function glide(
  audioCtx: AudioContext,
  output: AudioNode,
  f1: number,
  f2: number,
  type: OscillatorType,
  dur: number,
  gain: number
): void {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = type;

  const t = audioCtx.currentTime;
  oscillator.frequency.setValueAtTime(f1, t);
  oscillator.frequency.exponentialRampToValueAtTime(f2, t + dur);

  gainNode.gain.setValueAtTime(gain, t);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  oscillator.connect(gainNode);
  gainNode.connect(output);

  oscillator.start(t);
  oscillator.stop(t + dur + 0.02);
}

function noiseBurst(
  audioCtx: AudioContext,
  output: AudioNode,
  dur: number,
  gain: number,
  centerFreq: number,
  q = 8
): void {
  const len = Math.ceil(audioCtx.sampleRate * dur);
  const buffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < len; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;

  const bandpass = audioCtx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = centerFreq;
  bandpass.Q.value = q;

  const gainNode = audioCtx.createGain();
  const t = audioCtx.currentTime;
  gainNode.gain.setValueAtTime(gain, t);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  source.connect(bandpass);
  bandpass.connect(gainNode);
  gainNode.connect(output);

  source.start(t);
  source.stop(t + dur + 0.01);
}

export function playCrystalMathSound(id: CrystalMathSoundId, options: CrystalMathPlayOptions): void {
  const { audioCtx, output } = options;
  const gainScale = options.gainScale ?? 1;

  const g = (value: number) => safeGain(value, gainScale);

  switch (id) {
    case 'ui_tap':
      osc(audioCtx, output, 1046, 'sine', 0.048, g(0.14), 0.002, 0.038);
      return;

    case 'ui_select':
      osc(audioCtx, output, 1046, 'sine', 0.065, g(0.13));
      window.setTimeout(() => osc(audioCtx, output, 1318, 'sine', 0.05, g(0.09)), 30);
      return;

    case 'ui_open':
      glide(audioCtx, output, 660, 880, 'sine', 0.1, g(0.14));
      window.setTimeout(() => osc(audioCtx, output, 1320, 'sine', 0.055, g(0.07)), 75);
      return;

    case 'ui_close':
      glide(audioCtx, output, 880, 620, 'sine', 0.09, g(0.13));
      return;

    case 'ui_blocked':
      osc(audioCtx, output, 440, 'sine', 0.075, g(0.11));
      window.setTimeout(() => osc(audioCtx, output, 415, 'sine', 0.06, g(0.09)), 48);
      return;

    case 'answer_tap':
      osc(audioCtx, output, 1046, 'sine', 0.038, g(0.15), 0.001, 0.03);
      noiseBurst(audioCtx, output, 0.028, g(0.08), 4000, 4);
      return;

    case 'correct_base':
      osc(audioCtx, output, 523, 'sine', 0.22, g(0.21));
      window.setTimeout(() => osc(audioCtx, output, 659, 'sine', 0.17, g(0.14)), 14);
      return;

    case 'correct_fast_1':
    case 'qmm_fast_1':
      osc(audioCtx, output, 523, 'sine', 0.22, g(0.21));
      window.setTimeout(() => osc(audioCtx, output, 659, 'sine', 0.18, g(0.15)), 12);
      window.setTimeout(() => osc(audioCtx, output, 784, 'sine', 0.13, g(0.10)), 28);
      return;

    case 'correct_fast_2':
    case 'qmm_fast_2':
      osc(audioCtx, output, 523, 'sine', 0.21, g(0.22));
      [659, 784, 1046].forEach((freq, index) => {
        window.setTimeout(
          () => osc(audioCtx, output, freq, 'sine', 0.18, g(0.14 - index * 0.02)),
          12 + index * 20
        );
      });
      window.setTimeout(() => noiseBurst(audioCtx, output, 0.04, g(0.10), 5000, 3), 55);
      return;

    case 'correct_fast_3':
    case 'qmm_fast_3':
      osc(audioCtx, output, 523, 'sine', 0.21, g(0.23));
      [659, 784, 1046, 1318].forEach((freq, index) => {
        window.setTimeout(
          () => osc(audioCtx, output, freq, 'sine', 0.19, g(0.15 - index * 0.02)),
          10 + index * 18
        );
      });
      window.setTimeout(() => noiseBurst(audioCtx, output, 0.06, g(0.14), 6000, 3), 50);
      window.setTimeout(() => noiseBurst(audioCtx, output, 0.04, g(0.10), 8000, 3), 110);
      return;

    case 'wrong_soft':
      glide(audioCtx, output, 523, 392, 'sine', 0.21, g(0.14));
      return;

    case 'dark_tick':
      osc(audioCtx, output, 1320, 'sine', 0.024, g(0.11), 0.001, 0.02);
      return;

    case 'mode_change_soft':
      osc(audioCtx, output, 660, 'sine', 0.06, g(0.10));
      window.setTimeout(() => osc(audioCtx, output, 880, 'sine', 0.08, g(0.08)), 60);
      return;

    case 'fail_safe_reveal':
      [523, 659, 784].forEach((freq, index) => {
        window.setTimeout(() => osc(audioCtx, output, freq, 'sine', 0.25, g(0.17)), index * 78);
      });
      window.setTimeout(() => noiseBurst(audioCtx, output, 0.08, g(0.13), 4000, 3), 235);
      return;

    case 'level_complete':
      [
        [523, 0],
        [659, 95],
        [784, 190],
        [1046, 305],
        [784, 460],
        [659, 590],
        [784, 720],
        [1046, 860],
      ].forEach(([freq, delay]) => {
        window.setTimeout(
          () => osc(audioCtx, output, freq, 'sine', 0.30, g(0.18)),
          delay
        );
      });
      window.setTimeout(() => noiseBurst(audioCtx, output, 0.10, g(0.16), 5000, 2.5), 860);
      return;

    default:
      return;
  }
}
