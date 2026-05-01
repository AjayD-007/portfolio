import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CORRIDOR } from "@/config/corridor";
import { HollowLeftWall } from "./Walls";
import { RecessedDoorAssembly } from "./Door";
import { Painting } from "./Painting";
import { rightCrownShape, rightBaseboardShape } from "./Shapes";

export function MovingSegment({ index, currentOffset, numSegments, plaster, floorTex, wood, paintingTexture, clipPlane }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const ceiliMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const { L, W, H } = CORRIDOR.geometry;

  const cycleIndex = (index - 1 + numSegments) % numSegments;

  useFrame((state) => {
    if (cycleIndex === 1) {
       let t = state.clock.elapsedTime;
       let flicker = 0.8 + 0.2 * (Math.sin(t * 10) * Math.sin(t * 3.3) * Math.cos(t * 17));
       if (pointLightRef.current) pointLightRef.current.intensity = CORRIDOR.lights.ceilingIntensity * flicker;
       if (ceiliMatRef.current) ceiliMatRef.current.emissiveIntensity = 3 * flicker;
    }
    if (groupRef.current) {
      let offset = currentOffset.current % (L * numSegments);
      if (offset < 0) offset += L * numSegments;
      let zPos = L - index * L - offset;
      if (zPos <= -L) zPos += L * numSegments;
      groupRef.current.position.z = zPos;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, -L/2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, L]} />
        <meshStandardMaterial {...floorTex} />
      </mesh>
      
      <mesh position={[0, H, -L/2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, L]} />
        <meshStandardMaterial color={CORRIDOR.colors.ceiling} roughness={1} />
      </mesh>
      
      <HollowLeftWall plaster={plaster} wood={wood} />

      {/* Solid right wall with clipping plane applied: shears away exactly at world Z=-18 */}
      <SolidRightWall 
        plaster={plaster} 
        color={CORRIDOR.colors.ceiling} 
        H={H} 
        W={W} 
        L={L}
        rightCrownShape={rightCrownShape} 
        rightBaseboardShape={rightBaseboardShape} 
        clipPlane={clipPlane}
      />

      <RecessedDoorAssembly wood={wood} cycleIndex={cycleIndex} />
      <Painting cycleIndex={cycleIndex} paintingTexture={paintingTexture} />

      <group position={[0, H - 0.05, -L/2]}>
         <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.5, 0.1, 0.4]} />
            <meshStandardMaterial ref={ceiliMatRef} color="#ffffff" emissive={CORRIDOR.colors.ceilingLight} emissiveIntensity={3} />
         </mesh>
         <pointLight ref={pointLightRef} position={[0, -0.2, 0]} distance={CORRIDOR.lights.ceilingDistance} intensity={CORRIDOR.lights.ceilingIntensity} color={CORRIDOR.colors.ceilingLight} />
      </group>
    </group>
  );
}

function SolidRightWall({ plaster, color, H, W, L, rightCrownShape, rightBaseboardShape, clipPlane }: any) {
  const clippingPlanes = clipPlane ? [clipPlane] : [];

  return (
    <group>
      <mesh position={[W/2, H/2, -L/2]} rotation={[0, -Math.PI / 2, 0]}>
         <planeGeometry args={[L, H]} />
         <meshStandardMaterial 
           {...plaster} 
           roughness={1.5} 
           normalScale={new THREE.Vector2(1.5, 1.5)} 
           clippingPlanes={clippingPlanes}
         />
      </mesh>
      <mesh position={[W/2, 0, -L]}>
         <extrudeGeometry args={[rightBaseboardShape, { depth: L, bevelEnabled: false, curveSegments: 12 }]} />
         <meshStandardMaterial 
           {...plaster} 
           color={color} 
           roughness={0.7} 
           clippingPlanes={clippingPlanes}
         />
      </mesh>
      <mesh position={[W/2, H, -L]}>
         <extrudeGeometry args={[rightCrownShape, { depth: L, bevelEnabled: false, curveSegments: 12 }]} />
         <meshStandardMaterial 
           {...plaster} 
           color={color} 
           roughness={0.7} 
           clippingPlanes={clippingPlanes}
         />
      </mesh>
    </group>
  );
}

