"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTheme } from "next-themes";
import { MeshTransmissionMaterial, Float } from "@react-three/drei";
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

  // Material properties based on theme
  const materialProps = {
    thickness: 0.2,
    roughness: 0.1,
    transmission: 1,
    ior: 1.2,
    chromaticAberration: 0.04,
    backside: true,
    side: THREE.DoubleSide, // Keeps the single-sided math visible from all angles
  };

  useFrame((state, delta) => {
    if (meshRef.current) {
        // Option 1: Constant Turntable spin on Y-axis
        meshRef.current.rotation.y += delta * 0.15;
    }

    if (materialRef.current) {
        // Smoothly interpolate material color based on theme
        const isDark = theme === "dark" || resolvedTheme === "dark";
        const targetColor = isDark ? new THREE.Color("#aaaaaa") : new THREE.Color("#ffffff");
        easing.dampC(materialRef.current.color, targetColor, 0.25, delta);
    }

    if (groupRef.current) {
      // Statically set the object to a comfortable centered size
      groupRef.current.scale.setScalar(0.9);
      groupRef.current.position.x = 0;
      groupRef.current.position.y = 0;
      
      // Calculate mouse tilt
      const targetRotationX = (state.pointer.y * Math.PI) / 6;
      const targetRotationY = (state.pointer.x * Math.PI) / 6;

      // Smoothly apply only the mouse tilt over the static Z orientation
      easing.dampE(
        groupRef.current.rotation,
        [targetRotationX, targetRotationY, 0],
        0.25,
        delta
      );
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
          <MeshTransmissionMaterial ref={materialRef} {...materialProps} />
        </mesh>
      </Float>
    </group>
  );
}
