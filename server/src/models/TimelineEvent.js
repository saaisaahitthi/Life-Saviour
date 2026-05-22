const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema({
  emergencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Emergency',
    required: true
  },
  type: {
    type: String,
    enum: ['medical', 'dispatch', 'transport', 'hospital', 'system', 'status_change', 'assignment'],
    default: 'system'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  actor: {
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    role: String
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TimelineEvent', timelineEventSchema);
