# SENIOR SOFTWARE ENGINEERING INTERVIEW GUIDE
**Project:** Life Saviour  

This guide contains project-specific interview questions derived exclusively from the Life Saviour MERN + Socket.IO + AI architecture.

## 1. HR Questions
**Q1: Why did you choose the MERN stack for Life Saviour?**
* **Answer:** MERN allows a single language (JavaScript/TypeScript) across the stack, accelerating development. MongoDB's flexible schema handles highly variable medical data and AI JSON outputs perfectly, while Node.js's event-driven architecture pairs flawlessly with Socket.IO for real-time tracking.
* **Follow-up:** What were the trade-offs of not using a relational DB like PostgreSQL?
* **Mistake:** Just saying "because it's popular."
* **Why:** Assesses architectural decision-making.

**Q2: How did you handle the pressure of building an emergency response app?**
* **Answer:** By enforcing strict fault tolerance. I implemented circuit breakers in the AI triage so if Gemini fails, a deterministic regex fallback routes the ambulance immediately without crashing.
* **Follow-up:** Give an example of a time the fallback saved a session.
* **Mistake:** Claiming the code never fails.
* **Why:** Assesses engineering maturity and risk mitigation.

**Q3: What was the hardest technical challenge in this project?**
* **Answer:** Synchronizing Socket.IO state with React state without causing infinite re-renders, specifically debouncing the 5-second GPS updates from the ambulance driver to the patient's Leaflet map.
* **Follow-up:** How exactly did you debounce it?
* **Mistake:** Vague answers about "fixing bugs."
* **Why:** Tests depth of technical involvement.

**Q4: How do you ensure patient data privacy in Life Saviour?**
* **Answer:** We implemented room-based Socket.IO broadcasting (`io.to(emergencyId)`) so GPS and chat data never leak globally, coupled with strict RBAC JWT middleware (`authorize('doctor')`) on REST endpoints.
* **Follow-up:** How is the JWT secured on the client?
* **Mistake:** Forgetting to mention the Socket.IO room isolation.
* **Why:** Tests security awareness.

**Q5: If you had 3 more months, what would you improve?**
* **Answer:** I would migrate the Socket.IO instance to use a Redis adapter for horizontal scaling, and migrate the Multer file uploads from the local disk to AWS S3.
* **Follow-up:** How would the Redis adapter work?
* **Mistake:** Suggesting basic UI tweaks instead of architectural scaling.
* **Why:** Tests system design foresight.

## 2. Project Explanation
**2-Minute Elevator Pitch:**
"Life Saviour is a real-time emergency response platform built on the MERN stack. It uses Google Gemini AI to instantly triage patient symptoms, auto-allocates the nearest hospital and ambulance, and provides a real-time WebRTC and Socket.IO dashboard for doctors to monitor the patient's live GPS and wearable vitals while in transit."

**5-Minute Technical Overview:**
"Life Saviour bridges the gap between emergency onset and hospital arrival. The frontend is a React/Vite SPA using Chakra UI. The backend is a Node/Express API heavily reliant on Socket.IO for real-time telemetry. When a patient hits SOS, an HTTP request hits our AI Service. We use Gemini-2.5-Flash to parse symptoms into a strict JSON severity score. The controller then writes to MongoDB and emits a Socket event to the assigned hospital. From there, the ambulance driver's client emits GPS coordinates every 5 seconds, which our Node server broadcasts strictly to the `emergencyId` Socket room. We also implemented PeerJS for WebRTC video calls between the ambulance and the ER, bypassing server bandwidth constraints."

**10-Minute Deep Dive:**
*(Combines the 5-minute overview with a deep dive into the stateless JWT auth, the mongoose pre-save hooks for bcrypt, the fallback regex triage mechanism if the AI rate-limits, and the challenges of debouncing React state to maintain 60fps on the Leaflet map).*

## 3. Beginner Questions
**Q6: What does `mongoose.connect()` do in `db.js`?**
* **Answer:** It establishes a persistent TCP connection to the MongoDB Atlas cluster.
* **Follow-up:** What happens if it fails? (Process exits).
* **Mistake:** Thinking it connects per-request.
* **Why:** Tests basic ODM knowledge.

**Q7: Why do we use `express.json()`?**
* **Answer:** It's a middleware that parses incoming HTTP request bodies with `application/json` headers into the `req.body` object.
* **Follow-up:** Where should it be placed in `server.js`?
* **Mistake:** Not knowing it's a built-in body-parser.
* **Why:** Fundamental Express knowledge.

