import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ItemMovingPage from '../lib/pages/ItemMovingPage';
import * as constants from '../lib/constants';

// Mock the constants module
vi.mock('../lib/constants', () => ({
  furnitureItems: [
    { id: 'dd7e4197-677c-4ccb-8aa6-38ad40167899', name: 'Chair', points: 2, category: "Sofa's and Chairs" },
    { id: 'ca4ca126-5704-4c8b-8447-9243ae18ae47', name: '2-Seater Sofa', points: 6, category: "Sofa's and Chairs" },
    { id: 'fb6097cc-f129-43a5-9ad3-0fd7d782dc5e', name: 'Box', points: 0.5, category: 'Others' },
    { id: 'd0256ffe-c45b-4127-876f-9485d3e5680e', name: '1-Person Bed', points: 3, category: 'Bed' },
  ],
  itemCategories: ["Sofa's and Chairs", 'Bed', 'Others'],
  cityBaseCharges: {
    'Amsterdam': { normal: 119, city_day: 39, day_of_week: 1 },
    'Rotterdam': { normal: 79, city_day: 35, day_of_week: 2 },
  },
  constantsLoaded: true,
  getItemPoints: vi.fn((itemId: string) => {
    const items: Record<string, number> = {
      'dd7e4197-677c-4ccb-8aa6-38ad40167899': 2,
      'ca4ca126-5704-4c8b-8447-9243ae18ae47': 6,
      'fb6097cc-f129-43a5-9ad3-0fd7d782dc5e': 0.5,
      'd0256ffe-c45b-4127-876f-9485d3e5680e': 3,
    };
    return items[itemId] || 0;
  })
}));

