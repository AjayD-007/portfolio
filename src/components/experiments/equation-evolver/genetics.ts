// ─────────────────────────────────────────────────────────────
//  genetics.ts — Genetic Algorithm engine
//  Selection, crossover, mutation, population management.
// ─────────────────────────────────────────────────────────────

import {
  ASTNode, DataPoint, BinOp, UnaryOp,
  MAX_DEPTH,
  randomTree, cloneTree, simplifyAST,
  countNodes, getNode, replaceNode,
  pick, randFloat,
} from './ast';
import { evaluateAST } from './ast';

// ── Types ─────────────────────────────────────────────────────

export interface Individual {
  tree:    ASTNode;
  fitness: number;   // lower is better (MSE + parsimony)
}

// ── Constants ─────────────────────────────────────────────────

const FITNESS_PENALTY   = 1e8;
const ELITISM_COUNT     = 3;
const TOURNAMENT_K      = 4;
const PARSIMONY_COEFF   = 0.02;   // gentler than 0.05 — less bloat pressure

const BIN_OPS:   readonly BinOp[]   = ['+', '-', '*', '/', '^'];
const UNARY_OPS: readonly UnaryOp[] = ['sin', 'cos', 'ln', 'sqrt'];

// ── Fitness ───────────────────────────────────────────────────

/** Mean Squared Error + parsimony pressure (penalise large trees). */
export function computeFitness(tree: ASTNode, data: DataPoint[]): number {
  if (data.length === 0) return FITNESS_PENALTY;
  let sumSqErr = 0;
  for (const { x, y } of data) {
    const predicted = evaluateForFitness(tree, x);
    if (!isFinite(predicted)) return FITNESS_PENALTY;
    const err = predicted - y;
    sumSqErr += err * err;
  }
  const mse = sumSqErr / data.length;
  return mse + countNodes(tree) * PARSIMONY_COEFF;
}

/** MSE only — used by constant optimiser so parsimony doesn't fight it. */
export function mseOnly(tree: ASTNode, data: DataPoint[]): number {
  if (data.length === 0) return FITNESS_PENALTY;
  let sumSqErr = 0;
  for (const { x, y } of data) {
    const predicted = evaluateAST(tree, x);
    if (!isFinite(predicted)) return FITNESS_PENALTY;
    const err = predicted - y;
    sumSqErr += err * err;
  }
  return sumSqErr / data.length;
}

function evaluateForFitness(tree: ASTNode, x: number): number {
  return evaluateAST(tree, x);
}

// ── Selection ─────────────────────────────────────────────────

/** Tournament selection: pick k candidates, return the fittest. */
function tournamentSelect(population: Individual[], k: number = TOURNAMENT_K): Individual {
  let best: Individual | null = null;
  for (let i = 0; i < k; i++) {
    const idx       = Math.floor(Math.random() * population.length);
    const candidate = population[idx];
    if (!best || candidate.fitness < best.fitness) best = candidate;
  }
  return best!;
}

// ── Crossover ─────────────────────────────────────────────────

/**
 * Subtree crossover: picks a random node from each parent and swaps them.
 * Biased towards choosing operator nodes rather than leaves to avoid
 * degenerate swaps.
 */
export function crossover(parentA: ASTNode, parentB: ASTNode): [ASTNode, ASTNode] {
  const sizeA = countNodes(parentA);
  const sizeB = countNodes(parentB);

  // Bias: 70% chance to avoid picking the root (idx 0) to prevent identity crossovers
  const idxA = sizeA > 1 && Math.random() < 0.7 ? 1 + Math.floor(Math.random() * (sizeA - 1)) : 0;
  const idxB = sizeB > 1 && Math.random() < 0.7 ? 1 + Math.floor(Math.random() * (sizeB - 1)) : 0;

  const subtreeA = getNode(parentA, idxA);
  const subtreeB = getNode(parentB, idxB);

  return [
    replaceNode(parentA, idxA, subtreeB),
    replaceNode(parentB, idxB, subtreeA),
  ];
}

// ── Mutation ──────────────────────────────────────────────────

function randInt(max: number): number { return Math.floor(Math.random() * max); }

function randomTerminal(): ASTNode {
  const r = Math.random();
  if (r < 0.5) return { type: 'var' };
  if (r < 0.55) return { type: 'const', name: Math.random() < 0.5 ? 'pi' : 'e' };
  return { type: 'num', value: parseFloat(randFloat(-5, 5).toFixed(2)) };
}

