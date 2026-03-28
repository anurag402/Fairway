import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import {
  beginStripeEventProcessing,
  completeStripeEventProcessing,
  ensureStripeCustomerForUser,
  failStripeEventProcessing,
  getStripeClient,
  markExpiredSubscriptions,
  normalizePlan,
  resolveClientUrl,
  resolvePlanPriceId,
  updateUserSubscriptionFromStripeEvent,
} from "../services/stripeService.js";

function normalizeStripeError(error) {
  const isStripeError =
    typeof error?.type === "string" && error.type.startsWith("Stripe");

  if (!isStripeError) {
    return error;
  }

  if (
    error.type === "StripeAuthenticationError" ||
    error.message?.includes("Invalid API Key")
  ) {
    return new AppError(
      "Stripe is not configured correctly on the server. Please contact support.",
      503,
    );
  }

  return new AppError(
    "Payment provider request failed. Please try again.",
    502,
  );
}

export const createCheckoutSession = asyncHandler(async (req, res) => {
  try {
    const { plan } = req.body;
    const normalizedPlan = normalizePlan(plan);

    const stripe = getStripeClient();
    const customerId = await ensureStripeCustomerForUser({
      user: req.user,
      stripe,
    });

    const priceId = resolvePlanPriceId(normalizedPlan);
    const clientUrl = resolveClientUrl();

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId: String(req.user._id),
          plan: normalizedPlan,
        },
        success_url: `${clientUrl}/dashboard?checkout=success`,
        cancel_url: `${clientUrl}/dashboard?checkout=cancelled`,
      });
    } catch (error) {
      throw normalizeStripeError(error);
    }

    console.info(
      `[stripe] checkout-session-created userId=${req.user._id} sessionId=${session.id} plan=${normalizedPlan}`,
    );

    res.status(200).json({
      success: true,
      message: "Checkout session created",
      data: { sessionId: session.id, url: session.url },
    });
  } catch (error) {
    throw normalizeStripeError(error);
  }
});

export const handleStripeWebhook = asyncHandler(async (req, res) => {
  const stripe = getStripeClient();
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature) {
    throw new AppError("Missing Stripe signature", 400);
  }

  if (!webhookSecret) {
    throw new AppError("STRIPE_WEBHOOK_SECRET is missing in .env", 500);
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error) {
    throw new AppError(`Webhook verification failed: ${error.message}`, 400);
  }

  const canProcess = await beginStripeEventProcessing({
    eventId: event.id,
    eventType: event.type,
  });

  if (!canProcess) {
    return res.status(200).json({ received: true, duplicate: true });
  }

  try {
    console.info(
      `[stripe] webhook-processing eventId=${event.id} type=${event.type}`,
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      let subscription = null;

      if (session.subscription) {
        try {
          subscription = await stripe.subscriptions.retrieve(
            session.subscription,
          );
        } catch (error) {
          throw normalizeStripeError(error);
        }
      }

      await updateUserSubscriptionFromStripeEvent({
        customerId: session.customer,
        userId: session.metadata?.userId,
        stripeSubscription: subscription,
        fallbackPlan: session.metadata?.plan,
        status: "active",
      });
    }

    if (
      event.type === "invoice.payment_succeeded" ||
      event.type === "invoice.paid"
    ) {
      const invoice = event.data.object;

      if (invoice.subscription) {
        let subscription;
        try {
          subscription = await stripe.subscriptions.retrieve(
            invoice.subscription,
          );
        } catch (error) {
          throw normalizeStripeError(error);
        }

        await updateUserSubscriptionFromStripeEvent({
          customerId: invoice.customer,
          stripeSubscription: subscription,
          status: "active",
        });
      }
    }

    if (
      event.type === "customer.subscription.deleted" ||
      event.type === "customer.subscription.updated"
    ) {
      const stripeSubscription = event.data.object;
      const isInactive = [
        "canceled",
        "unpaid",
        "incomplete_expired",
        "past_due",
      ].includes(stripeSubscription.status);

      if (isInactive) {
        await updateUserSubscriptionFromStripeEvent({
          customerId: stripeSubscription.customer,
          stripeSubscription,
          status: "expired",
        });
      }
    }

    await markExpiredSubscriptions();
    await completeStripeEventProcessing(event.id);

    return res.status(200).json({ received: true });
  } catch (error) {
    await failStripeEventProcessing(event.id);
    throw normalizeStripeError(error);
  }
});
