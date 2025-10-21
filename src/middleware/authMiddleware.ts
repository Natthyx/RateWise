import {Request , Response, NextFunction} from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

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
export const verifyAdmin = (req: AuthenticatedRequest, res:Response, next: NextFunction) => {
    if (req.user?.role !== "admin" && req.user?.role !== "superadmin") {
        return res.status(403).json({message: "Access denied: admin only"});
    }
    next();
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

