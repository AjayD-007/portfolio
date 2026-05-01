import * as THREE from "three";
import { CORRIDOR } from "@/config/corridor";

export function Painting({ cycleIndex, paintingTexture, groupRef, position, rotation, scale }: any) {
  const { L, W } = CORRIDOR.geometry;
  
  const colors = ["#ffffff", "#d0d8ff", "#ffe0e0"];
  // 90deg stretches aspect ratios; only flip 180 or use 0
  const rotZ = [0, Math.PI, 0];
  
  const pos = position || [W/2 - 0.02, 1.5, -L/2];
  const rot = rotation || [0, -Math.PI / 2, 0];
  const scl = scale || [1, 1, 1];

  return (
     <group ref={groupRef} position={pos} rotation={rot} scale={scl}>
        <mesh position={[0, 0, 0]}>
           <boxGeometry args={[1.5, 1.2, 0.04]} />
           <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.021]} rotation={[0, 0, rotZ[cycleIndex]]}>
           <planeGeometry args={[1.4, 1.1]} />
           <meshStandardMaterial color={colors[cycleIndex]} roughness={0.6} map={paintingTexture} bumpMap={paintingTexture} bumpScale={0.015} />
        </mesh>
     </group>
  );
}
