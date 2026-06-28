import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { usePlayerStore } from "../stores/playerStore";
import { TILE_SIZE, toIso } from "../utils/iso";

const playerSpriteSource = require("../assets/sprites/sample_player.png");
const playerSpriteUri = playerSpriteSource?.uri || playerSpriteSource?.default?.uri || playerSpriteSource;

export default function Player() {
  const meshRef = useRef();

  // 1. Grab Player Coordinates from Zustand
  const gridX = usePlayerStore((s) => s.gridX);
  const gridZ = usePlayerStore((s) => s.gridZ);
  const directionRow = usePlayerStore((s) => s.directionRow);

  // 2. Local state & accumulator to decouple loop ticks from fast state jumps
  const [localFrame, setLocalFrame] = useState(0);
  const frameAccumulator = useRef(0);

  // 3. Load the Character Sheet Asset
  const texture = useTexture(playerSpriteUri);
  const cols = 16;
  const rows = 4;

  // Force pixel-perfect crisp textures without WebGL blur artifacts
  useMemo(() => {
    if (texture) {
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      texture.needsUpdate = true;
    }
  }, [texture]);

  // 4. Compute Sprite UV Offset mapping using local walking frames
  const playerUV = useMemo(() => {
    return [
      localFrame / cols,               // X Shift (Cycles smoothly from 0 to 15)
      1 - (directionRow + 1) / rows,   // Y Shift (Locks straight to directional row index)
      1 / cols,
      1 / rows
    ];
  }, [directionRow, localFrame]);

  // Shader definition to guarantee glitch-free depth rendering
  const shaderDefinition = {
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform vec4 uUvTransform;
      varying vec2 vUv;
      void main() {
        // 1. Zoom into the specific animation frame box
        vec2 transformedUv = vUv * uUvTransform.zw + uUvTransform.xy;
        
        // 2. Look up what color that pixel is in your original image file
        vec4 texColor = texture2D(uTexture, transformedUv);
        
        // 3. If the pixel is clear/transparent, erase it completely!
        if (texColor.a < 0.1) discard;
        
        // 4. Output the final chosen pixel color to the phone screen
        gl_FragColor = texColor;
      }
    `
  };

  // 5. Smooth Lerp Movement & Delta Animation Sync Loop
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const target = toIso(gridX, gridZ);

    // Calculate absolute structural distances remaining
    const distanceX = Math.abs(meshRef.current.position.x - target.x);
    const distanceZ = Math.abs(meshRef.current.position.z - target.z);

    // 🏃‍♂️ ANIMATION TICK ROUTER: Check if player mesh is still traveling
    if (distanceX > 0.005 || distanceZ > 0.005) {
      // Multiply delta to adjust your walk sprite cycle speed (e.g., 20.0)
      frameAccumulator.current += delta * 30.0;
      
      if (frameAccumulator.current >= 1) {
        setLocalFrame((prev) => (prev + 1) % cols);
        frameAccumulator.current = 0;
      }
    } else {
      // 🧍‍♂️ Standing still? Snap back safely to frame 0 (Idle stance)
      setLocalFrame(0);
    }

    // Smooth position translation
    meshRef.current.position.x = THREE.MathUtils.lerp(
      meshRef.current.position.x,
      target.x,
      0.15
    );

    meshRef.current.position.z = THREE.MathUtils.lerp(
      meshRef.current.position.z,
      target.z,
      0.15
    );

    // Explicitly push latest calculations straight into your custom shader uniforms
    if (meshRef.current.material && meshRef.current.material.uniforms) {
      meshRef.current.material.uniforms.uUvTransform.value = playerUV;
    }

    // Cleanly pass behind or in front of environment objects dynamically!
    const currentGridX = Math.round(meshRef.current.position.x / TILE_SIZE);
    const currentGridZ = Math.round(meshRef.current.position.z / TILE_SIZE);
    meshRef.current.renderOrder = 1000 + (currentGridX + currentGridZ) + 2;
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]} // Kept flat parallel to tiles to banish rendering artifacts
      position={[0, 0, 0]}
    >
      <planeGeometry args={[TILE_SIZE * 2, TILE_SIZE * 2]} />
      <shaderMaterial
        transparent
        vertexShader={shaderDefinition.vertexShader}
        fragmentShader={shaderDefinition.fragmentShader}
        uniforms={{
          uTexture: { value: texture },
          uUvTransform: { value: playerUV }
        }}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
