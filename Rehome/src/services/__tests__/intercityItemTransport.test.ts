import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { PricingService, PricingInput, PricingBreakdown } from '../pricingService';
import { initDynamicConstants } from '../../lib/constants';

// Initialize dynamic constants before running tests
beforeAll(async () => {
  await initDynamicConstants();
});

describe('PricingService - calculateIntercityItemTransportCharge', () => {
  let pricingService: PricingService;

  beforeEach(() => {
    pricingService = new PricingService();
    vi.clearAllMocks();
  });

  // Helper function to create base pricing input
  const createBaseInput = (overrides: Partial<PricingInput> = {}): PricingInput => ({
    serviceType: 'item-transport',
    pickupLocation: 'Amsterdam',
    dropoffLocation: 'Rotterdam',
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
    dropoffPlace: { placeId: 'test', text: 'Rotterdam' },
    ...overrides
  });

  describe('Intercity Item Transport Calculations', () => {
    it('should calculate intercity item transport charge for Rotterdam to Eindhoven', async () => {
      const input = createBaseInput({
        pickupLocation: 'Rotterdam',
        dropoffLocation: 'Eindhoven',
        pickupDate: '2025-08-02',
        dropoffDate: '2025-08-02',
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Eindhoven' }
      });

      const result = await pricingService['calculateIntercityItemTransportCharge'](
        input, 'Rotterdam', 'Eindhoven', 0, 0);
      // (cityBaseCharges[pickupCity]?.cityDay + cityBaseCharges[dropoffCity]?.cityDay) / 2;
      // Rotterdam: 35 Eindhoven: 34 , (35 + 34) / 2 = 34.5
      expect(result).toBe(34.5);
    });

    it('should calculate intercity item transport charge for Eindhoven to Rotterdam', async () => {
      const input = createBaseInput({
        pickupLocation: 'Eindhoven',
        dropoffLocation: 'Rotterdam',
        pickupDate: '2025-08-04',
        dropoffDate: '2025-08-04',
        pickupPlace: { placeId: 'test', text: 'Eindhoven' },
        dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
      });

      const result = await pricingService['calculateIntercityItemTransportCharge'](
        input,
        'Eindhoven',
        'Rotterdam',
        0,
        0
      );

      expect(result).toBe(62); // (89, eindhoven + 35, rotterdam) / 2 = 62, rotterdam day but not eindhovens day
    });

    it('should calculate intercity item transport charge with distance differences', async () => {
      const input = createBaseInput({
        pickupLocation: 'Rotterdam',
        dropoffLocation: 'Eindhoven',
        pickupDate: '2025-08-05',
        dropoffDate: '2025-08-05',
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Eindhoven' }
      });

      const result = await pricingService['calculateIntercityItemTransportCharge'](
        input,
        'Rotterdam',
        'Eindhoven',
        10,
        5
      );

      expect(result).toBe(82.5); // (89, rotterdam + 76, eindhoven) / 2 = 82.5, 10km difference
    });

    it('should calculate intercity item transport charge for Rotterdam to s-Hertogenbosch', async () => {
      const input = createBaseInput({
        pickupLocation: 'Rotterdam',
        dropoffLocation: 's-Hertogenbosch',
        pickupDate: '2025-08-06',
        dropoffDate: '2025-08-06',
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 's-Hertogenbosch' }
      });

      const result = await pricingService['calculateIntercityItemTransportCharge'](
        input,
        'Rotterdam',
        's-Hertogenbosch',
        0,
        0
      );

      expect(result).toBe(62); // (89, rotterdam + 35, s-hertogenbosch) / 2 = 62, rotterdam day but not s-hertogenbosch day
    });

    it('should calculate intercity item transport charge for Zaanstad to Amersfoort', async () => {
      const input = createBaseInput({
        pickupLocation: 'Zaanstad',
        dropoffLocation: 'Amersfoort',
        pickupDate: '2025-08-09',
        dropoffDate: '2025-08-09',
        pickupPlace: { placeId: 'test', text: 'Zaanstad' },
        dropoffPlace: { placeId: 'test', text: 'Amersfoort' }
      });

      const result = await pricingService['calculateIntercityItemTransportCharge'](
        input,
        'Zaanstad',
        'Amersfoort',
        0,
        0
      );

      expect(result).toBe(44); // (44, zaanstad + 44, amersfoort) / 2 = 44, zaanstad day but not amersfoort day
    });
  });
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

  describe('Fixed Date - Item Transport - Within City, Same Date', () => {
    it('should use cheap base charge when city is included in calendar on that date', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Rotterdam',
        dropoffLocation: 'Rotterdam',
        pickupDate: '2025-08-02',
        dropoffDate: '2025-08-02',
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(35);
    }, 10000);

    it('should use standard base charge when city is not included in calendar on that date', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Tilburg',
        dropoffLocation: 'Tilburg',
        pickupDate: '2025-08-01',
        dropoffDate: '2025-08-01',
        pickupPlace: { placeId: 'test', text: 'Tilburg' },
        dropoffPlace: { placeId: 'test', text: 'Tilburg' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(29);
    }, 10000);
  });

  describe('Fixed Date - Item Transport - Within City, Different Dates', () => {
    it('should use cheap base charge when city is included on both dates', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Rotterdam',
        dropoffLocation: 'Rotterdam',
        pickupDate: '2025-08-02',
        dropoffDate: '2025-08-04',
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(35);
    }, 10000);

    it('should use average of cheap + standard when city is included on only one date', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Eindhoven',
        dropoffLocation: 'Eindhoven',
        pickupDate: '2025-08-02',
        dropoffDate: '2025-08-01',
        pickupPlace: { placeId: 'test', text: 'Eindhoven' },
        dropoffPlace: { placeId: 'test', text: 'Eindhoven' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(61.5); // expecting 34 why?
    }, 10000);

    it('should use cheap charge when city is included on both date or if both date are empty', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Almere',
        dropoffLocation: 'Almere',
        pickupDate: '2025-08-10',
        dropoffDate: '2025-08-10',
        pickupPlace: { placeId: 'test', text: 'Almere' },
        dropoffPlace: { placeId: 'test', text: 'Almere' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(44); //same city, dates are empty, should get cheap city rate
    }, 10000);
  });

  describe('Fixed Date - Item Transport - Between Cities, Same Date', () => {
    it('should use average of cheap pickup + cheap dropoff when both cities are included', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Rotterdam',
        dropoffLocation: 'Eindhoven',
        pickupDate: '2025-08-02',
        dropoffDate: '2025-08-02',
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Eindhoven' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(34.5);
    }, 10000);

    it('should use average of cheap pickup + standard dropoff when only pickup city is included', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Rotterdam',
        dropoffLocation: 'Tilburg',
        pickupDate: '2025-08-02',
        dropoffDate: '2025-08-02',
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Tilburg' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(32);
    }, 10000);

    it('should use average of standard pickup + cheap dropoff when only dropoff city is included', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Tilburg',
        dropoffLocation: 'Rotterdam',
        pickupDate: '2025-08-04',
        dropoffDate: '2025-08-04',
        pickupPlace: { placeId: 'test', text: 'Tilburg' },
        dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(32);
    }, 10000);

    it('should use higher standard base charge when neither city is included', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Groningen',
        dropoffLocation: 'Tilburg',
        pickupDate: '2025-08-01',
        dropoffDate: '2025-08-01',
        pickupPlace: { placeId: 'test', text: 'Groningen' },
        dropoffPlace: { placeId: 'test', text: 'Tilburg' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(49);
    }, 10000);
  });

  describe('Fixed Date - Item Transport - Between Cities, Different Dates', () => {
    it('should use average of cheap pickup + cheap dropoff when both cities are included on their dates', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Rotterdam',
        dropoffLocation: 'Eindhoven',
        pickupDate: '2025-08-02',
        dropoffDate: '2025-08-05',
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Eindhoven' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(34.5);
    }, 10000);

    it('should use average of cheap pickup + standard dropoff when only pickup city is included on its date', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Rotterdam',
        dropoffLocation: 'Tilburg',
        pickupDate: '2025-08-02',
        dropoffDate: '2025-08-01',
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Tilburg' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(32);
    }, 10000);

    it('should use average of standard pickup + cheap dropoff when only dropoff city is included on its date', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Tilburg',
        dropoffLocation: 'Rotterdam',
        pickupDate: '2025-08-01',
        dropoffDate: '2025-08-04',
        pickupPlace: { placeId: 'test', text: 'Tilburg' },
        dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(32);
    }, 10000);

    it('should use higher standard base charge when neither city is included on their dates', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Groningen',
        dropoffLocation: 'Tilburg',
        pickupDate: '2025-08-01',
        dropoffDate: '2025-08-07',
        pickupPlace: { placeId: 'test', text: 'Groningen' },
        dropoffPlace: { placeId: 'test', text: 'Tilburg' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(49);
    }, 10000);

    it('should use average of cheap pickup + normal dropoff when both dates are empty', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Rotterdam',
        dropoffLocation: 'Eindhoven',
        pickupDate: '2025-08-10',
        dropoffDate: '2025-08-10',
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Eindhoven' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(62); // (35 cityDay + 89 normal) / 2 = 62
    }, 10000);
  });
}); 