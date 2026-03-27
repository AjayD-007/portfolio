"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useTheme } from "next-themes";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { easing } from "maath";

import { MobiusGeometry } from "./MobiusGeometry";

export function FloatingObject() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const { theme, resolvedTheme } = useTheme();

  // We no longer track scroll progress to move the object around the screen.
  // The object will act as a stationary, premium "museum artifact" in the center of the layout.
  // We still retain the subtle ambient rotation and mouse tilt below.

  const uniformsRef = useRef({
    uScroll: { value: -0.1 },
    uColorBase: { value: new THREE.Color(0x000000) },
    uColorActive: { value: new THREE.Color("#ff0000") }, // Pure Neon Red (0 Green, 0 Blue prevents white clipping)
  });

  const targetColorRef = useRef(new THREE.Color("#ff0000"));

  // Cache maxScroll to completely eliminate browser Layout Thrashing in the render loop
  const maxScrollRef = useRef(1);

  useEffect(() => {
    const updateMaxScroll = () => {
      maxScrollRef.current = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };
    
    // Calculate exactly once on mount, then recalculate only if physical viewport dimensions change
    updateMaxScroll();
    window.addEventListener("resize", updateMaxScroll);
    return () => window.removeEventListener("resize", updateMaxScroll);
  }, []);

  // Setup sweeping emissive custom shader
  const materialProps = useMemo(() => ({
    roughness: 0.5,
    metalness: 0.6,
    envMapIntensity: 0, // Greatly reduced to stop harsh reflections
    side: THREE.DoubleSide,
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
        const isDark = theme === "dark" || resolvedTheme === "dark";

        // Dynamic material parameters (matte in Light Mode, slightly metallic in Dark Mode)
        const targetMetalness = isDark ? 0 : 0.0;
        const targetRoughness = isDark ? 1 : 1.0; 
        const targetEnvMap = isDark ? 0.0 : 0.0; // Completely cuts all reflections in light mode
        
        easing.damp(materialRef.current, 'metalness', targetMetalness, 0.25, delta);
        easing.damp(materialRef.current, 'roughness', targetRoughness, 0.25, delta);
        easing.damp(materialRef.current, 'envMapIntensity', targetEnvMap, 0.25, delta);

        // Smoothly interpolate material color based on theme
        // In Light Mode, use a deep matte grey (#3f3f46) so the object contrasts against the white page
        // and doesn't blow out or become invisible under the scene lights.
        const targetColor = isDark ? new THREE.Color("#3f3f46") : new THREE.Color("#868689");
        easing.dampC(materialRef.current.color, targetColor, 0.25, delta);

        // --- NEW: Sweeping scroll-driven emissive shader ---
        const scrollY = window.scrollY;
        
        // Grab cached un-thrashed document layout value
        const maxScroll = maxScrollRef.current;
        
        // Map scroll to a 0.0 to 1.0 progress curve
        const progress = Math.max(0, Math.min(1, scrollY / maxScroll));
        
        // Map progress from -0.1 to 1.1 to drive the bidirectional expansion
        // Because max circular distance on the 2.0 domain is 1.0, this completely encircles the strip
        const mappedScroll = -0.1 + (progress * 1.2);
        
        // Smoothly advance the swept uScroll uniform
        easing.damp(uniformsRef.current.uScroll, 'value', mappedScroll, 0.25, delta);
        
        // Consistent pure red color for both themes to avoid white clipping
        const activeColor = new THREE.Color("#ff0000");
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
