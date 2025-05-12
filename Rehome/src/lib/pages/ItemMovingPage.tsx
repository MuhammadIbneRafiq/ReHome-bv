import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaHome, FaStore, FaMinus, FaPlus, FaTruck, FaCube, FaToolbox, FaInfoCircle } from "react-icons/fa";
import { Switch } from "@headlessui/react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import fetchCheckoutUrl from './PricingHook.tsx';
import { useTranslation } from 'react-i18next';

// // Dummy data for demonstration
const cityDayData = {
    "Amsterdam": ["Monday", "Tuesday", "Wednesday"],
    "Rotterdam": ["Thursday", "Friday"]
};
const furnitureItems = [
    { id: "sofa", name: "Sofa", points: 5 },
    { id: "bed", name: "Bed", points: 8 },
    { id: "table", name: "Table", points: 3 }
];


// Define a type for the valid city keys
type City = 'Amsterdam' | 'Rotterdam';  

const itemCategories = [
  { name: "Bathroom Furniture", items: ["Cabinet", "Mirror", "Sink"] },
  { name: "Sofa's and Chairs", items: ["Sofa", "Armchair", "Office Chair", "Chair"] },
  { name: "Tables", items: ["Dining Table", "Coffee Table", "Side Table", "TV Table"] },
  { name: "Appliances", items: ["Washing Machine", "Fridge", "Freezer", "Oven"] },
  { name: "Bedroom", items: ["Bed", "Wardrobe", "Closet", "Drawer"] },
  { name: "Others", items: ["Lamp", "Curtain", "Carpet", "Plant", "Vase", "Kitchen Equipment"] }
];

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

    const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [elevatorPickup, setElevatorPickup] = useState(false);
    const [elevatorDropoff, setElevatorDropoff] = useState(false);
    const [extraHelper, setExtraHelper] = useState(false);
    const [itemQuantities, setItemQuantities] = useState<{ [key: string]: number }>({});
    const [pickupType, setPickupType] = useState<'private' | 'store' | null>(null);
    const [customItem, setCustomItem] = useState(''); // State for custom item input
    const [basePrice, setBasePrice] = useState<number>(50); // Initialize basePrice in state
    const [itemPoints, setItemPoints] = useState<number>(0); // Initialize itemPoints in state
    const [carryingCost, setCarryingCost] = useState<number>(0); // Initialize carryingCost in state
    const [disassemblyCost, setDisassemblyCost] = useState<number>(0); // Initialize disassemblyCost in state
    const [distanceCost, setDistanceCost] = useState<number>(0); // Initialize distanceCost in state
    const [extraHelperCost] = useState<number>(0); // Initialize extraHelperCost in state
    const [isStudent, setIsStudent] = useState(false); // State to track if student ID is required
    const [studentId, setStudentId] = useState<File | null>(null); // State for student ID file
    const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
    const [paymentProof, setPaymentProof] = useState<File | null>(null); // State for payment proof file
    const [isDateFlexible, setIsDateFlexible] = useState(false); // State for flexible date
    const [disassemblyItems, setDisassemblyItems] = useState<{ [key: string]: boolean }>({}); // State to track disassembly items
    const [extraHelperItems, setExtraHelperItems] = useState<{ [key: string]: boolean }>({}); // State to track extra helper items
    const [preferredTimeSpan, setPreferredTimeSpan] = useState(''); // State for preferred time span
    const [selectedItems, setSelectedItems] = useState<{ [item: string]: { quantity: number, photo?: File|null } }>({});
    const [paymentLoading, setPaymentLoading] = useState(false); // State for payment loading

    // Update the function to use the City type
    const checkCityDay = (location: string, date: string): boolean => {
        if (!location || !date) return false;
        const city = getCityFromPostalCode(location) as City; // Type assertion
        if (!city) return false;
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        return cityDayData[city]?.includes(dayOfWeek) || false; // Use the city as a key
    };

    const handleStudentIdUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setStudentId(file || null);
    };
    const getItemPoints = (itemId: string): number => {
        const item = furnitureItems.find(item => item.id === itemId);
        return item ? item.points : 0;
    };

    const getCityFromPostalCode = (postalCode: string): string | null => {
        // Simplified postal code to city mapping - adapt to your data source
        if (postalCode.startsWith("1")) return "Amsterdam";
        if (postalCode.startsWith("5")) return "Eindhoven";
        return null; // Handle unknown postal codes
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
            estimatedPrice,
            selectedDate,
            isDateFlexible,
            elevatorPickup,
            elevatorDropoff,
            extraHelper,
            disassemblyItems,
            extraHelperItems,
            isStudent,
            basePrice,
            itemPoints,
            carryingCost,
            disassemblyCost,
            distanceCost,
            extraHelperCost
        };

        try {
            // Submit the moving request
            const response = await fetch("https://rehome-backend.vercel.app/api/item-moving-requests", {
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


    const stepVariants = {
        hidden: { opacity: 0, x: -50, transition: { duration: 0.3 } },
        visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, x: 50, transition: { duration: 0.3 } },
    };

    const handlePaymentProofUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setPaymentProof(file || null);
    };

    const handleModalSubmit = () => {
        if (paymentProof) {
            // Proceed to the next step if payment proof is uploaded
            nextStep();
            setIsModalOpen(false); // Close the modal
        } else {
            toast.error("Please upload proof of payment."); // Show error if no file is uploaded
        }
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
                                            <option value="morning">Morning (9:00 - 12:00)</option>
                                            <option value="afternoon">Afternoon (12:00 - 17:00)</option>
                                            <option value="evening">Evening (17:00 - 20:00)</option>
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
                                                    {category.items.map((item, itemIndex) => (
                                                        <div key={itemIndex} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                                                            <span className="text-sm text-gray-700">{item}</span>
                                                            <div className="flex items-center space-x-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => decrementItem(`${category.name}-${item}`)}
                                                                    className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                                                                        (itemQuantities[`${category.name}-${item}`] || 0) > 0
                                                                            ? 'border-orange-500 text-orange-500 hover:bg-orange-50'
                                                                            : 'border-gray-300 text-gray-300 cursor-not-allowed'
                                                                    }`}
                                                                    disabled={(itemQuantities[`${category.name}-${item}`] || 0) === 0}
                                                                >
                                                                    <FaMinus className="h-3 w-3" />
                                                                </button>
                                                                <span className="text-sm w-6 text-center">
                                                                    {itemQuantities[`${category.name}-${item}`] || 0}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => incrementItem(`${category.name}-${item}`)}
                                                                    className="w-8 h-8 flex items-center justify-center rounded-full border border-orange-500 text-orange-500 hover:bg-orange-50"
                                                                >
                                                                    <FaPlus className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
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
                                                {Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0).map((item, index) => (
                                                    <div key={index} className="flex items-center">
                                                        <input
                                                            id={`disassembly-${item}`}
                                                            type="checkbox"
                                                            checked={disassemblyItems[item] || false}
                                                            onChange={(e) => setDisassemblyItems({
                                                                ...disassemblyItems,
                                                                [item]: e.target.checked
                                                            })}
                                                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                        />
                                                        <label htmlFor={`disassembly-${item}`} className="ml-2 block text-sm text-gray-700">
                                                            {item.replace(/-/g, ' - ')} ({itemQuantities[item]})
                                                        </label>
                                                    </div>
                                                ))}
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
                                                I need an extra helper for my move (+€15)
                                            </label>
                                        </div>
                                        
                                        {extraHelper && (
                                            <div className="ml-6 space-y-3">
                                                <p className="text-sm text-gray-600">
                                                    Select which items need an extra helper:
                                                </p>
                                                {Object.keys(itemQuantities).filter(item => itemQuantities[item] > 0).map((item, index) => (
                                                    <div key={index} className="flex items-center">
                                                        <input
                                                            id={`helper-${item}`}
                                                            type="checkbox"
                                                            checked={extraHelperItems[item] || false}
                                                            onChange={(e) => setExtraHelperItems({
                                                                ...extraHelperItems,
                                                                [item]: e.target.checked
                                                            })}
                                                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                        />
                                                        <label htmlFor={`helper-${item}`} className="ml-2 block text-sm text-gray-700">
                                                            {item.replace(/-/g, ' - ')} ({itemQuantities[item]})
                                                        </label>
                                                    </div>
                                                ))}
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
                                                    {preferredTimeSpan === 'morning' ? 'Morning (9:00 - 12:00)' : 
                                                     preferredTimeSpan === 'afternoon' ? 'Afternoon (12:00 - 17:00)' : 
                                                     preferredTimeSpan === 'evening' ? 'Evening (17:00 - 20:00)' : 'Anytime'}
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
                                            {disassembly && (
                                                <li className="flex justify-between">
                                                    <span>Disassembly & Reassembly</span>
                                                    <span className="font-medium">€{disassemblyCost.toFixed(2)}</span>
                                                </li>
                                            )}
                                            {extraHelper && (
                                                <li className="flex justify-between">
                                                    <span>Extra Helper</span>
                                                    <span className="font-medium">€15.00</span>
                                                </li>
                                            )}
                                            {carryingCost > 0 && (
                                                <li className="flex justify-between">
                                                    <span>Floor Carrying Cost</span>
                                                    <span className="font-medium">€{carryingCost.toFixed(2)}</span>
                                                </li>
                                            )}
                                            {isStudent && studentId && (
                                                <li className="flex justify-between text-green-600">
                                                    <span>Student Discount (10%)</span>
                                                    <span className="font-medium">-€{(estimatedPrice * 0.1).toFixed(2)}</span>
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
                                                €{isStudent && studentId ? (estimatedPrice * 0.9).toFixed(2) : estimatedPrice?.toFixed(2)}
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

export default ItemMovingPage;