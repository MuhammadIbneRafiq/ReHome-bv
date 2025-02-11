import MarketplaceSearch from '../../components/MarketplaceSearch';
import React from "react";
import { Link } from "react-router-dom"; // Import Link

const MarketplacePage = () => {
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
          {/* Add the search component here */}
          <MarketplaceSearch />

           {/* Call to Action - "Looking to Sell?" */}
           <div className="mt-8 text-center">
            <Link
              to="/sell" // Replace with your "Sell" page route
              className="inline-block bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold py-3 px-6 rounded-md shadow-md hover:opacity-90 transition duration-300"
            >
              Looking to Sell?  List Your Items Here
            </Link>
          </div>

        </div>
      </div>

      {/* Main Content - Your Marketplace Items */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Featured Listings</h2>
        {/*  Add your marketplace listing components here (e.g., product cards) */}
        <p>Explore our marketplace for furniture and more.</p>
      </div>
    </div>
  );
};

export default MarketplacePage;