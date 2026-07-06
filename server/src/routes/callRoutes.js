const express = require('express');
const router = express.Router();
const Emergency = require('../models/Emergency');
const { protect } = require('../middleware/auth');

// POST /api/calls
router.post('/', protect, async (req, res) => {
  try {
    const { emergencyId, receiverId, status, duration } = req.body;
    
    if (!emergencyId || !receiverId || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    emergency.callLogs.push({
      callerId: req.user._id,
      receiverId,
      status,
      duration: duration || 0
    });

    await emergency.save();

    res.status(201).json({ message: 'Call logged successfully' });
  } catch (error) {
    console.error('Call logging error:', error);
    res.status(500).json({ message: 'Failed to log call', error: error.message });
  }
});

module.exports = router;
