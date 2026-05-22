const Notification = require('../models/Notification');

/**
 * Notification Service
 * Handles creation and distribution of in-app and socket notifications.
 */

const createNotification = async (io, data) => {
  const { recipient, title, message, type, referenceId, referenceModel, priority } = data;

  try {
    const notification = await Notification.create({
      recipient,
      title,
      message,
      type,
      referenceId,
      referenceModel,
      priority
    });

    // Emit to specific user via socket if available
    if (io) {
      // Assuming users are joined to rooms named after their user ID
      io.to(recipient.toString()).emit('new_notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Notification Creation Error:', error);
    throw error;
  }
};

const getNotificationsByUser = async (userId) => {
  return await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(50);
};

const markAsRead = async (notificationId) => {
  return await Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
};

module.exports = {
  createNotification,
  getNotificationsByUser,
  markAsRead
};
