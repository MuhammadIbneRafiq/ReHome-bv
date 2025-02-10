import React, { useState } from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./services/providers/ThemeProvider";
import { Link } from 'react-router-dom';
import { UiProvider } from "./components/realTimeChat/contexts/UiContext";

// Simplified components all in one file
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

const LandingPage = () => (
  <div className="min-h-screen bg-orange-50">
    <div className="max-w-7xl mx-auto pt-20 px-4">
      <h1 className="text-5xl font-bold text-red-600 mb-6">Find Your Perfect Furniture</h1>
      <p className="text-xl text-orange-800 mb-8">Discover amazing deals on pre-loved furniture</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white p-6 rounded-lg shadow-lg">
            <div className="bg-orange-200 h-48 rounded-md mb-4"></div>
            <h3 className="text-xl font-semibold text-orange-900">Vintage Chair</h3>
            <p className="text-orange-600">$199</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const LoginPage = () => (
  <div className="min-h-screen bg-orange-50 flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h2 className="text-3xl font-bold text-red-600 mb-6">Login</h2>
      <input type="email" placeholder="Email" className="w-full mb-4 p-2 border rounded" />
      <input type="password" placeholder="Password" className="w-full mb-4 p-2 border rounded" />
      <button className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-2 rounded">
        Login
      </button>
    </div>
  </div>
);

const SignupPage = () => (
  <div className="min-h-screen bg-orange-50 flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h2 className="text-3xl font-bold text-red-600 mb-6">Register</h2>
      <input type="text" placeholder="Name" className="w-full mb-4 p-2 border rounded" />
      <input type="email" placeholder="Email" className="w-full mb-4 p-2 border rounded" />
      <input type="password" placeholder="Password" className="w-full mb-4 p-2 border rounded" />
      <button className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-2 rounded">
        Sign Up
      </button>
    </div>
  </div>
);

const HomePage = () => (
  <div className="min-h-screen bg-orange-50 p-4">
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-red-600 mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="bg-white p-4 rounded-lg shadow">
            <div className="bg-orange-200 h-32 rounded-md mb-2"></div>
            <h3 className="font-semibold text-orange-900">Product {item}</h3>
            <p className="text-orange-600">$299</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Pricing = () => (
  <div className="min-h-screen bg-orange-50 p-4">
    <div className="max-w-7xl mx-auto pt-10">
      <h2 className="text-3xl font-bold text-red-600 mb-6 text-center">Pricing Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Basic', 'Pro', 'Premium'].map((plan) => (
          <div key={plan} className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-xl font-bold text-orange-900 mb-4">{plan}</h3>
            <p className="text-3xl font-bold text-red-600 mb-4">${plan === 'Basic' ? '0' : plan === 'Pro' ? '49' : '99'}</p>
            <button className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-2 rounded">
              Choose Plan
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Main App component
function App() {
  const queryClient = new QueryClient();

  return (
    <UiProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <BrowserRouter>
            <div className="min-h-screen">
              <Navbar />
              <main className="min-h-screen bg-orange-50">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/chatHome" element={<HomePage />} />
                  <Route path="/chat/:id" element={<HomePage />} />
                  <Route path="/project/:id" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<SignupPage />} />
                  <Route path="/pricing" element={<Pricing />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </UiProvider>
  );
}

export default App;