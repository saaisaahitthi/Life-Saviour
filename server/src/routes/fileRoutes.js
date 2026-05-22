const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Emergency = require('../models/Emergency');
const { protect } = require('../middleware/auth');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

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
      fileUrl: `/uploads/${file.filename}`,
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
