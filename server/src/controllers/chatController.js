const ChatMessage = require('../models/ChatMessage');

exports.getMessages = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const messages = await ChatMessage.find({ emergencyId })
      .populate('senderId', 'name role')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { emergencyId, message, type, imageUrl } = req.body;

    const chatMessage = await ChatMessage.create({
      emergencyId,
      senderId: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      message,
      type: type || 'text',
      imageUrl,
      readBy: [{ userId: req.user._id }]
    });

    const populated = await ChatMessage.findById(chatMessage._id)
      .populate('senderId', 'name role');

    // Emit to emergency room
    if (req.io) {
      req.io.to(`emergency_${emergencyId}`).emit('receive_message', populated);
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const alreadyRead = message.readBy.some(r => r.userId.toString() === userId.toString());
    if (!alreadyRead) {
      message.readBy.push({ userId, readAt: new Date() });
      message.status = 'read';
      await message.save();
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark message as read', error: error.message });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload image', error: error.message });
  }
};
