import { Request, Response} from "express";
import {auth} from "../config/firebase";
import admin from "../config/firebase";
import { uploadToStorage } from "../utils/uploadToStorage";
import { uploadToCloudinaryFromBuffer } from "../utils/cloudinary";

const db = admin.firestore();
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

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

export const createStaff = async (req: AuthenticatedRequest, res: Response) => {
    try{
        console.log('👤 Creating staff - request body keys:', Object.keys(req.body));
        console.log('📁 Has file?', !!req.file);
        console.log('🖼️  Has avatar in body?', !!req.body.avatar);
        
        const {name, email, avatar} = req.body;
        const file = req.file;
        const adminId = req.user?.userId;

        if (!name || !email) {
            return res.status(400).json({error: "Name and email are required"});
        }

        if (!adminId) {
            return res.status(401).json({error: "Admin authentication required"});
        }

        // Avatar is optional - if not provided, we'll generate a default one
        
        // Get the admin's business
        const businessSnapshot = await db.collection("business").where("adminId", "==", adminId).get();
        if (businessSnapshot.empty) {
            return res.status(404).json({error: "Admin's business not found"});
        }
        
        const businessId = businessSnapshot.docs[0].id;
        
        const pin = await generateUniquePin();

        const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase();

        // Ensure password is at least 6 characters for Firebase
        let firebasePassword = pin + initials;
        if (firebasePassword.length < 6) {
            firebasePassword = firebasePassword + "123"; // Add padding if too short
        }
        
        console.log('🔐 Creating Firebase user...');
        //  Create user in firebase auth
        const userrecord = await auth.createUser({
            email,
            password: firebasePassword,
            displayName: name,
        });
        console.log('✅ Firebase user created:', userrecord.uid);
        
        console.log('🔑 Setting custom claims...');
        // Set firebase custom claim
        await auth.setCustomUserClaims(userrecord.uid, {role: "staff"});
        console.log('✅ Custom claims set');
        
        let avatarUrl: string;

        // Handle avatar from different sources
        if (avatar && typeof avatar === 'string' && avatar.startsWith('data:image')) {
            // Base64 image from web (Flutter web)
            console.log('🌐 Processing base64 avatar from web...');
            try {
                const base64Data = avatar.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                const mimeMatch = avatar.match(/data:(image\/\w+);/);
                const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
                
                // Prefer Cloudinary when available, fallback to Firebase Storage
                if (process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)) {
                  try {
                    avatarUrl = await uploadToCloudinaryFromBuffer(buffer, `avatar_${userrecord.uid}`);
                  } catch (err: any) {
                    console.log('⚠️  Cloudinary upload failed, falling back to Firebase Storage:', err.message);
                    const mockFile = {
                      buffer: buffer,
                      mimetype: mimeType,
                      originalname: `avatar_${userrecord.uid}.${mimeType.split('/')[1]}`
                    } as Express.Multer.File;
                    avatarUrl = await uploadToStorage(mockFile, `staff-avatars/${userrecord.uid}-${Date.now()}`);
                  }
                } else {
                  const mockFile = {
                    buffer: buffer,
                    mimetype: mimeType,
                    originalname: `avatar_${userrecord.uid}.${mimeType.split('/')[1]}`
                  } as Express.Multer.File;
                    avatarUrl = await uploadToStorage(mockFile, `staff-avatars/${userrecord.uid}-${Date.now()}`);
                }
                console.log('✅ Base64 avatar uploaded:', avatarUrl);
            } catch (uploadError: any) {
                console.log('⚠️  Base64 upload failed, using default avatar:', uploadError.message);
                avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=128`;
            }
        } else if (file) {
            // Multipart upload from mobile
            console.log('📱 Processing multipart file upload...');
            try {
              if (process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)) {
                avatarUrl = await uploadToCloudinaryFromBuffer(file.buffer, `avatar_${userrecord.uid}`);
              } else {
                // Use staff-avatars directory for consistency
                avatarUrl = await uploadToStorage(file, `staff-avatars/${userrecord.uid}-${Date.now()}`);
              }
            } catch (e: any) {
              console.log('⚠️  Upload failed, falling back to Firebase Storage:', e.message);
              // Use staff-avatars directory for consistency
              avatarUrl = await uploadToStorage(file, `staff-avatars/${userrecord.uid}-${Date.now()}`);
            }
            console.log('✅ Multipart avatar uploaded:', avatarUrl);
        } else {
            // Generate default avatar with initials
            console.log('🎨 Using default avatar');
            avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=128`;
        }
        
        console.log('💾 Saving staff to Firestore...');
        // Save staff record in Firestore
        const staffDoc = {
            id: userrecord.uid,
            name,
            email,
            pin,
            avatar: avatarUrl,
            role: "staff",
            businessId: businessId,
            rating: 0,
            reviewCount: 0,
            createdAt: new Date().toISOString(),
        }

        await db.collection("staff").doc(userrecord.uid).set(staffDoc);
        console.log('✅ Staff created successfully:', userrecord.uid);

        res.status(201).json({
            message: "Staff created successfully",
            staff: staffDoc,
        });

    } catch(error: any){
        console.log('💥 Create staff error:', error.message);
        console.log('💥 Stack:', error.stack);
        res.status(500).json({error: error.message});
    }
};

