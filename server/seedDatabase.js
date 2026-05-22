require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/life-saviour';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing dummy accounts to prevent duplicates if run multiple times
    await User.deleteMany({ email: { $regex: '@demo.com$' } });
    console.log('Cleared old demo accounts.');

    const demoUsers = [
      {
        name: 'John Patient',
        email: 'patient@demo.com',
        password: 'password123',
        role: 'patient',
        phone: '9876543210',
        emergencyContacts: [{ name: 'Jane Doe', phone: '9876543211', relationship: 'Spouse' }]
      },
      {
        name: 'Dr. Sarah Smith',
        email: 'doctor@demo.com',
        password: 'password123',
        role: 'doctor',
        phone: '8888888888',
        specialization: 'cardiology',
        hospitalAffiliation: 'Manipal Hospital'
      },
      {
        name: 'Ravi Driver',
        email: 'driver@demo.com',
        password: 'password123',
        role: 'driver',
        phone: '7777777777',
        vehicleNumber: 'KA-01-AB-1234'
      },
      {
        name: 'Admin Chief',
        email: 'admin@demo.com',
        password: 'password123',
        role: 'admin',
        phone: '6666666666'
      }
    ];

    for (let u of demoUsers) {
      await User.create(u);
      console.log(`Created ${u.role}: ${u.email} (Password: password123)`);
    }

    console.log('All users seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
