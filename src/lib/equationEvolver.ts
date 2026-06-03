// ─────────────────────────────────────────────────────────────
//  equationEvolver.ts — Genetic Symbolic Regression Engine
//  Pure TypeScript, zero React dependencies.
// ─────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────

export type BinOp = '+' | '-' | '*' | '/' | '^';
export type UnaryOp = 'sin' | 'cos';

export interface NumNode   { type: 'num';     value: number; }
export interface VarNode   { type: 'var'; }
export interface BinNode   { type: 'binop';   op: BinOp;   left: ASTNode; right: ASTNode; }
export interface UnaryNode { type: 'unaryop'; op: UnaryOp; child: ASTNode; }

export type ASTNode = NumNode | VarNode | BinNode | UnaryNode;

export interface DataPoint { x: number; y: number; }

export interface Individual {
  tree: ASTNode;
  fitness: number; // MSE — lower is better
}

// ── Constants ────────────────────────────────────────────────

const BIN_OPS: BinOp[] = ['+', '-', '*', '/', '^'];
const UNARY_OPS: UnaryOp[] = ['sin', 'cos'];
const MAX_DEPTH = 6;
const FITNESS_PENALTY = 1e8; // for NaN / Infinity results
const ELITISM_COUNT = 2;
const TOURNAMENT_K = 3;

// ── Random helpers ───────────────────────────────────────────

function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: readonly T[]): T {
  return arr[randInt(arr.length)];
}

// ── AST Generation ───────────────────────────────────────────

/** Generate a random constant in a useful range */
function randomConstant(): number {
  // Mix of integers and floats for variety
  if (Math.random() < 0.3) {
    return Math.floor(randFloat(-5, 6)); // integers -5..5
  }
  return parseFloat(randFloat(-5, 5).toFixed(2));
}

/**
 * Build a random AST using the "grow" method.
 * Terminals (num/var) become more likely as depth increases.
 */
export function randomTree(maxDepth: number = MAX_DEPTH, depth: number = 0): ASTNode {
  // Force terminal at max depth
  if (depth >= maxDepth) {
    return Math.random() < 0.5
      ? { type: 'var' }
      : { type: 'num', value: randomConstant() };
  }

  // Increasing chance of terminal as we go deeper
  const terminalProb = depth / maxDepth;
  if (Math.random() < terminalProb) {
    return Math.random() < 0.5
      ? { type: 'var' }
      : { type: 'num', value: randomConstant() };
  }

  // Otherwise grow a branch
  if (Math.random() < 0.2) {
    // Unary op (sin / cos) — less frequent
    return {
      type: 'unaryop',
      op: pick(UNARY_OPS),
      child: randomTree(maxDepth, depth + 1),
    };
  }

  return {
    type: 'binop',
    op: pick(BIN_OPS),
    left: randomTree(maxDepth, depth + 1),
    right: randomTree(maxDepth, depth + 1),
  };
}

// ── AST Evaluation ───────────────────────────────────────────

/** Evaluate the AST for a given x. Protected division and clamped power. */
export function evaluateAST(node: ASTNode, x: number): number {
  switch (node.type) {
    case 'num':
      return node.value;
    case 'var':
      return x;
    case 'unaryop': {
      const c = evaluateAST(node.child, x);
      if (!isFinite(c)) return c;
      return node.op === 'sin' ? Math.sin(c) : Math.cos(c);
    }
    case 'binop': {
      const l = evaluateAST(node.left, x);
      const r = evaluateAST(node.right, x);
      if (!isFinite(l) || !isFinite(r)) return NaN;
      switch (node.op) {
        case '+': return l + r;
        case '-': return l - r;
        case '*': return l * r;
        case '/': return Math.abs(r) < 1e-10 ? 1.0 : l / r; // protected
        case '^': {
          const exp = Math.max(-5, Math.min(5, r)); // clamp exponent
          const result = Math.pow(Math.abs(l), exp);
          return l < 0 && Math.abs(exp % 1) < 1e-10 && exp % 2 !== 0
            ? -result
            : result;
        }
      }
    }
  }
}

