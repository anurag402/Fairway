import mongoose from "mongoose";

const charityEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true },
);

const charitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "general",
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    upcomingEvents: {
      type: [charityEventSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Charity = mongoose.model("Charity", charitySchema);

export default Charity;
