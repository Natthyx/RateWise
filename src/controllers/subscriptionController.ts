import { Request, Response } from "express";
import admin from "../config/firebase";
import { v4 as uuidv4 } from "uuid";
import { Subscription } from "../models/subscriptionModel";
import { uploadToStorage } from "../utils/uploadToStorage";
import { Timestamp } from "firebase-admin/firestore";

const db = admin.firestore();
const storage = admin.storage();

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

// Helper function to fix storage URLs
// const fixStorageUrl = (url: string | undefined): string | undefined => {
//     if (!url) return url;
    
//     // Fix URLs that use the wrong appspot.com format
//     if (url.includes('firebasestorage.app')) {
//         return url.replace('firebasestorage.app', 'appspot.com');
//     }
    
//     return url;
// };

// Refresh subscription status
export const refreshSubscriptionStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    
    if (!userId || userRole !== "admin") {
      return res.status(401).json({ error: "Admin authentication required" });
    }
    
    // Get the admin's business
    const businessSnapshot = await db.collection("business").where("adminId", "==", userId).get();
    
    if (businessSnapshot.empty) {
      return res.status(404).json({ error: "Business not found for this admin" });
    }
    
    const businessDoc = businessSnapshot.docs[0];
    const businessData = businessDoc.data();
    
    // Check if business has a subscription
    if (!businessData.subscriptionId) {
      return res.status(404).json({ error: "No subscription found for this business" });
    }
    
    // Get subscription details
    const subscriptionDoc = await db.collection("subscriptions").doc(businessData.subscriptionId).get();
    
    if (!subscriptionDoc.exists) {
      return res.status(404).json({ error: "Subscription not found" });
    }
    
    const subscription = subscriptionDoc.data() as Subscription;
    
    // Convert Firestore Timestamp to Date if needed
    let endDate: Date;
    if (subscription.endDate instanceof Date) {
      endDate = subscription.endDate;
    } else if (subscription.endDate && typeof (subscription.endDate as any).toDate === 'function') {
      // This is a Firestore Timestamp
      endDate = (subscription.endDate as any).toDate();
    } else {
      // Fallback to creating a new Date
      endDate = new Date();
    }
    
    // Check if subscription status needs to be updated
    const now = new Date();
    let updatedStatus = subscription.status;
    let shouldUpdate = false;
    
    // If subscription is active, check if it should be expired or expiring soon
    if (subscription.status === "active") {
      // Check if subscription has expired
      if (endDate < now) {
        updatedStatus = "expired";
        shouldUpdate = true;
      } 
      // Check if subscription is expiring soon (within 7 days)
      else if (endDate.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000) {
        updatedStatus = "expiring_soon";
        shouldUpdate = true;
      }
    }
    
    // Update subscription status if needed
    if (shouldUpdate) {
      await db.collection("subscriptions").doc(businessData.subscriptionId).update({
        status: updatedStatus,
        updatedAt: Timestamp.fromDate(new Date())
      });
      
      // Return updated subscription
      const updatedSubscription = {
        ...subscription,
        status: updatedStatus
      };
      
      res.status(200).json({ 
        message: "Subscription status refreshed",
        subscription: updatedSubscription
      });
    } else {
      // Return current subscription as is
      res.status(200).json({ 
        message: "Subscription status refreshed",
        subscription: subscription
      });
    }
  } catch (error: any) {
    console.error("Error refreshing subscription status:", error);
    res.status(500).json({ error: error.message });
  }
};