// Get All Staff (Admin-specific)
export const getAllStaff = async (req: AuthenticatedRequest, res: Response) => {
    try{
        const adminId = req.user?.userId;
        
        if (!adminId) {
            return res.status(401).json({error: "Admin authentication required"});
        }

        // Get the admin's business
        const businessSnapshot = await db.collection("business").where("adminId", "==", adminId).get();
        if (businessSnapshot.empty) {
            return res.status(404).json({error: "Admin's business not found"});
        }
        
        const businessId = businessSnapshot.docs[0].id;
        
        // Get staff for this business only
        const snapshot = await db.collection("staff").where("businessId", "==", businessId).get();
        const staffList = snapshot.docs.map((doc) => doc.data());
        // Sort by name in memory to avoid needing a composite index
        staffList.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
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

    console.log('✏️  Updating staff:', id);
    console.log('📁 Has file?', !!file);
    console.log('🖼️  Has avatar in body?', !!updates.avatar);

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

    if (updates.avatar && typeof updates.avatar === 'string' && updates.avatar.startsWith('data:image')) {
      // Base64 image from web (Flutter web)
      console.log('🌐 Processing base64 avatar update from web...');
      try {
        const base64Data = updates.avatar.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const mimeMatch = updates.avatar.match(/data:(image\/\w+);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        
        if (process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)) {
          try {
            avatarUrl = await uploadToCloudinaryFromBuffer(buffer, `avatar_${id}`);
          } catch (err: any) {
            console.log('⚠️  Cloudinary upload failed:', err.message);
            const mockFile = {
              buffer: buffer,
              mimetype: mimeType,
              originalname: `avatar_${id}.${mimeType.split('/')[1]}`
            } as Express.Multer.File;
            avatarUrl = await uploadToStorage(mockFile, `staff-avatars/${id}-${Date.now()}`);
          }
        } else {
          const mockFile = {
            buffer: buffer,
            mimetype: mimeType,
            originalname: `avatar_${id}.${mimeType.split('/')[1]}`
          } as Express.Multer.File;
          avatarUrl = await uploadToStorage(mockFile, `staff-avatars/${id}-${Date.now()}`);
        }
        console.log('✅ Base64 avatar updated:', avatarUrl);
      } catch (uploadError: any) {
        console.log('⚠️  Base64 upload failed:', uploadError.message);
        // Don't update avatar if upload fails
      }
    } else if (file) {
      // New avatar uploaded via multipart
      console.log('📱 Processing multipart file update...');
      try {
        if (process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)) {
          avatarUrl = await uploadToCloudinaryFromBuffer(file.buffer, `avatar_${id}`);
        } else {
          avatarUrl = await uploadToStorage(file, `staff-avatars/${id}-${Date.now()}`);
        }
      } catch (e: any) {
        console.log('⚠️  Upload failed, falling back to Firebase Storage:', e.message);
        avatarUrl = await uploadToStorage(file, `staff-avatars/${id}-${Date.now()}`);
      }
      console.log('✅ Multipart avatar updated:', avatarUrl);
    } else if (updates.avatar === null || updates.avatar === "remove") {
      // Explicit request to remove avatar
      console.log('🧙 Removing avatar, using default');
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
    console.log('✅ Staff updated successfully');

    res.status(200).json({ message: "Staff updated successfully" });
  } catch (error: any) {
    console.log('💥 Update staff error:', error.message);
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

// Get Staff Performance

export const getStaffPerformance = async (req: AuthenticatedRequest, res : Response) =>{
  try{
    const staffId = req.user?.userId;
    if (!staffId) {
      return res.status(401).json({ error: "Unauthorized: Missing staff ID" });
    }

    const staffDoc = await db.collection("staff").doc(staffId).get();

    if(!staffDoc.exists){
      return res.status(404).json({error: "Staff not found"});
    }

    const staffData = staffDoc.data();
    const businessId = staffData?.businessId;

    const performance = {
      staffId,
      name: staffData?.name || "Unknown Staff",
      rating: staffData?.rating || 0,
      totalReviews: staffData?.reviewCount || 0,
      businessId: businessId || null,
    };

    res.status(200).json(performance);
  } catch (error: any){
    res.status(500).json({error: error.message});
  }
};


export const getStaffLeaderboard = async (req: any, res: Response) => {
  try {
    const staffId = req.user?.userId;
    
    console.log('🏆 Leaderboard request from staff:', staffId);
    
    if (!staffId) {
      console.log('❌ No staff ID in request');
      return res.status(401).json({ error: "Staff authentication required" });
    }

    // Get the current staff's business ID
    const currentStaffDoc = await db.collection("staff").doc(staffId).get();
    
    if (!currentStaffDoc.exists) {
      console.log('❌ Staff not found:', staffId);
      return res.status(404).json({ error: "Staff not found" });
    }

    const currentStaffData = currentStaffDoc.data();
    const businessId = currentStaffData?.businessId;

    console.log('🏢 Staff business ID:', businessId);

    if (!businessId) {
      console.log('❌ No business ID for staff');
      return res.status(400).json({ error: "Staff does not have a business assigned" });
    }

    // Get all staff from the same business
    const staffSnap = await db.collection("staff").where("businessId", "==", businessId).get();

    console.log(`📋 Found ${staffSnap.docs.length} staff in business ${businessId}`);

    const leaderboard = staffSnap.docs
      .map((doc) => ({
        staffId: doc.id,
        name: doc.data().name,
        rating: doc.data().rating || 0,
        reviewCount: doc.data().reviewCount || 0,
        avatar: doc.data().avatar || null,
      }))
      .sort((a, b) => b.rating === a.rating ? b.reviewCount - a.reviewCount : b.rating - a.rating);

    console.log('✅ Returning leaderboard with', leaderboard.length, 'staff members');

    res.status(200).json({ leaderboard });
  } catch (error: any) {
    console.log('💥 Leaderboard error:', error.message);
    res.status(500).json({ error: error.message });
  }
};