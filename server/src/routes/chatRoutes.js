const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, markAsRead, uploadImage } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/:emergencyId', getMessages);
router.post('/', sendMessage);
router.put('/read/:messageId', markAsRead);
router.post('/upload', upload.single('image'), uploadImage);

module.exports = router;
