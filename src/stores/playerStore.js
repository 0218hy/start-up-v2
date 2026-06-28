import { create } from "zustand";
import { useWorldStore } from "./worldStore"; 

const WORLD_MIN = -25;
const WORLD_MAX = 25;
const MAX_COLS = 16;

function getDirectionForDelta(dx, dz, fallbackRow) {
  if (dz > 0) return 0;
  if (dx < 0) return 2;
  if (dx > 0) return 1;
  if (dz < 0) return 3;
  return fallbackRow;
}

function tileExistsAt(x, z) {
  return useWorldStore
    .getState()
    .tiles
    .some((tile) => tile.grid_x === x && tile.grid_z === z);
}

function isInsideWorld(x, z) {
  return x >= WORLD_MIN && x <= WORLD_MAX && z >= WORLD_MIN && z <= WORLD_MAX;
}

export const usePlayerStore = create((set, get) => ({
  gridX: 0,
  gridZ: 0,
  directionRow: 0, // 0: Down, 1: Left, 2: Right, 3: Up (Match your sheet order!)
  animationFrame: 0, // loop through the columns 
  pathQueue: [],

  move: (dir) =>
    set((state) => {
      let dx = 0;
      let dz = 0;
      let nextRow = state.directionRow;

      switch (dir) {
        // row 0: west, row 1: south, row 2: north, row 3: east
        case "down":  dx = 0;  dz = 1;  nextRow = 0; break; 
        case "left":  dx = -1; dz = 0;  nextRow = 2; break; 
        case "right": dx = 1;  dz = 0;  nextRow = 1; break; 
        case "up":    dx = 0;  dz = -1; nextRow = 3; break; 
      }

      const nextX = state.gridX + dx;
      const nextZ = state.gridZ + dz;

      if (!isInsideWorld(nextX, nextZ)) {
        return state; 
      }

      if (!tileExistsAt(nextX, nextZ)) {
        return {
          directionRow: nextRow,
          pathQueue: [],
        };
      }

      const nextFrame = (state.animationFrame + 1) % MAX_COLS;

      return {
        gridX: nextX,
        gridZ: nextZ,
        directionRow: nextRow,
        animationFrame: nextFrame,
        pathQueue: [],
      };
    }),

  setPath: (path) => set({ pathQueue: path }),

  clearPath: () => set({ pathQueue: [] }),

  advancePathStep: () =>
    set((state) => {
      const [nextStep, ...remainingPath] = state.pathQueue;
      if (!nextStep) return state;

      const dx = Math.sign(nextStep.x - state.gridX);
      const dz = Math.sign(nextStep.z - state.gridZ);
      const nextX = state.gridX + dx;
      const nextZ = state.gridZ + dz;
      const nextRow = getDirectionForDelta(dx, dz, state.directionRow);

      if (!isInsideWorld(nextX, nextZ) || !tileExistsAt(nextX, nextZ)) {
        return {
          directionRow: nextRow,
          pathQueue: [],
        };
      }

      const reachedQueuedStep = nextX === nextStep.x && nextZ === nextStep.z;

      return {
        gridX: nextX,
        gridZ: nextZ,
        directionRow: nextRow,
        animationFrame: (state.animationFrame + 1) % MAX_COLS,
        pathQueue: reachedQueuedStep ? remainingPath : [nextStep, ...remainingPath],
      };
    }),
}));
