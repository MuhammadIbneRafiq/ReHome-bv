import React from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaUser, FaPhone, FaEnvelope, FaCalendar, FaMapMarkerAlt, FaBox, FaIdCard, FaImage, FaMoneyBillWave } from 'react-icons/fa';
import { format } from 'date-fns';

interface TransportRequestModalProps {
  request: any;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (requestId: string, status: string) => void;
}

const TransportRequestModal: React.FC<TransportRequestModalProps> = ({
  request,
  isOpen,
  onClose,
  onStatusUpdate
}) => {
  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-orange-500 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Transportation Request Details</h2>
            <p className="text-sm opacity-90 mt-1">
              Order #{request.order_number || request.id} • {request.type === 'item-moving' ? 'Item Moving' : 'House Moving'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-orange-600 rounded-full transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Customer Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 flex items-center">
              <FaUser className="mr-2 text-orange-500" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{request.customer_name || request.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium flex items-center">
                  <FaEnvelope className="mr-2 text-gray-400" size={14} />
                  {request.customer_email || request.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium flex items-center">
                  <FaPhone className="mr-2 text-gray-400" size={14} />
                  {request.phone || 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium flex items-center">
                  <FaCalendar className="mr-2 text-gray-400" size={14} />
                  {request.selecteddate ? format(new Date(request.selecteddate), 'MMMM dd, yyyy') : 
                   request.selected_date ? format(new Date(request.selected_date), 'MMMM dd, yyyy') : 'Flexible'}
                </p>
              </div>
            </div>
          </div>

          {/* Student ID */}
          {(request.has_student_id || request.student_id_url) && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <FaIdCard className="mr-2 text-green-600" />
                Student ID
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Status: <span className="font-medium text-green-600">Student ID Uploaded</span>
                </p>
                {request.student_id_url && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Student ID Image:</p>
                    <img 
                      src={request.student_id_url} 
                      alt="Student ID" 
                      className="max-w-md rounded-lg border border-gray-300 cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => window.open(request.student_id_url, '_blank')}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 flex items-center">
              <FaMapMarkerAlt className="mr-2 text-orange-500" />
              Location Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Pickup Location</p>
                <p className="font-medium">{request.firstlocation || request.pickup_location?.address || 'Not specified'}</p>
                {request.floorpickup && (
                  <p className="text-sm text-gray-500 mt-1">
                    Floor: {request.floorpickup} {request.elevatorpickup ? '(Elevator available)' : '(No elevator)'}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Dropoff Location</p>
                <p className="font-medium">{request.secondlocation || request.dropoff_location?.address || 'Not specified'}</p>
                {request.floordropoff && (
                  <p className="text-sm text-gray-500 mt-1">
                    Floor: {request.floordropoff} {request.elevatordropoff ? '(Elevator available)' : '(No elevator)'}
                  </p>
                )}
              </div>
            </div>
            {request.distance && (
              <div className="mt-3">
                <p className="text-sm text-gray-600">Distance</p>
                <p className="font-medium">{request.distance} km</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 flex items-center">
              <FaBox className="mr-2 text-orange-500" />
              Items ({request.furnitureitems?.length || request.items?.length || 0})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(request.furnitureitems || request.items || []).map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="font-medium">
                    {item.name || item.item_name || item}
                    {item.quantity > 1 && ` x${item.quantity}`}
                  </span>
                  {item.points && (
                    <span className="text-sm text-gray-500">{item.points} points</span>
                  )}
                </div>
              ))}
              {request.customitem && (
                <div className="mt-2 p-2 bg-yellow-50 rounded">
                  <p className="text-sm text-gray-600">Custom Items:</p>
                  <p className="font-medium">{request.customitem}</p>
                </div>
              )}
            </div>
          </div>

          {/* Item Images */}
          {request.item_image_urls && request.item_image_urls.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <FaImage className="mr-2 text-orange-500" />
                Item Photos ({request.item_image_urls.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {request.item_image_urls.map((url: string, index: number) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Item ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => window.open(url, '_blank')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Service Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Service Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {request.carrying_service && (
                <div>
                  <p className="text-sm text-gray-600">Carrying Service</p>
                  <p className="font-medium text-green-600">Yes</p>
                </div>
              )}
              {request.assembly_disassembly && (
                <div>
                  <p className="text-sm text-gray-600">Assembly/Disassembly</p>
                  <p className="font-medium text-green-600">Yes</p>
                </div>
              )}
              {request.extra_helper && (
                <div>
                  <p className="text-sm text-gray-600">Extra Helper</p>
                  <p className="font-medium text-green-600">Yes</p>
                </div>
              )}
              {request.itempoints > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Total Points</p>
                  <p className="font-medium">{request.itempoints}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 flex items-center">
              <FaMoneyBillWave className="mr-2 text-orange-600" />
              Pricing Details
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Base Price:</span>
                <span className="font-medium">€{request.baseprice || 0}</span>
              </div>
              {request.itemcost > 0 && (
                <div className="flex justify-between">
                  <span>Item Cost:</span>
                  <span className="font-medium">€{request.itemcost}</span>
                </div>
              )}
              {request.distancecost > 0 && (
                <div className="flex justify-between">
                  <span>Distance Cost:</span>
                  <span className="font-medium">€{request.distancecost}</span>
                </div>
              )}
              {request.carryingcost > 0 && (
                <div className="flex justify-between">
                  <span>Carrying Service:</span>
                  <span className="font-medium">€{request.carryingcost}</span>
                </div>
              )}
              {request.assemblycost > 0 && (
                <div className="flex justify-between">
                  <span>Assembly Service:</span>
                  <span className="font-medium">€{request.assemblycost}</span>
                </div>
              )}
              {request.extrahelpercost > 0 && (
                <div className="flex justify-between">
                  <span>Extra Helper:</span>
                  <span className="font-medium">€{request.extrahelpercost}</span>
                </div>
              )}
              {request.studentdiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Student Discount:</span>
                  <span className="font-medium">-€{request.studentdiscount}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Price:</span>
                  <span className="text-orange-600">€{request.estimatedprice || request.total_price || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          {request.specialinstructions && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">Special Instructions</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{request.specialinstructions}</p>
            </div>
          )}

          {/* Status Update */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Status</h3>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                request.status === 'Open' ? 'bg-gray-100 text-gray-800' :
                request.status === 'Contacted/ Pending' ? 'bg-yellow-100 text-yellow-800' :
                request.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                request.status === 'Completed' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {request.status}
              </span>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={request.status}
                onChange={(e) => onStatusUpdate(request.id, e.target.value)}
              >
                <option value="Open">Open</option>
                <option value="Contacted/ Pending">Contacted/ Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Declined">Declined</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TransportRequestModal;
