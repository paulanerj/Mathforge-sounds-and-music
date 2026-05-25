import { MathTraversalEngine } from './src/services/mathEngine';
import { ProblemGenerator } from './src/services/problemGenerator';
import { RandomService } from './src/services/randomService';
import { DifficultyEngine } from './src/services/difficulty/difficultyEngine';

process.env.NODE_ENV = 'production';

const runLongSession = (tables: number[]) => {
  RandomService.init('long-session-' + tables.join('-'));
  
  const config: any = {
    learningMode: 'multiplication_pattern',
    selectedTables: tables,
    multMaxFactor: 10,
    difficultyLevel: 5,
    totalSteps: 200,
    opsEnabled: { '+': true, '-': true, '×': true, '÷': false },
    phaseSequence: ['normal']
  };

  let state = {
    stepIndex: 0,
    currentValue: tables[0],
    traversalState: {}
  };

  let totalTransitions = 0;
  let totalBridges = 0;
  let totalModifiers = 0;
  let totalOverlaps = 0;
  let runLengths = [];
  let currentRunLength = 0;

  for (let i = 0; i < 200; i++) {
    const result = MathTraversalEngine.getNextValue(state, config);
    
    if (result.traversalState.subPhase === 'multiplication' && result.traversalState.bridgePatternUsed) {
      totalBridges++;
    }
    if (result.operation === '×') {
      totalModifiers++;
    }
    
    const overlap = tables.filter(t => result.nextValue % t === 0).length > 1;
    if (overlap) totalOverlaps++;

    if (result.traversalState.stepsInCurrentTable === 1 && i > 0) {
      totalTransitions++;
      if (currentRunLength > 0) runLengths.push(currentRunLength);
      currentRunLength = 1;
    } else {
      currentRunLength++;
    }

    state.currentValue = result.nextValue;
    state.traversalState = result.traversalState;
    state.stepIndex++;
  }
  if (currentRunLength > 0) runLengths.push(currentRunLength);

  const avgRunLength = runLengths.length > 0 ? runLengths.reduce((a, b) => a + b, 0) / runLengths.length : 0;

  return {
    tables,
    avgRunLength,
    totalTransitions,
    bridgeFreq: (totalBridges / 200) * 100,
    modifierFreq: (totalModifiers / 200) * 100,
    overlapFreq: (totalOverlaps / 200) * 100,
    runLengths
  };
};

const runDifficultyScaling = (difficultyLevel: number) => {
  RandomService.init('diff-scaling-' + difficultyLevel);
  
  const config: any = {
    learningMode: 'multiplication_pattern',
    selectedTables: [3, 4, 6],
    multMaxFactor: 10,
    difficultyLevel,
    totalSteps: 50,
    opsEnabled: { '+': true, '-': true, '×': true, '÷': false },
    phaseSequence: ['normal']
  };

  const steps = ProblemGenerator.generateSequence(config.selectedTables[0], config);
  
  if (!steps) return null;

  let totalSkips = 0;
  let totalModifiers = 0;
  let distractorSimilarities = new Set();
  let avgTimer = 0;

  steps.forEach(step => {
    if (step.operation === '+' || step.operation === '-') {
      totalSkips += step.value;
    } else if (step.operation === '×') {
      totalModifiers++;
    }
    distractorSimilarities.add(step.difficultyMeta?.difficultyVector?.distractorSimilarity);
    avgTimer += step.timerSeconds;
  });

  return {
    difficultyLevel,
    avgSkipSize: totalSkips / steps.filter(s => s.operation === '+' || s.operation === '-').length,
    modifierFreq: (totalModifiers / 50) * 100,
    distractorSimilarities: Array.from(distractorSimilarities),
    avgTimer: avgTimer / 50
  };
};

const runEdgeCaseDetection = () => {
  RandomService.init('edge-case-detection');
  
  const config: any = {
    learningMode: 'multiplication_pattern',
    selectedTables: [2, 3, 4],
    multMaxFactor: 10,
    difficultyLevel: 5,
    totalSteps: 100,
    opsEnabled: { '+': true, '-': true, '×': true, '÷': false },
    phaseSequence: ['normal']
  };

  let state = {
    stepIndex: 0,
    currentValue: 2,
    traversalState: {}
  };

  let values = [];
  let repeatedLoops = 0;

  for (let i = 0; i < 100; i++) {
    const result = MathTraversalEngine.getNextValue(state, config);
    values.push(result.nextValue);
    
    // Check for repeated loops (e.g., A -> B -> A -> B)
    if (values.length >= 4) {
      const len = values.length;
      if (values[len-1] === values[len-3] && values[len-2] === values[len-4]) {
        repeatedLoops++;
      }
    }

    state.currentValue = result.nextValue;
    state.traversalState = result.traversalState;
    state.stepIndex++;
  }

  return {
    repeatedLoops,
    valuesSample: values.slice(0, 20)
  };
};

const runDistractorAudit = () => {
  RandomService.init('distractor-audit');
  
  const config: any = {
    learningMode: 'multiplication_pattern',
    selectedTables: [4, 7],
    multMaxFactor: 10,
    difficultyLevel: 5,
    totalSteps: 50,
    opsEnabled: { '+': true, '-': true, '×': true, '÷': false },
    phaseSequence: ['normal']
  };

  const steps = ProblemGenerator.generateSequence(config.selectedTables[0], config);
  
  if (!steps) return null;

  let duplicatesFound = 0;
  let correctInDistractors = 0;
  let plausibleCount = 0;

  steps.forEach(step => {
    const uniqueDistractors = new Set(step.distractors);
    if (uniqueDistractors.size !== step.distractors.length) duplicatesFound++;
    
    const correctCount = step.distractors.filter(d => d === step.correctAnswer).length;
    if (correctCount > 1) correctInDistractors++;
    
    // Check if distractors are plausible (multiples of the table, or close neighbors)
    const table = step.meta?.traversalState?.currentTable || 4;
    let plausible = true;
    step.distractors.forEach(d => {
      if (d === step.correctAnswer) return;
      const isMultiple = d % table === 0;
      const isClose = Math.abs(d - step.correctAnswer) <= 5;
      if (!isMultiple && !isClose) plausible = false;
    });
    if (plausible) plausibleCount++;
  });

  return {
    duplicatesFound,
    correctInDistractors,
    plausibleRatio: (plausibleCount / 50) * 100
  };
};

console.log("--- LONG SESSION SIMULATION ---");
console.log(runLongSession([2, 3, 4]));
console.log(runLongSession([3, 4, 6]));
console.log(runLongSession([5, 6, 7]));
console.log(runLongSession([7, 8, 9]));

console.log("\n--- DIFFICULTY SCALING TEST ---");
console.log(runDifficultyScaling(3));
console.log(runDifficultyScaling(5));
console.log(runDifficultyScaling(7));
console.log(runDifficultyScaling(9));

console.log("\n--- TRAVERSAL EDGE-CASE DETECTION ---");
console.log(runEdgeCaseDetection());

console.log("\n--- DISTRACTOR QUALITY AUDIT ---");
console.log(runDistractorAudit());
