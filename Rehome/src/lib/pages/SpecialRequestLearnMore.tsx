import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SpecialRequestLearnMore = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-orange-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8 md:p-10">
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-6">
              Special Request Service
            </h1>
            
            <div className="prose max-w-none">
              <p className="text-lg text-gray-700 mb-6">
                Our Special Request service is designed to handle unique moving and transportation needs that don't fit into standard categories. We understand that some situations require customized solutions, and we're here to help with your specific requirements.
              </p>
              
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Types of Special Requests We Handle:</h2>
              
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Full house moves with special requirements or circumstances</li>
                <li>International moves and transportation</li>
                <li>Temporary item storage between moves</li>
                <li>Junk removal and disposal services</li>
                <li>Specialty item transportation (pianos, artwork, antiques, etc.)</li>
                <li>Time-sensitive or emergency moving situations</li>
                <li>Custom packing solutions for valuable or unusual items</li>
              </ul>
              
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">How It Works:</h2>
              
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>Submit your special request with details about your unique needs</li>
                <li>Our team will review your request and contact you for additional information if needed</li>
                <li>We'll provide a custom quote tailored to your specific situation</li>
                <li>Once approved, we'll create a personalized plan for your request</li>
                <li>Our professional team will execute the plan with attention to your unique requirements</li>
              </ol>
              
              <p className="text-lg text-gray-700 mt-6 mb-6">
                No request is too unusual or complex for our experienced team. We pride ourselves on finding solutions for situations that might seem challenging or impossible. Let us know what you need, and we'll work with you to make it happen.
              </p>
              
              <div className="mt-10 text-center">
                <Link to="/special-request" className="rehome-button">
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

export default SpecialRequestLearnMore; 