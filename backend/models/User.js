import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema(
  {
    value: {
      type: Number,
      min: 1,
      max: 45,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { _id: true },
);

const subscriptionSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "inactive",
    },
    plan: {
      type: String,
      enum: ["monthly", "yearly", "none"],
      default: "none",
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
  },
  { _id: false },
);

const charitySelectionSchema = new mongoose.Schema(
  {
    charityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Charity",
      default: null,
    },
    percentage: {
      type: Number,
      min: 10,
      max: 100,
      default: 10,
    },
  },
  { _id: false },
);

const winningsSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["none", "pending", "paid"],
      default: "none",
    },
    proofUrl: {
      type: String,
      default: "",
    },
    proofSubmittedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    subscription: {
      type: subscriptionSchema,
      default: () => ({}),
    },
    scores: {
      type: [scoreSchema],
      default: [],
      validate: {
        validator(scores) {
          return scores.length <= 5;
        },
        message: "A user can store at most 5 scores.",
      },
    },
    charity: {
      type: charitySelectionSchema,
      default: () => ({}),
    },
    winnings: {
      type: winningsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
