import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaTimes, FaChevronLeft, FaChevronRight, FaShoppingCart, FaComments, FaGavel, FaClock, FaExclamationTriangle } from "react-icons/fa";
import logo from "../../src/assets/logorehome.jpg"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { useNavigate } from 'react-router-dom';
import useUserStore from '../services/state/useUserSessionStore';
import { sendMessage } from '../services/marketplaceMessageService';
import { toast } from 'react-toastify';
import { 
  placeBid, 
  getBidsByItemId, 
  getHighestBidForItem, 
  getUserBidForItem, 
  canAddToCart, 
  subscribeToBidUpdates,
  MarketplaceBid 
} from '../services/biddingService';

interface ItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string; // Always UUID string now
    name: string;
    description: string;
    image_urls?: string[]; // Fixed to match database column name
    price?: number;
    created_at: string;
    city_name: string;
    sold: boolean;
    status?: string; // New status field: available, reserved, sold
    seller_email: string;
    isrehome?: boolean;
  } | null;
  onAddToCart?: (itemId: string) => void;
  onMarkAsSold?: (itemId: string) => void;
  onUpdateStatus?: (itemId: string, status: string) => void;
  showStatusIndicator?: boolean; // New prop to control status display
}

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  item, 
  onAddToCart, 
  onMarkAsSold,
  onUpdateStatus,
  showStatusIndicator = false // Default to false (don't show in marketplace)
}) => {
  // Move ALL hooks to the top, before any conditional logic
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bids, setBids] = useState<MarketplaceBid[]>([]);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userBid, setUserBid] = useState<MarketplaceBid | null>(null);
  const [highestBid, setHighestBid] = useState<MarketplaceBid | null>(null);
  const [canAddToCartStatus, setCanAddToCartStatus] = useState<{canAdd: boolean; message: string}>({canAdd: false, message: ''});
  const [loadingBids, setLoadingBids] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  // Load bidding data when modal opens
  useEffect(() => {
    if (isOpen && item && !item.isrehome && user?.email) {
      loadBiddingData();
      
      // Subscribe to real-time bid updates
      const unsubscribe = subscribeToBidUpdates(item.id, (updatedBids) => {
        setBids(updatedBids);
        loadBiddingData(); // Reload all data when bids change
      });

      return unsubscribe;
    }
  }, [isOpen, item?.id, item?.isrehome, user?.email]);

  // Reset state when modal closes or item changes
  useEffect(() => {
    if (!isOpen) {
      setCurrentImageIndex(0);
      setBids([]);
      setShowBidModal(false);
      setBidAmount('');
      setBidError('');
      setIsProcessing(false);
      setUserBid(null);
      setHighestBid(null);
      setCanAddToCartStatus({canAdd: false, message: ''});
      setLoadingBids(false);
    }
  }, [isOpen]);

  // Since we're using AnimatePresence in parent, we don't need conditional return here
  // The component should always render when called, but handle null item gracefully
  if (!item) {
    return null;
  }

  const { id, name, description, image_urls, price, city_name, sold, status, seller_email, isrehome } = item;
  
  // Check if user is the seller
  const isUserSeller = user?.email === seller_email;

  const goToNextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % (image_urls?.length || 1));
  };

  const goToPrevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + (image_urls?.length || 1)) % (image_urls?.length || 1));
  };

  const loadBiddingData = async () => {
    if (!user?.email || !item) return;
    
    setLoadingBids(true);
    try {
      // Load all data in parallel - Use id directly without conversion
      const [allBids, usersBid, highest, cartStatus] = await Promise.all([
        getBidsByItemId(item.id),
        getUserBidForItem(item.id, user.email),
        getHighestBidForItem(item.id),
        canAddToCart(item.id, user.email)
      ]);

      // Only update state if component is still mounted and modal is still open
      if (isOpen && item) {
        setBids(allBids);
        setUserBid(usersBid);
        setHighestBid(highest);
        setCanAddToCartStatus(cartStatus);
      }
    } catch (error) {
      console.error('Error loading bidding data:', error);
    } finally {
      if (isOpen) {
        setLoadingBids(false);
      }
    }
  };

  // Handle bid submit
  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      setBidError('Please enter a valid bid amount.');
      return;
    }
    if (highestBid && amount <= highestBid.bid_amount) {
      setBidError(`Your bid must be higher than the current highest bid of €${highestBid.bid_amount}`);
      return;
    }

    if (!user) {
      setBidError('You must be logged in to place a bid.');
      return;
    }

    setIsProcessing(true);
    try {
      const bidData = {
        item_id: id, // Use id directly without conversion
        bidder_email: user.email,
        bidder_name: user.email,
        bid_amount: amount,
        status: 'active' as const
      };

      const result = await placeBid(bidData, name);
      if (result) {
        setShowBidModal(false);
        setBidAmount('');
        setBidError('');
        await loadBiddingData(); // Reload data after successful bid
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      setBidError('Failed to place bid. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle initiating chat from item details - now shows preview
  const handleInitiateChat = () => {
    if (!user) {
      navigate('/login?redirect=back');
      return;
    }

    // Don't allow chatting with yourself
    if (isUserSeller) {
      toast.info("You can't chat with yourself as the seller");
      return;
    }

    // Set default message and show chat modal
    setChatMessage(`Hi, I'm interested in your item: ${name}`);
    setShowChatModal(true);
  };

  // Handle sending the chat message
  const handleSendChatMessage = async () => {
    if (!chatMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to send messages");
      return;
    }

    try {
      setIsProcessing(true);
      await sendMessage({
        item_id: id, // Use UUID directly for chat
        content: chatMessage,
        sender_id: user.email,
        sender_name: user.email,
        receiver_id: seller_email
      });
      
      // Close modals and redirect to the chat dashboard
      setShowChatModal(false);
      onClose();
      navigate('/sell-dash', { state: { activeTab: 'chats', activeItemId: id } });
      toast.success("Message sent successfully!");
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle status update with confirmation
  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === 'sold') {
      const confirmed = window.confirm(
        "⚠️ Warning: If you mark this item as SOLD, we will remove your advertisement from the marketplace.\n\nDo you want to proceed?"
      );
      if (!confirmed) return;
    }
    
    if (onUpdateStatus) {
      await onUpdateStatus(id, newStatus);
    }
  };

  // Get status display properties
  const getStatusDisplay = (status?: string, sold?: boolean) => {
    // Fallback to sold field if status not available
    const actualStatus = status || (sold ? 'sold' : 'available');
    
    switch (actualStatus) {
      case 'available':
        return {
          icon: <FaCheckCircle className="inline mr-2" />,
          text: 'Available',
          bgColor: 'bg-green-100 text-green-800'
        };
      case 'reserved':
        return {
          icon: <FaClock className="inline mr-2" />,
          text: 'Reserved',
          bgColor: 'bg-yellow-100 text-yellow-800'
        };
      case 'sold':
        return {
          icon: <FaTimes className="inline mr-2" />,
          text: 'Sold',
          bgColor: 'bg-red-100 text-red-800'
        };
      default:
        return {
          icon: <FaExclamationTriangle className="inline mr-2" />,
          text: 'Unknown',
          bgColor: 'bg-gray-100 text-gray-800'
        };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000] p-4"
          onClick={onClose} // Close on backdrop click
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            {/* Close Button - More prominent and higher z-index */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 z-[1010] hover:bg-gray-200 transition"
              aria-label="Close"
            >
              <FaTimes className="w-5 h-5" />
            </button>

            <div className="p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Image Section */}
                <div className="relative">
                  <div className="relative aspect-square overflow-hidden rounded-lg">
                    <AnimatePresence initial={false}>
                      <motion.img
                        key={currentImageIndex}
                        src={image_urls?.[currentImageIndex] || '/placeholder-image.jpg'}
                        alt={name}
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </AnimatePresence>
                  </div>

                  {image_urls && image_urls.length > 1 && (
                    <>
                      <button onClick={goToPrevImage} className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full z-10 hover:bg-opacity-60">
                        <FaChevronLeft />
                      </button>
                      <button onClick={goToNextImage} className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full z-10 hover:bg-opacity-60">
                        <FaChevronRight />
                      </button>
                    </>
                  )}
                  
                  {/* Dots Indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {image_urls?.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Details Section */}
                <div className="flex flex-col">
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
                          {price === 0 ? 'Free' : `€${price?.toLocaleString() || '0'}`}
                        </span>
                        {/* Only show status indicator if showStatusIndicator prop is true (dashboard view) */}
                        {showStatusIndicator && (
                          <span className={`px-3 py-1 rounded-full ${getStatusDisplay(status, sold).bgColor}`}>
                            {getStatusDisplay(status, sold).icon}
                            {getStatusDisplay(status, sold).text}
                          </span>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* ReHome items: Show Add to Cart or bidding-based message */}
                        {!sold && !isUserSeller && isrehome && (
                          <>
                            {canAddToCartStatus.canAdd ? (
                          <button
                            onClick={() => onAddToCart && onAddToCart(id)}
                            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                          >
                            <FaShoppingCart />
                            Add to Cart
                          </button>
                            ) : (
                              <div className="col-span-2 bg-yellow-100 text-yellow-800 py-3 px-4 rounded-lg text-center font-medium">
                                {canAddToCartStatus.message}
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* User listings: Show contact seller message and chat button */}
                        {!sold && !isUserSeller && !isrehome && (
                          <>
                          <div className="col-span-2 bg-gray-100 text-gray-600 py-3 px-4 rounded-lg text-center font-medium">
                            Contact seller directly for user listings
                          </div>
                            {/* Chat button for user listings only */}
                          <button
                            onClick={handleInitiateChat}
                            disabled={isProcessing}
                              className="col-span-2 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {isProcessing ? (
                              <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                            ) : (
                              <FaComments />
                            )}
                            Chat with Seller
                          </button>
                          </>
                        )}
                        
                        {/* ReHome items: Show special message about bidding system */}
                        {!sold && !isUserSeller && isrehome && (
                          <div className="col-span-2 bg-blue-100 text-blue-800 py-3 px-4 rounded-lg text-center font-medium">
                            <FaGavel className="inline mr-2" />
                            ReHome Item - Bidding system active. Place your bid below!
                          </div>
                        )}
                      </div>
                      
                      {/* Bidding Section - for both user listings and ReHome items */}
                      {!isUserSeller && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-3">
                            <FaGavel className="text-orange-500" />
                            <span className="font-semibold">Bids:</span>
                            {loadingBids ? (
                              <span className="text-gray-500">Loading bids...</span>
                            ) : bids.length === 0 ? (
                              <span className="text-gray-500">No bids yet</span>
                            ) : highestBid ? (
                              <span className="text-orange-600 font-bold">
                                Highest bid: €{highestBid.bid_amount}
                              </span>
                            ) : (
                              <span className="text-gray-500">No bids yet</span>
                            )}
                            <button
                              className="ml-4 px-4 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded disabled:opacity-50"
                              onClick={() => setShowBidModal(true)}
                              disabled={loadingBids || !user}
                            >
                              Bid
                            </button>
                          </div>

                          {/* User's current bid status */}
                          {userBid && (
                            <div className={`mb-3 p-2 rounded text-sm ${
                              userBid.bidder_email === user?.email && highestBid?.bidder_email === user?.email 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              Your bid: €{userBid.bid_amount} - {
                                userBid.bidder_email === user?.email && highestBid?.bidder_email === user?.email 
                                  ? 'You have the highest bid!' 
                                  : 'Bid placed'
                              }
                            </div>
                          )}

                          {/* Bid/Message Overview */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold mb-3 text-gray-800">Bid/Message Overview</h4>
                            
                            {/* Bids Section */}
                            <div className="mb-4">
                              <h5 className="font-medium text-gray-700 mb-2">Bids:</h5>
                              {bids.length === 0 ? (
                                <p className="text-gray-500 text-sm">No bids yet</p>
                              ) : (
                                <div className="space-y-2">
                                  {bids.slice(0, 5).map((bid, idx) => (
                                    <div key={bid.id || idx} className="flex justify-between items-center text-sm">
                                      <span className="font-medium">
                                        €{bid.bid_amount} by {bid.bidder_email === user?.email ? 'You' : bid.bidder_name || 'Anonymous'}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">
                                          {new Date(bid.created_at || '').toLocaleDateString()}
                                        </span>
                                        {bid.is_highest && (
                                          <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                                            Highest
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Messages Section - only for ReHome items (no chat for user listings) */}
                            {isrehome && (
                            <div>
                                <h5 className="font-medium text-gray-700 mb-2">Messages:</h5>
                                {bids.filter(bid => bid.bidder_email === user?.email).length > 0 ? (
                                  <div className="space-y-2">
                                    {bids
                                      .filter(bid => bid.bidder_email === user?.email)
                                      .slice(0, 3)
                                      .map((bid, idx) => (
                                        <div key={`msg-${bid.id || idx}`} className="text-sm text-gray-600">
                                          Hi, I placed a bid of €{bid.bid_amount} for your item {name}. Let me know if you're interested!
                                        </div>
                                ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 text-sm">No messages yet</p>
                                )}
                            </div>
                          )}
                          </div>
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
                  <div className="mt-6 space-y-3">
                    {/* Status Update Buttons - for sellers only */}
                    {isUserSeller && onUpdateStatus && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusUpdate('available')}
                          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                            (status || (sold ? 'sold' : 'available')) === 'available' 
                              ? 'bg-green-500 text-white' 
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          <FaCheckCircle className="inline mr-1" /> Available
                        </button>
                        <button
                          onClick={() => handleStatusUpdate('reserved')}
                          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                            (status || (sold ? 'sold' : 'available')) === 'reserved' 
                              ? 'bg-yellow-500 text-white' 
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          }`}
                        >
                          <FaClock className="inline mr-1" /> Reserved
                        </button>
                        <button
                          onClick={() => handleStatusUpdate('sold')}
                          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                            (status || (sold ? 'sold' : 'available')) === 'sold' 
                              ? 'bg-red-500 text-white' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          <FaTimes className="inline mr-1" /> Sold
                        </button>
                      </div>
                    )}
                    
                    {/* Legacy Mark as Sold button */}
                    {onMarkAsSold && !onUpdateStatus && (
                      <button
                        onClick={() => onMarkAsSold(id)}
                        className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
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
            </div>
            
            {/* Chat Message Modal */}
            <AnimatePresence>
              {showChatModal && (
                <motion.div 
                  className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative">
                  <button className="absolute top-2 right-2 text-gray-400 hover:text-blue-600 text-xl" onClick={() => setShowChatModal(false)}>&times;</button>
                  <h3 className="text-lg font-bold mb-4 text-blue-700">Send Message to Seller</h3>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2 font-medium">Your message</label>
                    <textarea
                      value={chatMessage}
                      onChange={e => setChatMessage(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Write your message here..."
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="flex justify-between">
                    <button 
                      type="button" 
                      className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" 
                      onClick={() => setShowChatModal(false)}
                      disabled={isProcessing}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50" 
                      onClick={handleSendChatMessage}
                      disabled={isProcessing || !chatMessage.trim()}
                    >
                      {isProcessing ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </div>
              </motion.div>
              )}
            </AnimatePresence>

            {/* Bid Modal */}
            <AnimatePresence>
              {showBidModal && (
                <motion.div 
                  className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-xs w-full relative">
                  <button className="absolute top-2 right-2 text-gray-400 hover:text-orange-600 text-xl" onClick={() => setShowBidModal(false)}>&times;</button>
                  <h3 className="text-lg font-bold mb-4 text-orange-700">Place Your Bid</h3>
                  <form onSubmit={handleBidSubmit}>
                    <label className="block text-gray-700 mb-2 font-medium">Your bid</label>
                    <input
                      type="number"
                      min={highestBid ? highestBid.bid_amount + 1 : 1}
                      step="0.01"
                      value={bidAmount}
                      onChange={e => setBidAmount(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter your bid"
                      required
                      disabled={isProcessing}
                    />
                    {bidError && <div className="text-red-500 text-sm mb-2">{bidError}</div>}
                    <div className="flex justify-between mt-4">
                      <button type="button" className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={() => setShowBidModal(false)}>Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">Place Bid</button>
                    </div>
                  </form>
                </div>
              </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ItemDetailsModal;