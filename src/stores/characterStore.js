import { createStore } from "./createStore";

export const useCharacterStore = createStore((set) => ({
  hasCharacter: false,
  selectedCharacterId: null,
  loading: true,
  setHasCharacter: (hasCharacter) => set({ hasCharacter }),
  setSelectedCharacterId: (selectedCharacterId) => set({ selectedCharacterId }),
  setLoading: (loading) => set({ loading }),
}));
