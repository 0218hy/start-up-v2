import { create } from "zustand";
import { useWorldStore } from "./worldStore"; 

export const usePlayerStore = create((set, get) => ({
  gridX: 0,
  gridZ: 0,
  directionRow: 0, // 0: Down, 1: Left, 2: Right, 3: Up (Match your sheet order!)
  animationFrame: 0, // loop through the columns 

  move: (dir) =>
    set((state) => {
      let dx = 0;
      let dz = 0;
      let nextRow = state.directionRow

      switch (dir) {
        // row 0: west, row 1: south, row 2: north, row 3: east
        case "down":  dx = 0;  dz = 1;  nextRow = 0; break; 
        case "left":  dx = -1; dz = 0;  nextRow = 2; break; 
        case "right": dx = 1;  dz = 0;  nextRow = 1; break; 
        case "up":    dx = 0;  dz = -1; nextRow = 3; break; 
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
        return {
          directionRow: nextRow // Turns character model to look in that direction even if blocked
        };
      }

      // 5. Set loop limits (4 columns right now, bump to 16 when sheet updates)
      const MAX_COLS = 16;
      const nextFrame = (state.animationFrame + 1) % MAX_COLS;

      return {
        gridX: nextX,
        gridZ: nextZ,
        directionRow: nextRow,
        animationFrame: nextFrame
      };
    }),
}));