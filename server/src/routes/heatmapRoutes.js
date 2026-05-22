const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Emergency = require('../models/Emergency');

// Get emergency heatmap data (geospatial aggregation)
router.get('/heatmap', protect, async (req, res) => {
  try {
    const emergencies = await Emergency.find({
      'coordinates.lat': { $exists: true }
    }).select('coordinates severity aiTriage.category status createdAt location').lean();

    const heatPoints = emergencies.map(e => ({
      lat: e.coordinates.lat,
      lng: e.coordinates.lng,
      severity: e.severity,
      category: e.aiTriage?.category || 'general',
      status: e.status,
      location: e.location,
      time: e.createdAt
    }));

    res.json(heatPoints);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch heatmap data', error: err.message });
  }
});

// Get emergency hotspots (clustered analysis)
router.get('/hotspots', protect, async (req, res) => {
  try {
    const emergencies = await Emergency.aggregate([
      { $match: { 'coordinates.lat': { $exists: true } } },
      { $group: {
        _id: { $substr: ['$location', 0, 20] },
        count: { $sum: 1 },
        avgLat: { $avg: '$coordinates.lat' },
        avgLng: { $avg: '$coordinates.lng' },
        criticalCount: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
        categories: { $addToSet: '$aiTriage.category' }
      }},
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.json(emergencies);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch hotspots', error: err.message });
  }
});

// Get time-based emergency trends
router.get('/trends', protect, async (req, res) => {
  try {
    const trends = await Emergency.aggregate([
      { $group: {
        _id: { $hour: '$createdAt' },
        count: { $sum: 1 },
        criticalCount: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } }
      }},
      { $sort: { '_id': 1 } }
    ]);

    res.json(trends);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch trends', error: err.message });
  }
});

module.exports = router;
