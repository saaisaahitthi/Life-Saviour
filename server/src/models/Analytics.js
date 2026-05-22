const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['daily_summary', 'hourly_trend', 'hospital_performance', 'responder_efficiency'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  metrics: {
    totalEmergencies: Number,
    criticalCount: Number,
    resolvedCount: Number,
    averageResponseTime: Number, // in minutes
    averageAmbulanceArrival: Number, // in minutes
    categoryDistribution: mongoose.Schema.Types.Mixed,
    severityDistribution: mongoose.Schema.Types.Mixed,
    peakHours: [Number],
    zoneDistribution: mongoose.Schema.Types.Mixed
  },
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Index for efficient querying
analyticsSchema.index({ type: 1, date: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
