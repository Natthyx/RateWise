import admin from "../config/firebase";
import { v4 as uuidv4 } from "uuid";

let bucket: any;
try {
  bucket = admin.storage().bucket();
} catch (error) {
  console.error("Failed to initialize Firebase Storage bucket:", error);
  throw new Error("Storage bucket not properly configured");
}
  
export const uploadChatImage = async (
  file: Express.Multer.File,
  chatRoomId: string
): Promise<string> => {
  const fileName = `chat_images/${chatRoomId}/${Date.now()}_${uuidv4()}`;
  const fileRef = bucket.file(fileName);

  await fileRef.save(file.buffer, {
    metadata: {
      contentType: file.mimetype,
    },
  });
  
  await fileRef.makePublic();

  if (!bucket.name) {
    throw new Error("Bucket name is not defined");
  }

  // Use the actual bucket name from Firebase - it might be firebasestorage.app
  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
};