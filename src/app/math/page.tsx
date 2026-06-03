import Link from "next/link";
import { GlassCard } from "@/components/GlassCard";
import { ArrowRight, Infinity as InfinityIcon, Sparkles, Dna } from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Math & 3D Experiments | AjayD",
  description: "A sandbox for interactive 3D math, visual illusions, and WebGL rendering experiments built with React Three Fiber.",
  keywords: ["Interactive Math", "React Three Fiber", "WebGL", "Shaders", "Fractals", "Non-Euclidean Geometry", "3D Experiments"],
  openGraph: {
    title: "Math & 3D Experiments | AjayD",
    description: "Explore a collection of interactive 3D math experiments including infinite Mandelbrot zooms and non-Euclidean corridors.",
    type: "website",
  }
};

export default function MathHubPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Math & 3D Experiments",
    "description": "A sandbox for interactive 3D math, visual illusions, and rendering experiments.",
    "url": "https://ajay-dharmaraj.vercel.app/math",
    "hasPart": [
      {
        "@type": "SoftwareApplication",
        "name": "Mandelbrot Fractal Explorer",
        "url": "https://ajay-dharmaraj.vercel.app/math/fractals"
      },
      {
        "@type": "SoftwareApplication",
        "name": "Non-Euclidean Corridor",
        "url": "https://ajay-dharmaraj.vercel.app/math/non-euclidean-world"
      },
      {
        "@type": "SoftwareApplication",
        "name": "Equation Evolver",
        "url": "https://ajay-dharmaraj.vercel.app/math/equation-evolver"
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen pt-2 md:pt-4 pb-8 md:pb-16 px-4 md:px-6">
      <div className="container mx-auto ">
        <div className="flex flex-col gap-3 md:gap-4 mb-10 md:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-500">
            Experiments
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl font-medium">
            A sandbox for interactive 3D math, visual illusions, and rendering experiments built with React Three Fiber.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Link href="/math/non-euclidean-world" className="group h-full block">
            <GlassCard className="h-full flex flex-col justify-between transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-white/5 cursor-pointer border border-transparent hover:border-black/10 dark:hover:border-white/10">
              
              <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 relative bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900 flex items-center justify-center">
                <div className="absolute inset-0 bg-[url('/pbr/rubberized_track_diff_1k.jpg')] opacity-20 mix-blend-overlay bg-cover bg-center" />
                <InfinityIcon className="w-16 h-16 text-black/20 dark:text-white/20 relative z-10 drop-shadow-lg" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold tracking-tight text-black dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                    Non-Euclidean Corridor
                  </h2>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 duration-300" />
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
          <Link href="/math/fractals?q=mandelbrot" className="group h-full block">
            <GlassCard className="h-full flex flex-col justify-between transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-white/5 cursor-pointer border border-transparent hover:border-black/10 dark:hover:border-white/10">
              
              <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 relative bg-gradient-to-br from-neutral-900 to-black flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)]" />
                <Sparkles className="w-16 h-16 text-white/20 relative z-10 drop-shadow-lg" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold tracking-tight text-black dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                    Fractal Explorer
                  </h2>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 duration-300" />
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

          {/* Micro-Neural Network */}
          <Link href="/math/llm/micronet" className="group h-full block">
            <GlassCard className="h-full flex flex-col justify-between transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-white/5 cursor-pointer border border-transparent hover:border-black/10 dark:hover:border-white/10">
              
              <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 relative bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 flex items-center justify-center font-mono text-xs overflow-hidden">
                <div className="absolute inset-0 opacity-10 dark:opacity-5 whitespace-pre-wrap p-2 leading-tight break-all">
                  {"z1 = dot(W1, x) + b1\na1 = relu(z1)\nz2 = dot(W2, a1) + b2\na2 = softmax(z2)\nloss = -log(a2[target])"}
                </div>
                <div className="relative z-10 font-black text-4xl tracking-tighter text-black/40 dark:text-white/40 drop-shadow-md">
                  MLP
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold tracking-tight text-black dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                    Micro-Neural Network
                  </h2>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 duration-300" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                  An interactive, fully client-side Multi-Layer Perceptron built from scratch. Watch the network connections adapt and shift in real-time as it learns a text corpus.
                </p>
              </div>
              
              <div className="mt-6 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-black/5 dark:bg-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 backdrop-blur-sm">
                  Machine Learning
                </span>
                <span className="px-2.5 py-1 rounded-md bg-black/5 dark:bg-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 backdrop-blur-sm">
                  TypeScript
                </span>
              </div>
            </GlassCard>
          </Link>

          {/* Equation Evolver */}
          <Link href="/math/equation-evolver" className="group h-full block">
            <GlassCard className="h-full flex flex-col justify-between transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-white/5 cursor-pointer border border-transparent hover:border-black/10 dark:hover:border-white/10">
              
              <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 relative bg-gradient-to-br from-violet-100 to-cyan-100 dark:from-violet-950 dark:to-cyan-950 flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.15)_0%,_transparent_70%)]" />
                <Dna className="w-16 h-16 text-violet-400/40 dark:text-violet-300/20 relative z-10 drop-shadow-lg" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold tracking-tight text-black dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                    Equation Evolver
                  </h2>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 duration-300" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                  Paste raw data and watch a genetic algorithm physically evolve the mathematical equation that fits it. See equations mutate, crossover, and converge in real-time.
                </p>
              </div>
              
              <div className="mt-6 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-black/5 dark:bg-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 backdrop-blur-sm">
                  Genetic Algorithm
                </span>
                <span className="px-2.5 py-1 rounded-md bg-black/5 dark:bg-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 backdrop-blur-sm">
                  Symbolic Regression
                </span>
              </div>
            </GlassCard>
          </Link>
        </div>
      </div>
    </main>
    </>
  );
}
