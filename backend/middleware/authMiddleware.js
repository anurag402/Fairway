import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";

export const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Unauthorized", 401);
  }

  const token = authHeader.split(" ")[1];
  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT_SECRET is missing in .env", 500);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }

  const user = await User.findById(decoded.userId).select("-password");

  if (!user) {
    throw new AppError("User not found", 401);
  }

  req.user = user;
  next();
});

export function adminMiddleware(req, res, next) {
  if (req.user?.role !== "admin") {
    return next(new AppError("Admin access required", 403));
  }

  return next();
}
