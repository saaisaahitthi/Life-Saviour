const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const familyAlertService = require('../services/FamilyAlertService');

// Get emergency contacts
router.get('/contacts', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('emergencyContacts');
    res.json(user.emergencyContacts || []);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch contacts', error: err.message });
  }
});

// Add emergency contact
router.post('/contacts', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.emergencyContacts.push(req.body);
    await user.save();
    res.status(201).json(user.emergencyContacts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add contact', error: err.message });
  }
});

// Remove emergency contact
router.delete('/contacts/:contactId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.emergencyContacts = user.emergencyContacts.filter(
      c => c._id.toString() !== req.params.contactId
    );
    await user.save();
    res.json(user.emergencyContacts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove contact', error: err.message });
  }
});

// Update preferred language
router.put('/language', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { preferredLanguage: req.body.language }, { new: true });
    res.json({ language: user.preferredLanguage });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update language', error: err.message });
  }
});

module.exports = router;
