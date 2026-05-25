/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

const SkyScene = ({ isActive }: { isActive: boolean }) => (
  <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`}>
    <div className="absolute inset-0 bg-gradient-to-b from-[var(--sa-scene-sky-top)] to-[var(--sa-scene-sky-bot)]"></div>
    <svg viewBox="0 0 24 24" fill="var(--sa-scene-sky-cloud1)" className="animate-float-cloud absolute top-[10%] left-0 w-64 h-64 blur-sm opacity-50">
      <path d="M18.5 12c.2 0 .5 0 .7.1 1.2.3 2.1 1.3 2.3 2.6.2 1.3-.5 2.6-1.6 3.3-.5.3-1.1.5-1.7.5H6.5c-1.9 0-3.5-1.6-3.5-3.5 0-1.7 1.2-3.1 2.9-3.4.1-.6.4-1.2.8-1.7 1.1-1.2 2.8-1.5 4.3-.8.6-1.8 2.3-3.1 4.3-3.1 2.1 0 3.9 1.4 4.5 3.3.6-.2 1.3-.3 1.9-.3 2.8 0 5 2.2 5 5 0 .3 0 .7-.1 1H18.5V12z" />
    </svg>
    <svg viewBox="0 0 24 24" fill="var(--sa-scene-sky-cloud2)" style={{ animationDuration: '35s', animationDelay: '5s' }} className="animate-float-cloud absolute top-[40%] left-0 w-48 h-48 drop-shadow-sm opacity-80">
      <path d="M6.05 13.5C6.05 11.01 8.06 9 10.55 9c.4 0 .78.06 1.14.16C12.35 7.36 14.04 6 16.05 6c2.76 0 5 2.24 5 5 0 .34-.04.67-.1.99C22.18 12.56 23 13.95 23 15.5c0 2.49-2.01 4.5-4.5 4.5h-12c-2.49 0-4.5-2.01-4.5-4.5 0-2.22 1.61-4.06 3.73-4.43-.12-.35-.18-.72-.18-1.07z" />
    </svg>
  </div>
);

const SunsetScene = ({ isActive }: { isActive: boolean }) => (
  <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`}>
    <div className="absolute inset-0 bg-gradient-to-b from-[var(--sa-scene-sunset-top)] to-[var(--sa-scene-sunset-bot)]"></div>
    <svg viewBox="0 0 24 24" fill="var(--sa-scene-sunset-cloud)" style={{ animationDuration: '45s', animationDelay: '2s' }} className="animate-float-cloud absolute top-[20%] left-0 w-56 h-56 blur-[2px] opacity-40">
      <path d="M18.5 12c.2 0 .5 0 .7.1 1.2.3 2.1 1.3 2.3 2.6.2 1.3-.5 2.6-1.6 3.3-.5.3-1.1.5-1.7.5H6.5c-1.9 0-3.5-1.6-3.5-3.5 0-1.7 1.2-3.1 2.9-3.4.1-.6.4-1.2.8-1.7 1.1-1.2 2.8-1.5 4.3-.8.6-1.8 2.3-3.1 4.3-3.1 2.1 0 3.9 1.4 4.5 3.3.6-.2 1.3-.3 1.9-.3 2.8 0 5 2.2 5 5 0 .3 0 .7-.1 1H18.5V12z" />
    </svg>
  </div>
);

const NightScene = ({ isActive }: { isActive: boolean }) => (
  <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`}>
    <div className="absolute inset-0 bg-gradient-to-b from-[var(--sa-scene-night-top)] to-[var(--sa-scene-night-bot)]"></div>
    <div className="absolute top-[15%] left-[20%] w-1 h-1 bg-[var(--sa-scene-night-star1)] rounded-full opacity-60"></div>
    <div className="absolute top-[35%] left-[70%] w-2 h-2 bg-[var(--sa-scene-night-star1)] rounded-full opacity-40 blur-[1px]"></div>
    <div className="absolute top-[65%] left-[10%] w-1.5 h-1.5 bg-[var(--sa-scene-night-star2)] rounded-full opacity-80"></div>
    <div className="absolute top-[80%] left-[80%] w-1 h-1 bg-[var(--sa-scene-night-star1)] rounded-full opacity-50"></div>
  </div>
);

const SpaceScene = ({ isActive }: { isActive: boolean }) => (
  <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`}>
    <div className="absolute inset-0 bg-gradient-to-b from-[var(--sa-scene-space-top)] to-[var(--sa-scene-space-bot)]"></div>
    <div className="absolute top-[20%] left-[50%] w-96 h-96 bg-[var(--sa-scene-space-nebula)] rounded-full opacity-20 blur-[100px] -translate-x-1/2"></div>
    <div className="absolute top-[10%] left-[15%] w-1 h-1 bg-[var(--sa-scene-space-star1)] rounded-full opacity-90 shadow-[0_0_8px_2px_var(--sa-scene-space-star1)]"></div>
    <div className="absolute top-[40%] left-[85%] w-1 h-1 bg-[var(--sa-scene-space-star2)] rounded-full opacity-80 shadow-[0_0_6px_1px_var(--sa-scene-space-star2)]"></div>
    <div className="absolute top-[75%] left-[25%] w-2 h-2 bg-[var(--sa-scene-space-star3)] rounded-full opacity-60 blur-[1px]"></div>
    <div className="absolute top-[50%] left-[10%] w-1 h-1 bg-[var(--sa-scene-space-star1)] rounded-full opacity-40"></div>
    <div className="absolute top-[85%] left-[60%] w-1.5 h-1.5 bg-[var(--sa-scene-space-star1)] rounded-full opacity-70"></div>
  </div>
);

export const SceneContainer = ({
  activeScene,
  themeClass,
  shake,
  children,
}: {
  activeScene: string;
  themeClass: string;
  shake: boolean;
  children: React.ReactNode;
}) => (
  <div data-guide-id="app-root" className={`sa-app ${themeClass} flex flex-col items-center relative h-[100dvh] overflow-hidden ${shake ? 'animate-shake' : ''}`}>
    <div className="absolute inset-0 z-0 pointer-events-none">
      <SkyScene isActive={activeScene === 'sky'} />
      <SunsetScene isActive={activeScene === 'sunset'} />
      <NightScene isActive={activeScene === 'night'} />
      <SpaceScene isActive={activeScene === 'space'} />
    </div>
    <div className="relative z-10 w-full h-full flex flex-col items-center overflow-hidden">{children}</div>
  </div>
);
