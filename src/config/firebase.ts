import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set");
}

let serviceAccount;

try {
  // Parse the JSON string stored in the environment variable
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (error) {
  console.error("❌ Invalid FIREBASE_SERVICE_ACCOUNT JSON:", error);
  throw new Error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable");
}

const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket,
});

console.log(`✅ Firebase Admin initialized with bucket: ${storageBucket}`);

export const auth = admin.auth();
export default admin;
