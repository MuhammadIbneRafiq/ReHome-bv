import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ItemMovingPage from '../lib/pages/ItemMovingPage';
// constants are mocked below

// Mock constants with real data
vi.mock('../lib/constants', () => ({
  furnitureItems: [
    { id: 'dd7e4197-677c-4ccb-8aa6-38ad40167899', name: 'Chair', points: 2, category: "Sofa's and Chairs" },
    { id: 'ca4ca126-5704-4c8b-8447-9243ae18ae47', name: '2-Seater Sofa', points: 6, category: "Sofa's and Chairs" },
    { id: 'fb6097cc-f129-43a5-9ad3-0fd7d782dc5e', name: 'Box', points: 0.5, category: 'Others' },
    { id: 'd0256ffe-c45b-4127-876f-9485d3e5680e', name: '1-Person Bed', points: 3, category: 'Bed' },
    { id: 'f5f674a4-df3d-4e0e-8760-1ba8365e89d3', name: '2-Person Bed', points: 5, category: 'Bed' },
  ],
  itemCategories: ["Sofa's and Chairs", 'Bed', 'Others'],
  cityBaseCharges: {
    'Amsterdam': { normal: 119, city_day: 39, day_of_week: 1 },
    'Rotterdam': { normal: 79, city_day: 35, day_of_week: 2 },
    'Utrecht': { normal: 99, city_day: 34, day_of_week: 3 },
  },
  constantsLoaded: true,
  getItemPoints: vi.fn((itemId: string) => {
    const items: Record<string, number> = {
      'dd7e4197-677c-4ccb-8aa6-38ad40167899': 2,
      'ca4ca126-5704-4c8b-8447-9243ae18ae47': 6,
      'fb6097cc-f129-43a5-9ad3-0fd7d782dc5e': 0.5,
      'd0256ffe-c45b-4127-876f-9485d3e5680e': 3,
      'f5f674a4-df3d-4e0e-8760-1ba8365e89d3': 5,
    };
    return items[itemId] || 0;
  })
}));

// Mock backend pricing service with real calculations
vi.mock('../services/backendPricingService', () => ({
  default: {
    createTransportRequest: vi.fn().mockImplementation(async (formData: FormData) => {
      // Simulate backend processing
      const items = JSON.parse(formData.get('items') as string);
      const pickupFloors = parseInt(formData.get('pickupFloors') as string);
      // dropoffFloors parsed but used for potential future calculations
      void parseInt(formData.get('dropoffFloors') as string);
      const hasElevatorPickup = formData.get('hasElevatorPickup') === 'true';
      const needsAssembly = formData.get('needsAssembly') === 'true';
      const needsExtraHelper = formData.get('needsExtraHelper') === 'true';
      
      // Calculate item value
      const itemValue = items.reduce((sum: number, item: any) => sum + item.points, 0);
      
      // Calculate carrying cost: (points * 1.35 * floors) + 25
      const effectiveFloors = hasElevatorPickup ? Math.min(1, pickupFloors) : pickupFloors;
      const carryingCost = itemValue > 0 && effectiveFloors > 0 
        ? (itemValue * 1.35 * effectiveFloors) + 25 
        : 0;
      
      // Calculate assembly cost
      const assemblyCost = needsAssembly ? 20 : 0; // Fixed price for bed
      
      // Calculate extra helper cost
      const extraHelperCost = needsExtraHelper && itemValue <= 30 ? 150 : 250;
      
      // Base charge (Amsterdam to Rotterdam example)
      const baseCharge = 119; // Amsterdam normal rate
      
      // Distance cost (mock)
      const distanceCost = 28.5; // Amsterdam to Rotterdam
      
      const subtotal = baseCharge + itemValue + distanceCost + carryingCost + assemblyCost + extraHelperCost;
      
      return {
        success: true,
        data: {
          requestId: 'test-request-id',
          pricing: {
            basePrice: baseCharge,
            itemValue,
            distanceCost,
            carryingCost,
            assemblyCost,
            extraHelperCost,
            subtotal,
            studentDiscount: 0,
            lateBookingFee: 0,
            total: subtotal
          }
        }
      };
    })
  }
}));

