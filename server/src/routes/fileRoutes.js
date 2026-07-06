const express = require('express');
const router = express.Router();
const Emergency = require('../models/Emergency');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/upload/:emergencyId', protect, upload.single('file'), async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const { category } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    const attachment = {
      fileName: file.originalname,
      fileType: file.mimetype,
      fileUrl: file.path, // Cloudinary URL

      category: category || 'other',
      uploadedBy: req.user._id
    };

    emergency.attachments.push(attachment);
    await emergency.save();

    // Emit event via socket if available
    if (req.io) {
      req.io.to(emergencyId).emit('new_attachment', {
        emergencyId,
        attachment
      });
    }

    res.status(201).json(attachment);
  } catch (error) {
    res.status(500).json({ message: 'File upload failed', error: error.message });
  }
});

module.exports = router;
