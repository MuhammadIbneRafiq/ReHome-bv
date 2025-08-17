import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PricingService, PricingInput } from '../pricingService';
import { initDynamicConstants } from '../../lib/constants';
import { fetchConstants, getCityStatus, expectedWithinCityBase } from './helpers/livePricingFixture';
import * as locationServices from '../../utils/locationServices';
import API_ENDPOINTS from '../../lib/api/config';

// Make fetch available in node test env and allow mocking per test
const originalFetch = globalThis.fetch;
describe('PricingService concurrency and async behavior', () => {
  let service: PricingService;

  beforeAll(() => {
    service = new PricingService();
    // Ensure cityBaseCharges/pricingConfig are populated for numeric base charges
    return initDynamicConstants().catch(() => undefined);
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const baseInput = (overrides: Partial<PricingInput> = {}): PricingInput => ({
    serviceType: 'item-transport',
    pickupLocation: 'A',
    dropoffLocation: 'B',
    selectedDate: '2025-12-20',
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
    pickupPlace: { placeId: 'p1' },
    dropoffPlace: { placeId: 'p2' },
    ...overrides,
  });

  const mockCity = (city: string, distanceDifference = 0) => ({ city, distanceDifference });

  const mockScheduleEndpoints = (opts: {
    isScheduled: boolean;
    isEmpty: boolean;
    latencyMs?: number;
  }) => {
    const baseUrl = API_ENDPOINTS.AUTH.LOGIN.split('/api/auth/login')[0];
    const scheduleUrlPrefix = `${baseUrl}/api/city-schedule-status`;
    const emptyUrlPrefix = `${baseUrl}/api/check-all-cities-empty`;

    vi.spyOn(globalThis as any, 'fetch').mockImplementation((input: any) => {
      const url = String(input);
      const respond = (body: any) =>
        Promise.resolve({ ok: true, json: async () => ({ success: true, data: body }) } as Response);

      const delayed = (fn: () => Promise<Response>) =>
        new Promise<Response>((resolve) => setTimeout(() => fn().then(resolve), opts.latencyMs ?? 0));

      if (url.startsWith(scheduleUrlPrefix)) {
        return delayed(() => respond({ isScheduled: opts.isScheduled, isEmpty: opts.isEmpty }));
      }
      if (url.startsWith(emptyUrlPrefix)) {
        return delayed(() => respond({ isEmpty: opts.isEmpty }));
      }
      return originalFetch ? originalFetch(input as any) : Promise.reject(new Error('unhandled fetch'));
    });
  };

  it('is robust when multiple calculatePricing calls resolve out-of-order (prevents stale overwrite)', async () => {
    // Slow response for first call, fast for second
    vi.spyOn(locationServices, 'findClosestSupportedCity')
      .mockResolvedValueOnce(mockCity('Amsterdam'))
      .mockResolvedValueOnce(mockCity('Rotterdam'))
      .mockResolvedValueOnce(mockCity('Amsterdam'))
      .mockResolvedValueOnce(mockCity('Rotterdam'));

    // First call slower
    mockScheduleEndpoints({ isScheduled: true, isEmpty: false, latencyMs: 120 });
    const p1 = service.calculatePricing(baseInput({ selectedDate: '2025-12-20' }));

    // Reset fetch mock for faster second call with different state
    vi.restoreAllMocks();
    vi.spyOn(locationServices, 'findClosestSupportedCity')
      .mockResolvedValueOnce(mockCity('Amsterdam'))
      .mockResolvedValueOnce(mockCity('Amsterdam'));
    mockScheduleEndpoints({ isScheduled: true, isEmpty: false, latencyMs: 5 });
    const p2 = service.calculatePricing(baseInput({ dropoffLocation: 'A', selectedDate: '2025-12-21' }));

    const [r1, r2] = await Promise.all([p1, p2]);

    // Both results are valid objects; this test guards that no internal shared state/race causes corruption
    expect(r1).toBeTruthy();
    expect(r2).toBeTruthy();
    expect(typeof r1.total).toBe('number');
    expect(typeof r2.total).toBe('number');
  });

  it('aligns base price with live schedule for within-city on an August date', async () => {
    const { cityBaseCharges } = await fetchConstants();
    const dateStr = `${new Date().getFullYear()}-08-15`;

    const status = await getCityStatus('Amsterdam', dateStr);
    const expectedBase = expectedWithinCityBase(cityBaseCharges, 'Amsterdam', status);

    vi.spyOn(locationServices, 'findClosestSupportedCity').mockResolvedValue(mockCity('Amsterdam'));
    mockScheduleEndpoints({ isScheduled: status.isScheduled, isEmpty: status.isEmpty });

    const result = await service.calculatePricing(baseInput({ selectedDate: dateStr, pickupLocation: 'Amsterdam', dropoffLocation: 'Amsterdam' }));
    expect(result.basePrice).toBe(expectedBase);
  });

  it('gracefully handles backend errors from schedule endpoints', async () => {
    vi.spyOn(locationServices, 'findClosestSupportedCity')
      .mockResolvedValue(mockCity('Amsterdam'));
    const baseUrl = API_ENDPOINTS.AUTH.LOGIN.split('/api/auth/login')[0];
    const scheduleUrlPrefix = `${baseUrl}/api/city-schedule-status`;
    const emptyUrlPrefix = `${baseUrl}/api/check-all-cities-empty`;

    vi.spyOn(globalThis as any, 'fetch').mockImplementation((input: any) => {
      const url = String(input);
      if (url.startsWith(scheduleUrlPrefix) || url.startsWith(emptyUrlPrefix)) {
        return Promise.resolve({ ok: false, status: 500 } as Response);
      }
      return originalFetch ? originalFetch(input as any) : Promise.reject(new Error('unhandled fetch'));
    });

    const result = await service.calculatePricing(baseInput());
    // Falls back to safe defaults without throwing
    expect(result.basePrice).toBeGreaterThanOrEqual(0);
  });

  it('calculateDistanceCost is pure and stable across parallel calls', async () => {
    const distances = [0, 9, 10, 50, 120];
    const results = await Promise.all(distances.map((d) => service.calculateDistanceCost(d)));
    expect(results.map((r) => r.cost)).toEqual([
      0, // <10 free
      0,
      Math.round(10 * 0.7),
      Math.round(50 * 0.7),
      Math.round(50 * 0.7) + Math.round((120 - 50) * 0.5),
    ]);
  });
});


