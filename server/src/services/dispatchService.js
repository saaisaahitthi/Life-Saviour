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

    // Calculate distances and find nearest
    let nearestDriver = null;
    let minDistance = Infinity;

    for (const driver of drivers) {
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

      // Update emergency with assigned driver
      emergency.assignedDriver = nearestDriver._id;
      emergency.status = 'assigned';
      // Store ETA in a new field if needed, for now we just use it for the notification
      await emergency.save();

      // Update driver status
      nearestDriver.availabilityStatus = 'busy';
      await nearestDriver.save();

      // Notify Driver
      await notificationService.createNotification(io, {
        recipient: nearestDriver._id,
        title: '🚨 NEW MISSION ASSIGNED',
        message: `Emergency at ${emergency.location}. ETA: ${eta} mins.`,
        type: 'ambulance_assigned',
        referenceId: emergency._id,
        referenceModel: 'Emergency',
        priority: 'critical'
      });

      // Notify Patient
      await notificationService.createNotification(io, {
        recipient: emergency.patientId._id,
        title: '🚑 Ambulance Dispatched',
        message: `Ambulance ${nearestDriver.vehicleNumber} is on the way. ETA: ${eta} mins.`,
        type: 'ambulance_assigned',
        referenceId: emergency._id,
        referenceModel: 'Emergency',
        priority: 'high'
      });

      // Emit update
      io.emit('emergency_updated', await emergency.populate('assignedDriver', 'name vehicleNumber currentLocation'));

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
