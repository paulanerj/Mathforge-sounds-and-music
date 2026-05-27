────────────────────────────────────────────────────────────────────────────────
export class SoundService {
  private static ctx: AudioContext | null = null;
  private static masterGain: GainNode | null = null;
  private static unlocked: boolean = false;
  private static lastTickTime: number = 0;
  private static lastMergeTime: number = 0;
  private static lastExplosionTime: number = 0;
  private static delayNode: DelayNode | null = null;
  private static feedbackGain: GainNode | null = null;
  private static dryGain: GainNode | null = null;

  static unlock() {
    // Aggressively ensure context is running
    if (this.ctx?.state === 'running') {
      this.unlocked = true;
      return;
    }
    
    console.log("SoundService: unlock() called, current state:", this.ctx?.state);
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        console.warn("SoundService: AudioContext not supported");
        return;
      }

      if (!this.ctx) {
        console.log("SoundService: Creating new AudioContext");
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.6; // slightly lower master volume for ambient feel
        this.masterGain.connect(this.ctx.destination);

        // Setup the Monument Valley delay chain
        this.delayNode = this.ctx.createDelay(1.0);
        this.delayNode.delayTime.value = 0.28;
        
        this.feedbackGain = this.ctx.createGain();
        this.feedbackGain.gain.value = 0.30;
        
        this.dryGain = this.ctx.createGain();
        this.dryGain.gain.value = 0.55;
        
        // Routing: delayNode -> feedbackGain -> delayNode (loop)
        this.delayNode.connect(this.feedbackGain);
        this.feedbackGain.connect(this.delayNode);
        
        // Routing: delayNode -> dryGain -> destination
        this.delayNode.connect(this.dryGain);
        this.dryGain.connect(this.masterGain);
      }
      
