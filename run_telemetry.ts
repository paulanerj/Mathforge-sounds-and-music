
import { MathTraversalEngine } from './src/services/mathEngine';
import { RandomService } from './src/services/randomService';

const runSimulation = (tables: number[], runs: number = 50) => {
  RandomService.init('telemetry-seed-' + tables.join('-'));
  
  const config = {
    learningMode: 'multiplication_pattern',
    selectedTables: tables,
    multMaxFactor: 10,
    difficultyLevel: 5,
    totalSteps: runs
  };

  let state = {
    stepIndex: 0,
    currentValue: tables[0],
    traversalState: {}
  };

  console.log(`\n--- START TELEMETRY RUN: Tables ${JSON.stringify(tables)} ---`);
  
  for (let i = 0; i < runs; i++) {
    const result = MathTraversalEngine.getNextValue(state, config);
    state.currentValue = result.nextValue;
    state.traversalState = result.traversalState;
    state.stepIndex++;
  }
  console.log(`--- END TELEMETRY RUN ---\n`);
};

process.env.NODE_ENV = 'development';

runSimulation([2, 3, 4]);
runSimulation([3, 4, 6]);
runSimulation([5, 6, 7]);
runSimulation([7, 8, 9]);
