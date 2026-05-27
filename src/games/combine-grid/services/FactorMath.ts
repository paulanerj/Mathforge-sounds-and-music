export function getFactors(target: number): number[] {
  if (target <= 1) return [];
  const factors: Set<number> = new Set();
  
  for (let i = 2; i <= Math.sqrt(target); i++) {
    if (target % i === 0) {
      factors.add(i);
      factors.add(target / i);
    }
  }
  
  if (factors.size === 0) {
     return [1, target];
  }
  
  return Array.from(factors).sort((a, b) => a - b);
}

export function getFactorPairs(target: number): [number, number][] {
  if (target <= 1) return [];
  const pairs: [number, number][] = [];
  
  for (let i = 2; i <= Math.sqrt(target); i++) {
    if (target % i === 0) {
      pairs.push([i, target / i]);
    }
  }
  
  if (pairs.length === 0) {
    return [[1, target]];
  }
  
  return pairs.sort((a, b) => {
    const diffA = Math.abs(a[0] - a[1]);
    const diffB = Math.abs(b[0] - b[1]);
    return diffA - diffB;
  });
}

function addUniqueRecipe(recipes: number[][], newRecipe: number[]) {
  const newStr = newRecipe.join(',');
  for (const r of recipes) {
    if (r.join(',') === newStr) {
      return; 
    }
  }
  recipes.push(newRecipe);
}

export function getFactorRecipes(target: number): number[][] {
  const recipes: number[][] = [];
  
  const pairs = getFactorPairs(target);
  pairs.forEach(pair => recipes.push([...pair]));
  
  pairs.forEach(pair => {
    const [a, b] = pair;
    
    const factorsA = getFactorPairs(a);
    if (factorsA.length > 0 && factorsA[0][0] !== 1) {
      factorsA.forEach(subPairA => {
        const recipe = [...subPairA, b].sort((x, y) => x - y);
        addUniqueRecipe(recipes, recipe);
      });
    }
    
    const factorsB = getFactorPairs(b);
    if (factorsB.length > 0 && factorsB[0][0] !== 1) {
      factorsB.forEach(subPairB => {
        const recipe = [a, ...subPairB].sort((x, y) => x - y);
        addUniqueRecipe(recipes, recipe);
      });
    }
  });
  
  const uniqueRecipes: number[][] = [];
  recipes.forEach(r => addUniqueRecipe(uniqueRecipes, r));
  
  return uniqueRecipes;
}