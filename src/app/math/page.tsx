import Link from "next/link";
import { GlassCard } from "@/components/GlassCard";
import { ArrowRight, Infinity as InfinityIcon, Sparkles } from "lucide-react";

export const metadata = {
  title: "Math & Experiments | AjayD",
  description: "A collection of interactive 3D math experiments and visual illusions.",
};

export default function MathHubPage() {
  return (
    <main className="min-h-screen pt-32 pb-16 px-4 md:px-6">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 mb-16">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-500">
            Experiments
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl font-medium">
            A sandbox for interactive 3D math, visual illusions, and rendering experiments built with React Three Fiber.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/math/non-euclidean-world" className="group h-full block">
            <GlassCard className="h-full flex flex-col justify-between transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-white/5 cursor-pointer border border-transparent hover:border-black/10 dark:hover:border-white/10">
              
              <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 relative bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900 flex items-center justify-center">
                <div className="absolute inset-0 bg-[url('/pbr/rubberized_track_diff_1k.jpg')] opacity-20 mix-blend-overlay bg-cover bg-center" />
                <InfinityIcon className="w-16 h-16 text-black/20 dark:text-white/20 relative z-10 drop-shadow-lg" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold tracking-tight text-black dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Non-Euclidean Corridor
                  </h2>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 duration-300" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                  An impossible, infinite looping hallway built using shader-based global clipping planes, seamless treadmill mechanics, and physically correct lighting.
                </p>
              </div>
              
              <div className="mt-6 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-black/5 dark:bg-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 backdrop-blur-sm">
                  WebGL
                </span>
                <span className="px-2.5 py-1 rounded-md bg-black/5 dark:bg-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 backdrop-blur-sm">
                  Shaders
                </span>
              </div>
            </GlassCard>
          </Link>

          {/* Fractal Explorer */}
          <Link href="/math/fractals" className="group h-full block">
            <GlassCard className="h-full flex flex-col justify-between transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-white/5 cursor-pointer border border-transparent hover:border-black/10 dark:hover:border-white/10">
              
              <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 relative bg-gradient-to-br from-indigo-950 to-black flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.3)_0%,_transparent_70%)]" />
                <Sparkles className="w-16 h-16 text-indigo-400/40 relative z-10 drop-shadow-lg" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold tracking-tight text-black dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                    Fractal Explorer
                  </h2>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-400 transition-colors opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 duration-300" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                  GPU-accelerated Mandelbrot set rendered entirely in a GLSL fragment shader with smooth escape-time coloring, 4x RGSS anti-aliasing, zoom, and pan.
                </p>
              </div>
              
              <div className="mt-6 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-black/5 dark:bg-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 backdrop-blur-sm">
                  GLSL
                </span>
                <span className="px-2.5 py-1 rounded-md bg-black/5 dark:bg-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 backdrop-blur-sm">
                  Fractals
                </span>
              </div>
            </GlassCard>
          </Link>
        </div>
      </div>
    </main>
  );
}
