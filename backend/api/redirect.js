import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch (error) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

const db = admin.firestore();

export default async function handler(req, res) {

  // --- 1. MODIFIED ID PARSING ---
  // Get the full 'uniqueOrderId' from the URL (e.g., /api/payment-status?orderId=M123-169...)
  const { orderId } = req.query; 

  if (!orderId) {
    return res.status(400).send('Order ID is missing.');
  }

  // Parse the base 'txnId' from the 'orderId'
  // (e.g., "M123-1697..." -> "M123")
  const txnId = orderId.split('-').slice(0, -1).join('-');

  if (!txnId) {
      return res.status(400).send('Invalid Order ID format.');
  }
  // --- END OF MODIFICATION ---

  // Fetch final status from Firestore to be sure
  let finalStatus = 'PENDING';
  let responseData = null;
  try {
    const query = db
      .collection('submissions')
      .where('txnId', '==', txnId) // Now this query will work
      .limit(1);
    const snapshot = await query.get();
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      finalStatus = data.paymentStatus || 'PENDING';
      responseData = data.paymentResponse; // This holds the PhonePe response
    }
  } catch (e) {
    console.error('Error fetching from Firestore in redirect:', e);
  }

  // --- Parse Response Data for HTML ---
  let txid = orderId ;
  let amount = 'N/A';
  let errorCode = 'N/A';
  let errorMessage = 'Your transaction could not be processed. Please try again.';

  // --- 2. MODIFIED RESPONSE PARSING ---
  // We check the payload format from BOTH the webhook and the /check-status API
  if (responseData) {
    try {
      const paymentData =
        typeof responseData === 'string' ? JSON.parse(responseData) : responseData;

      if (finalStatus === 'SUCCESS') {
        // 'data' obj comes from webhook. 'payload' obj comes from /check-status
        const data = paymentData.data || paymentData.payload || paymentData;
        txid = data.transactionId || orderId;
        amount = data.amount
          ? `₹${(data.amount / 100).toFixed(2)}`
          : 'N/A';
      } else if (finalStatus === 'FAILED') {
        // 'code' from webhook, 'state' from /check-status
        errorCode = paymentData.code || paymentData.state || 'TRANSACTION_FAILED';
        errorMessage =
          paymentData.message || 'Payment was declined or timed out.';
      }
    } catch (e) {
      console.error('Error parsing responseData:', e);
    }
  }
  // --- END OF MODIFICATION ---


  // --- THEMED HTML STRING ---
  const statusHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Status | Imperial Fiesta</title>
    
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Poppins:wght@400;600;700;800&display=swap"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css"
    />
    
    <style>
      body {
        /* Dark purple/indigo background from poster */
        background: #1a1a2e;
        font-family: "Poppins", sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      .font-cinzel {
        font-family: "Cinzel", serif;
      }
      .text-gold {
        color: #fde047; /* Brighter gold/yellow for titles */
      }
      .text-accent-gold {
        color: #facc15; /* Tailwind yellow-400 for accents */
      }
      .card {
        /* Darker card with gold border, matching poster's boxes */
        background-color: rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
        border-radius: 1rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        border: 2px solid #facc15;
      }
      .btn-primary {
        /* Gold button */
        background: linear-gradient(to right, #facc15, #eab308);
        color: #1e1b4b; /* Dark text on gold button */
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(250, 204, 21, 0.2);
      }
      .btn-primary:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 6px 20px rgba(250, 204, 21, 0.3);
      }
      
      /* Retained from original code, as it's required for the loading state */
      .spinner {
        border-top-color: #facc15; /* Gold spinner */
        border-right-color: transparent;
        border-bottom-color: transparent;
        border-left-color: transparent;
      }
    </style>
</head>

<body class="text-white min-h-screen flex flex-col items-center justify-center p-4">

    <div id="statusCard" class="card w-full max-w-md p-8 text-center">
        
        <div id="loadingState" class="${finalStatus !== 'PENDING' ? 'hidden' : ''}">
            <div class="spinner animate-spin w-16 h-16 border-4 rounded-full mx-auto"></div>
            <h2 class="text-3xl font-bold text-gold font-cinzel mt-6">Verifying Payment...</h2>
            <p class="text-gray-300 mt-2">We are securely contacting the payment gateway.</p>
            <p class="text-gray-400 mt-1 text-sm">Please wait, do not close or refresh this window.</p>
        </div>
        
        <div id="successState" class="${finalStatus !== 'SUCCESS' ? 'hidden' : ''}">
            <div class="w-20 h-20 rounded-full bg-green-900 bg-opacity-50 flex items-center justify-center mx-auto">
                <svg class="w-12 h-12 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            <h2 class="text-3xl font-bold text-gold font-cinzel mt-6">Payment Successful!</h2>
            <p class="text-gray-300 mt-2">Your registration for Imperial Fiesta 2025 is complete!</p>
            <p class="text-gray-300 mt-4">
               You will recive an email containing your
                <strong class="text-gold">Official e-ticket</strong> within a few days. Please bring a copy to the event.
            </p>
            <div class="text-left text-sm text-gray-400 mt-6 p-4 bg-black bg-opacity-20 rounded-lg">
                <p><span class="font-semibold">Transaction ID:</span> ${txid}</p>
                <p><span class="font-semibold">Amount Paid:</span> ${amount}</p>
            </div>
            <a href="https://freshers-feast.rf.gd/" class="btn-primary font-semibold py-3 px-8 rounded-lg mt-8 inline-block">Back to Home</a>
        </div>
        
        <div id="failureState" class="${finalStatus !== 'FAILED' ? 'hidden' : ''}">
            <div class="w-20 h-20 rounded-full bg-red-900 bg-opacity-50 flex items-center justify-center mx-auto">
                <svg class="w-12 h-12 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </div>
            <h2 class="text-3xl font-bold text-gold font-cinzel mt-6">Payment Failed</h2>
            <p class="text-gray-300 mt-2">${errorMessage}</p>
            <p class="text-gray-400 mt-4">
                <strong class="text-red-300">You have not been charged.</strong>
                Please try the registration again.
            </p>
            <div class="text-left text-sm text-gray-400 mt-6 p-4 bg-black bg-opacity-20 rounded-lg">
                <p><span class="font-semibold">Error Code:</span> ${errorCode}</p>
            </div>
            <a href="/register.html" class="btn-primary font-semibold py-3 px-8 rounded-lg mt-8 inline-block">Try Again</a>
        </div>
        
    </div>

    <script>
      (function() {
        const currentStatus = "${finalStatus}";
        // Inject the full orderId from the server into the script
        const orderId = "${orderId}"; 

        if (currentStatus === "PENDING") {
          // Status is pending. Start polling the /api/check-status route.
          
          async function pollStatus() {
            try {
              // This is the GET request you wanted, to the *correct* URL
              const response = await fetch('/api/callback?merchantOrderId='+orderId);
              const data = await response.json();

              // Check for a final status (SUCCESS or FAILED)
              if (data.success && (data.status === "SUCCESS" || data.status === "FAILED")) {
                // Got a final status! Reload the page.
                // The server will re-run this file, see the new status
                // in Firestore, and render the correct HTML.
                window.location.reload();
              } else {
                // Still pending, wait 5 seconds and try again.
                setTimeout(pollStatus, 5000);
              }
            } catch (error) {
              console.error('Error polling status:', error);
              // If fetch fails, just wait 5 seconds and try again.
              setTimeout(pollStatus, 2000);
            }
          }

          // Start polling after an initial 1-second delay
          setTimeout(pollStatus, 1000);
        }
      })();
    </script>
        
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(statusHtml);
}