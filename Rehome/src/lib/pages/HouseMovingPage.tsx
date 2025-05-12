import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaTruck, FaMinus, FaPlus, FaCube, FaToolbox, FaInfoCircle } from "react-icons/fa";
import { Switch } from "@headlessui/react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { cityDayData, furnitureItems } from '../../lib/constants.ts'; // Uncomment when you have constants file!
import fetchCheckoutUrl from './PricingHook';
import { useTranslation } from 'react-i18next';

const itemCategories = [
    { name: "Bathroom Furniture", items: ["Cabinet", "Mirror", "Sink"] },
    { name: "Sofa's and Chairs", items: ["Sofa", "Armchair", "Office Chair", "Chair"] },
    { name: "Tables", items: ["Dining Table", "Coffee Table", "Side Table", "TV Table"] },
    { name: "Appliances", items: ["Washing Machine", "Fridge", "Freezer", "Oven"] },
    { name: "Bedroom", items: ["Bed", "Wardrobe", "Closet", "Drawer"] },
    { name: "Others", items: ["Lamp", "Curtain", "Carpet", "Plant", "Vase", "Kitchen Equipment"] }
];

const HouseMovingPage = () => {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [firstLocation, setFirstLocation] = useState('');
    const [secondLocation, setSecondLocation] = useState('');
    const [floorPickup, setFloorPickup] = useState('');
    const [floorDropoff, setFloorDropoff] = useState('');
    const [disassembly, setDisassembly] = useState(false);
    const [contactInfo, setContactInfo] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    });
    const [estimatedPrice, setEstimatedPrice] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [elevatorPickup, setElevatorPickup] = useState(false);
    const [elevatorDropoff, setElevatorDropoff] = useState(false);
    const [extraHelper, setExtraHelper] = useState(false);
    const [itemQuantities, setItemQuantities] = useState({});
    const [isStudent, setIsStudent] = useState(false); // State to track if student ID is required
    const [studentId, setStudentId] = useState(null); // State for student ID file
    const [customItem] = useState(''); // State for custom item input
    // const navigate = useNavigate();
    const [basePrice, setBasePrice] = useState(50); // Initialize basePrice in state
    const [itemPoints, setItemPoints] = useState(0); // Initialize itemPoints in state
    const [carryingCost, setCarryingCost] = useState(0); // Initialize carryingCost in state
    const [disassemblyCost, setDisassemblyCost] = useState(0); // Initialize disassemblyCost in state
    const [distanceCost, setDistanceCost] = useState(0); // Initialize distanceCost in state
    const [extraHelperCost] = useState(0); // Initialize extraHelperCost in state
    const [isDateFlexible, setIsDateFlexible] = useState(false); // State for flexible date
    const [extraHelperItems, setExtraHelperItems] = useState({}); // State to track extra helper items
    const [disassemblyItems, setDisassemblyItems] = useState({}); // State to track disassembly items
    const [preferredTimeSpan, setPreferredTimeSpan] = useState(''); // State for preferred time span
    const [selectedItems, setSelectedItems] = useState({});
    const [paymentLoading, setPaymentLoading] = useState(false);

    const checkCityDay = (location, date) => {
        if (!location || !date) return false;
        const city = getCityFromPostalCode(location);
        if (!city) return false;
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        return cityDayData[city]?.includes(dayOfWeek);
    };

    const getItemPoints = (itemId) => {
        const item = furnitureItems.find(item => item.id === itemId);
        return item ? item.points : 0;
    };

    const getCityFromPostalCode = (postalCode) => {
        // Simplified postal code to city mapping - adapt to your data source
        if (postalCode.startsWith("1")) return "Amsterdam";
        if (postalCode.startsWith("5")) return "Eindhoven";
        return null; // Handle unknown postal codes
    };

    const handleStudentIdUpload = (event) => {
        const file = event.target.files?.[0];
        setStudentId(file || null);
    };

    const calculatePrice = () => {
        let calculatedBasePrice = 50; // Local variable for calculation
        const isCityDay = checkCityDay(firstLocation, selectedDate);
        if (isCityDay) calculatedBasePrice = 40;

        setBasePrice(calculatedBasePrice); // Update state with calculated base price

        let calculatedItemPoints = 0;
        for (const itemId in itemQuantities) {
            if (itemQuantities[itemId] > 0) {
                const points = getItemPoints(itemId);
                calculatedItemPoints += points * itemQuantities[itemId];
            }
        }
        setItemPoints(calculatedItemPoints); // Update state with calculated item points

        const pickupFloor = elevatorPickup ? 1 : Math.max(1, parseInt(floorPickup, 10) || 1);
        const dropoffFloor = elevatorDropoff ? 1 : Math.max(1, parseInt(floorDropoff, 10) || 1);
        const calculatedCarryingCost = (Math.max(0, pickupFloor - 1) + Math.max(0, dropoffFloor - 1)) * 10;
        setCarryingCost(calculatedCarryingCost); // Update state with calculated carrying cost

        const calculatedDisassemblyCost = disassembly ? 20 : 0;
        setDisassemblyCost(calculatedDisassemblyCost); // Update state with calculated disassembly cost

        const distance = firstLocation && secondLocation ? 50 : 0;
        const calculatedDistanceCost = distance * 0.5;
        setDistanceCost(calculatedDistanceCost); // Update state with calculated distance cost

        const totalPrice = calculatedBasePrice + calculatedItemPoints * 3 + calculatedCarryingCost + calculatedDisassemblyCost + calculatedDistanceCost + (extraHelper ? 15 : 0);
        setEstimatedPrice(totalPrice); // Update estimated price
    };

    useEffect(() => {
        calculatePrice();
    }, [itemQuantities, floorPickup, floorDropoff, disassembly, firstLocation, secondLocation, selectedDate, extraHelper, elevatorPickup, elevatorDropoff]);

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

    const incrementItem = (itemId) => {
        setItemQuantities(prevQuantities => ({
            ...prevQuantities,
            [itemId]: (prevQuantities[itemId] || 0) + 1,
        }));
    };

    const decrementItem = (itemId) => {
        setItemQuantities(prevQuantities => {
            const newQuantity = (prevQuantities[itemId] || 0) - 1;
            if (newQuantity <= 0) {
                const { [itemId]: _, ...rest } = prevQuantities;
                return rest;
            }
            return { ...prevQuantities, [itemId]: newQuantity };
        });
    };

    const handleContactInfoChange = (e) => {
        setContactInfo({ ...contactInfo, [e.target.id]: e.target.value });
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

    const handleSubmit = async (e) => {
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
            estimatedPrice,
            selectedDate,
            isDateFlexible,
        };

        try {
            // Submit the house moving request
            const response = await fetch("https://rehome-backend.vercel.app/api/house-moving-requests", {
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
                const emailResponse = await fetch("https://rehome-backend.vercel.app/api/send-email", {
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

            // Redirect to payment after successful submission
            if (estimatedPrice !== null) {
                try {
                    await fetchCheckoutUrl(estimatedPrice);
                } catch (error) {
                    console.error("Error redirecting to payment:", error);
                    toast.error("Failed to redirect to payment page. Please try again.");
                }
            } else {
                toast.error("Could not process payment: invalid price");
            }
        } catch (error) {
            console.error("Error submitting house moving request:", error);
            toast.error("An error occurred while submitting your request.");
        }
    };

    const ElevatorToggle = ({ label, checked, onChange }) => (
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

    const stepVariants = {
        hidden: { opacity: 0, x: -50, transition: { duration: 0.3 } },
        visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, x: 50, transition: { duration: 0.3 } },
    };

    // Add a real-time pricing display component that will be shown throughout the process
    const PriceSummary = ({ 
        basePrice, 
        itemPoints, 
        carryingCost, 
        disassemblyCost, 
        distanceCost, 
        extraHelperCost, 
        isStudent 
    }) => {
        const total = basePrice + (itemPoints * 3) + carryingCost + disassemblyCost + distanceCost + extraHelperCost;
        const discountedTotal = isStudent && studentId ? total * 0.9 : total; // 10% discount for students
        
        return (
            <div className="bg-white p-4 rounded-lg shadow-md sticky top-24">
                <h3 className="font-semibold text-lg mb-3">Your Price Estimate</h3>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span>Base Price:</span>
                        <span>€{basePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Items:</span>
                        <span>€{(itemPoints * 3).toFixed(2)}</span>
                    </div>
                    {carryingCost > 0 && (
                        <div className="flex justify-between">
                            <span>Carrying:</span>
                            <span>€{carryingCost.toFixed(2)}</span>
                        </div>
                    )}
                    {disassemblyCost > 0 && (
                        <div className="flex justify-between">
                            <span>Disassembly:</span>
                            <span>€{disassemblyCost.toFixed(2)}</span>
                        </div>
                    )}
                    {distanceCost > 0 && (
                        <div className="flex justify-between">
                            <span>Distance:</span>
                            <span>€{distanceCost.toFixed(2)}</span>
                        </div>
                    )}
                    {extraHelperCost > 0 && (
                        <div className="flex justify-between">
                            <span>Extra Helper:</span>
                            <span>€{extraHelperCost.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-semibold">
                            <span>Total Estimate:</span>
                            <span>€{total.toFixed(2)}</span>
                        </div>
                        {isStudent && studentId && (
                            <div className="flex justify-between text-green-600 font-semibold">
                                <span>Student Discount (10%):</span>
                                <span>€{discountedTotal.toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Location step component
    const LocationStep = ({ 
        firstLocation, 
        setFirstLocation, 
        secondLocation, 
        setSecondLocation,
        floorPickup,
        setFloorPickup,
        floorDropoff,
        setFloorDropoff,
        elevatorPickup,
        setElevatorPickup,
        elevatorDropoff,
        setElevatorDropoff
    }) => {
        const ElevatorToggle = ({ label, checked, onChange }) => (
            <Switch.Group as="div" className="flex items-center">
                <Switch
                    checked={checked}
                    onChange={onChange}
                    className={`${
                        checked ? 'bg-orange-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2`}
                >
                    <span
                        className={`${
                            checked ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                </Switch>
                <Switch.Label as="span" className="ml-3 text-sm">
                    {label}
                </Switch.Label>
            </Switch.Group>
        );

        return (
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Pickup Address
                    </label>
                    <input
                        type="text"
                        value={firstLocation}
                        onChange={(e) => setFirstLocation(e.target.value)}
                        placeholder="Enter pickup address"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                        required
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
                    <label className="block text-sm font-medium text-gray-700">
                        Dropoff Address
                    </label>
                    <input
                        type="text"
                        value={secondLocation}
                        onChange={(e) => setSecondLocation(e.target.value)}
                        placeholder="Enter dropoff address"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                        required
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
                                <LocationStep 
                                    firstLocation={firstLocation}
                                    setFirstLocation={setFirstLocation}
                                    secondLocation={secondLocation}
                                    setSecondLocation={setSecondLocation}
                                    floorPickup={floorPickup}
                                    setFloorPickup={setFloorPickup}
                                    floorDropoff={floorDropoff}
                                    setFloorDropoff={setFloorDropoff}
                                    elevatorPickup={elevatorPickup}
                                    setElevatorPickup={setElevatorPickup}
                                    elevatorDropoff={elevatorDropoff}
                                    setElevatorDropoff={setElevatorDropoff}
                                />
                            )}

                            {/* Existing Step Components... */}

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
                            basePrice={basePrice} 
                            itemPoints={itemPoints} 
                            carryingCost={carryingCost} 
                            disassemblyCost={disassemblyCost} 
                            distanceCost={distanceCost} 
                            extraHelperCost={extraHelper ? 15 : 0}
                            isStudent={isStudent}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HouseMovingPage; 