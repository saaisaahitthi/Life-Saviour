# 🧠 LIFE SAVIOUR — COMPLETE CODEBASE GUIDE

Welcome to the Life Saviour Codebase Guide. This document is designed as a **Learning Path**. Instead of alphabetical order, it walks you through the application exactly how the data flows—starting from the server entry point, moving to the database, tracing through the core AI and emergency logic, and finally examining the frontend state management and UI.

For each critical file on this journey, we break down exactly how it works, why it exists, and how to defend it in an interview.

---

## PART 1: THE SERVER BACKBONE

### 1. `server/server.js`
**1. Why this file exists:** It is the main entry point of the backend application. It bootstraps the Express server, connects to MongoDB, and attaches Socket.IO.
**2. Who calls this file:** Node.js runtime (`node server.js` or `npm start`).
**3. When this file executes:** On server boot.
**4. What it imports:** Express, http, cors, dotenv, `connectDB`, routes, and `socketHandler`.
**5. What it exports:** Nothing (it starts the server).
**6. Functions inside the file:** Only anonymous initialization functions.
**7. Line-by-line explanation of important code:**
```javascript
const app = express();
const server = http.createServer(app); // Wraps Express to allow WebSockets
const io = new Server(server, { cors: { origin: '*' } }); // Initializes Socket.IO with broad CORS
app.use((req, res, next) => { req.io = io; next(); }); // INJECTS io into the request object!
```
*The injection of `req.io` is a critical pattern allowing any HTTP controller (like `emergencyController`) to broadcast socket events.*
**8. Interaction with other files:** Mounts all routes (`/api/auth`, etc.) and calls `connectDB()`.
**9. Design decisions:** Wrapping Express in `http.createServer` is mandatory for Socket.IO to share the same port as the REST API.
**10. Interview questions:** 
*Q: Why attach `io` to the `req` object in middleware?* 
*A: To decouple HTTP controllers from the Socket.IO setup, allowing them to emit real-time events (like `new_emergency`) immediately after database mutations without requiring a global singleton.*
**11. Common mistakes:** Forgetting to configure CORS for Socket.IO, resulting in WebSocket handshake failures.
**12. Possible improvements:** Extract the Socket.IO initialization into a dedicated factory file to keep `server.js` cleaner.

---

### 2. `server/src/config/db.js`
**1. Why this file exists:** Establishes the connection to the MongoDB database using Mongoose.
**2. Who calls this file:** `server.js`.
**3. When this file executes:** On server boot.
**4. What it imports:** `mongoose`.
**5. What it exports:** `connectDB` function.
**6. Functions inside the file:** `connectDB()`.
**7. Line-by-line explanation of important code:**
```javascript
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    process.exit(1); // FATAL: Kill server if DB fails
  }
};
```
**8. Interaction with other files:** Relies on `.env` for `MONGO_URI`.
**9. Design decisions:** Uses `process.exit(1)` on failure. If the database is down, the server has no reason to run. It's better to crash and let a process manager (PM2/Docker) restart it.
**10. Interview questions:** 
*Q: What is the purpose of `process.exit(1)` in database connection handlers?*
*A: It follows the "fail-fast" principle. A stateless API without a database cannot serve traffic, so killing the process allows orchestrators like Kubernetes to recognize the failure and attempt a restart.*
**11. Common mistakes:** Not awaiting the connection, leading to race conditions where routes accept traffic before the DB is ready.
**12. Possible improvements:** Add retry logic (exponential backoff) before killing the process.

---

