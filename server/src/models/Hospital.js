const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  capacity: {
    icuBeds: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 }
    },
    emergencyBeds: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 }
    },
    ventilators: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 }
    },
    oxygenSupport: { type: Boolean, default: false }
  },
  specializations: [{
    type: String,
    enum: ['cardiology', 'trauma', 'neurology', 'respiratory', 'general']
  }],
  contactNumber: String,
  status: {
    type: String,
    enum: ['active', 'full', 'maintenance'],
    default: 'active'
  },
  zone: {
    type: String,
    enum: ['North', 'South', 'East', 'West', 'Central'],
    default: 'Central'
  },
  regionalZone: {
    type: String,
    required: true,
    default: 'Metropolitan'
  },
  networkId: {
    type: String,
    default: 'NET-001'
  },
  hospitalType: {
    type: String,
    enum: ['public', 'private', 'specialized'],
    default: 'public'
  },
  operationalLevel: {
    type: String,
    enum: ['Level 1 (Trauma)', 'Level 2 (Specialist)', 'Level 3 (General)'],
    default: 'Level 3 (General)'
  },
  isOverloaded: {
    type: Boolean,
    default: false
  },
  assignedAmbulances: {
    type: Number,
    default: 5
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Hospital', hospitalSchema);
