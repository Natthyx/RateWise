import { Request, Response } from "express";
import admin from "../config/firebase";
import { uploadChatImage } from "../utils/uploadChatImage";

const db = admin.firestore();

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

/**
 * Get or create a chat room between two users
 */
export const getOrCreateChatRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const currentUserRole = req.user?.role;
    const { otherUserId } = req.body;

    if (!currentUserId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!otherUserId) {
      return res.status(400).json({ error: "otherUserId is required" });
    }

    // Get the other user's role from Firebase Auth
    const otherUser = await admin.auth().getUser(otherUserId);
    const otherUserRole = otherUser.customClaims?.role;

    // Enforce chat access rules:
    // - Super admin can chat with any admin
    // - Normal admin can only chat with super admin
    if (currentUserRole !== "superadmin" && otherUserRole !== "superadmin") {
      return res.status(403).json({ 
        error: "Normal admins can only chat with super admin" 
      });
    }

    // Sort user IDs to ensure consistent chatRoomId
    const members = [currentUserId, otherUserId].sort();
    const chatRoomId = members.join("_");

    // Check if chat room exists
    const chatRoomRef = db.collection("chats").doc(chatRoomId);
    const chatRoomDoc = await chatRoomRef.get();

    if (!chatRoomDoc.exists) {
      // Create new chat room
      await chatRoomRef.set({
        members,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessage: null,
        lastMessageTime: null,
      });
    }

    res.status(200).json({
      chatRoomId,
      members,
    });
  } catch (error: any) {
    console.error("Error getting/creating chat room:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all chat rooms for the current user
 */
export const getChatRooms = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const chatRoomsSnapshot = await db
      .collection("chats")
      .where("members", "array-contains", userId)
      .get();

    // Sort in JavaScript instead of Firestore to avoid needing a composite index
    const chatRooms = chatRoomsSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) => {
        const aTime = a.lastMessageTime?._seconds || 0;
        const bTime = b.lastMessageTime?._seconds || 0;
        return bTime - aTime; // Descending order (newest first)
      });

    res.status(200).json(chatRooms);
  } catch (error: any) {
    console.error("Error getting chat rooms:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get messages in a chat room
 */
export const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { chatRoomId } = req.params;
    const { limit = 50, before } = req.query;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify user is member of chat room
    const chatRoomRef = db.collection("chats").doc(chatRoomId);
    const chatRoomDoc = await chatRoomRef.get();

    if (!chatRoomDoc.exists) {
      return res.status(404).json({ error: "Chat room not found" });
    }

    const chatRoomData = chatRoomDoc.data();
    if (!chatRoomData?.members.includes(userId)) {
      return res.status(403).json({ error: "Not authorized to view this chat" });
    }

    // Get messages
    let messagesQuery = db
      .collection("chats")
      .doc(chatRoomId)
      .collection("messages")
      .orderBy("timestamp", "desc")
      .limit(Number(limit));

    if (before) {
      messagesQuery = messagesQuery.startAfter(before);
    }

    const messagesSnapshot = await messagesQuery.get();
    const messages = messagesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(messages.reverse());
  } catch (error: any) {
    console.error("Error getting messages:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Send a text message
 */
export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { chatRoomId } = req.params;
    const { text, senderName, senderAvatar } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!text) {
      return res.status(400).json({ error: "Message text is required" });
    }

    // Verify user is member of chat room
    const chatRoomRef = db.collection("chats").doc(chatRoomId);
    const chatRoomDoc = await chatRoomRef.get();

    if (!chatRoomDoc.exists) {
      return res.status(404).json({ error: "Chat room not found" });
    }

    const chatRoomData = chatRoomDoc.data();
    if (!chatRoomData?.members.includes(userId)) {
      return res.status(403).json({ error: "Not authorized to send messages in this chat" });
    }

    // Create message
    const messageData: any = {
      senderId: userId,
      senderName: senderName || 'Admin',
      text,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      type: "text",
    };
    
    // Only add senderAvatar if it's provided
    if (senderAvatar) {
      messageData.senderAvatar = senderAvatar;
    }
    
    const messageRef = await db
      .collection("chats")
      .doc(chatRoomId)
      .collection("messages")
      .add(messageData);

    // Update chat room last message
    await chatRoomRef.update({
      lastMessage: text,
      lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      id: messageRef.id,
      senderId: userId,
      text,
      type: "text",
    });
  } catch (error: any) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Send an image message
 */
export const sendImageMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { chatRoomId } = req.params;
    const { senderName, senderAvatar } = req.body;
    const file = req.file;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    // Verify user is member of chat room
    const chatRoomRef = db.collection("chats").doc(chatRoomId);
    const chatRoomDoc = await chatRoomRef.get();

    if (!chatRoomDoc.exists) {
      return res.status(404).json({ error: "Chat room not found" });
    }

    const chatRoomData = chatRoomDoc.data();
    if (!chatRoomData?.members.includes(userId)) {
      return res.status(403).json({ error: "Not authorized to send messages in this chat" });
    }

    // Upload image to Firebase Storage
    const imageUrl = await uploadChatImage(file, chatRoomId);

    // Create message
    const messageData: any = {
      senderId: userId,
      senderName: senderName || 'Admin',
      imageUrl,
      text: "📷 Image",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      type: "image",
    };
    
    // Only add senderAvatar if it's provided
    if (senderAvatar) {
      messageData.senderAvatar = senderAvatar;
    }
    
    const messageRef = await db
      .collection("chats")
      .doc(chatRoomId)
      .collection("messages")
      .add(messageData);

    // Update chat room last message
    await chatRoomRef.update({
      lastMessage: "📷 Image",
      lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      id: messageRef.id,
      senderId: userId,
      imageUrl,
      type: "image",
    });
  } catch (error: any) {
    console.error("Error sending image message:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { chatRoomId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Get unread messages (query only by 'read' to avoid composite index)
    const messagesSnapshot = await db
      .collection("chats")
      .doc(chatRoomId)
      .collection("messages")
      .where("read", "==", false)
      .get();

    // Filter messages sent by other users (in memory)
    const unreadMessages = messagesSnapshot.docs.filter(
      (doc) => doc.data().senderId !== userId
    );

    // Batch update only messages from other users
    const batch = db.batch();
    unreadMessages.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();

    res.status(200).json({
      success: true,
      markedAsRead: unreadMessages.length,
    });
  } catch (error: any) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { chatRoomId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Query only by 'read' field to avoid composite index requirement
    const messagesSnapshot = await db
      .collection("chats")
      .doc(chatRoomId)
      .collection("messages")
      .where("read", "==", false)
      .get();

    // Filter out messages sent by current user (in memory)
    const unreadMessages = messagesSnapshot.docs.filter(
      (doc) => doc.data().senderId !== userId
    );

    res.status(200).json({
      unreadCount: unreadMessages.length,
    });
  } catch (error: any) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get total unread message count across all chat rooms
 */
export const getTotalUnreadCount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Get all chat rooms for the user
    const chatRoomsSnapshot = await db
      .collection("chats")
      .where("members", "array-contains", userId)
      .get();

    let totalUnread = 0;

    // For each chat room, count unread messages
    for (const chatRoomDoc of chatRoomsSnapshot.docs) {
      // Query only by 'read' field to avoid composite index requirement
      const messagesSnapshot = await db
        .collection("chats")
        .doc(chatRoomDoc.id)
        .collection("messages")
        .where("read", "==", false)
        .get();

      // Filter out messages sent by current user (in memory)
      const unreadMessages = messagesSnapshot.docs.filter(
        (doc) => doc.data().senderId !== userId
      );

      totalUnread += unreadMessages.length;
    }

    res.status(200).json({
      totalUnreadCount: totalUnread,
    });
  } catch (error: any) {
    console.error("Error getting total unread count:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { chatRoomId, messageId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const messageRef = db
      .collection("chats")
      .doc(chatRoomId)
      .collection("messages")
      .doc(messageId);

    const messageDoc = await messageRef.get();

    if (!messageDoc.exists) {
      return res.status(404).json({ error: "Message not found" });
    }

    const messageData = messageDoc.data();
    
    // Only sender can delete their own message
    if (messageData?.senderId !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this message" });
    }

    // Soft delete
    await messageRef.update({
      deleted: true,
      text: "This message was deleted",
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: error.message });
  }
};
