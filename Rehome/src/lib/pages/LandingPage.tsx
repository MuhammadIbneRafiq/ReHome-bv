import React from "react";
import { Link } from "react-router-dom";
import { dummyData } from "../constants";
import Footer from "../../components/Footer"; // Import the Footer component
import { useFetchData } from "../../hooks/useFetchData";

const LandingPage = () => {
  const { data, isLoading, error } = useFetchData("furniture", "furnitureList");

  if (isLoading) return <p className="text-center text-orange-600">Loading...</p>;
  if (error) return <p className="text-center text-red-600">Error fetching data</p>;
  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      <div className="max-w-7xl mx-auto pt-20 px-4 flex-grow">
        <h1 className="text-5xl font-bold text-red-600 mb-6">Restart and relocate your home and life!</h1>
        <p className="text-xl text-orange-800 mb-8">Discover amazing deals on pre-loved furniture</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Array.isArray(data) && data.length > 0 ? data : dummyData).map((item) => (
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