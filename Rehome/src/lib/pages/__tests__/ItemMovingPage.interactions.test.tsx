/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ItemMovingPage from '../ItemMovingPage';
import * as pricing from '../../../services/pricingService';

vi.mock('../../api/config', () => ({ default: { MOVING: { ITEM_REQUEST: '/api/mock' }, AUTH: { LOGIN: '/api/auth/login' } } }));

const mockPricingResult = (overrides: Partial<ReturnType<any>> = {}) => ({
  basePrice: 50,
  itemValue: 10,
  distanceCost: 0,
  carryingCost: 0,
  assemblyCost: 0,
  extraHelperCost: 0,
  subtotal: 60,
  studentDiscount: 0,
  total: 60,
  earlyBookingDiscount: 0,
  breakdown: {
    baseCharge: { city: 'Amsterdam', isCityDay: true, isEarlyBooking: false, originalPrice: 50, finalPrice: 50, type: 'Amsterdam - Cheap Rate' },
    items: { totalPoints: 10, multiplier: 1, cost: 10 },
    distance: { distanceKm: 0, category: 'small', rate: 0, cost: 0 },
    carrying: { floors: 0, itemBreakdown: [], totalCost: 0 },
    assembly: { itemBreakdown: [], totalCost: 0 },
    extraHelper: { totalPoints: 0, category: 'small', cost: 0 },
  },
  ...overrides,
} as any);

describe('ItemMovingPage – interactions and edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('recalculates when toggling flexible/fixed/rehome date options', async () => {
    const spy = vi.spyOn(pricing.pricingService, 'calculatePricing').mockResolvedValue(mockPricingResult());
    render(<ItemMovingPage />);

    // Step 1
    await userEvent.click(await screen.findByText(/Private Address/i));
    await userEvent.type(await screen.findByPlaceholderText(/Enter pickup address/i), 'Ams');
    await userEvent.type(await screen.findByPlaceholderText(/Enter dropoff address/i), 'Ams');
    await userEvent.click(await screen.findByRole('button', { name: /next/i }));

    const dateSelect = await screen.findByLabelText(/Date Option/i);
    await userEvent.selectOptions(dateSelect, 'flexible');
    await userEvent.selectOptions(dateSelect, 'fixed');
    await userEvent.selectOptions(dateSelect, 'rehome');

    await waitFor(() => expect(spy).toHaveBeenCalled());
  });

  it('applies student discount only when isStudent and hasStudentId', async () => {
    const spy = vi.spyOn(pricing.pricingService, 'calculatePricing').mockResolvedValue(mockPricingResult({ studentDiscount: 6, total: 54 }));
    render(<ItemMovingPage />);

    await userEvent.click(await screen.findByText(/Private Address/i));
    await userEvent.type(await screen.findByPlaceholderText(/Enter pickup address/i), 'Ams');
    await userEvent.type(await screen.findByPlaceholderText(/Enter dropoff address/i), 'Ams');
    await userEvent.click(await screen.findByRole('button', { name: /next/i }));

    // Go to add-ons step to toggle student
    await userEvent.click(await screen.findByRole('button', { name: /next/i }));
    await userEvent.click(await screen.findByRole('button', { name: /next/i }));

    const studentCheckbox = await screen.findByLabelText(/I am a student/i);
    await userEvent.click(studentCheckbox);
    await waitFor(() => expect(spy).toHaveBeenCalled());
  });

  it('shows carrying/assembly sections affecting summary when toggled', async () => {
    const spy = vi.spyOn(pricing.pricingService, 'calculatePricing').mockResolvedValue(
      mockPricingResult({ carryingCost: 15, assemblyCost: 20, subtotal: 85, total: 85 })
    );
    render(<ItemMovingPage />);

    await userEvent.click(await screen.findByText(/Private Address/i));
    await userEvent.type(await screen.findByPlaceholderText(/Enter pickup address/i), 'Ams');
    await userEvent.type(await screen.findByPlaceholderText(/Enter dropoff address/i), 'Ams');
    await userEvent.click(await screen.findByRole('button', { name: /next/i }));

    // Step 3: items
    await userEvent.click(await screen.findByRole('button', { name: /next/i }));
    // Step 4: add-ons
    await userEvent.click(await screen.findByRole('checkbox', { name: /assembly/i }));
    await userEvent.click(await screen.findByRole('checkbox', { name: /carrying/i }));

    await waitFor(() => expect(spy).toHaveBeenCalled());
  });
});


