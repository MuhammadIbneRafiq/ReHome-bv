import React from 'react';
import { Link } from 'react-router-dom';
import { FaTruck, FaArrowLeft, FaClock, FaMapMarkedAlt, FaCalculator } from 'react-icons/fa';
import Footer from '../../components/Footer';

const ItemTransportLearnMore: React.FC = () => {
  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <div className="bg-white pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-8">
            <FaArrowLeft className="mr-2" />
            Back to Home
          </Link>
          
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-orange-500 rounded-full p-4">
                <FaTruck className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
              Fast and Reliable Transport for Single Items or Small Loads
            </h1>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xl text-gray-700 leading-relaxed">
              Whether you're buying second-hand furniture online, picking up something from a store, 
              or moving a few belongings to a new flat — we provide an affordable solution.
            </p>
          </div>

          <div className="space-y-12">
            {/* Custom Pricing */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Custom Pricing for Every Transport</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Whether it's a washing machine from Marktplaats or a bookshelf from IKEA, our pricing is fully dynamic. 
                You only pay based on the items you select, the pickup and drop-off distance, and any optional services 
                like carrying upstairs or assembly. If your delivery exceeds three items, we'll automatically guide you 
                to our House Moving option for a more suitable setup.
              </p>
            </div>

            {/* City-to-City Transport */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">City-to-City Transport</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                We operate across most major cities in the Netherlands, enabling affordable and reliable transport 
                between regions — not just within cities. From Amsterdam to Utrecht, Rotterdam to Eindhoven — 
                we move your items safely across the country, without inflated intercity fees.
              </p>
            </div>

            {/* Fast Booking */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Fast Booking, No Guesswork</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Just fill out the form, get a real-time quote, and we'll follow up to confirm the details. 
                No vague pricing, no waiting.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="py-16 bg-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Why Choose Our Item Transport?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <FaCalculator className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dynamic Pricing</h3>
              <p className="text-gray-600">Pay only for what you need - no fixed rates or hidden fees.</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <FaMapMarkedAlt className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nationwide Coverage</h3>
              <p className="text-gray-600">Transport between all major Dutch cities without extra charges.</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <FaClock className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Response</h3>
              <p className="text-gray-600">Real-time quotes and fast confirmation for your transport needs.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Representation */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How Our Pricing Works</h2>
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-4 mb-2 mx-auto w-16 h-16 flex items-center justify-center">
                <span className="text-orange-600 font-bold text-lg">📦</span>
              </div>
              <p className="font-medium">Item Count</p>
            </div>
            <div className="text-orange-500 text-2xl">→</div>
            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-4 mb-2 mx-auto w-16 h-16 flex items-center justify-center">
                <span className="text-orange-600 font-bold text-lg">📍</span>
              </div>
              <p className="font-medium">Distance</p>
            </div>
            <div className="text-orange-500 text-2xl">→</div>
            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-4 mb-2 mx-auto w-16 h-16 flex items-center justify-center">
                <span className="text-orange-600 font-bold text-lg">🛠️</span>
              </div>
              <p className="font-medium">Add-on Services (optional)</p>
            </div>
            <div className="text-orange-500 text-2xl">→</div>
            <div className="text-center">
              <div className="bg-orange-500 rounded-full p-4 mb-2 mx-auto w-16 h-16 flex items-center justify-center">
                <span className="text-white font-bold text-lg">💰</span>
              </div>
              <p className="font-medium">Total Price</p>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="py-16 bg-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Perfect For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Online Purchases</h3>
              <p className="text-gray-600">Picking up furniture from Marktplaats, Facebook Marketplace, or other online platforms.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Store Pickups</h3>
              <p className="text-gray-600">Collecting items from IKEA, furniture stores, or retail locations.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Small Moves</h3>
              <p className="text-gray-600">Moving a few items to a new apartment or temporary location.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Appliance Transport</h3>
              <p className="text-gray-600">Moving washing machines, refrigerators, or other large appliances.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-orange-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Need Something Transported?</h2>
          <Link 
            to="/item-transport" 
            className="inline-block bg-white text-orange-500 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Start Booking Process
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ItemTransportLearnMore; 