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
  const [pricingBreakdown, setPricingBreakdown] = useState<any>(null);
  const [baseTotal, setBaseTotal] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [carryingCost, setCarryingCost] = useState(0);
  const [assemblyCost, setAssemblyCost] = useState(0);
  const [isHighPointsCategory, setIsHighPointsCategory] = useState(false);
  const [pricingMultipliers, setPricingMultipliers] = useState<any>(null);

  // Filter only ReHome items
  const rehomeItems = items.filter(item => item.isrehome);

  // Determine if an item is eligible for assembly and its fixed cost
  const getAssemblyUnitCost = (item: any): number => {
    const name = (item?.name || '').toLowerCase();
    const category = (item?.category || '').toLowerCase();
    const subcategory = (item?.subcategory || '').toLowerCase();

    // category(sub) must be present to consider eligibility
    if (!category || !subcategory) return 0;

    // Closets / Wardrobes → €50
    if (name.includes('closet') || name.includes('wardrobe') || subcategory.includes('closet') || subcategory.includes('wardrobe')) {
      return 50;
    }
    // Single bed → €20
    if (name.includes('1-person bed') || name.includes('single bed') || subcategory.includes('1-person') || subcategory.includes('single')) {
      return 20;
    }
    // Double bed → €30
    if (name.includes('2-person bed') || name.includes('double bed') || subcategory.includes('2-person') || subcategory.includes('double')) {
      return 30;
    }
    return 0; // Not eligible
  };

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
      const calculatedCarryingCost = await getCarryingCost();
      const calculatedAssemblyCost = await getAssemblyCost();
      setCarryingCost(calculatedCarryingCost);
      setAssemblyCost(calculatedAssemblyCost);
      
      // Update pricing breakdown for email
      setPricingBreakdown({
        carryingCost: calculatedCarryingCost,
        assemblyCost: calculatedAssemblyCost,
        breakdown: {
          carrying: { totalCost: calculatedCarryingCost },
          assembly: { totalCost: calculatedAssemblyCost }
        }
      });
    };
    calculateTotal();
  }, [rehomeItems, itemAssistance, floor, elevatorAvailable, isHighPointsCategory]);

  // Initialize item assistance state - preserve existing selections for current items only
  useEffect(() => {
    setItemAssistance(prev => {
      const assistanceState: ItemAssistanceState = {};
      rehomeItems.forEach(item => {
        // Preserve existing selection if item was already in cart, otherwise default to false
        assistanceState[item.id] = prev[item.id] || {
          needsCarrying: false,
          needsAssembly: false,
        };
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
    console.log('\n===== TOTAL COST CALCULATION STARTED =====');
    
    // Calculate total points and determine pricing category
    let totalPoints = 0;
    const itemPointsMap = new Map<string, number>();
    
    console.log('Base Item Total:', baseTotal.toFixed(2), '€');
    console.log('Calculating total item points...');
    
    // Get points from the constants API (marketplace item details)
    for (const item of rehomeItems) {
      try {
        // Get points for this marketplace item from the database
        console.log(`\nItem: ${item.name} (${item.category}/${item.subcategory || 'none'}) x ${item.quantity}`);
        const itemPoints = await getMarketplaceItemPoints(item.category || '', item.subcategory || '');
        console.log(`  - Points for this item: ${itemPoints}`);
        
        itemPointsMap.set(item.id, itemPoints);
        const itemTotalPoints = itemPoints * item.quantity;
        totalPoints += itemTotalPoints;
        
        console.log(`  - Item total points (${itemPoints} × ${item.quantity}): ${itemTotalPoints}`);
        console.log(`  - Running total points: ${totalPoints}`);
      } catch (error) {
        console.error('Error getting points for item:', item, error);
      }
    }
    
    // Determine pricing category based on dynamic threshold from multipliers
    const threshold = pricingMultipliers?.points?.threshold || 6; // Fallback to 6 if not loaded
    const isHighPointsCategory = totalPoints >= threshold;
    
    console.log('\nPricing category determination:');
    console.log(`  - Total points: ${totalPoints}`);
    console.log(`  - Threshold for high points category: ${threshold}`);
    console.log(`  - Is high points category? ${isHighPointsCategory}`);
    
    setIsHighPointsCategory(isHighPointsCategory);
    
    console.log('\nCalculating carrying cost...');
    const calculatedCarryingCost = await getCarryingCost();
    console.log(`  - Carrying cost: ${calculatedCarryingCost.toFixed(2)} €`);
    
    console.log('\nCalculating assembly cost...');
    const calculatedAssemblyCost = await getAssemblyCost();
    console.log(`  - Assembly cost: ${calculatedAssemblyCost.toFixed(2)} €`);
    
    const finalTotal = baseTotal + calculatedCarryingCost + calculatedAssemblyCost;
    
    console.log('\nFinal cost breakdown:');
    console.log(`  - Items base total: ${baseTotal.toFixed(2)} €`);
    console.log(`  - Carrying cost: ${calculatedCarryingCost.toFixed(2)} €`);
    console.log(`  - Assembly cost: ${calculatedAssemblyCost.toFixed(2)} €`);
    console.log(`  - FINAL TOTAL: ${finalTotal.toFixed(2)} €`);
    console.log('===== TOTAL COST CALCULATION FINISHED =====\n');
    
    return finalTotal;
  };

  const getCarryingCost = async () => {   
    console.log('===== CARRYING COST CALCULATION STARTED =====');
    
    const totalFloors = elevatorAvailable ? 1 : Math.max(0, parseInt(floor) || 0);
    console.log('Total floors for calculation:', totalFloors, elevatorAvailable ? '(elevator available - counted as 1)' : '');
    
    if (totalFloors === 0) {
      console.log('No floors - carrying cost is 0 €');
      return 0;
    }

    let totalCarryingCost = 0;
    
    for (const item of rehomeItems) {
      console.log('\n--- Processing item for carrying:', item.name, '(ID:', item.id, ') ---');
      console.log('Category:', item.category, '| Subcategory:', item.subcategory);
      console.log('Quantity:', item.quantity);
      console.log('Needs Carrying:', itemAssistance[item.id]?.needsCarrying);
      
      if (itemAssistance[item.id]?.needsCarrying) {
        try {
          console.log('Fetching category points for:', item.category, item.subcategory);
          const itemPoints = await getMarketplaceItemPoints(item.category || '', item.subcategory || '');
          console.log('Category Points:', itemPoints);
          
          // Calculate carrying cost: category points × floors × 1.35
          const multiplier = 1.35;
          console.log('CALCULATION: Points', itemPoints, '× Floors', totalFloors, '× Multiplier', multiplier);
          
          const itemCarryingCost = itemPoints * totalFloors * multiplier;
          const quantityAdjustedCost = itemCarryingCost * (item.quantity || 1);
          
          console.log('Item Carrying Cost:', itemCarryingCost.toFixed(2), '€');
          console.log('Quantity Adjusted Cost:', quantityAdjustedCost.toFixed(2), '€', 
            item.quantity > 1 ? '(' + itemCarryingCost.toFixed(2) + ' × ' + item.quantity + ')' : '');
          
          totalCarryingCost += quantityAdjustedCost;
          console.log('Running Total:', totalCarryingCost.toFixed(2), '€');
        } catch (error) {
          console.error('Error calculating carrying cost for item:', item, error);
        }
      } else {
        console.log('Skipping item - carrying not requested');
      }
    }
    
    console.log('\n===== CARRYING COST CALCULATION FINISHED =====');
    console.log('FINAL CARRYING COST:', totalCarryingCost.toFixed(2), '€');
    return totalCarryingCost;
  };

  const getAssemblyCost = async () => {
    // Calculate assembly cost based on category points × floor number × 1.35
    console.log('===== ASSEMBLY COST CALCULATION STARTED =====');
    let total = 0;
    const floorNumber = Math.max(1, parseInt(floor) || 0); // Minimum floor is 1
    console.log('Floor Number (used for calculation):', floorNumber);
    console.log('Elevator Available:', elevatorAvailable);
    
    console.log('Items requiring assembly:', 
      rehomeItems.filter(item => itemAssistance[item.id]?.needsAssembly).length, 
      'out of', rehomeItems.length, 'total items');
    
    for (const item of rehomeItems) {
      console.log('\n--- Processing item:', item.name, '(ID:', item.id, ') ---');
      console.log('Category:', item.category, '| Subcategory:', item.subcategory);
      console.log('Quantity:', item.quantity);
      console.log('Needs Assembly:', itemAssistance[item.id]?.needsAssembly);
      
      if (itemAssistance[item.id]?.needsAssembly) {
        // Get item's category points
        try {
          console.log('Fetching category points for:', item.category, item.subcategory);
          const itemPoints = await getMarketplaceItemPoints(item.category || '', item.subcategory || '');
          console.log('Category Points:', itemPoints);
          
          // Calculate assembly cost: category point × 1.35
          const multiplier = 1.35;
          console.log('CALCULATION: Points', itemPoints, '× Multiplier', multiplier);
          
          const assemblyCost = itemPoints * multiplier;
          const quantityAdjustedCost = assemblyCost * (item.quantity || 1);
          
          console.log('Item Assembly Cost:', assemblyCost.toFixed(2), '€');
          console.log('Quantity Adjusted Cost:', quantityAdjustedCost.toFixed(2), '€', 
            item.quantity > 1 ? '(' + assemblyCost.toFixed(2) + ' × ' + item.quantity + ')' : '');
          
          total += quantityAdjustedCost;
          console.log('Running Total:', total.toFixed(2), '€');
        } catch (error) {
          console.error('Error calculating assembly cost:', error);
          // Fallback to fixed pricing if points calculation fails
          console.log('FALLBACK: Using fixed pricing due to error');
          const unit = getAssemblyUnitCost(item);
          console.log('Fixed Unit Cost:', unit, '€');
          
          if (unit > 0) {
            const fixedCost = unit * (item.quantity || 1);
            total += fixedCost;
            console.log('Fixed Cost Added:', fixedCost, '€');
            console.log('Running Total:', total.toFixed(2), '€');
          }
        }
      } else {
        console.log('Skipping item - assembly not requested');
      }
    }
    
    console.log('\n===== ASSEMBLY COST CALCULATION FINISHED =====');
    console.log('FINAL ASSEMBLY COST:', total.toFixed(2),   '€');
    return total;
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
          // Calculate per-item costs
          const getItemCarryingCost = async (item: any) => {
            if (!itemAssistance[item.id]?.needsCarrying) return 0;
            const totalFloors = elevatorAvailable ? 1 : Math.max(0, parseInt(floor) || 0);
            if (totalFloors === 0) return 0;
            try {
              const itemPoints = await getMarketplaceItemPoints(item.category || '', item.subcategory || '');
              const itemCarryingCost = itemPoints * totalFloors * 1.35;
              return itemCarryingCost * (item.quantity || 1);
            } catch (error) {
              console.error('Error calculating item carrying cost:', error);
              return 0;
            }
          };
          
          const getItemAssemblyCost = async (item: any) => {
            if (!itemAssistance[item.id]?.needsAssembly) return 0;
            try {
              const itemPoints = await getMarketplaceItemPoints(item.category || '', item.subcategory || '');
              const assemblyCost = itemPoints * 1.35;
              return assemblyCost * (item.quantity || 1);
            } catch (error) {
              console.error('Error calculating item assembly cost:', error);
              const unit = getAssemblyUnitCost(item);
              return unit > 0 ? unit * (item.quantity || 1) : 0;
            }
          };
          
          for (const item of rehomeItems) {
            const itemCarryingCost = await getItemCarryingCost(item);
            const itemAssemblyCost = await getItemAssemblyCost(item);
            
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
              paymentStatus: 'pending',
              orderStatus: 'pending',
              pickupAddress: '', // ReHome items don't have pickup address
              dropoffAddress: deliveryAddress, // Use delivery address
              pickupDate: null, // ReHome items don't have pickup date
              pickupTime: null, // ReHome items don't have pickup time
              deliveryFee: 0, // ReHome items have free delivery
              assemblyFee: itemAssemblyCost,
              carryingFee: itemCarryingCost,
              extraHelperFee: 0,
              studentDiscount: 0,
              subtotal: item.price * item.quantity,
              taxAmount: 0,
              finalTotal: item.price * item.quantity + itemAssemblyCost + itemCarryingCost,
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
                      setDeliveryAddress(place.text || place.formattedAddress || '');
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
                            {getAssemblyUnitCost(item) > 0 && (
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
                                  {assistanceState.needsAssembly && (
                                    <span className="text-sm font-medium text-orange-600">
                                      €{getAssemblyUnitCost(item).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            <div>
                              <h5 className="font-medium text-gray-800 mb-2">{getAssemblyUnitCost(item) > 0 ? '2.' : '1.'} Need help with carrying upstairs?</h5>
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