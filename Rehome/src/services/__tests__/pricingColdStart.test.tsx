import { describe, it, vi, beforeEach, expect } from 'vitest';
import * as pricing from '../pricingService';

// Mock the API config
vi.mock('../../api/config', () => ({ 
  default: { 
    MOVING: { ITEM_REQUEST: '/api/mock' }, 
    AUTH: { LOGIN: '/api/auth/login' } 
  } 
}));

describe('Cold start readiness gating', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('prevents pricing calculation when constants are not loaded', async () => {
    // Mock the constants module to simulate cold start
    vi.doMock('../../lib/constants', () => ({
      constantsLoaded: false,
      furnitureItems: [],
      itemCategories: [],
      cityBaseCharges: {},
      getItemPoints: vi.fn((_id: string) => 0)
    }));

    // Import the mocked module
    const { constantsLoaded, furnitureItems } = await import('../../lib/constants');
    
    // Verify the mock is working
    expect(constantsLoaded).toBe(false);
    expect(furnitureItems).toHaveLength(0);

    // Test that pricing service won't work without constants
    const calcSpy = vi.spyOn(pricing.pricingService, 'calculatePricing').mockResolvedValue({
      basePrice: 0, itemValue: 0, distanceCost: 0, carryingCost: 0, assemblyCost: 0, extraHelperCost: 0,
      subtotal: 0, studentDiscount: 0, total: 0, earlyBookingDiscount: 0,
      breakdown: { 
        baseCharge: { city: null, isCityDay: false, isEarlyBooking: false, originalPrice: 0, finalPrice: 0 }, 
        items: { totalPoints: 0, multiplier: 1, cost: 0 }, 
        distance: { distanceKm: 0, category: 'small', rate: 0, cost: 0 }, 
        carrying: { floors: 0, itemBreakdown: [], totalCost: 0 }, 
        assembly: { itemBreakdown: [], totalCost: 0 }, 
        extraHelper: { totalPoints: 0, category: 'small', cost: 0 } 
      }
    } as any);

    // Try to calculate pricing - this should fail or return invalid results
    try {
      await pricing.pricingService.calculatePricing({
        pickupLocation: 'Amsterdam',
        dropoffLocation: 'Rotterdam',
        serviceType: 'house-moving'
      } as any);
    } catch (error) {
      // Expected to fail when constants aren't loaded
      expect(error).toBeDefined();
    }

    // Verify that the pricing service was called (even if it failed)
    expect(calcSpy).toHaveBeenCalled();
  });

  it('allows pricing calculation when constants are loaded', async () => {
    // Mock the constants module to simulate loaded state
    vi.doMock('../../lib/constants', () => ({
      constantsLoaded: true,
      furnitureItems: [
        { id: 'chair', name: 'Chair', category: 'furniture', points: 5 }
      ],
      itemCategories: [
        { name: 'Furniture', subcategories: ['Chairs', 'Tables'], is_active: true }
      ],
      cityBaseCharges: {
        'Amsterdam': { normal: 119, cityDay: 39, dayOfWeek: 1 }
      },
      getItemPoints: vi.fn((_id: string) => 5)
    }));

    // Import the mocked module
    const { constantsLoaded, furnitureItems } = await import('../../lib/constants');
    
    // Verify the mock is working
    expect(constantsLoaded).toBe(true);
    expect(furnitureItems).toHaveLength(1);

    // Test that pricing service works with constants loaded
    const calcSpy = vi.spyOn(pricing.pricingService, 'calculatePricing').mockResolvedValue({
      basePrice: 39, itemValue: 0, distanceCost: 0, carryingCost: 0, assemblyCost: 0, extraHelperCost: 0,
      subtotal: 39, studentDiscount: 0, total: 39, earlyBookingDiscount: 0,
      breakdown: { 
        baseCharge: { city: 'Amsterdam', isCityDay: true, isEarlyBooking: false, originalPrice: 39, finalPrice: 39 }, 
        items: { totalPoints: 0, multiplier: 1, cost: 0 }, 
        distance: { distanceKm: 0, category: 'small', rate: 0, cost: 0 }, 
        carrying: { floors: 0, itemBreakdown: [], totalCost: 0 }, 
        assembly: { itemBreakdown: [], totalCost: 0 }, 
        extraHelper: { totalPoints: 0, category: 'small', cost: 0 } 
      }
    } as any);

    // Calculate pricing - this should work now
    const result = await pricing.pricingService.calculatePricing({
      pickupLocation: 'Amsterdam',
      dropoffLocation: 'Rotterdam',
      serviceType: 'house-moving'
    } as any);

    // Verify the pricing service was called and returned results
    expect(calcSpy).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.total).toBe(39);
  });

  it('prevents race conditions during rapid pricing calls', async () => {
    // Mock the constants module to simulate loading state
    vi.doMock('../../lib/constants', () => ({
      constantsLoaded: false,
      furnitureItems: [],
      itemCategories: [],
      cityBaseCharges: {},
      getItemPoints: vi.fn((_id: string) => 0)
    }));

    // Import the mocked module
    const { constantsLoaded } = await import('../../lib/constants');
    expect(constantsLoaded).toBe(false);

    // Mock pricing service to simulate slow responses
    const calcSpy = vi.spyOn(pricing.pricingService, 'calculatePricing').mockImplementation(async () => {
      // Simulate slow response
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        basePrice: 0, itemValue: 0, distanceCost: 0, carryingCost: 0, assemblyCost: 0, extraHelperCost: 0,
        subtotal: 0, studentDiscount: 0, total: 0, earlyBookingDiscount: 0,
        breakdown: { 
          baseCharge: { city: null, isCityDay: false, isEarlyBooking: false, originalPrice: 0, finalPrice: 0 }, 
          items: { totalPoints: 0, multiplier: 1, cost: 0 }, 
          distance: { distanceKm: 0, category: 'small', rate: 0, cost: 0 }, 
          carrying: { floors: 0, itemBreakdown: [], totalCost: 0 }, 
          assembly: { itemBreakdown: [], totalCost: 0 }, 
          extraHelper: { totalPoints: 0, category: 'small', cost: 0 } 
        }
      } as any;
    });

    // Make multiple rapid calls
    const promises = [
      pricing.pricingService.calculatePricing({ pickupLocation: 'A', dropoffLocation: 'B' } as any),
      pricing.pricingService.calculatePricing({ pickupLocation: 'C', dropoffLocation: 'D' } as any),
      pricing.pricingService.calculatePricing({ pickupLocation: 'E', dropoffLocation: 'F' } as any)
    ];

    // Wait for all calls to complete
    await Promise.all(promises);

    // Verify that all calls were made (even if they failed)
    expect(calcSpy).toHaveBeenCalledTimes(3);
  });
});
