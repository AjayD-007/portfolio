// ─────────────────────────────────────────────────────────────
//  ast.ts — AST types, generation, evaluation, simplification,
//           pretty-printing, and constant optimisation.
// ─────────────────────────────────────────────────────────────

import { parse, simplify, rationalize, MathNode, SymbolNode, OperatorNode, ConstantNode, FunctionNode, ParenthesisNode } from 'mathjs';
// ── Types ────────────────────────────────────────────────────

export type BinOp  = '+' | '-' | '*' | '/' | '^';
export type UnaryOp = 'sin' | 'cos' | 'ln' | 'sqrt';

export interface NumNode   { type: 'num';     value: number; }
export interface VarNode   { type: 'var'; }
export interface BinNode   { type: 'binop';   op: BinOp;    left: ASTNode; right: ASTNode; }
export interface UnaryNode { type: 'unaryop'; op: UnaryOp;  child: ASTNode; }
export interface ConstNode { type: 'const';   name: 'pi' | 'e'; }

export type ASTNode = NumNode | VarNode | BinNode | UnaryNode | ConstNode;

export interface DataPoint { x: number; y: number; }

// ── Internal random helpers ───────────────────────────────────

function randInt(max: number): number { return Math.floor(Math.random() * max); }
export function randFloat(min: number, max: number): number { return min + Math.random() * (max - min); }
export function pick<T>(arr: readonly T[]): T { return arr[randInt(arr.length)]; }

// ── Constants ────────────────────────────────────────────────

const BIN_OPS:   readonly BinOp[]   = ['+', '-', '*', '/', '^'];
const UNARY_OPS: readonly UnaryOp[] = ['sin', 'cos', 'ln', 'sqrt'];
export const MAX_DEPTH = 6;

// ── Random constant generation ───────────────────────────────

function randomConstant(): number {
  if (Math.random() < 0.3) return Math.round(randFloat(-5, 5));
  return parseFloat(randFloat(-5, 5).toFixed(2));
}

// ── AST Generation ───────────────────────────────────────────

function randomTerminal(): ASTNode {
  const r = Math.random();
  if (r < 0.45) return { type: 'var' };
  if (r < 0.50) return { type: 'const', name: Math.random() < 0.5 ? 'pi' : 'e' };
  return { type: 'num', value: randomConstant() };
}

/** Build a random AST using the "grow" method. */
export function randomTree(maxDepth: number = MAX_DEPTH, depth: number = 0): ASTNode {
  if (depth >= maxDepth) return randomTerminal();

  const terminalProb = (depth / maxDepth) ** 1.5; // smoother curve
  if (Math.random() < terminalProb) return randomTerminal();

  if (Math.random() < 0.15) {
    return {
      type: 'unaryop',
      op: pick(UNARY_OPS),
      child: randomTree(maxDepth, depth + 1),
    };
  }

  return {
    type: 'binop',
    op: pick(BIN_OPS),
    left:  randomTree(maxDepth, depth + 1),
    right: randomTree(maxDepth, depth + 1),
  };
}

// ── AST Evaluation ───────────────────────────────────────────

/** Evaluate the AST for a given x. Protected ops throughout. */
export function evaluateAST(node: ASTNode, x: number): number {
  switch (node.type) {
    case 'num':   return node.value;
    case 'const': return node.name === 'pi' ? Math.PI : Math.E;
    case 'var':   return x;
    case 'unaryop': {
      const c = evaluateAST(node.child, x);
      if (!isFinite(c)) return NaN;
      switch (node.op) {
        case 'sin':  return Math.sin(c);
        case 'cos':  return Math.cos(c);
        case 'ln':   return c <= 0 ? NaN : Math.log(c);
        case 'sqrt': return c < 0  ? NaN : Math.sqrt(c);
      }
    }
    case 'binop': {
      const l = evaluateAST(node.left,  x);
      const r = evaluateAST(node.right, x);
      if (!isFinite(l) || !isFinite(r)) return NaN;
      switch (node.op) {
        case '+': return l + r;
        case '-': return l - r;
        case '*': return l * r;
        case '/': return Math.abs(r) < 1e-10 ? 1.0 : l / r;
        case '^': {
          const exp = Math.max(-5, Math.min(5, r));
          if (l < 0 && Math.abs(exp % 1) > 1e-10) return NaN; // fractional power of negative
          const result = Math.pow(Math.abs(l), exp);
          return l < 0 && Number.isInteger(exp) && exp % 2 !== 0 ? -result : result;
        }
      }
    }
  }
}

