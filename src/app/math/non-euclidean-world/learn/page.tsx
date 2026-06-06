import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Building an Infinite Non-Euclidean Corridor | AjayD",
  description: "A technical breakdown of creating impossible geometry, seamless loops, and shader-based global clipping planes in React Three Fiber.",
  openGraph: {
    title: "Building an Infinite Non-Euclidean Corridor",
    description: "Learn how shader-based global clipping planes and treadmill mechanics create impossible geometry in this 3D experiment.",
    type: "article",
  }
};

export default function NonEuclideanLearnPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Building an Infinite Non-Euclidean Corridor",
      "description": "A technical breakdown of creating impossible geometry, seamless loops, and shader-based global clipping planes in React Three Fiber.",
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
        { "@type": "ListItem", "position": 3, "name": "Non-Euclidean Corridor", "item": "https://ajay-dharmaraj.vercel.app/math/non-euclidean-world" },
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
      <main className="min-h-screen pt-2 md:pt-4 pb-16 px-4 md:px-6 bg-surface dark:bg-surface-dark">
        <article className="container mx-auto max-w-3xl">
          <Link href="/math/non-euclidean-world" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white no-underline mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to Corridor
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-black dark:text-white">Designing Impossible Geometry</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 font-medium leading-relaxed mb-12">
            A technical breakdown of creating a seamless, infinite non-Euclidean loop using React Three Fiber, treadmill mechanics, and WebGL clipping planes.
          </p>

          <div className="prose prose-neutral dark:prose-invert lg:prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-black dark:prose-a:text-white prose-img:rounded-xl">
            <hr className="my-8 border-black/10 dark:border-white/10" />

            <h2>The Illusion of Infinity</h2>
            <p>
              When you walk down the non-Euclidean corridor, it feels like you are walking infinitely forward, taking right turn after right turn. In reality, you are on a mathematical treadmill.
            </p>
            <p>
              Instead of moving the camera through an infinitely generated world, the camera remains relatively stationary while the world moves <em>around</em> it. The corridor is composed of discrete "chunks." As a chunk moves behind the camera, it is instantly teleported to the front of the line. This creates an endless loop using only a finite number of 3D meshes, heavily optimizing memory and rendering performance.
            </p>

            <h2>The Impossible Turn</h2>
            <p>
              The hallmark of a non-Euclidean space is geometry that contradicts standard physical laws—like taking four 90-degree right turns and ending up in a completely different hallway instead of where you started.
            </p>
            <p>
              To achieve this, I used <strong>Shader-Based Global Clipping Planes</strong>. 
            </p>
            <p>
              Normally, WebGL renders everything within the camera's frustum. However, I injected custom GLSL code into the materials of the hallway walls. I defined a mathematical plane in 3D space located exactly at the threshold of the right-hand turn. As the camera approaches the corner, any pixel of the "blocking" wall that crosses this mathematical plane is instantly discarded (<code>discard;</code>) in the fragment shader. 
            </p>
            <p>
              This dynamically punches a perfect, pixel-accurate hole into the solid wall, revealing the hidden corridor extension behind it right as you look into the turn.
            </p>

            <h2>Cinematic Camera Mechanics</h2>
            <p>
              To ground the impossible geometry in reality, the camera uses a highly flattened 50mm cinematic telephoto lens. This flattens the perspective, making the corridor look longer and more dramatic, while obscuring the teleportation of chunks in the far distance. The scroll-driven movement applies easing and damping to simulate the weight and inertia of walking.
            </p>
          </div>

          <div className="mt-16 p-8 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 text-center">
            <h3 className="text-2xl font-bold text-black dark:text-white mb-3">Experience the illusion</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Walk the infinite corridor and see the clipping planes in action.</p>
            <Link 
              href="/math/non-euclidean-world" 
              className="inline-block px-8 py-4 bg-black dark:bg-white hover:bg-black/80 dark:hover:bg-white/80 text-white dark:text-black rounded-xl font-bold tracking-widest uppercase transition-all hover:scale-105 shadow-xl no-underline"
            >
              Enter Corridor
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
