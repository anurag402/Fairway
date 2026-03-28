import { Router } from "express";
import {
  getAdminDonations,
  getAnalytics,
  getAdminCharities,
  getUsers,
  updateUserSubscription,
  verifyWinner,
} from "../controllers/adminController.js";
import {
  authMiddleware,
  adminMiddleware,
} from "../middleware/authMiddleware.js";

const router = Router();

router.get("/users", authMiddleware, adminMiddleware, getUsers);
router.get("/analytics", authMiddleware, adminMiddleware, getAnalytics);
router.get("/charities", authMiddleware, adminMiddleware, getAdminCharities);
router.get("/donations", authMiddleware, adminMiddleware, getAdminDonations);
router.put("/verify-winner", authMiddleware, adminMiddleware, verifyWinner);
router.put(
  "/subscription",
  authMiddleware,
  adminMiddleware,
  updateUserSubscription,
);

export default router;
