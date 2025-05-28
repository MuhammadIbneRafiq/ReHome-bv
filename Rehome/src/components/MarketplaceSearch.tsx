import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSearch } from 'react-icons/fa';

interface SearchProps {
  onSearch: (searchTerm: string) => void;
  items?: Array<{ name: string; description: string; category?: string }>;
}

const MarketplaceSearch: React.FC<SearchProps> = ({ onSearch, items = [] }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Common furniture categories and terms for suggestions
  const commonTerms = [
    'sofa', 'chair', 'table', 'bed', 'desk', 'wardrobe', 'bookshelf', 'lamp',
    'dining table', 'coffee table', 'armchair', 'office chair', 'bedside table',
    'dresser', 'cabinet', 'shelf', 'mirror', 'couch', 'mattress', 'nightstand',
    'tv stand', 'kitchen table', 'bar stool', 'recliner', 'ottoman', 'bench',
    'dining chair', 'computer desk', 'filing cabinet', 'shoe rack', 'coat rack'
  ];

  useEffect(() => {
    if (searchTerm.length > 0) {
      // Get suggestions from items
      const itemSuggestions = items
        .filter(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map(item => item.name)
        .slice(0, 3);

      // Get suggestions from common terms
      const termSuggestions = commonTerms
        .filter(term => 
          term.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !itemSuggestions.some(item => item.toLowerCase().includes(term.toLowerCase()))
        )
        .slice(0, 3);

      const allSuggestions = [...itemSuggestions, ...termSuggestions].slice(0, 5);
      setSuggestions(allSuggestions);
      setShowSuggestions(allSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setActiveSuggestion(-1);
  }, [searchTerm, items]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value); // Real-time search
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

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
        } else {
          handleSearch(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestion(-1);
        break;
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
        setShowSuggestions(false);
        setActiveSuggestion(-1);
      }
    }, 150);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-4">{t('common.search')}</h3>
      <form onSubmit={handleSearch}>
        <div className="relative">
          <div className="flex items-center mb-4">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder={t('marketplace.search', 'Search items...')}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
              autoComplete="off"
            />
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              <FaSearch />
            </button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute top-12 left-0 right-12 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`px-4 py-2 cursor-pointer hover:bg-orange-50 ${
                    index === activeSuggestion ? 'bg-orange-100' : ''
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setActiveSuggestion(index)}
                >
                  <div className="flex items-center">
                    <FaSearch className="text-gray-400 mr-2 text-sm" />
                    <span className="text-gray-700">{suggestion}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>

      {/* Search Tips */}
      <div className="text-xs text-gray-500 mt-2">
        <p>💡 Try searching for: furniture type, brand, or description</p>
        <p className="mt-1">Use ↑↓ arrows to navigate suggestions, Enter to select</p>
      </div>
    </div>
  );
};

export default MarketplaceSearch;