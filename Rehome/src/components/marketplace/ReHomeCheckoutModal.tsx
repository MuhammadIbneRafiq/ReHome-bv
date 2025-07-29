import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
import { Switch } from "@headlessui/react";
import { useCart } from '../../contexts/CartContext';
import { toast } from 'react-toastify';
import { PhoneNumberInput } from '@/components/ui/PhoneNumberInput';
import { API_ENDPOINTS } from '../../lib/api/config';
import { getMarketplaceItemPoints, fetchPricingMultipliers } from '../../services/marketplaceItemDetailsService';

// TypeScript declarations for Google Maps API
declare global {
    interface Window {
        google: any;
    }
}

// Google Places Autocomplete component
function GooglePlacesAutocomplete({ 
  value, 
  onChange, 
  placeholder,
  onPlaceSelect 
}: { 
  value: string, 
  onChange: (val: string, place?: any) => void, 
  placeholder?: string,
  onPlaceSelect?: (place: any) => void 
}) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API;
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to get place details including coordinates from placeId
  const getPlaceDetails = async (placeId: string) => {
    try {
      const response = await fetch(
        'https://places.googleapis.com/v1/places/' + placeId,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'location,displayName,formattedAddress'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          placeId,
          coordinates: data.location ? {
            lat: data.location.latitude,
            lng: data.location.longitude
          } : null,
          formattedAddress: data.formattedAddress,
          displayName: data.displayName?.text
        };
      } else {
        console.error('Place details API error:', response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  };

  const searchPlaces = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        'https://places.googleapis.com/v1/places:autocomplete',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.placeId'
          },
          body: JSON.stringify({
            input: query,
            locationBias: {
              circle: {
                center: {
                  latitude: 52.3676,
                  longitude: 4.9041
                },
                radius: 50000.0
              }
            },
            languageCode: 'en',
            regionCode: 'NL',
            includedPrimaryTypes: ['geocode', 'establishment', 'street_address'],
            includedRegionCodes: ['nl']
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.suggestions) {
          const placeSuggestions = data.suggestions
            .filter((suggestion: any) => suggestion.placePrediction)
            .map((suggestion: any) => ({
              text: suggestion.placePrediction.text?.text || 'Unknown address',
              placeId: suggestion.placePrediction.placeId,
              structuredFormat: suggestion.placePrediction.structuredFormat
            }));
          setSuggestions(placeSuggestions);
          setShowSuggestions(true);
        }
      } else {
        console.error('Places API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Places API error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = async (suggestion: any) => {
    // Immediately close dropdown and clear suggestions
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Update the input value
    onChange(suggestion.text);
    
    if (onPlaceSelect) {
      const placeDetails = await getPlaceDetails(suggestion.placeId);
      const placeWithDetails = {
        ...suggestion,
        ...placeDetails
      };
      onPlaceSelect(placeWithDetails);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout
    const timeoutId = setTimeout(() => {
      searchPlaces(newValue);
    }, 300);
    
    setSearchTimeout(timeoutId);
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Delivery Address *
      </label>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder || "💡 Type in the street name, city, and postal code."}
        className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
        required
      />
      
      {isLoading && (
        <div className="absolute right-3 top-10">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-3 cursor-pointer hover:bg-orange-50 border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="text-sm text-gray-900">{suggestion.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [pricingBreakdown] = useState<any>(null);
  const [baseTotal, setBaseTotal] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [carryingCost, setCarryingCost] = useState(0);
  const [assemblyCost, setAssemblyCost] = useState(0);
  const [isHighPointsCategory, setIsHighPointsCategory] = useState(false);
  const [pricingMultipliers, setPricingMultipliers] = useState<any>(null);

  // Filter only ReHome items
  const rehomeItems = items.filter(item => item.isrehome);

  // Fetch pricing multipliers on component mount
  useEffect(() => {
    const fetchMultipliers = async () => {
      try {
        const multipliers = await fetchPricingMultipliers();
        console.log('multipliers', multipliers);
        setPricingMultipliers(multipliers);
      } catch (error) {
        console.error('Error fetching pricing multipliers:', error);
      }
    };
    fetchMultipliers();
  }, []);

  // Calculate base total (item prices only)
  useEffect(() => {
    const total = rehomeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setBaseTotal(total);
  }, [rehomeItems]);

  // Calculate total cost when items or assistance changes
  useEffect(() => {
    const calculateTotal = async () => {
      const cost = await getTotalCost();
      setTotalCost(cost);
      
      // Calculate carrying and assembly costs separately for display
      const calculatedCarryingCost = getCarryingCost(isHighPointsCategory);
      const calculatedAssemblyCost = getAssemblyCost(isHighPointsCategory);
      setCarryingCost(calculatedCarryingCost);
      setAssemblyCost(calculatedAssemblyCost);
    };
    calculateTotal();
  }, [rehomeItems, itemAssistance, floor, elevatorAvailable, isHighPointsCategory]);

  // Initialize item assistance state - preserve existing selections
  useEffect(() => {
    setItemAssistance(prev => {
      const assistanceState: ItemAssistanceState = { ...prev }; // Keep existing selections
      rehomeItems.forEach(item => {
        // Only initialize if item doesn't exist in state
        if (!assistanceState[item.id]) {
          assistanceState[item.id] = {
            needsCarrying: false,
            needsAssembly: false,
          };
        }
      });
      return assistanceState;
    });
  }, [rehomeItems.map(i => i.id).sort().join(',')]);
  
  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactInfo(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePhoneChange = (value: string) => {
    setContactInfo(prev => ({ ...prev, phone: value }));
  };

  const toggleItemAssistance = (itemId: string, type: 'carrying' | 'assembly') => {
    
    setItemAssistance(prev => {
      const currentState = prev[itemId] || { needsCarrying: false, needsAssembly: false };
      
      const newState = {
        ...currentState,
        needsCarrying: type === 'carrying' ? !currentState.needsCarrying : currentState.needsCarrying,
        needsAssembly: type === 'assembly' ? !currentState.needsAssembly : currentState.needsAssembly,
      };
      
      const newFullState = {
        ...prev,
        [itemId]: newState
      };
      
      return newFullState;
    });
  };

  const isStep1Valid = () => {
    return contactInfo.firstName && contactInfo.lastName && contactInfo.email && contactInfo.phone;
  };

  const isStep2Valid = () => {
    return deliveryAddress && floor !== '';
  };

  const getTotalCost = async () => {
   
    // Calculate total points and determine pricing category
    let totalPoints = 0;
    const itemPointsMap = new Map<string, number>();
    
    // Get points from the constants API (marketplace item details)
    for (const item of rehomeItems) {
      try {
        // Get points for this marketplace item from the database
        const itemPoints = await getMarketplaceItemPoints(item.category || '', item.subcategory || '');
        console.log('itemPoints', itemPoints);
        itemPointsMap.set(item.id, itemPoints);
        totalPoints += itemPoints * item.quantity;
        console.log('totalPoints', totalPoints);
      } catch (error) {
        console.error('Error getting points for item:', item, error);
      }
    }
    
    // Determine pricing category based on dynamic threshold from multipliers
    const threshold = pricingMultipliers?.points?.threshold || 6; // Fallback to 6 if not loaded
    const isHighPointsCategory = totalPoints >= threshold;
    setIsHighPointsCategory(isHighPointsCategory);
        
    const calculatedCarryingCost = getCarryingCost(isHighPointsCategory);
    const calculatedAssemblyCost = getAssemblyCost(isHighPointsCategory);
    
    return baseTotal + calculatedCarryingCost + calculatedAssemblyCost;
  };

  const getCarryingCost = (isHighPointsCategory: boolean = false) => {   
    // Use dynamic pricing multipliers from backend
    const carryingMultipliers = pricingMultipliers?.carrying;
    if (!carryingMultipliers) {
      // Fallback to hardcoded values if multipliers not loaded
      const baseCarryingCost = isHighPointsCategory ? 5 : 3;
      const totalFloors = elevatorAvailable ? 1 : Math.max(0, parseInt(floor) || 0);
      
      if (totalFloors > 0) {
        const itemsNeedingCarrying = Object.values(itemAssistance).filter(state => state.needsCarrying).length;
        if (itemsNeedingCarrying > 0) {
          console.log('totalFloors', totalFloors);
          console.log('itemsNeedingCarrying', itemsNeedingCarrying);
          console.log('baseCarryingCost', baseCarryingCost);
          return totalFloors * itemsNeedingCarrying * baseCarryingCost;
        }
      }
      return 0;
    }

    // Use dynamic multipliers
    const baseCarryingCost = isHighPointsCategory 
      ? carryingMultipliers.highPoints.cost 
      : carryingMultipliers.lowPoints.cost;
    
    const totalFloors = elevatorAvailable ? 1 : Math.max(0, parseInt(floor) || 0);
    
    const itemsNeedingCarrying = Object.values(itemAssistance).filter(state => state.needsCarrying).length;
    if (itemsNeedingCarrying > 0) {
      console.log('totalFloors', totalFloors);
      console.log('itemsNeedingCarrying', itemsNeedingCarrying);
      console.log('baseCarryingCost', baseCarryingCost);
      return totalFloors * itemsNeedingCarrying * baseCarryingCost;
    }
    return 0;
  };

  const getAssemblyCost = (isHighPointsCategory: boolean = false) => {
    // Use dynamic pricing multipliers from backend
    const assemblyMultipliers = pricingMultipliers?.assembly;
    console.log('assemblyMultipliers', assemblyMultipliers);
    console.log('isHighPointsCategory', isHighPointsCategory);
    // Use dynamic multipliers
    const baseAssemblyCost = isHighPointsCategory ? assemblyMultipliers.highPoints.cost : assemblyMultipliers.lowPoints.cost;
    
    const itemsNeedingAssembly = Object.values(itemAssistance).filter(state => state.needsAssembly).length;
    
    if (itemsNeedingAssembly > 0) {
      console.log('itemsNeedingAssembly', itemsNeedingAssembly);
      console.log('baseAssemblyCost', baseAssemblyCost);
      return itemsNeedingAssembly * baseAssemblyCost;
    }
    return 0;
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
        assistanceCosts: totalCost, // Use the new getTotalCost function
        totalAmount: totalCost,
        pricingBreakdown,
        createdAt: new Date().toISOString(),
      };

      // Save order to backend
      const response = await fetch(API_ENDPOINTS.REHOME_ORDERS.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        // Store sales history for each item in the cart
        try {
          for (const item of items) {
            const salesHistoryData = {
              orderId: orderNumber,
              customerEmail: contactInfo.email,
              customerName: `${contactInfo.firstName} ${contactInfo.lastName}`,
              customerPhone: contactInfo.phone,
              itemName: item.name,
              itemCategory: item.category,
              itemSubcategory: item.subcategory,
              itemPoints: 0, // ReHome items don't have points
              itemPrice: item.price,
              quantity: item.quantity,
              totalAmount: item.price * item.quantity,
              paymentMethod: 'card',
              paymentStatus: 'completed',
              orderStatus: 'completed',
              pickupAddress: '', // ReHome items don't have pickup address
              dropoffAddress: deliveryAddress, // Use delivery address
              pickupDate: null, // ReHome items don't have pickup date
              pickupTime: null, // ReHome items don't have pickup time
              deliveryFee: 0, // ReHome items have free delivery
              assemblyFee: itemAssistance[item.id]?.needsAssembly ? getAssemblyCost() : 0,
              carryingFee: itemAssistance[item.id]?.needsCarrying ? getCarryingCost() : 0,
              extraHelperFee: 0,
              studentDiscount: 0,
              subtotal: item.price * item.quantity,
              taxAmount: 0,
              finalTotal: item.price * item.quantity + (itemAssistance[item.id]?.needsAssembly ? getAssemblyCost() : 0) + (itemAssistance[item.id]?.needsCarrying ? getCarryingCost() : 0),
              currency: 'EUR',
              notes: `ReHome Order: ${orderNumber}`
            };

            // Store sales history
            const salesResponse = await fetch('/api/sales-history', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(salesHistoryData),
            });

            if (!salesResponse.ok) {
              console.error('Failed to store sales history for item:', item.name, salesResponse.status, salesResponse.statusText);
            }
          }
          console.log('✅ Sales history stored successfully');
        } catch (salesError) {
          console.error('❌ Error storing sales history:', salesError);
          // Don't fail the order if sales history storage fails
        }

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
                  <PhoneNumberInput
                    value={contactInfo.phone}
                    onChange={handlePhoneChange}
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
                  <GooglePlacesAutocomplete
                    value={deliveryAddress}
                    onChange={setDeliveryAddress}
                    placeholder="💡 Type in the street name, city, and postal code."
                    onPlaceSelect={(place) => {
                      setDeliveryAddress(place);
                      // console.log('🎯 Delivery place selected with coordinates:', place);
                    }}
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
                          style={{
                            transform: (elevatorAvailable) ? 'translateX(24px)' : 'translateX(4px)',
                            transition: 'transform 0.2s'
                          }}
                          className="inline-block h-4 w-4 rounded-full bg-white"
                        />
                      </Switch>
                      <span className="ml-2 text-sm text-gray-700">Elevator available</span>
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
                <h3 className="text-lg font-semibold">Delivery add-ons</h3>
              </div>

              <div className="space-y-4">
                
                {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Our standard delivery is to the ground floor and certain items may be disassembled (see description of our listing).</p>
                  </div>
                </div> */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <FaInfoCircle className="text-blue-500 mt-0.5 mr-2" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Delivery Information</p>
                      <p>Normal delivery is to ground floor only. Select carrying assistance if delivery is to upper floors.</p>
                    </div>
                  </div>
                </div>
                
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

                          
                          <div className="space-y-3">
                            <div>
                              <h5 className="font-medium text-gray-800 mb-2">1. Need help with assembly?</h5>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`assembly-${item.id}`}
                                    checked={assistanceState.needsAssembly}
                                    onChange={() => toggleItemAssistance(item.id, 'assembly')}
                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                  />
                                  <label htmlFor={`assembly-${item.id}`} className="ml-2 text-sm text-gray-700">
                                    Assembly assistance for {item.name}
                                  </label>
                                </div>
                                {pricingBreakdown?.assemblyCost > 0 && assistanceState.needsAssembly && (
                                  <span className="text-sm font-medium text-orange-600">
                                    € BLAHBLAH{(pricingBreakdown.assemblyCost / Object.values(itemAssistance).filter(state => state.needsAssembly).length).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div>
                              <h5 className="font-medium text-gray-800 mb-2">2. Need help with carrying upstairs?</h5>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`carrying-${item.id}`}
                                    checked={assistanceState.needsCarrying}
                                    onChange={() => toggleItemAssistance(item.id, 'carrying')}
                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                  />
                                  <label htmlFor={`carrying-${item.id}`} className="ml-2 text-sm text-gray-700">
                                    Carrying assistance to floor {floor || 0} for {item.name}
                                  </label>
                                </div>
                                {pricingBreakdown?.carryingCost > 0 && assistanceState.needsCarrying && (
                                  <span className="text-sm font-medium text-orange-600">
                                    €{(pricingBreakdown.carryingCost / Object.values(itemAssistance).filter(state => state.needsCarrying).length).toFixed(2)}
                                  </span>
                                )}
                              </div>
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
                    
                    {carryingCost > 0 && (
                      <div className="flex justify-between">
                        <span>Carrying Assistance:</span>
                        <span>{formatPrice(carryingCost)}</span>
                      </div>
                    )}
                    
                    {assemblyCost > 0 && (
                      <div className="flex justify-between">
                        <span>Assembly Assistance:</span>
                        <span>{formatPrice(assemblyCost)}</span>
                      </div>
                    )}
                    
                    <div className="border-t border-orange-300 pt-2 mt-2">
                      <div className="flex justify-between font-semibold text-base">
                        <span>Total:</span>
                        <span>{formatPrice(totalCost)}</span>
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