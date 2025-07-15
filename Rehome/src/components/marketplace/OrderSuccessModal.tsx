import React from 'react';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
}

const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ 
  isOpen, 
  onClose, 
  orderNumber 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Thank You!</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Success Icon */}
        <div className="text-center mb-6">
          <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Your order has been placed successfully, check your email for confirmation!
          </h3>
          <p className="text-gray-600 text-sm">
            Order #{orderNumber}
          </p>
        </div>

        {/* Message */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 leading-relaxed">
            We'll now integrate it into our delivery schedule and get back to you soon with the delivery date and invoice.
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-orange-500 text-white py-3 px-4 rounded-md hover:bg-orange-600 transition-colors font-medium"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default OrderSuccessModal; 