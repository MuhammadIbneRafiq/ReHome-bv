// Pricing Configuration Types
export interface PricingConfig {
  houseMovingItemMultiplier: number;
  itemTransportMultiplier: number;
  addonMultiplier: number;
  distancePricing: {
    smallDistance: { threshold: number; rate: number };
    mediumDistance: { threshold: number; rate: number };
    longDistance: { rate: number };
  };
  carryingMultipliers: {
    lowValue: { threshold: number; multiplier: number };
    highValue: { multiplier: number };
  };
  assemblyMultipliers: {
    lowValue: { threshold: number; multiplier: number };
    highValue: { multiplier: number };
  };
  extraHelperPricing: {
    smallMove: { threshold: number; price: number };
    bigMove: { price: number };
  };
  cityRange: {
    baseRadius: number;
    extraKmRate: number;
  };
  earlyBookingDiscount: number;
  studentDiscount: number;
}

// Furniture Item Types
export interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  points: number;
  createdAt?: string;
  updatedAt?: string;
}

// City Base Charges Types
export interface CityBaseCharge {
  cityName: string;
  normal: number;
  cityDay: number;
  dayOfWeek: number; // 1=Monday, 2=Tuesday, ..., 7=Sunday
  createdAt?: string;
  updatedAt?: string;
}

// City Day Data Types
export interface CityDayData {
  cityName: string;
  days: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Request Types for API
export interface CreateFurnitureItemRequest {
  name: string;
  category: string;
  points: number;
}

export interface UpdateFurnitureItemRequest {
  id: string;
  name?: string;
  category?: string;
  points?: number;
}

export interface CreateCityBaseChargeRequest {
  cityName: string;
  normal: number;
  cityDay: number;
  dayOfWeek: number;
}

export interface UpdateCityBaseChargeRequest {
  cityName: string;
  normal?: number;
  cityDay?: number;
  dayOfWeek?: number;
}

export interface CreateCityDayDataRequest {
  cityName: string;
  days: string[];
}

export interface UpdateCityDayDataRequest {
  cityName: string;
  days: string[];
}

export interface UpdatePricingConfigRequest {
  config: Partial<PricingConfig>;
}

// Response Types for API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

// Database Schema Types (for backend)
export interface FurnitureItemDB {
  id: string;
  name: string;
  category: string;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface CityBaseChargeDB {
  id: string;
  city_name: string;
  normal: number;
  city_day: number;
  day_of_week: number;
  created_at: string;
  updated_at: string;
}

export interface CityDayDataDB {
  id: string;
  city_name: string;
  days: string[];
  created_at: string;
  updated_at: string;
}

export interface PricingConfigDB {
  id: string;
  config: PricingConfig;
  created_at: string;
  updated_at: string;
}

// Admin Panel Types
export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
  createdAt: string;
}

export interface AdminSession {
  user: AdminUser;
  token: string;
  expiresAt: string;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  tableName: string;
  recordId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  createdAt: string;
} 