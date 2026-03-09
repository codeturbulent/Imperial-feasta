# ⚙️ Imperial Fiesta Backend

This directory contains the **Vercel Serverless Functions** that power the Imperial Fiesta registration and payment system.

## 🚀 API Endpoints

- **`POST /api/submit-form`**: Processes participant details and stores them in Firebase Firestore.
- **`POST /api/pay`**: Initiates a secure payment transaction via the PhonePe gateway.
- **`POST /api/callback`**: Handles asynchronous payment status notifications from the payment gateway.
- **`GET /api/ticketgen`**: Generates a secure entry pass/ticket for successful registrants.

## 🛠️ Configuration

The backend relies on the following environment variables:

| Variable | Description |
|----------|-------------|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Full JSON string of your Firebase Service Account |
| `PHONEPE_MERCHANT_ID` | Your PhonePe Merchant Identifier |
| `PHONEPE_SALT_KEY` | Your PhonePe API Salt Key |

## 📦 Tech Stack
- **Node.js**: Serverless runtime.
- **Firebase Admin SDK**: For secure database operations.
- **Axios/Crypto**: For payment signature generation and API requests.
