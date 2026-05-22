const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/overview', protect, analyticsController.getOverview);
router.get('/hospitals', protect, analyticsController.getHospitals);
router.get('/export-csv', protect, authorize('admin'), analyticsController.exportCSV);

module.exports = router;
