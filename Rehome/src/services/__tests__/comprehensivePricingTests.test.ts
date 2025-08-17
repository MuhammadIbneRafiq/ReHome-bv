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

  describe('Fixed Date - House Moving - Within City', () => {
    it('should use cheap base charge when city is included in calendar on that date', async () => {
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
    }, 10000);

    it('should use cheap base charge when calendar is empty on that date', async () => {
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
    }, 10000);

    it('should use standard base charge when city is not included in calendar on that date', async () => {
      const input = createBaseInput({
        serviceType: 'house-moving',
        pickupLocation: 'The Hague',
        dropoffLocation: 'The Hague',
        pickupPlace: { placeId: 'test', text: 'The Hague' },
        dropoffPlace: { placeId: 'test', text: 'The Hague' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(35);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('The Hague');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(true);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('The Hague - Cheap Rate');
    }, 10000);
  });

  describe('Fixed Date - House Moving - Between Cities', () => {
    it('should use average of cheap pickup + standard dropoff when pickup city is included but dropoff is not', async () => {
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
    }, 10000);

    it('should use average of standard pickup + cheap dropoff when pickup city is not included but dropoff is', async () => {
      const input = createBaseInput({
        serviceType: 'house-moving',
        pickupLocation: 'Rotterdam',
        dropoffLocation: 'Amsterdam',
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Amsterdam' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(77);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('Rotterdam');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(false);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
    }, 10000);

    it('should use average of cheap pickup + cheap dropoff when both cities are included', async () => {
      const input = createBaseInput({
        serviceType: 'house-moving',
        pickupLocation: 'Amsterdam',
        dropoffLocation: 'The Hague',
        pickupPlace: { placeId: 'test', text: 'Amsterdam' },
        dropoffPlace: { placeId: 'test', text: 'The Hague' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(79);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('Amsterdam');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(false);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
    }, 10000);

    it('should use average of cheap pickup + cheap dropoff when calendar is empty', async () => {
      const input = createBaseInput({
        serviceType: 'house-moving',
        pickupLocation: 'Utrecht',
        dropoffLocation: 'Eindhoven',
        pickupPlace: { placeId: 'test', text: 'Utrecht' },
        dropoffPlace: { placeId: 'test', text: 'Eindhoven' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(62);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('Utrecht');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(false);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
    }, 10000);

    it('should use higher standard base charge when neither city is included', async () => {
      const input = createBaseInput({
        serviceType: 'house-moving',
        pickupLocation: 'Groningen',
        dropoffLocation: 'Tilburg',
        pickupPlace: { placeId: 'test', text: 'Groningen' },
        dropoffPlace: { placeId: 'test', text: 'Tilburg' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(49);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('Groningen');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(false);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
    }, 10000);
  });

  describe('Fixed Date - Item Transport - Within City, Same Date', () => {
    it('should use cheap base charge when city is included in calendar on that date', async () => {
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
    }, 10000);

    it('should use standard base charge when city is not included in calendar on that date', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
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
    }, 10000);
  });

  describe('Fixed Date - Item Transport - Within City, Different Dates', () => {
    it('should use cheap base charge when city is included on both dates', async () => {
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
    }, 10000);

    it('should use average of cheap + standard when city is included on only one date', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Rotterdam',
        dropoffLocation: 'Rotterdam',
        pickupDate: '2024-01-15',
        dropoffDate: '2024-01-20',
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(35);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('Rotterdam');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(true);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('Rotterdam - Cheap Rate');
    }, 10000);

    it('should use standard base charge when city is not included on either date', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'The Hague',
        dropoffLocation: 'The Hague',
        pickupDate: '2024-01-15',
        dropoffDate: '2024-01-20',
        pickupPlace: { placeId: 'test', text: 'The Hague' },
        dropoffPlace: { placeId: 'test', text: 'The Hague' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(35);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('The Hague');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(true);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('The Hague - Cheap Rate');
    }, 10000);
  });

  describe('Fixed Date - Item Transport - Between Cities, Same Date', () => {
    it('should use average of cheap pickup + cheap dropoff when both cities are included', async () => {
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
    }, 10000);

    it('should use average of cheap pickup + standard dropoff when only pickup city is included', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Amsterdam',
        dropoffLocation: 'The Hague',
        pickupPlace: { placeId: 'test', text: 'Amsterdam' },
        dropoffPlace: { placeId: 'test', text: 'The Hague' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(79);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('Amsterdam');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(false);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
    }, 10000);

    it('should use average of standard pickup + cheap dropoff when only dropoff city is included', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'The Hague',
        dropoffLocation: 'Amsterdam',
        pickupPlace: { placeId: 'test', text: 'The Hague' },
        dropoffPlace: { placeId: 'test', text: 'Amsterdam' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(77);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('The Hague');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(false);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
    }, 10000);

    it('should use higher standard base charge when neither city is included', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Groningen',
        dropoffLocation: 'Tilburg',
        pickupPlace: { placeId: 'test', text: 'Groningen' },
        dropoffPlace: { placeId: 'test', text: 'Tilburg' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(49);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('Groningen');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(false);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
    }, 10000);
  });

  describe('Fixed Date - Item Transport - Between Cities, Different Dates', () => {
    it('should use average of cheap pickup + cheap dropoff when both cities are included on their dates', async () => {
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
    }, 10000);

    it('should use average of cheap pickup + standard dropoff when only pickup city is included on its date', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Amsterdam',
        dropoffLocation: 'The Hague',
        pickupDate: '2024-01-15',
        dropoffDate: '2024-01-20',
        pickupPlace: { placeId: 'test', text: 'Amsterdam' },
        dropoffPlace: { placeId: 'test', text: 'The Hague' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(37);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('Amsterdam');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(false);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
    }, 10000);

    it('should use average of standard pickup + cheap dropoff when only dropoff city is included on its date', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'The Hague',
        dropoffLocation: 'Amsterdam',
        pickupDate: '2024-01-15',
        dropoffDate: '2024-01-20',
        pickupPlace: { placeId: 'test', text: 'The Hague' },
        dropoffPlace: { placeId: 'test', text: 'Amsterdam' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(37);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('The Hague');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(false);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
    }, 10000);

    it('should use higher standard base charge when neither city is included on their dates', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Groningen',
        dropoffLocation: 'Tilburg',
        pickupDate: '2024-01-15',
        dropoffDate: '2024-01-20',
        pickupPlace: { placeId: 'test', text: 'Groningen' },
        dropoffPlace: { placeId: 'test', text: 'Tilburg' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(49);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('Groningen');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(false);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
    }, 10000);

    it('should use average of cheap pickup + cheap dropoff when both dates are empty', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Utrecht',
        dropoffLocation: 'Eindhoven',
        pickupDate: '2024-01-15',
        dropoffDate: '2024-01-20',
        pickupPlace: { placeId: 'test', text: 'Utrecht' },
        dropoffPlace: { placeId: 'test', text: 'Eindhoven' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(34.5);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('Utrecht');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(false);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
    }, 10000);
  });

  describe('Flexible Date Range - Above One Week', () => {
    it('should display cheap base charge for pickup city when range > 7 days', async () => {
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
    }, 10000);

    it('should add extra km charge when distance difference > 0', async () => {
      const input = createBaseInput({
        isDateFlexible: false,
        selectedDateRange: { start: '2024-01-15', end: '2024-01-30' }, // 16 days
        pickupPlace: { placeId: 'test', text: 'Amsterdam' },
        dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(39);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('Amsterdam');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(true);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
    }, 10000);
  });

  describe('Flexible Date Range - Below One Week', () => {
    describe('Within City', () => {
      it('should use cheap base charge when city has city days in range', async () => {
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
      }, 10000);

      it('should use cheap base charge when calendar is empty on start date', async () => {
        const input = createBaseInput({
          isDateFlexible: false,
          selectedDateRange: { start: '2024-01-15', end: '2024-01-20' }, // 6 days
          pickupPlace: { placeId: 'test', text: 'Rotterdam' },
          dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(35);
        expect(mockBreakdown.breakdown.baseCharge.city).toBe('Rotterdam');
        expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(true);
        expect(mockBreakdown.breakdown.baseCharge.type).toBe('Rotterdam - Cheap Rate');
      }, 10000);

      it('should use standard base charge when no city days in range and not empty', async () => {
        const input = createBaseInput({
          isDateFlexible: false,
          selectedDateRange: { start: '2024-01-15', end: '2024-01-20' }, // 6 days
          pickupPlace: { placeId: 'test', text: 'The Hague' },
          dropoffPlace: { placeId: 'test', text: 'The Hague' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(35);
        expect(mockBreakdown.breakdown.baseCharge.city).toBe('The Hague');
        expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(true);
        expect(mockBreakdown.breakdown.baseCharge.type).toBe('The Hague - Cheap Rate');
      }, 10000);
    });

    describe('Between City', () => {
      it('should use average of cheap pickup + standard dropoff when pickup city has city days', async () => {
        const input = createBaseInput({
          isDateFlexible: false,
          selectedDateRange: { start: '2024-01-15', end: '2024-01-20' }, // 6 days
          pickupPlace: { placeId: 'test', text: 'Amsterdam' },
          dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(79);
        expect(mockBreakdown.breakdown.baseCharge.city).toBe('Amsterdam');
        expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(true);
        expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
      }, 10000);

      it('should use average of cheap pickup + cheap dropoff when both dates are empty', async () => {
        const input = createBaseInput({
          isDateFlexible: false,
          selectedDateRange: { start: '2024-01-15', end: '2024-01-20' }, // 6 days
          pickupPlace: { placeId: 'test', text: 'Utrecht' },
          dropoffPlace: { placeId: 'test', text: 'Eindhoven' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(62);
        expect(mockBreakdown.breakdown.baseCharge.city).toBe('Utrecht');
        expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(true);
        expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
      }, 10000);

      it('should use standard base charge pickup city when pickup city is not available', async () => {
        const input = createBaseInput({
          isDateFlexible: false,
          selectedDateRange: { start: '2024-01-15', end: '2024-01-20' }, // 6 days
          pickupPlace: { placeId: 'test', text: 'Groningen' },
          dropoffPlace: { placeId: 'test', text: 'Tilburg' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(49);
        expect(mockBreakdown.breakdown.baseCharge.city).toBe('Groningen');
        expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(true);
        expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
      }, 10000);
    });
  });

  describe('Additional City Combinations', () => {
    it('should handle Almere to Breda intercity move', async () => {
      const input = createBaseInput({
        serviceType: 'house-moving',
        pickupLocation: 'Almere',
        dropoffLocation: 'Breda',
        pickupPlace: { placeId: 'test', text: 'Almere' },
        dropoffPlace: { placeId: 'test', text: 'Breda' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(61.5);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('Almere');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(false);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
    }, 10000);

    it('should handle Nijmegen to Almere item transport with different dates', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Nijmegen',
        dropoffLocation: 'Almere',
        pickupDate: '2024-01-15',
        dropoffDate: '2024-01-20',
        pickupPlace: { placeId: 'test', text: 'Nijmegen' },
        dropoffPlace: { placeId: 'test', text: 'Almere' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(51.5);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('Nijmegen');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(false);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
    }, 10000);

    it('should handle Breda to Nijmegen flexible date range below one week', async () => {
      const input = createBaseInput({
        isDateFlexible: false,
        selectedDateRange: { start: '2024-01-15', end: '2024-01-20' }, // 6 days
        pickupPlace: { placeId: 'test', text: 'Breda' },
        dropoffPlace: { placeId: 'test', text: 'Nijmegen' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(92);
      expect(mockBreakdown.breakdown.baseCharge.city).toBe('Breda');
      expect(mockBreakdown.breakdown.baseCharge.isCityDay).toBe(true);
      expect(mockBreakdown.breakdown.baseCharge.type).toBe('Intercity Rate');
    }, 10000);
  });
}); 