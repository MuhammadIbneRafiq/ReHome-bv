import { cityBaseCharges } from '../lib/constants';

const SUPPORTED_CITIES_COORDS: { [key: string]: { lat: number; lng: number } } = {
  'Amsterdam': { lat: 52.37833, lng: 4.90000 },        // Amsterdam Centraal [web:14]
  'Utrecht': { lat: 52.0894, lng: 5.1100 },            // Utrecht Centraal [web:17]
  'Almere': { lat: 52.3731, lng: 5.2180 },             // Almere Centrum [web:17]
  'Haarlem': { lat: 52.3872, lng: 4.6371 },            // Haarlem Centraal [web:17]
  'Zaanstad': { lat: 52.4402, lng: 4.8119 },           // Zaandam station (main for Zaanstad) [web:17]
  'Amersfoort': { lat: 52.1538, lng: 5.3725 },         // Amersfoort Centraal [web:17]
  's-Hertogenbosch': { lat: 51.6900, lng: 5.2930 },    // 's-Hertogenbosch [web:17]
  'Hoofddorp': { lat: 52.3022, lng: 4.7032 },          // Hoofddorp [web:17]
  'Rotterdam': { lat: 51.9225, lng: 4.4821 },          // Rotterdam Centraal [web:17]
  'The Hague': { lat: 52.0800, lng: 4.3240 },          // Den Haag Centraal [web:17]
  'Breda': { lat: 51.5841, lng: 4.7988 },              // Breda [web:17]
  'Leiden': { lat: 52.1667, lng: 4.4825 },             // Leiden Centraal [web:17]
  'Dordrecht': { lat: 51.8103, lng: 4.6736 },          // Dordrecht [web:17]
  'Zoetermeer': { lat: 52.0627, lng: 4.4971 },         // Zoetermeer station [web:17]
  'Delft': { lat: 52.0067, lng: 4.3556 },              // Delft [web:17]
  'Eindhoven': { lat: 51.4416, lng: 5.4810 },          // Eindhoven [web:17]
  'Maastricht': { lat: 50.8499, lng: 5.7059 },         // Maastricht [web:17]
  'Tilburg': { lat: 51.5553, lng: 5.0910 },            // Tilburg [web:17]
  'Groningen': { lat: 53.2114, lng: 6.5641 },          // Groningen [web:17]
  'Nijmegen': { lat: 51.8447, lng: 5.8625 },           // Nijmegen [web:17]
  'Enschede': { lat: 52.2219, lng: 6.8937 },           // Enschede [web:17]
  'Arnhem': { lat: 51.9852, lng: 5.8980 },             // Arnhem [web:17]
  'Apeldoorn': { lat: 52.2118, lng: 5.9635 },          // Apeldoorn [web:17]
  'Deventer': { lat: 52.2515, lng: 6.1592 },           // Deventer [web:17]
  'Zwolle': { lat: 52.5058, lng: 6.0923 },             // Zwolle [web:17]
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

    // Find the closest city from our supported cities (top 25) using road distance
    for (const [cityName, cityCoords] of Object.entries(SUPPORTED_CITIES_COORDS)) {
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