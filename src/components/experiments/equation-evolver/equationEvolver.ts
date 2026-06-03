// ─────────────────────────────────────────────────────────────
//  equationEvolver.ts — Public API & data utilities
//  Re-exports everything consumers need; owns data helpers.
// ─────────────────────────────────────────────────────────────

// ── Re-export the full public surface ────────────────────────

export type {
  BinOp, UnaryOp, ASTNode, NumNode, VarNode, BinNode, UnaryNode, ConstNode,
  DataPoint,
} from './ast';

export {
  randomTree, evaluateAST, cloneTree, simplifyAST,
  countNodes, isEqualAST, astToString,
  optimiseConstants,
} from './ast';

export type { Individual } from './genetics';

export {
  computeFitness,
  crossover,
  mutate,
  generatePopulation,
  evolveOneGeneration,
} from './genetics';

// ── Data generators ───────────────────────────────────────────

import { DataPoint } from './ast';

function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function generateNoisyQuadratic(n: number = 30): DataPoint[] {
  return Array.from({ length: n }, () => {
    const x = parseFloat(randFloat(-5, 5).toFixed(2));
    const y = parseFloat((0.5 * x * x + 0.3 * x - 1 + randFloat(-0.5, 0.5)).toFixed(2));
    return { x, y };
  }).sort((a, b) => a.x - b.x);
}

export function generateNoisySine(n: number = 30): DataPoint[] {
  return Array.from({ length: n }, () => {
    const x = parseFloat(randFloat(-Math.PI * 2, Math.PI * 2).toFixed(2));
    const y = parseFloat((2 * Math.sin(x) + randFloat(-0.3, 0.3)).toFixed(2));
    return { x, y };
  }).sort((a, b) => a.x - b.x);
}

export function generateNoisyLinear(n: number = 30): DataPoint[] {
  return Array.from({ length: n }, () => {
    const x = parseFloat(randFloat(-5, 5).toFixed(2));
    const y = parseFloat((2.5 * x + 1.2 + randFloat(-0.5, 0.5)).toFixed(2));
    return { x, y };
  }).sort((a, b) => a.x - b.x);
}

export function generateNoisyCubic(n: number = 30): DataPoint[] {
  return Array.from({ length: n }, () => {
    const x = parseFloat(randFloat(-3, 3).toFixed(2));
    const y = parseFloat((x * x * x - 2 * x + 0.5 + randFloat(-0.5, 0.5)).toFixed(2));
    return { x, y };
  }).sort((a, b) => a.x - b.x);
}

// ── CSV utilities ─────────────────────────────────────────────

/** Convert data points to CSV string (for textarea display). */
export function dataToCSV(data: DataPoint[]): string {
  return data.map(p => `${p.x}, ${p.y}`).join('\n');
}

/** Parse CSV string to data points. Caps at 150 points via uniform sampling. */
export function parseCSV(csv: string): DataPoint[] {
  const points: DataPoint[] = [];
  for (const line of csv.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split(/[,\s\t]+/);
    if (parts.length >= 2) {
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      if (isFinite(x) && isFinite(y)) points.push({ x, y });
    }
  }

  if (points.length <= 150) return points;

  // Uniform downsample to 150 points
  const step = points.length / 150;
  return Array.from({ length: 150 }, (_, i) => points[Math.floor(i * step)]);
}

// ── Convenience: run a full evolution and return best result ──

import { ASTNode, optimiseConstants, evaluateAST, astToString } from './ast';
import { Individual, computeFitness, generatePopulation, evolveOneGeneration } from './genetics';

export interface EvolveOptions {
  populationSize?: number;   // default 80
  generations?:   number;    // default 50
  mutationRate?:  number;    // default 0.15
  /** Apply constant optimisation on the best individual after evolution. Default true. */
  optimiseConsts?: boolean;
}

export interface EvolveResult {
  best:        Individual;
  history:     number[];   // best fitness per generation
  equation:    string;
}

/** Run a synchronous full evolution and return the best-found equation. */
export function evolve(data: DataPoint[], opts: EvolveOptions = {}): EvolveResult {
  const {
    populationSize = 80,
    generations    = 50,
    mutationRate   = 0.15,
    optimiseConsts = true,
  } = opts;

  let pop     = generatePopulation(populationSize, data);
  const history: number[] = [pop[0].fitness];

  for (let g = 0; g < generations; g++) {
    pop = evolveOneGeneration(pop, data, mutationRate);
    history.push(pop[0].fitness);
  }

  let bestTree = pop[0].tree;
  if (optimiseConsts) {
    const mseOnlyFn = (t: ASTNode) => {
      let sum = 0;
      for (const { x, y } of data) {
        const p = evaluateAST(t, x);
        if (!isFinite(p)) return 1e8;
        sum += (p - y) ** 2;
      }
      return sum / data.length;
    };
    bestTree = optimiseConstants(bestTree, data, mseOnlyFn);
  }

  return {
    best:     { tree: bestTree, fitness: computeFitness(bestTree, data) },
    history,
    equation: `y = ${astToString(bestTree)}`,
  };
}