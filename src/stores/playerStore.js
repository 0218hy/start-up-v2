import { create } from "zustand";

export const usePlayerStore = create((set) => ({
  gridX: 0,
  gridZ: 0,

  move: (dir) =>
    set((state) => {
      let dx = 0;
      let dz = 0;

      switch (dir) {
        case "up":
          dz = -1;
          break;

        case "down":
          dz = 1;
          break;

        case "left":
          dx = -1;
          break;

        case "right":
          dx = 1;
          break;
      }

      return {
        gridX: state.gridX + dx,
        gridZ: state.gridZ + dz,
      };
    }),
}));