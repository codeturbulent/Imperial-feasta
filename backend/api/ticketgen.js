import admin from 'firebase-admin';

// Initialize Firebase Admin SDK (same as your other file)
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch (error) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

const db = admin.firestore();

// This is the Vercel Serverless Function handler
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Allow GET for this endpoint
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); 
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle the browser's preflight request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Ensure the request is a GET request
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Extract the transaction ID from the query parameters
    // e.g., /api/ticketgen?txnId=YOUR_ID_HERE
    const { txnId } = req.query;

    if (!txnId) {
      return res.status(400).json({ success: false, error: 'Missing txnId query parameter' });
    }

    // 2. Query the 'submissions' collection
    const submissionsRef = db.collection('submissions');
    const querySnapshot = await submissionsRef.where('txnId', '==', txnId).limit(1).get();

    // 3. Check if a match was found
    if (querySnapshot.empty) {
      return res.status(404).json({ success: false, error: 'No submission found with that transaction ID' });
    }

    // 4. Return the name and details
    const doc = querySnapshot.docs[0];
    const submissionData = doc.data();

    res.status(200).json({
      success: true,
      id: doc.id, // This is the unique Firestore document ID
      ...submissionData // This includes name, email, branch, mobile, etc.
    });

  } catch (error) {
    console.error('Error reading from Firestore:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}