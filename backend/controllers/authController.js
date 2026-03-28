import bcrypt from "bcrypt";
import Charity from "../models/Charity.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import { generateToken } from "../utils/jwt.js";
import {
  normalizeEmail,
  normalizeName,
  requireFields,
  validateCharityPercentage,
  validateEmail,
} from "../utils/validators.js";

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, charityId, charityPercentage = 10 } = req.body;

  requireFields(req.body, ["name", "email", "password", "charityId"]);

  const normalizedName = normalizeName(name);
  const normalizedEmail = normalizeEmail(email);

  if (!validateEmail(normalizedEmail)) {
    throw new AppError("Invalid email format", 400);
  }

  if (normalizedName.length < 2) {
    throw new AppError("Name must be at least 2 characters", 400);
  }

  if (password.length < 6) {
    throw new AppError("Password must be at least 6 characters", 400);
  }

  if (!validateCharityPercentage(charityPercentage)) {
    throw new AppError("charityPercentage must be between 10 and 100", 400);
  }

  const charity = await Charity.findOne({ _id: charityId, isActive: true });
  if (!charity) {
    throw new AppError("Selected charity is invalid or inactive", 400);
  }

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });
  if (existingUser) {
    throw new AppError("Email already in use", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    password: hashedPassword,
    subscription: {
      status: "inactive",
      plan: "none",
      expiryDate: null,
    },
    charity: {
      charityId: charity._id,
      percentage: Number(charityPercentage),
    },
  });

  const token = generateToken({ userId: user._id, role: user.role });

  res.status(201).json({
    message: "Signup successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      subscription: user.subscription,
      charity: user.charity,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  requireFields(req.body, ["email", "password"]);

  const normalizedEmail = normalizeEmail(email);

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  // Guardrail: until Stripe confirms payment, keep regular users inactive.
  const hasValidStripeSubscription = Boolean(
    (user.subscription?.stripeSubscriptionId || user.stripeSubscriptionId) &&
    user.subscription?.expiryDate &&
    new Date(user.subscription.expiryDate) > new Date(),
  );

  if (user.role !== "admin" && !hasValidStripeSubscription) {
    user.subscription.status = "expired";
    user.subscription.plan = "none";
    user.subscription.expiryDate = null;
    user.subscription.stripeSubscriptionId = null;
    await user.save();
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = generateToken({ userId: user._id, role: user.role });

  res.json({
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      subscription: user.subscription,
    },
  });
});
