import React from "react";
import "@react-three/fiber"; 

export default function Campfire() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry
          args={[1, 1, 1, 16]}
        />
        <meshStandardMaterial />
      </mesh>

      <pointLight
        intensity={20}
        position={[0, 3, 0]}
      />
    </group>
  );
}