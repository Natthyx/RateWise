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

export const uploadToStorage = async(file: Express.Multer.File, fileName: string) => {
    try {
        // Ensure bucket is properly initialized
        if (!bucket || !bucket.name) {
            throw new Error("Firebase Storage bucket is not properly initialized");
        }
        
        const fileRef = bucket.file(fileName);
        
        await fileRef.save(file.buffer, {
            metadata: {
                contentType: file.mimetype
            },
        });
        await fileRef.makePublic();
        
        // Use the actual bucket name from Firebase - it might be firebasestorage.app
        // Based on the file verification, the correct URL uses the bucket's actual domain
        return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    } catch (error: any) {
        console.error("Error uploading file to storage:", error);
        // Provide more specific error message
        if (error.code === 404) {
            throw new Error("Storage bucket not found. Please check your Firebase configuration.");
        }
        throw new Error(`Failed to upload file: ${error.message}`);
    }
};