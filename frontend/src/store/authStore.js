import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AUTH_STORAGE_KEY, AUTH_TOKEN_KEY } from "../utils/authKeys";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: ({ user, token }) => {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        set({ user: null, token: null });
      },
      setUser: (user) => set({ user }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);
