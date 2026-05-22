const mongoose = require('mongoose');
require('dotenv').config();
const Hospital = require('./src/models/Hospital');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB. Updating hospitals...');
    
    await Hospital.findOneAndUpdate(
      { name: "City Hospital" },
      { 
        $set: { 
          'capacity.emergencyBeds.total': 60,
          'capacity.emergencyBeds.available': 45,
          'capacity.icuBeds.total': 20,
          'capacity.icuBeds.available': 12
        } 
      }
    );

    await Hospital.findOneAndUpdate(
      { name: "Green Valley Hospital" },
      { 
        $set: { 
          'capacity.emergencyBeds.total': 80,
          'capacity.emergencyBeds.available': 50,
          'capacity.icuBeds.total': 30,
          'capacity.icuBeds.available': 15
        } 
      }
    );

    console.log('Hospitals successfully updated!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Update error:', err);
    process.exit(1);
  });
