import React, { useState } from 'react';
import { GooglePlaceObject } from '../../utils/locationServices';

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
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API;

  // Function to get place details including coordinates from placeId
  const getPlaceDetails = async (placeId: string) => {
    const response = await fetch(
      'https://places.googleapis.com/v1/places/' + placeId,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'location,displayName,formattedAddress,addressComponents'
        }
      }
    );
    const data = await response.json();
    
    console.log('[DEBUG] Google Places API response:', JSON.stringify(data, null, 2));
    console.log('[DEBUG] addressComponents:', data.addressComponents);
    
    const countryComponent = data.addressComponents?.find(
      (comp: any) => comp.types?.includes('country')
    );
    // Extract city from locality or administrative_area_level_2
    const cityComponent = data.addressComponents?.find(
      (comp: any) => comp.types?.includes('locality') || comp.types?.includes('administrative_area_level_2')
    );
    
    const extractedCity = cityComponent?.longText || cityComponent?.long_name || cityComponent?.shortText || cityComponent?.short_name;
    console.log('[DEBUG] Extracted city from Google Places:', extractedCity);
    console.log('[DEBUG] cityComponent:', cityComponent);
    
    return {
      placeId,
      coordinates: data.location ? {
        lat: data.location.latitude,
        lng: data.location.longitude
      } : null,
      formattedAddress: data.formattedAddress,
      displayName: data.displayName?.text,
      countryCode: countryComponent?.shortText || countryComponent?.short_name,
      countryName: countryComponent?.longText || countryComponent?.long_name,
      city: extractedCity
    };
  };

  const searchPlaces = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      // Use the new Places API v1 autocomplete endpoint
      const response = await fetch(
        'https://places.googleapis.com/v1/places:autocomplete',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.placeId'
          },
          body: JSON.stringify({
            input: query,
            languageCode: 'en',
            includedPrimaryTypes: ['geocode', 'establishment', 'street_address']
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.suggestions) {
          const placeSuggestions = data.suggestions
            .filter((suggestion: any) => suggestion.placePrediction)
            .map((suggestion: any) => ({
              text: suggestion.placePrediction.text?.text || 'Unknown address',
              placeId: suggestion.placePrediction.placeId,
              structuredFormat: suggestion.placePrediction.structuredFormat
            }));
            
          setSuggestions(placeSuggestions);
          setShowSuggestions(true);
        }
      } else {
        console.error('Places API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Places API error:', error);
      // Fallback to simple input
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
