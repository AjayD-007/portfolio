export class Matrix {
  rows: number;
  cols: number;
  data: number[];

  constructor(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
    this.data = new Array(rows * cols).fill(0);
  }

  get(i: number, j: number): number {
    return this.data[i * this.cols + j];
  }

  set(i: number, j: number, v: number) {
    this.data[i * this.cols + j] = v;
  }

  static zeros(rows: number, cols: number): Matrix {
    return new Matrix(rows, cols);
  }

  static randn(rows: number, cols: number, std: number = 0.01): Matrix {
    const m = new Matrix(rows, cols);
    for (let i = 0; i < m.data.length; i++) {
      // Box-Muller transform for normal distribution
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      m.data[i] = num * std;
    }
    return m;
  }

  add(other: Matrix): Matrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error(`Dimension mismatch in add: ${this.rows}x${this.cols} + ${other.rows}x${other.cols}`);
    }
    const res = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.data.length; i++) {
      res.data[i] = this.data[i] + other.data[i];
    }
    return res;
  }

  // In-place addition (useful for accumulating gradients)
  addInPlace(other: Matrix) {
    for (let i = 0; i < this.data.length; i++) {
      this.data[i] += other.data[i];
    }
  }

  static dot(A: Matrix, B: Matrix): Matrix {
    if (A.cols !== B.rows) {
      throw new Error(`Dimension mismatch in dot: ${A.rows}x${A.cols} * ${B.rows}x${B.cols}`);
    }
    const res = new Matrix(A.rows, B.cols);
    for (let i = 0; i < A.rows; i++) {
      for (let j = 0; j < B.cols; j++) {
        let sum = 0;
        for (let k = 0; k < A.cols; k++) {
          sum += A.get(i, k) * B.get(k, j);
        }
        res.set(i, j, sum);
      }
    }
    return res;
  }

  tanh(): Matrix {
    const res = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.data.length; i++) {
      res.data[i] = Math.tanh(this.data[i]);
    }
    return res;
  }

  // Derivative of tanh for backprop
  dtanh(): Matrix {
    const res = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.data.length; i++) {
      const val = this.data[i];
      res.data[i] = 1 - val * val; // if this matrix is already tanh(x)
    }
    return res;
  }

  // Element-wise multiplication
  mul(other: Matrix): Matrix {
    const res = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.data.length; i++) res.data[i] = this.data[i] * other.data[i];
    return res;
  }
  
  // Scalar multiplication
  mulScalar(v: number): Matrix {
    const res = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.data.length; i++) res.data[i] = this.data[i] * v;
    return res;
  }

  // In-place update using Adagrad
  // mem = mem + grad * grad
  // param = param - learning_rate * grad / sqrt(mem + 1e-8)
  adagradUpdate(grad: Matrix, mem: Matrix, learningRate: number) {
    for (let i = 0; i < this.data.length; i++) {
      mem.data[i] += grad.data[i] * grad.data[i];
      this.data[i] -= learningRate * grad.data[i] / Math.sqrt(mem.data[i] + 1e-8);
    }
  }

  clip(min: number, max: number) {
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i] < min) this.data[i] = min;
      if (this.data[i] > max) this.data[i] = max;
    }
  }

  clone(): Matrix {
    const m = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.data.length; i++) m.data[i] = this.data[i];
    return m;
  }

  transpose(): Matrix {
    const m = new Matrix(this.cols, this.rows);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        m.set(j, i, this.get(i, j));
      }
    }
    return m;
  }

  static softmax(A: Matrix): Matrix {
    const res = new Matrix(A.rows, A.cols);
    let max = -Infinity;
    for (let i = 0; i < A.data.length; i++) {
      if (A.data[i] > max) max = A.data[i];
    }
    
    let sum = 0;
    for (let i = 0; i < A.data.length; i++) {
      res.data[i] = Math.exp(A.data[i] - max); // stability
      sum += res.data[i];
    }
    for (let i = 0; i < res.data.length; i++) {
      res.data[i] /= sum;
    }
    return res;
  }
}
