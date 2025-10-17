import express from "express";
import multer from "multer";
import {
  createStaff,
  getAllStaff,
  updateStaff,
  deleteStaff,
  getStaffById,
  regeneratePin
} from "../controllers/staffController";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });


// Admin-only routes
router.post("/create", verifyToken, verifyAdmin, upload.single("file"),createStaff);
router.get("/getallstaff", verifyToken, verifyAdmin, getAllStaff);
router.put("/update/:id", verifyToken, verifyAdmin,upload.single("file"), updateStaff);
router.delete("/delete/:id", verifyToken, verifyAdmin, deleteStaff);
router.get("/getstaff/:id", verifyToken, verifyAdmin, getStaffById);
router.get("/regenerate-pin/:id", verifyToken, verifyAdmin, regeneratePin);

export default router;
