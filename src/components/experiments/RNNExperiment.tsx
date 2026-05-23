"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Loader2, RefreshCw } from 'lucide-react';
import { getRandomTexts } from '@/lib/ml/constants';

interface Candidate {
  char: string;
  prob: number;
}

export function RNNExperiment() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'initializing' | 'training' | 'generating'>('idle');
  const [loss, setLoss] = useState<number>(0);
  const [iteration, setIteration] = useState<number>(0);
  const [vocabSize, setVocabSize] = useState<number>(0);
  const [generatedSample, setGeneratedSample] = useState<string>('');
  const [sampleOptions, setSampleOptions] = useState<string[]>([]);
  const [temperature, setTemperature] = useState<number>(0.8);
  const [lossHistory, setLossHistory] = useState<number[]>([]);
  
  // Smart Autocomplete State (Step 4 Climax)
  const [sandboxText, setSandboxText] = useState<string>('');
  const [suggestion, setSuggestion] = useState<string>('');
  const [isTrained, setIsTrained] = useState<boolean>(false);
  const [top5Probs, setTop5Probs] = useState<Candidate[]>([]);

  const workerRef = useRef<Worker | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const temperatureRef = useRef<number>(0.8);
  const iterationRef = useRef<number>(0);

  // Synchronize state with refs
  useEffect(() => {
    temperatureRef.current = temperature;
  }, [temperature]);

  useEffect(() => {
    iterationRef.current = iteration;
  }, [iteration]);

  useEffect(() => {
    setSampleOptions(getRandomTexts(3));
    
    workerRef.current = new Worker(new URL('../../workers/rnn.worker.ts', import.meta.url));
    
    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'INIT_DONE') {
        setVocabSize(payload.vocabSize);
        setStatus('training');
        setIsTrained(true);
        workerRef.current?.postMessage({ 
          type: 'TRAIN', 
          payload: { learningRate: 0.1, seqLength: 25, temperature: temperatureRef.current } 
        });
      } else if (type === 'PROGRESS') {
        setIteration(payload.iter);
        setLoss(payload.loss);
        setGeneratedSample(payload.sample);

        setLossHistory((prev) => {
          const next = [...prev, payload.loss];
          if (next.length > 40) next.shift();
          return next;
        });
      } else if (type === 'GENERATE_DONE') {
        setSuggestion(payload.text);
        setStatus('idle');
      } else if (type === 'GENERATE_STREAM_CHAR') {
        setTop5Probs(payload.top5);
      } else if (type === 'GET_WEIGHTS_DONE') {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `slm_weights_iteration_${iterationRef.current}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [generatedSample]);

  const handleStartTraining = () => {
    if (!text.trim() || text.length < 40 || status !== 'idle') return;
    setStatus('initializing');
    setIteration(0);
    setLoss(0);
    setLossHistory([]);
    setGeneratedSample('');
    setSandboxText('');
    setSuggestion('');
    setTop5Probs([]);
    workerRef.current?.postMessage({ type: 'INIT', payload: { text: text.trim(), hiddenSize: 64 } });
  };

  const handleStopTraining = () => {
    workerRef.current?.postMessage({ type: 'STOP', payload: {} });
    setStatus('idle');
  };

  const requestAutocomplete = (currentText: string) => {
    if (!workerRef.current || !isTrained || status !== 'idle') return;
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!currentText) {
      setSuggestion('');
      setTop5Probs([]);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      const lastChar = currentText.slice(-1) || ' ';
      
      workerRef.current?.postMessage({
        type: 'GENERATE',
        payload: { seed: lastChar, length: 12, temperature: 0.3 }
      });
      
      workerRef.current?.postMessage({
        type: 'GENERATE_STREAM',
        payload: { seed: lastChar, length: 1, temperature }
      });
    }, 60);
  };

  const handleSandboxChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setSandboxText(val);
    requestAutocomplete(val);
  };

  // Synchronize scrolls between transparent textarea and overlay div
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (overlayRef.current) {
      overlayRef.current.scrollTop = e.currentTarget.scrollTop;
      overlayRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      const updatedText = sandboxText + suggestion;
      setSandboxText(updatedText);
      setSuggestion('');
      setTop5Probs([]);
      requestAutocomplete(updatedText);
    }
  };

  const handleExportWeights = () => {
    if (!isTrained) return;
    workerRef.current?.postMessage({ type: 'GET_WEIGHTS', payload: {} });
  };

  const loadRandomSample = (sample: string) => {
      if (status !== 'idle') return;
      setText(sample);
      setIsTrained(false);
      setSandboxText('');
      setSuggestion('');
      setTop5Probs([]);
  };
  
  const refreshSamples = () => {
      if (status !== 'idle') return;
      setSampleOptions(getRandomTexts(3));
  };

  const getSampleLabel = (txt: string) => {
    if (txt.includes("To be, or not to be")) return "Shakespearean Poetry";
    if (txt.includes("Hello world")) return "Hello World Loop";
    if (txt.includes("In the beginning")) return "Hitchhiker's Guide Prose";
    if (txt.includes("TypeScript")) return "TypeScript Definition";
    if (txt.includes("Recurrent neural networks")) return "RNN Overview";
    return "Sample Dataset";
  };

  const uniqueCharsCount = new Set(text).size;
  const isTooShort = text.length > 0 && text.length < 40;

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
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-neutral-400 dark:text-neutral-500">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="currentColor" strokeDasharray="3,3" strokeWidth="0.75" />
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={points}
          className="text-black dark:text-white"
        />
        <text x="5" y="14" className="text-xs font-mono font-bold fill-black dark:fill-white">Max: {maxVal.toFixed(3)}</text>
        <text x="5" y={height - 6} className="text-xs font-mono font-bold fill-black dark:fill-white">Min: {minVal.toFixed(3)}</text>
      </svg>
    );
  };

  return (
    <div className="w-full space-y-8 pb-12 text-black dark:text-white">
      
      {/* SECTION 1: DATA PREPARATION */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-neutral-300 dark:border-white/20 pb-3">
          <h2 className="text-base font-extrabold uppercase tracking-wider">
            1. Prepare Training Dataset
          </h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-neutral-700 dark:text-neutral-300 font-bold">Suggestions:</span>
            <div className="flex gap-3">
              {sampleOptions.map((opt, i) => (
                <button
                  key={i}
                  disabled={status !== 'idle'}
                  onClick={() => loadRandomSample(opt)}
                  className={`underline underline-offset-4 hover:text-black dark:hover:text-white disabled:opacity-40 transition-all font-bold ${
                    text === opt ? "text-black dark:text-white" : "text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  [{getSampleLabel(opt)}]
                </button>
              ))}
            </div>
            <button 
              onClick={refreshSamples} 
              disabled={status !== 'idle'}
              className="text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors underline underline-offset-4 font-bold"
            >
              (Shuffle)
            </button>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={status !== 'idle'}
          placeholder="Select a suggestion link above, or paste your own training text here..."
          className="w-full h-36 p-4 text-base rounded bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-white/20 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-700 dark:focus:border-white disabled:opacity-50 resize-none font-mono leading-relaxed shadow-sm"
        />

        <div className="flex flex-wrap justify-between items-center text-sm text-neutral-800 dark:text-neutral-200 font-mono font-bold">
          <div className="flex gap-6">
            <span>Characters: <strong className="text-black dark:text-white">{text.length}</strong></span>
            <span>Vocabulary: <strong className="text-black dark:text-white">{uniqueCharsCount}</strong></span>
          </div>
          {isTooShort && (
            <span className="text-neutral-600 dark:text-neutral-400">Dataset must be at least 40 characters to initialize model.</span>
          )}
        </div>
      </div>

      {/* SECTION 2: TRAINING STATUS & ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4 border-t-2 border-neutral-300 dark:border-white/20">
        
        {/* Left Side: Diagnostics and Settings */}
        <div className="md:col-span-5 space-y-6">
          <h2 className="text-base font-extrabold uppercase tracking-wider">
            2. Training Diagnostics
          </h2>

          <div className="flex justify-between items-center text-sm font-mono py-2.5 border-b border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-neutral-100">
            <span className="font-bold text-neutral-700 dark:text-neutral-300">Current Iteration:</span>
            <span className="font-extrabold">{iteration.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-mono py-2.5 border-b border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-neutral-100">
            <span className="font-bold text-neutral-700 dark:text-neutral-300">Smooth Loss Metric:</span>
            <span className="font-extrabold">{loss === 0 ? "0.000" : loss.toFixed(4)}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-mono py-2.5 border-b border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-neutral-100">
            <span className="font-bold text-neutral-700 dark:text-neutral-300">Active Vocabulary:</span>
            <span className="font-extrabold">{vocabSize || 0} unique symbols</span>
          </div>

          {/* Temperature Parameter */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-extrabold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Temperature</span>
              <span className="font-mono text-black dark:text-white font-extrabold">{temperature.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={temperature}
              disabled={status === 'generating'}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-black dark:accent-white cursor-pointer h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg disabled:opacity-50"
            />
            <div className="flex justify-between text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300">
              <span>0.1 (Strict Loops)</span>
              <span>2.0 (High Randomness)</span>
            </div>
          </div>

          <div className="pt-2">
            {status === 'idle' || status === 'generating' ? (
              <button 
                onClick={handleStartTraining}
                disabled={!text.trim() || isTooShort}
                className="w-full flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black py-2.5 rounded text-sm font-extrabold disabled:opacity-30 hover:opacity-90 transition-all border border-black dark:border-white"
              >
                Start Model Training
              </button>
            ) : (
              <button 
                onClick={handleStopTraining}
                className="w-full flex items-center justify-center gap-2 bg-neutral-200 dark:bg-white/10 text-black dark:text-white py-2.5 rounded text-sm font-extrabold hover:bg-neutral-300 dark:hover:bg-white/20 transition-all border border-neutral-300 dark:border-white/20"
              >
                Stop Training
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Visual Progress */}
        <div className="md:col-span-7 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold uppercase tracking-wider">
              3. Visual Loss Descent & Predictions
            </h2>
            {status === 'training' && (
              <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 bg-neutral-200 dark:bg-white/10 px-2 py-0.5 rounded animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Training Loop Active
              </span>
            )}
          </div>

          {/* Loss Descent Graph */}
          <div className="h-32 w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-white/20 rounded p-3 flex items-center justify-center relative overflow-hidden shadow-sm">
            {lossHistory.length >= 2 ? (
              renderGraph()
            ) : (
              <span className="text-xs text-neutral-600 dark:text-neutral-400 font-mono font-bold">Descent chart will construct here...</span>
            )}
          </div>

          {/* Live Character Stream Feed */}
          <div className="flex-grow flex flex-col min-h-[160px] rounded bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-white/20 p-4 relative shadow-sm">
            <div className="text-[10px] text-neutral-500 font-mono font-bold absolute top-2.5 right-3 uppercase">Stream Output</div>
            {generatedSample ? (
              <div 
                ref={outputRef} 
                className="font-mono text-sm text-neutral-950 dark:text-neutral-100 whitespace-pre-wrap break-all overflow-y-auto h-[120px] leading-relaxed mt-4"
              >
                {generatedSample}
                {status === 'training' && <span className="animate-pulse font-extrabold">_</span>}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-neutral-600 dark:text-neutral-400 font-mono italic font-medium mt-4">
                stream feed will print predictions here during execution...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: MODEL INTERACTION PLAYGROUND */}
      {isTrained && (status === 'idle' || status === 'generating') && (
        <div className="pt-8 border-t-2 border-neutral-300 dark:border-white/20 space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold uppercase tracking-wider">
                4. Local Autocomplete Sandbox
              </h2>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                Type inside the box below to test inline smart completions.
              </p>
            </div>

            <button 
              onClick={handleExportWeights}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-white dark:bg-white/5 border border-neutral-300 dark:border-white/20 text-xs font-black text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-all shadow-sm"
            >
              Export Weights (JSON)
            </button>
          </div>

          <div className="space-y-6">
            
            {/* Inline Smart Compose Interactive Canvas */}
            <div className="relative border-2 border-neutral-300 dark:border-white/20 rounded bg-white dark:bg-neutral-950 h-48 focus-within:border-black dark:focus-within:border-white shadow-sm transition-colors overflow-hidden">
              
              {/* Perfectly aligned interactive input textarea on top */}
              <textarea
                value={sandboxText}
                onChange={handleSandboxChange}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                placeholder="Start typing your trained text context here to verify predictions..."
                className="absolute inset-0 w-full h-full p-6 text-transparent bg-transparent outline-none border-0 resize-none font-mono text-xl md:text-2xl leading-relaxed caret-black dark:caret-white overflow-y-auto whitespace-pre-wrap break-all z-10"
              />
              
              {/* Perfect scroll-synchronized visual ghost overlay underneath */}
              <div 
                ref={overlayRef}
                className="absolute inset-0 w-full h-full p-6 font-mono text-xl md:text-2xl leading-relaxed pointer-events-none overflow-y-auto whitespace-pre-wrap break-all scrollbar-none"
              >
                <span className="text-black dark:text-white font-extrabold">{sandboxText}</span>
                {suggestion && (
                  <span className="underline decoration-wavy decoration-black dark:decoration-white opacity-40 font-extrabold">
                    {suggestion}
                  </span>
                )}
                {!sandboxText && (
                  <span className="text-neutral-400 dark:text-neutral-600 font-bold">Start typing your trained text context here to verify predictions...</span>
                )}
              </div>

              {suggestion && (
                <div className="absolute bottom-2 right-4 text-xs font-mono font-bold text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded pointer-events-none z-20">
                  Press Tab to accept prediction
                </div>
              )}
            </div>

            {/* Dynamic Probability Bar Chart */}
            {top5Probs.length > 0 && (
              <div className="rounded bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-white/20 p-5 shadow-sm space-y-4 animate-in fade-in duration-300 max-w-xl">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-black dark:text-white border-b border-neutral-300 dark:border-white/10 pb-2">
                  Live Next-Symbol Forecast Probabilities (Top 5 Choices)
                </h3>
                <div className="space-y-3">
                  {top5Probs.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 text-xs font-mono font-bold">
                      <span className="w-8 text-center text-sm font-black bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white py-1 rounded">
                        {item.char === ' ' ? '␣' : item.char}
                      </span>
                      
                      {/* High-contrast pure black or pure white bars, completely avoiding gray fill color */}
                      <div className="flex-grow h-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-sm overflow-hidden">
                        <div 
                          className="h-full bg-black dark:bg-white transition-all duration-75"
                          style={{ width: `${item.prob * 100}%` }}
                        />
                      </div>
                      
                      <span className="w-12 text-right text-xs font-extrabold text-black dark:text-white">
                        {(item.prob * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