// ── Deep clone ───────────────────────────────────────────────

export function cloneTree(node: ASTNode): ASTNode {
  switch (node.type) {
    case 'num':     return { type: 'num',     value: node.value };
    case 'const':   return { type: 'const',   name:  node.name  };
    case 'var':     return { type: 'var' };
    case 'unaryop': return { type: 'unaryop', op: node.op, child: cloneTree(node.child) };
    case 'binop':   return { type: 'binop',   op: node.op, left: cloneTree(node.left), right: cloneTree(node.right) };
  }
}

// ── Structural helpers ───────────────────────────────────────

export function countNodes(node: ASTNode): number {
  switch (node.type) {
    case 'num': case 'const': case 'var': return 1;
    case 'unaryop': return 1 + countNodes(node.child);
    case 'binop':   return 1 + countNodes(node.left) + countNodes(node.right);
  }
}

export function isEqualAST(a: ASTNode, b: ASTNode): boolean {
  if (a.type !== b.type) return false;
  if (a.type === 'num'     && b.type === 'num')     return Math.abs(a.value - b.value) < 1e-10;
  if (a.type === 'const'   && b.type === 'const')   return a.name === b.name;
  if (a.type === 'var'     && b.type === 'var')      return true;
  if (a.type === 'unaryop' && b.type === 'unaryop') return a.op === b.op && isEqualAST(a.child, b.child);
  if (a.type === 'binop'   && b.type === 'binop')   return a.op === b.op && isEqualAST(a.left, b.left) && isEqualAST(a.right, b.right);
  return false;
}

/** Collect all numeric leaf nodes by reference (for constant tuning). */
export function collectNumNodes(node: ASTNode): NumNode[] {
  switch (node.type) {
    case 'num':     return [node];
    case 'const':   case 'var': return [];
    case 'unaryop': return collectNumNodes(node.child);
    case 'binop':   return [...collectNumNodes(node.left), ...collectNumNodes(node.right)];
  }
}

// ── Get / replace node by index ──────────────────────────────

export function getNode(root: ASTNode, targetIdx: number): ASTNode {
  let idx = 0;
  function walk(n: ASTNode): ASTNode | null {
    if (idx++ === targetIdx) return n;
    switch (n.type) {
      case 'num': case 'const': case 'var': return null;
      case 'unaryop': return walk(n.child);
      case 'binop':   return walk(n.left) ?? walk(n.right);
    }
  }
  return walk(root) ?? root;
}

export function replaceNode(root: ASTNode, targetIdx: number, replacement: ASTNode): ASTNode {
  let idx = 0;
  function walk(n: ASTNode): ASTNode {
    if (idx++ === targetIdx) return cloneTree(replacement);
    switch (n.type) {
      case 'num':     return { type: 'num',     value: n.value };
      case 'const':   return { type: 'const',   name:  n.name  };
      case 'var':     return { type: 'var' };
      case 'unaryop': return { type: 'unaryop', op: n.op, child: walk(n.child) };
      case 'binop':   return { type: 'binop',   op: n.op, left: walk(n.left), right: walk(n.right) };
    }
  }
  return walk(root);
}

// ── Algebraic simplification ─────────────────────────────────

