import {Request , Response} from "express";
import { auth } from "../config/firebase";
import { generateToken } from "../utils/generateToken";
import axios from "axios";
// import dotenv from "dotenv";

// REGISTER ADMIN
export const registerAdmin = async (req: Request , res:Response) => {
    try{
        const {name, email, password, role} = req.body;

        if (!["admin","staff"].includes(role)) {
            return res.status(400).json({error: "Invalid role"});
        }

        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name
        });

        // set role claim to admin
        await auth.setCustomUserClaims(userRecord.uid, {role});

        res.status(201).json({
            message: `${role} registered successfully`,
            userId: userRecord.uid
        });
    } catch(error: any){
        res.status(500).json({error: error.message});
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