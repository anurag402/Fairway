import mongoose from "mongoose";

const charityDonationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    charityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Charity",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    source: {
      type: String,
      enum: ["independent"],
      default: "independent",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const CharityDonation = mongoose.model(
  "CharityDonation",
  charityDonationSchema,
);

export default CharityDonation;
