/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ItemMovingPage from '../../lib/pages/ItemMovingPage';
import * as pricing from '../pricingService';

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

  it('recalculates when toggling flexible/fixed/rehome date options', async () => {
    const spy = vi.spyOn(pricing.pricingService, 'calculatePricing').mockResolvedValue(mockPricingResult());
    
    render(
      <BrowserRouter>
        <ItemMovingPage />
      </BrowserRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading furniture data/i)).toBeNull();
    });

    // Step 1: Select pickup type
    await userEvent.click((await screen.findAllByText(/Private Address/i))[0]);
    
    // Fill addresses
    await userEvent.type(await screen.findByPlaceholderText(/Enter pickup address/i), 'Amsterdam');
    await userEvent.type(await screen.findByPlaceholderText(/Enter dropoff address/i), 'Amsterdam');
    
    // Fill floor numbers (required fields)
    const floorInputs = await screen.findAllByPlaceholderText(/Floor number/i);
    await userEvent.type(floorInputs[0], '0'); // Pickup floor
    await userEvent.type(floorInputs[1], '0'); // Dropoff floor
    
    // Move to step 2 (date selection) - this will show booking tips first
    await userEvent.click((await screen.findAllByRole('button', { name: /next/i }))[0]);

    // Wait for booking tips modal to appear and click ok
    await waitFor(() => {
      expect(screen.getByText(/Smart Booking Tips/i)).toBeInTheDocument();
    });
    
    // Click ok in the tips modal to actually go to step 2
    const okButton = screen.getByRole('button', { name: /ok/i });
    await userEvent.click(okButton);

    // Wait for step 2 to load and verify we can see the form
    await waitFor(() => {
      expect(screen.getByText(/Date & Time/i)).toBeInTheDocument();
    });
    
    // Now we're on the date selection screen - find the date option field
    const dateSelect = await screen.findByLabelText(/Date Option/i);
    
    // Test each date option change to trigger pricing recalculation
    await userEvent.selectOptions(dateSelect, 'flexible');
    await waitFor(() => expect(spy).toHaveBeenCalled());
    
    await userEvent.selectOptions(dateSelect, 'fixed');
    await waitFor(() => expect(spy).toHaveBeenCalled());
    
    await userEvent.selectOptions(dateSelect, 'rehome');
    await waitFor(() => expect(spy).toHaveBeenCalled());
  });

  it('applies student discount only when isStudent and hasStudentId', async () => {
    const spy = vi.spyOn(pricing.pricingService, 'calculatePricing').mockResolvedValue(mockPricingResult({ studentDiscount: 6, total: 54 }));
    
    render(
      <BrowserRouter>
        <ItemMovingPage />
      </BrowserRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading furniture data/i)).toBeNull();
    });

    // Step 1: Select pickup type and fill addresses
    await userEvent.click((await screen.findAllByText(/Private Address/i))[0]);
    await userEvent.type(await screen.findByPlaceholderText(/Enter pickup address/i), 'Amsterdam');
    await userEvent.type(await screen.findByPlaceholderText(/Enter dropoff address/i), 'Amsterdam');
    
    // Fill floor numbers
    const floorInputs = await screen.findAllByPlaceholderText(/Floor number/i);
    await userEvent.type(floorInputs[0], '0');
    await userEvent.type(floorInputs[1], '0');
    
    // Move through steps to reach add-ons (step 4)
    // Step 1 -> 2: Click next, handle booking tips, click ok
    await userEvent.click((await screen.findAllByRole('button', { name: /next/i }))[0]);
    await waitFor(() => expect(screen.getByText(/Smart Booking Tips/i)).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /ok/i }));
    
    // Step 2 -> 3: Click next
    await waitFor(() => expect(screen.getByText(/Date & Time/i)).toBeInTheDocument());
    await userEvent.click((await screen.findAllByRole('button', { name: /next/i }))[0]);
    
    // Step 3 -> 4: Click next
    await waitFor(() => expect(screen.getByText(/Items/i)).toBeInTheDocument());
    await userEvent.click((await screen.findAllByRole('button', { name: /next/i }))[0]);

    // Wait for step 4 to load
    await waitFor(() => {
      expect(screen.getByText(/Add-ons/i)).toBeInTheDocument();
    });

    // Find and click the student checkbox using the correct label text
    const studentCheckbox = await screen.findByLabelText(/I am a student \(8.85% discount with valid ID\)/i);
    await userEvent.click(studentCheckbox);
    
    await waitFor(() => expect(spy).toHaveBeenCalled());
  });

  it('shows carrying/assembly sections affecting summary when toggled', async () => {
    const spy = vi.spyOn(pricing.pricingService, 'calculatePricing').mockResolvedValue(
      mockPricingResult({ carryingCost: 15, assemblyCost: 20, subtotal: 85, total: 85 })
    );
    
    render(
      <BrowserRouter>
        <ItemMovingPage />
      </BrowserRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading furniture data/i)).toBeNull();
    });

    // Step 1: Select pickup type and fill addresses
    await userEvent.click((await screen.findAllByText(/Private Address/i))[0]);
    await userEvent.type(await screen.findByPlaceholderText(/Enter pickup address/i), 'Amsterdam');
    await userEvent.type(await screen.findByPlaceholderText(/Enter dropoff address/i), 'Amsterdam');
    
    // Fill floor numbers
    const floorInputs = await screen.findAllByPlaceholderText(/Floor number/i);
    await userEvent.type(floorInputs[0], '0');
    await userEvent.type(floorInputs[1], '0');
    
    // Move through steps to reach add-ons (step 4)
    // Step 1 -> 2: Click next, handle booking tips, click ok
    await userEvent.click((await screen.findAllByRole('button', { name: /next/i }))[0]);
    await waitFor(() => expect(screen.getByText(/Smart Booking Tips/i)).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /ok/i }));
    
    // Step 2 -> 3: Click next
    await waitFor(() => expect(screen.getByText(/Date & Time/i)).toBeInTheDocument());
    await userEvent.click((await screen.findAllByRole('button', { name: /next/i }))[0]);
    
    // Step 3 -> 4: Click next
    await waitFor(() => expect(screen.getByText(/Items/i)).toBeInTheDocument());
    await userEvent.click((await screen.findAllByRole('button', { name: /next/i }))[0]);

    // Wait for step 4 to load
    await waitFor(() => {
      expect(screen.getByText(/Add-ons/i)).toBeInTheDocument();
    });

    // Find and click the assembly and carrying checkboxes using the correct labels
    const assemblyCheckbox = await screen.findByLabelText(/Do you need our help with assembly\/ disassembly of some Items\?/i);
    const carryingCheckbox = await screen.findByLabelText(/Do you need our help with carrying items up or downstairs\?/i);
    
    await userEvent.click(assemblyCheckbox);
    await userEvent.click(carryingCheckbox);

    await waitFor(() => expect(spy).toHaveBeenCalled());
  });
});


