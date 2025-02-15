import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaArrowUp, FaArrowDown } from "react-icons/fa"; // Import Icons
import { Switch } from "@headlessui/react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Define a type for the item list
type ItemList = {
    [key: string]: boolean;
};

// Define furniture items
const furnitureItems = [
    { id: 'sofa', name: 'Sofa', points: 12 },
    { id: 'table', name: 'Table', points: 6 },
    { id: 'bed', name: 'Bed', points: 10 },
    { id: 'tv', name: 'TV', points: 3 },
    { id: 'fridge', name: 'Fridge', points: 8 },
];

// City Day Data
const cityDayData: { [key: string]: string[] } = {
  Amsterdam: ["Monday", "Wednesday", "Friday"],
  Rotterdam: ["Tuesday", "Thursday"],
  TheHague: ["Saturday", "Sunday"],
  Utrecht: ["Monday"],
  Almere: ["Tuesday"],
  Haarlem: ["Wednesday"],
  Zaanstad: ["Thursday"],
  Amersfoort: ["Friday"],
  "s-Hertogenbosch": ["Saturday"],
  Hoofddorp: ["Sunday"],
  Breda: ["Monday", "Wednesday"],
  Leiden: ["Tuesday", "Thursday"],
  Dordrecht: ["Friday", "Sunday"],
  Zoetermeer: ["Saturday"],
  Delft: ["Monday", "Wednesday"],
  Eindhoven: ["Tuesday", "Thursday"],
  Maastricht: ["Friday", "Sunday"],
  Tilburg: ["Saturday"],
  Groningen: ["Monday", "Wednesday"],
  Nijmegen: ["Tuesday", "Thursday"],
  Enschede: ["Friday", "Sunday"],
  Arnhem: ["Saturday"],
  Apeldoorn: ["Monday", "Wednesday"],
  Deventer: ["Tuesday", "Thursday"],
  Zwolle: ["Friday", "Sunday"],
};

