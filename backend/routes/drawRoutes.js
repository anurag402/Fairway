import { Router } from "express";
import {
  getLatestDraw,
  publishDraw,
  runMonthlyDraw,
  simulateMonthlyDraw,
} from "../controllers/drawController.js";
import {
  authMiddleware,
  adminMiddleware,
} from "../middleware/authMiddleware.js";

const router = Router();

router.post("/run", authMiddleware, adminMiddleware, runMonthlyDraw);
router.post("/simulate", authMiddleware, adminMiddleware, simulateMonthlyDraw);
router.post("/publish/:drawId", authMiddleware, adminMiddleware, publishDraw);
router.get("/latest", getLatestDraw);

export default router;
