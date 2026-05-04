"use client";

import { Canvas } from "@react-three/fiber";
import { NonEuclideanWorld } from "@/components/Three/NonEuclideanWorld";
import { useEffect, useState, useRef, Suspense } from "react";

import { CORRIDOR } from "@/config/corridor";

export default function GeodesicPage() {
  const [scrollDelta, setScrollDelta] = useState(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const forwardDelta = Math.max(-40, Math.min(e.deltaY, 40));
      setScrollDelta((prev) => prev + forwardDelta * 0.7);
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartY.current;
      // Moving finger UP means diff is negative. Standard scroll down maps to positive delta.
      const forwardDiff = Math.max(-25, Math.min(-diff, 25));
      setScrollDelta((prev) => prev + forwardDiff);
      touchStartY.current = currentY;
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-[#111] overflow-hidden touch-none z-50">
      {/* 
        We use a highly flattened Perspective projection via telephoto FOV logic. 
        Adjust camera limits in src/config/corridor.ts precisely instead of here. 
      */}
      <Canvas camera={{ position: CORRIDOR.camera.position, fov: CORRIDOR.camera.fov }} gl={{ localClippingEnabled: true }} className="absolute inset-0 w-full h-full">
         <Suspense fallback={null}>
            <NonEuclideanWorld scrollDelta={scrollDelta} />
         </Suspense>
      </Canvas>
    </div>
  );
}
