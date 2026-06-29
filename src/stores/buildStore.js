import { createStore } from "./createStore";

export const useBuildStore = createStore((set) => ({
  buildMode: false,
  activeTab: "floor", // 'floor' or 'furniture'
  selectedItemId: null,
  furnitureRotation: 0, // 0: 0°, 1: 90°, 2: 180°, 3: 270°

  selectedWorldTile: null,

  setBuildMode: (isOpen) => set({
    buildMode: isOpen
  }),

  setTab: (tabName) => set({
    activeTab: tabName,
    selectedItemId: null,
    furnitureRotation: 0
  }), // Reset selection when changing tabs

  selectItem: (itemId) => set({
    selectedItemId: itemId,
    furnitureRotation: 0
  }),

  selectWorldTile: (tileData) => set({
    selectedWorldTile: tileData,
    selectedItemId: null // Clear active catalog selection
  }),

  rotateItem: () => set((state) => ({
    furnitureRotation: (state.furnitureRotation + 1) % 4
  })),

  resetBuild: () => set({ buildMode: false, selectedItemId: null })
}));
