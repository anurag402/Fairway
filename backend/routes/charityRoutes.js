import { Router } from "express";
import {
  createIndependentDonation,
  createCharity,
  getMyDonations,
  getCharityById,
  deleteCharity,
  getCharities,
  selectCharity,
  updateCharity,
} from "../controllers/charityController.js";
import {
  authMiddleware,
  adminMiddleware,
} from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getCharities);
router.get("/donations/me", authMiddleware, getMyDonations);
router.get("/:id", getCharityById);
router.post("/select", authMiddleware, selectCharity);
router.post("/:id/donate", authMiddleware, createIndependentDonation);

router.post("/", authMiddleware, adminMiddleware, createCharity);
router.put("/:id", authMiddleware, adminMiddleware, updateCharity);
router.delete("/:id", authMiddleware, adminMiddleware, deleteCharity);

export default router;
