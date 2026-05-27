────────────────────────────────────────────────────────────────────────────────
export interface PlayerStats {
  mode: string;
  quadrant: string;
  bestTime: number;
  maxCombo: number;
}

export interface GlobalStorage {
  stats: Record<string, PlayerStats>;
  starsEarned: number;
}

export const StorageService = {
  getData: (): GlobalStorage => {
    try {
      const data = localStorage.getItem('matchgrid_global_v2');
      if (data) {
         return JSON.parse(data);
      }
    } catch {}
    return { stats: {}, starsEarned: 0 };
  },

  saveData: (data: GlobalStorage) => {
    try {
      localStorage.setItem('matchgrid_global_v2', JSON.stringify(data));
    } catch {}
  },

  getStats: (mode: string, quadrant: string = 'all'): PlayerStats => {
    const data = StorageService.getData();
    const key = `${mode}_${quadrant}`;
    return data.stats[key] || { mode, quadrant, bestTime: Infinity, maxCombo: 0 };
  },

  saveSession: (
    mode: string,
    quadrant: string = 'all',
    timeMs: number,
    sessionMaxCombo: number
  ) => {
    const data = StorageService.getData();
    const key = `${mode}_${quadrant}`;
    const current = data.stats[key] || { mode, quadrant, bestTime: Infinity, maxCombo: 0 };
    
    let timeBroken = false;
    let newMaxCombo = false;

    if (timeMs > 0 && timeMs < current.bestTime) {
      current.bestTime = timeMs;
      timeBroken = true;
    }

    if (sessionMaxCombo > current.maxCombo) {
      current.maxCombo = sessionMaxCombo;
      newMaxCombo = true;
    }

    data.stats[key] = current;
    
    // Calculate stars
    let earnedStars = 1; // Base clear
    let pbTimeStars = 0;
    let comboStars = 0;

    if (timeBroken) {
      pbTimeStars = 2; // New Personal Best Time
    }
    
    if (sessionMaxCombo >= 10) {
      comboStars = 2; // Reaching a 10-hit Max Combo
    }

    const totalEarned = earnedStars + pbTimeStars + comboStars;
    data.starsEarned += totalEarned;

    StorageService.saveData(data);

    return { 
      timeBroken, 
      newMaxCombo, 
      earnedStars: totalEarned,
      breakdown: { base: earnedStars, time: pbTimeStars, combo: comboStars },
      totalStars: data.starsEarned
    };
  }
};
────────────────────────────────────────────────────────────────────────────────
