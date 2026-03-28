import bcrypt from "bcrypt";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { markExpiredSubscriptions } from "../services/stripeService.js";
import AppError from "../utils/appError.js";
import { normalizeName } from "../utils/validators.js";

export const getProfile = asyncHandler(async (req, res) => {
  await markExpiredSubscriptions();

  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("charity.charityId", "name description imageUrl");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const hasValidStripeSubscription = Boolean(
    (user.subscription?.stripeSubscriptionId || user.stripeSubscriptionId) &&
    user.subscription?.expiryDate &&
    new Date(user.subscription.expiryDate) > new Date(),
  );

  if (user.role !== "admin" && !hasValidStripeSubscription) {
    user.subscription.status = "inactive";
    user.subscription.plan = "none";
    user.subscription.expiryDate = null;
    user.subscription.stripeSubscriptionId = null;
    await user.save();
  }

  res.json({ user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (name !== undefined) {
    const nextName = normalizeName(name);
    if (nextName.length < 2) {
      throw new AppError("Name must be at least 2 characters", 400);
    }
    user.name = nextName;
  }

  if (newPassword !== undefined && newPassword !== "") {
    if (!currentPassword) {
      throw new AppError("currentPassword is required to change password", 400);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new AppError("Current password is incorrect", 401);
    }

    if (String(newPassword).length < 6) {
      throw new AppError("New password must be at least 6 characters", 400);
    }

    user.password = await bcrypt.hash(newPassword, 10);
  }

  await user.save();

  res.json({
    message: "Profile updated",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      subscription: user.subscription,
      charity: user.charity,
      winnings: user.winnings,
    },
  });
});

export const uploadWinnerProof = asyncHandler(async (req, res) => {
  const { proofUrl } = req.body;

  if (!proofUrl || typeof proofUrl !== "string") {
    throw new AppError("proofUrl is required", 400);
  }

  const trimmedUrl = proofUrl.trim();
  if (!/^https?:\/\//i.test(trimmedUrl)) {
    throw new AppError("proofUrl must be a valid http/https URL", 400);
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if ((user.winnings?.amount || 0) <= 0) {
    throw new AppError("No winnings found for proof submission", 400);
  }

  user.winnings.proofUrl = trimmedUrl;
  user.winnings.proofSubmittedAt = new Date();
  await user.save();

  res.json({
    message: "Winner proof uploaded",
    winnings: user.winnings,
  });
});
