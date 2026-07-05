# Interview Q&A Tracker

*This is a living document tracking anticipated interview questions based on the Life Saviour technology stack and architecture. As we uncover new architectural decisions in the codebase, we will add them here so you are prepared to defend every design choice.*

---

## 1. Why MERN Stack?
**Q: Why did you choose MongoDB, Express, React, and Node.js for this project?**
**Ideal Answer:** MERN allows for a unified language (JavaScript) across the entire stack, drastically accelerating development for the MVP. MongoDB's schema flexibility is perfect for handling highly unstructured medical data and AI-generated JSON payloads, while Node.js's asynchronous, event-driven non-blocking I/O pairs flawlessly with Socket.IO for real-time telemetry.

## 2. Why Socket.IO?
**Q: Why use Socket.IO instead of raw WebSockets or Server-Sent Events (SSE)?**
**Ideal Answer:** While SSE is great for one-way data, we required bi-directional communication (e.g., driver sending GPS, server sending dispatch updates). Socket.IO was chosen over raw WebSockets because it provides built-in room support (crucial for our data isolation), auto-reconnection with exponential backoff (vital for mobile ambulances driving through dead zones), and a fallback to HTTP long-polling if corporate hospital firewalls block WebSocket upgrades.

## 3. Why React?
**Q: Why build the frontend in React instead of a server-rendered framework?**
**Ideal Answer:** The core of Life Saviour is a highly interactive, real-time dashboard. React's virtual DOM allows us to efficiently re-render specific components—like the driver's GPS marker on the map—without reloading the entire page. Paired with React Router, it provides a seamless Single Page Application (SPA) experience critical for emergency operators who cannot afford page load latency.

## 4. Why JWT (JSON Web Tokens)?
**Q: Why use stateless JWTs instead of traditional server-side session cookies?**
**Ideal Answer:** Scalability. If we use server-side sessions, we are forced to implement sticky sessions or a centralized Redis cache just to authenticate users across a load-balanced cluster. With JWTs, the authentication state is cryptographically signed and stored on the client. Any Node.js instance in our cluster can instantly verify the token's validity without hitting a database, allowing massive horizontal scaling.

## 5. Why LocalStorage for JWT?
**Q: I see you store your JWT in LocalStorage. What are the trade-offs?**
**Ideal Answer:** We utilized LocalStorage for the MVP to quickly establish our Auth state and easily inject it into Axios interceptors. However, I am well aware this exposes the token to Cross-Site Scripting (XSS) attacks. In a true production environment, my priority would be migrating to HttpOnly, Secure, SameSite cookies to protect the session from malicious JavaScript.

## 6. Why Google Gemini?
**Q: Why use Google Gemini Flash instead of GPT-4 or Gemini Pro for your AI Triage?**
**Ideal Answer:** In an emergency response system, latency is more critical than complex reasoning depth. The Gemini Flash model consistently returns highly structured JSON responses in under 2 seconds. Using heavier models introduced unacceptable latency (5-10 seconds), which delayed ambulance dispatch.

## 7. Why AI Fallback?
**Q: What happens if the Gemini API goes down? Does the app crash?**
**Ideal Answer:** No. We implemented a circuit breaker pattern in the `aiService`. If the API rate-limits, times out, or hallucinates invalid JSON, the code catches the error and instantly routes the symptom string through a deterministic regex/keyword parser. It guarantees 100% dispatch uptime regardless of the AI provider's status.

## 8. Why Separate Services?
**Q: Why are your Controllers and Services separated in the backend?**
**Ideal Answer:** To enforce the Single Responsibility Principle and decouple our domain logic from HTTP. For example, our `dispatchService` calculates the nearest ambulance. By keeping it separate from the HTTP Controller, I can trigger that exact same dispatch logic via a REST API call (`POST`), a Socket.IO event, or a background Cron Job without rewriting any code.

---

*New "Why?" questions will be appended here as we study the project.*
