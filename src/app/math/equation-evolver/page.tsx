import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EquationEvolution } from "@/components/experiments/EquationEvolution";
import { Container } from "@/components/layout/Container";
import { Heading, Text } from "@/components/ui/Typography";

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
      <Container maxWidth="full" className="min-h-screen pt-4 pb-16 flex-grow">
        <div className="mb-8">
          <Link
            href="/math"
            className="inline-flex items-center transition-colors mb-6 text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            <Text variant="label" className="flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back to Experiments</Text>
          </Link>

          <Heading level={1} variant="section" className="!mb-2">
            Equation Evolver
          </Heading>
          <Text variant="body" className="">
            Paste raw data and watch a genetic algorithm discover the hidden
            mathematical equation. Equations mutate, crossover, and converge —
            all visualized in real-time.{" "}
            <Link
              href="/math/equation-evolver/learn"
              className="text-[var(--text-main)] underline font-semibold"
            >
              How does this work? →
            </Link>
          </Text>
        </div>

        <EquationEvolution />
      </Container>
    </>
  );
}
