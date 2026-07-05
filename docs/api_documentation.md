# REST API DOCUMENTATION 
**Project:** Life Saviour  
**Base URL:** `http://localhost:5000` (or production domain)  
**Format:** JSON  

This documentation details the core backend routes powering the Life Saviour platform. It strictly reflects the existing Node.js/Express implementation.

---

## 1. Authentication Module

### 1.1 Register New User
Creates a new user account with role-based access control.

* **URL:** `/api/auth/signup`
* **HTTP Method:** `POST`
* **Authentication Required:** No
* **Authorization Required:** None
* **Request Headers:**
  * `Content-Type: application/json`
* **Query Parameters:** None
* **Path Parameters:** None
* **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "phone": "9876543210",
    "role": "patient",
    "adminCode": "SUPERADMIN2026" // Optional, required only if role=admin
  }
  ```
* **Validation Rules:**
  * `name`, `email`, `password`, `role` are required.
  * `email` must be unique and valid format.
  * `password` must be >= 6 characters.
  * `role` enum: `['patient', 'doctor', 'driver', 'admin']`.
* **Controller:** `authController.signup`
* **Service:** None (handled directly in controller/model)
* **Database Operations:** 
  * `User.findOne({ email })` (duplicate check)
  * `User.create()` (Triggers `pre('save')` bcrypt hashing hook)
* **Success Response (201 Created):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": { "_id": "64a...", "name": "John Doe", "email": "john@example.com", "role": "patient" }
  }
  ```
* **Error Responses:**
  * `400 Bad Request`: "User already exists with this email"
  * `403 Forbidden`: "Invalid Secret Admin Code"
* **Sequence Diagram:**
  ```mermaid
  sequenceDiagram
      Client->>+API: POST /api/auth/signup
      API->>+DB: User.findOne(email)
      DB-->>-API: null
      API->>+DB: User.create(data)
      note right of DB: bcrypt hashes password
      DB-->>-API: User Object
      API->>API: jwt.sign(id, role)
      API-->>-Client: 201 { token, user }
  ```
* **Security Notes:** Passwords hashed with bcrypt (cost=12). JWT expires in 7 days.
* **Performance Notes:** Fast execution; DB reads/writes are minimal.

---

## 2. Emergency Management Module

### 2.1 Report New Emergency
The core endpoint that triggers the AI triage and auto-dispatch cascade.

* **URL:** `/api/emergencies`
* **HTTP Method:** `POST`
* **Authentication Required:** Yes
* **Authorization Required:** Any valid role (typically `patient`)
* **Request Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <token>`
* **Query Parameters:** None
* **Path Parameters:** None
* **Request Body:**
  ```json
  {
    "patientName": "John Doe",
    "age": 45,
    "gender": "male",
    "bloodGroup": "O+",
    "location": "Vizag Beach Road",
    "coordinates": { "lat": 17.714, "lng": 83.323 },
    "severity": "critical",
    "symptoms": "Severe chest pain, radiating to left arm",
    "transportType": "ambulance",
    "triageInputs": { "breathingDifficulty": 8, "painLevel": 9, "consciousnessState": "conscious" }
  }
  ```
* **Validation Rules:**
  * All root fields except `additionalNotes` are required.
  * `coordinates` must contain `lat` and `lng` floats.
* **Controller:** `emergencyController.createEmergency`
* **Service:** `aiService.analyzeEmergency`, `hospitalService.allocateHospital`, `dispatchService.assignNearestAmbulance`, `timelineService.createEvent`
* **Database Operations:** 
  * `Emergency.create()`
  * `Hospital.findOneAndUpdate()` (decrement bed capacity)
  * `User.findOneAndUpdate()` (mark driver busy)
  * `TimelineEvent.create()`
* **Success Response (201 Created):**
  ```json
  {
    "_id": "64b...",
    "patientName": "John Doe",
    "status": "pending",
    "aiTriage": { "category": "cardiac", "severityScore": 95, "priorityLevel": "critical" }
  }
  ```
* **Error Responses:**
  * `401 Unauthorized`: "Not authorized, token failed"
  * `500 Server Error`: (If database cascade fails)
* **Sequence Diagram:**
  ```mermaid
  sequenceDiagram
      Client->>+API: POST /api/emergencies
      API->>+AIService: analyzeEmergency(symptoms)
      AIService-->>-API: { category: "cardiac", score: 95 }
      API->>+DB: Emergency.create()
      DB-->>-API: emergencyDoc
      API->>+HospService: allocateHospital()
      HospService-->>-API: assignedHospitalId
      API->>+DispService: assignNearestAmbulance()
      DispService-->>-API: assignedDriverId
      API->>API: req.io.emit('new_emergency')
      API-->>-Client: 201 { emergencyData }
  ```
* **Security Notes:** Patient ID is extracted directly from the verified JWT (`req.user._id`), ignoring any patient ID sent in the payload.
* **Performance Notes:** Heavy sequential processing. API response time relies on the Google Gemini API latency (typically 1.5 - 3 seconds).

---

### 2.2 Assign Doctor to Emergency
Allows a doctor to accept an incoming case.

* **URL:** `/api/emergencies/:id/assign-doctor`
* **HTTP Method:** `POST`
* **Authentication Required:** Yes
* **Authorization Required:** `doctor` only
* **Request Headers:**
  * `Authorization: Bearer <token>`
* **Path Parameters:**
  * `id`: The MongoDB ObjectId of the emergency.
* **Request Body:** None
* **Controller:** `emergencyController.assignDoctor`
* **Service:** `timelineService.createEvent`, `notificationService.createNotification`, `aiChatService.generateSummary` (Async)
* **Database Operations:** 
  * `Emergency.findById()`
  * `Emergency.findByIdAndUpdate()` (Sets `assignedDoctor`, `status='assigned'`)
* **Success Response (200 OK):**
  ```json
  {
    "message": "Doctor assigned successfully",
    "emergency": { /* updated emergency object */ }
  }
  ```
* **Error Responses:**
  * `400 Bad Request`: "Emergency already has an assigned doctor"
  * `403 Forbidden`: "Specialization mismatch"
  * `404 Not Found`: "Emergency not found"
* **Sequence Diagram:**
  ```mermaid
  sequenceDiagram
      Doctor->>+API: POST /assign-doctor
      API->>+DB: Emergency.findById(id)
      DB-->>-API: emergencyDoc
      API->>API: Validate Specialization & Hospital
      API->>+DB: update({assignedDoctor, status:'assigned'})
      DB-->>-API: updatedDoc
      API-->>Doctor: 200 OK
      API-)AIChatService: generateSummary() (Non-blocking)
      API-)Socket: emit('emergency_updated')
  ```
* **Security Notes:** Controller validates that the doctor's `hospitalAffiliation` matches the `assignedHospital` of the emergency.
* **Performance Notes:** AI chat summary generation is detached from the request lifecycle, ensuring instant HTTP response.

---

## 3. AI Module

### 3.1 AI Chat Message
Sends a message to the Gemini-powered pre-triage assistant.

* **URL:** `/api/ai-chat/message`
* **HTTP Method:** `POST`
* **Authentication Required:** Yes
* **Authorization Required:** Any role
* **Request Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "emergencyId": "64b...",
    "message": "I'm feeling dizzy",
    "history": [
      { "role": "user", "parts": [{ "text": "Help me" }] },
      { "role": "model", "parts": [{ "text": "Are you breathing okay?" }] }
    ],
    "language": "en"
  }
  ```
