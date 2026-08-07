"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { Color, Group, Mesh, DoubleSide } from "three";
import { easing } from "maath";

import { MobiusGeometry } from "./MobiusGeometry";

interface FloatingObjectProps {
  isDark: boolean;
  getScrollProgress: () => number;
}

export function FloatingObject({ isDark, getScrollProgress }: FloatingObjectProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<any>(null);

  // We no longer track scroll progress to move the object around the screen.
  // The object will act as a stationary, premium "museum artifact" in the center of the layout.
  // We still retain the subtle ambient rotation and mouse tilt below.

  const uniformsRef = useRef({
    uScroll: { value: -0.1 },
    uColorBase: { value: new Color(0x000000) },
    uColorActive: { value: new Color("#ff0000") }, // Pure Neon Red (0 Green, 0 Blue prevents white clipping)
  });

  const targetColorRef = useRef(new Color("#ff0000"));

  // scrollProgress is now passed as a prop (0.0 to 1.0) from the main thread,
  // eliminating all window/document access from this component.

  // Setup sweeping emissive custom shader
  const materialProps = useMemo(() => ({
    roughness: 0.4,
    metalness: isDark ? 0.5 : 0.7,
    envMapIntensity: 0, // Greatly reduced to stop harsh reflections
    side: DoubleSide,
    customProgramCacheKey: () => 'mobiusGlow',
    onBeforeCompile: (shader: any) => {
      shader.uniforms.uScroll = uniformsRef.current.uScroll;
      shader.uniforms.uColorBase = uniformsRef.current.uColorBase;
      shader.uniforms.uColorActive = uniformsRef.current.uColorActive;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        #include <common>
        varying vec2 vUvLocal;
        `
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vUvLocal = uv;
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
        #include <common>
        uniform float uScroll;
        uniform vec3 uColorBase;
        uniform vec3 uColorActive;
        varying vec2 vUvLocal;
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `
        #include <emissivemap_fragment>
        
        // Unroll the 3D surface to a 720 degree continuous domain (0.0 to 2.0)
        float renderSideOffset = gl_FrontFacing ? 0.0 : 1.0;
        float continuousX = vUvLocal.x + renderSideOffset;
        
        // Calculate circular distance from the visual "front center" (0.5)
        float diff = abs(continuousX - 0.5);
        float distFromStart = min(diff, 2.0 - diff);
        
        // Sweep mask expands outwards from the start point in TWO directions simultaneously!
        float fill = smoothstep(uScroll + 0.03, uScroll - 0.03, distFromStart);
        
        // Perfectly straight line in the exact center (0.5) of the geometry width
        float centerDist = abs(vUvLocal.y - 0.5);
        
        // Removed the fake soft halo completely. This is now a razor-thin, solid laser line.
        // We will rely on literal React Post-Processing Bloom to create the TRON glow.
        float lineGlow = smoothstep(0.010, 0.008, centerDist);

        // Apply sweep mask
        float finalGlow = lineGlow * fill;
        
        // Pump the engine multiplier massive to 10.0 since Bloom threshold will catch it
        totalEmissiveRadiance += mix(uColorBase, uColorActive, finalGlow) * 10.0;
        `
      );
    }
  }), []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Option 1: Constant Turntable spin on Y-axis
      meshRef.current.rotation.y += delta * 0.15;
    }

    if (materialRef.current) {
      // Dynamic material parameters
      // Dark Mode: Metallic, shiny (adjusted for 0 envMap so it's not pitch black)
      // Light Mode: Ceramic (non-metallic, glossy, eggshell color)
      const targetMetalness = isDark ? 0.3 : 0.05;
      const targetRoughness = isDark ? 0.7 : 0.25;
      const targetEnvMap = 0.0; // Restored to 0 for performance!

      easing.damp(materialRef.current, 'metalness', targetMetalness, 0.25, delta);
      easing.damp(materialRef.current, 'roughness', targetRoughness, 0.25, delta);
      easing.damp(materialRef.current, 'envMapIntensity', targetEnvMap, 0.25, delta);

      // Smoothly interpolate material color based on theme
      // Dark Mode: Lighter gray than before, because without envMap, high metalness turns black
      // Light Mode: Eggshell white for the ceramic look
      const targetColor = isDark ? new Color("#44444a") : new Color("#f8f8f7");
      easing.dampC(materialRef.current.color, targetColor, 0.25, delta);

      // --- Sweeping scroll-driven emissive shader ---
      // Get scroll progress dynamically (avoids React re-renders)
      const progress = getScrollProgress();

      // Map progress from -0.1 to 1.1 to drive the bidirectional expansion
      // Because max circular distance on the 2.0 domain is 1.0, this completely encircles the strip
      const mappedScroll = -0.1 + (progress * 1.2);

      // Smoothly advance the swept uScroll uniform
      easing.damp(uniformsRef.current.uScroll, 'value', mappedScroll, 0.25, delta);

      // Consistent pure red color for both themes to avoid white clipping
      const activeColor = new Color("#ff0000");
      easing.dampC(targetColorRef.current, activeColor, 0.25, delta);
      uniformsRef.current.uColorActive.value.copy(targetColorRef.current);
    }

    if (groupRef.current) {
      // Statically set the object to a comfortable centered size
      groupRef.current.scale.setScalar(0.9);
      groupRef.current.position.x = 0;
      groupRef.current.position.y = 0;
    }
  });

  return (
    <group ref={groupRef}>
      <Float
        speed={1} // Reduced Animation speed
        rotationIntensity={0} // Disabled chaotic random rotation from Float
        floatIntensity={0.5} // Reduced Up/down float intensity
        floatingRange={[-0.1, 0.1]} // Reduced Range of y-axis values the object will float within
      >
        <mesh ref={meshRef} scale={[1.6, 1, 1]}> {/* Skew scale on X-axis to securely elongate the shape */}
          <MobiusGeometry />
          <meshStandardMaterial ref={materialRef} {...materialProps} />
        </mesh>
      </Float>
    </group>
  );
}
