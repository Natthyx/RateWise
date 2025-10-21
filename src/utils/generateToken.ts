import jwt from 'jsonwebtoken';
import dotenv from "dotenv";

dotenv.config();

export const generateToken = (uid : string, role: string) => {
    return jwt.sign({userId:uid,role} , process.env.JWT_SECRET || "secretkey", 
        {expiresIn: '7d',
        });
};