// ── AST → String ─────────────────────────────────────────────

/** Pretty-print an AST to a human-readable equation string. */
export function astToString(node: ASTNode): string {
  switch (node.type) {
    case 'num': {
      const v = node.value;
      // Tidy up presentation cleanly (e.g. 2.34 instead of 2.34159, no trailing zeros)
      return parseFloat(v.toFixed(2)).toString();
    }
    case 'var':
      return 'x';
    case 'unaryop':
      return `${node.op}(${astToString(node.child)})`;
    case 'binop': {
      const ls = astToString(node.left);
      const rs = astToString(node.right);
      const op = node.op;
      // Simplification passes
      if (op === '+' && rs === '0') return ls;
      if (op === '+' && ls === '0') return rs;
      if (op === '-' && rs === '0') return ls;
      if (op === '*' && rs === '1') return ls;
      if (op === '*' && ls === '1') return rs;
      if (op === '*' && (rs === '0' || ls === '0')) return '0';
      if (op === '/' && rs === '1') return ls;
      if (op === '^' && rs === '1') return ls;
      if (op === '^' && rs === '0') return '1';
      return `(${ls} ${op} ${rs})`;
    }
  }
}

// ── Fitness ──────────────────────────────────────────────────

/** Mean Squared Error plus parsimony pressure. */
export function fitness(tree: ASTNode, data: DataPoint[]): number {
  if (data.length === 0) return FITNESS_PENALTY;
  let sumSqErr = 0;
  for (let i = 0; i < data.length; i++) {
    const predicted = evaluateAST(tree, data[i].x);
    if (!isFinite(predicted)) return FITNESS_PENALTY;
    const err = predicted - data[i].y;
    sumSqErr += err * err;
  }
  const mse = sumSqErr / data.length;
  
  // Parsimony pressure: penalize larger trees to prevent bloat
  const PARSIMONY_COEFFICIENT = 0.05;
  const sizePenalty = countNodes(tree) * PARSIMONY_COEFFICIENT;
  
  return mse + sizePenalty;
}

// ── Deep clone ───────────────────────────────────────────────

export function cloneTree(node: ASTNode): ASTNode {
  switch (node.type) {
    case 'num':
      return { type: 'num', value: node.value };
    case 'var':
      return { type: 'var' };
    case 'unaryop':
      return { type: 'unaryop', op: node.op, child: cloneTree(node.child) };
    case 'binop':
      return {
        type: 'binop',
        op: node.op,
        left: cloneTree(node.left),
        right: cloneTree(node.right),
      };
  }
}

// ── Tree traversal helpers ───────────────────────────────────

/** Count total nodes in a tree */
export function countNodes(node: ASTNode): number {
  switch (node.type) {
    case 'num':
    case 'var':
      return 1;
    case 'unaryop':
      return 1 + countNodes(node.child);
    case 'binop':
      return 1 + countNodes(node.left) + countNodes(node.right);
  }
}

/** Get the node at a given index (pre-order traversal). */
function getNode(node: ASTNode, targetIdx: number): { node: ASTNode; idx: number } {
  let currentIdx = 0;

  function walk(n: ASTNode): ASTNode | null {
    if (currentIdx === targetIdx) { currentIdx++; return n; }
    currentIdx++;
    switch (n.type) {
      case 'num':
      case 'var':
        return null;
      case 'unaryop':
        return walk(n.child);
      case 'binop': {
        const lr = walk(n.left);
        if (lr) return lr;
        return walk(n.right);
      }
    }
  }

  const result = walk(node);
  return { node: result ?? node, idx: currentIdx };
}

/** Replace the node at a given index with a replacement subtree. Returns a new tree. */
function replaceNode(root: ASTNode, targetIdx: number, replacement: ASTNode): ASTNode {
  let currentIdx = 0;

  function walk(n: ASTNode): ASTNode {
    if (currentIdx === targetIdx) { currentIdx++; return cloneTree(replacement); }
    currentIdx++;
    switch (n.type) {
      case 'num':
        return { type: 'num', value: n.value };
      case 'var':
        return { type: 'var' };
      case 'unaryop':
        return { type: 'unaryop', op: n.op, child: walk(n.child) };
      case 'binop':
        return { type: 'binop', op: n.op, left: walk(n.left), right: walk(n.right) };
    }
  }

  return walk(root);
}

