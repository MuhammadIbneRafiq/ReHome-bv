import { FaTimes, FaSave } from 'react-icons/fa';
import { format } from 'date-fns';
import { SpecialRequest } from '../../types/admin';

const requestStatusOptions = ['Open', 'Contacted/ Pending', 'Confirmed', 'Completed', 'Declined'] as const;
type RequestStatus = typeof requestStatusOptions[number];

interface SpecialRequestDetailsModalProps {
  request: SpecialRequest;
  isOpen: boolean;
  onClose: () => void;
  modalStatus: RequestStatus;
  onStatusChange: (status: RequestStatus) => void;
  onSave: () => void;
}

const SpecialRequestDetailsModal = ({
  request,
  isOpen,
  onClose,
  modalStatus,
  onStatusChange,
  onSave
}: SpecialRequestDetailsModalProps) => {
  if (!isOpen) return null;

  const normalizeRequestStatus = (status: string | undefined): RequestStatus => {
    if (!status) return 'Open';
    const normalized = status.toLowerCase().replace(/_/g, ' ');
    if (normalized === 'pending' || normalized === 'contacted') return 'Contacted/ Pending';
    if (normalized === 'in progress' || normalized === 'confirmed') return 'Confirmed';
    if (normalized === 'completed' || normalized === 'done') return 'Completed';
    if (normalized === 'declined' || normalized === 'rejected') return 'Declined';
    return 'Open';
  };

  const requestType = request.request_type || 'N/A';
  const requestLabel = requestType === 'junk_removal' ? 'Junk Removal' :
                      requestType === 'item_storage' ? 'Item Storage' :
                      requestType === 'international_move' ? 'International Move' :
                      requestType;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Special Request Details</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Customer Information</h4>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {request.customer_name || 'N/A'}</p>
                <p><span className="font-medium">Email:</span> {request.email || 'N/A'}</p>
                <p><span className="font-medium">Phone:</span> {request.phone || 'N/A'}</p>
              </div>
            </div>

            {/* Request Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Request Information</h4>
              <div className="space-y-2">
                <p><span className="font-medium">Type:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    requestType === 'junk_removal' ? 'bg-red-100 text-red-800' :
                    requestType === 'item_storage' ? 'bg-purple-100 text-purple-800' :
                    requestType === 'international_move' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {requestLabel}
                  </span>
                </p>
                <p><span className="font-medium">Status:</span> 
                  <div className="flex items-center mt-1">
                    <select
                      value={modalStatus}
                      onChange={(e) => onStatusChange(e.target.value as RequestStatus)}
                      className="px-2 py-1 rounded text-xs font-medium border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {requestStatusOptions.map((statusOption) => (
                        <option key={statusOption} value={statusOption}>
                          {statusOption}
                        </option>
                      ))}
                    </select>
                    {modalStatus !== normalizeRequestStatus(request.status) && (
                      <button 
                        onClick={onSave}
                        className="ml-2 px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 flex items-center gap-1"
                      >
                        <FaSave /> Save
                      </button>
                    )}
                  </div>
                </p>
                <p><span className="font-medium">Created:</span> {request.created_at ? format(new Date(request.created_at), 'MMM dd, yyyy HH:mm') : 'N/A'}</p>
              </div>
            </div>

            {/* Location Details */}
            <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Location Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pickup Location */}
                {request.pickup_address && (
                  <div>
                    <p className="font-medium text-sm text-gray-600 mb-1">Pickup Location:</p>
                    <p className="text-sm">{request.pickup_address}</p>
                    {request.pickup_floor !== undefined && request.pickup_floor !== null && (
                      <p className="text-sm text-gray-600 mt-1">
                        Floor: {request.pickup_floor} {request.pickup_elevator && '🛗'}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Dropoff Location - Only show for international moves */}
                {requestType === 'international_move' && request.dropoff_address && (
                  <div>
                    <p className="font-medium text-sm text-gray-600 mb-1">Dropoff Location:</p>
                    <p className="text-sm">{request.dropoff_address}</p>
                    {request.dropoff_floor !== undefined && request.dropoff_floor !== null && (
                      <p className="text-sm text-gray-600 mt-1">
                        Floor: {request.dropoff_floor} {request.dropoff_elevator && '🛗'}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Show "No dropoff location" for junk removal and item storage */}
                {requestType !== 'international_move' && (
                  <div>
                    <p className="font-medium text-sm text-gray-600 mb-1">Dropoff Location:</p>
                    <p className="text-sm text-gray-500">Not applicable (pickup only)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Storage-specific fields */}
            {requestType === 'item_storage' && (
              <div className="bg-blue-50 p-4 rounded-lg md:col-span-2">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Storage Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {request.storage_start_date && (
                    <p><span className="font-medium">Storage Start:</span> {format(new Date(request.storage_start_date), 'MMM dd, yyyy')}</p>
                  )}
                  {request.storage_end_date && (
                    <p><span className="font-medium">Storage End:</span> {format(new Date(request.storage_end_date), 'MMM dd, yyyy')}</p>
                  )}
                  {request.pickup_preference && (
                    <p><span className="font-medium">Pickup Preference:</span> {
                      request.pickup_preference === 'pickupFromHome' ? 'Pickup from home' : 'Bring to storage'
                    }</p>
                  )}
                  {request.delivery_preference && (
                    <p><span className="font-medium">Delivery Preference:</span> {
                      request.delivery_preference === 'deliverToHome' ? 'Deliver to home' : 'Pickup from storage'
                    }</p>
                  )}
                  {request.delivery_address && request.delivery_preference === 'deliverToHome' && (
                    <div className="md:col-span-2">
                      <p className="font-medium text-sm text-gray-600 mb-1">Delivery Address:</p>
                      <p className="text-sm">{request.delivery_address}</p>
                      {request.delivery_floor !== undefined && request.delivery_floor !== null && (
                        <p className="text-sm text-gray-600 mt-1">
                          Floor: {request.delivery_floor} {request.delivery_elevator && '🛗'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Junk Removal specific fields */}
            {requestType === 'junk_removal' && (
              <div className="bg-red-50 p-4 rounded-lg md:col-span-2">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Junk Removal Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {request.earliest_removal_date && (
                    <p><span className="font-medium">Earliest Removal Date:</span> {format(new Date(request.earliest_removal_date), 'MMM dd, yyyy')}</p>
                  )}
                  {request.latest_removal_date && (
                    <p><span className="font-medium">Latest Removal Date:</span> {format(new Date(request.latest_removal_date), 'MMM dd, yyyy')}</p>
                  )}
                  {request.junk_volume && (
                    <p><span className="font-medium">Volume:</span> {request.junk_volume}</p>
                  )}
                </div>
              </div>
            )}

            {/* International Move specific fields */}
            {requestType === 'international_move' && (
              <div className="bg-green-50 p-4 rounded-lg md:col-span-2">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">International Move Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p><span className="font-medium">Move Date Type:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      request.move_date_type === 'specific' ? 'bg-green-100 text-green-800' :
                      request.move_date_type === 'flexible' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {request.move_date_type === 'rehomeChoose' ? 'ReHome Chooses' : 
                       request.move_date_type === 'specific' ? 'Specific Date' :
                       request.move_date_type === 'flexible' ? 'Flexible' : request.move_date_type}
                    </span>
                  </p>
                  {request.specific_date_start && (
                    <p><span className="font-medium">Move Date:</span> {format(new Date(request.specific_date_start), 'MMM dd, yyyy')}
                      {request.specific_date_end && request.specific_date_end !== request.specific_date_start && 
                        ` — ${format(new Date(request.specific_date_end), 'MMM dd, yyyy')}`}
                    </p>
                  )}
                  {request.selected_services && Array.isArray(request.selected_services) && request.selected_services.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="font-medium mb-2">Selected Services:</p>
                      <div className="flex flex-wrap gap-2">
                        {request.selected_services.map((service: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Item Description */}
            {request.item_description && (
              <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Description</h4>
                <p className="text-sm whitespace-pre-wrap">{request.item_description}</p>
              </div>
            )}

            {/* Uploaded Photos */}
            {request.photo_urls && request.photo_urls.length > 0 && (
              <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">📸 Uploaded Photos ({request.photo_urls.length})</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {request.photo_urls.map((url: string, idx: number) => (
                    <div key={idx} className="relative group">
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block"
                        title="Click to view full size"
                      >
                        <img 
                          src={url} 
                          alt={`Photo ${idx + 1}`} 
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00OCA0MGMtNC40MiAwLTggMy41OC04IDhzMy41OCA4IDggOCA4LTMuNTggOC04LTMuNTgtOC04LTh6IiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik00OCA1NmMtOC44NCAwLTE2LTcuMTYtMTYtMTZzNy4xNi0xNiAxNi0xNiAxNiA3LjE2IDE2IDE2LTcuMTYgMTYtMTYgMTZ6IiBmaWxsPSIjOUI5QkEwIi8+Cjwvc3ZnPgo=';
                            e.currentTarget.alt = 'Image failed to load';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">View</span>
                        </div>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialRequestDetailsModal;
