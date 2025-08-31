/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { HouseMovingPage } from '../../lib/pages/ItemMovingPage';
import * as pricing from '../pricingService';

// Mock the API config
vi.mock('../../api/config', () => ({ 
  default: { 
    MOVING: { ITEM_REQUEST: '/api/mock' }, 
    AUTH: { LOGIN: '/api/auth/login' } 
  } 
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() }
  })
}));

// Mock constants with proper structure
vi.mock('../../lib/constants', () => ({
  constantsLoaded: true,
  furnitureItems: [
    { id: 'chair', name: 'Chair', category: 'furniture', points: 5 },
    { id: 'table', name: 'Table', category: 'furniture', points: 8 }
  ],
  itemCategories: [
    { name: 'Furniture', subcategories: ['Chairs', 'Tables'], is_active: true }
  ],
  getItemPoints: vi.fn((id: string) => {
    const items = { chair: 5, table: 8 };
    return items[id as keyof typeof items] || 0;
  }),
  cityBaseCharges: [
    { city: 'Amsterdam', base_charge: 50.00, type: 'City Base Charge' },
    { city: 'Rotterdam', base_charge: 45.00, type: 'City Base Charge' }
  ],
  pricingConfig: {
    base_rates: { distance: 2.00, floor: 5.00, elevator: 5.00 },
    item_rates: { chair: 5.00, table: 8.00 }
  }
}));

// Mock Google Places API
vi.mock('../../components/ui/GooglePlacesAutocomplete', () => ({
  GooglePlacesAutocomplete: ({ value, onChange, placeholder, onPlaceSelect }: any) => (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => {
        // Simulate place selection
        if (value && onPlaceSelect) {
          onPlaceSelect({
            place_id: 'test_place_id',
            formatted_address: value,
            geometry: {
              location: { lat: () => 52.3676, lng: () => 4.9041 }
            }
          });
        }
      }}
      placeholder={placeholder}
      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
    />
  )
}));

// Mock the pricing service
const mockPricingResult = {
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
    baseCharge: { 
      city: 'Amsterdam', 
      isCityDay: true, 
      isEarlyBooking: false, 
      originalPrice: 50, 
      finalPrice: 50, 
      type: 'Amsterdam - Cheap Rate' 
    },
    items: { totalPoints: 10, multiplier: 1, cost: 10 },
    distance: { distanceKm: 0, category: 'small', rate: 0, cost: 0 },
    carrying: { floors: 0, itemBreakdown: [], totalCost: 0 },
    assembly: { itemBreakdown: [], totalCost: 0 },
    extraHelper: { totalPoints: 0, category: 'small', cost: 0 },
  },
};

describe('HouseMovingPage – interactions and recalculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the pricing service
    vi.spyOn(pricing.pricingService, 'calculatePricing').mockResolvedValue(mockPricingResult as any);
  });

  it('renders house moving form and tests basic functionality', async () => {
    render(
      <BrowserRouter>
        <HouseMovingPage />
      </BrowserRouter>
    );

    // Wait for the component to finish loading constants
    await waitFor(() => {
      expect(screen.queryByText(/Loading furniture data/i)).toBeNull();
    });

    // Verify we're on step 1 (Location)
    expect(screen.getByText('1')).toBeInTheDocument();

    // For house moving, we should see location fields immediately (no pickup type selection)
    expect(screen.getByText('Pickup Address')).toBeInTheDocument();
    expect(screen.getByText('Dropoff Address')).toBeInTheDocument();

    // Find the address input fields
    const pickupInput = screen.getByPlaceholderText('Enter pickup address');
    const dropoffInput = screen.getByPlaceholderText('Enter dropoff address');
    
    expect(pickupInput).toBeInTheDocument();
    expect(dropoffInput).toBeInTheDocument();

    // Fill in addresses
    await userEvent.type(pickupInput, 'Amsterdam');
    await userEvent.type(dropoffInput, 'Rotterdam');

    // Find floor inputs
    const floorInputs = screen.getAllByPlaceholderText('Floor number');
    expect(floorInputs).toHaveLength(2); // Should have pickup and dropoff floor inputs
    
    const pickupFloorInput = floorInputs[0];
    const dropoffFloorInput = floorInputs[1];
    
    // Set floor values
    await userEvent.clear(pickupFloorInput);
    await userEvent.type(pickupFloorInput, '2');
    await userEvent.clear(dropoffFloorInput);
    await userEvent.type(dropoffFloorInput, '3');

    // Verify floor values are set
    expect(pickupFloorInput).toHaveValue(2);
    expect(dropoffFloorInput).toHaveValue(3);

    // Verify elevator toggles are present
    expect(screen.getByText('Elevator available at pickup location')).toBeInTheDocument();
    expect(screen.getByText('Elevator available at dropoff location')).toBeInTheDocument();

    // Test that the pricing service is available
    expect(pricing.pricingService.calculatePricing).toBeDefined();
  });

  it('shows correct step navigation for house moving', async () => {
    render(
      <BrowserRouter>
        <HouseMovingPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading furniture data/i)).toBeNull();
    });

    // Should show step 1 initially
    expect(screen.getByText('1')).toBeInTheDocument();
    
    // Should not show pickup type selection for house moving
    expect(screen.queryByText('Select the type of pickup location for your items.')).not.toBeInTheDocument();
    
    // Should show location fields directly
    expect(screen.getByText('Pickup Address')).toBeInTheDocument();
    expect(screen.getByText('Dropoff Address')).toBeInTheDocument();
  });

  it('handles address input and validation', async () => {
    render(
      <BrowserRouter>
        <HouseMovingPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading furniture data/i)).toBeNull();
    });

    const pickupInput = screen.getByPlaceholderText('Enter pickup address');
    const dropoffInput = screen.getByPlaceholderText('Enter dropoff address');

    // Test address input
    await userEvent.type(pickupInput, 'Amsterdam Central Station');
    await userEvent.type(dropoffInput, 'Rotterdam Central Station');

    // Verify addresses are set
    expect(pickupInput).toHaveValue('Amsterdam Central Station');
    expect(dropoffInput).toHaveValue('Rotterdam Central Station');

    // Test floor inputs
    const floorInputs = screen.getAllByPlaceholderText('Floor number');
    await userEvent.type(floorInputs[0], '1');
    await userEvent.type(floorInputs[1], '0');

    expect(floorInputs[0]).toHaveValue(1);
    expect(floorInputs[1]).toHaveValue(0);
  });
});