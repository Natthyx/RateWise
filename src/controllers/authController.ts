import {Request , Response} from "express";
import { auth } from "../config/firebase";
import { generateToken } from "../utils/generateToken";
import axios from "axios";
import admin from "../config/firebase";

const db = admin.firestore();
// REGISTER ADMIN
export const registerAdmin = async (req: Request , res:Response) => {
    try{
        const {name, email, password, businessId} = req.body;

        if (!businessId) {
            return res.status(400).json({ error: "Business ID is required for admin registration" });
        }

        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name
        });

        // set role claim to admin
        await auth.setCustomUserClaims(userRecord.uid, {role: "admin"});
        
        
        const businessRef = db.collection("business").doc(businessId);
        const businessDoc = await businessRef.get();

        if (!businessDoc.exists) {
            return res.status(404).json({ error: "Business not found" });
        }

        // Update the service with this admin’s UID
        await businessRef.update({ adminId: userRecord.uid });

        res.status(201).json({
            message: `Admin registered successfully`,
            userId: userRecord.uid
        });
    } catch(error: any){
        // Handle specific Firebase auth errors
        if (error.code === 'auth/email-already-exists') {
            res.status(400).json({error: 'The email address is already in use by another account.'});
        } else if (error.code === 'auth/invalid-email') {
            res.status(400).json({error: 'The email address is invalid.'});
        } else if (error.code === 'auth/weak-password') {
            res.status(400).json({error: 'The password is too weak. It must be at least 6 characters.'});
        } else {
            res.status(500).json({error: error.message || 'An error occurred during registration.'});
        }
    }
};

// LOGIN ADMIN

export const loginAdmin = async (req: Request, res:Response) =>{
    try{
        const {email, password} = req.body;

        // Use Firebase REST API to sign in
        const response = await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
            {
                email,
                password,
                returnSecureToken: true
            }
        );

        const {localId} = response.data;
        const user = await auth.getUser(localId);

        const role = user.customClaims?.role;

        if (!role || (role !== "admin" && role !== "superadmin")){
            return res.status(403).json({ error: "Not authorized"});
        }

        const token = generateToken(localId, role);
        
        res.status(200).json({
            userId: localId,
            role,
            token,
            name: user.displayName || user.email?.split('@')[0] || 'Admin',
            email: user.email,
        });
    } catch (error: any) {
        res.status(500).json({error: "Invalid Credentials"});
    }
};


// LOGOUT ADMIN

export const logoutAdmin = async (req: Request, res: Response) => {
    try{
        //  No direct logout in Firebase - we just invalidate on client
        res.status(200).json({success: true, message: "Logout successful"});
    } catch (error: any) {
        res.status(500).json({error: error.message});}
};

// RESET PASSWORD

export const resetPassword = async (req: Request, res: Response) => {
    try{
        const {email} = req.body;

        await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${process.env.FIREBASE_API_KEY}`,
            {
                requestType: "PASSWORD_RESET",
                email
            }
        );

        res.status(200).json({success: true, message: "Reset email sent"});

    }catch (error: any){
        res.status(400).json({error: "Email not found"});
    }
}

export const loginStaff = async (req: Request, res:Response) => {
    try{
        const {pin} = req.body;

        if(!pin) return res.status(400).json({error: "PIN is required"});

        const snapshot = await db.collection("staff").where("pin", "==", pin).get();
        if (snapshot.empty) {
            return res.status(404).json({error: "Staff not found"});
        }
        const staff = snapshot.docs[0].data();
        
        // Check if staff's business subscription is active
        if (staff.businessId) {
            const businessDoc = await db.collection("business").doc(staff.businessId).get();
            
            if (businessDoc.exists) {
                const businessData = businessDoc.data();
                
                if (businessData && businessData.subscriptionId) {
                    const subscriptionDoc = await db.collection("subscriptions").doc(businessData.subscriptionId).get();
                    
                    if (subscriptionDoc.exists) {
                        const subscriptionData = subscriptionDoc.data();
                        if (subscriptionData) {
                            // If subscription is expired, prevent login
                            if (subscriptionData.status === "expired") {
                                return res.status(403).json({error: "Business subscription has expired. Please contact your administrator."});
                            }
                        }
                    }
                }
            }
        }

        //  Generate JWT token
        const token = generateToken(staff.id, "staff");


        return res.status(200).json({success: true, userId: staff.id, token, role: staff.role});
    } catch(error: any){
        res.status(500).json({error: error.message});

    }
}

// GET ALL ADMINS (Super Admin only)
export const getAllAdmins = async (req: Request, res: Response) => {
    try {
        // Get all businesses with their admin info
        const businessesSnapshot = await db.collection("business").get();
        const admins = [];

        for (const businessDoc of businessesSnapshot.docs) {
            const businessData = businessDoc.data();
            if (businessData.adminId) {
                try {
                    const adminUser = await auth.getUser(businessData.adminId);
                    const role = adminUser.customClaims?.role || 'admin';
                    admins.push({
                        id: adminUser.uid,
                        email: adminUser.email,
                        name: adminUser.displayName || 'No Name',
                        role: role,
                        businessId: businessDoc.id,
                        businessName: businessData.name,
                        createdAt: adminUser.metadata.creationTime,
                    });
                } catch (error) {
                    console.error(`Error fetching admin ${businessData.adminId}:`, error);
                }
            }
        }

        res.status(200).json(admins);
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
};

// UPDATE ADMIN (Super Admin only)
export const updateAdmin = async (req: Request, res: Response) => {
    try {
        const { adminId } = req.params;
        const { name, email, businessId } = req.body;

        // Update Firebase user
        const updateData: any = {};
        if (name) updateData.displayName = name;
        if (email) updateData.email = email;

        await auth.updateUser(adminId, updateData);

        // If businessId is provided, update the business assignment
        if (businessId) {
            // Remove admin from old business
            const oldBusinessSnapshot = await db.collection("business").where("adminId", "==", adminId).get();
            for (const doc of oldBusinessSnapshot.docs) {
                await doc.ref.update({ adminId: null });
            }

            // Assign admin to new business
            const businessRef = db.collection("business").doc(businessId);
            const businessDoc = await businessRef.get();
            
            if (!businessDoc.exists) {
                return res.status(404).json({ error: "Business not found" });
            }

            await businessRef.update({ adminId });
        }

        res.status(200).json({ message: "Admin updated successfully" });
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
};

// DELETE ADMIN (Super Admin only)
export const deleteAdmin = async (req: Request, res: Response) => {
    try {
        const { adminId } = req.params;

        // Remove admin from business
        const businessSnapshot = await db.collection("business").where("adminId", "==", adminId).get();
        for (const doc of businessSnapshot.docs) {
            await doc.ref.update({ adminId: null });
        }

        // Delete Firebase user
        await auth.deleteUser(adminId);

        res.status(200).json({ message: "Admin deleted successfully" });
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
};

// UPDATE MY PROFILE (Admin or Superadmin)
interface AuthenticatedRequest extends Request {
  user?: { userId: string; role: string };
}

export const updateMyProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !(role === "admin" || role === "superadmin")) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { name, email, password } = req.body as { name?: string; email?: string; password?: string };

    const updateData: any = {};
    if (name) updateData.displayName = name;
    if (email) updateData.email = email;
    if (password) updateData.password = password;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No fields provided to update" });
    }

    const updated = await auth.updateUser(userId, updateData);

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updated.uid,
        name: updated.displayName || null,
        email: updated.email || null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};