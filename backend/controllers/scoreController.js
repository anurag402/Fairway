import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import { validateDateInput, validateScoreValue } from "../utils/validators.js";

function sortLatestFirst(scores) {
  return [...scores].sort((a, b) => new Date(b.date) - new Date(a.date));
}

export const addScore = asyncHandler(async (req, res) => {
  const { value, date } = req.body;

  if (!validateScoreValue(value)) {
    throw new AppError("Score must be an integer between 1 and 45", 400);
  }

  if (!date) {
    throw new AppError("date is required", 400);
  }

  if (!validateDateInput(date)) {
    throw new AppError("date must be a valid date", 400);
  }

  const parsedDate = new Date(date);
  if (parsedDate > new Date()) {
    throw new AppError("date cannot be in the future", 400);
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.scores.length > 5) {
    user.scores = user.scores.slice(-5);
  }

  // FIFO: append newest entry, remove oldest when already at capacity.
  user.scores.push({ value: Number(value), date: parsedDate });

  if (user.scores.length > 5) {
    user.scores.shift();
  }

  await user.save();

  res.status(201).json({
    message: "Score added",
    scores: sortLatestFirst(user.scores),
  });
});

export const getScores = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("scores");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({ scores: sortLatestFirst(user.scores) });
});

export const updateScore = asyncHandler(async (req, res) => {
  const { scoreId } = req.params;
  const { value, date } = req.body;

  if (!validateScoreValue(value)) {
    throw new AppError("Score must be an integer between 1 and 45", 400);
  }

  if (!date || !validateDateInput(date)) {
    throw new AppError("date must be a valid date", 400);
  }

  const parsedDate = new Date(date);
  if (parsedDate > new Date()) {
    throw new AppError("date cannot be in the future", 400);
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const score = user.scores.id(scoreId);
  if (!score) {
    throw new AppError("Score not found", 404);
  }

  score.value = Number(value);
  score.date = parsedDate;
  await user.save();

  res.json({
    message: "Score updated",
    scores: sortLatestFirst(user.scores),
  });
});

export const deleteScore = asyncHandler(async (req, res) => {
  const { scoreId } = req.params;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const score = user.scores.id(scoreId);
  if (!score) {
    throw new AppError("Score not found", 404);
  }

  score.deleteOne();
  await user.save();

  res.json({
    message: "Score deleted",
    scores: sortLatestFirst(user.scores),
  });
});
