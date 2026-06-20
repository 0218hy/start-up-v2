import React, { useMemo } from "react";
import { TILE_SIZE, toIso } from "../../utils/iso";
import { ITEM_CATALOG } from "../../constants/catalog";

export default function FloorTile({ 
  tileIndex = 0, 
  furnitureType = null, 
  gridX, 
  gridZ,
  floorTexture,       
  furnitureTexture    
}) {
  const cols = 4;
  const rows = 4;
  const fur_cols = 3;
  const fur_rows = 3;

  const isoPos = toIso(gridX, gridZ);

  // 📐 1. Dynamic Isometric Layer Sorting Math
  // Baseline start at 10 to give other UI elements room below it.
  // Higher coordinates mean closer to the screen, pushing the renderOrder up.
  const baseOrder = 10 + (gridX + gridZ); 

  // Calculate UV offsets cleanly
  const floorUV = useMemo(() => {
    const col = tileIndex % cols;
    const row = Math.floor(tileIndex / cols);
    return [col / cols, 1 - (row + 1) / rows, 1 / cols, 1 / rows];
  }, [tileIndex]);

  const furnitureUV = useMemo(() => {
    if (!furnitureType || !ITEM_CATALOG[furnitureType]) return [0, 0, 0, 0];
    const idx = ITEM_CATALOG[furnitureType].spriteIndex;
    const col = idx % fur_cols;
    const row = Math.floor(idx / fur_cols);
    return [col / fur_cols, 1 - (row + 1) / fur_rows, 1 / fur_cols, 1 / fur_rows];
  }, [furnitureType]);

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
        vec2 transformedUv = vUv * uUvTransform.zw + uUvTransform.xy;
        vec4 texColor = texture2D(uTexture, transformedUv);
        if (texColor.a < 0.1) discard; 
        gl_FragColor = texColor;
      }
    `
  };

  return (
    <group position={[isoPos.x, 0, isoPos.z]}>
      {/* 1. Ground Layer */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]}
        renderOrder={baseOrder} // 👑 Applied dynamic back-to-front sorting
      >
        <planeGeometry args={[TILE_SIZE * 2 * 1.25, TILE_SIZE * 2 * 1.25]} />
        <shaderMaterial
          transparent
          vertexShader={shaderDefinition.vertexShader}
          fragmentShader={shaderDefinition.fragmentShader}
          uniforms={{
            uTexture: { value: floorTexture },
            uUvTransform: { value: floorUV }
          }}
          depthTest={false}  
          depthWrite={false} 
        />
      </mesh>

      {/* 2. Furniture Decor Layer */}
      {furnitureType && ITEM_CATALOG[furnitureType] && (
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0.01, 0]}         
          renderOrder={baseOrder + 1} // 👑 Always exactly 1 layer higher than its own floor base
        >
          <planeGeometry args={[TILE_SIZE * 2, TILE_SIZE * 2]} />
          <shaderMaterial
            transparent
            vertexShader={shaderDefinition.vertexShader}
            fragmentShader={shaderDefinition.fragmentShader}
            uniforms={{
              uTexture: { value: furnitureTexture },
              uUvTransform: { value: furnitureUV }
            }}
            depthTest={false}  
            depthWrite={false} 
          />
        </mesh>
      )}
    </group>
  );
}