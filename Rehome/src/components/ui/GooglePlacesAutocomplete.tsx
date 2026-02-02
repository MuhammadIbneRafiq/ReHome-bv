import React, { useState } from 'react';
import { GooglePlaceObject } from '../../utils/locationServices';
import { API_ENDPOINTS } from '../../lib/api/config';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (val: string, place?: any) => void;
  placeholder?: string;
  onPlaceSelect?: (place: GooglePlaceObject) => void;
}

export function GooglePlacesAutocomplete({ 
  value, 
  onChange, 
  placeholder,
  onPlaceSelect 
}: GooglePlacesAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Function to get place details from backend proxy (with caching)
  const getPlaceDetails = async (placeId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.PLACES.DETAILS(placeId), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        console.error('Place details API error:', response.status);
        return null;
      }
      
      const data = await response.json();
      
      if (!data.success || !data.place) {
        console.error('Place details failed:', data.error);
        return null;
      }
      
      console.log('[DEBUG] Place details from backend:', data.place);
      
      return {
        placeId: data.place.placeId,
        coordinates: data.place.coordinates,
        formattedAddress: data.place.formattedAddress,
        displayName: data.place.displayName,
        countryCode: data.place.countryCode,
        countryName: data.place.countryName,
        city: data.place.city,
        text: data.place.displayName || data.place.formattedAddress || ''
      };
    } catch (error) {
      console.error('Place details error:', error);
      return null;
    }
  };

  const searchPlaces = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      // Use backend proxy for Places API (with caching)
      const response = await fetch(API_ENDPOINTS.PLACES.AUTOCOMPLETE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          options: {
            languageCode: 'en',
            types: ['street_address', 'route', 'locality', 'postal_code']
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.suggestions) {
          const placeSuggestions = data.suggestions.map((suggestion: any) => ({
            text: suggestion.text || 'Unknown address',
            placeId: suggestion.placeId,
            mainText: suggestion.mainText,
            secondaryText: suggestion.secondaryText
          }));
            
          setSuggestions(placeSuggestions);
          setShowSuggestions(true);
        } else {
          console.error('Autocomplete failed:', data.error);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        console.error('Places API error:', response.status, response.statusText);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Places API error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = async (suggestion: any) => {
    onChange(suggestion.text);
    
    if (onPlaceSelect) {
      // Get place details with coordinates
      const placeDetails = await getPlaceDetails(suggestion.placeId);
      const placeWithDetails: GooglePlaceObject = {
        placeId: suggestion.placeId,
        coordinates: placeDetails?.coordinates || undefined,
        formattedAddress: placeDetails?.formattedAddress || undefined,
        displayName: placeDetails?.displayName || undefined,
        text: suggestion.text,
        countryCode: placeDetails?.countryCode,
        countryName: placeDetails?.countryName
      };
      onPlaceSelect(placeWithDetails);
    }
    
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Debounce the search
    const timeoutId = setTimeout(() => {
      searchPlaces(newValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder || 'Enter address'}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
      />
      
      {isLoading && (
        <div className="absolute right-2 top-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-3 cursor-pointer hover:bg-orange-50 border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start">
                <div className="text-sm text-gray-900">{suggestion.text}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
