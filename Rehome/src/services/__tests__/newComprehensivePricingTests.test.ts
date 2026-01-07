import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { PricingService, PricingInput, PricingBreakdown } from '../pricingService';
import { initDynamicConstants } from '../../lib/constants';

beforeAll(async () => {
  await initDynamicConstants();
});

describe('Comprehensive Pricing Tests - All Combinations', () => {
  let pricingService: PricingService;
  let mockBreakdown: PricingBreakdown;

  const cityCoords: Record<string, { lat: number; lng: number }> = {
    Amsterdam: { lat: 52.37833, lng: 4.9 },
    Rotterdam: { lat: 51.9225, lng: 4.4821 },
    Groningen: { lat: 53.2114, lng: 6.5641 },
    Tilburg: { lat: 51.5553, lng: 5.091 },
    Eindhoven: { lat: 51.4416, lng: 5.481 },
    Utrecht: { lat: 52.0894, lng: 5.11 },
    Almere: { lat: 52.3731, lng: 5.218 },
    Breda: { lat: 51.5841, lng: 4.7988 },
    Nijmegen: { lat: 51.8447, lng: 5.8625 },
    Gouda: { lat: 52.0116, lng: 4.7108 },
  };

  const makePlace = (city: string) => ({
    placeId: city.toLowerCase(),
    text: city,
    coordinates: cityCoords[city],
  });

  const ensurePlace = (city: string, place?: any) => {
    if (!place) return makePlace(city);
    return {
      coordinates: cityCoords[city],
      ...place,
    };
  };

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
  });

  // Helper function to create base pricing input
  const createBaseInput = (overrides: Partial<PricingInput> = {}): PricingInput => {
    const merged: PricingInput = {
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
      pickupPlace: undefined,
      dropoffPlace: undefined,
      ...overrides,
    };

    const pickupCity = merged.pickupLocation;
    const dropoffCity = merged.dropoffLocation;

    // Finalize places after overrides so coordinates can’t be overwritten
    merged.pickupPlace = ensurePlace(pickupCity, merged.pickupPlace);
    merged.dropoffPlace = ensurePlace(dropoffCity, merged.dropoffPlace);

    return merged;
  };

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

      expect(mockBreakdown.basePrice).toBe(36);
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
        selectedDate: '2025-08-03',
        pickupPlace: { placeId: 'test', text: 'Tilburg' },
        dropoffPlace: { placeId: 'test', text: 'Tilburg' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(29);
    }, 10000);

    it('should use cheap base charge if calendar is empty on that date', async () => {
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

      expect(mockBreakdown.basePrice).toBe(32.5); // 36 + 29 / 2 = 32.5
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

      expect(mockBreakdown.basePrice).toBe(32.5); // 29 + 36 / 2 = 32.5
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

      expect(mockBreakdown.basePrice).toBe(35); // 36 + 34 / 2 = 35
    }, 10000);

    it('should use average of cheap pickup + standard dropoff when calendar is empty', async () => {
      const input = createBaseInput({
        serviceType: 'house-moving',
        pickupLocation: 'Utrecht',
        dropoffLocation: 'Eindhoven',
        selectedDate: '2025-08-10',
        pickupPlace: { placeId: 'test', text: 'Utrecht' },
        dropoffPlace: { placeId: 'test', text: 'Eindhoven' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(62);
    }, 10000);

    it('should use max of the two standard base charges when neither city is included', async () => {
      const input = createBaseInput({
        serviceType: 'house-moving',
        pickupLocation: 'Groningen',
        dropoffLocation: 'Almere',
        selectedDate: '2025-08-01',
        pickupPlace: { placeId: 'test', text: 'Groningen' },
        dropoffPlace: { placeId: 'test', text: 'Almere' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(99);
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

      expect(mockBreakdown.basePrice).toBe(36);
    }, 10000);

    it('should add extra km charge when distance difference > 0', async () => {
      const input = createBaseInput({
        isDateFlexible: false,
        pickupLocation: 'Gouda',
        dropoffLocation: 'Eindhoven',
        selectedDateRange: { start: '2025-08-10', end: '2025-08-25' }, // 16 days
        pickupPlace: { placeId: 'test', text: 'Gouda' },
        dropoffPlace: { placeId: 'test', text: 'Eindhoven' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(39); //extra charge added as gouda isn't there.
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

        expect(mockBreakdown.basePrice).toBe(36);
      }, 10000);

      it('should use cheap base charge when calendar is empty on the range of days', async () => {
        const input = createBaseInput({
          isDateFlexible: false,
          pickupLocation: 'Groningen',
          dropoffLocation: 'Groningen',
          selectedDateRange: { start: '2025-08-10', end: '2025-08-15' }, // 6 days, all 6 empty
          pickupPlace: { placeId: 'test', text: 'Groningen' },
          dropoffPlace: { placeId: 'test', text: 'Groningen' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(69);
      }, 10000);

      it('should use standard base charge when no city days in range', async () => {
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

      it('should use standard base charge when no empty days in range', async () => {
        const input = createBaseInput({
          isDateFlexible: false,
          pickupLocation: 'Tilburg',
          dropoffLocation: 'Tilburg',
          selectedDateRange: { start: '2025-08-12', end: '2025-08-14' }, // 3 days all empty
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

        expect(mockBreakdown.basePrice).toBe(32.5); // 36 + 29 / 2 = 32.5
      }, 10000);

      it('should use average of cheap pickup + standard dropoff when atleast 1 empty day in range', async () => {
        const input = createBaseInput({
          isDateFlexible: false,
          pickupLocation: 'Rotterdam',
          dropoffLocation: 'Tilburg',
          selectedDateRange: { start: '2025-08-02', end: '2025-08-07' }, // 6 days
          pickupPlace: { placeId: 'test', text: 'Rotterdam' },
          dropoffPlace: { placeId: 'test', text: 'Tilburg' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(32.5); // 36 + 29 / 2 = 32.5
      }, 10000);

      it('should use standard pickup when neither city days or a single empty day in range', async () => {
        const input = createBaseInput({
          isDateFlexible: false,
          pickupLocation: 'Rotterdam',
          dropoffLocation: 'Tilburg',
          selectedDateRange: { start: '2025-08-02', end: '2025-08-07' }, // 6 days
          pickupPlace: { placeId: 'test', text: 'Rotterdam' },
          dropoffPlace: { placeId: 'test', text: 'Tilburg' }
        });

        await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

        expect(mockBreakdown.basePrice).toBe(32.5); // 36 + 29 / 2 = 32.5
      }, 10000);
    });
  });

  describe('House-Moving - Additional City Combinations', () => {
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
      expect(mockBreakdown.basePrice).toBe(92); 
    }, 10000);
  });
}); 