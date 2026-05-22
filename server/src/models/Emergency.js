const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  location: {
    type: String,
    required: true
  },
  coordinates: {
    lat: Number,
    lng: Number
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'critical'],
    required: true
  },
  symptoms: {
    type: String,
    required: true
  },
  additionalNotes: {
    type: String
  },
  triageInputs: {
    breathingDifficulty: { type: Number, min: 1, max: 10 },
    painLevel: { type: Number, min: 1, max: 10 },
    consciousnessState: { type: String, enum: ['conscious', 'confused', 'unconscious'] }
  },
  voiceTranscript: String,
  extractedSymptoms: [String],
  transportType: {
    type: String,
    enum: ['ambulance', 'cab'],
    default: 'ambulance'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'dropped_off', 'resolved', 'cancelled'],
    default: 'pending'
  },
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
  },
  aiTriage: {
    category: String,
    severityScore: Number,
    priorityLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    recommendedDepartment: String,
    analysisSummary: String,
    chatSummary: String
  },
  resolutionNotes: {
    type: String
  },
  resolvedAt: {
    type: Date
  },
  zone: {
    type: String,
    enum: ['North', 'South', 'East', 'West', 'Central'],
    default: 'Central'
  },
  attachments: [{
    fileName: String,
    fileType: String,
    fileUrl: String,
    category: {
      type: String,
      enum: ['prescription', 'scan', 'blood_report', 'x-ray', 'injury_image', 'discharge_summary', 'other'],
      default: 'other'
    },
    aiSummary: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  wearableSnapshot: {
    deviceName: String,
    heartRate: Number,
    bloodOxygen: Number,
    bloodPressure: String,
    temperature: Number,
    stressLevel: Number,
    steps: Number,
    capturedAt: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Emergency', emergencySchema);
