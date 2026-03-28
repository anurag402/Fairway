import User from "../models/User.js";
import Draw from "../models/Draw.js";
import Charity from "../models/Charity.js";
import CharityDonation from "../models/CharityDonation.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";

export const getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  const search = String(req.query.search || "").trim();
  const requestedSortBy = String(req.query.sortBy || "createdAt");
  const requestedSortOrder = String(
    req.query.sortOrder || "desc",
  ).toLowerCase();

  const sortableFields = new Set(["name", "email", "createdAt"]);
  const sortBy = sortableFields.has(requestedSortBy)
    ? requestedSortBy
    : "createdAt";
  const sortOrder = requestedSortOrder === "asc" ? "asc" : "desc";

  const sort = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  if (sortBy !== "createdAt") {
    sort.createdAt = -1;
  }

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const totalUsers = await User.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(totalUsers / limit));
  const safePage = Math.min(page, totalPages);
  const skip = (safePage - 1) * limit;

  const users = await User.find(query)
    .select("-password")
    .populate("charity.charityId", "name")
    .sort(sort)
    .skip(skip)
    .limit(limit);

  res.json({
    users,
    pagination: {
      page: safePage,
      limit,
      totalUsers,
      totalPages,
      hasPrevPage: safePage > 1,
      hasNextPage: safePage < totalPages,
    },
    search,
    sort: {
      sortBy,
      sortOrder,
    },
  });
});

