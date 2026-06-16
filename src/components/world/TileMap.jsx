import React from "react";
import FloorTile from "./FloorTile"; 
import { ITEM_CATALOG } from "../../constants/catalog"; 

export default function TileMap({ tiles }) {
  return (
    <group>
      {tiles.map((tile) => {
        const uniqueKey = `${tile.grid_x}_${tile.grid_z}`;
        
        // 1. Reconstruct the catalog key (e.g., 'stone' -> 'tile_stone')
        const catalogKey = `tile_${tile.tile_type}`;
        
        // 2. Safely grab the floor config from your centralized catalog
        const floorData = ITEM_CATALOG[catalogKey];
        
        // 3. Extract the spriteIndex, falling back to 13 (grass) if missing
        const spriteIndex = floorData ? floorData.spriteIndex : 13;

        return (
          <FloorTile
            key={uniqueKey}
            gridX={tile.grid_x}
            gridZ={tile.grid_z}
            tileIndex={spriteIndex}          // Dynamic index per individual tile
            furnitureType={tile.furniture_type} // Passes 'furn_bread' or null
          />
        );
      })}
    </group>
  );
}