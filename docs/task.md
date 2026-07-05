# Task Checklist: Production Architecture Rewrite

- [x] **Phase 1: Socket.IO Room Scoping**
  - [x] Update `chatSocket.js` to handle `join_hospital` and `join_emergency`.
  - [x] Refactor `emergencyController.js` to emit `new_emergency` only to `hospital_[id]`.
  - [x] Refactor all status update controllers to emit `emergency_updated` only to `emergency_[id]`.
  - [x] Verify frontend hooks successfully join the required rooms upon authentication/creation.

- [x] **Phase 2: Driver Acceptance Queue**
  - [x] Update `Emergency.js` schema to include `pendingDriver` and `ignoredDrivers` fields.
  - [x] Refactor `dispatchService.js` to emit `driver_requested` to a specific driver ID and start a 30s timeout.
  - [x] Add `/accept-dispatch` (or modify `assignDriver`) and `/decline-dispatch` routes to handle driver responses.
  - [x] Implement timeout logic to recursively assign the next available driver if ignored/declined.
  - [x] Update frontend `DriverDashboard.jsx` to render a 30-second Accept/Decline modal.
  - [ ] Wire up the Accept and Decline buttons to the new API routes.

- [ ] **Phase 4: Documentation Update**
  - [ ] Update the Architecture Review Log to mark these items as officially implemented.
  - [ ] Create a Walkthrough summarizing the changes.
