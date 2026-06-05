import { useTexture, Billboard} from "@react-three/drei/native";
import { useMemo } from "react";
import * as THREE from "three";

export default function PlayerSprite({ frame = 0, position }) {
  const texture = useTexture(require("../assets/sprites/1.png"));

  const cols = 3;
  const rows = 3;

  const { offset, repeat } = useMemo(() => {
    const col = frame % cols;
    const row = Math.floor(frame / cols);

    return {
      repeat: [1 / cols, 1 / rows],
      offset: [
        col / cols,
        1 - (row + 1) / rows,
      ],
    };
  }, [frame]);

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.offset.set(offset[0], offset[1]);
  texture.needsUpdate = true;

  return (
    <Billboard position={position}>
    <mesh>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial
        map={texture}
        transparent
      />
    </mesh>
  </Billboard>
  );
}