import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFilter } from 'react-icons/fa';

interface FilterProps {
  items: any[];
  onFilterChange: (filteredItems: any[]) => void;
}

const MarketplaceFilter: React.FC<FilterProps> = ({ items, onFilterChange }) => {
  const { t } = useTranslation();
  
  // Extract unique cities from items
  const [cities, setCities] = useState<string[]>([]);
  // Track min and max prices
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  // Track selected filters
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<[number, number]>([0, 1000]);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  // Toggle for filter visibility
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
  const applyFilters = () => {
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
    
    // Filter by verified (Rehome) status
    if (showVerifiedOnly) {
      filteredItems = filteredItems.filter(item => item.isrehome === true);
    }
    
    onFilterChange(filteredItems);
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedCities([]);
    setSelectedPriceRange(priceRange);
    setShowVerifiedOnly(false);
    onFilterChange(items); // Reset to original items
  };

  // Handle city selection
  const handleCityChange = (city: string) => {
    setSelectedCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city) 
        : [...prev, city]
    );
  };

  // Handle price range change
  const handlePriceChange = (min: number, max: number) => {
    setSelectedPriceRange([min, max]);
  };

  // Toggle filter visibility
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mt-4">
      {/* Filters Toggle Button */}
      <button
        onClick={toggleFilter}
        className="flex items-center justify-center w-full bg-orange-100 text-orange-700 font-semibold py-2 px-4 rounded-md hover:bg-orange-200 transition duration-200"
      >
        <FaFilter className="mr-2" /> {t('marketplace.filter')}
      </button>

      {/* Filters Content */}
      {isFilterOpen && (
        <div className="mt-4 space-y-4">
          {/* Price Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('marketplace.price')}
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={selectedPriceRange[0]}
                onChange={(e) => handlePriceChange(Number(e.target.value), selectedPriceRange[1])}
                className="mt-1 block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                min={priceRange[0]}
                max={selectedPriceRange[1]}
                placeholder={t('marketplace.minPrice')}
              />
              <input
                type="number"
                value={selectedPriceRange[1]}
                onChange={(e) => handlePriceChange(selectedPriceRange[0], Number(e.target.value))}
                className="mt-1 block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                min={selectedPriceRange[0]}
                max={priceRange[1]}
                placeholder={t('marketplace.maxPrice')}
              />
            </div>
          </div>
          
          {/* Location Filter */}
          {cities.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('marketplace.location')}
              </label>
              <select
                multiple
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                value={selectedCities}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedCities(options);
                }}
              >
                {cities.map(city => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {t('common.tip')}: {t('marketplace.holdCtrl')}
              </p>
            </div>
          )}
          
          {/* Verified Items Filter */}
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="verified-only"
                checked={showVerifiedOnly}
                onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="verified-only" className="ml-2 block text-sm text-gray-700">
                {t('marketplace.verifiedOnly')}
              </label>
            </div>
          </div>
          
          {/* Filter Actions */}
          <div className="flex space-x-2 pt-2">
            <button 
              onClick={applyFilters} 
              className="w-full bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {t('common.apply')}
            </button>
            <button 
              onClick={resetFilters} 
              className="w-full border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {t('common.reset')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceFilter; 