// Submit payment receipt for subscription
export const submitPaymentReceipt = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { paymentDate } = req.body;
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ error: "Payment receipt image is required" });
        }
        
        if (!paymentDate) {
            return res.status(400).json({ error: "Payment date is required" });
        }
        
        const adminId = req.user?.userId;
        
        if (!adminId) {
            return res.status(401).json({ error: "Admin authentication required" });
        }
        
        // Get the admin's business
        const businessSnapshot = await db.collection("business").where("adminId", "==", adminId).get();
        
        if (businessSnapshot.empty) {
            return res.status(404).json({ error: "Admin's business not found" });
        }
        
        const businessDoc = businessSnapshot.docs[0];
        const businessData = businessDoc.data();
        
        // Check if business has a subscription
        if (!businessData.subscriptionId) {
            return res.status(404).json({ error: "No subscription found for this business" });
        }
        
        // Get subscription details
        const subscriptionDoc = await db.collection("subscriptions").doc(businessData.subscriptionId).get();
        
        if (!subscriptionDoc.exists) {
            return res.status(404).json({ error: "Subscription not found" });
        }
        
        const subscription = subscriptionDoc.data() as Subscription;
        
        // Upload receipt image
        const receiptImageUrl = await uploadToStorage(file, `payment_screenshots/${subscription.id}_${Date.now()}`);
        
        // Update subscription with payment details
        await db.collection("subscriptions").doc(subscription.id).update({
            status: "payment_submitted",
            receiptImageUrl: receiptImageUrl,
            paymentDate: Timestamp.fromDate(new Date(paymentDate)),
            updatedAt: Timestamp.fromDate(new Date())
        });
        
        res.status(200).json({ 
            message: "Payment receipt submitted successfully", 
            receiptImageUrl: receiptImageUrl 
        });
    } catch (error: any) {
        console.error("Error submitting payment receipt:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get subscription details for admin
export const getAdminSubscription = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const adminId = req.user?.userId;
        
        if (!adminId) {
            return res.status(401).json({ error: "Admin authentication required" });
        }
        
        // Get the admin's business
        const businessSnapshot = await db.collection("business").where("adminId", "==", adminId).get();
        
        if (businessSnapshot.empty) {
            return res.status(404).json({ error: "Admin's business not found" });
        }
        
        const businessDoc = businessSnapshot.docs[0];
        const businessData = businessDoc.data();
        
        // Check if business has a subscription
        if (!businessData.subscriptionId) {
            return res.status(404).json({ error: "No subscription found for this business" });
        }
        
        // Get subscription details
        const subscriptionDoc = await db.collection("subscriptions").doc(businessData.subscriptionId).get();
        
        if (!subscriptionDoc.exists) {
            return res.status(404).json({ error: "Subscription not found" });
        }
        
        const subscription = subscriptionDoc.data() as Subscription;
        
        res.status(200).json({
            subscription: {
                id: subscription.id,
                planType: subscription.planType,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                status: subscription.status,
                receiptImageUrl: subscription.receiptImageUrl,
                paymentDate: subscription.paymentDate,
                createdAt: subscription.createdAt,
                updatedAt: subscription.updatedAt
            }
        });
    } catch (error: any) {
        console.error("Error getting subscription details:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get all subscriptions for superadmin
export const getAllSubscriptions = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const adminId = req.user?.userId;
        const role = req.user?.role;
        
        // Only superadmin can access this
        if (role !== "superadmin") {
            return res.status(403).json({ error: "Access denied: superadmin only" });
        }
        
        // Get all subscriptions
        const subscriptionsSnapshot = await db.collection("subscriptions").get();
        const subscriptions = [];
        
        for (const doc of subscriptionsSnapshot.docs) {
            const subscription = doc.data() as Subscription;
            
            // Get business name
            let businessName = "Unknown Business";
            try {
                const businessDoc = await db.collection("business").doc(subscription.businessId).get();
                if (businessDoc.exists) {
                    businessName = businessDoc.data()?.name || businessName;
                }
            } catch (error) {
                console.error("Error getting business name:", error);
            }
            
            // Get admin name
            let adminName = "Unknown Admin";
            try {
                const adminUser = await admin.auth().getUser(subscription.adminId);
                adminName = adminUser.displayName || adminUser.email || adminName;
            } catch (error) {
                console.error("Error getting admin name:", error);
            }
            
            subscriptions.push({
                ...subscription,
                receiptImageUrl: subscription.receiptImageUrl,
                businessName,
                adminName
            });
        }
        
        res.status(200).json({ subscriptions });
    } catch (error: any) {
        console.error("Error getting all subscriptions:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get subscriptions pending payment verification for superadmin
export const getPendingSubscriptions = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const role = req.user?.role;
        
        // Only superadmin can access this
        if (role !== "superadmin") {
            return res.status(403).json({ error: "Access denied: superadmin only" });
        }
        
        // Get subscriptions with payment_submitted status
        const subscriptionsSnapshot = await db.collection("subscriptions").where("status", "==", "payment_submitted").get();
        const subscriptions = [];
        
        for (const doc of subscriptionsSnapshot.docs) {
            const subscription = doc.data() as Subscription;
            
            // Get business name
            let businessName = "Unknown Business";
            try {
                const businessDoc = await db.collection("business").doc(subscription.businessId).get();
                if (businessDoc.exists) {
                    businessName = businessDoc.data()?.name || businessName;
                }
            } catch (error) {
                console.error("Error getting business name:", error);
            }
            
            // Get admin name
            let adminName = "Unknown Admin";
            try {
                const adminUser = await admin.auth().getUser(subscription.adminId);
                adminName = adminUser.displayName || adminUser.email || adminName;
            } catch (error) {
                console.error("Error getting admin name:", error);
            }
            
            subscriptions.push({
                ...subscription,
                receiptImageUrl: subscription.receiptImageUrl,
                businessName,
                adminName
            });
        }
        
        res.status(200).json({ subscriptions });
    } catch (error: any) {
        console.error("Error getting pending subscriptions:", error);
        res.status(500).json({ error: error.message });
    }
};

// Approve subscription payment
export const approveSubscriptionPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { subscriptionId } = req.params;
        const { planType } = req.body;
        const role = req.user?.role;
        
        // Only superadmin can access this
        if (role !== "superadmin") {
            return res.status(403).json({ error: "Access denied: superadmin only" });
        }
        
        if (!subscriptionId) {
            return res.status(400).json({ error: "Subscription ID is required" });
        }
        
        // Get subscription details
        const subscriptionDoc = await db.collection("subscriptions").doc(subscriptionId).get();
        
        if (!subscriptionDoc.exists) {
            return res.status(404).json({ error: "Subscription not found" });
        }
        
        const subscription = subscriptionDoc.data() as Subscription;
        
        // Calculate new end date based on plan type
        const startDate = new Date();
        const plan: 'monthly' | '6month' | 'yearly' = planType || subscription.planType;
        const endDate = calculateEndDate(startDate, plan);
        
        // Update subscription
        await db.collection("subscriptions").doc(subscriptionId).update({
            status: "active",
            planType: plan,
            startDate: startDate,
            endDate: endDate,
            updatedAt: new Date()
        });
        
        // Send notification to admin about successful renewal
        // TODO: Implement notification system
        
        res.status(200).json({ 
            message: "Subscription payment approved successfully",
            subscriptionId: subscriptionId
        });
    } catch (error: any) {
        console.error("Error approving subscription payment:", error);
        res.status(500).json({ error: error.message });
    }
};

