// Generates a unique set of draw numbers and returns them sorted ascending.
export function generateDrawNumbers(min = 1, max = 45, total = 5) {
  const numbers = new Set();

  while (numbers.size < total) {
    const value = Math.floor(Math.random() * (max - min + 1)) + min;
    numbers.add(value);
  }

  return [...numbers].sort((a, b) => a - b);
}

// Validates draw numbers: exact count, integer values, uniqueness, and range.
export function validateDrawNumbers(drawNumbers, min = 1, max = 45, total = 5) {
  if (!Array.isArray(drawNumbers) || drawNumbers.length !== total) {
    return false;
  }

  const normalized = drawNumbers.map((value) => Number(value));
  if (normalized.some((value) => !Number.isInteger(value))) {
    return false;
  }

  const unique = new Set(normalized);
  if (unique.size !== total) {
    return false;
  }

  return normalized.every((value) => value >= min && value <= max);
}

// Computes match count safely from user scores against a draw.
// A user needs at least 5 scores to be eligible for matching.
export function getMatchCount(userScores, drawNumbers) {
  const safeScores = Array.isArray(userScores) ? userScores : [];
  if (safeScores.length < 5) {
    return 0;
  }

  const safeDrawNumbers = Array.isArray(drawNumbers) ? drawNumbers : [];
  const scoreValues = safeScores
    .map((score) => Number(score?.value))
    .filter((value) => Number.isInteger(value));
  const uniqueScores = new Set(scoreValues);

  let matches = 0;
  for (const number of safeDrawNumbers) {
    if (uniqueScores.has(number)) {
      matches += 1;
    }
  }

  return matches;
}

// Returns winner tier from a precomputed match count.
export function getUserMatchTier(matchCount) {
  const matches = Number(matchCount) || 0;

  if (matches === 5) return 5;
  if (matches === 4) return 4;
  if (matches === 3) return 3;

  return 0;
}

// Builds a UTC month key (YYYY-MM) to avoid local timezone drift.
export function createMonthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
