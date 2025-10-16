import express from "express";
import { registerAdmin, loginAdmin, logoutAdmin, resetPassword } from "../controllers/authController";


const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/logout", logoutAdmin);
router.post("/reset-password", resetPassword);

export default router;