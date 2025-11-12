import express from "express";
import {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  resetPassword,
  loginStaff,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  updateMyProfile,
} from "../controllers/authController";
import { verifyToken, verifySuperAdmin } from "../middleware/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Endpoints for admin and staff authentication
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
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               businessId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin registered successfully
 *       400:
 *         description: Invalid role
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Internal server error
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
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *       500:
 *         description: Invalid credentials
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
 *       500:
 *         description: Internal server error
 */
router.post("/logout", logoutAdmin);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset admin password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *       400:
 *         description: Email not found
 *       500:
 *         description: Internal server error
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
 *               pin:
 *                 type: string
 *     responses:
 *       200:
 *         description: Staff logged in successfully
 *       400:
 *         description: PIN is required
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Internal server error
 */
router.post("/staff/login", loginStaff);

/**
 * @swagger
 * /auth/admins:
 *   get:
 *     summary: Get all admins (Super Admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all admins
 *       500:
 *         description: Internal server error
 */
router.get("/admins", verifyToken, verifySuperAdmin, getAllAdmins);

/**
 * @swagger
 * /auth/admins/{adminId}:
 *   patch:
 *     summary: Update an admin (Super Admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               businessId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *       404:
 *         description: Business not found
 *       500:
 *         description: Internal server error
 */
router.patch("/admins/:adminId", verifyToken, verifySuperAdmin, updateAdmin);

/**
 * @swagger
 * /auth/admins/{adminId}:
 *   delete:
 *     summary: Delete an admin (Super Admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Admin deleted successfully
 *       500:
 *         description: Internal server error
 */
router.delete("/admins/:adminId", verifyToken, verifySuperAdmin, deleteAdmin);

// Self update
router.patch("/me", verifyToken, updateMyProfile);

export default router;