import Stripe from "stripe";
import User from "../models/User.js";
import StripeWebhookEvent from "../models/StripeWebhookEvent.js";
import AppError from "../utils/appError.js";

// Creates and validates a Stripe client configured for a pinned API version.
export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new AppError("STRIPE_SECRET_KEY is missing in .env", 500);
  }

  const looksLikePlaceholder =
    secretKey.startsWith("replace-") || secretKey.includes("replace-with");

  if (looksLikePlaceholder) {
    throw new AppError(
      "Stripe is not configured. Set a real STRIPE_SECRET_KEY in backend/.env",
      503,
    );
  }

  try {
    return new Stripe(secretKey, {
      apiVersion: "2023-10-16",
    });
  } catch (error) {
    throw new AppError(
      `Failed to initialize Stripe client: ${error.message}`,
      500,
    );
  }
}

// Normalizes plan input to supported plan names.
export function normalizePlan(plan) {
  if (plan === "monthly" || plan === "yearly") return plan;
  throw new AppError("plan must be monthly or yearly", 400);
}

// Ensures a user document always has a subscription object before nested access.
export function ensureSubscriptionObject(user) {
  if (!user.subscription) {
    user.subscription = {};
  }

  return user.subscription;
}

// Resolves Stripe recurring price id from environment by plan.
export function resolvePlanPriceId(plan) {
  const monthlyPriceId = process.env.STRIPE_MONTHLY_PRICE_ID;
  const yearlyPriceId = process.env.STRIPE_YEARLY_PRICE_ID;

  if (!monthlyPriceId) {
    throw new AppError("STRIPE_MONTHLY_PRICE_ID is missing in .env", 500);
  }

  if (!yearlyPriceId) {
    throw new AppError("STRIPE_YEARLY_PRICE_ID is missing in .env", 500);
  }

  return plan === "yearly" ? yearlyPriceId : monthlyPriceId;
}

// Resolves browser redirect base URL.
export function resolveClientUrl() {
  return (
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:5173"
  );
}

// Infers app plan from Stripe subscription interval.
export function getPlanFromStripeSubscription(stripeSubscription) {
  const interval =
    stripeSubscription?.items?.data?.[0]?.price?.recurring?.interval ||
    stripeSubscription?.plan?.interval;

  return interval === "year" ? "yearly" : "monthly";
}

// Marks elapsed subscriptions as expired and returns update count.
export async function markExpiredSubscriptions() {
  const result = await User.updateMany(
    {
      "subscription.status": "active",
      "subscription.expiryDate": { $lt: new Date() },
    },
    {
      $set: {
        "subscription.status": "expired",
        "subscription.plan": "none",
        "subscription.stripeSubscriptionId": null,
      },
    },
  );

  const modifiedCount = result?.modifiedCount || 0;
  console.info(
    `[stripe] expired-subscriptions sweep completed, updated=${modifiedCount}`,
  );

  // For production, schedule this function with node-cron to run periodically.
  return modifiedCount;
}

// Ensures a Stripe customer exists for a user and returns its customer id.
export async function ensureStripeCustomerForUser({ user, stripe }) {
  const subscription = ensureSubscriptionObject(user);
  const existingCustomerId =
    subscription?.stripeCustomerId || user.stripeCustomerId || null;

  if (existingCustomerId) {
    return existingCustomerId;
  }

  let customer;
  try {
    customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: String(user._id),
      },
    });
  } catch (error) {
    throw new AppError(
      `Failed to create Stripe customer: ${error.message}`,
      502,
    );
  }

  subscription.stripeCustomerId = customer.id;
  user.stripeCustomerId = customer.id;
  await user.save();

  console.info(
    `[stripe] customer-created userId=${user._id} customerId=${customer.id}`,
  );

  return customer.id;
}

// Updates user subscription state from Stripe webhook payloads safely.
export async function updateUserSubscriptionFromStripeEvent({
  customerId,
  userId,
  stripeSubscription,
  fallbackPlan,
  status,
}) {
  let user = null;

  if (userId) {
    user = await User.findById(userId);
  }

  if (!user && customerId) {
    user = await User.findOne({
      $or: [
        { "subscription.stripeCustomerId": customerId },
        { stripeCustomerId: customerId },
      ],
    });
  }

  if (!user) return;

  const subscription = ensureSubscriptionObject(user);

  const nextPlan = stripeSubscription
    ? getPlanFromStripeSubscription(stripeSubscription)
    : fallbackPlan || "none";

  const nextExpiryDate = stripeSubscription?.current_period_end
    ? new Date(stripeSubscription.current_period_end * 1000)
    : null;

  subscription.status = status;
  subscription.plan = status === "active" ? nextPlan : "none";
  subscription.expiryDate = status === "active" ? nextExpiryDate : null;
  subscription.stripeCustomerId =
    customerId ||
    subscription.stripeCustomerId ||
    user.stripeCustomerId ||
    null;
  subscription.stripeSubscriptionId =
    status === "active"
      ? stripeSubscription?.id || subscription.stripeSubscriptionId || null
      : null;

  // Backward-compatible mirrors for existing code paths.
  user.stripeCustomerId = subscription.stripeCustomerId;
  user.stripeSubscriptionId = subscription.stripeSubscriptionId;

  await user.save();

  console.info(
    `[stripe] subscription-updated userId=${user._id} status=${status} plan=${subscription.plan}`,
  );
}

// Begins idempotent processing for a Stripe webhook event.
export async function beginStripeEventProcessing({ eventId, eventType }) {
  try {
    await StripeWebhookEvent.create({
      eventId,
      eventType,
      status: "processing",
      processedAt: null,
    });

    return true;
  } catch (error) {
    if (error?.code === 11000) {
      console.info(`[stripe] duplicate-webhook ignored eventId=${eventId}`);
      return false;
    }

    throw new AppError(`Failed to lock webhook event: ${error.message}`, 500);
  }
}

// Marks a webhook event as fully processed.
export async function completeStripeEventProcessing(eventId) {
  await StripeWebhookEvent.updateOne(
    { eventId },
    {
      $set: {
        status: "processed",
        processedAt: new Date(),
      },
    },
  );
}

// Releases processing lock when an event fails so Stripe can retry safely.
export async function failStripeEventProcessing(eventId) {
  await StripeWebhookEvent.deleteOne({ eventId, status: "processing" });
}
