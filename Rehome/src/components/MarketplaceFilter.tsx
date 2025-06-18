import React, { useState, useEffect } from 'react';
import LocationAutocomplete from './ui/LocationAutocomplete';
// import { useTranslation } from 'react-i18next';
// import { FaFilter } from 'react-icons/fa';

interface FilterProps {
  items: any[];
  onFilterChange: (filteredItems: any[]) => void;
}

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
}

interface LocationCache {
  [key: string]: {
    lat: number;
    lon: number;
    postcode?: string;
    city?: string;
    verified: boolean;
  };
}

const MarketplaceFilter: React.FC<FilterProps> = ({ items, onFilterChange }) => {
  // const { t } = useTranslation();
  
  // Extract unique cities from items (keeping for potential future use)
  const [_, setCities] = useState<string[]>([]);
  // Track min and max prices
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  // Track selected filters
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<[number, number]>([0, 1000]);
  const [showRehomeOnly, setShowRehomeOnly] = useState(false);
  // Toggle for filter visibility
  // const [isFilterOpen, setIsFilterOpen] = useState(false);
  // Selected category
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  // Condition filter
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  // Distance filter with location autocomplete
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedLocationCoords, setSelectedLocationCoords] = useState<{lat: number, lon: number} | null>(null);
  const [distance, setDistance] = useState<number>(0);
  // Location cache to avoid repeated API calls
  const [locationCache, setLocationCache] = useState<LocationCache>({});
  // Loading state for location operations
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  // Flexible moving date filters
  const [allowFlexibleDate, setAllowFlexibleDate] = useState(false);
  const [rehomeSuggestDate, setRehomeSuggestDate] = useState(false);
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({start: '', end: ''});
  // Pricing type filter
  const [selectedPricingType, setSelectedPricingType] = useState<string>('');
  
  // Main categories and subcategories based on requirements
  const categories = [
    { 
      name: 'Bathroom Furniture', 
      subcategories: [] 
    },
    { 
      name: 'Sofa\'s and Chairs', 
      subcategories: [
        'Sofa',
        'Armchairs',
        'Office Chair/ Bureuaustoel',
        'Chairs',
        'Kussens'
      ] 
    },
    { 
      name: 'Kasten', 
      subcategories: [
        'Closet (Kleidingkast)',
        'Bookcase (Boekenkast)',
        'Drawer/ Dressoir',
        'TV Tables'
      ] 
    },
    { 
      name: 'Bedroom', 
      subcategories: [] 
    },
    { 
      name: 'Tables', 
      subcategories: [
        'Office Table (Bureau)',
        'Dining Table',
        'Sidetables',
        'Coffee Table'
      ] 
    },
    { 
      name: 'Appliances', 
      subcategories: [
        'Washing Machine',
        'Fridge',
        'Freezer',
        'Others'
      ] 
    },
    { 
      name: 'Mirrors', 
      subcategories: [] 
    },
    { 
      name: 'Lamps', 
      subcategories: [] 
    },
    { 
      name: 'Carpets', 
      subcategories: [] 
    },
    { 
      name: 'Curtains', 
      subcategories: [] 
    },
    { 
      name: 'Plants', 
      subcategories: [] 
    },
    { 
      name: 'Vazes', 
      subcategories: [] 
    },
    { 
      name: 'Kitchen equipment', 
      subcategories: [] 
    },
    { 
      name: 'Others', 
      subcategories: [] 
    }
  ];
  
  // Condition options as per requirements
  const conditions = [
    { value: '1', label: 'Like New - Almost no signs of use, very well maintained' },
    { value: '2', label: 'Excellent - Minimal wear, barely noticeable imperfections' },
    { value: '3', label: 'Good - Visible signs of wear (scratches, small dents), but fully functional' },
    { value: '4', label: 'Fair - Heavily used with noticeable wear, may need minor repairs' },
    { value: '5', label: 'Poor/Broken - Significant damage or functional issues, may require major repairs' }
  ];

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };

  // Enhanced function to get and verify location coordinates with location codes
  const getVerifiedLocationCoordinates = async (
    locationName: string, 
    postcode?: string
  ): Promise<{lat: number, lon: number, verified: boolean, city?: string, postcode?: string} | null> => {
    // Check cache first
    const cacheKey = `${locationName}${postcode ? `_${postcode}` : ''}`;
    if (locationCache[cacheKey]) {
      return locationCache[cacheKey];
    }

    try {
      // Build search query with location name and optional postcode
      let searchQuery = locationName;
      if (postcode) {
        searchQuery = `${postcode} ${locationName}`;
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(searchQuery)}&` +
        `countrycodes=nl&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=3`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          // Find the best match
          let bestMatch = data[0];
          
          // If we have a postcode, prioritize results that match it
          if (postcode) {
            const postcodeMatch = data.find((result: any) => 
              result.address?.postcode === postcode
            );
            if (postcodeMatch) {
              bestMatch = postcodeMatch;
            }
          }

          // Verify the location by doing a reverse lookup
          const verifiedResult = await verifyLocationWithReverseLookup(
            parseFloat(bestMatch.lat),
            parseFloat(bestMatch.lon),
            locationName,
            postcode
          );

          const result = {
            lat: parseFloat(bestMatch.lat),
            lon: parseFloat(bestMatch.lon),
            verified: verifiedResult.verified,
            city: bestMatch.address?.city || bestMatch.address?.town || bestMatch.address?.village,
            postcode: bestMatch.address?.postcode
          };

          // Cache the result
          setLocationCache(prev => ({
            ...prev,
            [cacheKey]: result
          }));

          return result;
        }
      }
    } catch (error) {
      console.error('Error fetching coordinates:', error);
    }
    return null;
  };

  // Verify location with reverse lookup to double-check accuracy
  const verifyLocationWithReverseLookup = async (
    lat: number, 
    lon: number, 
    originalLocation: string, 
    originalPostcode?: string
  ): Promise<{verified: boolean, confidence: number}> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
        `lat=${lat}&` +
        `lon=${lon}&` +
        `format=json&` +
        `addressdetails=1`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.address) {
          let confidence = 0;
          let verified = false;

          // Check city/town match
          const reversedCity = data.address.city || data.address.town || data.address.village || '';
          if (reversedCity.toLowerCase().includes(originalLocation.toLowerCase()) ||
              originalLocation.toLowerCase().includes(reversedCity.toLowerCase())) {
            confidence += 50;
          }

          // Check postcode match if provided
          if (originalPostcode && data.address.postcode) {
            if (data.address.postcode === originalPostcode) {
              confidence += 50;
            } else if (data.address.postcode.substring(0, 4) === originalPostcode.substring(0, 4)) {
              confidence += 25; // Partial postcode match
            }
          }

          // Consider verified if confidence is above threshold
          verified = confidence >= 50;

          return { verified, confidence };
        }
      }
    } catch (error) {
      console.error('Error in reverse lookup:', error);
    }

    return { verified: false, confidence: 0 };
  };

  // Enhanced location change handler with verification
  const handleLocationChange = async (value: string, suggestion?: LocationSuggestion) => {
    setSelectedLocation(value);
    setIsLocationLoading(true);

    if (suggestion) {
      // Verify the suggestion with reverse lookup
      const verification = await verifyLocationWithReverseLookup(
        parseFloat(suggestion.lat),
        parseFloat(suggestion.lon),
        value,
        suggestion.address?.postcode
      );

      setSelectedLocationCoords({
        lat: parseFloat(suggestion.lat),
        lon: parseFloat(suggestion.lon)
      });

      console.log(`Location verification: ${verification.verified ? 'Verified' : 'Unverified'} (${verification.confidence}% confidence)`);
    } else if (value === '') {
      setSelectedLocationCoords(null);
    } else if (value.length > 2) {
      // Try to get coordinates for manually typed location
      const coords = await getVerifiedLocationCoordinates(value);
      if (coords) {
        setSelectedLocationCoords({ lat: coords.lat, lon: coords.lon });
        console.log(`Manual location verification: ${coords.verified ? 'Verified' : 'Unverified'}`);
      }
    }

    setIsLocationLoading(false);
  };

  // Analyze data to set up filter options
  useEffect(() => {
    if (items && items.length > 0) {
      // Extract unique cities
      const uniqueCities = [...new Set(items.map(item => item.city_name).filter(Boolean))];
      setCities(uniqueCities);
      
      // Find min and max prices - FIXED: Include free items (price = 0)
      const prices = items.map(item => {
        const price = item.price;
        // Include 0 (free items), exclude null/undefined
        return (price !== null && price !== undefined) ? price : null;
      }).filter(price => price !== null);
      
      if (prices.length > 0) {
        const minPrice = Math.floor(Math.min(...prices));
        const maxPrice = Math.ceil(Math.max(...prices));
        setPriceRange([minPrice, maxPrice]);
        setSelectedPriceRange([minPrice, maxPrice]);
      } else {
        // Fallback if no valid prices
        setPriceRange([0, 1000]);
        setSelectedPriceRange([0, 1000]);
      }
    }
  }, [items]);

  // Enhanced apply filters with better location handling
  const applyFilters = async () => {
    let filteredItems = [...items];
    
    // Filter by city if any selected
    if (selectedCities.length > 0) {
      filteredItems = filteredItems.filter(item => 
        item.city_name && selectedCities.includes(item.city_name)
      );
    }
    
    // Filter by price range - FIXED: Handle free items and null prices properly
    filteredItems = filteredItems.filter(item => {
      const price = item.price;
      // Handle null/undefined prices (skip them) and include free items (price = 0)
      if (price === null || price === undefined) return true; // Don't filter out items without prices
      return price >= selectedPriceRange[0] && price <= selectedPriceRange[1];
    });
    
    // Filter by category
    if (selectedCategory) {
      filteredItems = filteredItems.filter(item => 
        item.category === selectedCategory
      );
      
      // Filter by subcategory if selected
      if (selectedSubCategory) {
        filteredItems = filteredItems.filter(item => 
          item.subcategory === selectedSubCategory
        );
      }
    }
    
    // Filter by condition
    if (selectedCondition) {
      filteredItems = filteredItems.filter(item => 
        item.condition === selectedCondition
      );
    }
    
    // Filter by pricing type
    if (selectedPricingType) {
      filteredItems = filteredItems.filter(item => 
        item.pricing_type === selectedPricingType
      );
    }
    
    // Filter by ReHome only
    if (showRehomeOnly) {
      filteredItems = filteredItems.filter(item => item.isrehome === true);
    }
    
    // Filter by flexible moving date options
    if (allowFlexibleDate || rehomeSuggestDate || (dateRange.start && dateRange.end)) {
      filteredItems = filteredItems.map(item => {
        let updatedItem = { ...item };
        
        // If customer is flexible with dates, apply base charge pricing
        if (rehomeSuggestDate || (dateRange.start && dateRange.end)) {
          // Use base charge instead of regular price for flexible dates
          updatedItem.originalPrice = item.price;
          updatedItem.price = item.baseCharge || item.base_charge || item.price;
          updatedItem.isFlexiblePricing = true;
          updatedItem.flexibleDateInfo = rehomeSuggestDate 
            ? 'ReHome will suggest optimal moving date for best pricing'
            : `Flexible dates: ${dateRange.start} to ${dateRange.end}`;
        }
        
        return updatedItem;
      });
    }
    
    // Filter by selected location (city-based filtering)
    if (selectedLocation && selectedLocation.trim() !== '') {
      filteredItems = filteredItems.filter(item => {
        if (!item.city_name) return false; // Keep this - items without city should be filtered
        
        // Check if the item's city matches the selected location
        const itemCity = item.city_name.toLowerCase().trim();
        const selectedCity = selectedLocation.toLowerCase().trim();
        
        // Match exact city name or if the selected location contains the city name
        return itemCity.includes(selectedCity) || selectedCity.includes(itemCity);
      });
    }
    
    // Enhanced distance filtering (only if distance is set)
    if (selectedLocationCoords && distance > 0) {
      setIsLocationLoading(true);
      
      const itemsWithDistance = await Promise.all(
        filteredItems.map(async (item) => {
          if (item.city_name) {
            // Try to get verified coordinates for the item's location
            // Include postcode if available in item data
            const itemPostcode = item.postcode || item.postal_code || item.zip_code;
            const itemCoords = await getVerifiedLocationCoordinates(item.city_name, itemPostcode);
            
            if (itemCoords && itemCoords.verified) {
              const itemDistance = calculateDistance(
                selectedLocationCoords.lat,
                selectedLocationCoords.lon,
                itemCoords.lat,
                itemCoords.lon
              );
              return { ...item, distance: itemDistance, locationVerified: true };
            } else if (itemCoords) {
              // Use unverified coordinates but mark as such
              const itemDistance = calculateDistance(
                selectedLocationCoords.lat,
                selectedLocationCoords.lon,
                itemCoords.lat,
                itemCoords.lon
              );
              return { ...item, distance: itemDistance, locationVerified: false };
            }
          }
          return { ...item, distance: Infinity, locationVerified: false };
        })
      );
      
      // Filter by distance, prioritizing verified locations
      filteredItems = itemsWithDistance
        .filter(item => item.distance <= distance)
        .sort((a, b) => {
          // Sort by location verification first, then by distance
          if (a.locationVerified && !b.locationVerified) return -1;
          if (!a.locationVerified && b.locationVerified) return 1;
          return a.distance - b.distance;
        });
      
      setIsLocationLoading(false);
    }
    
    onFilterChange(filteredItems);
  };

  // Enhanced reset filters
  const resetFilters = () => {
    setSelectedCities([]);
    setSelectedPriceRange(priceRange);
    setShowRehomeOnly(false);
    setSelectedCategory('');
    setSelectedSubCategory('');
    setSelectedCondition('');
    setSelectedLocation('');
    setSelectedLocationCoords(null);
    setDistance(0);
    setLocationCache({}); // Clear location cache
    setIsLocationLoading(false);
    // Reset flexible date filters
    setAllowFlexibleDate(false);
    setRehomeSuggestDate(false);
    setDateRange({start: '', end: ''});
    setSelectedPricingType('');
    onFilterChange(items); // Reset to original items
  };

  // Handle price range change
  const handlePriceChange = (min: number, max: number) => {
    setSelectedPriceRange([min, max]);
  };

  // Toggle filter visibility
  // const toggleFilter = () => {
  //   setIsFilterOpen(!isFilterOpen);
  // };
  
  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setSelectedSubCategory(''); // Reset subcategory when category changes
  };

  // Apply filters when any filter changes
  useEffect(() => {
    applyFilters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCities, selectedPriceRange, selectedCategory, selectedSubCategory, selectedCondition, selectedPricingType, showRehomeOnly, selectedLocationCoords, selectedLocation, distance, allowFlexibleDate, rehomeSuggestDate, dateRange]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mt-4 relative">
      <h2 className="text-lg font-semibold mb-2">Filters</h2>
      
      {/* Filters Content */}
      <div className="space-y-4 relative">
        {/* Category Selection */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category selection
          </label>
          <div className="space-y-2">
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
              value={selectedCategory}
              onChange={handleCategoryChange}
              style={{ position: 'relative', zIndex: 5 }}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            
            {selectedCategory && categories.find(c => c.name === selectedCategory)?.subcategories && categories.find(c => c.name === selectedCategory)!.subcategories.length > 0 && (
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                style={{ position: 'relative', zIndex: 5 }}
              >
                <option value="">All {selectedCategory}</option>
                {categories
                  .find(c => c.name === selectedCategory)
                  ?.subcategories.map(sub => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>
        
        {/* Price Range Filter */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price filter
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={selectedPriceRange[0]}
              onChange={(e) => handlePriceChange(Number(e.target.value), selectedPriceRange[1])}
              className="mt-1 block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
              min={priceRange[0]}
              max={selectedPriceRange[1]}
              placeholder="Min price"
            />
            <input
              type="number"
              value={selectedPriceRange[1]}
              onChange={(e) => handlePriceChange(selectedPriceRange[0], Number(e.target.value))}
              className="mt-1 block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
              min={selectedPriceRange[0]}
              max={priceRange[1]}
              placeholder="Max price"
            />
          </div>
        </div>
        
        {/* Distance Filter with Enhanced Location Autocomplete */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Distance filter
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Enter a city or address with postal code for better accuracy
          </p>
          <div className="space-y-2">
            <div className="relative z-20">
              <LocationAutocomplete
                value={selectedLocation}
                onChange={handleLocationChange}
                placeholder="Enter city, postal code, or address"
                countryCode="nl"
                className="w-full"
              />
              {isLocationLoading && (
                <div className="absolute right-2 top-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                </div>
              )}
            </div>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border relative z-10"
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              disabled={!selectedLocationCoords || isLocationLoading}
              style={{ position: 'relative', zIndex: 10 }}
            >
              <option value="0">Select range</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="100">Within 100 km</option>
            </select>
          </div>
          {selectedLocationCoords && distance > 0 && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Showing verified items within {distance}km of {selectedLocation}
            </p>
          )}
          {selectedLocationCoords && distance > 0 && (
            <p className="text-xs text-blue-500 mt-1">
              📍 Location coordinates verified with OpenStreetMap
            </p>
          )}
        </div>
        
        {/* Condition Filter */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Condition filter
          </label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            style={{ position: 'relative', zIndex: 5 }}
          >
            <option value="">Any condition</option>
            {conditions.map(condition => (
              <option key={condition.value} value={condition.value}>
                {condition.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Pricing Type Filter */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pricing type filter
          </label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
            value={selectedPricingType}
            onChange={(e) => setSelectedPricingType(e.target.value)}
            style={{ position: 'relative', zIndex: 5 }}
          >
            <option value="">All pricing types</option>
            <option value="fixed">Fixed Price</option>
            <option value="bidding">Bidding/Auction</option>
            <option value="negotiable">Price Negotiable</option>
            <option value="free">Free</option>
          </select>
        </div>
        
        {/* Flexible Moving Date Filter */}
        <div className="relative">
          
          <div className="space-y-3">
            {/* ReHome Suggest Date Option */}
            
            
            {/* Date Range Option */}
            <div className="space-y-2">

              
              {allowFlexibleDate && !rehomeSuggestDate && (
                <div className="ml-6 space-y-2">
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">From</label>
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm p-2 border"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">To</label>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm p-2 border"
                        min={dateRange.start || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {(rehomeSuggestDate || (dateRange.start && dateRange.end)) && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
              <p className="text-xs text-green-800">
                💰 <strong>Base charge pricing active!</strong> You'll see reduced prices for items with flexible moving dates.
              </p>
            </div>
          )}
        </div>
        
        {/* ReHome Listings Only */}
        <div className="relative">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rehome-only"
              checked={showRehomeOnly}
              onChange={(e) => setShowRehomeOnly(e.target.checked)}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="rehome-only" className="ml-2 block text-sm text-gray-700">
              ReHome Listings Only
            </label>
          </div>
        </div>
        
        {/* Reset Filters Button */}
        <button
          onClick={resetFilters}
          className="mt-4 w-full bg-gray-100 text-gray-800 py-2 px-4 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default MarketplaceFilter; 