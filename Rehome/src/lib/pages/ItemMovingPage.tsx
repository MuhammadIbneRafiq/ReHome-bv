import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaHome, FaStore, FaMinus, FaPlus } from "react-icons/fa";
import { Switch } from "@headlessui/react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { itemCategories, getItemPoints } from '../../lib/constants';
import pricingService, { PricingBreakdown, PricingInput } from '../../services/pricingService';
import API_ENDPOINTS from '../api/config';
import { PhoneNumberInput } from '@/components/ui/PhoneNumberInput';
import OrderConfirmationModal from '../../components/marketplace/OrderConfirmationModal';
import BookingTipsModal from '../../components/ui/BookingTipsModal';

// TypeScript declarations for Google Maps API
declare global {
    interface Window {
        google: any;
    }
}

interface ContactInfo {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    isPhoneValid?: boolean;
}

// Google Places Autocomplete input component using new Places API
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
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API;

  // Function to get place details including coordinates and address components from placeId
  const getPlaceDetails = async (placeId: string) => {
    try {
      const response = await fetch(
        'https://places.googleapis.com/v1/places/' + placeId,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'location,displayName,formattedAddress,addressComponents'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Extract city from address components
        let city = null;
        if (data.addressComponents) {
          // Look for locality (city) in address components
          console.log(data.addressComponents)
          const localityComponent = data.addressComponents.find((component: any) => 
            component.types && component.types.includes('locality')
          );
          if (localityComponent) {
            city = localityComponent.longText;
          }
          
          // If no locality found, try administrative_area_level_1 (province/state)
          if (!city) {
            const adminComponent = data.addressComponents.find((component: any) => 
              component.types && component.types.includes('administrative_area_level_1')
            );
            if (adminComponent) {
              city = adminComponent.longText;
            }
          }
        }
        
        return {
          placeId,
          coordinates: data.location ? {
            lat: data.location.latitude,
            lng: data.location.longitude
          } : null,
          formattedAddress: data.formattedAddress,
          displayName: data.displayName?.text,
          city: city
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
      // Use the new Places API v1 autocomplete endpoint
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
        console.log('Places API response:', data);
        
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
        const errorData = await response.text();
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Places API error:', error);
      // Fallback to simple input
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = async (suggestion: any) => {
    onChange(suggestion.text);
    
    if (onPlaceSelect) {
      // Get place details with coordinates
      const placeDetails = await getPlaceDetails(suggestion.placeId);
      const placeWithDetails = {
        ...suggestion,
        ...placeDetails
      };
      onPlaceSelect(placeWithDetails);
    }
    
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Debounce the search
    const timeoutId = setTimeout(() => {
      searchPlaces(newValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder || 'Enter address'}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
      />
      
      {isLoading && (
        <div className="absolute right-2 top-2">
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
              <div className="flex items-start">
                <div className="text-sm text-gray-900">{suggestion.text}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ItemMovingPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [disassembly, setDisassembly] = useState(false);
    const [contactInfo, setContactInfo] = useState<ContactInfo>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        isPhoneValid: false
    });
    const [firstLocation, setFirstLocation] = useState('');
    const [secondLocation, setSecondLocation] = useState('');
    const [floorPickup, setFloorPickup] = useState('');
    const [floorDropoff, setFloorDropoff] = useState('');

    const [selectedDateRange, setSelectedDateRange] = useState({ start: '', end: '' });
    const [pickupDate, setPickupDate] = useState('');
    const [dropoffDate, setDropoffDate] = useState('');
    const [elevatorPickup, setElevatorPickup] = useState(false);
    const [elevatorDropoff, setElevatorDropoff] = useState(false);
    const [extraHelper, setExtraHelper] = useState(false);
    const [carryingService, setCarryingService] = useState(false);
    const [itemQuantities, setItemQuantities] = useState<{ [key: string]: number }>({});
    const [pickupType, setPickupType] = useState<'private' | 'store' | null>(null);
    const [customItem, setCustomItem] = useState('');
    const [isStudent, setIsStudent] = useState(false);
    const [studentId, setStudentId] = useState<File | null>(null);
    const [storeProofPhoto, setStoreProofPhoto] = useState<File | null>(null);
    const [isDateFlexible, setIsDateFlexible] = useState(false);
    const [disassemblyItems, setDisassemblyItems] = useState<{ [key: string]: boolean }>({});
    const [extraHelperItems, setExtraHelperItems] = useState<{ [key: string]: boolean }>({});
    const [preferredTimeSpan, setPreferredTimeSpan] = useState('');
    const [paymentLoading] = useState(false);
    const [pricingBreakdown, setPricingBreakdown] = useState<PricingBreakdown | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [showBookingTips, setShowBookingTips] = useState(false);
    const [showPointLimitModal, setShowPointLimitModal] = useState(false);
    const [pickupPlace, setPickupPlace] = useState<any>(null);
    const [dropoffPlace, setDropoffPlace] = useState<any>(null);
    const [distanceKm, setDistanceKm] = useState<number | null>(null);
    const [dateOption, setDateOption] = useState<'flexible' | 'fixed' | 'rehome'>('fixed');
    const [carryingServiceItems, setCarryingServiceItems] = useState<{ [key: string]: boolean }>({});

    // Add state for select all functionality
    const [selectAllAssembly, setSelectAllAssembly] = useState(false);
    const [selectAllCarrying, setSelectAllCarrying] = useState(false);
    const [extraInstructions, setExtraInstructions] = useState('');

    // Point limit constant
    const ITEM_TRANSPORT_POINT_LIMIT = 20;

    // Function to calculate total points
    const calculateTotalPoints = () => {
        return Object.entries(itemQuantities)
            .filter(([_, quantity]) => quantity > 0)
            .reduce((total, [itemId, quantity]) => total + (getItemPoints(itemId) * quantity), 0);
    };

    // Function to check point limit and redirect if exceeded
    const checkPointLimitAndRedirect = () => {
        const totalPoints = calculateTotalPoints();
        if (totalPoints > ITEM_TRANSPORT_POINT_LIMIT) {
            setShowPointLimitModal(true);
            return true;
        }
        return false;
    };

    // Function to redirect to house moving with current data
    const redirectToHouseMoving = () => {
        const transferData = {
            pickupType,
            firstLocation,
            secondLocation,
            floorPickup,
            floorDropoff,
            elevatorPickup,
            elevatorDropoff,
            selectedDateRange,
            pickupDate,
            dropoffDate,
            dateOption,
            isDateFlexible,
            preferredTimeSpan,
            itemQuantities,
            customItem,
            disassembly,
            extraHelper,
            carryingService,
            isStudent,
            studentId,
            storeProofPhoto,
            disassemblyItems,
            extraHelperItems,
            carryingServiceItems,
            pickupPlace,
            dropoffPlace,
            distanceKm,
            extraInstructions
        };
        
        // Store data in sessionStorage for transfer
        sessionStorage.setItem('itemTransportToHouseMoving', JSON.stringify(transferData));
        navigate('/house-moving');
    };

    // Add handlers for select all functionality
    const handleSelectAllAssembly = (checked: boolean) => {
        setSelectAllAssembly(checked);
        const selectedItems = Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0);
        const newDisassemblyItems: { [key: string]: boolean } = {};
        selectedItems.forEach(itemId => {
            newDisassemblyItems[itemId] = checked;
        });
        setDisassemblyItems(newDisassemblyItems);
    };

    const handleSelectAllCarrying = (checked: boolean) => {
        setSelectAllCarrying(checked);
        const selectedItems = Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0);
        const newCarryingItems: { [key: string]: boolean } = {};
        selectedItems.forEach(itemId => {
            newCarryingItems[itemId] = checked;
        });
        setCarryingServiceItems(newCarryingItems);
    };

    // Update disassembly items when individual items change
    useEffect(() => {
        const selectedItems = Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0);
        const allSelected = selectedItems.length > 0 && selectedItems.every(itemId => disassemblyItems[itemId]);
        setSelectAllAssembly(allSelected);
    }, [disassemblyItems, itemQuantities]);

    // Update carrying items when individual items change
    useEffect(() => {
        const selectedItems = Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0);
        const allSelected = selectedItems.length > 0 && selectedItems.every(itemId => carryingServiceItems[itemId]);
        setSelectAllCarrying(allSelected);
    }, [carryingServiceItems, itemQuantities]);

    const handleStudentIdUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setStudentId(file || null);
    };

    const handleStoreProofUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setStoreProofPhoto(file || null);
    };

    // Load Google Maps API if not already loaded
    const loadGoogleMapsAPI = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.async = true;
            script.defer = true;
            
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Google Maps API'));
            
            document.head.appendChild(script);
        });
    };

    // Calculate distance using Google Maps Distance Matrix API with fallback to straight-line
    const calculateDistance = async (place1: any, place2: any): Promise<number> => {
        if (!place1?.coordinates || !place2?.coordinates) {
            return 0;
        }

        console.log('📏 Calculating distance between:', place1.text || place1.formattedAddress, 'and', place2.text || place2.formattedAddress);
        
        try {
            // Ensure Google Maps API is loaded
            await loadGoogleMapsAPI();
            
            // Use Distance Matrix API for accurate driving distance
            return new Promise((resolve) => {
                const service = new google.maps.DistanceMatrixService();
                const origins = [new google.maps.LatLng(place1.coordinates.lat, place1.coordinates.lng)];
                const destinations = [new google.maps.LatLng(place2.coordinates.lat, place2.coordinates.lng)];

                service.getDistanceMatrix({
                    origins,
                    destinations,
                    travelMode: google.maps.TravelMode.DRIVING,
                    unitSystem: google.maps.UnitSystem.METRIC,
                }, (response, status) => {
                    if (status === 'OK' && response?.rows?.[0]?.elements?.[0]?.status === 'OK') {
                        const distanceKm = response.rows[0].elements[0].distance.value / 1000; // Convert meters to km
                        console.log('📏 Distance Matrix API distance:', distanceKm.toFixed(2), 'km');
                        resolve(distanceKm);
                    } else {
                        console.warn('⚠️ Distance Matrix API failed, falling back to straight-line calculation');
                        resolve(calculateStraightLineDistance(place1, place2));
                    }
                });
            });
        } catch (error) {
            console.warn('⚠️ Error loading Google Maps API, falling back to straight-line calculation:', error);
            return calculateStraightLineDistance(place1, place2);
        }
    };

    // Fallback function for straight-line distance calculation
    const calculateStraightLineDistance = (place1: any, place2: any): number => {
        if (!place1?.coordinates || !place2?.coordinates) {
            return 0;
        }

        const R = 6371; // Radius of the Earth in kilometers
        const lat1 = place1.coordinates.lat;
        const lon1 = place1.coordinates.lng;
        const lat2 = place2.coordinates.lat;
        const lon2 = place2.coordinates.lng;

        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in kilometers
        
        console.log('📏 Calculated straight-line distance:', distance.toFixed(2), 'km between', place1.text, 'and', place2.text);
        return distance;
    };

    const calculatePrice = async () => {
        if (!firstLocation || !secondLocation) {
            setPricingBreakdown(null);
            return;
        }

        try {
            // Calculate distance if we have coordinates from Google Places
            let calculatedDistance = 0;
            if (pickupPlace?.coordinates && dropoffPlace?.coordinates) {
                calculatedDistance = await calculateDistance(pickupPlace, dropoffPlace);
                setDistanceKm(calculatedDistance);
            }

            // For "Let ReHome choose" option, provide a 3-week window starting tomorrow
            let selectedDateForPricing = selectedDateRange.start;
            if (dateOption === 'rehome') {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                selectedDateForPricing = tomorrow.toISOString().split('T')[0];
            }

            const pricingInput: PricingInput = {
                serviceType: 'item-transport',
                pickupLocation: firstLocation,
                dropoffLocation: secondLocation,
                distanceKm: calculatedDistance, // Use calculated distance
                selectedDate: selectedDateForPricing,
                selectedDateRange: dateOption === 'flexible' ? selectedDateRange : { start: '', end: '' }, // Only pass date range for flexible dates
                // For fixed dates, use separate pickup/dropoff dates
                // For flexible/rehome, don't set pickup/dropoff dates
                pickupDate: dateOption === 'fixed' ? pickupDate : undefined,
                dropoffDate: dateOption === 'fixed' ? dropoffDate : undefined,
                isDateFlexible: dateOption === 'rehome', // Only true for ReHome choose option
                itemQuantities,
                floorPickup: carryingService ? (parseInt(floorPickup) || 0) : 0,
                floorDropoff: carryingService ? (parseInt(floorDropoff) || 0) : 0,
                elevatorPickup,
                elevatorDropoff,
                assemblyItems: disassemblyItems,
                extraHelperItems,
                isStudent,
                hasStudentId: !!studentId,
                isEarlyBooking: false,
                carryingServiceItems,
                pickupPlace: pickupPlace,
                dropoffPlace: dropoffPlace,
            };
            const breakdown = await pricingService.calculatePricing(pricingInput);
            setPricingBreakdown(breakdown);
            
            // Update distance state from pricing service result if we didn't calculate distance
            if (!calculatedDistance && breakdown?.breakdown?.distance?.distanceKm) {
                setDistanceKm(breakdown.breakdown.distance.distanceKm);
            }
        } catch (error) {
            console.error('Error calculating pricing:', error);
            setPricingBreakdown(null);
        }
    };

    // Debounced price calculation to avoid excessive API calls while typing
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            // Only calculate price if we have both complete locations
            if (firstLocation && secondLocation && 
                firstLocation.trim().length > 3 && secondLocation.trim().length > 3) {
                calculatePrice();
            } else {
                // Clear price if locations are incomplete
                setPricingBreakdown(null);
            }
        }, 400); // 400ms debounce - faster pricing updates

        return () => clearTimeout(debounceTimer);
    }, [firstLocation, secondLocation, selectedDateRange.start, selectedDateRange.end, pickupDate, dropoffDate, isDateFlexible, dateOption]);

    // Immediate price calculation for non-location changes and when places with coordinates change
    useEffect(() => {
        if (firstLocation && secondLocation) {
            calculatePrice();
        }
    }, [itemQuantities, floorPickup, floorDropoff, disassembly, extraHelper, carryingService, elevatorPickup, elevatorDropoff, disassemblyItems, extraHelperItems, carryingServiceItems, isStudent, studentId, pickupPlace, dropoffPlace, pickupDate, dropoffDate, dateOption]);

    const nextStep = () => {
        // Show booking tips after step 1 (locations)
        if (step === 1) {
            setShowBookingTips(true);
            return;
        }

        // Check point limit when moving to step 3 (items) or later
        if (step >= 2) {
            if (checkPointLimitAndRedirect()) {
                return;
            }
        }

        // Validate date selection in step 4
        if (step === 4) {
            if (dateOption === 'fixed' && (!pickupDate || !dropoffDate)) {
                toast.error("Please select both pickup and dropoff dates.");
                return;
            }
            if (dateOption === 'flexible' && (!selectedDateRange.start || !selectedDateRange.end)) {
                toast.error("Please select both start and end dates for your flexible date range.");
                return;
            }
        }

        // Validate contact information in step 5
        if (step === 5) {
            if (!contactInfo.firstName.trim()) {
                toast.error("Please enter your first name.");
                return;
            }
            if (!contactInfo.lastName.trim()) {
                toast.error("Please enter your last name.");
                return;
            }
            if (!contactInfo.email.trim()) {
                toast.error("Please enter your email.");
                return;
            }
            if (!contactInfo.phone.trim()) {
                toast.error("Please enter your phone number.");
                return;
            }
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(contactInfo.email)) {
                toast.error("Please enter a valid email address.");
                return;
            }
            // Basic phone validation (E.164 international format)
            const phoneRegex = /^\+?[1-9]\d{1,14}$/;
            if (!phoneRegex.test(contactInfo.phone)) {
                toast.error("Please enter a valid phone number.");
                return;
            }
            // Validate store proof photo if pickup type is store
            if (pickupType === 'store' && !storeProofPhoto) {
                toast.error("Please upload proof of purchase/ownership for store items.");
                return;
            }
            // Check if terms and conditions are agreed to
            if (!agreedToTerms) {
                toast.error("Please agree to the Terms and Conditions to continue.");
                return;
            }
        }

        if (step < 6) setStep(step + 1);
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleContinueFromTips = () => {
        setShowBookingTips(false);
        setStep(2); // Move to date selection step
    };

    const incrementItem = (itemId: string) => {
        setItemQuantities(prevQuantities => {
            const newQuantities = {
                ...prevQuantities,
                [itemId]: (prevQuantities[itemId] || 0) + 1,
            };
            
            // Check if this increment would exceed the limit
            const newTotalPoints = Object.entries(newQuantities)
                .filter(([_, quantity]) => quantity > 0)
                .reduce((total, [itemId, quantity]) => total + (getItemPoints(itemId) * quantity), 0);
            
            if (newTotalPoints > ITEM_TRANSPORT_POINT_LIMIT) {
                // Show the modal immediately when limit is exceeded
                setTimeout(() => setShowPointLimitModal(true), 100);
            }
            
            return newQuantities;
        });
    };

    const decrementItem = (itemId: string) => {
        setItemQuantities(prevQuantities => {
            const newQuantity = (prevQuantities[itemId] || 0) - 1;
            if (newQuantity <= 0) {
                const { [itemId]: _, ...rest } = prevQuantities;
                return rest;
            }
            return { ...prevQuantities, [itemId]: newQuantity };
        });
    };

    const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setContactInfo({ ...contactInfo, [e.target.id]: e.target.value });
    };

    const handlePhoneChange = (value: string, isValid: boolean) => {
        setContactInfo(prev => ({ ...prev, phone: value, isPhoneValid: isValid }));
    };

    // Update extra helper items when extra helper is toggled
    useEffect(() => {
        if (extraHelper) {
            // When extra helper is enabled, automatically select all items that have quantities > 0
            const selectedItems = Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0);
            const newExtraHelperItems: { [key: string]: boolean } = {};
            selectedItems.forEach(itemId => {
                newExtraHelperItems[itemId] = true;
            });
            setExtraHelperItems(newExtraHelperItems);
        } else {
            // When extra helper is disabled, clear all selections
            setExtraHelperItems({});
        }
    }, [extraHelper, itemQuantities]);

    // Update extra helper when items change (if extra helper is enabled)
    useEffect(() => {
        if (extraHelper) {
            const selectedItems = Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0);
            const newExtraHelperItems: { [key: string]: boolean } = {};
            selectedItems.forEach(itemId => {
                newExtraHelperItems[itemId] = true;
            });
            setExtraHelperItems(newExtraHelperItems);
        }
    }, [itemQuantities, extraHelper]);

    // Update carrying service items when carrying service is toggled
    useEffect(() => {
        if (carryingService) {
            // When carrying service is enabled, automatically select all items that have quantities > 0
            const selectedItems = Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0);
            const newCarryingItems: { [key: string]: boolean } = {};
            selectedItems.forEach(itemId => {
                newCarryingItems[itemId] = true;
            });
            setCarryingServiceItems(newCarryingItems);
        } else {
            // When carrying service is disabled, clear all selections
            setCarryingServiceItems({});
        }
    }, [carryingService, itemQuantities]);

    // Update carrying service when items change (if carrying service is enabled)
    useEffect(() => {
        if (carryingService) {
            const selectedItems = Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0);
            const newCarryingItems: { [key: string]: boolean } = {};
            selectedItems.forEach(itemId => {
                newCarryingItems[itemId] = true;
            });
            setCarryingServiceItems(newCarryingItems);
        }
    }, [itemQuantities, carryingService]);

    const isFormValid = () => {        
        if (dateOption === 'fixed' && (!pickupDate || !dropoffDate)) {
            console.log('❌ Date validation failed - missing pickup or dropoff date');
            return false;
        }
        if (dateOption === 'flexible' && (!selectedDateRange.start || !selectedDateRange.end)) {
            console.log('❌ Date validation failed - missing flexible date range');
            return false;
        }
        if (!contactInfo.firstName.trim() || !contactInfo.lastName.trim() || 
            !contactInfo.email.trim() || !contactInfo.phone.trim()) {
            console.log('❌ Contact info validation failed');
            return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactInfo.email)) {
            console.log('❌ Email validation failed');
            return false;
        }
        
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(contactInfo.phone)) {
            console.log('❌ Phone validation failed');
            return false;
        }
        
        // Validate store proof photo if pickup type is store
        if (pickupType === 'store' && !storeProofPhoto) {
            console.log('❌ Store proof photo validation failed');
            return false;
        }
        
        // Check if terms and conditions are agreed to
        if (!agreedToTerms) {
            console.log('❌ Terms agreement validation failed');
            return false;
        }
        
        console.log('✅ All validations passed');
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isFormValid()) {
            toast.error("Please fill in all required fields correctly.");
            return;
        }

        // Prepare furniture items array for backend
        const furnitureItems = Object.entries(itemQuantities)
            .filter(([_, quantity]) => quantity > 0)
            .map(([itemId, quantity]) => ({
                name: itemId.replace(/-/g, ' - '),
                quantity,
                points: getItemPoints(itemId) * quantity,
                value: getItemPoints(itemId) * quantity * 1 // €1 per point
            }));

        // Calculate total item points
        const totalItemPoints = Object.entries(itemQuantities)
            .filter(([_, quantity]) => quantity > 0)
            .reduce((total, [itemId, quantity]) => total + (getItemPoints(itemId) * quantity), 0);

        // Use already calculated distance from state, or fallback to straight-line if needed
        const finalDistance = distanceKm || (pickupPlace?.coordinates && dropoffPlace?.coordinates 
            ? calculateStraightLineDistance(pickupPlace, dropoffPlace) : 0);

        // Prepare payload in the format expected by backend
        const payload = {
            pickupType,
            furnitureItems,
            customItem,
            floorPickup: parseInt(floorPickup) || 0,
            floorDropoff: parseInt(floorDropoff) || 0,
            contactInfo,
            estimatedPrice: pricingBreakdown?.total || 0,
            selectedDateRange,
            isDateFlexible,
            pickupDate: dateOption === 'fixed' ? pickupDate : 
                       dateOption === 'flexible' ? selectedDateRange.start : null,
            dropoffDate: dateOption === 'fixed' ? dropoffDate : 
                        dateOption === 'flexible' ? selectedDateRange.end : null,
            dateOption,
            preferredTimeSpan,
            extraInstructions,
            elevatorPickup,
            elevatorDropoff,
            disassembly,
            extraHelper,
            carryingService,
            isStudent,
            studentId,
            storeProofPhoto,
            disassemblyItems,
            extraHelperItems,
            carryingServiceItems,
            basePrice: pricingBreakdown?.basePrice || 0,
            itemPoints: totalItemPoints,
            carryingCost: pricingBreakdown?.carryingCost || 0,
            disassemblyCost: pricingBreakdown?.assemblyCost || 0,
            distanceCost: pricingBreakdown?.distanceCost || 0,
            extraHelperCost: pricingBreakdown?.extraHelperCost || 0,
            distanceKm: finalDistance, // Pre-calculated distance
            firstlocation: firstLocation,
            secondlocation: secondLocation,
            firstlocation_coords: pickupPlace?.coordinates,
            secondlocation_coords: dropoffPlace?.coordinates,
            // Complete order summary for email
            orderSummary: {
                pickupDetails: {
                    address: firstLocation,
                    floor: floorPickup || '0',
                    elevator: elevatorPickup
                },
                deliveryDetails: {
                    address: secondLocation,
                    floor: floorDropoff || '0',
                    elevator: elevatorDropoff
                },
                schedule: {
                    date: dateOption === 'rehome' ? 'Let ReHome Choose' :
                          isDateFlexible || dateOption === 'flexible' ? 
                          (selectedDateRange.start && selectedDateRange.end ? 
                           `${new Date(selectedDateRange.start).toLocaleDateString()} - ${new Date(selectedDateRange.end).toLocaleDateString()}` : 
                           'Flexible date range') : 
                          dateOption === 'fixed' && pickupDate && dropoffDate ? 
                          `Pickup: ${new Date(pickupDate).toLocaleDateString()}, Dropoff: ${new Date(dropoffDate).toLocaleDateString()}` :
                          'Date not specified',
                    time: preferredTimeSpan ? (
                        preferredTimeSpan === 'morning' ? 'Morning (8:00 - 12:00)' : 
                        preferredTimeSpan === 'afternoon' ? 'Afternoon (12:00 - 16:00)' : 
                        preferredTimeSpan === 'evening' ? 'Evening (16:00 - 20:00)' : 'Anytime'
                    ) : 'Not specified'
                },
                items: furnitureItems,
                additionalServices: {
                    assembly: (pricingBreakdown?.assemblyCost ?? 0) > 0 ? (pricingBreakdown?.assemblyCost ?? 0) : 0,
                    extraHelper: (pricingBreakdown?.extraHelperCost ?? 0) > 0 ? (pricingBreakdown?.extraHelperCost ?? 0) : 0,
                    carrying: (pricingBreakdown?.carryingCost ?? 0) > 0 ? (pricingBreakdown?.carryingCost ?? 0) : 0,
                    studentDiscount: (pricingBreakdown?.studentDiscount ?? 0) > 0 ? (pricingBreakdown?.studentDiscount ?? 0) : 0
                },
                contactInfo: {
                    name: `${contactInfo.firstName} ${contactInfo.lastName}`,
                    email: contactInfo.email,
                    phone: contactInfo.phone
                },
                totalPrice: pricingBreakdown?.total || 0
            }
        };

        try {
            // Submit the moving request (this will also send the email)
            const response = await fetch(API_ENDPOINTS.MOVING.ITEM_REQUEST, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) { 
                const errorData = await response.json();
                throw new Error(`Error: ${errorData.message || 'Network response was not ok'}`);
            }

            // Show confirmation modal instead of toast
            setShowConfirmationModal(true);

        } catch (error) {
            console.error("Error submitting the moving request:", error);
            toast.error("An error occurred while submitting your request.");
        }
    };

    const ElevatorToggle = ({ label, checked, onChange }: {
        label: string,
        checked: boolean,
        onChange: (checked: boolean) => void
    }) => (
        <div className="flex items-center mt-2">
            <Switch
                checked={checked}
                onChange={onChange}
                className={`${checked ? 'bg-orange-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2`}
            >
                <span
                    style={{
                        transform: checked ? 'translateX(24px)' : 'translateX(4px)',
                        transition: 'transform 0.2s'
                    }}
                    className="inline-block h-4 w-4 rounded-full bg-white"
                />
            </Switch>
            <span className="ml-2 text-sm text-gray-700">{label}</span>
        </div>
    );

    // Add a real-time pricing display component that will be shown throughout the process
    const PriceSummary = ({ pricingBreakdown }: { pricingBreakdown: PricingBreakdown | null }) => {
        // Step 1: Don't show any pricing estimate yet - only after locations AND date
        if (step === 1) {
            return (
                <div className="bg-white p-4 rounded-lg shadow-md sticky top-24">
                    <h3 className="font-semibold text-lg mb-3">Your Price Estimate</h3>
                    <p className="text-gray-500">Complete pickup type and location details to continue</p>
                </div>
            );
        }

        // Step 2+: Show pricing only if we have both locations and date
        if (!pricingBreakdown) {
            return (
                <div className="bg-white p-4 rounded-lg shadow-md sticky top-24">
                    <h3 className="font-semibold text-lg mb-3">Your Price Estimate</h3>
                    <p className="text-gray-500">Select a date to see base pricing</p>
                </div>
            );
        }

        // Check if we have valid base pricing (location + date provided)
        const hasValidBasePricing = pricingBreakdown.basePrice > 0 && firstLocation && secondLocation && (isDateFlexible || selectedDateRange.start || (dateOption === 'fixed' && pickupDate && dropoffDate));
        
        if (!hasValidBasePricing) {
            return (
                <div className="bg-white p-4 rounded-lg shadow-md sticky top-24">
                    <h3 className="font-semibold text-lg mb-3">Your Price Estimate</h3>
                    <p className="text-gray-500">
                        {!firstLocation || !secondLocation ? "Enter both pickup and dropoff locations" : 
                         !isDateFlexible && !selectedDateRange.start && !(dateOption === 'fixed' && pickupDate && dropoffDate) ? "Select a date to see base pricing" : 
                         "Calculating pricing..."}
                    </p>
                </div>
            );
        }

        // Calculate real-time item details for display
        const selectedItems = Object.entries(itemQuantities)
            .filter(([_, quantity]) => quantity > 0)
            .map(([itemId, quantity]) => {
                const points = getItemPoints(itemId);
                const itemValue = points * quantity * 1; // €1 per point for item transport
                return {
                    name: itemId.replace(/-/g, ' - '),
                    quantity,
                    points: points * quantity,
                    value: itemValue
                };
            });

        const totalItemPoints = selectedItems.reduce((sum, item) => sum + item.points, 0);
        const totalItemValue = selectedItems.reduce((sum, item) => sum + item.value, 0);
        
        // Check if approaching or exceeding point limit
        const isApproachingLimit = totalItemPoints >= ITEM_TRANSPORT_POINT_LIMIT * 0.8; // 80% of limit
        const isExceedingLimit = totalItemPoints > ITEM_TRANSPORT_POINT_LIMIT;
        
        return (
            <div className="bg-white p-4 rounded-lg shadow-md sticky top-24">
                <h3 className="font-semibold text-lg mb-3">Your Price Estimate</h3>
                
                {/* Point Limit Warning */}
                {isExceedingLimit && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center">
                            <FaHome className="h-4 w-4 text-red-600 mr-2" />
                            <span className="text-sm font-medium text-red-800">
                                Move too large for item transport ({totalItemPoints} points)
                            </span>
                        </div>
                        <p className="text-xs text-red-600 mt-1">
                            Consider house moving service for better pricing
                        </p>
                    </div>
                )}
                
                {isApproachingLimit && !isExceedingLimit && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-center">
                            <FaHome className="h-4 w-4 text-yellow-600 mr-2" />
                            <span className="text-sm font-medium text-yellow-800">
                                Approaching item transport limit ({totalItemPoints}/20 points)
                            </span>
                        </div>
                        <p className="text-xs text-yellow-600 mt-1">
                            Consider house moving for larger moves
                        </p>
                    </div>
                )}
                
                <div className="space-y-3">
                    {/* Base Price */}
                    <div className="flex justify-between">
                        <span>Base Price:</span>
                        <span>€{pricingBreakdown.breakdown.baseCharge.originalPrice.toFixed(2)}</span>
                    </div>

                    {pricingBreakdown.breakdown.baseCharge.city && (
                        <div className="text-xs text-gray-500 ml-4">
                            {/* Show detailed breakdown for separate pickup/dropoff dates */}
                            {dateOption === 'fixed' && pickupDate && dropoffDate && pricingBreakdown.breakdown.baseCharge.city.includes('/') ? (
                                <div className="space-y-1">
                                    <div>
                                        {pricingBreakdown.breakdown.baseCharge.city} - {
                                            isDateFlexible ? "Flexible date with discount according to ReHome delivery plans" :
                                            pricingBreakdown.breakdown.baseCharge.isEarlyBooking ? "Early bookingwith discount according to ReHome delivery plans" :
                                            pricingBreakdown.breakdown.baseCharge.isCityDay ? "City day rates" : "Mixed rates"
                                        }
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Pickup: {new Date(pickupDate).toLocaleDateString('en-US', { weekday: 'short' })} | 
                                        Dropoff: {new Date(dropoffDate).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {pickupPlace?.city && dropoffPlace?.city ? 
                                        `${pickupPlace.city} → ${dropoffPlace.city}` : 
                                        pricingBreakdown.breakdown.baseCharge.city
                                    } - {
                                        isDateFlexible ? "Flexible date with discount according to ReHome delivery plans" :
                                        pricingBreakdown.breakdown.baseCharge.isEarlyBooking ? "Early booking with discount according to ReHome delivery plans" :
                                        pricingBreakdown.breakdown.baseCharge.isCityDay ? "City day rate" : "Normal rate"
                                    }
                                    {dateOption === 'fixed' && pickupDate && dropoffDate && (
                                        <div className="text-xs text-gray-400">
                                            Pickup: {new Date(pickupDate).toLocaleDateString('en-US', { weekday: 'short' })} | 
                                            Dropoff: {new Date(dropoffDate).toLocaleDateString('en-US', { weekday: 'short' })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Items Section - Show detailed breakdown */}
                    <div className="border-t pt-3">
                        <div className="flex justify-between font-medium">
                            <span>Items ({totalItemPoints} points):</span>
                            <span>€{totalItemValue.toFixed(2)}</span>
                        </div>
                        {selectedItems.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {selectedItems.map((item, index) => (
                                    <div key={index} className="flex justify-between text-xs text-gray-600 ml-4">
                                        <span>{item.name} ({item.quantity}x)</span>
                                        <span>€{item.value.toFixed(2)}</span>
                                    </div>
                                ))}
                                {/* <div className="text-xs text-gray-500 ml-4 mt-1">
                                    Total item value = {totalItemPoints} points × €1
                                </div> */}
                            </div>
                        )}
                        {selectedItems.length === 0 && (
                            <div className="text-xs text-gray-500 ml-4">No items selected</div>
                        )}
                    </div>

                    {/* Distance */}
                    {pricingBreakdown.distanceCost > 0 ? (
                        <div className="flex justify-between">
                            <span>Distance ({pricingBreakdown.breakdown.distance.distanceKm.toFixed(1)}km):</span>
                            <span>€{pricingBreakdown.distanceCost.toFixed(2)}</span>
                        </div>
                    ) : (
                        <div className="flex justify-between text-green-600">
                            <span>Distance ({pricingBreakdown.breakdown.distance.distanceKm.toFixed(1)}km):</span>
                            <span>Free</span>
                        </div>
                    )}

                    {/* Add-ons Section */}
                    {(pricingBreakdown.carryingCost > 0 || pricingBreakdown.assemblyCost > 0 || pricingBreakdown.extraHelperCost > 0) && (
                        <div className="border-t pt-3">
                            <div className="font-medium mb-2">Add-ons:</div>
                            
                            {/* Assembly */}
                            {pricingBreakdown.assemblyCost > 0 && (
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="ml-2">Assembly/Disassembly:</span>
                                        <span>€{pricingBreakdown.assemblyCost.toFixed(2)}</span>
                                    </div>
                                    {pricingBreakdown.breakdown.assembly.itemBreakdown.map((item, index) => (
                                        <div key={index} className="flex justify-between text-xs text-gray-600 ml-6">
                                            <span>{item.itemId.replace(/-/g, ' - ')}</span>
                                            <span>€{item.cost.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Carrying */}
                            {pricingBreakdown.carryingCost > 0 && (
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="ml-2">Carrying ({pricingBreakdown.breakdown.carrying.floors} floors):</span>
                                        <span>€{pricingBreakdown.carryingCost.toFixed(2)}</span>
                                    </div>
                                    {/* Elevator discount explanation */}
                                    {((elevatorPickup && parseInt(floorPickup) > 1) || (elevatorDropoff && parseInt(floorDropoff) > 1)) && (
                                        <div className="text-xs text-green-700 ml-6">
                                            <span>Elevator discount applied.</span>
                                        </div>
                                    )}
                                    {pricingBreakdown.breakdown.carrying.itemBreakdown.map((item, index) => (
                                        <div key={index} className="flex justify-between text-xs text-gray-600 ml-6">
                                            <span>{item.itemId.replace(/-/g, ' - ')}</span>
                                            <span>€{item.cost.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Extra Helper */}
                            {pricingBreakdown.extraHelperCost > 0 && (
                                <div className="flex justify-between">
                                    <span className="ml-2">Extra Helper ({pricingBreakdown.breakdown.extraHelper.category} move):</span>
                                    <span>€{pricingBreakdown.extraHelperCost.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Subtotal */}
                    <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Subtotal:</span>
                        <span>€{pricingBreakdown.subtotal.toFixed(2)}</span>
                    </div>

                    {/* Student Discount */}
                    {pricingBreakdown.studentDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Student Discount (10%):</span>
                            <span>-€{pricingBreakdown.studentDiscount.toFixed(2)}</span>
                        </div>
                    )}

                    {/* Early Booking Discount */}
                    {pricingBreakdown.earlyBookingDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Early Booking Discount (10%):</span>
                            <span>-€{pricingBreakdown.earlyBookingDiscount.toFixed(2)}</span>
                        </div>
                    )}

                    {/* Total */}
                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                        <span>Total:</span>
                        <span>€{pricingBreakdown.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-orange-50 pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('itemMoving.title', 'Item Transport')}</h1>
                <p className="text-lg text-gray-600 mb-6">{t('itemMoving.subtitle', 'Transport your items safely and affordably')}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Content - Left 2/3 */}
                    <div className="md:col-span-2">
                        <div className="bg-white shadow-md rounded-lg p-6">
                            {/* Progress Step Indicator */}
                            <div className="flex justify-between mb-8">
                                {[1, 2, 3, 4, 5, 6].map((s) => (
                                    <div 
                                        key={s}
                                        className={`relative flex flex-col items-center ${s < step ? 'text-green-600' : s === step ? 'text-orange-600' : 'text-gray-400'}`}
                                    >
                                        <div className={`rounded-full transition duration-500 ease-in-out h-10 w-10 flex items-center justify-center mb-1 ${s < step ? 'bg-green-600' : s === step ? 'bg-orange-600' : 'bg-gray-200'} ${s <= step ? 'text-white' : 'text-gray-600'}`}>
                                            {s < step ? <FaCheckCircle className="h-6 w-6" /> : s}
                                        </div>
                                        <div className="text-xs text-center">
                                            {s === 1 && 'Pickup Type'}
                                            {s === 2 && 'Date & Time'}
                                            {s === 3 && 'Items'}
                                            {s === 4 && 'Add-ons'}
                                            {s === 5 && 'Contact'}
                                            {s === 6 && 'Overview'}
                                        </div>
                                        {s < 6 && (
                                            <div className="absolute top-5 -right-full w-full h-0.5 bg-gray-200">
                                                <div 
                                                    className="h-full bg-green-600 transition-all duration-500 ease-out"
                                                    style={{ width: s < step ? '100%' : '0%' }}
                                                ></div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Step 1: Pickup Selection */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-600 mb-4">
                                        Select the type of pickup location for your items.
                                    </p>
                                    
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div 
                                            className={`border rounded-lg p-6 cursor-pointer transition-colors ${
                                                pickupType === 'private' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                                            }`}
                                            onClick={() => setPickupType('private')}
                                        >
                                            <div className="flex items-center">
                                                <div className={`rounded-full p-3 ${pickupType === 'private' ? 'bg-orange-500' : 'bg-gray-200'}`}>
                                                    <FaHome className={`h-6 w-6 ${pickupType === 'private' ? 'text-white' : 'text-gray-600'}`} />
                                                </div>
                                                <h3 className="ml-3 text-lg font-medium text-gray-900">Private Address</h3>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-500">
                                                Pick up items from a home, apartment, or other residential location.
                                            </p>
                                        </div>
                                        
                                        <div 
                                            className={`border rounded-lg p-6 cursor-pointer transition-colors ${
                                                pickupType === 'store' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                                            }`}
                                            onClick={() => setPickupType('store')}
                                        >
                                            <div className="flex items-center">
                                                <div className={`rounded-full p-3 ${pickupType === 'store' ? 'bg-orange-500' : 'bg-gray-200'}`}>
                                                    <FaStore className={`h-6 w-6 ${pickupType === 'store' ? 'text-white' : 'text-gray-600'}`} />
                                                </div>
                                                <h3 className="ml-3 text-lg font-medium text-gray-900">Store/Business</h3>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-500">
                                                Pick up items from a store, warehouse, or other business location.
                                            </p>
                                        </div>
                                    </div>

                                    {pickupType && (
                                        <div className="mt-8 space-y-6">
                                            <div>
                                                                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
                                    <GooglePlacesAutocomplete
                                        value={firstLocation}
                                        onChange={setFirstLocation}
                                        placeholder="Enter pickup address"
                                        onPlaceSelect={(place) => {
                                            setPickupPlace(place);
                                        }}
                                    />
                                </div>
                                                
                                                <div className="mt-3">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Floor (Enter 0 for ground floor)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={floorPickup}
                                                        onChange={(e) => setFloorPickup(e.target.value)}
                                                        placeholder="Floor number"
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                                    />
                                                </div>
                                                
                                                <div className="mt-2">
                                                    <ElevatorToggle
                                                        label="Elevator available at pickup location"
                                                        checked={elevatorPickup}
                                                        onChange={setElevatorPickup}
                                                    />
                                                </div>
                                            </div>

                                                                        <div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff Address</label>
                                    <GooglePlacesAutocomplete
                                        value={secondLocation}
                                        onChange={setSecondLocation}
                                        placeholder="Enter dropoff address"
                                        onPlaceSelect={(place) => {
                                            setDropoffPlace(place);
                                        }}
                                    />
                                </div>
                                                
                                                <div className="mt-3">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Floor (Enter 0 for ground floor)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={floorDropoff}
                                                        onChange={(e) => setFloorDropoff(e.target.value)}
                                                        placeholder="Floor number"
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                                    />
                                                </div>
                                                
                                                <div className="mt-2">
                                                    <ElevatorToggle
                                                        label="Elevator available at dropoff location"
                                                        checked={elevatorDropoff}
                                                        onChange={setElevatorDropoff}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                                                     
                                </div>
                            )}

                            {/* Step 2: Date & Time */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-600 mb-4">
                                        Select your preferred date and time for pickup and delivery.
                                    </p>
                                    {/* Date Option Dropdown */}
                                    <div className="mb-4">
                                        <label htmlFor="date-option" className="block text-sm font-medium text-gray-700 mb-1">Date Option</label>
                                        <select
                                            id="date-option"
                                            value={dateOption}
                                            onChange={e => {
                                                const newDateOption = e.target.value as 'flexible' | 'fixed' | 'rehome';
                                                setDateOption(newDateOption);
                                                
                                                // Clear all date-related states first
                                                setSelectedDateRange({ start: '', end: '' });
                                                setPickupDate('');
                                                setDropoffDate('');
                                                setIsDateFlexible(false);
                                                
                                                // Set appropriate states based on option
                                                if (newDateOption === 'rehome') {
                                                    // ReHome choose: isDateFlexible=true, no dates set
                                                    setIsDateFlexible(true);
                                                } else if (newDateOption === 'flexible') {
                                                    // Flexible range: isDateFlexible=false, user will set date range
                                                    setIsDateFlexible(false);
                                                } else if (newDateOption === 'fixed') {
                                                    // Fixed date: isDateFlexible=false, user will set pickup/dropoff dates
                                                    setIsDateFlexible(false);
                                                }
                                                
                                                // Trigger immediate price calculation after state change
                                                setTimeout(() => {
                                                    if (firstLocation && secondLocation) {
                                                        calculatePrice();
                                                    }
                                                }, 50);
                                            }}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                        >
                                            <option value="flexible">Flexible date range</option>
                                            <option value="fixed">Fixed date</option>
                                            <option value="rehome">Let ReHome choose</option>
                                        </select>
                                    </div>
                                    {/* Show date pickers based on option */}
                                    {dateOption === 'flexible' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                                <input
                                                    type="date"
                                                    value={selectedDateRange.start}
                                                    onChange={e => {
                                                        setSelectedDateRange(r => ({ ...r, start: e.target.value }));
                                                        setPickupDate('');
                                                        setDropoffDate('');
                                                    }}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                                <input
                                                    type="date"
                                                    value={selectedDateRange.end}
                                                    onChange={e => {
                                                        setSelectedDateRange(r => ({ ...r, end: e.target.value }));
                                                        setPickupDate('');
                                                        setDropoffDate('');
                                                    }}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                                    required
                                                />
                                            </div>
                                        </>
                                    )}
                                    {dateOption === 'fixed' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
                                                <input
                                                    type="date"
                                                    value={pickupDate}
                                                    onChange={e => {
                                                        setPickupDate(e.target.value);
                                                        setSelectedDateRange({ start: '', end: '' });
                                                    }}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff Date</label>
                                                <input
                                                    type="date"
                                                    value={dropoffDate}
                                                    onChange={e => {
                                                        setDropoffDate(e.target.value);
                                                        setSelectedDateRange({ start: '', end: '' });
                                                    }}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                                    required
                                                />
                                            </div>
                                        </>
                                    )}
                                    {dateOption === 'rehome' && (
                                        <div className="p-3 bg-blue-50 rounded text-blue-700 text-sm">
                                            ReHome will suggest the most efficient and cost-effective moving date for you.
                                        </div>
                                    )}
                                    {/* Preferred Time Slot remains as before */}
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Preferred Time Slot
                                        </label>
                                        <select
                                            value={preferredTimeSpan}
                                            onChange={(e) => setPreferredTimeSpan(e.target.value)}
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                                        >
                                            <option value="">Select a time slot...</option>
                                            <option value="morning">Morning (8:00 - 12:00)</option>
                                            <option value="afternoon">Afternoon (12:00 - 16:00)</option>
                                            <option value="evening">Evening (16:00 - 20:00)</option>
                                            <option value="anytime">Anytime</option>
                                        </select>
                                    </div>
                                    
                                </div>
                            )}
                            
                            {/* Step 3: Item Selection */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-600 mb-4">
                                        Select the items you need to move.
                                    </p>
                                    
                                    <div className="space-y-6">
                                        {/* Add 'Box/Bag' to the first category if not present */}
                                        {itemCategories.map((category, index) => (
                                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                                <h3 className="text-md font-medium text-gray-800 mb-3">{category.name}</h3>
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                    {[...category.items, ...(index === 0 && !category.items.some(i => i.id === 'box-bag') ? [{ id: 'box-bag', name: 'Box/Bag' }] : [])].map((item, itemIndex) => {
                                                        const itemKey = item.id;
                                                        const points = getItemPoints(itemKey);
                                                        const quantity = itemQuantities[itemKey] || 0;
                                                        const itemValue = points * quantity * 1;
                                                        return (
                                                            <div key={itemIndex} className="flex items-center justify-between py-3 px-3 bg-gray-50 rounded-md">
                                                                <div className="flex-1">
                                                                    <div className="text-sm text-gray-700">{item.name}</div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {quantity > 0 && (
                                                                            <span className="ml-2 text-orange-600 font-medium">
                                                                                ({quantity}x = €{itemValue.toFixed(2)})
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center space-x-2 ml-4">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => decrementItem(itemKey)}
                                                                        className={`w-8 h-8 flex items-center justify-center rounded-full border ${quantity > 0 ? 'border-orange-500 text-orange-500 hover:bg-orange-50' : 'border-gray-300 text-gray-300 cursor-not-allowed'}`}
                                                                        disabled={quantity === 0}
                                                                    >
                                                                        <FaMinus className="h-3 w-3" />
                                                                    </button>
                                                                    <span className="text-sm w-6 text-center">{quantity}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => incrementItem(itemKey)}
                                                                        className="w-8 h-8 flex items-center justify-center rounded-full border border-orange-500 text-orange-500 hover:bg-orange-50"
                                                                    >
                                                                        <FaPlus className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Extra Information field */}
                                    <div className="mt-6">
                                        <label htmlFor="extra-info" className="block text-sm font-medium text-gray-700">
                                            Extra Information
                                        </label>
                                        <textarea
                                            id="extra-info"
                                            value={customItem}
                                            onChange={(e) => setCustomItem(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                            rows={3}
                                            placeholder="e.g., Fragile items, special handling requirements, additional items you could not find in our list"
                                        />
                                    </div>
                                    {/* Upload photo/video option */}
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload photo(s) of your items</label>
                                        <input type="file" accept="image/*,video/*" multiple className="block w-full text-sm text-gray-500" />
                                    </div>
                                </div>
                            )}
                            
                            {/* Step 4: Add-ons */}
                            {step === 4 && (
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-600 mb-4">
                                        Select any additional services you need for your move.
                                    </p>
                                    
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="text-md font-medium text-gray-800 mb-3">Disassembly & Reassembly</h3>
                                        <div className="flex items-center mb-4">
                                            <input
                                                id="disassembly-service"
                                                type="checkbox"
                                                checked={disassembly}
                                                onChange={(e) => setDisassembly(e.target.checked)}
                                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="disassembly-service" className="ml-2 block text-sm text-gray-700">
                                                Do you need our help with assembly/ disassembly of some Items?
                                            </label>
                                        </div>
                                        
                                        {disassembly && (
                                            <div className="ml-6 space-y-3">
                                                <p className="text-sm text-gray-600">
                                                    Select which items need disassembly/reassembly:
                                                </p>
                                                {/* Select All checkbox */}
                                                <div className="flex items-center mb-2">
                                                    <input
                                                        id="select-all-assembly"
                                                        type="checkbox"
                                                        checked={selectAllAssembly}
                                                        onChange={(e) => handleSelectAllAssembly(e.target.checked)}
                                                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor="select-all-assembly" className="ml-2 block text-sm font-medium text-gray-700">
                                                        Select All
                                                    </label>
                                                </div>
                                                {Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0).map((itemId: string, index: number) => {
                                                    const quantity: number = itemQuantities[itemId];
                                                    const itemData = itemCategories.flatMap(category => category.items).find(item => item.id === itemId);
                                                    const itemName = itemData ? itemData.name : itemId;
                                                    return (
                                                        <div key={index} className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <input
                                                                    id={`disassembly-${itemId}`}
                                                                    type="checkbox"
                                                                    checked={disassemblyItems[itemId] || false}
                                                                    onChange={(e) => setDisassemblyItems({
                                                                        ...disassemblyItems,
                                                                        [itemId]: e.target.checked
                                                                    })}
                                                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                                />
                                                                <label htmlFor={`disassembly-${itemId}`} className="ml-2 block text-sm text-gray-700">
                                                                    {itemName} ({quantity}x)
                                                                </label>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="text-md font-medium text-gray-800 mb-3">Extra Helper</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Add an extra helper for heavy or numerous items
                                        </p>
                                        <div className="flex items-center mb-4">
                                            <input
                                                id="extra-helper"
                                                type="checkbox"
                                                checked={extraHelper}
                                                onChange={(e) => setExtraHelper(e.target.checked)}
                                                disabled={Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0).length === 0}
                                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded disabled:opacity-50"
                                            />
                                            <label htmlFor="extra-helper" className="ml-2 block text-sm text-gray-700">
                                                Do you require an extra helper in addition to our 1-helper standard package?
                                            </label>
                                        </div>
                                        
                                    </div>
                                    
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="text-md font-medium text-gray-800 mb-3">Carrying Service</h3>
                                        <div className="flex items-center mb-4">
                                            <input
                                                id="carrying-service"
                                                type="checkbox"
                                                checked={carryingService}
                                                onChange={(e) => setCarryingService(e.target.checked)}
                                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="carrying-service" className="ml-2 block text-sm text-gray-700">
                                                Do you need our help with carrying items up or downstairs?
                                            </label>
                                        </div>
                                        
                                        {carryingService && (
                                            <div className="ml-6 space-y-3">
                                                <p className="text-sm text-gray-600">
                                                    Select which items need help with carrying:
                                                </p>
                                                {/* Select All checkbox */}
                                                <div className="flex items-center mb-2">
                                                    <input
                                                        id="select-all-carrying"
                                                        type="checkbox"
                                                        checked={selectAllCarrying}
                                                        onChange={(e) => handleSelectAllCarrying(e.target.checked)}
                                                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor="select-all-carrying" className="ml-2 block text-sm font-medium text-gray-700">
                                                        Select All
                                                    </label>
                                                </div>
                                                {Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0).map((itemId: string, index: number) => {
                                                    const quantity: number = itemQuantities[itemId];
                                                    const itemData = itemCategories.flatMap(category => category.items).find(item => item.id === itemId);
                                                    const itemName = itemData ? itemData.name : itemId;
                                                    return (
                                                        <div key={index} className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <input
                                                                    id={`carrying-service-${itemId}`}
                                                                    type="checkbox"
                                                                    checked={carryingServiceItems[itemId] || false}
                                                                    onChange={e => setCarryingServiceItems({ ...carryingServiceItems, [itemId]: e.target.checked })}
                                                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                                />
                                                                <label htmlFor={`carrying-service-${itemId}`} className="ml-2 block text-sm text-gray-700">
                                                                    {itemName} ({quantity}x)
                                                                </label>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="text-md font-medium text-gray-800 mb-3">Student Discount</h3>
                                        <div className="flex items-center mb-4">
                                            <input
                                                id="student-discount"
                                                type="checkbox"
                                                checked={isStudent}
                                                onChange={(e) => setIsStudent(e.target.checked)}
                                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="student-discount" className="ml-2 block text-sm text-gray-700">
                                                I am a student (10% discount with valid ID)
                                            </label>
                                        </div>
                                        
                                        {isStudent && (
                                            <div className="ml-6 space-y-3">
                                                <p className="text-sm text-gray-600">
                                                    Please upload a photo of your student ID (required for discount)
                                                </p>
                                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                                    <div className="space-y-1 text-center">
                                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        <div className="flex text-sm text-gray-600">
                                                            <label htmlFor="student-id-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500">
                                                                <span>Upload a file</span>
                                                                <input id="student-id-upload" name="student-id-upload" type="file" className="sr-only" onChange={handleStudentIdUpload} />
                                                            </label>
                                                            <p className="pl-1">or drag and drop</p>
                                                        </div>
                                                        <p className="text-xs text-gray-500">
                                                            PNG, JPG, GIF up to 10MB
                                                        </p>
                                                        {studentId && (
                                                            <p className="text-sm text-green-600">
                                                                ID uploaded: {studentId.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* Step 5: Contact Information */}
                            {step === 5 && (
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-600 mb-4">
                                        Please provide your contact information.
                                    </p>
                                    
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                                First Name
                                            </label>
                                            <input
                                                type="text"
                                                id="firstName"
                                                value={contactInfo.firstName}
                                                onChange={handleContactInfoChange}
                                                className="mt-1 focus:ring-orange-500 focus:border-orange-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                                Last Name
                                            </label>
                                            <input
                                                type="text"
                                                id="lastName"
                                                value={contactInfo.lastName}
                                                onChange={handleContactInfoChange}
                                                className="mt-1 focus:ring-orange-500 focus:border-orange-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                value={contactInfo.email}
                                                onChange={handleContactInfoChange}
                                                className="mt-1 focus:ring-orange-500 focus:border-orange-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                                Phone Number
                                            </label>
                                            <PhoneNumberInput
                                                value={contactInfo.phone}
                                                onChange={handlePhoneChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Store Proof Photo Upload - Only show if pickup type is store */}
                                    {pickupType === 'store' && (
                                        <div className="mt-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Proof of Purchase/Ownership *
                                            </label>
                                            <p className="text-sm text-gray-600 mb-3">
                                                Please upload a photo of your receipt, invoice, or proof of ownership for the items from the store.
                                            </p>
                                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                                <div className="space-y-1 text-center">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    <div className="flex text-sm text-gray-600">
                                                        <label htmlFor="store-proof-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500">
                                                            <span>Upload a file</span>
                                                            <input id="store-proof-upload" name="store-proof-upload" type="file" className="sr-only" onChange={handleStoreProofUpload} accept="image/*" />
                                                        </label>
                                                        <p className="pl-1">or drag and drop</p>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        PNG, JPG, GIF up to 10MB
                                                    </p>
                                                    {storeProofPhoto && (
                                                        <p className="text-sm text-green-600">
                                                            Proof uploaded: {storeProofPhoto.name}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4">
                                        <div className="flex items-center">
                                            <input
                                                id="agree-terms"
                                                type="checkbox"
                                                checked={agreedToTerms}
                                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                required
                                            />
                                            <label htmlFor="agree-terms" className="ml-2 text-sm text-gray-700">
                                                I agree to the <a href="/terms" target="_blank" className="text-orange-600 hover:text-orange-500">Terms and Conditions</a> and <a href="/privacy" target="_blank" className="text-orange-600 hover:text-orange-500">Privacy Policy</a>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Step 6: Order Summary */}
                            {step === 6 && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-medium text-gray-900">Order Summary</h3>
                                    
                                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                        <h4 className="text-md font-medium text-gray-800 mb-3">Pickup & Delivery Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">Pickup Address:</p>
                                                <p className="font-medium">{firstLocation}</p>
                                                <p className="text-gray-500 mt-1">Floor: {floorPickup || '0'} {elevatorPickup ? '(Elevator Available)' : ''}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Delivery Address:</p>
                                                <p className="font-medium">{secondLocation}</p>
                                                <p className="text-gray-500 mt-1">Floor: {floorDropoff || '0'} {elevatorDropoff ? '(Elevator Available)' : ''}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                        <h4 className="text-md font-medium text-gray-800 mb-3">Schedule</h4>
                                        <div className="text-sm">
                                            {dateOption === 'rehome' || isDateFlexible ? (
                                                <p><span className="text-gray-500">Date:</span> <span className="font-medium">
                                                    {dateOption === 'rehome' ? 'Let ReHome Choose' : 'Flexible'}
                                                </span></p>
                                            ) : (
                                                <p><span className="text-gray-500">Date:</span> <span className="font-medium">
                            {dateOption === 'fixed' && pickupDate && dropoffDate ? 
                             `Pickup: ${new Date(pickupDate).toLocaleDateString()}, Dropoff: ${new Date(dropoffDate).toLocaleDateString()}` :
                             dateOption === 'flexible' && selectedDateRange.start && selectedDateRange.end ?
                             `${new Date(selectedDateRange.start).toLocaleDateString()} - ${new Date(selectedDateRange.end).toLocaleDateString()}` :
                             'Date not selected'}
                        </span></p>
                                            )}
                                            {preferredTimeSpan && (
                                                <p className="mt-1"><span className="text-gray-500">Time:</span> <span className="font-medium">
                                                    {preferredTimeSpan === 'morning' ? 'Morning (8:00 - 12:00)' : 
                                                     preferredTimeSpan === 'afternoon' ? 'Afternoon (12:00 - 16:00)' : 
                                                     preferredTimeSpan === 'evening' ? 'Evening (16:00 - 20:00)' : 'Anytime'}
                                                </span></p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                        <h4 className="text-md font-medium text-gray-800 mb-3">Items</h4>
                                        <ul className="space-y-2 text-sm">
                                            {Object.keys(itemQuantities).map((itemId, index) => {
                                                const quantity = itemQuantities[itemId];
                                                const itemData = itemCategories
                                                    .flatMap(category => category.items)
                                                    .find(item => item.id === itemId);
                                                const itemName = itemData ? itemData.name : itemId;
                                                
                                                return (
                                                    <li key={index} className="flex justify-between">
                                                        <span className="text-gray-600">
                                                            {itemName}
                                                            {extraHelperItems[itemId] && <span className="ml-1 text-orange-600">(Extra Helper)</span>}
                                                        </span>
                                                        <span className="font-medium">x{quantity}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                        <h4 className="text-md font-medium text-gray-800 mb-3">Additional Services</h4>
                                        <ul className="space-y-2 text-sm">
                                            {pricingBreakdown?.assemblyCost && pricingBreakdown.assemblyCost > 0 && (
                                                <li className="flex justify-between">
                                                    <span>Assembly & Disassembly</span>
                                                    <span className="font-medium">€{pricingBreakdown.assemblyCost.toFixed(2)}</span>
                                                </li>
                                            )}
                                            {pricingBreakdown?.extraHelperCost && pricingBreakdown.extraHelperCost > 0 && (
                                                <li className="flex justify-between">
                                                    <span>Extra Helper</span>
                                                    <span className="font-medium">€{pricingBreakdown.extraHelperCost.toFixed(2)}</span>
                                                </li>
                                            )}
                                            <li className="flex justify-between">
                                                <span>Carrying Service</span>
                                                <span className="font-medium">{carryingService ? "Yes" : "No"}</span>
                                            </li>
                                            {carryingService && pricingBreakdown?.carryingCost && pricingBreakdown.carryingCost > 0 && (
                                                <li className="flex justify-between">
                                                    <span>Floor Carrying Cost</span>
                                                    <span className="font-medium">€{pricingBreakdown.carryingCost.toFixed(2)}</span>
                                                </li>
                                            )}
                                            {pricingBreakdown?.studentDiscount && pricingBreakdown.studentDiscount > 0 && (
                                                <li className="flex justify-between text-green-600">
                                                    <span>Student Discount (10%)</span>
                                                    <span className="font-medium">-€{pricingBreakdown.studentDiscount.toFixed(2)}</span>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                        <h4 className="text-md font-medium text-gray-800 mb-3">Contact Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">Name:</p>
                                                <p className="font-medium">{contactInfo.firstName} {contactInfo.lastName}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Email:</p>
                                                <p className="font-medium">{contactInfo.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Phone:</p>
                                                <p className="font-medium">{contactInfo.phone}</p>
                                            </div>
                                            {pickupType === 'store' && (
                                                <div>
                                                    <p className="text-gray-500">Store Proof:</p>
                                                    <p className="font-medium">{storeProofPhoto ? storeProofPhoto.name : 'Not uploaded'}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-lg font-bold text-gray-900">Total Price:</h4>
                                            <p className="text-xl font-bold text-orange-600">
                                                €{(pricingBreakdown?.total || 0).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                            
                                    {/* Extra Information Field */}
                                    <div className="mt-6">
                                        <label htmlFor="extra-instructions" className="block text-sm font-medium text-gray-700 mb-2">
                                            Extra Information/ Instructions for our Team
                                        </label>
                                        <textarea
                                            id="extra-instructions"
                                            value={extraInstructions}
                                            onChange={(e) => setExtraInstructions(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-3 border"
                                            rows={5}
                                            placeholder="E.g., parking opportunities for the driver, instructions on how to access the building/ room"
                                            />
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex justify-between mt-8">
                                {step > 1 && (
                                    <button 
                                        type="button"
                                        onClick={prevStep}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                                    >
                                        <FaArrowLeft className="mr-2 -ml-1 h-5 w-5" /> Previous
                                    </button>
                                )}
                                <div>
                                    {step < 6 ? (
                                        <button 
                                            type="button"
                                            onClick={nextStep}
                                            disabled={step === 1 && !pickupType}
                                            className={`inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                                                step === 1 && !pickupType ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'
                                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500`}
                                        >
                                            Next <FaArrowRight className="ml-2 -mr-1 h-5 w-5" />
                                        </button>
                                    ) : (
                                        <button 
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={!isFormValid()}
                                            className={`inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${isFormValid() ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                                        >
                                            {paymentLoading ? (
                                                <>
                                                    <span className="animate-pulse">Processing...</span>
                                                    <svg className="animate-spin ml-2 -mr-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                </>
                                            ) : (
                                                <>Submit Request</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Pricing Display - Right 1/3 */}
                    <div className="md:col-span-1">
                        <PriceSummary 
                            pricingBreakdown={pricingBreakdown}
                        />
                    </div>
                </div>
            </div>
            
            {/* Order Confirmation Modal */}
            <OrderConfirmationModal
                isOpen={showConfirmationModal}
                onClose={() => setShowConfirmationModal(false)}
                orderNumber=""
                isReHomeOrder={false}
                isMovingRequest={true}
            />

            {/* Booking Tips Modal */}
            <BookingTipsModal
                isOpen={showBookingTips}
                onContinue={handleContinueFromTips}
                serviceType="item-transport"
            />

            {/* Point Limit Modal */}
            {showPointLimitModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
                                <FaHome className="h-6 w-6 text-orange-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Large Move Detected
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Your move exceeds the 20-point limit for item transport. 
                                For moves of this size, we recommend using our house moving service 
                                which is better suited for larger moves and offers better pricing.
                            </p>
                            <p className="text-sm text-gray-600 mb-6">
                                Your current information will be transferred to the house moving form.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowPointLimitModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPointLimitModal(false);
                                        redirectToHouseMoving();
                                    }}
                                    className="flex-1 px-4 py-2 bg-orange-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-orange-700"
                                >
                                    Continue to House Moving
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItemMovingPage;