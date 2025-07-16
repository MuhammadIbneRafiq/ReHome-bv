// Distance Calculations using OpenStreetMap Nominatim API
// This service handles all distance-related calculations for pricing

interface Coordinates {
  lat: number;
  lon: number;
}

// Simple in-memory cache to avoid redundant API calls
const coordinatesCache = new Map<string, Coordinates | null>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes (shorter cache)
const cacheTimestamps = new Map<string, number>();

interface GeolocationResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    postcode?: string;
    country?: string;
  };
}

/**
 * Get coordinates for a location using hardcoded Dutch cities as primary option
 */
export const getLocationCoordinates = async (location: string): Promise<Coordinates | null> => {
  const cacheKey = location.toLowerCase().trim();
  const now = Date.now();
  
  // Check cache first
  if (coordinatesCache.has(cacheKey)) {
    const timestamp = cacheTimestamps.get(cacheKey);
    if (timestamp && (now - timestamp) < CACHE_EXPIRY) {
      console.log('📋 Using cached coordinates for:', location);
      return coordinatesCache.get(cacheKey) || null;
    } else {
      // Cache expired, remove it
      coordinatesCache.delete(cacheKey);
      cacheTimestamps.delete(cacheKey);
    }
  }
  
  console.log('🌍 Getting coordinates for:', location);
  
  // 1. FIRST TRY: OpenWeather API with 5-second timeout
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  if (apiKey && apiKey !== 'demo' && apiKey !== '') {
  try {
      console.log('🌐 Trying OpenWeather API...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?` +
        `q=${encodeURIComponent(location)},NL&` +
        `limit=1&` +
        `appid=${apiKey}`,
        {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      clearTimeout(timeoutId);
    
    if (response.ok) {
        const data = await response.json();
      if (data && data.length > 0) {
        const coordinates = {
            lat: data[0].lat,
            lon: data[0].lon
        };
        
        coordinatesCache.set(cacheKey, coordinates);
        cacheTimestamps.set(cacheKey, now);
        
          console.log('✅ Got coordinates from OpenWeather API:', location, coordinates);
        return coordinates;
        }
      }
    } catch (apiError: any) {
      console.log('⚠️ OpenWeather API failed/timeout, using fallback cities...', apiError.message);
    }
  } else {
    console.log('⚠️ No OpenWeather API key found, using fallback cities...');
  }
    
  // 2. FALLBACK: Use comprehensive Dutch city database (instant, reliable)
  const cityDatabase: Record<string, Coordinates> = {
    // Major cities
      'amsterdam': { lat: 52.3676, lon: 4.9041 },
      'rotterdam': { lat: 51.9225, lon: 4.4792 },
      'den haag': { lat: 52.0705, lon: 4.3007 },
    'the hague': { lat: 52.0705, lon: 4.3007 },
      'utrecht': { lat: 52.0907, lon: 5.1214 },
      'eindhoven': { lat: 51.4416, lon: 5.4697 },
      'tilburg': { lat: 51.5555, lon: 5.0913 },
      'groningen': { lat: 53.2194, lon: 6.5665 },
      'almere': { lat: 52.3508, lon: 5.2647 },
      'breda': { lat: 51.5719, lon: 4.7683 },
      'nijmegen': { lat: 51.8426, lon: 5.8518 },
    'enschede': { lat: 52.2232, lon: 6.8937 },
      'haarlem': { lat: 52.3874, lon: 4.6462 },
      'arnhem': { lat: 51.9851, lon: 5.8987 },
      'zaanstad': { lat: 52.4389, lon: 4.8167 },
      'amersfoort': { lat: 52.1561, lon: 5.3878 },
      'apeldoorn': { lat: 52.2112, lon: 5.9699 },
      'hoofddorp': { lat: 52.3030, lon: 4.6890 },
      'maastricht': { lat: 50.8514, lon: 5.6910 },
      'leiden': { lat: 52.1601, lon: 4.4970 },
      'dordrecht': { lat: 51.8133, lon: 4.6901 },
      'zoetermeer': { lat: 52.0575, lon: 4.4935 },
      'zwolle': { lat: 52.5168, lon: 6.0830 },
      'deventer': { lat: 52.2551, lon: 6.1639 },
      'delft': { lat: 52.0116, lon: 4.3571 },
      'alkmaar': { lat: 52.6318, lon: 4.7483 },
      'leeuwarden': { lat: 53.2012, lon: 5.8086 },
      'venlo': { lat: 51.3704, lon: 6.1724 },
      'oss': { lat: 51.7649, lon: 5.5178 },
      'roosendaal': { lat: 51.5308, lon: 4.4653 },
      'emmen': { lat: 52.7795, lon: 6.9093 },
      'hilversum': { lat: 52.2242, lon: 5.1758 },
    'kampen': { lat: 52.5551, lon: 5.9114 },
    'helmond': { lat: 51.4816, lon: 5.6611 },
    'geldrop': { lat: 51.4234, lon: 5.5609 },
    'mierlo': { lat: 51.4406, lon: 5.6225 },
    'gouda': { lat: 52.0115, lon: 4.7077 },
    'purmerend': { lat: 52.5050, lon: 4.9592 },
    'vlaardingen': { lat: 51.9128, lon: 4.3418 },
    'alphen aan den rijn': { lat: 52.1265, lon: 4.6575 },
    'spijkenisse': { lat: 51.8447, lon: 4.3298 },
    'hoorn': { lat: 52.6425, lon: 5.0597 },
    'ede': { lat: 52.0341, lon: 5.6580 },
    'leidschendam': { lat: 52.0894, lon: 4.3890 },
    'woerden': { lat: 52.0852, lon: 4.8836 },
    'schiedam': { lat: 51.9192, lon: 4.3886 },
    'lelystad': { lat: 52.5084, lon: 5.4750 },
    'tiel': { lat: 51.8861, lon: 5.4306 },
    'barneveld': { lat: 52.1386, lon: 5.5914 },
    'veenendaal': { lat: 52.0287, lon: 5.5636 },
    'doetinchem': { lat: 51.9648, lon: 6.2886 },
    'almelo': { lat: 52.3507, lon: 6.6678 },
    'nieuwegein': { lat: 52.0209, lon: 5.0937 },
    'zeist': { lat: 52.0889, lon: 5.2317 },
    's-hertogenbosch': { lat: 51.6906, lon: 5.2936 },
    'den bosch': { lat: 51.6906, lon: 5.2936 }
  };
  
  // Enhanced address parsing for Dutch addresses
  const searchQuery = location.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Extract potential city names from different parts of the address
  const addressParts = searchQuery.split(',').map(part => part.trim());
  const potentialCities = [];
  
  // Add all parts as potential cities
  potentialCities.push(...addressParts);
  
  // Extract city from common Dutch address patterns
  for (const part of addressParts) {
    // Pattern: "5706 NG Helmond" or "5706ng helmond"
    const postcodeMatch = part.match(/\d{4}\s*[a-z]{2}\s+(.+)/i);
    if (postcodeMatch) {
      potentialCities.push(postcodeMatch[1].trim());
    }
    
    // Pattern: Numbers followed by city name
    const numberCityMatch = part.match(/^\d+\s+(.+)/);
    if (numberCityMatch) {
      potentialCities.push(numberCityMatch[1].trim());
    }
    
    // Split on spaces and take potential city words
    const words = part.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      // Single words that might be cities
      if (words[i].length > 3 && !/^\d+$/.test(words[i]) && !/^[0-9]+[a-z]{2}$/i.test(words[i])) {
        potentialCities.push(words[i]);
      }
      
      // Two-word combinations
      if (i < words.length - 1) {
        const twoWords = `${words[i]} ${words[i + 1]}`;
        if (twoWords.length > 5 && !/^\d/.test(twoWords)) {
          potentialCities.push(twoWords);
        }
      }
    }
  }
  
  console.log('🔍 Potential cities extracted:', potentialCities);
  
  // 1. Exact match
  for (const city of potentialCities) {
    if (cityDatabase[city]) {
      const coords = cityDatabase[city];
      console.log('✅ Exact match found:', location, '→', city, coords);
      coordinatesCache.set(cacheKey, coords);
      cacheTimestamps.set(cacheKey, now);
      return coords;
    }
  }
  
  // 2. Partial match
  for (const cityName of potentialCities) {
    for (const [dbCity, coords] of Object.entries(cityDatabase)) {
      if ((cityName.length >= 3 && dbCity.includes(cityName)) || 
          (dbCity.length >= 3 && cityName.includes(dbCity))) {
        console.log('✅ Partial match found:', location, '→', dbCity, coords);
        coordinatesCache.set(cacheKey, coords);
        cacheTimestamps.set(cacheKey, now);
        return coords;
      }
    }
  }
  
  // 3. Fuzzy match for common variations
  for (const cityName of potentialCities) {
    const variations = [
      cityName.replace(/\s/g, ''),
      cityName.replace(/ij/g, 'y'),
      cityName.replace(/y/g, 'ij'),
      cityName.replace(/\s+/g, '-'),
      cityName.replace(/\s+/g, '')
    ];
    
    for (const variation of variations) {
      for (const [dbCity, coords] of Object.entries(cityDatabase)) {
        if ((variation.length >= 3 && dbCity.includes(variation)) || 
            (dbCity.length >= 3 && variation.includes(dbCity))) {
          console.log('✅ Fuzzy match found:', location, '→', dbCity, coords);
          coordinatesCache.set(cacheKey, coords);
          cacheTimestamps.set(cacheKey, now);
          return coords;
        }
      }
    }
  }
  
  console.log('❌ No coordinates found for:', location);
  
  // Cache null result to avoid repeated failed requests
  coordinatesCache.set(cacheKey, null);
  cacheTimestamps.set(cacheKey, now);
  return null;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

/**
 * Calculate distance between two location strings
 */
export const calculateDistanceBetweenLocations = async (location1: string, location2: string): Promise<number> => {
  const coords1 = await getLocationCoordinates(location1);
  const coords2 = await getLocationCoordinates(location2);
  
  if (!coords1 || !coords2) {
    console.warn('Could not get coordinates for locations:', location1, location2);
    return 0;
  }
  
  return calculateDistance(coords1.lat, coords1.lon, coords2.lat, coords2.lon);
};

/**
 * Central coordinates for Dutch cities (train stations as central markers)
 * Source: NS (Dutch Railways) station coordinates
 */
export const DUTCH_CITY_CENTERS: { [key: string]: Coordinates } = {
  'Amsterdam': { lat: 52.3791, lon: 4.8980 }, // Amsterdam Centraal
  'Utrecht': { lat: 52.0892, lon: 5.1101 }, // Utrecht Centraal
  'Rotterdam': { lat: 51.9244, lon: 4.4777 }, // Rotterdam Centraal
  'The Hague': { lat: 52.0808, lon: 4.3248 }, // Den Haag Centraal
  'Eindhoven': { lat: 51.4433, lon: 5.4831 }, // Eindhoven Centraal
  'Tilburg': { lat: 51.5607, lon: 5.0837 }, // Tilburg Centraal
  'Groningen': { lat: 53.2108, lon: 6.5641 }, // Groningen Centraal
  'Almere': { lat: 52.3748, lon: 5.2178 }, // Almere Centrum
  'Breda': { lat: 51.5955, lon: 4.7800 }, // Breda Centraal
  'Nijmegen': { lat: 51.8426, lon: 5.8527 }, // Nijmegen Centraal
  'Enschede': { lat: 52.2232, lon: 6.8937 }, // Enschede Centraal
  'Haarlem': { lat: 52.3874, lon: 4.6462 }, // Haarlem Centraal
  'Arnhem': { lat: 51.9851, lon: 5.8987 }, // Arnhem Centraal
  'Zaanstad': { lat: 52.4743, lon: 4.8284 }, // Zaandam Centraal
  'Amersfoort': { lat: 52.1535, lon: 5.3750 }, // Amersfoort Centraal
  's-Hertogenbosch': { lat: 51.6906, lon: 5.2936 }, // 's-Hertogenbosch Centraal
  'Apeldoorn': { lat: 52.2097, lon: 5.9700 }, // Apeldoorn Centraal
  'Hoofddorp': { lat: 52.3016, lon: 4.6893 }, // Hoofddorp Centraal
  'Maastricht': { lat: 50.8513, lon: 5.7054 }, // Maastricht Centraal
  'Leiden': { lat: 52.1663, lon: 4.4821 }, // Leiden Centraal
  'Dordrecht': { lat: 51.8076, lon: 4.6671 }, // Dordrecht Centraal
  'Zoetermeer': { lat: 52.0575, lon: 4.4928 }, // Zoetermeer Centraal
  'Delft': { lat: 52.0067, lon: 4.3556 }, // Delft Centraal
  'Deventer': { lat: 52.2580, lon: 6.1600 }, // Deventer Centraal
  'Zwolle': { lat: 52.5047, lon: 6.0910 }, // Zwolle Centraal
};

/**
 * Find the closest supported city from our pricing list
 */
export const findClosestCity = async (location: string): Promise<{ city: string; distance: number } | null> => {
  const locationCoords = await getLocationCoordinates(location);
  if (!locationCoords) {
    return null;
  }
  
  let closestCity = '';
  let shortestDistance = Infinity;
  
  // Check distance to each supported city center
  for (const [cityName, cityCoords] of Object.entries(DUTCH_CITY_CENTERS)) {
    const distance = calculateDistance(
      locationCoords.lat, 
      locationCoords.lon, 
      cityCoords.lat, 
      cityCoords.lon
    );
    
    if (distance < shortestDistance) {
      shortestDistance = distance;
      closestCity = cityName;
    }
  }
  
  return closestCity ? { city: closestCity, distance: shortestDistance } : null;
};

/**
 * Calculate distance from a location to the center of a specific city
 */
export const calculateDistanceFromCityCenter = async (location: string, cityName: string): Promise<number> => {
  const locationCoords = await getLocationCoordinates(location);
  const cityCenter = DUTCH_CITY_CENTERS[cityName];
  
  if (!locationCoords || !cityCenter) {
    console.warn('Could not calculate distance from city center:', location, cityName);
    return 0;
  }
  
  return calculateDistance(
    locationCoords.lat, 
    locationCoords.lon, 
    cityCenter.lat, 
    cityCenter.lon
  );
};

/**
 * Extract city name from location string or coordinates
 */
export const extractCityFromLocation = async (location: string): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(location)}&` +
      `countrycodes=nl&` +
      `format=json&` +
      `addressdetails=1&` +
      `limit=1`
    );
    
    if (response.ok) {
      const data: GeolocationResult[] = await response.json();
      if (data && data.length > 0) {
        const address = data[0].address;
        // Try to get city from various fields
        return address?.city || address?.town || address?.village || address?.municipality || null;
      }
    }
  } catch (error) {
    console.error('Error extracting city from location:', error);
  }
  return null;
}; 