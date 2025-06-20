import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string, suggestion?: LocationSuggestion) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  countryCode?: string; // e.g., 'nl' for Netherlands
  label?: string;
  error?: string;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Enter address...",
  className = "",
  required = false,
  countryCode = 'nl', // Default to Netherlands
  label,
  error
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const [isSelecting, setIsSelecting] = useState(false);

  // Debounced search function
  const searchLocations = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    
    try {
      let data: LocationSuggestion[] = [];
      
      // 1. Primary option: Hardcoded Dutch cities (most reliable for Netherlands)
          const dutchCities = [
            'Amsterdam', 'Rotterdam', 'Den Haag', 'Utrecht', 'Eindhoven', 
            'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen',
            'Enschede', 'Haarlem', 'Arnhem', 'Zaanstad', 'Amersfoort',
            'Apeldoorn', 'Hoofddorp', 'Maastricht', 'Leiden', 'Dordrecht',
            'Zoetermeer', 'Zwolle', 'Deventer', 'Delft', 'Alkmaar',
            'Leeuwarden', 'Helmond', 'Venlo', 'Oss', 'Roosendaal',
            'Geldrop', 'Mierlo', 'Emmen', 'Hilversum', 'Kampen',
            'Gouda', 'Purmerend', 'Vlaardingen', 'Alphen aan den Rijn',
        'Spijkenisse', 'Hoorn', 'Ede', 'Leidschendam', 'Woerden',
        'Schiedam', 'Lelystad', 'Tiel', 'Barneveld', 'Veenendaal',
        'Doetinchem', 'Almelo', 'Nieuwegein', 'Zeist'
      ];
      
      const cityMatches = dutchCities
        .filter(city => 
          city.toLowerCase().startsWith(query.toLowerCase()) ||
          city.toLowerCase().includes(query.toLowerCase())
        )
        .sort((a, b) => {
          // Prioritize starts-with matches
          const aStarts = a.toLowerCase().startsWith(query.toLowerCase());
          const bStarts = b.toLowerCase().startsWith(query.toLowerCase());
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return a.length - b.length; // Then sort by length
        })
            .slice(0, 5)
            .map(city => ({
              display_name: `${city}, Netherlands`,
              lat: '52.0', // Approximate center of Netherlands
              lon: '5.0',
              place_id: city.toLowerCase(),
              address: {
                city: city,
                country: 'Netherlands'
              }
            }));
          
      if (cityMatches.length > 0) {
        data = cityMatches;
        console.log('✅ Dutch cities success:', data.length, 'matches');
      } else {
        // 2. Try OpenWeather API first
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
        if (apiKey && apiKey !== 'demo' && apiKey !== '') {
          try {
            console.log('🌐 Trying OpenWeather API...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(
              `https://api.openweathermap.org/geo/1.0/direct?` +
              `q=${encodeURIComponent(query)},${countryCode.toUpperCase()}&` +
              `limit=5&` +
              `appid=${apiKey}`,
              {
                signal: controller.signal,
                headers: {
                  'Accept': 'application/json'
                }
              }
            );
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const openWeatherData = await response.json();
              if (openWeatherData && openWeatherData.length > 0) {
                // Convert OpenWeather format to our LocationSuggestion format
                data = openWeatherData.map((item: any) => ({
                  display_name: `${item.name}${item.state ? `, ${item.state}` : ''}, ${item.country}`,
                  lat: item.lat.toString(),
                  lon: item.lon.toString(),
                  place_id: `openweather_${item.lat}_${item.lon}`,
                  address: {
                    city: item.name,
                    country: item.country
                  }
                }));
                console.log('✅ OpenWeather success:', data.length, 'results');
              }
            }
          } catch (openWeatherError: any) {
            console.log('⚠️ OpenWeather API failed:', openWeatherError.message);
          }
        }
        
        // 3. Fallback: Try Nominatim if OpenWeather didn't work
        if (data.length === 0) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const nominatimUrl = `https://nominatim.openstreetmap.org/search?` +
              `q=${encodeURIComponent(query)}&` +
              `countrycodes=${countryCode}&` +
              `format=json&` +
              `addressdetails=1&` +
              `limit=5&` +
              `dedupe=1`;
            
            const response = await fetch(nominatimUrl, {
              signal: controller.signal,
              headers: {
                'User-Agent': 'ReHome-Location-Search/1.0'
              }
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const nominatimData = await response.json();
              if (nominatimData.length > 0) {
                data = nominatimData;
                console.log('✅ Nominatim fallback success:', data.length, 'results');
              }
            }
          } catch (nominatimError: any) {
            console.log('⚠️ Nominatim fallback failed:', nominatimError.message);
          }
        }
      }
      
      setSuggestions(data);
      // Only show suggestions if we're not in the middle of selecting and input is focused
      if (data.length > 0 && !isSelecting && document.activeElement === inputRef.current) {
        setShowSuggestions(true);
      }
      
    } catch (error) {
      console.error('💥 All location APIs failed:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, [countryCode, isSelecting]);

  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Don't search if we're in the middle of selecting
    if (isSelecting) {
      return;
    }

    // Set new timeout for debounced search
    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        searchLocations(value);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
            }, 200); // 200ms debounce - faster response

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, searchLocations, isSelecting]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setIsSelecting(false); // Reset selecting state when typing
    onChange(newValue);
    setActiveSuggestion(-1);
    
    // If user is typing and we have suggestions, show them
    if (newValue.length >= 3 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    // Immediately update the input value and close dropdown
    onChange(suggestion.display_name, suggestion);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    setSuggestions([]);
    setIsSelecting(true);
    
    // Reset selecting state quickly to allow new searches
    setTimeout(() => {
      setIsSelecting(false);
    }, 100);
    
    // Remove focus from input to prevent immediate reopening
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestion(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestion >= 0) {
          handleSuggestionClick(suggestions[activeSuggestion]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestion(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
      setIsSelecting(false);
    }, 150);
  };

  const handleFocus = () => {
    setIsSelecting(false); // Reset selecting state when focusing
    setActiveSuggestion(-1); // Reset active suggestion
    
    // Only show suggestions if we have a value and recent suggestions
    if (value.length >= 3 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const formatSuggestion = (suggestion: LocationSuggestion) => {
    const { address } = suggestion;
    const parts = [];
    
    if (address.house_number && address.road) {
      parts.push(`${address.road} ${address.house_number}`);
    } else if (address.road) {
      parts.push(address.road);
    }
    
    if (address.city) {
      parts.push(address.city);
    }
    
    if (address.postcode) {
      parts.push(address.postcode);
    }
    
    return parts.length > 0 ? parts.join(', ') : suggestion.display_name;
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaMapMarkerAlt className="h-4 w-4 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          className={`
            block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md 
            focus:ring-orange-500 focus:border-orange-500 sm:text-sm
            ${error ? 'border-red-300' : ''}
            ${className}
          `}
          autoComplete="off"
        />
        
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-[9999] max-h-60 overflow-y-auto"
          style={{ zIndex: 9999 }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              className={`px-4 py-3 cursor-pointer hover:bg-orange-50 border-b border-gray-100 last:border-b-0 ${
                index === activeSuggestion ? 'bg-orange-100' : ''
              }`}
              onClick={(e) => {
                e.preventDefault();
                handleSuggestionClick(suggestion);
              }}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent input blur when clicking suggestion
              }}
              onMouseEnter={() => setActiveSuggestion(index)}
            >
              <div className="flex items-start">
                <FaMapMarkerAlt className="text-orange-500 mr-3 mt-1 flex-shrink-0" size={12} />
                <div className="flex-grow min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {formatSuggestion(suggestion)}
                  </div>
                  {suggestion.address.country && (
                    <div className="text-xs text-gray-500 mt-1">
                      {suggestion.address.country}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search tips */}
      <div className="mt-1 text-xs text-gray-500">
        💡 Start typing street name, city, or postal code
      </div>
    </div>
  );
};

export default LocationAutocomplete; 