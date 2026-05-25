import { TutorialScript } from './tutorialTypes';

export const TUTORIAL_SCRIPTS: Record<string, TutorialScript> = {
  app_basics: {
    id: 'app_basics',
    title: 'App Basics',
    description: 'Learn the core flow of the game.',
    version: 1,
    steps: [
      {
        id: 'ab_welcome',
        kind: 'info',
        title: 'Welcome to Forge!',
        message: 'This is where you train your brain to do math super fast.',
        target: { id: 'app-root' },
        pauseMode: 'freezeGameplay',
        advanceOn: 'continue',
      },
      {
        id: 'ab_header',
        kind: 'info',
        title: 'Your Progress',
        message: 'Look here to see your score multiplier and how much time you have left!',
        target: { id: 'top-bar' },
        pauseMode: 'freezeGameplay',
        advanceOn: 'continue',
      },
      {
        id: 'ab_help',
        kind: 'info',
        title: 'Need Help?',
        message: 'Tap the Help button anytime if you get stuck or want a tip.',
        target: { id: 'help-button' },
        pauseMode: 'freezeGameplay',
        advanceOn: 'continue',
      }
    ]
  },
  normal_mode_basics: {
    id: 'normal_mode_basics',
    title: 'Normal Mode Basics',
    description: 'Solve the center coin and pick the right answer.',
    version: 1,
    steps: [
      {
        id: 'nmb_coin',
        kind: 'info',
        title: 'The Core',
        message: 'Look at the center coin to see the math problem you need to solve.',
        target: { id: 'center-coin' },
        pauseMode: 'freezeGameplay',
        advanceOn: 'continue',
      },
      {
        id: 'nmb_grid',
        kind: 'info',
        title: 'The Answer Grid',
        message: 'Tap the button down here that matches the right answer!',
        target: { id: 'answer-grid' },
        pauseMode: 'freezeGameplay',
        advanceOn: 'continue',
      },
      {
        id: 'nmb_solve',
        kind: 'realAction',
        title: 'Your Turn',
        message: 'Try it now! Solve the math in the center and tap the correct answer.',
        target: { id: 'answer-button-correct' },
        pauseMode: 'freezeGameplay',
        advanceOn: 'realAction',
      }
    ]
  },
  qmm_basics: {
    id: 'qmm_basics',
    title: 'QMM Guide',
    description: 'Fast thinking with moving modifiers.',
    version: 1,
    steps: [
      {
        id: 'qmm_info',
        kind: 'info',
        title: 'Speed Up!',
        message: 'Quick Math Mode (QMM) is a fast drill to test your speed.',
        target: { id: 'modifier-zone' },
        pauseMode: 'freezeGameplay',
        advanceOn: 'continue',
      },
      {
        id: 'qmm_goal',
        kind: 'info',
        title: 'Modifiers',
        message: 'Watch out for moving numbers! Add or multiply them into your answer quickly.',
        target: { id: 'modifier-zone' },
        pauseMode: 'freezeGameplay',
        advanceOn: 'continue',
      }
    ]
  },
  dark_mode_basics: {
    id: 'dark_mode_basics',
    title: 'Dark Mode Guide',
    description: 'Listen to the rhythm and tap the center coin.',
    version: 1,
    steps: [
      {
        id: 'dmb_blind',
        kind: 'info',
        title: 'Hidden Grid',
        message: 'In Dark Mode, the answer buttons are hidden. Use your ears and the rhythm!',
        target: { id: 'answer-grid' },
        pauseMode: 'freezeGameplay',
        advanceOn: 'continue',
      },
      {
        id: 'dmb_action',
        kind: 'info',
        title: 'Tap to Answer',
        message: 'Tap the center coin to match the correct answer amount.',
        target: { id: 'dark-mode-center-action' },
        pauseMode: 'freezeGameplay',
        advanceOn: 'continue',
      }
    ]
  },
  survival_mode_basics: {
    id: 'survival_mode_basics',
    title: 'Survival Mode Guide',
    description: 'Do not run out of hearts!',
    version: 1,
    steps: [
      {
        id: 'sm_lives',
        kind: 'info',
        title: 'Hearts',
        message: 'You start with 3 hearts. Do not guess too much, or you will lose a heart!',
        target: { id: 'survival-lives' },
        pauseMode: 'freezeGameplay',
        advanceOn: 'continue',
      },
      {
        id: 'sm_failsafe',
        kind: 'info',
        title: 'Safe Recovery',
        message: 'If you miss, the correct answer turns green. Tap it to keep going!',
        target: { id: 'fail-safe-correct-answer' },
        pauseMode: 'freezeGameplay',
        advanceOn: 'continue',
      }
    ]
  }
};
