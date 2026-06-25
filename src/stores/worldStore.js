import { create } from "zustand";

export const useWorldStore = create((set) => ({
  worldId: null,
  players: {},
  tiles: [],

  setWorldId: (id) => set({ worldId: id }),
  setTiles: (tilesList) => set({ tiles: tilesList }),

  updatePlayer: (id, position) =>
    set((state) => ({
      players: {
        ...state.players,
        [id]: position,
      },
    })),
}));