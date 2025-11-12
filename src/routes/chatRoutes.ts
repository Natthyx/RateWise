import express from "express";
import multer from "multer";
import {
  getOrCreateChatRoom,
  getChatRooms,
  getMessages,
  sendMessage,
  sendImageMessage,
  markMessagesAsRead,
  getUnreadCount,
  getTotalUnreadCount,
  deleteMessage,
} from "../controllers/chatController";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware";
import { asyncMiddleware } from "../utils/asyncMiddleware";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Real-time chat endpoints for admin communication
 */

/**
 * @swagger
 * /chat/rooms:
 *   post:
 *     summary: Get or create a chat room between current user and another user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               otherUserId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chat room created or retrieved successfully
 *       400:
 *         description: otherUserId is required
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.post("/rooms", verifyToken, asyncMiddleware(verifyAdmin), getOrCreateChatRoom);

/**
 * @swagger
 * /chat/rooms:
 *   get:
 *     summary: Get all chat rooms for current user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of chat rooms
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.get("/rooms", verifyToken, asyncMiddleware(verifyAdmin), getChatRooms);

/**
 * @swagger
 * /chat/rooms/{chatRoomId}/messages:
 *   get:
 *     summary: Get messages in a chat room
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatRoomId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of messages
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized to view this chat
 *       404:
 *         description: Chat room not found
 *       500:
 *         description: Internal server error
 */
router.get("/rooms/:chatRoomId/messages", verifyToken, asyncMiddleware(verifyAdmin), getMessages);

/**
 * @swagger
 * /chat/rooms/{chatRoomId}/messages:
 *   post:
 *     summary: Send a text message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatRoomId
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
 *               text:
 *                 type: string
 *               senderName:
 *                 type: string
 *               senderAvatar:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Message text is required
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized to send messages in this chat
 *       404:
 *         description: Chat room not found
 *       500:
 *         description: Internal server error
 */
router.post("/rooms/:chatRoomId/messages", verifyToken, asyncMiddleware(verifyAdmin), sendMessage);

/**
 * @swagger
 * /chat/rooms/{chatRoomId}/messages/image:
 *   post:
 *     summary: Send an image message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatRoomId
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
 *               file:
 *                 type: string
 *                 format: binary
 *               senderName:
 *                 type: string
 *               senderAvatar:
 *                 type: string
 *     responses:
 *       201:
 *         description: Image message sent successfully
 *       400:
 *         description: Image file is required
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized to send messages in this chat
 *       404:
 *         description: Chat room not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/rooms/:chatRoomId/messages/image",
  verifyToken,
  asyncMiddleware(verifyAdmin),
  upload.single("file"),
  sendImageMessage
);

/**
 * @swagger
 * /chat/rooms/{chatRoomId}/read:
 *   patch:
 *     summary: Mark messages as read
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatRoomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.patch("/rooms/:chatRoomId/read", verifyToken, asyncMiddleware(verifyAdmin), markMessagesAsRead);

/**
 * @swagger
 * /chat/rooms/{chatRoomId}/unread:
 *   get:
 *     summary: Get unread message count
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatRoomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.get("/rooms/:chatRoomId/unread", verifyToken, asyncMiddleware(verifyAdmin), getUnreadCount);

/**
 * @swagger
 * /chat/unread/total:
 *   get:
 *     summary: Get total unread message count across all chats
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total unread count retrieved successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.get("/unread/total", verifyToken, asyncMiddleware(verifyAdmin), getTotalUnreadCount);

/**
 * @swagger
 * /chat/rooms/{chatRoomId}/messages/{messageId}:
 *   delete:
 *     summary: Delete a message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatRoomId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized to delete this message
 *       404:
 *         description: Message not found
 *       500:
 *         description: Internal server error
 */
router.delete("/rooms/:chatRoomId/messages/:messageId", verifyToken, asyncMiddleware(verifyAdmin), deleteMessage);

export default router;
