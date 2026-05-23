import { Matrix } from './matrix';

export class RNN {
  hiddenSize: number;
  vocabSize: number;
  
  // Model parameters
  Wxh: Matrix; // input to hidden
  Whh: Matrix; // hidden to hidden
  Why: Matrix; // hidden to output
  bh: Matrix;  // hidden bias
  by: Matrix;  // output bias

  // Memory variables for Adagrad
  mWxh: Matrix;
  mWhh: Matrix;
  mWhy: Matrix;
  mbh: Matrix;
  mby: Matrix;

  constructor(hiddenSize: number, vocabSize: number) {
    this.hiddenSize = hiddenSize;
    this.vocabSize = vocabSize;

    this.Wxh = Matrix.randn(hiddenSize, vocabSize, 0.01);
    this.Whh = Matrix.randn(hiddenSize, hiddenSize, 0.01);
    this.Why = Matrix.randn(vocabSize, hiddenSize, 0.01);
    this.bh = Matrix.zeros(hiddenSize, 1);
    this.by = Matrix.zeros(vocabSize, 1);

    this.mWxh = Matrix.zeros(hiddenSize, vocabSize);
    this.mWhh = Matrix.zeros(hiddenSize, hiddenSize);
    this.mWhy = Matrix.zeros(vocabSize, hiddenSize);
    this.mbh = Matrix.zeros(hiddenSize, 1);
    this.mby = Matrix.zeros(vocabSize, 1);
  }

  // Forward and backward pass
  // inputs: array of integers (character indices)
  // targets: array of integers
  // hprev: initial hidden state
  step(inputs: number[], targets: number[], hprev: Matrix, learningRate: number): [number, Matrix] {
    const xs: { [key: number]: Matrix } = {};
    const hs: { [key: number]: Matrix } = {};
    const ys: { [key: number]: Matrix } = {};
    const ps: { [key: number]: Matrix } = {}; // probabilities

    hs[-1] = hprev.clone();
    let loss = 0;

    // Forward pass
    for (let t = 0; t < inputs.length; t++) {
      // One-hot encode input
      xs[t] = Matrix.zeros(this.vocabSize, 1);
      xs[t].set(inputs[t], 0, 1);

      // Hidden state update: h_t = tanh(Wxh * x_t + Whh * h_{t-1} + bh)
      const t1 = Matrix.dot(this.Wxh, xs[t]);
      const t2 = Matrix.dot(this.Whh, hs[t - 1]);
      const pre_h = t1.add(t2).add(this.bh);
      hs[t] = pre_h.tanh();

      // Output probabilities: y_t = Why * h_t + by
      ys[t] = Matrix.dot(this.Why, hs[t]).add(this.by);
      ps[t] = Matrix.softmax(ys[t]);

      // Cross-entropy loss
      loss += -Math.log(ps[t].get(targets[t], 0));
    }

    // Backward pass
    const dWxh = Matrix.zeros(this.Wxh.rows, this.Wxh.cols);
    const dWhh = Matrix.zeros(this.Whh.rows, this.Whh.cols);
    const dWhy = Matrix.zeros(this.Why.rows, this.Why.cols);
    const dbh = Matrix.zeros(this.bh.rows, this.bh.cols);
    const dby = Matrix.zeros(this.by.rows, this.by.cols);
    let dhnext = Matrix.zeros(this.hiddenSize, 1);

    for (let t = inputs.length - 1; t >= 0; t--) {
      // dy = p - target
      const dy = ps[t].clone();
      dy.set(targets[t], 0, dy.get(targets[t], 0) - 1); // Backprop into y

      // Why grad
      dWhy.addInPlace(Matrix.dot(dy, hs[t].transpose()));
      dby.addInPlace(dy);

      // Backprop into h
      const dh = Matrix.dot(this.Why.transpose(), dy).add(dhnext);
      
      // Backprop through tanh
      const dtanh = hs[t].dtanh(); // 1 - hs[t]^2
      const dhraw = dh.mul(dtanh);

      dbh.addInPlace(dhraw);
      dWxh.addInPlace(Matrix.dot(dhraw, xs[t].transpose()));
      dWhh.addInPlace(Matrix.dot(dhraw, hs[t - 1].transpose()));
      
      dhnext = Matrix.dot(this.Whh.transpose(), dhraw);
    }

    // Clip gradients to mitigate exploding gradients
    dWxh.clip(-5, 5);
    dWhh.clip(-5, 5);
    dWhy.clip(-5, 5);
    dbh.clip(-5, 5);
    dby.clip(-5, 5);

    // Adagrad parameter update
    this.Wxh.adagradUpdate(dWxh, this.mWxh, learningRate);
    this.Whh.adagradUpdate(dWhh, this.mWhh, learningRate);
    this.Why.adagradUpdate(dWhy, this.mWhy, learningRate);
    this.bh.adagradUpdate(dbh, this.mbh, learningRate);
    this.by.adagradUpdate(dby, this.mby, learningRate);

    return [loss, hs[inputs.length - 1]];
  }

  // Generate text
  sample(h: Matrix, seedIx: number, n: number, temperature: number = 1.0): number[] {
    const x = Matrix.zeros(this.vocabSize, 1);
    x.set(seedIx, 0, 1);
    
    let currentH = h.clone();
    const result = [];

    for (let i = 0; i < n; i++) {
      const t1 = Matrix.dot(this.Wxh, x);
      const t2 = Matrix.dot(this.Whh, currentH);
      currentH = t1.add(t2).add(this.bh).tanh();

      let y = Matrix.dot(this.Why, currentH).add(this.by);
      
      // Scale by temperature to control randomness
      if (temperature !== 1.0) {
        y = y.mulScalar(1.0 / Math.max(temperature, 0.01));
      }

      const p = Matrix.softmax(y);

      // Sample from probability distribution
      let r = Math.random();
      let ix = 0;
      for (let j = 0; j < p.data.length; j++) {
        r -= p.data[j];
        if (r <= 0) {
          ix = j;
          break;
        }
      }

      result.push(ix);
      
      x.set(seedIx, 0, 0); // reset old one-hot
      x.set(ix, 0, 1); // set new one-hot
      seedIx = ix;
    }

    return result;
  }
}
