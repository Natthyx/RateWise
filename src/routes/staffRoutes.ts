import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware";

const router = express.Router();


router.post("/create", verifyToken, verifyAdmin, (req, res) => {
    // only admin can create staff
    res.json({message: "Staff created successfully"})
})


export default router;