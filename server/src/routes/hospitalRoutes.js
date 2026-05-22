const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin'), hospitalController.createHospital);
router.get('/', protect, hospitalController.getHospitals);

module.exports = router;
