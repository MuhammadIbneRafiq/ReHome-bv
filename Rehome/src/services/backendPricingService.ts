interface PricingInput {
  serviceType: string;
  pickupLocation: any;
  dropoffLocation: any;
  selectedDate?: string;
  items: any[];
  hasStudentId?: boolean;
  needsAssembly?: boolean;
  needsExtraHelper?: boolean;
  pickupFloors?: number;
  dropoffFloors?: number;
  hasElevatorPickup?: boolean;
  hasElevatorDropoff?: boolean;
  daysUntilMove?: number;
}

class BackendPricingService {
  private apiUrl: string;
  
  constructor() {
    this.apiUrl = 'https://rehome-backend.vercel.app';
  }

  /**
   * Calculate pricing using backend API
   */
  async calculatePricing(input: PricingInput) {
    try {
      const response = await fetch(`${this.apiUrl}/api/transport/calculate-price`, {
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
   */
  async createTransportRequest(formData: FormData) {
    try {
      const response = await fetch(`${this.apiUrl}/api/transport/create`, {
        method: 'POST',
        body: formData // Don't set Content-Type, let browser set it for multipart/form-data
      });

      if (!response.ok) {
        throw new Error('Failed to create transport request');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating transport request:', error);
      throw error;
    }
  }

  /**
   * Calculate marketplace checkout pricing
   */
  async calculateMarketplaceCheckout(items: any[], options: any) {
    try {
      const response = await fetch(`${this.apiUrl}/api/marketplace/calculate-checkout`, {
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
      const response = await fetch(`${this.apiUrl}/api/marketplace/checkout`, {
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
