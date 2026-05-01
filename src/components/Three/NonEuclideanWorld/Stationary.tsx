import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CORRIDOR } from "@/config/corridor";
import { RecessedDoorAssembly } from "./Door";
import { Painting } from "./Painting";

export function FadingStationaryProps({ currentOffset, numSegments, wood, paintingTexture, plaster }: any) {
  const { L, H } = CORRIDOR.geometry;
  const ceiliMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const propsGroupRef = useRef<THREE.Group>(null);
  const textRef = useRef<any>(null);

  useFrame((state) => {
    let offset = currentOffset.current % (L * numSegments);
    if (offset < 0) offset += L * numSegments;

    const phase = Math.abs((currentOffset.current % L) / L);
    
    let opacity = 1.0;
    if (phase < 0.25) opacity = 0;
    else if (phase >= 0.25 && phase < 0.6) opacity = Math.max(0, (phase - 0.25) / 0.35); 
    else opacity = 1;

    if (propsGroupRef.current) {
        propsGroupRef.current.traverse((child: any) => {
            if (child.isMesh && child.material) {
                child.material.transparent = true;
                child.material.opacity = opacity;
                child.material.depthWrite = opacity > 0.1; 
            }
        });
    }

    if (ceiliMatRef.current) { ceiliMatRef.current.opacity = opacity; ceiliMatRef.current.transparent = true; }
    if (textRef.current) { 
        textRef.current.fillOpacity = opacity; 
        let incomingI = 0;
        for (let i = 0; i < numSegments; i++) {
            let z = L - i * L - offset;
            if (z <= -L) z += L * numSegments;
            if (z > -L && z <= 0) { incomingI = i; break; }
        }
        const cycleIndex = (incomingI - 1 + numSegments) % numSegments;
        textRef.current.text = String(427 + cycleIndex);

        let flicker = 1;
        if (cycleIndex === 1) { 
           let t = state.clock.elapsedTime;
           flicker = 0.8 + 0.2 * (Math.sin(t * 10) * Math.sin(t * 3.3) * Math.cos(t * 17));
        }
        if (pointLightRef.current) pointLightRef.current.intensity = opacity * CORRIDOR.lights.ceilingIntensity * flicker; 
        if (ceiliMatRef.current) ceiliMatRef.current.emissiveIntensity = 3 * flicker;
    }
  });

  return (
    <group>
      <group ref={propsGroupRef}>
         <RecessedDoorAssembly wood={wood} cycleIndex={0} textRef={textRef} />
         <Painting cycleIndex={0} paintingTexture={paintingTexture} />
         
         {/* Fading Right Crown Molding to hide segment pop-in */}
         <mesh position={[CORRIDOR.geometry.W/2, CORRIDOR.geometry.H, -8]}>
             <extrudeGeometry args={[require('./Shapes').rightCrownShape, { depth: 8, bevelEnabled: false, curveSegments: 12 }]} />
             <meshStandardMaterial {...plaster} color={CORRIDOR.colors.ceiling} roughness={0.7} />
         </mesh>
         
         {/* Fading Right Baseboard to hide segment pop-in */}
         <mesh position={[CORRIDOR.geometry.W/2, 0, -8]}>
             <extrudeGeometry args={[require('./Shapes').rightBaseboardShape, { depth: 8, bevelEnabled: false, curveSegments: 12 }]} />
             <meshStandardMaterial {...plaster} color={CORRIDOR.colors.ceiling} roughness={0.7} />
         </mesh>
      </group>

      <group position={[0, H - 0.05, -L/2]}>
         <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.5, 0.1, 0.4]} />
            <meshStandardMaterial ref={ceiliMatRef} transparent color="#ffffff" emissive={CORRIDOR.colors.ceilingLight} emissiveIntensity={3} />
         </mesh>
         <pointLight ref={pointLightRef} position={[0, -0.2, 0]} distance={CORRIDOR.lights.ceilingDistance} intensity={0} color={CORRIDOR.colors.ceilingLight} />
      </group>
    </group>
  );
}
