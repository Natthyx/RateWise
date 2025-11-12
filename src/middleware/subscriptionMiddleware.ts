import { Request, Response, NextFunction } from "express";
import admin from "../config/firebase";
import { Subscription } from "../models/subscriptionModel";

const db = admin.firestore();

// Middleware to check subscription status
export const checkSubscriptionStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.userId;
        const userRole = (req as any).user?.role;
        
        // Skip subscription check for superadmin
        if (userRole === "superadmin") {
            return next();
        }
        
        // For admin users, check their business subscription
        if (userRole === "admin") {
            // Get the admin's business
            const businessSnapshot = await db.collection("business").where("adminId", "==", userId).get();
            
            if (businessSnapshot.empty) {
                return res.status(404).json({ error: "Business not found for this admin" });
            }
            
            const businessDoc = businessSnapshot.docs[0];
            const businessData = businessDoc.data();
            
            // Check if business has a subscription
            if (!businessData.subscriptionId) {
                return res.status(402).json({ error: "No active subscription for this business" });
            }
            
            // Get subscription details
            const subscriptionDoc = await db.collection("subscriptions").doc(businessData.subscriptionId).get();
            
            if (!subscriptionDoc.exists) {
                return res.status(404).json({ error: "Subscription not found" });
            }
            
            const subscription = subscriptionDoc.data() as Subscription;
            
            // Check subscription status
            const now = new Date();
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
            
            // If subscription is expired
            if (now > endDate) {
                // Update subscription status to expired
                await db.collection("subscriptions").doc(subscription.id).update({
                    status: "expired",
                    updatedAt: new Date()
                });
                
                return res.status(402).json({ 
                    error: "Subscription expired",
                    message: "Your subscription has expired. Please renew to continue using the service."
                });
            }
            
            // Check if subscription is expiring soon (within 5 days)
            const fiveDaysFromNow = new Date();
            fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
            
            if (now <= endDate && fiveDaysFromNow >= endDate) {
                // Update subscription status to expiring_soon
                await db.collection("subscriptions").doc(subscription.id).update({
                    status: "expiring_soon",
                    updatedAt: new Date()
                });
                
                // Add notification flag to response
                (req as any).subscriptionExpiringSoon = true;
            }
            
            // Attach subscription info to request
            (req as any).subscription = subscription;
        }
        
        next();
    } catch (error: any) {
        console.error("Subscription check error:", error);
        res.status(500).json({ error: "Internal server error during subscription check" });
    }
};

// Helper function to check if subscription is active
export const isSubscriptionActive = async (businessId: string): Promise<boolean> => {
    try {
        const businessDoc = await db.collection("business").doc(businessId).get();
        
        if (!businessDoc.exists) {
            return false;
        }
        
        const businessData = businessDoc.data();
        
        if (!businessData || !businessData.subscriptionId) {
            return false;
        }
        
        const subscriptionDoc = await db.collection("subscriptions").doc(businessData.subscriptionId).get();
        
        if (!subscriptionDoc.exists) {
            return false;
        }
        
        const subscription = subscriptionDoc.data() as Subscription;
        const now = new Date();
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
        
        return now <= endDate;
    } catch (error) {
        console.error("Error checking subscription status:", error);
        return false;
    }
};