import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from "./components/Navbar";
import { LanguageProvider } from "./hooks/useLanguage";
import ProtectedRoute from "./components/ProtectedRoute";
import { CartProvider } from "./contexts/CartContext";
import { DynamicModalProvider } from "./components/ui/DynamicModal";
import AuthErrorHandler from "./components/AuthErrorHandler";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useState, useEffect } from 'react';
import { initDynamicConstants, constantsLoaded } from './lib/constants';
import { cleanupRealtimeService } from './services/realtimeService';

// Import Pages
import LandingPage from "./lib/pages/LandingPage";
import LoginPage from "./lib/pages/LoginPage";
import SignupPage from "./lib/pages/SignupPage";
import MarketplacePage from "./lib/pages/MarketplacePage";
import ItemMovingPage from "./lib/pages/ItemMovingPage";
import HouseMovingPage from "./lib/pages/HouseMovingPage";
import ItemDonationPage from "./lib/pages/ItemDonationPage";
import WhyChooseUsPage from "./lib/pages/WhyChooseUsPage";
import ContactUsPage from "./lib/pages/ContactUsPage";
import AboutUsPage from "./lib/pages/AboutUsPage";
import SellerDashboard from "./lib/pages/SellerDashboard";
import SpecialRequestPage from "./lib/pages/SpecialRequestPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import MessagesPage from "./lib/pages/MessagesPage";
import HouseMovingLearnMore from "./lib/pages/HouseMovingLearnMore";
import ItemTransportLearnMore from "./lib/pages/ItemTransportLearnMore";
import SpecialRequestLearnMore from "./lib/pages/SpecialRequestLearnMore";
import MarketplaceLearnMore from "./lib/pages/MarketplaceLearnMore";
import TermsPage from "./lib/pages/TermsPage";
import PrivacyPage from "./lib/pages/PrivacyPage";
import CookiesPage from "./lib/pages/CookiesPage";
import AuthCallback from "./hooks/AuthCallback";
import GoogleOAuthCallback from "./components/GoogleOAuthCallback";
import TestNSFW from "./components/TestNSFW";
import RequireAdmin from "./components/RequireAdmin";

// Loading Component
const LoadingScreen = () => (
  <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center">
    <div className="text-center">
      {/* ReHome Logo */}
      <div className="mb-8">
        <img 
          src="/assets/logorehome.png" 
          alt="ReHome" 
          className="h-16 w-auto mx-auto"
        />
      </div>
      
      {/* Loading Spinner */}
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500 mx-auto mb-6"></div>
      
      {/* Loading Text */}
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading ReHome</h2>
      <p className="text-gray-600 mb-4">Preparing your moving experience...</p>
      
      {/* Progress Bar */}
      <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto mt-6">
        <div className="bg-orange-500 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
      </div>
    </div>
  </div>
);

// ✅ Main App Component
const App = () => {
  const queryClient = new QueryClient();
  const [isConstantsLoaded, setIsConstantsLoaded] = useState(constantsLoaded);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || process.env.REACT_APP_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const loadConstants = async () => {
      try {
        if (!constantsLoaded) {
          console.log('[App] Constants not loaded, initializing...');
          await initDynamicConstants();
        }
        setIsConstantsLoaded(true);
      } catch (error) {
        console.error('[App] Failed to load constants:', error);
        setLoadingError('Failed to load application data. Please refresh the page.');
      }
    };

    loadConstants();
    
    // Cleanup Realtime subscriptions on component unmount
    return () => {
      console.log('[App] Cleaning up Realtime subscriptions');
      cleanupRealtimeService();
    };
  }, []);

  // Show error screen if constants failed to load
  if (loadingError) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Loading Error</h1>
          <p className="text-gray-600 mb-6 max-w-md">{loadingError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Show loading screen while constants are loading
  if (!isConstantsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <LanguageProvider>
          <CartProvider>
            <BrowserRouter>
              <DynamicModalProvider>
                <AuthErrorHandler>
                  <div className="min-h-screen">
                    <Navbar />
                    <main className="min-h-screen bg-orange-50">
                      <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/marketplace" element={<MarketplacePage />} />
                        <Route path="/marketplace/learn-more" element={<MarketplaceLearnMore />} />
                        <Route path="/house-moving" element={<HouseMovingPage />} />
                        <Route path="/house-moving/learn-more" element={<HouseMovingLearnMore />} />
                        <Route path="/item-transport" element={<ItemMovingPage />} />
                        <Route path="/item-transport/learn-more" element={<ItemTransportLearnMore />} />
                        <Route path="/item-moving" element={<Navigate to="/item-transport" replace />} />
                        <Route path="/item-donation" element={<ItemDonationPage />} />
                        <Route path="/special-request" element={<SpecialRequestPage />} />
                        <Route path="/special-request/learn-more" element={<SpecialRequestLearnMore />} />
                        <Route path="/sell-dash" element={
                          <ProtectedRoute>
                            <SellerDashboard />
                          </ProtectedRoute>
                        } />
                        <Route path="/messages" element={
                          <ProtectedRoute>
                            <MessagesPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/admin" element={
                          <RequireAdmin>
                            <AdminDashboard />
                          </RequireAdmin>
                        } />
                        <Route path="/auth/callback" element={<AuthCallback />} />
                        <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />
                        <Route path="/why-choose-us" element={<WhyChooseUsPage />} />
                        <Route path="/contact-us" element={<ContactUsPage />} />
                        <Route path="/about-us" element={<AboutUsPage />} />
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                        <Route path="/cookies" element={<CookiesPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<SignupPage />} />
                        <Route path="/test-nsfw" element={<TestNSFW />} />
                      </Routes>
                    </main>
                    <ToastContainer
                      position="top-right"
                      autoClose={3000}
                      hideProgressBar={false}
                      newestOnTop={false}
                      closeOnClick
                      rtl={false}
                      pauseOnFocusLoss
                      draggable
                      pauseOnHover
                      theme="light"
                    />
                  </div>
                </AuthErrorHandler>
              </DynamicModalProvider>
            </BrowserRouter>
          </CartProvider>
        </LanguageProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
};

export default App;