function mathNodeToAST(node: MathNode): ASTNode {
  if ((node as any).isConstantNode) {
    return { type: 'num', value: Number((node as ConstantNode).value) };
  }
  if ((node as any).isSymbolNode) {
    const name = (node as SymbolNode).name;
    if (name === 'x') return { type: 'var' };
    if (name === 'pi' || name === 'e') return { type: 'const', name };
    return { type: 'var' };
  }
  if ((node as any).isParenthesisNode) {
    return mathNodeToAST((node as ParenthesisNode).content);
  }
  if ((node as any).isOperatorNode) {
    const opNode = node as OperatorNode;
    if (opNode.args.length === 1) {
      if (opNode.op === '-') {
        return {
          type: 'binop',
          op: '*',
          left: { type: 'num', value: -1 },
          right: mathNodeToAST(opNode.args[0])
        };
      }
      if (opNode.op === '+') return mathNodeToAST(opNode.args[0]);
    }
    if (opNode.args.length === 2) {
      return {
        type: 'binop',
        op: opNode.op as BinOp,
        left: mathNodeToAST(opNode.args[0]),
        right: mathNodeToAST(opNode.args[1])
      };
    }
  }
  if ((node as any).isFunctionNode) {
    const fnNode = node as FunctionNode;
    let fnName = fnNode.fn.name;
    if (fnName === 'log') fnName = 'ln';
    return {
      type: 'unaryop',
      op: fnName as UnaryOp,
      child: mathNodeToAST(fnNode.args[0])
    };
  }
  return { type: 'num', value: 0 };
}

/** Fast, safe algebraic simplifier that folds constants and removes trivial ops without ever hanging. */
export function fastSimplifyAST(node: ASTNode): ASTNode {
  if (node.type === 'num' || node.type === 'var' || node.type === 'const') return cloneTree(node);
  
  if (node.type === 'unaryop') {
    const child = fastSimplifyAST(node.child);
    if (child.type === 'num') {
      try {
        const val = evaluateAST({ type: 'unaryop', op: node.op, child }, 0);
        if (isFinite(val)) return { type: 'num', value: parseFloat(val.toFixed(3)) };
      } catch (e) {}
    }
    return { type: 'unaryop', op: node.op, child };
  }

  if (node.type === 'binop') {
    const left = fastSimplifyAST(node.left);
    const right = fastSimplifyAST(node.right);
    
    // Constant folding
    if (left.type === 'num' && right.type === 'num') {
      try {
        const val = evaluateAST({ type: 'binop', op: node.op, left, right }, 0);
        if (isFinite(val)) return { type: 'num', value: parseFloat(val.toFixed(3)) };
      } catch (e) {}
    }

    // Trivial identities
    if (left.type === 'num') {
      if (left.value === 0 && (node.op === '+' || node.op === '-')) return right;
      if (left.value === 0 && node.op === '*') return { type: 'num', value: 0 };
      if (left.value === 1 && node.op === '*') return right;
    }
    if (right.type === 'num') {
      if (right.value === 0 && (node.op === '+' || node.op === '-')) return left;
      if (right.value === 0 && node.op === '*') return { type: 'num', value: 0 };
      if (right.value === 1 && node.op === '*') return left;
      if (right.value === 1 && node.op === '/') return left;
      if (right.value === 1 && node.op === '^') return left;
      if (right.value === 0 && node.op === '^') return { type: 'num', value: 1 };
    }

    return { type: 'binop', op: node.op, left, right };
  }

  return cloneTree(node);
}

