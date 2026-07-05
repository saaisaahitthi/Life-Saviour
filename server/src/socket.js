const jwt = require('jsonwebtoken');

let io;

module.exports = {
  init: (serverInstance) => {
    const { Server } = require('socket.io');
    io = new Server(serverInstance, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
      }
    });

    // Authentication Middleware
    io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        console.warn('Socket connection rejected: No token provided');
        return next(new Error('Authentication error: No token'));
      }
      
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          console.warn('Socket connection rejected: Invalid token');
          return next(new Error('Authentication error: Invalid token'));
        }
        socket.user = decoded; // Attach user info to socket
        next();
      });
    });

    return io;
  },
  getIo: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
