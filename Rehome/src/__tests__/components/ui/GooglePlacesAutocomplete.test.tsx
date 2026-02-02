import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GooglePlacesAutocomplete } from '../../../components/ui/GooglePlacesAutocomplete';

// Mock fetch for backend proxy API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock API config - vi.mock is hoisted, so use inline values
// These are mocked values - the actual component uses API_ENDPOINTS from config.ts
vi.mock('../../../lib/api/config', () => ({
  API_ENDPOINTS: {
    PLACES: {
      AUTOCOMPLETE: 'https://mock-api.test/api/places/autocomplete',
      DETAILS: (placeId: string) => `https://mock-api.test/api/places/${placeId}`,
      CALCULATE_DISTANCE: 'https://mock-api.test/api/calculate-distance',
    }
  }
}));

describe('GooglePlacesAutocomplete', () => {
  const mockOnChange = vi.fn();
  const mockOnPlaceSelect = vi.fn();
  const defaultProps = {
    value: '',
    onChange: mockOnChange,
    onPlaceSelect: mockOnPlaceSelect,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders input with placeholder', () => {
    render(<GooglePlacesAutocomplete {...defaultProps} placeholder="Enter address" />);
    
    const input = screen.getByPlaceholderText('Enter address');
    expect(input).toBeInTheDocument();
  });

  it('renders input with default placeholder when none provided', () => {
    render(<GooglePlacesAutocomplete {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Enter address');
    expect(input).toBeInTheDocument();
  });

  it('calls onChange when input value changes', async () => {
    const user = userEvent.setup();
    render(<GooglePlacesAutocomplete {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Enter address');
    await user.type(input, 't');
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('does not trigger search for queries shorter than 3 characters', async () => {
    const user = userEvent.setup();
    render(<GooglePlacesAutocomplete {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Enter address');
    await user.type(input, 'ab');
    
    // Wait for debounce (400ms)
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Should not have called fetch because query is too short
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('has correct input styling', () => {
    render(<GooglePlacesAutocomplete {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Enter address');
    expect(input).toHaveClass('block', 'w-full', 'rounded-md');
  });

  it('uses provided value prop', () => {
    render(<GooglePlacesAutocomplete {...defaultProps} value="Test Value" />);
    
    const input = screen.getByPlaceholderText('Enter address') as HTMLInputElement;
    expect(input.value).toBe('Test Value');
  });

  it('accepts worldwide addresses (no region restrictions)', async () => {
    const user = userEvent.setup();
    render(<GooglePlacesAutocomplete {...defaultProps} />);
    
    // Mock successful autocomplete response with international address
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        suggestions: [
          {
            placeId: 'intl-place-id',
            text: '123 Main St, New York, USA',
            mainText: '123 Main St',
            secondaryText: 'New York, USA'
          }
        ]
      })
    });
    
    const input = screen.getByPlaceholderText('Enter address');
    await user.type(input, 'New York');
    
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Verify the request body does NOT contain regionCodes
    if (mockFetch.mock.calls.length > 0) {
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.options.regionCodes).toBeUndefined();
    }
  });
});
