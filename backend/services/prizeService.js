export function calculateTierPools(totalPrizePool, jackpotCarry = 0) {
  const pool = Number(totalPrizePool) || 0;
  const carry = Number(jackpotCarry) || 0;

  const tier5 = Math.round((pool * 0.4 + carry) * 100) / 100;
  const tier4 = Math.round(pool * 0.35 * 100) / 100;
  const tier3 = Math.round(pool * 0.25 * 100) / 100;

  return {
    tier5,
    tier4,
    tier3,
  };
}

export function payoutPerWinner(poolAmount, winnersCount) {
  if (!winnersCount) return 0;
  return Math.round((poolAmount / winnersCount) * 100) / 100;
}
