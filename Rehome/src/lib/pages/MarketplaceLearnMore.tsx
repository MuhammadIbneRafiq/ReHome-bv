import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const MarketplaceLearnMore = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-orange-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8 md:p-10">
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-6">
              2ndHand Marketplace
            </h1>
            
            <div className="prose max-w-none">
              <p className="text-lg text-gray-700 mb-6">
                Our 2ndHand Marketplace is a platform where you can buy and sell quality pre-owned furniture and home items. Whether you're looking to furnish your home on a budget or sell items you no longer need, our marketplace provides a convenient and trusted environment for second-hand transactions.
              </p>
              
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">For Buyers:</h2>
              
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Wide selection of quality second-hand furniture and home items</li>
                <li>Verified sellers and quality-checked items</li>
                <li>Detailed item descriptions and high-quality photos</li>
                <li>Multiple search filters to easily find what you're looking for</li>
                <li>Secure messaging system to communicate with sellers</li>
                <li>Option to request item delivery through our transport service</li>
                <li>Payment protection for secure transactions</li>
              </ul>
              
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">For Sellers:</h2>
              
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Easy listing creation with multiple photo uploads</li>
                <li>Set your own prices or enable bidding functionality</li>
                <li>Reach a large audience of potential buyers</li>
                <li>Secure messaging system to communicate with interested buyers</li>
                <li>Option to offer delivery through our transport service</li>
                <li>Verification badge for trusted sellers</li>
                <li>Helpful tools to manage your listings</li>
              </ul>
              
              <p className="text-lg text-gray-700 mt-6 mb-6">
                Our marketplace makes it easy to find unique, affordable furniture while promoting sustainability through reuse. By giving items a second life, you're not only saving money but also contributing to a more environmentally friendly approach to furnishing your home.
              </p>
              
              <div className="mt-10 text-center">
                <Link to="/marketplace" className="rehome-button">
                  Explore Marketplace
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceLearnMore; 