**Q8: What is the purpose of `.env` files in this project?**
* **Answer:** To store secrets like `MONGO_URI` and `JWT_SECRET` so they aren't hardcoded into Git.
* **Follow-up:** How do you access them in Node? (`process.env.VAR_NAME`).
* **Mistake:** Pushing `.env` to GitHub.
* **Why:** Security fundamentals.

**Q9: How do you start the Vite frontend?**
* **Answer:** `npm run dev` which spins up the Vite development server.
* **Follow-up:** What port does it default to? (5173).
* **Mistake:** Confusing it with Webpack commands.
* **Why:** Workflow knowledge.

**Q10: What does the `<BrowserRouter>` do in `main.jsx`?**
* **Answer:** It enables client-side routing, allowing React to switch components without reloading the browser window.
* **Follow-up:** What library provides it? (`react-router-dom`).
* **Mistake:** Thinking it makes server requests.
* **Why:** React fundamentals.

## 4. Intermediate Questions
**Q11: How does the `protect` middleware identify the user?**
* **Answer:** It extracts the Bearer token from the `Authorization` header, verifies it using `jwt.verify(token, secret)`, extracts the decoded `id`, and queries MongoDB (`User.findById`). It then attaches the user document to `req.user`.
* **Follow-up:** What HTTP status is returned if it fails? (401).
* **Mistake:** Trusting a user ID sent in the request body.
* **Why:** Core API security.

**Q12: Why is Socket.IO initialized by wrapping the Express app in `http.createServer()`?**
* **Answer:** Express doesn't natively handle the HTTP Upgrade header required for WebSockets. The native HTTP server intercepts the upgrade request and passes it to Socket.IO, allowing both REST and Sockets on the same port.
* **Follow-up:** Can you run Socket.IO on a different port? (Yes, but CORS gets messy).
* **Mistake:** Trying to attach Socket.IO directly to the Express `app` object.
* **Why:** Backend architecture routing.

**Q13: How does the `Emergency` schema handle AI data?**
* **Answer:** It uses a nested object field (`aiTriage`) to store the category, score, and summary generated by Gemini.
* **Follow-up:** How do you query emergencies with a specific AI category? (`Emergency.find({ 'aiTriage.category': 'cardiac' })`).
* **Mistake:** Storing it as a stringified JSON blob.
* **Why:** MongoDB document design.

**Q14: Explain the `useAuth` hook.**
* **Answer:** It's a custom hook returning `useContext(AuthContext)`, giving components instant access to the logged-in user state and the `logout` function without prop drilling.
* **Follow-up:** What happens if `useAuth` is called outside the `AuthProvider`? (Returns undefined/throws error).
* **Mistake:** Not understanding React Context.
* **Why:** React state management.

**Q15: Why did you use Axios interceptors in `api.js`?**
* **Answer:** To automatically inject the JWT from `localStorage` into the headers of every outgoing request, keeping the codebase DRY.
* **Follow-up:** How do you handle 401 responses globally? (With a response interceptor that triggers a logout).
* **Mistake:** Manually attaching headers in every component.
* **Why:** Frontend DRY principles.

## 5. Advanced Questions
**Q16: Walk me through the asynchronous AI summary generation in `assignDoctor`.**
* **Answer:** When a doctor accepts a case, the controller immediately returns `res.status(200)`. However, it fires `setImmediate(() => aiChatService.generateSummary())` in the background. This prevents the 3-second LLM latency from blocking the HTTP response, making the UI feel instant.
* **Follow-up:** What happens if the background promise fails?
* **Mistake:** `await`ing the summary generation, causing UI lag.
* **Why:** Node.js Event Loop mastery.

**Q17: How did you implement the AI Triage Circuit Breaker?**
* **Answer:** I wrap the Gemini `generateContent` call in a try/catch. If Google's API rate limits or times out, the catch block executes a local `fallbackTriage()` function that uses regex on the symptoms string to return a deterministic JSON object, guaranteeing 100% uptime.
* **Follow-up:** Why not use exponential backoff instead? (Because emergency dispatch cannot wait 10 seconds).
* **Mistake:** Letting the API throw a 500 and failing the SOS dispatch.
* **Why:** High availability system design.

