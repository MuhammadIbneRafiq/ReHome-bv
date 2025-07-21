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
 * Extract city information from Google Places API response using additional API call
 * @param placeId The Google Places place ID
 * @param apiKey Google Maps API key
 * @returns Promise<string | null> The extracted city name or null
 */
async function extractCityFromPlaceDetails(placeId: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'addressComponents'
        }
      }
    );

    if (!response.ok) {
      console.warn('Failed to fetch place details:', response.status);
      return null;
    }

    const data = await response.json();
    
    // Extract city from address components
    if (data.addressComponents) {
      // Look for locality (city) or administrative_area_level_2 (broader area)
      for (const component of data.addressComponents) {
        if (component.types.includes('locality')) {
          return component.longText || component.shortText;
        }
      }
      
      // Fallback to administrative_area_level_2
      for (const component of data.addressComponents) {
        if (component.types.includes('administrative_area_level_2')) {
          return component.longText || component.shortText;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting city from place details:', error);
    return null;
  }
}

/**
 * Extract city name from formatted address using pattern matching
 * @param formattedAddress The formatted address string
 * @returns string | null The extracted city name or null
 */
function extractCityFromFormattedAddress(formattedAddress: string): string | null {
  if (!formattedAddress) return null;

  // Split by comma and try to find a city name
  const parts = formattedAddress.split(',').map(part => part.trim());
  
  // Check each part against our supported cities
  for (const part of parts) {
    if (cityBaseCharges[part]) {
      return part;
    }
    
    // Handle common variations
    const variations: { [key: string]: string } = {
      'Den Haag': 'The Hague',
      "'s-Hertogenbosch": 's-Hertogenbosch',
      'Hertogenbosch': 's-Hertogenbosch',
    };
    
    if (variations[part] && cityBaseCharges[variations[part]]) {
      return variations[part];
    }
  }

  return null;
}

/**
 * Find the nearest supported city based on coordinates
 * @param targetLat Target latitude
 * @param targetLng Target longitude
 * @returns string | null The nearest supported city name or null
 */
function findNearestSupportedCity(targetLat: number, targetLng: number): string | null {
  let nearestCity: string | null = null;
  let shortestDistance = Infinity;

  for (const [cityName, cityCoords] of Object.entries(SUPPORTED_CITIES_COORDS)) {
    const distance = calculateDistanceKm(targetLat, targetLng, cityCoords.lat, cityCoords.lng);
    
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestCity = cityName;
    }
  }

  console.log('🗺️ [NEAREST CITY] Found nearest city:', {
    nearestCity,
    distance: shortestDistance.toFixed(2) + 'km',
    targetCoords: { lat: targetLat, lng: targetLng }
  });

  return nearestCity;
}

/**
 * Main function to find the closest supported city from a Google Places object
 * @param placeObject The place object from Google Places API
 * @param apiKey Google Maps API key (optional, for enhanced city extraction)
 * @returns Promise<string | null> The closest supported city name or Amsterdam as fallback
 */
export async function findClosestSupportedCity(
  placeObject?: GooglePlaceObject, 
  apiKey?: string
): Promise<string | null> {
  try {
    console.log('🔍 [CITY FINDER] Processing place object:', placeObject);

    if (!placeObject) {
      console.log('🔍 [CITY FINDER] No place object provided, defaulting to Amsterdam');
      return 'Amsterdam';
    }

    // Method 1: Try to extract city from formatted address first (fastest)
    if (placeObject.formattedAddress) {
      const cityFromAddress = extractCityFromFormattedAddress(placeObject.formattedAddress);
      if (cityFromAddress) {
        console.log('🔍 [CITY FINDER] Found city from formatted address:', cityFromAddress);
        return cityFromAddress;
      }
    }

    // Method 2: Try to extract city from display name
    if (placeObject.displayName) {
      const cityFromDisplayName = extractCityFromFormattedAddress(placeObject.displayName);
      if (cityFromDisplayName) {
        console.log('🔍 [CITY FINDER] Found city from display name:', cityFromDisplayName);
        return cityFromDisplayName;
      }
    }

    // Method 3: Try to extract city from text field (for autocomplete results)
    if (placeObject.text) {
      const cityFromText = extractCityFromFormattedAddress(placeObject.text);
      if (cityFromText) {
        console.log('🔍 [CITY FINDER] Found city from text:', cityFromText);
        return cityFromText;
      }
    }

    // Method 4: Use Google Places API to get detailed address components (if API key provided)
    if (apiKey && placeObject.placeId) {
      console.log('🔍 [CITY FINDER] Trying to extract city from place details API');
      const cityFromAPI = await extractCityFromPlaceDetails(placeObject.placeId, apiKey);
      if (cityFromAPI && cityBaseCharges[cityFromAPI]) {
        console.log('🔍 [CITY FINDER] Found city from Places API:', cityFromAPI);
        return cityFromAPI;
      }
    }

    // Method 5: Find nearest city using coordinates (fallback)
    if (placeObject.coordinates?.lat && placeObject.coordinates?.lng) {
      console.log('🔍 [CITY FINDER] Using coordinates to find nearest city');
      const nearestCity = findNearestSupportedCity(
        placeObject.coordinates.lat, 
        placeObject.coordinates.lng
      );
      if (nearestCity) {
        console.log('🔍 [CITY FINDER] Found nearest city by coordinates:', nearestCity);
        return nearestCity;
      }
    }

    // Final fallback
    console.log('🔍 [CITY FINDER] No city found, defaulting to Amsterdam');
    return 'Amsterdam';

  } catch (error) {
    console.error('🔍 [CITY FINDER] Error finding closest city:', error);
    return 'Amsterdam';
  }
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