import { cityBaseCharges } from '../lib/constants';

// Supported cities with their approximate coordinates (center of the city)
const SUPPORTED_CITIES_COORDS: { [key: string]: { lat: number; lng: number } } = {
  'Amsterdam': { lat: 52.3676, lng: 4.9041 },
  'Utrecht': { lat: 52.0907, lng: 5.1214 },
  'Almere': { lat: 52.3708, lng: 5.2647 },
  'Haarlem': { lat: 52.3874, lng: 4.6462 },
  'Zaanstad': { lat: 52.4391, lng: 4.8270 },
  'Amersfoort': { lat: 52.1561, lng: 5.3878 },
  's-Hertogenbosch': { lat: 51.6978, lng: 5.3037 },
  'Hoofddorp': { lat: 52.3030, lng: 4.6890 },
  'Rotterdam': { lat: 51.9244, lng: 4.4777 },
  'The Hague': { lat: 52.0705, lng: 4.3007 },
  'Breda': { lat: 51.5719, lng: 4.7683 },
  'Leiden': { lat: 52.1601, lng: 4.4970 },
  'Dordrecht': { lat: 51.8133, lng: 4.6901 },
  'Zoetermeer': { lat: 52.0575, lng: 4.4937 },
  'Delft': { lat: 52.0116, lng: 4.3571 },
  'Eindhoven': { lat: 51.4416, lng: 5.4697 },
  'Maastricht': { lat: 50.8514, lng: 5.6909 },
  'Tilburg': { lat: 51.5555, lng: 5.0913 },
  'Groningen': { lat: 53.2194, lng: 6.5665 },
  'Nijmegen': { lat: 51.8426, lng: 5.8518 },
  'Enschede': { lat: 52.2215, lng: 6.8937 },
  'Arnhem': { lat: 51.9851, lng: 5.8987 },
  'Apeldoorn': { lat: 52.2112, lng: 5.9699 },
  'Deventer': { lat: 52.2551, lng: 6.1639 },
  'Zwolle': { lat: 52.5168, lng: 6.0830 },
};

// Interface for place objects coming from Google Places API
export interface GooglePlaceObject {
  placeId: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  formattedAddress?: string;
  displayName?: string;
  text?: string;
}

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of the first point
 * @param lng1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lng2 Longitude of the second point
 * @returns Distance in kilometers
 */
function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Main function to find the closest supported city from a Google Places object
 * @param placeObject The place object from Google Places API
 * @returns Promise<{ city: string | null, distanceDifference: number }> The closest supported city name and the difference to the second closest
 */
async function findClosestSupportedCityInternal(
  placeObject?: GooglePlaceObject, 
): Promise<{ city: string | null, distanceDifference: number, isReliable: boolean }> {
  if (!placeObject) {
    return { city: null, distanceDifference: 0, isReliable: false };
  }

  // First check: Is this location in one of our top 25 supported cities?
  const locationText = placeObject.text || placeObject.displayName || placeObject.formattedAddress || '';
  
  // Check if the location name contains any of our supported city names
  for (const supportedCity of Object.keys(cityBaseCharges)) {
    if (locationText.toLowerCase().includes(supportedCity.toLowerCase())) {
      return { 
        city: supportedCity, 
        distanceDifference: 0,  // No extra charge for supported cities
        isReliable: true  // Very reliable - exact city name match
      };
    }
  }
      
  if (placeObject.coordinates?.lat && placeObject.coordinates?.lng) {
    let targetLat = placeObject.coordinates.lat;
    let targetLng = placeObject.coordinates.lng;

    let nearestCity: string | null = null;
    let shortestDistance = Infinity;

    // Find the closest city from our supported cities (top 25)
    for (const [cityName, cityCoords] of Object.entries(SUPPORTED_CITIES_COORDS)) {
      const distance = calculateDistanceKm(targetLat, targetLng, cityCoords.lat, cityCoords.lng);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestCity = cityName;
      }
    }

    if (nearestCity) {
      // Calculate extra km charge: €3 per km beyond 8km city center range
      const extraKmBeyondRange = Math.max(0, shortestDistance - 8);
      
      return { 
        city: nearestCity, 
        distanceDifference: extraKmBeyondRange,
        isReliable: true  // Reliable - based on GPS coordinates
      };
    }
  }

  // No coordinates available
  return { city: null, distanceDifference: 0, isReliable: false };
}

