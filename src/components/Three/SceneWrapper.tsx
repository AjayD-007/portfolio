"use client";

import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';

const Scene = dynamic(() => import('@/components/Three/Scene'), {
  ssr: false,
});

export default function SceneWrapper() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Wait for main content to be interactive, then schedule 3D load on idle
    const loadWhenIdle = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => setShouldLoad(true), { timeout: 3000 });
      } else {
        // Safari fallback
        setTimeout(() => setShouldLoad(true), 1500);
      }
    };

    // Minimum delay to ensure FCP/LCP/TBT window is clear
    const timer = setTimeout(loadWhenIdle, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!shouldLoad) return null;

  return <Scene />;
}
