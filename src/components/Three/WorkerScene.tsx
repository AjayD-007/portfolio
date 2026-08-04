"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, ContactShadows, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useRef, useMemo, useEffect, useState, Suspense } from "react";
import { Group, Color } from "three";
import { easing } from "maath";
import { FloatingObject } from "./FloatingObject";
import { MobiusGeometry } from "./MobiusGeometry";

// ──────────────────────────────────────────────────────────────────
// Shared state bridge: main thread sends { isDark, isHome, scrollProgress }
// via postMessage. We store it in a module-level ref so useFrame can read it
// without re-renders.
// ──────────────────────────────────────────────────────────────────
const bridgeState = {
  isDark: true,
  isHome: true,
  scrollProgress: 0,
};

// Listen for messages from the main thread
if (typeof self !== 'undefined') {
  // We're in a Web Worker (or being shimmed by one)
  self.addEventListener('message', (e: MessageEvent) => {
    if (e.data?.type === 'scene-state') {
      bridgeState.isDark = e.data.isDark ?? bridgeState.isDark;
      bridgeState.isHome = e.data.isHome ?? bridgeState.isHome;
      bridgeState.scrollProgress = e.data.scrollProgress ?? bridgeState.scrollProgress;
    }
  });
}

// ──────────────────────────────────────────────────────────────────
// Sub-components (identical logic to Scene.tsx, but no DOM hooks)
// ──────────────────────────────────────────────────────────────────

function AnimatedStars() {
  const groupRef = useRef<Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y -= delta * 0.02;
      groupRef.current.rotation.x -= delta * 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      <Stars
        radius={50}
        depth={50}
        count={2000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
    </group>
  );
}

function AnimatedBackground() {
  const { scene } = useThree();
  const targetColorRef = useRef(new Color('#000000'));

  useFrame((state, delta) => {
    const target = bridgeState.isDark ? '#000000' : '#F8F9FA';
    targetColorRef.current.set(target);
    if (!scene.background) {
      scene.background = new Color(target);
    }
    easing.dampC(scene.background as Color, targetColorRef.current, 0.5, delta);
  });

  return null;
}

function SceneReady({ setReady }: { setReady: (v: boolean) => void }) {
  useEffect(() => {
    setReady(true);
  }, [setReady]);
  return null;
}

// ──────────────────────────────────────────────────────────────────
// Main worker scene — reads from bridgeState every frame
// ──────────────────────────────────────────────────────────────────
export function WorkerScene() {
  const [ready, setReady] = useState(false);

  // Read bridgeState every frame to get latest isDark/isHome/scrollProgress
  // We use a ref-based approach with useFrame inside children components
  // The bridge state is read directly in child components' useFrame callbacks

  return (
    <>
      <Suspense fallback={null}>
        <SceneReady setReady={setReady} />
        <AnimatedBackground />

        {/* Home-only 3D elements — always render, conditionally show via bridgeState */}
        <HomeContent />

        {/* Stars for dark mode */}
        <DarkModeStars />

        {/* Bloom post-processing */}
        <EffectComposer multisampling={0}>
          <Bloom luminanceThreshold={2.0} mipmapBlur intensity={1.5} />
        </EffectComposer>
      </Suspense>
    </>
  );
}

// Separate component so it can read bridgeState in useFrame
function HomeContent() {
  const [visible, setVisible] = useState(true);
  
  useFrame(() => {
    // Check if we should show home content
    if (bridgeState.isHome !== visible) {
      setVisible(bridgeState.isHome);
    }
  });

  if (!visible) return null;

  return (
    <>
      {/* Lights — read isDark from bridge */}
      <AdaptiveLights />

      {/* Floating Object — reads isDark and scrollProgress from bridge */}
      <BridgedFloatingObject />

      {/* Contact Shadows — only in light mode */}
      <AdaptiveContactShadows />

      {/* Environment mapping for Lightformer-based reflections */}
      <Environment background={false}>
        <Lightformer intensity={0.5} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
        <Lightformer intensity={0.5} rotation-x={Math.PI / 2} position={[0, -5, -9]} scale={[10, 10, 1]} />
      </Environment>
    </>
  );
}

function AdaptiveLights() {
  const ambientRef = useRef<any>(null);
  const spotRef = useRef<any>(null);

  useFrame(() => {
    if (ambientRef.current) {
      ambientRef.current.intensity = bridgeState.isDark ? 0.2 : 0.6;
    }
    if (spotRef.current) {
      spotRef.current.intensity = bridgeState.isDark ? 1 : 0.5;
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.2} />
      <spotLight ref={spotRef} position={[10, 10, 10]} penumbra={1} angle={0.2} intensity={1} />
    </>
  );
}

function BridgedFloatingObject() {
  // Pass bridgeState values as props to FloatingObject
  // We use a wrapper with useFrame to continuously read the bridge
  const [isDark, setIsDark] = useState(true);
  
  // Callback to read the latest scroll progress from the bridge
  const getScrollProgress = () => bridgeState.scrollProgress;

  useFrame(() => {
    if (bridgeState.isDark !== isDark) setIsDark(bridgeState.isDark);
  });

  return <FloatingObject isDark={isDark} getScrollProgress={getScrollProgress} />;
}

function AdaptiveContactShadows() {
  const [showShadows, setShowShadows] = useState(false);

  useFrame(() => {
    const shouldShow = !bridgeState.isDark;
    if (shouldShow !== showShadows) setShowShadows(shouldShow);
  });

  if (!showShadows) return null;

  return (
    <ContactShadows
      position={[0, -2.5, 0]}
      opacity={0.4}
      scale={10}
      blur={2}
      far={4}
      color="#000000"
      resolution={256}
      frames={1}
    />
  );
}

function DarkModeStars() {
  const [showStars, setShowStars] = useState(true);

  useFrame(() => {
    if (bridgeState.isDark !== showStars) setShowStars(bridgeState.isDark);
  });

  if (!showStars) return null;
  return <AnimatedStars />;
}