/**
 * Main function to find the closest supported city from a Google Places object with retry logic
 * @param placeObject The place object from Google Places API
 * @param maxRetries Maximum number of retry attempts for transient errors
 * @returns Promise<{ city: string | null, distanceDifference: number }> The closest supported city name and the difference to the second closest
 */
export async function findClosestSupportedCity(
  placeObject?: GooglePlaceObject,
  maxRetries: number = 2
): Promise<{ city: string | null, distanceDifference: number }> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await findClosestSupportedCityInternal(placeObject);
      
      // If we got a reliable result, return it
      if (result.isReliable) {
        return { city: result.city, distanceDifference: result.distanceDifference };
      }
      
      // If unreliable but no error, this is likely missing data, not a transient issue
      if (attempt === 0) {
        console.warn('[findClosestSupportedCity] Unreliable location data for:', 
          placeObject?.text || placeObject?.displayName || 'unknown location');
      }
      
      // For unreliable results, fall back to text-based city detection as last resort
      if (placeObject && attempt === maxRetries) {
        const locationText = placeObject.text || placeObject.displayName || placeObject.formattedAddress || '';
        
        // Try a more lenient city name search for common variations
        const cityVariations = {
          'den haag': 'The Hague',
          'the hague': 'The Hague',
          's-hertogenbosch': 's-Hertogenbosch',
          'den bosch': 's-Hertogenbosch'
        };
        
        const lowerText = locationText.toLowerCase();
        for (const [variation, officialName] of Object.entries(cityVariations)) {
          if (lowerText.includes(variation)) {
            console.info(`[findClosestSupportedCity] Fallback: matched '${variation}' to '${officialName}'`);
            return { city: officialName, distanceDifference: 0 };
          }
        }
        
        // Ultimate fallback: if location text contains "netherlands" or "nl", default to Amsterdam
        // This is better than returning null for clearly Dutch addresses
        if (lowerText.includes('netherlands') || lowerText.includes(', nl') || lowerText.includes('nederland')) {
          console.warn('[findClosestSupportedCity] Dutch address detected, defaulting to Amsterdam:', locationText);
          return { city: 'Amsterdam', distanceDifference: 0 };
        }
      }
      
      return { city: result.city, distanceDifference: result.distanceDifference };
      
    } catch (error) {
      lastError = error as Error;
      
      // Check if this looks like a transient error worth retrying
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      const isTransientError = errorMessage.includes('timeout') || 
                              errorMessage.includes('network') || 
                              errorMessage.includes('fetch') ||
                              errorMessage.includes('connection');
      
      if (isTransientError && attempt < maxRetries) {
        console.warn(`[findClosestSupportedCity] Transient error on attempt ${attempt + 1}, retrying:`, error);
        // Wait briefly before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        continue;
      }
      
      // Non-transient error or final attempt
      console.error('[findClosestSupportedCity] Error on attempt', attempt + 1, ':', error);
    }
  }
  
  // All retries failed - return null to let calling code handle appropriately
  console.error('[findClosestSupportedCity] All attempts failed, last error:', lastError);
  return { city: null, distanceDifference: 0 };
}

/**
 * Calculate distance from city center (for pricing calculations)
 * @param placeObject The place object from Google Places API
 * @param cityName The city name to calculate distance from
 * @returns number Distance in kilometers from city center, or 0 if coordinates not available
 */
export function calculateDistanceFromCityCenter(
  placeObject?: GooglePlaceObject, 
  cityName?: string
): number {
  if (!placeObject?.coordinates || !cityName || !SUPPORTED_CITIES_COORDS[cityName]) {
    return 0;
  }

  const cityCenter = SUPPORTED_CITIES_COORDS[cityName];
  return calculateDistanceKm(
    placeObject.coordinates.lat,
    placeObject.coordinates.lng,
    cityCenter.lat,
    cityCenter.lng
  );
}

/**
 * Get all supported cities
 * @returns Array of supported city names
 */
export function getSupportedCities(): string[] {
  return Object.keys(cityBaseCharges);
}

/**
 * Check if a city is supported
 * @param cityName The city name to check
 * @returns boolean Whether the city is supported
 */
export function isCitySupported(cityName: string): boolean {
  return !!cityBaseCharges[cityName];
}