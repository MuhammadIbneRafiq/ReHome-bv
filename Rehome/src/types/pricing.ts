// Pricing Configuration Types
export interface PricingConfig {
  id: string;
  type: 'multiplier' | 'base_price' | 'distance_rate' | 'addon';
  category: string; // 'house_moving', 'item_transport', 'special_request'
  name: string;
  description: string;
  value: number;
  unit?: string; // '€', '%', '€/km', etc.
  active: boolean;
  created_at: string;
  updated_at: string;
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
  name?: string;
  description?: string;
  value?: number;
  unit?: string;
  active?: boolean;
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

// Pricing configuration interfaces for admin management
export interface CityBasePrice {
  id: string;
  city: string;
  base_price: number;
  distance_rate: number; // €/km beyond 8km
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ItemTypePrice {
  id: string;
  category: string; // 'furniture', 'boxes', 'special'
  item_name: string;
  base_price: number;
  size_multiplier: number;
  weight_multiplier: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingMultiplier {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  category: string; // 'floor', 'elevator', 'distance', 'time', 'student'
  active: boolean;
  created_at: string;
  updated_at: string;
}

// API request/response types
export interface CreatePricingConfigRequest {
  type: 'multiplier' | 'base_price' | 'distance_rate' | 'addon';
  category: string;
  name: string;
  description: string;
  value: number;
  unit?: string;
  active?: boolean;
}

export interface PricingResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Default pricing configurations for seeding
export const DEFAULT_PRICING_CONFIGS: Omit<PricingConfig, 'id' | 'created_at' | 'updated_at'>[] = [
  // House Moving Base Prices
  { type: 'base_price', category: 'house_moving', name: 'Amsterdam Base', description: 'Base price for Amsterdam area', value: 75, unit: '€', active: true },
  { type: 'base_price', category: 'house_moving', name: 'Rotterdam Base', description: 'Base price for Rotterdam area', value: 70, unit: '€', active: true },
  { type: 'base_price', category: 'house_moving', name: 'Utrecht Base', description: 'Base price for Utrecht area', value: 65, unit: '€', active: true },
  
  // Distance Rates
  { type: 'distance_rate', category: 'house_moving', name: 'Distance Rate', description: 'Extra cost per km beyond 8km', value: 3, unit: '€/km', active: true },
  
  // Multipliers
  { type: 'multiplier', category: 'house_moving', name: 'Floor Pickup/Dropoff', description: 'Extra cost per floor', value: 15, unit: '€/floor', active: true },
  { type: 'multiplier', category: 'house_moving', name: 'No Elevator', description: 'Multiplier when no elevator available', value: 1.2, unit: 'x', active: true },
  { type: 'multiplier', category: 'house_moving', name: 'Student Discount', description: 'Discount for students', value: 0.8, unit: 'x', active: true },
  { type: 'multiplier', category: 'house_moving', name: 'Early Booking Discount', description: 'Discount for early booking', value: 0.5, unit: 'x', active: true },
  
  // Add-ons
  { type: 'addon', category: 'house_moving', name: 'Disassembly Service', description: 'Furniture disassembly cost per item', value: 25, unit: '€/item', active: true },
  { type: 'addon', category: 'house_moving', name: 'Extra Helper', description: 'Additional helper cost', value: 35, unit: '€', active: true },
  
  // Item Transport
  { type: 'base_price', category: 'item_transport', name: 'Small Item Base', description: 'Base price for small items', value: 25, unit: '€', active: true },
  { type: 'base_price', category: 'item_transport', name: 'Medium Item Base', description: 'Base price for medium items', value: 45, unit: '€', active: true },
  { type: 'base_price', category: 'item_transport', name: 'Large Item Base', description: 'Base price for large items', value: 65, unit: '€', active: true },
];

export const DEFAULT_CITY_PRICES: Omit<CityBasePrice, 'id' | 'created_at' | 'updated_at'>[] = [
  { city: 'Amsterdam', base_price: 75, distance_rate: 3, active: true },
  { city: 'Rotterdam', base_price: 70, distance_rate: 3, active: true },
  { city: 'Utrecht', base_price: 65, distance_rate: 3, active: true },
  { city: 'Den Haag', base_price: 70, distance_rate: 3, active: true },
  { city: 'Eindhoven', base_price: 60, distance_rate: 3, active: true },
  { city: 'Tilburg', base_price: 55, distance_rate: 3, active: true },
  { city: 'Groningen', base_price: 55, distance_rate: 3, active: true },
  { city: 'Almere', base_price: 65, distance_rate: 3, active: true },
  { city: 'Breda', base_price: 55, distance_rate: 3, active: true },
  { city: 'Nijmegen', base_price: 60, distance_rate: 3, active: true },
]; 