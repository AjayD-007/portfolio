"use client";

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

// The fallback scene for Safari or browsers without OffscreenCanvas
const Scene = dynamic(() => import('@/components/Three/Scene'), {
  ssr: false,
});

// A React 18 Strict Mode safe offscreen canvas wrapper
function CustomOffscreenCanvas({ worker, ...props }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!worker || !canvasRef.current || initialized.current) return;
    
    try {
      const canvas = canvasRef.current;
      const offscreen = canvas.transferControlToOffscreen();
      
      worker.postMessage(
        {
          type: 'init',
          payload: {
            props,
            drawingSurface: offscreen,
            width: canvas.clientWidth,
            height: canvas.clientHeight,
            top: canvas.offsetTop,
            left: canvas.offsetLeft,
            devicePixelRatio: window.devicePixelRatio,
          },
        },
        [offscreen]
      );
      
      initialized.current = true;
    } catch (e) {
      console.error('[Main] Failed to transfer canvas:', e);
    }
  }, [worker, props]);

  useEffect(() => {
    if (!worker || !initialized.current) return;
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      worker.postMessage({
        type: 'resize',
        payload: {
          width: canvas.clientWidth,
          height: canvas.clientHeight,
          top: canvas.offsetTop,
          left: canvas.offsetLeft,
        }
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [worker]);

  useEffect(() => {
    if (!worker || !initialized.current) return;
    worker.postMessage({ type: 'props', payload: props });
  }, [worker, props]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'block'
      }}
    />
  );
}

export default function SceneWrapper() {
  const [shouldLoad, setShouldLoad] = useState(false);
  
  // DOM-dependent state
  const { theme, resolvedTheme } = useTheme();
  const isDark = theme === "dark" || resolvedTheme === "dark";
  const pathname = usePathname();
  const isHome = pathname === "/";
  
  // Create worker only once
  const worker = useMemo(() => {
    if (typeof window !== 'undefined' && 'Worker' in window) {
      console.log('[Main] Initializing Web Worker...');
      const w = new Worker(new URL('../../workers/scene-worker.tsx', import.meta.url), { type: 'module' });
      w.onerror = (err) => console.error('[Main] Worker onerror fired:', err.message);
      w.onmessageerror = (err) => console.error('[Main] Worker onmessageerror fired:', err);
      return w;
    }
    return null;
  }, []);

  // Feature detect OffscreenCanvas support
  const isOffscreenSupported = useMemo(() => {
    if (typeof HTMLCanvasElement === 'undefined') return false;
    return 'transferControlToOffscreen' in HTMLCanvasElement.prototype;
  }, []);

  const maxScrollRef = useRef(1);

  // Send state to worker when it changes
  useEffect(() => {
    if (worker) {
      worker.postMessage({ type: 'scene-state', isDark, isHome });
    }
  }, [worker, isDark, isHome]);

  // Force a resize event shortly after mount to ensure OffscreenCanvas gets correct dimensions
  // (Fixes 0x0 canvas bugs if layout hasn't settled during init)
  useEffect(() => {
    if (worker && isOffscreenSupported) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        console.log('[Main] Dispatched synthetic resize event');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [worker, isOffscreenSupported]);

  // Track scroll and send to worker (throttled/batched by rAF)
  useEffect(() => {
    if (!worker) return;

    let ticking = false;

    const updateMaxScroll = () => {
      maxScrollRef.current = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const progress = Math.max(0, Math.min(1, window.scrollY / maxScrollRef.current));
          worker.postMessage({ type: 'scene-state', scrollProgress: progress });
          ticking = false;
        });
        ticking = true;
      }
    };

    updateMaxScroll();
    window.addEventListener('resize', updateMaxScroll);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', updateMaxScroll);
      window.removeEventListener('scroll', onScroll);
    };
  }, [worker]);

  useEffect(() => {
    // Defer 3D loading until the browser is idle, with a small initial buffer.
    const timer = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => setShouldLoad(true), { timeout: 3000 });
      } else {
        setShouldLoad(true);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  if (!shouldLoad) return null;

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none transition-opacity duration-1000 ease-in-out opacity-100" aria-hidden="true">
      {worker && isOffscreenSupported ? (
        <CustomOffscreenCanvas
          worker={worker}
          camera={{ position: [0, 0, 5], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ localClippingEnabled: true }}
        />
      ) : (
        <Scene />
      )}
    </div>
  );
}
