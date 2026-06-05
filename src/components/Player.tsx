import { useFrame } from
"@react-three/fiber";

import { useRef } from "react";

export default function Player() {
  const ref = useRef<any>();

  useFrame(() => {
    // movement later
  });

  return (
    <mesh ref={ref}>
      <boxGeometry />
      <meshStandardMaterial />
    </mesh>
  );
}