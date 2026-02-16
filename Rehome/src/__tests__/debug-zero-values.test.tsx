import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ItemMovingPage from '../lib/pages/ItemMovingPage';
import * as constants from '../lib/constants';

// Mock constants to test zero value scenarios
vi.mock('../lib/constants', () => ({
  furnitureItems: [
    { id: 'dd7e4197-677c-4ccb-8aa6-38ad40167899', name: 'Chair', points: 2, category: "Sofa's and Chairs" },
    { id: 'ca4ca126-5704-4c8b-8447-9243ae18ae47', name: '2-Seater Sofa', points: 6, category: "Sofa's and Chairs" },
    { id: 'fb6097cc-f129-43a5-9ad3-0fd7d782dc5e', name: 'Box', points: 0.5, category: 'Others' },
  ],
  itemCategories: ["Sofa's and Chairs", 'Others'],
  cityBaseCharges: {
    'Amsterdam': { normal: 119, city_day: 39, day_of_week: 1 },
  },
  constantsLoaded: true,
  getItemPoints: vi.fn((itemId: string) => {
    const items: Record<string, number> = {
      'dd7e4197-677c-4ccb-8aa6-38ad40167899': 2,
      'ca4ca126-5704-4c8b-8447-9243ae18ae47': 6,
      'fb6097cc-f129-43a5-9ad3-0fd7d782dc5e': 0.5,
    };
    return items[itemId] || 0;
  })
}));

// Mock backend to return zero values for debugging
vi.mock('../services/backendPricingService', () => ({
  default: {
    createTransportRequest: vi.fn().mockImplementation(async (formData: FormData) => {
      console.log('=== DEBUG: BACKEND RECEIVED ===');
      console.log('items:', formData.get('items'));
      console.log('pickupFloors:', formData.get('pickupFloors'));
      console.log('dropoffFloors:', formData.get('dropoffFloors'));
      console.log('needsAssembly:', formData.get('needsAssembly'));
      console.log('needsExtraHelper:', formData.get('needsExtraHelper'));
      
      const items = JSON.parse(formData.get('items') as string);
      const pickupFloors = parseInt(formData.get('pickupFloors') as string);
      const dropoffFloors = parseInt(formData.get('dropoffFloors') as string);
      
      // Debug why values might be zero
      console.log('=== DEBUG: ITEM ANALYSIS ===');
      console.log('Items array:', items);
      console.log('Items length:', items.length);
      console.log('First item:', items[0]);
      
      const itemValue = items.reduce((sum: number, item: any) => sum + (item.points || 0), 0);
      console.log('Calculated itemValue:', itemValue);
      
      const carryingCost = itemValue > 0 && (pickupFloors > 0 || dropoffFloors > 0)
        ? (itemValue * 1.35 * (pickupFloors + dropoffFloors)) + 25
        : 0;
      console.log('Calculated carryingCost:', carryingCost);
      
      return {
        success: true,
        data: {
          requestId: 'test-request-id',
          pricing: {
            basePrice: 119,
            itemValue,
            distanceCost: 28.5,
            carryingCost,
            assemblyCost: 0,
            extraHelperCost: 0,
            subtotal: 119 + itemValue + 28.5 + carryingCost,
            studentDiscount: 0,
            total: 119 + itemValue + 28.5 + carryingCost
          }
        }
      };
    })
  }
}));

