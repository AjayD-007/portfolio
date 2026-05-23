import { RNN } from '../lib/ml/rnn';
import { Matrix } from '../lib/ml/matrix';

let rnn: RNN | null = null;
let charToIndex: Record<string, number> = {};
let indexToChar: Record<number, string> = {};
let data: number[] = [];
let vocabSize = 0;
let isTraining = false;

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'INIT') {
    const { text, hiddenSize = 64 } = payload;
    
    // Build vocabulary
    const chars = Array.from(new Set(text.split(''))).sort() as string[];
    vocabSize = chars.length;
    
    charToIndex = {};
    indexToChar = {};
    chars.forEach((ch: string, i: number) => {
      charToIndex[ch] = i;
      indexToChar[i] = ch;
    });

    data = text.split('').map((ch: string) => charToIndex[ch]);
    
    rnn = new RNN(hiddenSize, vocabSize);
    isTraining = false;
    
    self.postMessage({ type: 'INIT_DONE', payload: { vocabSize } });
  }

  if (type === 'STOP') {
    isTraining = false;
  }

  if (type === 'TRAIN') {
    if (!rnn || data.length === 0) return;
    isTraining = true;
    
    const { learningRate = 0.1, seqLength = 25, temperature = 1.0 } = payload;
    let p = 0;
    let hprev = Matrix.zeros(rnn!.hiddenSize, 1);
    let smoothLoss = -Math.log(1.0 / vocabSize) * seqLength;
    let iter = 0;

    const trainLoop = () => {
      if (!isTraining) return;

      // Reset pointer and hidden state if we reach end of data
      if (p + seqLength + 1 >= data.length || iter === 0) {
        hprev = Matrix.zeros(rnn!.hiddenSize, 1);
        p = 0;
      }

      const inputs = data.slice(p, p + seqLength);
      const targets = data.slice(p + 1, p + seqLength + 1);

      const [loss, h] = rnn!.step(inputs, targets, hprev, learningRate);
      hprev = h;
      smoothLoss = smoothLoss * 0.999 + loss * 0.001;

      // Report progress occasionally
      if (iter % 100 === 0) {
        // Generate a sample to show what it's learning using the specified temperature
        const sampleIxs = rnn!.sample(hprev, inputs[0] || 0, 100, temperature);
        const sampleText = sampleIxs.map((ix: number) => indexToChar[ix]).join('');
        
        self.postMessage({
          type: 'PROGRESS',
          payload: {
            iter,
            loss: smoothLoss,
            sample: sampleText
          }
        });
      }

      p += seqLength;
      iter++;

      // Use setTimeout to yield to the event loop so messages can be processed
      setTimeout(trainLoop, 0);
    };

    trainLoop();
  }

  if (type === 'GENERATE') {
    if (!rnn) return;
    const { seed = '', length = 200, temperature = 1.0 } = payload;
    
    let seedIx = 0;
    if (seed && charToIndex[seed]) {
        seedIx = charToIndex[seed];
    }
    
    const h = Matrix.zeros(rnn.hiddenSize, 1);
    const sampleIxs = rnn.sample(h, seedIx, length, temperature);
    const sampleText = sampleIxs.map((ix: number) => indexToChar[ix]).join('');
    
    self.postMessage({
      type: 'GENERATE_DONE',
      payload: { text: sampleText }
    });
  }

  if (type === 'GENERATE_STREAM') {
    if (!rnn || data.length === 0) return;
    isTraining = true;
    
    const { seed = '', length = 150, temperature = 1.0 } = payload;
    let seedIx = 0;
    if (seed && charToIndex[seed] !== undefined) {
        seedIx = charToIndex[seed];
    }

    let currentH = Matrix.zeros(rnn.hiddenSize, 1);
    const x = Matrix.zeros(rnn.vocabSize, 1);
    x.set(seedIx, 0, 1);

    let currentSeed = seedIx;
    let step = 0;

    const streamStep = () => {
      if (step >= length || !isTraining || !rnn) {
          self.postMessage({ type: 'GENERATE_STREAM_DONE' });
          return;
      }

      const t1 = Matrix.dot(rnn.Wxh, x);
      const t2 = Matrix.dot(rnn.Whh, currentH);
      currentH = t1.add(t2).add(rnn.bh).tanh();

      let y = Matrix.dot(rnn.Why, currentH).add(rnn.by);
      if (temperature !== 1.0) {
        y = y.mulScalar(1.0 / Math.max(temperature, 0.01));
      }
      const p = Matrix.softmax(y);

      // Find top 5 candidate characters and their raw probabilities
      const candidates = [];
      for (let j = 0; j < p.data.length; j++) {
        candidates.push({ char: indexToChar[j], prob: p.data[j] });
      }
      candidates.sort((a, b) => b.prob - a.prob);
      const top5 = candidates.slice(0, 5);

      // Sample character
      let r = Math.random();
      let ix = 0;
      for (let j = 0; j < p.data.length; j++) {
        r -= p.data[j];
        if (r <= 0) {
          ix = j;
          break;
        }
      }

      const nextChar = indexToChar[ix];

      self.postMessage({
        type: 'GENERATE_STREAM_CHAR',
        payload: { char: nextChar, top5 }
      });

      x.set(currentSeed, 0, 0);
      x.set(ix, 0, 1);
      currentSeed = ix;
      step++;

      setTimeout(streamStep, 60); // 60ms delay creates a beautiful, readable stream speed
    };

    streamStep();
  }

  if (type === 'GET_WEIGHTS') {
    if (!rnn) return;
    self.postMessage({
      type: 'GET_WEIGHTS_DONE',
      payload: {
        Wxh: rnn.Wxh.data,
        Whh: rnn.Whh.data,
        Why: rnn.Why.data,
        bh: rnn.bh.data,
        by: rnn.by.data,
        vocab: indexToChar
      }
    });
  }
};
