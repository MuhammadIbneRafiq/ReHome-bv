import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaCheckCircle } from "react-icons/fa"; // Import Icons

// Define a type for the item list
type ItemList = {
    [key: string]: boolean;
};

const ItemMovingPage = () => {
    const [step, setStep] = useState(1); // Current step
    const [firstLocation, setFirstLocation] = useState('');
    const [secondLocation, setSecondLocation] = useState('');
    const [itemList, setItemList] = useState<ItemList>({});
    const [floorPickup, setFloorPickup] = useState('');
    const [floorDropoff, setFloorDropoff] = useState('');
    const [disassembly, setDisassembly] = useState(false);
    const [photos, setPhotos] = useState<File[]>([]);
    const [pickupDay, setPickupDay] = useState('');
    const [deliveryDay, setDeliveryDay] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

    // Define furniture items
    const furnitureItems = [
        { id: 'sofa', name: 'Sofa' },
        { id: 'table', name: 'Table' },
        { id: 'bed', name: 'Bed' },
        { id: 'tv', name: 'TV' },
        { id: 'fridge', name: 'Fridge' },
    ];

    const handleCheckboxChange = (itemId: string) => {
        setItemList({ ...itemList, [itemId]: !itemList[itemId] });
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setPhotos(Array.from(e.target.files));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission
        console.log({
            firstLocation,
            secondLocation,
            itemList,
            floorPickup,
            floorDropoff,
            disassembly,
            photos,
            pickupDay,
            deliveryDay,
            contactInfo,
            estimatedPrice,
        });
        alert('Moving request submitted (mock)');
    };

    // Placeholder price estimation logic (replace with your calculations)
    const calculatePrice = () => {
        let basePrice = 50; // Example base price
        let itemPoints = 0;

        for (const itemId in itemList) {
            if (itemList[itemId]) {
                switch (itemId) {
                    case 'sofa': itemPoints += 12; break;
                    case 'table': itemPoints += 6; break;
                    case 'bed': itemPoints += 10; break;
                    case 'tv': itemPoints += 3; break;
                    case 'fridge': itemPoints += 8; break;
                }
            }
        }

        let carryingCost = 0;
        if (floorPickup && parseInt(floorPickup, 10) > 1) {
            carryingCost += (parseInt(floorPickup, 10) - 1) * 10; // Example: €10 per floor
        }
        if (floorDropoff && parseInt(floorDropoff, 10) > 1) {
            carryingCost += (parseInt(floorDropoff, 10) - 1) * 10; // Example: €10 per floor
        }
        const disassemblyCost = disassembly ? 20 : 0; // Example fixed cost
        // Mock distance calculation (replace with actual distance calculation)
        const distance = firstLocation && secondLocation ? 50 : 0; // Example:  50km if both locations are entered
        const distanceCost = distance * 0.5; // Example: €0.5 per km

        const totalPrice = basePrice + itemPoints * 3 + carryingCost + disassemblyCost + distanceCost;
        setEstimatedPrice(totalPrice);
    };

    useEffect(() => {
        calculatePrice();
    }, [itemList, floorPickup, floorDropoff, disassembly, firstLocation, secondLocation]);

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

    return (
        <div className="min-h-screen bg-gradient-to-r from-yellow-400 to-red-500 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
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
                                                <div key={item.id} className="relative flex items-start">
                                                    <div className="flex items-center h-5">
                                                        <input
                                                            id={item.id}
                                                            type="checkbox"
                                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                            checked={itemList[item.id] || false}
                                                            onChange={() => handleCheckboxChange(item.id)}
                                                        />
                                                    </div>
                                                    <div className="ml-3 text-sm">
                                                        <label htmlFor={item.id} className="font-medium text-gray-700">
                                                            {item.name}
                                                        </label>
                                                    </div>
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
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                                            <p className="text-2xl font-bold text-green-600">${estimatedPrice.toFixed(2)}</p> {/* Format to two decimal places */}
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
                                {Object.entries(itemList).map(([key, value]) => {
                                    if (value) {
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
                                                  {itemName}: {itemPoints * 3}
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
            </div>
        </div>
    );
};

export default ItemMovingPage;