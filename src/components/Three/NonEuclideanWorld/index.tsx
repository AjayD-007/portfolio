import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTexture, Text } from "@react-three/drei";
import { CORRIDOR } from "@/config/corridor";
import { MovingSegment } from "./Segment";
import { FadingStationaryProps } from "./Stationary";
import { HollowLeftWall } from "./Walls";
import { crownShape, baseboardShape } from "./Shapes";
import { Painting } from "./Painting";

export function NonEuclideanWorld({ scrollDelta }: { scrollDelta: number }) {
  const currentOffset = useRef(0);
  const { L, W, H, numSegments } = CORRIDOR.geometry;
  const nearWallLength = L - 4;
  
  const paintingTexture = useTexture('/textures/painting.png');
  
  const plaster = useTexture({
    map: '/pbr/beige_wall_001_diff_1k.jpg',
    normalMap: '/pbr/beige_wall_001_nor_gl_1k.jpg',
    roughnessMap: '/pbr/beige_wall_001_rough_1k.jpg'
  });
  
  const wood = useTexture({
    map: '/pbr/dark_wood_diff_1k.jpg',
    normalMap: '/pbr/dark_wood_nor_gl_1k.jpg',
    roughnessMap: '/pbr/dark_wood_rough_1k.jpg'
  });

  const floorTex = useTexture({
    map: '/pbr/rubberized_track_diff_1k.jpg',
    normalMap: '/pbr/rubberized_track_nor_gl_1k.jpg',
    roughnessMap: '/pbr/rubberized_track_arm_1k.jpg' 
  });

  useMemo(() => {
     const applyRepeat = (texMap: any, rs: number, rt: number) => {
        Object.values(texMap).forEach((t: any) => {
           t.wrapS = THREE.RepeatWrapping;
           t.wrapT = THREE.RepeatWrapping;
           t.repeat.set(rs, rt);
        });
     };
     applyRepeat(plaster, 4, 1.5); 
     applyRepeat(wood, 1, 2);      
     applyRepeat(floorTex, 6, 18);    
  }, [plaster, wood, floorTex]);

  const clipPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), L + nearWallLength), [L, nearWallLength]);
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);

  useEffect(() => {
    if (spotLightRef.current && targetRef.current) {
       spotLightRef.current.target = targetRef.current;
       spotLightRef.current.target.updateMatrixWorld();
    }
  }, []);

  useFrame((state, delta) => {
    const targetOffset = -scrollDelta * 0.05;
    currentOffset.current = THREE.MathUtils.damp(
      currentOffset.current,
      targetOffset,
      3,
      delta
    );

    state.camera.position.set(...CORRIDOR.camera.position);
    state.camera.lookAt(...CORRIDOR.camera.lookAt);
  });

  return (
    <group>
      <ambientLight intensity={CORRIDOR.lights.ambientIntensity} color={CORRIDOR.colors.ambientLight} />

      {/* Moving segments — right wall uses renderOrder to be occluded by static end-cap */}
      <group scale={[0.99, 0.99, 1]}>
        {Array.from({ length: numSegments }).map((_, i) => (
          <MovingSegment key={i} index={i} currentOffset={currentOffset} numSegments={numSegments} plaster={plaster} floorTex={floorTex} wood={wood} paintingTexture={paintingTexture} clipPlane={clipPlane} />
        ))}
      </group>

      <group position={[0, 0, -L]}>
        {/* Extended Back Wall (4x Width) */}
        <mesh position={[W * 1.5, H/2, -L]}>
          <planeGeometry args={[W * 4, H]} />
          <meshStandardMaterial {...plaster} roughness={1.5} normalScale={new THREE.Vector2(1.5, 1.5)} />
        </mesh>
        
        {/* Extended Back Wall Crown Molding */}
        <mesh position={[W * 3.5, H, -L]} rotation={[0, -Math.PI/2, 0]}>
          <extrudeGeometry args={[crownShape, { depth: W * 4, bevelEnabled: false, curveSegments: 12 }]} />
          <meshStandardMaterial {...plaster} color={CORRIDOR.colors.ceiling} roughness={0.7} />
        </mesh>

        {/* Extended Back Wall Baseboard */}
        <mesh position={[W * 3.5, 0, -L]} rotation={[0, -Math.PI/2, 0]}>
          <extrudeGeometry args={[baseboardShape, { depth: W * 4, bevelEnabled: false, curveSegments: 12 }]} />
          <meshStandardMaterial {...plaster} color={CORRIDOR.colors.ceiling} roughness={0.7} />
        </mesh>
        
        {/* Turn Floor */}
        <mesh position={[W * 2, 0, -(L - 2)]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[W * 3, 4]} />
          <meshStandardMaterial {...floorTex} />
        </mesh>
        {/* Turn Ceiling */}
        <mesh position={[W * 2, H, -(L - 2)]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[W * 3, 4]} />
          <meshStandardMaterial color={CORRIDOR.colors.ceiling} roughness={1} />
        </mesh>

        {/* Turn Front Wall (facing camera) */}
        <mesh position={[W * 2, H/2, -nearWallLength]}>
            <planeGeometry args={[W * 3, H]} />
            <meshStandardMaterial {...plaster} roughness={1.5} normalScale={new THREE.Vector2(1.5, 1.5)} />
        </mesh>
        {/* Turn Front Wall Crown Molding */}
        <mesh position={[W * 3.5, H, -nearWallLength]} rotation={[0, -Math.PI/2, 0]}>
          <extrudeGeometry args={[crownShape, { depth: W * 3, bevelEnabled: false, curveSegments: 12 }]} />
          <meshStandardMaterial {...plaster} color={CORRIDOR.colors.ceiling} roughness={0.7} />
        </mesh>
        {/* Turn Front Wall Baseboard */}
        <mesh position={[W * 3.5, 0, -nearWallLength]} rotation={[0, -Math.PI/2, 0]}>
          <extrudeGeometry args={[baseboardShape, { depth: W * 3, bevelEnabled: false, curveSegments: 12 }]} />
          <meshStandardMaterial {...plaster} color={CORRIDOR.colors.ceiling} roughness={0.7} />
        </mesh>

        {/* Turn Rightmost Wall */}
        <mesh position={[W * 3.5, H/2, -(L - 2)]} rotation={[0, -Math.PI/2, 0]}>
            <planeGeometry args={[4, H]} />
            <meshStandardMaterial {...plaster} roughness={1.5} normalScale={new THREE.Vector2(1.5, 1.5)} />
        </mesh>
        {/* Turn Rightmost Crown Molding */}
        <mesh position={[W * 3.5, H, -L]}>
          <extrudeGeometry args={[require('./Shapes').rightCrownShape, { depth: 4, bevelEnabled: false, curveSegments: 12 }]} />
          <meshStandardMaterial {...plaster} color={CORRIDOR.colors.ceiling} roughness={0.7} />
        </mesh>
        {/* Turn Rightmost Baseboard */}
        <mesh position={[W * 3.5, 0, -L]}>
          <extrudeGeometry args={[require('./Shapes').rightBaseboardShape, { depth: 4, bevelEnabled: false, curveSegments: 12 }]} />
          <meshStandardMaterial {...plaster} color={CORRIDOR.colors.ceiling} roughness={0.7} />
        </mesh>

        {/* Diagonal Streetlight from right corner */}
        <spotLight 
           ref={spotLightRef}
           position={[W/2 + 2.5, H + 4.2, -(L - 1.5)]} 
           intensity={300} 
           angle={Math.PI / 8} 
           penumbra={1} 
           distance={20} 
           decay={2} 
           color="#ffff" 
        />
        <object3D ref={targetRef} position={[W/4, 0, -(L - 0.5)]} />
        
        <mesh position={[0, 0, -L/2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[W, L]} />
          <meshStandardMaterial {...floorTex} />
        </mesh>
        <mesh position={[0, H, -L/2]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[W, L]} />
          <meshStandardMaterial color={CORRIDOR.colors.ceiling} roughness={1} />
        </mesh>
        
        <HollowLeftWall plaster={plaster} wood={wood} />

        {/* Static end-cap right wall — reaches precisely to the turn room gap */}
        {/* Near panel: local Z=0 to -nearWallLength */}
        <mesh position={[W/2 + 0.01, H/2, -nearWallLength/2]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[nearWallLength, H]} />
            <meshStandardMaterial {...plaster} roughness={1.5} normalScale={new THREE.Vector2(1.5, 1.5)} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
        </mesh>

        {/* Static Right wall Crown Molding — always there (non-fading, requested) */}
        <mesh position={[W/2, H, -nearWallLength]}>
           <extrudeGeometry args={[require('./Shapes').rightCrownShape, { depth: nearWallLength, bevelEnabled: false, curveSegments: 12 }]} />
           <meshStandardMaterial {...plaster} color={CORRIDOR.colors.ceiling} roughness={0.7} />
        </mesh>
        {/* GAP: local Z=-8 to -12 (world -20 to -24) — moving walls clipped here, corner room perfectly revealed */}
        {/* No far panel needed: the turn room extends entirely to the back wall at Z=-24 */}

        {/* GIANT End Wall Painting Override */}
        <Painting cycleIndex={0} paintingTexture={paintingTexture} position={[0, 1.6, -L + 0.05]} rotation={[0, 0, 0]} scale={[1.7, 1.7, 1.7]} />

        <FadingStationaryProps currentOffset={currentOffset} numSegments={numSegments} wood={wood} paintingTexture={paintingTexture} plaster={plaster} />
      </group>
    </group>
  );
}