### 3. `server/src/models/User.js`
**1. Why this file exists:** Defines the schema for all users (Patients, Doctors, Drivers, Admins) and handles password hashing.
**2. Who calls this file:** Controllers (Auth, Emergency) and Services (Dispatch).
**3. When this file executes:** When querying or mutating the `users` collection.
**4. What it imports:** `mongoose`, `bcryptjs`, `jsonwebtoken`.
**5. What it exports:** Mongoose `User` model.
**6. Functions inside the file:** `pre('save')` hook, `comparePassword()`.
**7. Line-by-line explanation of important code:**
```javascript
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12); // Hash before saving
});
```
*This middleware ensures that anytime a password is set or changed, it is securely hashed before writing to disk.*
**8. Interaction with other files:** Used extensively by `authController.js`.
**9. Design decisions:** Using a single polymorphic collection (`role: enum`) instead of multiple collections (`Patients`, `Doctors`) simplifies authentication logic and DB joins.
**10. Interview questions:** 
*Q: Why use a `pre('save')` hook for hashing instead of doing it in the controller?*
*A: It centralizes data integrity. No matter where in the codebase a user is created or updated, the password will ALWAYS be hashed. It prevents developer error.*
**11. Common mistakes:** Forgetting `if (!this.isModified('password')) return next();`, which would re-hash an already hashed password on unrelated profile updates, locking the user out.
**12. Possible improvements:** Extract the JWT generation logic out of the model and into an `authService`.

---

### 4. `server/src/middleware/auth.js`
**1. Why this file exists:** Protects private API routes and enforces Role-Based Access Control (RBAC).
**2. Who calls this file:** Route definitions (e.g., `router.post('/', protect, authorize('patient'), ...)`).
**3. When this file executes:** On every incoming HTTP request to a protected route.
**4. What it imports:** `jsonwebtoken`, `User` model.
**5. What it exports:** `protect`, `authorize` functions.
**6. Functions inside the file:** `protect(req, res, next)`, `authorize(...roles)`.
**7. Line-by-line explanation of important code:**
```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = await User.findById(decoded.id).select('-password');
next();
```
*Decodes the token, fetches the fresh user data from DB, attaches it to `req.user`, and passes control to the next middleware/controller.*
**8. Interaction with other files:** Acts as a gatekeeper before reaching Controllers.
**9. Design decisions:** Attaching `req.user` allows subsequent controllers to know EXACTLY who is making the request without needing to trust client-side IDs.
**10. Interview questions:** 
*Q: How does the `authorize` middleware work technically?*
*A: It acts as a closure/factory. `authorize('admin')` returns a middleware function that checks if `req.user.role` is in the allowed roles array.*
**11. Common mistakes:** Trusting user IDs sent in the request body instead of using `req.user._id` set by this middleware.
**12. Possible improvements:** Cache user verification in Redis to avoid hitting MongoDB on every single protected API call.

---

### 5. `server/src/controllers/emergencyController.js`
**1. Why this file exists:** The heart of the application. Orchestrates the flow when an emergency is reported.
**2. Who calls this file:** Express router when `POST /api/emergencies` is hit.
**3. When this file executes:** When a patient submits the emergency form/SOS.
**4. What it imports:** `Emergency` model, `aiService`, `hospitalService`, `dispatchService`.
**5. What it exports:** `createEmergency`, `getActiveEmergencies`, `resolveEmergency`.
**6. Functions inside the file:** (Standard CRUD + orchestration methods).
**7. Line-by-line explanation of important code:**
```javascript
// Step 1: AI Triage
const aiResult = await aiService.analyzeEmergency(symptoms);
// Step 2: DB Creation
const emergency = await Emergency.create({ ...req.body, patientId: req.user._id, aiTriage: aiResult });
// Step 3: Hospital & Dispatch mapping
const hospital = await hospitalService.allocateHospital(coordinates, aiResult.category);
if (transportType === 'ambulance') {
    await dispatchService.assignNearestAmbulance(coordinates);
}
// Step 4: Real-time broadcast
req.io.emit('new_emergency', emergency);
```
**8. Interaction with other files:** Ties the Data layer (Models) with the Business layer (Services) and Transport layer (Sockets).
**9. Design decisions:** Highly sequential execution. Guarantees that an emergency is fully processed before notifying the network.
**10. Interview questions:** 
*Q: In `createEmergency`, what happens if `allocateHospital` throws an error?*
*A: Currently, execution halts and the client gets a 500 error, potentially leaving the Emergency in a half-created state. This is why implementing a Saga pattern or MongoDB Transactions is vital for this controller.*
**11. Common mistakes:** Performing heavy network calls (AI triage) inside a database transaction.
**12. Possible improvements:** Decouple this massive synchronous cascade by pushing the payload to a message queue and processing the AI/Dispatch logic asynchronously.

---

