import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaTimes, FaShoppingCart, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    image_url: string[];
  }>;
  totalAmount: number;
  onConfirmOrder: () => void;
}

const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  items,
  totalAmount,
  onConfirmOrder
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleConfirmOrder = async () => {
    setIsConfirming(true);
    try {
      await onConfirmOrder();
      toast.success('Order confirmed! Items will be reserved for pickup.');
    } catch (error) {
      console.error('Error confirming order:', error);
      toast.error('Failed to confirm order. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaShoppingCart className="text-orange-500 text-2xl mr-3" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Order Confirmation</h2>
                <p className="text-sm text-gray-600">Order #{orderNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Important Notice */}
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Important:</strong> This order is for ReHome items. Items will be reserved for pickup after confirmation.
                Our team will contact you within 24 hours to arrange pickup details and payment.
              </p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div className="flex items-center">
                  <img
                    src={item.image_url[0]}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="ml-4">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">€{(item.price * item.quantity).toFixed(2)}</p>
                  <p className="text-sm text-gray-500">€{item.price} each</p>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
              <span className="text-lg font-bold text-orange-600">€{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your order will be reserved for 48 hours</li>
              <li>• Our team will contact you to arrange pickup</li>
              <li>• Payment can be made during pickup</li>
              <li>• Items will be marked as sold after confirmation</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmOrder}
              disabled={isConfirming}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isConfirming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                  Confirming...
                </>
              ) : (
                <>
                  <FaCheckCircle className="mr-2" />
                  Confirm Order
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderConfirmationModal; 