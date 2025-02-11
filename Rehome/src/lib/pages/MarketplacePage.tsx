import React, { useState } from 'react';
import MarketplaceSearch from '../../components/MarketplaceSearch';
import { motion } from "framer-motion"; // Import motion from framer-motion

// Assuming you have this in your assets
import sofaImage from "../../assets/IMG-20250208-WA0001.jpg";
import tableImage from "../../assets/IMG-20250208-WA0010.jpg";
import chairImage from "../../assets/IMG-20250208-WA0013.jpg";;
import image1 from "../../assets/IMG-20250208-WA0005.jpg";
import image2 from "../../assets/IMG-20250208-WA0006.jpg";
import image3 from "../../assets/IMG-20250208-WA0007.jpg";

const MarketplacePage = () => {
  const [featuredListings, setFeaturedListings] = useState([
      { id: 1, name: "Cozy Sofa", image: sofaImage, description: 'A comfortable sofa', price: 299, location: 'New York' },
      { id: 2, name: "Wooden Dining Table", image: tableImage, description: 'Seats 6', price: 399, location: 'Los Angeles' },
      { id: 3, name: "Modern Office Chair", image: chairImage, description: 'Ergonomic chair', price: 199, location: 'Chicago' },
      { id: 4, name: "Cozy Sofa", image: image1, description: 'A comfortable sofa', price: 299, location: 'New York' },
      { id: 5, name: "Wooden Dining Table", image: image2, description: 'Seats 6', price: 399, location: 'Los Angeles' },
      { id: 6, name: "Modern Office Chair", image: image3, description: 'Ergonomic chair', price: 199, location: 'Chicago' },
    ]);

  return (
    <div className="min-h-screen bg-orange-50 pt-16">
      {/* Top Section - Similar to Brenger */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-4">
            Your Marketplace, Sorted
          </h1>
          <p className="text-xl text-gray-500 text-center mb-8">
            Find furniture and goods near you.
          </p>
           {/* Search and Filter */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Search on Left */}
             <div>
               <MarketplaceSearch />
             </div>
             {/* Featured Listings Carousel on Right */}
             <div className="overflow-x-auto rounded-lg">
               <div className="flex space-x-4 py-4">
                 {featuredListings.map((item) => (
                   <motion.div
                     key={item.id}
                     className="min-w-[250px] bg-white shadow-lg rounded-lg p-4 hover:scale-105 transition-transform"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-48 object-cover rounded-md mb-2"
                      />
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                      <p className="text-red-500 font-bold">${item.price}</p>
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