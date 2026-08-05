# 🚑 Life Saviour — Next-Generation Emergency Response Platform

<div align="center">

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel)](https://life-saviour-ten.vercel.app)

**An intelligent, real-time emergency dispatch ecosystem that bridges patients, doctors, and ambulance drivers — powered by AI, IoT wearables, and geospatial routing.**

[🌐 Live Demo](https://life-saviour-ten.vercel.app) · [📖 Documentation](#-table-of-contents) · [🚀 Get Started](#-local-installation)

</div>

---

## 📋 Table of Contents

| Section | Purpose |
|---|---|
| [🧠 What is Life Saviour?](#-what-is-life-saviour) | Understanding the problem we solve |
| [⚡ Key Capabilities](#-key-capabilities) | All major features at a glance |
| [🏗️ System Architecture](#-system-architecture) | How the platform is built |
| [🤖 AI Subsystem](#-ai-subsystem--google-gemini-25-flash) | Three distinct Gemini AI prompt pipelines |
| [📡 Real-Time Communication](#-real-time-communication--socketio) | Socket.IO event-driven architecture |
| [🗺️ Geospatial & Navigation](#️-geospatial--navigation-system) | OSRM routing, ETA, and geofencing |
| [⌚ IoT Wearable Integration](#-iot-wearable-integration--web-bluetooth) | Web Bluetooth & live vitals streaming |
| [🏥 Emergency State Machine](#-emergency-state-machine) | Full lifecycle of an emergency |
| [📊 Timeline System](#-timeline-system) | Real-time event tracking |
| [🔐 Authentication & Roles](#-authentication--role-based-access) | JWT-based multi-role access control |
| [🛠️ Technology Stack](#️-technology-stack) | Full list of technologies used |
| [📁 Project Structure](#-project-structure) | Codebase organization |
| [💻 Local Installation](#-local-installation) | How to run locally |

---

## 🧠 What is Life Saviour?

Traditional emergency systems rely entirely on a patient making a phone call — which is impossible if the patient is **unconscious, unable to speak, or offline**. Life Saviour bridges this gap.

**Life Saviour** is an advanced full-stack emergency response platform that creates an interconnected web between **Smart Wearables, AI Triage, GPS Dispatch, and Hospital Systems**. It continuously monitors high-risk patients and autonomously dispatches help **without the patient ever needing to press a button**.

### The Problem

```text
Patient has cardiac event
        ↓
Cannot dial 000
        ↓
No help arrives
        ↓
Golden Hour is lost
```

### The Solution

```text
Wearable detects HR > 180 BPM or SpO₂ < 85%
        ↓
Autonomous 15-second countdown fires
        ↓
SOS triggered automatically with GPS coordinates
        ↓
AI triages the case, hospital is selected, driver dispatched
        ↓
Doctor receives live vitals + AI clinical summary
        ↓
Patient sees ambulance moving in real-time on their screen
```

---

## ⚡ Key Capabilities

| Feature | Description |
|---|---|
| 🤖 **3-Prompt AI Triage** | Gemini 2.5 Flash powers three independent AI pipelines: classification, conversation, and clinical handoff |
| 📡 **Sub-second Real-Time Sync** | Socket.IO pushes every location update, status change, and vital sign to all dashboards instantly |
| ⌚ **IoT Wearable Streaming** | Web Bluetooth API connects to real GATT-compatible smartwatches and streams live Heart Rate |
| 🗺️ **OSRM Road Routing & ETA** | Real road-network routes with live ETA shown as "Ambulance arriving in X min" |
| 📍 **Geofence Auto-Status** | When driver reaches within 100m of patient, status automatically transitions to `arrived` |
| 🏥 **Smart Hospital Selection** | Algorithm scores hospitals by distance, specialization, and available ICU bed capacity |
| 🔁 **Offline SMS Fallback** | Detects zero-connectivity and falls back to native SMS with GPS coordinates over 2G |
| 🎥 **WebRTC Video Call** | Peer-to-peer video call between doctor and patient using WebRTC |
| ☁️ **Cloudinary Media Storage** | All emergency media (photos/video) uploaded to Cloudinary with signed secure URLs |
| 📲 **Medical QR Code** | Generates scannable QR with blood type, allergies, and emergency contacts for paramedics |
| 📊 **Live Timeline** | Every action — from emergency creation to resolution — is timestamped and pushed in real-time |
| 🌐 **Multilingual Support** | Full UI support for English, Hindi, and Telugu |

---

## 🏗️ System Architecture

The platform is built as a three-tier MERN stack with WebSocket and AI layers:

```text
┌─────────────────────────────────────────────────────┐
│                   REACT FRONTEND                    │
│  Patient Dashboard · Doctor Dashboard · Driver UI   │
│         Chakra UI · Framer Motion · Leaflet         │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP REST + Socket.IO
┌──────────────────────▼──────────────────────────────┐
│                  NODE.JS BACKEND                    │
│        Express.js · Socket.IO · JWT Auth            │
│    Controllers · Services · Timeline · Dispatch     │
└────────┬─────────────┬──────────────┬───────────────┘
         │             │              │
    ┌────▼────┐  ┌─────▼─────┐  ┌───▼──────────┐
    │ MongoDB │  │ Google    │  │   OSRM /     │
    │  Atlas  │  │ Gemini AI │  │  Cloudinary  │
    └─────────┘  └───────────┘  └──────────────┘
```

### Three User Roles

| Role | Dashboard | Primary Actions |
|---|---|---|
| 🧑‍⚕️ **Patient** | Patient Dashboard | Trigger SOS, chat with AI, monitor ambulance, stream wearable vitals |
| 👨‍⚕️ **Doctor** | Doctor Dashboard | Accept emergencies, view live patient vitals, open video call, generate AI summary |
| 🚑 **Driver** | Driver Dashboard | Accept dispatch, publish live GPS, navigate via Google Maps, mark arrival |

---

## 🤖 AI Subsystem — Google Gemini 2.5 Flash

The same model. Three completely different jobs. This is intentional separation of concerns.

### Prompt 1 — AI Triage Classifier (`analyzeEmergency`)

**Role:** Emergency Medical Triage Assistant — performs **structured classification**.

| Input | Output |
|---|---|
| Age, Symptoms, Pain Level (1-10) | Medical Category (cardiac, trauma, neurological...) |
| Breathing Difficulty (1-10) | Severity Score (1–10) |
| Consciousness State | Priority Level (low / medium / high / critical) |
| Additional Notes | Recommended Department + Analysis Summary |

```json
{
  "category": "cardiac",
  "severityScore": 9,
  "priorityLevel": "critical",
  "recommendedDepartment": "Cardiology",
  "analysisSummary": "Possible acute coronary syndrome..."
}
```

---

### Prompt 2 — AI Chat (`getChatResponse`)

**Role:** Life Saviour AI — a calm, empathetic **emergency dispatcher assistant**.

```text
Guidelines:
- Respond ENTIRELY in the patient's chosen language (EN / HI / TE)
- Gather: breathing status, consciousness, pain, location, injuries
- If life-threatening detected → set shouldEscalate: true
- Keep responses to 1-3 sentences
- ALWAYS end with a clarifying question
- Do NOT diagnose conditions
```

Graceful fallback responses in all 3 supported languages if the API is unavailable.

---

### Prompt 3 — Doctor Summary (`generateSummary`)

**Role:** Clinical handoff AI preparing a structured medical briefing for the attending doctor.

The summary receives **five data layers**:

```text
Emergency Report Data
        ↓
AI Triage Analysis (Structured JSON)  ← NEW: explicitly included
        ↓
Connected Wearable Device Readings
        ↓
Timeline Event Log
        ↓
Full AI Conversation History
        ↓
Doctor Receives Complete Clinical Summary
```

**Output Sections:**
1. Chief Complaint
2. Key Symptoms & Vital Signs
3. Risk Flags
4. Recommended Urgency
5. Timeline Overview
6. Suggested Immediate Actions

Generated **non-blocking** (via `setImmediate`) so the doctor sees populated data instantly.

---

## 📡 Real-Time Communication — Socket.IO

All dashboards stay synchronized with zero polling. Every important event is pushed instantly.

### Core Socket Events

| Event | Direction | Purpose |
|---|---|---|
| `location_update` | Driver → Server | Publishes driver GPS every second |
| `emergency_updated` | Server → All | Broadcasts emergency state changes |
| `new_timeline_event` | Server → All | Pushes live timeline updates |
| `wearable_update` | Patient → Server | Streams live Heart Rate / SpO₂ |
| `new_message` | Bidirectional | Real-time AI chat messages |
| `call_user` / `answer_call` | Doctor ↔ Patient | WebRTC signaling for video call |

### HTTP vs Socket.IO Pattern

```text
Page Load
    ↓
HTTP GET /api/emergency/:id/timeline
    ↓
Fetch ALL historical events
    ↓
Already on page? Socket.IO pushes ONLY new events
```

This pattern appears consistently throughout every dashboard in the platform.

---

## 🗺️ Geospatial & Navigation System

### OSRM Road Routing (`useOSRMRoute.js`)

The driver's path is calculated on **real road networks**, not straight lines.

```text
Driver GPS Position
        ↓
OSRM Public API (Open Source Routing Machine)
        ↓
Real road geometry (GeoJSON polyline)
        ↓
Leaflet renders the route on the map
        ↓
ETA calculated from OSRM duration response
```

**Smart Caching & Throttling** — Route is only re-fetched if:
- Driver has moved **more than 30 meters**, OR
- **10 seconds** have elapsed since last fetch

This reduces unnecessary API calls dramatically and keeps the UI smooth.

### Dynamic ETA Labels

| Mission Phase | Label Shown |
|---|---|
| En Route to Patient | `Ambulance arriving in X min` |
| Transporting to Hospital | `Hospital arrival in Y min` |

### Geofencing (100m Auto-Arrive)

When the driver enters a **100-meter radius** of the patient:

```text
Driver Location Update Received
        ↓
Haversine Distance Calculated
        ↓
Distance < 100m?
        ↓
Emergency Status → "arrived" (automatic)
        ↓
Doctor notified · Patient notified · Timeline updated
```

---

## ⌚ IoT Wearable Integration — Web Bluetooth

Real hardware integration using the **Web Bluetooth GATT API** — no proprietary SDK required.

### Connection Flow

```text
navigator.bluetooth.requestDevice({ services: ['heart_rate'] })
        ↓
GATT Server Connect
        ↓
getPrimaryService('heart_rate')
        ↓
getCharacteristic('heart_rate_measurement')
        ↓
startNotifications()
        ↓
characteristicvaluechanged → setVitals() → emit wearable_update
```

### Production-Grade Robustness Features

| Feature | Implementation |
|---|---|
| **Auto-Reconnect** | `gattserverdisconnected` triggers 3 automatic reconnect attempts with 2s delay |
| **Sensor Validation** | HR values of 0 or 255 (corrupt BLE packets) are silently rejected |
| **Last Update Timestamp** | "Updated 3 sec ago" ticks every second; turns red after 30s of silence |
| **Live Data Badge** | Green "Receiving Live Data" → Orange "Reconnecting..." → Red "No Data Received" |
| **Simulated Fallback** | Simulated devices available for demos without real hardware |

### SOS Critical Threshold Matrix

| Condition | Threshold | Response |
|---|---|---|
| Severe Bradycardia | HR < 40 BPM | 15s countdown → Auto SOS |
| Severe Tachycardia | HR > 180 BPM | 15s countdown → Auto SOS |
| Severe Hypoxia | SpO₂ < 85% | 15s countdown → Auto SOS |
| Compound Failure | HR > 120 AND SpO₂ < 90% | 15s countdown → Auto SOS |

False alarm prevention: a prominent **Cancel** button lets the patient stop any accidental trigger within the 15-second window.

---

## 🏥 Emergency State Machine

Every emergency passes through a strict, ordered lifecycle:

```text
pending
   ↓ (Doctor accepts)
assigned
   ↓ (Driver accepts dispatch)
in_progress
   ↓ (Driver reaches patient — Geofence)
arrived
   ↓ (Driver starts hospital transport)
transporting
   ↓ (Driver drops off patient)
dropped_off
   ↓ (Doctor resolves case)
resolved
```

Each transition emits a `emergency_updated` Socket.IO event, a `new_timeline_event`, and a push notification to all relevant parties.

---

## 📊 Timeline System

Every significant action in an emergency is permanently recorded in a separate `TimelineEvent` MongoDB collection (not embedded in the Emergency document — deliberate database design decision to avoid document bloat).

### Timeline Event Structure

| Field | Description |
|---|---|
| `emergencyId` | Reference to the parent emergency |
| `type` | `medical / dispatch / transport / hospital / system / status_change / assignment` |
| `title` | Standardized title from `timelineConstants.js` |
| `description` | Human-readable description of the event |
| `actor` | `{ name, role }` — who triggered this event |
| `metadata` | Flexible key-value store for extra data |
| `createdAt` | Auto-timestamped by MongoDB |

### Standardized Event Constants

All event types and titles are defined in `server/src/constants/timelineConstants.js` — eliminating the risk of inconsistent strings like `"Driver Assigned"` vs `"Driver assigned"` across the codebase.

---

## 🔐 Authentication & Role-Based Access

```text
User Registers → JWT Issued → Role Embedded in Token
        ↓
patient  → Patient Dashboard only
doctor   → Doctor Dashboard + Emergency Accept
driver   → Driver Dashboard + Dispatch Accept
```

**Specialization Matching** — When a doctor accepts an emergency, their specialization is validated against the AI-determined medical category. A cardiologist cannot accept a neurological emergency and vice versa (unless they are General).

---

## 🛠️ Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 + Vite | UI framework and build tooling |
| Chakra UI | Accessible, themeable component library |
| Framer Motion | Micro-animations and transitions |
| React-Leaflet | Interactive maps with OpenStreetMap tiles |
| Socket.IO Client | Real-time bidirectional communication |
| Web Bluetooth API | Native Bluetooth GATT device communication |
| WebRTC | Peer-to-peer video calling |

### Backend

| Technology | Purpose |
|---|---|
| Node.js + Express.js | RESTful API server |
| Socket.IO | WebSocket event bus |
| MongoDB + Mongoose | Primary database with horizontal scaling |
| JWT | Stateless authentication |
| Cloudinary SDK | Media upload with secure signed URLs |
| Google Generative AI SDK | Gemini 2.5 Flash integration |

### Infrastructure & APIs

| Service | Purpose |
|---|---|
| MongoDB Atlas | Managed cloud database |
| Render | Backend hosting with WebSocket support |
| Vercel | Frontend deployment with CDN |
| OSRM | Open Source Routing Machine for road-network ETA |
| OpenStreetMap + Nominatim | Geocoding and map tiles |

---

## 📁 Project Structure

```
📦 Life-Saviour/
├── 📂 client/                          # React Frontend (Vite)
│   └── 📂 src/
│       ├── 📂 components/
│       │   ├── WearableHealthMonitor.jsx  # IoT + Web Bluetooth
│       │   ├── Timeline.jsx               # Real-time event log
│       │   ├── VideoCall.jsx              # WebRTC video
│       │   └── ...
│       ├── 📂 hooks/
│       │   └── useOSRMRoute.js            # Road routing + ETA caching
│       ├── 📂 pages/
│       │   ├── PatientDashboard.jsx       # Patient interface
│       │   ├── DoctorDashboard.jsx        # Doctor interface
│       │   └── DriverDashboard.jsx        # Driver interface
│       └── 📂 context/
│           └── SocketContext.jsx          # Shared Socket.IO instance
│
└── 📂 server/                          # Node.js Backend
    └── 📂 src/
        ├── 📂 constants/
        │   └── timelineConstants.js       # Standardized event enums
        ├── 📂 controllers/
        │   └── emergencyController.js     # Core emergency logic
        ├── 📂 models/
        │   ├── Emergency.js               # Emergency schema + state enum
        │   ├── TimelineEvent.js           # Separate timeline collection
        │   └── AIChat.js                  # Conversation history
        ├── 📂 services/
        │   ├── aiChatService.js           # Gemini chat + summary prompts
        │   ├── aiService.js               # Gemini triage classifier
        │   ├── timelineService.js         # Event creation + Socket emit
        │   ├── dispatchService.js         # Driver assignment queue
        │   └── hospitalService.js         # Smart hospital recommender
        └── 📂 sockets/
            └── chatSocket.js              # Geofencing + location logic
```

---

## 🚀 Live Demo

| Service | URL |
|---|---|
| 🌐 **Frontend** | [https://life-saviour-ten.vercel.app](https://life-saviour-ten.vercel.app) |
| ⚙️ **Backend** | Hosted on Render Cloud |
| 🗄️ **Database** | MongoDB Atlas (Cloud) |

---

## 💻 Local Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key
- Cloudinary account

### Step 1 — Clone the Repository

```bash
git clone https://github.com/saaisaahitthi/Life-Saviour.git
cd Life-Saviour
```

### Step 2 — Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_google_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Step 3 — Frontend Setup

```bash
cd ../client
npm install --legacy-peer-deps
```

Create a `.env` file in the `client/` directory:

```env
VITE_API_URL=http://localhost:5000
```

### Step 4 — Start the Application

In one terminal (backend):
```bash
cd server
npm start
```

In another terminal (frontend):
```bash
cd client
npm run dev
```

The application will be running at `http://localhost:5173`.

### Step 5 — Verify Setup

```bash
# Check backend health
curl http://localhost:5000/health

# Expected output:
# MongoDB connected successfully
# Life Saviour server running on port 5000
# Socket.IO ready for connections
```

---

## 🔭 Architecture Highlights for Interviews

> These design decisions are production-grade and worth discussing:

- **Non-blocking AI Summary Generation** — Uses `setImmediate()` to respond to the doctor instantly while generating the Gemini summary in the background
- **Separated Timeline Collection** — Timeline events in a dedicated MongoDB collection prevent Emergency documents from bloating to hundreds of kilobytes
- **Socket Room Consistency** — All events broadcast to `emergency_<id>` rooms, not raw IDs
- **OSRM Throttling** — Route re-fetched only after 30m movement OR 10s interval — not on every GPS ping
- **Graceful Bluetooth Recovery** — Auto-reconnect (3 attempts × 2s delay) before requiring manual reconnect
- **Structured AI Constants** — All Gemini responses are validated JSON; fallbacks serve in all 3 languages

---

## 🏁 Conclusion

Life Saviour demonstrates that a modern emergency response platform is not achieved through any single technology — but through the **systematic co-integration** of:

- 🤖 Generative AI (Structured triage, empathetic conversation, clinical summarization)
- 📡 Real-time WebSockets (Zero-latency GPS, vitals, and status streaming)
- ⌚ IoT Hardware APIs (Bluetooth GATT wearable integration)
- 🗺️ Geospatial Intelligence (Road routing, ETA calculation, proximity geofencing)
- ☁️ Cloud Infrastructure (Vercel + Render + MongoDB Atlas + Cloudinary)

The project moves well beyond a typical MERN CRUD application and demonstrates end-to-end production thinking: from autonomous IoT monitoring to AI-powered clinical handoffs.

---

<div align="center">

Made with ❤️ to save lives.

**Bridging the gap between patients and emergency response through technology.**

</div>
