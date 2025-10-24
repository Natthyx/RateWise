// src/config/firebase.ts
import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";


dotenv.config();
const serviceAccount = require(path.resolve("./serviceAccountKey.json"));
// const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || ""
});

export const auth = admin.auth();
export default admin;