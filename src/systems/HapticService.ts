────────────────────────────────────────────────────────────────────────────────
export class HapticService {
  static trigger(hapticsEnabled: boolean, pattern: number | number[]) {
    if (!hapticsEnabled) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // fail silently
      }
    }
  }

  // --- SpeedGrid ---
  static playSuccess(enabled: boolean) {
    this.trigger(enabled, 10); // Light tap
  }
  static playOvershoot(enabled: boolean) {
    this.trigger(enabled, [30, 50, 30]); // Warning pulse
  }
  static playTimeCollect(enabled: boolean) {
    this.trigger(enabled, [20, 30, 20]); // Reward pulse
  }

  static playWildcardVibrate(enabled: boolean, progress: number) {
    if (progress > 0.5) this.trigger(enabled, 5);
  }
  static playWildcardPop(enabled: boolean) {
    this.trigger(enabled, [30, 20, 50]); // Bonk pop
  }

  // --- CombineGrid ---
  static playPickup(enabled: boolean) {
    this.trigger(enabled, 5); // Very light tick
  }

  static playMerge(enabled: boolean) {
    this.trigger(enabled, 5); // Light tap
  }
  static playBlocked(enabled: boolean) {
    this.trigger(enabled, [10, 5, 10]); // Subtle rejection tick
  }
  static playBlockedCreated(enabled: boolean) {
    this.trigger(enabled, [20, 30, 20]); // Heavy double thud
  }
  static playTrophy(enabled: boolean) {
    this.trigger(enabled, [15, 30, 20]); // Reward pulse
  }
  static playArmedTick(enabled: boolean) {
    this.trigger(enabled, 5); // Tiny tick
  }
  static playExplosion(enabled: boolean) {
    this.trigger(enabled, [40, 20, 60]); // Strong short pulse
  }
  static playUndo(enabled: boolean) {
    this.trigger(enabled, 15); // Soft pulse
  }
  static playEndgame(enabled: boolean) {
    this.trigger(enabled, [30, 40, 50]); // Reward pulse
  }

  // --- MathMagic ---
  static playMatchGridCorrectFast(enabled: boolean) {
    this.trigger(enabled, 15);
  }
  static playMatchGridCorrectSlow(enabled: boolean) {
    this.trigger(enabled, 25);
  }
  static playMatchGridWrong(enabled: boolean) {
    this.trigger(enabled, [50, 100, 50]);
  }
  static playMatchGridComboClimax(enabled: boolean) {
    this.trigger(enabled, [30, 50, 30, 50, 100]);
  }
}
────────────────────────────────────────────────────────────────────────────────
