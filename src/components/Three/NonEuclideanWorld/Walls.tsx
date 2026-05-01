import { useMemo } from "react";
import * as THREE from "three";
import { CORRIDOR } from "@/config/corridor";
import { crownShape, baseboardShape } from "./Shapes";

export function HollowLeftWall({ plaster, wood }: { plaster: any, wood: any }) {
  const { L, W, H } = CORRIDOR.geometry;
  const wallWithHole = useMemo(() => {
     const shape = new THREE.Shape();
     shape.moveTo(-L/2, -H/2);
     shape.lineTo(L/2, -H/2);
     shape.lineTo(L/2, H/2);
     shape.lineTo(-L/2, H/2);
     shape.lineTo(-L/2, -H/2);

     const hole = new THREE.Path();
     hole.moveTo(-1.25/2, -H/2);
     hole.lineTo(1.25/2, -H/2);
     hole.lineTo(1.25/2, -H/2 + 2.275); 
     hole.lineTo(-1.25/2, -H/2 + 2.275);
     hole.lineTo(-1.25/2, -H/2);
     shape.holes.push(hole);
     return shape;
  }, [L, H]);

  const dist = L / 2 - 0.625;
  const frontExtrudeZ = -dist;
  const backExtrudeZ = -L;

  return (
    <group>
      <mesh position={[-W/2, H/2, -L/2]} rotation={[0, Math.PI / 2, 0]}>
         <shapeGeometry args={[wallWithHole]} />
         <meshStandardMaterial {...plaster} roughness={1.5} normalScale={new THREE.Vector2(1.5, 1.5)} />
      </mesh>
      
      {/* Front Skirting Curve */}
      <mesh position={[-W/2, 0, frontExtrudeZ]}>
          <extrudeGeometry args={[baseboardShape, { depth: dist, bevelEnabled: false, curveSegments: 12 }]} />
          <meshStandardMaterial {...plaster} color={CORRIDOR.colors.ceiling} roughness={0.7} />
      </mesh>
      {/* Back Skirting Curve */}
      <mesh position={[-W/2, 0, backExtrudeZ]}>
          <extrudeGeometry args={[baseboardShape, { depth: dist, bevelEnabled: false, curveSegments: 12 }]} />
          <meshStandardMaterial {...plaster} color={CORRIDOR.colors.ceiling} roughness={0.7} />
      </mesh>

      {/* Top Crown Molding Curve (Continuous) */}
      <mesh position={[-W/2, H, -L]}>
          <extrudeGeometry args={[crownShape, { depth: L, bevelEnabled: false, curveSegments: 12 }]} />
          <meshStandardMaterial {...plaster} color={CORRIDOR.colors.ceiling} roughness={0.7} />
      </mesh>
    </group>
  );
}
