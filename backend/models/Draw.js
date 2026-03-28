import mongoose from "mongoose";

const winnerEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    matchType: {
      type: String,
      enum: ["3-match", "4-match", "5-match"],
      required: true,
    },
    matchCount: {
      type: Number,
      enum: [3, 4, 5],
      required: true,
    },
    prize: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false },
);

const drawSchema = new mongoose.Schema(
  {
    monthKey: {
      type: String,
      required: true,
      unique: true,
    },
    drawNumbers: {
      type: [Number],
      required: true,
      validate: {
        validator(values) {
          return values.length === 5;
        },
        message: "Draw must contain exactly 5 numbers.",
      },
    },
    tierPools: {
      tier5: { type: Number, default: 0 },
      tier4: { type: Number, default: 0 },
      tier3: { type: Number, default: 0 },
    },
    jackpotCarryIn: {
      type: Number,
      default: 0,
      min: 0,
    },
    jackpotCarryOut: {
      type: Number,
      default: 0,
      min: 0,
    },
    winners: {
      tier5: {
        count: { type: Number, default: 0 },
        userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        payoutPerWinner: { type: Number, default: 0 },
      },
      tier4: {
        count: { type: Number, default: 0 },
        userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        payoutPerWinner: { type: Number, default: 0 },
      },
      tier3: {
        count: { type: Number, default: 0 },
        userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        payoutPerWinner: { type: Number, default: 0 },
      },
    },
    winnerEntries: {
      type: [winnerEntrySchema],
      default: [],
    },
    executedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Draw = mongoose.model("Draw", drawSchema);

export default Draw;
