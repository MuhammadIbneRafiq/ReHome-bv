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

      expect(mockBreakdown.basePrice).toBe(36);//standard charge for rotterdam 36
    }, 10000);

    it('should use cheap base charge when calendar is empty on that date', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Rotterdam',
        dropoffLocation: 'Rotterdam',
        pickupDate: '2025-08-01',
        dropoffDate: '2025-08-01',
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(36);//cheap charge for rotterdam 36
    }, 10000);

    it('should use standard base charge when city is not included in calendar on that date', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Tilburg',
        dropoffLocation: 'Tilburg',
        pickupDate: '2025-08-02',
        dropoffDate: '2025-08-01',
        pickupPlace: { placeId: 'test', text: 'Tilburg' },
        dropoffPlace: { placeId: 'test', text: 'Tilburg' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(29);//standard charge for tilburg 29
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

      expect(mockBreakdown.basePrice).toBe(36);//standard charge for rotterdam 36
    }, 10000);

    it('should use cheap base charge when both dates are empty', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Rotterdam',
        dropoffLocation: 'Rotterdam',
        pickupDate: '2025-08-01',
        dropoffDate: '2025-08-07',
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(36);//standard charge for rotterdam 36
    }, 10000);

    it('should use average of cheap + standard when pickup city is included on only one date AND not either of the dates are empty', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Eindhoven',
        dropoffLocation: 'Eindhoven',
        pickupDate: '2025-08-02',
        dropoffDate: '2025-08-03',
        pickupPlace: { placeId: 'test', text: 'Eindhoven' },
        dropoffPlace: { placeId: 'test', text: 'Eindhoven' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(61.5); // 34 + 89 / 2 = 61.5 cheap + standard / 2
    }, 10000);

    it('should use average of cheap + standard when empty on only 1 of the dates and not either of the dates are included as city days', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Eindhoven',
        dropoffLocation: 'Eindhoven',
        pickupDate: '2025-08-01', //empty date
        dropoffDate: '2025-08-03', //not eindhovens date, but leidens and hagues date 
        pickupPlace: { placeId: 'test', text: 'Eindhoven' },
        dropoffPlace: { placeId: 'test', text: 'Eindhoven' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(61.5); // 34 + 89 / 2 = 61.5 cheap + standard / 2
    }, 10000);

    it('standard base charge as none of the days are empty NOR none of the cities are included as city days', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Eindhoven',
        dropoffLocation: 'Eindhoven',
        pickupDate: '2025-08-04', //not eindhovns date but rotterdam and almere
        dropoffDate: '2025-08-03', //not eindhovens date, but leidens and hagues date 
        pickupPlace: { placeId: 'test', text: 'Eindhoven' },
        dropoffPlace: { placeId: 'test', text: 'Eindhoven' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(89); // rots days not in eindhoven calendar, standard charge
    }, 10000);

  });

  describe('Fixed Date - Item Transport - Between Cities, Same Date', () => {
    it('should use average of cheap pickup + cheap dropoff when both cities are included', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Rotterdam',//included date
        dropoffLocation: 'Eindhoven',//included date
        pickupDate: '2025-08-02',
        dropoffDate: '2025-08-02',
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Eindhoven' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(35); // 34 + 36 / 2 = 35
    }, 10000);

    it('should use average of cheap pickup + standard dropoff when only pickup city is included', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Rotterdam', //included date
        dropoffLocation: 'Tilburg', //not included date
        pickupDate: '2025-08-02',
        dropoffDate: '2025-08-02',
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Tilburg' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(32.5); // 36 + 29 / 2 = 32.5
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

      expect(mockBreakdown.basePrice).toBe(32.5); // 29 + 36 / 2 = 32.5
    }, 10000);

    it('should use cheap pickup + standard dropoff when both dates are empty', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Groningen',//69 on cheap
        dropoffLocation: 'Tilburg',//29 on standard
        pickupDate: '2025-08-01',
        dropoffDate: '2025-08-01',
        pickupPlace: { placeId: 'test', text: 'Groningen' },
        dropoffPlace: { placeId: 'test', text: 'Tilburg' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(49); // 69 and 29 average
    }, 10000);

    it('should use higher standard base charge when neither city is included', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Groningen',
        dropoffLocation: 'Tilburg',
        pickupDate: '2025-08-02',
        dropoffDate: '2025-08-02',
        pickupPlace: { placeId: 'test', text: 'Groningen' },
        dropoffPlace: { placeId: 'test', text: 'Tilburg' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(219); // 219 and 29, max of the two
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

      expect(mockBreakdown.basePrice).toBe(35); // 34 + 36 / 2 = 35
    }, 10000);

    it('should use average of cheap pickup + cheap dropoff when both dates are empty', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Rotterdam',
        dropoffLocation: 'Eindhoven',
        pickupDate: '2025-08-01',
        dropoffDate: '2025-08-07',
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Eindhoven' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(35); // 34 + 36 / 2 = 35
    }, 10000);

    it('avg cheap pickup, standard dropoff; pickup city is included on its date and standard is not empty', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Rotterdam',
        dropoffLocation: 'Tilburg',
        pickupDate: '2025-08-02',
        dropoffDate: '2025-08-03',
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Tilburg' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(32.5); // 36 + 29 / 2 = 32.5
    }, 10000);

    it('should use average of standard pickup + cheap dropoff when only dropoff city is included on its date', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Tilburg', //not included date
        dropoffLocation: 'Rotterdam', //included date
        pickupDate: '2025-08-03',
        dropoffDate: '2025-08-04',
        pickupPlace: { placeId: 'test', text: 'Tilburg' },
        dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(32.5); //29 + 36 / 2 = 32.5
    }, 10000);

    it('should use average of standard pickup + cheap dropoff when dropoff date is empty and pickup not included as city day', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Rotterdam',
        dropoffLocation: 'Tilburg',
        pickupDate: '2025-08-03', // not emptyu and not included
        dropoffDate: '2025-08-07',//empty date
        pickupPlace: { placeId: 'test', text: 'Rotterdam' },
        dropoffPlace: { placeId: 'test', text: 'Tilburg' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(74); //29 + 119 / 2 = 74
    }, 10000);

    it('should use average of cheap pickup + standard dropoff, pickup date is empty and dropoff date is (not empty empty and not calender day)', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Tilburg',
        dropoffLocation: 'Rotterdam',
        pickupDate: '2025-08-01',
        dropoffDate: '2025-08-03',
        pickupPlace: { placeId: 'test', text: 'Tilburg' },
        dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(74);// 29 + 119 / 2 = 74
    }, 10000);

    it('avg std pickup, cheap dropoff when dropoff= empty and pickup =(not empty and not calender day)', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Tilburg',
        dropoffLocation: 'Rotterdam',
        pickupDate: '2025-08-03',
        dropoffDate: '2025-08-07',
        pickupPlace: { placeId: 'test', text: 'Tilburg' },
        dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(32.5);// 29 + 36 / 2 = 32.5
    }, 10000);

    it('should use higher standard base charge when neither city is included on their dates', async () => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: 'Groningen',
        dropoffLocation: 'Tilburg',
        pickupDate: '2025-08-03',
        dropoffDate: '2025-08-04',
        pickupPlace: { placeId: 'test', text: 'Groningen' },
        dropoffPlace: { placeId: 'test', text: 'Tilburg' }
      });

      await pricingService['calculateBaseChargeBreakdown'](input, mockBreakdown);

      expect(mockBreakdown.basePrice).toBe(219);
    }, 10000);
  });
}); 