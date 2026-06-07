"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import Decimal from "decimal.js";
import { Sidebar } from "./Sidebar";
import { findBestReference, findBestReferenceFloat64 } from "./math";
import { ExperimentLayout } from '@/components/layout/ExperimentLayout';

const vertexShader = /* glsl */ `
  out vec2 vUv;
  void main() { 
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0); 
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  precision highp int;
  precision highp sampler2D;

  in vec2 vUv;

  uniform float uAsp;
  uniform float uRefOffsetX;
  uniform float uRefOffsetY;
  uniform float uZoom;
  uniform vec2 uCenterFloat;
  uniform sampler2D uOrbitTex;
  uniform int uTexWidth;
  uniform int uMaxIter;
  uniform vec3 uCA;
  uniform vec3 uCB;
  uniform float uDens;

  out vec4 fragColor;

  vec3 pal(float t) {
    return mix(uCA, uCB, 0.5 + 0.5 * cos(6.28318 * t * uDens));
  }

  vec2 complexMul(vec2 a, vec2 b) {
    return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
  }

  vec2 complexSq(vec2 a) {
    return vec2(a.x*a.x - a.y*a.y, 2.0*a.x*a.y);
  }

  void main() {
    vec2 delta = vec2(
      (vUv.x - 0.5) * uAsp / uZoom,
      (vUv.y - 0.5) / uZoom
    );

    float iter = 0.0;
    bool esc = false;

    if (uZoom < 1000.0) {
      // STANDARD FLOAT32 MANDELBROT (Used for low-zoom navigation to prevent PT Delta explosion)
      vec2 c = uCenterFloat + delta;
      vec2 z = vec2(0.0);

      for (int i = 0; i < 4096; i++) {
        if (i >= uMaxIter) break;
        z = complexSq(z) + c;
        float m2 = dot(z, z);
        if (m2 > 256.0) {
          iter = float(i) - log2(log2(min(m2, 1e20)) * 0.5);
          esc = true;
          break;
        }
      }
    } else {
      // PERTURBATION THEORY (Used for deep infinite zoom)
      vec2 deltaPT = vec2(delta.x - uRefOffsetX, delta.y - uRefOffsetY);
      vec2 D = vec2(0.0);

      for (int i = 0; i < 4096; i++) {
        if (i >= uMaxIter) break;

        int tx = i % uTexWidth;
        int ty = i / uTexWidth;
        vec2 Z = texelFetch(uOrbitTex, ivec2(tx, ty), 0).rg;

        vec2 z = Z + D;
        float m2 = z.x * z.x + z.y * z.y;

        if (m2 > 256.0) {
          iter = float(i) - log2(log2(min(m2, 1e20)) * 0.5);
          esc = true;
          break;
        }

        vec2 term1 = 2.0 * complexMul(Z, D);
        vec2 term2 = complexSq(D);
        D = term1 + term2 + deltaPT;
      }
    }

    if (!esc) {
      fragColor = vec4(0.0, 0.0, 0.0, 1.0); // Inside set is black
    } else {
      fragColor = vec4(pal(iter / float(uMaxIter)), 1.0);
    }
  }
`;

