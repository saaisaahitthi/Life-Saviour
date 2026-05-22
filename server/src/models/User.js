const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'driver', 'admin'],
    required: [true, 'Role is required']
  },
  phone: {
    type: String,
    trim: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  specialization: {
    type: String,
    enum: ['cardiology', 'trauma', 'neurology', 'respiratory', 'general', 'orthopedics', 'pediatrics'],
    trim: true
  },
  vehicleNumber: {
    type: String,
    trim: true
  },
  hospitalAffiliation: {
    type: String,
    trim: true
  },
  emergencyContacts: [{
    name: String,
    phone: String,
    email: String,
    relationship: String
  }],
  preferredLanguage: {
    type: String,
    enum: ['en', 'hi', 'te'],
    default: 'en'
  },
  currentLocation: {
    lat: Number,
    lng: Number
  },
  availabilityStatus: {
    type: String,
    enum: ['available', 'busy', 'offline'],
    default: 'available'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