**Q18: Why is the JWT stored in `localStorage` instead of an HttpOnly cookie?**
* **Answer:** We used `localStorage` for rapid MVP development and ease of access by Axios. However, I know this makes the app vulnerable to XSS attacks. In a true production environment, I would refactor to HttpOnly cookies to prevent JavaScript from reading the token.
* **Follow-up:** What is the CSRF trade-off of cookies?
* **Mistake:** Defending `localStorage` as the most secure option.
* **Why:** Advanced security knowledge.

**Q19: Explain how `req.io` works in your middleware.**
* **Answer:** By running `app.use((req, res, next) => { req.io = io; next(); })` globally in `server.js`, I inject the active Socket instance into every HTTP request. This decouples the REST controllers from the Socket file, allowing `emergencyController.js` to emit a `new_emergency` event without importing the socket singleton.
* **Follow-up:** Is there a memory leak risk here? (No, it passes a reference).
* **Mistake:** Creating a new Socket.IO server inside the controller.
* **Why:** Backend decoupling patterns.

**Q20: How did you prevent the Leaflet map from crushing React's render cycle during GPS updates?**
* **Answer:** The driver's client only emits GPS updates every 5 seconds. On the receiving end, the `LiveMap` component is wrapped in `React.memo()` and relies on stable references so that incoming chat messages don't force the heavy map library to re-render.
* **Follow-up:** How did you isolate the socket state?
* **Mistake:** Storing rapidly changing GPS coordinates in a high-level parent Context.
* **Why:** React performance tuning.

*(Due to length limits, the following sections provide 5 highly concentrated, complex questions each)*

## 6. React Questions
**Q21:** How do you handle the cleanup of Socket listeners in `useEffect` when unmounting the Dashboard? *(Return `socket.off('event')` in the cleanup function).*
**Q22:** Why use React Hook Form for the Emergency report instead of standard `useState`? *(Uncontrolled inputs prevent re-renders on every keystroke).*
**Q23:** How does `<ProtectedRoute>` intercept routing? *(It checks auth state; if false, returns `<Navigate to="/login" replace />`).*
**Q24:** What is the purpose of `<Suspense>` when lazy loading the Admin Dashboard? *(Provides a fallback UI/spinner while the heavy bundle downloads).*
**Q25:** How do you prevent prop drilling when passing language translations to deeply nested components? *(Using `LanguageContext` and a `useLanguage` hook).*

## 7. JavaScript Questions
**Q26:** How does the `cleanMarkdown` function strip Gemini's formatting before JSON parsing? *(Uses regex `.replace(/```json/g, '')`).*
**Q27:** Why use `async/await` in the API service instead of `.then()` callbacks? *(Avoids callback hell, makes the asynchronous DB/AI calls read synchronously).*
**Q28:** What happens if `JSON.parse` fails on the AI output? *(It throws a SyntaxError, which triggers the try/catch fallback block).*
**Q29:** How is `Date.now()` used in the `TimelineEvent` model? *(Passed as a reference, not executed, so Mongoose evaluates it at insertion time).*
**Q30:** Explain object destructuring in your Express controllers. *(e.g., `const { email, password } = req.body` extracts properties cleanly).*

## 8. Node.js / 9. Express Questions
**Q31:** Why is `process.exit(1)` called if `mongoose.connect()` fails? *(Fail-fast principle; Docker/PM2 must know the process is dead to restart it).*
**Q32:** How does the `multer` middleware handle file uploads in the emergency attachment route? *(Parses multipart/form-data, saves to `/uploads/`, and attaches `req.file`).*
**Q33:** What is the difference between `res.json()` and `res.send()`? *(json stringifies objects and sets the correct Content-Type header).*
**Q34:** How do you handle unhandled promise rejections in Node? *(Express error middleware with `next(err)`).*
**Q35:** Why separate Routes, Controllers, and Services? *(Single Responsibility Principle. Routes direct traffic, Controllers handle HTTP, Services handle pure logic).*

