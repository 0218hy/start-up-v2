import React from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import FloorTile from "./FloorTile"; 
import { SPRITE_SHEETS } from "../../constants/catalog"; 

const getTextureUri = (source) => {
  if (typeof source === "string") return source;
  return source?.uri || source?.default?.uri || source;
};

export default function TileMap({ tiles, onTileTap }) {
  const textureSources = React.useMemo(
    () => Object.fromEntries(
      Object.entries(SPRITE_SHEETS).map(([key, source]) => [
        key,
        getTextureUri(source),
      ])
    ),
    []
  );
  const loadedTextures = useTexture(textureSources);

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
            texturesCatalog={loadedTextures}
            onTileTap={onTileTap}
          />
        );
      })}
    </group>
  );
}
