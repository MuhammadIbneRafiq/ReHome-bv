import React, { useState, useEffect } from 'react';
import { FaTimes, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
import { Switch } from "@headlessui/react";
import { useCart } from '../../contexts/CartContext';
import LocationAutocomplete from '../ui/LocationAutocomplete';
import pricingService, { PricingInput } from '../../services/pricingService';
import { toast } from 'react-toastify';

interface ReHomeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderComplete: (orderNumber: string) => void;
}

interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ItemAssistanceState {
  [itemId: string]: {
    needsCarrying: boolean;
    needsAssembly: boolean;
  };
}

const ReHomeCheckoutModal: React.FC<ReHomeCheckoutModalProps> = ({ 
  isOpen, 
  onClose, 
  onOrderComplete 
}) => {
  const { items, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Contact & Address Info
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [floor, setFloor] = useState('');
  const [elevatorAvailable, setElevatorAvailable] = useState(false);
  
  // Item assistance selections
  const [itemAssistance, setItemAssistance] = useState<ItemAssistanceState>({});
  
  // Pricing breakdown
  const [pricingBreakdown, setPricingBreakdown] = useState<any>(null);
  const [baseTotal, setBaseTotal] = useState(0);

  // Filter only ReHome items
  const rehomeItems = items.filter(item => item.isrehome);

  // Calculate base total (item prices only)
  useEffect(() => {
    const total = rehomeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setBaseTotal(total);
  }, [rehomeItems]);

  // Initialize item assistance state
  useEffect(() => {
    const assistanceState: ItemAssistanceState = {};
    rehomeItems.forEach(item => {
      assistanceState[item.id] = {
        needsCarrying: false,
        needsAssembly: false,
      };
    });
    setItemAssistance(assistanceState);
  }, [rehomeItems]);

  // Calculate additional costs when assistance options change
  useEffect(() => {
    if (deliveryAddress && step >= 2) {
      calculateAdditionalCosts();
    }
  }, [itemAssistance, deliveryAddress, floor, elevatorAvailable]);

  const calculateAdditionalCosts = async () => {
    if (!deliveryAddress) return;

    try {
      // Create item quantities for pricing service
      const itemQuantities: { [key: string]: number } = {};
      const assemblyItems: { [key: string]: boolean } = {};
      
      rehomeItems.forEach(item => {
        const itemKey = `${item.category?.toLowerCase() || ''}-${item.name.toLowerCase().replace(/\s+/g, '-')}`;
        itemQuantities[itemKey] = item.quantity;
        assemblyItems[itemKey] = itemAssistance[item.id]?.needsAssembly || false;
      });

      const pricingInput: PricingInput = {
        serviceType: 'item-transport',
        pickupLocation: 'Amsterdam', // Default pickup location for ReHome items
        dropoffLocation: deliveryAddress,
        selectedDate: new Date().toISOString().split('T')[0],
        isDateFlexible: false,
        itemQuantities,
        floorPickup: 0, // Ground floor pickup for ReHome
        floorDropoff: parseInt(floor) || 0,
        elevatorPickup: true, // Assuming elevator at pickup
        elevatorDropoff: elevatorAvailable,
        assemblyItems,
        extraHelperItems: {}, // Not applicable for ReHome delivery
        isStudent: false,
        hasStudentId: false,
        isEarlyBooking: false,
      };

      const breakdown = await pricingService.calculateItemTransportPricing(pricingInput);
      setPricingBreakdown(breakdown);
    } catch (error) {
      console.error('Error calculating additional costs:', error);
      setPricingBreakdown(null);
    }
  };

  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactInfo(prev => ({ ...prev, [name]: value }));
  };

  const toggleItemAssistance = (itemId: string, type: 'carrying' | 'assembly') => {
    setItemAssistance(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        needsCarrying: type === 'carrying' ? !prev[itemId]?.needsCarrying : prev[itemId]?.needsCarrying || false,
        needsAssembly: type === 'assembly' ? !prev[itemId]?.needsAssembly : prev[itemId]?.needsAssembly || false,
      }
    }));
  };

  const isStep1Valid = () => {
    return contactInfo.firstName && contactInfo.lastName && contactInfo.email && contactInfo.phone;
  };

  const isStep2Valid = () => {
    return deliveryAddress && floor !== '';
  };

  const getTotalCost = () => {
    const assistanceCosts = pricingBreakdown ? 
      (pricingBreakdown.carryingCost || 0) + (pricingBreakdown.assemblyCost || 0) : 0;
    return baseTotal + assistanceCosts;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Generate order number
      const orderNumber = `RH-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      
      // Prepare order data
      const orderData = {
        orderNumber,
        items: rehomeItems.map(item => ({
          ...item,
          assistance: itemAssistance[item.id] || { needsCarrying: false, needsAssembly: false }
        })),
        contactInfo,
        deliveryAddress,
        floor: parseInt(floor) || 0,
        elevatorAvailable,
        baseTotal,
        assistanceCosts: pricingBreakdown ? 
          (pricingBreakdown.carryingCost || 0) + (pricingBreakdown.assemblyCost || 0) : 0,
        totalAmount: getTotalCost(),
        pricingBreakdown,
        createdAt: new Date().toISOString(),
      };

      // Save order to backend
      const response = await fetch('/api/rehome-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        clearCart();
        onOrderComplete(orderNumber);
        toast.success('Order placed successfully!');
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => `€${price.toFixed(2)}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-orange-500 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">ReHome Checkout</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Contact Information */}
          {step === 1 && (
            <div className="p-6 space-y-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  1
                </div>
                <h3 className="text-lg font-semibold">Contact Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={contactInfo.firstName}
                    onChange={handleContactInfoChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={contactInfo.lastName}
                    onChange={handleContactInfoChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={contactInfo.email}
                    onChange={handleContactInfoChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={contactInfo.phone}
                    onChange={handleContactInfoChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Delivery Details */}
          {step === 2 && (
            <div className="p-6 space-y-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  2
                </div>
                <h3 className="text-lg font-semibold">Delivery Address & Floor Details</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <LocationAutocomplete
                    label="Delivery Address *"
                    value={deliveryAddress}
                    onChange={setDeliveryAddress}
                    placeholder="Enter delivery address"
                    required
                    countryCode="nl"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Floor (0 for ground floor) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      placeholder="0"
                      required
                    />
                  </div>

                  <div className="flex items-center">
                    <div className="flex items-center">
                      <Switch
                        checked={elevatorAvailable}
                        onChange={setElevatorAvailable}
                        className={`${elevatorAvailable ? 'bg-orange-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2`}
                      >
                        <span
                          className={`${elevatorAvailable ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                      <span className="ml-3 text-sm text-gray-700">Elevator available</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <FaInfoCircle className="text-blue-500 mt-0.5 mr-2" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Delivery Information</p>
                      <p>Normal delivery is to ground floor only. Select carrying assistance if delivery is to upper floors.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Assistance Options */}
          {step === 3 && (
            <div className="p-6 space-y-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  3
                </div>
                <h3 className="text-lg font-semibold">Additional Services</h3>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Your Items</h4>
                  <div className="space-y-3">
                    {rehomeItems.map((item) => {
                      const assistanceState = itemAssistance[item.id] || { needsCarrying: false, needsAssembly: false };
                      
                      return (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                              <img
                                src={item.image_url?.[0] || item.image_urls?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-md mr-3"
                              />
                              <div>
                                <h5 className="font-medium text-gray-900">{item.name}</h5>
                                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                                <p className="text-sm font-medium text-orange-600">{formatPrice(item.price * item.quantity)}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`carrying-${item.id}`}
                                checked={assistanceState.needsCarrying}
                                onChange={() => toggleItemAssistance(item.id, 'carrying')}
                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`carrying-${item.id}`} className="ml-2 text-sm text-gray-700">
                                Require carrying assistance
                              </label>
                            </div>

                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`assembly-${item.id}`}
                                checked={assistanceState.needsAssembly}
                                onChange={() => toggleItemAssistance(item.id, 'assembly')}
                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`assembly-${item.id}`} className="ml-2 text-sm text-gray-700">
                                Require assembly assistance
                              </label>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Items Total:</span>
                      <span>{formatPrice(baseTotal)}</span>
                    </div>
                    
                    {pricingBreakdown?.carryingCost > 0 && (
                      <div className="flex justify-between">
                        <span>Carrying Assistance:</span>
                        <span>{formatPrice(pricingBreakdown.carryingCost)}</span>
                      </div>
                    )}
                    
                    {pricingBreakdown?.assemblyCost > 0 && (
                      <div className="flex justify-between">
                        <span>Assembly Assistance:</span>
                        <span>{formatPrice(pricingBreakdown.assemblyCost)}</span>
                      </div>
                    )}
                    
                    <div className="border-t border-orange-300 pt-2 mt-2">
                      <div className="flex justify-between font-semibold text-base">
                        <span>Total:</span>
                        <span>{formatPrice(getTotalCost())}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-3 h-3 rounded-full ${
                  stepNum === step ? 'bg-orange-500' : stepNum < step ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <div className="flex space-x-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
            )}
            
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 ? !isStep1Valid() : !isStep2Valid()}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !isStep2Valid()}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="mr-2" />
                    Complete Order
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReHomeCheckoutModal; 