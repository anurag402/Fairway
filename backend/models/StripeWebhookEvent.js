import mongoose from "mongoose";

const stripeWebhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["processing", "processed"],
      default: "processing",
    },
    processedAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 90,
    },
  },
  {
    versionKey: false,
  },
);

const StripeWebhookEvent = mongoose.model(
  "StripeWebhookEvent",
  stripeWebhookEventSchema,
);

export default StripeWebhookEvent;
