// Pricing Administration Service
// Handles CRUD operations for pricing configurations

import { 
  PricingConfig, 
  CityBasePrice, 
  PricingMultiplier, 
  CreatePricingConfigRequest, 
  UpdatePricingConfigRequest,
  PricingResponse 
} from '../types/pricing';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://rehome-backend.vercel.app';

class PricingAdminService {
  // ================== PRICING CONFIGS ==================
  
  /**
   * Get all pricing configurations
   */
  async getPricingConfigs(): Promise<PricingConfig[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/pricing-configs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers when implemented
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pricing configs: ${response.status}`);
      }

      const data = await response.json();
      return data.configs || [];
    } catch (error) {
      console.error('Error fetching pricing configs:', error);
      // Return mock data for development
      return this.getMockPricingConfigs();
    }
  }

  /**
   * Create new pricing configuration
   */
  async createPricingConfig(config: CreatePricingConfigRequest): Promise<PricingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/pricing-configs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error(`Failed to create pricing config: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating pricing config:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  /**
   * Update pricing configuration
   */
  async updatePricingConfig(id: string, updates: UpdatePricingConfigRequest): Promise<PricingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/pricing-configs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update pricing config: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating pricing config:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  /**
   * Delete pricing configuration
   */
  async deletePricingConfig(id: string): Promise<PricingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/pricing-configs/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete pricing config: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting pricing config:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // ================== CITY BASE PRICES ==================

  /**
   * Get all city base prices
   */
  async getCityBasePrices(): Promise<CityBasePrice[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/city-prices`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch city prices: ${response.status}`);
      }

