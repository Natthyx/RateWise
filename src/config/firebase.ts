// src/config/firebase.ts
import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

// Resolve the path to your service account file
const serviceAccountPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS || "");

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || ""
});

export const auth = admin.auth();
export default admin;