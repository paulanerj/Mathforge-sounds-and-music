────────────────────────────────────────────────────────────────────────────────
import { TargetCategory } from '../SpawnEngine';

export type SpawnRequest = {
  target: number;
  path: "initial" | "merge" | "bomb" | "zero";
  count: number;
  context?: any;
};

export type SpawnResponse = {
  categories: TargetCategory[];
};

export interface SpawnStrategy {
  generate(request: SpawnRequest): SpawnResponse;
}
────────────────────────────────────────────────────────────────────────────────
