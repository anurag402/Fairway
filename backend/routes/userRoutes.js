import { Router } from "express";
import {
  getProfile,
  updateProfile,
  uploadWinnerProof,
} from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.post("/winner-proof", authMiddleware, uploadWinnerProof);

export default router;
