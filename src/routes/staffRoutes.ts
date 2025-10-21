import express from "express";
import multer from "multer";
import {
  createStaff,
  getAllStaff,
  updateStaff,
  deleteStaff,
  getStaffById,
  regeneratePin,
  getStaffPerformance,
  getStaffLeaderboard,
} from "../controllers/staffController";
import { verifyToken, verifyAdmin, verifyStaff } from "../middleware/authMiddleware";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * tags:
 *   name: Staff
 *   description: Staff management endpoints
 */

/**
 * @swagger
 * /staff/create:
 *   post:
 *     summary: Create a new staff member (Admin only)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Staff created successfully
 *       400:
 *         description: Name and email are required or avatar image is required
 *       500:
 *         description: Internal server error
 */
router.post("/create", verifyToken, verifyAdmin, upload.single("file"),createStaff);

/**
 * @swagger
 * /staff/getallstaff:
 *   get:
 *     summary: Get all staff members (Admin only)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all staff members
 *       500:
 *         description: Internal server error
 */
router.get("/getallstaff", verifyToken, verifyAdmin, getAllStaff);

/**
 * @swagger
 * /staff/update/{id}:
 *   patch:
 *     summary: Update a staff member by ID (Admin only)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Staff updated successfully
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Internal server error
 */
router.patch("/update/:id", verifyToken, verifyAdmin,upload.single("file"), updateStaff);

/**
 * @swagger
 * /staff/delete/{id}:
 *   delete:
 *     summary: Delete a staff member by ID (Admin only)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff deleted successfully
 *       500:
 *         description: Internal server error
 */
router.delete("/delete/:id", verifyToken, verifyAdmin, deleteStaff);

/**
 * @swagger
 * /staff/getstaff/{id}:
 *   get:
 *     summary: Get a specific staff member by ID (Admin only)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff data retrieved successfully
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Internal server error
 */
router.get("/getstaff/:id", verifyToken, verifyAdmin, getStaffById);

/**
 * @swagger
 * /staff/regenerate-pin/{id}:
 *   get:
 *     summary: Regenerate PIN for a staff member (Admin only)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PIN regenerated successfully
 *       400:
 *         description: Staff not found
 *       500:
 *         description: Internal server error
 */
router.get("/regenerate-pin/:id", verifyToken, verifyAdmin, regeneratePin);

/**
 * @swagger
 * /staff/me:
 *   get:
 *     summary: Get performance data for the authenticated staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff performance data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Internal server error
 */
router.get("/me", verifyToken, verifyStaff, getStaffPerformance);

/**
 * @swagger
 * /staff/leaderboard:
 *   get:
 *     summary: Get staff leaderboard
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff leaderboard retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/leaderboard", verifyToken, verifyStaff, getStaffLeaderboard)

export default router;