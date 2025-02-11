import React, { useState } from 'react';

const MarketplaceSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = async () => {
    // Mock Search Functionality (Replace with your actual search logic)
    console.log('Searching for:', searchTerm, 'in', location);
    // Simulate a search result (replace with your data fetching)
    const mockResults = [
      { id: 1, name: 'Cozy Sofa', description: 'A comfortable sofa', price: 299, location: location }, // Use the entered location
      { id: 2, name: 'Wooden Dining Table', description: 'Seats 6', price: 399, location: location }, // Use the entered location
    ];
    setSearchResults(mockResults);
  };

  const handleLocationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocation = e.target.value;
    setLocation(newLocation);

    // Mock Location Suggestions (Replace with real API call)
    if (newLocation.length > 2) {
      const mockSuggestions = [
        `${newLocation}, Netherlands`,
        `${newLocation}, Germany`,
        `${newLocation} Area`,
      ];
      setLocationSuggestions(mockSuggestions);
    } else {
      setLocationSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setLocation(suggestion);
    setLocationSuggestions([]); // Hide suggestions after selection
  };

  return (
    <div className="bg-gray-100 p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Search & Filter</h3>

      <div className="mb-4">
        <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700">
          Search Item
        </label>
        <input
          type="text"
          id="searchTerm"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="e.g., Sofa, Table"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="mb-4 relative">
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
          Location
        </label>
        <input
          type="text"
          id="location"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="City or Address"
          value={location}
          onChange={handleLocationChange}
        />
        {locationSuggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {locationSuggestions.map((suggestion) => (
              <li
                key={suggestion}
                className="text-gray-900 cursor-default select-none relative py-2 px-3 hover:bg-gray-100"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={handleSearch}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md"
      >
        Search
      </button>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-semibold text-gray-700 mb-2">Results:</h4>
          <ul>
            {searchResults.map((result) => (
              <li key={result.id} className="py-2 border-b border-gray-200">
                {result.name} - ${result.price} (Located in: {result.location})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MarketplaceSearch;