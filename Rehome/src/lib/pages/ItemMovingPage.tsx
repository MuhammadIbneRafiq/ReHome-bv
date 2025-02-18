import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaHome, FaStore, FaMinus, FaPlus } from "react-icons/fa";
import { Switch } from "@headlessui/react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

const ItemMovingPage = () => {
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
    const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [elevatorPickup, setElevatorPickup] = useState(false);
    const [elevatorDropoff, setElevatorDropoff] = useState(false);
    const [extraHelper, setExtraHelper] = useState(false);
    const [itemQuantities, setItemQuantities] = useState<{ [key: string]: number }>({});
    const [pickupType, setPickupType] = useState<'private' | 'store' | null>(null);
    const [privateSource, setPrivateSource] = useState<'family' | 'marketplace' | null>(null); // For pickup from private

    const checkCityDay = (location: string, date: string): boolean => {
        if (!location || !date) return false;
        const city = getCityFromPostalCode(location);
        if (!city) return false;
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        return cityDayData[city]?.includes(dayOfWeek);
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
        let basePrice = 50;
        const isCityDay = checkCityDay(firstLocation, selectedDate);
        if (isCityDay) basePrice = 40;

        let itemPoints = 0;
        for (const itemId in itemQuantities) {
            if (itemQuantities[itemId] > 0) {
                const points = getItemPoints(itemId);
                itemPoints += points * itemQuantities[itemId];
            }
        }

        const pickupFloor = elevatorPickup ? 1 : Math.max(1, parseInt(floorPickup, 10) || 1);
        const dropoffFloor = elevatorDropoff ? 1 : Math.max(1, parseInt(floorDropoff, 10) || 1);
        let carryingCost = (Math.max(0, pickupFloor - 1) + Math.max(0, dropoffFloor - 1)) * 10;

        let disassemblyCost = disassembly ? 20 : 0;

        const distance = firstLocation && secondLocation ? 50 : 0;
        const distanceCost = distance * 0.5;

        const totalPrice = basePrice + itemPoints * 3 + carryingCost + disassemblyCost + distanceCost + (extraHelper ? 15 : 0);
        setEstimatedPrice(totalPrice);
    };

    useEffect(() => {
        calculatePrice();
    }, [itemQuantities, floorPickup, floorDropoff, disassembly, firstLocation, secondLocation, selectedDate, extraHelper, elevatorPickup, elevatorDropoff]);

    const goToNextStep = () => {
        // Private Home flow
        if (isPrivateType()) {
            if (step === 1 && privateSource === 'marketplace') {
                alert("We are only here for the transportation. Payment for the item must be handled by yourself.");
            }
        }
         if (step < getTotalStep()) setStep(step + 1);
    };

    const getTotalStep = () => {
        if (isPrivateType()) {
            return 7; // Private home flow has 7 steps
        } else if (isStoreType()) {
            return 5; // Store flow has 5 steps
        } else {
            return 1; // Initial state
        }
    };
    const hasSelectedSource = () => privateSource !== null;

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted", {
            firstLocation, secondLocation, itemQuantities, floorPickup, floorDropoff, disassembly, contactInfo, estimatedPrice, selectedDate
        });
        toast.success('Moving request submitted (mock)!', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
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

    const handlePickupType = (type: 'private' | 'store') => {
        setPickupType(type);
        setStep(2); // Automatically go to Step 2 after selection
    };

    // Determine maximum steps based on pickup type
    const maxSteps = () => {
        return pickupType === 'store' ? 5 : 7;
    };

    const isPrivateType = () => pickupType === 'private'
    const isStoreType = () => pickupType === 'store'

    return (
        <div className="min-h-screen bg-gradient-to-r from-yellow-300 to-red-400 py-12 px-4 sm:px-6 lg:px-8">
            <motion.div
                className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <form onSubmit={handleSubmit} className="p-6">
                    <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-6">
                        Item Moving Request
                    </h1>

                    {/* Progress Bar */}
                    <div className="flex justify-center space-x-3 mb-8">
                         {Array.from({ length: (isPrivateType() ? 7 : 5) }, (_, i) => i + 1).map((s) => (
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
                                {/* Step 1: Pickup Selection */}
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Where do we pick it up?</h2>
                                <div className="grid grid-cols-1 gap-4">
                                    {/* From a private home */}
                                    <button
                                        onClick={() => handlePickupType('private')}
                                        className="flex flex-row items-start p-4 border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
                                    >
                                        <FaHome className="h-6 w-6 text-blue-500 mt-1 mr-3" /> {/* Icon sizing and alignment */}
                                        <div className="flex flex-col">
                                            <h3 className="text-base font-medium text-gray-700 text-left">From a private home</h3>
                                            <p className="text-sm text-gray-500 text-left mt-1">From someone you know or via an online marketplace</p>
                                        </div>
                                    </button>

                                    {/* From a store */}
                                    <button
                                        onClick={() => handlePickupType('store')}
                                        className="flex flex-row items-start p-4 border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
                                    >
                                        <FaStore className="h-6 w-6 text-blue-500 mt-1 mr-3" /> {/* Icon sizing and alignment */}
                                        <div className="flex flex-col">
                                            <h3 className="text-base font-medium text-gray-700 text-left">From a store</h3>
                                            <p className="text-sm text-gray-500 mt-1">For example from a furniture store</p>
                                        </div>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                         {step === 2 && pickupType === 'private' && (
                            <motion.div
                                key="Step2Private"
                                className="space-y-4"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {/* Step 2: Source Selection for Private Home */}
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Item Source</h2>
                                <button
                                    onClick={() => {
                                        setPrivateSource('family');
                                        goToNextStep();
                                    }}
                                    className="flex flex-row items-start p-4 border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
                                >
                                    <div>
                                        <h3 className="text-base font-medium text-gray-700 text-left">From Family/Friends</h3>
                                        <p className="text-sm text-gray-500 text-left mt-1">Item is from someone you know.</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => {
                                        setPrivateSource('marketplace');
                                        goToNextStep();
                                    }}
                                    className="flex flex-row items-start p-4 border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
                                >
                                    <div>
                                        <h3 className="text-base font-medium text-gray-700 text-left">From Marketplace</h3>
                                        <p className="text-sm text-gray-500 text-left mt-1">Item was bought or sold on an online marketplace.</p>
                                    </div>
                                </button>
                            </motion.div>
                        )}
                        {step === 3 && pickupType === 'private' && hasSelectedSource() && (
                            <motion.div
                                key="step3"
                                className="space-y-4"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {/* Step 3: Item Selection and Add-ons (for Private Home) */}
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Item Selection & Add-ons</h2>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Item List (Select Items)</label>
                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Force 2 columns */}
                                        {furnitureItems.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between px-4 py-2 rounded-md shadow-sm bg-white">
                                                <span className="text-sm font-medium text-gray-700">{item.name}</span>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => decrementItem(item.id)}
                                                        disabled={!itemQuantities[item.id]}
                                                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-2 rounded-full focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <FaMinus className="h-4 w-4" />
                                                    </button>
                                                    <span className="text-base font-semibold text-gray-800">{itemQuantities[item.id] || 0}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => incrementItem(item.id)}
                                                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-2 rounded-full focus:outline-none focus:shadow-outline"
                                                    >
                                                        <FaPlus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {step === 4 && pickupType === 'private' && hasSelectedSource() &&(
                            <motion.div
                                key="step4"
                                className="space-y-4"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {/* Step 4: Carrying Upstairs & (Dis)assembly */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="floorPickup" className="block text-sm font-medium text-gray-700">Floor (Pickup)</label>
                                        <input
                                            type="number"
                                            id="floorPickup"
                                            value={floorPickup}
                                            onChange={(e) => setFloorPickup(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                            placeholder="e.g., 2 (2nd Floor)"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="floorDropoff" className="block text-sm font-medium text-gray-700">Floor (Drop-off)</label>
                                        <input
                                            type="number"
                                            id="floorDropoff"
                                            value={floorDropoff}
                                            onChange={(e) => setFloorDropoff(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                            placeholder="e.g., 1 (Ground Floor)"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 relative flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="disassembly"
                                            type="checkbox"
                                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                            checked={disassembly}
                                            onChange={(e) => setDisassembly(e.target.checked)}
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="disassembly" className="font-medium text-gray-700">Require disassembly?</label>
                                    </div>
                                </div>
                                {/* Elevator Toggles */}
                                <ElevatorToggle
                                    label="Elevator available at Pickup?"
                                    checked={elevatorPickup}
                                    onChange={setElevatorPickup}
                                />
                                <ElevatorToggle
                                    label="Elevator available at Dropoff?"
                                    checked={elevatorDropoff}
                                    onChange={setElevatorDropoff}
                                />
                            </motion.div>
                        )}

                        {step === 5 && pickupType === 'private' && hasSelectedSource() &&(
                            <motion.div
                                key="step5"
                                className="space-y-4"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {/* Step 5: Date and Time Selection */}
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Date and Time</h2>
                                <div>
                                    <label htmlFor="selectedDate" className="block text-sm font-medium text-gray-700">
                                        Preferred Date
                                    </label>
                                    <input
                                        type="date"
                                        id="selectedDate"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                    />
                                </div>
                                {/* Flexble dates yes or no */}
                            </motion.div>
                        )}

                        {step === 6 && pickupType === 'private' && hasSelectedSource() &&(
                            <motion.div
                                key="step6"
                                className="space-y-4"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {/* Step 6: Contact Info */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contact Information</label>
                                    <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                                            <input
                                                type="text"
                                                id="firstName"
                                                value={contactInfo.firstName}
                                                onChange={handleContactInfoChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                                            <input
                                                type="text"
                                                id="lastName"
                                                value={contactInfo.lastName}
                                                onChange={handleContactInfoChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                                            <input
                                                type="email"
                                                id="email"
                                                value={contactInfo.email}
                                                onChange={handleContactInfoChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                                            <input
                                                type="tel"
                                                id="phone"
                                                value={contactInfo.phone}
                                                onChange={handleContactInfoChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                         {step === 2 && pickupType === 'store' && (
                            <motion.div
                                key="step3Store"
                                className="space-y-4"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {/* Step 3: Select Store */}
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Store</h2>
                                <div>
                                    <label htmlFor="storeName" className="block text-sm font-medium text-gray-700">Store Name</label>
                                    <input
                                        type="text"
                                        id="storeName"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                        placeholder="Enter Store Name"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && pickupType === 'store'  && (
                            <motion.div
                                key="step4Store"
                                className="space-y-4"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {/* Step 4 - Date and Time Selection */}
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Time</h2>
                                    <label htmlFor="selectedDate" className="block text-sm font-medium text-gray-700">
                                        Preferred Date
                                    </label>
                                    <input
                                        type="date"
                                        id="selectedDate"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                    />
                               
                            </motion.div>
                        )}

                        {step === 4 && pickupType === 'store' && (
                            <motion.div
                                key="step4Store"
                                className="space-y-4"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {/* Step 4 - Contact Info */}
                                <div>
                                    <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700">
                                        Contact Info
                                    </label>
                                    <input
                                        type="text"
                                        id="contactInfo"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                        placeholder="Enter Contact Information"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {step === 7 && isPrivateType() &&(
                            <motion.div
                                key="step7"
                                className="space-y-4"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {/* Step 7: Price Estimation and Confirmation */}
                                {estimatedPrice !== null ? (
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Estimated Price:</h3>
                                        <div className="bg-green-100 p-4 rounded-lg shadow-md">
                                            <p className="text-2xl font-bold text-green-700">
                                                ${estimatedPrice.toLocaleString()}
                                            </p>
                                            <p className="text-sm text-gray-700">ReHome B.v. may decrease charges as its just an estimation.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p>Calculating price...</p>
                                )}
                            </motion.div>
                        )}

                      {step === 5 && isStoreType() && (
                            <motion.div
                                key="step5"
                                className="space-y-4"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {/* Step 7: Price Estimation and Confirmation */}
                                {estimatedPrice !== null ? (
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Estimated Price:</h3>
                                        <div className="bg-green-100 p-4 rounded-lg shadow-md">
                                            <p className="text-2xl font-bold text-green-700">
                                                ${estimatedPrice.toLocaleString()}
                                            </p>
                                            <p className="text-sm text-gray-700">ReHome B.v. may decrease charges as its just an estimation.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p>Calculating price...</p>
                                )}
                            </motion.div>
                        )}

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
                       {step < (isPrivateType() ? 7 : 5) && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                                onClick={goToNextStep}
                                className="bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600"
                            >
                                Next <FaArrowRight className="inline-block ml-2" />
                            </motion.button>
                        )}
                        {step === 7 && isPrivateType() ||(step === 5 && isStoreType() &&  estimatedPrice !== null )  &&(
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                                type="submit"
                                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                            >
                                Submit Request
                            </motion.button>
                        )}
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ItemMovingPage;