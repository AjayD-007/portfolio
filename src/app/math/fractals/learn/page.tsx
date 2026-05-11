import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "The Math Behind the Mandelbrot Explorer | AjayD",
  description: "A deep dive into Perturbation Theory, WebGL rendering, and Float64 emulation used to achieve infinite zoom in the Mandelbrot set.",
  openGraph: {
    title: "The Math Behind the Mandelbrot Explorer",
    description: "Learn how Perturbation Theory and Float64 emulation enable infinite zoom in this WebGL Fractal Explorer.",
    type: "article",
  }
};

export default function MandelbrotLearnPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "The Math Behind the Mandelbrot Explorer",
      "description": "A deep dive into Perturbation Theory, WebGL rendering, and Float64 emulation used to achieve infinite zoom in the Mandelbrot set.",
      "author": {
        "@type": "Person",
        "name": "AjayD"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://ajay-dharmaraj.vercel.app" },
        { "@type": "ListItem", "position": 2, "name": "Math & Experiments", "item": "https://ajay-dharmaraj.vercel.app/math" },
        { "@type": "ListItem", "position": 3, "name": "Fractal Explorer", "item": "https://ajay-dharmaraj.vercel.app/math/fractals" },
        { "@type": "ListItem", "position": 4, "name": "Learn" }
      ]
    }
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen pt-2 md:pt-4 pb-16 px-4 md:px-6 bg-white dark:bg-[#0a0a0a]">
        <article className="container mx-auto max-w-3xl">
          <Link href="/math/fractals" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white no-underline mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to Explorer
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-black dark:text-white">The Architecture of Infinite Zoom</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 font-medium leading-relaxed mb-12">
            How I built a WebGL Mandelbrot explorer capable of bypassing JavaScript's native precision limits to achieve deep zooming using Perturbation Theory.
          </p>

          <div className="prose prose-neutral dark:prose-invert lg:prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-black dark:prose-a:text-white prose-img:rounded-xl">
            <hr className="my-8 border-black/10 dark:border-white/10" />

            <h2>The Precision Problem</h2>
            <p>
              Standard 32-bit and 64-bit floating-point numbers break down extremely quickly when zooming into the Mandelbrot set. In a typical GLSL fragment shader, pixels use <code>highp float</code> (IEEE 754 single-precision, 32-bit). Around a zoom level of 10<sup>4</sup>, coordinates lose precision, and the beautiful fractal turns into a blocky, pixelated staircase.
            </p>
            <p>
              To push past this, we need higher precision. But GPUs don't natively handle arbitrary-precision math efficiently.
            </p>

            <h2>Float64 Emulation in GLSL</h2>
            <p>
              For intermediate zooms (up to 10<sup>14</sup>), I implemented a simulated double-precision (df64) architecture directly in the WebGL fragment shader. By representing a single 64-bit float as two 32-bit floats—a <code>high</code> part and a <code>low</code> part—we can perform complex arithmetic with significantly higher precision without leaving the GPU.
            </p>
            
            <h2>Perturbation Theory (The Infinite Zoom)</h2>
            <p>
              Float64 emulation only gets us to 10<sup>14</sup>. To go infinitely deep, we use a mathematical technique called <strong>Perturbation Theory</strong>.
            </p>
            <p>
              Instead of calculating every pixel from scratch, we use the CPU (via the <code>decimal.js</code> library) to calculate an incredibly precise <em>Reference Orbit</em> at the very center of the screen. This reference orbit is computed using arbitrary precision math, which is slow but highly accurate. 
            </p>
            <p>
              We then upload this reference orbit to the GPU as a Data Texture. The GPU shader no longer calculates the absolute position of every pixel; instead, it only calculates the <em>difference</em> (the delta) between the pixel and the reference orbit. Because the difference is extremely small, standard 32-bit floats are perfectly fine to calculate it!
            </p>

            <h2>The Coloring Algorithm</h2>
            <p>
              The signature look of the fractal comes from an escape-time algorithm with smooth fractional coloring. Instead of banding colors based strictly on the integer iteration count where the orbit escaped, we use a continuous formula to interpolate smoothly between the core and aura palettes, producing those vivid, electric gradients.
            </p>
          </div>

          <div className="mt-16 p-8 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 text-center">
            <h3 className="text-2xl font-bold text-black dark:text-white mb-3">Ready to explore?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Dive into the fractal and test the Perturbation Theory rendering yourself.</p>
            <Link 
              href="/math/fractals" 
              className="inline-block px-8 py-4 bg-black dark:bg-white hover:bg-black/80 dark:hover:bg-white/80 text-white dark:text-black rounded-xl font-bold tracking-widest uppercase transition-all hover:scale-105 shadow-xl no-underline"
            >
              Launch Explorer
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
