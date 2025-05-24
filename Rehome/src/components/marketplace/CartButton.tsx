import React, { useState } from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../../contexts/CartContext';
import CartDrawer from './CartDrawer';

const CartButton: React.FC = () => {
  const { itemCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  return (
    <>
      <button
        onClick={toggleCart}
        className="relative p-2 text-orange-500 hover:text-orange-600 transition-colors"
        aria-label="Shopping cart"
      >
        <FaShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default CartButton; 