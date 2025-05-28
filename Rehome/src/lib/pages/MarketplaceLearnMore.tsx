import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaArrowLeft, FaRecycle, FaTag, FaSeedling, FaHeart, FaHandHoldingHeart } from 'react-icons/fa';
import Footer from '../../components/Footer';

const MarketplaceLearnMore: React.FC = () => {
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
                <FaStar className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
              Sustainable, Affordable Furniture — Curated by Us, Powered by the Community
            </h1>
          </div>
        </div>
      </div>

      {/* Key Highlights */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Key Highlights</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <FaRecycle className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Buy Smart, Buy Second-Hand</h3>
              <p className="text-gray-600">Extend the life of quality furniture and appliances.</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <FaTag className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ReHome Collection & User Listings</h3>
              <p className="text-gray-600">Find items from us or browse listings posted by others.</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <FaHandHoldingHeart className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Donate or Sell</h3>
              <p className="text-gray-600">List your furniture to give it a second life or earn from what you no longer need.</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <FaSeedling className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Circular and Social</h3>
              <p className="text-gray-600">Make sustainable choices and help others furnish affordably.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="py-16 bg-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {/* Marketplace Overview */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">A Marketplace That Works for Everyone</h2>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>Our 2nd-Hand Furniture section combines the best of both worlds:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>ReHome-curated items</strong>, sourced through donations or pick-ups, cleaned and resold at fair prices.</li>
                  <li><strong>User listings</strong>, where individuals can post their own furniture and appliances directly.</li>
                </ul>
                <p>
                  Whether you're furnishing a new place on a budget or want to pass along something you no longer need — this is the place.
                </p>
              </div>
            </div>

            {/* Affordable & Sustainable */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Affordable, Sustainable & Local</h2>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>
                  All items are sold at fair prices and made accessible to people who need them most — including students, 
                  expats, and locals. By choosing second-hand, you're not just saving money — you're also reducing waste 
                  and supporting a more circular economy.
                </p>
                <p>
                  We're selective about what we resell ourselves, ensuring each ReHome item is clean, functional, and ready to use. 
                  Users can list any item themselves — and we provide a direct messaging system for negotiations, questions, and bids.
                </p>
              </div>
            </div>

            {/* Delivery & Extras */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Delivery & Extras — Only If You Need It</h2>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>
                  For ReHome-listed items, you can add carrying assistance or assembly at checkout. By default, 
                  we deliver to the ground floor. You choose what help you need — and your cost reflects that.
                </p>
                <p>
                  User-listed items are handled directly between buyer and seller, with no mandatory fees or platform restrictions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Donate or Sell Section */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="bg-orange-500 rounded-full p-4">
                <FaHeart className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Donate or Sell Furniture to ReHome</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Got furniture you want to pass on? We accept both free donations and items for sale. 
              Just fill out the form with item photos, description, condition, and pickup address. 
              We connect your item with someone who needs it.
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-16 bg-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Why Choose Our Marketplace?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Quality Assured</h3>
              <p className="text-gray-600">ReHome items are cleaned, checked, and ready to use immediately.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Fair Pricing</h3>
              <p className="text-gray-600">Affordable prices that make quality furniture accessible to everyone.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Community Driven</h3>
              <p className="text-gray-600">Direct listings from community members with messaging system.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Optional Services</h3>
              <p className="text-gray-600">Add delivery, carrying, or assembly services only if you need them.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Sustainable Choice</h3>
              <p className="text-gray-600">Reduce waste and support circular economy with every purchase.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Student Friendly</h3>
              <p className="text-gray-600">Perfect for students, expats, and anyone furnishing on a budget.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-orange-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Browse, Buy, or List — All in One Place</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/marketplace" 
              className="inline-block bg-white text-orange-500 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Explore Marketplace
            </Link>
            <Link 
              to="/create-listing" 
              className="inline-block bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              Create a Listing
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MarketplaceLearnMore; 