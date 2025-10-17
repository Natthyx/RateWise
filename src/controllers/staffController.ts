import { Request, Response} from "express";
import {auth} from "../config/firebase";
import admin from "../config/firebase";
import { uploadToStorage } from "../utils/uploadToStorage";
import {v4 as uuidv4} from 'uuid';

const db = admin.firestore();

//Helper: generate 4-digit PIN

async function generateUniquePin(): Promise<string> {
  let newPin: string;
  let exists = true;

  do{
    newPin = Math.floor(1000 + Math.random() * 9000).toString();

    // Check Firestore if this PIN already exists
    const query = await db.collection("staff").where("pin","==",newPin).get();
    exists = !query.empty;
  } while(exists);

  return newPin;
}

// Create Staff

export const createStaff = async (req: Request, res: Response) => {
    try{
        const {name, email} = req.body;
        const file = req.file;

        if (!name || !email) {
            return res.status(400).json({error: "Name and email are required"});

        }

        if (!file)
            return res.status(400).json({error: "Avatar image is required"});
        
        const pin = generateUniquePin();

        const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase();

        const firebasePassword = pin + initials;
        
        //  Create user in firebase auth
        
        const userrecord = await auth.createUser({
            email,
            password: firebasePassword,
            displayName: name,
        });
        
        // Set firebase custom claim
        await auth.setCustomUserClaims(userrecord.uid, {role: "staff"});
        
        let avatarUrl: string;

        if (file){
            // upload provided avatar
            avatarUrl = await uploadToStorage(file, userrecord.uid);
        }
        else{
            // Generate default avatar with initials
            avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=128`;
    }
        
        // Save staff record in Firestore

        const staffDoc = {
            id: userrecord.uid,
            name,
            email,
            pin,
            avatar: avatarUrl,
            role: "staff",
            rating: 0,
            reviewCount: 0,
            createdAt: new Date().toISOString(),
        }

        await db.collection("staff").doc(userrecord.uid).set(staffDoc);

        res.status(201).json({
            message: "Staff created successfully",
            staff: staffDoc,
        });

    } catch(error: any){
        res.status(500).json({error: error.message});
    }
};

// Get All Staff
export const getAllStaff = async ( req: Request, res:Response) => {
    try{
        const snapshot = await db.collection("staff").orderBy("name").get();
        const staffList = snapshot.docs.map((doc) => doc.data());
        res.status(200).json(staffList);
    } catch (error: any){
        res.status(500).json({error: error.message});

    }
}

// Update Staff

export const updateStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const file = req.file;

    // Fetch the existing staff record to get their name
    const staffDocRef = db.collection("staff").doc(id);
    const staffSnapshot = await staffDocRef.get();

    if (!staffSnapshot.exists) {
      return res.status(404).json({ error: "Staff not found" });
    }

    const staffData = staffSnapshot.data();
    const name = updates.name || staffData?.name || "NN"; // fallback if name not provided
    const initials = name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase();

    // Handle avatar update
    let avatarUrl: string | undefined;

    if (file) {
      // New avatar uploaded
      avatarUrl = await uploadToStorage(file, id);
    } else if (updates.avatar === null || updates.avatar === "remove") {
      // Explicit request to remove avatar
      avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        initials
      )}&background=random&color=fff&size=128`;
    }

    // If we have a new avatar URL, add it to updates under 'avatar' to match interface
    if (avatarUrl) {
      updates.avatar = avatarUrl;
    }

    // Remove any temporary avatar keys to prevent conflicts
    delete updates.avatarTemp;
    delete updates.avatarUrl;

    await staffDocRef.update(updates);

    res.status(200).json({ message: "Staff updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};


//  Delete Staff

export const deleteStaff = async (req: Request , res: Response) => {
    try{
        const {id} = req.params;

        // Delete from Auth
        await auth.deleteUser(id);

        // Delete from Firestore
        await db.collection("staff").doc(id).delete();
        res.status(200).json({message: "Staff deleted successfully"});
    } catch (error: any){
        res.status(500).json({error: error.message});
    }
}

// Get single Staff

export const getStaffById = async (req: Request, res: Response) => {
    try{
        const {id} = req.params;

        const staff = await db.collection("staff").doc(id).get();
        if (!staff.exists) {
          return res.status(404).json({ error: "Staff not found" });
        }   
        res.status(200).json(staff.data());
    } catch (error: any){
        res.status(500).json({error: error.message});
    }
}

export const regeneratePin = async (req: Request, res: Response) => {
    try{
        const {id} = req.params;

        // Fetch staff to get name for initials
        const staffRef = db.collection("staff").doc(id);
        const staffSnap = await staffRef.get();

        if(!staffSnap.exists){
            return res.status(400).json({error: "Staff not found"});
        }

        const staffData = staffSnap.data();
        const name = staffData?.name;

        const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase();

        // Generate new unique 4-digit PIN
        const newPin = await generateUniquePin();

        // Firebase password
        const firebasePassword = newPin + initials;

        // Update Firebase Auth password
        await auth.updateUser(id, {password: firebasePassword});

        // Update Firestore
        await staffRef.update({pin: newPin});


        res.status(200).json({
            message: "PIN regenerated successfully",
            pin: newPin, 
        });
    } catch(error: any){
        res.status(500).json({error: error.message})
    }
}