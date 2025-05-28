// Free Location Autocomplete Services
// This file demonstrates different free options for location autocomplete

export interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
}

// 1. OpenStreetMap Nominatim API (Completely Free)
// ✅ No API key required
// ✅ Unlimited requests (with fair usage)
// ✅ Global coverage
// ✅ Best for European addresses
export const searchWithNominatim = async (
  query: string, 
  countryCode: string = 'nl'
): Promise<LocationSuggestion[]> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}&` +
      `countrycodes=${countryCode}&` +
      `format=json&` +
      `addressdetails=1&` +
      `limit=5&` +
      `dedupe=1`
    );
    
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Nominatim API error:', error);
    return [];
  }
};

// 2. MapBox Geocoding API (Free Tier)
// ✅ 100,000 requests/month free
// ✅ Excellent autocomplete
// ✅ Global coverage
// ❌ Requires API key
export const searchWithMapbox = async (
  query: string, 
  apiKey: string,
  countryCode: string = 'nl'
): Promise<LocationSuggestion[]> => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
      `access_token=${apiKey}&` +
      `country=${countryCode}&` +
      `limit=5&` +
      `types=address,poi`
    );
    
    if (response.ok) {
      const data = await response.json();
      // Convert Mapbox format to our standard format
      return data.features.map((feature: any) => ({
        display_name: feature.place_name,
        lat: feature.center[1].toString(),
        lon: feature.center[0].toString(),
        place_id: feature.id,
        address: {
          house_number: feature.address,
          road: feature.text,
          city: feature.context?.find((c: any) => c.id.includes('place'))?.text,
          postcode: feature.context?.find((c: any) => c.id.includes('postcode'))?.text,
          country: feature.context?.find((c: any) => c.id.includes('country'))?.text,
        }
      }));
    }
    return [];
  } catch (error) {
    console.error('Mapbox API error:', error);
    return [];
  }
};

// 3. HERE Geocoding API (Free Tier)
// ✅ 250,000 requests/month free
// ✅ Good European coverage
// ❌ Requires API key
export const searchWithHere = async (
  query: string, 
  apiKey: string,
  countryCode: string = 'NLD'
): Promise<LocationSuggestion[]> => {
  try {
    const response = await fetch(
      `https://geocode.search.hereapi.com/v1/geocode?` +
      `q=${encodeURIComponent(query)}&` +
      `in=countryCode:${countryCode}&` +
      `apiKey=${apiKey}&` +
      `limit=5`
    );
    
    if (response.ok) {
      const data = await response.json();
      // Convert HERE format to our standard format
      return data.items.map((item: any) => ({
        display_name: item.title,
        lat: item.position.lat.toString(),
        lon: item.position.lng.toString(),
        place_id: item.id,
        address: {
          house_number: item.address?.houseNumber,
          road: item.address?.street,
          city: item.address?.city,
          postcode: item.address?.postalCode,
          country: item.address?.countryName,
        }
      }));
    }
    return [];
  } catch (error) {
    console.error('HERE API error:', error);
    return [];
  }
};

// 4. Photon API (Free OpenStreetMap-based)
// ✅ Completely free
// ✅ No API key required
// ✅ Good European coverage
// ✅ Alternative to Nominatim
export const searchWithPhoton = async (
  query: string, 
  countryCode: string = 'NL'
): Promise<LocationSuggestion[]> => {
  try {
    const response = await fetch(
      `https://photon.komoot.io/api/?` +
      `q=${encodeURIComponent(query)}&` +
      `osm_tag=place:city,place:town,place:village,highway:*&` +
      `limit=5`
    );
    
    if (response.ok) {
      const data = await response.json();
      // Convert Photon format to our standard format
      return data.features.map((feature: any) => ({
        display_name: feature.properties.name || feature.properties.street,
        lat: feature.geometry.coordinates[1].toString(),
        lon: feature.geometry.coordinates[0].toString(),
        place_id: feature.properties.osm_id?.toString() || Math.random().toString(),
        address: {
          house_number: feature.properties.housenumber,
          road: feature.properties.street,
          city: feature.properties.city,
          postcode: feature.properties.postcode,
          country: feature.properties.country,
        }
      }));
    }
    return [];
  } catch (error) {
    console.error('Photon API error:', error);
    return [];
  }
};

// 5. LocationIQ (Free Tier)
// ✅ 5,000 requests/day free
// ✅ Good global coverage
// ❌ Requires API key
export const searchWithLocationIQ = async (
  query: string, 
  apiKey: string,
  countryCode: string = 'nl'
): Promise<LocationSuggestion[]> => {
  try {
    const response = await fetch(
      `https://eu1.locationiq.com/v1/search.php?` +
      `key=${apiKey}&` +
      `q=${encodeURIComponent(query)}&` +
      `countrycodes=${countryCode}&` +
      `format=json&` +
      `addressdetails=1&` +
      `limit=5`
    );
    
    if (response.ok) {
      const data = await response.json();
      // LocationIQ uses same format as Nominatim
      return data;
    }
    return [];
  } catch (error) {
    console.error('LocationIQ API error:', error);
    return [];
  }
};

// Main search function that tries multiple services
export const searchLocation = async (
  query: string,
  options: {
    countryCode?: string;
    mapboxApiKey?: string;
    hereApiKey?: string;
    locationiqApiKey?: string;
    preferredService?: 'nominatim' | 'mapbox' | 'here' | 'photon' | 'locationiq';
  } = {}
): Promise<LocationSuggestion[]> => {
  const { 
    countryCode = 'nl', 
    preferredService = 'nominatim',
    mapboxApiKey,
    hereApiKey,
    locationiqApiKey
  } = options;

  // Try preferred service first
  try {
    switch (preferredService) {
      case 'mapbox':
        if (mapboxApiKey) {
          return await searchWithMapbox(query, mapboxApiKey, countryCode);
        }
        break;
      case 'here':
        if (hereApiKey) {
          return await searchWithHere(query, hereApiKey, countryCode.toUpperCase());
        }
        break;
      case 'photon':
        return await searchWithPhoton(query, countryCode.toUpperCase());
      case 'locationiq':
        if (locationiqApiKey) {
          return await searchWithLocationIQ(query, locationiqApiKey, countryCode);
        }
        break;
      default:
        return await searchWithNominatim(query, countryCode);
    }
  } catch (error) {
    console.warn(`${preferredService} failed, falling back to Nominatim:`, error);
  }

  // Fallback to Nominatim (always free)
  return await searchWithNominatim(query, countryCode);
};

// Usage Examples:
/*
// 1. Basic usage (free Nominatim)
const suggestions = await searchLocation('Amsterdam');

// 2. With Mapbox API key
const suggestions = await searchLocation('Amsterdam', {
  preferredService: 'mapbox',
  mapboxApiKey: 'your-mapbox-api-key'
});

// 3. With HERE API key
const suggestions = await searchLocation('Amsterdam', {
  preferredService: 'here',
  hereApiKey: 'your-here-api-key'
});

// 4. With fallback strategy
const suggestions = await searchLocation('Amsterdam', {
  preferredService: 'mapbox',
  mapboxApiKey: 'your-mapbox-api-key', // Will fallback to Nominatim if this fails
});
*/ 