import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaArrowUp, FaArrowDown, FaCalendarAlt, FaPeopleCarry, FaTruck, FaMinus, FaPlus } from "react-icons/fa"; // Import Icons
import { Switch } from "@headlessui/react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ItemList } from '../../types/ItemList'; // Import the ItemList type
import { cityDayData, furnitureItems } from '../../lib/constants.ts'; // Import the constants

const HouseMovingPage = () => {
    const [step, setStep] = useState(1); // Current step
    const [firstLocation, setFirstLocation] = useState('');
    const [secondLocation, setSecondLocation] = useState('');
    const [itemList, setItemList] = useState<{[key: string]: number}>({}); // Use number for quantities.
    const [floorPickup, setFloorPickup] = useState('');
    const [floorDropoff, setFloorDropoff] = useState('');
    const [disassembly, setDisassembly] = useState(false);
    const [photos, setPhotos] = useState<File[]>([]);
    const [contactInfo, setContactInfo] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    });
    const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState(''); // Date state
    const [elevatorPickup, setElevatorPickup] = useState(false);
    const [elevatorDropoff, setElevatorDropoff] = useState(false);
    const [extraHelper, setExtraHelper] = useState(false);
    const [cityDays, setCityDays] = useState<{[key: string]: string[]}>({}); // Load from API/static data
    const [itemQuantities, setItemQuantities] = useState<{ [key: string]: number }>({});

    const handleCheckboxChange = (itemId: string) => {
       // setItemList({ ...itemList, [itemId]: !itemList[itemId] });
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setPhotos(Array.from(e.target.files));
        }
    };

    const checkCityDay = (location: string, date: string): boolean => {
        if (!location || !date) return false;

        const city = getCityFromPostalCode(location);

        if (!city) return false; // If city not found, return false

        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        return cityDayData[city]?.includes(dayOfWeek);
    };

    // Helper function to get item points
    const getItemPoints = (itemId: string): number => {
        const item = furnitureItems.find(item => item.id === itemId);
        return item ? item.points : 0;
    };
    const getCityFromPostalCode = (postalCode: string): string | null => {
        // Clean and format the postal code
        const cleanedCode = postalCode.trim().toUpperCase();

        // Postal code to city mapping
        switch (true) {
            case /^10/.test(cleanedCode): return "Amsterdam";
            case /^35/.test(cleanedCode): return "Utrecht";
            case /^13/.test(cleanedCode): return "Almere";
            case /^20/.test(cleanedCode): return "Haarlem";
            case /^15/.test(cleanedCode): return "Zaanstad";
            case /^38/.test(cleanedCode): return "Amersfoort";
            case /^52/.test(cleanedCode): return "s-Hertogenbosch";
            case /^21/.test(cleanedCode): return "Hoofddorp";
            case /^30/.test(cleanedCode): return "Rotterdam";
            case /^25/.test(cleanedCode): return "The Hague";
            case /^48/.test(cleanedCode): return "Breda";
            case /^23/.test(cleanedCode): return "Leiden";
            case /^33/.test(cleanedCode): return "Dordrecht";
            case /^27/.test(cleanedCode): return "Zoetermeer";
            case /^26/.test(cleanedCode): return "Delft";
            case /^56/.test(cleanedCode): return "Eindhoven";
            case /^62/.test(cleanedCode): return "Maastricht";
            case /^50/.test(cleanedCode): return "Tilburg";
            case /^97/.test(cleanedCode): return "Groningen";
            case /^65/.test(cleanedCode): return "Nijmegen";
            case /^75/.test(cleanedCode): return "Enschede";
            case /^68/.test(cleanedCode): return "Arnhem";
            case /^73/.test(cleanedCode): return "Apeldoorn";
            case /^74/.test(cleanedCode): return "Deventer";
            case /^80/.test(cleanedCode): return "Zwolle";
            default: return null;  // Or handle unknown postal codes
        }
    };

    const calculatePrice = () => {
        let basePrice = 50;
        const isCityDay = checkCityDay(firstLocation, selectedDate); // Implement city/day check

        if (isCityDay) {
            basePrice = 40; // Reduced price for city days
        }

        let itemPoints = 0;

         for (const itemId in itemQuantities) {
             if (itemQuantities[itemId] > 0) {
                 const points = getItemPoints(itemId);
                 itemPoints += points * itemQuantities[itemId];
             }
         }

        // Adjusted floor calculation with elevator
        const pickupFloor = elevatorPickup ? 1 : Math.max(1, parseInt(floorPickup, 10));
        const dropoffFloor = elevatorDropoff ? 1 : Math.max(1, parseInt(floorDropoff, 10));

        let carryingCost = (Math.max(0, pickupFloor - 1) + Math.max(0, dropoffFloor - 1)) * 10;

        let disassemblyCost = disassembly ? 20 : 0; // Example fixed cost

        const distance = firstLocation && secondLocation ? 50 : 0; // Example:  50km if both locations are entered
        const distanceCost = distance * 0.5; // Example: €0.5 per km

        const totalPrice = basePrice + itemPoints * 3 + carryingCost + disassemblyCost + distanceCost + (extraHelper ? 15 : 0);
        setEstimatedPrice(totalPrice);
    };

    useEffect(() => {
        calculatePrice();
    }, [itemQuantities, floorPickup, floorDropoff, disassembly, firstLocation, secondLocation, selectedDate, extraHelper]);

    const nextStep = () => {
        if (step < 7) {
            setStep(step + 1);
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setStep(step - 1);
        }
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

    // Determine color based on price
    const priceColor = estimatedPrice !== null
        ? (estimatedPrice > 500 ? 'text-red-600' : estimatedPrice > 200 ? 'text-yellow-500' : 'text-green-500')
        : 'text-gray-500'; // Default color when estimatedPrice is null

    const arrowIcon = estimatedPrice !== null
        ? (estimatedPrice > 500 ? <FaArrowUp className="text-red-600" /> : <FaArrowDown className="text-green-600" />)
        : null; // No icon when estimatedPrice is null

    // New elevator toggle component
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

    const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setContactInfo({ ...contactInfo, [e.target.id]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission
        // console.log({
        //     firstLocation,
        //     secondLocation,
        //     itemQuantities,
        //     floorPickup,
        //     floorDropoff,
        //     disassembly,
        //     photos,
        //     pickupDay,
        //     deliveryDay,
        //     contactInfo,
        //     estimatedPrice,
        //     elevatorPickup,
        //     elevatorDropoff,
        // });
        toast.success('Moving request submitted (mock)', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
    };

    return (
        <div className="min-h-screen bg-gradient-to-r from-yellow-400 to-red-500 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-8">
                        <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-6 animate-pulse">
                            House Moving Request
                        </h1>
                        {/* Progress Bar (You can customize this visually) */}
                        <div className="flex justify-center space-x-2 mb-8">
                            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                                <div
                                    key={s}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                        step === s
                                            ? "bg-orange-600"
                                            : step > s
                                            ? "bg-green-500"
                                            : "bg-gray-300"
                                    } transition-colors`}
                                >
                                    {step > s && <FaCheckCircle className="text-white" />}
                                </div>
                            ))}
                        </div>
                        <AnimatePresence initial={false} mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    variants={{
                                        hidden: { opacity: 0, x: -100 },
                                        visible: { opacity: 1, x: 0 },
                                        exit: { opacity: 0, x: 100 },
                                    }}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Step 1: Location Selection */}
                                    {/* First Location */}
                                    <div>
                                        <label htmlFor="firstLocation" className="block text-sm font-medium text-gray-700">
                                            First Location (Postcode or City)
                                        </label>
                                        <input
                                            type="text"
                                            id="firstLocation"
                                            value={firstLocation}
                                            onChange={(e) => setFirstLocation(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            placeholder="e.g., 1234 AB, Amsterdam"
                                        />
                                    </div>

                                    {/* Second Location */}
                                    <div className="mt-4">
                                        <label htmlFor="secondLocation" className="block text-sm font-medium text-gray-700">
                                            Second Location (Postcode or City)
                                        </label>
                                        <input
                                            type="text"
                                            id="secondLocation"
                                            value={secondLocation}
                                            onChange={(e) => setSecondLocation(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            placeholder="e.g., 5678 CD, Rotterdam"
                                        />
                                    </div>
                                </motion.div>
                            )}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    variants={{
                                        hidden: { opacity: 0, x: -100 },
                                        visible: { opacity: 1, x: 0 },
                                        exit: { opacity: 0, x: 100 },
                                    }}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Step 2: Preferred Date */}
                                    <div>
                                        <label htmlFor="selectedDate" className="block text-sm font-medium text-gray-700">
                                            Preferred Date
                                        </label>
                                        <input
                                            type="date"
                                            id="selectedDate"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                </motion.div>
                            )}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    variants={{
                                        hidden: { opacity: 0, x: -100 },
                                        visible: { opacity: 1, x: 0 },
                                        exit: { opacity: 0, x: 100 },
                                    }}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Step 3: Item List */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Item List (Check the items to be moved)
                                        </label>
                                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {furnitureItems.map((item) => (
                                                <div key={item.id} className="flex items-center gap-4">
                                                     <button
                                                        type="button"
                                                        onClick={() => decrementItem(item.id)}
                                                        disabled={!itemQuantities[item.id]}
                                                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-2 rounded-full focus:outline-none focus:shadow-outline"
                                                    >
                                                        <FaMinus className="h-4 w-4" />
                                                    </button>
                                                    <span className="mx-2">{itemQuantities[item.id] || 0}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => incrementItem(item.id)}
                                                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-2 rounded-full focus:outline-none focus:shadow-outline"
                                                    >
                                                        <FaPlus className="h-4 w-4" />
                                                    </button>
                                                    <span className="ml-2 text-sm">{item.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    variants={{
                                        hidden: { opacity: 0, x: -100 },
                                        visible: { opacity: 1, x: 0 },
                                        exit: { opacity: 0, x: 100 },
                                    }}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Step 4: Carrying Upstairs & (Dis)assembly */}
                                    {/* Floor Preference */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="floorPickup" className="block text-sm font-medium text-gray-700">
                                                Floor (Pickup)
                                            </label>
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
                                            <label htmlFor="floorDropoff" className="block text-sm font-medium text-gray-700">
                                                Floor (Drop-off)
                                            </label>
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

                                    {/* Disassembly */}
                                    <div className="mt-4 relative flex items-start">
                                        <div className="flex items-center h-5">
                                            <input
                                                id="disassembly"
                                                type="checkbox"
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                checked={disassembly}
                                                onChange={(e) => setDisassembly(e.target.checked)}
                                            />
                                        </div>
                                        <div className="ml-3 text-sm">
                                            <label htmlFor="disassembly" className="font-medium text-gray-700">
                                                Require us to take the furniture apart? (Extra charge may apply)
                                            </label>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                             {step === 5 && (
                                 <motion.div
                                     key="step5"
                                     variants={{
                                         hidden: { opacity: 0, x: -100 },
                                         visible: { opacity: 1, x: 0 },
                                         exit: { opacity: 0, x: 100 },
                                     }}
                                     initial="hidden"
                                     animate="visible"
                                     exit="exit"
                                     transition={{ duration: 0.3 }}
                                 >
                                    {/* Step 5: Extra Helper */}
                                    <div className="mt-4 relative flex items-start">
                                        <div className="flex items-center h-5">
                                            <input
                                                id="extraHelper"
                                                type="checkbox"
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                checked={extraHelper}
                                                onChange={(e) => setExtraHelper(e.target.checked)}
                                            />
                                        </div>
                                        <div className="ml-3 text-sm">
                                            <label htmlFor="extraHelper" className="font-medium text-gray-700">
                                                Require extra helper? (Extra charge may apply)
                                            </label>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            {step === 6 && (
                                <motion.div
                                    key="step6"
                                    variants={{
                                        hidden: { opacity: 0, x: -100 },
                                        visible: { opacity: 1, x: 0 },
                                        exit: { opacity: 0, x: 100 },
                                    }}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Step 6: Contact Info */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Contact Information
                                        </label>
                                        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                                    First Name
                                                </label>
                                                <input
                                                    type="text"
                                                    id="firstName"
                                                    value={contactInfo.firstName}
                                                    onChange={handleContactInfoChange}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            {step === 7 && (
                                <motion.div
                                    key="step7"
                                    variants={{
                                        hidden: { opacity: 0, x: -100 },
                                        visible: { opacity: 1, x: 0 },
                                        exit: { opacity: 0, x: 100 },
                                    }}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Step 7: Price Estimation and Confirmation */}
                                    {estimatedPrice !== null ? (
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Estimated Price:</h3>
                                            <div className="bg-green-100 p-4 rounded-lg shadow-md">
                                                <p className="text-2xl font-bold text-green-700">
                                                    ${estimatedPrice.toLocaleString()}  {/* Format to two decimal places */}
                                                </p>
                                                <p className="text-sm text-gray-700">ReHome B.v. may decrease charges as its just an estimation.</p>
                                            </div>
                                            <button
                                                type="submit"
                                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-300 mt-6"
                                            >
                                                Submit Moving Request
                                            </button>
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
                                <button
                                    onClick={prevStep}
                                    className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition duration-200"
                                >
                                    <FaArrowLeft className="mr-2" /> Previous
                                </button>
                            )}
                            {step < 7 && (
                                <button
                                    onClick={nextStep}
                                    className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:opacity-90 transition-duration-300"
                                >
                                    Next <FaArrowRight className="ml-2" />
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HouseMovingPage;