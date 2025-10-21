import express from 'express';
import { createSession, getSessionById,rateSession, getStaffSessions, verifySessionRating } from '../controllers/sessionController';
import { verifyToken, verifyStaff, verifyAdmin } from "../middleware/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Sessions
 *   description: Session management and rating endpoints
 */

/**
 * @swagger
 * /sessions/create:
 *   post:
 *     summary: Create a new session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *               totalAmount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Session created successfully
 *       400:
 *         description: Items and total amount are required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/create', verifyToken, verifyStaff, createSession);

/**
 * @swagger
 * /sessions/{sessionId}:
 *   get:
 *     summary: Get a specific session by ID
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.get('/:sessionId', verifyToken,verifyStaff, getSessionById);

/**
 * @swagger
 * /sessions/rate/{sessionId}:
 *   post:
 *     summary: Rate a session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
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
 *               staffRating:
 *                 type: number
 *               comment:
 *                 type: string
 *               itemRatings:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     serviceId:
 *                       type: string
 *                     subServiceId:
 *                       type: string
 *                     itemId:
 *                       type: string
 *                     rating:
 *                       type: number
 *     responses:
 *       200:
 *         description: Rating submitted successfully
 *       400:
 *         description: At least one rating is required or session already rated
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.post('/rate/:sessionId', verifyToken, verifyStaff, rateSession);

/**
 * @swagger
 * /sessions/{staffId}/all:
 *   get:
 *     summary: Get all sessions for a specific staff member
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of sessions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/:staffId/all", verifyToken, verifyStaff,getStaffSessions);

/**
 * @swagger
 * /sessions/{sessionId}/verify:
 *   post:
 *     summary: Verify a session rating (Admin only)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session rating verified by admin
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.post("/:sessionId/verify", verifyToken, verifyAdmin, verifySessionRating)

export default router;