describe('Debug Zero Values Issue', () => {
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

  describe('Frontend Data Flow Debug', () => {
    it('should log itemQuantities state changes', async () => {
      // Mock console.log to capture state changes
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      renderItemMovingPage();
      
      await waitFor(() => {
        expect(screen.getByText('Chair')).toBeInTheDocument();
      });

      // Add items and check state
      const chairIncrementBtn = screen.getAllByText('+')[0];
      fireEvent.click(chairIncrementBtn);
      
      // Check if itemQuantities is being updated
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('itemQuantities'),
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
    });

    it('should create itemList with correct structure', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      renderItemMovingPage();
      
      await waitFor(() => {
        expect(screen.getByText('Chair')).toBeInTheDocument();
      });

      // Add items
      const chairIncrementBtn = screen.getAllByText('+')[0];
      fireEvent.click(chairIncrementBtn);
      fireEvent.click(chairIncrementBtn); // 2 chairs

      const sofaIncrementBtn = screen.getAllByText('+')[1];
      fireEvent.click(sofaIncrementBtn); // 1 sofa

      // Navigate to final step
      const nextBtns = screen.getAllByText('Next');
      for (let i = 0; i < 5; i++) {
        fireEvent.click(nextBtns[i]);
        await waitFor(() => {}, { timeout: 100 });
      }

      // Check itemList creation
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('itemList:'),
        expect.arrayContaining([
          expect.objectContaining({
            id: 'dd7e4197-677c-4ccb-8aa6-38ad40167899',
            name: 'Chair',
            quantity: 2,
            points: 4
          })
        ])
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Backend Processing Debug', () => {
    it('should send correct data to backend', async () => {
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

      // Set floors
      fireEvent.change(screen.getByLabelText(/pickup floor/i), {
        target: { value: '1' }
      });

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });

      // Navigate and submit
      const nextBtns = screen.getAllByText('Next');
      for (let i = 0; i < 5; i++) {
        fireEvent.click(nextBtns[i]);
        await waitFor(() => {}, { timeout: 100 });
      }

      const submitBtn = screen.getByText(/proceed to checkout/i);
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
        
        const fetchCall = mockFetch.mock.calls[0];
        const formData = fetchCall[1]?.body as FormData;
        
        // Debug FormData content
        console.log('=== DEBUG: FORM DATA ===');
        console.log('items:', formData.get('items'));
        console.log('pickupFloors:', formData.get('pickupFloors'));
        console.log('dropoffFloors:', formData.get('dropoffFloors'));
        
        // Verify data is not empty
        expect(formData.get('items')).toBeTruthy();
        expect(formData.get('pickupFloors')).toBe('1');
      });
    });

    it('should handle empty items array', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      renderItemMovingPage();
      
      await waitFor(() => {
        expect(screen.getByText('Chair')).toBeInTheDocument();
      });

      // Don't add any items
      
      // Fill required fields
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });

      // Navigate and submit
      const nextBtns = screen.getAllByText('Next');
      for (let i = 0; i < 5; i++) {
        fireEvent.click(nextBtns[i]);
        await waitFor(() => {}, { timeout: 100 });
      }

      const submitBtn = screen.getByText(/proceed to checkout/i);
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const fetchCall = mockFetch.mock.calls[0];
        const formData = fetchCall[1]?.body as FormData;
        const items = JSON.parse(formData.get('items') as string);
        
        // Should be empty array
        expect(items).toEqual([]);
      });
    });
  });

  describe('Common Zero Value Scenarios', () => {
    it('should handle zero floors with items', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      renderItemMovingPage();
      
      await waitFor(() => {
        expect(screen.getByText('Chair')).toBeInTheDocument();
      });

      // Add items but no floors
      const chairIncrementBtn = screen.getAllByText('+')[0];
      fireEvent.click(chairIncrementBtn);

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });

      // Navigate and submit
      const nextBtns = screen.getAllByText('Next');
      for (let i = 0; i < 5; i++) {
        fireEvent.click(nextBtns[i]);
        await waitFor(() => {}, { timeout: 100 });
      }

      const submitBtn = screen.getByText(/proceed to checkout/i);
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const fetchCall = mockFetch.mock.calls[0];
        const formData = fetchCall[1]?.body as FormData;
        
        expect(formData.get('pickupFloors')).toBe('0');
        expect(formData.get('dropoffFloors')).toBe('0');
      });
    });

    it('should handle floors with no items', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      renderItemMovingPage();
      
      await waitFor(() => {
        expect(screen.getByText('Chair')).toBeInTheDocument();
      });

      // Set floors but no items
      fireEvent.change(screen.getByLabelText(/pickup floor/i), {
        target: { value: '2' }
      });

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });

      // Navigate and submit
      const nextBtns = screen.getAllByText('Next');
      for (let i = 0; i < 5; i++) {
        fireEvent.click(nextBtns[i]);
        await waitFor(() => {}, { timeout: 100 });
      }

      const submitBtn = screen.getByText(/proceed to checkout/i);
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const fetchCall = mockFetch.mock.calls[0];
        const formData = fetchCall[1]?.body as FormData;
        const items = JSON.parse(formData.get('items') as string);
        
        expect(items).toEqual([]);
        expect(formData.get('pickupFloors')).toBe('2');
      });
    });

    it('should handle malformed item data', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      // Mock furniture items with missing points
      vi.mocked(constants).furnitureItems = [
        { id: 'dd7e4197-677c-4ccb-8aa6-38ad40167899', name: 'Chair', points: 0, category: "Sofa's and Chairs" },
      ];

      renderItemMovingPage();
      
      await waitFor(() => {
        expect(screen.getByText('Chair')).toBeInTheDocument();
      });

      // Add item with null points
      const chairIncrementBtn = screen.getAllByText('+')[0];
      fireEvent.click(chairIncrementBtn);

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });

      // Navigate and submit
      const nextBtns = screen.getAllByText('Next');
      for (let i = 0; i < 5; i++) {
        fireEvent.click(nextBtns[i]);
        await waitFor(() => {}, { timeout: 100 });
      }

      const submitBtn = screen.getByText(/proceed to checkout/i);
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const fetchCall = mockFetch.mock.calls[0];
        const formData = fetchCall[1]?.body as FormData;
        const items = JSON.parse(formData.get('items') as string);
        
        // Should handle null points gracefully
        expect(items[0].points || 0).toBe(0);
      });
    });
  });
});
