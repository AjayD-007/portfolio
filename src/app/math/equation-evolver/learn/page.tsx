import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "How the Equation Evolver Works | AjayD",
  description: "A deep dive into Genetic Programming, Abstract Syntax Trees, and how evolutionary algorithms discover mathematical equations hidden in raw data.",
  openGraph: {
    title: "How the Equation Evolver Works",
    description: "Learn how Genetic Programming and AST-based symbolic regression evolve equations from raw data using crossover, mutation, and natural selection.",
    type: "article",
  }
};

export default function EquationEvolverLearnPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "How the Equation Evolver Works",
      "description": "A deep dive into Genetic Programming, Abstract Syntax Trees, and evolutionary algorithms for symbolic regression.",
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
        { "@type": "ListItem", "position": 3, "name": "Equation Evolver", "item": "https://ajay-dharmaraj.vercel.app/math/equation-evolver" },
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
          <Link href="/math/equation-evolver" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white no-underline mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to Evolver
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-black dark:text-white">How the Equation Evolver Works</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 font-medium leading-relaxed mb-12">
            A deep dive into Genetic Programming — how equations are represented as trees, compete for survival, and evolve through crossover and mutation to fit your data.
          </p>

          <div className="prose prose-neutral dark:prose-invert lg:prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-black dark:prose-a:text-white prose-img:rounded-xl">
            <hr className="my-8 border-black/10 dark:border-white/10" />

            <h2>The Hidden Physics Problem</h2>
            <p>
              Imagine you have a set of experimental measurements — raw X/Y data points scattered across a chart. You suspect there&apos;s a mathematical law governing the relationship, but you don&apos;t know what it is. Is it quadratic? Trigonometric? Some exotic combination of both?
            </p>
            <p>
              Traditional curve fitting (like polynomial regression) requires you to <em>guess</em> the form of the equation first, then fit its parameters. <strong>Symbolic regression</strong> flips this on its head: it discovers both the <em>structure</em> and the <em>parameters</em> simultaneously. The Equation Evolver does this using a Genetic Algorithm — inspired by biological evolution.
            </p>

            <h2>Equations as Trees (AST)</h2>
            <p>
              The key insight is representing mathematical equations as <strong>Abstract Syntax Trees</strong> (ASTs). Instead of treating <code>y = 3 * sin(x) + 2</code> as a flat string, we represent it as a tree:
            </p>
            <pre><code>{`      (+)
      / \\
    (*)  2
    / \\
   3  sin
       |
       x`}</code></pre>
            <p>
              Each node in the tree is either a <strong>terminal</strong> (a number like <code>3.2</code> or the variable <code>x</code>) or an <strong>operator</strong> (<code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, <code>^</code>, <code>sin</code>, <code>cos</code>). This tree structure is what makes genetic operations possible — you can swap, mutate, and recombine branches just like DNA.
            </p>

            <h2>The Genetic Algorithm</h2>
            <p>
              The algorithm follows Darwin&apos;s principles of natural selection:
            </p>
            <ol>
              <li>
                <strong>Population.</strong> We start with a population of random equation trees — hundreds of completely random mathematical expressions. Most are garbage. That&apos;s fine.
              </li>
              <li>
                <strong>Fitness.</strong> Each equation is evaluated against your data by computing the <strong>Mean Squared Error</strong> (MSE) — the average squared difference between what the equation predicts and the actual data points. Lower MSE = better fit = higher &quot;fitness.&quot;
              </li>
              <li>
                <strong>Selection.</strong> We use <em>Tournament Selection</em>: pick 3 random individuals, and the fittest one wins the right to reproduce. This creates selection pressure without being too aggressive.
              </li>
              <li>
                <strong>Crossover.</strong> Two parent trees swap random subtrees — like genetic recombination. A subtree from Parent A replaces a subtree in Parent B, and vice versa. This is how useful building blocks (like <code>sin(x)</code>) get combined with others (like <code>x²</code>).
              </li>
              <li>
                <strong>Mutation.</strong> Random changes are applied: an operator might flip from <code>+</code> to <code>*</code>, a constant might be nudged, or an entire subtree might be replaced with a new random one. This prevents the population from getting stuck.
              </li>
              <li>
                <strong>Elitism.</strong> The top 2 equations from each generation survive unchanged into the next — ensuring we never lose our best solution.
              </li>
            </ol>

            <h2>What You See on the Canvas</h2>
            <p>
              The visualization makes the search process visible:
            </p>
            <ul>
              <li>
                <strong>Glowing cyan dots</strong> are your raw data points.
              </li>
              <li>
                The <strong>bright gradient curve</strong> (violet → cyan) is the current best-fit equation — the fittest individual in the population.
              </li>
              <li>
                The <strong>faint white ghost curves</strong> are the top 5 runner-up equations. These show you the algorithm &quot;searching&quot; — trying different shapes and structures to find the right one. Watch them converge as the population evolves.
              </li>
            </ul>

            <h2>Protected Operators</h2>
            <p>
              Real-world genetic programming has a problem: randomly generated equations frequently produce <code>NaN</code> and <code>Infinity</code>. Dividing by zero, raising negative numbers to fractional powers, and exponential blowup can kill an entire population.
            </p>
            <p>
              The engine uses <strong>protected operators</strong> to handle this gracefully:
            </p>
            <ul>
              <li><strong>Protected division:</strong> if the denominator is near-zero, it returns <code>1</code> instead of crashing.</li>
              <li><strong>Clamped exponents:</strong> the <code>^</code> operator clamps its exponent to the range [-5, 5], preventing runaway growth.</li>
              <li><strong>Depth limits:</strong> trees are capped at 6 levels deep to prevent &quot;bloat&quot; — equations that grow enormous without improving fitness.</li>
            </ul>

            <h2>Tips for Best Results</h2>
            <ul>
              <li>
                <strong>Population Size</strong> — larger populations explore more of the solution space but run slower. 200 is a good default; try 400-500 for complex data.
              </li>
              <li>
                <strong>Mutation Rate</strong> — too low and the population stagnates; too high and good solutions get destroyed. 10-15% works well for most datasets.
              </li>
              <li>
                <strong>Data quality matters</strong> — the algorithm works best with 20-50 clean data points. Very noisy data or too few points make convergence harder.
              </li>
              <li>
                <strong>Run it multiple times</strong> — genetic algorithms are stochastic. Different runs explore different parts of the solution space and may find different (equally valid) equations.
              </li>
            </ul>
          </div>

          <div className="mt-16 p-8 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 text-center">
            <h3 className="text-2xl font-bold text-black dark:text-white mb-3">Ready to discover an equation?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Paste your data and watch evolution find the math behind the curve.</p>
            <Link 
              href="/math/equation-evolver" 
              className="inline-block px-8 py-4 bg-black dark:bg-white hover:bg-black/80 dark:hover:bg-white/80 text-white dark:text-black rounded-xl font-bold tracking-widest uppercase transition-all hover:scale-105 shadow-xl no-underline"
            >
              Launch Evolver
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
