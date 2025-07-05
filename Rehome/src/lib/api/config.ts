    // API Configuration for ReHome Backend
// This file centralizes all API endpoint configurations

// Use Vercel backend by default, can be overridden with VITE_API_URL environment variable
// In development, use relative URLs to work with Vite proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'development' ? '' : 'https://rehome-backend.vercel.app');

// Debug: Log the API base URL in development
if (import.meta.env.MODE === 'development') {
  console.log('🚀 API Base URL:', API_BASE_URL || 'Using relative URLs (proxy)');
}

// API Endpoints Configuration
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    SIGNUP: `${API_BASE_URL}/api/auth/signup`,
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  },

  // Furniture Management
  FURNITURE: {
    LIST: `${API_BASE_URL}/api/furniture`,
    CREATE: `${API_BASE_URL}/api/furniture/new`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/furniture/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/furniture/${id}`,
    MARK_SOLD: (id: string) => `${API_BASE_URL}/api/furniture/sold/${id}`,
    GET_BY_ID: (id: string) => `${API_BASE_URL}/api/furniture/${id}`,
    UPDATE_STATUS: (id: string) => `${API_BASE_URL}/api/furniture/${id}/status`,
  },

  // Moving Services
  MOVING: {
    ITEM_REQUEST: `${API_BASE_URL}/api/item-moving-requests`,
    HOUSE_REQUEST: `${API_BASE_URL}/api/house-moving-requests`,
    SPECIAL_REQUEST: `${API_BASE_URL}/api/special-request`,
  },

  // File Upload
  UPLOAD: {
    PHOTOS: `${API_BASE_URL}/api/upload`,
  },

  // Communication
  EMAIL: {
    SEND: `${API_BASE_URL}/api/send-email`,
    REHOME_ORDER_CONFIRMATION: `${API_BASE_URL}/api/rehome-order/send-confirmation`,
  },

  // Contact
  CONTACT: {
    SUBMIT: `${API_BASE_URL}/api/contact`,
  },

  // Messages
  MESSAGES: {
    BY_ITEM: (itemId: string) => `${API_BASE_URL}/api/messages/item/${itemId}`,
    BY_USER: (userId: string) => `${API_BASE_URL}/api/messages/user/${userId}`,
    CREATE: `${API_BASE_URL}/api/messages`,
    MARK_READ: `${API_BASE_URL}/api/messages/read`,
  },

  // Legal Documents
  LEGAL: {
    TERMS_OF_SERVICE: `${API_BASE_URL}/api/legal/terms-of-service`,
    PRIVACY_POLICY: `${API_BASE_URL}/api/legal/privacy-policy`,
    ACCEPT_TERMS: `${API_BASE_URL}/api/legal/accept-terms`,
  },

  // Pricing
  PRICING: {
    CALCULATE: `${API_BASE_URL}/api/calculate-pricing`,
    CONFIG: `${API_BASE_URL}/api/pricing-config`,
    CITY_BASE_CHARGES: `${API_BASE_URL}/api/city-base-charges`,
    CITY_DAY_DATA: `${API_BASE_URL}/api/city-day-data`,
  },

  // Admin (if needed)
  ADMIN: {
    LOGIN: `${API_BASE_URL}/api/admin/login`,
    LOGOUT: `${API_BASE_URL}/api/admin/logout`,
    FURNITURE_ITEMS: `${API_BASE_URL}/api/furniture-items`,
    AUDIT_LOGS: `${API_BASE_URL}/api/audit-logs`,
  },
} as const;

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const;

// Common Headers
export const getAuthHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` }),
});

// Environment check
export const isDevelopment = import.meta.env.MODE === 'development';
export const isProduction = import.meta.env.MODE === 'production';

export default API_ENDPOINTS; 