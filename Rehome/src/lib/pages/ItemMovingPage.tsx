import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaHome, FaStore, FaMinus, FaPlus, FaInfoCircle } from "react-icons/fa";
import { Switch } from "@headlessui/react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import createOrder from './PricingHook.tsx';
import { useTranslation } from 'react-i18next';
import LocationAutocomplete from '../../components/ui/LocationAutocomplete';
import { itemCategories, getItemPoints } from '../../lib/constants';
import pricingService, { PricingBreakdown } from '../../services/pricingService';
import API_ENDPOINTS from '../api/config';

const ItemMovingPage = () => {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [disassembly, setDisassembly] = useState(false);
    const [contactInfo, setContactInfo] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    });
    const [firstLocation, setFirstLocation] = useState('');
    const [secondLocation, setSecondLocation] = useState('');
    const [floorPickup, setFloorPickup] = useState('');
    const [floorDropoff, setFloorDropoff] = useState('');

    const [selectedDate, setSelectedDate] = useState('');
    const [elevatorPickup, setElevatorPickup] = useState(false);
    const [elevatorDropoff, setElevatorDropoff] = useState(false);
    const [extraHelper, setExtraHelper] = useState(false);
    const [itemQuantities, setItemQuantities] = useState<{ [key: string]: number }>({});
    const [pickupType, setPickupType] = useState<'private' | 'store' | null>(null);
    const [customItem, setCustomItem] = useState('');
    const [isStudent, setIsStudent] = useState(false);
    const [studentId, setStudentId] = useState<File | null>(null);
    const [isDateFlexible, setIsDateFlexible] = useState(false);
    const [disassemblyItems, setDisassemblyItems] = useState<{ [key: string]: boolean }>({});
    const [extraHelperItems] = useState<{ [key: string]: boolean }>({});
    const [preferredTimeSpan, setPreferredTimeSpan] = useState('');
    const [paymentLoading] = useState(false);
    const [pricingBreakdown, setPricingBreakdown] = useState<PricingBreakdown | null>(null);

    const handleStudentIdUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setStudentId(file || null);
    };

    const calculatePrice = async () => {
        const pricingInput = {
            serviceType: 'item-transport' as const,
            pickupLocation: firstLocation,
            dropoffLocation: secondLocation,
            selectedDate,
            isDateFlexible,
            itemQuantities,
            floorPickup: parseInt(floorPickup) || 0,
            floorDropoff: parseInt(floorDropoff) || 0,
            elevatorPickup,
            elevatorDropoff,
            assemblyItems: disassemblyItems,
            extraHelperItems,
            isStudent,
            hasStudentId: !!studentId,
            isEarlyBooking: false
        };

        try {
            const breakdown = await pricingService.calculateItemTransportPricing(pricingInput);
            setPricingBreakdown(breakdown);
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
    }, [itemQuantities, floorPickup, floorDropoff, disassembly, extraHelper, elevatorPickup, elevatorDropoff, disassemblyItems, extraHelperItems, isStudent, studentId]);

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
            // Basic phone validation (E.164 international format)
            const phoneRegex = /^\+?[1-9]\d{1,14}$/;
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

    const isFormValid = () => {
        if (!selectedDate && !isDateFlexible) return false;
        if (!contactInfo.firstName.trim() || !contactInfo.lastName.trim() || 
            !contactInfo.email.trim() || !contactInfo.phone.trim()) return false;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactInfo.email)) return false;
        
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
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
            pickupType,
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
            elevatorPickup,
            elevatorDropoff,
            extraHelper,
            disassemblyItems,
            extraHelperItems,
            isStudent,
            pricingBreakdown
        };

        try {
            // Submit the moving request
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
                <span className={`${checked ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
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
        
        return (
            <div className="bg-white p-4 rounded-lg shadow-md sticky top-24">
                <h3 className="font-semibold text-lg mb-3">Your Price Estimate</h3>
                <div className="space-y-3">
                    {/* Base Price */}
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
                                        <span>{item.points} pts → €{item.value.toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="text-xs text-gray-500 ml-4 mt-1">
                                    Total item value = {totalItemPoints} points × €1
                                </div>
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
                                            <span>{item.points} pts × {item.multiplier} × €3 = €{item.cost.toFixed(2)}</span>
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
                                    {pricingBreakdown.breakdown.carrying.itemBreakdown.map((item, index) => (
                                        <div key={index} className="flex justify-between text-xs text-gray-600 ml-6">
                                            <span>{item.itemId.replace(/-/g, ' - ')}</span>
                                            <span>{item.points} pts × {item.multiplier} × €3 = €{item.cost.toFixed(2)}</span>
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
                                                    <ElevatorToggle
                                                        label="Elevator available at pickup location"
                                                        checked={elevatorPickup}
                                                        onChange={setElevatorPickup}
                                                    />
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
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Preferred Date
                                        </label>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                            disabled={isDateFlexible}
                                        />
                                    </div>
                                    
                                    <div className="flex items-center mt-2">
                                        <input
                                            id="date-flexibility"
                                            type="checkbox"
                                            checked={isDateFlexible}
                                            onChange={(e) => {
                                                setIsDateFlexible(e.target.checked);
                                                if (e.target.checked) setSelectedDate('');
                                            }}
                                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="date-flexibility" className="ml-2 block text-sm text-gray-600">
                                            My schedule is flexible
                                        </label>
                                    </div>
                                    
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
                                    
                                    <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                                        <h3 className="text-sm font-medium text-blue-800 flex items-center">
                                            <FaInfoCircle className="mr-2" /> Pricing Information
                                        </h3>
                                        <p className="mt-1 text-sm text-blue-700">
                                            Weekday rates apply Monday through Friday. Weekend rates (Saturday/Sunday) have a 15% surcharge.
                                        </p>
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
                                        {itemCategories.map((category, index) => (
                                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                                <h3 className="text-md font-medium text-gray-800 mb-3">{category.name}</h3>
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                    {category.items.map((item, itemIndex) => {
                                                        const itemKey = item.id;
                                                        const points = getItemPoints(itemKey);
                                                        const quantity = itemQuantities[itemKey] || 0;
                                                        const itemValue = points * quantity * 1; // €1 per point for item transport
                                                        
                                                        return (
                                                            <div key={itemIndex} className="flex items-center justify-between py-3 px-3 bg-gray-50 rounded-md">
                                                                <div className="flex-1">
                                                                    <div className="text-sm text-gray-700">{item.name}</div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {points} points = €{points.toFixed(2)} each
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
                                                                        className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                                                                            quantity > 0
                                                                                ? 'border-orange-500 text-orange-500 hover:bg-orange-50'
                                                                                : 'border-gray-300 text-gray-300 cursor-not-allowed'
                                                                        }`}
                                                                        disabled={quantity === 0}
                                                                    >
                                                                        <FaMinus className="h-3 w-3" />
                                                                    </button>
                                                                    <span className="text-sm w-6 text-center">
                                                                        {quantity}
                                                                    </span>
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
                                    
                                    <div className="mt-6">
                                        <label htmlFor="custom-item" className="block text-sm font-medium text-gray-700">
                                            Add a custom item (if not listed above)
                                        </label>
                                        <div className="mt-1 flex rounded-md shadow-sm">
                                            <input
                                                type="text"
                                                id="custom-item"
                                                value={customItem}
                                                onChange={(e) => setCustomItem(e.target.value)}
                                                placeholder="Enter item name"
                                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border-gray-300 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (customItem.trim()) {
                                                        incrementItem(`Custom-${customItem.trim()}`);
                                                        setCustomItem('');
                                                    }
                                                }}
                                                disabled={!customItem.trim()}
                                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                            >
                                                Add
                                            </button>
                                        </div>
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
                                                I need items disassembled and/or reassembled
                                            </label>
                                        </div>
                                        
                                        {disassembly && (
                                            <div className="ml-6 space-y-3">
                                                <p className="text-sm text-gray-600">
                                                    Select which items need disassembly/reassembly:
                                                </p>
                                                {Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0).map((itemId, index) => {
                                                    const points = getItemPoints(itemId);
                                                    const quantity = itemQuantities[itemId];
                                                    const multiplier = points <= 6 ? 0.5 : 0.7; // Assembly multiplier based on item value
                                                    const assemblyPoints = points * multiplier * quantity;
                                                    const assemblyCost = assemblyPoints * 3; // €3 per point for add-ons
                                                    
                                                    // Find the item data to get the proper name
                                                    const itemData = itemCategories
                                                        .flatMap(category => category.items)
                                                        .find(item => item.id === itemId);
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
                                                            <div className="text-xs text-gray-500">
                                                                {points} pts × {multiplier} × {quantity} × €3 = €{assemblyCost.toFixed(2)}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="text-md font-medium text-gray-800 mb-3">Extra Helper</h3>
                                        <div className="flex items-center mb-4">
                                            <input
                                                id="extra-helper"
                                                type="checkbox"
                                                checked={extraHelper}
                                                onChange={(e) => setExtraHelper(e.target.checked)}
                                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="extra-helper" className="ml-2 block text-sm text-gray-700">
                                                I need an extra helper for my move (+€50)
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
                                            <input
                                                type="tel"
                                                id="phone"
                                                value={contactInfo.phone}
                                                onChange={handleContactInfoChange}
                                                className="mt-1 focus:ring-orange-500 focus:border-orange-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                                placeholder="+31 6 12345678"
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4">
                                        <div className="flex items-center">
                                            <input
                                                id="agree-terms"
                                                type="checkbox"
                                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                required
                                            />
                                            <label htmlFor="agree-terms" className="ml-2 text-sm text-gray-700">
                                                I agree to the <a href="#" className="text-orange-600 hover:text-orange-500">Terms and Conditions</a> and <a href="#" className="text-orange-600 hover:text-orange-500">Privacy Policy</a>
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
                                            {isDateFlexible ? (
                                                <p><span className="text-gray-500">Date:</span> <span className="font-medium">Flexible</span></p>
                                            ) : (
                                                <p><span className="text-gray-500">Date:</span> <span className="font-medium">{new Date(selectedDate).toLocaleDateString()}</span></p>
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
                                            {Object.keys(itemQuantities).map((item, index) => (
                                                <li key={index} className="flex justify-between">
                                                    <span>{item.replace(/-/g, ' - ')}</span>
                                                    <span className="font-medium">x{itemQuantities[item]}</span>
                                                </li>
                                            ))}
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
                                            {pricingBreakdown?.carryingCost && pricingBreakdown.carryingCost > 0 && (
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
        </div>
    );
};

export default ItemMovingPage;