const simulate = (difficultyLevel, iterations = 500) => {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (let i = 0; i < iterations; i++) {
    const r = Math.random();
    let stepsToJump = 1;
    if (difficultyLevel <= 3) {
       if (r < 0.40) stepsToJump = 1;
       else if (r < 0.75) stepsToJump = 2;
       else if (r < 0.95) stepsToJump = 3;
       else stepsToJump = 4;
    } else if (difficultyLevel <= 6) {
       if (r < 0.25) stepsToJump = 1;
       else if (r < 0.60) stepsToJump = 2;
       else if (r < 0.85) stepsToJump = 3;
       else if (r < 0.95) stepsToJump = 4;
       else stepsToJump = 5;
    } else {
       if (r < 0.15) stepsToJump = 1;
       else if (r < 0.45) stepsToJump = 2;
       else if (r < 0.70) stepsToJump = 3;
       else if (r < 0.85) stepsToJump = 4;
       else if (r < 0.95) stepsToJump = 5;
       else stepsToJump = 6;
    }
    counts[stepsToJump]++;
  }
  console.log(`\nDifficulty Levels ${difficultyLevel <= 3 ? '1-3' : difficultyLevel <= 6 ? '4-6' : '7-10'} Simulation (500 iterations):`);
  for (let k = 1; k <= 6; k++) {
    if (counts[k] > 0 || k <= 6) {
      console.log(`+${k} -> ${((counts[k] / iterations) * 100).toFixed(1)}%`);
    }
  }
};

simulate(2);
simulate(5);
simulate(8);
