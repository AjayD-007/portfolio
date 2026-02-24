"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useTheme } from "next-themes";
import * as THREE from "three";

const fragmentShader = `
uniform sampler2D uTextureBase;
uniform sampler2D uTextureColor;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform float uRadius;
uniform float uEdgeWidth;
uniform float uDarkBrightness;
uniform float uIsTouch;

varying vec2 vUv;

// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec4 baseTex = texture2D(uTextureBase, vUv);
  vec4 colorTex = texture2D(uTextureColor, vUv);
  
  if (baseTex.a < 0.1) discard;

  float bottomFade = smoothstep(0.0, 0.3, vUv.y);
  float finalAlpha = baseTex.a * bottomFade;

  // On touch devices without hover, just display the full color portrait immediately
  if (uIsTouch > 0.5) {
    if (finalAlpha < 0.01) discard;
    gl_FragColor = vec4(colorTex.rgb, finalAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    return;
  }

  // Dim the base pencil sketch in dark mode
  vec3 baseColor = baseTex.rgb * uDarkBrightness;

  float dist = distance(vUv, uMouse);
  float noise = snoise(vUv * 5.0) * 0.1;
  float noisyDist = dist + noise;
  
  float revealFactor = 1.0 - smoothstep(uRadius, uRadius + uEdgeWidth, noisyDist);
  
  // Directly mix the raw pixel data without color correction
  vec3 finalColor = mix(baseColor, colorTex.rgb, revealFactor);

  if (finalAlpha < 0.01) discard;
  
  // Return exactly the native alpha bounded by the bottom fade
  gl_FragColor = vec4(finalColor, finalAlpha);
  
  // WebGL standard Tone mapping chunk
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

function HeroAvatarShaderPlane() {
  const { theme, resolvedTheme } = useTheme();
  const isDark = theme === "dark" || resolvedTheme === "dark";

  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const [pencilTex, lightTex, darkTex] = useTexture([
    "/avatar-pencil.png",
    "/avatar-light.png",
    "/avatar-dark.png",
  ]);

  useEffect(() => {
    // Crucial fixed config for useTexture that sometimes fails to set automatically in Next.js
    const textures = [pencilTex, lightTex, darkTex];
    textures.forEach(t => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
      t.needsUpdate = true;
    });
  }, [pencilTex, lightTex, darkTex]);

  const activeTex = isDark ? darkTex : lightTex;

  // We define uniforms once so that changing the theme doesn't recreate the entire uniform object,
  // which can break hovering interactions due to a full material recompilation.
  const uniforms = useMemo(
    () => ({
      uTextureBase: { value: pencilTex },
      uTextureColor: { value: activeTex }, 
      uMouse: { value: new THREE.Vector2(-1, -1) },
      uRadius: { value: 0.25 },
      uEdgeWidth: { value: 0.15 },
      uDarkBrightness: { value: isDark ? 0.4 : 1.0 },
      uIsTouch: { value: 0.0 }, // Dynamic toggle
    }),
    [] // No dependencies! We update the activeTex manually via useEffect below.
  );

  useEffect(() => {
    if (materialRef.current) {
      const isTouchScreen = window.matchMedia("(hover: none), (pointer: coarse)").matches;
      materialRef.current.uniforms.uIsTouch.value = isTouchScreen ? 1.0 : 0.0;
    }
  }, []);

  // Update texture explicitly when theme changes
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTextureColor.value = activeTex;
      materialRef.current.uniforms.uDarkBrightness.value = isDark ? 0.4 : 1.0;
    }
  }, [activeTex, isDark]);

  const handlePointerMove = (e: any) => {
    if (materialRef.current && e.uv) {
      materialRef.current.uniforms.uMouse.value.set(e.uv.x, e.uv.y);
    }
  };

  const handlePointerOut = () => {
    if (materialRef.current) {
      materialRef.current.uniforms.uMouse.value.set(-1, -1);
    }
  };

  const cardWidth = 3;
  const cardHeight = 4;

  return (
    <mesh 
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    >
      <planeGeometry args={[cardWidth, cardHeight]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
}

export function HeroAvatarCanvas() {
  return (
    <div className="w-full h-full relative z-10 pointer-events-auto touch-pan-y">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 2]}
      >
        <HeroAvatarShaderPlane />
      </Canvas>
    </div>
  );
}
