import { cityBaseCharges } from '../lib/constants';

/**
 * Get city coordinates from the database (via cityBaseCharges loaded in constants)
 * This is the SINGLE SOURCE OF TRUTH for city data
 */
function getSupportedCitiesCoords(): { [key: string]: { lat: number; lng: number } } {
  const coords: { [key: string]: { lat: number; lng: number } } = {};
  for (const [cityName, cityData] of Object.entries(cityBaseCharges)) {
    if (cityData.latitude && cityData.longitude) {
      coords[cityName] = { lat: cityData.latitude, lng: cityData.longitude };
    }
  }
  return coords;
}

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
  countryCode?: string;
  countryName?: string;
  city?: string; // Extracted from addressComponents locality
}

/**
 * Calculate road distance using Google Maps Distance Matrix API
 * @param originLat Origin latitude
 * @param originLng Origin longitude
 * @param destLat Destination latitude
 * @param destLng Destination longitude
 * @returns Promise<number> Distance in kilometers
 */
// Cache for distance calculations to prevent redundant API calls
const distanceCache: Record<string, number> = {};

async function calculateRoadDistance(
  originLat: number, 
  originLng: number, 
  destLat: number, 
  destLng: number
): Promise<number> {
  
  // Create cache key for this coordinate pair
  const cacheKey = [
    [originLat.toFixed(6), originLng.toFixed(6)],
    [destLat.toFixed(6), destLng.toFixed(6)]
  ].sort().toString();
  
  // Return cached value if available
  if (distanceCache[cacheKey] !== undefined) {
    return distanceCache[cacheKey];
  }

  return new Promise((resolve) => {
    // For city calculations, prefer straight-line distance for better performance
    // This significantly reduces API calls
    const straightLineDistance = calculateDistanceKm(originLat, originLng, destLat, destLng);
    
    // Cache and return the straight-line distance
    distanceCache[cacheKey] = straightLineDistance;
    // Reduce console logging frequency for better performance
    // console.log(`📏 Road distance calculated: ${straightLineDistance.toFixed(2)} km`);
    resolve(straightLineDistance);
    
    /* Disabled to improve performance - using straight-line distance instead
    const service = new google.maps.DistanceMatrixService();
    const origins = [new google.maps.LatLng(originLat, originLng)];
    const destinations = [new google.maps.LatLng(destLat, destLng)];

    service.getDistanceMatrix({
      origins,
      destinations,
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
    }, (response, status) => {
      if (status === 'OK' && response?.rows?.[0]?.elements?.[0]?.status === 'OK' && response?.rows?.[0]?.elements?.[0]?.distance?.value) {
        const distanceKm = response.rows[0].elements[0].distance.value / 1000; // Convert meters to km
        console.log(`📏 Road distance calculated: ${distanceKm.toFixed(2)} km`);
        distanceCache[cacheKey] = distanceKm;
        resolve(distanceKm);
      } else {
        console.warn('⚠️ Distance Matrix API failed, falling back to straight-line calculation');
        const fallbackDistance = calculateDistanceKm(originLat, originLng, destLat, destLng);
        distanceCache[cacheKey] = fallbackDistance;
        resolve(fallbackDistance);
      }
    });
    */
  });
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

// Cache for closest city lookups to prevent redundant calculations
const cityLookupCache: Record<string, { city: string | null, distanceDifference: number, isReliable: boolean }> = {};

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
  if (placeObject.coordinates?.lat && placeObject.coordinates?.lng) {
    let targetLat = placeObject.coordinates.lat;
    let targetLng = placeObject.coordinates.lng;
    
    // Create a cache key using coordinates
    const cacheKey = `${targetLat.toFixed(6)},${targetLng.toFixed(6)}`;
    
    // Check if we already have this result cached
    if (cityLookupCache[cacheKey]) {
      return cityLookupCache[cacheKey];
    }

    let nearestCity: string | null = null;
    let shortestDistance = Infinity;

    // Find the closest city from our supported cities using road distance
    // City coordinates come from database via cityBaseCharges
    const supportedCitiesCoords = getSupportedCitiesCoords();
    for (const [cityName, cityCoords] of Object.entries(supportedCitiesCoords)) {
      const distance = await calculateRoadDistance(targetLat, targetLng, cityCoords.lat, cityCoords.lng);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestCity = cityName;
      }
    }

    // Reduce console logging for better performance
    // console.log('Nearest city:', nearestCity, '!!!Shortest distance:', shortestDistance);
    if (nearestCity) {      
      const result = { 
        city: nearestCity, 
        distanceDifference: shortestDistance,
        isReliable: true  // Reliable - based on GPS coordinates
      };
      
      // Cache the result
      cityLookupCache[cacheKey] = result;
      return result;
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