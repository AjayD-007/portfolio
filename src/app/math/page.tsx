import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ArrowRight, Infinity as InfinityIcon, Sparkles, Dna } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Heading, Text } from "@/components/ui/Typography";
import { Grid } from "@/components/layout/Grid";
import { Badge } from "@/components/ui/Badge";
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

const EXPERIMENTS = [
  {
    title: "Non-Euclidean Corridor",
    href: "/math/non-euclidean-world",
    description: "An impossible, infinite looping hallway built using shader-based global clipping planes, seamless treadmill mechanics, and physically correct lighting.",
    tags: ["WebGL", "Shaders"],
    icon: InfinityIcon,
    bgImage: "bg-[url('/pbr/rubberized_track_diff_1k.jpg')] opacity-20 mix-blend-overlay bg-cover bg-center",
  },
  {
    title: "Fractal Explorer",
    href: "/math/fractals?q=mandelbrot",
    description: "GPU-accelerated Mandelbrot set rendered entirely in a GLSL fragment shader with smooth escape-time coloring, 4x RGSS anti-aliasing, zoom, and pan.",
    tags: ["GLSL", "Fractals"],
    icon: Sparkles,
    bgClass: "bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)]",
  },
  {
    title: "Micro-Neural Network",
    href: "/math/llm/micronet",
    description: "An interactive, fully client-side Multi-Layer Perceptron built from scratch. Watch the network connections adapt and shift in real-time as it learns a text corpus.",
    tags: ["Machine Learning", "TypeScript"],
    icon: null,
    customBg: (
      <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 relative bg-neutral-200 dark:bg-neutral-900 flex items-center justify-center font-mono text-xs">
        <div className="absolute inset-0 opacity-10 dark:opacity-5 whitespace-pre-wrap p-2 leading-tight break-all">
          {"z1 = dot(W1, x) + b1\na1 = relu(z1)\nz2 = dot(W2, a1) + b2\na2 = softmax(z2)\nloss = -log(a2[target])"}
        </div>
        <div className="relative z-10 font-black text-4xl tracking-tighter text-black/40 dark:text-white/40 drop-shadow-md">
          MLP
        </div>
      </div>
    )
  },
  {
    title: "Equation Evolver",
    href: "/math/equation-evolver",
    description: "Paste raw data and watch a genetic algorithm physically evolve the mathematical equation that fits it. See equations mutate, crossover, and converge in real-time.",
    tags: ["Genetic Algorithm", "Symbolic Regression"],
    icon: Dna,
    bgClass: "bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.15)_0%,_transparent_70%)]",
  }
];

export default function MathHubPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Math & 3D Experiments",
    "description": "A sandbox for interactive 3D math, visual illusions, and rendering experiments.",
    "url": "https://ajay-dharmaraj.vercel.app/math",
    "hasPart": EXPERIMENTS.map(exp => ({
      "@type": "SoftwareApplication",
      "name": exp.title,
      "url": `https://ajay-dharmaraj.vercel.app${exp.href}`
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container maxWidth="7xl" className="min-h-screen pt-2 md:pt-4 pb-8 md:pb-16 flex-grow">
        <Section spacing="none" className="mb-10 md:mb-16">
          <Heading level={1} variant="section">
            Experiments
          </Heading>
          <Text variant="body">
            A sandbox for interactive 3D math, visual illusions, and rendering experiments built with React Three Fiber.
          </Text>
        </Section>

        <Grid columns={3}>
          {EXPERIMENTS.map((exp, idx) => {
            const Icon = exp.icon;
            return (
              <Link key={idx} href={exp.href} className="group h-full block">
                <Card variant="interactive" className="h-full flex flex-col justify-between hover:scale-[1.02] hover:-translate-y-1">
                  
                  {exp.customBg ? (
                    exp.customBg
                  ) : (
                    <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 relative bg-neutral-200 dark:bg-neutral-900 flex items-center justify-center">
                      <div className={`absolute inset-0 ${exp.bgImage || exp.bgClass || ''}`} />
                      {Icon && <Icon className="w-16 h-16 text-[var(--text-muted)] opacity-50 relative z-10 drop-shadow-lg" />}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Heading level={3} variant="card-interactive" className="!mb-0 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                        {exp.title}
                      </Heading>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 duration-300 shrink-0" />
                    </div>
                    <Text variant="muted" className="line-clamp-3">
                      {exp.description}
                    </Text>
                  </div>
                  
                  <div className="mt-6 flex flex-wrap gap-2">
                    {exp.tags.map((tag, tIdx) => (
                      <Badge key={tIdx}>{tag}</Badge>
                    ))}
                  </div>
                </Card>
              </Link>
            );
          })}
        </Grid>
      </Container>
    </>
  );
}
