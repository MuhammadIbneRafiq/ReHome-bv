import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaArrowUp, FaArrowDown, FaCalendarAlt, FaPeopleCarry, FaTruck, FaMinus, FaPlus, FaCube, FaToolbox, FaInfoCircle } from "react-icons/fa";
import { Switch } from "@headlessui/react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { cityDayData, furnitureItems } from '../../lib/constants.ts'; // Uncomment when you have constants file!

// // Dummy data for demonstration
// const cityDayData = {
//     "Amsterdam": ["Monday", "Tuesday", "Wednesday"],
//     "Rotterdam": ["Thursday", "Friday"]
// };
// const furnitureItems = [
//     { id: "sofa", name: "Sofa", points: 5 },
//     { id: "bed", name: "Bed", points: 8 },
//     { id: "table", name: "Table", points: 3 }
// ];

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
    const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [elevatorPickup, setElevatorPickup] = useState(false);
    const [elevatorDropoff, setElevatorDropoff] = useState(false);
    const [extraHelper, setExtraHelper] = useState(false);
    const [itemQuantities, setItemQuantities] = useState<{ [key: string]: number }>({});
    const [isStudent, setIsStudent] = useState(false); // State to track if student ID is required
    const [studentId, setStudentId] = useState<File | null>(null); // State for student ID file

    const [customItem, setCustomItem] = useState(''); // State for custom item input
    // const navigate = useNavigate();
    const [basePrice, setBasePrice] = useState<number>(50); // Initialize basePrice in state
    const [itemPoints, setItemPoints] = useState<number>(0); // Initialize itemPoints in state
    const [carryingCost, setCarryingCost] = useState<number>(0); // Initialize carryingCost in state
    const [disassemblyCost, setDisassemblyCost] = useState<number>(0); // Initialize disassemblyCost in state
    const [distanceCost, setDistanceCost] = useState<number>(0); // Initialize distanceCost in state
    const [extraHelperCost, setExtraHelperCost] = useState<number>(0); // Initialize extraHelperCost in state
    const [isDateFlexible, setIsDateFlexible] = useState(false); // State for flexible date

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

    const handleStudentIdUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        if (step < 7) setStep(step + 1);
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
                        House Moving Request
                    </h1>

                    {/* Progress Bar */}
                    <div className="flex justify-center space-x-3 mb-8">
                        {[1, 2, 3, 4, 5, 6, 7].map((s) => (
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
                                {/* Step 1: Location Selection */}
                                <div>
                                    <label htmlFor="firstLocation" className="block text-sm font-medium text-gray-700">First Location (Postcode)</label>
                                    <input
                                        type="text"
                                        id="firstLocation"
                                        value={firstLocation}
                                        onChange={(e) => setFirstLocation(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                        placeholder="e.g., 1234 AB"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="secondLocation" className="block text-sm font-medium text-gray-700">Second Location (Postcode)</label>
                                    <input
                                        type="text"
                                        id="secondLocation"
                                        value={secondLocation}
                                        onChange={(e) => setSecondLocation(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                        placeholder="e.g., 5678 CD"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                className="space-y-4"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {/* Step 2: Address Information */}
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
                                                value="The Netherlands" // Replace with dynamic state if needed
                                                // onChange={}   Add logic here
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
                                                    value={firstLocation} // Assuming `firstLocation` is postal code
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
                                                value="The Netherlands" // Replace with dynamic state if needed
                                                // onChange={}
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
                                                    value={secondLocation}  // Assuming `secondLocation` is postal code
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
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                className="space-y-4"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {/* Step 3: Item List */}
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

                        {step === 4 && (
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
                                    <div className="flex items-left h-5">
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
                                <div className="mt-4 relative flex items-start">

                                    <div className="flex items-right h-5">
                                        <input
                                            id="extraHelper"
                                            type="checkbox"
                                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                            checked={extraHelper}
                                            onChange={(e) => setExtraHelper(e.target.checked)}
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="extraHelper" className="font-medium text-gray-700">Require extra helper?</label>
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

                        
                        {step === 5 && (
                            <motion.div
                                key="step5"
                                className="space-y-4"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {/* PREFFEREDD DATE@ */}
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
                                {/* Flexible dates yes or no */}
                                <div className="mt-4 relative flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="flexibleDate"
                                            type="checkbox"
                                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                            checked={isDateFlexible}
                                            onChange={(e) => {
                                                setIsDateFlexible(e.target.checked);
                                                if (e.target.checked) {
                                                    goToNextStep(); // Go to next step if date is flexible
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="flexibleDate" className="font-medium text-gray-700">Is your date flexible?</label>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 6 && (
                            <motion.div
                                key="step6"
                                className="space-y-4"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {/* Step 6: Contact Info */}
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h2>
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
                                    {/* Student ID Upload */}
                                    <ElevatorToggle
                                        label="Are you a student, then you get 7.5% discount?"
                                        checked={isStudent}
                                        onChange={setIsStudent}
                                    />
                                    {isStudent && (
                                        <div className="col-span-2 mt-4">
                                            <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                                                Upload Student ID
                                            </label>
                                            <input
                                                type="file"
                                                id="studentId"
                                                accept="image/*"
                                                onChange={handleStudentIdUpload}
                                                className="mt-1 block w-full text-sm text-slate-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-md
                                                file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-orange-500 file:text-white
                                                hover:file:bg-orange-700"
                                            />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === 7 && (
                            <motion.div
                                key="overview"
                                className="space-y-6"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {/* Step 7: Overview and Confirm */}
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Overview and Confirm</h2>
                                <div className="bg-gray-100 p-4 rounded-md shadow-md">
                                    {/* Ham List Section */}
                                    <div className="border-b pb-4">
                                        <h3 className="text-lg font-bold mb-2 flex items-center">
                                            <FaCube className="mr-2 text-gray-600" /> Item List
                                        </h3>
                                        {Object.entries(itemQuantities).map(([id, qty]) => (
                                            <motion.div
                                                key={id}
                                                className="flex justify-between py-1 text-gray-700 opacity-80"
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <span>{furnitureItems.find(i => i.id === id)?.name || 'Unknown Item'}</span>
                                                <span>x{qty}</span>
                                            </motion.div>
                                        ))}
                                        {customItem && (
                                            <motion.div
                                                className="flex justify-between py-1 text-gray-700 opacity-80"
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <span>Custom Item:</span>
                                                <span>{customItem}</span>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* All-ons Section */}
                                    <div className="border-b pb-4">
                                        <h3 className="text-lg font-bold mb-2 flex items-center">
                                            <FaToolbox className="mr-2 text-gray-600" /> Add-ons
                                        </h3>
                                        <motion.div
                                            className="grid grid-cols-2 gap-4 text-gray-700 opacity-80"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div>
                                                <p>Disassembly: {disassembly ? <span className="text-green-500">Yes</span> : <span className="text-red-500">No</span>}</p>
                                                <p>Extra Helper: {extraHelper ? <span className="text-green-500">Yes</span> : <span className="text-red-500">No</span>}</p>
                                            </div>
                                            <div>
                                                <p>Pickup Elevator: {elevatorPickup ? <span className="text-green-500">Yes</span> : <span className="text-red-500">No</span>}</p>
                                                <p>Dropoff Elevator: {elevatorDropoff ? <span className="text-green-500">Yes</span> : <span className="text-red-500">No</span>}</p>
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Carried Display Section */}
                                    <div className="border-b pb-4">
                                        <h3 className="text-lg font-bold mb-2 flex items-center">
                                            <FaTruck className="mr-2 text-gray-600" /> Carried Details
                                        </h3>
                                        <motion.div
                                            className="grid grid-cols-2 gap-4 text-gray-700 opacity-80"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div>
                                                <p>Pickup Floor: {floorPickup}</p>
                                                <p>Dropoff Floor: {floorDropoff}</p>
                                            </div>
                                            <div>
                                                <p>Distance: {firstLocation && secondLocation ? "50km" : "N/A"}</p>
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Contact Details Section */}
                                    <div className="border-b pb-4">
                                        <h3 className="text-lg font-bold mb-2 flex items-center">Contact Details</h3>
                                        <motion.div
                                            className="grid grid-cols-2 gap-4 text-gray-700 opacity-80"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="flex flex-col items-start p-4 border border-gray-200 rounded-xl shadow-md transition-shadow duration-300">

                                                {/* Contact Details */}
                                            
                                                <div className="space-y-2">

                                                    {Object.keys(contactInfo).length > 0 && (
                                                        <div>
                                                            <h3 className="text-lg font-medium text-gray-700">Contact Details:</h3>
                                                            <p>Name: {contactInfo.firstName} {contactInfo.lastName}</p>
                                                            <p>Email: {contactInfo.email}</p>
                                                            <p>Phone: {contactInfo.phone}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Student ID Information */}
                                                {isStudent && studentId && (
                                                    <div className="flex justify-between py-1 text-gray-700 opacity-80">
                                                        <span>Student ID Uploaded:</span>
                                                        <span>{studentId.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                        
                                        
                                        </motion.div>
                                    </div>

                                    {/* Flexible Date Section */}
                                    <div className="border-b pb-4">
                                        <h3 className="text-lg font-bold mb-2 flex items-center">Date Flexibility</h3>
                                        <p>{isDateFlexible ? "Yes" : "No"}</p>
                                    </div>

                                    {/* Log all relevant information */}
                                    {console.log("Overview Information:", {
                                        pickupType,
                                        selectedDate,
                                        isDateFlexible,
                                        furnitureItems: Object.entries(itemQuantities)
                                            .filter(([, quantity]) => quantity > 0)
                                            .map(([itemId, quantity]) => ({ itemId, quantity })),
                                        customItem,
                                        floorPickup,
                                        floorDropoff,
                                        contactInfo,
                                        estimatedPrice,
                                    })}

                                    {/* Pricing Breakdown */}
                                    <div className="bg-gray-100 p-4 rounded-lg">
                                        <h3 className="text-lg font-bold mb-4">Payment Overview</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span>Base Price:</span>
                                                <span>€{basePrice.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Items Points:</span>
                                                <span>€{(itemPoints * 3).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Carrying Cost:</span>
                                                <span>€{carryingCost.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Disassembly Cost:</span>
                                                <span>€{disassemblyCost.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Distance Cost:</span>
                                                <span>€{distanceCost.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Extra Helper Cost:</span>
                                                <span>€{extraHelperCost.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-lg pt-2">
                                                <span>Total Estimated:</span>
                                                <span>€{estimatedPrice?.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2">
                                            <FaInfoCircle className="inline mr-1" />
                                            Final price may vary based on actual conditions
                                        </p>
                                    </div>
                                </div>
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
                        {step < 7 && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                                onClick={nextStep}
                                className="bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600"
                            >
                                Next <FaArrowRight className="inline-block ml-2" />
                            </motion.button>
                        )}
                        {step === 7 && estimatedPrice !== null && (
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

export default HouseMovingPage;