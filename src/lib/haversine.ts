/**
 * Haversine distance formula and related geo utilities
 */

const R = 6371; // Earth radius in km

/**
 * Calculate distance between two lat/lng points using Haversine formula
 * @returns distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} متر`;
  }
  return `${km.toFixed(1)} کیلومتر`;
}

/**
 * Determine if a cafe is currently open based on its opening hours
 * @param openingHoursJson - JSON string or object of weekly hours
 */
export function isCafeOpenNow(openingHoursJson: string | object): boolean {
  try {
    const hours =
      typeof openingHoursJson === "string"
        ? JSON.parse(openingHoursJson)
        : openingHoursJson;

    const now = new Date();
    const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const dayKey = days[now.getDay()];
    const dayHours = hours[dayKey];

    if (!dayHours) return false;

    const [openH, openM] = dayHours.open.split(":").map(Number);
    const [closeH, closeM] = dayHours.close.split(":").map(Number);

    const openMin = openH * 60 + openM;
    const closeMin = closeH * 60 + closeM;
    const nowMin = now.getHours() * 60 + now.getMinutes();

    // Handle overnight (close < open)
    if (closeMin < openMin) {
      return nowMin >= openMin || nowMin < closeMin;
    }

    return nowMin >= openMin && nowMin < closeMin;
  } catch {
    return false;
  }
}

/**
 * Get cafes sorted by distance from user
 */
export function sortByDistance<T extends { latitude: number; longitude: number }>(
  cafes: T[],
  userLat: number,
  userLng: number
): (T & { distance: number })[] {
  return cafes
    .map((cafe) => ({
      ...cafe,
      distance: haversineDistance(userLat, userLng, cafe.latitude, cafe.longitude),
    }))
    .sort((a, b) => a.distance - b.distance);
}
