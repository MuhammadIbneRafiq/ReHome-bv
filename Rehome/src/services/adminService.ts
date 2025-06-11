import { API_ENDPOINTS } from '../lib/api/config';

export interface CityBaseCharge {
  id: string;
  city_name: string;
  normal: number;
  city_day: number;
  day_of_week: number;
  created_at: string;
  updated_at: string;
}

export interface FurnitureItemAPI {
  id: string;
  name: string;
  category: string;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface PricingConfigAPI {
  id: string;
  config: {
    baseMultiplier: number;
    weekendMultiplier: number;
    cityDayMultiplier: number;
    floorChargePerLevel: number;
    elevatorDiscount: number;
    assemblyChargePerItem: number;
    extraHelperChargePerItem: number;
    studentDiscount: number;
    earlyBookingDiscount: number;
    minimumCharge: number;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class AdminService {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('adminToken');
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
  }

  // City Base Charges
  async getCityBaseCharges(): Promise<CityBaseCharge[]> {
    const response = await fetch(API_ENDPOINTS.PRICING.CITY_BASE_CHARGES);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch city base charges');
    return data.data;
  }

  async updateCityBaseCharge(cityName: string, normal: number, cityDay: number, dayOfWeek: number): Promise<void> {
    const response = await this.fetchWithAuth(`${API_ENDPOINTS.PRICING.CITY_BASE_CHARGES}/${cityName}`, {
      method: 'PUT',
      body: JSON.stringify({ normal, cityDay, dayOfWeek }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to update city base charge');
  }

  // Furniture Items
  async getFurnitureItems(): Promise<FurnitureItemAPI[]> {
    const response = await fetch(API_ENDPOINTS.ADMIN.FURNITURE_ITEMS);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch furniture items');
    return data.data;
  }

  async updateFurnitureItem(id: string, name?: string, category?: string, points?: number): Promise<void> {
    const response = await this.fetchWithAuth(`${API_ENDPOINTS.ADMIN.FURNITURE_ITEMS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, category, points }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to update furniture item');
  }

  async createFurnitureItem(name: string, category: string, points: number): Promise<void> {
    const response = await this.fetchWithAuth(API_ENDPOINTS.ADMIN.FURNITURE_ITEMS, {
      method: 'POST',
      body: JSON.stringify({ name, category, points }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to create furniture item');
  }

  async deleteFurnitureItem(id: string): Promise<void> {
    const response = await this.fetchWithAuth(`${API_ENDPOINTS.ADMIN.FURNITURE_ITEMS}/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to delete furniture item');
  }

  // Pricing Configuration
  async getPricingConfig(): Promise<PricingConfigAPI> {
    const response = await fetch(API_ENDPOINTS.PRICING.CONFIG);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch pricing config');
    return data.data;
  }

  async updatePricingConfig(config: PricingConfigAPI['config']): Promise<void> {
    const response = await this.fetchWithAuth(API_ENDPOINTS.PRICING.CONFIG, {
      method: 'PUT',
      body: JSON.stringify({ config }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to update pricing config');
  }
}

export const adminService = new AdminService(); 