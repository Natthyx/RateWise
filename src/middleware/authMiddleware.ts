import {Request , Response, NextFunction} from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import admin from "../config/firebase";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;
const db = admin.firestore();

if (!JWT_SECRET){
    throw new Error("JWT_SECRET is not set in .env file");
}

//  Extend Express Request type to include 'user'

interface AuthenticatedRequest extends Request{
    user?: {
        userId: string;
        role: string;
    };
}

export const verifyToken = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try{
        // Expect header format: Authorization: Bearer <token>
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({ message: "No token provided"});
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as {
            userId:  string;
            role: string;
        }

        req.user = decoded;
        next();
    } catch(error) {
        return res.status(403).json({message: "Invalid or expired token"});
    }
};


// Restrict to admin-only routes
export const verifyAdmin = async (req: AuthenticatedRequest, res:Response, next: NextFunction) => {
    if (req.user?.role !== "admin" && req.user?.role !== "superadmin") {
        return res.status(403).json({message: "Access denied: admin only"});
    }
    
    // For superadmin, no subscription check needed
    if (req.user?.role === "superadmin") {
        return next();
    }
    
    // For regular admin, check subscription status
    try {
        // Get the admin's business
        const businessSnapshot = await db.collection("business").where("adminId", "==", req.user?.userId).get();
        
        if (businessSnapshot.empty) {
            return res.status(404).json({ error: "Business not found for this admin" });
        }
        
        const businessDoc = businessSnapshot.docs[0];
        const businessData = businessDoc.data();
        
        // Check if business has a subscription
        if (!businessData || !businessData.subscriptionId) {
            return res.status(402).json({ error: "No active subscription for this business" });
        }
        
        // Get subscription details
        const subscriptionDoc = await db.collection("subscriptions").doc(businessData.subscriptionId).get();
        
        if (!subscriptionDoc.exists) {
            return res.status(404).json({ error: "Subscription not found" });
        }
        
        const subscriptionData = subscriptionDoc.data();
        if (!subscriptionData) {
            return res.status(404).json({ error: "Subscription data not found" });
        }
        
        const now = new Date();
        const endDate = subscriptionData.endDate instanceof Date ? subscriptionData.endDate : new Date(subscriptionData.endDate);
        
        // If subscription is expired, only allow chat functionality
        if (now > endDate) {
            // Check if the request is for chat functionality
            const isChatRoute = req.path.startsWith('/chat');
            
            if (!isChatRoute) {
                return res.status(402).json({ 
                    error: "Subscription expired",
                    message: "Your subscription has expired. Only chat functionality is available until renewal."
                });
            }
        }
        
        next();
    } catch (error) {
        console.error("Admin subscription check error:", error);
        return res.status(500).json({ error: "Internal server error during subscription check" });
    }
};

export const verifySuperAdmin = (req: AuthenticatedRequest, res:Response, next: NextFunction) => {
    if (req.user?.role !== "superadmin") {
        return res.status(403).json({message: "Access denied: superadmin only"});
    }
    next();
};

// Restrict to staff-only routes
export const verifyStaff = (req: AuthenticatedRequest, res:Response, next: NextFunction) => {
    if (req.user?.role !== "staff") {
        return res.status(403).json({message: "Access denied: staff only"});
    }
    next();
};