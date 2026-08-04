import { render } from '@react-three/offscreen';
import { WorkerScene } from '../components/Three/WorkerScene';

console.log('[Worker] Worker script started executing');

try {
  render(<WorkerScene />);
  console.log('[Worker] Render function called successfully');
} catch (error) {
  console.error('[Worker] Fatal error during render:', error);
}

self.addEventListener('error', (e) => {
  console.error('[Worker] Unhandled error:', e.message, e.filename, e.lineno);
});