export const getAnalytics = asyncHandler(async (req, res) => {
  const monthlyFee = Number(process.env.MONTHLY_SUBSCRIPTION_FEE || 10);
  const yearlyFee = Number(process.env.YEARLY_SUBSCRIPTION_FEE || 100);
  const activeSubscriberMatch = {
    role: "user",
    "subscription.status": "active",
    "subscription.expiryDate": { $gt: new Date() },
    "subscription.stripeSubscriptionId": { $ne: null },
  };

  const [
    totalUsers,
    activeSubscribers,
    livePrizePoolAgg,
    drawTotals,
    monthlyDataRaw,
    winnerDistributionRaw,
    charityAgg,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments(activeSubscriberMatch),
    User.aggregate([
      {
        $match: activeSubscriberMatch,
      },
      {
        $project: {
          prizePoolContribution: {
            $cond: [
              { $eq: ["$subscription.plan", "yearly"] },
              yearlyFee,
              monthlyFee,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalPrizePool: { $sum: "$prizePoolContribution" },
        },
      },
    ]),
    Draw.aggregate([
      {
        $project: {
          totalPool: {
            $add: [
              { $ifNull: ["$tierPools.tier5", 0] },
              { $ifNull: ["$tierPools.tier4", 0] },
              { $ifNull: ["$tierPools.tier3", 0] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalPrizePool: { $sum: "$totalPool" },
          totalDraws: { $sum: 1 },
        },
      },
    ]),
    Draw.aggregate([
      {
        $project: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          totalPool: {
            $add: [
              { $ifNull: ["$tierPools.tier5", 0] },
              { $ifNull: ["$tierPools.tier4", 0] },
              { $ifNull: ["$tierPools.tier3", 0] },
            ],
          },
          winnerCount: {
            $add: [
              { $ifNull: ["$winners.tier5.count", 0] },
              { $ifNull: ["$winners.tier4.count", 0] },
              { $ifNull: ["$winners.tier3.count", 0] },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            year: "$year",
            month: "$month",
          },
          prizePool: { $sum: "$totalPool" },
          draws: { $sum: 1 },
          winners: { $sum: "$winnerCount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Draw.aggregate([
      {
        $project: {
          tier5: { $ifNull: ["$winners.tier5.count", 0] },
          tier4: { $ifNull: ["$winners.tier4.count", 0] },
          tier3: { $ifNull: ["$winners.tier3.count", 0] },
        },
      },
      {
        $group: {
          _id: null,
          tier5: { $sum: "$tier5" },
          tier4: { $sum: "$tier4" },
          tier3: { $sum: "$tier3" },
        },
      },
    ]),
    User.aggregate([
      {
        $match: activeSubscriberMatch,
      },
      {
        $project: {
          contribution: {
            $cond: [
              { $eq: ["$subscription.status", "active"] },
              {
                $multiply: [
                  {
                    $cond: [
                      { $eq: ["$subscription.plan", "yearly"] },
                      yearlyFee,
                      monthlyFee,
                    ],
                  },
                  {
                    $divide: [{ $ifNull: ["$charity.percentage", 10] }, 100],
                  },
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalCharity: { $sum: "$contribution" },
        },
      },
    ]),
  ]);

  const drawTotalsResult = drawTotals[0] || {
    totalPrizePool: 0,
    totalDraws: 0,
  };

  const winnerDistributionResult = winnerDistributionRaw[0] || {
    tier5: 0,
    tier4: 0,
    tier3: 0,
  };

  const monthlyData = monthlyDataRaw.map((item) => ({
    month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
    prizePool: Math.round(Number(item.prizePool || 0) * 100) / 100,
    draws: item.draws || 0,
    winnerCount: item.winners || 0,
  }));

  const winnerDistribution = [
    {
      matchType: "5-match",
      count: Number(winnerDistributionResult.tier5 || 0),
    },
    {
      matchType: "4-match",
      count: Number(winnerDistributionResult.tier4 || 0),
    },
    {
      matchType: "3-match",
      count: Number(winnerDistributionResult.tier3 || 0),
    },
  ];

  res.json({
    totalUsers,
    activeSubscribers,
    totalPrizePool:
      Math.round(Number(livePrizePoolAgg[0]?.totalPrizePool || 0) * 100) / 100,
    totalCharity:
      Math.round(Number(charityAgg[0]?.totalCharity || 0) * 100) / 100,
    totalDraws: Number(drawTotalsResult.totalDraws || 0),
    monthlyData,
    winnerDistribution,
  });
});

export const verifyWinner = asyncHandler(async (req, res) => {
  const { userId, status } = req.body;

  if (!userId || !status) {
    throw new AppError("userId and status are required", 400);
  }

  if (!["pending", "paid"].includes(status)) {
    throw new AppError("status must be pending or paid", 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.winnings.status = status;
  await user.save();

  res.json({
    message: "Winner status updated",
    winnings: user.winnings,
  });
});

export const getAdminCharities = asyncHandler(async (_req, res) => {
  const charities = await Charity.find().sort({ createdAt: -1 });
  res.json({ charities });
});

export const updateUserSubscription = asyncHandler(async (req, res) => {
  const { userId, status, plan, expiryDate } = req.body;

  if (!userId || !status) {
    throw new AppError("userId and status are required", 400);
  }

  if (!["active", "inactive", "expired"].includes(status)) {
    throw new AppError("status must be active, inactive, or expired", 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role === "admin") {
    throw new AppError("Admin subscription cannot be modified", 400);
  }

  user.subscription.status = status;

  if (status === "active") {
    if (!["monthly", "yearly"].includes(plan)) {
      throw new AppError(
        "plan must be monthly or yearly for active status",
        400,
      );
    }

    const parsedExpiry = expiryDate ? new Date(expiryDate) : null;
    if (!parsedExpiry || Number.isNaN(parsedExpiry.getTime())) {
      throw new AppError(
        "A valid expiryDate is required for active status",
        400,
      );
    }

    user.subscription.plan = plan;
    user.subscription.expiryDate = parsedExpiry;

    // Keep compatibility with auth/profile guards that require a subscription id.
    const manualSubscriptionId =
      user.subscription.stripeSubscriptionId ||
      user.stripeSubscriptionId ||
      `admin_manual_${Date.now()}`;

    user.subscription.stripeSubscriptionId = manualSubscriptionId;
    user.stripeSubscriptionId = manualSubscriptionId;
  } else {
    user.subscription.plan = "none";
    user.subscription.expiryDate = null;
    user.subscription.stripeSubscriptionId = null;
    user.stripeSubscriptionId = null;
  }

  await user.save();

  res.json({
    message: "User subscription updated",
    subscription: user.subscription,
  });
});

export const getAdminDonations = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const charityId = String(req.query.charityId || "").trim();
  const skip = (page - 1) * limit;

  const query = {};
  if (charityId) {
    query.charityId = charityId;
  }

  const [donations, total] = await Promise.all([
    CharityDonation.find(query)
      .populate("userId", "name email")
      .populate("charityId", "name category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    CharityDonation.countDocuments(query),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  res.json({
    donations,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages,
    },
  });
});
