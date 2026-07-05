# Architecture Review Log

*This is a living document used to track the technical gap between the Life Saviour MVP implementation and a production-grade architecture. We will collect observations here during our study sessions, separating verified facts from proposed improvements.*

---

## 1. Driver Dispatch Workflow

**Priority:** 🔴 High  
**Impact:** Reliability, User Experience, Scalability  
**Verification Status:** ✅ Implemented (Driver Acceptance Queue + 30s Timeout)  
**Files Verified:** `dispatchService.js`, `emergencyController.js`, `DriverDashboard.jsx`

### Current Implementation
The backend calculates the minimum distance to all available drivers. The nearest available driver is immediately assigned to the emergency. The backend then alters the driver's availability to `busy` without receiving an explicit acknowledgment from the driver's client.

### Why it works
Suitable for an MVP to keep the dispatch logic simple, reduce implementation complexity, and focus on delivering the core SOS workflow first.

### Limitations
The driver may ignore the notification or be physically unable to respond. Because there is no timeout or retry mechanism, the emergency could remain stuck in an assigned state without the ambulance actually moving.

### Production Improvement
Introduce an acknowledgment window (e.g., 30 seconds). The driver can Accept or Reject. If the timeout expires or the request is rejected, trigger an automatic reassignment queue to ping the next nearest driver.

### Interview Discussion
> *"Our current implementation immediately assigns the nearest available driver. While this works perfectly for an MVP, a production-grade system would introduce an acknowledgment window, automatic reassignment, and queue-based dispatch similar to ride-sharing platforms to ensure 100% mission reliability."*

---

## 2. Real-Time Socket Event Scoping

**Priority:** 🔴 High  
**Impact:** Performance, Security, Privacy  
**Verification Status:** ✅ Implemented (Hospital/Emergency Rooms Scoped)  
**Files Verified:** `emergencyController.js`, `chatSocket.js`, `socket.js`, `DoctorDashboard.jsx`

### Current Implementation
The current implementation uses `io.emit()` for `new_emergency` and `emergency_updated` events. This broadcasts the event to all connected Socket.IO clients globally. Application-level filtering may still occur on the receiving side (React), but the event is not scoped at the transport layer.

### Why it works
Simplifies the initial WebSocket notification flow by eliminating the need to track specific hospital room memberships upon doctor login.

### Limitations
Wastes bandwidth by sending payload data to clients who do not need it. Exposes potentially sensitive emergency status data to unintended authenticated clients if they manually listen for the event.

### Production Improvement
Events should be scoped using Socket.IO rooms. `new_emergency` should be emitted to a `hospitalRoom` (`io.to(hospitalId)`). `emergency_updated` should be emitted directly to the assigned `emergencyId` room.

### Interview Discussion
> *"Currently, we use a global emit to push emergency updates to the dashboard. In a production environment, I would refactor this to use strict Socket.IO rooms, ensuring that status updates are only broadcast to the specific doctor and driver assigned to the case, significantly reducing bandwidth and tightening data privacy."*

---

## 3. JWT Authentication Storage

**Priority:** 🔴 High  
**Impact:** Security  
**Verification Status:** ✅ Frontend/Backend Verified  
**Files Verified:** `authController.js`, `AuthContext.jsx`

### Current Implementation
JWT tokens are returned in the JSON response body and stored by the frontend in browser `localStorage`. 

### Why it works
Easy to implement and seamlessly integrates with Axios interceptors across the React application.

### Limitations
`localStorage` is accessible via JavaScript, leaving the session token vulnerable to Cross-Site Scripting (XSS) attacks if malicious scripts are injected into the page.

### Production Improvement
Move JWT storage to HttpOnly, Secure, SameSite cookies. Implement a dual-token system (short-lived Access Token, long-lived Refresh Token) with Token Rotation.

### Interview Discussion
> *"We utilized localStorage for the MVP to quickly establish our JWT state management. However, knowing the XSS vulnerabilities associated with localStorage, my priority for scaling this app to production would be migrating authentication to strictly use HttpOnly cookies."*