* **Validation Rules:**
  * `emergencyId` and `message` required.
  * `history` array must correctly alternate roles.
* **Controller:** `aiChatController.sendMessage`
* **Service:** `aiChatService.getChatResponse`
* **Database Operations:** 
  * `AIChat.create()` (Persists the user message and AI response)
* **Success Response (200 OK):**
  ```json
  {
    "response": "Please sit down immediately. Try to take slow, deep breaths..."
  }
  ```
* **Error Responses:**
  * `500 Server Error`: "AI service unavailable" (Returns static fallback string in requested language)
* **Sequence Diagram:**
  ```mermaid
  sequenceDiagram
      Client->>+API: POST /api/ai-chat/message
      API->>+AIChatService: getChatResponse(message, history)
      AIChatService->>+GeminiAPI: startChat(history).sendMessage()
      GeminiAPI-->>-AIChatService: plain text response
      AIChatService->>+DB: AIChat.create(both messages)
      DB-->>-AIChatService: saved
      AIChatService-->>-API: response string
      API-->>-Client: 200 OK { response }
  ```
* **Security Notes:** Limits history to the last 10 messages before passing to Gemini to prevent Prompt Injection / Token overflow.

---

## 4. File Management Module

### 4.1 Upload Medical Document
Uploads an image or PDF to an emergency case.

* **URL:** `/api/files/upload/:emergencyId`
* **HTTP Method:** `POST`
* **Authentication Required:** Yes
* **Authorization Required:** Any role
* **Request Headers:**
  * `Content-Type: multipart/form-data`
  * `Authorization: Bearer <token>`
* **Path Parameters:**
  * `emergencyId`: MongoDB ObjectId of the emergency.
* **Request Body:**
  * Form Data Key: `file` (Binary File)
  * Form Data Key: `category` (String: "prescription", "x-ray", etc.)
* **Validation Rules:**
  * Handled by Multer. Maximum file size: 10MB.
* **Controller:** Route closure using `upload.single('file')`
* **Database Operations:** 
  * `Emergency.findByIdAndUpdate()` (pushes to `attachments` array)
* **Success Response (200 OK):**
  ```json
  {
    "message": "File uploaded successfully",
    "attachment": { "url": "/uploads/1690000_file.jpg", "category": "x-ray", "uploadedBy": "64a..." }
  }
  ```
* **Sequence Diagram:**
  ```mermaid
  sequenceDiagram
      Client->>+API: POST (multipart) /upload/:id
      API->>+Disk: Multer writes to /uploads/
      Disk-->>-API: File metadata
      API->>+DB: Emergency.update($push: {attachments})
      DB-->>-API: success
      API->>API: req.io.to(id).emit('new_attachment')
      API-->>-Client: 200 OK
  ```
* **Security Notes:** Files are written to local disk without deep malware scanning.
* **Performance Notes:** Local disk writes block horizontal scaling. Should be refactored to stream directly to S3.
