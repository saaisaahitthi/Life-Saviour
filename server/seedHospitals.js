const mongoose = require('mongoose');
require('dotenv').config();
const Hospital = require('./src/models/Hospital');

const seedHospitals = [
  {
    name: "City Central ICU",
    zone: "Central",
    regionalZone: "Metropolitan",
    location: { coordinates: { lat: 12.9716, lng: 77.5946 } },
    capacity: {
      emergencyBeds: { total: 100, available: 6 },
      icuBeds: { total: 40, available: 2 }
    },
    status: 'active'
  },
  {
    name: "Metro Trauma Care",
    zone: "North",
    regionalZone: "Metropolitan",
    location: { coordinates: { lat: 13.0285, lng: 77.5896 } },
    capacity: {
      emergencyBeds: { total: 80, available: 30 },
      icuBeds: { total: 20, available: 5 }
    },
    status: 'active'
  },
  {
    name: "East Side Medical",
    zone: "East",
    regionalZone: "Metropolitan",
    location: { coordinates: { lat: 12.9845, lng: 77.6499 } },
    capacity: {
      emergencyBeds: { total: 60, available: 35 },
      icuBeds: { total: 15, available: 10 }
    },
    status: 'active'
  },
  {
    name: "Southern General",
    zone: "South",
    regionalZone: "Metropolitan",
    location: { coordinates: { lat: 12.9259, lng: 77.5896 } },
    capacity: {
      emergencyBeds: { total: 150, available: 80 },
      icuBeds: { total: 50, available: 20 }
    },
    status: 'active'
  }
];

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB. Seeding hospitals...');
    await Hospital.insertMany(seedHospitals);
    console.log('Hospitals successfully seeded!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
