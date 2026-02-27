"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, ContactShadows, Stars } from "@react-three/drei";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useRef, useMemo, useEffect, useState, Suspense } from "react";
import * as THREE from "three";
import { easing } from "maath";
import { FloatingObject } from "./FloatingObject";

// Animated starfield for dynamic reflections
function AnimatedStars() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Extremely slow rotation to simulate distant celestial movement
      groupRef.current.rotation.y -= delta * 0.02;
      groupRef.current.rotation.x -= delta * 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      <Stars 
        radius={50}       // Inner radius
        depth={50}        // Depth of the starfield
        count={2000}      // Number of stars
        factor={4}        // Size factor
        saturation={0}    // Black and white stars
        fade              // Faded edges
        speed={1}         // Twinkle speed
      />
    </group>
  );
}

// Seamlessly animates the WebGL background color to match the CSS theme.
// Critical for `MeshTransmissionMaterial` to refract white instead of a dark transparent void.
function AnimatedBackground({ isDark }: { isDark: boolean }) {
  const { scene } = useThree();
  const targetColor = useMemo(() => new THREE.Color(isDark ? '#000000' : '#F8F9FA'), [isDark]);
  
  useFrame((state, delta) => {
    if (!scene.background) {
      scene.background = new THREE.Color(isDark ? '#000000' : '#F8F9FA');
    }
    easing.dampC(scene.background as THREE.Color, targetColor, 0.5, delta);
  });

  return null;
}

export default function Scene() {
  const { theme, resolvedTheme } = useTheme();
  const isDark = theme === "dark" || resolvedTheme === "dark";
  const pathname = usePathname();
  const isHome = pathname === "/";
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]} // Capped pixel density to prevent extreme GPU overhead on 4k screens
      >
        <Suspense fallback={null}>
          <AnimatedBackground isDark={isDark} />
          
          {/* Conditional rendering of heavy 3D elements for performance */}
          {isHome && (
            <>
              {/* Lights */}
              <ambientLight intensity={isDark ? 0.2 : 0.8} />
              <spotLight position={[10, 10, 10]} penumbra={1} angle={0.2} intensity={isDark ? 1 : 2} />

              {/* Floating Object */}
              <FloatingObject />

              {/* Grounding Contact Shadows for Light Mode */}
              {!isDark && (
                <ContactShadows
                  position={[0, -2.5, 0]}
                  opacity={0.4}
                  scale={10}
                  blur={2}
                  far={4}
                  color="#000000"
                  resolution={256}
                  frames={1} // Only render the shadow once since the object only rotates on Y axis!
                />
              )}

              {/* Environment mapping for reflections */}
              <Environment 
                preset={isDark ? "night" : "studio"} 
                background={false} // Don't render as a literal background, only use for reflection math
              >
                 {/* Softbox highlights */}
                 <Lightformer intensity={0.5} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
                 <Lightformer intensity={0.5} rotation-x={Math.PI / 2} position={[0, -5, -9]} scale={[10, 10, 1]} />
              </Environment>
            </>
          )}

          {/* Render actual background stars globally everywhere (if dark mode) */}
          {isDark && <AnimatedStars />}
        </Suspense>
      </Canvas>
    </div>
  );
}
