import React, { useState } from 'react';
import { FaSearch, FaFilter } from 'react-icons/fa';  // Import icons
import { AnimatePresence, motion } from 'framer-motion'; // Import framer-motion

const MarketplaceSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [location, setLocation] = useState('');
    const [category, setCategory] = useState(''); // e.g., sofa, table, chair
    const [priceRange, setPriceRange] = useState({ min: '', max: '' }); //  min, max
    const [sortBy, setSortBy] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false); // State for filter visibility

    const handleSearch = () => {
        // Simulate a search result (replace with your data fetching)
        console.log('Searching:', { searchTerm, location, category, priceRange, sortBy });
    };
    const toggleFilter = () => {
        setIsFilterOpen(!isFilterOpen);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            {/* Search Bar */}
            <div className="flex items-center mb-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                    placeholder="Search items..."
                />
                <button
                    onClick={handleSearch}
                    className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                    <FaSearch />
                </button>
            </div>

            {/* Filters Toggle Button */}
            <button
                onClick={toggleFilter}
                className="flex items-center justify-center w-full bg-orange-100 text-orange-700 font-semibold py-2 px-4 rounded-md hover:bg-orange-200 transition duration-200"
            >
                <FaFilter className="mr-2" /> Filters
            </button>

            {/* Filters (Collapsible Section) */}
            <AnimatePresence>
                {isFilterOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 space-y-4"
                    >
                        {/* Category Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="">All Categories</option>
                                <option value="sofa">Sofa</option>
                                <option value="table">Table</option>
                                <option value="chair">Chair</option>
                                <option value="bed">Bed</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Price Range Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Price Range
                            </label>
                            <div className="flex space-x-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={priceRange.min}
                                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                    className="mt-1 block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={priceRange.max}
                                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                    className="mt-1 block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        {/* Sort By Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Sort By
                            </label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="">Relevance</option>
                                <option value="lowToHigh">Price: Low to High</option>
                                <option value="highToLow">Price: High to Low</option>
                            </select>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MarketplaceSearch;