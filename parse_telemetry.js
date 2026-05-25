const fs = require('fs');

const log = fs.readFileSync('telemetry_output.txt', 'utf8');

const runs = log.split('--- START TELEMETRY RUN: Tables ');
runs.shift();

let totalSteps = 0;
let totalTransitions = 0;
let totalBridges = 0;
let totalModifiers = 0;
let totalOverlaps = 0;
let completedRunLengths = [];

runs.forEach(run => {
  const lines = run.split('\n');
  let currentRunLength = 0;
  
  lines.forEach(line => {
    if (line.includes('transitionOccurred: true')) {
      totalTransitions++;
      if (currentRunLength > 0) {
        completedRunLengths.push(currentRunLength);
      }
      currentRunLength = 1;
    } else if (line.includes('stepIndex:')) {
      currentRunLength++;
      totalSteps++;
    }
    
    if (line.includes('bridgePatternUsed: true')) totalBridges++;
    if (line.includes('modifierUsed: true')) totalModifiers++;
    if (line.includes('overlapLanding: true')) totalOverlaps++;
  });
});

const avgRunLength = completedRunLengths.reduce((a, b) => a + b, 0) / completedRunLengths.length;

console.log({
  totalSteps,
  totalTransitions,
  avgRunLength,
  bridgeFreq: (totalBridges / totalSteps) * 100,
  modifierFreq: (totalModifiers / totalSteps) * 100,
  overlapFreq: (totalOverlaps / totalSteps) * 100,
});
