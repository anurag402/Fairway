import { create } from "zustand";

function makeScoreId() {
  return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export const useScoreStore = create((set) => ({
  scores: [],
  addScore: ({ value, date }) =>
    set((state) => {
      const next = [
        { id: makeScoreId(), value: Number(value), date },
        ...state.scores,
      ];
      return { scores: next.slice(0, 5) };
    }),
  removeScore: (id) =>
    set((state) => ({
      scores: state.scores.filter((score) => score.id !== id),
    })),
  setScores: (scores) => set({ scores: scores.slice(0, 5) }),
}));
