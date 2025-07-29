import React, { useState, useRef, useMemo, useEffect } from 'react';
import { getMarketplaceCategoriesDynamic, CONDITION_OPTIONS } from '../constants/marketplaceConstants';
import { MarketplaceCategory } from '../services/marketplaceItemDetailsService';

interface FilterProps {
  items: any[];
  onFilterChange: (filteredItems: any[]) => void;
}

const MarketplaceFilter: React.FC<FilterProps> = ({ items, onFilterChange }) => {
  // Dynamic categories state
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const dynamicCategories = await getMarketplaceCategoriesDynamic();
        setCategories(dynamicCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    loadCategories();
  }, []);

  const [_, setCities] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<[number, number]>([0, 500]);
  const [showRehomeOnly, setShowRehomeOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<string>('');

  const [locationKeyword, setLocationKeyword] = useState('');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [activeLocationSuggestion, setActiveLocationSuggestion] = useState(-1);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const locationSuggestionsRef = useRef<HTMLDivElement>(null);

  // Extract unique location values from items
  const uniqueLocations = useMemo(() => {
    const locationSet = new Set<string>();
    items.forEach(item => {
      [item.city_name, item.address, item.postcode, item.postal_code, item.zip_code].forEach(field => {
        if (typeof field === 'string' && field.trim() !== '') {
          locationSet.add(field.trim());
        }
      });
    });
    return Array.from(locationSet);
  }, [items]);

  const locationSuggestions = useMemo(() => {
    if (!locationKeyword) return [];
    return uniqueLocations.filter(loc => loc.toLowerCase().includes(locationKeyword.toLowerCase()));
  }, [locationKeyword, uniqueLocations]);

  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationKeyword(e.target.value);
    setShowLocationSuggestions(e.target.value.length > 0 && locationSuggestions.length > 0);
    setActiveLocationSuggestion(-1);
  };

  const handleLocationSuggestionClick = (suggestion: string) => {
    setLocationKeyword(suggestion);
    setShowLocationSuggestions(false);
    setTimeout(() => locationInputRef.current?.focus(), 0);
  };

  const handleLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showLocationSuggestions) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveLocationSuggestion(prev => prev < locationSuggestions.length - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveLocationSuggestion(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeLocationSuggestion >= 0) {
          handleLocationSuggestionClick(locationSuggestions[activeLocationSuggestion]);
        }
        setShowLocationSuggestions(false);
        break;
      case 'Escape':
        setShowLocationSuggestions(false);
        setActiveLocationSuggestion(-1);
        break;
    }
  };

  const handleLocationInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      if (!locationSuggestionsRef.current?.contains(e.relatedTarget as Node)) {
        setShowLocationSuggestions(false);
        setActiveLocationSuggestion(-1);
      }
    }, 150);
  };

  const handleLocationInputFocus = () => {
    if (locationKeyword && locationSuggestions.length > 0) {
      setShowLocationSuggestions(true);
    }
  };

  const [allowFlexibleDate, setAllowFlexibleDate] = useState(false);
  const [rehomeSuggestDate, setRehomeSuggestDate] = useState(false);
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({start: '', end: ''});
  // Pricing type filter
  const [selectedPricingType, setSelectedPricingType] = useState<string>('');
  
  // Analyze data to set up filter options
  useEffect(() => {
    if (items && items.length > 0) {
      // Extract unique cities
      const uniqueCities = [...new Set(items.map(item => item.city_name).filter(Boolean))];
      setCities(uniqueCities);
      
      // Set fixed price range from 0 to 500
      setPriceRange([0, 500]);
      setSelectedPriceRange([0, 500]);
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
    
    // Replace location filter with keyword search
    if (locationKeyword.trim() !== '') {
      const keyword = locationKeyword.trim().toLowerCase();
      filteredItems = filteredItems.filter(item => {
        const fields = [item.city_name, item.address, item.postcode, item.postal_code, item.zip_code];
        return fields.some(field =>
          typeof field === 'string' && field.toLowerCase().includes(keyword)
        );
      });
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
    setLocationKeyword(''); // Clear location keyword
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
  }, [selectedCities, selectedPriceRange, selectedCategory, selectedSubCategory, selectedCondition, selectedPricingType, showRehomeOnly, locationKeyword]);

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
              disabled={categoriesLoading}
            >
              <option value="">
                {categoriesLoading ? 'Loading categories...' : 'All Categories'}
              </option>
              {categories.map((category: MarketplaceCategory) => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            
            {selectedCategory && categories.find((c: MarketplaceCategory) => c.name === selectedCategory)?.subcategories && categories.find((c: MarketplaceCategory) => c.name === selectedCategory)!.subcategories.length > 0 && (
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                style={{ position: 'relative', zIndex: 5 }}
              >
                <option value="">All {selectedCategory}</option>
                {categories
                  .find((c: MarketplaceCategory) => c.name === selectedCategory)
                  ?.subcategories.map((sub: string) => (
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
              max={priceRange[1]}
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
        
        {/* Location Autocomplete Filter */}
        <div className="relative mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location (city, address, postcode, etc.)
          </label>
          <div className="relative flex items-center mb-4">
            <input
              ref={locationInputRef}
              type="text"
              value={locationKeyword}
              onChange={handleLocationInputChange}
              onKeyDown={handleLocationKeyDown}
              onBlur={handleLocationInputBlur}
              onFocus={handleLocationInputFocus}
              placeholder="Type any location keyword..."
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              autoComplete="off"
            />
            {/* Removed FaMapMarkerAlt icon */}
          </div>
          {showLocationSuggestions && (
            <div
              ref={locationSuggestionsRef}
              className="absolute top-20 left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
            >
              {locationSuggestions.length > 0 ? (
                locationSuggestions.map((suggestion, index) => (
                  <div
                    key={suggestion}
                    className={`px-4 py-2 cursor-pointer hover:bg-orange-50 ${index === activeLocationSuggestion ? 'bg-orange-100' : ''}`}
                    onMouseDown={() => handleLocationSuggestionClick(suggestion)}
                    onMouseEnter={() => setActiveLocationSuggestion(index)}
                  >
                    <div className="flex items-center">
                      {/* Removed FaMapMarkerAlt icon from suggestions */}
                      <span className="text-gray-700">{suggestion}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-400">No suggestions found</div>
              )}
            </div>
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
            {CONDITION_OPTIONS.map(condition => (
              <option key={condition.value} value={condition.value}>
                {condition.label}
              </option>
            ))}
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