const ItemMovingPage = () => {
    const [step, setStep] = useState(1); // Current step
    const [firstLocation, setFirstLocation] = useState('');
    const [secondLocation, setSecondLocation] = useState('');
    // const [itemList, setItemList] = useState<ItemList>({});
    const [floorPickup, setFloorPickup] = useState('');
    const [floorDropoff, setFloorDropoff] = useState('');
    const [disassembly, setDisassembly] = useState(false);
    const [photos, setPhotos] = useState<File[]>([]);
    const [pickupDay, setPickupDay] = useState('');
    const [deliveryDay, setDeliveryDay] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
    const [selectedDate] = useState('');
    const [elevatorPickup, setElevatorPickup] = useState(false);
    const [elevatorDropoff, setElevatorDropoff] = useState(false);
    const [itemQuantities, setItemQuantities] = useState<{[key: string]: number}>({});
    // const [cityDays, setCityDays] = useState<{[key: string]: string[]}>({}); // Load from API/static data

    // const handleCheckboxChange = (itemId: string) => {
    //     setItemList({ ...itemList, [itemId]: !itemList[itemId] });
    // };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setPhotos(Array.from(e.target.files));
        }
    };

    // Function to check if it's a city day
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


    // Modified calculatePrice function
    const calculatePrice = () => {
        let basePrice = 50;
        const isCityDay = checkCityDay(firstLocation, selectedDate); // Implement city/day check
        
        if (isCityDay) {
            basePrice = 40; // Reduced price for city days
        }

        let itemPoints = Object.entries(itemQuantities).reduce((acc, [itemId, quantity]) => {
            const points = getItemPoints(itemId); // Helper function
            return acc + (points * quantity);
        }, 0);

        // Adjusted floor calculation with elevator
        const pickupFloor = elevatorPickup ? 1 : Math.max(1, parseInt(floorPickup, 10));
        const dropoffFloor = elevatorDropoff ? 1 : Math.max(1, parseInt(floorDropoff, 10));
        
        let carryingCost = (Math.max(0, pickupFloor - 1) + Math.max(0, dropoffFloor - 1)) * 10;
        
        // Rest of calculation remains similar
        let disassemblyCost = disassembly ? 20 : 0; // Example fixed cost
        // Mock distance calculation (replace with actual distance calculation)
        const distance = firstLocation && secondLocation ? 50 : 0; // Example:  50km if both locations are entered
        const distanceCost = distance * 0.5; // Example: €0.5 per km

        const totalPrice = basePrice + itemPoints * 3 + carryingCost + disassemblyCost + distanceCost;
        setEstimatedPrice(totalPrice);
        return totalPrice;
    };

    useEffect(() => {
        calculatePrice();
    }, [itemQuantities, floorPickup, floorDropoff, disassembly, firstLocation, secondLocation, selectedDate]);

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
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission
        console.log({
            firstLocation,
            secondLocation,
            itemQuantities,
            floorPickup,
            floorDropoff,
            disassembly,
            photos,
            pickupDay,
            deliveryDay,
            contactInfo,
            estimatedPrice,
            elevatorPickup,
            elevatorDropoff,
        });
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
                <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="px-6 py-8">
                        <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-6 animate-pulse">
                            Item Moving Request
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

                        {/* Step Content */}
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
                                    {/* Step 2: Item List */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Item List (Check the items to be moved)
                                        </label>
                                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {furnitureItems.map((item) => (
                                                <div key={item.id} className="flex items-center gap-4">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={itemQuantities[item.id] || 0}
                                                        onChange={(e) => setItemQuantities({
                                                            ...itemQuantities,
                                                            [item.id]: parseInt(e.target.value) || 0
                                                        })}
                                                        className="w-20 px-2 py-1 border rounded-md"
                                                    />
                                                    <span className="text-sm">{item.name}</span>
                                                </div>
                                            ))}
                                        </div>
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
                                    {/* Step 3: Floor and Additional Services */}
                                    {/* Floor Preference */}
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="floorPickup" className="block text-sm font-medium text-gray-700">
                                                Pickup Floor
                                            </label>
                                            <input
                                                type="number"
                                                id="floorPickup"
                                                value={floorPickup}
                                                onChange={(e) => setFloorPickup(e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                            />
                                            <ElevatorToggle
                                                label="Elevator available at pickup"
                                                checked={elevatorPickup}
                                                onChange={setElevatorPickup}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="floorDropoff" className="block text-sm font-medium text-gray-700">
                                                Drop-off Floor
                                            </label>
                                            <input
                                                type="number"
                                                id="floorDropoff"
                                                value={floorDropoff}
                                                onChange={(e) => setFloorDropoff(e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                            />
                                            <ElevatorToggle
                                                label="Elevator available at drop-off"
                                                checked={elevatorDropoff}
                                                onChange={setElevatorDropoff}
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
                                    {/* Step 4: Date and Time Selection */}

                                    {/* Preferred Pickup Day */}
                                    <div>
                                        <label htmlFor="pickupDay" className="block text-sm font-medium text-gray-700">
                                            Preferred Pickup Day
                                        </label>
                                        <input
                                            type="date"
                                            id="pickupDay"
                                            value={pickupDay}
                                            onChange={(e) => setPickupDay(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                    </div>

                                    {/* Preferred Delivery Day */}
                                    <div className="mt-4">
                                        <label htmlFor="deliveryDay" className="block text-sm font-medium text-gray-700">
                                            Preferred Delivery Day
                                        </label>
                                        <input
                                            type="date"
                                            id="deliveryDay"
                                            value={deliveryDay}
                                            onChange={(e) => setDeliveryDay(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
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
                                    {/* Step 5: Photo Upload */}
                                    <div>
                                        <label htmlFor="photos" className="block text-sm font-medium text-gray-700">
                                            Photos (Packed/Unpacked Items)
                                        </label>
                                        <input
                                            type="file"
                                            id="photos"
                                            multiple
                                            onChange={handlePhotoChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                                        />
                                        {photos.length > 0 && (
                                            <div className="mt-2">
                                                {photos.map((photo, index) => (
                                                    <img key={index} src={URL.createObjectURL(photo)} alt={`Preview ${index}`} className="inline-block h-16 w-16 rounded-md mr-2" />
                                                ))}
                                            </div>
                                        )}
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
                                        <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700">
                                            Contact Info
                                        </label>
                                        <textarea
                                            id="contactInfo"
                                            value={contactInfo}
                                            onChange={(e) => setContactInfo(e.target.value)}
                                            rows={2}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            placeholder="Your contact details (e.g., phone, email)"
                                        />
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
                                            <motion.div
                                                className={`flex items-center justify-between p-4 border-l-4 ${priceColor} border-opacity-50`}
                                                initial={{ opacity: 0, y: -20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                <div className="flex items-center">
                                                    {arrowIcon}
                                                    <span className={`ml-2 text-xl font-semibold ${priceColor}`}>${estimatedPrice.toFixed(2)}</span>
                                                </div>
                                                <p className={`text-sm ${priceColor}`}>Estimated Price</p>
                                            </motion.div>
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
                                    className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:opacity-90 transition duration-300"
                                >
                                    Next <FaArrowRight className="ml-2" />
                                </button>
                            )}
                        </div>
                    </div>
                    {/* Price Summary on the Right */}
                    <div className="px-6 py-8 border-l border-gray-200  hidden md:block bg-orange-50">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Your Estimate
                        </h3>
                        {estimatedPrice !== null ? (
                            <div>
                                <p className="text-gray-700 mb-2">
                                    Base Price: ${50}
                                </p>
                                {Object.entries(itemQuantities).map(([key, value]) => {
                                    if (value > 0) {
                                        let itemName = "";
                                        let itemPoints = 0;
                                        furnitureItems.forEach(item => {
                                          if (item.id === key) {
                                            itemName = item.name
                                            switch (key) {
                                              case 'sofa': itemPoints = 12; break;
                                              case 'table': itemPoints = 6; break;
                                              case 'bed': itemPoints = 10; break;
                                              case 'tv': itemPoints = 3; break;
                                              case 'fridge': itemPoints = 8; break;
                                            }
                                          }
                                        });
                                          return (
                                              <p key={key} className="text-gray-700 mb-2">
                                                  {itemName} x {value}: {itemPoints * value * 3}
                                              </p>
                                          )
                                    }
                                    return null;
                                })}

                                {floorPickup && parseInt(floorPickup, 10) > 1 && (
                                    <p className="text-gray-700 mb-2">
                                        Pickup Floor:  ${(parseInt(floorPickup, 10) - 1) * 10}
                                    </p>
                                )}
                                {floorDropoff && parseInt(floorDropoff, 10) > 1 && (
                                    <p className="text-gray-700 mb-2">
                                        Drop-off Floor: ${ (parseInt(floorDropoff, 10) - 1) * 10}
                                    </p>
                                )}
                                {disassembly && (
                                    <p className="text-gray-700 mb-2">
                                        Disassembly: $20
                                    </p>
                                )}
                                {firstLocation && secondLocation && (
                                    <p className="text-gray-700 mb-2">
                                        Distance: ${ (50 * 0.5).toFixed(2) }
                                    </p>
                                )}

                                <p className="text-xl font-bold mt-4">
                                    Total: ${estimatedPrice.toFixed(2)}
                                </p>
                            </div>
                        ) : (
                            <p className="text-gray-700">Select options to see the estimated price.</p>
                        )}
                    </div>
                </div>
                </form>
            </div>
        </div>
    );
};

export default ItemMovingPage;