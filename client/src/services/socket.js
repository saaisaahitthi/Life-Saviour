import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return connectSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinEmergencyRoom = (emergencyId) => {
  const s = getSocket();
  s.emit('join_emergency', emergencyId);
};

export const leaveEmergencyRoom = (emergencyId) => {
  const s = getSocket();
  s.emit('leave_emergency', emergencyId);
};

export const sendSocketMessage = (data) => {
  const s = getSocket();
  s.emit('send_message', data);
};

export const emitTyping = (data) => {
  const s = getSocket();
  s.emit('typing', data);
};

export const emitStopTyping = (data) => {
  const s = getSocket();
  s.emit('stop_typing', data);
};

export const markMessageRead = (data) => {
  const s = getSocket();
  s.emit('mark_read', data);
};

export const sendLocationUpdate = (data) => {
  const s = getSocket();
  s.emit('location_update', data);
};

export const joinUserRoom = (userId) => {
  const s = getSocket();
  s.emit('join_user', userId);
};

export const joinHospitalRoom = (hospitalId) => {
  const s = getSocket();
  s.emit('join_hospital', hospitalId);
};

export const sendDriverLocation = (data) => {
  const s = getSocket();
  s.emit('driver_location_update', data);
};
