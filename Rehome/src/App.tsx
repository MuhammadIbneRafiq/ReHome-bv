import React from "react";
import { BrowserRouter, Route, Routes, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";

// Define a type for the user registration payload
type UserPayload = {
  name: string;
  email: string;
  password: string;
};

// ✅ Custom Hook with Default Data Handling
const useFetchData = (endpoint: string, queryKey: string) => {
  return useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/${endpoint}`);
      return Array.isArray(data) ? data : []; // Ensure it's always an array
    },
    staleTime: 5000, // Optional: Keeps data fresh for 5s
  });
};

// ✅ Dummy Furniture Data with Images
const dummyData = [
  {
    id: 1,
    name: "Cozy Sofa",
    image: "https://via.placeholder.com/200", 
    description: "A comfortable and stylish sofa for your living room.",
    price: "$299",
  },
  {
    id: 2,
    name: "Wooden Dining Table",
    image: "https://via.placeholder.com/200",
    description: "A sturdy wooden dining table that seats 6 people.",
    price: "$399",
  },
  {
    id: 3,
    name: "Modern Office Chair",
    image: "https://via.placeholder.com/200",
    description: "An ergonomic office chair for maximum comfort.",
    price: "$199",
  },
];


const usePostData = <T,>(endpoint: string) => {
  return useMutation<T, Error, T>(
    async (payload: T) => {
      const { data } = await axios.post<T>(`${import.meta.env.VITE_API_URL}/${endpoint}`, payload);
      return data;
    }
  );
};

// ✅ Navbar Component
const Navbar = () => (
  <nav className="bg-gradient-to-r from-orange-500 to-red-600 p-4">
    <div className="flex justify-between items-center max-w-7xl mx-auto">
      <Link to="/" className="text-white text-2xl font-bold">FurnitureHub</Link>
      <div className="space-x-4">
        <Link to="/login" className="text-white hover:text-orange-200">Login</Link>
        <Link to="/register" className="text-white hover:text-orange-200">Register</Link>
        <Link to="/pricing" className="text-white hover:text-orange-200">Pricing</Link>
      </div>
    </div>
  </nav>
);

// ✅ Landing Page
const LandingPage = () => {
  const { data, isLoading, error } = useFetchData("furniture", "furnitureList");

  if (isLoading) return <p className="text-center text-orange-600">Loading...</p>;
  if (error) return <p className="text-center text-red-600">Error fetching data</p>;

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-7xl mx-auto pt-20 px-4">
        <h1 className="text-5xl font-bold text-red-600 mb-6">Find Your Perfect Furniture</h1>
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
    </div>
  );
};

// ✅ Login Page
const LoginPage = () => (
  <div className="min-h-screen bg-orange-50 flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h2 className="text-3xl font-bold text-red-600 mb-6">Login</h2>
      <input type="email" placeholder="Email" className="w-full mb-4 p-2 border rounded" />
      <input type="password" placeholder="Password" className="w-full mb-4 p-2 border rounded" />
      <button className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-2 rounded">Login</button>
    </div>
  </div>
);

// ✅ Register Page
const SignupPage = () => {
  const postUser = usePostData<UserPayload>("register");

  const handleRegister = () => {
    postUser.mutate({ name: "John Doe", email: "john@example.com", password: "password123" });
  };

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-red-600 mb-6">Register</h2>
        <input type="text" placeholder="Name" className="w-full mb-4 p-2 border rounded" />
        <input type="email" placeholder="Email" className="w-full mb-4 p-2 border rounded" />
        <input type="password" placeholder="Password" className="w-full mb-4 p-2 border rounded" />
        <button onClick={handleRegister} className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-2 rounded">
          Sign Up
        </button>
      </div>
    </div>
  );
};

// ✅ Pricing Page
const Pricing = () => (
  <div className="min-h-screen bg-orange-50 p-4">
    <div className="max-w-7xl mx-auto pt-10">
      <h2 className="text-3xl font-bold text-red-600 mb-6 text-center">Pricing Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {["Basic", "Pro", "Premium"].map((plan) => (
          <div key={plan} className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-xl font-bold text-orange-900 mb-4">{plan}</h3>
            <p className="text-3xl font-bold text-red-600 mb-4">${plan === "Basic" ? "0" : plan === "Pro" ? "49" : "99"}</p>
            <button className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-2 rounded">Choose Plan</button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ✅ Main App Component
const App = () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen">
          <Navbar />
          <main className="min-h-screen bg-orange-50">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<SignupPage />} />
              <Route path="/pricing" element={<Pricing />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
