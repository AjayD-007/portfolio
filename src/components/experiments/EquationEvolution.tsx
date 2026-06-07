"use client";

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  Play, Pause, RotateCcw, Dna, Zap,
  TrendingDown, Hash, FlaskConical, SlidersHorizontal,
  FileText, Trash2, Copy, Check, Maximize, History
, X, Square} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Heading, Text } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { ExperimentLayout } from '@/components/layout/ExperimentLayout';
import { ExperimentSidebar } from '@/components/layout/ExperimentSidebar';
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
  bg: 'var(--bg-surface)',
  grid: 'rgba(255, 255, 255, 0.04)',
  axis: 'rgba(255, 255, 255, 0.12)',
  axisLabel: 'rgba(255, 255, 255, 0.30)',
  dataDot: '#06b6d4',
  dataDotGlow: 'rgba(6, 182, 212, 0.35)',
  bestCurve: '#d946ef',
  bestCurveEnd: '#06b6d4',
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


// ─────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────

export function EquationEvolution() {
  // ── State ──────────────────────────────────────────────────

  const router = useRouter();
  const [rawInput, setRawInput] = useState(() => dataToCSV(generateNoisyQuadratic(30)));
  const [populationSize, setPopulationSize] = useState(500);
  const [maxGenerations, setMaxGenerations] = useState(200);
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
      ctx.fillStyle = '#353535';
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
        maxGenerations,
        mutationRate,
        data: parsedData,
      },
    });
  }, [parsedData, populationSize, maxGenerations, mutationRate]);

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
      <svg
        viewBox="0 0 500 80"
        className="w-full h-full stroke-accent-secondary fill-none stroke-[3]"
        preserveAspectRatio="none"
      >
        <polyline points={points} strokeLinejoin="round" />
      </svg>
    );
  }, [fitnessHistory]);

  return (
    <ExperimentLayout
      sidebar={
        <ExperimentSidebar title="Equation Evolver" subtitle="Algorithm" variant="standard">
          {/* Best Equation Panel */}
          <section className="space-y-3 bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-main)] shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                <Dna className="w-4 h-4" />
                Best Equation
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(true)}
                  disabled={historyMilestones.length === 0}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold transition-colors disabled:opacity-30 text-[var(--text-main)]"
                >
                  <History className="w-3 h-3" />
                  History
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!bestEquation}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold transition-colors disabled:opacity-30 text-[var(--text-main)]"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
            <div className="font-mono text-xl font-black text-accent-secondary break-all min-h-[2.5rem] transition-all duration-200">
              {bestEquation || (
                <span className="text-[var(--text-muted)] font-normal text-xs italic opacity-50">
                  No equation yet
                </span>
              )}
            </div>
          </section>

          {/* Data Input */}
          <section className="space-y-3">
            <Text variant="label" className="border-b border-neutral-300 dark:border-white/10 pb-2 flex items-center gap-2">
              <span className="bg-black dark:bg-white text-white dark:text-black w-5 h-5 rounded flex items-center justify-center text-xs font-black">1</span>
              Data Points
            </Text>
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
              className="w-full h-36 p-3 text-xs rounded-lg bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 placeholder:text-neutral-400 focus:outline-none focus:border-accent-primary dark:focus:border-cyan-400 disabled:opacity-40 resize-none font-mono shadow-sm transition-colors leading-relaxed"
            />
            {uploadError && (
              <Text variant="muted" className="!text-xs font-bold text-red-500 mt-1">
                Invalid data format. Please use X, Y numeric pairs.
              </Text>
            )}
            <div className="flex gap-2">
              <input
                type="file"
                accept=".csv,.txt"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isEvolving}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 uppercase tracking-wider"
              >
                <FileText className="w-3.5 h-3.5" />
                Upload CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearData}
                disabled={isEvolving}
                className="flex-[0.5] flex items-center justify-center gap-1.5 text-xs py-1.5 uppercase tracking-wider bg-red-100/50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-200/50 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </Button>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                variant={activePreset === 'quad' ? 'primary' : 'secondary'}
                size="sm"
                id="preset-quad"
                onClick={() => loadPreset('quad')}
                disabled={isEvolving}
                className="flex-1 text-xs py-1.5 uppercase tracking-wider"
              >
                Quadratic
              </Button>
              <Button
                variant={activePreset === 'sine' ? 'primary' : 'secondary'}
                size="sm"
                id="preset-sine"
                onClick={() => loadPreset('sine')}
                disabled={isEvolving}
                className="flex-1 text-xs py-1.5 uppercase tracking-wider"
              >
                Sine Wave
              </Button>
              <Button
                variant={activePreset === 'linear' ? 'primary' : 'secondary'}
                size="sm"
                id="preset-linear"
                onClick={() => loadPreset('linear')}
                disabled={isEvolving}
                className="flex-1 text-xs py-1.5 uppercase tracking-wider"
              >
                Linear
              </Button>
            </div>
          </section>

          {/* Parameters */}
          <section className="space-y-4">
            <Text variant="label" className="border-b border-neutral-300 dark:border-white/10 pb-2 flex items-center gap-2">
              <span className="bg-black dark:bg-white text-white dark:text-black w-5 h-5 rounded flex items-center justify-center text-xs font-black">2</span>
              Evolution Config
            </Text>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Text variant="muted" className="!text-[10px] uppercase font-bold">Pop Size</Text>
                <input
                  type="number"
                  min={10} max={200}
                  value={populationSize}
                  onChange={e => setPopulationSize(Number(e.target.value))}
                  disabled={isEvolving}
                  className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 p-2 rounded text-xs font-mono disabled:opacity-50 focus:outline-none focus:border-accent-secondary"
                />
              </div>
              <div className="space-y-1">
                <Text variant="muted" className="!text-[10px] uppercase font-bold">Max Gen</Text>
                <input
                  type="number"
                  min={10} max={1000}
                  value={maxGenerations}
                  onChange={e => setMaxGenerations(Number(e.target.value))}
                  disabled={isEvolving}
                  className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 p-2 rounded text-xs font-mono disabled:opacity-50 focus:outline-none focus:border-accent-secondary"
                />
              </div>
            </div>
          </section>

          {/* Controls */}
          <section className="pt-2">
            <div className="grid grid-cols-2 gap-2">
              {!isEvolving && generation > 0 ? (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={startEvolution}
                    className="flex items-center justify-center gap-2 font-bold py-3 shadow-[var(--shadow-glow-primary)]"
                  >
                    <Play className="w-4 h-4" /> Restart
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsEvolving(false);
                      setIsPaused(false);
                      setConverged(false);
                      setBestEquation('');
                      setBestFitness(0);
                      setGeneration(0);
                      setFitnessHistory([]);
                      setHistoryMilestones([]);
                      setSimplificationSteps([]);
                    }}
                    className="flex items-center justify-center gap-2 font-bold py-3 border border-neutral-300 dark:border-white/20"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset
                  </Button>
                </>
              ) : (
                <>
                  {isEvolving ? (
                    <Button
                      variant={isPaused ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => setIsPaused(!isPaused)}
                      className={`flex items-center justify-center gap-2 font-bold py-3 border ${
                        isPaused ? "border-transparent bg-amber-500 hover:bg-amber-600 text-white" : "border-neutral-300 dark:border-white/20"
                      }`}
                    >
                      {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={startEvolution}
                      className="col-span-2 flex items-center justify-center gap-2 font-bold py-3 text-sm shadow-[var(--shadow-glow-primary)]"
                    >
                      <Zap className="w-4 h-4" />
                      Evolve Equation
                    </Button>
                  )}
                  {isEvolving && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEvolving(false)}
                      className="flex items-center justify-center gap-2 font-bold py-3 border border-red-500/30 hover:bg-red-500/10 text-red-500"
                    >
                      <Square className="w-4 h-4" /> Stop
                    </Button>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Metrics */}
          <section className="space-y-4 pt-4 border-t border-neutral-200 dark:border-white/10 mt-6">
            <Text variant="label" className="flex items-center justify-between">
              Live Metrics
              {isAdapting && !isPaused && <span className="text-[10px] text-accent-secondary animate-pulse flex items-center gap-1"><Zap className="w-3 h-3"/> ADAPTING</span>}
            </Text>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-lg p-3 text-center shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-accent-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1">Generation</div>
                <div className="font-mono text-2xl font-black text-accent-primary">
                  {generation}
                </div>
              </div>
              
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-lg p-3 text-center shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1">MSE Loss</div>
                <div className={`font-mono text-2xl font-black ${bestFitness < 0.1 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {formatMSE(bestFitness)}
                </div>
              </div>
            </div>

            {/* Fitness sparkline */}
            <div className="h-16 w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-lg p-2 relative overflow-hidden">
              {sparkline ?? (
                <div className="w-full h-full flex items-center justify-center text-mini text-neutral-400 font-mono">
                  Awaiting evolution…
                </div>
              )}
            </div>
          </section>
        </ExperimentSidebar>
      }
    >
      {/* ─── Fullscreen Canvas ─── */}
      <div
        ref={containerRef}
        className="absolute inset-0 bg-[var(--bg-surface)] overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full mix-blend-screen opacity-90 dark:opacity-100"
        />

        {/* Status badges */}
        <div className="absolute top-24 md:top-32 left-1/2 -translate-x-1/2 z-50 flex gap-2">
            {isEvolving && !isPaused && (
              <div className="flex items-center gap-2 bg-[var(--bg-surface-elevated)] backdrop-blur-md border border-[var(--border-main)] rounded-full px-4 py-2 text-sm font-bold text-[var(--text-main)] shadow-2xl">
                <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
                Evolving…
              </div>
            )}
            {isEvolving && isPaused && (
              <div className="flex items-center gap-2 bg-[var(--bg-surface-elevated)] backdrop-blur-md border border-[var(--border-main)] rounded-full px-4 py-2 text-sm font-bold text-amber-500 shadow-2xl">
                <Pause className="w-4 h-4" />
                Paused
              </div>
            )}
            {converged && !isEvolving && (
              <div className="flex items-center gap-2 bg-[var(--bg-surface-elevated)] backdrop-blur-md border border-[var(--border-main)] rounded-full px-4 py-2 text-sm font-bold text-emerald-500 shadow-2xl animate-in fade-in zoom-in duration-500">
                <Zap className="w-4 h-4" />
                Converged!
              </div>
            )}
            {isAdapting && !isPaused && !converged && (
              <div className="flex items-center gap-2 bg-[var(--bg-surface-elevated)] backdrop-blur-md border border-[var(--border-main)] rounded-full px-4 py-2 text-sm font-bold text-accent-secondary shadow-2xl animate-in fade-in duration-300">
                <Zap className="w-4 h-4 animate-pulse" />
                Auto-Adapting...
              </div>
            )}
        </div>

        {/* Empty state */}
        {!isEvolving && generation === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none pr-80">
            <div className="text-center space-y-2 opacity-40">
              <FlaskConical className="w-12 h-12 mx-auto text-[var(--text-muted)]" />
              <Text variant="muted">
                Load data & click <span className="font-bold text-accent-secondary">Evolve Equation</span>
              </Text>
            </div>
          </div>
        )}
        
        {/* Extrapolate toggle */}
        <div className="absolute bottom-8 left-8 z-10 flex gap-2">
          <Button
            variant={isExtrapolating ? "primary" : "nav"}
            size="sm"
            onClick={() => setIsExtrapolating(!isExtrapolating)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full !font-bold backdrop-blur-md ${isExtrapolating ? 'bg-accent-secondary text-white border-transparent' : ''}`}
          >
            <Maximize className="w-4 h-4" />
            Extrapolate
          </Button>
        </div>
      </div>
      
      {/* Derivation History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowHistory(false)}>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 md:p-6 border-b border-neutral-200 dark:border-white/10 flex justify-between items-center">
              <div>
                <Heading level={3} variant="card-subtitle" className="!mb-0 !text-lg">Derivation Trace</Heading>
                <Text variant="muted" className="!text-xs">Milestone equations discovered during evolution.</Text>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)} className="rounded-full">
                <RotateCcw className="w-4 h-4 rotate-45" />
              </Button>
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
                      <div className="font-bold text-accent-secondary dark:text-accent-primary">
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
                    <div className="font-bold text-accent-secondary dark:text-accent-primary">
                      y = {ms.eq}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </ExperimentLayout>
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
