# 🚑 Life-Saviour 

[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-brightgreen.svg)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-black.svg)](https://socket.io/)
[![Gemini API](https://img.shields.io/badge/Google_Gemini-AI-orange.svg)](https://deepmind.google/technologies/gemini/)

**Life-Saviour** is an advanced, real-time emergency response platform designed to bridge the gap between patients, dispatchers, and hospitals during critical moments. It features predictive health monitoring, AI-assisted triage, and resilient offline communication methods to ensure help is always available.

---

## 🌟 Key Features

- **📡 Offline SMS Fallback (Zero-Connectivity SOS):** If a user triggers an SOS but has no internet connection, the system automatically intercepts the request and generates a deep-linked SMS containing their precise GPS coordinates and medical profile to dispatch emergency services via cellular networks.
- **🧠 AI-Powered Medical Triage (Gemini):** Integrated Google Gemini AI acts as a virtual medical assistant, analyzing patient symptoms and providing dispatchers with immediate, actionable first-aid recommendations before paramedics arrive.
- **⚡ Predictive Wearable Integration:** Simulates real-time telemetry from smart wearables (Heart Rate, SpO2). If vitals hit critical medical thresholds (e.g., Severe Bradycardia < 40 BPM or Severe Hypoxia < 85%), a 15-second auto-trigger countdown begins to automatically dispatch an ambulance without user intervention.
- **🫀 Dynamic CPR Metronome:** Provides a live, interactive 110 BPM visual and audio metronome to guide bystanders through performing CPR during cardiac events.
- **🏥 Real-Time Ambulance Tracking:** Uses WebSockets (Socket.IO) to stream live GPS coordinates of dispatched ambulances directly to the patient's dashboard.
- **📱 Digital Medical ID QR Codes:** Instantly generates a scannable QR code containing the patient's critical health data (Blood Type, Allergies, Emergency Contacts) for paramedics to scan upon arrival.

---

## 📸 Screenshots

*(Upload your screenshots to GitHub and drop the links below!)*

### Patient Dashboard & Vitals Monitor
![Patient Dashboard Screenshot](https://via.placeholder.com/800x400?text=Patient+Dashboard+Screenshot+Goes+Here)

### Real-Time Emergency Dispatch
![Emergency Dispatch Screenshot](https://via.placeholder.com/800x400?text=Emergency+Dispatch+Screenshot+Goes+Here)

### AI Voice Assistant & Triage
![AI Chat Screenshot](https://via.placeholder.com/800x400?text=AI+Voice+Assistant+Screenshot+Goes+Here)

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Chakra UI, Framer Motion, React-Leaflet (Maps)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Real-Time Communication:** Socket.IO
- **Artificial Intelligence:** Google Generative AI (Gemini)

---

## 🚀 Live Demo

- **Frontend:** [https://life-saviour-ten.vercel.app](https://life-saviour-ten.vercel.app)
- **Backend API:** Hosted on Render

---

## 💻 Local Installation

To run this project locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/saaisaahitthi/Life-Saviour.git
   cd Life-Saviour
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../client
   npm install
   ```

4. **Set up Environment Variables:**
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLIENT_URL=http://localhost:5173
   GEMINI_API_KEY=your_google_gemini_api_key
   ```
   Create a `.env` file in the `client` directory:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

5. **Start the Development Servers:**
   - In the `server` terminal: `npm start`
   - In the `client` terminal: `npm run dev`

---
*Built with ❤️ to save lives.*
