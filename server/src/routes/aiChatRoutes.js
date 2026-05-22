const express = require('express');
const router = express.Router();
const { sendMessage, getChatHistory } = require('../controllers/aiChatController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/message', sendMessage);
router.get('/history/:emergencyId', getChatHistory);

module.exports = router;
