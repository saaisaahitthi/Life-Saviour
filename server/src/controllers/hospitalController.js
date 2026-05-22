const Hospital = require('../models/Hospital');

exports.createHospital = async (req, res) => {
  try {
    const { name, zone, lat, lng, totalEmergencyBeds, totalICUBeds } = req.body;

    const eBeds = parseInt(totalEmergencyBeds, 10) || 0;
    const iBeds = parseInt(totalICUBeds, 10) || 0;

    const hospital = new Hospital({
      name,
      zone: zone || 'Central',
      regionalZone: 'Metropolitan',
      location: {
        coordinates: {
          lat: parseFloat(lat) || 12.9716,
          lng: parseFloat(lng) || 77.5946
        }
      },
      capacity: {
        emergencyBeds: { total: eBeds, available: eBeds },
        icuBeds: { total: iBeds, available: iBeds }
      }
    });

    await hospital.save();
    res.status(201).json({ message: 'Hospital registered successfully', hospital });
  } catch (error) {
    console.error('Error creating hospital:', error);
    res.status(500).json({ message: 'Failed to register hospital' });
  }
};

exports.getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find();
    res.json(hospitals);
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({ message: 'Failed to fetch hospitals' });
  }
};
