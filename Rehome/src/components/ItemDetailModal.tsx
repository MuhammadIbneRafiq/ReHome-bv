import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaTimes, FaChevronLeft, FaChevronRight, FaShoppingCart, FaComments } from "react-icons/fa";
import logo from "../../src/assets/logorehome.jpg";
import { useNavigate } from 'react-router-dom';
import useUserStore from '../services/state/useUserSessionStore';
import { sendMessage } from '../services/marketplaceMessageService';
import { toast } from 'react-toastify';

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
  const user = useUserStore((state) => state.user);

  const { id, name, description, image_url, price, city_name, sold, seller_email } = item;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // Bidding system state
  const [bids, setBids] = useState<{amount: number, user: string, time: string}[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Check if user is the seller
  const isUserSeller = user?.email === seller_email;

  const goToNextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % image_url.length);
  };

  const goToPrevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + image_url.length) % image_url.length);
  };

  // Get highest bid
  const highestBid = bids.length > 0 ? Math.max(...bids.map(b => b.amount)) : null;

  // Handle bid submit
  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      setBidError('Please enter a valid bid amount.');
      return;
    }
    if (highestBid && amount <= highestBid) {
      setBidError('Your bid must be higher than the current highest bid.');
      return;
    }
    // Add bid
    const currentTime = new Date().toISOString();
    setBids(prev => [...prev, { amount, user: 'You', time: currentTime }]);
    // Add message
    setMessages(prev => [
      ...prev,
      `Hi, I placed a bid of €${amount} for your item ${name}. Let me know if you're interested!`
    ]);
    setShowBidModal(false);
    setBidAmount('');
    setBidError('');
  };

  // Handle initiating chat from item details
  const handleInitiateChat = async () => {
    if (!user) {
      navigate('/login?redirect=back');
      return;
    }

    // Don't allow chatting with yourself
    if (isUserSeller) {
      toast.info("You can't chat with yourself as the seller");
      return;
    }

    // Send an initial message to start the conversation if this is the first interaction
    try {
      setIsProcessing(true);
      await sendMessage({
        item_id: id,
        content: `Hi, I'm interested in your item: ${name}`,
        sender_id: user.email,
        sender_name: user.email,
        receiver_id: seller_email
      });
      
      // Close the modal and redirect to the chat dashboard
      onClose();
      navigate('/sell-dash', { state: { activeTab: 'chats', activeItemId: id } });
    } catch (error) {
      console.error('Error initiating chat:', error);
      toast.error("Failed to initiate chat. Please try again later.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl p-8 max-w-5xl w-full mx-4 relative overflow-hidden"
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

            {isUserSeller && (
              <div className="mb-4 bg-blue-100 text-blue-800 px-3 py-2 rounded-md">
                <FaCheckCircle className="inline-block mr-2" />
                This is your listing
              </div>
            )}

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
                
                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {!sold && !isUserSeller && (
                    <button
                      onClick={() => onAddToCart && onAddToCart(id)}
                      className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                    >
                      <FaShoppingCart />
                      Add to Cart
                    </button>
                  )}
                  
                  {/* Chat button - disabled for own items */}
                  {!isUserSeller && (
                    <button
                      onClick={handleInitiateChat}
                      disabled={isProcessing}
                      className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      ) : (
                        <FaComments />
                      )}
                      Chat with Seller
                    </button>
                  )}
                </div>
                
                {/* Bidding Section - hide for own items */}
                {!isUserSeller && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Bids:</span>
                      {bids.length === 0 ? (
                        <span className="text-gray-500">Make the first bid now</span>
                      ) : (
                        <span className="text-orange-600 font-bold">Highest bid: €{highestBid}</span>
                      )}
                      <button
                        className="ml-4 px-4 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded"
                        onClick={() => setShowBidModal(true)}
                      >
                        Bid
                      </button>
                    </div>
                  </div>
                )}

                {/* Bid/Message Overview */}
                {(bids.length > 0 || messages.length > 0) && (
                  <div className="mb-4 bg-orange-50 p-3 rounded">
                    <h4 className="font-semibold mb-2 text-orange-700">Bid/Message Overview</h4>
                    {bids.length > 0 && (
                      <div className="mb-2">
                        <div className="font-medium text-gray-700 mb-1">Bids:</div>
                        <ul className="text-sm text-gray-800 space-y-1">
                          {bids.map((bid, idx) => (
                            <li key={idx} className="flex justify-between">
                              <span>€{bid.amount} by {bid.user}</span>
                              <span className="text-gray-400">{bid.time}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {messages.length > 0 && (
                      <div>
                        <div className="font-medium text-gray-700 mb-1">Messages:</div>
                        <ul className="text-sm text-gray-800 space-y-1">
                          {messages.map((msg, idx) => (
                            <li key={idx}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

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
            </div>
          </div>
        </div>

        {/* Bid Modal */}
        {showBidModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-xs w-full relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-orange-600 text-xl" onClick={() => setShowBidModal(false)}>&times;</button>
              <h3 className="text-lg font-bold mb-4 text-orange-700">Bids</h3>
              <form onSubmit={handleBidSubmit}>
                <label className="block text-gray-700 mb-2 font-medium">Your bid</label>
                <input
                  type="number"
                  min={highestBid ? highestBid + 1 : 1}
                  step="0.01"
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter your bid"
                  required
                />
                {bidError && <div className="text-red-500 text-sm mb-2">{bidError}</div>}
                <div className="flex justify-between mt-4">
                  <button type="button" className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={() => setShowBidModal(false)}>Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">Place bid</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ItemDetailsModal;