import { create } from "zustand";

export const useTileStore = create((set) => ({
  selectedTile: "grass",

  setSelectedTile: (tile) =>
    set({
      selectedTile: tile,
    }),
}));