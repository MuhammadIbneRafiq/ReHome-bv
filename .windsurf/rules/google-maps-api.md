---
description: Google Maps API integration guidelines and backend proxy usage
---

# Google Maps API Integration

## Architecture Overview

All Google Maps API calls are routed through the **backend proxy** to enable:
- **Caching** - Identical queries share cached results (saves API costs)
- **Rate limiting** - Backend controls request flow
- **Security** - API keys stay on server, not exposed to frontend
- **Cost optimization** - 1000 users searching "Amsterdam" = 1 API call instead of 1000

## Backend Services

### Location: `rehome-backend/services/googleMapsService.js`

This centralized service handles all Google Maps operations with built-in caching:

| Cache Type | TTL | Purpose |
|------------|-----|---------|
| Autocomplete | 5 min | Same search queries |
| Place Details | 30 min | Place info rarely changes |
| Distance | 1 hour | Routes rarely change |

## API Endpoints

### 1. Places Autocomplete
```
POST /api/places/autocomplete
```

**Request:**
```json
{
  "query": "Amsterdam",
  "options": {
    "regionCodes": ["nl", "be", "de"],
    "languageCode": "en",
    "types": ["street_address", "route", "locality"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "placeId": "ChIJVXealLU_xkcR...",
      "text": "Amsterdam, Netherlands",
      "mainText": "Amsterdam",
      "secondaryText": "Netherlands"
    }
  ],
  "fromCache": true
}
```

### 2. Place Details
```
GET /api/places/:placeId
```

**Response:**
```json
{
  "success": true,
  "place": {
    "placeId": "ChIJVXealLU_xkcR...",
    "displayName": "Amsterdam",
    "formattedAddress": "Amsterdam, Netherlands",
    "coordinates": { "lat": 52.3676, "lng": 4.9041 },
    "countryCode": "NL",
    "countryName": "Netherlands",
    "city": "Amsterdam"
  },
  "fromCache": true
}
```

### 3. Distance Calculation
```
POST /api/calculate-distance
```

**Request:**
```json
{
  "origin": "52.3676,4.9041",
  "destination": "51.9225,4.4792"
}
```

**Response:**
```json
{
  "success": true,
  "distanceKm": 57.3,
  "distanceText": "57.3 km",
  "duration": 2580,
  "durationText": "43 mins",
  "provider": "Google Routes API",
  "fromCache": true
}
```

### 4. Admin: Cache Stats
```
GET /api/places/admin/cache-stats
```
Requires admin authentication.

### 5. Admin: Clear Cache
```
POST /api/places/admin/clear-cache
Body: { "cacheType": "autocomplete" | "details" | "distance" | "all" }
```
Requires admin authentication.

## Frontend Usage

### GooglePlacesAutocomplete Component

Located at: `src/components/ui/GooglePlacesAutocomplete.tsx`

**Usage:**
```tsx
import { GooglePlacesAutocomplete } from '@/components/ui/GooglePlacesAutocomplete';

<GooglePlacesAutocomplete
  value={address}
  onChange={(val) => setAddress(val)}
  onPlaceSelect={(place) => {
    console.log('Selected:', place.formattedAddress);
    console.log('Coordinates:', place.coordinates);
    console.log('City:', place.city);
  }}
  placeholder="Enter address"
/>
```

### API Config

All Places API endpoints are defined in `src/lib/api/config.ts`:

```typescript
PLACES: {
  AUTOCOMPLETE: `${API_BASE_URL}/api/places/autocomplete`,
  DETAILS: (placeId: string) => `${API_BASE_URL}/api/places/${placeId}`,
  CALCULATE_DISTANCE: `${API_BASE_URL}/api/calculate-distance`,
}
```

## Environment Variables

### Backend (`rehome-backend/.env`)
```
GOOGLE_MAPS_API=your_api_key_here
# OR
GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Frontend (`Rehome/.env`)
```
# No longer needed for Places API (uses backend proxy)
# VITE_GOOGLE_MAPS_API is only used for client-side map rendering if needed
```

## Important Rules

1. **NEVER call Google APIs directly from frontend** - Always use backend proxy
2. **NEVER expose API keys in frontend code**
3. **Use the centralized `googleMapsService.js`** for all backend Google Maps operations
4. **Use `calculateDistanceFromLocations()`** instead of HTTP calls within backend services
5. **Check cache stats regularly** to monitor API usage

## Cost Optimization

| Scenario | Without Caching | With Caching |
|----------|-----------------|--------------|
| 1000 users search "Amsterdam" | 1000 API calls = $2.85 | 1 API call = $0.003 |
| Place details for same location | 1000 API calls = $5.00 | 1 API call = $0.005 |
| Distance calculation Amsterdam→Rotterdam | 1000 API calls = $5.00 | 1 API call = $0.005 |

**Estimated savings: 99.7%**