function FractalScene({
  refs,
  downloadRef,
  debugDataRef,
}: {
  refs: {
    cx: React.MutableRefObject<Decimal>;
    cy: React.MutableRefObject<Decimal>;
    zoom: React.MutableRefObject<Decimal>;
    maxIter: React.MutableRefObject<number>;
    colorA: React.MutableRefObject<string>;
    colorB: React.MutableRefObject<string>;
    density: React.MutableRefObject<number>;
  };
  downloadRef: React.MutableRefObject<(() => void) | null>;
  debugDataRef?: React.MutableRefObject<any>;
}) {
  const { size, gl, scene, camera } = useThree();

  // Initial texture: static size to prevent WebGL dimension mismatch on upload
  const texWidth = 1024;
  const texHeight = 4; // Max 4096 iterations supported
  
  const orbitTexture = useMemo(() => {
    const data = new Float32Array(texWidth * texHeight * 4); 
    const tex = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat, THREE.FloatType);
    tex.internalFormat = "RGBA32F";
    tex.needsUpdate = true;
    return tex;
  }, []); // EMPTY deps to NEVER recreate texture

  const uniforms = useMemo(() => ({
    uAsp:        { value: 1.0 },
    uRefOffsetX: { value: 0 },
    uRefOffsetY: { value: 0 },
    uZoom:       { value: 0 },
    uCenterFloat:{ value: new THREE.Vector2(0, 0) },
    uOrbitTex: { value: orbitTexture },
    uTexWidth: { value: texWidth },
    uMaxIter:  { value: refs.maxIter.current },
    uCA:       { value: new THREE.Color(refs.colorA.current) },
    uCB:       { value: new THREE.Color(refs.colorB.current) },
    uDens:     { value: refs.density.current },
  }), []); // EMPTY deps to NEVER recreate uniforms object

  const lastCx = useRef<string>("");
  const lastCy = useRef<string>("");
  const lastZoom = useRef<string>("");
  const lastIter = useRef<number>(0);
  const debounceTimer = useRef<number>(0);
  
  // Track the absolute coordinates of the current reference orbit
  const currentRefCx = useRef<Decimal>(new Decimal(-0.5));
  const currentRefCy = useRef<Decimal>(new Decimal(0.0));
  
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(() => {
    const w = size.width, h = size.height;
    const asp = w / h;
    const cx = refs.cx.current;
    const cy = refs.cy.current;
    const z = refs.zoom.current;
    const iterCount = refs.maxIter.current;

    // 2. Compute reference orbit ONLY if center, zoom, or iterations changed, debounced by 150ms
    if (z.gte(1000)) {
      if (cx.toString() !== lastCx.current || cy.toString() !== lastCy.current || z.toString() !== lastZoom.current || iterCount !== lastIter.current) {
        
        if (Date.now() - debounceTimer.current > 150) {
          if (z.lt(1e12)) {
            // Fast native Float64 path
            const { refCx, refCy, orbitArray } = findBestReferenceFloat64(cx.toNumber(), cy.toNumber(), z.toNumber(), asp, iterCount);
            
            currentRefCx.current = new Decimal(refCx);
            currentRefCy.current = new Decimal(refCy);

            const texData = orbitTexture.image.data as Float32Array;
            texData.set(orbitArray.subarray(0, Math.min(orbitArray.length, texData.length)));
            orbitTexture.needsUpdate = true;

            lastCx.current = cx.toString();
            lastCy.current = cy.toString();
            lastZoom.current = z.toString();
            lastIter.current = iterCount;
            debounceTimer.current = Date.now();
          } else {
            // Deep zoom Decimal.js path
            const { refCx, refCy, orbitArray } = findBestReference(cx, cy, z, asp, iterCount);
            
            currentRefCx.current = refCx;
            currentRefCy.current = refCy;

            // Update texture WITHOUT changing dimensions
            const texData = orbitTexture.image.data as Float32Array;
            texData.set(orbitArray.subarray(0, Math.min(orbitArray.length, texData.length)));
            orbitTexture.needsUpdate = true;

            lastCx.current = cx.toString();
            lastCy.current = cy.toString();
            lastZoom.current = z.toString();
            lastIter.current = iterCount;
            debounceTimer.current = Date.now();
          }
        }
      }
    }

    // 3. Compute continuous offset between visual camera center and the fixed reference center
    // This MUST be updated every single frame so panning is instantly visible before the debounce fires!
    const refOffsetX = currentRefCx.current.minus(cx).toNumber();
    const refOffsetY = currentRefCy.current.minus(cy).toNumber();

    if (debugDataRef) {
      debugDataRef.current.refOffsetX = refOffsetX;
      debugDataRef.current.refOffsetY = refOffsetY;
      debugDataRef.current.ptActive = z.gte(1000);
    }

    // 4. Update uniforms directly on the material to guarantee WebGL sync
    if (materialRef.current) {
      materialRef.current.uniforms.uAsp.value = asp;
      materialRef.current.uniforms.uRefOffsetX.value = refOffsetX;
      materialRef.current.uniforms.uRefOffsetY.value = refOffsetY;
      materialRef.current.uniforms.uZoom.value = z.toNumber();
      materialRef.current.uniforms.uCenterFloat.value.set(cx.toNumber(), cy.toNumber());
      materialRef.current.uniforms.uMaxIter.value = iterCount;
      materialRef.current.uniforms.uCA.value.set(refs.colorA.current);
      materialRef.current.uniforms.uCB.value.set(refs.colorB.current);
      materialRef.current.uniforms.uDens.value = refs.density.current;
    }
  });

  useEffect(() => {
    downloadRef.current = () => {
      gl.render(scene, camera);
      const url = gl.domElement.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `mandelbrot_pt_${Date.now()}.png`;
      a.click();
    };
  }, [gl, scene, camera, downloadRef]);

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        glslVersion={THREE.GLSL3}
        depthWrite={false}
      />
    </mesh>
  );
}

