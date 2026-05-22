const Hospital = require('../models/Hospital');
const Emergency = require('../models/Emergency');

class NetworkService {
  /**
   * Find the best available hospital in a zone, considering load
   */
  async findOptimalHospital(zone, coordinates, requiredSpecialization = null) {
    const query = {
      zone: zone,
      status: 'active',
      isOverloaded: false
    };

    if (requiredSpecialization) {
      query.specializations = requiredSpecialization;
    }

    let hospitals = await Hospital.find(query);

    // If no hospital in zone or all overloaded, expand search to all zones
    if (hospitals.length === 0) {
      hospitals = await Hospital.find({ status: 'active', isOverloaded: false });
    }

    if (hospitals.length === 0) {
      throw new Error('No available hospitals found in the network');
    }

    // Simple proximity and bed availability scoring
    return hospitals.sort((a, b) => {
      const aBeds = a.capacity.emergencyBeds.available;
      const bBeds = b.capacity.emergencyBeds.available;
      return bBeds - aBeds; // More beds first
    })[0];
  }

  /**
   * Orchestrate an inter-hospital transfer
   */
  async transferPatient(emergencyId, sourceHospitalId, targetHospitalId, reason) {
    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) throw new Error('Emergency not found');

    const source = await Hospital.findById(sourceHospitalId);
    const target = await Hospital.findById(targetHospitalId);

    if (!target || target.status !== 'active' || target.isOverloaded) {
      throw new Error('Target hospital is unavailable or overloaded');
    }

    // Update emergency
    emergency.assignedHospital = targetHospitalId;
    emergency.additionalNotes += `\n[TRANSFER] From ${source.name} to ${target.name}. Reason: ${reason}`;
    await emergency.save();

    // Update bed counts (simplified)
    if (source) {
      source.capacity.emergencyBeds.available += 1;
      await source.save();
    }
    target.capacity.emergencyBeds.available -= 1;
    await target.save();

    return emergency;
  }

  /**
   * Get city-wide operational visibility
   */
  async getCityWideVisibility() {
    const hospitals = await Hospital.find();
    const emergencies = await Emergency.find({ status: { $ne: 'resolved' } });

    const statsByZone = hospitals.reduce((acc, h) => {
      acc[h.zone] = acc[h.zone] || { hospitals: 0, beds: 0, activeEmergencies: 0 };
      acc[h.zone].hospitals += 1;
      acc[h.zone].beds += h.capacity.emergencyBeds.available;
      return acc;
    }, {});

    emergencies.forEach(e => {
      if (statsByZone[e.zone]) {
        statsByZone[e.zone].activeEmergencies += 1;
      }
    });

    return statsByZone;
  }
}

module.exports = new NetworkService();
