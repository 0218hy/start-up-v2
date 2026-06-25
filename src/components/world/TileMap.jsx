import React from "react";
import { useTexture } from "@react-three/drei/native";
import * as THREE from "three";
import FloorTile from "./FloorTile"; 
import { SPRITE_SHEETS } from "../../constants/catalog"; 

export default function TileMap({ tiles, onTileTap }) {
  // 📥 Load ALL sprite sheets declared in your registry concurrently
  const loadedTextures = useTexture(SPRITE_SHEETS);

  // 🎨 Inject crisp, pixel-perfect scaling rules uniformly across all sheets
  React.useMemo(() => {
    Object.values(loadedTextures).forEach((tex) => {
      if (tex) {
        tex.minFilter = THREE.NearestFilter;
        tex.magFilter = THREE.NearestFilter;
        tex.generateMipmaps = false; 
        tex.needsUpdate = true;
      }
    });
  }, [loadedTextures]);

  return (
    <group>
      {tiles.map((tile) => {
        return (
          <FloorTile
            key={`${tile.grid_x}_${tile.grid_z}`}
            tileData={tile}
            texturesCatalog={loadedTextures} // 🚀 Unified pipeline parameter passed down
            onTileTap={onTileTap}
          />
        );
      })}
    </group>
  );
}