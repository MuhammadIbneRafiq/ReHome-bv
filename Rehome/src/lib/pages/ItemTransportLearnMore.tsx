import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ItemTransportLearnMore = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-orange-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8 md:p-10">
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-6">
              Item Transport Service
            </h1>
            
            <div className="prose max-w-none">
              <p className="text-lg text-gray-700 mb-6">
                Our Item Transport service provides professional and reliable transportation for individual items or small loads. Whether you've purchased a new piece of furniture, need to move a few items to a new location, or want to deliver something to a friend, we've got you covered.
              </p>
              
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">What We Offer:</h2>
              
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Same-day and scheduled transportation services</li>
                <li>Careful handling of all items, including fragile and oversized pieces</li>
                <li>Professional transportation teams with proper equipment</li>
                <li>Disassembly and reassembly services for furniture when needed</li>
                <li>GPS tracking for real-time updates on your item's location</li>
                <li>Competitive pricing based on item size and transport distance</li>
              </ul>
              
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Items We Transport:</h2>
              
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Furniture (sofas, beds, tables, wardrobes, etc.)</li>
                <li>Appliances (refrigerators, washing machines, etc.)</li>
                <li>Electronics (TVs, sound systems, etc.)</li>
                <li>Exercise equipment</li>
                <li>Musical instruments</li>
                <li>Art and decorative items</li>
                <li>And much more!</li>
              </ul>
              
              <p className="text-lg text-gray-700 mt-6 mb-6">
                Our Item Transport service is designed to be quick, efficient, and hassle-free. We handle the logistics so you don't have to worry about renting a truck, finding help, or risking damage to your valuable items during transit.
              </p>
              
              <div className="mt-10 text-center">
                <Link to="/item-transport" className="rehome-button">
                  Start Booking Process
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemTransportLearnMore; 