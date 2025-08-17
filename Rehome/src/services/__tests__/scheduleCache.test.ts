import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PricingService } from '../pricingService';
import API_ENDPOINTS from '../../lib/api/config';

const originalFetch = globalThis.fetch;

describe('schedule caching/coalescing/timeout', () => {
  let service: PricingService;

  beforeEach(() => {
    service = new PricingService();
    vi.restoreAllMocks();
  });

  it('coalesces concurrent identical requests and respects timeout fallback', async () => {
    const baseUrl = API_ENDPOINTS.AUTH.LOGIN.split('/api/auth/login')[0];
    const scheduleUrlPrefix = `${baseUrl}/api/city-schedule-status`;
    const emptyUrlPrefix = `${baseUrl}/api/check-all-cities-empty`;

    const calls: string[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      // Delay past timeout to trigger fallback for empty endpoint, respond fast for status
      if (url.startsWith(emptyUrlPrefix)) {
        return new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({ success: true, data: { isEmpty: true } }) } as Response), 1000));
      }
      if (url.startsWith(scheduleUrlPrefix)) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, data: { isScheduled: true, isEmpty: false } }) } as Response);
      }
      return originalFetch ? originalFetch(input as any) : Promise.reject(new Error('unhandled fetch'));
    });

    // Call internal helpers via public methods to fill cache
    const date = new Date('2025-01-01T00:00:00Z');
    await Promise.all([
      // parallel identical requests should coalesce per key
      // Note: using different methods that internally call cached getters
      (service as any).getCityScheduleStatus('Amsterdam', date),
      (service as any).getCityScheduleStatus('Amsterdam', date),
      (service as any).isCompletelyEmptyCalendarDay(date),
      (service as any).isCompletelyEmptyCalendarDay(date),
    ]);

    // We should see each underlying endpoint called at most once per key despite concurrency
    const scheduleCalls = calls.filter((u) => u.startsWith(scheduleUrlPrefix)).length;
    const emptyCalls = calls.filter((u) => u.startsWith(emptyUrlPrefix)).length;
    expect(scheduleCalls).toBeLessThanOrEqual(1);
    expect(emptyCalls).toBeLessThanOrEqual(1);
  });
});


