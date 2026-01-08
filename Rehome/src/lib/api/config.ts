const API_BASE_URL = 'https://rehome-backend.vercel.app';
// const API_BASE_URL = 'http://localhost:3000';

// API Endpoints Configuration
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    SIGNUP: `${API_BASE_URL}/api/auth/signup`,
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    GOOGLE_CALLBACK: `${API_BASE_URL}/api/auth/google/callback`,
  },

  // Furniture Management
  FURNITURE: {
    LIST: `${API_BASE_URL}/api/furniture`,
    SOLD: `${API_BASE_URL}/api/furniture/sold`,
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
    SPECIAL_REQUEST: `${API_BASE_URL}/api/special-requests`,
  },

  // Special Requests
  SPECIAL_REQUESTS: {
    SUBMIT: `${API_BASE_URL}/api/special-requests`,
  },

  // Item Donation Services
  DONATION: {
    ITEM_REQUEST: `${API_BASE_URL}/api/item-donation-requests`,
    LIST_REQUESTS: `${API_BASE_URL}/api/item-donation-requests`,
    UPDATE_STATUS: (id: string) => `${API_BASE_URL}/api/item-donation-requests/${id}/status`,
  },

  // File Upload
  UPLOAD: {
    PHOTOS: `${API_BASE_URL}/api/upload`,
  },

  // Communication
  EMAIL: {
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
  },

  // ReHome Orders
  REHOME_ORDERS: {
    CREATE: `${API_BASE_URL}/api/rehome-orders`,
  },

  // Marketplace Item Details
  MARKETPLACE: {
    ITEM_DETAILS: `${API_BASE_URL}/api/marketplace-item-details`,
    PRICING_MULTIPLIERS: `${API_BASE_URL}/api/marketplace-pricing-multipliers`,
  },

  // Admin (if needed)
  ADMIN: {
    LOGIN: `${API_BASE_URL}/api/admin/login`,
    LOGOUT: `${API_BASE_URL}/api/admin/logout`,
    FURNITURE_ITEMS: `${API_BASE_URL}/api/furniture-items`,
    AUDIT_LOGS: `${API_BASE_URL}/api/audit-logs`,
    MARKETPLACE_ITEM_DETAILS: `${API_BASE_URL}/api/admin/marketplace-item-details`,
    MARKETPLACE_ITEM_DETAIL: (id: string) => `${API_BASE_URL}/api/admin/marketplace-item-details/${id}`,
    SALES_HISTORY: `${API_BASE_URL}/api/admin/sales-history`,
    SALES_STATISTICS: `${API_BASE_URL}/api/admin/sales-statistics`,
    REHOME_ORDERS: `${API_BASE_URL}/api/rehome-orders`,
    CARRYING_CONFIG: `${API_BASE_URL}/api/admin/carrying-config`,
    CARRYING_CONFIG_ITEM: (itemType: string) => `${API_BASE_URL}/api/admin/carrying-config/${itemType}`,
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