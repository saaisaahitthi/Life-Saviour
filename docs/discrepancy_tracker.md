# Architecture Discrepancy Tracker

*This is a living document used to track gaps between the **Current Implementation** of the Life Saviour codebase and ideal **Production Improvements**. We will collect all observations here during our study sessions, and use this list to perform a single, comprehensive batch update to our main documentation suite and GitHub repository once our learning is complete.*

---

## 1. Driver Dispatch & Assignment

### Current Implementation
- Backend calculates minimum distance to all available drivers.
- Immediately assigns the nearest driver (`assignedDriver = nearestDriver`).
- Immediately marks the driver as busy (`availabilityStatus = busy`).
- Emits a notification to the driver.
- There is no explicit acceptance or rejection step; the driver is forced into the mission.

### Production Improvement
- Driver receives a mission request.
- A 30-second acknowledgment window (timeout) begins.
- If the driver accepts, the assignment is finalized.
- If the timeout expires or the driver rejects, the request is automatically routed to the *next* nearest available driver via a queue system.

---

## 2. Real-Time Emergency Socket Events

### Current Implementation
- When an emergency is created, the backend executes `req.io.emit("new_emergency", populated)`.
- When an emergency status updates, the backend executes `req.io.emit("emergency_updated", emergency)`.
- These are **global emits**, meaning every single connected client (all patients, all doctors, all drivers) receives the WebSocket packet, regardless of their hospital affiliation or active room.

### Production Improvement
- Events should be scoped using Socket.IO rooms.
- `new_emergency` should be emitted strictly to a `hospitalRoom` (e.g., `io.to(assignedHospitalId).emit(...)`) so only online doctors affiliated with that hospital receive the ping.
- `emergency_updated` should be emitted strictly to the specific emergency room (e.g., `io.to(emergencyId).emit(...)`) to reduce unnecessary network bandwidth and improve patient data privacy.

---

## 3. JWT Authentication Storage

### Current Implementation
- JWT tokens are sent in the JSON response body upon login/signup.
- The frontend stores these tokens in `localStorage`.
- While easy to implement, this leaves the session vulnerable to Cross-Site Scripting (XSS) attacks.

### Production Improvement
- Move JWT storage to **HttpOnly, Secure Cookies**.
- Implement a dual-token system (short-lived Access Token, long-lived Refresh Token) with Token Rotation to mitigate token theft.

---

*New discrepancies will be appended here as we continue exploring the source code.*
