/* @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ItemMovingPage from '../../lib/pages/ItemMovingPage';
import * as pricing from '../pricingService';

// Minimal mocks for environment
vi.mock('../../api/config', () => ({ default: { MOVING: { ITEM_REQUEST: '/api/mock' }, AUTH: { LOGIN: '/api/auth/login' } } }));

// Mock the constants module to simulate loaded state
vi.mock('../../lib/constants', () => ({
  constantsLoaded: true,
  furnitureItems: [
    { id: 'chair', name: 'Chair', category: 'furniture', points: 5 }
  ],
  itemCategories: [
    { name: 'Furniture', subcategories: ['Chairs', 'Tables'], is_active: true }
  ],
  cityBaseCharges: {
    'Amsterdam': { normal: 119, cityDay: 39, dayOfWeek: 1 }
  },
  getItemPoints: vi.fn((_id: string) => 5)
}));

// Mock realtime service to prevent errors
vi.mock('../../services/realtimeService', () => ({
  initRealtimeService: vi.fn()
}));

// Mock Supabase client to prevent real API calls
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }
}));

// Mock fetch to prevent real API calls
global.fetch = vi.fn();

describe('ItemMovingPage - pricing usage and async state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch responses for Places API
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/places/autocomplete')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            suggestions: [
              {
                placePrediction: {
                  text: { text: 'Amsterdam, Netherlands' },
                  placeId: 'amsterdam_place_id',
                  structuredFormat: { mainText: { text: 'Amsterdam' } }
                }
              }
            ]
          })
        });
      }
      if (url.includes('/api/places/details')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            coordinates: { lat: 52.3676, lng: 4.9041 },
            formattedAddress: 'Amsterdam, Netherlands',
            displayName: 'Amsterdam'
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
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

    render(
      <BrowserRouter>
        <ItemMovingPage />
      </BrowserRouter>
    );

    // Wait for component to load (should show form, not loading state)
    await waitFor(() => {
      expect(screen.queryByText(/Loading furniture data/i)).toBeNull();
    });

    // Select pickup type to proceed
    await userEvent.click((await screen.findAllByText(/Private Address/i))[0]);

    // Enter locations
    await userEvent.type(await screen.findByPlaceholderText(/Enter pickup address/i), 'Amsterdam');
    await userEvent.type(await screen.findByPlaceholderText(/Enter dropoff address/i), 'Amsterdam');

    // Fill floor numbers (required fields)
    const floorInputs = await screen.findAllByPlaceholderText(/Floor number/i);
    await userEvent.type(floorInputs[0], '0'); // Pickup floor
    await userEvent.type(floorInputs[1], '0'); // Dropoff floor

    // Verify that pricing was called when locations were entered
    await waitFor(() => expect(spy).toHaveBeenCalled());

    // Test that the pricing service was called with the correct parameters
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        pickupLocation: 'Amsterdam',
        dropoffLocation: 'Amsterdam',
        serviceType: 'item-transport'
      })
    );
  });
});


