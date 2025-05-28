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

  // Get coordinates for a city/location using OpenStreetMap Nominatim
  const getLocationCoordinates = async (locationName: string): Promise<{lat: number, lon: number} | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(locationName)}&` +
        `countrycodes=nl&` +
        `format=json&` +
        `limit=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon)
          };
        }
      }
    } catch (error) {
      console.error('Error fetching coordinates:', error);
    }
    return null;
  };

  // Handle location selection from autocomplete
  const handleLocationChange = (value: string, suggestion?: LocationSuggestion) => {
    setSelectedLocation(value);
    if (suggestion) {
      setSelectedLocationCoords({
        lat: parseFloat(suggestion.lat),
        lon: parseFloat(suggestion.lon)
      });
    } else if (value === '') {
      setSelectedLocationCoords(null);
    }
  };

  // Analyze data to set up filter options
  useEffect(() => {
    if (items && items.length > 0) {
      // Extract unique cities
      const uniqueCities = [...new Set(items.map(item => item.city_name).filter(Boolean))];
      setCities(uniqueCities);
      
      // Find min and max prices
      const prices = items.map(item => item.price).filter(Boolean);
      const minPrice = Math.floor(Math.min(...prices));
      const maxPrice = Math.ceil(Math.max(...prices));
      setPriceRange([minPrice, maxPrice]);
      setSelectedPriceRange([minPrice, maxPrice]);
    }
  }, [items]);

  // Apply filters
  const applyFilters = async () => {
    let filteredItems = [...items];
    
    // Filter by city if any selected
    if (selectedCities.length > 0) {
      filteredItems = filteredItems.filter(item => 
        item.city_name && selectedCities.includes(item.city_name)
      );
    }
    
    // Filter by price range
    filteredItems = filteredItems.filter(item => 
      item.price >= selectedPriceRange[0] && item.price <= selectedPriceRange[1]
    );
    
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
    
    // Filter by ReHome only
    if (showRehomeOnly) {
      filteredItems = filteredItems.filter(item => item.isrehome === true);
    }
    
    // Filter by distance if location and distance are selected
    if (selectedLocationCoords && distance > 0) {
      const itemsWithDistance = await Promise.all(
        filteredItems.map(async (item) => {
          if (item.city_name) {
            // Try to get coordinates for the item's location
            const itemCoords = await getLocationCoordinates(item.city_name);
            if (itemCoords) {
              const itemDistance = calculateDistance(
                selectedLocationCoords.lat,
                selectedLocationCoords.lon,
                itemCoords.lat,
                itemCoords.lon
              );
              return { ...item, distance: itemDistance };
            }
          }
          return { ...item, distance: Infinity };
        })
      );
      
      filteredItems = itemsWithDistance.filter(item => item.distance <= distance);
    }
    
    onFilterChange(filteredItems);
  };

  // Reset filters
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
  }, [selectedCities, selectedPriceRange, selectedCategory, selectedSubCategory, selectedCondition, showRehomeOnly, selectedLocationCoords, distance]);

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
        
        {/* Distance Filter with Location Autocomplete */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Distance filter
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Enter a city or address and select the range to find items nearby
          </p>
          <div className="space-y-2">
            <div className="relative z-20">
              <LocationAutocomplete
                value={selectedLocation}
                onChange={handleLocationChange}
                placeholder="Enter city or address"
                countryCode="nl"
                className="w-full"
              />
            </div>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border relative z-10"
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              disabled={!selectedLocationCoords}
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
              ✓ Showing items within {distance}km of {selectedLocation}
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