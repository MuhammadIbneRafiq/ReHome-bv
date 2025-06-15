import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrash, FaSearch, FaFilter, FaEye, FaCheck, FaGavel, FaClock, FaShoppingCart, FaBan } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabaseClient';
import logoImage from '../../assets/logorehome.jpg';
import { 
  getAllBidsForAdmin, 
  approveBid, 
  rejectBid, 
  getBidConfirmations, 
  confirmBid,
  BidWithItemDetails,
  BidConfirmation
} from '../../services/biddingService';

interface MarketplaceListing {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string[];
  city_name: string;
  seller_email: string;
  sold: boolean;
  status?: string;
  isrehome?: boolean;
  category?: string;
  subcategory?: string;
  condition_rating?: number;
  created_at: string;
  updated_at?: string;
  views_count?: number;
}

const MarketplaceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'listings' | 'bids' | 'confirmations'>('bids');
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [bids, setBids] = useState<BidWithItemDetails[]>([]);
  const [confirmations, setConfirmations] = useState<BidConfirmation[]>([]);
  const [filteredListings, setFilteredListings] = useState<MarketplaceListing[]>([]);
  const [filteredBids, setFilteredBids] = useState<BidWithItemDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'reserved' | 'sold'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'rehome' | 'user'>('all');
  const [bidStatusFilter, setBidStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'outbid'>('all');
  const [processingBids, setProcessingBids] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (activeTab === 'bids') {
      fetchBids();
    } else if (activeTab === 'confirmations') {
      fetchConfirmations();
    } else if (activeTab === 'listings') {
      fetchListings();
    }
  }, [activeTab]);

  useEffect(() => {
    filterData();
  }, [listings, bids, searchQuery, statusFilter, typeFilter, bidStatusFilter]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketplace_furniture')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching listings:', error);
        toast.error('Failed to fetch listings');
        return;
      }

      console.log('Fetched listings:', data?.length || 0, 'items');
      setListings(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    try {
      setLoading(true);
      const bidsData = await getAllBidsForAdmin();
      setBids(bidsData);
    } catch (error) {
      console.error('Error fetching bids:', error);
      toast.error('Failed to fetch bids - Database schema may need to be applied');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfirmations = async () => {
    try {
      setLoading(true);
      const confirmationsData = await getBidConfirmations();
      setConfirmations(confirmationsData);
    } catch (error) {
      console.error('Error fetching confirmations:', error);
      toast.error('Failed to fetch confirmations');
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    // Filter listings
    let filteredListingsData = [...listings];

    if (searchQuery) {
      filteredListingsData = filteredListingsData.filter(listing =>
        listing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.seller_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.city_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filteredListingsData = filteredListingsData.filter(listing =>
        statusFilter === 'available' ? (!listing.sold && (!listing.status || listing.status === 'available')) :
        statusFilter === 'reserved' ? (listing.status === 'reserved') :
        statusFilter === 'sold' ? (listing.sold || listing.status === 'sold') : true
      );
    }

    if (typeFilter !== 'all') {
      filteredListingsData = filteredListingsData.filter(listing =>
        typeFilter === 'rehome' ? listing.isrehome : !listing.isrehome
      );
    }

    setFilteredListings(filteredListingsData);

    // Filter bids
    let filteredBidsData = [...bids];

    if (searchQuery) {
      filteredBidsData = filteredBidsData.filter(bid =>
        bid.bidder_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bid.bidder_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bid.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bid.seller_email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (bidStatusFilter !== 'all') {
      filteredBidsData = filteredBidsData.filter(bid =>
        bid.status === bidStatusFilter
      );
    }

    setFilteredBids(filteredBidsData);
  };

  const handleApproveBid = async (bidId: string) => {
    try {
      setProcessingBids(prev => new Set(prev).add(bidId));
      
      const { data: userData } = await supabase.auth.getUser();
      const adminEmail = userData.user?.email;
      
      if (!adminEmail) {
        toast.error('Admin authentication required');
        return;
      }

      const success = await approveBid(bidId, adminEmail);
      if (success) {
        await fetchBids();
      }
    } catch (error) {
      console.error('Error approving bid:', error);
      toast.error('Failed to approve bid');
    } finally {
      setProcessingBids(prev => {
        const newSet = new Set(prev);
        newSet.delete(bidId);
        return newSet;
      });
    }
  };

  const handleRejectBid = async (bidId: string, reason?: string) => {
    try {
      setProcessingBids(prev => new Set(prev).add(bidId));
      
      const { data: userData } = await supabase.auth.getUser();
      const adminEmail = userData.user?.email;
      
      if (!adminEmail) {
        toast.error('Admin authentication required');
        return;
      }

      const success = await rejectBid(bidId, adminEmail, reason);
      if (success) {
        await fetchBids();
      }
    } catch (error) {
      console.error('Error rejecting bid:', error);
      toast.error('Failed to reject bid');
    } finally {
      setProcessingBids(prev => {
        const newSet = new Set(prev);
        newSet.delete(bidId);
        return newSet;
      });
    }
  };

  const handleConfirmBid = async (confirmationId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const adminEmail = userData.user?.email;
      
      if (!adminEmail) {
        toast.error('Admin authentication required');
        return;
      }

      const success = await confirmBid(confirmationId, adminEmail);
      if (success) {
        await fetchConfirmations();
      }
    } catch (error) {
      console.error('Error confirming bid:', error);
      toast.error('Failed to confirm bid');
    }
  };

  const deleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const { error } = await supabase
        .from('marketplace_furniture')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Failed to delete listing');
        console.error('Error deleting listing:', error);
        return;
      }

      toast.success('Listing deleted successfully');
      fetchListings();
    } catch (error) {
      toast.error('Failed to delete listing');
      console.error('Error:', error);
    }
  };

  const updateListing = async (id: string, updates: Partial<MarketplaceListing>) => {
    try {
      const { error } = await supabase
        .from('marketplace_furniture')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        toast.error('Failed to update listing');
        console.error('Error updating listing:', error);
        return;
      }

      toast.success('Listing updated successfully');
      fetchListings();
    } catch (error) {
      toast.error('Failed to update listing');
      console.error('Error:', error);
    }
  };

  const toggleSoldStatus = async (listing: MarketplaceListing) => {
    await updateListing(listing.id, { sold: !listing.sold });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'approved':
        return <FaCheck className="text-green-500" />;
      case 'rejected':
        return <FaBan className="text-red-500" />;
      case 'outbid':
        return <FaGavel className="text-orange-500" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Marketplace Management</h2>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('bids')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bids'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaGavel className="inline-block mr-2" />
            Bid Management ({bids.length})
          </button>
          <button
            onClick={() => setActiveTab('confirmations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'confirmations'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaShoppingCart className="inline-block mr-2" />
            Order Confirmations ({confirmations.length})
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'listings'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaEye className="inline-block mr-2" />
            Listing Management ({listings.length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          {activeTab === 'bids' && (
            <select
              value={bidStatusFilter}
              onChange={(e) => setBidStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="outbid">Outbid</option>
            </select>
          )}

          {activeTab === 'listings' && (
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Types</option>
                <option value="rehome">ReHome Items</option>
                <option value="user">User Listings</option>
              </select>
            </>
          )}

          <div className="flex items-center text-gray-600">
            <FaFilter className="mr-2" />
            {activeTab === 'bids' && `${filteredBids.length} of ${bids.length} bids`}
            {activeTab === 'listings' && `${filteredListings.length} of ${listings.length} listings`}
            {activeTab === 'confirmations' && `${confirmations.length} confirmations`}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      )}

      {/* Schema Setup Notice */}
      {!loading && activeTab === 'bids' && bids.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <FaClock className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Database Schema Setup Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  The bidding system database tables need to be created. Please run the SQL schema located at:
                  <code className="ml-1 px-2 py-1 bg-yellow-100 rounded text-xs">
                    Rehome/src/scripts/bidding-system-complete.sql
                  </code>
                </p>
                <p className="mt-2">
                  This will create the necessary tables: <code>marketplace_bids</code> and <code>marketplace_bid_confirmations</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && activeTab === 'bids' && bids.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bidder</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBids.map((bid) => (
                  <tr key={bid.id} className={bid.is_highest_bid ? 'bg-green-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {bid.item_image_url && (
                          <img 
                            src={bid.item_image_url} 
                            alt={bid.item_name} 
                            className="w-12 h-12 rounded-lg object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {bid.item_name || `Item #${bid.item_id}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            Original: €{bid.item_price}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{bid.bidder_name}</div>
                      <div className="text-sm text-gray-500">{bid.bidder_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">€{bid.bid_amount}</div>
                      {bid.is_highest_bid && (
                        <div className="text-xs text-green-600 font-medium">Highest Bid</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(bid.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          bid.status === 'approved' ? 'bg-green-100 text-green-800' :
                          bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          bid.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {bid.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(bid.created_at || '')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {bid.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveBid(bid.id!)}
                            disabled={processingBids.has(bid.id!)}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={() => handleRejectBid(bid.id!)}
                            disabled={processingBids.has(bid.id!)}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            <FaBan />
                          </button>
                        </div>
                      )}
                      {bid.approved_by && (
                        <div className="text-xs text-gray-500">
                          By: {bid.approved_by}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === 'confirmations' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {confirmations.map((confirmation) => (
                  <tr key={confirmation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {confirmation.order_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Item #{confirmation.item_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {confirmation.bidder_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        confirmation.confirmation_status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        confirmation.confirmation_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {confirmation.confirmation_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(confirmation.created_at || '')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {confirmation.confirmation_status === 'pending' && (
                        <button
                          onClick={() => handleConfirmBid(confirmation.id!)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Confirm Order
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === 'listings' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredListings.map((listing) => (
                  <tr key={listing.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {listing.image_url && listing.image_url[0] && (
                          <div className="relative w-12 h-12 mr-3">
                            <img 
                              src={listing.image_url[0]} 
                              alt={listing.name} 
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            {/* ReHome logo badge for ReHome items */}
                            {listing.isrehome && (
                              <div className="absolute top-0 left-0 bg-white p-0.5 rounded-md shadow-md">
                                <img 
                                  src={logoImage} 
                                  alt="ReHome Verified" 
                                  className="w-3 h-3 object-contain" 
                                />
                              </div>
                            )}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{listing.name}</div>
                          <div className="text-sm text-gray-500">{listing.city_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {listing.seller_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      €{listing.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        listing.sold ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {listing.sold ? 'Sold' : 'Available'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        listing.isrehome ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {listing.isrehome ? 'ReHome' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => toggleSoldStatus(listing)}
                        className={`${
                          listing.sold ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'
                        }`}
                      >
                        {listing.sold ? 'Mark Available' : 'Mark Sold'}
                      </button>
                      <button
                        onClick={() => deleteListing(listing.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MarketplaceManagement; 