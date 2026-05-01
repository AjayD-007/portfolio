import * as THREE from "three";
import { Text } from "@react-three/drei";
import { CORRIDOR } from "@/config/corridor";

export function RecessedDoorAssembly({ wood, cycleIndex, doorGroupRef, textRef }: any) {
  const { L, W } = CORRIDOR.geometry;
  const roomNumber = 427 + cycleIndex;
  
  return (
      <group position={[-W/2, 1.125, -L/2]} rotation={[0, Math.PI, 0]} ref={doorGroupRef}>
         <mesh position={[0.1, -0.05, 0]}>
            <boxGeometry args={[0.01, 2.2, 1.15]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.65} depthWrite={false} />
         </mesh>

         <group position={[0.02, 0, 0]}>
            <mesh position={[0, 0, -0.575]}>
               <boxGeometry args={[0.04, 2.3, 0.1]} />
               <meshStandardMaterial {...wood} color="#5e493c" />
            </mesh>
            <mesh position={[0, 0, 0.575]}>
               <boxGeometry args={[0.04, 2.3, 0.1]} />
               <meshStandardMaterial {...wood} color="#5e493c" />
            </mesh>
            <mesh position={[0, 1.1, 0]}>
               <boxGeometry args={[0.04, 0.1, 1.25]} />
               <meshStandardMaterial {...wood} color="#5e493c" />
            </mesh>
         </group>
         
         <group position={[0.07, -0.025, 0]}>
            <mesh position={[0, 0, -0.525]}>
               <boxGeometry args={[0.08, 2.25, 0.1]} />
               <meshStandardMaterial color="#8b725c" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0, 0.525]}>
               <boxGeometry args={[0.08, 2.25, 0.1]} />
               <meshStandardMaterial color="#8b725c" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.075, 0]}>
               <boxGeometry args={[0.08, 0.1, 1.15]} />
               <meshStandardMaterial color="#8b725c" roughness={0.9} />
            </mesh>
         </group>

         <mesh position={[0.125, -0.05, 0]}>
            <boxGeometry args={[0.03, 2.2, 1.05]} />
            <meshStandardMaterial {...wood} color="#ffd4a8" roughness={0.6} />
            
            <group position={[-0.016, 0.25, 0]} rotation={[0, -Math.PI / 2, cycleIndex === 0 ? 0.08 : 0]}>
               <mesh position={[0, 0, 0]}>
                   <boxGeometry args={[0.3, 0.14, 0.005]} />
                   <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
               </mesh>
               <Text ref={textRef} position={[0, 0, 0.003]} fontSize={0.08} color="#d4af37" anchorX="center" anchorY="middle">
                 {roomNumber}
               </Text>
            </group>
         </mesh>
      </group>
  );
}
