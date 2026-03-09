// firebase.js
import admin from "firebase-admin";

let serviceAccount;

try {
  // Parse the JSON string from environment variable
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
} catch (error) {
  console.error("❌ Error parsing Firebase service account:", error);
  throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON");
}

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
export { db };
