# ✨ Imperial Fiesta 2025 | BBAU Lucknow

[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Imperial Fiesta** is the annual flagship welcome celebration for the junior batch at **Babasaheb Bhimrao Ambedkar University (BBAU)**, Lucknow. This repository hosts the official event management platform, providing a seamless experience for attendee registration, secure payments, and event information.

---

## 🌟 Key Features

- **🛡️ Secure Registration:** Integrated multi-step form for participant details and event preferences.
- **💳 Payment Integration:** Robust payment processing via PhonePe gateway for pass purchases.
- **📱 Responsive UI:** A modern, mobile-first design built with Tailwind CSS for high performance.
- **⚡ Real-time Updates:** Instant feedback and validation using modern JavaScript.
- **🎫 Digital Ticketing:** Automated generation and verification of entry passes.
- **⚖️ Legal Compliance:** Dedicated documentation for Terms, Privacy, and Refund policies.

---

## 🛠️ Tech Stack

### Frontend
- **Language:** HTML5, Modern JavaScript (ES6+)
- **Styling:** Tailwind CSS (Utility-first framework)
- **Icons & Fonts:** Font Awesome 6, Google Fonts (Poppins, Cinzel)

### Backend (Serverless)
- **Environment:** Node.js (Runtime)
- **Cloud Functions:** Vercel Serverless Functions
- **Database:** Firebase Firestore (Real-time NoSQL)
- **Payment Gateway:** PhonePe API

---

## 📁 Project Architecture

```text
├── 📂 backend/              # Serverless backend logic
│   ├── 📂 api/              # Vercel API endpoints
│   │   ├── callback.js      # Payment status webhook
│   │   ├── pay.js           # Payment initiation
│   │   ├── submit-form.js   # Registration data handler
│   │   └── ticketgen.js     # Entry pass generation
│   └── firebase.js          # Firebase Admin SDK initialization
├── index.html               # Main landing page
├── register.html            # Registration & payment UI
├── ticket.html              # Digital ticket display
├── verifytkt.html           # Ticket verification portal
├── pricing.html             # Pass categories & inclusions
├── images/                  # Event branding & assets
└── extras.js                # Core frontend functionality
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Vercel CLI](https://vercel.com/docs/cli)
- Firebase Project & Service Account Key

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-repo/imperial-fiesta.git
   cd imperial-fiesta
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the `backend/` directory:
   ```env
   FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", ...}'
   PHONEPE_MERCHANT_ID=your_id
   PHONEPE_SALT_KEY=your_key
   ```

3. **Deploy with Vercel:**
   ```bash
   vercel dev
   ```

---

## 🗓️ Event Roadmap
- **Date:** November 22, 2025
- **Time:** 6:00 PM Onwards
- **Venue:** BBAU Campus, Lucknow
- **Highlights:** Live DJ, Talent Showcase, Gourmet Dinner, and Interactive Games.

---

## 🤝 The Team

- **Event Lead:** Ashish Goyal
- **Design & Creative:** Aryan Sengar
- **Development:** Codeturbulent

---

## 📄 License
This project is proprietary and intended solely for the **Imperial Fiesta 2025** event. All rights reserved.
