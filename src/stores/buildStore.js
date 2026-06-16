import { create } from "zustand";

export const useBuildStore = create((set) => ({
  buildMode: false,
  activeTab: "floor", // 'floor' or 'furniture'
  selectedItemId: null,

  setBuildMode: (isOpen) => set({
    buildMode: isOpen
  }),

  setTab: (tabName) => set({
    activeTab: tabName,
    selectedItemId: null
  }), // Reset selection when changing tabs

  selectItem: (itemId) => set({
    selectedItemId: itemId
  }),

  resetBuild: () => set({ buildMode: false, selectedItemId: null })
}));