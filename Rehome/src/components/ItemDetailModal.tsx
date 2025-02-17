import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaTimes, FaChevronLeft, FaChevronRight, FaShoppingCart } from "react-icons/fa";
import logo from "../../src/assets/logorehome.jpg";
import { useNavigate } from 'react-router-dom';

interface ItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: number;
    name: string;
    description: string;
    image_url: string[];
    price: number;
    created_at: string;
    city_name: string;
    sold: boolean;
    seller_email: string;
  } | null;
  onAddToCart?: (itemId: number) => void;
  onMarkAsSold?: (itemId: number) => void;
}

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  item, 
  onAddToCart, 
  onMarkAsSold 
}) => {
  if (!isOpen || !item) return null;
  const navigate = useNavigate(); // Initialize navigate

  const { id, name, description, image_url, price, city_name, sold } = item;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const goToNextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % image_url.length);
  };

  const goToPrevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + image_url.length) % image_url.length);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl p-8 max-w-6xl w-full mx-4 relative overflow-hidden"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700 transition-colors"
        >
          &times;
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Image Carousel Section */}
          <div className="md:w-1/2 relative group">
            <div className="relative aspect-square overflow-hidden rounded-xl">
              <motion.img
                key={currentImageIndex}
                src={image_url[currentImageIndex]}
                alt={name}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Navigation Arrows */}
            {image_url.length > 1 && (
              <>
                <button
                  onClick={goToPrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-3 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <FaChevronLeft className="text-gray-700" />
                </button>
                <button
                  onClick={goToNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-3 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <FaChevronRight className="text-gray-700" />
                </button>
              </>
            )}

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {image_url.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-gray-700' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Details Section */}
          <div className="md:w-1/2 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <img src={logo} alt="Rehome Logo" className="h-10 w-auto" />
              <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
            </div>

            <div className="space-y-6 flex-1">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-emerald-600">
                    €{price.toLocaleString()}
                  </span>
                  <span className={`px-3 py-1 rounded-full ${sold ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {sold ? <FaCheckCircle className="inline mr-2" /> : <FaTimes className="inline mr-2" />}
                    {sold ? 'Sold' : 'Available'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{city_name}</span>
                </div>
              </div>

              <div className="prose text-gray-600">
                <h3 className="text-lg font-semibold mb-2">Product Details</h3>
                <p className="whitespace-pre-line">{description}</p>
              </div>
            </div>

            {/* Action Buttons at the Bottom */}
            <div className="mt-6 flex gap-3">
              {onMarkAsSold && (
                <button
                  onClick={() => onMarkAsSold(id)}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                    sold ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                  disabled={sold}
                >
                  {sold ? <FaCheckCircle /> : 'Mark as Sold'}
                  {sold ? 'Marked Sold' : 'Mark as Sold'}
                </button>
              )}
              {onAddToCart && (
                <button
                  onClick={() => {onAddToCart(id); navigate('/pricing')}}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <FaShoppingCart /> Add to Cart
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ItemDetailsModal;