// Reject subscription payment
export const rejectSubscriptionPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { subscriptionId } = req.params;
        const role = req.user?.role;
        
        // Only superadmin can access this
        if (role !== "superadmin") {
            return res.status(403).json({ error: "Access denied: superadmin only" });
        }
        
        if (!subscriptionId) {
            return res.status(400).json({ error: "Subscription ID is required" });
        }
        
        // Get subscription details
        const subscriptionDoc = await db.collection("subscriptions").doc(subscriptionId).get();
        
        if (!subscriptionDoc.exists) {
            return res.status(404).json({ error: "Subscription not found" });
        }
        
        // Update subscription status to rejected
        await db.collection("subscriptions").doc(subscriptionId).update({
            status: "payment_rejected",
            updatedAt: new Date()
        });
        
        // Send notification to admin about rejection
        // TODO: Implement notification system
        
        res.status(200).json({ 
            message: "Subscription payment rejected successfully",
            subscriptionId: subscriptionId
        });
    } catch (error: any) {
        console.error("Error rejecting subscription payment:", error);
        res.status(500).json({ error: error.message });
    }
};

// Create subscription (Superadmin only)
export const createSubscription = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { businessId, adminId, planType } = req.body;
        const role = req.user?.role;
        
        // Only superadmin can access this
        if (role !== "superadmin") {
            return res.status(403).json({ error: "Access denied: superadmin only" });
        }
        
        if (!businessId || !adminId || !planType) {
            return res.status(400).json({ error: "Business ID, Admin ID, and Plan Type are required" });
        }
        
        // Validate plan type
        if (!['monthly', '6month', 'yearly'].includes(planType)) {
            return res.status(400).json({ error: "Invalid plan type" });
        }
        
        // Check if business already has a subscription
        const existingSubscription = await db.collection("subscriptions").where("businessId", "==", businessId).get();
        if (!existingSubscription.empty) {
            return res.status(400).json({ error: "Business already has a subscription" });
        }
        
        // Create subscription
        const startDate = new Date();
        const endDate = calculateEndDate(startDate, planType as 'monthly' | '6month' | 'yearly');
        
        const newSubscription: Subscription = {
            id: uuidv4(),
            businessId: businessId,
            adminId: adminId,
            planType: planType as 'monthly' | '6month' | 'yearly',
            startDate: Timestamp.fromDate(startDate),
            endDate: Timestamp.fromDate(endDate),
            status: "active",
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
        };
        
        await db.collection("subscriptions").doc(newSubscription.id).set(newSubscription);
        
        // Update business with subscription ID
        await db.collection("business").doc(businessId).update({
            subscriptionId: newSubscription.id
        });
        
        res.status(201).json({ 
            message: "Subscription created successfully",
            subscription: newSubscription
        });
    } catch (error: any) {
        console.error("Error creating subscription:", error);
        res.status(500).json({ error: error.message });
    }
};

