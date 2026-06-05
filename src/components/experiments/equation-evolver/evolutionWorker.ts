// ─────────────────────────────────────────────────────────────
//  evolutionWorker.ts — Runs the genetic algorithm in a
//  dedicated Web Worker thread so the UI never freezes.
// ─────────────────────────────────────────────────────────────

import { type ASTNode, type DataPoint, astToString, evaluateAST, expandAST } from './ast';
import { parse, simplify } from 'mathjs';
import {
  type Individual,
  generatePopulation,
  evolveOneGeneration,
} from './genetics';

// ── Worker state ─────────────────────────────────────────────

let population: Individual[] = [];
let generation = 0;
let isRunning = false;
let isPaused = false;
let mutationRate = 0.10;
let data: DataPoint[] = [];

// Stagnation detection
let lastBestMSE = Infinity;
let stagnationCounter = 0;
let adaptiveMutationCounter = 0;

// History tracking
let fitnessHistory: number[] = [];
let milestones: { gen: number; mse: number; eq: string }[] = [];
let lastMilestoneMSE = Infinity;

// Early stopping
let bestEverMSE = Infinity;
let bestEverGeneration = 0;
const EARLY_STOP_PATIENCE = 3000; // wait 3000 gens (approx 5-10s) before giving up

const MAX_GENERATIONS = 20000;
const CONVERGENCE_MSE = 0.01;
const PROGRESS_INTERVAL = 80; // ms between progress posts

// ── Message handler ──────────────────────────────────────────

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'start':
      startEvolution(payload);
      break;
    case 'stop':
      isRunning = false;
      break;
    case 'pause':
      isPaused = true;
      break;
    case 'resume':
      isPaused = false;
      break;
  }
};

// ── Evolution entry point ────────────────────────────────────

function startEvolution(config: {
  populationSize: number;
  mutationRate: number;
  data: DataPoint[];
}) {
  console.log('[EvolutionWorker] startEvolution called with config:', config);
  // Reset everything
  data = config.data;
  mutationRate = config.mutationRate;
  generation = 0;
  fitnessHistory = [];
  milestones = [];
  lastMilestoneMSE = Infinity;
  lastBestMSE = Infinity;
  stagnationCounter = 0;
  adaptiveMutationCounter = 0;
  bestEverMSE = Infinity;
  bestEverGeneration = 0;
  isRunning = true;
  isPaused = false;

  // Generate initial population (this is the slow part but it's off-thread now)
  console.log('[EvolutionWorker] Generating initial population...');
  population = generatePopulation(config.populationSize, data);
  console.log(`[EvolutionWorker] Population generated. First best MSE: ${population[0]?.fitness}`);

  // Send initial progress
  sendProgress();

  console.log('[EvolutionWorker] Starting runLoop...');
  // Start the loop
  runLoop();
}

// ── Main evolution loop ──────────────────────────────────────

