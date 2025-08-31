import React, { useState, useEffect } from 'react';
import { getMarketplaceCategoriesDynamic, CONDITION_OPTIONS } from '../constants/marketplaceConstants';
import { MarketplaceCategory } from '../services/marketplaceItemDetailsService';
import { GooglePlacesAutocomplete } from './ui/GooglePlacesAutocomplete';
import { GooglePlaceObject } from '../utils/locationServices';
import { FaMapMarkerAlt, FaRuler } from 'react-icons/fa';

interface FilterProps {
  items: any[];
  onFilterChange: (filteredItems: any[]) => void;
  onLocationSearch?: (location: string, radius?: number, selectedPlace?: GooglePlaceObject) => void;
}

const MarketplaceFilter: React.FC<FilterProps> = ({ items, onFilterChange, onLocationSearch }) => {
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

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<[number, number]>([0, 500]);
  const [showRehomeOnly, setShowRehomeOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<string>('');

  // Google Places Autocomplete state
  const [locationSearch, setLocationSearch] = useState('');
  const [selectedRadius, setSelectedRadius] = useState<number>(25);
  const [selectedLocation, setSelectedLocation] = useState<GooglePlaceObject | null>(null);

  const [allowFlexibleDate, setAllowFlexibleDate] = useState(false);
  const [rehomeSuggestDate, setRehomeSuggestDate] = useState(false);
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({start: '', end: ''});
  const [selectedPricingType, setSelectedPricingType] = useState<string>('');
  
  // Analyze data to set up filter options
  useEffect(() => {
    if (items && items.length > 0) {
      // Set fixed price range from 0 to 500
      setPriceRange([0, 500]);
      setSelectedPriceRange([0, 500]);
    }
  }, [items]);

  // Enhanced apply filters with better location handling
  const applyFilters = async () => {
    let filteredItems = [...items];
    
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
    
    onFilterChange(filteredItems);
  };

  // Enhanced reset filters
  const resetFilters = () => {
    setSelectedPriceRange(priceRange);
    setShowRehomeOnly(false);
    setSelectedCategory('');
    setSelectedSubCategory('');
    setSelectedCondition('');
    setAllowFlexibleDate(false);
    setRehomeSuggestDate(false);
    setDateRange({start: '', end: ''});
    setSelectedPricingType('');
    setLocationSearch('');
    setSelectedLocation(null);
    setSelectedRadius(25);
    onFilterChange(items); // Reset to original items
  };

  // Handle price range change
  const handlePriceChange = (min: number, max: number) => {
    setSelectedPriceRange([min, max]);
  };
  
  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setSelectedSubCategory(''); // Reset subcategory when category changes
  };

  // Handle place selection from Google Places Autocomplete
  const handleLocationSelect = (place: GooglePlaceObject) => {
    const locationText = place.formattedAddress || place.text || '';
    setLocationSearch(locationText);
    setSelectedLocation(place);
    // Don't trigger search until radius is selected
  };

  // Handle radius change
  const handleRadiusChange = (radius: number) => {
    setSelectedRadius(radius);
    if (selectedLocation && onLocationSearch) {
      onLocationSearch(locationSearch, radius, selectedLocation);
    }
  };

  // Apply filters when any filter changes
  useEffect(() => {
    applyFilters();
  }, [selectedPriceRange, selectedCategory, selectedSubCategory, selectedCondition, selectedPricingType, showRehomeOnly, allowFlexibleDate, rehomeSuggestDate, dateRange]);

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
        
        {/* Location Search with Google Places Autocomplete */}
        <div className="relative mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FaMapMarkerAlt className="mr-2 text-orange-500" />
            Search by Location
          </label>
          <GooglePlacesAutocomplete
            value={locationSearch}
            onChange={setLocationSearch}
            placeholder="Enter city or address..."
            onPlaceSelect={handleLocationSelect}
          />
        </div>

        {/* Radius Filter */}
        {selectedLocation && (
          <div className="relative mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <FaRuler className="mr-2 text-orange-500" />
              Search Radius
            </label>
            <div className="flex flex-wrap gap-2">
              {[15, 25, 50].map((radius) => (
                <button
                  key={radius}
                  onClick={() => handleRadiusChange(radius)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    selectedRadius === radius
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-orange-50'
                  }`}
                >
                  {radius} km
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Showing items within {selectedRadius}km of {selectedLocation.formattedAddress || selectedLocation.text}
            </p>
          </div>
        )}
        
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