### 6. `server/src/services/aiService.js`
**1. Why this file exists:** Handles integration with Google Gemini for NLP triage.
**2. Who calls this file:** `emergencyController.js`.
**3. When this file executes:** Immediately after an emergency is reported.
**4. What it imports:** `@google/generative-ai`.
**5. What it exports:** `analyzeEmergency(symptoms, data)`.
**6. Functions inside the file:** `analyzeEmergency()`, `fallbackTriage()`.
**7. Line-by-line explanation of important code:**
```javascript
try {
   const result = await model.generateContent(prompt);
   return JSON.parse(cleanMarkdown(result.response.text()));
} catch (error) {
   console.warn("AI failed, using fallback");
   return fallbackTriage(symptoms);
}
```
*The Try/Catch block acts as a Circuit Breaker. If the LLM times out or hallucinates invalid JSON, it immediately runs deterministic regex fallback logic.*
**8. Interaction with other files:** Called by controllers; totally independent of models.
**9. Design decisions:** Uses `gemini-2.5-flash` for high-speed response. Forces JSON output through strict prompting.
**10. Interview questions:** 
*Q: Why is stripping markdown necessary before `JSON.parse`?*
*A: LLMs frequently wrap JSON responses in markdown blocks (e.g., \`\`\`json { ... } \`\`\`). Attempting to parse this directly will throw a SyntaxError.*
**11. Common mistakes:** Assuming the LLM will always return valid schema data.
**12. Possible improvements:** Upgrade to Gemini's native `response_mime_type: "application/json"` setting to enforce schema rigidly without text parsing.

---

### 7. `server/src/sockets/chatSocket.js`
**1. Why this file exists:** Manages all Socket.IO connections, room joining, chat broadcasting, and live GPS tracking.
**2. Who calls this file:** `server.js` initializes it.
**3. When this file executes:** Constantly, as clients connect, disconnect, and emit events.
**4. What it imports:** `ChatMessage` model.
**5. What it exports:** `(io) => { ... }` handler.
**6. Functions inside the file:** `socket.on('join_emergency')`, `socket.on('send_message')`, `socket.on('location_update')`.
**7. Line-by-line explanation of important code:**
```javascript
socket.on('join_emergency', (emergencyId) => {
    socket.join(emergencyId); // Subscribe to specific room
});

socket.on('send_message', async (data) => {
    await ChatMessage.create(data); // Persist
    io.to(data.emergencyId).emit('receive_message', data); // Broadcast ONLY to room
});
```
**8. Interaction with other files:** Provides the transport layer for real-time frontend updates.
**9. Design decisions:** "Room" architecture. Instead of broadcasting to all users (which is insecure and inefficient), clients subscribe to specific `emergencyId` rooms.
**10. Interview questions:** 
*Q: Why save the message to MongoDB inside the socket handler instead of an HTTP endpoint?*
*A: To minimize network round-trips. The client emits ONE socket event; the server handles the database persistence AND the broadcast to the room simultaneously.*
**11. Common mistakes:** Emitting `io.emit()` instead of `io.to(room).emit()`, accidentally leaking chat messages globally.
**12. Possible improvements:** Add Redis Pub/Sub adapter to allow socket communication across multiple Node.js instances.

---

## PART 2: THE CLIENT WORKSPACE

### 8. `client/src/main.jsx` & `App.jsx`
**1. Why this file exists:** Bootstraps the React application and sets up global routing.
**2. Who calls this file:** The browser (via Vite's index.html injection).
**3. When this file executes:** On initial page load.
**4. What it imports:** React Router, ChakraProvider, AuthProvider, LanguageProvider.
**5. What it exports:** Main DOM render.
**6. Functions inside the file:** Component wrappers.
**7. Line-by-line explanation of important code:**
```jsx
<ChakraProvider>
  <LanguageProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </LanguageProvider>
</ChakraProvider>
```
*The provider pattern. Global state wraps the application. Order matters: `AuthProvider` might need translations from `LanguageProvider`.*
**8. Interaction with other files:** Wraps everything.
**9. Design decisions:** React Router handles SPA navigation without reloading the page.
**10. Interview questions:** 
*Q: Why are React Contexts placed at the very top level in `main.jsx`?*
*A: To avoid "prop drilling". Wrapping the entire app means any deeply nested component (like a Chat Input) can access Auth state using `useContext`.*

---

### 9. `client/src/contexts/AuthContext.jsx`
**1. Why this file exists:** Manages user login state, token persistence, and role data globally.
**2. Who calls this file:** `ProtectedRoute`, `Navbar`, Dashboards.
**3. When this file executes:** On initial load (verifies existing token) and on login/logout.
**4. What it imports:** React hooks, `api` service.
**5. What it exports:** `AuthContext`, `AuthProvider`, `useAuth` hook.
**6. Functions inside the file:** `login()`, `logout()`, `verifyToken()`.
**7. Line-by-line explanation of important code:**
```jsx
const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('token', data.token); // Persist token
    setUser(data.user); // Update React state
};
```
**8. Interaction with other files:** Feeds data to `ProtectedRoute.jsx` to block unauthorized users.
**9. Design decisions:** Tokens are stored in `localStorage` for simplicity across reloads, though HttpOnly cookies are more secure against XSS.
**10. Interview questions:** 
*Q: What happens if a user alters their role in `localStorage` manually?*
*A: The UI might temporarily show them admin links, but the backend `authorize` middleware validates the secure JWT signature. Their API requests will be rejected with 401/403.*

---

### 10. `client/src/services/api.js`
**1. Why this file exists:** A central Axios instance handling all HTTP requests, interceptors, and headers.
**2. Who calls this file:** Any component needing backend data.
**3. When this file executes:** Whenever an HTTP request is made.
**4. What it imports:** `axios`.
**5. What it exports:** Configured `axios` instance.
**6. Functions inside the file:** Request interceptor, Response interceptor.
**7. Line-by-line explanation of important code:**
```javascript
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`; // Auto-inject token
    return config;
});
```
**8. Interaction with other files:** Eliminates the need to manually set headers in every component.
**9. Design decisions:** Centralized error handling. The response interceptor catches 401 Unauthorized errors and can automatically log the user out if their token expires.
**10. Interview questions:** 
*Q: What is the benefit of using an Axios interceptor?*
*A: It keeps code DRY (Don't Repeat Yourself). Instead of manually attaching the JWT Bearer token to 100 different API calls, the interceptor does it automatically right before the request leaves the browser.*

---

### 11. `client/src/pages/PatientDashboard.jsx`
**1. Why this file exists:** The central hub for the Patient. It manages reporting emergencies, viewing active status, and connecting wearables.
**2. Who calls this file:** React Router when hitting `/dashboard/patient`.
**3. When this file executes:** When a patient logs in.
**4. What it imports:** React hooks, `SOSButton`, `LiveMap`, `WearableHealthMonitor`.
**5. What it exports:** Default component.
**6. Functions inside the file:** `fetchActiveEmergency()`, form submission handlers.
**7. Line-by-line explanation of important code:**
```jsx
useEffect(() => {
    socket.on('emergency_updated', (data) => {
        if (data._id === activeEmergency._id) setActiveEmergency(data);
    });
}, [activeEmergency]);
```
*Reactively listens to WebSocket events. If the backend marks the emergency as "Doctor Assigned", the UI updates instantly without a manual page refresh.*
**8. Interaction with other files:** Composes multiple heavy sub-components (Map, Chat Sidebar, Documents).
**9. Design decisions:** Conditional rendering based on `activeEmergency` state. If null, shows the Report Form. If populated, switches entirely to the active tracking view.
**10. Interview questions:** 
*Q: Why do we pass dependencies into the `useEffect` array?*
*A: To prevent memory leaks and infinite loops, ensuring the socket listener only rebinds if the `activeEmergency` reference actually changes.*
**11. Common mistakes:** Not calling `socket.off('emergency_updated')` in the `useEffect` cleanup return function, causing multiple identical listeners to stack up and crash the browser when navigating away and back.
**12. Possible improvements:** Extract the massive form logic into a custom hook `useEmergencyForm()` to make the visual JSX component cleaner.

---
*Note: This guide targets the critical learning path files that demonstrate the core architectural capabilities of the Life Saviour application (Auth -> REST API -> DB -> WebSockets -> UI Reactivity).*
