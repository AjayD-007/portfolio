"use client";

import { useMemo } from "react";
// import * as THREE from "three";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry.js";

// Parametric function for a Möbius Strip
function mobiusStrip(u: number, v: number, target:any) {
  // u loops from 0 to 1 (around the strip)
  // v ranges from 0 to 1 (across the strip)
  
  const vScale = (v - 0.5) * 2; // Map v to [-1, 1]
  const uRad = u * Math.PI * 2; // Full circle
  const radius = 1.6;           // Base radius
  const width = 0.6;            // Slightly thinner to prevent clipping on twists

  // Tony Stark's "Inverted" Mobius strip structure (Avengers Endgame)
  // 1. Add a 3D fold (saddle shape) so the loop curves in all 3 dimensions. 
  // Increased depth to 1.2 for a more pronounced "inverted" curve.
  const zFold = Math.sin(uRad * 2) * 1.2;

  // 2. Revert to 1 half-twist so the classic Mobius identity is clearly visible,
  // but add an angle offset (Math.PI / 2) to force the strip to twist more dramatically 
  // relative to the saddle curves.
  const twistAngle = (uRad / 2) + Math.PI / 2;

  const x = Math.cos(uRad) * (radius + vScale * width * Math.cos(twistAngle));
  const y = Math.sin(uRad) * (radius + vScale * width * Math.cos(twistAngle));
  const z = zFold + vScale * width * Math.sin(twistAngle);

  target.set(x, y, z);
}

export function MobiusGeometry() {
  // useMemo ensures we only calculate the complex geometry once
  const geometry = useMemo(() => {
    // 250 segments around, 40 segments across for complex intricate twists
    return new ParametricGeometry(mobiusStrip, 250, 40);
  }, []);

  return <primitive object={geometry} attach="geometry" />;
}
