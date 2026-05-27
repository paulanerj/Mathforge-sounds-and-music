import { HapticService } from '../../systems/HapticService';

export enum SensoryEvent {
  ON_MATCH_SUCCESS = 'ON_MATCH_SUCCESS',
  ON_MATCH_FAIL = 'ON_MATCH_FAIL',
  ON_TILE_PICKUP = 'ON_TILE_PICKUP',
  ON_TILE_SWAP = 'ON_TILE_SWAP',
  ON_BUTTON_CLICK = 'ON_BUTTON_CLICK',
  ON_MODAL_OPEN = 'ON_MODAL_OPEN',
  ON_MODAL_CLOSE = 'ON_MODAL_CLOSE',
  ON_GRID_REFRESH = 'ON_GRID_REFRESH',
  ON_VICTORY = 'ON_VICTORY',
}

export interface SensoryEventPayloads {
  [SensoryEvent.ON_MATCH_SUCCESS]: { combo: number; isFast: boolean; theme?: string };
  [SensoryEvent.ON_MATCH_FAIL]: { theme?: string };
  [SensoryEvent.ON_TILE_PICKUP]: { theme?: string };
  [SensoryEvent.ON_TILE_SWAP]: { theme?: string };
  [SensoryEvent.ON_BUTTON_CLICK]: { theme?: string };
  [SensoryEvent.ON_MODAL_OPEN]: { theme?: string };
  [SensoryEvent.ON_MODAL_CLOSE]: { theme?: string };
  [SensoryEvent.ON_GRID_REFRESH]: { theme?: string };
  [SensoryEvent.ON_VICTORY]: { theme?: string };
}

type EventListenerCallback<T extends SensoryEvent> = (payload: SensoryEventPayloads[T]) => void;

class SensoryManagerClass {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private feedbackGain: GainNode | null = null;
  private distortionNode: WaveShaperNode | null = null;
  private listeners: { [K in SensoryEvent]?: EventListenerCallback<K>[] } = {};

  constructor() {
    // Register event listeners to map onto direct Web Audio synthesis
    this.subscribe(SensoryEvent.ON_MATCH_SUCCESS, (payload) => {
      const { combo, isFast, theme } = payload;
      const PENTA = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 784.00, 880.00, 1046.50];
      const pitchIndex = Math.max(0, combo - 1);
      const freq = PENTA[Math.min(pitchIndex, PENTA.length - 1)];

      if (combo >= 10) {
        HapticService.playMatchGridComboClimax(true);
        // Play an energetic dual chime with dynamic pitch sweep
        this.synthesizeTone({ freq, type: 'triangle', duration: 0.35, vol: 0.4, slideToFreq: freq * 1.5, theme });
        setTimeout(() => {
          this.synthesizeTone({ freq: freq * 1.25, type: 'sine', duration: 0.35, vol: 0.3, slideToFreq: freq * 2.0, theme });
        }, 60);
      } else {
        // Soft marimba-like sweep strike
        this.synthesizeTone({ freq, type: 'sine', duration: 0.25, vol: 0.3, slideToFreq: freq * 1.15, theme });
        if (isFast) {
          HapticService.playMatchGridCorrectFast(true);
        } else {
          HapticService.playMatchGridCorrectSlow(true);
        }
      }
    });

    this.subscribe(SensoryEvent.ON_MATCH_FAIL, (payload) => {
      const { theme } = payload || {};
      HapticService.playMatchGridWrong(true);
      // Sweeping downward slide
      this.synthesizeTone({ freq: 150, type: 'sawtooth', duration: 0.22, vol: 0.25, slideToFreq: 80, theme });
      setTimeout(() => {
        this.synthesizeTone({ freq: 110, type: 'triangle', duration: 0.25, vol: 0.2, slideToFreq: 60, theme });
      }, 70);
    });

    this.subscribe(SensoryEvent.ON_TILE_PICKUP, (payload) => {
      const { theme } = payload || {};
      this.synthesizeTone({ freq: 720, type: 'triangle', duration: 0.06, vol: 0.12, slideToFreq: 960, theme });
      if (theme === 'celestial-orbit') {
        HapticService.trigger(true, 80); // Heavy initial static friction feel
      } else {
        HapticService.trigger(true, 8);
      }
    });

    this.subscribe(SensoryEvent.ON_TILE_SWAP, (payload) => {
      const { theme } = payload || {};
      this.synthesizeTone({ freq: 440, type: 'sine', duration: 0.12, vol: 0.2, slideToFreq: 220, theme });
      HapticService.trigger(true, 12);
    });

    this.subscribe(SensoryEvent.ON_BUTTON_CLICK, (payload) => {
      const { theme } = payload || {};
      this.synthesizeTone({ freq: 660, type: 'triangle', duration: 0.04, vol: 0.1, theme });
      HapticService.trigger(true, 5);
    });

