import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { PricingService, PricingInput } from '../pricingService';
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

    it('should calculate intercity item transport charge for The Hague to Leiden', async () => {
      const input = createBaseInput({
        pickupLocation: 'The Hague',
        dropoffLocation: 'Leiden',
        pickupDate: '2025-08-03',
        dropoffDate: '2025-08-03',
        pickupPlace: { placeId: 'test', text: 'The Hague' },
        dropoffPlace: { placeId: 'test', text: 'Leiden' }
      });

      const result = await pricingService['calculateIntercityItemTransportCharge'](
        input, 
        'The Hague',
        'Leiden',
        0,
        0
      );

      expect(result).toBe(37); // (39, hague + 35, leiden) / 2 = 37, same case as before
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