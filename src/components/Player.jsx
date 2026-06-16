import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import { useTexture, Billboard } from "@react-three/drei/native";
import * as THREE from "three";

import { usePlayerStore } from "../stores/playerStore";
import { toIso } from "../utils/iso";

export default function Player() {
  const groupRef = useRef();

  // 1. Grab Player Coordinates from Zustand
  const gridX = usePlayerStore((s) => s.gridX);
  const gridZ = usePlayerStore((s) => s.gridZ);
  const frame = usePlayerStore((s) => s.frame || 0); // Bonus: Track animation frame in store!

  // 2. Load the Character Sheet Asset
  const texture = useTexture(require("../assets/sprites/furniture.png"));
  const cols = 3;
  const rows = 3;

  // 3. Compute Sprite UV Offset
  const { offsetX, offsetY, repeatX, repeatY } = useMemo(() => {
    const col = frame % cols;
    const row = Math.floor(frame / cols);

    return {
      repeatX: 1 / cols,
      repeatY: 1 / rows,
      offsetX: col / cols,
      offsetY: 1 - (row + 1) / rows,
    };
  }, [frame, cols, rows]);

  // Ensure texture wraps correctly
  useMemo(() => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  }, [texture]);

  // 4. Smooth Lerp Movement Loop
  useFrame(() => {
    if (!groupRef.current) return;

    const target = toIso(gridX, gridZ);

    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      target.x,
      0.15
    );

    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z,
      target.z,
      0.15
    );
  });

  return (
    <group ref={groupRef}>
      {/* Billboard ensures the character mesh twists to always look straight at your isometric camera */}
      <Billboard position={[0, 0.5, 0]}>
        <mesh>
          <planeGeometry args={[2, 2]} />
          <meshBasicMaterial
            transparent
            map={texture}
            map-repeat-x={repeatX}
            map-repeat-y={repeatY}
            map-offset-x={offsetX}
            map-offset-y={offsetY}
          />
        </mesh>
      </Billboard>
    </group>
  );
}