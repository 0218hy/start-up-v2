import { useFrame, useThree } from "@react-three/fiber/native";
import { useRef } from "react";
import * as THREE from "three";

import { usePlayerStore } from "../stores/playerStore";
import { toIso } from "../utils/iso";

export default function CameraRig() {
  const { camera } = useThree();

  // Track our smooth target look-at point across frames
  const lookAtTarget = useRef(new THREE.Vector3(0, 0, 0));

  const gridX = usePlayerStore((s) => s.gridX);
  const gridZ = usePlayerStore((s) => s.gridZ);

  // Define your fixed camera viewing offset distance
  const CAMERA_OFFSET_X = 0;
  const CAMERA_OFFSET_Y = 15;
  const CAMERA_OFFSET_Z = 15;

  useFrame(() => {
    // 1. Find where the player is heading in isometric space
    const playerWorldPos = toIso(gridX, gridZ);

    // 2. Smoothly track the camera focus point
    lookAtTarget.current.x = THREE.MathUtils.lerp(lookAtTarget.current.x, playerWorldPos.x, 0.08);
    lookAtTarget.current.z = THREE.MathUtils.lerp(lookAtTarget.current.z, playerWorldPos.z, 0.08);
    // Keep target at ground height (y = 0)
    lookAtTarget.current.y = 0;

    // 3. Smoothly slide the camera position maintaining the strict 1:1 offset angle
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, playerWorldPos.x + CAMERA_OFFSET_X, 0.08);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, playerWorldPos.z + CAMERA_OFFSET_Z, 0.08);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, CAMERA_OFFSET_Y, 0.08);

    // 4. Update the lookAt camera target to follow the smoothly lerped focus vector
    camera.lookAt(lookAtTarget.current);
  });

  return null;
}