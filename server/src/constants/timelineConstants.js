const TIMELINE_EVENT_TYPES = {
  MEDICAL: 'medical',
  DISPATCH: 'dispatch',
  TRANSPORT: 'transport',
  HOSPITAL: 'hospital',
  SYSTEM: 'system',
  STATUS_CHANGE: 'status_change',
  ASSIGNMENT: 'assignment'
};

const TIMELINE_TITLES = {
  EMERGENCY_CREATED: 'Emergency Created',
  DOCTOR_ASSIGNED: 'Doctor Assigned',
  AMBULANCE_DISPATCHED: 'Ambulance Dispatched',
  AMBULANCE_ARRIVED: 'Ambulance Arrived',
  PATIENT_DROPPED: 'Patient Dropped',
  EMERGENCY_RESOLVED: 'Emergency Resolved',
  AI_TRIAGE_COMPLETED: 'AI Triage Completed'
};

module.exports = {
  TIMELINE_EVENT_TYPES,
  TIMELINE_TITLES
};
