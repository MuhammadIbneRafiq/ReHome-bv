import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { PricingService } from '../pricingService';
import { getItemPoints } from '../../lib/constants';

// Mock the getItemPoints function to return known values for testing
vi.mock('../../lib/constants', () => ({
  getItemPoints: vi.fn(),
  constantsLoaded: true,
  furnitureItems: [],
  pricingConfig: {
    baseMultipliers: {
      houseMovingItemMultiplier: 2.0,
      itemTransportMultiplier: 1.0,
      addonMultiplier: 3.0
    },
    carryingMultipliers: {
      lowValue: { threshold: 6, multiplier: 1.35 },
      highValue: { multiplier: 1.35 }
    },
    extraHelperPricing: {
      smallMove: { threshold: 30, price: 30 },
      bigMove: { price: 60 }
    },
    studentDiscount: 0.0885,
    earlyBookingDiscount: 0.1,
    minimumCharge: 75.0
  },
  cityBaseCharges: {}
}));

describe('Carrying Cost Calculation', () => {
  let pricingService: PricingService;
  const mockGetItemPoints = getItemPoints as MockedFunction<typeof getItemPoints>;

  beforeEach(() => {
    pricingService = new PricingService();
    vi.clearAllMocks();
  });

  // Helper function to create a minimal pricing input for carrying cost testing
  const createCarryingTestInput = (overrides: any = {}) => ({
    serviceType: 'item-transport' as const,
    pickupLocation: 'Test Pickup',
    dropoffLocation: 'Test Dropoff',
    distanceKm: 0,
    selectedDate: '2024-01-01',
    isDateFlexible: false,
    itemQuantities: {},
    floorPickup: 0,
    floorDropoff: 0,
    elevatorPickup: false,
    elevatorDropoff: false,
    assemblyItems: {},
    disassemblyItems: {},
    extraHelperItems: {},
    carryingServiceItems: {},
    carryingUpItems: {},
    carryingDownItems: {},
    isStudent: false,
    hasStudentId: false,
    pickupPlace: null,
    dropoffPlace: null,
    ...overrides
  });

  describe('Debug Floor Mapping', () => {
    it('should debug floor mapping issue', async () => {
      const input = createCarryingTestInput({
        itemQuantities: { 'test-item': 1 },
        floorPickup: 1,
        floorDropoff: 0,
        carryingUpItems: { 'test-item': true },
        carryingDownItems: {}
      });

      mockGetItemPoints.mockReturnValue(5);

      const result = await pricingService.calculatePricing(input);

      console.log('DEBUG RESULT:', {
        carryingCost: result.carryingCost,
        floors: result.breakdown.carrying.floors,
        itemBreakdown: result.breakdown.carrying.itemBreakdown,
        totalCost: result.breakdown.carrying.totalCost
      });

      // This should work but it's not
      expect(result.carryingCost).toBe(31.75);
    });
  });

  describe('Base Fee + Dynamic Growth Model', () => {
    it('should apply €25 base fee when carrying is required', async () => {
      // Setup: 1 item, 1 floor, no elevator
      const input = createCarryingTestInput({
        itemQuantities: { 'test-item': 1 },
        floorPickup: 1,  // Upstairs carrying
        floorDropoff: 0, // No downstairs
        carryingUpItems: { 'test-item': true },
        carryingDownItems: {}
      });

      mockGetItemPoints.mockReturnValue(5); // 5 points

      const result = await pricingService.calculatePricing(input);

      // Expected: 5 points × 1.35 × 1 floor = 6.75 + 25 base fee = 31.75
      expect(result.carryingCost).toBe(31.75);
      expect(result.breakdown.carrying.totalCost).toBe(31.75);
      expect(result.breakdown.carrying.floors).toBe(1);
    });

    it('should not apply base fee when no carrying is required', async () => {
      const input = createCarryingTestInput({
        itemQuantities: { 'test-item': 1 },
        floorPickup: 0, // No floors
        carryingUpItems: { 'test-item': true }
      });

      mockGetItemPoints.mockReturnValue(5);

      const result = await pricingService.calculatePricing(input);

      expect(result.carryingCost).toBe(0);
      expect(result.breakdown.carrying.totalCost).toBe(0);
      expect(result.breakdown.carrying.floors).toBe(0);
    });
  });

  describe('Standard 1.35 Multiplier', () => {
    it('should apply 1.35 multiplier to all items regardless of point level', async () => {
      const input = createCarryingTestInput({
        itemQuantities: { 
          'low-point-item': 1,
          'high-point-item': 1 
        },
        floorPickup: 2,
        carryingUpItems: { 
          'low-point-item': true,
          'high-point-item': true 
        }
      });

      mockGetItemPoints
        .mockReturnValueOnce(2)  // low-point-item: 2 points
        .mockReturnValueOnce(10); // high-point-item: 10 points

      const result = await pricingService.calculatePricing(input);

      // Expected: (2 × 1.35 × 2) + (10 × 1.35 × 2) = 5.4 + 27 = 32.4 + 25 base fee = 57.4
      expect(result.carryingCost).toBe(57.4);
    });
  });

  describe('Complex Examples from Specification', () => {
    it('should calculate example 1: Multiple items with 4 floors', async () => {
      const input = createCarryingTestInput({
        itemQuantities: {
          'drawers': 2,        // 5 points each
          'wardrobe': 1,      // 8 points
          'single-bed': 2,    // 2 points each
          'double-bed': 1,    // 8 points
          'bag': 35,          // 0.3 points each
          'table': 2,         // 6 points each
          'washing-machine': 1, // 12 points
          'bed-sofa': 1,      // 10 points
          'mattress': 1,      // 6 points
          'chair': 7          // 2 points each
        },
        floorPickup: 4,
        carryingUpItems: {
          'drawers': true,
          'wardrobe': true,
          'single-bed': true,
          'double-bed': true,
          'bag': true,
          'table': true,
          'washing-machine': true,
          'bed-sofa': true,
          'mattress': true,
          'chair': true
        }
      });

      mockGetItemPoints
        .mockReturnValueOnce(5)   // drawers
        .mockReturnValueOnce(8)  // wardrobe
        .mockReturnValueOnce(2)  // single-bed
        .mockReturnValueOnce(8)  // double-bed
        .mockReturnValueOnce(0.3) // bag
        .mockReturnValueOnce(6)  // table
        .mockReturnValueOnce(12) // washing-machine
        .mockReturnValueOnce(10) // bed-sofa
        .mockReturnValueOnce(6)  // mattress
        .mockReturnValueOnce(2); // chair

      const result = await pricingService.calculatePricing(input);

      // Expected calculations:
      // 2 Drawers: 2 × 5 × 1.35 × 4 = 54
      // 1 Wardrobe: 1 × 8 × 1.35 × 4 = 43.2
      // 2 Single Beds: 2 × 2 × 1.35 × 4 = 21.6
      // 1 Double Bed: 1 × 8 × 1.35 × 4 = 43.2
      // 35 Bags: 35 × 0.3 × 1.35 × 4 = 56.7
      // 2 Tables: 2 × 6 × 1.35 × 4 = 64.8
      // 1 Washing Machine: 1 × 12 × 1.35 × 4 = 64.8
      // 1 Bed Sofa: 1 × 10 × 1.35 × 4 = 54
      // 1 Mattress: 1 × 6 × 1.35 × 4 = 32.4
      // 7 Chairs: 7 × 2 × 1.35 × 4 = 75.6
      // Total: 54 + 43.2 + 21.6 + 43.2 + 56.7 + 64.8 + 64.8 + 54 + 32.4 + 75.6 = 509.7
      // Plus base fee: 509.7 + 25 = 534.7
      expect(result.carryingCost).toBeCloseTo(534.7, 1);
    });

    it('should calculate example 2: Down 1 and up 1 floors', async () => {
      const input = createCarryingTestInput({
        itemQuantities: {
          'double-bed': 1,    // 8 points
          'desk': 1,          // 5 points
          'double-mattress': 1, // 6 points
          'sofa': 1,          // 12 points
          'boxes': 10         // 0.5 points each
        },
        floorPickup: 1,  // Upstairs
        floorDropoff: 1, // Downstairs
        carryingUpItems: {
          'double-bed': true,
          'desk': true,
          'double-mattress': true,
          'sofa': true,
          'boxes': true
        },
        carryingDownItems: {
          'double-bed': true,
          'desk': true,
          'double-mattress': true,
          'sofa': true,
          'boxes': true
        }
      });

      mockGetItemPoints
        .mockReturnValueOnce(8)  // double-bed
        .mockReturnValueOnce(5)  // desk
        .mockReturnValueOnce(6)  // double-mattress
        .mockReturnValueOnce(12) // sofa
        .mockReturnValueOnce(0.5); // boxes

      const result = await pricingService.calculatePricing(input);

      // Expected calculations:
      // Upstairs (floorPickup = 1):
      // Double Bed: 1 × 8 × 1.35 × 1 = 10.8
      // Desk: 1 × 5 × 1.35 × 1 = 6.75
      // Double Mattress: 1 × 6 × 1.35 × 1 = 8.1
      // Sofa: 1 × 12 × 1.35 × 1 = 16.2
      // 10 Boxes: 10 × 0.5 × 1.35 × 1 = 6.75
      // Upstairs total: 48.6
      
      // Downstairs (floorDropoff = 1):
      // Same items going down: 48.6
      // Total: 48.6 + 48.6 = 97.2
      // Plus base fee: 97.2 + 25 = 122.2
      expect(result.carryingCost).toBeCloseTo(122.2, 1);
    });

    it('should calculate example 3: 2 floors with specific items', async () => {
      const input = createCarryingTestInput({
        itemQuantities: {
          'closet': 1,        // 8 points
          'l-sofa': 1,       // 12 points
          'double-bed': 1,    // 8 points
          'double-mattress': 1, // 6 points
          'desk': 1          // 5 points
        },
        floorPickup: 2,
        carryingUpItems: {
          'closet': true,
          'l-sofa': true,
          'double-bed': true,
          'double-mattress': true,
          'desk': true
        }
      });

      mockGetItemPoints
        .mockReturnValueOnce(8)  // closet
        .mockReturnValueOnce(12) // l-sofa
        .mockReturnValueOnce(8)  // double-bed
        .mockReturnValueOnce(6)  // double-mattress
        .mockReturnValueOnce(5); // desk

      const result = await pricingService.calculatePricing(input);

      // Expected calculations:
      // Closet: 1 × 8 × 1.35 × 2 = 21.6
      // L Sofa: 1 × 12 × 1.35 × 2 = 32.4
      // Double Bed: 1 × 8 × 1.35 × 2 = 21.6
      // Double Mattress: 1 × 6 × 1.35 × 2 = 16.2
      // Desk: 1 × 5 × 1.35 × 2 = 13.5
      // Total: 21.6 + 32.4 + 21.6 + 16.2 + 13.5 = 105.3
      // Plus base fee: 105.3 + 25 = 130.3
      expect(result.carryingCost).toBeCloseTo(130.3, 1);
    });

    it('should calculate example 4: Small items with boxes and luggage', async () => {
      const input = createCarryingTestInput({
        itemQuantities: {
          'boxes': 10,        // 0.5 points each
          'luggage': 3,      // 0.5 points each
          'bags': 5,         // 0.3 points each
          'desk': 1,         // 6 points
          'office-chair': 1,  // 3 points
          'cloth-rack': 1,   // 3 points
          'small-appliance': 1 // 3 points
        },
        floorPickup: 1,
        carryingUpItems: {
          'boxes': true,
          'luggage': true,
          'bags': true,
          'desk': true,
          'office-chair': true,
          'cloth-rack': true,
          'small-appliance': true
        }
      });

      mockGetItemPoints
        .mockReturnValueOnce(0.5) // boxes
        .mockReturnValueOnce(0.5) // luggage
        .mockReturnValueOnce(0.3) // bags
        .mockReturnValueOnce(6)   // desk
        .mockReturnValueOnce(3)   // office-chair
        .mockReturnValueOnce(3)   // cloth-rack
        .mockReturnValueOnce(3);  // small-appliance

      const result = await pricingService.calculatePricing(input);

      // Expected calculations:
      // 10 Boxes: 10 × 0.5 × 1.35 × 1 = 6.75
      // 3 Luggage: 3 × 0.5 × 1.35 × 1 = 2.025
      // 5 Bags: 5 × 0.3 × 1.35 × 1 = 2.025
      // 1 Desk: 1 × 6 × 1.35 × 1 = 8.1
      // 1 Office Chair: 1 × 3 × 1.35 × 1 = 4.05
      // 1 Cloth Rack: 1 × 3 × 1.35 × 1 = 4.05
      // 1 Small Appliance: 1 × 3 × 1.35 × 1 = 4.05
      // Total: 6.75 + 2.025 + 2.025 + 8.1 + 4.05 + 4.05 + 4.05 = 31.05
      // Plus base fee: 31.05 + 25 = 56.05
      expect(result.carryingCost).toBeCloseTo(56.05, 1);
    });
  });

  describe('Elevator Logic', () => {
    it('should count as 1 floor when elevator is available', async () => {
      const input = createCarryingTestInput({
        itemQuantities: { 'test-item': 1 },
        floorPickup: 3,
        elevatorPickup: true, // Elevator available
        carryingUpItems: { 'test-item': true }
      });

      mockGetItemPoints.mockReturnValue(5);

      const result = await pricingService.calculatePricing(input);

      // Expected: 5 points × 1.35 × 1 floor (elevator) = 6.75 + 25 base fee = 31.75
      expect(result.carryingCost).toBe(31.75);
      expect(result.breakdown.carrying.floors).toBe(1);
    });

    it('should count actual floors when no elevator', async () => {
      const input = createCarryingTestInput({
        itemQuantities: { 'test-item': 1 },
        floorPickup: 3,
        elevatorPickup: false, // No elevator
        carryingUpItems: { 'test-item': true }
      });

      mockGetItemPoints.mockReturnValue(5);

      const result = await pricingService.calculatePricing(input);

      // Expected: 5 points × 1.35 × 3 floors = 20.25 + 25 base fee = 45.25
      expect(result.carryingCost).toBe(45.25);
      expect(result.breakdown.carrying.floors).toBe(3);
    });

    it('should handle elevator for both pickup and dropoff', async () => {
      const input = createCarryingTestInput({
        itemQuantities: { 'test-item': 1 },
        floorPickup: 2,
        floorDropoff: 3,
        elevatorPickup: true,   // 1 floor
        elevatorDropoff: false, // 3 floors
        carryingUpItems: { 'test-item': true },
        carryingDownItems: { 'test-item': true }
      });

      mockGetItemPoints.mockReturnValue(5);

      const result = await pricingService.calculatePricing(input);

      // Expected: 
      // Upstairs: 5 × 1.35 × 1 = 6.75
      // Downstairs: 5 × 1.35 × 3 = 20.25
      // Total: 6.75 + 20.25 = 27 + 25 base fee = 52
      expect(result.carryingCost).toBe(52);
      expect(result.breakdown.carrying.floors).toBe(4); // 1 + 3
    });
  });

  describe('Directional Carrying (Upstairs/Downstairs)', () => {
    it('should handle upstairs carrying only', async () => {
      const input = createCarryingTestInput({
        itemQuantities: { 'test-item': 1 },
        floorPickup: 2,
        floorDropoff: 0,
        carryingUpItems: { 'test-item': true },
        carryingDownItems: {}
      });

      mockGetItemPoints.mockReturnValue(5);

      const result = await pricingService.calculatePricing(input);

      // Expected: 5 × 1.35 × 2 = 13.5 + 25 base fee = 38.5
      expect(result.carryingCost).toBe(38.5);
    });

    it('should handle downstairs carrying only', async () => {
      const input = createCarryingTestInput({
        itemQuantities: { 'test-item': 1 },
        floorPickup: 0,
        floorDropoff: 2,
        carryingUpItems: {},
        carryingDownItems: { 'test-item': true }
      });

      mockGetItemPoints.mockReturnValue(5);

      const result = await pricingService.calculatePricing(input);

      // Expected: 5 × 1.35 × 2 = 13.5 + 25 base fee = 38.5
      expect(result.carryingCost).toBe(38.5);
    });

    it('should handle both directions with different items', async () => {
      const input = createCarryingTestInput({
        itemQuantities: { 
          'up-item': 1,
          'down-item': 1 
        },
        floorPickup: 2,
        floorDropoff: 1,
        carryingUpItems: { 'up-item': true },
        carryingDownItems: { 'down-item': true }
      });

      mockGetItemPoints
        .mockReturnValueOnce(5)  // up-item
        .mockReturnValueOnce(3); // down-item

      const result = await pricingService.calculatePricing(input);

      // Expected: 
      // Upstairs: 5 × 1.35 × 2 = 13.5
      // Downstairs: 3 × 1.35 × 1 = 4.05
      // Total: 13.5 + 4.05 = 17.55 + 25 base fee = 42.55
      expect(result.carryingCost).toBeCloseTo(42.55, 2);
    });
  });

  describe('Fallback to Combined Items', () => {
    it('should use combined items when directional items are empty', async () => {
      const input = createCarryingTestInput({
        itemQuantities: { 'test-item': 1 },
        floorPickup: 2,
        carryingUpItems: {},
        carryingDownItems: {},
        carryingServiceItems: { 'test-item': true } // Fallback
      });

      mockGetItemPoints.mockReturnValue(5);

      const result = await pricingService.calculatePricing(input);

      // Expected: 5 × 1.35 × 2 = 13.5 + 25 base fee = 38.5
      expect(result.carryingCost).toBe(38.5);
    });

    it('should prefer directional items over combined items', async () => {
      const input = createCarryingTestInput({
        itemQuantities: { 'test-item': 1 },
        floorPickup: 2,
        carryingUpItems: { 'test-item': true }, // This should be used
        carryingDownItems: {},
        carryingServiceItems: { 'test-item': false } // This should be ignored
      });

      mockGetItemPoints.mockReturnValue(5);

      const result = await pricingService.calculatePricing(input);

      // Expected: 5 × 1.35 × 2 = 13.5 + 25 base fee = 38.5
      expect(result.carryingCost).toBe(38.5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero quantity items', async () => {
      const input = createCarryingTestInput({
        itemQuantities: { 'test-item': 0 },
        floorPickup: 2,
        carryingUpItems: { 'test-item': true }
      });

      mockGetItemPoints.mockReturnValue(5);

      const result = await pricingService.calculatePricing(input);

      expect(result.carryingCost).toBe(0);
    });

    it('should handle ground floor (floor = 0)', async () => {
      const input = createCarryingTestInput({
        itemQuantities: { 'test-item': 1 },
        floorPickup: 0,
        carryingUpItems: { 'test-item': true }
      });

      mockGetItemPoints.mockReturnValue(5);

      const result = await pricingService.calculatePricing(input);

      expect(result.carryingCost).toBe(0);
    });

    it('should handle negative floor values', async () => {
      const input = createCarryingTestInput({
        itemQuantities: { 'test-item': 1 },
        floorPickup: -1,
        carryingUpItems: { 'test-item': true }
      });

      mockGetItemPoints.mockReturnValue(5);

      const result = await pricingService.calculatePricing(input);

      expect(result.carryingCost).toBe(0);
    });

    it('should handle multiple quantities of same item', async () => {
      const input = createCarryingTestInput({
        itemQuantities: { 'test-item': 3 },
        floorPickup: 2,
        carryingUpItems: { 'test-item': true }
      });

      mockGetItemPoints.mockReturnValue(5);

      const result = await pricingService.calculatePricing(input);

      // Expected: 3 × 5 × 1.35 × 2 = 40.5 + 25 base fee = 65.5
      expect(result.carryingCost).toBe(65.5);
    });
  });

  describe('Breakdown Verification', () => {
    it('should provide detailed breakdown in result', async () => {
      const input = createCarryingTestInput({
        itemQuantities: { 'test-item': 1 },
        floorPickup: 2,
        carryingUpItems: { 'test-item': true }
      });

      mockGetItemPoints.mockReturnValue(5);

      const result = await pricingService.calculatePricing(input);

      expect(result.breakdown.carrying).toEqual({
        floors: 2,
        itemBreakdown: [
          {
            itemId: 'test-item',
            points: 5,
            multiplier: 2.7, // 1.35 × 2
            cost: 13.5
          }
        ],
        totalCost: 38.5
      });
    });

    it('should handle multiple items in breakdown', async () => {
      const input = createCarryingTestInput({
        itemQuantities: { 
          'item1': 1,
          'item2': 2 
        },
        floorPickup: 1,
        carryingUpItems: { 
          'item1': true,
          'item2': true 
        }
      });

      mockGetItemPoints
        .mockReturnValueOnce(3)  // item1
        .mockReturnValueOnce(4); // item2

      const result = await pricingService.calculatePricing(input);

      expect(result.breakdown.carrying.itemBreakdown[0]).toEqual({
        itemId: 'item1',
        points: 3,
        multiplier: 1.35,
        cost: 4.05
      });
      expect(result.breakdown.carrying.itemBreakdown[1]).toEqual({
        itemId: 'item2',
        points: 8, // 2 × 4
        multiplier: 1.35,
        cost: 10.8
      });
    });
  });
});
