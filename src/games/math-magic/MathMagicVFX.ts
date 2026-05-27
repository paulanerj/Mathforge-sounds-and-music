────────────────────────────────────────────────────────────────────────────────
import { MathMagicTile } from "./types";

export const MathMagicVFX = {
  createSparkles(rect: DOMRect, color: string, particleCount: number = 20, theme?: string) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    if (theme === 'deep-sea') {
      const count = Math.floor(Math.random() * 2) + 3; // 3 to 4 bubbles
      for (let i = 0; i < count; i++) {
        const bubble = document.createElement('div');
        const size = Math.random() * 12 + 10; // 10px to 22px
        const startLeft = cx - size / 2;
        const startTop = cy - size / 2;

        bubble.style.cssText = `
          position: fixed;
          pointer-events: none;
          z-index: 52;
          width: ${size}px;
          height: ${size}px;
          border: 1.5px solid rgba(255, 255, 255, 0.7) !important;
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.45) 0%, rgba(34, 211, 238, 0.18) 45%, rgba(13, 148, 136, 0.05) 80%) !important;
          box-shadow: inset -2px -2px 5px rgba(13, 148, 136, 0.25), 0 0 8px rgba(34, 211, 238, 0.35) !important;
          border-radius: 50% !important;
          left: ${startLeft}px;
          top: ${startTop}px;
          opacity: 0.95;
          transform: translate3d(0, 0, 0);
        `;
        document.body.appendChild(bubble);

        const duration = Math.random() * 600 + 1000; // 1.0s to 1.6s
        const startTime = performance.now();
        const amplitude = Math.random() * 15 + 10; // frequency wobble
        const speedY = Math.random() * 0.12 + 0.08;
        const waveFrequency = Math.random() * 0.01 + 0.005;

        const floatBubble = (now: number) => {
          const elapsed = now - startTime;
          if (elapsed >= duration) {
            bubble.remove();
            return;
          }

          const progress = elapsed / duration;
          const currentY = -elapsed * speedY;
          const currentX = Math.sin(elapsed * waveFrequency) * amplitude;
          
          bubble.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(${1 - progress * 0.25})`;
          bubble.style.opacity = (0.95 * (1 - progress)).toString();

          requestAnimationFrame(floatBubble);
        };

        requestAnimationFrame(floatBubble);
      }
      return;
    }

    if (theme === 'celestial-orbit') {
      const ring = document.createElement('div');
      ring.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 50;
        width: 40px;
        height: 40px;
        border: 4px solid #38bdf8;
        border-radius: 50%;
        left: ${cx}px;
        top: ${cy}px;
        transform: translate(-50%, -50%) scale(0.5);
        transition: transform 0.6s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 0.6s ease-out, border-color 0.6s;
        opacity: 1;
        box-shadow: 0 0 15px #38bdf8, inset 0 0 15px #c084fc;
      `;
      document.body.appendChild(ring);
      requestAnimationFrame(() => {
        ring.style.transform = 'translate(-50%, -50%) scale(4.5)';
        ring.style.opacity = '0';
        ring.style.borderColor = '#c084fc';
      });
      setTimeout(() => ring.remove(), 700);

      const pool = ['#38bdf8', '#fbbf24', '#c084fc', '#ffffff', '#6366f1'];
      for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        const r = Math.random();
        
        const isStar = r < 0.45;
        const isPlanetaryDisk = r >= 0.45 && r < 0.75;
        
        const sz = Math.random() * 16 + 8;
        const c = pool[Math.floor(Math.random() * pool.length)];
        
        p.style.cssText = `
          position: fixed;
          pointer-events: none;
          z-index: 52;
          width: ${sz}px;
          height: ${sz}px;
          left: ${cx}px;
          top: ${cy}px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translate(-50%, -50%) scale(0.4);
          opacity: 1;
          transition: transform 0.85s cubic-bezier(0.1, 0.82, 0.25, 1), opacity 0.85s ease-out;
        `;
        
        if (isStar) {
          p.innerHTML = `<span style="color: ${c}; font-size: ${sz}px; font-weight: bold; line-height: 1; text-shadow: 0 0 8px ${c};">✦</span>`;
        } else if (isPlanetaryDisk) {
          p.innerHTML = `
            <svg width="${sz}" height="${sz}" viewBox="0 0 30 30" style="filter: drop-shadow(0 0 6px ${c}); animate: spin 10s linear infinite;">
              <circle cx="15" cy="15" r="5" fill="${c}" />
              <ellipse cx="15" cy="15" rx="14" ry="3" fill="none" stroke="${c}" stroke-width="1.5" transform="rotate(-15 15 15)" />
            </svg>
          `;
        } else {
          p.style.background = c;
          p.style.borderRadius = '50%';
          p.style.boxShadow = `0 0 10px ${c}`;
        }
        
        document.body.appendChild(p);
        
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * 140 + 40;
        void p.offsetWidth;
        
        p.style.transform = `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) rotate(${Math.random() * 360}deg) scale(1.3)`;
        p.style.opacity = '0';
        
        setTimeout(() => p.remove(), 950);
      }
      return;
    }

    if (theme === 'kuromi') {
      const pool = ['#ec4899', '#7e22ce', '#a855f7', '#FFFFFF', '#111111'];
      for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        const r = Math.random();
        
        // Vary the shapes: jester hats, thorny hearts, neon sparks
        const isJester = r < 0.25;
        const isThorny = r >= 0.25 && r < 0.55;
        const isSpark = r >= 0.55 && r < 0.75;
        
        const sz = Math.random() * 12 + 8;
        const c = pool[Math.floor(Math.random() * pool.length)];
        
        p.style.cssText = `
          position: fixed;
          pointer-events: none;
          z-index: 52;
          width: ${sz}px;
          height: ${sz}px;
          left: ${cx}px;
          top: ${cy}px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translate(-50%, -50%) scale(0.6);
          opacity: 1;
          transition: transform 0.8s cubic-bezier(0.15, 0.85, 0.35, 1), opacity 0.8s ease-out;
        `;
        
        if (isJester) {
          p.innerHTML = `
            <svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C13 4.5 16 5 18 4C17 6.5 15 9 12 10C9 9 7 6.5 6 4C8 5 11 4.5 12 2Z" fill="#111111"/>
              <circle cx="12" cy="1" r="1.2" fill="#ec4899"/>
              <circle cx="19" cy="3" r="1.2" fill="#ec4899"/>
              <circle cx="5" cy="3" r="1.2" fill="#ec4899"/>
              <path d="M5 12C5 12 12 6 19 12C16 16 8 16 5 12Z" fill="#111111"/>
              <circle cx="12" cy="11" r="1.8" fill="#ec4899"/>
            </svg>
          `;
        } else if (isThorny) {
          p.innerHTML = `
            <svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#ec4899"/>
              <path d="M3 6l3 2M21 6l-3 2M2 11l4 0M22 11l-4 0" stroke="#111111" stroke-width="2"/>
            </svg>
          `;
        } else if (isSpark) {
          p.innerHTML = `<span style="color: ${c}; font-size: ${sz}px; line-height: 1; text-shadow: 0 0 4px #ec4899;">✦</span>`;
        } else {
          p.style.background = c;
          p.style.borderRadius = '0px';
          p.style.border = '1px solid #ec4899';
        }
        
        document.body.appendChild(p);
        
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * 90 + 30;
        void p.offsetWidth;
        
        p.style.transform = `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) rotate(${Math.random() * 360}deg) scale(1.2)`;
        p.style.opacity = '0';
        
        setTimeout(() => p.remove(), 900);
      }
      return;
    }

    if (theme === 'cinnamoroll') {
      // Create soft outward ring pulse
      const ring = document.createElement('div');
      ring.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 50;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 3px solid #BAD9EA;
        border-radius: 50%;
        left: ${cx}px;
        top: ${cy}px;
        transform: translate(-50%, -50%) scale(1);
        transition: transform 0.6s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 0.6s ease-out;
        opacity: 0.8;
      `;
      document.body.appendChild(ring);
      requestAnimationFrame(() => {
        ring.style.transform = 'translate(-50%, -50%) scale(1.8)';
        ring.style.opacity = '0';
      });
      setTimeout(() => ring.remove(), 700);

      const pool = ['#FFFFFF', '#CFEFFF', '#BAD9EA', '#F7C7D9', '#F6E7D4'];

      for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        const r = Math.random();

        // Vary the shapes: clouds, stars, spirals
        const isCloud = r < 0.25;
        const isStar = r >= 0.25 && r < 0.55;
        const isSpiral = r >= 0.55 && r < 0.75;

        const sz = Math.random() * 14 + 6;
        const c = pool[Math.floor(Math.random() * pool.length)];

        p.style.cssText = `
          position: fixed;
          pointer-events: none;
          z-index: 52;
          width: ${sz}px;
          height: ${sz}px;
          left: ${cx}px;
          top: ${cy}px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translate(-50%, -50%) scale(0.6);
          opacity: 1;
          transition: transform 1.2s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 1.2s ease-out;
        `;

        if (isCloud) {
          p.style.background = c;
          p.style.borderRadius = '50%';
          p.style.filter = 'blur(1px)';
        } else if (isStar) {
          p.innerHTML = `<span style="color: ${c}; font-size: ${sz}px; line-height: 1;">✦</span>`;
        } else if (isSpiral) {
          p.innerHTML = `<span style="color: ${c}; font-size: ${sz * 0.9}px; line-height: 1; font-weight: 900;">🌀</span>`;
        } else {
          p.style.background = c;
          p.style.borderRadius = '50%';
        }

        document.body.appendChild(p);

        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * 110 + 40;
        void p.offsetWidth; // force reflow

        p.style.transform = `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) rotate(${Math.random() * 360}deg) scale(1.15)`;
        p.style.opacity = '0';

        setTimeout(() => p.remove(), 1300);
      }
      return;
    }

    const pool = ['#eac1be', '#a8a6cf', '#8ec5ae', '#d4c5a0', '#c4b5d8', '#a8c9bc', '#d4a853', '#b8d4c4', '#e0c4b0', '#9eb8c8'];

    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      const sz = Math.random() * 11 + 4;
      const c = pool[Math.floor(Math.random() * pool.length)];
      const circ = Math.random() > 0.3;
      
      p.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 50;
        width: ${sz}px;
        height: ${sz}px;
        background: ${c};
        left: ${cx}px;
        top: ${cy}px;
        border-radius: ${circ ? '50%' : '3px'};
        transform: translate(-50%, -50%);
        transition: transform 1.0s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.0s ease-out;
      `;
      document.body.appendChild(p);

      const ang = Math.random() * Math.PI * 2;
      const dist = Math.random() * 90 + 30;
      void p.offsetWidth; // forces reflow

      p.style.transform = `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) rotate(${Math.random() * 400}deg)`;
      p.style.opacity = '0';
      
      setTimeout(() => p.remove(), 1100);
    }
  },

  equationToast(sourceRect: DOMRect, targetRect: DOMRect | null, f1: number, f2: number, val: number) {
    if (!targetRect) return; // If active bar is missing

    const pill = document.createElement('div');
    pill.style.cssText = `
      position: fixed;
      z-index: 50;
      pointer-events: none;
      background: #fefbf0;
      border: 1px solid #e6dbb8;
      border-radius: 20px;
      padding: 5px 14px;
      color: #3d2b1f;
      font-weight: 900;
      font-size: 0.95rem;
      box-shadow: 0 8px 24px rgba(61, 43, 31, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
    `;
    pill.innerHTML = `${f1} × ${f2} = <span style="color:#d4a853;margin-left:4px;">${val}</span>`;
    document.body.appendChild(pill);

    const startX = sourceRect.left + sourceRect.width / 2;
    const startY = sourceRect.top + sourceRect.height / 2;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const endX = targetRect.right - 20; 
    const endY = targetRect.top + targetRect.height / 2;

    pill.style.left = `${startX}px`;
    pill.style.top = `${startY}px`;
    pill.style.transform = `translate(-50%, -50%) scale(0.5)`;
    pill.style.opacity = '0';

    requestAnimationFrame(() => {
      pill.style.transition = 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), opacity 0.15s';
      pill.style.transform = `translate(-50%, -50%) scale(1.1)`;
      pill.style.opacity = '1';

      setTimeout(() => {
        pill.style.transition = 'left 0.3s ease-in-out, top 0.3s ease-in-out, transform 0.3s ease-in-out';
        pill.style.left = `${centerX}px`;
        pill.style.top = `${centerY}px`;
        pill.style.transform = `translate(-50%, -50%) scale(2.0)`;

        setTimeout(() => {
          pill.style.transition = 'transform 0.2s ease-in-out';
          pill.style.transform = `translate(-50%, -50%) scale(1)`;

          setTimeout(() => {
            pill.style.transition = 'left 0.3s ease-in-out, top 0.3s ease-in-out, opacity 0.2s ease-in';
            pill.style.left = `${endX}px`;
            pill.style.top = `${endY}px`;
            pill.style.transform = `translate(-100%, -50%) scale(1)`; 
            pill.style.opacity = '0';

            setTimeout(() => {
              pill.remove();
              const finalPill = document.getElementById('last-eq-pill');
              if (finalPill) {
                finalPill.innerHTML = `${f1} × ${f2} = <span style="color:#d4a853;margin-left:4px;">${val}</span>`;
                finalPill.style.opacity = "1";
                // Flash effect
                finalPill.style.transform = 'scale(1.15)';
                finalPill.style.boxShadow = '0 0 20px #d4a853';
                setTimeout(() => {
                  finalPill.style.transform = 'scale(1)';
                  finalPill.style.boxShadow = 'none';
                }, 200);
              }
            }, 300);
          }, 250);
        }, 600);
      }, 250);
    });
  },



  launchGlitchWaveVFX() {
    const board = document.querySelector('.math-magic-grid') || document.querySelector('.grid') || document.querySelector('.mathmagic-board-grid');
    if (!board) return;

    // 1. Create a catastrophic overlay of Digital Snow / Noise
    const noiseContainer = document.createElement('div');
    noiseContainer.className = 'absolute inset-0 z-50 flex flex-wrap overflow-hidden pointer-events-none transition-all duration-300';
    noiseContainer.style.cssText = `
      position: absolute;
      inset: 0;
      background: #000000;
      z-index: 50;
      display: flex;
      flex-wrap: wrap;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    `;
    
    // Fill the container with randomized neon/white blocks of ASCII and glitch symbols
    const numBlocks = 64;
    for (let i = 0; i < numBlocks; i++) {
      const block = document.createElement('div');
      block.style.cssText = `
        width: 12.5%;
        height: 12.5%;
        background-color: #000000;
        color: #00ff00;
        font-family: monospace;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border: 0.5px solid rgba(0,255,0,0.15);
        opacity: 0.9;
        font-weight: 950;
      `;
      noiseContainer.appendChild(block);
    }
    board.appendChild(noiseContainer);

    // Dynamic generator of digital snow
    const glitchChars = ['▒', '░', '▓', '█', '0', '1', '[ERR]', '$$', '#', '!', '?', '@', 'X', 'Y', 'Z'];
    const glitchColors = ['#00ff00', '#ff00ff', '#00ffff', '#ffffff', '#141414'];
    const snowInterval = setInterval(() => {
      Array.from(noiseContainer.children).forEach((child) => {
        const c = child as HTMLElement;
        if (Math.random() > 0.4) {
          c.innerText = glitchChars[Math.floor(Math.random() * glitchChars.length)];
          c.style.color = glitchColors[Math.floor(Math.random() * glitchColors.length)];
          c.style.backgroundColor = Math.random() > 0.8 ? '#000000 font-black' : 'rgba(0,0,0,0.92)';
        }
      });
    }, 45);

    // 2. Play critical scramble to tiles
    const tiles = Array.from(board.querySelectorAll('.tile')) as HTMLElement[];
    const originalStates = tiles.map(tile => ({
      tile,
      transform: tile.style.transform,
      opacity: tile.style.opacity,
      filter: tile.style.filter,
      clipPath: tile.style.clipPath
    }));

    // Fade noise in rapidly after 100ms
    setTimeout(() => {
      noiseContainer.style.opacity = '0.9';
    }, 100);

    let frame = 0;
    const scrambleInterval = setInterval(() => {
      frame++;
      
      // Scramble tiles vertically and apply vertical clip paths to look like pixel sorting / slices
      tiles.forEach((tile) => {
        const offset = (Math.random() - 0.5) * 450; // Mass scramble vertically!
        const scaleX = Math.random() * 0.4 + 0.8;
        const scaleY = Math.random() * 2.2 + 0.5; // pixel stretch!
        
        // Slices clip path to simulate horizontal scanning / fragment sorting
        const topSlice = Math.floor(Math.random() * 80);
        const bottomSlice = topSlice + Math.floor(Math.random() * 20) + 5;
        
        tile.style.transform = `translateY(${offset}px) scaleX(${scaleX}) scaleY(${scaleY})`;
        tile.style.clipPath = `polygon(0% ${topSlice}%, 100% ${topSlice}%, 100% ${bottomSlice}%, 0% ${bottomSlice}%)`;
        tile.style.filter = `contrast(5) brightness(3) hue-rotate(${Math.random() * 360}deg) invert(${Math.random() > 0.95 ? 1 : 0})`;
        tile.style.opacity = (Math.random() * 0.75 + 0.25).toString();
      });

      if (frame > 12) { // 12 * 70ms = ~840ms
        clearInterval(scrambleInterval);
        clearInterval(snowInterval);

        // Turn down noiseContainer
        noiseContainer.style.opacity = '0';
        
        // Restore everything elegantly
        originalStates.forEach(({ tile, transform, opacity, filter, clipPath }) => {
          tile.style.transform = transform;
          tile.style.opacity = opacity;
          tile.style.filter = filter;
          tile.style.clipPath = clipPath;
        });

        setTimeout(() => {
          noiseContainer.remove();
        }, 250);
      }
    }, 70);
  },

  launchDeepSeaVFX() {
    // 1. Brief teal background flash
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      inset: 0;
      background: radial-gradient(circle, rgba(13, 148, 136, 0.95) 0%, rgba(3, 7, 18, 0.98) 100%) !important;
      z-index: 1400;
      pointer-events: none;
      opacity: 1;
      mix-blend-mode: color-dodge;
      transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) !important;
    `;
    document.body.appendChild(flash);
    setTimeout(() => {
      flash.style.opacity = '0';
      setTimeout(() => flash.remove(), 850);
    }, 100);

    // 2. Rising flurry of bubbles and bioluminescent particles (neon greens and blues) sweeping upward
    const totalCount = 90;
    const bodyWidth = window.innerWidth;
    const bodyHeight = window.innerHeight;

    for (let i = 0; i < totalCount; i++) {
      setTimeout(() => {
        const p = document.createElement('div');
        const size = Math.random() * 20 + 6; // range from tiny specks to large glassy bubbles
        const r = Math.random();
        
        const isBubble = r < 0.6; // 60% are bubbles
        const color = r >= 0.6 && r < 0.8 ? '#10b981' : '#06b6d4'; 

        const startX = Math.random() * bodyWidth;

        p.style.cssText = `
          position: fixed;
          bottom: -40px;
          left: ${startX}px;
          width: ${size}px;
          height: ${size}px;
          pointer-events: none;
          z-index: 1550;
          opacity: 0.95;
          transform: translate3d(0, 0, 0);
          transition: transform 3.5s cubic-bezier(0.1, 0.85, 0.25, 1), opacity 3.5s ease-out !important;
        `;

        if (isBubble) {
          p.style.border = '1.5px solid rgba(255, 255, 255, 0.75) !important';
          p.style.background = 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.5) 0%, rgba(34, 211, 238, 0.25) 60%, transparent 100%) !important';
          p.style.boxShadow = 'inset -1px -1px 4px rgba(6, 182, 212, 0.3) !important';
          p.style.borderRadius = '50% !important';
        } else {
          p.style.background = color + ' !important';
          p.style.borderRadius = '50% !important';
          p.style.boxShadow = `0 0 15px ${color}, 0 0 5px #ffffff !important`;
          p.style.filter = 'blur(0.5px)';
        }

        document.body.appendChild(p);
        void p.offsetWidth;

        const driftX = (Math.random() - 0.5) * 450;
        const riseY = bodyHeight + 100;

        p.style.transform = `translate3d(${driftX}px, -${riseY}px, 0) scale(${Math.random() * 0.5 + 0.75})`;
        p.style.opacity = '0';

        setTimeout(() => p.remove(), 3600);
      }, Math.random() * 1500);
    }
  }
}
────────────────────────────────────────────────────────────────────────────────
