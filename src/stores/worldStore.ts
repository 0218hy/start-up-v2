import { create } from "zustand";

export const useWorldStore =
  create((set) => ({
    worldId: null,
    players: {},

    setWorldId: (id: string) =>
      set({ worldId: id }),

    updatePlayer: (
      id: string,
      position: any
    ) =>
      set((state: any) => ({
        players: {
          ...state.players,
          [id]: position,
        },
      })),
  }));