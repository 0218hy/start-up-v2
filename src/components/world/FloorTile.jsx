// 📁 src/components/world/FloorTile.jsx
import React, { useMemo } from "react";
import { TILE_SIZE, toIso } from "../../utils/iso";
import { ITEM_CATALOG } from "../../constants/catalog";

const SHADER_DEFINITION = {
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

export default function FloorTile({ 
  tileData,
  texturesCatalog, 
}) {
  const { 
    grid_x: gridX, 
    grid_z: gridZ, 
    tile_type: tileType,
    furniture_rotation: itemRotation = 0
  } = tileData;
  const itemType = tileData.item_type || tileData.furniture_type || tileData.food_type;

  const isoPos = toIso(gridX, gridZ);

  const floorOrder = 10 + (gridX + gridZ); 
  const objectOrder = 50 + (gridX + gridZ); // 🚀 Unified layer depth order

  // Fetch structural layout metrics out of master catalog
  const floorConfig = ITEM_CATALOG[`tile_${tileType}`];
  
  // 🚀 FIXED: Added the missing configuration definition line
  const objectConfig = itemType ? ITEM_CATALOG[itemType] : null; 

  // Track down active graphic source pointers inside preloaded bundle array
  const activeFloorTexture = floorConfig ? texturesCatalog[floorConfig.sheet] : null;
  const activeObjectTexture = objectConfig ? texturesCatalog[objectConfig.sheet] : null;
  const objectScale = objectConfig ? (objectConfig.size || 64) / 64 : 1;

  const floorUV = useMemo(() => {
    if (!floorConfig) return [0, 0, 1, 1];
    const index = floorConfig.spriteIndex || 0;
    const itemCols = floorConfig.cols || 16;
    const itemRows = floorConfig.rows || 1;

    const col = index % itemCols;
    const row = Math.floor(index / itemCols);
    
    return [col / itemCols, 1 - (row + 1) / itemRows, 1 / itemCols, 1 / itemRows];
  }, [floorConfig]);

  const objectUV = useMemo(() => {
    if (!objectConfig) return [0, 0, 0, 0];
    const itemCols = objectConfig.cols || 4;
    const itemRows = objectConfig.rows || 4;

    const col = objectConfig.spriteIndex % itemCols;
    
    // 🚀 UNIFIED: Use rotation if it's furniture, otherwise default to 0 for flat items
    const row = objectConfig.category === "furniture" ? itemRotation : 0; 
    
    return [col / itemCols, 1 - (row + 1) / itemRows, 1 / itemCols, 1 / itemRows];
  }, [objectConfig, itemRotation]);

  return (
    <group 
      position={[isoPos.x, 0, isoPos.z]}
    >
      {/* 1. Ground Layer */}
      {activeFloorTexture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} renderOrder={floorOrder}>
          <planeGeometry args={[TILE_SIZE * 2 * 1.15, TILE_SIZE * 2 * 1.15]} />
          <shaderMaterial
            transparent
            vertexShader={SHADER_DEFINITION.vertexShader}
            fragmentShader={SHADER_DEFINITION.fragmentShader}
            uniforms={{
              uTexture: { value: activeFloorTexture },
              uUvTransform: { value: floorUV }
            }}
            depthTest={false}  
            depthWrite={false} 
          />
        </mesh>
      )}

      {/* 2. Unified Object Layer (Furniture, Food, Decor, etc.) */}
      {itemType && objectConfig && activeObjectTexture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, TILE_SIZE / 2, 0]} renderOrder={objectOrder}>
          <planeGeometry args={[TILE_SIZE * 2 * objectScale, TILE_SIZE * 2 * objectScale]} />
          <shaderMaterial
            transparent
            vertexShader={SHADER_DEFINITION.vertexShader}
            fragmentShader={SHADER_DEFINITION.fragmentShader}
            uniforms={{ 
              uTexture: { value: activeObjectTexture }, 
              uUvTransform: { value: objectUV } 
            }}
            depthTest={false} 
            depthWrite={false} 
          />
        </mesh>
      )}
    </group>
  );
}
