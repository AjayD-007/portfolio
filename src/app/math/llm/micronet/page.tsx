import { Metadata } from 'next';
import { MicroNetExperiment } from '@/components/experiments/MicroNetExperiment';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Heading, Text } from '@/components/ui/Typography';

export const metadata: Metadata = {
  title: 'Micro-Neural Network | AjayD',
  description: 'An interactive, fully client-side neural network built from scratch in TypeScript.',
};

export default function MicroNetPage() {
  return (
    <Container maxWidth="7xl" className="min-h-screen pt-4 pb-16 flex-grow">
      <div className="mb-8">
        <Link 
          href="/math" 
          className="inline-flex items-center transition-colors mb-6 text-[var(--text-muted)] hover:text-[var(--text-main)]"
        >
          <Text variant="label" className="flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back to Experiments</Text>
        </Link>
        
        <Heading level={1} variant="section" className="!mb-2">
          Micro-Neural Network
        </Heading>
        <Text variant="body" className="max-w-2xl">
          A purely local, from-scratch Multi-Layer Perceptron (MLP) trained to predict the next character in a sequence. Watch the connections adapt and loss drop in real-time.
        </Text>
      </div>

      <MicroNetExperiment />
    </Container>
  );
}
