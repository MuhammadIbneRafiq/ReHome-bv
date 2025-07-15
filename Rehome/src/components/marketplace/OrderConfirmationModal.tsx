import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaEnvelope, FaShoppingCart } from 'react-icons/fa';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  isReHomeOrder: boolean;
  isMovingRequest?: boolean;
}

const OrderConfirmationModal = ({ isOpen, onClose, orderNumber, isReHomeOrder, isMovingRequest }: OrderConfirmationModalProps) => {
  const [countdown, setCountdown] = useState(40);
  
  // Auto-close after countdown
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl"
      >
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <FaCheckCircle className="text-green-500 text-6xl" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {isMovingRequest ? 'Request Submitted!' : 'Order Confirmed!'}
          </h2>
          <p className="text-gray-600 mb-4">
            {isMovingRequest 
              ? `Your moving request has been submitted successfully. Check your email for confirmation.`
              : `Check your email for confirmation. Your order #${orderNumber} has been placed successfully.`
            }
          </p>
          
          {(isReHomeOrder || isMovingRequest) && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <FaEnvelope className="text-orange-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">Confirmation Email Sent</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    We've sent you a confirmation email with your {isMovingRequest ? 'request' : 'order'} details. Our team will review and get back to you shortly with final pricing and delivery options..
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Marketplace Promotion */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <FaShoppingCart className="text-blue-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Want More Items?</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Visit our marketplace to add more items to your cart. We can provide a combined offer for multiple services!
                </p>
                <button
                  onClick={() => {
                    onClose();
                    window.location.href = '/marketplace';
                  }}
                  className="mt-2 text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
                >
                  Go to Marketplace
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={onClose}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              Continue ({countdown}s)
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderConfirmationModal; 