// Helper function to calculate subscription end date
function calculateEndDate(startDate: Date, planType: 'monthly' | '6month' | 'yearly'): Date {
    const endDate = new Date(startDate);
    switch (planType) {
        case 'monthly':
            endDate.setMonth(endDate.getMonth() + 1);
            break;
        case '6month':
            endDate.setMonth(endDate.getMonth() + 6);
            break;
        case 'yearly':
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
    }
    return endDate;
}

// DEV ONLY: Set subscription to expire in 5 days (for testing)
export const setSubscriptionToExpireSoon = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Only available in development mode
        if (process.env.NODE_ENV === 'production') {
            return res.status(404).json({ error: 'Endpoint not found' });
        }
        
        const { subscriptionId } = req.params;
        const role = req.user?.role;
        
        // Only superadmin can access this
        if (role !== "superadmin") {
            return res.status(403).json({ error: "Access denied: superadmin only" });
        }
        
        if (!subscriptionId) {
            return res.status(400).json({ error: "Subscription ID is required" });
        }
        
        // Get subscription details
        const subscriptionDoc = await db.collection("subscriptions").doc(subscriptionId).get();
        
        if (!subscriptionDoc.exists) {
            return res.status(404).json({ error: "Subscription not found" });
        }
        
        const subscription = subscriptionDoc.data() as Subscription;
        
        // Set end date to 5 days from now
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 5);
        
        // Update subscription
        await db.collection("subscriptions").doc(subscriptionId).update({
            endDate: Timestamp.fromDate(endDate),
            status: "expiring_soon",
            updatedAt: Timestamp.fromDate(new Date())
        });
        
        res.status(200).json({ 
            message: "Subscription set to expire in 5 days",
            subscriptionId: subscriptionId
        });
    } catch (error: any) {
        console.error("Error setting subscription to expire soon:", error);
        res.status(500).json({ error: error.message });
    }
};

