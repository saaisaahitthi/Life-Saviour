const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Join user's own room for notifications
    socket.on('join_user', (userId) => {
      socket.join(userId);
      console.log(`👤 User joined private room: ${userId}`);
    });

    // Join hospital room for new emergency broadcasts
    socket.on('join_hospital', (hospitalId) => {
      const room = `hospital_${hospitalId}`;
      socket.join(room);
      console.log(`👤 Doctor socket ${socket.id} joined hospital room: ${room}`);
    });

    // Join emergency room
    socket.on('join_emergency', (emergencyId) => {
      const room = `emergency_${emergencyId}`;
      socket.join(room);
      console.log(`👤 Socket ${socket.id} joined room: ${room}`);
      socket.to(room).emit('user_joined', {
        socketId: socket.id,
        emergencyId,
        timestamp: new Date()
      });
    });

    // Leave emergency room
    socket.on('leave_emergency', (emergencyId) => {
      const room = `emergency_${emergencyId}`;
      socket.leave(room);
      console.log(`👤 Socket ${socket.id} left room: ${room}`);
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { emergencyId, senderId, senderName, senderRole, message, type, imageUrl } = data;

        const chatMessage = await ChatMessage.create({
          emergencyId,
          senderId,
          senderName,
          senderRole,
          message,
          type: type || 'text',
          imageUrl,
          readBy: [{ userId: senderId }]
        });

        const room = `emergency_${emergencyId}`;
        io.to(room).emit('receive_message', {
          _id: chatMessage._id,
          emergencyId: chatMessage.emergencyId,
          senderId: chatMessage.senderId,
          senderName: chatMessage.senderName,
          senderRole: chatMessage.senderRole,
          message: chatMessage.message,
          type: chatMessage.type,
          imageUrl: chatMessage.imageUrl,
          status: chatMessage.status,
          readBy: chatMessage.readBy,
          createdAt: chatMessage.createdAt
        });
      } catch (error) {
        console.error('Message send error:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { emergencyId, userName, userRole } = data;
      const room = `emergency_${emergencyId}`;
      socket.to(room).emit('typing', { userName, userRole });
    });

    // Stop typing
    socket.on('stop_typing', (data) => {
      const { emergencyId } = data;
      const room = `emergency_${emergencyId}`;
      socket.to(room).emit('stop_typing');
    });

    // Location update
    socket.on('location_update', (data) => {
      const { emergencyId, lat, lng } = data;
      const room = `emergency_${emergencyId}`;
      socket.to(room).emit('location_update', { lat, lng });
    });

    // Wearable Vitals update
    socket.on('wearable_update', (data) => {
      const { emergencyId, vitals } = data;
      const room = `emergency_${emergencyId}`;
      socket.to(room).emit('wearable_update', vitals);
    });

    // Global Driver Location Update
    socket.on('driver_location_update', async (data) => {
      try {
        const { userId, lat, lng } = data;
        await User.findByIdAndUpdate(userId, {
          currentLocation: { lat, lng },
          lastSeen: new Date()
        });
        
        // Broadcast to anyone monitoring all drivers (e.g. admin/dispatch)
        io.emit('all_drivers_location', { userId, lat, lng });
      } catch (error) {
        console.error('Driver location update error:', error);
      }
    });

    // Mark as read
    socket.on('mark_read', async (data) => {
      try {
        const { messageId, userId, emergencyId } = data;
        const msg = await ChatMessage.findById(messageId);
        if (msg) {
          const alreadyRead = msg.readBy.some(r => r.userId.toString() === userId);
          if (!alreadyRead) {
            msg.readBy.push({ userId, readAt: new Date() });
            msg.status = 'read';
            await msg.save();
            const room = `emergency_${emergencyId}`;
            io.to(room).emit('message_read', { messageId, userId });
          }
        }
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Video Call status updates
    socket.on('call_rejected', (data) => {
      const { emergencyId } = data;
      socket.to(`emergency_${emergencyId}`).emit('call_rejected', data);
    });

    socket.on('call_timeout', (data) => {
      const { emergencyId } = data;
      socket.to(`emergency_${emergencyId}`).emit('call_timeout', data);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
};
