// callback.js
import { StandardCheckoutClient, Env } from "pg-sdk-node";
import admin from "firebase-admin";

// --- Initialize Firebase Admin SDK ---
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch (error) {
    console.error("Firebase admin initialization error", error.stack);
  }
}
const db = admin.firestore();

// --- Initialize PhonePe Client ---
const clientId = process.env.PHONEPE_CLIENT_ID;
const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
const clientVersion = process.env.PHONEPE_CLIENT_VERSION || "1.0.0";
const environment =
  process.env.PHONEPE_ENVIRONMENT === "PROD" ? Env.PRODUCTION : Env.SANDBOX;

const client = StandardCheckoutClient.getInstance(
  clientId,
  clientSecret,
  clientVersion,
  environment
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 1. Get the merchantOrderId from the query string
    const { merchantOrderId } = req.query;

    if (!merchantOrderId) {
      return res.status(400).json({ success: false, message: "Missing merchantOrderId" });
    }
    
    const baseTxnId = merchantOrderId.split('-').slice(0, -1).join('-');
    if (!baseTxnId) {
        return res.status(400).json({ success: false, message: 'Invalid merchantOrderId format.' });
    }

    // 2. Check our own Firestore database first (it's faster)
    const submissionsRef = db.collection("submissions");
    const query = submissionsRef.where("txnId", "==", baseTxnId).limit(1);
    const querySnapshot = await query.get();

    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();
      if (docData.paymentStatus === "SUCCESS" || docData.paymentStatus === "FAILED") {
        return res.status(200).json({
          success: true,
          status: docData.paymentStatus,
          source: "database",
          merchantTransactionId: docData.txnId,
         amount: docData.amount, // This might need to be docData.paymentResponse.amount / 100
        });
      }
    }

    // 3. If status is PENDING (or not in DB yet), call PhonePe for a live status
    console.log(`Checking PhonePe status for: ${merchantOrderId}`);
    const response = await client.getOrderStatus(merchantOrderId);
    const { state, amount } = response; 

    // 4. Update our database with the final status
    const finalStatus = (state === 'COMPLETED') ? 'SUCCESS' : (state === 'FAILED' ? 'FAILED' : 'PENDING');
    
    if (!querySnapshot.empty && finalStatus !== 'PENDING') {
        // --- THIS IS THE FIX ---
        // Convert the complex 'OrderStatusResponse' object into a plain JSON object
        const plainResponseObject = JSON.parse(JSON.stringify(response));

         await querySnapshot.docs[0].ref.update({
            paymentStatus: finalStatus,
            paymentResponse: plainResponseObject // Save the plain object
      });
    }

    // 5. Send the final status to the frontend
    return res.status(200).json({
      success: true,
      status: finalStatus,
      source: "phonepe_api",
      merchantTransactionId: baseTxnId,
      amount: amount / 100, // Convert from paisa to rupees
   });

  } catch (error) {
    console.error("Error in /api/check-status:", error.message);
    if (error.message && error.message.includes("Transaction not found")) {
        return res.status(404).json({ success: false, status: 'NOT_FOUND', message: "Transaction not found." });
    }
    // Check for the serialization error specifically
    if (error.message.includes("Couldn't serialize object")) {
        console.error("Firestore serialization error. This should have been fixed.");
    }
    res.status(500).json({ success: false, status: 'ERROR', message: "Internal server error." });
  }
}