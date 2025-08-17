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
    it('should calculate intercity item transport charge for Amsterdam to Rotterdam', async () => {
      const input = createBaseInput({
        pickupLocation: 'Amsterdam',
        dropoffLocation: 'Rotterdam',
        selectedDate: '2024-01-15',
        pickupPlace: { placeId: 'test', text: 'Amsterdam' },
        dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
      });

      const result = await pricingService['calculateIntercityItemTransportCharge'](
        input, 'Amsterdam', 'Rotterdam', 0, 0);
      expect(result).toBe(119);
    });

    it('should calculate intercity item transport charge for The Hague to Utrecht', async () => {
      const input = createBaseInput({
        pickupLocation: 'The Hague',
        dropoffLocation: 'Utrecht',
        selectedDate: '2024-01-15',
        pickupPlace: { placeId: 'test', text: 'The Hague' },
        dropoffPlace: { placeId: 'test', text: 'Utrecht' }
      });

      const result = await pricingService['calculateIntercityItemTransportCharge'](
        input, 
        'The Hague',
        'Utrecht',
        0,
        0
      );

      expect(result).toBe(119);
    });

    it('should calculate intercity item transport charge for Eindhoven to Groningen', async () => {
      const input = createBaseInput({
        pickupLocation: 'Eindhoven',
        dropoffLocation: 'Groningen',
        selectedDate: '2024-01-15',
        pickupPlace: { placeId: 'test', text: 'Eindhoven' },
        dropoffPlace: { placeId: 'test', text: 'Groningen' }
      });

      const result = await pricingService['calculateIntercityItemTransportCharge'](
        input,
        'Eindhoven',
        'Groningen',
        0,
        0
      );

      expect(result).toBe(219);
    });

    it('should calculate intercity item transport charge with distance differences', async () => {
      const input = createBaseInput({
        pickupLocation: 'Amsterdam',
        dropoffLocation: 'Rotterdam',
        selectedDate: '2024-01-15',
        pickupPlace: { placeId: 'test', text: 'Amsterdam' },
        dropoffPlace: { placeId: 'test', text: 'Rotterdam' }
      });

      const result = await pricingService['calculateIntercityItemTransportCharge'](
        input,
        'Amsterdam',
        'Rotterdam',
        10,
        5
      );

      expect(result).toBe(125);
    });

    it('should calculate intercity item transport charge for Tilburg to Almere', async () => {
      const input = createBaseInput({
        pickupLocation: 'Tilburg',
        dropoffLocation: 'Almere',
        selectedDate: '2024-01-15',
        pickupPlace: { placeId: 'test', text: 'Tilburg' },
        dropoffPlace: { placeId: 'test', text: 'Almere' }
      });

      const result = await pricingService['calculateIntercityItemTransportCharge'](
        input,
        'Tilburg',
        'Almere',
        0,
        0
      );

      expect(result).toBe(129);
    });

    it('should calculate intercity item transport charge for Breda to Nijmegen', async () => {
      const input = createBaseInput({
        pickupLocation: 'Breda',
        dropoffLocation: 'Nijmegen',
        selectedDate: '2024-01-15',
        pickupPlace: { placeId: 'test', text: 'Breda' },
        dropoffPlace: { placeId: 'test', text: 'Nijmegen' }
      });

      const result = await pricingService['calculateIntercityItemTransportCharge'](
        input,
        'Breda',
        'Nijmegen',
        0,
        0
      );

      expect(result).toBe(149);
    });
  });
}); 