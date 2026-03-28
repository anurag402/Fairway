import Draw from "../models/Draw.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import {
  createMonthKey,
  generateDrawNumbers,
  getMatchCount,
  getUserMatchTier,
  validateDrawNumbers,
} from "../services/drawService.js";
import {
  calculateTierPools,
  payoutPerWinner,
} from "../services/prizeService.js";
import {
  buildWinnerPayoutBulkOperations,
  validateDraftDrawForPublish,
} from "../services/drawPayoutService.js";

function buildEligibleUsersQuery() {
  return {
    role: "user",
    "subscription.status": "active",
    "subscription.expiryDate": { $gt: new Date() },
    "subscription.stripeSubscriptionId": { $ne: null },
  };
}

function getPlanContributionConfig() {
  const monthly = Number(process.env.DRAW_MONTHLY_POOL_CONTRIBUTION || 10);
  const yearly = Number(process.env.DRAW_YEARLY_POOL_CONTRIBUTION || 10);

  if (!Number.isFinite(monthly) || monthly < 0) {
    throw new AppError(
      "DRAW_MONTHLY_POOL_CONTRIBUTION must be a positive number",
      500,
    );
  }

  if (!Number.isFinite(yearly) || yearly < 0) {
    throw new AppError(
      "DRAW_YEARLY_POOL_CONTRIBUTION must be a positive number",
      500,
    );
  }

  return { monthly, yearly };
}

function calculatePlanBasedPrizePool(users) {
  const { monthly, yearly } = getPlanContributionConfig();
  const safeUsers = Array.isArray(users) ? users : [];

  const planStats = {
    monthlyCount: 0,
    yearlyCount: 0,
    noneCount: 0,
  };

  let totalPrizePool = 0;

  for (const user of safeUsers) {
    const plan = user?.subscription?.plan;

    if (plan === "monthly") {
      planStats.monthlyCount += 1;
      totalPrizePool += monthly;
    } else if (plan === "yearly") {
      planStats.yearlyCount += 1;
      totalPrizePool += yearly;
    } else {
      planStats.noneCount += 1;
    }
  }

  return {
    totalPrizePool: Math.round(totalPrizePool * 100) / 100,
    contributionConfig: {
      monthly,
      yearly,
    },
    planStats,
  };
}

export const runMonthlyDraw = asyncHandler(async (req, res) => {
  const { drawNumbers, jackpotCarry = 0 } = req.body;
  const monthKey = createMonthKey();

  const existingDraft = await Draw.findOne({ status: "draft" });
  if (existingDraft) {
    throw new AppError(
      "A draft draw already exists. Publish it before creating a new draw",
      409,
    );
  }

  const existing = await Draw.findOne({ monthKey });
  if (existing) {
    throw new AppError("Draw for this month already exists", 409);
  }

  const lastDraw = await Draw.findOne().sort({ createdAt: -1 });
  const previousCarry = Number(lastDraw?.jackpotCarryOut || 0);
  const manualCarry = Number(jackpotCarry || 0);
  const jackpotCarryIn = previousCarry + manualCarry;

  if (!Number.isFinite(jackpotCarryIn) || jackpotCarryIn < 0) {
    throw new AppError("jackpotCarry must be a positive number", 400);
  }

  const finalDrawNumbers =
    drawNumbers?.length === 5 ? drawNumbers : generateDrawNumbers();

  if (!validateDrawNumbers(finalDrawNumbers)) {
    throw new AppError(
      "drawNumbers must contain 5 unique integers between 1 and 45",
      400,
    );
  }

  const normalizedDrawNumbers = finalDrawNumbers
    .map((value) => Number(value))
    .sort((a, b) => a - b);

  const activeUsers = await User.find(buildEligibleUsersQuery()).select(
    "scores winnings subscription.plan",
  );

  const { totalPrizePool, contributionConfig, planStats } =
    calculatePlanBasedPrizePool(activeUsers);
  const tierPools = calculateTierPools(totalPrizePool, jackpotCarryIn);

  const tierWinners = {
    5: [],
    4: [],
    3: [],
  };

  const matchByUserId = new Map();

  for (const user of activeUsers) {
    const matchCount = getMatchCount(user.scores || [], normalizedDrawNumbers);
    matchByUserId.set(String(user._id), matchCount);

    const tier = getUserMatchTier(matchCount);
    if (tier >= 3) {
      tierWinners[tier].push(user._id);
    }
  }

  const tier5Payout = payoutPerWinner(tierPools.tier5, tierWinners[5].length);
  const tier4Payout = payoutPerWinner(tierPools.tier4, tierWinners[4].length);
  const tier3Payout = payoutPerWinner(tierPools.tier3, tierWinners[3].length);
  const jackpotCarryOut = tierWinners[5].length ? 0 : tierPools.tier5;

  const winnerEntries = [
    ...tierWinners[5].map((userId) => ({
      userId,
      matchType: "5-match",
      matchCount: matchByUserId.get(String(userId)) || 5,
      prize: tier5Payout,
    })),
    ...tierWinners[4].map((userId) => ({
      userId,
      matchType: "4-match",
      matchCount: matchByUserId.get(String(userId)) || 4,
      prize: tier4Payout,
    })),
    ...tierWinners[3].map((userId) => ({
      userId,
      matchType: "3-match",
      matchCount: matchByUserId.get(String(userId)) || 3,
      prize: tier3Payout,
    })),
  ];

  const draw = await Draw.create({
    monthKey,
    drawNumbers: normalizedDrawNumbers,
    tierPools,
    jackpotCarryIn,
    jackpotCarryOut,
    winners: {
      tier5: {
        count: tierWinners[5].length,
        userIds: tierWinners[5],
        payoutPerWinner: tier5Payout,
      },
      tier4: {
        count: tierWinners[4].length,
        userIds: tierWinners[4],
        payoutPerWinner: tier4Payout,
      },
      tier3: {
        count: tierWinners[3].length,
        userIds: tierWinners[3],
        payoutPerWinner: tier3Payout,
      },
    },
    winnerEntries,
    status: "draft",
  });

  console.info(`draw created as draft: ${draw._id}`);

  res.status(201).json({
    message: "Monthly draw created as draft",
    draw,
    summary: {
      eligibleParticipants: activeUsers.length,
      totalPrizePool,
      contributionConfig,
      planStats,
    },
  });
});

