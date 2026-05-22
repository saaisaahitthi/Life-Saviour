const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const iotService = require('../services/IoTService');

// Register a device
router.post('/devices', protect, async (req, res) => {
  try {
    const device = await iotService.registerDevice(req.user._id, req.body);
    res.status(201).json(device);
  } catch (err) {
    res.status(500).json({ message: 'Failed to register device', error: err.message });
  }
});

// Get user devices
router.get('/devices', protect, async (req, res) => {
  try {
    const devices = await iotService.getUserDevices(req.user._id);
    res.json(devices);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch devices', error: err.message });
  }
});

// Ingest vitals
router.post('/vitals', protect, async (req, res) => {
  try {
    const result = await iotService.ingestVitals(req.user._id, req.body, req.io);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to ingest vitals', error: err.message });
  }
});

// Get recent vitals
router.get('/vitals', protect, async (req, res) => {
  try {
    const vitals = await iotService.getRecentVitals(req.user._id, parseInt(req.query.limit) || 50);
    res.json(vitals);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch vitals', error: err.message });
  }
});

// Get simulated vitals (for demo)
router.get('/simulate', protect, (req, res) => {
  res.json(iotService.generateSimulatedVitals());
});

module.exports = router;
