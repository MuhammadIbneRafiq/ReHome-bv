import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaBalanceScale, FaGraduationCap, FaWrench, FaPuzzlePiece, FaHandshake, FaArrowLeft } from 'react-icons/fa';
import Footer from '../../components/Footer';

const HouseMovingLearnMore: React.FC = () => {
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
                <FaHome className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
              Affordable and Flexible Moving Solutions Tailored to Your Needs
            </h1>
          </div>
        </div>
      </div>

      {/* Key Highlights */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Key Highlights</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <FaBalanceScale className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fair Pricing</h3>
              <p className="text-gray-600">No standard charges – only pay for what you need.</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <FaGraduationCap className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Student-Friendly</h3>
              <p className="text-gray-600">Ideal for small scale moves with limited items and budget.</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <FaWrench className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Flexible & Customizable</h3>
              <p className="text-gray-600">You're in control. Choose exactly what you need help with — from full service to just transport.</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <FaPuzzlePiece className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Optional Add-On Services</h3>
              <p className="text-gray-600">Assembly, carrying upstairs, or extra help available if needed.</p>
            </div>

            <div className="text-center md:col-span-2 lg:col-span-1">
              <div className="flex justify-center mb-4">
                <FaHandshake className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Collaborative Model</h3>
              <p className="text-gray-600">Engage in the moving process and save costs by assisting where possible.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="py-16 bg-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {/* Custom Pricing */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Custom Pricing for Every Move</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Our pricing is 100% tailored to your needs. Whether you're moving a single room or an entire apartment, 
                we calculate your estimate based on three key factors: the items you select, the distance between locations, 
                and any extra services like carrying or assembly. This way, smaller or simpler moves stay affordable — 
                and large moves stay fair.
              </p>
            </div>

            {/* Student-Friendly Focus */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Focus on Affordable, Student-Friendly Moves</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                We know that many of our customers — especially students — only need help with a few items. 
                That's why we eliminated fixed standard charges and unnecessary overhead like requiring two movers by default.
              </p>
            </div>

            {/* Interactive Moving */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Interactive Moving: Engage and Save</h2>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>
                  Our model is built around what most customers actually need: the vehicle and the transport. 
                  Everything else — carrying items up stairs, assembling furniture, or extra helpers — is optional.
                </p>
                <p>
                  The more you do yourself, the more you save. If you and your friends handle the carrying, 
                  or you choose to bring your items to ground level, your price stays close to the core transport cost.
                </p>
                <p>
                  Only need help with carrying for a few bulky pieces? Select those individually and leave the rest to yourself. 
                  We price accordingly — no blanket charges.
                </p>
                <p className="font-semibold">
                  You stay in control of what you pay by selecting only the exact support you need.
                </p>
              </div>
            </div>

            {/* Door-to-Door Service */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Door-to-Door Service Without the Extras You Don't Need</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                We focus on what matters most: getting your items from A to B — quickly, safely, and affordably. 
                By default, we pick from and deliver to the ground floor, which keeps the base cost low. 
                You can always add services like carrying or assembly, but you'll only pay for them if you actually need them. 
                This lets us keep pricing lean for everyone, especially those who just need help moving — not full-service handling.
              </p>
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
              <p className="font-medium">Additional Services</p>
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

      {/* CTA Section */}
      <div className="py-16 bg-orange-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Ready to Move?</h2>
          <Link 
            to="/house-moving" 
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

export default HouseMovingLearnMore; 