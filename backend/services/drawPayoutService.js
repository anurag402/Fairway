function isFiniteNonNegativeNumber(value) {
  return Number.isFinite(Number(value)) && Number(value) >= 0;
}

export function validateDraftDrawForPublish(draw) {
  if (!draw) {
    return { valid: false, message: "Draw not found" };
  }

  if (!Array.isArray(draw.drawNumbers) || draw.drawNumbers.length !== 5) {
    return {
      valid: false,
      message: "Invalid draw structure: drawNumbers must contain 5 values",
    };
  }

  if (!draw.tierPools || typeof draw.tierPools !== "object") {
    return {
      valid: false,
      message: "Invalid draw structure: missing tierPools",
    };
  }

  if (!Array.isArray(draw.winnerEntries)) {
    return {
      valid: false,
      message: "Invalid draw structure: winnerEntries must be an array",
    };
  }

  for (const entry of draw.winnerEntries) {
    if (!entry?.userId) {
      return {
        valid: false,
        message: "Invalid draw structure: winner entry missing userId",
      };
    }

    if (!["3-match", "4-match", "5-match"].includes(entry.matchType)) {
      return {
        valid: false,
        message: "Invalid draw structure: winner entry has invalid matchType",
      };
    }

    if (!isFiniteNonNegativeNumber(entry.prize)) {
      return {
        valid: false,
        message: "Invalid draw structure: winner entry prize is invalid",
      };
    }
  }

  return { valid: true };
}

export function buildWinnerPayoutBulkOperations(winnerEntries) {
  const safeEntries = Array.isArray(winnerEntries) ? winnerEntries : [];

  const operations = safeEntries.map((entry) => ({
    updateOne: {
      filter: { _id: entry.userId },
      update: {
        $inc: { "winnings.amount": Number(entry.prize) || 0 },
        $set: { "winnings.status": "pending" },
      },
    },
  }));

  return {
    operations,
    totalWinners: safeEntries.length,
  };
}
