import express from "express";
import { verifyAdmin, verifyToken } from "../middleware/authMiddleware";
import {
  getTopItemsAnalytics,
  getTopServicesAnalytics,
  getTopStaffAnalytics,
  getTopSubServicesAnalytics,
} from "../controllers/analyticsController";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics endpoints for performance overview
 */

/**
 * @swagger
 * /analytics/top-staff:
 *   get:
 *     summary: Get top-performing staff
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of staff ranked by rating and review count
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/top-staff", verifyToken, verifyAdmin, getTopStaffAnalytics);

/**
 * @swagger
 * /analytics/top-services:
 *   get:
 *     summary: Get top-rated services
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of services sorted by rating and review count
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/top-services", verifyToken, verifyAdmin, getTopServicesAnalytics);

/**
 * @swagger
 * /analytics/top-subservices:
 *   get:
 *     summary: Get top-rated subservices
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subservices sorted by rating
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/top-subservices", verifyToken, verifyAdmin, getTopSubServicesAnalytics);

/**
 * @swagger
 * /analytics/top-items:
 *   get:
 *     summary: Get top-rated items
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of top-rated items by performance
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/top-items", verifyToken, verifyAdmin, getTopItemsAnalytics);

export default router;