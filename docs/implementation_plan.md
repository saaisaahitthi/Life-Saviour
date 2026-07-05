# Production Architecture Overhaul Plan

Per your request, we are now going to rewrite the backend and frontend to implement the production-grade architectural changes we documented. I have designed a zero-mistake implementation plan for this.

## Open Questions

> [!WARNING]
> **Before I execute this massive rewrite, please review the approach below:**
> 1. Implementing a 30-second driver timeout using raw `setTimeout` inside Node.js means if the Node server restarts during a timeout, the queue halts. For this project, a memory-based `setTimeout` is fine, but I want to ensure you are okay with this rather than setting up Redis/BullMQ (which adds heavy infrastructure overhead).
> 2. The Driver Dashboard UI will need to be updated to show an "Accept / Decline" modal when a mission comes in. Is this acceptable?

## Proposed Changes

We will execute this in two distinct phases.

### Phase 1: Socket.IO Room Scoping

We will eliminate the global `io.emit()` bottleneck.

#### [MODIFY] server/src/sockets/chatSocket.js
- Add listeners for `join_hospital` and `join_emergency`.
- When a doctor connects, they will join `hospital_${hospitalId}`.
- When an emergency is assigned, all participants will join `emergency_${emergencyId}`.

#### [MODIFY] server/src/controllers/emergencyController.js
- Replace `req.io.emit('new_emergency', ...)` with `req.io.to('hospital_' + hospital._id).emit('new_emergency', ...)`.
- Replace all global `emergency_updated` emits with `req.io.to('emergency_' + emergency._id).emit('emergency_updated', ...)`.

#### [MODIFY] client/src/pages/DoctorDashboard.jsx (and others)
- Inject the `socket.emit('join_hospital', user.hospitalAffiliation)` command upon component mount.
- Ensure the client only listens to scoped events.

---

### Phase 2: Driver Acceptance Queue

We will replace the immediate auto-assignment with an Uber-style 30-second acknowledgment queue.

#### [MODIFY] server/src/models/Emergency.js
- Add a `pendingDriver` field to track which driver is currently evaluating the 30-second request.

#### [MODIFY] server/src/services/dispatchService.js
- **Rewrite `assignNearestAmbulance`**:
  1. Find all available drivers and sort them by distance.
  2. Take the nearest driver and set them as `pendingDriver` on the Emergency.
  3. Emit a `driver_requested` Socket event strictly to that driver.
  4. Initiate a `setTimeout` for 30 seconds.
  5. If 30 seconds elapse without the driver hitting the accept route, the service removes them from the pending state and recursively pings the *next* nearest driver.

#### [NEW] server/src/routes/emergencyRoutes.js & Controllers
- Create two new HTTP endpoints:
  - `POST /api/emergencies/:id/accept-dispatch`
  - `POST /api/emergencies/:id/reject-dispatch`

#### [MODIFY] client/src/pages/DriverDashboard.jsx
- Remove the assumption that a dispatch is final.
- Build a temporary "Incoming Mission" UI modal that displays when `driver_requested` is received via Socket.
- Add "Accept" and "Decline" buttons that hit the new API routes.

## Verification Plan

### Automated/Manual Verification
1. I will log in as a Doctor and verify I only receive `new_emergency` events for my specific hospital.
2. I will trigger a dispatch and ignore it for 30 seconds as Driver A, verifying that Driver B eventually receives the ping.
3. I will test the manual "Reject" button to ensure it immediately triggers the next driver without waiting the full 30 seconds.
