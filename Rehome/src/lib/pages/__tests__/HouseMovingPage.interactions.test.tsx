/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HouseMovingPage from '../HouseMovingPage';
import * as pricing from '../../../services/pricingService';

vi.mock('../../api/config', () => ({ default: { MOVING: { ITEM_REQUEST: '/api/mock' }, AUTH: { LOGIN: '/api/auth/login' } } }));

const mockPricingResult = (overrides: Partial<ReturnType<any>> = {}) => ({
  basePrice: 45,
  itemValue: 15,
  distanceCost: 10,
  carryingCost: 0,
  assemblyCost: 0,
  extraHelperCost: 0,
  subtotal: 70,
  studentDiscount: 0,
  total: 70,
  earlyBookingDiscount: 0,
  breakdown: {
    baseCharge: { city: 'Amsterdam', isCityDay: true, isEarlyBooking: false, originalPrice: 45, finalPrice: 45, type: 'Amsterdam - Cheap Rate' },
    items: { totalPoints: 15, multiplier: 1, cost: 15 },
    distance: { distanceKm: 12, category: 'medium', rate: 0.7, cost: 10 },
    carrying: { floors: 0, itemBreakdown: [], totalCost: 0 },
    assembly: { itemBreakdown: [], totalCost: 0 },
    extraHelper: { totalPoints: 0, category: 'small', cost: 0 },
  },
  ...overrides,
} as any);

describe('HouseMovingPage – interactions and recalculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('recalculates on floor/elevator toggles and date option changes', async () => {
    const spy = vi.spyOn(pricing.pricingService, 'calculatePricing').mockResolvedValue(mockPricingResult());
    render(<HouseMovingPage />);

    await userEvent.type(await screen.findByPlaceholderText(/Enter pickup address/i), 'Ams');
    await userEvent.type(await screen.findByPlaceholderText(/Enter dropoff address/i), 'Ams');

    const floorPickup = await screen.findByLabelText(/Floor \(Enter 0 for ground floor\)/i);
    await userEvent.type(floorPickup, '2');
    const elevatorToggle = await screen.findByLabelText(/Elevator available at pickup location/i);
    await userEvent.click(elevatorToggle);

    // Date option change
    await userEvent.click(await screen.findByRole('button', { name: /next/i }));
    const dateOption = await screen.findByLabelText(/Date Option/i);
    await userEvent.selectOptions(dateOption, 'rehome');

    await waitFor(() => expect(spy).toHaveBeenCalled());
    await waitFor(() => expect(!!screen.queryByText(/Total:/i)).toBe(true));
  });
});


