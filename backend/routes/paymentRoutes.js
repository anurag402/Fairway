import express from "express";
import {
  createCheckoutSession,
  handleStripeWebhook,
} from "../controllers/paymentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-checkout-session", authMiddleware, createCheckoutSession);
router.post("/webhook", handleStripeWebhook);

export default router;
