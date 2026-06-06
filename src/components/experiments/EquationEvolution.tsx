"use client";

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  Play, Pause, RotateCcw, Dna, Zap,
  TrendingDown, Hash, FlaskConical, SlidersHorizontal,
  FileText, Trash2, Copy, Check, Maximize, History
} from 'lucide-react';
import {
  type ASTNode, type DataPoint, type Individual,
  evaluateAST,
  generateNoisyQuadratic, generateNoisySine, generateNoisyLinear,
  dataToCSV, parseCSV,
} from './equation-evolver/equationEvolver';

// ── Constants ────────────────────────────────────────────────

const CURVE_SAMPLE_COUNT = 300;
const MAX_GENERATIONS = 20000;
const CONVERGENCE_MSE = 0.01;
const STATE_UPDATE_INTERVAL = 80; // ms

// ── Color palette ────────────────────────────────────────────

const COLORS = {
  bg: '#07070a',
  grid: 'rgba(255, 255, 255, 0.04)',
  axis: 'rgba(255, 255, 255, 0.12)',
  axisLabel: 'rgba(255, 255, 255, 0.30)',
  dataDot: '#22d3ee',
  dataDotGlow: 'rgba(34, 211, 238, 0.35)',
  bestCurve: '#a78bfa',
  bestCurveEnd: '#22d3ee',
  runnerUp: 'rgba(255, 255, 255, 0.10)',
  scanline: 'rgba(255, 255, 255, 0.012)',
};

// ── Helpers ──────────────────────────────────────────────────

function formatMSE(val: number): string {
  if (val === 0) return '—';
  if (val >= 1e6) return val.toExponential(1);
  if (val >= 100) return val.toFixed(1);
  if (val >= 1) return val.toFixed(3);
  return val.toFixed(5);
}

function mseColor(val: number): string {
  if (val <= 0.1) return '#4ade80';   // green
  if (val <= 1) return '#a3e635';     // lime
  if (val <= 10) return '#facc15';    // yellow
  if (val <= 100) return '#fb923c';   // orange
  return '#f87171';                    // red
}

// ─────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────