## 10. MongoDB Questions
**Q36:** Explain the Mongoose `pre('save')` hook in `User.js`. *(Intercepts the document before DB insertion to bcrypt hash the password if modified).*
**Q37:** Why is `select: false` used on the password field? *(Prevents accidental exposure of the hash when querying user profiles).*
**Q38:** What happens if you try to save a user with an existing email? *(MongoDB throws an E11000 duplicate key error due to the `unique: true` index).*
**Q39:** How does `findByIdAndUpdate` differ from `.save()`? *(It's an atomic DB operation that bypasses Mongoose middleware like pre-save hooks).*
**Q40:** How would you query all emergencies assigned to a specific hospital? *(`Emergency.find({ assignedHospital: req.user.hospitalAffiliation })`).*

## 11. Socket.IO Questions
**Q41:** What is the exact difference between `io.emit()` and `io.to(id).emit()` in Life Saviour? *(The latter isolates broadcasts to a specific Emergency Room).*
**Q42:** Why must the client emit `join_emergency` when viewing a case? *(To tell the Node server to add that client's socket ID to the internal room).*
**Q43:** How does Socket.IO handle network drops? *(Automatic polling fallback and exponential backoff reconnection).*
**Q44:** How do you implement "User is typing..."? *(Emit a `typing` event, set a client-side timeout to emit `stop_typing` after 2s of inactivity).*
**Q45:** What happens if a doctor refreshes the page during an emergency? *(The socket disconnects and reconnects. The `useEffect` must re-emit `join_emergency`).*

## 12. Gemini AI Questions
**Q46:** Why did you use `gemini-2.5-flash` instead of the Pro model? *(Emergency triage requires ultra-low latency; Flash returns in ~1 second).*
**Q47:** How do you prevent Prompt Injection in the Pre-Triage chat? *(By placing the instructions in the `systemInstruction` field, separate from user input).*
**Q48:** How does the prompt force a JSON output? *(By explicitly providing the schema format in the system prompt).*
**Q49:** How do you control token costs in the conversational chat? *(The backend limits the chat history payload to the last 10 messages).*
**Q50:** What PII do you strip before sending data to Gemini? *(Names, emails, phone numbers. Only age, gender, and symptoms are sent).*

## 13. Authentication Questions
**Q51:** Explain the `authorize` middleware factory. *(Returns a closure that checks if `req.user.role` is in the provided array; e.g., `authorize('admin')`).*
**Q52:** What is the cost factor 12 in bcrypt? *(Determines how many times the hashing algorithm loops; slows down brute-force attacks).*
**Q53:** How are passwords verified on login? *(`bcrypt.compare(raw, hashed)`).*
**Q54:** What is the difference between Authentication and Authorization in Life Saviour? *(AuthN verifies WHO you are via JWT. AuthZ verifies WHAT you can do via Role).*
**Q55:** Why doesn't the backend use session cookies? *(Stateless architecture allows API requests to hit any load-balanced server instance).*

## 14. System Design & 15. Scalability Questions
**Q56:** How would you scale the Socket.IO server horizontally? *(Implement Sticky Sessions on the ALB and use the `@socket.io/redis-adapter` so instances can share events).*
**Q57:** If Life Saviour gets 1 million users, what breaks first? *(The MongoDB Atlas connection pool or the local Multer disk storage).*
**Q58:** How would you fix the Multer disk storage issue? *(Migrate to AWS S3 using `multer-s3` so files are centralized, allowing Node servers to be ephemeral).*
**Q59:** How would you implement geo-routing for ambulances? *(Use MongoDB's `2dsphere` indexes and `$near` queries instead of basic math).*
**Q60:** Why decouple the AI Summary generation into a background task? *(To prevent blocking the Node.js event loop and ensure the HTTP response is immediate).*

## 16. Debugging & 17. Security Questions
**Q61:** A user complains they can't login, but their password is correct. What happened? *(The `pre('save')` hook might have re-hashed an already hashed password during a profile update because `isModified` wasn't checked).*
**Q62:** Socket events are firing multiple times per message. Why? *(The `socket.on` listener was placed inside a `useEffect` without a cleanup function, creating duplicate listeners).*
**Q63:** How do you prevent NoSQL injection in Express? *(Use `express-mongo-sanitize` to strip `$` and `.` from the `req.body`).*
**Q64:** Why is `localStorage` dangerous for JWTs? *(Vulnerable to Cross-Site Scripting (XSS) attacks. Malicious scripts can read `localStorage`).*
**Q65:** How do you prevent brute force attacks on `/api/auth/login`? *(Implement `express-rate-limit` to block IPs after 5 failed attempts).*

---
*Note: This guide contains highly condensed, critical Q&A tailored specifically to the exact codebase architecture of Life Saviour, serving as a master checklist for Senior Engineering interviews.*
