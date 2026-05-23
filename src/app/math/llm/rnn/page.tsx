import { Metadata } from 'next';
import { RNNExperiment } from '@/components/experiments/RNNExperiment';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Micro Language Model (RNN) | AjayD',
  description: 'An interactive character-level Recurrent Neural Network built from scratch in TypeScript.',
};

export default function RNNPage() {
  return (
    <main className="min-h-screen pt-4 pb-16 px-4 md:px-6">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-8">
          <Link 
            href="/math" 
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Experiments
          </Link>
          
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-black dark:text-white mb-2">
            Micro Language Model
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl font-medium">
            A character-level Recurrent Neural Network (RNN) built entirely from scratch in TypeScript. 
            No external libraries. Math runs in a Web Worker to prevent UI lag. Watch it learn the statistical distribution of characters in real-time.
          </p>
        </div>

        <RNNExperiment />
      </div>
    </main>
  );
}
