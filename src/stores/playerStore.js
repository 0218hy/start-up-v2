import { create } from "zustand";
import { useWorldStore } from "./worldStore"; 

export const usePlayerStore = create((set) => ({
  gridX: 0,
  gridZ: 0,

  move: (dir) =>
    set((state) => {
      let dx = 0;
      let dz = 0;

      switch (dir) {
        case "up":    dx = 0;  dz = -1; break;
        case "down":  dx = 0;  dz = 1;  break;
        case "left":  dx = -1; dz = 0;  break;
        case "right": dx = 1;  dz = 0;  break;
      }

      const nextX = state.gridX + dx;
      const nextZ = state.gridZ + dz;

      // 1. Check hard world borders first
      if (nextX < -25 || nextX > 25 || nextZ < -25 || nextZ > 25) {
        return state; 
      }

      // 2. Fetch the current maps array from the world store
      const activeTiles = useWorldStore.getState().tiles;

      // 3. Scan to ensure a valid tile has been expanded on that coordinate
      const tileExists = activeTiles.some(
        (tile) => tile.grid_x === nextX && tile.grid_z === nextZ
      );

      // 4. Block movement if they try to step on non-existent floors
      if (!tileExists) {
        console.warn("Movement blocked: Path has not been expanded here yet!");
        return state; 
      }

      return {
        gridX: nextX,
        gridZ: nextZ,
      };
    }),
}));