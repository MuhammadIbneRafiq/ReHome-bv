/* @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HouseMovingPage from '../HouseMovingPage';
import * as pricing from '../../../services/pricingService';

vi.mock('../../api/config', () => ({ default: { MOVING: { ITEM_REQUEST: '/api/mock' }, AUTH: { LOGIN: '/api/auth/login' } } }));

describe('HouseMovingPage - pricing usage and async effects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('invokes pricingService.calculatePricing after both addresses entered and reacts to toggles', async () => {
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

    render(<HouseMovingPage />);

    // Fill addresses
    const pickup = await screen.findByPlaceholderText(/pickup address/i);
    const dropoff = await screen.findByPlaceholderText(/dropoff address/i);
    await userEvent.type(pickup, 'Amsterdam');
    await userEvent.type(dropoff, 'Amsterdam');

    // Debounced effect triggers; make a small change (elevator toggle) and ensure pricing recalculates
    const togglePickupElevator = await screen.findByLabelText(/Elevator available at pickup location/i);
    await userEvent.click(togglePickupElevator);

    await waitFor(() => expect(spy).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/Total:/i)).toBeTruthy());
  });
});


