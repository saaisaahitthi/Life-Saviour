# 🚑 Life-Saviour: Next-Generation Emergency Response Platform

[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-brightgreen.svg)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-black.svg)](https://socket.io/)
[![Gemini API](https://img.shields.io/badge/Google_Gemini-AI-orange.svg)](https://deepmind.google/technologies/gemini/)

## 📖 What is Life-Saviour?

**Life-Saviour** is an advanced, full-stack predictive emergency response ecosystem built to drastically reduce ambulance response times and improve patient survivability. Traditional emergency systems rely entirely on a patient making a phone call, which is impossible if the patient is unconscious, unable to speak, or out of cellular data range. 

Life-Saviour bridges this gap by creating an interconnected web between **Smart Wearables, AI Triage, and Dispatch Centers**. It continuously monitors high-risk patients, uses algorithms to detect life-threatening anomalies (like sudden cardiac arrest), and autonomously dispatches help without the patient ever needing to press a button.

The platform consists of two main interfaces:
1. **The Patient Dashboard:** An interactive portal for users to monitor their vitals, view live CPR instructions, generate Medical ID QR codes, and trigger manual SOS alerts.
2. **The Emergency Dispatch Center:** A real-time monitoring map for hospitals to track incoming ambulances, view patient telemetry, and consult an AI assistant for immediate medical protocol recommendations.

---

## 🌟 Core Architecture & Capabilities

### 1. Autonomous IoT Predictive SOS
The platform simulates connections with smart wearables (Apple Watch, Fitbit, Garmin) to stream live telemetry (Heart Rate and Blood Oxygen). The system constantly evaluates this data against a strict medical matrix:
- **Severe Bradycardia:** HR drops below 40 BPM
- **Severe Tachycardia:** HR spikes above 180 BPM
- **Compound Failure:** HR > 120 BPM while SpO2 < 90%
- **Severe Hypoxia:** SpO2 drops below 85%

If any condition is met, an autonomous 15-second countdown begins. If the user does not cancel it (false alarm prevention), the system automatically triggers a high-priority dispatch with their exact GPS coordinates.

### 2. Resilient Offline SMS Fallback (Zero-Connectivity SOS)
Emergency systems fail when the internet fails. Life-Saviour utilizes the browser's `navigator.onLine` API to detect if a patient is in a cellular dead zone with no Wi-Fi/4G data. If the patient triggers an SOS while entirely offline, the platform intercepts the database request and instantly generates a deep-linked SMS URI. This forces the patient's native messaging app to open with a pre-filled text message containing their exact GPS coordinates and blood type, ready to be sent over traditional 2G cellular networks to the dispatch center.

### 3. AI-Powered Medical Triage (Google Gemini)
When an emergency is triggered, dispatchers are often blind to the patient's exact medical history. We integrated the **Google Gemini Generative AI API** directly into the dispatch dashboard. Dispatchers can input symptoms reported by bystanders (e.g., "Patient is pale, clutching chest, pulse is weak") and the AI acts as an automated triage assistant, immediately outputting highly-accurate, step-by-step first-aid protocols to read out to the bystander while the ambulance is en route.

### 4. Live Bidirectional Telemetry (Socket.IO)
Using WebSockets, the platform achieves sub-second latency for critical data. 
- **For the Patient:** They can see the live GPS location of their assigned ambulance moving on a map toward them in real-time.
- **For the Dispatcher:** They can see the patient's live heart rate streaming onto their dashboard, allowing them to monitor if the patient's condition is stabilizing or deteriorating during transit.

### 5. Bystander Intervention Tools
- **Dynamic CPR Metronome:** During cardiac events, bystanders often perform CPR at the wrong tempo. The dashboard features a synchronized 110-BPM visual pulsing UI and audio metronome to guide them through chest compressions at the exact medically recommended speed.
- **Digital Medical ID:** Automatically generates a scannable QR code containing the patient's blood type, allergies, and emergency contacts. Paramedics can scan this the second they arrive to bypass verbal medical history gathering.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Chakra UI (Component Library), Framer Motion (Micro-animations), React-Leaflet (Interactive Mapping)
- **Backend:** Node.js, Express.js (RESTful API architecture)
- **Database:** MongoDB & Mongoose (Horizontal scaling for high-throughput IoT writes)
- **Real-Time Communication:** Socket.IO (Event-driven WebSockets)
- **Artificial Intelligence:** `@google/generative-ai` SDK
- **Deployment:** Vercel (Frontend), Render (Backend/WebSockets), MongoDB Atlas (Cloud Database)

---

## 🚀 Live Demo

- **Live Application:** [https://life-saviour-ten.vercel.app](https://life-saviour-ten.vercel.app)
- **Backend Infrastructure:** Hosted on Render Cloud
- **Database Architecture:** Hosted on MongoDB Atlas

---

## 💻 Local Installation

To run the full-stack environment locally:

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
   npm install --legacy-peer-deps
   ```

4. **Environment Configuration:**
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

5. **Start the Microservices:**
   - In the `server` terminal: `npm start`
   - In the `client` terminal: `npm run dev`

---
*Built with ❤️ to save lives.*
