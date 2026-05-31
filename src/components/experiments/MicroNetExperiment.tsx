"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Loader2, RefreshCw, Wand2, Eye } from 'lucide-react';
import { MicroNet } from '@/lib/microNet';

const DEFAULT_TEXT = "Any sufficiently advanced technology is indistinguishable from magic.";

export function MicroNetExperiment() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [isTraining, setIsTraining] = useState(false);
  const [hasTrained, setHasTrained] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [loss, setLoss] = useState(0);
  const [lossHistory, setLossHistory] = useState<number[]>([]);
  
  const [sandboxText, setSandboxText] = useState("");
  const [top5Probs, setTop5Probs] = useState<{char: string, prob: number}[]>([]);
  
  const [networkStats, setNetworkStats] = useState({ vocab: 0, input: 0, hidden: 0, output: 0 });

  const [slowMoState, setSlowMoState] = useState<{
    phase: 'idle' | 'forward' | 'loss' | 'backward',
    context: string,
    target: string,
    prediction: string,
    lossVal: number
  }>({ phase: 'idle', context: '', target: '', prediction: '', lossVal: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Refs for pure DOM manipulation
  const inputNodesRef = useRef<(HTMLDivElement | null)[]>([]);
  const hiddenNodesRef = useRef<(HTMLDivElement | null)[]>([]);
  const outputNodesRef = useRef<(HTMLDivElement | null)[]>([]);
  
  const netRef = useRef<MicroNet | null>(null);
  const rafRef = useRef<number | null>(null);
  
  const lossHistoryRef = useRef<number[]>([]);
  const epochRef = useRef<number>(0);
  
  // Initialize network
  const initNetwork = useCallback(() => {
    const net = new MicroNet(text, 3, 64);
    netRef.current = net;
    setEpoch(0);
    setLoss(0);
    lossHistoryRef.current = [];
    setLossHistory([]);
    epochRef.current = 0;
    setHasTrained(false);
    setSandboxText("");
    setTop5Probs([]);
    setSlowMoState({ phase: 'idle', context: '', target: '', prediction: '', lossVal: 0 });
    
    setNetworkStats({
      vocab: net.vocabSize,
      input: net.contextWindow * net.vocabSize,
      hidden: net.hiddenSize,
      output: net.vocabSize
    });
    
    // Clear styles
    [inputNodesRef, hiddenNodesRef, outputNodesRef].forEach(refArr => {
      refArr.current.forEach(node => {
        if (node) {
          node.style.backgroundColor = '';
          node.style.boxShadow = 'none';
          node.style.opacity = '0.3';
          node.style.transform = 'scale(1)';
        }
      });
    });
    
    if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [text]);

  const seedPlayground = useCallback(() => {
    if (!netRef.current) return;
    const len = text.length;
    const ctxWin = netRef.current.contextWindow;
    if (len <= ctxWin) return;
    const idx = Math.floor(Math.random() * (len - ctxWin));
    setSandboxText(text.slice(idx, idx + ctxWin));
  }, [text]);

  // Handle window resize for canvas
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.offsetWidth;
        canvasRef.current.height = containerRef.current.offsetHeight;
        drawNetwork(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [networkStats]);

  useEffect(() => {
    initNetwork();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const drawNetwork = (isBackward: boolean = false) => {
    if (!netRef.current || !canvasRef.current || !containerRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const net = netRef.current;
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    ctx.clearRect(0, 0, width, height);

    const getCenters = (nodes: (HTMLDivElement | null)[]) => {
      return nodes.map(node => {
        if (!node) return { x: 0, y: 0 };
        const rect = node.getBoundingClientRect();
        const containerRect = containerRef.current!.getBoundingClientRect();
        return {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2
        };
      });
    };

    const inCenters = getCenters(inputNodesRef.current);
    const hidCenters = getCenters(hiddenNodesRef.current);
    const outCenters = getCenters(outputNodesRef.current);

    // Calculate threshold for top 5% (or top 10% in backward so it looks busier)
    const allWeights: number[] = [];
    for (let i = 0; i < net.hiddenSize; i++) {
      for (let j = 0; j < net.contextWindow * net.vocabSize; j++) {
        allWeights.push(Math.abs(net.W1[i][j]));
      }
    }
    for (let i = 0; i < net.vocabSize; i++) {
      for (let j = 0; j < net.hiddenSize; j++) {
        allWeights.push(Math.abs(net.W2[i][j]));
      }
    }
    
    allWeights.sort((a, b) => b - a);
    const thresholdIdx = Math.floor(allWeights.length * (isBackward ? 0.10 : 0.05));
    const threshold = allWeights[thresholdIdx] || 0;

    ctx.lineWidth = isBackward ? 2.5 : 1.5;
    ctx.lineCap = "round";

    // Draw W1
    for (let i = 0; i < net.hiddenSize; i++) {
      for (let j = 0; j < net.contextWindow * net.vocabSize; j++) {
        const val = net.W1[i][j];
        if (Math.abs(val) >= threshold) {
          ctx.beginPath();
          ctx.moveTo(inCenters[j].x, inCenters[j].y);
          ctx.lineTo(hidCenters[i].x, hidCenters[i].y);
          const alpha = Math.min(1, Math.abs(val) * 3);
          
          if (isBackward) {
             ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`; // Red pulse for backprop
          } else {
             ctx.strokeStyle = val > 0 ? `rgba(6, 182, 212, ${alpha})` : `rgba(236, 72, 153, ${alpha})`;
          }
          ctx.stroke();
        }
      }
    }

    // Draw W2
    for (let i = 0; i < net.vocabSize; i++) {
      for (let j = 0; j < net.hiddenSize; j++) {
        const val = net.W2[i][j];
        if (Math.abs(val) >= threshold) {
          ctx.beginPath();
          ctx.moveTo(hidCenters[j].x, hidCenters[j].y);
          ctx.lineTo(outCenters[i].x, outCenters[i].y);
          const alpha = Math.min(1, Math.abs(val) * 3);
          if (isBackward) {
             ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
          } else {
             ctx.strokeStyle = val > 0 ? `rgba(6, 182, 212, ${alpha})` : `rgba(236, 72, 153, ${alpha})`;
          }
          ctx.stroke();
        }
      }
    }
  };

  const highlightActivations = (explicitCtx?: string, explicitX?: number[], explicitA1?: number[], explicitA2?: number[]) => {
    if (!netRef.current) return;
    const net = netRef.current;
    
    const idx = Math.floor(Math.random() * (text.length - net.contextWindow));
    const ctx = explicitCtx || text.slice(idx, idx + net.contextWindow);
    const x = explicitX || net.encode(ctx);
    
    let a1 = explicitA1;
    let a2 = explicitA2;
    
    if (!a1 || !a2) {
       const fwd = net.forward(x);
       a1 = fwd.a1;
       a2 = fwd.a2;
    }

    for (let i = 0; i < x.length; i++) {
      const node = inputNodesRef.current[i];
      if (node) {
        if (x[i] > 0) {
          node.style.backgroundColor = '#22d3ee'; // cyan-400
          node.style.boxShadow = '0 0 10px #22d3ee, 0 0 20px #22d3ee';
          node.style.opacity = '1';
          node.style.transform = 'scale(1.5)';
        } else {
          node.style.backgroundColor = '#d4d4d8'; 
          node.style.boxShadow = 'none';
          node.style.opacity = '0.3';
          node.style.transform = 'scale(1)';
        }
      }
    }

    for (let i = 0; i < a1.length; i++) {
      const node = hiddenNodesRef.current[i];
      if (node) {
        if (a1[i] > 0) {
          const intensity = Math.min(1, a1[i] * 5);
          node.style.backgroundColor = '#c084fc'; // purple-400
          node.style.boxShadow = `0 0 ${intensity * 15}px #c084fc`;
          node.style.opacity = Math.max(0.3, intensity).toString();
          node.style.transform = `scale(${1 + intensity * 0.5})`;
        } else {
          node.style.backgroundColor = '#d4d4d8';
          node.style.boxShadow = 'none';
          node.style.opacity = '0.2';
          node.style.transform = 'scale(1)';
        }
      }
    }

    let maxIdx = 0;
    let maxProb = 0;
    for (let i = 0; i < a2.length; i++) {
      if (a2[i] > maxProb) {
        maxProb = a2[i];
        maxIdx = i;
      }
      const node = outputNodesRef.current[i];
      if (node) {
        node.style.backgroundColor = '#d4d4d8';
        node.style.boxShadow = 'none';
        node.style.opacity = '0.3';
        node.style.transform = 'scale(1)';
      }
    }
    
    // Only highlight max node if we have an explicit a2 array with non-zero values
    if (maxProb > 0) {
        const maxNode = outputNodesRef.current[maxIdx];
        if (maxNode) {
          maxNode.style.backgroundColor = '#4ade80'; // green-400
          maxNode.style.boxShadow = '0 0 10px #4ade80, 0 0 20px #4ade80';
          maxNode.style.opacity = '1';
          maxNode.style.transform = 'scale(2)';
        }
    }
  };

  const highlightBackwardActivations = (targetChar: string, predictedIdx: number) => {
    if (!netRef.current) return;
    const net = netRef.current;
    const targetIdx = net.charToIndex.get(targetChar) || 0;
    
    // Highlight Target Node (Green) and Predicted Node (Red)
    for (let i = 0; i < net.vocabSize; i++) {
      const node = outputNodesRef.current[i];
      if (!node) continue;
      
      if (i === targetIdx && i === predictedIdx) {
          // It was correct
          node.style.backgroundColor = '#4ade80';
          node.style.boxShadow = '0 0 20px #4ade80';
          node.style.transform = 'scale(2.5)';
          node.style.opacity = '1';
      } else if (i === targetIdx) {
          // Should have been this
          node.style.backgroundColor = '#4ade80';
          node.style.boxShadow = '0 0 15px #4ade80';
          node.style.transform = 'scale(2)';
          node.style.opacity = '1';
      } else if (i === predictedIdx) {
          // Was wrong
          node.style.backgroundColor = '#ef4444'; // red-500
          node.style.boxShadow = '0 0 15px #ef4444';
          node.style.transform = 'scale(2)';
          node.style.opacity = '1';
      } else {
          node.style.backgroundColor = '#d4d4d8';
          node.style.boxShadow = 'none';
          node.style.opacity = '0.3';
          node.style.transform = 'scale(1)';
      }
    }
    
    // Flash hidden layer red
    for (let i = 0; i < net.hiddenSize; i++) {
      const node = hiddenNodesRef.current[i];
      if (node) {
        node.style.backgroundColor = '#ef4444';
        node.style.boxShadow = '0 0 10px #ef4444';
        node.style.opacity = '0.8';
      }
    }
  };

  const runSlowMoStep = async () => {
    if (!netRef.current || isTraining || slowMoState.phase !== 'idle') return;
    const net = netRef.current;
    
    // Pick random context
    const loopText = text + " " + text.slice(0, net.contextWindow);
    if (loopText.length <= net.contextWindow) return;
    
    const idx = Math.floor(Math.random() * (loopText.length - net.contextWindow));
    const ctx = loopText.slice(idx, idx + net.contextWindow);
    const targetChar = loopText[idx + net.contextWindow];
    
    // 1. FORWARD PASS
    setSlowMoState({ phase: 'forward', context: ctx, target: targetChar, prediction: '', lossVal: 0 });
    
    const x = net.encode(ctx);
    const { a1, a2 } = net.forward(x);
    
    let maxProb = -1;
    let maxIdx = 0;
    for (let i = 0; i < a2.length; i++) {
      if (a2[i] > maxProb) { maxProb = a2[i]; maxIdx = i; }
    }
    const predChar = net.indexToChar.get(maxIdx) || '';
    
    highlightActivations(ctx, x, a1, a2);
    drawNetwork(false);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (rafRef.current) return; // cancelled
    
    // 2. ERROR CALCULATION
    const targetIdx = net.charToIndex.get(targetChar) || 0;
    const lossVal = -Math.log(a2[targetIdx] + 1e-10);
    setSlowMoState(s => ({ ...s, phase: 'loss', prediction: predChar, lossVal }));
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (rafRef.current) return; // cancelled
    
    // 3. BACKWARD PASS
    setSlowMoState(s => ({ ...s, phase: 'backward' }));
    highlightBackwardActivations(targetChar, maxIdx);
    drawNetwork(true);
    
    // Update math
    net.backward(x, a1, a2, targetChar, 0.1); // bit higher learning rate for demo
    
    const currentEpoch = epochRef.current + 1;
    epochRef.current = currentEpoch;
    lossHistoryRef.current.push(lossVal);
    if (lossHistoryRef.current.length > 100) lossHistoryRef.current.shift();
    setEpoch(currentEpoch);
    setLoss(lossVal);
    setLossHistory([...lossHistoryRef.current]);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Clean up
    setSlowMoState({ phase: 'idle', context: '', target: '', prediction: '', lossVal: 0 });
    highlightActivations(ctx, Array(net.contextWindow * net.vocabSize).fill(0), Array(net.hiddenSize).fill(0), Array(net.vocabSize).fill(0)); 
    drawNetwork(false);
  };

  const startTraining = () => {
    if (!netRef.current || isTraining || slowMoState.phase !== 'idle') return;
    setIsTraining(true);
    setHasTrained(false);
    
    let currentEpoch = epochRef.current;
    let lastDrawTime = performance.now();
    let lastStateUpdateTime = performance.now();

    const loop = (time: number) => {
      if (!netRef.current) return;
      
      let sumLoss = 0;
      const epochsPerFrame = 5;
      for (let i = 0; i < epochsPerFrame; i++) {
        sumLoss += netRef.current.trainEpoch(text);
        currentEpoch++;
      }
      const avgLoss = sumLoss / epochsPerFrame;
      epochRef.current = currentEpoch;
      
      lossHistoryRef.current.push(avgLoss);
      if (lossHistoryRef.current.length > 100) {
        lossHistoryRef.current.shift();
      }

      if (time - lastStateUpdateTime > 100) {
        setEpoch(currentEpoch);
        setLoss(avgLoss);
        setLossHistory([...lossHistoryRef.current]);
        lastStateUpdateTime = time;
      }

      // Draw and highlight less frequently for visual clarity (every 100ms)
      if (time - lastDrawTime > 100) {
        drawNetwork(false);
        highlightActivations();
        lastDrawTime = time;
      }

      if (currentEpoch < 1000) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        setIsTraining(false);
        if (!hasTrained) seedPlayground();
        setHasTrained(true);
        setEpoch(currentEpoch);
        setLoss(avgLoss);
        setLossHistory([...lossHistoryRef.current]);
        drawNetwork(false);
        
        // --- DEBUG DUMP ---
        console.log("=== TRAINING COMPLETE DEBUG DUMP ===");
        console.log("Final Epoch:", currentEpoch);
        console.log("Final Loss:", avgLoss);
        
        const testContexts = ["Any", "tec", "mag", "gy "];
        testContexts.forEach(ctx => {
          if (!netRef.current) return;
          const { char, prob } = netRef.current.predict(ctx);
          console.log(`Predict for "${ctx}": top char = "${char}" with prob = ${prob.toFixed(4)}`);
        });
        console.log("====================================");
      }
    };

    rafRef.current = requestAnimationFrame(loop);
  };

  const stopTraining = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setIsTraining(false);
    if (!hasTrained) seedPlayground();
    setHasTrained(true);
    drawNetwork(false);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);
  
  // Interactive Sandbox
  useEffect(() => {
    if (!hasTrained || !netRef.current) return;
    const net = netRef.current;
    
    const x = net.encode(sandboxText);
    const { a2 } = net.forward(x);
    
    const probs = a2.map((prob, i) => ({
        char: net.indexToChar.get(i) || '',
        prob
    })).sort((a, b) => b.prob - a.prob).slice(0, 5);
    
    setTop5Probs(probs);
    console.log(`[PLAYGROUND] Context updated. Sees: "${sandboxText.slice(-3)}" -> Top 5:`, probs);
    
  }, [sandboxText, hasTrained]);

  const generateNext = () => {
    if (!netRef.current || top5Probs.length === 0) return;
    const nextChar = top5Probs[0].char;
    console.log(`[GENERATE] Picked character: "${nextChar}"`);
    setSandboxText(prev => prev + nextChar);
  };

  const renderGraph = () => {
    if (lossHistory.length < 2) return null;
    const width = 500;
    const height = 100;
    const maxVal = Math.max(...lossHistory);
    const minVal = Math.min(...lossHistory);
    const delta = maxVal - minVal || 1;

    const points = lossHistory.map((val, idx) => {
      const x = (idx / (lossHistory.length - 1)) * width;
      const y = height - 10 - ((val - minVal) / delta) * (height - 20);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-cyan-500/30">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="currentColor" strokeDasharray="3,3" strokeWidth="0.75" />
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={points}
          className="text-cyan-400 drop-shadow-md"
        />
      </svg>
    );
  };

  return (
    <div className="w-full space-y-8 pb-12 text-black dark:text-white">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Controls & Metrics */}
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-4">
            <h2 className="text-base font-extrabold uppercase tracking-wider border-b-2 border-neutral-300 dark:border-white/20 pb-2 flex items-center gap-2">
              <span className="bg-black dark:bg-white text-white dark:text-black w-5 h-5 rounded flex items-center justify-center text-xs">1</span>
              Corpus & Configuration
            </h2>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isTraining || slowMoState.phase !== 'idle'}
              className="w-full h-32 p-3 text-sm rounded bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-white/20 placeholder:text-neutral-500 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 disabled:opacity-50 resize-none font-mono shadow-sm transition-colors"
            />
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={initNetwork}
                disabled={isTraining || slowMoState.phase !== 'idle' || !text.trim()}
                className="col-span-1 flex items-center justify-center gap-2 bg-neutral-200 dark:bg-white/10 text-black dark:text-white py-2 rounded text-xs font-bold hover:bg-neutral-300 dark:hover:bg-white/20 transition-all border border-neutral-300 dark:border-white/20"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Rebuild
              </button>
              
              {isTraining ? (
                <button
                  onClick={stopTraining}
                  className="col-span-2 flex items-center justify-center gap-2 bg-pink-500 text-white py-2 rounded text-xs font-bold hover:bg-pink-600 transition-all shadow-[0_0_15px_rgba(236,72,153,0.5)] border border-pink-500"
                >
                  <Square className="w-3.5 h-3.5 fill-current" /> Stop Training
                </button>
              ) : (
                <>
                  <button
                    onClick={runSlowMoStep}
                    disabled={!netRef.current || epoch >= 1000 || slowMoState.phase !== 'idle'}
                    className={`col-span-1 flex items-center justify-center gap-1.5 bg-indigo-500 text-white py-2 rounded text-xs font-bold disabled:opacity-30 hover:bg-indigo-400 transition-all border border-indigo-400 ${epoch === 0 && slowMoState.phase === 'idle' ? 'shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''}`}
                  >
                    <Eye className="w-3.5 h-3.5" /> Step
                  </button>
                  <button
                    onClick={startTraining}
                    disabled={!netRef.current || epoch >= 1000 || slowMoState.phase !== 'idle'}
                    className={`col-span-1 flex items-center justify-center gap-1.5 bg-cyan-500 text-black py-2 rounded text-xs font-bold disabled:opacity-30 hover:bg-cyan-400 transition-all border border-cyan-400 ${epoch === 0 && slowMoState.phase === 'idle' ? 'animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.8)]' : 'shadow-[0_0_15px_rgba(6,182,212,0.5)]'}`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Auto-Train
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h2 className="text-base font-extrabold uppercase tracking-wider border-b-2 border-neutral-300 dark:border-white/20 pb-2">
              Live Metrics
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 p-3 rounded">
                <div className="text-neutral-500 dark:text-neutral-400 mb-1">Epoch</div>
                <div className="text-xl font-black text-cyan-600 dark:text-cyan-400">{epoch}</div>
              </div>
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 p-3 rounded">
                <div className="text-neutral-500 dark:text-neutral-400 mb-1">Loss</div>
                <div className="text-xl font-black text-pink-600 dark:text-pink-400">{loss === 0 ? "0.000" : loss.toFixed(4)}</div>
              </div>
            </div>
            
            <div className="h-24 w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded p-2 relative shadow-sm">
               {lossHistory.length >= 2 ? renderGraph() : (
                 <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                    Awaiting data...
                 </div>
               )}
            </div>
          </div>
          
          {hasTrained && slowMoState.phase === 'idle' && (
             <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h2 className="text-base font-extrabold uppercase tracking-wider border-b-2 border-neutral-300 dark:border-white/20 pb-2 flex items-center gap-2">
                 <span className="bg-black dark:bg-white text-white dark:text-black w-5 h-5 rounded flex items-center justify-center text-xs">2</span>
                 Interactive Playground
               </h2>
               <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-cyan-500/30 rounded p-4 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                 <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                   The network uses the last 3 characters you type to guess the next one.
                 </p>
                 <textarea
                   value={sandboxText}
                   onChange={e => setSandboxText(e.target.value)}
                   placeholder="Type a few characters..."
                   className="w-full h-20 p-3 text-lg rounded bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-white/10 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 resize-none font-mono shadow-inner mb-4"
                 />
                 
                 <div className="space-y-2 mb-4">
                   <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                     <span>Network sees:</span>
                     <span className="bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-black dark:text-white">
                        &quot;{sandboxText.slice(-3)}&quot;
                     </span>
                     <span>➔ Predicts:</span>
                   </div>
                   {top5Probs.map((item, i) => (
                     <div key={i} className="flex items-center gap-3 text-xs font-mono">
                       <span className="w-6 text-center font-bold bg-neutral-100 dark:bg-neutral-800 rounded py-0.5">{item.char === ' ' ? '␣' : item.char}</span>
                       <div className="flex-grow h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                         <div className="h-full bg-cyan-500 transition-all duration-200" style={{ width: `${item.prob * 100}%` }} />
                       </div>
                       <span className="w-10 text-right font-bold text-neutral-600 dark:text-neutral-400">{(item.prob * 100).toFixed(1)}%</span>
                     </div>
                   ))}
                 </div>
                 
                 <div className="flex gap-2">
                   <button
                     onClick={seedPlayground}
                     className="flex-1 flex items-center justify-center gap-2 bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 py-2 rounded text-xs font-bold hover:bg-neutral-200 dark:hover:bg-white/10 transition-all border border-neutral-200 dark:border-white/10"
                   >
                     Pick Random Seed
                   </button>
                   <button
                     onClick={generateNext}
                     className="flex-[2] flex items-center justify-center gap-2 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 py-2 rounded text-xs font-bold hover:bg-cyan-500/20 transition-all border border-cyan-500/30"
                   >
                     <Wand2 className="w-3.5 h-3.5" /> Auto-Generate
                   </button>
                 </div>
               </div>
             </div>
          )}
        </div>

        {/* Right Side: Network Visualization */}
        <div className="lg:col-span-8 flex flex-col relative">
          <h2 className="text-base font-extrabold uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Glass-Box Architecture</span>
            {isTraining && (
               <span className="flex items-center gap-2 text-xs text-cyan-500 animate-pulse font-bold">
                 <Loader2 className="w-3.5 h-3.5 animate-spin" /> Training Model
               </span>
            )}
          </h2>
          
          <div 
            ref={containerRef}
            className={`flex-grow min-h-[500px] relative bg-neutral-50 dark:bg-[#0a0a0a] border ${slowMoState.phase === 'backward' ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)]' : 'border-neutral-300 dark:border-white/10 shadow-inner'} rounded-xl overflow-hidden p-6 flex justify-between items-stretch transition-all duration-300`}
          >
            {/* SLOW MO OVERLAY */}
            {slowMoState.phase !== 'idle' && (
               <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 animate-in slide-in-from-top-4">
                 <div className="bg-black/80 backdrop-blur-md text-white border border-white/20 rounded-full px-6 py-2 text-sm font-bold shadow-2xl flex items-center gap-3">
                   {slowMoState.phase === 'forward' && (
                     <>
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"/>
                        Forward Pass: Guessing next char for &quot;{slowMoState.context}&quot;
                     </>
                   )}
                   {slowMoState.phase === 'loss' && (
                     <>
                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"/>
                        Network guessed &quot;{slowMoState.prediction}&quot;, but answer is &quot;{slowMoState.target}&quot;
                     </>
                   )}
                   {slowMoState.phase === 'backward' && (
                     <>
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
                        Backpropagation: Adjusting weights to minimize loss
                     </>
                   )}
                 </div>
               </div>
            )}
            
            <canvas 
              ref={canvasRef} 
              className="absolute inset-0 pointer-events-none z-10 opacity-90 transition-opacity duration-300"
            />
            
            {/* Input Layer */}
            <div className="relative z-20 flex flex-col justify-center gap-1.5 w-8">
              {Array.from({ length: networkStats.input }).map((_, i) => (
                <div 
                  key={`in-${i}`}
                  ref={el => { inputNodesRef.current[i] = el; }}
                  className="w-2.5 h-2.5 rounded-full bg-zinc-400 dark:bg-zinc-700 transition-all duration-300 ease-out shadow-sm mx-auto relative z-30"
                />
              ))}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap text-neutral-500">
                Input
              </div>
            </div>

            {/* Hidden Layer */}
            <div className="relative z-20 flex flex-col justify-center gap-1.5 w-8">
              {Array.from({ length: networkStats.hidden }).map((_, i) => (
                <div 
                  key={`hid-${i}`}
                  ref={el => { hiddenNodesRef.current[i] = el; }}
                  className="w-2.5 h-2.5 rounded-full bg-zinc-400 dark:bg-zinc-700 transition-all duration-300 ease-out shadow-sm mx-auto relative z-30"
                />
              ))}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap text-neutral-500">
                Hidden
              </div>
            </div>

            {/* Output Layer */}
            <div className="relative z-20 flex flex-col justify-center gap-2 w-16">
              {Array.from({ length: networkStats.output }).map((_, i) => {
                const char = netRef.current?.indexToChar.get(i) || '';
                return (
                  <div key={`out-${i}`} className="flex items-center gap-2 group">
                    <div 
                      ref={el => { outputNodesRef.current[i] = el; }}
                      className="w-3.5 h-3.5 rounded-full bg-zinc-400 dark:bg-zinc-700 transition-all duration-300 ease-out shadow-sm shrink-0 relative z-30"
                    />
                    <span className="font-mono text-xs font-bold text-neutral-400 group-hover:text-cyan-400 transition-colors">
                      {char === ' ' ? '␣' : char}
                    </span>
                  </div>
                );
              })}
              <div className="absolute -bottom-6 left-0 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap text-neutral-500">
                Output
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
