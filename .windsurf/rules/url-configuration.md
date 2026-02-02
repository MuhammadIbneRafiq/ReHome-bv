---
description: URL configuration patterns for frontend and backend API calls
---

# URL Configuration Patterns

## Frontend URL Configuration

### Centralized API Config
All API URLs MUST be defined in `src/lib/api/config.ts`:

```typescript
// src/lib/api/config.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export { API_BASE_URL };

export const API_ENDPOINTS = {
  PLACES: {
    AUTOCOMPLETE: `${API_BASE_URL}/api/places/autocomplete`,
    DETAILS: (placeId: string) => `${API_BASE_URL}/api/places/${placeId}`,
  },
  // ... other endpoints
};
```

### Rules for Frontend
1. **NEVER hardcode URLs** in components or services
2. **Always import from `API_ENDPOINTS`** for API calls
3. **Use environment variables** for base URL (`VITE_API_URL`)
4. **No localhost URLs in code** - use env vars

### Environment Variables (Frontend)
```env
# .env.development
VITE_API_URL=http://localhost:3000

# .env.production  
VITE_API_URL=https://rehome-backend.vercel.app
```

## Backend URL Configuration

### Environment Variables
```env
# For external API calls
GOOGLE_MAPS_API=your_api_key

# For Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key

# Server port
PORT=3000
```

### Internal Service Calls
**NEVER make HTTP calls to your own endpoints within the backend.**

❌ BAD:
```javascript
// Inside supabasePricingService.js
const response = await axios.post('http://localhost:3000/api/calculate-distance', data);
```

✅ GOOD:
```javascript
// Import and call the function directly
import { calculateDistance } from './googleMapsService.js';
const result = await calculateDistance(origin, destination);
```

## Test Configuration

### Mocking API Endpoints in Tests
When testing components that use API endpoints, mock the config module:

```typescript
// Define mock URLs - NOT hardcoded localhost
const MOCK_API_BASE = 'https://mock-api.test';

vi.mock('../../../lib/api/config', () => ({
  API_ENDPOINTS: {
    PLACES: {
      AUTOCOMPLETE: `${MOCK_API_BASE}/api/places/autocomplete`,
      DETAILS: (id: string) => `${MOCK_API_BASE}/api/places/${id}`,
    }
  }
}));
```

### Rules for Tests
1. **Use mock URLs** that clearly indicate they're mocks (e.g., `https://mock-api.test`)
2. **Never use localhost in mocks** - it confuses the distinction between real and mocked
3. **Mock the config module** instead of hardcoding URLs in tests

## Service Communication Patterns

### Frontend → Backend
```
Frontend Component
    ↓ (import)
API_ENDPOINTS (config.ts)
    ↓ (fetch)
Backend Express Routes
```

### Backend Service → Backend Service
```
supabasePricingService.js
    ↓ (import)
googleMapsService.js (direct function call)
    ↓
External API (Google Maps)
```

### Backend Service → External API
```
googleMapsService.js
    ↓ (axios with env var API key)
Google Places API
```

## Checklist Before Committing

- [ ] No hardcoded `localhost` URLs in source files
- [ ] All API URLs use `API_ENDPOINTS` from config
- [ ] Environment variables used for base URLs
- [ ] Backend services call functions directly, not HTTP endpoints
- [ ] Tests use mock URLs, not localhost
