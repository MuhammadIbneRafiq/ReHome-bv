/* @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ItemMovingPage from '../../lib/pages/ItemMovingPage';
import * as pricing from '../pricingService';

// Minimal mocks for environment
vi.mock('../../api/config', () => ({ default: { MOVING: { ITEM_REQUEST: '/api/mock' }, AUTH: { LOGIN: '/api/auth/login' } } }));

describe('ItemMovingPage - pricing usage and async state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses pricingService.calculatePricing when both locations are set and date option changes', async () => {
    const spy = vi.spyOn(pricing.pricingService, 'calculatePricing').mockResolvedValue({
      basePrice: 39,
      itemValue: 0,
      distanceCost: 0,
      carryingCost: 0,
      assemblyCost: 0,
      extraHelperCost: 0,
      subtotal: 39,
      studentDiscount: 0,
      total: 39,
      earlyBookingDiscount: 0,
      breakdown: {
        baseCharge: { city: 'Amsterdam', isCityDay: true, isEarlyBooking: false, originalPrice: 39, finalPrice: 39, type: 'Amsterdam - Cheap Rate' },
        items: { totalPoints: 0, multiplier: 1, cost: 0 },
        distance: { distanceKm: 0, category: 'small', rate: 0, cost: 0 },
        carrying: { floors: 0, itemBreakdown: [], totalCost: 0 },
        assembly: { itemBreakdown: [], totalCost: 0 },
        extraHelper: { totalPoints: 0, category: 'small', cost: 0 },
      },
    } as any);

    render(<ItemMovingPage />);

    // Select pickup type to proceed
    const privateCard = await screen.findByText(/Private Address/i);
    await userEvent.click(privateCard);

    // Enter locations
    const pickup = await screen.findByPlaceholderText(/pickup address/i);
    const dropoff = await screen.findByPlaceholderText(/dropoff address/i);
    await userEvent.type(pickup, 'Amsterdam');
    await userEvent.type(dropoff, 'Amsterdam');

    // Move to next step (date)
    const next = await screen.findByRole('button', { name: /next/i });
    await userEvent.click(next);

    // Change date option to ReHome choose which triggers calculatePricing immediately
    const dateOption = await screen.findByLabelText(/Date Option/i);
    await userEvent.selectOptions(dateOption, 'rehome');

    await waitFor(() => expect(spy).toHaveBeenCalled());

    // Sidebar shows base price
    await waitFor(() => expect(screen.getByText(/Base Price:/i)).toBeTruthy());
  });
});


