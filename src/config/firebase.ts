// src/config/firebase.ts
import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Explicitly load .env file from the backend directory
dotenv.config({ path: path.join(__dirname, "../../.env") });

console.log("Environment variables loaded:");
console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
console.log("FIREBASE_SERVICE_ACCOUNT_PATH:", process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
console.log("FIREBASE_STORAGE_BUCKET:", process.env.FIREBASE_STORAGE_BUCKET);

if (!process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_PATH environment variable is not set");
}

// Load service account file safely
let serviceAccount;
try {
  const serviceAccountPath = path.join(__dirname, "../../", process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  const serviceAccountData = fs.readFileSync(serviceAccountPath, "utf8");
  const cleanData = serviceAccountData.replace(/^\uFEFF/, ""); // Remove BOM if present
  serviceAccount = JSON.parse(cleanData);
} catch (error) {
  console.error("❌ Error loading service account:", error);
  throw new Error("Failed to load service account file");
}

// ✅ Use a default fallback bucket if env missing
const storageBucket =
  process.env.FIREBASE_STORAGE_BUCKET || "customersurveyapp-c2960.firebasestorage.app";

if (!storageBucket.endsWith(".firebasestorage.app")) {
  console.warn(
    `⚠️ The bucket "${storageBucket}" may be incorrect. Expected format: "<project-id>.firebasestorage.app"`
  );
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket,
});

console.log(`✅ Firebase Admin initialized with bucket: ${storageBucket}`);

export const auth = admin.auth();
export default admin;
