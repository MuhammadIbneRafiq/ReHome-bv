import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTruck, FaTimes, FaArrowRight, FaInfoCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface TransportationServicePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onDontShowAgain?: () => void;
}

const TransportationServicePopup: React.FC<TransportationServicePopupProps> = ({
  isOpen,
  onClose,
}) => {


  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-xl shadow-2xl max-w-md w-full relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <FaTimes className="w-5 h-5" />
          </button>

          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <FaTruck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Need Help Picking Up?</h2>
                <p className="text-orange-100 text-sm">We've got you covered!</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <FaInfoCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Found the perfect item but can't pick it up yourself? 
                    <strong className="text-orange-600"> ReHome's Item Transportation Service</strong> can help!
                  </p>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-orange-800 text-sm">What we offer:</h3>
                <ul className="text-xs text-orange-700 space-y-1">
                  <li>• Professional pickup and delivery</li>
                  <li>• Safe handling of your items</li>
                  <li>• Assembly/disassembly if needed</li>
                  <li>• Flexible scheduling options</li>
                  <li>• Competitive pricing</li>
                </ul>
              </div>

              <div className="flex space-x-3 pt-2">
                <Link
                  to="/item-transport"
                  onClick={onClose}
                  className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-lg font-medium text-sm hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Item Transport</span>
                  <FaArrowRight className="w-3 h-3" />
                </Link>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>

          
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TransportationServicePopup; 