import React, { useState } from 'react';
import { FaShoppingCart, FaCheck } from 'react-icons/fa';
import { useCart } from '../../contexts/CartContext';
import { FurnitureItem } from '../../types/furniture';

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

  // Apply classes based on button type
  const buttonClass = buttonType === 'primary'
    ? 'bg-orange-500 hover:bg-orange-600 text-white'
    : 'border border-orange-500 text-orange-500 hover:bg-orange-50';

  const handleAddToCart = () => {
    addItem(item);
    
    if (showFeedback) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 1500);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      className={`px-4 py-2 rounded-md transition-colors flex items-center justify-center ${buttonClass}`}
      aria-label="Add to cart"
    >
      {showSuccess ? (
        <>
          <FaCheck className="mr-2" />
          Added to Cart
        </>
      ) : (
        <>
          <FaShoppingCart className="mr-2" />
          {item.isrehome ? 'Add to Cart' : 'Bid'}
        </>
      )}
    </button>
  );
};

export default AddToCartButton; 