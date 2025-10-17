import admin from "../config/firebase";
import {v4 as uuidv4} from "uuid";

// Initialize bucket without explicit typing to avoid type errors
let bucket: any;
try {
  bucket = admin.storage().bucket();
} catch (error) {
  console.error("Failed to initialize Firebase Storage bucket:", error);
  throw new Error("Storage bucket not properly configured");
}

export const uploadToStorage = async(file: Express.Multer.File, staffId: string) =>{
    const fileName = `staff-avatars/${staffId}-${uuidv4()}`;
    const fileRef = bucket.file(fileName);

    await fileRef.save(file.buffer, {
        metadata: {
            contentType: file.mimetype
        },
    });
    await fileRef.makePublic();
    
    // Add error handling for bucket name
    if (!bucket.name) {
        throw new Error("Bucket name is not defined");
    }
    
    return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
       
}