// ── Crossover ────────────────────────────────────────────────

/**
 * Subtree crossover: picks a random node from each parent and swaps them.
 * Returns two children.
 */
export function crossover(parentA: ASTNode, parentB: ASTNode): [ASTNode, ASTNode] {
  const sizeA = countNodes(parentA);
  const sizeB = countNodes(parentB);

  const idxA = randInt(sizeA);
  const idxB = randInt(sizeB);

  const subtreeA = getNode(parentA, idxA).node;
  const subtreeB = getNode(parentB, idxB).node;

  const childA = replaceNode(parentA, idxA, subtreeB);
  const childB = replaceNode(parentB, idxB, subtreeA);

  return [childA, childB];
}

// ── Mutation ─────────────────────────────────────────────────

/** Point mutation: randomly alter a single node. */
export function mutate(tree: ASTNode, rate: number): ASTNode {
  function walk(n: ASTNode, depth: number): ASTNode {
    if (Math.random() >= rate) {
      // No mutation at this node — recurse into children
      switch (n.type) {
        case 'num':
        case 'var':
          return n;
        case 'unaryop':
          return { type: 'unaryop', op: n.op, child: walk(n.child, depth + 1) };
        case 'binop':
          return {
            type: 'binop',
            op: n.op,
            left: walk(n.left, depth + 1),
            right: walk(n.right, depth + 1),
          };
      }
    }

    // ── Mutation triggered at this node ──
    const r = Math.random();

    // ── Pruning Mutation (5% chance) ──
    // Replace an operator with one of its children to shrink the tree
    if (r < 0.05 && (n.type === 'binop' || n.type === 'unaryop')) {
      if (n.type === 'unaryop') {
        return walk(n.child, depth + 1);
      } else {
        return Math.random() < 0.5 ? walk(n.left, depth + 1) : walk(n.right, depth + 1);
      }
    }

    if (r < 0.25) {
      // Replace with entirely new random subtree (limited depth)
      return randomTree(Math.min(3, MAX_DEPTH - depth), 0);
    }

    if (r < 0.50 && n.type === 'num') {
      // Nudge the constant
      return { type: 'num', value: parseFloat((n.value + randFloat(-2, 2)).toFixed(2)) };
    }

    if (r < 0.70 && n.type === 'binop') {
      // Swap the operator
      return {
        type: 'binop',
        op: pick(BIN_OPS),
        left: walk(n.left, depth + 1),
        right: walk(n.right, depth + 1),
      };
    }

    if (r < 0.85 && n.type === 'unaryop') {
      return {
        type: 'unaryop',
        op: pick(UNARY_OPS),
        child: walk(n.child, depth + 1),
      };
    }

    // ── Radical mutation for terminals ──
    // Allow replacing a terminal with a new subtree (e.g., sin(x))
    if (n.type === 'var' || n.type === 'num') {
      // 30% chance to radically alter the terminal
      if (Math.random() < 0.3) {
        return randomTree(Math.min(2, MAX_DEPTH - depth), 0);
      }
    }

    // Swap between var and num
    if (n.type === 'var') {
      return { type: 'num', value: randomConstant() };
    }
    if (n.type === 'num') {
      return { type: 'var' };
    }

    return n;
  }

  return walk(cloneTree(tree), 0);
}

// ── Selection ────────────────────────────────────────────────

/** Tournament selection: pick k random individuals, return the fittest. */
function tournamentSelect(population: Individual[], k: number = TOURNAMENT_K): Individual {
  let best: Individual | null = null;
  for (let i = 0; i < k; i++) {
    const candidate = population[randInt(population.length)];
    if (!best || candidate.fitness < best.fitness) {
      best = candidate;
    }
  }
  return best!;
}

// ── Population ───────────────────────────────────────────────

