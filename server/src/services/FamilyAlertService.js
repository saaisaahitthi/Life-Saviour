const User = require('../models/User');
const notificationService = require('./notificationService');

class FamilyAlertService {
  /**
   * Send emergency alerts to all contacts of a patient
   */
  async sendEmergencyAlerts(io, emergency, patient) {
    const user = await User.findById(patient._id || patient);
    if (!user || !user.emergencyContacts || user.emergencyContacts.length === 0) return [];

    const alerts = [];

    for (const contact of user.emergencyContacts) {
      // In-app notification if the contact has an account
      const contactUser = await User.findOne({ email: contact.email });
      if (contactUser) {
        await notificationService.createNotification(io, {
          recipient: contactUser._id,
          title: '🚨 Family Emergency Alert',
          message: `${user.name} has triggered an emergency. Status: ${emergency.status}. Location: ${emergency.location}`,
          type: 'family_alert',
          referenceId: emergency._id,
          referenceModel: 'Emergency',
          priority: 'critical'
        });
      }

      // Log the alert
      alerts.push({
        contactName: contact.name,
        contactPhone: contact.phone,
        contactEmail: contact.email,
        method: contactUser ? 'in_app' : 'email_queued',
        sentAt: new Date()
      });
    }

    return alerts;
  }

  /**
   * Send status update to family contacts
   */
  async sendStatusUpdate(io, emergency, statusMessage) {
    const user = await User.findById(emergency.patientId);
    if (!user || !user.emergencyContacts) return;

    for (const contact of user.emergencyContacts) {
      const contactUser = await User.findOne({ email: contact.email });
      if (contactUser) {
        await notificationService.createNotification(io, {
          recipient: contactUser._id,
          title: '📋 Emergency Status Update',
          message: `Update for ${user.name}: ${statusMessage}`,
          type: 'family_update',
          referenceId: emergency._id,
          referenceModel: 'Emergency',
          priority: 'medium'
        });
      }
    }
  }
}

module.exports = new FamilyAlertService();
