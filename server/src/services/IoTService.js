const { WearableDevice, VitalLog } = require('../models/Wearable');
const Emergency = require('../models/Emergency');
const User = require('../models/User');

class IoTService {
  /**
   * Register a wearable device for a user
   */
  async registerDevice(userId, deviceData) {
    return WearableDevice.create({ userId, ...deviceData });
  }

  /**
   * Ingest vital data from a wearable device and check for alerts
   */
  async ingestVitals(userId, vitals, io) {
    const log = await VitalLog.create({ userId, ...vitals });

    // Check for anomalies and auto-trigger emergency
    const alerts = [];
    if (vitals.heartRate && (vitals.heartRate > 150 || vitals.heartRate < 40)) {
      alerts.push({ type: 'abnormal_hr', message: `Abnormal heart rate: ${vitals.heartRate} BPM` });
    }
    if (vitals.spO2 && vitals.spO2 < 90) {
      alerts.push({ type: 'low_spo2', message: `Dangerous SpO2 level: ${vitals.spO2}%` });
    }
    if (vitals.movement === 'fall_detected') {
      alerts.push({ type: 'fall', message: 'Fall detected with no subsequent movement' });
    }

    if (alerts.length > 0) {
      log.alertTriggered = true;
      log.alertType = alerts[0].type;
      await log.save();

      // Emit alert to the patient's dashboard
      if (io) {
        io.emit(`vital_alert_${userId}`, { alerts, vitals, timestamp: new Date() });
      }
    }

    return { log, alerts };
  }

  /**
   * Get recent vitals for a user
   */
  async getRecentVitals(userId, limit = 50) {
    return VitalLog.find({ userId }).sort({ timestamp: -1 }).limit(limit);
  }

  /**
   * Get connected devices for a user
   */
  async getUserDevices(userId) {
    return WearableDevice.find({ userId });
  }

  /**
   * Simulate wearable data for demo purposes
   */
  generateSimulatedVitals() {
    return {
      heartRate: Math.floor(60 + Math.random() * 40),
      spO2: Math.floor(94 + Math.random() * 6),
      bodyTemperature: (36.1 + Math.random() * 1.5).toFixed(1),
      bloodPressure: { systolic: 110 + Math.floor(Math.random() * 30), diastolic: 70 + Math.floor(Math.random() * 15) },
      steps: Math.floor(Math.random() * 200),
      movement: 'normal'
    };
  }
}

module.exports = new IoTService();
