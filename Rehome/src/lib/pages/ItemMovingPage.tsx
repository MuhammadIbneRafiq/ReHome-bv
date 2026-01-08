import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaHome, FaStore, FaMinus, FaPlus } from "react-icons/fa";
import { supabase } from '../../hooks/supaBase';
import { Switch } from "@headlessui/react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getItemPoints, furnitureItems, constantsLoaded } from '../../lib/constants';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import backendPricingService, { PricingInput } from '../../services/backendPricingService';

// Import types
export interface PricingBreakdown {
    basePrice: number;
    itemValue: number;
    distanceCost: number;
    carryingCost: number;
    assemblyCost: number;
    extraHelperCost: number;
    subtotal: number;
    studentDiscount: number;
    lateBookingFee: number;
    total: number;
    breakdown?: any;
}
import { PhoneNumberInput } from '@/components/ui/PhoneNumberInput';
import OrderConfirmationModal from '../../components/marketplace/OrderConfirmationModal';
import BookingTipsModal from '../../components/ui/BookingTipsModal';
import { GooglePlaceObject } from '../../utils/locationServices';
import EnhancedDatePickerInline from '@/components/ui/EnhancedDatePickerInline';
import { GooglePlacesAutocomplete } from '../../components/ui/GooglePlacesAutocomplete';
import { isDateBlocked } from '../../services/blockedDatesService';
// Calendar component not used here; using native date inputs

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

interface PriceSummaryProps {
    pricingBreakdown: PricingBreakdown | null;
}
interface MovingPageProps {
    serviceType?: 'item-transport' | 'house-moving';
}

