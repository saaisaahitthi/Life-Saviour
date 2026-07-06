import { useState, useEffect, useRef } from 'react';

// Haversine distance function in meters
const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const useOSRMRoute = (startCoord, endCoord) => {
  const [routeData, setRouteData] = useState({ coordinates: null, distance: null, duration: null });
  const [loading, setLoading] = useState(false);
  const lastFetch = useRef(null);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!startCoord || !endCoord) return;
      
      const now = Date.now();
      if (lastFetch.current) {
        const { startCoord: lastStart, endCoord: lastEnd, timestamp } = lastFetch.current;
        
        // If end destination changed, always fetch
        const endChanged = lastEnd.lat !== endCoord.lat || lastEnd.lng !== endCoord.lng;
        
        // Check distance moved (threshold 30 meters)
        const distMoved = getDistanceInMeters(lastStart.lat, lastStart.lng, startCoord.lat, startCoord.lng);
        
        // Check time elapsed (threshold 10 seconds)
        const timeElapsed = now - timestamp;
        
        if (!endChanged && distMoved < 30 && timeElapsed < 10000) {
          // Skip fetch, use cached route
          return;
        }
      }

      lastFetch.current = { startCoord, endCoord, timestamp: now };
      setLoading(true);
      try {
        // OSRM requires coordinates in [longitude, latitude] format
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${startCoord.lng},${startCoord.lat};${endCoord.lng},${endCoord.lat}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes.length > 0) {
          const route = data.routes[0];
          // OSRM returns GeoJSON coordinates as [lng, lat], Leaflet Polyline needs [lat, lng]
          const leafletCoords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          
          setRouteData({
            coordinates: leafletCoords,
            distance: route.distance, // in meters
            duration: route.duration  // in seconds
          });
        }
      } catch (error) {
        console.error('Failed to fetch route from OSRM:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [startCoord?.lat, startCoord?.lng, endCoord?.lat, endCoord?.lng]);

  return { ...routeData, loading };
};
