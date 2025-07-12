import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaMinus, FaPlus, FaInfoCircle, FaToolbox } from "react-icons/fa";
import { Switch } from "@headlessui/react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { itemCategories, getItemPoints } from '../../lib/constants';
import createOrder from './PricingHook.tsx';
import { useTranslation } from 'react-i18next';
import LocationAutocomplete from '../../components/ui/LocationAutocomplete';
import pricingService, { PricingBreakdown, PricingInput } from '../../services/pricingService';
import API_ENDPOINTS from '../api/config';
import { PhoneNumberInput } from '@/components/ui/PhoneNumberInput';

// Define interfaces for component props
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

const HouseMovingPage = () => {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [firstLocation, setFirstLocation] = useState('');
    const [secondLocation, setSecondLocation] = useState('');
    const [floorPickup, setFloorPickup] = useState('');
    const [floorDropoff, setFloorDropoff] = useState('');
    const [disassembly, setDisassembly] = useState(false);
    const [contactInfo, setContactInfo] = useState<ContactInfo>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        isPhoneValid: false
    });
    const [selectedDate, setSelectedDate] = useState('');
    const [elevatorPickup, setElevatorPickup] = useState(false);
    const [elevatorDropoff, setElevatorDropoff] = useState(false);
    const [extraHelper, setExtraHelper] = useState(false);
    const [itemQuantities, setItemQuantities] = useState<ItemQuantities>({});
    const [isStudent, setIsStudent] = useState(false);
    const [studentId, setStudentId] = useState<File | null>(null);
    const [isDateFlexible, setIsDateFlexible] = useState(false);
    const [extraHelperItems] = useState<{[key: string]: boolean}>({});
    const [disassemblyItems, setDisassemblyItems] = useState<{[key: string]: boolean}>({});
    const [preferredTimeSpan, setPreferredTimeSpan] = useState('');
    const [paymentLoading] = useState(false);
    const [pricingBreakdown, setPricingBreakdown] = useState<PricingBreakdown | null>(null);

    const handleStudentIdUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];
        setStudentId(file || null);
    };

    const calculatePrice = async () => {
        if (!firstLocation || !secondLocation) {
            setPricingBreakdown(null);
            return;
        }

        try {
            const input: PricingInput = {
                serviceType: 'house-moving',
                pickupLocation: firstLocation,
                dropoffLocation: secondLocation,
                selectedDate: selectedDate || '',
                isDateFlexible: isDateFlexible,
                itemQuantities: itemQuantities,
                floorPickup: parseInt(floorPickup) || 0,
                floorDropoff: parseInt(floorDropoff) || 0,
                elevatorPickup,
                elevatorDropoff,
                assemblyItems: disassemblyItems,
                extraHelperItems,
                isStudent,
                hasStudentId: !!studentId,
                isEarlyBooking: false // This would be determined by checking calendar availability
            };

            // Use async pricing calculation
            const result = await pricingService.calculatePricing(input);
            setPricingBreakdown(result);
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
                console.log('💰 Calculating price for:', firstLocation, '→', secondLocation);
                calculatePrice();
            } else {
                // Clear price if locations are incomplete
                setPricingBreakdown(null);
                console.log('⏳ Waiting for complete locations...');
            }
        }, 400); // 400ms debounce - faster pricing updates

        return () => clearTimeout(debounceTimer);
    }, [firstLocation, secondLocation, selectedDate, isDateFlexible]);

    // Immediate price calculation for non-location changes
    useEffect(() => {
        if (firstLocation && secondLocation) {
            calculatePrice();
        }
    }, [itemQuantities, floorPickup, floorDropoff, elevatorPickup, elevatorDropoff, disassembly, disassemblyItems, extraHelperItems, extraHelper, isStudent, studentId]);

    const nextStep = () => {
        // Validate date selection in step 4
        if (step === 4 && !selectedDate && !isDateFlexible) {
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
        }

        if (step < 6) setStep(step + 1);
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const incrementItem = (itemId: string) => {
        setItemQuantities(prevQuantities => ({
            ...prevQuantities,
            [itemId]: (prevQuantities[itemId] || 0) + 1,
        }));
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

    const isFormValid = () => {
        if (!selectedDate && !isDateFlexible) return false;
        if (!contactInfo.firstName.trim() || !contactInfo.lastName.trim() || 
            !contactInfo.email.trim() || !contactInfo.phone.trim()) return false;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactInfo.email)) return false;
        
        const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 international format
        if (!phoneRegex.test(contactInfo.phone)) return false;
        
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isFormValid()) {
            toast.error("Please fill in all required fields correctly.");
            return;
        }

        const payload = {
            firstLocation,
            secondLocation,
            itemQuantities,
            floorPickup,
            floorDropoff,
            disassembly,
            contactInfo,
            estimatedPrice: pricingBreakdown?.total || 0,
            selectedDate,
            isDateFlexible,
            pricingBreakdown,
        };

        try {
            // Submit the house moving request
            const response = await fetch(API_ENDPOINTS.MOVING.HOUSE_REQUEST, {
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

            // Send confirmation email
            try {
                const emailResponse = await fetch(API_ENDPOINTS.EMAIL.SEND, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: contactInfo.email,
                        firstName: contactInfo.firstName,
                        lastName: contactInfo.lastName
                    }),
                });
                
                if (emailResponse.ok) {
                    console.log("Confirmation email sent successfully");
                } else {
                    console.error("Failed to send confirmation email");
                }
            } catch (emailError) {
                console.error("Error sending confirmation email:", emailError);
            }

            toast.success("Request submitted successfully! Check your email for confirmation.", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });

            // Redirect to order creation after successful submission
            const finalPrice = pricingBreakdown?.total || 0;
            if (finalPrice > 0) {
                try {
                    const orderResult = await createOrder({
                        items: Object.entries(itemQuantities)
                            .filter(([_, quantity]) => quantity > 0)
                            .map(([itemId, quantity]) => ({
                                itemId,
                                quantity,
                                name: itemId.replace(/-/g, ' - '),
                                points: getItemPoints(itemId) * quantity
                            })),
                        totalAmount: finalPrice,
                        userId: localStorage.getItem('userId') || undefined
                    });
                    
                    if (orderResult.success) {
                        toast.success(`Order created successfully! Order #${orderResult.orderNumber}`);
                    } else {
                        throw new Error(orderResult.error || 'Failed to create order');
                    }
                } catch (error) {
                    console.error("Error creating order:", error);
                    toast.error("Failed to create order. Please try again.");
                }
            } else {
                toast.error("Could not process order: invalid price");
            }
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
        const hasValidBasePricing = pricingBreakdown.basePrice > 0 && firstLocation && secondLocation && selectedDate;
        
        if (!hasValidBasePricing) {
            return (
                <div className="bg-white p-4 rounded-lg shadow-md sticky top-24">
                    <h3 className="font-semibold text-lg mb-3">Your Price Estimate</h3>
                    <p className="text-gray-500">
                        {!selectedDate ? "Select a date to see base pricing" : "Enter both pickup and dropoff locations"}
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
                            {pricingBreakdown.breakdown.baseCharge.city} - {
                                pricingBreakdown.breakdown.baseCharge.isEarlyBooking ? "Early booking (50% off)" :
                                pricingBreakdown.breakdown.baseCharge.isCityDay ? "City day rate" : "Normal rate"
                            }
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span>Items:</span>
                        <span>€{pricingBreakdown.itemValue.toFixed(2)}</span>
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
                            <span>Carrying:</span>
                            <span>€{pricingBreakdown.carryingCost.toFixed(2)}</span>
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
                        <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                            <span>Total:</span>
                            <span>€{pricingBreakdown.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };



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
                                        <LocationAutocomplete
                                            label="Pickup Address"
                                            value={firstLocation}
                                            onChange={(value) => setFirstLocation(value)}
                                            placeholder="Enter pickup address"
                                            required
                                            countryCode="nl"
                                        />
                                        
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
                                                    <span className={`${elevatorPickup ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                                </Switch>
                                                <span className="ml-2 text-sm text-gray-700">Elevator available at pickup location</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <LocationAutocomplete
                                            label="Dropoff Address"
                                            value={secondLocation}
                                            onChange={(value) => setSecondLocation(value)}
                                            placeholder="Enter dropoff address"
                                            required
                                            countryCode="nl"
                                        />
                                        
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
                                                    <span className={`${elevatorDropoff ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
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
                                        <label className="block text-sm font-medium text-gray-700">
                                            Select Moving Date
                                        </label>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                            min={new Date().toISOString().split('T')[0]} // Set minimum date to today
                                        />
                                        <div className="mt-2 flex items-center">
                                            <input
                                                type="checkbox"
                                                id="flexible-date"
                                                checked={isDateFlexible}
                                                onChange={(e) => setIsDateFlexible(e.target.checked)}
                                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="flexible-date" className="ml-2 block text-sm text-gray-700">
                                                My date is flexible, ReHome can suggest a suitable date
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <div>
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
                                    
                                    <div className="mt-4 bg-orange-100 p-4 rounded-lg">
                                        <div className="flex items-start">
                                            <FaInfoCircle className="text-orange-600 mt-1 flex-shrink-0" />
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-gray-900">Availability Information</h3>
                                                <p className="mt-1 text-sm text-gray-700">
                                                    Our team operates in most major cities daily. In Amsterdam we offer service 7 days a week. 
                                                    Selecting a flexible date may help us accommodate your request more easily and can sometimes result in faster service.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Step 3: Items Selection */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-600 mb-4">
                                        Select the items you need to move. This helps us estimate the size of vehicle and resources needed.
                                    </p>
                                    
                                    {itemCategories.map((category) => (
                                        <div key={category.name} className="mb-6">
                                            <h3 className="text-lg font-medium text-gray-900 mb-3">{category.name}</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {category.items.map((item) => {
                                                    const itemId = item.id;
                                                    return (
                                                        <div key={itemId} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                                                            <span className="text-gray-800">{item.name}</span>
                                                            <div className="flex items-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => decrementItem(itemId)}
                                                                    disabled={!itemQuantities[itemId]}
                                                                    className={`p-1 rounded-full ${
                                                                        !itemQuantities[itemId] ? 'text-gray-300' : 'text-orange-600 hover:bg-orange-100'
                                                                    }`}
                                                                >
                                                                    <FaMinus className="h-4 w-4" />
                                                                </button>
                                                                <span className="w-8 text-center">{itemQuantities[itemId] || 0}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => incrementItem(itemId)}
                                                                    className="p-1 rounded-full text-orange-600 hover:bg-orange-100"
                                                                >
                                                                    <FaPlus className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <div className="mt-6">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Special instructions for your items (optional)
                                        </label>
                                        <textarea
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                            rows={3}
                                            placeholder="e.g., Fragile items, special handling requirements, etc."
                                        ></textarea>
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
                                                    <span className="text-gray-700">
                                                        {disassembly && Object.values(disassemblyItems).filter(Boolean).length > 0
                                                          ? `€${Math.max(20, Object.values(disassemblyItems).filter(Boolean).length * 5)}`
                                                          : '€20'
                                                        }
                                                    </span>
                                                </div>
                                                <p className="text-gray-500 text-sm mt-1">
                                                    We'll disassemble furniture at pickup and reassemble at dropoff
                                                </p>
                                                <div className="mt-2">
                                                    <Switch
                                                        checked={disassembly}
                                                        onChange={setDisassembly}
                                                        className={`${disassembly ? 'bg-orange-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2`}
                                                        id="disassembly-toggle"
                                                    >
                                                        <span className={`${disassembly ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                                    </Switch>
                                                </div>
                                                
                                                {disassembly && (
                                                    <div className="mt-4 ml-2 space-y-2">
                                                        <p className="text-sm text-gray-600">
                                                            Select which items need disassembly & reassembly:
                                                        </p>
                                                        {Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0).map((itemId, index) => {
                                                            const itemData = itemCategories
                                                                .find(category => category.items.some(i => i.id === itemId));
                                                            const itemName = itemData ? itemData.items.find(i => i.id === itemId)?.name : itemId;
                                                            
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
                                                    <span className="text-gray-700">
                                                        €35
                                                    </span>
                                                </div>
                                                <p className="text-gray-500 text-sm mt-1">
                                                    Add an extra helper for heavy or numerous items
                                                </p>
                                                <div className="mt-2">
                                                    <Switch
                                                        checked={extraHelper}
                                                        onChange={setExtraHelper}
                                                        className={`${extraHelper ? 'bg-orange-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2`}
                                                        id="extra-helper-toggle"
                                                    >
                                                        <span className={`${extraHelper ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                                    </Switch>
                                                </div>
                                                

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
                                                        <span className={`${isStudent ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
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
                                    
                                    <div className="mt-4">
                                        <div className="flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id="terms"
                                                    name="terms"
                                                    type="checkbox"
                                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <label htmlFor="terms" className="font-medium text-gray-700">
                                                    I agree to the Terms and Conditions
                                                </label>
                                                <p className="text-gray-500">
                                                    By proceeding, you agree to our <a href="#" className="text-orange-600 hover:text-orange-800">Terms of Service</a> and <a href="#" className="text-orange-600 hover:text-orange-800">Privacy Policy</a>.
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
                                                    : selectedDate 
                                                        ? new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
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
                                                        const itemData = itemCategories
                                                            .find(category => category.items.some(i => i.id === itemId));
                                                        const itemName = itemData ? itemData.items.find(i => i.id === itemId)?.name : itemId;
                                                        
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
                                            </ul>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <div className="flex">
                                            <FaInfoCircle className="h-5 w-5 text-green-500" />
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-green-800">Next Steps</h3>
                                                <div className="mt-2 text-sm text-green-700">
                                                    <p>
                                                        After submitting your request, you'll receive a confirmation email. 
                                                        Our team will review your requirements and contact you within 24 hours 
                                                        to confirm all details. Payment will be processed after confirmation.
                                                    </p>
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
        </div>
    );
};

export default HouseMovingPage; 