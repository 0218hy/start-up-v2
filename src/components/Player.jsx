import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { usePlayerStore } from "../stores/playerStore";
import { toIso } from "../utils/iso";
import PlayerSprite from "./PlayerSprite"

export default function Player() {
  const ref = useRef();

  const gridX = usePlayerStore((s) => s.gridX);
  const gridZ = usePlayerStore((s) => s.gridZ);

  useFrame(() => {
    if (!ref.current) return;

    const target = toIso(gridX, gridZ);

    ref.current.position.x = THREE.MathUtils.lerp(
      ref.current.position.x,
      target.x,
      0.15
    );

    ref.current.position.z = THREE.MathUtils.lerp(
      ref.current.position.z,
      target.z,
      0.15
    );
  });

  return (
    <group ref={ref}>
    <PlayerSprite
      frame={4}
      position={[0, 1, 0]}
    />
  </group>
  );
}