/** Generate a random initial population and score each individual. */
export function generatePopulation(
  size: number,
  data: DataPoint[],
  maxDepth: number = MAX_DEPTH,
): Individual[] {
  const pop: Individual[] = [];
  for (let i = 0; i < size; i++) {
    const tree = randomTree(maxDepth);
    pop.push({ tree, fitness: fitness(tree, data) });
  }
  pop.sort((a, b) => a.fitness - b.fitness);
  return pop;
}

// ── Evolution ────────────────────────────────────────────────

/**
 * Run one full generational cycle:
 * selection → crossover → mutation → elitism.
 * Returns new population sorted by fitness.
 */
export function evolveOneGeneration(
  population: Individual[],
  data: DataPoint[],
  mutationRate: number,
): Individual[] {
  const size = population.length;
  const nextGen: Individual[] = [];

  // ── Elitism: top individuals survive unchanged ──
  for (let i = 0; i < ELITISM_COUNT && i < size; i++) {
    nextGen.push({
      tree: cloneTree(population[i].tree),
      fitness: population[i].fitness,
    });
  }

  // ── Fill the rest via crossover + mutation ──
  while (nextGen.length < size) {
    const parentA = tournamentSelect(population, 4); // Use k=4 for higher diversity
    const parentB = tournamentSelect(population, 4);

    let [childTreeA, childTreeB] = crossover(parentA.tree, parentB.tree);

    childTreeA = mutate(childTreeA, mutationRate);
    childTreeB = mutate(childTreeB, mutationRate);

    nextGen.push({ tree: childTreeA, fitness: fitness(childTreeA, data) });
    if (nextGen.length < size) {
      nextGen.push({ tree: childTreeB, fitness: fitness(childTreeB, data) });
    }
  }

  nextGen.sort((a, b) => a.fitness - b.fitness);
  return nextGen;
}

// ── Sample data generators ───────────────────────────────────

export function generateNoisyQuadratic(n: number = 30): DataPoint[] {
  const points: DataPoint[] = [];
  for (let i = 0; i < n; i++) {
    const x = parseFloat(randFloat(-5, 5).toFixed(2));
    const y = parseFloat((0.5 * x * x + 0.3 * x - 1 + randFloat(-1, 1)).toFixed(2));
    points.push({ x, y });
  }
  return points.sort((a, b) => a.x - b.x);
}

export function generateNoisySine(n: number = 30): DataPoint[] {
  const points: DataPoint[] = [];
  for (let i = 0; i < n; i++) {
    const x = parseFloat(randFloat(-Math.PI * 2, Math.PI * 2).toFixed(2));
    const y = parseFloat((2 * Math.sin(x) + randFloat(-0.5, 0.5)).toFixed(2));
    points.push({ x, y });
  }
  return points.sort((a, b) => a.x - b.x);
}

export function generateNoisyLinear(n: number = 30): DataPoint[] {
  const points: DataPoint[] = [];
  for (let i = 0; i < n; i++) {
    const x = parseFloat(randFloat(-5, 5).toFixed(2));
    const y = parseFloat((2.5 * x + 1.2 + randFloat(-1, 1)).toFixed(2));
    points.push({ x, y });
  }
  return points.sort((a, b) => a.x - b.x);
}

/** Convert data points to CSV string for the textarea */
export function dataToCSV(data: DataPoint[]): string {
  return data.map(p => `${p.x}, ${p.y}`).join('\n');
}

/** Parse CSV string to data points */
export function parseCSV(csv: string): DataPoint[] {
  const points: DataPoint[] = [];
  const lines = csv.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split(/[,\s\t]+/);
    if (parts.length >= 2) {
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      if (isFinite(x) && isFinite(y)) {
        points.push({ x, y });
      }
    }
  }
  if (points.length <= 150) {
    return points;
  }
  
  // Uniformly sample down to 150 points to prevent thread locking
  const sampled: DataPoint[] = [];
  const step = points.length / 150;
  for (let i = 0; i < 150; i++) {
    sampled.push(points[Math.floor(i * step)]);
  }
  return sampled;
}