/** Recursively simplify an AST using mathjs for deep algebraic simplification. Use fast=true for the evolution loop to prevent hanging. */
export function simplifyAST(node: ASTNode, fast: boolean = false): ASTNode {
  if (fast) return fastSimplifyAST(node);
  try {
    let expr = astToString(node, false);
    expr = expr.replace(/\bln\(/g, 'log(');
    expr = expr.replace(/π/g, 'pi');
    
    const mathNode = parse(expr);
    const simplified = simplify(mathNode, {}, { exactFractions: false });
    return mathNodeToAST(simplified);
  } catch (e) {
    // Fallback to fast tree if mathjs fails
    return fastSimplifyAST(node);
  }
}

/** Fully expands polynomials (e.g. 2*(x-3) -> 2*x - 6) for final human-readable display using math.rationalize. */
export function expandAST(node: ASTNode): ASTNode {
  let expr = '';
  try {
    expr = astToString(node, false);
    expr = expr.replace(/\bln\(/g, 'log(');
    expr = expr.replace(/π/g, 'pi');
    
    const mathNode = parse(expr);
    // rationalize fully expands polynomials, then simplify converts huge fractions back to decimals
    const rationalized = rationalize(mathNode);
    const expanded = simplify(rationalized, {}, { exactFractions: false });
    return roundConstants(mathNodeToAST(expanded), 0.05);
  } catch (e: any) {
    console.error('[expandAST] Mathjs rationalize failed:', e.message, 'for eq:', expr);
    // Mathjs rationalize fails on non-polynomials (like sin/cos/ln)
    // Fallback to standard simplification
    return roundConstants(simplifyAST(node, false), 0.05);
  }
}

/** Round constants to nice human-readable values (integers, tenths, hundredths) if very close. */
export function roundConstants(node: ASTNode, tolerance: number = 0.05): ASTNode {
  const cloned = cloneTree(node);
  const nums = collectNumNodes(cloned);
  for (const n of nums) {
    const roundInt = Math.round(n.value);
    
    // WARNING: Do NOT aggressively snap to 0! Small coefficients (like 0.0007) are often critical
    // multipliers for x^3 or x^4. Only snap to 0 if it's microscopically small.
    if (roundInt === 0) {
      if (Math.abs(n.value) < 1e-5) {
        n.value = 0;
      }
      // If it's small but not microscopic (e.g. 0.0007), leave it alone!
      // But we still want to check if it's close to 0.1, 0.01 etc. below.
    } else if (Math.abs(n.value - roundInt) < tolerance) {
      n.value = roundInt;
      continue;
    }
    
    // Snap to nearest 0.1 if it's extremely close
    const roundTenth = Math.round(n.value * 10) / 10;
    if (Math.abs(n.value - roundTenth) < (tolerance / 2)) {
      n.value = roundTenth;
      continue;
    }

    // Snap to nearest 0.01 if it's super close
    const roundHundredth = Math.round(n.value * 100) / 100;
    if (Math.abs(n.value - roundHundredth) < (tolerance / 4)) {
      n.value = roundHundredth;
    }
  }
  return cloned;
}

// ── Constant Optimisation (Nelder–Mead on numeric leaves) ────

/**
 * After GP finds a good tree structure, do a local numerical optimisation
 * on all numeric constants in the tree to minimise MSE.
 * Uses a lightweight coordinate descent (works well for ≤ ~15 constants).
 */
export function optimiseConstants(
  tree: ASTNode,
  data: DataPoint[],
  mseOnly: (t: ASTNode) => number,
  iters: number = 200,
): ASTNode {
  const cloned = cloneTree(tree);
  const nums   = collectNumNodes(cloned); // live references into the cloned tree
  if (nums.length === 0) return cloned;

  // Coordinate descent: cycle through each constant, try ±δ and shrink
  let bestMse = mseOnly(cloned);
  let delta = 0.5;

  for (let iter = 0; iter < iters; iter++) {
    let improved = false;
    for (const leaf of nums) {
      const orig = leaf.value;
      // Try + delta
      leaf.value = orig + delta;
      const mse1 = mseOnly(cloned);
      // Try - delta
      leaf.value = orig - delta;
      const mse2 = mseOnly(cloned);

      if (mse1 < bestMse && mse1 <= mse2) {
        leaf.value = orig + delta;
        bestMse = mse1;
        improved = true;
      } else if (mse2 < bestMse) {
        leaf.value = orig - delta;
        bestMse = mse2;
        improved = true;
      } else {
        leaf.value = orig; // revert
      }
    }
    // Decay step size if no improvement
    if (!improved) delta *= 0.6;
    if (delta < 1e-6) break;
  }

  // Round constants to 3 sig figs to keep display clean
  for (const leaf of nums) {
    leaf.value = parseFloat(leaf.value.toPrecision(3));
  }

  return cloned;
}

// ── Pretty-printer ───────────────────────────────────────────

/** Operator precedence for parenthesisation decisions. */
const PRECEDENCE: Record<BinOp, number> = {
  '+': 1, '-': 1,
  '*': 2, '/': 2,
  '^': 3,
};

/** Whether an operator is right-associative. */
function isRightAssoc(op: BinOp): boolean { return op === '^'; }

/** Format a number cleanly: trim trailing zeros, avoid -0. */
function fmtNum(v: number): string {
  if (Object.is(v, -0)) return '0';
  // Use up to 4 significant figures, drop trailing zeros
  const s = parseFloat(v.toPrecision(4)).toString();
  return s;
}

function printInner(node: ASTNode, parentOp?: BinOp, isRight: boolean = false): string {
  switch (node.type) {
    case 'num':   return fmtNum(node.value);
    case 'const': return node.name === 'pi' ? 'π' : 'e';
    case 'var':   return 'x';

    case 'unaryop': {
      const inner = printInner(node.child);
      // sqrt and ln look nicer with argument in parens only if complex
      const needsParens = node.child.type === 'binop' || node.child.type === 'unaryop';
      if (node.op === 'sqrt') return `√(${inner})`;
      if (node.op === 'ln')   return `ln(${inner})`;
      return `${node.op}(${inner})`;
    }

    case 'binop': {
      const prec = PRECEDENCE[node.op];

      // Special case: unary negation rendered as -child, not (0 - child)
      if (node.op === '*' && node.left.type === 'num' && node.left.value === -1) {
        const rStr = printInner(node.right, '*');
        return `-${rStr}`;
      }

      // Coefficient × x  →  "2x" instead of "2 * x"
      if (node.op === '*' && node.right.type === 'var' && node.left.type === 'num') {
        return `${fmtNum(node.left.value)}x`;
      }
      if (node.op === '*' && node.left.type === 'var' && node.right.type === 'num') {
        return `${fmtNum(node.right.value)}x`;
      }

      // x^2 shorthand
      if (node.op === '^' && node.left.type === 'var' && node.right.type === 'num') {
        return `x^${fmtNum(node.right.value)}`;
      }

      const lStr = printInner(node.left,  node.op, false);
      const rStr = printInner(node.right, node.op, true);

      let needsParens = false;
      if (parentOp !== undefined) {
        const parentPrec = PRECEDENCE[parentOp];
        if (prec < parentPrec) {
          needsParens = true;
        } else if (prec === parentPrec) {
          // right child of left-assoc op, or left child of right-assoc op
          if (isRight  && !isRightAssoc(parentOp)) needsParens = true;
          if (!isRight &&  isRightAssoc(parentOp)) needsParens = true;
        }
      }

      // Spacing: omit spaces around * when one side is a number/var (compact coefficients)
      let expr: string;
      if (node.op === '*' && (node.left.type === 'num' || node.right.type === 'num' || node.left.type === 'var' || node.right.type === 'var')) {
        expr = `${lStr}${node.op}${rStr}`;
      } else {
        expr = `${lStr} ${node.op} ${rStr}`;
      }

      return needsParens ? `(${expr})` : expr;
    }
  }
}

/** Pretty-print an AST to a clean, human-readable equation string. */
export function astToString(node: ASTNode, simplify: boolean = true): string {
  const target = simplify ? simplifyAST(node) : node;
  return printInner(target);
}