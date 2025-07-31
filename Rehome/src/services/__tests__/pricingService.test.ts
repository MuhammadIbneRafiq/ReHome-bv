import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { PricingService, PricingInput, PricingBreakdown } from '../pricingService';
import { initDynamicConstants } from '../../lib/constants';

// Initialize dynamic constants before running tests
beforeAll(async () => {
  await initDynamicConstants();
});

describe('PricingService - calculateBaseChargeBreakdown', () => {
  let pricingService: PricingService;
  let mockBreakdown: PricingBreakdown;

  beforeEach(() => {
    pricingService = new PricingService();
    mockBreakdown = {
      basePrice: 0,
      itemValue: 0,
      distanceCost: 0,
      carryingCost: 0,
      assemblyCost: 0,
      extraHelperCost: 0,
      subtotal: 0,
      studentDiscount: 0,
      total: 0,
      earlyBookingDiscount: 0,
      breakdown: {
        baseCharge: {
          city: null,
          isCityDay: false,
          isEarlyBooking: false,
          originalPrice: 0,
          finalPrice: 0,
          type: ''
        },
        items: {
          totalPoints: 0,
          multiplier: 1,
          cost: 0
        },
        distance: {
          distanceKm: 0,
          category: 'small',
          rate: 0,
          cost: 0
        },
        carrying: {
          floors: 0,
          itemBreakdown: [],
          totalCost: 0
        },
        assembly: {
          itemBreakdown: [],
          totalCost: 0
        },
        extraHelper: {
          totalPoints: 0,
          category: 'small',
          cost: 0
        }
      }
    };

    vi.clearAllMocks();
  });

  // Helper function to create base pricing input
  const createBaseInput = (overrides: Partial<PricingInput> = {}): PricingInput => ({
    serviceType: 'house-moving',
    pickupLocation: 'Amsterdam',
    dropoffLocation: 'Amsterdam',
    selectedDate: '2024-01-15',
    isDateFlexible: false,
    itemQuantities: {},
    floorPickup: 0,
    floorDropoff: 0,
    elevatorPickup: false,
    elevatorDropoff: false,
    assemblyItems: {},
    extraHelperItems: {},
    isStudent: false,
    hasStudentId: false,
    pickupPlace: { placeId: 'test', text: 'Amsterdam' },
    dropoffPlace: { placeId: 'test', text: 'Amsterdam' },
    ...overrides
  });

  describe('Fixed Date - House Moving', () => {
    describe('Within City', () => {
      it('should calculate base charge for Amsterdam within city move', async () => {
        const input = createBaseInput({
          serviceType: 'house-moving',
          pickupLocation: 'Amsterdam',
          dropoffLocation: 'Amsterdam',
          pickupPlace: { placeId: 'test', text: 'Amsterdam' },
          dropoffPlace: { placeId: 'test', text: 'Amsterdam' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(39);
        expect(mockBreakdown.breakdown.baseCharge.city).toBe('Amsterdam');
        expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(true);
        expect(mockBreakdown.breakdown.baseCharge.type).toBe('Amsterdam - Cheap Rate');
      });

      it('should calculate base charge for Rotterdam within city move', async () => {
        const input = createBaseInput({
          serviceType: 'house-moving',
          pickupLocation: 'Rotterdam',
          dropoffLocation: 'Rotterdam',
          pickupPlace: { placeId: 'test', text: 'Rotterdam' },
          dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(35);
        expect(mockBreakdown.breakdown.baseCharge.city).toBe('Rotterdam');
        expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(true);
        expect(mockBreakdown.breakdown.baseCharge.type).toBe('Rotterdam - Cheap Rate');
      });
    });

    describe('Between Cities', () => {
      it('should calculate base charge for Amsterdam to Rotterdam intercity move', async () => {
        const input = createBaseInput({
          serviceType: 'house-moving',
          pickupLocation: 'Amsterdam',
          dropoffLocation: 'Rotterdam',
          pickupPlace: { placeId: 'test', text: 'Amsterdam' },
          dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(79);
        expect(mockBreakdown.breakdown.baseCharge.city).toBe('Amsterdam');
        expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(false);
        expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
      });

      it('should calculate base charge for The Hague to Utrecht intercity move', async () => {
        const input = createBaseInput({
          serviceType: 'house-moving',
          pickupLocation: 'The Hague',
          dropoffLocation: 'Utrecht',
          pickupPlace: { placeId: 'test', text: 'The Hague' },
          dropoffPlace: { placeId: 'test', text: 'Utrecht' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(77);
        expect(mockBreakdown.breakdown.baseCharge.city).toBe('The Hague');
        expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(false);
        expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
      });
    });
  });

  describe('Fixed Date - Item Transport', () => {
    describe('Within City - Same Date', () => {
      it('should calculate base charge for Amsterdam item transport', async () => {
        const input = createBaseInput({
          serviceType: 'item-transport',
          pickupLocation: 'Amsterdam',
          dropoffLocation: 'Amsterdam',
          pickupPlace: { placeId: 'test', text: 'Amsterdam' },
          dropoffPlace: { placeId: 'test', text: 'Amsterdam' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(39);
        expect(mockBreakdown.breakdown.baseCharge.city).toBe('Amsterdam');
        expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(true);
        expect(mockBreakdown.breakdown.baseCharge.type).toBe('Amsterdam - Cheap Rate');
      });
    });

    describe('Within City - Different Dates', () => {
      it('should calculate base charge for Amsterdam item transport with different dates', async () => {
        const input = createBaseInput({
          serviceType: 'item-transport',
          pickupLocation: 'Amsterdam',
          dropoffLocation: 'Amsterdam',
          pickupDate: '2024-01-15',
          dropoffDate: '2024-01-20',
          pickupPlace: { placeId: 'test', text: 'Amsterdam' },
          dropoffPlace: { placeId: 'test', text: 'Amsterdam' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(39);
        expect(mockBreakdown.breakdown.baseCharge.city).toBe('Amsterdam');
        expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(true);
        expect(mockBreakdown.breakdown.baseCharge.type).toBe('Amsterdam - Cheap Rate');
      });
    });

    describe('Between Cities - Same Date', () => {
      it('should calculate base charge for Amsterdam to Rotterdam item transport', async () => {
        const input = createBaseInput({
          serviceType: 'item-transport',
          pickupLocation: 'Amsterdam',
          dropoffLocation: 'Rotterdam',
          pickupPlace: { placeId: 'test', text: 'Amsterdam' },
          dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(79);
        expect(mockBreakdown.breakdown.baseCharge.city).toBe('Amsterdam');
        expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(false);
        expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
      });
    });

    describe('Between Cities - Different Dates', () => {
      it('should calculate base charge for Amsterdam to Rotterdam item transport with different dates', async () => {
        const input = createBaseInput({
          serviceType: 'item-transport',
          pickupLocation: 'Amsterdam',
          dropoffLocation: 'Rotterdam',
          pickupDate: '2024-01-15',
          dropoffDate: '2024-01-20',
          pickupPlace: { placeId: 'test', text: 'Amsterdam' },
          dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(37);
        expect(mockBreakdown.breakdown.baseCharge.city).toBe('Amsterdam');
        expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(false);
        expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
      }, 10000); // 10 second timeout
    });
  });

  describe('Flexible Date Range', () => {
    describe('Above one week', () => {
      it('should calculate base charge for flexible date range above one week', async () => {
        const input = createBaseInput({
          isDateFlexible: false,
          selectedDateRange: { start: '2024-01-15', end: '2024-01-25' }, // 11 days
          pickupPlace: { placeId: 'test', text: 'Amsterdam' },
          dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(39);
        expect(mockBreakdown.breakdown.baseCharge.city).toBe('Amsterdam');
        expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(true);
        expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
      });
    });

    describe('Below one week', () => {
      it('should calculate base charge for flexible date range below one week', async () => {
        const input = createBaseInput({
          isDateFlexible: false,
          selectedDateRange: { start: '2024-01-15', end: '2024-01-20' }, // 6 days
          pickupPlace: { placeId: 'test', text: 'Amsterdam' },
          dropoffPlace: { placeId: 'test', text: 'Amsterdam' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(39);
        expect(mockBreakdown.breakdown.baseCharge.city).toBe('Amsterdam');
        expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(true);
        expect(mockBreakdown.breakdown.baseCharge.type).toBe('Amsterdam - Cheap Rate');
      }, 10000); // 10 second timeout
    });
  });

  describe('ReHome Suggest Mode', () => {
    it('should calculate base charge for ReHome suggest mode', async () => {
      const input = createBaseInput({
        isDateFlexible: true,
        pickupPlace: { placeId: 'test', text: 'Amsterdam' },
        dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(39);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('Amsterdam');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(true);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('ReHome- Cheap Rate');
    });
  });

  describe('Edge cases with different cities', () => {
    it('should handle The Hague to Utrecht intercity move', async () => {
      const input = createBaseInput({
        serviceType: 'house-moving',
        pickupLocation: 'The Hague',
        dropoffLocation: 'Utrecht',
        pickupPlace: { placeId: 'test', text: 'The Hague' },
        dropoffPlace: { placeId: 'test', text: 'Utrecht' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(77);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('The Hague');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(false);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
    });

    it('should handle Eindhoven to Groningen intercity move', async () => {
      const input = createBaseInput({
        serviceType: 'house-moving',
        pickupLocation: 'Eindhoven',
        dropoffLocation: 'Groningen',
        pickupPlace: { placeId: 'test', text: 'Eindhoven' },
        dropoffPlace: { placeId: 'test', text: 'Groningen' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(126.5);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('Eindhoven');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(false);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
    });

    it('should handle Tilburg to Almere intercity item transport with different dates', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Tilburg',
        dropoffLocation: 'Almere',
        pickupDate: '2024-01-15',
        dropoffDate: '2024-01-20',
        pickupPlace: { placeId: 'test', text: 'Tilburg' },
        dropoffPlace: { placeId: 'test', text: 'Almere' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(36.5);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('Tilburg');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(false);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
    }, 10000); // 10 second timeout

    it('should handle Breda to Nijmegen flexible date range above one week', async () => {
      const input = createBaseInput({
        isDateFlexible: false,
        selectedDateRange: { start: '2024-01-15', end: '2024-01-30' }, // 16 days
        pickupPlace: { placeId: 'test', text: 'Breda' },
        dropoffPlace: { placeId: 'test', text: 'Nijmegen' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(35);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('Breda');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(true);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('Breda - Cheap Rate');
    });
  });
}); 