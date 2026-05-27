────────────────────────────────────────────────────────────────────────────────
import { MathMagicMode, MathMagicTile } from './types';

/**
 * Pure functions governing the game rules of Math Magic.
 */
export const MathMagicRules = {
  getModeBannerText(mode: MathMagicMode): string {
    switch (mode) {
      case MathMagicMode.DRAG_DROP: return 'Look at the Target Number. Drag the matching tile from your tray to the exact spot on the board where its two factors meet.';
      case MathMagicMode.RANDOMIZED_GRID: return 'The rules are the same, but the numbers on the top and left edges have been shuffled! Pay close attention to the rows and columns to find the right spot.';
      case MathMagicMode.TRUE_FALSE: return 'Tap any grid space to reveal a math problem. Read carefully, then decide if the math is True or False!';
      case MathMagicMode.MULTIPLE_CHOICE: return 'Tap any empty grid space to reveal a math problem, then choose the correct answer from the four options.';
      case MathMagicMode.REPLACE: return 'Tap a grid space to reveal an incomplete equation. Use the keypad to type the exact missing number.';
      case MathMagicMode.KEYPAD: return 'Tap a grid space to reveal an incomplete equation. Use the keypad to type the exact missing number.';
      case MathMagicMode.REVERSE_SEEK: return 'The Target gives you the answer! Tap the grid space that multiplies together to make that exact number.';
      case MathMagicMode.MULTIPLICATION_FINDER: return 'The grid is fully revealed! Look at the equation at the top, solve it in your head, and tap the correct answer on the board.';
      case MathMagicMode.ADDITION_FINDER: return 'Solve the addition problem at the top, then find that number\'s spot on the multiplication board!';
      case MathMagicMode.PATTERN_SWEEPER: return 'Tap tiles on the board that match the active pattern condition shown at the top. Sweep the grid and find them all!';
      default: return 'Loading…';
    }
  },

  getModeColor(mode: MathMagicMode, hx: number, hy: number): string {
    switch (mode) {
      case MathMagicMode.DRAG_DROP: return `hsl(${188 + ((hx * 6 + hy * 4) % 22)},38%,${82 + (hx + hy) % 5}%)`;
      case MathMagicMode.RANDOMIZED_GRID: {
        const h = [5, 145, 240, 25, 160, 275, 35, 190];
        return `hsl(${h[(hx * 3 + hy * 7) % h.length]},32%,83%)`;
      }
      case MathMagicMode.TRUE_FALSE: return (hx + hy) % 2 === 0 ? 'hsl(22,40%,84%)' : 'hsl(238,28%,84%)';
      case MathMagicMode.MULTIPLE_CHOICE: return `hsl(${142 + ((hx * 7 + hy * 5) % 22)},28%,${82 + (hx + hy) % 4}%)`;
      case MathMagicMode.REPLACE: return `hsl(${262 + ((hx * 8 + hy * 6) % 22)},26%,83%)`;
      case MathMagicMode.KEYPAD: return `hsl(${14 + ((hx * 7 + hy * 5) % 18)},38%,84%)`;
      case MathMagicMode.REVERSE_SEEK: return `hsl(${45 + ((hx * 5 + hy * 7) % 20)}, 35%, 82%)`;
      case MathMagicMode.MULTIPLICATION_FINDER: return `hsl(${200 + ((hx * 5 + hy * 7) % 20)}, 35%, 82%)`;
      case MathMagicMode.ADDITION_FINDER: return `hsl(${10 + ((hx * 5 + hy * 7) % 20)}, 35%, 82%)`;
      case MathMagicMode.PATTERN_SWEEPER: return `hsl(${280 + ((hx * 5 + hy * 7) % 20)}, 35%, 82%)`;
      default: return '#ccc';
    }
  },

  /**
   * Parses raw factor string into an array of integers.
   */
  parseFactors(raw: string): number[] {
    if (!raw || !raw.trim()) return [1, 2, 3, 4, 5];
    const s = raw.trim();
    if (s.includes('-') && !s.includes(',')) {
      const p = s.split('-').map(v => parseInt(v.trim(), 10));
      if (p.length === 2 && !isNaN(p[0]) && !isNaN(p[1]) && p[1] >= p[0]) {
        return Array.from({ length: p[1] - p[0] + 1 }, (_, i) => p[0] + i);
      }
    }
    const list = s.split(',').map(v => parseInt(v.trim(), 10)).filter(n => !isNaN(n) && n > 0);
    return list.length > 0 ? list : [1, 2, 3, 4, 5];
  },

  /**
   * Evaluates if two tiles or a target payload successfully match based on pedagogical rules.
   */
  evaluateMatch(sourceProduct: number, targetFactors: [number, number]): boolean {
    const [f1, f2] = targetFactors;
    return sourceProduct === (f1 * f2);
  },

  /**
   * Calculates score incrementally.
   */
  calculateScore(currentScore: number, isCorrect: boolean): number {
    return isCorrect ? currentScore + 10 : currentScore; // Basic placeholder rules
  },

  /**
   * Translates client viewport coordinates to logical tile coordinates via mathematical projection.
   */
  resolveDrop(gridRect: DOMRect, cx: number, cy: number, cols: number, rows: number, gridEl: HTMLElement) {
    const gsty = getComputedStyle(gridEl);
    const tsz = parseInt(gsty.getPropertyValue('--tile-size'));
    const gap = parseInt(gsty.getPropertyValue('--gap'));
    const hdr = parseInt(gsty.getPropertyValue('--hdr-size'));
    const padL = parseFloat(gsty.paddingLeft) || parseInt(gsty.getPropertyValue('--gpad').split(' ')[1]) || 10;
    const padT = parseFloat(gsty.paddingTop) || parseInt(gsty.getPropertyValue('--gpad').split(' ')[0]) || 10;
    
    const stride = tsz + gap;
    // The hit boundary extends exactly halfway to the next tile. 
    // No dead zones, no overlapping hitboxes.
    const snap = stride / 2.0;
    const ox = gridRect.left + padL + hdr + gap;
    const oy = gridRect.top + padT + hdr + gap;
    
    for(let tr=0; tr<rows; tr++) {
      for(let tc=0; tc<cols; tc++) {
        const ccx = ox + tc * stride + tsz / 2;
        const ccy = oy + tr * stride + tsz / 2;
        if (Math.abs(cx - ccx) < snap && Math.abs(cy - ccy) < snap) {
           return { x: tc, y: tr };
        }
      }
    }
    return null;
  },

  getCellRect(gridEl: HTMLElement, cx: number, cy: number): DOMRect | null {
     if (!gridEl) return null;
     const gridRect = gridEl.getBoundingClientRect();
     const gsty = getComputedStyle(gridEl);
     const tsz = parseInt(gsty.getPropertyValue('--tile-size')) || 64;
     const gap = parseInt(gsty.getPropertyValue('--gap')) || 7;
     const hdr = parseInt(gsty.getPropertyValue('--hdr-size')) || 32;
     const padL = parseFloat(gsty.paddingLeft) || parseInt(gsty.getPropertyValue('--gpad').split(' ')[1]) || 10;
     const padT = parseFloat(gsty.paddingTop) || parseInt(gsty.getPropertyValue('--gpad').split(' ')[0]) || 10;
     
     const cellX = gridRect.left + padL + hdr + gap + cx * (tsz + gap);
     const cellY = gridRect.top + padT + hdr + gap + cy * (tsz + gap);
     
     return {
        left: cellX, top: cellY,
        right: cellX + tsz, bottom: cellY + tsz,
        width: tsz, height: tsz,
        x: cellX, y: cellY,
        toJSON: () => {}
     } as DOMRect;
  }
};
────────────────────────────────────────────────────────────────────────────────
