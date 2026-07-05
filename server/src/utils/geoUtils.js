/**
 * Geolocation Utilities
 */

/**
 * Calculate distance between two points in KM using Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

/**
 * Estimate travel time in minutes based on distance (assumes average speed of 40km/h)
 */
const estimateTime = (distanceKm) => {
  const averageSpeedKmH = 40;
  const timeHours = distanceKm / averageSpeedKmH;
  return Math.round(timeHours * 60);
};

/**
 * Simple zone estimation based on coordinates
 * (Fallback when emergency object lacks a zone)
 */
const calculateZone = (lat, lng) => {
  if (!lat || !lng) return 'Central';
  
  // Using an arbitrary center point (Visakhapatnam) for this simple implementation
  const centerLat = 17.731277;
  const centerLng = 83.315077;
  
  if (lat > centerLat + 0.02) return 'North';
  if (lat < centerLat - 0.02) return 'South';
  if (lng > centerLng + 0.02) return 'East';
  if (lng < centerLng - 0.02) return 'West';
  
  return 'Central';
};

module.exports = {
  calculateDistance,
  estimateTime,
  calculateZone
};
