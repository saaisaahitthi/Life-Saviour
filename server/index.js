require('dotenv').config();
const express = require('express');
const http = require('http');
const socketUtils = require('./src/socket');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const emergencyRoutes = require('./src/routes/emergencyRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const fileRoutes = require('./src/routes/fileRoutes');
const aiChatRoutes = require('./src/routes/aiChatRoutes');
const iotRoutes = require('./src/routes/iotRoutes');
const heatmapRoutes = require('./src/routes/heatmapRoutes');
const familyRoutes = require('./src/routes/familyRoutes');
const hospitalRecommendRoutes = require('./src/routes/hospitalRecommendRoutes');
const hospitalRoutes = require('./src/routes/hospitalRoutes');
const callRoutes = require('./src/routes/callRoutes');

// Import socket handler
const chatSocket = require('./src/sockets/chatSocket');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketUtils.init(server);

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'https://life-saviour-ten.vercel.app'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Make io accessible in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/emergencies', emergencyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/geo', heatmapRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/hospital-recommend', hospitalRecommendRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/calls', callRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Life Saviour API is running', timestamp: new Date() });
});

// Initialize socket handlers
chatSocket(io);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lifesaviour';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    server.listen(PORT, () => {
      console.log(`🚀 Life Saviour server running on port ${PORT}`);
      console.log(`📡 Socket.IO ready for connections`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
