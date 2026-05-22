const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function testSignup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lifesaviour');
    console.log('Connected to MongoDB');

    const testEmail = `test_${Date.now()}@example.com`;
    const user = await User.create({
      name: 'Test User',
      email: testEmail,
      password: 'password123',
      role: 'patient',
      phone: '1234567890'
    });

    console.log('User created successfully:', user.email);
    process.exit(0);
  } catch (err) {
    console.error('Error creating user:', err.message);
    process.exit(1);
  }
}

testSignup();
