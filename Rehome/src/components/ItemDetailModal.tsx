import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
      id: number;
      name: string;
      description: string;
      image_urls: string[]; // Change to image_urls (plural)
      price: number;
      created_at: string;
      city_name: string;
      sold: boolean;
      seller_email: string; // Add seller_email to the interface
  } | null;
}

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({ isOpen, onClose, item }) => {
  if (!isOpen || !item) {
    return null;
  }

  const { name, description, image_urls, price, city_name } = item;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const goToNextImage = () => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % image_urls.length);
  };

  const goToPrevImage = () => {
      setCurrentImageIndex((prevIndex) => (prevIndex - 1 + image_urls.length) % image_urls.length);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full overflow-y-auto" // Added overflow-y-auto
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{name}</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            × {/* Close Icon (X) */}
          </button>
        </div>

        {/* Image Slider (Basic Implementation) - You'll want a proper carousel component */}
        {image_urls && image_urls.length > 0 && (
            <div className="relative mb-4">
                <img src={image_urls[currentImageIndex]} alt={name} className="w-full rounded-md" />
                {image_urls.length > 1 && ( // Show navigation buttons if there are multiple images
                    <>
                        <button
                            onClick={goToPrevImage}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2"
                        >
                            
                        </button>
                        <button
                            onClick={goToNextImage}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2"
                        >
                        
                        </button>
                    </>
                )}
            </div>
        )}

        <p className="text-gray-700 mb-2">{description}</p>
        <p className="text-gray-700 mb-2">Price: ${price}</p>
        <p className="text-gray-700 mb-2">City: {city_name}</p>

        <button
          onClick={onClose}
          className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md transition duration-200"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
};

export default ItemDetailsModal;