function runLoop() {
  if (!isRunning) return;

  if (isPaused) {
    setTimeout(runLoop, 100);
    return;
  }

  // Run multiple generations per tick (we're off-thread, so we can batch)
  const GENS_PER_TICK = 10;

  for (let i = 0; i < GENS_PER_TICK; i++) {
    if (!isRunning) return;

    // ── Stagnation & Adaptive Mutation ──
    let currentMutationRate = mutationRate;
    const currentBestMSE = population[0]?.fitness ?? Infinity;

    if (adaptiveMutationCounter > 0) {
      currentMutationRate = 0.80;
      adaptiveMutationCounter--;
    } else {
      if (lastBestMSE !== Infinity) {
        const improvement = (lastBestMSE - currentBestMSE) / lastBestMSE;
        if (improvement < 0.01) {
          stagnationCounter++;
        } else {
          stagnationCounter = 0;
        }
      }
      if (stagnationCounter >= 15) {
        adaptiveMutationCounter = 5;
        stagnationCounter = 0;
        currentMutationRate = 0.80;
      }
    }
    lastBestMSE = currentBestMSE;

    // ── Evolve ──
    // Only run the expensive mathjs CAS simplification every 5th generation
    const doSimplify = generation % 5 === 0;
    population = evolveOneGeneration(population, data, currentMutationRate, doSimplify);
    generation++;

    // ── Track fitness ──
    const bestMSE = population[0]?.fitness ?? 0;
    fitnessHistory.push(bestMSE);
    if (fitnessHistory.length > 150) fitnessHistory.shift();

    // ── Milestones ──
    if (bestMSE < lastMilestoneMSE * 0.90) {
      lastMilestoneMSE = bestMSE;
      milestones.push({
        gen: generation,
        mse: bestMSE,
        eq: astToString(population[0].tree),
      });
    }

    // ── Early stopping: track best-ever ──
    if (bestMSE < bestEverMSE - 0.005) { // Needs a 0.005 improvement to reset patience
      bestEverMSE = bestMSE;
      bestEverGeneration = generation;
    }
    const gensWithoutImprovement = generation - bestEverGeneration;

    // ── Stopping conditions ──
    const shouldStop = generation >= MAX_GENERATIONS
      || bestMSE <= CONVERGENCE_MSE
      || gensWithoutImprovement >= EARLY_STOP_PATIENCE;

    if (shouldStop) {
      let reason: string;
      if (bestMSE <= CONVERGENCE_MSE) {
        reason = `Converged! MSE ${bestMSE.toFixed(6)} <= ${CONVERGENCE_MSE}`;
      } else if (gensWithoutImprovement >= EARLY_STOP_PATIENCE) {
        reason = `Early stop: no improvement in ${EARLY_STOP_PATIENCE} generations (best: ${bestEverMSE.toFixed(5)})`;
      } else {
        reason = `Hit max generations (${MAX_GENERATIONS})`;
      }
      console.log(`[EvolutionWorker] Stopped at gen ${generation}: ${reason}`);
      sendProgress(true); // isFinal = true
      self.postMessage({
        type: 'done',
        converged: bestMSE <= CONVERGENCE_MSE || gensWithoutImprovement >= EARLY_STOP_PATIENCE,
      });
      isRunning = false;
      return;
    }
  }

  // Send progress update
  sendProgress();

  // Yield and continue
  setTimeout(runLoop, 0);
}

// ── Send progress to main thread ─────────────────────────────

function sendProgress(isFinal: boolean = false) {
  // Send top 6 trees for rendering (structured clone handles plain objects)
  const topIndividuals = population.slice(0, 6).map(ind => ({
    tree: ind.tree,
    fitness: ind.fitness,
  }));

  let bestEquationStr = '';
  let simplificationSteps: string[] = [];
  if (population[0]) {
    const rawStr = astToString(population[0].tree);
    if (isFinal) {
      console.log('[EvolutionWorker] Expanding final equation...');
      simplificationSteps.push(`y = ${rawStr}`); // 1. Raw equation from genetic algorithm
      
      // We can also show the mathjs un-rationalized simplified form if it's different
      try {
        const mathNode = parse(rawStr.replace(/π/g, 'pi').replace(/\bln\(/g, 'log('));
        const midStep = simplify(mathNode, {}, { exactFractions: false }).toString();
        if (midStep !== rawStr && midStep !== bestEquationStr) {
           simplificationSteps.push(`y = ${midStep}`); // 2. Basic algebraic simplification
        }
      } catch (e) {}

      const expandedTree = expandAST(population[0].tree);
      bestEquationStr = `y = ${astToString(expandedTree)}`;
      
      if (!simplificationSteps.includes(bestEquationStr)) {
          simplificationSteps.push(bestEquationStr); // 3. Fully expanded and rounded
      }

      // Also update the tree in the UI so the derivation history shows the expanded form
      topIndividuals[0].tree = expandedTree;
    } else {
      bestEquationStr = `y = ${rawStr}`;
    }
  }

  self.postMessage({
    type: 'progress',
    generation,
    bestMSE: population[0]?.fitness ?? 0,
    bestEquation: bestEquationStr,
    topIndividuals,
    fitnessHistory: [...fitnessHistory],
    milestones: [...milestones],
    simplificationSteps,
    adapting: adaptiveMutationCounter > 0,
  });
}
