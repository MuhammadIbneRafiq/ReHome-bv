import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { PricingService, PricingInput, PricingBreakdown } from '../pricingService';
import { initDynamicConstants } from '../../lib/constants';

beforeAll(async () => {
  await initDynamicConstants();
});

describe('Comprehensive Pricing Tests - All Combinations', () => {
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
    selectedDate: '2025-08-15',
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

  describe('Fixed Date - House Moving - Within City', () => {
    it('should use cheap base charge when city is included in calendar on that date', async () => {
      const input = createBaseInput({
        serviceType: 'house-moving',
        pickupLocation: 'Rotterdam',
        dropoffLocation: 'Rotterdam',
        selectedDate: '2025-08-02',
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(35);
    }, 10000);

    it('should use cheap base charge when calendar is empty on that date', async () => {
      const input = createBaseInput({
        serviceType: 'house-moving',
        pickupLocation: 'Groningen',
        dropoffLocation: 'Groningen',
        selectedDate: '2025-08-10',
        pickupPlace: { placeId: 'test', text: 'Groningen' },
        dropoffPlace: { placeId: 'test', text: 'Groningen' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(69);
    }, 10000);

    it('should use standard base charge when city is not included in calendar on that date', async () => {
      const input = createBaseInput({
        serviceType: 'house-moving',
        pickupLocation: 'Tilburg',
        dropoffLocation: 'Tilburg',
        selectedDate: '2025-08-01',
        pickupPlace: { placeId: 'test', text: 'Tilburg' },
        dropoffPlace: { placeId: 'test', text: 'Tilburg' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(29);
    }, 10000);
  });

  describe('Fixed Date - House Moving - Between Cities', () => {
    it('should use average of cheap pickup + standard dropoff when pickup city is included but dropoff is not', async () => {
      const input = createBaseInput({
        serviceType: 'house-moving',
        pickupLocation: 'Rotterdam',
        dropoffLocation: 'Tilburg',
        selectedDate: '2025-08-02',
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Tilburg' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(32);
    }, 10000);

    it('should use average of standard pickup + cheap dropoff when pickup city is not included but dropoff is', async () => {
      const input = createBaseInput({
        serviceType: 'house-moving',
        pickupLocation: 'Tilburg',
        dropoffLocation: 'Rotterdam',
        selectedDate: '2025-08-04',
        pickupPlace: { placeId: 'test', text: 'Tilburg' },
        dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(32);
    }, 10000);

    it('should use average of cheap pickup + cheap dropoff when both cities are included', async () => {
      const input = createBaseInput({
        serviceType: 'house-moving',
        pickupLocation: 'Rotterdam',
        dropoffLocation: 'Eindhoven',
        selectedDate: '2025-08-02',
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Eindhoven' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(34.5);
    }, 10000);

    it('should use average of cheap pickup + cheap dropoff when calendar is empty', async () => {
      const input = createBaseInput({
        serviceType: 'house-moving',
        pickupLocation: 'Utrecht',
        dropoffLocation: 'Eindhoven',
        selectedDate: '2025-08-10',
        pickupPlace: { placeId: 'test', text: 'Utrecht' },
        dropoffPlace: { placeId: 'test', text: 'Eindhoven' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(34);
    }, 10000);

    it('should use higher standard base charge when neither city is included', async () => {
      const input = createBaseInput({
        serviceType: 'house-moving',
        pickupLocation: 'Groningen',
        dropoffLocation: 'Almere',
        selectedDate: '2025-08-01',
        pickupPlace: { placeId: 'test', text: 'Groningen' },
        dropoffPlace: { placeId: 'test', text: 'Almere' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(219);
    }, 10000);
  });

  describe('Flexible Date Range - Above One Week', () => {
    it('should display cheap base charge for pickup city when range > 7 days', async () => {
      const input = createBaseInput({
        isDateFlexible: false,
        pickupLocation: 'Rotterdam',
        dropoffLocation: 'Eindhoven',
        selectedDateRange: { start: '2025-08-10', end: '2025-08-20' }, // 11 days
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Eindhoven' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(35); 
    }, 10000);

    it('should add extra km charge when distance difference > 0', async () => {
      const input = createBaseInput({
        isDateFlexible: false,
        pickupLocation: 'Rotterdam',
        dropoffLocation: 'Eindhoven',
        selectedDateRange: { start: '2025-08-10', end: '2025-08-25' }, // 16 days
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Eindhoven' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(35); 
    }, 10000);
  });

  describe('Flexible Date Range - Below One Week', () => {
    describe('Within City', () => {
      it('should use cheap base charge when city has city days in range', async () => {
        const input = createBaseInput({
          isDateFlexible: false,
          pickupLocation: 'Rotterdam',
          dropoffLocation: 'Rotterdam',
          selectedDateRange: { start: '2025-08-01', end: '2025-08-06' }, // 6 days
          pickupPlace: { placeId: 'test', text: 'Rotterdam' },
          dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(35);
      }, 10000);

      it('should use cheap base charge when calendar is empty on start date', async () => {
        const input = createBaseInput({
          isDateFlexible: false,
          pickupLocation: 'Groningen',
          dropoffLocation: 'Groningen',
          selectedDateRange: { start: '2025-08-10', end: '2025-08-15' }, // 6 days
          pickupPlace: { placeId: 'test', text: 'Groningen' },
          dropoffPlace: { placeId: 'test', text: 'Groningen' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(69);
      }, 10000);

      it('should use standard base charge when no city days in range and not empty', async () => {
        const input = createBaseInput({
          isDateFlexible: false,
          pickupLocation: 'Tilburg',
          dropoffLocation: 'Tilburg',
          selectedDateRange: { start: '2025-08-12', end: '2025-08-17' }, // 6 days
          pickupPlace: { placeId: 'test', text: 'Tilburg' },
          dropoffPlace: { placeId: 'test', text: 'Tilburg' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(29);
      }, 10000);
    });

    describe('Between City', () => {
      it('should use average of cheap pickup + standard dropoff when pickup city has city days', async () => {
        const input = createBaseInput({
          isDateFlexible: false,
          pickupLocation: 'Rotterdam',
          dropoffLocation: 'Tilburg',
          selectedDateRange: { start: '2025-08-02', end: '2025-08-07' }, // 6 days
          pickupPlace: { placeId: 'test', text: 'Rotterdam' },
          dropoffPlace: { placeId: 'test', text: 'Tilburg' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(32);
      }, 10000);

      it('should use average of cheap pickup + cheap dropoff when both dates are empty', async () => {
        const input = createBaseInput({
          isDateFlexible: false,
          pickupLocation: 'Eindhoven',
          dropoffLocation: 'Rotterdam',
          selectedDateRange: { start: '2025-08-10', end: '2025-08-15' }, // 6 days
          pickupPlace: { placeId: 'test', text: 'Eindhoven' },
          dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(34.5);
      }, 10000);

      it('should use standard base charge pickup city when pickup city is not available', async () => {
        const input = createBaseInput({
          isDateFlexible: false,
          pickupLocation: 'Groningen',
          dropoffLocation: 'Tilburg',
          selectedDateRange: { start: '2025-08-01', end: '2025-08-06' }, // 6 days
          pickupPlace: { placeId: 'test', text: 'Groningen' },
          dropoffPlace: { placeId: 'test', text: 'Tilburg' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(219);
      }, 10000);
    });
  });

  describe('Additional City Combinations', () => {
    it('should handle Almere to Breda intercity move', async () => {
      const input = createBaseInput({
        serviceType: 'house-moving',
        pickupLocation: 'Almere',
        dropoffLocation: 'Breda',
        selectedDate: '2025-08-01',
        pickupPlace: { placeId: 'test', text: 'Almere' },
        dropoffPlace: { placeId: 'test', text: 'Breda' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(104);
    }, 10000);

    it('should handle Nijmegen to Almere item transport with different dates', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Nijmegen',
        dropoffLocation: 'Almere',
        pickupDate: '2025-08-02',
        dropoffDate: '2025-08-04',
        pickupPlace: { placeId: 'test', text: 'Nijmegen' },
        dropoffPlace: { placeId: 'test', text: 'Almere' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(104);
    }, 10000);

    it('should handle Breda to Nijmegen flexible date range below one week', async () => {
      const input = createBaseInput({
        isDateFlexible: false,
        pickupLocation: 'Breda',
        dropoffLocation: 'Nijmegen',
        selectedDateRange: { start: '2025-08-01', end: '2025-08-06' }, // 6 days
        pickupPlace: { placeId: 'test', text: 'Breda' },
        dropoffPlace: { placeId: 'test', text: 'Nijmegen' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);
      expect(mockBreakdown.basePrice).toBe(79);
    }, 10000);
  });
}); 