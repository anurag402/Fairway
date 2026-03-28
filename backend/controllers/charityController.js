import Charity from "../models/Charity.js";
import CharityDonation from "../models/CharityDonation.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import { validateCharityPercentage } from "../utils/validators.js";

function normalizeUpcomingEvents(value) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new AppError("upcomingEvents must be an array", 400);
  }

  return value.map((event, index) => {
    if (!event || typeof event !== "object") {
      throw new AppError(`upcomingEvents[${index}] must be an object`, 400);
    }

    const title = String(event.title || "").trim();
    const description = String(event.description || "").trim();
    const dateValue = event.eventDate;

    if (!title) {
      throw new AppError(`upcomingEvents[${index}].title is required`, 400);
    }

    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new AppError(
        `upcomingEvents[${index}].eventDate must be a valid date`,
        400,
      );
    }

    return {
      title,
      description,
      eventDate: parsedDate,
    };
  });
}

export const getCharities = asyncHandler(async (req, res) => {
  const query = { isActive: true };

  const search = String(req.query.search || "").trim();
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  const category = String(req.query.category || "").trim();
  if (category) {
    query.category = category;
  }

  if (String(req.query.featured || "").toLowerCase() === "true") {
    query.featured = true;
  }

  const charities = await Charity.find(query).sort({
    createdAt: -1,
  });
  res.json({ charities });
});

export const getCharityById = asyncHandler(async (req, res) => {
  const charity = await Charity.findOne({
    _id: req.params.id,
    isActive: true,
  });

  if (!charity) {
    throw new AppError("Charity not found", 404);
  }

  res.json({ charity });
});

export const selectCharity = asyncHandler(async (req, res) => {
  const { charityId, percentage = 10 } = req.body;

  if (!charityId) {
    throw new AppError("charityId is required", 400);
  }

  if (!validateCharityPercentage(percentage)) {
    throw new AppError("percentage must be between 10 and 100", 400);
  }

  const charity = await Charity.findById(charityId);
  if (!charity || !charity.isActive) {
    throw new AppError("Charity not found", 404);
  }

  const user = await User.findById(req.user._id);
  user.charity = { charityId: charity._id, percentage: Number(percentage) };
  await user.save();

  res.json({
    message: "Charity selected",
    charity: user.charity,
  });
});

export const createCharity = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    imageUrl = "",
    category = "general",
    featured = false,
    upcomingEvents = [],
  } = req.body;

  const normalizedName = String(name || "").trim();
  const normalizedDescription = String(description || "").trim();

  if (!normalizedName || !normalizedDescription) {
    throw new AppError("name and description are required", 400);
  }

  const normalizedEvents = normalizeUpcomingEvents(upcomingEvents) || [];

  const charity = await Charity.create({
    name: normalizedName,
    description: normalizedDescription,
    imageUrl: String(imageUrl || "").trim(),
    category: String(category || "general").trim() || "general",
    featured: Boolean(featured),
    upcomingEvents: normalizedEvents,
  });
  res.status(201).json({ message: "Charity created", charity });
});

export const updateCharity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const charity = await Charity.findById(id);

  if (!charity) {
    throw new AppError("Charity not found", 404);
  }

  const {
    name,
    description,
    imageUrl,
    category,
    featured,
    isActive,
    upcomingEvents,
  } = req.body;

  if (name !== undefined) {
    const normalizedName = String(name || "").trim();
    if (!normalizedName) {
      throw new AppError("name cannot be empty", 400);
    }
    charity.name = normalizedName;
  }
  if (description !== undefined) {
    const normalizedDescription = String(description || "").trim();
    if (!normalizedDescription) {
      throw new AppError("description cannot be empty", 400);
    }
    charity.description = normalizedDescription;
  }
  if (imageUrl !== undefined) charity.imageUrl = String(imageUrl || "").trim();
  if (category !== undefined) {
    charity.category = String(category || "").trim() || "general";
  }
  if (featured !== undefined) charity.featured = Boolean(featured);
  if (isActive !== undefined) charity.isActive = Boolean(isActive);
  if (upcomingEvents !== undefined) {
    charity.upcomingEvents = normalizeUpcomingEvents(upcomingEvents);
  }

  await charity.save();

  res.json({ message: "Charity updated", charity });
});

export const deleteCharity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const charity = await Charity.findById(id);

  if (!charity) {
    throw new AppError("Charity not found", 404);
  }

  await charity.deleteOne();

  res.json({ message: "Charity deleted" });
});

export const createIndependentDonation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const amount = Number(req.body?.amount);
  const note = String(req.body?.note || "").trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError("amount must be a positive number", 400);
  }

  const roundedAmount = Math.round(amount * 100) / 100;

  const charity = await Charity.findOne({ _id: id, isActive: true });
  if (!charity) {
    throw new AppError("Charity not found", 404);
  }

  const donation = await CharityDonation.create({
    userId: req.user._id,
    charityId: charity._id,
    amount: roundedAmount,
    note,
    source: "independent",
  });

  res.status(201).json({
    message: "Donation recorded successfully",
    donation,
  });
});

export const getMyDonations = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const query = { userId: req.user._id };

  const [donations, total] = await Promise.all([
    CharityDonation.find(query)
      .populate("charityId", "name category imageUrl")
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
