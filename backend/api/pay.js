// pay.js

import { StandardCheckoutClient, Env, MetaInfo, StandardCheckoutPayRequest } from "pg-sdk-node";
import { randomUUID } from "crypto";

export default async function handler(req, res) {
  // --- CORS (for local dev + frontend access) ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    const { mobileNumber, merchantTransactionId } = req.body;

    if (!mobileNumber || !merchantTransactionId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (mobileNumber, merchantTransactionId).",
      });
    }

    // --- Fixed amount in paisa (₹200 = 20000 paisa) ---
    const amountInPaise = 250 * 100;

    // --- Load PhonePe credentials ---
    const clientId = process.env.PHONEPE_CLIENT_ID;
    const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
    const clientVersion = process.env.PHONEPE_CLIENT_VERSION || "1.0.0";
    const environment =
      process.env.PHONEPE_ENVIRONMENT === "PROD" ? Env.PRODUCTION : Env.SANDBOX;

    if (!clientId || !clientSecret) {
      console.error("❌ Missing PhonePe credentials.");
      return res.status(500).json({
        success: false,
        message: "Server configuration error: missing credentials.",
      });
    }

    // --- Initialize SDK client ---
    const client = StandardCheckoutClient.getInstance(
      clientId,
      clientSecret,
      clientVersion,
      environment
    );

    // --- Build transaction metadata ---
    const uniqueOrderId = `${merchantTransactionId}-JUNIORS`;
    const redirectUrl =
      process.env.PHONEPE_REDIRECT_URL;

    const metaInfo = MetaInfo.builder()
      .udf1(mobileNumber)
      .udf2("FreshersEvent")
      .build();
    const callbackUrl = process.env.PHONEPE_CALLBACK_URL;

    const request = StandardCheckoutPayRequest.builder()
    .merchantOrderId(uniqueOrderId)
    .amount(amountInPaise)
    .redirectUrl(redirectUrl + uniqueOrderId)
   
    .metaInfo(metaInfo)
    .build();
    // --- Call PhonePe API ---
    const response = await client.pay(request);
    const paymentUrl = response.redirectUrl;

    if (!paymentUrl) {
      console.error("❌ Failed to create payment request:", response);
      return res.status(500).json({ success: false, message: "Payment link generation failed." });
    }

    // --- Return checkout link ---
    return res.status(200).json({
      success: true,
      paymentUrl,
      merchantOrderId: uniqueOrderId,
    });
  } catch (error) {
    console.error("❌ Payment API error:", error);
    return res.status(error.httpStatusCode || 500).json({
      success: false,
      message: error.message || "Internal server error.",
    });
  }
}