// DEV ONLY: Expire subscription immediately (for testing)
export const expireSubscriptionNow = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Only available in development mode
        if (process.env.NODE_ENV === 'production') {
            return res.status(404).json({ error: 'Endpoint not found' });
        }
        
        const { subscriptionId } = req.params;
        const role = req.user?.role;
        
        // Only superadmin can access this
        if (role !== "superadmin") {
            return res.status(403).json({ error: "Access denied: superadmin only" });
        }
        
        if (!subscriptionId) {
            return res.status(400).json({ error: "Subscription ID is required" });
        }
        
        // Get subscription details
        const subscriptionDoc = await db.collection("subscriptions").doc(subscriptionId).get();
        
        if (!subscriptionDoc.exists) {
            return res.status(404).json({ error: "Subscription not found" });
        }
        
        // Set end date to past date
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 1);
        
        // Update subscription
        await db.collection("subscriptions").doc(subscriptionId).update({
            endDate: Timestamp.fromDate(endDate),
            status: "expired",
            updatedAt: Timestamp.fromDate(new Date())
        });
        
        res.status(200).json({ 
            message: "Subscription expired immediately",
            subscriptionId: subscriptionId
        });
    } catch (error: any) {
        console.error("Error expiring subscription:", error);
        res.status(500).json({ error: error.message });
    }
};

// Edit subscription plan (Super Admin only)
export const editSubscription = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { subscriptionId } = req.params;
        const { planType } = req.body;
        const role = req.user?.role;
        
        // Only superadmin can access this
        if (role !== "superadmin") {
            return res.status(403).json({ error: "Access denied: superadmin only" });
        }
        
        if (!subscriptionId) {
            return res.status(400).json({ error: "Subscription ID is required" });
        }
        
        // Validate plan type
        if (!['monthly', '6month', 'yearly'].includes(planType)) {
            return res.status(400).json({ error: "Invalid plan type" });
        }
        
        // Get subscription details
        const subscriptionDoc = await db.collection("subscriptions").doc(subscriptionId).get();
        
        if (!subscriptionDoc.exists) {
            return res.status(404).json({ error: "Subscription not found" });
        }
        
        const subscription = subscriptionDoc.data() as Subscription;
        
        // Calculate new end date based on current start date and new plan type
        // Convert Firestore Timestamp to Date if needed
        let startDate: Date;
        if (subscription.startDate instanceof Date) {
            startDate = subscription.startDate;
        } else if (subscription.startDate && typeof (subscription.startDate as any).toDate === 'function') {
            // This is a Firestore Timestamp
            startDate = (subscription.startDate as any).toDate();
        } else {
            // Fallback to creating a new Date
            startDate = new Date();
        }
        const endDate = calculateEndDate(startDate, planType as 'monthly' | '6month' | 'yearly');
        
        // Update subscription
        await db.collection("subscriptions").doc(subscriptionId).update({
            planType: planType as 'monthly' | '6month' | 'yearly',
            endDate: Timestamp.fromDate(endDate),
            updatedAt: Timestamp.fromDate(new Date())
        });
        
        res.status(200).json({ 
            message: "Subscription updated successfully",
            subscriptionId: subscriptionId
        });
    } catch (error: any) {
        console.error("Error editing subscription:", error);
        res.status(500).json({ error: error.message });
    }
};

// Unsubscribe business (Super Admin only)
export const unsubscribeBusiness = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { subscriptionId } = req.params;
        const role = req.user?.role;
        
        // Only superadmin can access this
        if (role !== "superadmin") {
            return res.status(403).json({ error: "Access denied: superadmin only" });
        }
        
        if (!subscriptionId) {
            return res.status(400).json({ error: "Subscription ID is required" });
        }
        
        // Get subscription details
        const subscriptionDoc = await db.collection("subscriptions").doc(subscriptionId).get();
        
        if (!subscriptionDoc.exists) {
            return res.status(404).json({ error: "Subscription not found" });
        }
        
        // Delete subscription
        await db.collection("subscriptions").doc(subscriptionId).delete();
        
        // Remove subscription ID from business
        const subscription = subscriptionDoc.data() as Subscription;
        await db.collection("business").doc(subscription.businessId).update({
            subscriptionId: null
        });
        
        res.status(200).json({ 
            message: "Business unsubscribed successfully",
            subscriptionId: subscriptionId
        });
    } catch (error: any) {
        console.error("Error unsubscribing business:", error);
        res.status(500).json({ error: error.message });
    }
};