export function MandelbrotExplorer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const downloadRef  = useRef<(() => void) | null>(null);

  const cxRef      = useRef(new Decimal(-0.5));
  const cyRef      = useRef(new Decimal(0.0));
  const zoomRef    = useRef(new Decimal(0.5));
  const maxIterRef = useRef(512);
  const colorARef  = useRef("#fe5a01");
  const colorBRef  = useRef("#c5c4c4");
  const densityRef = useRef(1.0);

  const mouseRef   = useRef({ x: 0, y: 0 });
  const debugDataRef = useRef({ refOffsetX: 0, refOffsetY: 0, ptActive: false });

  const [zoomUI,  setZoomUI]  = useState(new Decimal(0.5));
  const [maxIter, setMaxIter] = useState(512);
  const [colorA,  setColorA]  = useState("#fe5a01");
  const [colorB,  setColorB]  = useState("#c5c4c4");
  const [density, setDensity] = useState(1.0);

  const [devData, setDevData] = useState({ cx: "", cy: "", mx: 0, my: 0, rox: 0, roy: 0, pt: false });
  const [isDownloading, setIsDownloading] = useState(false);

  const refs = useMemo(() => ({
    cx: cxRef, cy: cyRef, zoom: zoomRef,
    maxIter: maxIterRef, colorA: colorARef, colorB: colorBRef, density: densityRef,
  }), []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      mouseRef.current = { x: e.clientX, y: e.clientY };
      const clientXInside = e.clientX - rect.left;
      const clientYInside = e.clientY - rect.top;
      
      const nx = clientXInside / rect.width;
      const ny = 1 - (clientYInside / rect.height); // WebGL Y-up
      const asp = rect.width / rect.height;

      // Current exact center
      const currentCx = cxRef.current;
      const currentCy = cyRef.current;
      const currentZoom = zoomRef.current;

      // Mouse position in world space
      const offsetX = new Decimal(nx - 0.5).times(asp).div(currentZoom);
      const offsetY = new Decimal(ny - 0.5).div(currentZoom);
      const mouseWorldX = currentCx.plus(offsetX);
      const mouseWorldY = currentCy.plus(offsetY);

      // New zoom
      const factor = new Decimal(e.deltaY > 0 ? 1 / 1.15 : 1.15);
      let newZoom = currentZoom.times(factor);
      if (newZoom.lt(0.1)) newZoom = new Decimal(0.1);

      zoomRef.current = newZoom;

      // Shift center so mouse stays at same point
      const newOffsetX = new Decimal(nx - 0.5).times(asp).div(newZoom);
      const newOffsetY = new Decimal(ny - 0.5).div(newZoom);
      const finalCx = mouseWorldX.minus(newOffsetX);
      const finalCy = mouseWorldY.minus(newOffsetY);

      cxRef.current = finalCx;
      cyRef.current = finalCy;

      setZoomUI(newZoom);
    };

    let dragging = false, lx = 0, ly = 0;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true; lx = e.clientX; ly = e.clientY;
      mouseRef.current = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (!dragging) return;
      const rect = el.getBoundingClientRect();
      const asp = rect.width / rect.height;
      
      const dx = new Decimal(e.clientX - lx).div(rect.width).times(asp).div(zoomRef.current);
      const dy = new Decimal(e.clientY - ly).div(rect.height).div(zoomRef.current);

      cxRef.current = cxRef.current.minus(dx);
      cyRef.current = cyRef.current.plus(dy);

      lx = e.clientX; ly = e.clientY;
    };
    const onPointerUp = () => { dragging = false; };

    el.addEventListener("wheel",        onWheel,       { passive: false });
    el.addEventListener("pointerdown",  onPointerDown);
    el.addEventListener("pointermove",  onPointerMove);
    el.addEventListener("pointerup",    onPointerUp);
    el.addEventListener("pointerleave", onPointerUp);
    return () => {
      el.removeEventListener("wheel",        onWheel);
      el.removeEventListener("pointerdown",  onPointerDown);
      el.removeEventListener("pointermove",  onPointerMove);
      el.removeEventListener("pointerup",    onPointerUp);
      el.removeEventListener("pointerleave", onPointerUp);
    };
  }, []);

  useEffect(() => {
      if (process.env.NODE_ENV !== "development") return;
      const interval = setInterval(() => {
        setDevData({
          cx: cxRef.current.toExponential(4),
          cy: cyRef.current.toExponential(4),
          mx: mouseRef.current.x,
          my: mouseRef.current.y,
          rox: debugDataRef.current.refOffsetX,
          roy: debugDataRef.current.refOffsetY,
          pt: debugDataRef.current.ptActive
        });
      }, 200);
      return () => clearInterval(interval);
  }, []);

  const handleReset = () => {
    cxRef.current = new Decimal(-0.5);
    cyRef.current = new Decimal(0.0);
    zoomRef.current = new Decimal(0.5);
    setZoomUI(new Decimal(0.5));
  };

  const handleDownload = () => {
    setIsDownloading(true);
    // Use setTimeout to allow React to render the loader before freezing the main thread for WebGL download
    setTimeout(() => {
      downloadRef.current?.();
      setIsDownloading(false);
    }, 50);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <ExperimentLayout
      sidebar={
        <Sidebar
          zoom={zoomUI}
          maxIter={maxIter}    onMaxIter={v => { maxIterRef.current = v; setMaxIter(v); }}
          colorA={colorA}      onColorA={v  => { colorARef.current  = v; setColorA(v);  }}
          colorB={colorB}      onColorB={v  => { colorBRef.current  = v; setColorB(v);  }}
          density={density}    onDensity={v => { densityRef.current = v; setDensity(v); }}
          onReset={handleReset}
          onDownload={handleDownload}
          devData={devData}
        />
      }
    >
      <div ref={containerRef} className="absolute inset-0 cursor-crosshair touch-none bg-black">
        <Canvas
          orthographic
          camera={{ zoom: 1, position: [0, 0, 1], near: 0, far: 10 }}
          gl={{ antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: true }}
          style={{ width: "100%", height: "100%" }}
        >
          <FractalScene refs={refs} downloadRef={downloadRef} debugDataRef={debugDataRef} />
        </Canvas>
      </div>

      {isDownloading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-white font-medium tracking-widest uppercase text-sm">Exporting PNG...</p>
          </div>
        </div>
      )}
    </ExperimentLayout>
  );
}

export default MandelbrotExplorer;