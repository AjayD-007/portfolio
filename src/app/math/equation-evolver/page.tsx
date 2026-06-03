import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EquationEvolution } from "@/components/experiments/EquationEvolution";

export const metadata: Metadata = {
  title: "Equation Evolver — Symbolic Regression | AjayD",
  description:
    "Paste raw X/Y data and watch a genetic algorithm physically evolve the mathematical equation that fits it. See equations mutate, crossover, and converge in real-time.",
  keywords: [
    "Symbolic Regression",
    "Genetic Algorithm",
    "Equation Discovery",
    "Data Fitting",
    "Interactive Math",
    "Evolutionary Computing",
  ],
  openGraph: {
    title: "Equation Evolver — Symbolic Regression | AjayD",
    description:
      "An interactive genetic algorithm that discovers mathematical equations from raw data. Watch the evolution process live on a custom Canvas visualization.",
    type: "website",
  },
};

export default function EquationEvolverPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Equation Evolver — Symbolic Regression Visualizer",
    description:
      "An interactive browser tool that uses a Genetic Algorithm to discover the mathematical equation hidden in raw X/Y data, with real-time animated visualization of the evolution process.",
    url: "https://ajay-dharmaraj.vercel.app/math/equation-evolver",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen pt-4 pb-16 px-4 md:px-6">
        <div className="container mx-auto">
          <div className="mb-8">
            <Link
              href="/math"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Experiments
            </Link>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-black dark:text-white mb-2">
              Equation Evolver
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl font-medium">
              Paste raw data and watch a genetic algorithm discover the hidden
              mathematical equation. Equations mutate, crossover, and converge —
              all visualized in real-time.{" "}
              <Link
                href="/math/equation-evolver/learn"
                className="text-black dark:text-white hover:underline font-semibold"
              >
                How does this work? →
              </Link>
            </p>
          </div>

          <EquationEvolution />
        </div>
      </main>
    </>
  );
}
