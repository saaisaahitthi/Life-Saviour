const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['emergency_created', 'ambulance_assigned', 'doctor_joined', 'hospital_assigned', 'emergency_resolved', 'system'],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId, // Emergency ID or other relevant ID
    refPath: 'referenceModel'
  },
  referenceModel: {
    type: String,
    enum: ['Emergency', 'User']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