// Mock the backend pricing service
vi.mock('../services/backendPricingService', () => ({
  default: {
    createTransportRequest: vi.fn().mockResolvedValue({
      success: true,
      data: { requestId: 'test-request-id' }
    })
  }
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Frontend Item Selection Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear sessionStorage
    sessionStorage.clear();
  });

  const renderItemMovingPage = () => {
    return render(
      <BrowserRouter>
        <ItemMovingPage />
      </BrowserRouter>
    );
  };

  describe('Step 1: Item Selection State Management', () => {
    it('should initialize with empty itemQuantities', () => {
      renderItemMovingPage();
      
      // Check that no items are initially selected
      expect(screen.queryByText(/Chair.*x2/)).not.toBeInTheDocument();
      expect(screen.queryByText(/2-Seater Sofa.*x1/)).not.toBeInTheDocument();
    });

    it('should update itemQuantities when items are selected', async () => {
      renderItemMovingPage();
      
      // Wait for items to load
      await waitFor(() => {
        expect(screen.getByText('Chair')).toBeInTheDocument();
      });

      // Click increment button for Chair twice
      const chairIncrementBtn = screen.getAllByText('+')[0]; // First increment button
      fireEvent.click(chairIncrementBtn);
      fireEvent.click(chairIncrementBtn);

      // Click increment button for Sofa once
      const sofaIncrementBtn = screen.getAllByText('+')[1]; // Second increment button
      fireEvent.click(sofaIncrementBtn);

      // Verify quantities are updated
      await waitFor(() => {
        expect(screen.getByText(/Chair.*x2/)).toBeInTheDocument();
        expect(screen.getByText(/2-Seater Sofa.*x1/)).toBeInTheDocument();
      });
    });

    it('should calculate total points correctly', async () => {
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

      // Total should be 10 points
      await waitFor(() => {
        expect(screen.getByText(/10.*points/)).toBeInTheDocument();
      });
    });
  });

  describe('Step 2: Item List Creation for Backend', () => {
    it('should create correct itemList structure for backend', async () => {
      renderItemMovingPage();
      
      await waitFor(() => {
        expect(screen.getByText('Chair')).toBeInTheDocument();
      });

      // Select items
      const chairIncrementBtn = screen.getAllByText('+')[0];
      fireEvent.click(chairIncrementBtn);
      fireEvent.click(chairIncrementBtn); // 2 chairs

      const sofaIncrementBtn = screen.getAllByText('+')[1];
      fireEvent.click(sofaIncrementBtn); // 1 sofa

      // Mock the console.log to capture itemList creation
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Navigate to final step to trigger itemList creation
      const nextBtns = screen.getAllByText('Next');
      for (let i = 0; i < 5; i++) {
        fireEvent.click(nextBtns[i]);
        await waitFor(() => {}, { timeout: 100 });
      }

      // Check console log for itemList structure
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('itemList:'),
        expect.arrayContaining([
          expect.objectContaining({
            id: 'dd7e4197-677c-4ccb-8aa6-38ad40167899',
            name: 'Chair',
            quantity: 2,
            points: 4 // 2 points * 2 chairs
          }),
          expect.objectContaining({
            id: 'ca4ca126-5704-4c8b-8447-9243ae18ae47',
            name: '2-Seater Sofa',
            quantity: 1,
            points: 6 // 6 points * 1 sofa
          })
        ])
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Step 3: Form Data Preparation', () => {
    it('should prepare correct FormData structure', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      renderItemMovingPage();
      
      await waitFor(() => {
        expect(screen.getByText('Chair')).toBeInTheDocument();
      });

      // Select items
      const chairIncrementBtn = screen.getAllByText('+')[0];
      fireEvent.click(chairIncrementBtn);

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: '0612345678' }
      });

      // Navigate to submit
      const nextBtns = screen.getAllByText('Next');
      for (let i = 0; i < 5; i++) {
        fireEvent.click(nextBtns[i]);
        await waitFor(() => {}, { timeout: 100 });
      }

      // Submit form
      const submitBtn = screen.getByText(/proceed to checkout/i);
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/transport/create'),
          expect.objectContaining({
            method: 'POST',
            body: expect.any(FormData)
          })
        );
      });

      // Get the FormData from the fetch call
      const fetchCall = mockFetch.mock.calls[0];
      const formData = fetchCall[1]?.body as FormData;

      // Verify FormData contains correct data
      expect(formData.get('items')).toBe(
        JSON.stringify([
          { id: 'dd7e4197-677c-4ccb-8aa6-38ad40167899', name: 'Chair', quantity: 1, points: 2 }
        ])
      );
      expect(formData.get('email')).toBe('test@example.com');
      expect(formData.get('phone')).toBe('0612345678');
    });
  });

  describe('Step 4: Add-on Services Integration', () => {
    it('should handle assembly items correctly', async () => {
      renderItemMovingPage();
      
      await waitFor(() => {
        expect(screen.getByText('Chair')).toBeInTheDocument();
      });

      // Add a bed (assembly eligible)
      const bedIncrementBtn = screen.getAllByText('+')[3]; // 1-Person Bed
      fireEvent.click(bedIncrementBtn);

      // Navigate to add-ons step
      const nextBtns = screen.getAllByText('Next');
      fireEvent.click(nextBtns[0]); // Step 1 -> 2
      fireEvent.click(nextBtns[1]); // Step 2 -> 3
      fireEvent.click(nextBtns[2]); // Step 3 -> 4 (Add-ons)

      await waitFor(() => {
        expect(screen.getByText(/assembly/i)).toBeInTheDocument();
      });

      // Enable assembly for the bed
      const assemblyCheckbox = screen.getByLabelText(/1-Person Bed/i);
      fireEvent.click(assemblyCheckbox);

      // Verify assembly is selected
      expect(assemblyCheckbox).toBeChecked();
    });

    it('should handle carrying service correctly', async () => {
      renderItemMovingPage();
      
      await waitFor(() => {
        expect(screen.getByText('Chair')).toBeInTheDocument();
      });

      // Add items
      const chairIncrementBtn = screen.getAllByText('+')[0];
      fireEvent.click(chairIncrementBtn);

      // Set floors
      fireEvent.change(screen.getByLabelText(/pickup floor/i), {
        target: { value: '2' }
      });

      // Navigate to add-ons step
      const nextBtns = screen.getAllByText('Next');
      fireEvent.click(nextBtns[0]);
      fireEvent.click(nextBtns[1]);
      fireEvent.click(nextBtns[2]);

      await waitFor(() => {
        expect(screen.getByText(/carrying/i)).toBeInTheDocument();
      });

      // Enable carrying service
      const carryingCheckbox = screen.getByLabelText(/carrying service/i);
      fireEvent.click(carryingCheckbox);

      // Verify carrying is selected
      expect(carryingCheckbox).toBeChecked();
    });
  });

  describe('Step 5: Error Handling', () => {
    it('should handle missing furniture items gracefully', async () => {
      // Mock empty furniture items
      vi.mocked(constants).furnitureItems = [];

      renderItemMovingPage();
      
      // Should show loading state initially
      expect(screen.getByText(/loading furniture data/i)).toBeInTheDocument();
    });

    it('should handle API errors during submission', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new Error('Network error'));

      renderItemMovingPage();
      
      await waitFor(() => {
        expect(screen.getByText('Chair')).toBeInTheDocument();
      });

      // Fill minimal required fields
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });

      // Navigate to submit
      const nextBtns = screen.getAllByText('Next');
      for (let i = 0; i < 5; i++) {
        fireEvent.click(nextBtns[i]);
        await waitFor(() => {}, { timeout: 100 });
      }

      // Submit form
      const submitBtn = screen.getByText(/proceed to checkout/i);
      fireEvent.click(submitBtn);

      // Should handle error gracefully
      await waitFor(() => {
        expect(screen.getByText(/error occurred while submitting/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step 6: Data Flow Verification', () => {
    it('should maintain data consistency across steps', async () => {
      renderItemMovingPage();
      
      await waitFor(() => {
        expect(screen.getByText('Chair')).toBeInTheDocument();
      });

      // Add items
      const chairIncrementBtn = screen.getAllByText('+')[0];
      fireEvent.click(chairIncrementBtn);
      fireEvent.click(chairIncrementBtn); // 2 chairs

      // Navigate through all steps
      const nextBtns = screen.getAllByText('Next');
      for (let i = 0; i < 5; i++) {
        fireEvent.click(nextBtns[i]);
        await waitFor(() => {}, { timeout: 100 });
        
        // Verify items are still shown in overview
        if (i === 4) { // Final step
          expect(screen.getByText(/Chair.*x2/)).toBeInTheDocument();
          expect(screen.getByText(/4.*points/)).toBeInTheDocument();
        }
      }

      // Go back to items step
      const prevBtn = screen.getByText(/previous/i);
      fireEvent.click(prevBtn);

      // Verify quantities are preserved
      await waitFor(() => {
        expect(screen.getByText(/Chair.*x2/)).toBeInTheDocument();
      });
    });
  });
});
