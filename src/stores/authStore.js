import { createStore } from "./createStore";

export const useAuthStore = createStore((set) => ({
    user: null,                     // Starting out, we assume no user context is loaded
    loading: true,                  // Starts as true so your app can show a splash screen during initialization

    setUser: (user) => set({ user }),

    setLoading: (loading) => set({ loading }),

    signOut: () => set({ user: null, loading: false }),
}));
