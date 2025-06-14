import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaCheck, FaGavel } from 'react-icons/fa';
import { useCart } from '../../contexts/CartContext';
import { FurnitureItem } from '../../types/furniture';
import { canAddToCart } from '../../services/biddingService';
import useUserStore from '../../services/state/useUserSessionStore';
import { toast } from 'react-toastify';

interface AddToCartButtonProps {
  item: FurnitureItem;
  buttonType?: 'primary' | 'secondary';
  showFeedback?: boolean;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({ 
  item, 
  buttonType = 'primary',
  showFeedback = true
}) => {
  const { addItem } = useCart();
  const [showSuccess, setShowSuccess] = useState(false);
  const [canAdd, setCanAdd] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [checking, setChecking] = useState(false);
  const user = useUserStore((state) => state.user);

  // Apply classes based on button type
  const buttonClass = buttonType === 'primary'
    ? 'bg-orange-500 hover:bg-orange-600 text-white'
    : 'border border-orange-500 text-orange-500 hover:bg-orange-50';

  // Check if user can add to cart for ReHome items
  useEffect(() => {
    if (item.isrehome && user) {
      setChecking(true);
      canAddToCart(item.id, user.email).then(result => {
        setCanAdd(result.canAdd);
        setStatusMessage(result.message);
        setChecking(false);
      });
    } else if (item.isrehome) {
      setCanAdd(false);
      setStatusMessage('Please log in to purchase');
      setChecking(false);
    } else {
      setCanAdd(true);
      setStatusMessage('');
      setChecking(false);
    }
  }, [item.id, item.isrehome, user]);

  const handleAddToCart = () => {
    // For ReHome items, check bidding status first
    if (item.isrehome && !canAdd) {
      toast.error(statusMessage);
      return;
    }
    
    addItem(item);
    
    if (showFeedback) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 1500);
    }
  };

  // Show appropriate button based on item type and bidding status
  if (!item.isrehome) {
    return (
      <button
        onClick={() => toast.info('Please contact the seller directly to purchase this item')}
        className={`px-4 py-2 rounded-md transition-colors flex items-center justify-center ${buttonClass}`}
        aria-label="Contact seller"
      >
        <FaGavel className="mr-2" />
        Contact Seller
      </button>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={checking || (item.isrehome && !canAdd)}
      className={`px-4 py-2 rounded-md transition-colors flex items-center justify-center ${buttonClass} ${
        (checking || (item.isrehome && !canAdd)) ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      aria-label="Add to cart"
      title={item.isrehome && !canAdd ? statusMessage : undefined}
    >
      {checking ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
          Checking...
        </>
      ) : showSuccess ? (
        <>
          <FaCheck className="mr-2" />
          Added to Cart
        </>
      ) : (
        <>
          <FaShoppingCart className="mr-2" />
          Add to Cart
        </>
      )}
    </button>
  );
};

export default AddToCartButton; 