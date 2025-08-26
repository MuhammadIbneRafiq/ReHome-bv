/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ItemMovingPage from '../../lib/pages/ItemMovingPage';
import * as pricing from '../pricingService';

vi.mock('../../api/config', () => ({ default: { MOVING: { ITEM_REQUEST: '/api/mock' }, AUTH: { LOGIN: '/api/auth/login' } } }));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() }
  })
}));

describe('requestId guard prevents stale overwrites', () => {
  it('only last response updates UI when earlier resolve after later', async () => {
    const slowResponse = { total: 1, basePrice: 1, itemValue: 0, distanceCost: 0, carryingCost: 0, assemblyCost: 0, extraHelperCost: 0, subtotal: 1, studentDiscount: 0, earlyBookingDiscount: 0, breakdown: { baseCharge: {}, items: {}, distance: { distanceKm: 0 }, carrying: { itemBreakdown: [], totalCost: 0 }, assembly: { itemBreakdown: [], totalCost: 0 }, extraHelper: { totalPoints: 0, category: 'small', cost: 0 } } } as any;
    const fastResponse = { total: 2, basePrice: 2, itemValue: 0, distanceCost: 0, carryingCost: 0, assemblyCost: 0, extraHelperCost: 0, subtotal: 2, studentDiscount: 0, earlyBookingDiscount: 0, breakdown: { baseCharge: {}, items: {}, distance: { distanceKm: 0 }, carrying: { itemBreakdown: [], totalCost: 0 }, assembly: { itemBreakdown: [], totalCost: 0 }, extraHelper: { totalPoints: 0, category: 'small', cost: 0 } } } as any;
    
    // Create controllers for more predictable resolution
    let resolveSlowPromise: (value: any) => void;
    const slow = new Promise((resolve) => {
      resolveSlowPromise = resolve;
    });
    
    const fast = Promise.resolve(fastResponse);

    const spy = vi.spyOn(pricing.pricingService, 'calculatePricing')
      // First call slow
      .mockReturnValueOnce(slow as any)
      // Second call fast
      .mockReturnValueOnce(fast as any);

    render(<BrowserRouter><ItemMovingPage /></BrowserRouter>);

    // Step 1
    await userEvent.click((await screen.findAllByText(/Private Address/i))[0]);
    const pickup = await screen.findByPlaceholderText(/Enter pickup address/i);
    const dropoff = await screen.findByPlaceholderText(/Enter dropoff address/i);
    await userEvent.type(pickup, 'Ams');
    await userEvent.type(dropoff, 'Ams');
    await userEvent.click((await screen.findAllByRole('button', { name: /next/i }))[0]);

    // Wait for the button click to complete and move to step 2 (date selection)
    await waitFor(() => {
      expect(screen.queryByText(/Select your preferred date and time/i)).not.toBeNull();
    });
    
    // Now we're on the date selection screen, get the date select element
    const dateSelect = screen.getByLabelText(/Date Option/i);
    
    // Trigger first calculate
    await userEvent.selectOptions(dateSelect, 'flexible');
    // Trigger second calculate quickly (newer request)
    await userEvent.selectOptions(dateSelect, 'rehome');

    // Wait for the fast promise to resolve first
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
    // Resolve the slow promise after the fast one
    await waitFor(() => resolveSlowPromise(slowResponse));
    
    // Wait for all promises to resolve
    await waitFor(() => new Promise(resolve => setTimeout(resolve, 10)));
    // Ensure the UI shows the result of the most recent request (2)
    // This validates that the stale (slow) response doesn't overwrite the newer (fast) one
    await waitFor(() => {
      const summary = screen.queryByText(/€2/);
      expect(summary).toBeTruthy();
    });
  });
});