/** Point mutation: stochastically perturb nodes throughout the tree. */
export function mutate(tree: ASTNode, rate: number): ASTNode {
  function walk(n: ASTNode, depth: number): ASTNode {
    if (Math.random() >= rate) {
      // No mutation here — recurse into children
      switch (n.type) {
        case 'num': case 'const': case 'var': return n;
        case 'unaryop': return { type: 'unaryop', op: n.op, child: walk(n.child, depth + 1) };
        case 'binop':   return { type: 'binop',   op: n.op, left: walk(n.left, depth + 1), right: walk(n.right, depth + 1) };
      }
    }

    const r = Math.random();

    // ── Pruning (5%): replace operator with one of its children ──
    if (r < 0.05) {
      if (n.type === 'unaryop') return walk(n.child, depth + 1);
      if (n.type === 'binop')   return Math.random() < 0.5 ? walk(n.left, depth + 1) : walk(n.right, depth + 1);
    }

    // ── Subtree replacement (20%) ──
    if (r < 0.25) {
      return randomTree(Math.min(3, MAX_DEPTH - depth), 0);
    }

    // ── Constant nudge (25%): fine-tune numeric leaves ──
    if (r < 0.50 && (n.type === 'num' || n.type === 'const')) {
      const val = n.type === 'num' ? n.value : (n.name === 'pi' ? Math.PI : Math.E);
      const nudge = randFloat(-0.3, 0.3);
      return { type: 'num', value: parseFloat((val + nudge).toFixed(3)) };
    }

    // ── Operator swap (20%) ──
    if (r < 0.70 && n.type === 'binop') {
      return {
        type: 'binop',
        op:    pick(BIN_OPS),
        left:  walk(n.left,  depth + 1),
        right: walk(n.right, depth + 1),
      };
    }

    // ── Unary op swap (15%) ──
    if (r < 0.85 && n.type === 'unaryop') {
      return { type: 'unaryop', op: pick(UNARY_OPS), child: walk(n.child, depth + 1) };
    }

    // ── Terminal randomisation ──
    if (n.type === 'var' || n.type === 'num' || n.type === 'const') {
      if (Math.random() < 0.3) return randomTree(Math.min(2, MAX_DEPTH - depth), 0);
      return randomTerminal();
    }

    return n;
  }

  return walk(cloneTree(tree), 0);
}

// ── Population ────────────────────────────────────────────────

/** Generate a ramped half-and-half initial population for diversity. */
export function generatePopulation(
  size:     number,
  data:     DataPoint[],
  maxDepth: number = MAX_DEPTH,
): Individual[] {
  const pop: Individual[] = [];

  for (let i = 0; i < size; i++) {
    // Ramp depth from 2..maxDepth to ensure variety
    const depth = 2 + (i % (maxDepth - 1));
    const tree  = simplifyAST(randomTree(depth));
    pop.push({ tree, fitness: computeFitness(tree, data) });
  }

  pop.sort((a, b) => a.fitness - b.fitness);
  return pop;
}

// ── Evolution ─────────────────────────────────────────────────

/** Run one full generational cycle. Returns new population sorted by fitness. */
export function evolveOneGeneration(
  population:   Individual[],
  data:         DataPoint[],
  mutationRate: number,
): Individual[] {
  const size    = population.length;
  const nextGen: Individual[] = [];

  // ── Elitism: carry top individuals forward unchanged ──
  for (let i = 0; i < ELITISM_COUNT && i < size; i++) {
    nextGen.push({ tree: cloneTree(population[i].tree), fitness: population[i].fitness });
  }

  // ── Fill via crossover + mutation ──
  while (nextGen.length < size) {
    const parentA = tournamentSelect(population, TOURNAMENT_K);
    const parentB = tournamentSelect(population, TOURNAMENT_K);

    let [childA, childB] = crossover(parentA.tree, parentB.tree);

    childA = simplifyAST(mutate(childA, mutationRate));
    childB = simplifyAST(mutate(childB, mutationRate));

    nextGen.push({ tree: childA, fitness: computeFitness(childA, data) });
    if (nextGen.length < size) {
      nextGen.push({ tree: childB, fitness: computeFitness(childB, data) });
    }
  }

  nextGen.sort((a, b) => a.fitness - b.fitness);
  return nextGen;
}