export const publishDraw = asyncHandler(async (req, res) => {
  const { drawId } = req.params;

  const draw = await Draw.findById(drawId);
  if (!draw) {
    throw new AppError("Draw not found", 404);
  }

  if (draw.status === "published") {
    throw new AppError("Draw is already published", 409);
  }

  const validation = validateDraftDrawForPublish(draw);
  if (!validation.valid) {
    throw new AppError(validation.message, 400);
  }

  const { operations, totalWinners } = buildWinnerPayoutBulkOperations(
    draw.winnerEntries,
  );

  if (operations.length) {
    await User.bulkWrite(operations);
  }

  draw.status = "published";
  await draw.save();

  console.info(`draw published: ${draw._id}`);
  console.info(`winners processed: ${totalWinners}`);

  res.json({
    message: "Draw published successfully",
    drawId: String(draw._id),
    totalWinners,
  });
});

export const simulateMonthlyDraw = asyncHandler(async (req, res) => {
  const { drawNumbers } = req.body;

  const finalDrawNumbers =
    drawNumbers?.length === 5 ? drawNumbers : generateDrawNumbers();

  if (!validateDrawNumbers(finalDrawNumbers)) {
    throw new AppError(
      "drawNumbers must contain 5 unique integers between 1 and 45",
      400,
    );
  }

  const normalizedDrawNumbers = finalDrawNumbers
    .map((value) => Number(value))
    .sort((a, b) => a - b);

  const users = await User.find(buildEligibleUsersQuery()).select(
    "scores subscription.plan",
  );
  const { totalPrizePool, contributionConfig, planStats } =
    calculatePlanBasedPrizePool(users);

  const prizeBreakdown = {
    "5-match": {
      percentage: 40,
      pool: Number((totalPrizePool * 0.4).toFixed(2)),
      winners: 0,
      payoutPerWinner: 0,
    },
    "4-match": {
      percentage: 35,
      pool: Number((totalPrizePool * 0.35).toFixed(2)),
      winners: 0,
      payoutPerWinner: 0,
    },
    "3-match": {
      percentage: 25,
      pool: Number((totalPrizePool * 0.25).toFixed(2)),
      winners: 0,
      payoutPerWinner: 0,
    },
  };

  const groupedWinners = {
    "5-match": [],
    "4-match": [],
    "3-match": [],
  };

  for (const user of users) {
    const matchCount = getMatchCount(user.scores || [], normalizedDrawNumbers);
    const tier = getUserMatchTier(matchCount);
    if (tier >= 3) {
      groupedWinners[`${tier}-match`].push(String(user._id));
    }
  }

  prizeBreakdown["5-match"].winners = groupedWinners["5-match"].length;
  prizeBreakdown["4-match"].winners = groupedWinners["4-match"].length;
  prizeBreakdown["3-match"].winners = groupedWinners["3-match"].length;

  prizeBreakdown["5-match"].payoutPerWinner = payoutPerWinner(
    prizeBreakdown["5-match"].pool,
    prizeBreakdown["5-match"].winners,
  );
  prizeBreakdown["4-match"].payoutPerWinner = payoutPerWinner(
    prizeBreakdown["4-match"].pool,
    prizeBreakdown["4-match"].winners,
  );
  prizeBreakdown["3-match"].payoutPerWinner = payoutPerWinner(
    prizeBreakdown["3-match"].pool,
    prizeBreakdown["3-match"].winners,
  );

  const winners = [
    ...groupedWinners["5-match"].map((userId) => ({
      userId,
      matchType: "5-match",
      prize: prizeBreakdown["5-match"].payoutPerWinner,
    })),
    ...groupedWinners["4-match"].map((userId) => ({
      userId,
      matchType: "4-match",
      prize: prizeBreakdown["4-match"].payoutPerWinner,
    })),
    ...groupedWinners["3-match"].map((userId) => ({
      userId,
      matchType: "3-match",
      prize: prizeBreakdown["3-match"].payoutPerWinner,
    })),
  ];

  res.json({
    drawNumbers: normalizedDrawNumbers,
    winners,
    summary: {
      eligibleParticipants: users.length,
      totalPrizePool,
      contributionConfig,
      planStats,
      totalWinners: winners.length,
      prizeBreakdown,
    },
  });
});

export const getLatestDraw = asyncHandler(async (req, res) => {
  const draw = await Draw.findOne().sort({ createdAt: -1 });

  if (!draw) {
    throw new AppError("No draw found", 404);
  }

  res.json({ draw });
});
