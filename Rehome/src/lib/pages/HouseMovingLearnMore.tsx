import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const HouseMovingLearnMore = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-orange-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8 md:p-10">
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-6">
              House Moving Service
            </h1>
            
            <div className="prose max-w-none">
              <p className="text-lg text-gray-700 mb-6">
                Our House Moving service offers complete home relocation solutions tailored to your needs. Whether you're moving to a new apartment, house, or office space, our professional team handles every aspect of your move with care and efficiency.
              </p>
              
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">What We Offer:</h2>
              
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Professional packing and unpacking services</li>
                <li>Safe and secure transportation of all your belongings</li>
                <li>Furniture disassembly and reassembly</li>
                <li>Special handling for fragile and valuable items</li>
                <li>Flexible scheduling to accommodate your timeline</li>
                <li>Transparent pricing with no hidden fees</li>
              </ul>
              
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Our Process:</h2>
              
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>Initial consultation to understand your moving needs</li>
                <li>Customized moving plan creation</li>
                <li>Professional packing of all items</li>
                <li>Careful loading and secure transportation</li>
                <li>Unloading and placement of items in your new home</li>
                <li>Unpacking and setup assistance as needed</li>
              </ol>
              
              <p className="text-lg text-gray-700 mt-6 mb-6">
                Our experienced movers are trained to handle all types of residential moves, ensuring your belongings arrive safely at your new home. We pride ourselves on making your moving day as stress-free as possible.
              </p>
              
              <div className="mt-10 text-center">
                <Link to="/house-moving" className="rehome-button">
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

export default HouseMovingLearnMore; 