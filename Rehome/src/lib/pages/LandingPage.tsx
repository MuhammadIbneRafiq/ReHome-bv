import React from "react";
import Footer from "../../components/Footer"; // Import the Footer component
// Import Images - Assuming you have these files in assets
import sofaImage from "../../assets/IMG-20250208-WA0001.jpg";
import tableImage from "../../assets/IMG-20250208-WA0010.jpg";
import chairImage from "../../assets/IMG-20250208-WA0013.jpg";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      <div className="max-w-7xl mx-auto pt-20 px-4 flex-grow">
        <h1 className="text-5xl font-bold text-red-600 mb-6">Restart and relocate your home and life!</h1>
        <p className="text-xl text-orange-800 mb-8">Discover amazing deals on pre-loved furniture</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dummyData.map((item) => (
            <div key={item.id} className="bg-white shadow-lg rounded-lg p-4 hover:scale-105 transition-transform">
              <img src={item.image} alt={item.name} className="w-full h-48 object-cover rounded-md" />
              <h3 className="text-xl font-semibold mt-2">{item.name}</h3>
              <p className="text-gray-600">{item.description}</p>
              <p className="text-red-500 font-bold mt-2">{item.price}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer /> {/* Use the Footer component here */}
    </div>
  );
};

export default LandingPage;

// Dummy Furniture Data with Images
const dummyData = [
  {
    id: 1,
    name: "Cozy Sofa",
    image: sofaImage, // Use the imported image
    description: "A comfortable and stylish sofa for your living room.",
    price: "$299",
  },
  {
    id: 2,
    name: "Wooden Dining Table",
    image: tableImage, // Use the imported image
    description: "A sturdy wooden dining table that seats 6 people.",
    price: "$399",
  },
  {
    id: 3,
    name: "Modern Office Chair",
    image: chairImage, // Use the imported image
    description: "An ergonomic office chair for maximum comfort.",
    price: "$199",
  },
];