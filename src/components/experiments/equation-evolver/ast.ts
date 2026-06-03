// ─────────────────────────────────────────────────────────────
//  ast.ts — AST types, generation, evaluation, simplification,
//           pretty-printing, and constant optimisation.
// ─────────────────────────────────────────────────────────────

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

function isNum(n: ASTNode, v: number): boolean {
  return n.type === 'num' && Math.abs(n.value - v) < 1e-10;
}

/** Recursively simplify an AST (constant folding + algebraic identities). */
export function simplifyAST(node: ASTNode): ASTNode {
  if (node.type === 'unaryop') {
    const child = simplifyAST(node.child);
    if (child.type === 'num') {
      let val: number;
      switch (node.op) {
        case 'sin':  val = Math.sin(child.value); break;
        case 'cos':  val = Math.cos(child.value); break;
        case 'ln':   val = child.value <= 0 ? NaN : Math.log(child.value); break;
        case 'sqrt': val = child.value < 0  ? NaN : Math.sqrt(child.value); break;
      }
      if (isFinite(val!)) return { type: 'num', value: parseFloat(val!.toFixed(4)) };
    }
    return { type: 'unaryop', op: node.op, child };
  }

  if (node.type === 'binop') {
    const left  = simplifyAST(node.left);
    const right = simplifyAST(node.right);

    // Constant folding
    if (left.type === 'num' && right.type === 'num') {
      const l = left.value, r = right.value;
      let val = NaN;
      switch (node.op) {
        case '+': val = l + r; break;
        case '-': val = l - r; break;
        case '*': val = l * r; break;
        case '/': val = Math.abs(r) < 1e-10 ? 1 : l / r; break;
        case '^': {
          const exp = Math.max(-5, Math.min(5, r));
          val = Math.pow(Math.abs(l), exp);
          if (l < 0 && Number.isInteger(exp) && exp % 2 !== 0) val = -val;
          break;
        }
      }
      if (isFinite(val)) return { type: 'num', value: parseFloat(val.toFixed(4)) };
    }

    // Merge additive negatives: A + (-B) → A - B and A - (-B) → A + B
    if (node.op === '+' && right.type === 'num' && right.value < 0) {
      return simplifyAST({ type: 'binop', op: '-', left, right: { type: 'num', value: -right.value } });
    }
    if (node.op === '-' && right.type === 'num' && right.value < 0) {
      return simplifyAST({ type: 'binop', op: '+', left, right: { type: 'num', value: -right.value } });
    }

    // Additive identities
    if (node.op === '+' || node.op === '-') {
      if (isNum(left,  0)) return node.op === '+' ? right : simplifyAST({ type: 'binop', op: '*', left: { type: 'num', value: -1 }, right });
      if (isNum(right, 0)) return left;
      if (node.op === '-' && isEqualAST(left, right)) return { type: 'num', value: 0 };
      if (node.op === '+' && isEqualAST(left, right)) return simplifyAST({ type: 'binop', op: '*', left: { type: 'num', value: 2 }, right });
    }

    // Multiplicative identities
    if (node.op === '*') {
      if (isNum(left,  0) || isNum(right, 0)) return { type: 'num', value: 0 };
      if (isNum(left,  1)) return right;
      if (isNum(right, 1)) return left;
      if (isNum(right, -1)) return simplifyAST({ type: 'binop', op: '*', left: right, right: left });
      if (isEqualAST(left, right)) return simplifyAST({ type: 'binop', op: '^', left, right: { type: 'num', value: 2 } });
    }

    // Division identities
    if (node.op === '/') {
      if (isNum(left,  0)) return { type: 'num', value: 0 };
      if (isNum(right, 1)) return left;
      if (isEqualAST(left, right)) return { type: 'num', value: 1 };
      // A / (1/B) → A * B
      if (right.type === 'binop' && right.op === '/' && isNum(right.left, 1)) {
        return simplifyAST({ type: 'binop', op: '*', left, right: right.right });
      }
    }

    // Power identities
    if (node.op === '^') {
      if (isNum(right, 0)) return { type: 'num', value: 1 };
      if (isNum(right, 1)) return left;
      if (isNum(left,  0)) return { type: 'num', value: 0 };
      if (isNum(left,  1)) return { type: 'num', value: 1 };
    }

    return { type: 'binop', op: node.op, left, right };
  }

  return cloneTree(node);
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