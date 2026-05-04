"use client";

import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import Image from "next/image";
import Decimal from "decimal.js";

Decimal.set({ precision: 120 });

type FractalType = 0 | 1 | 2 | 3;
type PaletteType = 0 | 1 | 2 | 3;

const FRACTALS = [
  { id: 0, label: "Mandelbrot",   center: [-0.5, 0]       as [number,number], zoom: 0.5 },
  { id: 1, label: "Julia",        center: [0, 0]           as [number,number], zoom: 0.5 },
  { id: 2, label: "Burning Ship", center: [-1.755, -0.03]  as [number,number], zoom: 2.0 },
  { id: 3, label: "Newton",       center: [0, 0]           as [number,number], zoom: 0.4 },
];

// Removed hardcoded PALETTES

const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// JS splits center into float32 hi+lo for deep-zoom df64 precision
function splitDF(x: number): [number, number] {
  const hi = Math.fround(x);
  return [hi, Math.fround(x - hi)];
}

const fragmentShader = /* glsl */`
  precision highp float;

  uniform vec2  uResolution;
  uniform vec2  uCenterHi;   // double-float center high part
  uniform vec2  uCenterLo;   // double-float center low part
  uniform float uZoom;
  uniform int   uMaxIter;
  uniform int   uFractalType;
  uniform vec2  uJuliaC;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform float uColorDensity;
  uniform sampler2D uRefOrbit;
  uniform vec2  uDeltaCenterHi; // Decimal-precision offset hi
  uniform vec2  uDeltaCenterLo; // Decimal-precision offset lo
  // Pixel step = 1/zoom, split as df64 to avoid float32 overflow at deep zoom
  uniform vec2  uPixelStepHi; // .x = hi(aspect/zoom), .y = hi(1/zoom)
  uniform vec2  uPixelStepLo; // .x = lo(aspect/zoom), .y = lo(1/zoom)

  varying vec2 vUv;

  // ── df64 arithmetic (Dekker two-sum) ──────────────────────────────────────
  vec2 dadd(vec2 a, vec2 b) {
    float s = a.x + b.x;
    float v = s - a.x;
    float e = (a.x - (s - v)) + (b.x - v);
    return vec2(s, e + a.y + b.y);
  }
  vec2 dsub(vec2 a, vec2 b) { return dadd(a, vec2(-b.x,-b.y)); }
  vec2 dsplit(float a) { float t=4097.0*a; float h=t-(t-a); return vec2(h,a-h); }
  vec2 dmul(vec2 a, vec2 b) {
    float p = a.x*b.x;
    vec2 as=dsplit(a.x); vec2 bs=dsplit(b.x);
    float e = ((as.x*bs.x - p) + as.x*bs.y + as.y*bs.x) + as.y*bs.y;
    return vec2(p, e + a.x*b.y + a.y*b.x);
  }
  // ─────────────────────────────────────────────────────────────────────────

  vec2 cmul(vec2 a, vec2 b) { return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x); }
  vec2 cdiv(vec2 a, vec2 b) { float d=dot(b,b); return vec2(dot(a,b),a.y*b.x-a.x*b.y)/d; }

  vec3 palette(float t) {
    // Smoothly interpolate between Color A and Color B using a repeating cosine wave.
    // uColorDensity controls how frequently the colors repeat.
    float wave = 0.5 + 0.5 * cos(6.28318 * (t * uColorDensity));
    return mix(uColorA, uColorB, wave);
  }

  // f32 escape (fast, used when zoom < 1e3)
  vec4 escapeF32(vec2 pixel) {
    vec2 z, c;
    if (uFractalType==1) { z=pixel; c=uJuliaC; } else { z=vec2(0.0); c=pixel; }
    // Burning Ship: negate imaginary part of c for correct ship orientation
    if (uFractalType==2) c.y = -c.y;
    float iter=0.0; bool esc=false;
    for (int i=0;i<2048;i++) {
      if (i>=uMaxIter) break;
      if (uFractalType==2) z=vec2(abs(z.x),abs(z.y));
      z=vec2(z.x*z.x-z.y*z.y,2.0*z.x*z.y)+c;
      if (dot(z,z)>256.0){ iter=float(i)-log2(log2(dot(z,z))*0.5); esc=true; break; }
    }
    if (!esc) return vec4(0.0,0.0,0.0,1.0);
    return vec4(palette(iter/float(uMaxIter)),1.0);
  }

  // df64 escape (deep zoom precision, used when zoom >= 1e3)
  vec4 escapeDF64(vec2 uv) {
    float aspect=uResolution.x/uResolution.y;
    float px=(uv.x-0.5)*aspect/uZoom;
    float py=(uv.y-0.5)/uZoom;
    vec2 cx=dadd(vec2(uCenterHi.x,uCenterLo.x),vec2(px,0.0));
    vec2 cy=dadd(vec2(uCenterHi.y,uCenterLo.y),vec2(py,0.0));
    // Burning Ship: negate imaginary part of c
    if (uFractalType==2) cy=vec2(-cy.x,-cy.y);
    vec2 zx,zy,cfx,cfy;
    if (uFractalType==1) { zx=cx; zy=cy; cfx=vec2(uJuliaC.x,0.0); cfy=vec2(uJuliaC.y,0.0); }
    else                 { zx=vec2(0.0); zy=vec2(0.0); cfx=cx; cfy=cy; }
    float iter=0.0; bool esc=false;
    for (int i=0;i<2048;i++) {
      if (i>=uMaxIter) break;
      if (uFractalType==2) {
        if (zx.x < 0.0) zx = vec2(-zx.x, -zx.y);
        if (zy.x < 0.0) zy = vec2(-zy.x, -zy.y);
      }
      vec2 zx2=dmul(zx,zx); vec2 zy2=dmul(zy,zy);
      vec2 nzx=dadd(dsub(zx2,zy2),cfx);
      vec2 nzy=dadd(dmul(vec2(2.0,0.0),dmul(zx,zy)),cfy);
      zx=nzx; zy=nzy;
      float m2=zx.x*zx.x+zy.x*zy.x;
      if (m2>256.0){ iter=float(i)-log2(log2(m2)*0.5); esc=true; break; }
    }
    if (!esc) return vec4(0.0,0.0,0.0,1.0);
    return vec4(palette(iter/float(uMaxIter)),1.0);
  }

  // Perturbation Theory escape (True Infinite Zoom for Mandelbrot)
  // CORRECT loop order: check escape on z_n = Z_n + δz_n FIRST, then compute δz_{n+1}.
  // Using df64 pixel-step and delta-center uniforms avoids blur at extreme zoom.
  vec4 escapePT(vec2 uv) {
    float ux = uv.x - 0.5;
    float uy = uv.y - 0.5;

    // Compute dc = pixel_offset + uDeltaCenter in df64
    // Pixel offset = ux * uPixelStep
    vec2 dcx = dadd(vec2(uDeltaCenterHi.x, uDeltaCenterLo.x), dmul(vec2(ux, 0.0), vec2(uPixelStepHi.x, uPixelStepLo.x)));
    vec2 dcy = dadd(vec2(uDeltaCenterHi.y, uDeltaCenterLo.y), dmul(vec2(uy, 0.0), vec2(uPixelStepHi.y, uPixelStepLo.y)));

    // δz_n = (dzx, dzy) where each is a vec2 (hi, lo)
    vec2 dzx = vec2(0.0);
    vec2 dzy = vec2(0.0);

    float iter = 0.0;
    bool esc = false;
    for (int i = 0; i < 2048; i++) {
      if (i >= uMaxIter) break;

      // Read Z_n (reference orbit at step n)
      vec4 ref = texture2D(uRefOrbit, vec2((float(i) + 0.5) / 2048.0, 0.5));
      vec2 z_ref = vec2(ref.x + ref.y, ref.z + ref.w);

      // 1) Check escape on z_n = Z_n + δz_n
      // For escape check, float precision on z_total is sufficient
      vec2 z_total = z_ref + vec2(dzx.x, dzy.x);
      float m2 = dot(z_total, z_total);
      if (m2 > 256.0) {
        iter = float(i) - log2(log2(m2) * 0.5);
        esc = true;
        break;
      }

      // 2) Update: δz_{n+1} = 2·Z_n·δz_n + δz_n² + δc
      // This is: dz = (2*Z + dz)*dz + dc
      // We use df64 to maintain precision between pixels at extreme zoom.
      
      // tmp = 2*Z + dz
      vec2 tx = dadd(vec2(2.0 * z_ref.x, 0.0), dzx);
      vec2 ty = dadd(vec2(2.0 * z_ref.y, 0.0), dzy);
      
      // new_dz = tmp * dz + dc
      // Complex mult: (tx + i*ty) * (dzx + i*dzy) = (tx*dzx - ty*dzy) + i*(tx*dzy + ty*dzx)
      vec2 ndzx = dadd(dsub(dmul(tx, dzx), dmul(ty, dzy)), dcx);
      vec2 ndzy = dadd(dadd(dmul(tx, dzy), dmul(ty, dzx)), dcy);
      
      dzx = ndzx;
      dzy = ndzy;
    }
    if (!esc) return vec4(0.0, 0.0, 0.0, 1.0);
    return vec4(palette(iter / float(uMaxIter)), 1.0);
  }

  vec4 computeNewton(vec2 pixel) {
    vec2 z=pixel; float conv=0.0; int root=0;
    vec2 r0=vec2(1.0,0.0),r1=vec2(-0.5,0.866),r2=vec2(-0.5,-0.866);
    for (int i=0;i<2048;i++) {
      if (i>=uMaxIter) break;
      vec2 z2=cmul(z,z); z=z-cdiv(cmul(z2,z)-vec2(1.0,0.0),3.0*z2);
      float d0=length(z-r0),d1=length(z-r1),d2=length(z-r2);
      if (d0<0.0005||d1<0.0005||d2<0.0005) {
        conv=float(i)/float(uMaxIter);
        if(d0<d1&&d0<d2)root=0; else if(d1<d2)root=1; else root=2; break;
      }
    }
    
    // Smooth coloring based on convergence speed and root
    float t = float(root) * 0.333 + conv * uColorDensity;
    vec3 col = palette(t);
    
    // Add shading/depth
    float b = 1.0 - pow(conv, 0.3);
    return vec4(col * b, 1.0);
  }

  vec4 fractal(vec2 uv) {
    float aspect=uResolution.x/uResolution.y;
    if (uFractalType==3) {
      vec2 p=vec2((uv.x-0.5)*aspect,uv.y-0.5)/uZoom+uCenterHi;
      return computeNewton(p);
    }
    if (uFractalType == 0 || uFractalType == 1) {
      if (uZoom > 1e3) return escapePT(uv);
    }
    if (uZoom > 1e3) return escapeDF64(uv);
    vec2 p=vec2((uv.x-0.5)*aspect,uv.y-0.5)/uZoom+uCenterHi;
    return escapeF32(p);
  }

  void main() {
    vec2 px = 1.0/uResolution;
    vec4 col = vec4(0.0);
    col += fractal(vUv + vec2( 0.125, 0.375)*px);
    col += fractal(vUv + vec2(-0.375, 0.125)*px);
    col += fractal(vUv + vec2( 0.375,-0.125)*px);
    col += fractal(vUv + vec2(-0.125,-0.375)*px);
    gl_FragColor = col * 0.25;
  }
`;

