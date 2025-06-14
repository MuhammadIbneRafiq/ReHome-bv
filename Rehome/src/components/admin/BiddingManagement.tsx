import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCheck, 
  FaGavel, 
  FaSearch,
  FaUser,
  FaMoneyBillWave,
  FaCalendar,
  FaTimes
} from 'react-icons/fa';
import { 
  getAllBidsForAdmin, 
  approveBid, 
  rejectBid,
  BidWithItemDetails
} from '../../services/biddingService';

// Import bid confirmation types and functions
import type { BidConfirmation } from '../../services/biddingService';
import { getBidConfirmations, confirmBid } from '../../services/biddingService';
import useUserStore from '../../services/state/useUserSessionStore';

const BiddingManagement: React.FC = () => {
  const [bids, setBids] = useState<BidWithItemDetails[]>([]);
  const [bidConfirmations, setBidConfirmations] = useState<BidConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'bids' | 'confirmations'>('bids');
  const [processingBidId, setProcessingBidId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{[key: string]: string}>({});
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bidsData, confirmationsData] = await Promise.all([
        getAllBidsForAdmin(),
        getBidConfirmations()
      ]);
      setBids(bidsData);
      setBidConfirmations(confirmationsData);
      setError(null);
    } catch (err) {
      console.error('Error loading bidding data:', err);
      setError('Failed to load bidding data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBid = async (bidId: string) => {
    if (!user) return;
    
    setProcessingBidId(bidId);
    try {
      const success = await approveBid(bidId, user.email, adminNotes[bidId] || '');
      if (success) {
        await loadData();
        setAdminNotes(prev => ({ ...prev, [bidId]: '' }));
      }
    } catch (error) {
      console.error('Error approving bid:', error);
    } finally {
      setProcessingBidId(null);
    }
  };

  const handleRejectBid = async (bidId: string) => {
    if (!user) return;
    
    setProcessingBidId(bidId);
    try {
      const success = await rejectBid(bidId, user.email, adminNotes[bidId] || '');
      if (success) {
        await loadData();
        setAdminNotes(prev => ({ ...prev, [bidId]: '' }));
      }
    } catch (error) {
      console.error('Error rejecting bid:', error);
    } finally {
      setProcessingBidId(null);
    }
  };

  const handleConfirmBid = async (confirmationId: string) => {
    if (!user) return;
    
    try {
      const success = await confirmBid(confirmationId, user.email);
      if (success) {
        await loadData();
      }
    } catch (error) {
      console.error('Error confirming bid:', error);
    }
  };

  const filteredBids = bids.filter(bid => {
    const matchesSearch = 
      bid.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.bidder_email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || bid.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredConfirmations = bidConfirmations.filter(confirmation => {
    const matchesSearch = 
      confirmation.bidder_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      confirmation.order_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'outbid': return 'bg-gray-100 text-gray-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading bidding data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={loadData}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FaGavel className="mr-3 text-orange-500" />
            Bidding Management
          </h2>
          <button
            onClick={loadData}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
          >
            Refresh Data
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('bids')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'bids' 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bids ({bids.length})
          </button>
          <button
            onClick={() => setActiveTab('confirmations')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'confirmations' 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Confirmations ({bidConfirmations.length})
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by item name, bidder email..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full"
                />
              </div>
            </div>
            {activeTab === 'bids' && (
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md p-2"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="outbid">Outbid</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Bids Tab */}
        {activeTab === 'bids' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                All Bids ({filteredBids.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bidder
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBids.map((bid) => (
                    <tr key={bid.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img 
                              className="h-10 w-10 rounded-md object-cover" 
                              src={bid.item_image_url || '/placeholder.jpg'} 
                              alt={bid.item_name} 
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {bid.item_name || `Item #${bid.item_id}`}
                            </div>
                            <div className="text-sm text-gray-500">
                              Original price: €{bid.item_price}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaUser className="text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">{bid.bidder_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaMoneyBillWave className="text-green-500 mr-2" />
                          <div className="text-sm font-medium text-gray-900">
                            €{bid.bid_amount}
                          </div>
                          {bid.is_highest_bid && (
                            <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                              Highest
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bid.status)}`}>
                          {bid.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <FaCalendar className="mr-2" />
                          {new Date(bid.created_at || '').toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {bid.status === 'pending' && (
                          <div className="flex flex-col space-y-2">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApproveBid(bid.id!)}
                                disabled={processingBidId === bid.id}
                                className="flex items-center px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
                              >
                                <FaCheck className="mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectBid(bid.id!)}
                                disabled={processingBidId === bid.id}
                                className="flex items-center px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
                              >
                                <FaTimes className="mr-1" />
                                Reject
                              </button>
                            </div>
                            <textarea
                              value={adminNotes[bid.id!] || ''}
                              onChange={(e) => setAdminNotes(prev => ({ ...prev, [bid.id!]: e.target.value }))}
                              placeholder="Admin notes (optional)"
                              className="text-xs border border-gray-300 rounded p-1 w-full"
                              rows={2}
                            />
                          </div>
                        )}
                        {bid.status !== 'pending' && bid.admin_notes && (
                          <div className="text-xs text-gray-500 max-w-xs">
                            <strong>Notes:</strong> {bid.admin_notes}
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

        {/* Confirmations Tab */}
        {activeTab === 'confirmations' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Bid Confirmations ({filteredConfirmations.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bidder
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredConfirmations.map((confirmation) => (
                    <tr key={confirmation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {confirmation.order_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{confirmation.bidder_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">#{confirmation.item_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(confirmation.confirmation_status)}`}>
                          {confirmation.confirmation_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(confirmation.created_at || '').toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {confirmation.confirmation_status === 'pending' && (
                          <button
                            onClick={() => handleConfirmBid(confirmation.id!)}
                            className="flex items-center px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                          >
                            <FaCheck className="mr-1" />
                            Confirm
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
      </motion.div>
    </div>
  );
};

export default BiddingManagement; 