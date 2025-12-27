import { useEffect, useMemo, useRef, useState } from 'react';
import { FaChevronDown, FaSearch, FaTimes, FaCheck } from 'react-icons/fa';

interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

const MultiSelectDropdown = ({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Select options',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No matches found'
}: MultiSelectDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    return options.filter(option => option.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeOption = (option: string) => {
    onChange(selected.filter(item => item !== option));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      >
        <span className="truncate text-gray-700">
          {selected.length === 0 ? placeholder : `${selected.length} selected`}
        </span>
        <FaChevronDown className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="flex items-center px-3 py-2 border-b border-gray-100">
            <FaSearch className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">{emptyMessage}</p>
            ) : (
              filteredOptions.map(option => (
                <label
                  key={option}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 cursor-pointer"
                  onMouseDown={e => e.preventDefault()}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    onChange={() => toggleOption(option)}
                    className="mr-3 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="flex-1">{option}</span>
                  {selected.includes(option) && <FaCheck className="text-orange-500" />}
                </label>
              ))
            )}
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map(option => (
            <span
              key={option}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium"
            >
              {option}
              <button
                type="button"
                onClick={() => removeOption(option)}
                className="text-orange-500 hover:text-orange-700"
                aria-label={`Remove ${option}`}
              >
                <FaTimes />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
