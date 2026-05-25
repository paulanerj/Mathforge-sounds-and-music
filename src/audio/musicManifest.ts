export type MusicTrackId =
  | 'mainMenu'
  | 'normalMode'
  | 'qmm'
  | 'darkMode'
  | 'hiddenMode'
  | 'survivalMode'
  | 'lessonBuilder'
  | 'sessionSummary'
  | 'levelComplete';

export interface MusicTrackMeta {
  id: MusicTrackId;
  label: string;
  primarySrc: string;
  fallbackSrc?: string;
  loop: boolean;
  volumeRole: 'menu' | 'gameplay' | 'dark_mode' | 'stinger';
  description: string;
  whenUsed: string;
}

export const MUSIC_MANIFEST: Record<MusicTrackId, MusicTrackMeta> = {
  mainMenu: {
    id: 'mainMenu',
    label: 'Main Menu Loop',
    primarySrc: '/audio/music/main_menu_loop.mp3',
    fallbackSrc: '/audio/music/main_menu_loop.ogg',
    loop: true,
    volumeRole: 'menu',
    description: 'Background loop for start screen and play menus.',
    whenUsed: 'Played on Home / Start / Play Menu screens.'
  },
  normalMode: {
    id: 'normalMode',
    label: 'Normal Mode Loop',
    primarySrc: '/audio/music/normal_mode_loop.mp3',
    fallbackSrc: '/audio/music/normal_mode_loop.ogg',
    loop: true,
    volumeRole: 'gameplay',
    description: 'Neutral background loop for normal practice.',
    whenUsed: 'Played during Normal Mode active gameplay.'
  },
  qmm: {
    id: 'qmm',
    label: 'QMM Loop',
    primarySrc: '/audio/music/qmm_loop.mp3',
    fallbackSrc: '/audio/music/qmm_loop.ogg',
    loop: true,
    volumeRole: 'gameplay',
    description: 'Fast but low-fatigue loop for Quick Math Mode.',
    whenUsed: 'Played during active QMM gameplay if the file exists.'
  },
  darkMode: {
    id: 'darkMode',
    label: 'Dark Mode Loop',
    primarySrc: '/audio/music/dark_mode_loop.mp3',
    fallbackSrc: '/audio/music/dark_mode_loop.ogg',
    loop: true,
    volumeRole: 'dark_mode',
    description: 'Ambient space loop for rhythm-based mode.',
    whenUsed: 'Played during Dark Mode.'
  },
  hiddenMode: {
    id: 'hiddenMode',
    label: 'Hidden Mode Loop',
    primarySrc: '/audio/music/hidden_mode_loop.mp3',
    fallbackSrc: '/audio/music/hidden_mode_loop.ogg',
    loop: true,
    volumeRole: 'gameplay',
    description: 'Mystery-style loop for hidden info mode.',
    whenUsed: 'Played during Hidden Mode.'
  },
  survivalMode: {
    id: 'survivalMode',
    label: 'Survival Mode Loop',
    primarySrc: '/audio/music/survival_mode_loop.mp3',
    fallbackSrc: '/audio/music/survival_mode_loop.ogg',
    loop: true,
    volumeRole: 'gameplay',
    description: 'Tenshion loop for survival gameplay.',
    whenUsed: 'Played during Survival Mode.'
  },
  lessonBuilder: {
    id: 'lessonBuilder',
    label: 'Lesson Builder Loop',
    primarySrc: '/audio/music/lesson_builder_loop.mp3',
    fallbackSrc: '/audio/music/lesson_builder_loop.ogg',
    loop: true,
    volumeRole: 'menu',
    description: 'Creative and relaxing loop.',
    whenUsed: 'Played during Lesson Builder edit screens.'
  },
  sessionSummary: {
    id: 'sessionSummary',
    label: 'Session Summary Loop',
    primarySrc: '/audio/music/session_summary_loop.mp3',
    fallbackSrc: '/audio/music/session_summary_loop.ogg',
    loop: true,
    volumeRole: 'menu',
    description: 'Results screen summary music.',
    whenUsed: 'Played on Session Summary/Results views.'
  },
  levelComplete: {
    id: 'levelComplete',
    label: 'Level Complete Stinger',
    primarySrc: '/audio/music/level_complete_stinger.mp3',
    fallbackSrc: '/audio/music/level_complete_stinger.ogg',
    loop: false,
    volumeRole: 'stinger',
    description: 'Short musical celebration.',
    whenUsed: 'Played once when level/session completes.'
  }
};