// ─── Scene ────────────────────────────────────────────────────────────────────

function FractalScene({ refs, downloadRef, orbitTexture }: {
  refs: {
    viewCenter: React.MutableRefObject<[Decimal, Decimal]>;
    refCenter: React.MutableRefObject<[Decimal, Decimal]>;
    zoom:   React.MutableRefObject<number>;
    maxIter: React.MutableRefObject<number>;
    fractal: React.MutableRefObject<FractalType>;
    colorA: React.MutableRefObject<string>;
    colorB: React.MutableRefObject<string>;
    colorDensity: React.MutableRefObject<number>;
    juliaC: React.MutableRefObject<[number,number]>;
  };
  downloadRef: React.MutableRefObject<((mult: number) => void) | null>;
  orbitTexture: THREE.DataTexture;
}) {
  const { size, gl, scene, camera } = useThree();

  const uniforms = useMemo(() => {
    const vx = refs.viewCenter.current[0].toNumber();
    const vy = refs.viewCenter.current[1].toNumber();
    const [chi, clo] = [splitDF(vx), splitDF(vy)];
    const dcx = refs.viewCenter.current[0].sub(refs.refCenter.current[0]).toNumber();
    const dcy = refs.viewCenter.current[1].sub(refs.refCenter.current[1]).toNumber();
    const aspect = size.width / size.height;
    const z = refs.zoom.current;
    const stepX = Math.fround(aspect / z);
    const stepY = Math.fround(1.0 / z);
    return {
      uResolution:  { value: new THREE.Vector2(size.width, size.height) },
      uCenterHi:    { value: new THREE.Vector2(chi[0], clo[0]) },
      uCenterLo:    { value: new THREE.Vector2(chi[1], clo[1]) },
      uZoom:        { value: z },
      uMaxIter:     { value: refs.maxIter.current },
      uFractalType:  { value: refs.fractal.current },
      uJuliaC:       { value: new THREE.Vector2(...refs.juliaC.current) },
      uColorA:       { value: new THREE.Color(refs.colorA.current) },
      uColorB:       { value: new THREE.Color(refs.colorB.current) },
      uColorDensity: { value: refs.colorDensity.current },
      uRefOrbit:     { value: orbitTexture },
      uDeltaCenterHi: { value: new THREE.Vector2(0, 0) },
      uDeltaCenterLo: { value: new THREE.Vector2(0, 0) },
      uPixelStepHi:  { value: new THREE.Vector2(stepX, stepY) },
      uPixelStepLo:  { value: new THREE.Vector2(
        Math.fround(aspect / z - stepX),
        Math.fround(1.0 / z - stepY)
      ) },
    };
  }, [orbitTexture]); // eslint-disable-line

  useFrame(() => {
    const vx = refs.viewCenter.current[0];
    const vy = refs.viewCenter.current[1];
    const [cxhi, cxlo] = splitDF(vx.toNumber());
    const [cyhi, cylo] = splitDF(vy.toNumber());
    uniforms.uResolution.value.set(size.width, size.height);
    uniforms.uCenterHi.value.set(cxhi, cyhi);
    uniforms.uCenterLo.value.set(cxlo, cylo);
    uniforms.uZoom.value        = refs.zoom.current;
    uniforms.uMaxIter.value     = refs.maxIter.current;
    uniforms.uFractalType.value  = refs.fractal.current;
    uniforms.uJuliaC.value.set(...refs.juliaC.current);
    uniforms.uColorA.value.set(refs.colorA.current);
    uniforms.uColorB.value.set(refs.colorB.current);
    uniforms.uColorDensity.value = refs.colorDensity.current;
    
    const dcx = vx.sub(refs.refCenter.current[0]).toNumber();
    const dcy = vy.sub(refs.refCenter.current[1]).toNumber();
    const [dcxHi, dcxLo] = splitDF(dcx);
    const [dcyHi, dcyLo] = splitDF(dcy);
    uniforms.uDeltaCenterHi.value.set(dcxHi, dcyHi);
    uniforms.uDeltaCenterLo.value.set(dcxLo, dcyLo);

    // Compute pixel step from Decimal to get accurate 1/zoom even at zoom=1e50+
    const aspect = size.width / size.height;
    const z = refs.zoom.current;
    const stepX = Math.fround(aspect / z);
    const stepY = Math.fround(1.0 / z);
    uniforms.uPixelStepHi.value.set(stepX, stepY);
    uniforms.uPixelStepLo.value.set(
      Math.fround(aspect / z - stepX),
      Math.fround(1.0 / z - stepY)
    );
  });

  useEffect(() => {
    downloadRef.current = (mult: number) => {
      const w = Math.round(size.width * mult);
      const h = Math.round(size.height * mult);
      gl.setSize(w, h, false);
      uniforms.uResolution.value.set(w, h);
      gl.render(scene, camera);
      const url = gl.domElement.toDataURL("image/png");
      gl.setSize(size.width, size.height, false);
      uniforms.uResolution.value.set(size.width, size.height);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fractal_${refs.fractal.current}_${Date.now()}.png`;
      a.click();
    };
  }, [size, gl, scene, camera, uniforms, downloadRef, refs]);

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} />
    </mesh>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  maxIter, onMaxIter, colorDensity, onColorDensity,
  colorA, onColorA, colorB, onColorB, fractalType, zoomDisplay,
  juliaC, onJuliaC, onReset, onDownload,
}: {
  maxIter: number; onMaxIter: (v:number)=>void;
  colorDensity: number; onColorDensity: (v:number)=>void;
  colorA: string; onColorA: (v:string)=>void;
  colorB: string; onColorB: (v:string)=>void;
  fractalType: FractalType; zoomDisplay: number;
  juliaC: [number,number]; onJuliaC: (v:[number,number])=>void;
  onReset: ()=>void; onDownload: (mult:number)=>void;
}) {
  const [showDownload, setShowDownload] = useState(false);
  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">{label}</span>
      {children}
    </div>
  );
  const Divider = () => <div className="h-px bg-white/[0.07]" />;

  return (
    <div className="w-72 shrink-0 h-full flex flex-col bg-[#0a0a0a] border-l border-white/[0.07] text-white overflow-y-auto">
      <div className="px-5 py-4 border-b border-white/[0.07]">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-0.5">Controls</p>
        <p className="text-white/50 text-xs">Scroll to zoom · Drag to pan</p>
      </div>

      <div className="flex flex-col gap-5 p-5 flex-1">

        <Row label="Gradient Colors">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <span className="text-[9px] text-white/40 uppercase">Primary</span>
              <div className="flex items-center gap-2 bg-white/[0.04] p-1.5 rounded-md border border-white/[0.06]">
                <input type="color" value={colorA} onChange={e => onColorA(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0" />
                <span className="font-mono text-xs text-white/70">{colorA.toUpperCase()}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <span className="text-[9px] text-white/40 uppercase">Secondary</span>
              <div className="flex items-center gap-2 bg-white/[0.04] p-1.5 rounded-md border border-white/[0.06]">
                <input type="color" value={colorB} onChange={e => onColorB(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0" />
                <span className="font-mono text-xs text-white/70">{colorB.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </Row>

        <Divider />

        <Row label={`Color Density · ${colorDensity.toFixed(2)}`}>
          <input type="range" min={0.1} max={5} step={0.01} value={colorDensity}
            onChange={e => onColorDensity(Number(e.target.value))}
            className="w-full cursor-pointer" style={{ accentColor: "#fff" }} />
          <p className="text-[10px] text-white/20">Controls how often the gradient repeats</p>
        </Row>

        <Row label={`Detail Level · ${maxIter}`}>
          <input type="range" min={50} max={1000} step={10} value={maxIter}
            onChange={e => onMaxIter(Number(e.target.value))}
            className="w-full cursor-pointer" style={{ accentColor: "#fff" }} />
          <p className="text-[10px] text-white/20">Higher = more detail at deep zoom</p>
        </Row>

        {fractalType === 1 && (
          <>
            <Divider />
            <Row label="Julia Parameter (C)">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/40 w-4">Re</span>
                  <input type="range" min={-2} max={2} step={0.001} value={juliaC[0]}
                    onChange={e => onJuliaC([Number(e.target.value), juliaC[1]])}
                    className="flex-1 cursor-pointer" style={{ accentColor: "#fff" }} />
                  <span className="text-xs font-mono text-white/70 w-12 text-right">{juliaC[0].toFixed(3)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/40 w-4">Im</span>
                  <input type="range" min={-2} max={2} step={0.001} value={juliaC[1]}
                    onChange={e => onJuliaC([juliaC[0], Number(e.target.value)])}
                    className="flex-1 cursor-pointer" style={{ accentColor: "#fff" }} />
                  <span className="text-xs font-mono text-white/70 w-12 text-right">{juliaC[1].toFixed(3)}i</span>
                </div>
              </div>
            </Row>
          </>
        )}

        <Divider />

        <Row label="Zoom">
          <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 flex items-center justify-between">
            <span className="font-mono text-sm text-white/80">{zoomDisplay.toExponential(3)}×</span>
            {zoomDisplay >= 1e100 ? (
              <span className="text-[10px] text-amber-500/80 font-semibold px-1.5 py-0.5 rounded bg-amber-500/10">LIMIT</span>
            ) : zoomDisplay > 1e3 ? (
              <span className="text-[10px] text-violet-400/80 px-1.5 py-0.5 rounded bg-violet-400/10">Perturbation active</span>
            ) : null}
          </div>
        </Row>

      </div>

      <div className="p-4 border-t border-white/[0.07] flex flex-col gap-2">
        <button onClick={onReset}
          className="w-full px-4 py-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] text-white/60 hover:text-white text-xs font-medium transition-all">
          Reset View
        </button>
        <div className="relative">
          <button onClick={() => setShowDownload(s => !s)}
            className="w-full px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 ring-1 ring-white/15 text-white text-xs font-semibold transition-all">
            ↓ Export PNG
          </button>
          {showDownload && (
            <div className="absolute bottom-full mb-2 left-0 right-0 bg-[#111] ring-1 ring-white/10 rounded-xl overflow-hidden shadow-2xl">
              {([["Current resolution",1],["2× Hi-Res",2],["4K (3840×2160)",4]] as [string,number][]).map(([label,mult]) => (
                <button key={mult} onClick={() => { onDownload(mult); setShowDownload(false); }}
                  className="w-full px-4 py-3 text-left text-xs text-white/60 hover:bg-white/[0.07] hover:text-white transition-all border-b border-white/[0.06] last:border-0">
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function MandelbrotExplorer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const downloadRef  = useRef<((mult: number) => void) | null>(null);

  const viewCenterRef = useRef<[Decimal, Decimal]>([new Decimal("-0.5"), new Decimal("0")]);
  const refCenterRef  = useRef<[Decimal, Decimal]>([new Decimal("-0.5"), new Decimal("0")]);
  const zoomRef       = useRef<number>(0.5);
  const maxIterRef    = useRef<number>(200);
  const fractalRef    = useRef<FractalType>(0);
  const colorARef     = useRef<string>("#020a0a");
  const colorBRef     = useRef<string>("#4ade80");
  const colorDensityRef = useRef<number>(1.0);
  const juliaCRef     = useRef<[number,number]>([-0.7, 0.27]);

  const [fractalUI,      setFractalUI]      = useState<FractalType>(0);
  const [colorAUI,       setColorAUI]       = useState("#020a0a");
  const [colorBUI,       setColorBUI]       = useState("#4ade80");
  const [maxIterUI,      setMaxIterUI]      = useState(200);
  const [colorDensityUI, setColorDensityUI] = useState(1.0);
  const [zoomUI,         setZoomUI]         = useState(0.5);
  const [juliaCUI,       setJuliaCUI]       = useState<[number,number]>([-0.7, 0.27]);

  const dragging    = useRef(false);
  const lastPointer = useRef<[number,number]>([0, 0]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastOrbitZoom = useRef<number>(0.5); // tracks zoom at last orbit bake

  const orbitData = useMemo(() => new Float32Array(2048 * 4), []);
  const orbitTexture = useMemo(() => {
    const tex = new THREE.DataTexture(orbitData, 2048, 1, THREE.RGBAFormat, THREE.FloatType);
    tex.needsUpdate = true;
    return tex;
  }, [orbitData]);

  const updateOrbit = useCallback(() => {
    const cx = refCenterRef.current[0];
    const cy = refCenterRef.current[1];
    let zx = new Decimal(0);
    let zy = new Decimal(0);
    const max = maxIterRef.current;
    
    for (let i = 0; i < 2048; i++) {
      if (i >= max) {
         orbitData[i*4+0] = 0; orbitData[i*4+1] = 0;
         orbitData[i*4+2] = 0; orbitData[i*4+3] = 0;
         continue;
      }
      const zxn = zx.toNumber();
      const zyn = zy.toNumber();
      orbitData[i*4+0] = Math.fround(zxn);
      orbitData[i*4+1] = Math.fround(zxn - orbitData[i*4+0]);
      orbitData[i*4+2] = Math.fround(zyn);
      orbitData[i*4+3] = Math.fround(zyn - orbitData[i*4+2]);
      
      const zx2 = zx.mul(zx);
      const zy2 = zy.mul(zy);
      if (zx2.add(zy2).gte(16)) {
        for (let j = i+1; j < 2048; j++) {
          orbitData[j*4+0] = orbitData[i*4+0]; orbitData[j*4+1] = orbitData[i*4+1];
          orbitData[j*4+2] = orbitData[i*4+2]; orbitData[j*4+3] = orbitData[i*4+3];
        }
        break;
      }
      const nzx = zx2.sub(zy2).add(cx);
      const nzy = zx.mul(zy).mul(2).add(cy);
      zx = nzx;
      zy = nzy;
    }
    orbitTexture.needsUpdate = true;
  }, [orbitData, orbitTexture]);

  const requestOrbitUpdate = useCallback((immediate = false) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    const doUpdate = () => {
      refCenterRef.current = [...viewCenterRef.current];
      lastOrbitZoom.current = zoomRef.current;
      updateOrbit();
    };
    // Update immediately if: forced, or zoom has changed by >4x since last bake
    // (prevents rendering stale orbits at wildly different zoom levels)
    const zoomRatio = zoomRef.current / lastOrbitZoom.current;
    if (immediate || zoomRatio > 4 || zoomRatio < 0.25) {
      doUpdate();
    } else {
      debounceTimer.current = setTimeout(doUpdate, 120);
    }
  }, [updateOrbit]);

  const refs = useMemo(() => ({
    viewCenter: viewCenterRef, refCenter: refCenterRef, zoom: zoomRef, maxIter: maxIterRef,
    fractal: fractalRef, colorA: colorARef, colorB: colorBRef,
    colorDensity: colorDensityRef, juliaC: juliaCRef,
  }), []);

  const switchFractal = useCallback((id: FractalType) => {
    const f = FRACTALS[id];
    viewCenterRef.current = [new Decimal(f.center[0]), new Decimal(f.center[1])];
    refCenterRef.current = [...viewCenterRef.current];
    zoomRef.current   = f.zoom;
    lastOrbitZoom.current = f.zoom;
    fractalRef.current = id;
    setFractalUI(id);
    setZoomUI(f.zoom);
    updateOrbit();
  }, [updateOrbit]);

  const handleReset = useCallback(() => {
    const f = FRACTALS[fractalRef.current];
    viewCenterRef.current = [new Decimal(f.center[0]), new Decimal(f.center[1])];
    refCenterRef.current = [...viewCenterRef.current];
    zoomRef.current   = f.zoom;
    lastOrbitZoom.current = f.zoom;
    setZoomUI(f.zoom);
    updateOrbit();
  }, [updateOrbit]);

  useEffect(() => {
    updateOrbit();
  }, [updateOrbit]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect   = el.getBoundingClientRect();
      const aspect = rect.width / rect.height;
      const ndcX   = (e.clientX - rect.left) / rect.width;
      // ndcY: 0=top of canvas. Shader UV-y is flipped (0=bottom). Correct with (1 - ndcY).
      const ndcY   = 1 - (e.clientY - rect.top) / rect.height;
      
      const z = zoomRef.current;
      // Complex coordinate under the cursor (must stay fixed after zoom)
      const offX = new Decimal(ndcX - 0.5).mul(aspect).div(z);
      const offY = new Decimal(ndcY - 0.5).div(z);
      
      const cpx = viewCenterRef.current[0].add(offX);
      const cpy = viewCenterRef.current[1].add(offY);
      
      const factor  = e.deltaY > 0 ? 1 / 1.12 : 1.12;  // 12% per tick — faster but smooth
      const newZoom = Math.max(0.05, Math.min(z * factor, 1e100)); // True Infinite Zoom!
      zoomRef.current   = newZoom;
      
      // Shift center so the cursor's complex coord stays fixed
      const newOffX = new Decimal(ndcX - 0.5).mul(aspect).div(newZoom);
      const newOffY = new Decimal(ndcY - 0.5).div(newZoom);
      
      viewCenterRef.current = [cpx.sub(newOffX), cpy.sub(newOffY)];
      setZoomUI(newZoom);
      requestOrbitUpdate(); // adaptive: immediate if zoom crossed a 4x boundary
    };

    const onPointerDown = (e: PointerEvent) => {
      dragging.current    = true;
      lastPointer.current = [e.clientX, e.clientY];
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const rect   = el.getBoundingClientRect();
      const aspect = rect.width / rect.height;
      const [lx, ly] = lastPointer.current;
      const dx = new Decimal(e.clientX - lx).div(rect.width);
      const dy = new Decimal(e.clientY - ly).div(rect.height);
      
      viewCenterRef.current = [
        viewCenterRef.current[0].sub(dx.mul(aspect).div(zoomRef.current)),
        viewCenterRef.current[1].add(dy.div(zoomRef.current)),
      ];
      lastPointer.current = [e.clientX, e.clientY];
      requestOrbitUpdate();
    };

    const onPointerUp = () => { dragging.current = false; };

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
  }, [requestOrbitUpdate]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-4 py-2 bg-black/80 backdrop-blur-xl border-b border-white/10 shrink-0 z-20">
        <a href="/" className="shrink-0">
          <Image src="/logo.png" alt="AD" width={28} height={28} className="rounded-md" />
        </a>
        <div className="flex items-center gap-1 flex-1">
          {FRACTALS.map(f => (
            <button key={f.id} onClick={() => switchFractal(f.id as FractalType)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                fractalUI === f.id
                  ? "bg-white/15 text-white border border-white/20"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <a href="/math" className="text-white/40 hover:text-white text-xs transition-colors shrink-0">
          ← Back
        </a>
      </div>

      {/* Canvas + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <div ref={containerRef} className="flex-1 cursor-crosshair touch-none">
          <Canvas
            orthographic
            camera={{ zoom: 1, position: [0, 0, 1], near: 0, far: 10 }}
            gl={{ antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: true }}
            style={{ width: "100%", height: "100%" }}
          >
            <FractalScene refs={refs} downloadRef={downloadRef} orbitTexture={orbitTexture} />
          </Canvas>
        </div>

        <Sidebar
          maxIter={maxIterUI} onMaxIter={v => { maxIterRef.current=v; setMaxIterUI(v); }}
          colorDensity={colorDensityUI} onColorDensity={v => { colorDensityRef.current=v; setColorDensityUI(v); }}
          colorA={colorAUI} onColorA={v => { colorARef.current=v; setColorAUI(v); }}
          colorB={colorBUI} onColorB={v => { colorBRef.current=v; setColorBUI(v); }}
          fractalType={fractalUI} zoomDisplay={zoomUI}
          juliaC={juliaCUI} onJuliaC={v => { juliaCRef.current=v; setJuliaCUI(v); }}
          onReset={handleReset}
          onDownload={mult => downloadRef.current?.(mult)}
        />
      </div>
    </div>
  );
}
