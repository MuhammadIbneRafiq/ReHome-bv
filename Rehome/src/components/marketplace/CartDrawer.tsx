import React, { useRef, useEffect, useState } from 'react';
import { FaShoppingCart, FaTimes, FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import { useCart } from '../../contexts/CartContext';
// import { useTranslation } from 'react-i18next';
import logoImage from "../../assets/logorehome.jpg";
import CheckoutConfirmation from './CheckoutConfirmation';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  // const { t } = useTranslation();
  const { items, removeItem, updateQuantity, clearCart, totalPrice, itemCount } = useCart();
  const cartRef = useRef<HTMLDivElement>(null);
  const [showCheckoutConfirmation, setShowCheckoutConfirmation] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  // Close cart when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(event.target as Node) && isOpen) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Prevent scrolling when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Format price to show 2 decimal places
  const formatPrice = (price: number) => {
    return `€${price.toFixed(2)}`;
  };

  // Generate a random order number
  const generateOrderNumber = () => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `RH-${timestamp.toString().slice(-6)}-${random}`;
  };

  // Handle checkout process
  const handleCheckout = () => {
    // In a real app, you would call an API to process the order
    // For now, we'll simulate by generating an order number
    setOrderNumber(generateOrderNumber());
    setShowCheckoutConfirmation(true);
    onClose(); // Close the cart drawer
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Cart Drawer */}
      <div 
        ref={cartRef}
        className={`fixed top-0 right-0 h-screen w-full sm:w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-orange-500 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <FaShoppingCart className="mr-2" /> Shopping Cart
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-orange-600 transition-colors"
            aria-label="Close cart"
          >
            <FaTimes />
          </button>
        </div>

        {/* Cart Content */}
        <div className="flex flex-col h-[calc(100%-14rem)]">
          {/* Empty Cart Message */}
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center p-8 h-full">
              <FaShoppingCart className="text-gray-300 text-5xl mb-4" />
              <p className="text-lg text-gray-500">Your cart is empty</p>
              <p className="text-sm text-gray-400 mt-2">Browse our marketplace to find great items</p>
            </div>
          )}

          {/* Cart Items */}
          {items.length > 0 && (
            <div className="overflow-y-auto p-4 flex-grow">
              {items.map(item => (
                <div key={item.id} className="border-b border-gray-200 py-4">
                  <div className="flex mb-2">
                    {/* Item Image */}
                    <div className="relative w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      <img 
                        src={item.image_url[0]} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                      {item.isrehome && (
                        <div className="absolute top-0 left-0 p-0.5 bg-white">
                          <img 
                            src={logoImage} 
                            alt="ReHome" 
                            className="w-4 h-4" 
                          />
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="ml-4 flex-grow">
                      <h3 className="text-sm font-medium">{item.name}</h3>
                      <p className="text-xs text-gray-500">{item.category} • {item.subcategory}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-orange-600 font-medium">{formatPrice(item.price)}</span>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500 ml-2"
                      aria-label="Remove item"
                    >
                      <FaTrash />
                    </button>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex justify-end items-center mt-2">
                    <div className="flex items-center border rounded-md">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                        aria-label="Decrease quantity"
                      >
                        <FaMinus size={10} />
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-800">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                        aria-label="Increase quantity"
                      >
                        <FaPlus size={10} />
                      </button>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="text-right mt-2">
                    <span className="text-xs text-gray-500">
                      Subtotal: <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {/* Summary */}
          <div className="flex justify-between mb-4">
            <span className="text-gray-600">Items ({itemCount})</span>
            <span className="font-semibold">{formatPrice(totalPrice)}</span>
          </div>

          {/* Carrying & Assembly Options Note */}
          {items.length > 0 && items.some(item => item.isrehome) && (
            <div className="mb-4 text-xs text-gray-500 p-2 bg-gray-100 rounded">
              <p>Carrying assistance and assembly options will be available during checkout.</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            <button 
              className="bg-orange-500 text-white p-2 rounded-md hover:bg-orange-600 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={items.length === 0}
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </button>
            {items.length > 0 && (
              <button 
                onClick={clearCart}
                className="text-gray-500 text-sm hover:text-red-500 transition-colors text-center"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Confirmation Modal */}
      {showCheckoutConfirmation && (
        <CheckoutConfirmation 
          orderNumber={orderNumber} 
          onClose={() => setShowCheckoutConfirmation(false)} 
        />
      )}
    </>
  );
};

export default CartDrawer; 