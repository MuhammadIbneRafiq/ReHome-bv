import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaMinus, FaPlus, FaInfoCircle, FaToolbox } from "react-icons/fa";
import { Switch } from "@headlessui/react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { itemCategories, furnitureItems, getItemPoints, constantsLoaded } from '../../lib/constants';
import { useTranslation } from 'react-i18next';
import pricingService, { PricingBreakdown, PricingInput } from '../../services/pricingService';
import API_ENDPOINTS from '../api/config';
import { PhoneNumberInput } from '@/components/ui/PhoneNumberInput';
import OrderConfirmationModal from '../../components/marketplace/OrderConfirmationModal';
import BookingTipsModal from '../../components/ui/BookingTipsModal';
import { GooglePlaceObject } from '../../utils/locationServices';

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

interface ItemQuantities {
    [key: string]: number;
}

interface PriceSummaryProps {
    pricingBreakdown: PricingBreakdown | null;
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
  onPlaceSelect?: (place: GooglePlaceObject) => void 
}) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API;

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

  // Debounced search function with caching
  const searchPlaces = useMemo(() => {
    // Create a cache for API responses
    const cache = new Map();
    
    // The actual search function
    const search = async (query: string) => {
      if (query.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      
      // Check cache first
      if (cache.has(query)) {
        setSuggestions(cache.get(query));
        setShowSuggestions(true);
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
          
          if (data.suggestions) {
            const placeSuggestions = data.suggestions
              .filter((suggestion: any) => suggestion.placePrediction)
              .map((suggestion: any) => ({
                text: suggestion.placePrediction.text?.text || 'Unknown address',
                placeId: suggestion.placePrediction.placeId,
                structuredFormat: suggestion.placePrediction.structuredFormat
              }));
              
            // Cache the results
            cache.set(query, placeSuggestions);
            
            setSuggestions(placeSuggestions);
            setShowSuggestions(true);
          }
        } else {
          console.error('Places API error:', response.status, response.statusText);
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
    
    // Return the debounced search function
    return search;
  }, [apiKey]); // Only recreate if API key changes

  const handleSuggestionClick = async (suggestion: any) => {
    onChange(suggestion.text);
    
    if (onPlaceSelect) {
      // Get place details with coordinates
      const placeDetails = await getPlaceDetails(suggestion.placeId);
      const placeWithDetails: GooglePlaceObject = {
        placeId: suggestion.placeId,
        coordinates: placeDetails?.coordinates || undefined,
        formattedAddress: placeDetails?.formattedAddress || undefined,
        displayName: placeDetails?.displayName || undefined,
        text: suggestion.text
      };
      onPlaceSelect(placeWithDetails);
    }
    
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Create a debounced input handler
  const handleInputChange = useMemo(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      
      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Set a new timeout
      timeoutId = setTimeout(() => {
        searchPlaces(newValue);
        timeoutId = null;
      }, 300);
    };
  }, [onChange, searchPlaces]);


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

const HouseMovingPage = () => {
    const { t } = useTranslation();
    const [isDataLoaded, setIsDataLoaded] = useState(constantsLoaded);
    
    // Check if constants are loaded
    useEffect(() => {
        if (!constantsLoaded || furnitureItems.length === 0) {
            const checkLoaded = setInterval(() => {
                if (constantsLoaded && furnitureItems.length > 0) {
                    setIsDataLoaded(true);
                    clearInterval(checkLoaded);
                }
            }, 100);
            return () => clearInterval(checkLoaded);
        } else {
            setIsDataLoaded(true);
        }
    }, []);
    const [step, setStep] = useState(1);
    
    // Check for transferred data from item transport
    useEffect(() => {
        const transferredData = sessionStorage.getItem('itemTransportToHouseMoving');
        if (transferredData) {
            try {
                const data = JSON.parse(transferredData);
                
                // Populate form with transferred data
                if (data.pickupType) setPickupType(data.pickupType);
                if (data.firstLocation) setFirstLocation(data.firstLocation);
                if (data.secondLocation) setSecondLocation(data.secondLocation);
                if (data.floorPickup) setFloorPickup(data.floorPickup);
                if (data.floorDropoff) setFloorDropoff(data.floorDropoff);
                if (data.elevatorPickup !== undefined) setElevatorPickup(data.elevatorPickup);
                if (data.elevatorDropoff !== undefined) setElevatorDropoff(data.elevatorDropoff);
                if (data.selectedDateRange) setSelectedDateRange(data.selectedDateRange);
                if (data.pickupDate) setPickupDate(data.pickupDate);
                if (data.dropoffDate) setDropoffDate(data.dropoffDate);
                if (data.dateOption) setDateOption(data.dateOption);
                if (data.isDateFlexible !== undefined) setIsDateFlexible(data.isDateFlexible);
                if (data.preferredTimeSpan) setPreferredTimeSpan(data.preferredTimeSpan);
                if (data.itemQuantities) setItemQuantities(data.itemQuantities);
                if (data.customItem) setCustomItem(data.customItem);
                if (data.disassembly !== undefined) setDisassembly(data.disassembly);
                if (data.extraHelper !== undefined) setExtraHelper(data.extraHelper);
                if (data.carryingService !== undefined) setCarryingService(data.carryingService);
                if (data.isStudent !== undefined) setIsStudent(data.isStudent);
                if (data.studentId) setStudentId(data.studentId);
                if (data.storeProofPhoto) setStoreProofPhoto(data.storeProofPhoto);
                if (data.disassemblyItems) setDisassemblyItems(data.disassemblyItems);
                if (data.extraHelperItems) setExtraHelperItems(data.extraHelperItems);
                if (data.carryingServiceItems) setCarryingServiceItems(data.carryingServiceItems);
                if (data.pickupPlace) setPickupPlace(data.pickupPlace);
                if (data.dropoffPlace) setDropoffPlace(data.dropoffPlace);
                if (data.distanceKm) setDistanceKm(data.distanceKm);
                if (data.extraInstructions) setExtraInstructions(data.extraInstructions);
                
                // Show success message
                toast.success("Your information has been transferred from item transport. Please review and continue.");
                
                // Clear the transferred data
                sessionStorage.removeItem('itemTransportToHouseMoving');
                
            } catch (error) {
                console.error('Error parsing transferred data:', error);
            }
        }
    }, []);
    const [firstLocation, setFirstLocation] = useState('');
    const [secondLocation, setSecondLocation] = useState('');
    const [floorPickup, setFloorPickup] = useState('');
    const [floorDropoff, setFloorDropoff] = useState('');
    const [pickupType, setPickupType] = useState<'private' | 'store' | null>(null);
    const [disassembly, setDisassembly] = useState(false);
    const [contactInfo, setContactInfo] = useState<ContactInfo>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        isPhoneValid: false
    });
    const [selectedDateRange, setSelectedDateRange] = useState({ start: '', end: '' });
    const [elevatorPickup, setElevatorPickup] = useState(false);
    const [elevatorDropoff, setElevatorDropoff] = useState(false);
    const [extraHelper, setExtraHelper] = useState(false);
    const [carryingService, setCarryingService] = useState(false);
    const [itemQuantities, setItemQuantities] = useState<ItemQuantities>({});
    const [customItem, setCustomItem] = useState('');
    const [isStudent, setIsStudent] = useState(false);
    const [studentId, setStudentId] = useState<File | null>(null);
    const [storeProofPhoto, setStoreProofPhoto] = useState<File | null>(null);
    const [itemPhotos, setItemPhotos] = useState<File[]>([]);
    const [isDateFlexible, setIsDateFlexible] = useState(false);
    const [isFixedDate, setIsFixedDate] = useState(false);
    const [extraHelperItems, setExtraHelperItems] = useState<{[key: string]: boolean}>({});
    const [disassemblyItems, setDisassemblyItems] = useState<{[key: string]: boolean}>({});
    const [preferredTimeSpan, setPreferredTimeSpan] = useState('');
    const [paymentLoading] = useState(false);
    const [pricingBreakdown, setPricingBreakdown] = useState<PricingBreakdown | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
    const [showBookingTips, setShowBookingTips] = useState(false);
    const [pickupPlace, setPickupPlace] = useState<GooglePlaceObject | null>(null);
    const [dropoffPlace, setDropoffPlace] = useState<GooglePlaceObject | null>(null);
    const [distanceKm, setDistanceKm] = useState<number | null>(null);
    const [dateOption, setDateOption] = useState<'flexible' | 'fixed' | 'rehome'>('fixed');
    const [pickupDate, setPickupDate] = useState('');
    const [dropoffDate, setDropoffDate] = useState('');
    // 1. Add state for carryingServiceItems
    const [carryingServiceItems, setCarryingServiceItems] = useState<{ [key: string]: boolean }>({});
    // Add state for select all functionality and extra instructions
    const [selectAllAssembly, setSelectAllAssembly] = useState(false);
    const [selectAllCarrying, setSelectAllCarrying] = useState(false);
    const [extraInstructions, setExtraInstructions] = useState('');

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
                    resolve(distanceKm);
                } else {
                    console.warn('⚠️ Distance Matrix API failed, falling back to straight-line calculation');
                }
            });
        });
    };

    const handleStudentIdUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];
        setStudentId(file || null);
    };

    const handleStoreProofUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setStoreProofPhoto(file || null);
    };

    const handleItemPhotosUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const fileArray = Array.from(files);
            setItemPhotos(prev => [...prev, ...fileArray]);
        }
    };

    const removeItemPhoto = (index: number) => {
        setItemPhotos(prev => prev.filter((_, i) => i !== index));
    };

    // Guard against stale async pricing responses
    const latestRequestIdRef = React.useRef(0);

    const calculatePrice = async () => {
        const requestId = ++latestRequestIdRef.current;
        if (!firstLocation || !secondLocation) {
            if (requestId === latestRequestIdRef.current) {
                setPricingBreakdown(null);
            }
            return;
        }

        try {
            // Calculate distance if we have coordinates from Google Places
            let calculatedDistance = 0;
            if (pickupPlace?.coordinates && dropoffPlace?.coordinates) {
                calculatedDistance = await calculateDistance(pickupPlace, dropoffPlace);
                if (requestId === latestRequestIdRef.current) {
                    setDistanceKm(calculatedDistance);
                }
            }

            // For "Let ReHome choose" option, provide a 3-week window starting tomorrow
            let selectedDateForPricing = selectedDateRange.start;
            if (dateOption === 'rehome') {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                selectedDateForPricing = tomorrow.toISOString().split('T')[0];
            }

            const input: PricingInput = {
                serviceType: 'house-moving',
                pickupLocation: firstLocation,
                dropoffLocation: secondLocation,
                distanceKm: calculatedDistance, // Use calculated distance
                selectedDate: selectedDateForPricing,
                selectedDateRange: dateOption === 'flexible' ? selectedDateRange : { start: '', end: '' }, // Only pass date range for flexible dates
                isDateFlexible: dateOption === 'rehome', // Only true for ReHome choose option
                itemQuantities: itemQuantities,
                floorPickup: carryingService ? (parseInt(floorPickup) || 0) : 0,
                floorDropoff: carryingService ? (parseInt(floorDropoff) || 0) : 0,
                elevatorPickup,
                elevatorDropoff,
                assemblyItems: disassemblyItems,
                extraHelperItems,
                carryingServiceItems, // Add carrying service items
                isStudent,
                hasStudentId: !!studentId,
                isEarlyBooking: false, // This would be determined by checking calendar availability
                pickupPlace: pickupPlace, // Pass the place object for pickup
                dropoffPlace: dropoffPlace // Pass the place object for dropoff
            };

            // Use async pricing calculation
            const result = await pricingService.calculatePricing(input);
            if (requestId === latestRequestIdRef.current) {
                setPricingBreakdown(result);
            }
            
            // Update distance state from pricing service result if we didn't calculate distance
            if (!calculatedDistance && result?.breakdown?.distance?.distanceKm) {
                if (requestId === latestRequestIdRef.current) {
                    setDistanceKm(result.breakdown.distance.distanceKm);
                }
            }
        } catch (error) {
            if (requestId === latestRequestIdRef.current) {
                setPricingBreakdown(null);
            }
        }
    };

    // Debounced price calculation to avoid excessive API calls while typing
    useEffect(() => {
        // Skip calculation if locations are not set
        if (!firstLocation || !secondLocation || 
            firstLocation.trim().length <= 3 || secondLocation.trim().length <= 3) {
            setPricingBreakdown(null);
            return;
        }
        
        // Increment the request ID to prevent race conditions
        ++latestRequestIdRef.current;
        
        const debounceTimer = setTimeout(() => {
            calculatePrice();
        }, 400); // 400ms debounce - faster pricing updates

        return () => clearTimeout(debounceTimer);
    }, [firstLocation, secondLocation, selectedDateRange.start, selectedDateRange.end, isDateFlexible, dateOption, isFixedDate]);

    // Create a memoized pricing input object to reduce unnecessary recalculations
    const pricingInputDependencies = useMemo(() => {
        return {
            itemQuantities,
            floorPickup: parseInt(floorPickup) || 0,
            floorDropoff: parseInt(floorDropoff) || 0,
            disassembly,
            extraHelper,
            carryingService,
            elevatorPickup,
            elevatorDropoff,
            disassemblyItems,
            extraHelperItems,
            carryingServiceItems,
            isStudent,
            hasStudentId: !!studentId
        };
    }, [itemQuantities, floorPickup, floorDropoff, disassembly, extraHelper, carryingService, 
        elevatorPickup, elevatorDropoff, disassemblyItems, extraHelperItems, carryingServiceItems, 
        isStudent, studentId]);
    
    // Immediate price calculation for non-location changes and when places with coordinates change
    useEffect(() => {
        if (firstLocation && secondLocation) {
            calculatePrice();
        }
    }, [pricingInputDependencies, pickupPlace, dropoffPlace]);

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

    const nextStep = () => {
        // Show booking tips after step 1 (locations)
        if (step === 1) {
            setShowBookingTips(true);
            return;
        }

        // Validate date selection in step 4
        if (step === 4 && !isDateFlexible && (!selectedDateRange.start || !selectedDateRange.end)) {
            toast.error("Please select a date or indicate that your date is flexible.");
            return;
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
            // Updated phone validation regex
            const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 international format
            if (!phoneRegex.test(contactInfo.phone)) {
                toast.error("Please enter a valid phone number.");
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

    // Memoize the item increment/decrement functions for better performance
    const incrementItem = useCallback((itemId: string) => {
        setItemQuantities(prevQuantities => ({
            ...prevQuantities,
            [itemId]: (prevQuantities[itemId] || 0) + 1,
        }));
    }, []);

    const decrementItem = useCallback((itemId: string) => {
        setItemQuantities(prevQuantities => {
            const newQuantity = (prevQuantities[itemId] || 0) - 1;
            if (newQuantity <= 0) {
                const { [itemId]: _, ...rest } = prevQuantities;
                return rest;
            }
            return { ...prevQuantities, [itemId]: newQuantity };
        });
    }, []);

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
        if (!isDateFlexible && (!selectedDateRange.start || !selectedDateRange.end)) return false;
        if (!contactInfo.firstName.trim() || !contactInfo.lastName.trim() || 
            !contactInfo.email.trim() || !contactInfo.phone.trim()) return false;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactInfo.email)) return false;
        
        const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 international format
        if (!phoneRegex.test(contactInfo.phone)) return false;
        
        // Validate store proof photo if pickup type is store
        if (pickupType === 'store' && !storeProofPhoto) return false;
        
        // Check if terms and conditions are agreed to
        if (!agreedToTerms) return false;
        
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
                value: getItemPoints(itemId) * quantity * 2 // €2 per point for house moving
            }));

        // Calculate total item points
        const totalItemPoints = Object.entries(itemQuantities)
            .filter(([_, quantity]) => quantity > 0)
            .reduce((total, [itemId, quantity]) => total + (getItemPoints(itemId) * quantity), 0);

        // Use already calculated distance from state of the GOOGLE DISTANCE MATRIX ONLYYYY
        const finalDistance = distanceKm;

        // Prepare payload in the format expected by backend
        const payload = {
            pickupType: pickupType || 'house',
            furnitureItems,
            customItem,
            floorPickup: parseInt(floorPickup) || 0,
            floorDropoff: parseInt(floorDropoff) || 0,
            contactInfo,
            estimatedPrice: pricingBreakdown?.total || 0,
            selectedDateRange,
            isDateFlexible,
            pickupDate: dateOption === 'fixed' ? pickupDate : undefined,
            dropoffDate: dateOption === 'fixed' ? dropoffDate : undefined,
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
                    date: isDateFlexible ? 'Flexible' : new Date(selectedDateRange.start).toLocaleDateString(),
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
            // Create FormData for file uploads
            const formData = new FormData();
            
            // Add all the JSON data as a string
            formData.append('data', JSON.stringify(payload));
            
            // Add photos if any
            if (itemPhotos.length > 0) {
                itemPhotos.forEach((photo) => {
                    formData.append('photos', photo);
                });
            }
            
            // Submit the house moving request with FormData
            const response = await fetch(API_ENDPOINTS.MOVING.HOUSE_REQUEST, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) { 
                const errorData = await response.json();
                throw new Error(`Error: ${errorData.message || 'Network response was not ok'}`);
            }

            // Show confirmation modal instead of toast
            setShowOrderConfirmation(true);
        } catch (error) {
            console.error("Error submitting house moving request:", error);
            toast.error("An error occurred while submitting your request.");
        }
    };
    // Add a real-time pricing display component that will be shown throughout the process
    const PriceSummary: React.FC<PriceSummaryProps> = ({ pricingBreakdown }) => {
        // Step 1: Don't show any pricing estimate yet - only after locations AND date
        if (step === 1) {
            return (
                <div className="bg-white p-4 rounded-lg shadow-md sticky top-24">
                    <h3 className="font-semibold text-lg mb-3">Your Price Estimate</h3>
                    <p className="text-gray-500">Complete location details to continue</p>
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
        const hasValidBasePricing = pricingBreakdown.basePrice > 0 && firstLocation && secondLocation && (isDateFlexible || selectedDateRange.start);
        
        if (!hasValidBasePricing) {
            return (
                <div className="bg-white p-4 rounded-lg shadow-md sticky top-24">
                    <h3 className="font-semibold text-lg mb-3">Your Price Estimate</h3>
                    <p className="text-gray-500">
                        {!firstLocation || !secondLocation ? "Enter both pickup and dropoff locations" : 
                         !isDateFlexible && !selectedDateRange.start ? "Select a date to see base pricing" : 
                         "Calculating pricing..."}
                    </p>
                </div>
            );
        }
        
        return (
            <div className="bg-white p-4 rounded-lg shadow-md sticky top-24">
                <h3 className="font-semibold text-lg mb-3">Your Price Estimate</h3>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span>Base Price:</span>
                        <span>€{pricingBreakdown.basePrice.toFixed(2)}</span>
                    </div>
                    {pricingBreakdown.breakdown.baseCharge.city && (
                        <div className="text-xs text-gray-500 ml-4">
                            {pricingBreakdown.breakdown.baseCharge.type}
                        </div>
                    )}
                    {/* Items Section - Show detailed breakdown */}
                    <div className="border-t pt-3">
                        <div className="flex justify-between font-medium">
                            <span>Items:</span>
                            <span>€{pricingBreakdown.itemValue.toFixed(2)}</span>
                        </div>
                        {Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0).length > 0 && (
                            <div className="mt-2 space-y-1">
                                {Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0).map((itemId, index) => {
                                    const quantity = itemQuantities[itemId];
                                    const itemData = furnitureItems.find(item => item.id === itemId);                 
                                    const itemName = itemData ? itemData.name : itemId;
                                    
                                    return (
                                        <div key={index} className="flex justify-between text-xs text-gray-600 ml-4">
                                            <span>{itemName} ({quantity}x)</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0).length === 0 && (
                            <div className="text-xs text-gray-500 ml-4">No items selected</div>
                        )}
                    </div>
                    {pricingBreakdown.distanceCost > 0 && (
                        <div className="flex justify-between">
                            <span>Distance ({pricingBreakdown.breakdown.distance.distanceKm.toFixed(1)}km):</span>
                            <span>€{pricingBreakdown.distanceCost.toFixed(2)}</span>
                        </div>
                    )}
                    {pricingBreakdown.distanceCost === 0 && pricingBreakdown.breakdown.distance.distanceKm > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Distance ({pricingBreakdown.breakdown.distance.distanceKm.toFixed(1)}km):</span>
                            <span>Free</span>
                        </div>
                    )}
                    {pricingBreakdown.carryingCost > 0 && (
                        <div className="flex justify-between">
                            <span>
                                Carrying:
                            </span>
                            <span>€{pricingBreakdown.carryingCost.toFixed(2)}</span>
                        </div>
                    )}
                    {/* Elevator discount explanation */}
                    {pricingBreakdown.carryingCost > 0 && ((elevatorPickup && parseInt(floorPickup) > 1) || (elevatorDropoff && parseInt(floorDropoff) > 1)) && (
                        <div className="text-xs text-green-700 ml-6">
                            <span>Elevator discount applied.</span>
                        </div>
                    )}
                    {pricingBreakdown.assemblyCost > 0 && (
                        <div className="flex justify-between">
                            <span>Assembly:</span>
                            <span>€{pricingBreakdown.assemblyCost.toFixed(2)}</span>
                        </div>
                    )}
                    {pricingBreakdown.extraHelperCost > 0 && (
                        <div className="flex justify-between">
                            <span>Extra Helper:</span>
                            <span>€{pricingBreakdown.extraHelperCost.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-semibold">
                            <span>Subtotal:</span>
                            <span>€{pricingBreakdown.subtotal.toFixed(2)}</span>
                        </div>
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
                        <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                            <span>Total:</span>
                            <span>€{pricingBreakdown.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };



    // Show loading state if data isn't ready
    if (!isDataLoaded) {
        return (
            <div className="min-h-screen bg-orange-50 pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
                    <p className="text-lg text-gray-600">Loading furniture data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-orange-50 pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('houseMoving.title')}</h1>
                <p className="text-lg text-gray-600 mb-6">{t('houseMoving.subtitle')}</p>
                
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
                                            {s === 1 && 'Location'}
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

                            {/* Step 1: Locations */}
                            {step === 1 && (
                                <div className="space-y-6">
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
                                        {/* Floor and elevator toggles remain unchanged */}
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
                                            <div className="flex items-center">
                                                <Switch
                                                    checked={elevatorPickup}
                                                    onChange={setElevatorPickup}
                                                    className={`${elevatorPickup ? 'bg-orange-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2`}
                                                >
                                                    <span
                                                        style={{
                                                            transform: (elevatorPickup) ? 'translateX(24px)' : 'translateX(4px)',
                                                            transition: 'transform 0.2s'
                                                        }}
                                                        className="inline-block h-4 w-4 rounded-full bg-white"
                                                    />
                                                </Switch>
                                                <span className="ml-2 text-sm text-gray-700">Elevator available at pickup location</span>
                                            </div>
                                        </div>
                                    </div>
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
                                        {/* Floor and elevator toggles remain unchanged */}
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
                                            <div className="flex items-center">
                                                <Switch
                                                    checked={elevatorDropoff}
                                                    onChange={setElevatorDropoff}
                                                    className={`${elevatorDropoff ? 'bg-orange-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2`}
                                                >
                                                    <span
                                                        style={{
                                                            transform: (elevatorDropoff) ? 'translateX(24px)' : 'translateX(4px)',
                                                            transition: 'transform 0.2s'
                                                        }}
                                                        className="inline-block h-4 w-4 rounded-full bg-white"
                                                    />
                                                </Switch>
                                                <span className="ml-2 text-sm text-gray-700">Elevator available at dropoff location</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                            
                                </div>
                            )}


                        
                            {/* Step 2: Date & Time Selection */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="date-option" className="block text-sm font-medium text-gray-700 mb-1">Date Option</label>
                                        <select
                                            id="date-option"
                                            value={dateOption}
                                            onChange={e => {
                                                const newDateOption = e.target.value as 'flexible' | 'fixed' | 'rehome';
                                                
                                                // Use a single state update function to batch all changes
                                                const updateStates = () => {
                                                    setDateOption(newDateOption);
                                                    
                                                    // Clear all date-related states first
                                                    setSelectedDateRange({ start: '', end: '' });
                                                    
                                                    // Set appropriate states based on option
                                                    if (newDateOption === 'rehome') {
                                                        // ReHome choose: isDateFlexible=true, no dates set
                                                        setIsDateFlexible(true);
                                                        setIsFixedDate(false);
                                                    } else if (newDateOption === 'flexible') {
                                                        // Flexible range: isDateFlexible=false, user will set date range
                                                        setIsDateFlexible(false);
                                                        setIsFixedDate(false);
                                                    } else if (newDateOption === 'fixed') {
                                                        // Fixed date: isDateFlexible=false, user will set single date
                                                        setIsDateFlexible(false);
                                                        setIsFixedDate(true);
                                                    }
                                                    
                                                    // Increment request ID to ensure fresh calculation
                                                    latestRequestIdRef.current++;
                                                };
                                                
                                                // Execute all state updates at once
                                                updateStates();
                                                
                                                // No need for setTimeout - React will batch these updates
                                                // and the useEffect will trigger calculatePrice when needed
                                            }}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                        >
                                            <option value="flexible">Flexible date range</option>
                                            <option value="fixed">Fixed date</option>
                                            <option value="rehome">Let ReHome choose</option>
                                        </select>
                                    </div>
                                    {dateOption === 'flexible' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                                <input
                                                    type="date"
                                                    value={selectedDateRange.start}
                                                    onChange={e => setSelectedDateRange(r => ({ ...r, start: e.target.value }))}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                                    min={new Date().toISOString().split('T')[0]}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                                <input
                                                    type="date"
                                                    value={selectedDateRange.end}
                                                    onChange={e => setSelectedDateRange(r => ({ ...r, end: e.target.value }))}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                                    min={selectedDateRange.start || new Date().toISOString().split('T')[0]}
                                                    required
                                                />
                                            </div>
                                        </>
                                    )}
                                    {dateOption === 'fixed' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                            <input
                                                type="date"
                                                value={selectedDateRange.start}
                                                onChange={e => setSelectedDateRange(r => ({ ...r, start: e.target.value, end: e.target.value }))}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                                min={new Date().toISOString().split('T')[0]}
                                                required
                                            />
                                        </div>
                                    )}
                                    {dateOption === 'rehome' && (
                                        <div className="p-3 bg-blue-50 rounded text-blue-700 text-sm">
                                            ReHome will suggest the most efficient and cost-effective moving date for you.
                                        </div>
                                    )}
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Preferred Time Span
                                        </label>
                                        <select
                                            value={preferredTimeSpan}
                                            onChange={(e) => setPreferredTimeSpan(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                        >
                                            <option value="">Select preferred time...</option>
                                            <option value="morning">Morning (8:00 - 12:00)</option>
                                            <option value="afternoon">Afternoon (12:00 - 16:00)</option>
                                            <option value="evening">Evening (16:00 - 20:00)</option>
                                            <option value="flexible">Flexible (Any time)</option>
                                        </select>
                                    </div>
                                
                                </div>
                            )}
                            
                            {step === 3 && (
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-600 mb-4">
                                        Select the items you need to move. This helps us estimate the size of vehicle and resources needed.
                                    </p>
                                    
                                    {itemCategories.map((category) => (
                                        <div key={category.name} className="mb-6">
                                            <h3 className="text-lg font-medium text-gray-900 mb-3">{category.name}</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {furnitureItems.filter(item => item.category === category.name).map((item) => {
                                                    const itemId = item.id;
                                                    const quantity = itemQuantities[itemId] || 0;
                                                            
                                                    return (
                                                        <div key={itemId} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                                                            <span className="text-gray-800">{item.name}</span>
                                                            <div className="flex items-center space-x-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => decrementItem(itemId)}
                                                                    className={`w-8 h-8 flex items-center justify-center rounded-full border ${quantity > 0 ? 'border-orange-500 text-orange-500 hover:bg-orange-50' : 'border-gray-300 text-gray-300 cursor-not-allowed'}`}
                                                                    disabled={quantity === 0}
                                                                >
                                                                    <FaMinus className="h-3 w-3" />
                                                                </button>
                                                                <span className="text-sm w-6 text-center">{quantity}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => incrementItem(itemId)}
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
                                    
                                    {/* Extra Information field */}
                                    <div className="mt-6">
                                        <label htmlFor="extra-info" className="block text-sm font-medium text-gray-700">
                                            Extra Information
                                        </label>
                                        <textarea
                                            id="extra-info"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                            rows={3}
                                            placeholder="e.g., Fragile items, special handling requirements, additional items you could not find in our list"
                                        />
                                    </div>
                                    {/* Upload photo/video option */}
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload photo(s) of your items</label>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            multiple 
                                            onChange={handleItemPhotosUpload}
                                            className="block w-full text-sm text-gray-500" 
                                        />
                                        
                                        {/* Display uploaded photos */}
                                        {itemPhotos.length > 0 && (
                                            <div className="mt-3">
                                                <p className="text-sm text-gray-600 mb-2">Uploaded photos ({itemPhotos.length}):</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {itemPhotos.map((photo, index) => (
                                                        <div key={index} className="relative">
                                                            <img 
                                                                src={URL.createObjectURL(photo)} 
                                                                alt={`Item photo ${index + 1}`}
                                                                className="w-full h-24 object-cover rounded border"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItemPhoto(index)}
                                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* Step 4: Add-ons & Services */}
                            {step === 4 && (
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-600 mb-4">
                                        Select additional services you may need for your move.
                                    </p>
                                    
                                    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <FaToolbox className="h-6 w-6 text-orange-600" />
                                            </div>
                                            <div className="ml-3 flex-grow">
                                                <div className="flex justify-between">
                                                    <label htmlFor="disassembly-toggle" className="font-medium text-gray-900">Disassembly & Reassembly</label>
                                                </div>
                                                <p className="text-gray-500 text-sm mt-1">
                                                    Do you need our help with assembly/ disassembly of some Items?
                                                </p>
                                                <div className="mt-2">
                                                    <Switch
                                                        checked={disassembly}
                                                        onChange={setDisassembly}
                                                        className={`${disassembly ? 'bg-orange-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2`}
                                                        id="disassembly-toggle"
                                                    >
                                                        <span
                                                            style={{
                                                                transform: (disassembly) ? 'translateX(24px)' : 'translateX(4px)',
                                                                transition: 'transform 0.2s'
                                                            }}
                                                            className="inline-block h-4 w-4 rounded-full bg-white"
                                                        />
                                                    </Switch>
                                                </div>
                                                
                                                {disassembly && (
                                                    <div className="mt-4 ml-2 space-y-2">
                                                        <p className="text-sm text-gray-600">
                                                            Select which items need disassembly & reassembly:
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
                                                        {Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0).map((itemId, index) => {
                                                            const itemData = furnitureItems.find(item => item.id === itemId);
                                                            const itemName = itemData ? itemData.name : itemId;
                                                            
                                                            return (
                                                                <div key={index} className="flex items-center">
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
                                                                        {itemName} ({itemQuantities[itemId]})
                                                                    </label>
                                                                </div>
                                                            );
                                                        })}
                                                        {Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0).length === 0 && (
                                                            <p className="text-sm text-gray-500 italic">No items selected yet. Please add items in the previous step.</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <FaPlus className="h-6 w-6 text-orange-600" />
                                            </div>
                                            <div className="ml-3 flex-grow">
                                                <div className="flex justify-between">
                                                    <label htmlFor="extra-helper-toggle" className="font-medium text-gray-900">Extra Helper</label>
                                                </div>
                                                <p className="text-gray-500 text-sm mt-1">
                                                    Do you require an extra helper in addition to our 1-helper standard package?
                                                </p>
                                                <div className="mt-2">
                                                    <Switch
                                                        checked={extraHelper}
                                                        onChange={setExtraHelper}
                                                        disabled={Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0).length === 0}
                                                        className={`${extraHelper ? 'bg-orange-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50`}
                                                        id="extra-helper-toggle"
                                                    >
                                                        <span
                                                            style={{
                                                                transform: (extraHelper) ? 'translateX(24px)' : 'translateX(4px)',
                                                                transition: 'transform 0.2s'
                                                            }}
                                                            className="inline-block h-4 w-4 rounded-full bg-white"
                                                        />
                                                    </Switch>
                                                </div>
                                                
                                                
                                                {Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0).length === 0 && (
                                                    <p className="text-sm text-gray-400 mt-2">
                                                        Select items first to enable extra helper
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <FaPlus className="h-6 w-6 text-orange-600" />
                                            </div>
                                            <div className="ml-3 flex-grow">
                                                <div className="flex justify-between">
                                                    <label htmlFor="carrying-toggle" className="font-medium text-gray-900">Carrying Service</label>
                                                </div>
                                                <p className="text-gray-500 text-sm mt-1">
                                                    Do you need our help with carrying items up or downstairs?
                                                </p>
                                                <div className="mt-2">
                                                    <Switch
                                                        checked={carryingService}
                                                        onChange={setCarryingService}
                                                        className={`${carryingService ? 'bg-orange-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2`}
                                                        id="carrying-toggle"
                                                    >
                                                        <span
                                                            style={{
                                                                transform: (carryingService) ? 'translateX(24px)' : 'translateX(4px)',
                                                                transition: 'transform 0.2s'
                                                            }}
                                                            className="inline-block h-4 w-4 rounded-full bg-white"
                                                        />
                                                    </Switch>
                                                </div>
                                                
                                                {carryingService && (
                                                    <div className="mt-4 ml-2 space-y-2">
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
                                                        {Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0).map((itemId, index) => {
                                                            const itemData = furnitureItems.find(item => item.id === itemId);
                                                            const itemName = itemData ? itemData.name : itemId;
                                                            return (
                                                                <div key={index} className="flex items-center">
                                                                    <input
                                                                        id={`carrying-service-${itemId}`}
                                                                        type="checkbox"
                                                                        checked={carryingServiceItems[itemId] || false}
                                                                        onChange={e => setCarryingServiceItems({ ...carryingServiceItems, [itemId]: e.target.checked })}
                                                                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                                    />
                                                                    <label htmlFor={`carrying-service-${itemId}`} className="ml-2 block text-sm text-gray-700">
                                                                        {itemName} ({itemQuantities[itemId]}x)
                                                                    </label>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <FaInfoCircle className="h-6 w-6 text-orange-600" />
                                            </div>
                                            <div className="ml-3 flex-grow">
                                                <div className="flex justify-between">
                                                    <label htmlFor="student-toggle" className="font-medium text-gray-900">Student Discount (10%)</label>
                                                    <span className="text-green-600 font-medium">-10%</span>
                                                </div>
                                                <p className="text-gray-500 text-sm mt-1">
                                                    Available for students with valid ID
                                                </p>
                                                <div className="mt-2">
                                                    <Switch
                                                        checked={isStudent}
                                                        onChange={setIsStudent}
                                                        className={`${isStudent ? 'bg-orange-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2`}
                                                        id="student-toggle"
                                                    >
                                                        <span
                                                            style={{
                                                                transform: (isStudent) ? 'translateX(24px)' : 'translateX(4px)',
                                                                transition: 'transform 0.2s'
                                                            }}
                                                            className="inline-block h-4 w-4 rounded-full bg-white"
                                                        />
                                                    </Switch>
                                                </div>
                                                
                                                {isStudent && (
                                                    <div className="mt-3">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Upload Student ID
                                                        </label>
                                                        <input
                                                            type="file"
                                                            onChange={handleStudentIdUpload}
                                                            className="mt-1 block w-full text-sm text-gray-500
                                                                file:mr-4 file:py-2 file:px-4
                                                                file:rounded-md file:border-0
                                                                file:text-sm file:font-semibold
                                                                file:bg-orange-50 file:text-orange-700
                                                                hover:file:bg-orange-100"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Step 5: Contact Information */}
                            {step === 5 && (
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-600 mb-4">
                                        Please provide your contact information so we can get in touch about your move.
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
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
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
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={contactInfo.email}
                                            onChange={handleContactInfoChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
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
                                        <div className="flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id="terms"
                                                    name="terms"
                                                    type="checkbox"
                                                    checked={agreedToTerms}
                                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <label htmlFor="terms" className="font-medium text-gray-700">
                                                    I agree to the Terms and Conditions
                                                </label>
                                                <p className="text-gray-500">
                                                    By proceeding, you agree to our <a href="/terms" target="_blank" className="text-orange-600 hover:text-orange-800">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-orange-600 hover:text-orange-800">Privacy Policy</a>.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Step 6: Summary & Confirmation */}
                            {step === 6 && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-medium text-gray-900">Booking Summary</h3>
                                    
                                    <div className="bg-orange-50 p-4 rounded-lg space-y-4">
                                        <div>
                                            <h4 className="font-medium text-gray-900">Locations</h4>
                                            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                <div>
                                                    <span className="text-gray-500 text-sm">Pickup:</span>
                                                    <p className="text-gray-900">{firstLocation || "Not specified"}</p>
                                                    <p className="text-gray-600 text-sm">
                                                        Floor: {floorPickup || "0"} {elevatorPickup ? "(with elevator)" : ""}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500 text-sm">Dropoff:</span>
                                                    <p className="text-gray-900">{secondLocation || "Not specified"}</p>
                                                    <p className="text-gray-600 text-sm">
                                                        Floor: {floorDropoff || "0"} {elevatorDropoff ? "(with elevator)" : ""}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <h4 className="font-medium text-gray-900">Date & Time</h4>
                                            <p className="text-gray-900">
                                                {isDateFlexible 
                                                    ? "Flexible date (we'll contact you to confirm)" 
                                                    : selectedDateRange.start 
                                                        ? new Date(selectedDateRange.start).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                                                        : "Not specified"
                                                }
                                            </p>
                                            <p className="text-gray-600 text-sm">
                                                {preferredTimeSpan 
                                                    ? preferredTimeSpan === "morning" 
                                                        ? "Morning (8:00 - 12:00)"
                                                        : preferredTimeSpan === "afternoon"
                                                            ? "Afternoon (12:00 - 16:00)"
                                                            : preferredTimeSpan === "evening"
                                                                ? "Evening (16:00 - 20:00)"
                                                                : "Flexible (Any time)"
                                                    : "No preferred time specified"
                                                }
                                            </p>
                                        </div>
                                        
                                        <div>
                                            <h4 className="font-medium text-gray-900">Items</h4>
                                            {Object.keys(itemQuantities).length > 0 ? (
                                                <ul className="mt-2 space-y-1">
                                                    {Object.entries(itemQuantities).map(([itemId, quantity]) => {
                                                        const itemData = furnitureItems.find(item => item.id === itemId);
                                                        const itemName = itemData ? itemData.name : itemId;
                                                        
                                                        return (
                                                            <li key={itemId} className="flex justify-between text-sm">
                                                                <span className="text-gray-600">
                                                                    {itemName}
                                                                    {disassemblyItems[itemId] && <span className="ml-1 text-orange-600">(Disassembly)</span>}
                                                                    {extraHelperItems[itemId] && <span className="ml-1 text-orange-600">(Extra Helper)</span>}
                                                                </span>
                                                                <span className="text-gray-900">{quantity}x</span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            ) : (
                                                <p className="text-gray-600 text-sm">No items selected</p>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <h4 className="font-medium text-gray-900">Additional Services</h4>
                                            <ul className="mt-2 space-y-1">
                                                <li className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Disassembly & Reassembly</span>
                                                    <span className="text-gray-900">{disassembly ? "Yes" : "No"}</span>
                                                </li>
                                                <li className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Extra Helper</span>
                                                    <span className="text-gray-900">{extraHelper ? "Yes" : "No"}</span>
                                                </li>
                                                <li className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Carrying Service</span>
                                                    <span className="text-gray-900">{carryingService ? "Yes" : "No"}</span>
                                                </li>
                                                <li className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Student Discount</span>
                                                    <span className="text-gray-900">{isStudent && studentId ? "Yes (10% off)" : "No"}</span>
                                                </li>
                                            </ul>
                                        </div>
                                        
                                        <div>
                                            <h4 className="font-medium text-gray-900">Contact Information</h4>
                                            <ul className="mt-2 space-y-1">
                                                <li className="text-sm">
                                                    <span className="text-gray-600">Name:</span>
                                                    <span className="text-gray-900 ml-2">{contactInfo.firstName} {contactInfo.lastName}</span>
                                                </li>
                                                <li className="text-sm">
                                                    <span className="text-gray-600">Email:</span>
                                                    <span className="text-gray-900 ml-2">{contactInfo.email}</span>
                                                </li>
                                                <li className="text-sm">
                                                    <span className="text-gray-600">Phone:</span>
                                                    <span className="text-gray-900 ml-2">{contactInfo.phone}</span>
                                                </li>
                                                {pickupType === 'store' && (
                                                    <li className="text-sm">
                                                        <span className="text-gray-600">Store Proof:</span>
                                                        <span className="text-gray-900 ml-2">{storeProofPhoto ? storeProofPhoto.name : 'Not uploaded'}</span>
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <div className="flex items-start">
                                            <FaInfoCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                            <div className="ml-3 flex-1">
                                                <h3 className="text-sm font-medium text-green-800">Extra Information/ Instructions for our Team</h3>
                                                <div className="mt-2 text-sm text-green-700">
                                                    <textarea
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-3 border"
                                                        rows={5}
                                                        placeholder="E.g., parking opportunities for the driver, instructions on how to access the building/ room"
                                                        value={extraInstructions}
                                                        onChange={(e) => setExtraInstructions(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
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
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
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
                isOpen={showOrderConfirmation}
                onClose={() => setShowOrderConfirmation(false)}
                orderNumber=""
                isReHomeOrder={false}
                isMovingRequest={true}
            />

            {/* Booking Tips Modal */}
            <BookingTipsModal
                isOpen={showBookingTips}
                onContinue={handleContinueFromTips}
                serviceType="house-moving"
            />
            {/* What's Next Section
            <div className="bg-orange-50 p-4 rounded-lg mt-6">
              <h3 className="text-lg font-bold text-orange-700 mb-2">What's Next?</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>1️⃣ Review – We will review your request and match it with our schedule.</li>
                <li>2️⃣ Contact – You will receive a final quote and proposal via email or WhatsApp.</li>
                <li>3️⃣ Arrange – If the proposed date/time does not work for you, please contact us via WhatsApp or Email with a screenshot of the mail. We will work together to find a suitable date.</li>
                <li>4️⃣ Confirmation – Once we agree on a date and time, we will send you a confirmation email with an invoice.</li>
                <li>5️⃣ Completion – We will carry out the service as scheduled. You can pay by card after the service was carried out or later by bank transfer.</li>
              </ol>
            </div> */}
        </div>
    );
};

export default HouseMovingPage; 