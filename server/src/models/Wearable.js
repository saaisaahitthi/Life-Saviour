const mongoose = require('mongoose');

const wearableDeviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deviceType: { type: String, enum: ['smartwatch', 'fitness_band', 'heart_monitor', 'fall_detector', 'pulse_oximeter'], required: true },
  deviceName: { type: String, required: true },
  deviceId: { type: String, unique: true },
  isConnected: { type: Boolean, default: false },
  lastSync: { type: Date, default: Date.now },
  batteryLevel: { type: Number, default: 100 }
}, { timestamps: true });

const vitalLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deviceId: { type: String },
  heartRate: Number,
  spO2: Number,
  bodyTemperature: Number,
  bloodPressure: { systolic: Number, diastolic: Number },
  steps: Number,
  movement: { type: String, enum: ['normal', 'low', 'none', 'fall_detected'] },
  gps: { lat: Number, lng: Number },
  alertTriggered: { type: Boolean, default: false },
  alertType: { type: String, enum: ['abnormal_hr', 'fall', 'low_spo2', 'panic', 'inactivity'] },
  timestamp: { type: Date, default: Date.now }
});

vitalLogSchema.index({ userId: 1, timestamp: -1 });

const WearableDevice = mongoose.model('WearableDevice', wearableDeviceSchema);
const VitalLog = mongoose.model('VitalLog', vitalLogSchema);

module.exports = { WearableDevice, VitalLog };
