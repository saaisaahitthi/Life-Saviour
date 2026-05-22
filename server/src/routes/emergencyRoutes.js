const express = require('express');
const router = express.Router();
const {
  createEmergency,
  getAllEmergencies,
  getMyEmergencies,
  getEmergencyById,
  updateEmergency,
  assignDoctor,
  assignDriver,
  resolveEmergency,
  getActiveEmergencies,
  getTimeline
} = require('../controllers/emergencyController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('patient'), createEmergency);
router.get('/', getAllEmergencies);
router.get('/my', getMyEmergencies);
router.get('/active', getActiveEmergencies);
router.get('/:id', getEmergencyById);
router.put('/:id', updateEmergency);
router.put('/:id/assign-doctor', authorize('doctor'), assignDoctor);
router.put('/:id/assign-driver', authorize('doctor', 'driver'), assignDriver);
router.put('/:id/resolve', authorize('doctor', 'driver'), resolveEmergency);
router.get('/:id/timeline', getTimeline);

module.exports = router;
