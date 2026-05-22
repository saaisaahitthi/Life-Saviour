const Hospital = require('../models/Hospital');
const Emergency = require('../models/Emergency');

class SmartHospitalRecommender {
  // Haversine formula to calculate distance in km
  calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; 
  }

  /**
   * AI-driven hospital recommendation based on multiple factors
   */
  async recommend(emergency) {
    const hospitals = await Hospital.find({ status: 'active' });
    if (hospitals.length === 0) return { recommendations: [], best: null };

    const category = emergency.aiTriage?.category?.toLowerCase() || 'general';
    const severity = emergency.severity;

    const SPEC_MAP = {
      'cardiac': 'cardiology', 'cardiovascular': 'cardiology',
      'trauma': 'trauma', 'neurological': 'neurology',
      'respiratory': 'respiratory', 'general': 'general'
    };
    const requiredSpec = SPEC_MAP[category] || 'general';

    const scored = hospitals.map(h => {
      let score = 0;
      let factors = [];

      // Specialization match (40 points)
      if (h.specializations.includes(requiredSpec)) {
        score += 40;
        factors.push('Specialization match');
      } else if (h.specializations.includes('general')) {
        score += 15;
        factors.push('General capability');
      }

      // Bed availability (25 points)
      const beds = h.capacity.emergencyBeds.available;
      const bedScore = Math.min(25, beds * 5);
      score += bedScore;
      if (beds > 0) factors.push(`${beds} beds available`);

      // ICU availability for critical (15 points)
      if (severity === 'critical' && h.capacity.icuBeds.available > 0) {
        score += 15;
        factors.push('ICU available');
      }

      // Ventilator availability (10 points)
      if (h.capacity.ventilators.available > 0) {
        score += 10;
        factors.push('Ventilator available');
      }

      // Load factor (10 points) - less loaded is better
      if (!h.isOverloaded) {
        score += 10;
        factors.push('Not overloaded');
      }

      // Proximity / Distance (30 points)
      let distanceKm = null;
      if (emergency.coordinates?.lat && h.location?.coordinates?.lat) {
        distanceKm = this.calculateDistance(
          emergency.coordinates.lat, emergency.coordinates.lng,
          h.location.coordinates.lat, h.location.coordinates.lng
        );
        // Max 30 points if extremely close, decreases as distance grows
        const distanceScore = Math.max(0, 30 - distanceKm);
        score += distanceScore;
        factors.push(`${distanceKm.toFixed(1)} km away`);
      }

      // Max possible score is now 130, normalize to 100
      const confidence = Math.min(100, Math.round((score / 130) * 100));
      
      return {
        hospital: h,
        score,
        distanceKm,
        confidence,
        factors,
        suitability: confidence >= 70 ? 'excellent' : confidence >= 40 ? 'suitable' : 'backup'
      };
    });

    scored.sort((a, b) => b.score - a.score);

    return {
      best: scored[0] || null,
      recommendations: scored.slice(0, 3),
      emergencyType: category,
      requiredSpecialization: requiredSpec
    };
  }
}

module.exports = new SmartHospitalRecommender();
