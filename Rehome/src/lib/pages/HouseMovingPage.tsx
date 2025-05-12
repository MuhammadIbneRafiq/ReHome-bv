import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaTruck, FaMinus, FaPlus, FaCube, FaToolbox, FaInfoCircle } from "react-icons/fa";
import { Switch } from "@headlessui/react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { cityDayData, furnitureItems } from '../../lib/constants.ts'; // Uncomment when you have constants file!
import fetchCheckoutUrl from './PricingHook';

const itemCategories = [
    { name: "Bathroom Furniture", items: ["Cabinet", "Mirror", "Sink"] },
    { name: "Sofa's and Chairs", items: ["Sofa", "Armchair", "Office Chair", "Chair"] },
    { name: "Tables", items: ["Dining Table", "Coffee Table", "Side Table", "TV Table"] },
    { name: "Appliances", items: ["Washing Machine", "Fridge", "Freezer", "Oven"] },
    { name: "Bedroom", items: ["Bed", "Wardrobe", "Closet", "Drawer"] },
    { name: "Others", items: ["Lamp", "Curtain", "Carpet", "Plant", "Vase", "Kitchen Equipment"] }
];

const HouseMovingPage = () => {
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

    return (
        <div className="min-h-screen bg-gradient-to-r from-yellow-300 to-red-400 py-12 px-8 sm:px-2 lg:px-8">
            <motion.div
                className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <div className='p-12'>
                    <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-6">
                        House Moving Request
                    </h1>

                    {/* Progress Bar */}
                    <div className="flex justify-center space-x-3 mb-8">
                        {[1, 2, 3, 4, 5, 6].map((s) => (
                            <div
                                key={s}
                                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    step === s
                                        ? "bg-orange-500 text-white"
                                        : step > s
                                            ? "bg-green-400 text-white"
                                            : "bg-gray-200 text-gray-500"
                                } transition-colors duration-300`}
                            >
                                {step > s && <FaCheckCircle />}
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col lg:flex-row">
                        <div className="flex-1">
                            <AnimatePresence initial={false} mode="wait">
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        className="space-y-4"
                                        variants={stepVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                    >
                                        {/* Step 1: Address Information */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {/* Start Address A */}
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-700 mb-2">Start address A</h3>
                                                {/* Country */}
                                                <div>
                                                    <label
                                                        htmlFor="countryA"
                                                        className="block text-xs font-medium text-gray-500 mb-1"
                                                    >
                                                        Country
                                                    </label>
                                                    <select
                                                        id="countryA"
                                                        className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full text-sm border-gray-300 rounded-md"
                                                        value="The Netherlands"
                                                    >
                                                        <option>The Netherlands</option>
                                                    </select>
                                                </div>

                                                {/* Postal Code, House Number, Addition */}
                                                <div className="grid grid-cols-3 gap-2 mt-2">
                                                    <div>
                                                        <label
                                                            htmlFor="postalA"
                                                            className="block text-xs font-medium text-gray-500 mb-1"
                                                        >
                                                            Postal
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="postalA"
                                                            value={firstLocation}
                                                            onChange={(e) => setFirstLocation(e.target.value)}
                                                            className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full text-sm border-gray-300 rounded-md"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            htmlFor="houseNumberA"
                                                            className="block text-xs font-medium text-gray-500 mb-1"
                                                        >
                                                            House number
                                                        </label>
                                                        <input
                                                            type="number"
                                                            id="houseNumberA"
                                                            className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full text-sm border-gray-300 rounded-md"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            htmlFor="additionA"
                                                            className="block text-xs font-medium text-gray-500 mb-1"
                                                        >
                                                            Addition
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="additionA"
                                                            className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full text-sm border-gray-300 rounded-md"
                                                        />
                                                    </div>
                                                </div>

                                                {/* City and Street */}
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    <div>
                                                        <label
                                                            htmlFor="cityA"
                                                            className="block text-xs font-medium text-gray-500 mb-1"
                                                        >
                                                            City
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="cityA"
                                                            className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full text-sm border-gray-300 rounded-md"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            htmlFor="streetA"
                                                            className="block text-xs font-medium text-gray-500 mb-1"
                                                        >
                                                            Street
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="streetA"
                                                            className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full text-sm border-gray-300 rounded-md"
                                                        />
                                                        <p className="text-xs text-gray-500 mt-1">Start typing and select your street from the list (auto-complete coming soon).</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* End Address B */}
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-700 mb-2">End address B</h3>
                                                {/* Country */}
                                                <div>
                                                    <label
                                                        htmlFor="countryB"
                                                        className="block text-xs font-medium text-gray-500 mb-1"
                                                    >
                                                        Country
                                                    </label>
                                                    <select
                                                        id="countryB"
                                                        className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full text-sm border-gray-300 rounded-md"
                                                        value="The Netherlands"
                                                    >
                                                        <option>The Netherlands</option>
                                                    </select>
                                                </div>

                                                {/* Postal Code, House Number, Addition */}
                                                <div className="grid grid-cols-3 gap-2 mt-2">
                                                    <div>
                                                        <label
                                                            htmlFor="postalB"
                                                            className="block text-xs font-medium text-gray-500 mb-1"
                                                        >
                                                            Postal
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="postalB"
                                                            value={secondLocation}
                                                            onChange={(e) => setSecondLocation(e.target.value)}
                                                            className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full text-sm border-gray-300 rounded-md"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            htmlFor="houseNumberB"
                                                            className="block text-xs font-medium text-gray-500 mb-1"
                                                        >
                                                            House number
                                                        </label>
                                                        <input
                                                            type="number"
                                                            id="houseNumberB"
                                                            className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full text-sm border-gray-300 rounded-md"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            htmlFor="additionB"
                                                            className="block text-xs font-medium text-gray-500 mb-1"
                                                        >
                                                            Addition
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="additionB"
                                                            className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full text-sm border-gray-300 rounded-md"
                                                        />
                                                    </div>
                                                </div>

                                                {/* City and Street */}
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    <div>
                                                        <label
                                                            htmlFor="cityB"
                                                            className="block text-xs font-medium text-gray-500 mb-1"
                                                        >
                                                            City
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="cityB"
                                                            className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full text-sm border-gray-300 rounded-md"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            htmlFor="streetB"
                                                            className="block text-xs font-medium text-gray-500 mb-1"
                                                        >
                                                            Street
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="streetB"
                                                            className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full text-sm border-gray-300 rounded-md"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Other steps would go here */}
                            </AnimatePresence>

                            {/* Navigation Buttons */}
                            <div className="flex justify-between mt-8">
                                {step > 1 && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ duration: 0.2 }}
                                        onClick={prevStep}
                                        className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200"
                                    >
                                        <FaArrowLeft className="inline-block mr-2" /> Previous
                                    </motion.button>
                                )}
                                {step < 6 && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ duration: 0.2 }}
                                        onClick={nextStep}
                                        className="bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600"
                                    >
                                        Next <FaArrowRight className="inline-block ml-2" />
                                    </motion.button>
                                )}
                                {step === 6 && estimatedPrice !== null && (
                                    <form onSubmit={handleSubmit}>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            transition={{ duration: 0.2 }}
                                            type="submit"
                                            disabled={!isFormValid()}
                                            className={`py-2 px-4 rounded-md ${
                                                isFormValid() 
                                                ? "bg-red-600 text-white hover:bg-red-700" 
                                                : "bg-gray-400 text-gray-200 cursor-not-allowed"
                                            }`}
                                        >
                                            Submit Request
                                        </motion.button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default HouseMovingPage; 