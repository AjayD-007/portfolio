import { Metadata } from 'next';
import { MicroNetExperiment } from '@/components/experiments/MicroNetExperiment';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Micro-Neural Network | AjayD',
  description: 'An interactive, fully client-side neural network built from scratch in TypeScript.',
};

export default function MicroNetPage() {
  return (
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
            Micro-Neural Network
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl font-medium">
            A purely local, from-scratch Multi-Layer Perceptron (MLP) trained to predict the next character in a sequence. Watch the connections adapt and loss drop in real-time.
          </p>
        </div>

        <MicroNetExperiment />
      </div>
    </main>
  );
}
