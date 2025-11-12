import express from "express";
import multer from "multer";
import {
  submitPaymentReceipt,
  getAdminSubscription,
  getAllSubscriptions,
  approveSubscriptionPayment,
  rejectSubscriptionPayment,
  createSubscription,
  getPendingSubscriptions,
  setSubscriptionToExpireSoon,
  expireSubscriptionNow,
  editSubscription,
  unsubscribeBusiness,
  refreshSubscriptionStatus
} from "../controllers/subscriptionController";
import { verifyToken, verifyAdmin, verifySuperAdmin } from "../middleware/authMiddleware";
import { asyncMiddleware } from "../utils/asyncMiddleware";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Subscription management endpoints
 */

/**
 * @swagger
 * /subscription/submit-payment:
 *   post:
 *     summary: Submit payment receipt for subscription (Admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               paymentDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Payment receipt submitted successfully
 *       400:
 *         description: File or payment date is required
 *       401:
 *         description: Admin authentication required
 *       404:
 *         description: Business or subscription not found
 *       500:
 *         description: Internal server error
 */
router.post("/submit-payment", verifyToken, asyncMiddleware(verifyAdmin), upload.single("file"), submitPaymentReceipt);

/**
 * @swagger
 * /subscription/my-subscription:
 *   get:
 *     summary: Get subscription details for admin (Admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription details retrieved successfully
 *       401:
 *         description: Admin authentication required
 *       404:
 *         description: Business or subscription not found
 *       500:
 *         description: Internal server error
 */
router.get("/my-subscription", verifyToken, asyncMiddleware(verifyAdmin), getAdminSubscription);

/**
 * @swagger
 * /subscription/refresh-status:
 *   post:
 *     summary: Refresh subscription status for admin
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription status refreshed successfully
 *       401:
 *         description: Admin authentication required
 *       404:
 *         description: Business or subscription not found
 *       500:
 *         description: Internal server error
 */
router.post("/refresh-status", verifyToken, asyncMiddleware(verifyAdmin), refreshSubscriptionStatus);

/**
 * @swagger
 * /subscription/all:
 *   get:
 *     summary: Get all subscriptions (Super Admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all subscriptions
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get("/all", verifyToken, verifySuperAdmin, getAllSubscriptions);

/**
 * @swagger
 * /subscription/pending:
 *   get:
 *     summary: Get subscriptions pending payment verification (Super Admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subscriptions pending payment verification
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get("/pending", verifyToken, verifySuperAdmin, getPendingSubscriptions);

/**
 * @swagger
 * /subscription/{subscriptionId}/expire-soon:
 *   patch:
 *     summary: DEV ONLY - Set subscription to expire in 5 days (Super Admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscription set to expire in 5 days
 *       400:
 *         description: Subscription ID is required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Subscription not found or endpoint not available in production
 *       500:
 *         description: Internal server error
 */
router.patch("/:subscriptionId/expire-soon", verifyToken, verifySuperAdmin, setSubscriptionToExpireSoon);

/**
 * @swagger
 * /subscription/{subscriptionId}/expire-now:
 *   patch:
 *     summary: DEV ONLY - Expire subscription immediately (Super Admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscription expired immediately
 *       400:
 *         description: Subscription ID is required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Subscription not found or endpoint not available in production
 *       500:
 *         description: Internal server error
 */
router.patch("/:subscriptionId/expire-now", verifyToken, verifySuperAdmin, expireSubscriptionNow);

/**
 * @swagger
 * /subscription/{subscriptionId}/edit:
 *   patch:
 *     summary: Edit subscription plan (Super Admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
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
 *               planType:
 *                 type: string
 *                 enum: [monthly, 6month, yearly]
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 *       400:
 *         description: Subscription ID is required or invalid plan type
 *       403:
 *         description: Access denied
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:subscriptionId/edit", verifyToken, verifySuperAdmin, editSubscription);

/**
 * @swagger
 * /subscription/{subscriptionId}/unsubscribe:
 *   delete:
 *     summary: Unsubscribe business (Super Admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Business unsubscribed successfully
 *       400:
 *         description: Subscription ID is required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:subscriptionId/unsubscribe", verifyToken, verifySuperAdmin, unsubscribeBusiness);

/**
 * @swagger
 * /subscription/approve/{subscriptionId}:
 *   patch:
 *     summary: Approve subscription payment (Super Admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
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
 *               planType:
 *                 type: string
 *                 enum: [monthly, 6month, yearly]
 *     responses:
 *       200:
 *         description: Subscription payment approved successfully
 *       400:
 *         description: Subscription ID is required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Internal server error
 */
router.patch("/approve/:subscriptionId", verifyToken, verifySuperAdmin, approveSubscriptionPayment);

/**
 * @swagger
 * /subscription/reject/{subscriptionId}:
 *   patch:
 *     summary: Reject subscription payment (Super Admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscription payment rejected successfully
 *       400:
 *         description: Subscription ID is required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Internal server error
 */
router.patch("/reject/:subscriptionId", verifyToken, verifySuperAdmin, rejectSubscriptionPayment);

/**
 * @swagger
 * /subscription/create:
 *   post:
 *     summary: Create subscription (Super Admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessId:
 *                 type: string
 *               adminId:
 *                 type: string
 *               planType:
 *                 type: string
 *                 enum: [monthly, 6month, yearly]
 *     responses:
 *       201:
 *         description: Subscription created successfully
 *       400:
 *         description: Missing required fields or business already has subscription
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post("/create", verifyToken, verifySuperAdmin, createSubscription);

export default router;