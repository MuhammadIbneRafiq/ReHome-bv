import React, { useState } from 'react';
import MarketplaceSearch from '../../components/MarketplaceSearch';
import { motion } from "framer-motion"; // Import motion from framer-motion

// Import images
import sofaImage from "../../assets/IMG-20250208-WA0001.jpg";
import tableImage from "../../assets/IMG-20250208-WA0010.jpg";
import chairImage from "../../assets/IMG-20250208-WA0013.jpg";
import image1 from "../../assets/IMG-20250208-WA0005.jpg";
import image2 from "../../assets/IMG-20250208-WA0006.jpg";
import image3 from "../../assets/IMG-20250208-WA0007.jpg";
import image4 from "../../assets/IMG-20250208-WA0008.jpg";
import image5 from "../../assets/IMG-20250208-WA0009.jpg";
import image6 from "../../assets/IMG-20250208-WA0011.jpg"; // New image
import image7 from "../../assets/IMG-20250208-WA0012.jpg"; // New image
import image8 from "../../assets/IMG-20250208-WA0013.jpg"; // New image
import image9 from "../../assets/IMG-20250208-WA0014.jpg"; // New image

const MarketplacePage = () => {
    const [featuredListings, setFeaturedListings] = useState([
        { id: 1, name: "Cozy Sofa", image: sofaImage, description: 'A comfortable sofa', price: 299, location: 'New York' },
        { id: 2, name: "Wooden Dining Table", image: tableImage, description: 'Seats 6', price: 399, location: 'Los Angeles' },
        { id: 3, name: "Modern Office Chair", image: chairImage, description: 'Ergonomic chair', price: 199, location: 'Chicago' },
        { id: 4, name: "Cozy Sofa", image: image1, description: 'A comfortable sofa', price: 299, location: 'New York' },
        { id: 5, name: "Wooden Dining Table", image: image2, description: 'Seats 6', price: 399, location: 'Los Angeles' },
        { id: 6, name: "Modern Office Chair", image: image3, description: 'Ergonomic chair', price: 199, location: 'Chicago' },
        { id: 7, name: "Modern Office Chair", image: image4, description: 'Ergonomic chair', price: 199, location: 'Chicago' },
        { id: 8, name: "Modern Office Chair", image: image5, description: 'Ergonomic chair', price: 199, location: 'Chicago' },
        { id: 9, name: "Stylish Lamp", image: image6, description: 'A modern lamp for your living room', price: 89, location: 'New York' }, // New listing
        { id: 10, name: "Dining Set", image: image7, description: 'Elegant dining set for 4', price: 499, location: 'Los Angeles' }, // New listing
        { id: 11, name: "Office Desk", image: image8, description: 'Spacious office desk', price: 299, location: 'Chicago' }, // New listing
        { id: 12, name: "Bookshelf", image: image9, description: 'Wooden bookshelf', price: 199, location: 'Chicago' }, // New listing
        // Add more listings as needed
    ]);

    return (
        <div className="min-h-screen bg-orange-50 pt-16">
            {/* Top Section */}
            <div className="bg-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-4">
                        Your Marketplace, Sorted
                    </h1>
                    <p className="text-xl text-gray-500 text-center mb-8">
                        Find furniture and goods near you.
                    </p>
                    {/* Search and Filter */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Search on Left */}
                        <div className="md:col-span-1"> {/* Adjusted to occupy less space */}
                            <MarketplaceSearch />
                        </div>

                        {/* Featured Listings on Right */}
                        <div className="md:col-span-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg p-4"> {/* Increased width */}
                            <h2 className="text-xl font-semibold text-white mb-2">Featured Listings</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">  {/* 4 items in a row on larger screens */}
                                {featuredListings.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        className="bg-white shadow-lg rounded-lg p-2 hover:scale-105 transition-transform"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-32 object-cover rounded-md mb-1" // Reduced height
                                        />
                                        <h3 className="text-sm font-semibold text-gray-800">{item.name}</h3>
                                        <p className="text-gray-600 text-xs">{item.description}</p>
                                        <p className="text-red-500 font-bold text-xs">${item.price}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketplacePage;