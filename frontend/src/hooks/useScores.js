import { useMemo } from "react";
import { useScoreStore } from "../store/scoreStore";

export function useScores() {
  const scores = useScoreStore((state) => state.scores);
  const addScore = useScoreStore((state) => state.addScore);
  const removeScore = useScoreStore((state) => state.removeScore);
  const setScores = useScoreStore((state) => state.setScores);

  const average = useMemo(() => {
    if (!scores.length) return 0;
    const total = scores.reduce((acc, score) => acc + score.value, 0);
    return Math.round((total / scores.length) * 10) / 10;
  }, [scores]);

  return { scores, addScore, removeScore, setScores, average };
}
