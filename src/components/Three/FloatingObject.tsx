"use client";

import { useRef, useMemo } from "react";
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
    uColorActive: { value: new THREE.Color("#b91c1c") }, // Blood Red
  });

  const targetColorRef = useRef(new THREE.Color("#b91c1c")); // Blood Red

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
        
        // Sweep mask now evaluates against the 0.0 to 2.0 unrolled domain
        float fill = smoothstep(uScroll + 0.02, uScroll - 0.02, continuousX);
        
        // Perfectly straight line in the exact center (0.5) of the geometry
        float centerDist = abs(vUvLocal.y - 0.5);
        
        // Razor thin glow falloff
        float lineGlow = smoothstep(0.012, 0.002, centerDist);

        // Apply sweep mask so the TRON line traces permanently behind the scroll
        float finalGlow = lineGlow * fill;
        
        // Mega-boost the intensity of the pure center line
        totalEmissiveRadiance += mix(uColorBase, uColorActive, finalGlow) * 6.0;
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

        // Dynamic Metalness & Roughness (matte in Light Mode, slightly metallic in Dark Mode)
        const targetMetalness = isDark ? 0.8 : 0.0;
        const targetRoughness = isDark ? 0.2 : 0.9; // Increased roughness to blur harsh light
        easing.damp(materialRef.current, 'metalness', targetMetalness, 0.25, delta);
        easing.damp(materialRef.current, 'roughness', targetRoughness, 0.25, delta);

        // Smoothly interpolate material color based on theme
        const targetColor = isDark ? new THREE.Color("#282727ff") : new THREE.Color("#d4d3d3ff");
        easing.dampC(materialRef.current.color, targetColor, 0.25, delta);

        // --- NEW: Sweeping scroll-driven emissive shader ---
        const scrollY = window.scrollY;
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        
        // Map scroll to a 0.0 to 1.0 progress curve
        const progress = Math.max(0, Math.min(1, scrollY / maxScroll));
        
        // Map progress across a full 720 degree loop (0 to 2.1)
        // It starts off-strip (-0.1), traces the front face to 1.0, and traces the back face to 2.0.
        const mappedScroll = -0.1 + (progress * 2.2);
        
        // Smoothly advance the swept uScroll uniform
        easing.damp(uniformsRef.current.uScroll, 'value', mappedScroll, 0.25, delta);
        
        // Consistent Blood Red color for both themes
        const activeColor = new THREE.Color("#b91c1c");
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
