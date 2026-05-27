────────────────────────────────────────────────────────────────────────────────
import { SpawnStrategy, SpawnRequest, SpawnResponse } from '../../engine/spawn/SpawnStrategy';
import { TargetCategory, getCategorySequence } from '../../engine/SpawnEngine';

export class CombineGridSpawnStrategy implements SpawnStrategy {
  generate(request: SpawnRequest): SpawnResponse & { updatedCategoryBag?: TargetCategory[] } {
    const { path, count, context } = request;
    const { prng, categoryBag, rows, cols } = context || {};
    
    const categories: TargetCategory[] = [];
    let currentBag = categoryBag ? [...categoryBag] : [];

    if (path === "initial") {
      for (let i = 0; i < 8; i++) categories.push(TargetCategory.FACTOR);
      
      for (let i = 0; i < 3; i++) {
        categories.push(TargetCategory.ONE);
        categories.push(TargetCategory.ZERO);
      }
      
      const remaining = count - categories.length;
      for (let i = 0; i < remaining; i++) {
        if (i % 2 === 0) categories.push(TargetCategory.FACTOR);
        else categories.push(TargetCategory.DISTRACTOR);
      }
      return { categories };
    }

    for (let i = 0; i < count; i++) {
        if (currentBag.length === 0 && prng && rows && cols) {
          currentBag = getCategorySequence(rows * cols * 4, prng);
        }
        if (currentBag.length > 0) {
          categories.push(currentBag.pop()!);
        } else {
          categories.push(TargetCategory.FACTOR);
        }
    }

    return { 
      categories,
      updatedCategoryBag: currentBag
    };
  }
}
────────────────────────────────────────────────────────────────────────────────
