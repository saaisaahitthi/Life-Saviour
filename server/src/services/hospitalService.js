const Hospital = require('../models/Hospital');
const User = require('../models/User');
const geoUtils = require('../utils/geoUtils');

/**
 * Hospital Service
 * Handles smart allocation of hospitals based on specialization and proximity.
 */

const allocateHospital = async (emergency) => {
  try {
    const { aiTriage, coordinates, zone } = emergency;
    
    if (!coordinates || !coordinates.lat) return null;

    const derivedZone = zone || geoUtils.calculateZone(coordinates.lat, coordinates.lng);

    const requiredSpec = aiTriage.category; 
    
    let query = { status: 'active', 'capacity.emergencyBeds.available': { $gt: 0 } };
    
    // Priority 1: Same Zone + Specialized
    let hospitals = await Hospital.find({
      ...query,
      zone: derivedZone,
      specializations: requiredSpec
    });

    // Priority 2: Same Zone + Any
    if (hospitals.length === 0) {
      hospitals = await Hospital.find({ ...query, zone: derivedZone });
    }

    // Priority 3: Any Zone + Specialized
    if (hospitals.length === 0) {
      hospitals = await Hospital.find({ ...query, specializations: requiredSpec });
    }

    // Priority 4: Any Zone + Any
    if (hospitals.length === 0) {
      hospitals = await Hospital.find(query);
    }

    if (hospitals.length === 0) return null;

    // Strict Mathematical Filter: Discard any hospital below 10% capacity
    // even if their database status is technically still 'active'.
    hospitals = hospitals.filter(h => {
      const total = h.capacity.emergencyBeds.total || 1;
      const available = h.capacity.emergencyBeds.available || 0;
      return (available / total) > 0.1;
    });

    if (hospitals.length === 0) return null;

    // Find hospitals that actually have an ONLINE specialized doctor
    const CATEGORY_TO_SPEC = {
      'cardiac': 'cardiology', 'cardiovascular': 'cardiology',
      'trauma': 'trauma', 'neurological': 'neurology',
      'respiratory': 'respiratory', 'general': 'general',
      'orthopedic': 'orthopedics', 'pediatric': 'pediatrics'
    };
    const targetSpec = CATEGORY_TO_SPEC[aiTriage.category] || 'general';

    const onlineDoctors = await User.find({
      role: 'doctor',
      isOnline: true,
      specialization: { $in: [targetSpec, 'general'] }
    });
    
    const hospitalsWithDoctors = new Set(
      onlineDoctors.map(d => (d.hospitalAffiliation || '').toLowerCase())
    );

    // Pass 1: Find nearest among candidates WITH an online doctor
    let bestHospital = null;
    let minDistance = Infinity;

    for (const hospital of hospitals) {
      if (hospitalsWithDoctors.has(hospital.name.toLowerCase())) {
        const distance = geoUtils.calculateDistance(
          coordinates.lat, coordinates.lng,
          hospital.location.coordinates.lat, hospital.location.coordinates.lng
        );
        if (distance < minDistance) {
          minDistance = distance;
          bestHospital = hospital;
        }
      }
    }

    // Pass 2: Fallback to absolute nearest if NO doctors are online anywhere in the city
    if (!bestHospital) {
      for (const hospital of hospitals) {
        const distance = geoUtils.calculateDistance(
          coordinates.lat, coordinates.lng,
          hospital.location.coordinates.lat, hospital.location.coordinates.lng
        );
        if (distance < minDistance) {
          minDistance = distance;
          bestHospital = hospital;
        }
      }
    }

    return bestHospital;
  } catch (error) {
    console.error('Hospital Allocation Error:', error);
    return null;
  }
};

const updateCapacity = async (hospitalId, type, delta) => {
  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) return;

  if (type === 'icu') {
    hospital.capacity.icuBeds.available = Math.max(0, hospital.capacity.icuBeds.available + delta);
  } else if (type === 'emergency') {
    hospital.capacity.emergencyBeds.available = Math.max(0, hospital.capacity.emergencyBeds.available + delta);
  }

  await hospital.save();
  return hospital;
};

module.exports = {
  allocateHospital,
  updateCapacity
};
