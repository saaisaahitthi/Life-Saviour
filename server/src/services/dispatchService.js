const User = require('../models/User');
const Emergency = require('../models/Emergency');
const geoUtils = require('../utils/geoUtils');
const notificationService = require('../services/notificationService');

/**
 * Dispatch Service
 * Handles intelligent ambulance assignment based on proximity and availability.
 */

const assignNearestAmbulance = async (io, emergencyId) => {
  try {
    const emergency = await Emergency.findById(emergencyId).populate('patientId');
    if (!emergency || !emergency.coordinates || !emergency.coordinates.lat) {
      console.log('Emergency coordinates missing, skipping auto-assignment.');
      return null;
    }

    // Find all available drivers
    const drivers = await User.find({
      role: 'driver',
      availabilityStatus: 'available',
      'currentLocation.lat': { $exists: true }
    });

    if (drivers.length === 0) {
      console.log('No available drivers found.');
      return null;
    }

    // Calculate distances and find nearest available driver who hasn't ignored this yet
    const validDrivers = drivers.filter(d => !emergency.ignoredDrivers.includes(d._id.toString()));
    
    if (validDrivers.length === 0) {
      console.log('No valid drivers left to ping.');
      return null;
    }

    let nearestDriver = null;
    let minDistance = Infinity;

    for (const driver of validDrivers) {
      const distance = geoUtils.calculateDistance(
        emergency.coordinates.lat,
        emergency.coordinates.lng,
        driver.currentLocation.lat,
        driver.currentLocation.lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestDriver = driver;
      }
    }

    if (nearestDriver) {
      const eta = geoUtils.estimateTime(minDistance);

      // Update emergency with PENDING driver (do not mark as busy yet)
      emergency.pendingDriver = nearestDriver._id;
      await emergency.save();

      // Emit direct socket event to driver requesting acceptance
      io.to(nearestDriver._id.toString()).emit('driver_requested', {
        emergencyId: emergency._id,
        location: emergency.location,
        coordinates: emergency.coordinates,
        eta: eta,
        patientName: emergency.patientId.name
      });

      // Start 30-second timeout
      setTimeout(async () => {
        // Re-fetch emergency to check if they accepted
        const checkEmergency = await Emergency.findById(emergency._id);
        if (checkEmergency && checkEmergency.pendingDriver && checkEmergency.pendingDriver.toString() === nearestDriver._id.toString()) {
          console.log(`Driver ${nearestDriver._id} ignored request. Moving to next.`);
          // Remove pending, add to ignored
          checkEmergency.pendingDriver = null;
          checkEmergency.ignoredDrivers.push(nearestDriver._id);
          await checkEmergency.save();
          // Notify driver they missed it
          io.to(nearestDriver._id.toString()).emit('driver_request_timeout', { emergencyId: emergency._id });
          // Recursive call for next driver
          module.exports.assignNearestAmbulance(io, emergency._id);
        }
      }, 30000);

      return nearestDriver;
    }

    return null;
  } catch (error) {
    console.error('Auto-assignment Error:', error);
    return null;
  }
};

module.exports = {
  assignNearestAmbulance
};