    this.subscribe(SensoryEvent.ON_MODAL_OPEN, (payload) => {
      const { theme } = payload || {};
      this.synthesizeTone({ freq: 329.63, type: 'sine', duration: 0.15, vol: 0.15, slideToFreq: 440.00, theme });
      HapticService.trigger(true, 12);
    });

    this.subscribe(SensoryEvent.ON_MODAL_CLOSE, (payload) => {
      const { theme } = payload || {};
      this.synthesizeTone({ freq: 440.00, type: 'sine', duration: 0.15, vol: 0.15, slideToFreq: 329.63, theme });
      HapticService.trigger(true, 12);
    });

    this.subscribe(SensoryEvent.ON_GRID_REFRESH, (payload) => {
      const { theme } = payload || {};
      this.synthesizeTone({ freq: 261.63, type: 'sine', duration: 0.1, vol: 0.12, theme });
      setTimeout(() => this.synthesizeTone({ freq: 329.63, type: 'sine', duration: 0.1, vol: 0.12, theme }), 45);
      setTimeout(() => this.synthesizeTone({ freq: 392.00, type: 'sine', duration: 0.15, vol: 0.12, theme }), 90);
      HapticService.trigger(true, [15, 30]);
    });

    this.subscribe(SensoryEvent.ON_VICTORY, (payload) => {
      const { theme } = payload || {};
      const VICTORY_NOTES = [392.00, 523.25, 659.25, 784.00, 1046.50, 1318.51, 1567.98];
      VICTORY_NOTES.forEach((freq, idx) => {
        setTimeout(() => {
          this.synthesizeTone({
            freq,
            type: theme === 'glitch-wave' ? 'triangle' : 'sine',
            duration: 0.4,
            vol: 0.22 - (idx * 0.025),
            theme
          });
        }, idx * 85);
      });
      HapticService.trigger(true, [25, 40, 25, 40, 90]);
    });
  }

  /**
   * lazy-initializes the Web Audio contexts and nodes
   */
  private initAudio() {
    if (this.ctx) return;
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);

      // Create Spatial Delay effects line
      this.delayNode = this.ctx.createDelay(1.0);
      this.delayNode.delayTime.value = 0.28; // Echo period

      this.feedbackGain = this.ctx.createGain();
      this.feedbackGain.gain.value = 0.35; // Feed back loop gain

      // Feedback loop wiring
      this.delayNode.connect(this.feedbackGain);
      this.feedbackGain.connect(this.delayNode);
      this.delayNode.connect(this.masterGain);

      // Create Glitch Wave distortion curve
      this.distortionNode = this.ctx.createWaveShaper();
      this.distortionNode.curve = this.makeDistortionCurve(45);
      this.distortionNode.oversample = '4x';
      this.distortionNode.connect(this.masterGain);
    } catch (e) {
      console.error('SensoryManager: Error inside initializer:', e);
    }
  }

  private makeDistortionCurve(amount = 20) {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  /**
   * Procedural Audio Synthesizer Node Creator
   */
  private synthesizeTone(params: {
    freq: number;
    type: OscillatorType;
    duration: number;
    vol?: number;
    slideToFreq?: number;
    theme?: string;
  }) {
    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch((e) => console.log('WebAudio resume failed safely:', e));
    }

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = params.type;
      osc.frequency.setValueAtTime(params.freq, t);
      if (params.slideToFreq) {
        osc.frequency.exponentialRampToValueAtTime(params.slideToFreq, t + params.duration);
      }

      const vol = params.vol !== undefined ? params.vol : 1.0;
      gain.gain.setValueAtTime(vol * 0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + params.duration);

      osc.connect(gain);

      // Environment & Spatial routing based on active theme
      const isCelestial = params.theme === 'celestial-orbit' || params.theme === 'celestial';
      const isGlitch = params.theme === 'glitch-wave';

      if (isCelestial && this.delayNode) {
        gain.connect(this.delayNode);
        gain.connect(this.masterGain); // routing: both spatial tail and dry direct path
      } else if (isGlitch && this.distortionNode) {
        gain.connect(this.distortionNode);
      } else {
        gain.connect(this.masterGain); // default clean paths
      }

      osc.start(t);
      osc.stop(t + params.duration);
    } catch (e) {
      // safe fallback
    }
  }

  /**
   * Dispatches a sensory feedback event.
   */
  public dispatch<T extends SensoryEvent>(event: T, payload: SensoryEventPayloads[T]): void {
    const list = this.listeners[event] as Array<(p: any) => void> | undefined;
    if (list) {
      list.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`Error in sensory listener for ${event}:`, err);
        }
      });
    }
  }

  /**
   * Subscribes to sensory events.
   */
  public subscribe<T extends SensoryEvent>(event: T, callback: EventListenerCallback<T>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [] as any;
    }
    (this.listeners[event] as any).push(callback);
    return () => {
      this.listeners[event] = (this.listeners[event] as any)?.filter((cb: any) => cb !== callback);
    };
  }
}

export const SensoryManager = new SensoryManagerClass();