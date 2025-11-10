/**
 * Berechnet Distanz zwischen zwei Geo-Koordinaten in Kilometern
 * Haversine-Formel
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Erdradius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

/**
 * Findet nächste Location basierend auf Geo-Distanz
 */
export const findNearestLocation = <T extends { latitude?: number | null; longitude?: number | null }>(
  reviewLat: number,
  reviewLng: number,
  locations: T[]
): (T & { distance: number }) | null => {
  const locationsWithCoords = locations.filter(
    (loc) => loc.latitude != null && loc.longitude != null
  );

  if (locationsWithCoords.length === 0) return null;

  const withDistances = locationsWithCoords.map((loc) => ({
    ...loc,
    distance: calculateDistance(
      reviewLat,
      reviewLng,
      loc.latitude!,
      loc.longitude!
    ),
  }));

  return withDistances.sort((a, b) => a.distance - b.distance)[0];
};
