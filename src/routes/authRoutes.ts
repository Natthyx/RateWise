import express from "express";
import {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  resetPassword,
  loginStaff,
} from "../controllers/authController";
import { verifyToken, verifySuperAdmin } from "../middleware/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Authentication endpoints for admin and staff
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new admin (Super Admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201:
 *         description: Admin registered successfully
 */
router.post("/register", verifyToken, verifySuperAdmin, registerAdmin);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login admin
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Successful login
 */
router.post("/login", loginAdmin);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout admin
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
router.post("/logout", logoutAdmin);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset admin password
 *     tags: [Authentication]
 */
router.post("/reset-password", resetPassword);

/**
 * @swagger
 * /auth/staff/login:
 *   post:
 *     summary: Login staff using PIN
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pin: { type: string }
 *     responses:
 *       200:
 *         description: Staff logged in
 */
router.post("/staff/login", loginStaff);

export default router;