export function EquationEvolution() {
  // ── State ──────────────────────────────────────────────────

  const [rawInput, setRawInput] = useState(() => dataToCSV(generateNoisyQuadratic(30)));
  const [populationSize, setPopulationSize] = useState(500);
  const [mutationRate, setMutationRate] = useState(0.10);
  const [isEvolving, setIsEvolving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [bestFitness, setBestFitness] = useState(0);
  const [bestEquation, setBestEquation] = useState('');
  const [converged, setConverged] = useState(false);
  const [fitnessHistory, setFitnessHistory] = useState<number[]>([]);
  const [isAdapting, setIsAdapting] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>('quad');
  const [uploadError, setUploadError] = useState(false);
  const [isExtrapolating, setIsExtrapolating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyMilestones, setHistoryMilestones] = useState<{gen: number; mse: number; eq: string}[]>([]);
  const [simplificationSteps, setSimplificationSteps] = useState<string[]>([]);

  // ── Refs ───────────────────────────────────────────────────

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const populationRef = useRef<Individual[]>([]);
  const generationRef = useRef(0);
  const fitnessHistoryRef = useRef<number[]>([]);
  const isEvolvingRef = useRef(false);
  const convergeFlashRef = useRef(0);

  // History refs
  const historyMilestonesRef = useRef<{gen: number; mse: number; eq: string}[]>([]);

  // ── Derived state ──────────────────────────────────────────

  const parsedData = useMemo<DataPoint[]>(() => parseCSV(rawInput), [rawInput]);

  const dataRange = useMemo(() => {
    if (parsedData.length === 0) return { xMin: -5, xMax: 5, yMin: -5, yMax: 5 };
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    for (const p of parsedData) {
      if (p.x < xMin) xMin = p.x;
      if (p.x > xMax) xMax = p.x;
      if (p.y < yMin) yMin = p.y;
      if (p.y > yMax) yMax = p.y;
    }
    const xRange = xMax - xMin || 1;
    const xPad = xRange * 0.12;
    const yPad = (yMax - yMin) * 0.12 || 1;

    let finalXMin = xMin - xPad;
    let finalXMax = xMax + xPad;

    if (isExtrapolating) {
      finalXMin -= xRange * 0.5;
      finalXMax += xRange * 0.5;
    }

    return {
      xMin: finalXMin,
      xMax: finalXMax,
      yMin: yMin - yPad,
      yMax: yMax + yPad,
    };
  }, [parsedData]);

  // ── Canvas drawing ─────────────────────────────────────────

  const drawCanvas = useCallback((
    population: Individual[],
    data: DataPoint[],
    range: { xMin: number; xMax: number; yMin: number; yMax: number },
    flash: number,
    adapting: boolean,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width * dpr;
    const h = rect.height * dpr;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cw = rect.width;
    const ch = rect.height;

    const { xMin, xMax, yMin, yMax } = range;

    // Coordinate transforms
    const toCanvasX = (x: number) => ((x - xMin) / (xMax - xMin)) * cw;
    const toCanvasY = (y: number) => ch - ((y - yMin) / (yMax - yMin)) * ch;

    // ── Clear ──
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, cw, ch);

    // ── Scanlines ──
    for (let y = 0; y < ch; y += 3) {
      ctx.fillStyle = COLORS.scanline;
      ctx.fillRect(0, y, cw, 1);
    }

    // ── Grid lines ──
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    const xStep = niceStep(xMax - xMin);
    const yStep = niceStep(yMax - yMin);

    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      const cx = toCanvasX(x);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, ch);
      ctx.stroke();
    }
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      const cy = toCanvasY(y);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(cw, cy);
      ctx.stroke();
    }

    // ── Axes ──
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1;
    if (xMin <= 0 && xMax >= 0) {
      const cx = toCanvasX(0);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, ch);
      ctx.stroke();
    }
    if (yMin <= 0 && yMax >= 0) {
      const cy = toCanvasY(0);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(cw, cy);
      ctx.stroke();
    }

    // ── Axis labels ──
    ctx.fillStyle = COLORS.axisLabel;
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      if (Math.abs(x) < 1e-10) continue;
      const cx = toCanvasX(x);
      ctx.fillText(fmtNum(x), cx, ch - 4);
    }
    ctx.textAlign = 'left';
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      if (Math.abs(y) < 1e-10) continue;
      const cy = toCanvasY(y);
      ctx.fillText(fmtNum(y), 4, cy - 3);
    }

    // ── Runner-up curves (top 2-6) ──
    if (population.length > 1) {
      // Flash runner-ups brighter if adapting
      ctx.strokeStyle = adapting ? 'rgba(255, 255, 255, 0.40)' : COLORS.runnerUp;
      ctx.lineWidth = adapting ? 2 : 1;
      const runnerCount = Math.min(5, population.length - 1);
      for (let r = 1; r <= runnerCount; r++) {
        drawCurvePath(ctx, population[r].tree, xMin, xMax, toCanvasX, toCanvasY, ch);
        ctx.stroke();
      }
    }

    // ── Best-fit curve ──
    if (population.length > 0) {
      const best = population[0];
      const grad = ctx.createLinearGradient(0, 0, cw, 0);
      grad.addColorStop(0, COLORS.bestCurve);
      grad.addColorStop(1, COLORS.bestCurveEnd);

      // Convergence flash: briefly widen + brighten the curve
      const extraWidth = flash > 0 ? flash * 4 : 0;
      if (flash > 0) {
        ctx.shadowColor = COLORS.bestCurveEnd;
        ctx.shadowBlur = flash * 20;
      }

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5 + extraWidth;
      drawCurvePath(ctx, best.tree, xMin, xMax, toCanvasX, toCanvasY, ch);
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Subtle glow layer
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 6 + extraWidth;
      drawCurvePath(ctx, best.tree, xMin, xMax, toCanvasX, toCanvasY, ch);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // ── Data points ──
    for (const p of data) {
      const cx = toCanvasX(p.x);
      const cy = toCanvasY(p.y);

      // Glow
      const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
      glowGrad.addColorStop(0, COLORS.dataDotGlow);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(cx - 12, cy - 12, 24, 24);

      // Dot
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.dataDot;
      ctx.fill();

      // Inner highlight
      ctx.beginPath();
      ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fill();
    }
  }, []);

  // ── Canvas resize ──────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      // Redraw with current state
      drawCanvas(populationRef.current, parsedData, dataRange, 0, false);
    });
    ro.observe(container);

    // Initial draw
    drawCanvas([], parsedData, dataRange, 0, false);

    return () => ro.disconnect();
  }, [parsedData, dataRange, drawCanvas]);

  // ── Web Worker ─────────────────────────────────────────────

  const workerRef = useRef<Worker | null>(null);
  // Keep refs in sync for the worker's onmessage closure (mount-only effect)
  const parsedDataRef = useRef(parsedData);
  const dataRangeRef = useRef(dataRange);
  const drawCanvasRef = useRef(drawCanvas);
  parsedDataRef.current = parsedData;
  dataRangeRef.current = dataRange;
  drawCanvasRef.current = drawCanvas;

  // Create worker on mount, terminate on unmount
  useEffect(() => {
    const worker = new Worker(
      new URL('./equation-evolver/evolutionWorker.ts', import.meta.url)
    );

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;

      if (msg.type === 'progress') {
        // Store top individuals for drawing
        populationRef.current = msg.topIndividuals;
        generationRef.current = msg.generation;
        fitnessHistoryRef.current = msg.fitnessHistory;
        historyMilestonesRef.current = msg.milestones;

        // Convergence flash
        if (msg.bestMSE <= CONVERGENCE_MSE && convergeFlashRef.current === 0) {
          convergeFlashRef.current = 1;
        }
        if (convergeFlashRef.current > 0) {
          convergeFlashRef.current = Math.max(0, convergeFlashRef.current - 0.02);
        }

        // Update React state
        setGeneration(msg.generation);
        setBestFitness(msg.bestMSE);
        setBestEquation(msg.bestEquation);
        setFitnessHistory(msg.fitnessHistory);
        setHistoryMilestones(msg.milestones);
        setIsAdapting(msg.adapting);
        if (msg.simplificationSteps) {
          setSimplificationSteps(msg.simplificationSteps);
        }

        // Draw canvas with the top individuals (use refs for latest values)
        drawCanvasRef.current(
          msg.topIndividuals,
          parsedDataRef.current,
          dataRangeRef.current,
          convergeFlashRef.current,
          msg.adapting,
        );
      }

      if (msg.type === 'done') {
        setIsEvolving(false);
        isEvolvingRef.current = false;
        if (msg.converged) setConverged(true);
      }
    };

    worker.onerror = (err) => {
      console.error('[EvolutionWorker] Error:', err.message);
      setIsEvolving(false);
      isEvolvingRef.current = false;
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []); // only mount/unmount

  // Redraw when parsedData/dataRange change (worker messages will draw too, 
  // but we need this for when the worker isn't running)
  useEffect(() => {
    drawCanvas(populationRef.current, parsedData, dataRange, 0, false);
  }, [parsedData, dataRange, drawCanvas]);

  // ── Evolution controls ─────────────────────────────────────

  const startEvolution = useCallback(() => {
    if (parsedData.length < 2) return;
    if (!workerRef.current) return;

    // Reset state
    convergeFlashRef.current = 0;
    setGeneration(0);
    setBestFitness(0);
    setBestEquation('');
    setFitnessHistory([]);
    setConverged(false);
    setIsAdapting(false);
    setIsEvolving(true);
    isEvolvingRef.current = true;
    setIsPaused(false);
    setHistoryMilestones([]);

    // Tell the worker to start
    workerRef.current.postMessage({
      type: 'start',
      payload: {
        populationSize,
        mutationRate,
        data: parsedData,
      },
    });
  }, [parsedData, populationSize, mutationRate]);

  const togglePause = useCallback(() => {
    setIsPaused(p => {
      const next = !p;
      if (workerRef.current) {
        workerRef.current.postMessage({ type: next ? 'pause' : 'resume' });
      }
      return next;
    });
  }, []);

  const stopEvolution = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'stop' });
    }
    setIsEvolving(false);
    isEvolvingRef.current = false;
    setIsPaused(false);
  }, []);

  const resetAll = useCallback(() => {
    stopEvolution();
    populationRef.current = [];
    setGeneration(0);
    setBestFitness(0);
    setBestEquation('');
    setFitnessHistory([]);
    setConverged(false);
    setIsAdapting(false);
    drawCanvas([], parsedData, dataRange, 0, false);
  }, [stopEvolution, parsedData, dataRange, drawCanvas]);

  // Preset handlers
  const loadPreset = useCallback((type: 'quad' | 'sine' | 'linear') => {
    stopEvolution();
    populationRef.current = [];
    generationRef.current = 0;
    fitnessHistoryRef.current = [];
    setGeneration(0);
    setBestFitness(0);
    setBestEquation('');
    setFitnessHistory([]);
    setConverged(false);
    setActivePreset(type);
    setUploadError(false);

    switch (type) {
      case 'quad':
        setRawInput(dataToCSV(generateNoisyQuadratic(30)));
        break;
      case 'sine':
        setRawInput(dataToCSV(generateNoisySine(30)));
        break;
      case 'linear':
        setRawInput(dataToCSV(generateNoisyLinear(30)));
        break;
    }
  }, [stopEvolution]);

  const clearData = useCallback(() => {
    stopEvolution();
    populationRef.current = [];
    generationRef.current = 0;
    fitnessHistoryRef.current = [];
    setGeneration(0);
    setBestFitness(0);
    setBestEquation('');
    setFitnessHistory([]);
    setConverged(false);
    setIsAdapting(false);
    setActivePreset(null);
    setRawInput('');
    setUploadError(false);
    drawCanvas([], [], dataRange, 0, false);
  }, [stopEvolution, dataRange, drawCanvas]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      
      if (parsed.length === 0) {
        setUploadError(true);
      } else {
        setUploadError(false);
        setActivePreset('custom');
        setRawInput(dataToCSV(parsed));
      }
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  }, []);



  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(bestEquation.replace('y = ', ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [bestEquation]);

  // ── Fitness sparkline ──────────────────────────────────────

  const sparkline = useMemo(() => {
    if (fitnessHistory.length < 2) return null;
    const w = 500;
    const h = 80;
    const maxVal = Math.max(...fitnessHistory);
    const minVal = Math.min(...fitnessHistory);
    const delta = maxVal - minVal || 1;

    const points = fitnessHistory.map((val, idx) => {
      const x = (idx / (fitnessHistory.length - 1)) * w;
      const y = h - 6 - ((val - minVal) / delta) * (h - 12);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkGrad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke="url(#sparkGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        <polygon
          fill="url(#sparkFill)"
          points={`0,${h} ${points} ${w},${h}`}
        />
      </svg>
    );
  }, [fitnessHistory]);

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="w-full space-y-6 pb-12 text-black dark:text-white">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ─── Left Panel: Controls ─── */}
        <div className="lg:col-span-4 space-y-5">

          {/* Data Input */}
          <section className="space-y-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wider border-b border-neutral-300 dark:border-white/10 pb-2 flex items-center gap-2">
              <span className="bg-black dark:bg-white text-white dark:text-black w-5 h-5 rounded flex items-center justify-center text-mini font-black">1</span>
              Data Points
            </h2>
              <textarea
              id="data-input"
              value={rawInput}
              onChange={e => {
                setRawInput(e.target.value);
                setActivePreset(null);
                setUploadError(false);
              }}
              disabled={isEvolving}
              placeholder="x, y (one pair per line)"
              className="w-full h-36 p-3 text-xs rounded-lg bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 placeholder:text-neutral-400 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 disabled:opacity-40 resize-none font-mono shadow-sm transition-colors leading-relaxed"
            />
            {uploadError && (
              <p className="text-mini font-bold text-red-500 mt-1">
                Invalid data format. Please use X, Y numeric pairs.
              </p>
            )}
            <div className="flex gap-2">
              <input
                type="file"
                accept=".csv,.txt"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isEvolving}
                className="flex-1 flex items-center justify-center gap-1.5 text-mini font-bold uppercase tracking-wider py-1.5 rounded bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors disabled:opacity-40 text-neutral-600 dark:text-neutral-400"
              >
                <FileText className="w-3.5 h-3.5" />
                Upload CSV
              </button>
              <button
                onClick={clearData}
                disabled={isEvolving}
                className="flex-[0.5] flex items-center justify-center gap-1.5 text-mini font-bold uppercase tracking-wider py-1.5 rounded bg-red-100/50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 hover:bg-red-200/50 dark:hover:bg-red-500/20 transition-colors disabled:opacity-40 text-red-600 dark:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                id="preset-quad"
                onClick={() => loadPreset('quad')}
                disabled={isEvolving}
                className={`flex-1 text-mini font-bold uppercase tracking-wider py-1.5 rounded border transition-colors disabled:opacity-40 ${
                  activePreset === 'quad'
                    ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black border-transparent'
                    : 'bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Quadratic
              </button>
              <button
                id="preset-sine"
                onClick={() => loadPreset('sine')}
                disabled={isEvolving}
                className={`flex-1 text-mini font-bold uppercase tracking-wider py-1.5 rounded border transition-colors disabled:opacity-40 ${
                  activePreset === 'sine'
                    ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black border-transparent'
                    : 'bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Sine Wave
              </button>
              <button
                id="preset-linear"
                onClick={() => loadPreset('linear')}
                disabled={isEvolving}
                className={`flex-1 text-mini font-bold uppercase tracking-wider py-1.5 rounded border transition-colors disabled:opacity-40 ${
                  activePreset === 'linear'
                    ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black border-transparent'
                    : 'bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Linear
              </button>
            </div>
            <p className="text-mini text-neutral-400 font-mono">
              {parsedData.length} data point{parsedData.length !== 1 ? 's' : ''} loaded
            </p>
          </section>

          {/* Evolution Controls */}
          <section className="space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider border-b border-neutral-300 dark:border-white/10 pb-2 flex items-center gap-2">
              <span className="bg-black dark:bg-white text-white dark:text-black w-5 h-5 rounded flex items-center justify-center text-mini font-black">2</span>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Evolution Parameters
            </h2>

            {/* Population Size */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500 dark:text-neutral-400 font-medium">Population Size</span>
                <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">{populationSize}</span>
              </div>
              <input
                id="slider-population"
                type="range"
                min={100}
                max={1000}
                step={50}
                value={populationSize}
                onChange={e => setPopulationSize(Number(e.target.value))}
                disabled={isEvolving}
                className="w-full h-1.5 accent-violet-500 cursor-pointer disabled:opacity-40"
              />
              <p className="text-mini text-neutral-500 leading-tight">Larger populations find better equations but require more CPU.</p>
            </div>

            {/* Mutation Rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500 dark:text-neutral-400 font-medium">Mutation Rate</span>
                <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">{(mutationRate * 100).toFixed(0)}%</span>
              </div>
              <input
                id="slider-mutation"
                type="range"
                min={1}
                max={50}
                step={1}
                value={mutationRate * 100}
                onChange={e => setMutationRate(Number(e.target.value) / 100)}
                disabled={isEvolving}
                className="w-full h-1.5 accent-violet-500 cursor-pointer disabled:opacity-40"
              />
              <p className="text-mini text-neutral-500 leading-tight">Higher randomness prevents the algorithm from getting stuck in local minima.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              {!isEvolving ? (
                <button
                  id="btn-evolve"
                  onClick={startEvolution}
                  disabled={parsedData.length < 2}
                  className="flex-[3] flex flex-col items-center justify-center gap-1 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-md active:scale-[0.98] disabled:opacity-30 disabled:shadow-none"
                >
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Dna className="w-4 h-4" />
                    Evolve Equation
                  </div>
                  <span className="text-micro font-medium opacity-60">Genetic algorithms are stochastic. Run multiple times for best results.</span>
                </button>
              ) : (
                <>
                  <button
                    id="btn-pause"
                    onClick={togglePause}
                    className={`flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-[0.98] ${
                      isPaused
                        ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 hover:bg-cyan-500/20'
                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20'
                    }`}
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    id="btn-stop"
                    onClick={stopEvolution}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all active:scale-[0.98]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              {!isEvolving && (generation > 0 || bestEquation) && (
                <button
                  id="btn-reset"
                  onClick={resetAll}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-white/10 transition-all active:scale-[0.98]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </section>

          {/* Live Metrics */}
          <section className="space-y-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wider border-b border-neutral-300 dark:border-white/10 pb-2 flex items-center gap-2">
              <span className="bg-black dark:bg-white text-white dark:text-black w-5 h-5 rounded flex items-center justify-center text-mini font-black">3</span>
              Live Metrics
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-white/8 p-3 rounded-lg">
                <div className="flex items-center gap-1.5 text-mini text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-bold mb-1">
                  <Hash className="w-3 h-3" />
                  Generation
                </div>
                <div className="text-xl font-black tabular-nums text-violet-600 dark:text-violet-400">
                  {generation.toLocaleString()}
                </div>
              </div>
              <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-white/8 p-3 rounded-lg">
                <div className="flex items-center gap-1.5 text-mini text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-bold mb-1">
                  <TrendingDown className="w-3 h-3" />
                  Mean Error
                </div>
                <div
                  className="text-xl font-black tabular-nums transition-colors duration-300"
                  style={{ color: bestFitness > 0 ? mseColor(bestFitness) : undefined }}
                >
                  {formatMSE(bestFitness)}
                </div>
              </div>
            </div>

            {/* Fitness sparkline */}
            <div className="h-16 w-full bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-white/8 rounded-lg p-2 relative overflow-hidden">
              {sparkline ?? (
                <div className="w-full h-full flex items-center justify-center text-mini text-neutral-400 font-mono">
                  Awaiting evolution…
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ─── Right Panel: Canvas + Output ─── */}
        <div className="lg:col-span-8 flex flex-col gap-4">

          {/* Canvas Container */}
          <div
            ref={containerRef}
            className="relative flex-grow min-h-[420px] rounded-xl overflow-hidden border border-neutral-300 dark:border-white/8 shadow-inner"
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
            />

            {/* Evolving badge */}
            {isEvolving && !isPaused && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 text-tiny font-bold text-white shadow-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Evolving…
              </div>
            )}

            {/* Paused badge */}
            {isEvolving && isPaused && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md border border-amber-500/30 rounded-full px-3 py-1.5 text-tiny font-bold text-amber-400 shadow-lg">
                <Pause className="w-3 h-3" />
                Paused
              </div>
            )}

            {/* Converged badge */}
            {converged && !isEvolving && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md border border-emerald-500/30 rounded-full px-3 py-1.5 text-tiny font-bold text-emerald-400 shadow-lg animate-in fade-in zoom-in duration-500">
                <Zap className="w-3 h-3" />
                Converged!
              </div>
            )}

            {/* Adapting badge */}
            {isAdapting && !isPaused && !converged && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md border border-violet-500/30 rounded-full px-3 py-1.5 text-tiny font-bold text-violet-400 shadow-lg animate-in fade-in duration-300">
                <Zap className="w-3 h-3 animate-pulse" />
                Auto-Adapting...
              </div>
            )}

            {/* Empty state */}
            {!isEvolving && generation === 0 && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="text-center space-y-2 opacity-40">
                  <FlaskConical className="w-10 h-10 mx-auto text-neutral-400" />
                  <p className="text-xs text-neutral-500 font-medium">
                    Load data & click <span className="font-bold text-violet-400">&quot;Evolve Equation&quot;</span>
                  </p>
                </div>
              </div>
            )}
            
            {/* Extrapolate toggle */}
            <div className="absolute bottom-3 right-3 z-10 flex gap-2">
              <button
                onClick={() => setIsExtrapolating(!isExtrapolating)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-mini font-bold backdrop-blur-md border transition-all ${
                  isExtrapolating 
                    ? 'bg-violet-500/20 border-violet-500/50 text-violet-400'
                    : 'bg-black/60 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <Maximize className="w-3 h-3" />
                Extrapolate
              </button>
            </div>
          </div>

          {/* Output Panel */}
          <div className="relative overflow-hidden rounded-xl border border-neutral-200 dark:border-white/8 bg-white/70 dark:bg-black/60 backdrop-blur-sm p-4 md:p-5 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/3 pointer-events-none rounded-xl" />
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-mini text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-bold">
                  <Dna className="w-3 h-3" />
                  Best Equation
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHistory(true)}
                    disabled={historyMilestones.length === 0}
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-mini font-bold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors disabled:opacity-30 disabled:hover:text-neutral-500"
                  >
                    <History className="w-3 h-3" />
                    Derivation History
                  </button>
                  <button
                    onClick={handleCopy}
                    disabled={!bestEquation}
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-mini font-bold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors disabled:opacity-30 disabled:hover:text-neutral-500"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="font-mono text-base md:text-lg font-bold text-violet-600 dark:text-cyan-300 break-all min-h-[1.75rem] transition-all duration-200">
                {bestEquation || (
                  <span className="text-neutral-300 dark:text-neutral-600 font-normal text-sm italic">
                    No equation yet — start evolution to discover one
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Derivation History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowHistory(false)}>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 md:p-6 border-b border-neutral-200 dark:border-white/10 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Derivation Trace</h3>
                <p className="text-xs text-neutral-500">Milestone equations discovered during evolution.</p>
              </div>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                <RotateCcw className="w-4 h-4 rotate-45" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 md:p-6 space-y-8 font-mono text-sm">
              {simplificationSteps.length > 0 && (
                <div className="space-y-4">
                  <div className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-2">Final Simplification Steps</div>
                  {simplificationSteps.map((step, i) => (
                    <div key={`step-${i}`} className="flex flex-col gap-1 p-3 rounded bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
                      <div className="flex justify-between text-mini text-indigo-400 font-bold uppercase tracking-wider">
                        <span>Step {i + 1}</span>
                      </div>
                      <div className="font-bold text-violet-600 dark:text-cyan-300">
                        {step}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-2">Evolution Milestones</div>
                {historyMilestones.map((ms, i) => (
                  <div key={`ms-${i}`} className="flex flex-col gap-1 p-3 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div className="flex justify-between text-mini text-neutral-500 font-bold uppercase tracking-wider">
                      <span>Gen {ms.gen}</span>
                      <span>MSE: {formatMSE(ms.mse)}</span>
                    </div>
                    <div className="font-bold text-violet-600 dark:text-cyan-300">
                      y = {ms.eq}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Canvas utility functions ─────────────────────────────────

/** Draw the curve for an AST as a canvas path (does not call stroke). */
function drawCurvePath(
  ctx: CanvasRenderingContext2D,
  tree: ASTNode,
  xMin: number,
  xMax: number,
  toCanvasX: (x: number) => number,
  toCanvasY: (y: number) => number,
  canvasHeight: number,
) {
  ctx.beginPath();
  let started = false;
  const step = (xMax - xMin) / CURVE_SAMPLE_COUNT;

  for (let i = 0; i <= CURVE_SAMPLE_COUNT; i++) {
    const x = xMin + i * step;
    const y = evaluateAST(tree, x);

    if (!isFinite(y) || Math.abs(y) > 1e6) {
      started = false;
      continue;
    }

    const cx = toCanvasX(x);
    const cy = toCanvasY(y);

    // Clip to canvas bounds (with generous padding)
    if (cy < -canvasHeight || cy > canvasHeight * 2) {
      started = false;
      continue;
    }

    if (!started) {
      ctx.moveTo(cx, cy);
      started = true;
    } else {
      ctx.lineTo(cx, cy);
    }
  }
}

/** Pick a "nice" step size for axis grid lines. */
function niceStep(range: number): number {
  const rough = range / 8;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  if (norm < 1.5) return mag;
  if (norm < 3) return 2 * mag;
  if (norm < 7) return 5 * mag;
  return 10 * mag;
}

/** Format a number for axis labels. */
function fmtNum(v: number): string {
  if (Number.isInteger(v)) return v.toString();
  return v.toFixed(1);
}
