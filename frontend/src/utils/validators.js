export function validateScore(value) {
  const score = Number(value);

  if (!value && value !== 0) return "Score is required.";
  if (Number.isNaN(score)) return "Score must be a number.";
  if (score < 1 || score > 45) return "Score must be between 1 and 45.";

  return "";
}
