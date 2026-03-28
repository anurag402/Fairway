import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCharityStore = create(
  persist(
    (set) => ({
      selectedCharity: null,
      setCharity: (charity) => set({ selectedCharity: charity }),
    }),
    {
      name: "fairway-charity",
      partialize: (state) => ({ selectedCharity: state.selectedCharity }),
    },
  ),
);
