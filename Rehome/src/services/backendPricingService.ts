import API_ENDPOINTS from '../lib/api/config';

export interface PricingInput {
  serviceType: string;
  pickupLocation: any;
  dropoffLocation: any;
  selectedDate?: string;
  dateOption?: 'fixed' | 'flexible' | 'rehome';
  // Business transport
  isBusiness?: boolean;
  businessType?: string;
  // Legacy marketplace schema
  items?: any[];
  hasStudentId?: boolean;
  needsAssembly?: boolean;
  needsExtraHelper?: boolean;
  pickupFloors?: number;
  dropoffFloors?: number;
  hasElevatorPickup?: boolean;
  hasElevatorDropoff?: boolean;
  daysUntilMove?: number;
  // Item transport & house moving schema
  distanceKm?: number;
  selectedDateRange?: { start: string; end: string };
  pickupDate?: string;
  dropoffDate?: string;
  isDateFlexible?: boolean;
  itemQuantities?: Record<string, number>;
  floorPickup?: number;
  floorDropoff?: number;
  elevatorPickup?: boolean;
  elevatorDropoff?: boolean;
  assemblyItems?: Record<string, boolean>;
  disassemblyItems?: Record<string, boolean>;
  extraHelperItems?: Record<string, boolean>;
  isStudent?: boolean;
  carryingServiceItems?: Record<string, boolean>;
  carryingUpItems?: Record<string, boolean>;
  carryingDownItems?: Record<string, boolean>;
  pickupPlace?: any;
  dropoffPlace?: any;
}

class BackendPricingService {
  private getBaseUrl(): string {
    // Extract base URL from any endpoint
    return API_ENDPOINTS.AUTH.LOGIN.replace('/api/auth/login', '');
  }

  /**
   * Calculate pricing using backend API
   */
  async calculatePricing(input: PricingInput) {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/transport/calculate-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        throw new Error('Failed to calculate pricing');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error calculating pricing:', error);
      // Fallback to default pricing
      return {
        basePrice: 100,
        itemValue: 0,
        distanceCost: 0,
        carryingCost: 0,
        assemblyCost: 0,
        extraHelperCost: 0,
        subtotal: 100,
        studentDiscount: 0,
        total: 100,
        breakdown: {}
      };
    }
  }

  /**
   * Create transportation request with images
   * Uses unified /api/transport/create endpoint for both house-moving and item-transport
   */
  async createTransportRequest(formData: FormData) {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/transport/create`, {
        method: 'POST',
        body: formData // Send FormData directly - backend expects individual fields
      });

      if (!response.ok) {
        throw new Error('Failed to create transport request');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating transport request:', error);
      return { success: false, error };
    }
  }

  /**
   * Calculate marketplace checkout pricing
   */
  async calculateMarketplaceCheckout(items: any[], options: any) {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/marketplace/calculate-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error('Failed to calculate checkout');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error calculating checkout:', error);
      throw error;
    }
  }

  /**
   * Process marketplace checkout
   */
  async processCheckout(checkoutData: any) {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/marketplace/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData)
      });

      if (!response.ok) {
        throw new Error('Failed to process checkout');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error processing checkout:', error);
      throw error;
    }
  }
}

export default new BackendPricingService();