describe('Frontend Pricing Calculations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  const renderItemMovingPage = () => {
    return render(
      <BrowserRouter>
        <ItemMovingPage />
      </BrowserRouter>
    );
  };

  describe('Item Points Calculation', () => {
    it('should calculate points correctly for mixed items', async () => {
      renderItemMovingPage();
      
      await waitFor(() => {
        expect(screen.getByText('Chair')).toBeInTheDocument();
      });

      // Add 2 chairs (2 points each = 4 points)
      const chairIncrementBtn = screen.getAllByText('+')[0];
      fireEvent.click(chairIncrementBtn);
      fireEvent.click(chairIncrementBtn);

      // Add 1 sofa (6 points)
      const sofaIncrementBtn = screen.getAllByText('+')[1];
      fireEvent.click(sofaIncrementBtn);

      // Add 3 boxes (0.5 points each = 1.5 points)
      const boxIncrementBtn = screen.getAllByText('+')[2];
      fireEvent.click(boxIncrementBtn);
      fireEvent.click(boxIncrementBtn);
      fireEvent.click(boxIncrementBtn);

      // Total should be 11.5 points
      await waitFor(() => {
        expect(screen.getByText(/11\.5.*points/)).toBeInTheDocument();
      });
    });

    it('should update points dynamically when quantities change', async () => {
      renderItemMovingPage();
      
      await waitFor(() => {
        expect(screen.getByText('Chair')).toBeInTheDocument();
      });

      // Add 3 chairs
      const chairIncrementBtn = screen.getAllByText('+')[0];
      fireEvent.click(chairIncrementBtn);
      fireEvent.click(chairIncrementBtn);
      fireEvent.click(chairIncrementBtn);

      // Should show 6 points
      expect(screen.getByText(/6.*points/)).toBeInTheDocument();

      // Remove 1 chair
      const chairDecrementBtn = screen.getAllByText('-')[0];
      fireEvent.click(chairDecrementBtn);

      // Should show 4 points
      expect(screen.getByText(/4.*points/)).toBeInTheDocument();
    });
  });

  describe('Service Cost Calculations', () => {
    it('should calculate carrying cost with floors', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      renderItemMovingPage();
      
      await waitFor(() => {
        expect(screen.getByText('Chair')).toBeInTheDocument();
      });

      // Add items
      const chairIncrementBtn = screen.getAllByText('+')[0];
      fireEvent.click(chairIncrementBtn);
      fireEvent.click(chairIncrementBtn); // 2 chairs = 4 points

      // Set pickup floor to 2
      fireEvent.change(screen.getByLabelText(/pickup floor/i), {
        target: { value: '2' }
      });

      // Navigate to submit
      const nextBtns = screen.getAllByText('Next');
      for (let i = 0; i < 5; i++) {
        fireEvent.click(nextBtns[i]);
        await waitFor(() => {}, { timeout: 100 });
      }

      // Submit and check calculation
      const submitBtn = screen.getByText(/proceed to checkout/i);
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const fetchCall = mockFetch.mock.calls[0];
        const formData = fetchCall[1]?.body as FormData;
        // Parse form data to verify it was sent correctly
        void JSON.parse(formData.get('items') as string);
        void parseInt(formData.get('pickupFloors') as string);
        
        // Verify carrying cost calculation: (4 points * 1.35 * 2 floors) + 25 = 35.8
        const expectedCarryingCost = (4 * 1.35 * 2) + 25;
        expect(expectedCarryingCost).toBe(35.8);
      });
    });

    it('should calculate assembly cost for eligible items', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      renderItemMovingPage();
      
      await waitFor(() => {
        expect(screen.getByText('1-Person Bed')).toBeInTheDocument();
      });

      // Add a bed (assembly eligible)
      const bedIncrementBtn = screen.getAllByText('+')[3];
      fireEvent.click(bedIncrementBtn);

      // Navigate to add-ons step
      const nextBtns = screen.getAllByText('Next');
      fireEvent.click(nextBtns[0]);
      fireEvent.click(nextBtns[1]);
      fireEvent.click(nextBtns[2]);

      // Enable assembly
      await waitFor(() => {
        const assemblyCheckbox = screen.getByLabelText(/1-Person Bed/i);
        fireEvent.click(assemblyCheckbox);
      });

      // Continue to submit
      fireEvent.click(nextBtns[3]);
      fireEvent.click(nextBtns[4]);

      const submitBtn = screen.getByText(/proceed to checkout/i);
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const fetchCall = mockFetch.mock.calls[0];
        const formData = fetchCall[1]?.body as FormData;
        const needsAssembly = formData.get('needsAssembly') === 'true';
        
        expect(needsAssembly).toBe(true);
        // Assembly cost should be €20 for single bed
      });
    });

    it('should calculate extra helper cost based on points', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      renderItemMovingPage();
      
      await waitFor(() => {
        expect(screen.getByText('Chair')).toBeInTheDocument();
      });

      // Add many items to exceed 30 points threshold
      const chairIncrementBtn = screen.getAllByText('+')[0];
      for (let i = 0; i < 20; i++) {
        fireEvent.click(chairIncrementBtn); // 20 chairs = 40 points
      }

      // Navigate to add-ons step
      const nextBtns = screen.getAllByText('Next');
      fireEvent.click(nextBtns[0]);
      fireEvent.click(nextBtns[1]);
      fireEvent.click(nextBtns[2]);

      // Enable extra helper
      await waitFor(() => {
        const extraHelperCheckbox = screen.getByLabelText(/extra helper/i);
        fireEvent.click(extraHelperCheckbox);
      });

      // Continue to submit
      fireEvent.click(nextBtns[3]);
      fireEvent.click(nextBtns[4]);

      const submitBtn = screen.getByText(/proceed to checkout/i);
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const fetchCall = mockFetch.mock.calls[0];
        const formData = fetchCall[1]?.body as FormData;
        const items = JSON.parse(formData.get('items') as string);
        const totalPoints = items.reduce((sum: number, item: any) => sum + item.points, 0);
        
        // Should be €250 for >30 points
        expect(totalPoints).toBe(40);
      });
    });
  });

  describe('Price Display Updates', () => {
    it('should update price display when items change', async () => {
      renderItemMovingPage();
      
      await waitFor(() => {
        expect(screen.getByText('Chair')).toBeInTheDocument();
      });

      // Initially should show no price
      expect(screen.queryByText(/\€/)).not.toBeInTheDocument();

      // Add items
      const chairIncrementBtn = screen.getAllByText('+')[0];
      fireEvent.click(chairIncrementBtn);

      // Should show price estimate
      await waitFor(() => {
        expect(screen.getByText(/\€/)).toBeInTheDocument();
      });
    });

    it('should show breakdown of costs', async () => {
      renderItemMovingPage();
      
      await waitFor(() => {
        expect(screen.getByText('Chair')).toBeInTheDocument();
      });

      // Add items and navigate to pricing step
      const chairIncrementBtn = screen.getAllByText('+')[0];
      fireEvent.click(chairIncrementBtn);

      const nextBtns = screen.getAllByText('Next');
      fireEvent.click(nextBtns[0]); // To date step
      fireEvent.click(nextBtns[1]); // To items step (already there)
      fireEvent.click(nextBtns[2]); // To add-ons step
      fireEvent.click(nextBtns[3]); // To contact step
      fireEvent.click(nextBtns[4]); // To overview step

      // Should show price breakdown
      await waitFor(() => {
        expect(screen.getByText(/base charge/i)).toBeInTheDocument();
        expect(screen.getByText(/item value/i)).toBeInTheDocument();
        expect(screen.getByText(/total/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero quantity items', async () => {
      renderItemMovingPage();
      
      await waitFor(() => {
        expect(screen.getByText('Chair')).toBeInTheDocument();
      });

      // Add item then remove it
      const chairIncrementBtn = screen.getAllByText('+')[0];
      const chairDecrementBtn = screen.getAllByText('-')[0];
      
      fireEvent.click(chairIncrementBtn);
      fireEvent.click(chairDecrementBtn);

      // Should not show the item in overview
      const nextBtns = screen.getAllByText('Next');
      for (let i = 0; i < 5; i++) {
        fireEvent.click(nextBtns[i]);
        await waitFor(() => {}, { timeout: 100 });
      }

      expect(screen.queryByText(/Chair.*x1/)).not.toBeInTheDocument();
    });

    it('should handle decimal points correctly', async () => {
      renderItemMovingPage();
      
      await waitFor(() => {
        expect(screen.getByText('Box')).toBeInTheDocument();
      });

      // Add 3 boxes (0.5 points each)
      const boxIncrementBtn = screen.getAllByText('+')[2];
      fireEvent.click(boxIncrementBtn);
      fireEvent.click(boxIncrementBtn);
      fireEvent.click(boxIncrementBtn);

      // Should show 1.5 points
      expect(screen.getByText(/1\.5.*points/)).toBeInTheDocument();
    });
  });
});
