import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, vi, beforeEach } from 'vitest';
import { HouseMovingPage } from '../../lib/pages/ItemMovingPage';
import * as constants from '../../lib/constants';
import * as pricing from '../pricingService';

// Mock the API config
vi.mock('../../api/config', () => ({ 
  default: { 
    MOVING: { ITEM_REQUEST: '/api/mock' }, 
    AUTH: { LOGIN: '/api/auth/login' } 
  } 
}));

describe('Cold start readiness gating', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('does not call pricing before constants are loaded, then calls after ready', async () => {
    // 1) Mock constants cold - simulate morning cold start
    vi.spyOn(constants, 'constantsLoaded', 'get').mockReturnValue(false);
    
    const calcSpy = vi.spyOn(pricing.pricingService, 'calculatePricing').mockResolvedValue({
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
        baseCharge: { 
          city: 'Amsterdam', 
          isCityDay: true, 
          isEarlyBooking: false, 
          originalPrice: 39, 
          finalPrice: 39 
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
    } as any);

    // Mock furniture items and categories as empty (cold start)
    vi.spyOn(constants, 'furnitureItems', 'get').mockReturnValue([]);
    vi.spyOn(constants, 'itemCategories', 'get').mockReturnValue([]);

    render(<HouseMovingPage />);

    // Wait for component to render (should show loading state)
    await waitFor(() => {
      expect(screen.getByText(/Loading furniture data/i)).toBeInTheDocument();
    });

    // Fill inputs while constants are not ready
    const pickupInput = await screen.findByPlaceholderText(/Enter pickup address/i);
    const dropoffInput = await screen.findByPlaceholderText(/Enter dropoff address/i);
    
    await userEvent.type(pickupInput, 'Amsterdam');
    await userEvent.type(dropoffInput, 'Rotterdam');

    // Assert: no pricing called yet because constants aren't loaded
    expect(calcSpy).not.toHaveBeenCalled();

    // 2) Simulate constants becoming ready (like after Supabase loads)
    vi.spyOn(constants, 'constantsLoaded', 'get').mockReturnValue(true);
    vi.spyOn(constants, 'furnitureItems', 'get').mockReturnValue([
      { id: 'chair', name: 'Chair', category: 'furniture', points: 5 }
    ]);
    vi.spyOn(constants, 'itemCategories', 'get').mockReturnValue([
      { name: 'Furniture', subcategories: ['Chairs', 'Tables'], is_active: true }
    ]);

    // Force a re-render by triggering a state change
    // This should now allow pricing calculations to proceed
    const dateOptionSelect = await screen.findByLabelText(/Date Option/i);
    await userEvent.selectOptions(dateOptionSelect, 'rehome');

    // Assert: now pricing is called because constants are ready
    await waitFor(() => {
      expect(calcSpy).toHaveBeenCalled();
    });

    // Verify the pricing call was made with proper data
    expect(calcSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        pickupLocation: 'Amsterdam',
        dropoffLocation: 'Rotterdam',
        serviceType: 'house-moving'
      })
    );
  });

  it('prevents pricing calculation race conditions during cold start', async () => {
    // Mock constants as loading
    vi.spyOn(constants, 'constantsLoaded', 'get').mockReturnValue(false);
    
    const calcSpy = vi.spyOn(pricing.pricingService, 'calculatePricing').mockResolvedValue({
      basePrice: 0, itemValue: 0, distanceCost: 0, carryingCost: 0, assemblyCost: 0, extraHelperCost: 0,
      subtotal: 0, studentDiscount: 0, total: 0, earlyBookingDiscount: 0,
      breakdown: { 
        baseCharge: { city: null, isCityDay: false, isEarlyBooking: false, originalPrice: 0, finalPrice: 0 }, 
        items: { totalPoints: 0, multiplier: 1, cost: 0 }, 
        distance: { distanceKm: 0, category: 'small', rate: 0, cost: 0 }, 
        carrying: { floors: 0, itemBreakdown: [], totalCost: 0 }, 
        assembly: { itemBreakdown: [], totalCost: 0 }, 
        extraHelper: { totalPoints: 0, category: 'small', cost: 0 } 
      }
    } as any);

    render(<HouseMovingPage />);

    // Rapidly change multiple inputs to simulate user quickly filling form
    const pickupInput = await screen.findByPlaceholderText(/Enter pickup address/i);
    const dropoffInput = await screen.findByPlaceholderText(/Enter dropoff address/i);
    
    await userEvent.type(pickupInput, 'Ams');
    await userEvent.type(dropoffInput, 'Rot');
    await userEvent.type(pickupInput, 'terdam');
    await userEvent.type(dropoffInput, 'terdam');

    // Assert: no pricing calls despite rapid input changes
    expect(calcSpy).not.toHaveBeenCalled();

    // Even after waiting for debounce, no calls should be made
    await waitFor(() => {
      // Wait longer than the 400ms debounce
    }, { timeout: 1000 });

    expect(calcSpy).not.toHaveBeenCalled();
  });

  it('resumes normal pricing behavior after constants are loaded', async () => {
    // Start with constants ready
    vi.spyOn(constants, 'constantsLoaded', 'get').mockReturnValue(true);
    vi.spyOn(constants, 'furnitureItems', 'get').mockReturnValue([
      { id: 'chair', name: 'Chair', category: 'furniture', points: 5 }
    ]);
    vi.spyOn(constants, 'itemCategories', 'get').mockReturnValue([
      { name: 'Furniture', subcategories: ['Chairs', 'Tables'], is_active: true }
    ]);

    const calcSpy = vi.spyOn(pricing.pricingService, 'calculatePricing').mockResolvedValue({
      basePrice: 39, itemValue: 0, distanceCost: 0, carryingCost: 0, assemblyCost: 0, extraHelperCost: 0,
      subtotal: 39, studentDiscount: 0, total: 39, earlyBookingDiscount: 0,
      breakdown: { 
        baseCharge: { city: 'Amsterdam', isCityDay: true, isEarlyBooking: false, originalPrice: 39, finalPrice: 39 }, 
        items: { totalPoints: 0, multiplier: 1, cost: 0 }, 
        distance: { distanceKm: 0, category: 'small', rate: 0, cost: 0 }, 
        carrying: { floors: 0, itemBreakdown: [], totalCost: 0 }, 
        assembly: { itemBreakdown: [], totalCost: 0 }, 
        extraHelper: { totalPoints: 0, category: 'small', cost: 0 } 
      }
    } as any);

    render(<HouseMovingPage />);

    // Fill locations
    await userEvent.type(await screen.findByPlaceholderText(/Enter pickup address/i), 'Amsterdam');
    await userEvent.type(await screen.findByPlaceholderText(/Enter dropoff address/i), 'Rotterdam');

    // Wait for debounced pricing calculation
    await waitFor(() => {
      expect(calcSpy).toHaveBeenCalled();
    }, { timeout: 1000 });

    // Change date option to trigger immediate pricing
    const dateOptionSelect = await screen.findByLabelText(/Date Option/i);
    await userEvent.selectOptions(dateOptionSelect, 'flexible');

    // Should call pricing again for the date change
    await waitFor(() => {
      expect(calcSpy).toHaveBeenCalledTimes(2);
    });
  });
});
