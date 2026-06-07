import React from "react";
import Decimal from "decimal.js";
import Link from "next/link";
import { ExperimentSidebar } from "@/components/layout/ExperimentSidebar";

export function Sidebar({
  zoom,
  maxIter,
  onMaxIter,
  colorA,
  onColorA,
  colorB,
  onColorB,
  density,
  onDensity,
  onReset,
  onDownload,
  devData,
}: {
  zoom: Decimal;
  maxIter: number;
  onMaxIter: (v: number) => void;
  colorA: string;
  onColorA: (v: string) => void;
  colorB: string;
  onColorB: (v: string) => void;
  density: number;
  onDensity: (v: number) => void;
  onReset: () => void;
  onDownload: () => void;
  devData?: { cx: string; cy: string; mx: number; my: number; rox: number; roy: number; pt: boolean };
}) {
  const zoomNum = zoom.toNumber();
  const isDeep = zoomNum > 1e14;
  const mode = "Perturbation Theory";
  
  // Use exponential notation, formatting Decimal
  let zoomStr = "";
  if (zoom.gte(1e6)) {
    zoomStr = zoom.toExponential(3) + "×";
  } else {
    zoomStr = zoom.toNumber().toFixed(1) + "×";
  }
  const [hideDebug, setHideDebug] = React.useState(false);

  return (
    <ExperimentSidebar variant="glass" title="Fractal Explorer" subtitle="Mandelbrot Set">
      <div className="px-5 py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white/40 dark:bg-white/5 shrink-0">
        <div>
          <p className="text-mini font-bold uppercase tracking-[0.2em] text-black/50 dark:text-white/50 mb-1">
            Fractal Explorer
          </p>
          <p className="font-mono text-sm font-semibold text-black dark:text-white">{zoomStr}</p>
        </div>
        <div
          className={`text-micro px-2 py-1 rounded-full flex items-center gap-1.5 font-semibold tracking-wide ${
            isDeep ? "text-black/70 bg-black/10 dark:text-white/70 dark:bg-white/10" : "text-black/70 bg-black/10 dark:text-white/70 dark:bg-white/10"
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-pulse`} />
          {isDeep ? "PT" : "GPU"}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style dangerouslySetInnerHTML={{__html: `::-webkit-scrollbar { display: none; }`}} />
        
        {process.env.NODE_ENV === "development" && devData && !hideDebug && (
          <div className="px-5 py-3 border-b border-black/5 dark:border-white/5 bg-red-500/5 relative">
            <button onClick={() => setHideDebug(true)} className="absolute top-2 right-2 text-red-500/50 hover:text-red-500 text-mini font-bold px-1 rounded hover:bg-red-500/10 transition-colors">HIDE</button>
            <p className="text-micro font-bold uppercase tracking-[0.2em] text-red-500 mb-2">
              Dev Debug
            </p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-mini font-mono text-black/60 dark:text-white/60">
              <div className="text-black/40 dark:text-white/40">CX:</div><div className="truncate">{devData.cx}</div>
              <div className="text-black/40 dark:text-white/40">CY:</div><div className="truncate">{devData.cy}</div>
              <div className="text-black/40 dark:text-white/40">Mouse:</div><div>{devData.mx}, {devData.my}</div>
              <div className="text-black/40 dark:text-white/40">Ref dX:</div><div className="truncate" title={devData.rox.toString()}>{devData.rox.toExponential(2)}</div>
              <div className="text-black/40 dark:text-white/40">Ref dY:</div><div className="truncate" title={devData.roy.toString()}>{devData.roy.toExponential(2)}</div>
              <div className="text-black/40 dark:text-white/40">PT Active:</div><div>{devData.pt ? "Yes" : "No"}</div>
            </div>
          </div>
        )}

        {process.env.NODE_ENV === "development" && devData && hideDebug && (
          <div className="px-5 py-2 border-b border-black/5 dark:border-white/5 bg-red-500/5 flex justify-between items-center cursor-pointer hover:bg-red-500/10" onClick={() => setHideDebug(false)}>
            <p className="text-micro font-bold uppercase tracking-[0.2em] text-red-500/50">Dev Debug (Hidden)</p>
            <span className="text-red-500/50 text-mini font-bold">+</span>
          </div>
        )}

        <div className="flex flex-col gap-6 p-5">
          <div>
            <p className="text-mini font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 mb-3">Palette</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-mini text-black/60 dark:text-white/60 mb-1.5 block font-medium">Inside</label>
                <input
                  type="color"
                  value={colorA}
                  onChange={(e) => onColorA(e.target.value)}
                  className="w-full h-8 rounded-md cursor-pointer border-0 p-0 bg-transparent overflow-hidden shadow-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-mini text-black/60 dark:text-white/60 mb-1.5 block font-medium">Outside</label>
                <input
                  type="color"
                  value={colorB}
                  onChange={(e) => onColorB(e.target.value)}
                  className="w-full h-8 rounded-md cursor-pointer border-0 p-0 bg-transparent overflow-hidden shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-black/5 dark:bg-white/5" />

          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="text-mini font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
                Density
              </label>
              <span className="text-mini font-mono text-black/60 dark:text-white/60">{density.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={8}
              step={0.1}
              value={density}
              onChange={(e) => onDensity(Number(e.target.value))}
              className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
            />
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="text-mini font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
                Resolution
              </label>
              <span className="text-mini font-mono text-black/60 dark:text-white/60">{maxIter} iter</span>
            </div>
            <input
              type="range"
              min={64}
              max={4096}
              step={64}
              value={maxIter}
              onChange={(e) => onMaxIter(Number(e.target.value))}
              className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
            />
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-black/5 dark:border-white/5 flex flex-col gap-2 bg-white/40 dark:bg-white/5 shrink-0 ">
        <Link 
          href="/math/fractals/learn?q=mandelbrot"
          className="w-full py-2 rounded-lg bg-white dark:bg-black border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white text-xs font-bold text-center transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
        >
           Learn the Math
        </Link>
        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="flex-1 py-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/70 dark:text-white/70 text-mini font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Reset
          </button>
          <button
            onClick={onDownload}
            className="flex-[2] py-2 rounded-lg bg-black dark:bg-white hover:bg-black/80 dark:hover:bg-white/80 text-white dark:text-black shadow-lg text-mini font-bold uppercase tracking-wider transition-all hover:scale-[1.02] cursor-pointer"
          >
            Export PNG
          </button>
        </div>
      </div>
    </ExperimentSidebar>
  );
}
