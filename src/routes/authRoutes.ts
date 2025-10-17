import express from "express";
import { registerAdmin, loginAdmin, logoutAdmin, resetPassword } from "../controllers/authController";
import { verifyToken, verifySuperAdmin } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/register", verifyToken ,verifySuperAdmin, registerAdmin);
router.post("/login", loginAdmin);
router.post("/logout", logoutAdmin);
router.post("/reset-password", resetPassword);

export default router;