// import { useThree } from "@react-three/fiber";
// import { useEffect } from "react";

// export default function CameraRig() {
//   const { camera } = useThree();

//   useEffect(() => {
//     camera.position.set(10, 10, 10);
//     camera.lookAt(0, 0, 0);
//   }, []);

//   return null;
// }

// to make the camera follow
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { usePlayerStore } from "../../stores/playerStore";
import { toIso } from "../../utils/iso";

export default function CameraRig() {
  const { camera } = useThree();

  const gridX = usePlayerStore((s) => s.gridX);
  const gridZ = usePlayerStore((s) => s.gridZ);

  useFrame(() => {
    const target = toIso(gridX, gridZ);

    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      target.x + 10,
      0.08
    );

    camera.position.z = THREE.MathUtils.lerp(
      camera.position.z,
      target.z + 10,
      0.08
    );

    camera.position.y = 10;

    camera.lookAt(target.x, 0, target.z);
  });

  return null;
}