const ItemMovingPage: React.FC<MovingPageProps> = ({ serviceType = 'item-transport' }) => {
    const { t } = useTranslation();
    const [isDataLoaded, setIsDataLoaded] = useState(constantsLoaded);
    // Order confirmation modal state - used in handleSubmit for house moving
    const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
    const isItemTransport = serviceType === 'item-transport';
    const isHouseMoving = serviceType === 'house-moving';


    useEffect(() => {
        if (!constantsLoaded || furnitureItems.length === 0) {
            const checkLoaded = setInterval(() => {
                if (constantsLoaded) {
                    setIsDataLoaded(true);
                    clearInterval(checkLoaded);
                }
            }, 100);
            return () => clearInterval(checkLoaded);
        } else {
            setIsDataLoaded(true);
        }
    }, []);
    
    // Check for transferred data from item transport when in house moving mode
    useEffect(() => {
        if (isHouseMoving) {
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
                    if (data.assembly !== undefined) setAssembly(data.assembly);
                    if (data.extraHelper !== undefined) setExtraHelper(data.extraHelper);
                    if (data.carryingService !== undefined) setCarryingService(data.carryingService);
                    if (data.isStudent !== undefined) setIsStudent(data.isStudent);
                    if (data.studentId) setStudentId(data.studentId);
                    if (data.storeProofPhoto) setStoreProofPhoto(data.storeProofPhoto);
                    if (data.disassemblyItems) setDisassemblyItems(data.disassemblyItems);
                    if (data.assemblyItems) setAssemblyItems(data.assemblyItems);
                    if (data.extraHelperItems) setExtraHelperItems(data.extraHelperItems);
                    if (data.carryingServiceItems) setCarryingServiceItems(data.carryingServiceItems);
                    if (data.pickupPlace) setPickupPlace(data.pickupPlace);
                    if (data.dropoffPlace) setDropoffPlace(data.dropoffPlace);
                    if (data.distanceKm) setDistanceKm(data.distanceKm);
                    if (data.extraInstructions) setExtraInstructions(data.extraInstructions);
                    
                    // Show success message
                    // toast.success("Your information has been transferred from item transport. Please review and continue.");
                    
                    // Clear the transferred data
                    sessionStorage.removeItem('itemTransportToHouseMoving');
                    
                } catch (error) {
                    console.error('Error parsing transferred data:', error);
                }
            }
        }
    }, [isHouseMoving]);

    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [disassembly, setDisassembly] = useState(false);
    const [assembly, setAssembly] = useState(false);
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
    const [carryingService, setCarryingService] = useState(false); // legacy toggle (kept for compatibility, not used in UI)
    const [itemQuantities, setItemQuantities] = useState<{ [key: string]: number }>({});
    const [pickupType, setPickupType] = useState<'private' | 'store' | null>(null);
    const [customItem, setCustomItem] = useState('');
    const [isStudent, setIsStudent] = useState(false);
    const [studentId, setStudentId] = useState<File | null>(null);
    const [storeProofPhoto, setStoreProofPhoto] = useState<File | null>(null);
    const [itemPhotos, setItemPhotos] = useState<File[]>([]);
    const [isDateFlexible, setIsDateFlexible] = useState(false);
    const [disassemblyItems, setDisassemblyItems] = useState<{ [key: string]: boolean }>({});
    const [assemblyItems, setAssemblyItems] = useState<{ [key: string]: boolean }>({});
    const [extraHelperItems, setExtraHelperItems] = useState<{ [key: string]: boolean }>({});
    const [preferredTimeSpan, setPreferredTimeSpan] = useState('');
    // const [paymentLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pricingBreakdown, setPricingBreakdown] = useState<PricingBreakdown | null>(null);
    const [orderNumber, setOrderNumber] = useState<string>('');
    const [isGoogleReady, setIsGoogleReady] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [showBookingTips, setShowBookingTips] = useState(false);
    const [showPointLimitModal, setShowPointLimitModal] = useState(false);
    const [pickupPlace, setPickupPlace] = useState<GooglePlaceObject | null>(null);
    const [dropoffPlace, setDropoffPlace] = useState<GooglePlaceObject | null>(null);
    const [distanceKm, setDistanceKm] = useState<number | null>(null);
    const [dateOption, setDateOption] = useState<'flexible' | 'fixed' | 'rehome' >('fixed');
    const [carryingServiceItems, setCarryingServiceItems] = useState<{ [key: string]: boolean }>({}); // legacy storage
    
    // Calendar open/close states for inline calendars
    const [isStartDateOpen, setIsStartDateOpen] = useState(false);
    const [isEndDateOpen, setIsEndDateOpen] = useState(false);
    const [isPickupDateOpen, setIsPickupDateOpen] = useState(false);
    const [isDropoffDateOpen, setIsDropoffDateOpen] = useState(false);
    const [isMovingDateOpen, setIsMovingDateOpen] = useState(false);

    // Helper function to close all calendars
    const closeAllCalendars = () => {
        setIsStartDateOpen(false);
        setIsEndDateOpen(false);
        setIsPickupDateOpen(false);
        setIsDropoffDateOpen(false);
        setIsMovingDateOpen(false);
    };

    // Handler to manage calendar opening/closing
    const handleCalendarToggle = (calendarName: string, newState: boolean) => {
        if (newState) {
            // Close all other calendars when opening one
            closeAllCalendars();
        }
        
        // Then set the specific calendar state
        switch (calendarName) {
            case 'start':
                setIsStartDateOpen(newState);
                break;
            case 'end':
                setIsEndDateOpen(newState);
                break;
            case 'pickup':
                setIsPickupDateOpen(newState);
                break;
            case 'dropoff':
                setIsDropoffDateOpen(newState);
                break;
            case 'moving':
                setIsMovingDateOpen(newState);
                break;
        }
    };

    // Helper to check if date is within short-term window and show warning
    const checkShortTermDate = React.useCallback((dateStr: string) => {
        if (!dateStr) return;
        const selectedDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 3 && diffDays >= 0) {
            toast.warning(
                "LAST MINUTE REQUEST! Please check other days to receive a cheaper service.",
                { autoClose: 5000, toastId: 'last-minute-warning' }
            );
        }
    }, []);

    // New: separate carrying directions
    const [carryingUpstairs, setCarryingUpstairs] = useState(false);
    const [carryingDownstairs, setCarryingDownstairs] = useState(false);
    const [carryingUpItems, setCarryingUpItems] = useState<{ [key: string]: boolean }>({});
    const [carryingDownItems, setCarryingDownItems] = useState<{ [key: string]: boolean }>({});
    const [selectAllCarryingUp, setSelectAllCarryingUp] = useState(false);
    const [selectAllCarryingDown, setSelectAllCarryingDown] = useState(false);

    // Derived combined carrying state for pricing compatibility
    const carryingEnabled = carryingUpstairs || carryingDownstairs || carryingService;
    const combinedCarryingItems = React.useMemo(() => {
        const combined: { [key: string]: boolean } = {};
        Object.keys(carryingUpItems).forEach(id => { if (carryingUpItems[id]) combined[id] = true; });
        Object.keys(carryingDownItems).forEach(id => { if (carryingDownItems[id]) combined[id] = true; });
        // include any legacy selections
        Object.keys(carryingServiceItems).forEach(id => { if (carryingServiceItems[id]) combined[id] = true; });
        return combined;
    }, [carryingUpItems, carryingDownItems, carryingServiceItems]);

    // Only these items are eligible for assembly/disassembly add-ons
    const assemblyEligibleNames = React.useMemo(() => new Set([
        '3-doors closet',
        '3-door wardrobe',
        '2-doors closet',
        '2-door wardrobe',
        '1-person bed',
        'single bed',
        '2-person bed',
        'double bed'
    ]), []);

    const isAssemblyEligible = React.useCallback((itemId: string): boolean => {
        const itemData = furnitureItems.find(item => item.id === itemId);
        const name = (itemData?.name || '').toLowerCase();
        return assemblyEligibleNames.has(name);
    }, [assemblyEligibleNames]);

    const assemblyEligibleSelectedItemIds = React.useMemo(
        () =>
            Object.keys(itemQuantities).filter(
                itemId => itemQuantities[itemId] > 0 && isAssemblyEligible(itemId)
            ),
        [itemQuantities, isAssemblyEligible]
    );

    // Add state for select all functionality
    const [selectAllDisassembly, setSelectAllDisassembly] = useState(false);
    const [selectAllAssembly, setSelectAllAssembly] = useState(false);
    const [extraInstructions, setExtraInstructions] = useState('');

    // Point limit constant
    const ITEM_TRANSPORT_ITEM_LIMIT = 3; // Maximum number of items allowed


    // Guard against stale async pricing responses
    const latestRequestIdRef = React.useRef(0);

    // Create a stable identifier for the current date configuration to prevent flickering
    // This ensures pricing calculations only happen when the actual date configuration changes,
    // not when individual state variables are being updated during user interactions
    const dateConfigId = React.useMemo(() => {
        if (dateOption === 'rehome') {
            return `rehome-${serviceType}`;
        } else if (dateOption === 'flexible') {
            return `flexible-${serviceType}-${selectedDateRange.start}-${selectedDateRange.end}`;
        } else if (dateOption === 'fixed') {
            if (isItemTransport) {
                return `fixed-${serviceType}-${pickupDate}-${dropoffDate}`;
            } else {
                return `fixed-${serviceType}-${selectedDateRange.start}`;
            }
        }
        return `unknown-${serviceType}`;
    }, [dateOption, serviceType, selectedDateRange.start, selectedDateRange.end, pickupDate, dropoffDate, isItemTransport]);

    const isPlaceInNetherlands = React.useCallback((place?: GooglePlaceObject | null) => {
        if (!place) return false;
        const code = place.countryCode?.toUpperCase();
        if (code) {
            return code === 'NL';
        }
        const countryName = place.countryName?.toLowerCase();
        if (countryName) {
            return countryName.includes('netherlands') || countryName.includes('nederland');
        }
        const text = (place.formattedAddress || place.displayName || place.text || '').toLowerCase();
        if (!text) return false;
        return text.includes('netherlands') || text.includes('nederland');
    }, []);

    const handleInternationalRedirect = React.useCallback((context: 'pickup' | 'dropoff') => {
        if (context === 'pickup') {
            setFirstLocation('');
            setPickupPlace(null);
        } else {
            setSecondLocation('');
            setDropoffPlace(null);
        }
        setDistanceKm(null);
        setPricingBreakdown(null);

        const contextText = context === 'pickup' ? 'pickup' : 'delivery';
        toast.info(`International moves are handled through Special Requests. Redirecting you to submit your ${contextText} outside the Netherlands.`);
        navigate('/special-request', {
            state: {
                fromInternationalRedirect: true,
                redirectMessage: `We noticed your ${contextText} location is outside the Netherlands. Please submit a Special Request under Full & International Moves so our team can assist you.`,
                preselectService: 'fullInternationalMove'
            }
        });
    }, [navigate]);

    const handlePickupPlaceSelect = React.useCallback((place: GooglePlaceObject) => {
        if (!isPlaceInNetherlands(place)) {
            handleInternationalRedirect('pickup');
            return;
        }
        setPickupPlace(place);
    }, [handleInternationalRedirect, isPlaceInNetherlands]);

    const handleDropoffPlaceSelect = React.useCallback((place: GooglePlaceObject) => {
        if (!isPlaceInNetherlands(place)) {
            handleInternationalRedirect('dropoff');
            return;
        }
        setDropoffPlace(place);
    }, [handleInternationalRedirect, isPlaceInNetherlands]);

    // Function to calculate total number of items
    const calculateTotalItems = () => {
        return Object.values(itemQuantities)
            .reduce((total, quantity) => total + quantity, 0);
    };

    // Ensure pickup & dropoff addresses are filled and backed by Google Places selections
    const validateLocationInputs = () => {
        const hasPickupText = firstLocation.trim().length > 0;
        const hasDropoffText = secondLocation.trim().length > 0;
        const pickupHasPlace = !!(pickupPlace?.placeId && pickupPlace?.coordinates && 
            typeof pickupPlace.coordinates.lat === 'number' && typeof pickupPlace.coordinates.lng === 'number');
        const dropoffHasPlace = !!(dropoffPlace?.placeId && dropoffPlace?.coordinates &&
            typeof dropoffPlace.coordinates.lat === 'number' && typeof dropoffPlace.coordinates.lng === 'number');

        if (!hasPickupText) {
            toast.error("Please enter a pickup address.");
            return false;
        }
        if (!pickupHasPlace) {
            toast.error("Please select the pickup address from the suggestions so we can capture it correctly.");
            return false;
        }
        if (!hasDropoffText) {
            toast.error("Please enter a delivery address.");
            return false;
        }
        if (!dropoffHasPlace) {
            toast.error("Please select the delivery address from the suggestions so we can capture it correctly.");
            return false;
        }
        return true;
    };

    // Function to check item limit and redirect if exceeded
    const checkItemLimitAndRedirect = () => {
        const totalItems = calculateTotalItems();
        if (totalItems > ITEM_TRANSPORT_ITEM_LIMIT) {
            setShowPointLimitModal(true);
            return true;
        }
        return false;
    };

    // Function to check if any items are selected
    const checkItemsSelected = () => {
        const totalItems = calculateTotalItems();
        if (totalItems === 0) {
            toast.error("Please select at least one item to continue.");
            return false;
        }
        return true;
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
            assembly,
            extraHelper,
            carryingService,
            isStudent,
            studentId,
            storeProofPhoto,
            disassemblyItems,
            assemblyItems,
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
    const handleSelectAllDisassembly = (checked: boolean) => {
        setSelectAllDisassembly(checked);
        const newDisassemblyItems: { [key: string]: boolean } = {};
        assemblyEligibleSelectedItemIds.forEach(itemId => {
            newDisassemblyItems[itemId] = checked;
        });
        setDisassemblyItems(newDisassemblyItems);
    };
    
    const handleSelectAllAssembly = (checked: boolean) => {
        setSelectAllAssembly(checked);
        const newAssemblyItems: { [key: string]: boolean } = {};
        assemblyEligibleSelectedItemIds.forEach(itemId => {
            newAssemblyItems[itemId] = checked;
        });
        setAssemblyItems(newAssemblyItems);
    };

    // Update disassembly items when individual items change
    useEffect(() => {
        const allSelected =
            assemblyEligibleSelectedItemIds.length > 0 &&
            assemblyEligibleSelectedItemIds.every(itemId => disassemblyItems[itemId]);
        setSelectAllDisassembly(allSelected);
    }, [disassemblyItems, assemblyEligibleSelectedItemIds]);

    // Update assembly items when individual items change
    useEffect(() => {
        const allSelected =
            assemblyEligibleSelectedItemIds.length > 0 &&
            assemblyEligibleSelectedItemIds.every(itemId => assemblyItems[itemId]);
        setSelectAllAssembly(allSelected);
    }, [assemblyItems, assemblyEligibleSelectedItemIds]);

    // Prune any ineligible selections if present
    useEffect(() => {
        if (Object.keys(disassemblyItems).length > 0) {
            const pruned: { [key: string]: boolean } = {};
            Object.keys(disassemblyItems).forEach(id => {
                if (isAssemblyEligible(id) && itemQuantities[id] > 0 && disassemblyItems[id]) {
                    pruned[id] = true;
                }
            });
            setDisassemblyItems(pruned);
        }
    }, [itemQuantities, isAssemblyEligible, disassemblyItems]);

    useEffect(() => {
        if (Object.keys(assemblyItems).length > 0) {
            const pruned: { [key: string]: boolean } = {};
            Object.keys(assemblyItems).forEach(id => {
                if (isAssemblyEligible(id) && itemQuantities[id] > 0 && assemblyItems[id]) {
                    pruned[id] = true;
                }
            });
            setAssemblyItems(pruned);
        }
    }, [itemQuantities, isAssemblyEligible, assemblyItems]);

    // Update carrying items when individual items change
    useEffect(() => {
        const selectedItems = Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0);
        const allUp = selectedItems.length > 0 && selectedItems.every(itemId => carryingUpItems[itemId]);
        const allDown = selectedItems.length > 0 && selectedItems.every(itemId => carryingDownItems[itemId]);
        setSelectAllCarryingUp(allUp);
        setSelectAllCarryingDown(allDown);
    }, [carryingUpItems, carryingDownItems, itemQuantities]);

    const handleStudentIdUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        // Comment out debug logging to improve performance
        /*console.log('[DEBUG] Student ID upload:', {
          file: file?.name,
          hasFile: !!file,
          isStudent
        });*/
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

    // Eagerly pre-load Google Maps to avoid first-use lag
    useEffect(() => {
        loadGoogleMapsAPI()
            .then(() => {
                setIsGoogleReady(true);
                console.log('✅ Google Maps API ready');
            })
            .catch((error) => {
                setIsGoogleReady(false);
                console.error('❌ Google Maps API failed to load:', error);
            });
    }, []);

    // Cache for distance calculations to prevent redundant API calls
    const distanceCache = React.useRef<Record<string, number>>({});
    
    // Calculate distance using Google Maps Distance Matrix API with fallback to straight-line
    const calculateDistance = async (place1: any, place2: any): Promise<number> => {         
        // Guard: ensure we have valid coordinates
        if (!place1?.coordinates || !place2?.coordinates) {
            return 0;
        }
        
        // Create cache key for this coordinate pair
        const cacheKey = [
            [place1.coordinates.lat.toFixed(6), place1.coordinates.lng.toFixed(6)],
            [place2.coordinates.lat.toFixed(6), place2.coordinates.lng.toFixed(6)]
        ].sort().toString();
        
        // Return cached value if available
        if (distanceCache.current[cacheKey] !== undefined) {
            return distanceCache.current[cacheKey];
        }
        
        // Guard: ensure Google Maps is ready before attempting API calls
        if (!isGoogleReady) {
            console.warn('⚠️ Google Maps not ready, using straight-line calculation');
            const fallbackDistance = calculateStraightLineDistance(place1, place2);
            distanceCache.current[cacheKey] = fallbackDistance;
            return fallbackDistance;
        }
        
        // Use Distance Matrix API for accurate driving distance
        return new Promise((resolve) => {
            try {
                const service = new google.maps.DistanceMatrixService();
                const origins = [new google.maps.LatLng(place1.coordinates.lat, place1.coordinates.lng)];
                const destinations = [new google.maps.LatLng(place2.coordinates.lat, place2.coordinates.lng)];

                service.getDistanceMatrix({
                    origins,
                    destinations,
                    travelMode: google.maps.TravelMode.DRIVING,
                    unitSystem: google.maps.UnitSystem.METRIC,
                }, (response, status) => {
                    if (status === 'OK' && response?.rows?.[0]?.elements?.[0]?.status === 'OK' && response?.rows?.[0]?.elements?.[0]?.distance?.value) {
                        const distanceKm = response.rows[0].elements[0].distance.value / 1000; // Convert meters to km
                        distanceCache.current[cacheKey] = distanceKm;
                        resolve(distanceKm);
                    } else {
                        console.warn('⚠️ Distance Matrix API failed, falling back to straight-line calculation');
                        const fallbackDistance = calculateStraightLineDistance(place1, place2);
                        distanceCache.current[cacheKey] = fallbackDistance;
                        resolve(fallbackDistance);
                    }
                });
            } catch (error) {
                console.error('❌ Distance Matrix call threw, using straight-line fallback:', error);
                const fallbackDistance = calculateStraightLineDistance(place1, place2);
                distanceCache.current[cacheKey] = fallbackDistance;
                resolve(fallbackDistance);
            }
        });
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
        
        // Reduce console logging for better performance
        // console.log('📏 Calculated straight-line distance:', distance.toFixed(2), 'km between', place1.text, 'and', place2.text);
        return distance;
    };

    const calculatePrice = async () => {
        // Guard: ensure dynamic constants and minimal inputs are ready
        if (!isDataLoaded) {
            return;
        }
        const requestId = ++latestRequestIdRef.current;
        // Require Google Place objects for pricing
        if (!pickupPlace || !dropoffPlace) {
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

            const pricingInput: PricingInput = {
                serviceType: serviceType,
                pickupLocation: pickupPlace, // Always send Google Place object
                dropoffLocation: dropoffPlace, // Always send Google Place object
                distanceKm: calculatedDistance, // Use calculated distance
                selectedDate: selectedDateForPricing,
                selectedDateRange: dateOption === 'flexible' ? selectedDateRange : 
                                  (dateOption === 'fixed' && isHouseMoving) ? { start: selectedDateRange.start, end: '' } :
                                  { start: '', end: '' }, // Only pass date range for flexible dates or house moving fixed date
                // For item transport fixed dates, use separate pickup/dropoff dates
                // For house moving, always use selectedDateRange
                pickupDate: dateOption === 'fixed' && isItemTransport ? pickupDate : undefined,
                dropoffDate: dateOption === 'fixed' && isItemTransport ? dropoffDate : undefined,
                isDateFlexible: dateOption === 'rehome', // True for ReHome choose option
                itemQuantities,
                // Carrying directions: 
                // - Downstairs: items going down at pickup location (use floorPickup)
                // - Upstairs: items going up at dropoff location (use floorDropoff)
                floorPickup: carryingDownstairs ? (parseInt(floorPickup) || 0) : 0,
                floorDropoff: carryingUpstairs ? (parseInt(floorDropoff) || 0) : 0,
                elevatorPickup,
                elevatorDropoff,
                assemblyItems: assemblyItems,
                disassemblyItems: disassemblyItems,
                extraHelperItems,
                isStudent,
                hasStudentId: !!studentId, // Only true if file is uploaded
                                carryingServiceItems: combinedCarryingItems,
                carryingUpItems: carryingUpItems,
                carryingDownItems: carryingDownItems,
                pickupPlace: pickupPlace,
                dropoffPlace: dropoffPlace,
            };
            
            console.log('[DEBUG] Pricing input Place objects:', {
                pickupPlace,
                dropoffPlace,
                timestamp: new Date().toISOString()
            });
            const breakdown = await backendPricingService.calculatePricing(pricingInput);
            if (requestId === latestRequestIdRef.current) {
                setPricingBreakdown(breakdown);
            }
            
            // Update distance state from pricing service result if we didn't calculate distance
            if (!calculatedDistance && breakdown?.breakdown?.distance?.distanceKm) {
                if (requestId === latestRequestIdRef.current) {
                    setDistanceKm(breakdown.breakdown.distance.distanceKm);
                }
            }
        } catch (error) {
            console.error('Error calculating pricing:', error);
            if (requestId === latestRequestIdRef.current) {
                setPricingBreakdown(null);
            }
        }
    };

    // Consolidated pricing input signature to detect meaningful changes
    // This prevents duplicate API calls by batching all dependencies into one stable key
    const pricingInputSignature = React.useMemo(() => {
        // Return null if we don't have minimum required data - require Google Place objects
        if (!isDataLoaded || !pickupPlace || !dropoffPlace) {
            return null;
        }
        
        // Create a stable signature from all pricing-relevant inputs
        return JSON.stringify({
            // Location data
            pickupPlaceId: pickupPlace?.placeId,
            dropoffPlaceId: dropoffPlace?.placeId,
            // Date configuration
            dateConfigId,
            // Items and quantities
            itemQuantities,
            // Add-on services
            disassembly,
            assembly,
            extraHelper,
            carryingService,
            disassemblyItems,
            assemblyItems,
            extraHelperItems,
            carryingServiceItems,
            carryingUpstairs,
            carryingDownstairs,
            carryingUpItems,
            carryingDownItems,
            // Floor and elevator
            floorPickup,
            floorDropoff,
            elevatorPickup,
            elevatorDropoff,
            // Student discount
            isStudent,
            hasStudentId: !!studentId,
        });
    }, [
        isDataLoaded, firstLocation, secondLocation,
        pickupPlace?.placeId, dropoffPlace?.placeId,
        dateConfigId,
        itemQuantities,
        disassembly, assembly, extraHelper, carryingService,
        disassemblyItems, assemblyItems, extraHelperItems, carryingServiceItems,
        carryingUpstairs, carryingDownstairs, carryingUpItems, carryingDownItems,
        floorPickup, floorDropoff, elevatorPickup, elevatorDropoff,
        isStudent, studentId
    ]);

    // Single consolidated useEffect for all pricing calculations
    // Uses debounce to batch rapid changes and prevent duplicate API calls
    useEffect(() => {
        // Clear pricing if we don't have valid inputs
        if (pricingInputSignature === null) {
            setPricingBreakdown(null);
            return;
        }
        
        // Increment request ID to guard against stale responses
        ++latestRequestIdRef.current;
        
        // Debounce all pricing calculations with a single timer
        const debounceTimer = setTimeout(() => {
            calculatePrice();
        }, 150); // 150ms debounce - fast real-time updates

        return () => clearTimeout(debounceTimer);
    }, [pricingInputSignature]);

    const nextStep = () => {
        // For step 1, ensure both addresses are valid Google selections before showing tips
        if (step === 1) {
            if (!validateLocationInputs()) {
                return;
            }
            // Show booking tips after step 1 (locations)
            setShowBookingTips(true);
            return;
        }

        // Check if items are selected when moving to step 4 (add-ons) or later
        if (step >= 3) {
            if (!checkItemsSelected()) {
                return;
            }
        }

        // Check point limit when moving to step 3 (items) or later - only for item transport
        if (isItemTransport && step >= 2) {
            if (checkItemLimitAndRedirect()) {
                return;
            }
        }

        // Validate date selection - different steps for different service types
        if (isItemTransport && step === 4) {
            // Item transport: validate dates in step 4
            if (dateOption === 'fixed' && (!pickupDate || !dropoffDate)) {
                toast.error("Please select both pickup and dropoff dates.");
                return;
            }
            if (dateOption === 'flexible' && (!selectedDateRange.start || !selectedDateRange.end)) {
                toast.error("Please select both start and end dates for your flexible date range.");
                return;
            }
            if (!isDateFlexible && dateOption === 'flexible' && (!selectedDateRange.start || !selectedDateRange.end)) {
                toast.error("Please select a date or indicate that your date is flexible.");
                return;
            }
        } else if (isHouseMoving && step === 2) {
            // House moving: validate dates in step 2
            if (dateOption === 'flexible' && (!selectedDateRange.start || !selectedDateRange.end)) {
                toast.error("Please select both start and end dates for your flexible date range.");
                return;
            }
            if (dateOption === 'fixed' && (!selectedDateRange.start)) {
                toast.error("Please select a moving date.");
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
    // Removed unused incrementItemHouse function

    const incrementItemItemMoving = (itemId: string) => {
        setItemQuantities(prevQuantities => {
            const newQuantities = {
                ...prevQuantities,
                [itemId]: (prevQuantities[itemId] || 0) + 1,
            };
            
            // Check if this increment would exceed the item limit
            const newTotalItems = Object.values(newQuantities)
                .reduce((total, quantity) => total + quantity, 0);
            
            if (newTotalItems > ITEM_TRANSPORT_ITEM_LIMIT) {
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
        // Location validation - ensure addresses are selected from Google Places
        if (!validateLocationInputs()) {
            console.log('❌ Location validation failed');
            return false;
        }

        // Items validation - check if any items are selected
        if (!checkItemsSelected()) {
            console.log('❌ Items validation failed - no items selected');
            return false;
        }

        // Date validation
        if (isItemTransport) {
            if (dateOption === 'fixed' && (!pickupDate || !dropoffDate)) {
                console.log('❌ Date validation failed - missing pickup or dropoff date');
                return false;
            }
            if (dateOption === 'flexible' && (!selectedDateRange.start || !selectedDateRange.end)) {
                console.log('❌ Date validation failed - missing flexible date range');
                return false;
            }
        } else {
            // House moving date validation
            if (dateOption === 'flexible' && (!selectedDateRange.start || !selectedDateRange.end)) {
                console.log('❌ Date validation failed - missing flexible date range');
                return false;
            }
            if (dateOption === 'fixed' && !selectedDateRange.start) {
                console.log('❌ Date validation failed - missing moving date');
                return false;
            }
        }
        
        // Contact info validation - same for both
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

        if (isSubmitting) {
            return;
        }

        if (!isFormValid()) {
            toast.error("Please fill in all required fields correctly.");
            return;
        }

        // Validate blocked dates
        try {
            if (dateOption === 'fixed') {
                if (isItemTransport) {
                    // Check both pickup and dropoff dates for item transport
                    const [pickupBlocked, dropoffBlocked] = await Promise.all([
                        isDateBlocked(pickupDate),
                        isDateBlocked(dropoffDate)
                    ]);
                    if (pickupBlocked) {
                        toast.error("Pickup date is blocked and unavailable for booking.");
                        return;
                    }
                    if (dropoffBlocked) {
                        toast.error("Dropoff date is blocked and unavailable for booking.");
                        return;
                    }
                } else {
                    // Check single date for house moving
                    const blocked = await isDateBlocked(selectedDateRange.start);
                    if (blocked) {
                        toast.error("Selected date is blocked and unavailable for booking.");
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('Error checking blocked dates:', error);
            toast.error("Error validating date availability. Please try again.");
            return;
        }

        setIsSubmitting(true);

        // Generate order number using Supabase RPC
        const { data: generatedOrderNumber, error: orderNumberError } = await supabase
            .rpc('generate_moving_order_number');

        if (orderNumberError) {
            console.error('Error generating order number:', orderNumberError);
            toast.error("Error generating order number. Please try again.");
            setIsSubmitting(false);
            return;
        }

        setOrderNumber(generatedOrderNumber);

        // Use already calculated distance from state
        try {
            const itemList = furnitureItems
                .filter((_, index) => itemQuantities[index] && itemQuantities[index] > 0)
                .map((item, index) => {
                    const quantity = itemQuantities[index];
                    return {
                        id: item.id,
                        name: item.name,
                        quantity: quantity,
                        points: item.points * quantity
                    };
                });

            // Use FormData for file uploads
            const formData = new FormData();
            
            // Add basic information
            formData.append("customerName", `${contactInfo.firstName} ${contactInfo.lastName}`);
            formData.append("email", contactInfo.email);
            formData.append("phone", contactInfo.phone);
            formData.append("serviceType", serviceType);
            formData.append("pickupLocation", JSON.stringify(pickupPlace));
            formData.append("dropoffLocation", JSON.stringify(dropoffPlace));
            formData.append("pickupFloors", floorPickup);
            formData.append("dropoffFloors", floorDropoff);
            formData.append("hasElevatorPickup", elevatorPickup.toString());
            formData.append("hasElevatorDropoff", elevatorDropoff.toString());
            formData.append("items", JSON.stringify(itemList));
            formData.append("hasStudentId", isStudent.toString());
            formData.append("needsAssembly", assembly.toString());
            formData.append("needsExtraHelper", extraHelper.toString());
            formData.append("specialInstructions", extraInstructions);

            // Handle dates based on service type and options
            if (isItemTransport) {
                formData.append("selectedDate", selectedDateRange.start || new Date().toISOString());
            } else if (isHouseMoving) {
                if (dateOption === 'flexible') {
                    formData.append("selectedDate", selectedDateRange.start || new Date().toISOString());
                } else if (dateOption === 'fixed') {
                    formData.append("selectedDate", pickupDate || new Date().toISOString());
                } else {
                    formData.append("selectedDate", new Date().toISOString());
                }
            }

            // Add student ID file if provided
            if (isStudent && studentId) {
                formData.append("studentId", studentId);
            }

            // Add item photos if available
            if (itemPhotos.length > 0) {
                itemPhotos.forEach((photo) => {
                    if (photo instanceof File) {
                        formData.append("itemImages", photo);
                    }
                });
            }

            // Submit to backend API which handles Supabase storage
            const response = await backendPricingService.createTransportRequest(formData);

            if (response.success) {
                toast.success(`Your ${isItemTransport ? 'item transport' : 'house moving'} request has been submitted successfully!`);
                
                // Show confirmation modal for house moving, redirect for item transport
                if (isHouseMoving) {
                    setShowOrderConfirmation(true);
                } else {
                    setTimeout(() => {
                        navigate("/");
                    }, 2000);
                }
            } else {
                toast.error("Failed to submit your request. Please try again.");
            }

        } catch (error) {
            console.error(`Error submitting the ${isItemTransport ? 'item transport' : 'house moving'} request:`, error);
            toast.error("An error occurred while submitting your request.");
        } finally {
            setIsSubmitting(false);
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
    // We're using the unified handleSubmit function for both item transport and house moving
    // Combined pricing summary component for both item transport and house moving
    const PriceSummaryComponent: React.FC<PriceSummaryProps> = ({ pricingBreakdown }) => {
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
                
                {/* Google Maps readiness indicator */}
                {!isGoogleReady && (
                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center text-xs text-blue-700">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-2"></div>
                            <span>Loading Google Maps for accurate distance calculation...</span>
                        </div>
                    </div>
                )}
                
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
                            <div className="text-xs text-gray-500 ml-4">No items selected - please select at least one item to continue</div>
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
                                <span>Student Discount (8.85%):</span>
                                <span>-€{pricingBreakdown.studentDiscount.toFixed(2)}</span>
                            </div>
                        )}
                        {pricingBreakdown.studentDiscount > 0 && !studentId && (
                            <div className="text-xs text-orange-600 ml-4">
                                Upload student ID to apply discount
                            </div>
                        )}
                        {/* Late Booking Fee */}
                    {pricingBreakdown.lateBookingFee > 0 && (
                        <div className="flex justify-between text-red-600">
                            <span>Late Booking Fee:</span>
                            <span>+€{pricingBreakdown.lateBookingFee.toFixed(2)}</span>
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

    // Add a real-time pricing display component that will be shown throughout the process
    const PriceSummaryItem = ({ pricingBreakdown }: { pricingBreakdown: PricingBreakdown | null }) => {
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
        const hasValidBasePricing = pricingBreakdown.basePrice > 0 && firstLocation && secondLocation && 
            (isDateFlexible || selectedDateRange.start || 
             (dateOption === 'fixed' && isItemTransport && pickupDate && dropoffDate) ||
             (dateOption === 'fixed' && isHouseMoving && selectedDateRange.start));
        
        if (!hasValidBasePricing) {
            return (
                <div className="bg-white p-4 rounded-lg shadow-md sticky top-24">
                    <h3 className="font-semibold text-lg mb-3">Your Price Estimate</h3>
                    <p className="text-gray-500">
                        {!firstLocation || !secondLocation ? "Enter both pickup and dropoff locations" : 
                         !isDateFlexible && !selectedDateRange.start && 
                         !(dateOption === 'fixed' && isItemTransport && pickupDate && dropoffDate) &&
                         !(dateOption === 'fixed' && isHouseMoving && selectedDateRange.start) ? "Select a date to see base pricing" : 
                         "Calculating pricing..."}
                    </p>
                </div>
            );
        }

        // Check if approaching or exceeding point limit
        const totalItemPoints = Object.entries(itemQuantities)
            .filter(([_, quantity]) => quantity > 0)
            .reduce((total, [itemId, quantity]) => total + (getItemPoints(itemId) * quantity), 0);
        
        const isApproachingLimit = totalItemPoints >= ITEM_TRANSPORT_ITEM_LIMIT * 2/3; // 200% of limit (40/20)
        const isExceedingLimit = totalItemPoints > ITEM_TRANSPORT_ITEM_LIMIT;
        
        return (
            <div className="bg-white p-4 rounded-lg shadow-md sticky top-24">
                <h3 className="font-semibold text-lg mb-3">Your Price Estimate</h3>
                
                {/* Point Limit Warning */}
                {isApproachingLimit && !isExceedingLimit && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-center">
                            <FaHome className="h-4 w-4 text-yellow-600 mr-2" />
                            <span className="text-sm font-medium text-yellow-800">
                                Approaching item transport limit!
                            </span>
                        </div>
                        <p className="text-xs text-yellow-600 mt-1">
                            Consider house moving for larger moves.
                        </p>
                    </div>
                )}
                
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
                            <div className="text-xs text-gray-500 ml-4">No items selected - please select at least one item to continue</div>
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
                                <span>Student Discount (8.85%):</span>
                                <span>-€{pricingBreakdown.studentDiscount.toFixed(2)}</span>
                            </div>
                        )}
                        {pricingBreakdown.studentDiscount > 0 && !studentId && (
                            <div className="text-xs text-orange-600 ml-4">
                                Upload student ID to apply discount
                            </div>
                        )}
                        {/* Late Booking Fee */}
                    {pricingBreakdown.lateBookingFee > 0 && (
                        <div className="flex justify-between text-red-600">
                            <span>Late Booking Fee:</span>
                            <span>+€{pricingBreakdown.lateBookingFee.toFixed(2)}</span>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {isItemTransport 
                        ? t('itemMoving.title', 'Item Transport') 
                        : t('houseMoving.title', 'House Moving')}
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                    {isItemTransport 
                        ? t('itemMoving.subtitle', 'Transport your items safely and affordably')
                        : t('houseMoving.subtitle', 'Professional house moving services')}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Content - Left 2/3 */}
                    <div className="md:col-span-2">
                        <div className="bg-white shadow-md rounded-lg p-6">
                            {/* Progress Step Indicator */}
                            <div className="flex justify-between mb-8">
                                {[1, 2, 3, 4, 5, 6].map((s) => (
                                    <div 
                                        key={s}
                                        onClick={() => setStep(s)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setStep(s); }}
                                        role="button"
                                        tabIndex={0}
                                        className={`relative flex flex-col items-center cursor-pointer ${s < step ? 'text-green-600' : s === step ? 'text-orange-600' : 'text-gray-400'}`}
                                        title={`Go to step ${s}`}
                                    >
                                        <div className={`rounded-full transition duration-500 ease-in-out h-10 w-10 flex items-center justify-center mb-1 ${s < step ? 'bg-green-600' : s === step ? 'bg-orange-600' : 'bg-gray-200'} ${s <= step ? 'text-white' : 'text-gray-600'}`}>
                                            {s < step ? <FaCheckCircle className="h-6 w-6" /> : s}
                                        </div>
                                        <div className="text-xs text-center">
                                            {s === 1 && (isItemTransport ? 'Pickup Type' : 'Location')}
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
                                    {/* Item Transport: Show pickup type selection */}
                                    {isItemTransport && (
                                        <>
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
                                        </>
                                    )}
                                    
                                    {/* Show location fields for house moving OR after pickup type is selected for item transport */}
                                    {(!isItemTransport || pickupType) && (
                                        <div className={isItemTransport ? "mt-8 space-y-6" : "space-y-6"}>
                                            <div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
                                                    <GooglePlacesAutocomplete
                                                        value={firstLocation}
                                                        onChange={setFirstLocation}
                                                        placeholder="Enter pickup address"
                                                        onPlaceSelect={handlePickupPlaceSelect}
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
                                                        onPlaceSelect={handleDropoffPlaceSelect}
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
                                                
                                                // Pricing calculation will be handled automatically by useEffect with dateConfigId
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
                                            <EnhancedDatePickerInline
                                                value={selectedDateRange.start}
                                                onChange={(iso) => setSelectedDateRange(r => ({ ...r, start: iso }))}
                                                pickupPlace={pickupPlace}
                                                dropoffPlace={dropoffPlace}
                                                serviceType={serviceType}
                                                isOpen={isStartDateOpen}
                                                onOpenChange={(open) => handleCalendarToggle('start', open)}
                                                label="Start Date"
                                                placeholder="Select start date"
                                            />
                                            <EnhancedDatePickerInline
                                                value={selectedDateRange.end}
                                                onChange={(iso: string) => setSelectedDateRange(r => ({ ...r, end: iso }))}
                                                pickupPlace={pickupPlace}
                                                dropoffPlace={dropoffPlace}
                                                serviceType={serviceType}
                                                isOpen={isEndDateOpen}
                                                onOpenChange={(open) => handleCalendarToggle('end', open)}
                                                label="End Date"
                                                placeholder="Select end date"
                                            />
                                        </>
                                    )}
                                                        {dateOption === 'fixed' && (
                        <>
                            {isItemTransport ? (
                                // Item transport: Show both pickup and dropoff dates
                                <>
                                    <EnhancedDatePickerInline
                                        value={pickupDate}
                                        onChange={(iso: string) => { setPickupDate(iso); checkShortTermDate(iso); }}
                                        pickupPlace={pickupPlace}
                                        dropoffPlace={dropoffPlace}
                                        serviceType={serviceType}
                                        isOpen={isPickupDateOpen}
                                        onOpenChange={(open) => handleCalendarToggle('pickup', open)}
                                        label="Pickup Date"
                                        placeholder="Select pickup date"
                                    />
                                    <EnhancedDatePickerInline
                                        value={dropoffDate}
                                        onChange={(iso: string) => { setDropoffDate(iso); checkShortTermDate(iso); }}
                                        pickupPlace={pickupPlace}
                                        dropoffPlace={dropoffPlace}
                                        serviceType={serviceType}
                                        isOpen={isDropoffDateOpen}
                                        onOpenChange={(open) => handleCalendarToggle('dropoff', open)}
                                        label="Dropoff Date"
                                        placeholder="Select dropoff date"
                                    />
                                </>
                            ) : (
                                // House moving: Show only one date
                                <EnhancedDatePickerInline
                                    value={selectedDateRange.start}
                                    onChange={(iso: string) => { setSelectedDateRange({ start: iso, end: '' }); checkShortTermDate(iso); }}
                                    pickupPlace={pickupPlace}
                                    dropoffPlace={dropoffPlace}
                                    serviceType={serviceType}
                                    isOpen={isMovingDateOpen}
                                    onOpenChange={(open) => handleCalendarToggle('moving', open)}
                                    label="Moving Date"
                                    placeholder="Select moving date"
                                />
                            )}
                        </>
                    )}
                                    {(dateOption === 'rehome') && (
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
                                        {(() => {
                                            // Group items by category
                                            const itemsByCategory = furnitureItems.reduce((groups, item) => {
                                                const category = item.category || 'Others';
                                                if (!groups[category]) {
                                                    groups[category] = [];
                                                }
                                                groups[category].push(item);
                                                return groups;
                                            }, {} as Record<string, typeof furnitureItems>);

                                            
                                            return Object.entries(itemsByCategory).map(([categoryName, categoryItems]) => (
                                                <div key={categoryName} className="border border-gray-200 rounded-lg p-4">
                                                    <h3 className="text-md font-medium text-gray-800 mb-3">{categoryName}</h3>
                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                        {categoryItems.map((item, itemIndex) => {
                                                            const itemKey = item.id;
                                                            const quantity = itemQuantities[itemKey] || 0;
                                                            return (
                                                                <div key={itemIndex} className="flex items-center justify-between py-3 px-3 bg-gray-50 rounded-md">
                                                                    <div className="flex-1">
                                                                        <div className="text-sm text-gray-700">{item.name}</div>
                                                                       
                                                                    </div>
                                                                    <div className="flex items-center space-x-2">
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
                                                                            onClick={() => incrementItemItemMoving(itemKey)}
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
                                            ));
                                        })()}
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
                            
                            {/* Step 4: Add-ons */}
                            {step === 4 && (
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-600 mb-4">
                                        Select any additional services you need for your move.
                                    </p>

                                    {/* Carrying Service (moved to top per sequence) */}
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="text-md font-medium text-gray-800 mb-3">Carrying Service</h3>
                                        <p className="text-sm text-gray-600 mb-3">Select if you need help carrying items up or down floors. Pricing is the same per floor for both directions.</p>

                                        {/* Carrying Downstairs */}
                                        <div className="mb-6">
                                            <div className="flex items-center mb-4">
                                                <input
                                                    id="carrying-downstairs"
                                                    type="checkbox"
                                                    checked={carryingDownstairs}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setCarryingDownstairs(checked);
                                                        if (checked) {
                                                            const selectedItems = Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0);
                                                            const newItems: { [key: string]: boolean } = {};
                                                            selectedItems.forEach(itemId => { newItems[itemId] = true; });
                                                            setCarryingDownItems(newItems);
                                                        } else {
                                                            setCarryingDownItems({});
                                                        }
                                                    }}
                                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="carrying-downstairs" className="ml-2 block text-sm text-gray-700">
                                                    Carrying Downstairs
                                                </label>
                                            </div>
                                            {carryingDownstairs && (
                                                <div className="ml-6 space-y-3">
                                                    <div className="flex items-center mb-2">
                                                        <input
                                                            id="select-all-carrying-down"
                                                            type="checkbox"
                                                            checked={selectAllCarryingDown}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setSelectAllCarryingDown(checked);
                                                                const selectedItems = Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0);
                                                                const newItems: { [key: string]: boolean } = {};
                                                                selectedItems.forEach(itemId => { newItems[itemId] = checked; });
                                                                setCarryingDownItems(newItems);
                                                            }}
                                                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                        />
                                                        <label htmlFor="select-all-carrying-down" className="ml-2 block text-sm font-medium text-gray-700">
                                                            Select All
                                                        </label>
                                                    </div>
                                                    {Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0).map((itemId: string, index: number) => {
                                                        const quantity: number = itemQuantities[itemId];
                                                        const itemData = furnitureItems.find(item => item.id === itemId);
                                                        const itemName = itemData ? itemData.name : itemId;
                                                        return (
                                                            <div key={index} className="flex items-center justify-between">
                                                                <div className="flex items-center">
                                                                    <input
                                                                        id={`carrying-down-${itemId}`}
                                                                        type="checkbox"
                                                                        checked={carryingDownItems[itemId] || false}
                                                                        onChange={e => setCarryingDownItems({ ...carryingDownItems, [itemId]: e.target.checked })}
                                                                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                                    />
                                                                    <label htmlFor={`carrying-down-${itemId}`} className="ml-2 block text-sm text-gray-700">
                                                                        {itemName} ({quantity}x)
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Carrying Upstairs */}
                                        <div>
                                            <div className="flex items-center mb-4">
                                                <input
                                                    id="carrying-upstairs"
                                                    type="checkbox"
                                                    checked={carryingUpstairs}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setCarryingUpstairs(checked);
                                                        if (checked) {
                                                            const selectedItems = Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0);
                                                            const newItems: { [key: string]: boolean } = {};
                                                            selectedItems.forEach(itemId => { newItems[itemId] = true; });
                                                            setCarryingUpItems(newItems);
                                                        } else {
                                                            setCarryingUpItems({});
                                                        }
                                                    }}
                                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="carrying-upstairs" className="ml-2 block text-sm text-gray-700">
                                                    Carrying Upstairs
                                                </label>
                                            </div>
                                            {carryingUpstairs && (
                                                <div className="ml-6 space-y-3">
                                                    <div className="flex items-center mb-2">
                                                        <input
                                                            id="select-all-carrying-up"
                                                            type="checkbox"
                                                            checked={selectAllCarryingUp}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setSelectAllCarryingUp(checked);
                                                                const selectedItems = Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0);
                                                                const newItems: { [key: string]: boolean } = {};
                                                                selectedItems.forEach(itemId => { newItems[itemId] = checked; });
                                                                setCarryingUpItems(newItems);
                                                            }}
                                                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                        />
                                                        <label htmlFor="select-all-carrying-up" className="ml-2 block text-sm font-medium text-gray-700">
                                                            Select All
                                                        </label>
                                                    </div>
                                                    {Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0).map((itemId: string, index: number) => {
                                                        const quantity: number = itemQuantities[itemId];
                                                        const itemData = furnitureItems.find(item => item.id === itemId);
                                                        const itemName = itemData ? itemData.name : itemId;
                                                        return (
                                                            <div key={index} className="flex items-center justify-between">
                                                                <div className="flex items-center">
                                                                    <input
                                                                        id={`carrying-up-${itemId}`}
                                                                        type="checkbox"
                                                                        checked={carryingUpItems[itemId] || false}
                                                                        onChange={e => setCarryingUpItems({ ...carryingUpItems, [itemId]: e.target.checked })}
                                                                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                                    />
                                                                    <label htmlFor={`carrying-up-${itemId}`} className="ml-2 block text-sm text-gray-700">
                                                                        {itemName} ({quantity}x)
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="text-md font-medium text-gray-800 mb-3">Assembly</h3>

                                        {/* Disassembly */}
                                        <div className="mb-6">
                                            <div className="flex items-center mb-4">
                                                <input
                                                    id="disassembly-service"
                                                    type="checkbox"
                                                    checked={disassembly}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setDisassembly(checked);
                                                        if (checked) {
                                                            const newDisassemblyItems: { [key: string]: boolean } = {};
                                                            assemblyEligibleSelectedItemIds.forEach(itemId => {
                                                                newDisassemblyItems[itemId] = true;
                                                            });
                                                            setDisassemblyItems(newDisassemblyItems);
                                                        } else {
                                                            // Clear all selections
                                                            setDisassemblyItems({});
                                                        }
                                                    }}
                                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="disassembly-service" className="ml-2 block text-sm text-gray-700">
                                                    Do you need our help with disassembly of items at pickup location?
                                                </label>
                                            </div>
                                            {disassembly && (
                                                <div className="ml-6 space-y-3">
                                                    {assemblyEligibleSelectedItemIds.length === 0 ? (
                                                        <div className="p-2 bg-gray-50 text-gray-600 text-sm rounded">
                                                            None of the selected items are eligible for disassembly service.
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className="text-sm text-gray-600">
                                                                Select which items need disassembly:
                                                            </p>
                                                            {/* Select All checkbox */}
                                                            <div className="flex items-center mb-2">
                                                                <input
                                                                    id="select-all-disassembly"
                                                                    type="checkbox"
                                                                    checked={selectAllDisassembly}
                                                                    onChange={(e) => handleSelectAllDisassembly(e.target.checked)}
                                                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                                />
                                                                <label htmlFor="select-all-disassembly" className="ml-2 block text-sm font-medium text-gray-700">
                                                                    Select All
                                                                </label>
                                                            </div>
                                                            {assemblyEligibleSelectedItemIds.map((itemId: string, index: number) => {
                                                                const quantity = itemQuantities[itemId];
                                                                const itemData = furnitureItems.find(item => item.id === itemId);
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
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Assembly */}
                                        <div>
                                            <div className="flex items-center mb-4">
                                                <input
                                                    id="assembly-service"
                                                    type="checkbox"
                                                    checked={assembly}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setAssembly(checked);
                                                        if (checked) {
                                                            const newAssemblyItems: { [key: string]: boolean } = {};
                                                            assemblyEligibleSelectedItemIds.forEach(itemId => {
                                                                newAssemblyItems[itemId] = true;
                                                            });
                                                            setAssemblyItems(newAssemblyItems);
                                                        } else {
                                                            // Clear all selections
                                                            setAssemblyItems({});
                                                        }
                                                    }}
                                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="assembly-service" className="ml-2 block text-sm text-gray-700">
                                                    Do you need our help with assembly of items at delivery location?
                                                </label>
                                            </div>
                                            {assembly && (
                                                <div className="ml-6 space-y-3">
                                                    {assemblyEligibleSelectedItemIds.length === 0 ? (
                                                        <div className="p-2 bg-gray-50 text-gray-600 text-sm rounded">
                                                            None of the selected items are available for assembly service.
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className="text-sm text-gray-600">
                                                                Select which items need assembly:
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
                                                            {assemblyEligibleSelectedItemIds.map((itemId: string, index: number) => {
                                                                const quantity = itemQuantities[itemId];
                                                                const itemData = furnitureItems.find(item => item.id === itemId);
                                                                const itemName = itemData ? itemData.name : itemId;
                                                                return (
                                                                    <div key={index} className="flex items-center justify-between">
                                                                        <div className="flex items-center">
                                                                            <input
                                                                                id={`assembly-${itemId}`}
                                                                                type="checkbox"
                                                                                checked={assemblyItems[itemId] || false}
                                                                                onChange={(e) => setAssemblyItems({
                                                                                    ...assemblyItems,
                                                                                    [itemId]: e.target.checked
                                                                                })}
                                                                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                                            />
                                                                            <label htmlFor={`assembly-${itemId}`} className="ml-2 block text-sm text-gray-700">
                                                                                {itemName} ({quantity}x)
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
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
                                                I am a student (8.85% discount with valid ID)
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
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-md font-medium text-gray-800">Pickup & Delivery Details</h4>
                                            <button type="button" onClick={() => setStep(1)} className="text-orange-600 text-sm hover:underline">Edit</button>
                                        </div>
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
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-md font-medium text-gray-800">Schedule</h4>
                                            <button type="button" onClick={() => setStep(2)} className="text-orange-600 text-sm hover:underline">Edit</button>
                                        </div>
                                        <div className="text-sm">
                                                                        {dateOption === 'rehome' || isDateFlexible ? (
                                <p><span className="text-gray-500">Date:</span> <span className="font-medium">
                                    {dateOption === 'rehome' ? 'Let ReHome Choose' : 'Flexible'}
                                </span></p>
                            ) : (
                                <p><span className="text-gray-500">Date:</span> <span className="font-medium">
                            {dateOption === 'fixed' && isItemTransport && pickupDate && dropoffDate ? 
                             `Pickup: ${new Date(pickupDate).toLocaleDateString()}, Dropoff: ${new Date(dropoffDate).toLocaleDateString()}` :
                             dateOption === 'fixed' && isHouseMoving && selectedDateRange.start ?
                             `${new Date(selectedDateRange.start).toLocaleDateString()}` :
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
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-md font-medium text-gray-800">Items</h4>
                                            <button type="button" onClick={() => setStep(3)} className="text-orange-600 text-sm hover:underline">Edit</button>
                                        </div>
                                        <ul className="space-y-2 text-sm">
                                            {Object.keys(itemQuantities).map((itemId, index) => {
                                                const quantity = itemQuantities[itemId];
                                                const itemData = furnitureItems.find(item => item.id === itemId);
                                                const itemName = itemData ? itemData.name : itemId;
                                                
                                                return (
                                                    <li key={index} className="flex justify-between">
                                                        <span className="text-gray-600">
                                                            {itemName}
                                                        </span>
                                                        <span className="font-medium">x{quantity}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-md font-medium text-gray-800">Additional Services</h4>
                                            <button type="button" onClick={() => setStep(4)} className="text-orange-600 text-sm hover:underline">Edit</button>
                                        </div>
                                        <ul className="space-y-2 text-sm">
                                            {(pricingBreakdown?.assemblyCost ?? 0) > 0 && (
                                                <>
                                                <li className="flex justify-between">
                                                    <span>Assembly</span>
                                                    <span className="font-medium">€{pricingBreakdown?.assemblyCost?.toFixed(2)}</span>
                                                    </li>
                                                    {Object.keys(disassemblyItems).filter(id => disassemblyItems[id]).length > 0 && (
                                                        <li className="flex justify-between pl-4 text-sm text-gray-600">
                                                            <span>- Disassembly Items: {Object.keys(disassemblyItems).filter(id => disassemblyItems[id]).length}</span>
                                                </li>
                                                    )}
                                                    {Object.keys(assemblyItems).filter(id => assemblyItems[id]).length > 0 && (
                                                        <li className="flex justify-between pl-4 text-sm text-gray-600">
                                                            <span>- Assembly Items: {Object.keys(assemblyItems).filter(id => assemblyItems[id]).length}</span>
                                                        </li>
                                                    )}
                                                </>
                                            )}
                                            {(pricingBreakdown?.extraHelperCost ?? 0) > 0 && (
                                                <li className="flex justify-between">
                                                    <span>Extra Helper</span>
                                                    <span className="font-medium">€{pricingBreakdown?.extraHelperCost.toFixed(2)}</span>
                                                </li>
                                            )}
                                            <li className="flex justify-between">
                                                <span>Carrying Service</span>
                                                <span className="font-medium">{carryingEnabled ? "Yes" : "No"}</span>
                                            </li>
                                            {carryingEnabled && (pricingBreakdown?.carryingCost ?? 0) > 0 && (
                                                <li className="flex justify-between">
                                                    <span>Floor Carrying Cost</span>
                                                    <span className="font-medium">€{pricingBreakdown?.carryingCost.toFixed(2)}</span>
                                                </li>
                                            )}
                                            {typeof pricingBreakdown?.studentDiscount === "number" && pricingBreakdown.studentDiscount > 0 && (
                                                <li className="flex justify-between text-green-600">
                                                    <span>Student Discount (8.85%)</span>
                                                    <span className="font-medium">
                                                        -€{pricingBreakdown.studentDiscount.toFixed(2)}
                                                    </span>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-md font-medium text-gray-800">Contact Information</h4>
                                            <button type="button" onClick={() => setStep(5)} className="text-orange-600 text-sm hover:underline">Edit</button>
                                        </div>
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
                                            disabled={isItemTransport ? (step === 1 && !pickupType) : false}
                                            className={`inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                                                isItemTransport && step === 1 && !pickupType ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'
                                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500`}
                                        >
                                            Next <FaArrowRight className="ml-2 -mr-1 h-5 w-5" />
                                        </button>
                                    ) : (
                                        <button 
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || !isFormValid()}
                                            className={`inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${(isSubmitting || !isFormValid()) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                                        >
                                            {isSubmitting ? t('processing') : t('proceedToCheckout')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                                        {/* Pricing Display - Right 1/3 */}
                    <div className="md:col-span-1">
                        {isItemTransport ? (
                            <PriceSummaryItem 
                                pricingBreakdown={pricingBreakdown}
                            />
                        ) : (
                            <PriceSummaryComponent 
                                pricingBreakdown={pricingBreakdown}
                            />
                        )}
                    </div>
                </div>
            </div>
            
            {/* Order Confirmation Modal */}
            <OrderConfirmationModal
                isOpen={showConfirmationModal}
                onClose={() => setShowConfirmationModal(false)}
                orderNumber={orderNumber}
                isReHomeOrder={false}
                isMovingRequest={true}
            />
            {/* Order Confirmation Modal for House Moving */}
            <OrderConfirmationModal
                isOpen={showOrderConfirmation}
                onClose={() => setShowOrderConfirmation(false)}
                orderNumber={orderNumber}
                isReHomeOrder={false}
                isMovingRequest={true}
            />

            {/* Booking Tips Modal */}
            <BookingTipsModal
                isOpen={showBookingTips}
                onContinue={handleContinueFromTips}
                serviceType={serviceType}
            />

            {/* Point Limit Modal */}
            {showPointLimitModal && serviceType === 'item-transport' && (
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
                                Your selction exceeds our limit for item transport. For Transports of this size we recommend using our house moving service.
                                Your current information will be transferred to the house moving booking process.
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

// Create a wrapper component for House Moving
export const HouseMovingPage: React.FC = () => {
    return <ItemMovingPage serviceType="house-moving" />;
};

export default ItemMovingPage;