import { Router } from "express";
import {
  addScore,
  deleteScore,
  getScores,
  updateScore,
} from "../controllers/scoreController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import requireSubscription from "../middleware/requireSubscription.js";

const router = Router();

router.post("/", authMiddleware, requireSubscription, addScore);
router.get("/", authMiddleware, requireSubscription, getScores);
router.put("/:scoreId", authMiddleware, requireSubscription, updateScore);
router.delete("/:scoreId", authMiddleware, requireSubscription, deleteScore);

export default router;