      if (this.ctx.state === 'suspended' || (this.ctx.state as string) === 'interrupted') {
        console.log("SoundService: Resuming AudioContext");
        this.ctx.resume().then(() => {
          console.log("SoundService: AudioContext resumed successfully, state:", this.ctx?.state);
          this.unlocked = true;
          if (this._combineGridMusicEnabled) this.startCombineGridAmbient();
        }).catch((err) => {
          console.error("SoundService: Failed to resume AudioContext", err);
        });
      } else if (this.ctx.state === 'running') {
        this.unlocked = true;
        if (this._combineGridMusicEnabled) this.startCombineGridAmbient();
      }
    } catch (e) {
      console.error("SoundService: Error in unlock()", e);
    }
  }

  static playTestSound(soundEnabled: boolean) {
    if (!soundEnabled) {
      console.log("SoundService: playTestSound skipped (disabled)");
      return;
    }
    this.unlock();
    // Use a clearer sound for testing
    setTimeout(() => this.playButtonTap(true), 50);
    setTimeout(() => this.playMerge(true), 200);
  }

  private static playTone(freq: number, type: OscillatorType, duration: number, vol = 1, slideToFreq?: number) {
    if (!this.unlocked || this.ctx?.state !== 'running') this.unlock();
    if (!this.ctx || !this.masterGain) return;
    
    // Late-bind resume check
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      
      const t = this.ctx.currentTime;
      osc.frequency.setValueAtTime(freq, t);
      if (slideToFreq) {
        osc.frequency.exponentialRampToValueAtTime(slideToFreq, t + duration);
      }
      
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(t);
      osc.stop(t + duration);
    } catch (e) {
      // Fail silently
    }
  }

  private static playMallet(freq: number, duration: number, vol = 1) {
    if (!this.unlocked) this.unlock();
    if (!this.ctx || !this.masterGain) return;
    
    try {
      const t = this.ctx.currentTime;
      // Main body (sine for warmth)
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + duration);

      // Attack transient (triangle for "tap")
      const tapOsc = this.ctx.createOscillator();
      tapOsc.type = 'triangle';
      tapOsc.frequency.setValueAtTime(freq * 2.5, t);
      const tapGain = this.ctx.createGain();
      tapGain.gain.setValueAtTime(vol * 0.4, t);
      tapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      tapOsc.connect(tapGain);
      tapGain.connect(this.masterGain);
      tapOsc.start(t);
      tapOsc.stop(t + 0.08);
    } catch (e) {
      // Fail silently
    }
  }

  private static playMatchgridTone(freq: number, duration: number, vol = 1, type: OscillatorType = 'sine') {
    if (!this.unlocked) this.unlock();
    if (!this.ctx || !this.masterGain || !this.delayNode) return;
    
    try {
      const t = this.ctx.currentTime;
      // Main body (sine for warmth)
      const osc = this.ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol * 0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      // Connect to delay line
      gain.connect(this.delayNode);
      
      osc.start(t);
      osc.stop(t + duration);

      // Harmonic resonance (freq * 1.5) a few ms later
      setTimeout(() => {
        if (!this.ctx || !this.masterGain || !this.delayNode) return;
        const tt = this.ctx.currentTime;
        const harmOsc = this.ctx.createOscillator();
        harmOsc.type = 'sine';
        harmOsc.frequency.setValueAtTime(freq * 1.5, tt);
        const harmGain = this.ctx.createGain();
        harmGain.gain.setValueAtTime(vol * 0.12, tt);
        harmGain.gain.exponentialRampToValueAtTime(0.001, tt + duration * 0.8);
        harmOsc.connect(harmGain);
        harmGain.connect(this.masterGain);
        harmGain.connect(this.delayNode);
        harmOsc.start(tt);
        harmOsc.stop(tt + duration * 0.8);
      }, 5);

      // Attack transient (soft triangle)
      const tapOsc = this.ctx.createOscillator();
      tapOsc.type = 'triangle';
      tapOsc.frequency.setValueAtTime(freq * 2.5, t);
      const tapGain = this.ctx.createGain();
      tapGain.gain.setValueAtTime(vol * 0.15, t);
      tapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      tapOsc.connect(tapGain);
      tapGain.connect(this.masterGain);
      tapOsc.start(t);
      tapOsc.stop(t + 0.05);
    } catch (e) {}
  }

  // --- SpeedGrid Sounds ---

  static playTick(soundEnabled: boolean) {
    if (!soundEnabled) return;
    const now = Date.now();
    if (now - this.lastTickTime < 50) return; // rate limit 50ms
    this.lastTickTime = now;
    this.playTone(800, 'sine', 0.05, 0.1);
  }

  static playSuccess(soundEnabled: boolean) {
    if (!soundEnabled) return;
    setTimeout(() => this.playTone(600, 'sine', 0.1, 0.3), 0);
    setTimeout(() => this.playTone(800, 'sine', 0.15, 0.3), 50);
    setTimeout(() => this.playTone(1200, 'sine', 0.3, 0.3), 100);
  }

  static playOvershoot(soundEnabled: boolean) {
    if (!soundEnabled) return;
    this.playTone(200, 'sawtooth', 0.15, 0.2, 100);
  }

  static playTimeReady(soundEnabled: boolean) {
    if (!soundEnabled) return;
    this.playTone(900, 'sine', 0.2, 0.1, 1500);
  }

  static playTimeCollect(soundEnabled: boolean) {
    if (!soundEnabled) return;
    this.playTone(400, 'sine', 0.3, 0.3, 1200);
  }

  static playWildcardVibrate(soundEnabled: boolean, progress: number) {
    if (!soundEnabled) return;
    // Accelerating buzz with upward pitch slide
    const baseFreq = 80 + Math.pow(progress, 3) * 200;
    const duration = 0.05 + progress * 0.05;
    const vol = 0.05 + progress * 0.1;
    this.playTone(baseFreq, 'sawtooth', duration, vol, baseFreq * 1.2);
  }

  static playWildcardPop(soundEnabled: boolean) {
    if (!soundEnabled) return;
    // Single subtle percussion pop
    this.playTone(300, 'sine', 0.1, 0.2, 120);
  }

  // --- CombineGrid Sounds ---

  private static ambientOsc1: OscillatorNode | null = null;
  private static ambientOsc2: OscillatorNode | null = null;
  private static ambientGain: GainNode | null = null;

  private static _combineGridMusicEnabled: boolean = false;

  static setCombineGridMusicEnabled(enabled: boolean) {
    this._combineGridMusicEnabled = enabled;
    if (!enabled) {
      this.stopCombineGridAmbient();
    } else {
      this.startCombineGridAmbient();
    }
  }

  static startCombineGridAmbient() {
    if (!this.unlocked || this.ctx?.state !== 'running') return;
    if (this.ambientGain) return; // Already running

    try {
      const t = this.ctx.currentTime;
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.01, t); // Very low volume

      // Soft ambient pads
      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc1.type = 'sine';
      this.ambientOsc1.frequency.setValueAtTime(261.63, t); // C4

      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientOsc2.type = 'triangle';
      this.ambientOsc2.frequency.setValueAtTime(392.00, t); // G4

      this.ambientOsc1.connect(this.ambientGain);
      this.ambientOsc2.connect(this.ambientGain);

      if (this.masterGain) {
        this.ambientGain.connect(this.masterGain);
      }

      this.ambientOsc1.start(t);
      this.ambientOsc2.start(t);
    } catch (e) {
      // Fail silently
    }
  }

  static stopCombineGridAmbient() {
    if (this.ambientGain && this.ctx) {
      try {
        const t = this.ctx.currentTime;
        this.ambientGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        
        setTimeout(() => {
          if (this.ambientOsc1) {
            this.ambientOsc1.stop();
            this.ambientOsc1.disconnect();
            this.ambientOsc1 = null;
          }
          if (this.ambientOsc2) {
            this.ambientOsc2.stop();
            this.ambientOsc2.disconnect();
            this.ambientOsc2 = null;
          }
          if (this.ambientGain) {
            this.ambientGain.disconnect();
            this.ambientGain = null;
          }
        }, 600);
      } catch (e) {
        // fail silently
      }
    }
  }

  private static bombFuseNodes: OscillatorNode[] = [];

  static stopCombineGridBombFuse() {
    for (const node of this.bombFuseNodes) {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {}
    }
    this.bombFuseNodes = [];
  }

  static playCombineGridTrophy(soundEnabled: boolean) {
    if (!soundEnabled) return;
    try {
      if (!this.ctx || !this.masterGain || !this.unlocked) return;
      this.playTone(200, 'sine', 0.3, 0.3, 100);
      setTimeout(() => this.playMallet(400, 0.1, 0.1), 0);
      setTimeout(() => this.playMallet(500, 0.1, 0.1), 100);
      setTimeout(() => this.playMallet(600, 0.2, 0.15), 200);
    } catch(e) {}
  }

  static playCombineGridMerge(soundEnabled: boolean) {
    if (!soundEnabled) return;
    const now = Date.now();
    if (now - this.lastMergeTime < 80) return;
    this.lastMergeTime = now;

    try {
      if (!this.ctx || !this.masterGain || !this.unlocked) return;
      this.playMallet(500, 0.04, 0.15);
      this.playMallet(600, 0.04, 0.15);
    } catch(e) {}
  }

  static playCombineGridBlocked(soundEnabled: boolean) {
    if (!soundEnabled) return;
    try {
      if (!this.ctx || !this.masterGain || !this.unlocked) return;
      this.playTone(80, 'square', 0.03, 0.15, 60);
      setTimeout(() => this.playTone(60, 'square', 0.04, 0.1), 30);
    } catch(e) {}
  }

  static playCombineGridBlockedCreated(soundEnabled: boolean) {
    if (!soundEnabled) return;
    this.playTone(90, 'sine', 0.15, 0.2, 45);
  }

  static playCombineGridWildcardPop(soundEnabled: boolean) {
    if (!soundEnabled) return;
    try {
      if (!this.ctx || !this.masterGain || !this.unlocked) return;
      this.playMallet(400, 0.05, 0.2);
      setTimeout(() => this.playTone(200, 'triangle', 0.1, 0.2, 600), 40);
    } catch(e) {}
  }

  static playCombineGridBombFuse(soundEnabled: boolean) {
    if (!soundEnabled) return;
    this.stopCombineGridBombFuse(); // clean up any existing
    try {
      if (!this.ctx || !this.masterGain || !this.unlocked) return;
      this.playTone(2000, 'sawtooth', 0.05, 0.05, 3000);
      
      const duration = 1.0; 
      const t = this.ctx.currentTime;
      // Burning wick texture using rapid randomized triangles
      const MAX_FUSE_OSCILLATORS = 8;
      for (let i = 0; i < MAX_FUSE_OSCILLATORS; i++) {
        const timeOffset = Math.random() * duration;
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(4000 + Math.random() * 4000, t + timeOffset);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.02 + Math.random() * 0.03, t + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + timeOffset + 0.03);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t + timeOffset);
        osc.stop(t + timeOffset + 0.03);
        
        this.bombFuseNodes.push(osc);
      }
    } catch(e) {}
  }

  static playCombineGridBombExplosion(soundEnabled: boolean) {
    if (!soundEnabled) return;
    this.stopCombineGridBombFuse(); // MUST stop fuse on explosion
    const now = Date.now();
    if (now - this.lastExplosionTime < 300) return;
    this.lastExplosionTime = now;
    
    try {
      if (this.ctx && this.masterGain && this.unlocked) {
        const t = this.ctx.currentTime;
        // Granite Crack (High frequency snap with immediate low thud)
        const snapOsc = this.ctx.createOscillator(); 
        snapOsc.type = 'square'; 
        snapOsc.frequency.setValueAtTime(150, t); 
        snapOsc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
        
        const snapGain = this.ctx.createGain(); 
        snapGain.gain.setValueAtTime(0.35, t); 
        snapGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        
        snapOsc.connect(snapGain); 
        snapGain.connect(this.masterGain); 
        snapOsc.start(t); 
        snapOsc.stop(t + 0.1);

        // Noise Burst
        const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.3, this.ctx.sampleRate);
        for (let i = 0; i < noiseBuffer.length; i++) {
          noiseBuffer.getChannelData(0)[i] = Math.random() * 2 - 1;
        }
        
        const noiseSrc = this.ctx.createBufferSource(); 
        noiseSrc.buffer = noiseBuffer;
        
        const noiseFilter = this.ctx.createBiquadFilter(); 
        noiseFilter.type = 'lowpass'; 
        noiseFilter.frequency.setValueAtTime(2000, t); 
        noiseFilter.frequency.exponentialRampToValueAtTime(100, t + 0.2);
        
        const noiseGain = this.ctx.createGain(); 
        noiseGain.gain.setValueAtTime(0.2, t); 
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        
        noiseSrc.connect(noiseFilter); 
        noiseFilter.connect(noiseGain); 
        noiseGain.connect(this.masterGain); 
        noiseSrc.start(t);
      }
    } catch (e) {
      this.playTone(45, 'square', 0.15, 0.35); // fallback
    }
  }

  static playCombineGridUndo(soundEnabled: boolean) {
    if (!soundEnabled) return;
    this.stopCombineGridBombFuse(); // MUST stop fuse on undo
    try {
      if (!this.ctx || !this.masterGain || !this.unlocked) return;
      this.playTone(500, 'sine', 0.1, 0.1, 600);
    } catch(e) {}
  }

  static playPickup(soundEnabled: boolean) {
    if (!soundEnabled) return;
    // Light subtle mallet tap
    this.playMallet(600, 0.03, 0.05);
  }

  static playMerge(soundEnabled: boolean) {
    if (!soundEnabled) return;
    const now = Date.now();
    if (now - this.lastMergeTime < 80) return;
    this.lastMergeTime = now;
    // Earthy wooden "thump"
    this.playTone(180, 'sine', 0.12, 0.2, 80);
    this.playMallet(300, 0.05, 0.15);
  }

  static playBlocked(soundEnabled: boolean) {
    if (!soundEnabled) return;
    // Soft wooden tap
    this.playMallet(150, 0.06, 0.2);
  }

  static playBlockedCreated(soundEnabled: boolean) {
    if (!soundEnabled) return;
    // Muffled wooden thump
    this.playTone(80, 'sine', 0.15, 0.35, 40);
  }

  static playTrophy(soundEnabled: boolean) {
    if (!soundEnabled) return;
    // Low, warm wooden drum thump
    this.playTone(160, 'sine', 0.25, 0.5, 60);
    // Subtle acoustic chime-like harmonic
    this.playMallet(660, 0.05, 0.25);
  }

  static playArmedTick(soundEnabled: boolean) {
    if (!soundEnabled) return;
    // A crisp warning tick / ignition
    this.playTone(1500, 'square', 0.05, 0.1, 3000);
    this.playFuse(soundEnabled);
  }

  private static playFuse(soundEnabled: boolean) {
    if (!this.ctx || !this.masterGain || !this.unlocked) return;
    if (this.ctx.state === 'suspended') return;
    try {
      const duration = 1.0; 
      const t = this.ctx.currentTime;
      // Burning wick texture using rapid randomized triangles
      const MAX_FUSE_OSCILLATORS = 8;
      for (let i = 0; i < MAX_FUSE_OSCILLATORS; i++) {
        const timeOffset = Math.random() * duration;
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(4000 + Math.random() * 4000, t + timeOffset);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.02 + Math.random() * 0.03, t + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + timeOffset + 0.03);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t + timeOffset);
        osc.stop(t + timeOffset + 0.03);
      }
    } catch (e) {
      // Fail silently
    }
  }

  static playExplosion(soundEnabled: boolean) {
    if (!soundEnabled) return;
    const now = Date.now();
    if (now - this.lastExplosionTime < 300) return;
    this.lastExplosionTime = now;
    // Muffled deep thump
    this.playTone(100, 'sine', 0.3, 0.4, 30);
  }

  static playUndo(soundEnabled: boolean) {
    if (!soundEnabled) return;
    // Soft acoustic pluck / mallet
    this.playMallet(400, 0.1, 0.15);
  }

  static playEndgameCountTick(soundEnabled: boolean, index: number = 0) {
    if (!soundEnabled) return;
    try {
      if (!this.ctx || !this.masterGain || !this.unlocked) return;
      const f = [392.00, 440.00, 493.88, 587.33, 659.25][index % 5];
      this.playMallet(f, 0.08, 0.15);
    } catch(e) {}
  }

  static playEndgame(soundEnabled: boolean) {
    if (!soundEnabled) return;
    try {
      if (!this.ctx || !this.masterGain || !this.unlocked) return;
      setTimeout(() => this.playMallet(800, 0.05, 0.2), 0);
      setTimeout(() => this.playMallet(800, 0.05, 0.1), 100);
      setTimeout(() => this.playMallet(800, 0.05, 0.05), 200);
      setTimeout(() => this.playMallet(800, 0.05, 0.02), 300);
    } catch(e) {}
  }

  static playSubtleTap(soundEnabled: boolean) {
    if (!soundEnabled) return;
    // Tactile tap - triangle for better definition at low volume
    this.playTone(440, 'triangle', 0.04, 0.15);
  }

  static playButtonTap(soundEnabled: boolean) {
    if (!soundEnabled) return;
    // Standard UI tap (preserved for SpeedGrid)
    this.playTone(600, 'sine', 0.05, 0.12);
  }

  // --- Math Magic Sounds ---

  static playMathMagicPickup(soundEnabled: boolean) {
    if (!soundEnabled) return;
    // High crisp airy wood clack
    this.playMatchgridTone(880, 0.1, 0.15, 'triangle');
  }

  static playMathMagicSwap(soundEnabled: boolean) {
    if (!soundEnabled) return;
    // Mid-tone "thock"
    this.playMatchgridTone(440, 0.15, 0.2);
  }

  static playMathMagicSuccess(soundEnabled: boolean, pitchIndex: number = 0) {
    if (!soundEnabled) return;
    try {
      if (!this.ctx || !this.masterGain || !this.unlocked) return;
      // Extended C Major Pentatonic Scale
      const PENTA = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 784.00, 880.00, 1046.50];
      const freq = PENTA[Math.max(0, Math.min(pitchIndex, PENTA.length - 1))];
      // Whimsical marimba-like strike
      this.playMatchgridTone(freq, 0.2, 0.25);
    } catch(e) {}
  }

  static playMathMagicError(soundEnabled: boolean) {
    if (!soundEnabled) return;
    try {
      if (!this.ctx || !this.masterGain || !this.unlocked) return;
      // Muted low double clonk
      this.playMatchgridTone(130, 0.2, 0.2);
      setTimeout(() => this.playMatchgridTone(98, 0.25, 0.15), 80);
    } catch(e) {}
  }

  static playMatchgridButtonClick(soundEnabled: boolean) {
    if (!soundEnabled) return;
    this.playMatchgridTone(220, 0.05, 0.08, 'triangle');
  }

  static playMatchgridModalOpen(soundEnabled: boolean) {
    if (!soundEnabled) return;
    this.playMatchgridTone(329.63, 0.15, 0.11); // E4
    setTimeout(() => this.playMatchgridTone(440.00, 0.2, 0.11), 60); // A4
  }

  static playMathMagicVictory(soundEnabled: boolean) {
    if (!soundEnabled) return;
    try {
      if (!this.ctx || !this.masterGain || !this.unlocked) return;
      const PENTA = [392.00, 523.25, 659.25, 784.00, 1046.50, 1318.51, 1567.98];
      PENTA.forEach((freq, idx) => {
        setTimeout(() => {
          this.playMatchgridTone(freq, 0.4, 0.3 - (idx * 0.03));
        }, idx * 100);
      });
    } catch(e) {}
  }

  static playMatchgridModalClose(soundEnabled: boolean) {
    if (!soundEnabled) return;
    this.playMatchgridTone(440.00, 0.15, 0.08); // A4
    setTimeout(() => this.playMatchgridTone(329.63, 0.2, 0.08), 60); // E4
  }

  static playMatchgridRefresh(soundEnabled: boolean) {
    if (!soundEnabled) return;
    this.playMatchgridTone(261.63, 0.1, 0.15); // C4
    setTimeout(() => this.playMatchgridTone(329.63, 0.1, 0.15), 50); // E4
    setTimeout(() => this.playMatchgridTone(392.00, 0.15, 0.15), 100); // G4
  }

  static getDebugState() {
    return {
      unlocked: this.unlocked,
      ctxState: this.ctx?.state || 'null',
      hasCtx: !!this.ctx,
      hasMasterGain: !!this.masterGain,
      currentTime: this.ctx?.currentTime || 0,
    };
  }
}
────────────────────────────────────────────────────────────────────────────────
