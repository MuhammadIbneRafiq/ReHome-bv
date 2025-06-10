# API Configuration and Service

This directory contains the centralized API configuration and service utilities for the ReHome frontend application.

## Files

### `config.ts`
- Centralizes all API endpoint configurations
- Automatically switches between development and production URLs
- Provides utility functions for authentication headers

### `apiService.ts`
- Provides a service class with methods for all API operations
- Handles authentication automatically
- Includes proper error handling and response typing

## Usage

### Basic API Calls

```typescript
import { apiService } from '../api/apiService';

// Authentication
try {
  const response = await apiService.login(email, password);
  localStorage.setItem('accessToken', response.accessToken);
} catch (error) {
  console.error('Login failed:', error.message);
}

// Furniture operations
const furniture = await apiService.getFurniture();
await apiService.createFurniture(furnitureData);
await apiService.deleteFurniture(id);

// Moving services
await apiService.createItemMovingRequest(requestData);
await apiService.createHouseMovingRequest(requestData);
```

### Using Endpoints Directly

```typescript
import { API_ENDPOINTS } from '../api/config';

// For custom fetch calls
const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
```

## Environment Configuration

The API automatically switches between:
- **Development**: `http://localhost:3000`
- **Production**: `https://rehome-backend.vercel.app`

## Authentication

The service automatically handles authentication by:
1. Retrieving tokens from localStorage
2. Adding Bearer token headers to authenticated requests
3. Providing proper error handling for authentication failures

## Error Handling

All API methods include comprehensive error handling:
- Network errors
- Server errors
- Authentication errors
- Validation errors

Errors are returned as standard Error objects with descriptive messages.

## Migration from Direct API Calls

Replace hardcoded API URLs with the service:

```typescript
// Before
const response = await axios.post('https://rehome-backend.vercel.app/auth/login', data);

// After
const response = await apiService.login(email, password);
``` 