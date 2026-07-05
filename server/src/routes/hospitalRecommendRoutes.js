const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const recommender = require('../services/SmartHospitalRecommender');
const Emergency = require('../models/Emergency');

// Get AI hospital recommendations for an emergency
router.get('/recommend/:emergencyId', protect, async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.emergencyId);
    if (!emergency) return res.status(404).json({ message: 'Emergency not found' });

    const result = await recommender.recommend(emergency);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Recommendation failed', error: err.message });
  }
});

// Override hospital recommendation (doctor can choose a different hospital)
router.put('/override/:emergencyId', protect, async (req, res) => {
  try {
    const { hospitalId, reason } = req.body;
    const emergency = await Emergency.findByIdAndUpdate(
      req.params.emergencyId,
      { assignedHospital: hospitalId, hospitalOverrideReason: reason },
      { new: true }
    ).populate('assignedHospital');

    if (req.io) req.io.to(`emergency_${emergency._id}`).emit('emergency_updated', emergency);
    res.json(emergency);
  } catch (err) {
    res.status(500).json({ message: 'Override failed', error: err.message });
  }
});

module.exports = router;
