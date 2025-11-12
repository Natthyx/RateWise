import admin from "../config/firebase";
import { Subscription } from "../models/subscriptionModel";
import { Timestamp } from "firebase-admin/firestore";

const db = admin.firestore();

// Function to check for expiring subscriptions and send notifications
export const checkExpiringSubscriptions = async (): Promise<void> => {
    try {
        console.log("Checking for expiring subscriptions...");
        
        // Get all active subscriptions
        const subscriptionsSnapshot = await db.collection("subscriptions")
            .where("status", "==", "active")
            .get();
        
        const now = new Date();
        let expiringCount = 0;
        
        for (const doc of subscriptionsSnapshot.docs) {
            const subscription = doc.data() as Subscription;
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
            
            // Check if subscription is expiring within 5 days
            const fiveDaysFromNow = new Date();
            fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
            
            if (now <= endDate && fiveDaysFromNow >= endDate) {
                console.log(`Subscription ${subscription.id} is expiring soon`);
                
                // Update subscription status to expiring_soon
                await db.collection("subscriptions").doc(subscription.id).update({
                    status: "expiring_soon",
                    updatedAt: Timestamp.fromDate(new Date())
                });
                
                // Send notification to admin (this would typically integrate with a notification service)
                await sendExpirationNotification(subscription.adminId, subscription.businessId, endDate);
                expiringCount++;
            }
        }
        
        console.log(`Checked ${subscriptionsSnapshot.docs.length} subscriptions. ${expiringCount} are expiring soon.`);
    } catch (error) {
        console.error("Error checking expiring subscriptions:", error);
    }
};

// Function to send expiration notification to admin
const sendExpirationNotification = async (adminId: string, businessId: string, expirationDate: Date): Promise<void> => {
    try {
        // In a real implementation, this would integrate with a notification service
        // For now, we'll just log the notification
        console.log(`Sending expiration notification to admin ${adminId} for business ${businessId}. Expiring on ${expirationDate}`);
        
        // Create a notification record in the database
        const notification = {
            id: `${adminId}_${Date.now()}`,
            adminId: adminId,
            businessId: businessId,
            type: "subscription_expiring",
            message: `Your subscription is expiring on ${expirationDate.toDateString()}. Please renew to continue using the service.`,
            read: false,
            createdAt: new Date()
        };
        
        await db.collection("notifications").doc(notification.id).set(notification);
    } catch (error) {
        console.error("Error sending expiration notification:", error);
    }
};

// Function to check for expired subscriptions
export const checkExpiredSubscriptions = async (): Promise<void> => {
    try {
        console.log("Checking for expired subscriptions...");
        
        // Get all active or expiring_soon subscriptions
        const subscriptionsSnapshot = await db.collection("subscriptions")
            .where("status", "in", ["active", "expiring_soon"])
            .get();
        
        const now = new Date();
        let expiredCount = 0;
        
        for (const doc of subscriptionsSnapshot.docs) {
            const subscription = doc.data() as Subscription;
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
            
            // Check if subscription has expired
            if (now > endDate) {
                console.log(`Subscription ${subscription.id} has expired`);
                
                // Update subscription status to expired
                await db.collection("subscriptions").doc(subscription.id).update({
                    status: "expired",
                    updatedAt: Timestamp.fromDate(new Date())
                });
                
                expiredCount++;
            }
        }
        
        console.log(`Checked ${subscriptionsSnapshot.docs.length} subscriptions. ${expiredCount} have expired.`);
    } catch (error) {
        console.error("Error checking expired subscriptions:", error);
    }
};