      const data = await response.json();
      return data.cities || [];
    } catch (error) {
      console.error('Error fetching city prices:', error);
      // Return mock data for development
      return this.getMockCityPrices();
    }
  }

  /**
   * Update city base price
   */
  async updateCityBasePrice(id: string, updates: Partial<CityBasePrice>): Promise<PricingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/city-prices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update city price: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating city price:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // ================== MULTIPLIERS ==================

  /**
   * Get all pricing multipliers
   */
  async getPricingMultipliers(): Promise<PricingMultiplier[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/pricing-multipliers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch multipliers: ${response.status}`);
      }

      const data = await response.json();
      return data.multipliers || [];
    } catch (error) {
      console.error('Error fetching multipliers:', error);
      // Return mock data for development
      return this.getMockMultipliers();
    }
  }

  /**
   * Update pricing multiplier
   */
  async updatePricingMultiplier(id: string, updates: Partial<PricingMultiplier>): Promise<PricingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/pricing-multipliers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update multiplier: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating multiplier:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // ================== FURNITURE ITEMS ==================

  /**
   * Get all furniture items
   */
  async getFurnitureItems(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/furniture-items`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch furniture items: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching furniture items:', error);
      // Return mock data for development
      return this.getMockFurnitureItems();
    }
  }

  /**
   * Create new furniture item
   */
  async createFurnitureItem(item: any): Promise<PricingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/furniture-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item)
      });

      if (!response.ok) {
        throw new Error(`Failed to create furniture item: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating furniture item:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  /**
   * Update furniture item
   */
  async updateFurnitureItem(id: string, updates: any): Promise<PricingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/furniture-items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update furniture item: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating furniture item:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  /**
   * Delete furniture item
   */
  async deleteFurnitureItem(id: string): Promise<PricingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/furniture-items/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete furniture item: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting furniture item:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // ================== MOCK DATA (for development) ==================

  private getMockPricingConfigs(): PricingConfig[] {
    return [
      // HOUSE MOVING CONFIGS
      {
        id: '1',
        type: 'base_price',
        category: 'house_moving',
        name: 'House Moving Base Rate',
        description: 'Base hourly rate for house moving services',
        value: 75,
        unit: '€/hour',
        active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      },
      {
        id: '2',
        type: 'distance_rate',
        category: 'house_moving',
        name: 'Distance Rate - House Moving',
        description: 'Extra cost per km beyond 8km for house moves',
        value: 3,
        unit: '€/km',
        active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      },
      {
        id: '3',
        type: 'multiplier',
        category: 'house_moving',
        name: 'Student Discount - House Moving',
        description: 'Discount for students on house moving',
        value: 0.85,
        unit: 'x',
        active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      },
      {
        id: '4',
        type: 'addon',
        category: 'house_moving',
        name: 'Floor Charge',
        description: 'Additional charge per floor level',
        value: 25,
        unit: '€/floor',
        active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      },
      
      // ITEM TRANSPORT CONFIGS
      {
        id: '5',
        type: 'base_price',
        category: 'item_transport',
        name: 'Item Transport Base Rate',
        description: 'Base rate for individual item transport',
        value: 45,
        unit: '€',
        active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      },
      {
        id: '6',
        type: 'distance_rate',
        category: 'item_transport',
        name: 'Distance Rate - Item Transport',
        description: 'Extra cost per km for item transport',
        value: 2,
        unit: '€/km',
        active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      },
      {
        id: '7',
        type: 'addon',
        category: 'item_transport',
        name: 'Disassembly Service',
        description: 'Assembly/disassembly service for items',
        value: 30,
        unit: '€/item',
        active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      },
      
      // SPECIAL REQUEST CONFIGS
      {
        id: '8',
        type: 'base_price',
        category: 'special_request',
        name: 'Special Request Base Rate',
        description: 'Base rate for special requests',
        value: 100,
        unit: '€/hour',
        active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      },
      {
        id: '9',
        type: 'multiplier',
        category: 'special_request',
        name: 'Weekend Multiplier',
        description: 'Weekend pricing multiplier',
        value: 1.3,
        unit: 'x',
        active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
    ];
  }

  private getMockCityPrices(): CityBasePrice[] {
    return [
      // Monday Route Cities
      { id: '1', city: 'Amsterdam', base_price: 119, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '2', city: 'Utrecht', base_price: 119, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '3', city: 'Almere', base_price: 129, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '4', city: 'Haarlem', base_price: 119, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '5', city: 'Zaanstad', base_price: 119, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '6', city: 'Amersfoort', base_price: 129, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '7', city: 's-Hertogenbosch', base_price: 89, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '8', city: 'Hoofddorp', base_price: 119, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      
      // Tuesday Route Cities
      { id: '9', city: 'Rotterdam', base_price: 119, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '10', city: 'The Hague', base_price: 119, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '11', city: 'Breda', base_price: 79, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '12', city: 'Leiden', base_price: 129, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '13', city: 'Dordrecht', base_price: 109, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '14', city: 'Zoetermeer', base_price: 119, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '15', city: 'Delft', base_price: 119, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      
      // Wednesday Route Cities
      { id: '16', city: 'Eindhoven', base_price: 89, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '17', city: 'Maastricht', base_price: 149, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      
      // Thursday Route Cities
      { id: '18', city: 'Tilburg', base_price: 29, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      
      // Friday Route Cities
      { id: '19', city: 'Groningen', base_price: 219, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      
      // Saturday Route Cities
      { id: '20', city: 'Nijmegen', base_price: 149, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '21', city: 'Enschede', base_price: 159, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '22', city: 'Arnhem', base_price: 159, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '23', city: 'Apeldoorn', base_price: 159, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '24', city: 'Deventer', base_price: 159, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      
      // Sunday Route Cities
      { id: '25', city: 'Zwolle', base_price: 179, distance_rate: 3, active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' }
    ];
  }

  private getMockMultipliers(): PricingMultiplier[] {
    return [
      {
        id: '1',
        name: 'No Elevator',
        description: 'Multiplier when no elevator available',
        multiplier: 1.2,
        category: 'elevator',
        active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'Student Discount',
        description: 'Discount for students',
        multiplier: 0.8,
        category: 'student',
        active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
    ];
  }

  private getMockFurnitureItems(): any[] {
    return [
      // Bedroom Items
      { id: '1', name: 'Single Bed', category: 'Bedroom', points: 3.5, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '2', name: 'Double Bed', category: 'Bedroom', points: 5.0, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '3', name: 'Queen Bed', category: 'Bedroom', points: 6.0, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '4', name: 'King Bed', category: 'Bedroom', points: 7.0, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '5', name: 'Mattress (Single)', category: 'Bedroom', points: 2.0, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '6', name: 'Mattress (Double)', category: 'Bedroom', points: 3.0, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '7', name: 'Wardrobe (Small)', category: 'Bedroom', points: 4.0, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '8', name: 'Wardrobe (Large)', category: 'Bedroom', points: 6.0, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '9', name: 'Chest of Drawers', category: 'Bedroom', points: 3.0, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '10', name: 'Bedside Table', category: 'Bedroom', points: 1.5, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      
      // Dining Items
      { id: '11', name: 'Dining Table (Small)', category: 'Dining', points: 3.0, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '12', name: 'Dining Table (Large)', category: 'Dining', points: 5.0, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '13', name: 'Dining Chair', category: 'Dining', points: 1.0, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '14', name: 'Bar Stool', category: 'Dining', points: 1.0, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      
      // Living Room Items
      { id: '15', name: 'Sofa (2-seater)', category: 'Living Room', points: 4.0, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '16', name: 'Sofa (3-seater)', category: 'Living Room', points: 5.5, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '17', name: 'Armchair', category: 'Living Room', points: 2.5, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '18', name: 'Coffee Table', category: 'Living Room', points: 2.0, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '19', name: 'TV Stand', category: 'Living Room', points: 2.5, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '20', name: 'Bookshelf', category: 'Living Room', points: 3.0, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      
      // Kitchen Items
      { id: '21', name: 'Refrigerator', category: 'Kitchen', points: 5.0, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '22', name: 'Washing Machine', category: 'Kitchen', points: 4.5, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '23', name: 'Dishwasher', category: 'Kitchen', points: 3.5, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '24', name: 'Microwave', category: 'Kitchen', points: 1.5, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      
      // Office Items
      { id: '25', name: 'Desk', category: 'Office', points: 3.0, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '26', name: 'Office Chair', category: 'Office', points: 2.0, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      { id: '27', name: 'Filing Cabinet', category: 'Office', points: 2.5, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' }
    ];
  }
}

// Export singleton instance
export const pricingAdminService = new PricingAdminService();
export default pricingAdminService; 