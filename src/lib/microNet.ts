export class MicroNet {
  vocabSize: number;
  contextWindow: number;
  hiddenSize: number;
  charToIndex: Map<string, number>;
  indexToChar: Map<number, string>;

  // Weights and Biases
  W1: number[][]; // [hiddenSize][inputSize]
  b1: number[];   // [hiddenSize]
  W2: number[][]; // [vocabSize][hiddenSize]
  b2: number[];   // [vocabSize]

  constructor(text: string, contextWindow: number = 3, hiddenSize: number = 64) {
    const uniqueChars = Array.from(new Set(text)).sort();
    this.vocabSize = uniqueChars.length;
    this.contextWindow = contextWindow;
    this.hiddenSize = hiddenSize;

    this.charToIndex = new Map();
    this.indexToChar = new Map();
    uniqueChars.forEach((c, i) => {
      this.charToIndex.set(c, i);
      this.indexToChar.set(i, c);
    });

    const inputSize = this.contextWindow * this.vocabSize;

    // Initialization (He Initialization or small random numbers)
    this.W1 = Array(hiddenSize).fill(0).map(() => Array(inputSize).fill(0).map(() => (Math.random() - 0.5) * 0.1));
    this.b1 = Array(hiddenSize).fill(0);
    this.W2 = Array(this.vocabSize).fill(0).map(() => Array(hiddenSize).fill(0).map(() => (Math.random() - 0.5) * 0.1));
    this.b2 = Array(this.vocabSize).fill(0);
  }

  // Create input vector from a context string
  encode(context: string): number[] {
    const inputSize = this.contextWindow * this.vocabSize;
    const vec = Array(inputSize).fill(0);
    
    // Pad or slice context
    let ctx = context;
    if (ctx.length > this.contextWindow) {
      ctx = ctx.slice(-this.contextWindow);
    } else if (ctx.length < this.contextWindow) {
      ctx = ctx.padStart(this.contextWindow, ' '); 
    }

    for (let i = 0; i < this.contextWindow; i++) {
      let char = ctx[i];
      if (!this.charToIndex.has(char)) {
        // Fallback or unknown
        char = this.indexToChar.get(0) || ' ';
      }
      const charIdx = this.charToIndex.get(char);
      if (charIdx !== undefined) {
          vec[i * this.vocabSize + charIdx] = 1;
      }
    }
    return vec;
  }

  forward(x: number[]): { z1: number[], a1: number[], z2: number[], a2: number[] } {
    // Hidden Layer
    const z1 = Array(this.hiddenSize).fill(0);
    for (let i = 0; i < this.hiddenSize; i++) {
      let sum = this.b1[i];
      for (let j = 0; j < x.length; j++) {
        sum += this.W1[i][j] * x[j];
      }
      z1[i] = sum;
    }
    
    // ReLU Activation
    const a1 = z1.map(val => Math.max(0, val));

    // Output Layer
    const z2 = Array(this.vocabSize).fill(0);
    for (let i = 0; i < this.vocabSize; i++) {
      let sum = this.b2[i];
      for (let j = 0; j < this.hiddenSize; j++) {
        sum += this.W2[i][j] * a1[j];
      }
      z2[i] = sum;
    }

    // Softmax
    const maxZ2 = Math.max(...z2);
    const expZ2 = z2.map(val => Math.exp(val - maxZ2));
    const sumExpZ2 = expZ2.reduce((a, b) => a + b, 0);
    const a2 = expZ2.map(val => val / sumExpZ2);

    return { z1, a1, z2, a2 };
  }

  backward(x: number[], a1: number[], a2: number[], targetChar: string, lr: number = 0.05): number {
    let targetIdx = this.charToIndex.get(targetChar);
    if (targetIdx === undefined) targetIdx = 0;

    // Cross-Entropy Loss
    const loss = -Math.log(a2[targetIdx] + 1e-10);

    // Derivative of Cross-Entropy + Softmax (dZ2 = A2 - Y)
    const dz2 = [...a2];
    dz2[targetIdx] -= 1;

    // Output weights gradients
    // dW2 = dZ2 * a1.T
    for (let i = 0; i < this.vocabSize; i++) {
      for (let j = 0; j < this.hiddenSize; j++) {
        const dw = dz2[i] * a1[j];
        this.W2[i][j] -= lr * dw;
      }
      this.b2[i] -= lr * dz2[i];
    }

    // Hidden layer gradients
    // da1 = W2.T * dZ2
    const da1 = Array(this.hiddenSize).fill(0);
    for (let i = 0; i < this.hiddenSize; i++) {
      let sum = 0;
      for (let j = 0; j < this.vocabSize; j++) {
        sum += this.W2[j][i] * dz2[j];
      }
      da1[i] = sum;
    }

    // dz1 = da1 * ReLU'(z1)
    const dz1 = Array(this.hiddenSize).fill(0);
    for (let i = 0; i < this.hiddenSize; i++) {
      dz1[i] = a1[i] > 0 ? da1[i] : 0;
    }

    // dW1 = dz1 * x.T
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < x.length; j++) {
        const dw = dz1[i] * x[j];
        this.W1[i][j] -= lr * dw;
      }
      this.b1[i] -= lr * dz1[i];
    }

    return loss;
  }

  trainStep(context: string, targetChar: string, lr: number = 0.05): { loss: number, predictions: number[] } {
    const x = this.encode(context);
    const { a1, a2 } = this.forward(x);
    const loss = this.backward(x, a1, a2, targetChar, lr);
    return { loss, predictions: a2 };
  }

  trainEpoch(text: string, lr: number = 0.05): number {
    if (text.length <= this.contextWindow) return 0;
    let totalLoss = 0;
    let steps = 0;
    
    // Append the start of the text to the end so the network learns to loop back around!
    // e.g. "magic." -> " " -> "A" -> "n" -> "y"
    const loopText = text + " " + text.slice(0, this.contextWindow);
    
    for (let i = 0; i < loopText.length - this.contextWindow; i++) {
      const context = loopText.slice(i, i + this.contextWindow);
      const targetChar = loopText[i + this.contextWindow];
      const { loss } = this.trainStep(context, targetChar, lr);
      totalLoss += loss;
      steps++;
    }
    return totalLoss / Math.max(1, steps);
  }

  predict(context: string): { char: string, prob: number } {
    const x = this.encode(context);
    const { a2 } = this.forward(x);
    let maxProb = -1;
    let maxIdx = 0;
    for (let i = 0; i < a2.length; i++) {
      if (a2[i] > maxProb) {
        maxProb = a2[i];
        maxIdx = i;
      }
    }
    return { char: this.indexToChar.get(maxIdx) || '', prob: maxProb };
  }
}
