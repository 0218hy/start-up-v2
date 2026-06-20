import React from "react";
import { useTexture } from "@react-three/drei/native";
import * as THREE from "three";
import FloorTile from "./FloorTile"; 
import { ITEM_CATALOG } from "../../constants/catalog"; 

export default function TileMap({ tiles }) {
  // 📥 1. Load textures ONCE right here to save memory allocation
  const floorTexture = useTexture(require("../../assets/sprites/iso_tile.png"));
  const furnitureTexture = useTexture(require("../../assets/sprites/furniture.png"));

  // 🎨 2. Inject pixel-perfect filters safely right after loading
  React.useMemo(() => {
    [floorTexture, furnitureTexture].forEach((tex) => {
      tex.minFilter = THREE.NearestFilter;
      tex.magFilter = THREE.NearestFilter;
      tex.generateMipmaps = false; 
      tex.needsUpdate = true;
    });
  }, [floorTexture, furnitureTexture]);

  return (
    <group>
      {tiles.map((tile) => {
        const uniqueKey = `${tile.grid_x}_${tile.grid_z}`;
        
        // Reconstruct catalog lookup key
        const catalogKey = `tile_${tile.tile_type}`;
        const floorData = ITEM_CATALOG[catalogKey];
        const spriteIndex = floorData ? floorData.spriteIndex : 13; // default grass index

        return (
          <FloorTile
            key={uniqueKey}
            gridX={tile.grid_x}
            gridZ={tile.grid_z}
            tileIndex={spriteIndex} 
            furnitureType={tile.furniture_type}
            // 🚀 Pass textures down as shared memory allocations
            floorTexture={floorTexture}
            furnitureTexture={furnitureTexture}
          />
        );
      })}
    </group>
  );
}