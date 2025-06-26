// ToastContainer is handled in App.tsx - removed to avoid conflicts
import { Button } from "./ui/button";
import { Link, useNavigate } from "react-router-dom";
import UserAvatar from "./UserAvatar";
import { useAuth } from "../hooks/useAuth";
import '../index.css';
import { useState, useEffect, useRef } from 'react'; // Import useRef
import { ChevronDownIcon } from "@radix-ui/react-icons"; // if it exists
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';
import logoImage from "../assets/logorehome.jpg"; // Import the ReHome logo
import MessageNotifications from './MessageNotifications';
import { jwtDecode } from "jwt-decode";

// List of admin email addresses - keep in sync with AdminRoute.tsx
const ADMIN_EMAILS = [
  'muhammadibnerafiq123@gmail.com',
  'testnewuser12345@gmail.com', // Test account with admin access
  'egzmanagement@gmail.com',
  'samuel.stroehle8@gmail.com',
  'info@rehomebv.com'
];

export default function Navbar() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentLanguage, changeLanguage, languageOptions } = useLanguage();
    const { isAuthenticated, logout, user } = useAuth();
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isSticky, setIsSticky] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [sessionTimeLeft, setSessionTimeLeft] = useState<number | null>(null);
    const [isSessionWarning, setIsSessionWarning] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null); // Ref to the dropdown container
    const transportationButtonRef = useRef<HTMLButtonElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const toggleUserMenu = () => {
        setUserMenuOpen(!userMenuOpen);
    };

    const handleLogout = () => {
        // Clear local storage
        localStorage.removeItem("accessToken");
        localStorage.removeItem("token");
        localStorage.removeItem("google_user_info");
        
        // Call the auth logout function
        logout();
        
        // Navigate and close menu
        navigate('/');
        setUserMenuOpen(false);
        setIsMobileMenuOpen(false); // Close mobile menu on logout
    };

    const handleScroll = () => {
        if (window.scrollY > lastScrollY && window.scrollY > 60) {
            setIsSticky(false);
        } else {
            setIsSticky(true);
        }
        setLastScrollY(window.scrollY);
    };
    
    useEffect(() => {
        const handleOutsideClick = (e: any) => {
            if (
                isDropdownOpen &&
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target) &&
                transportationButtonRef.current &&
                !transportationButtonRef.current.contains(e.target)
            ) {
                setIsDropdownOpen(false);
            }

            if (
                userMenuOpen &&
                userMenuRef.current &&
                !userMenuRef.current.contains(e.target)
            ) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener("click", handleOutsideClick);

        return () => {
            document.removeEventListener("click", handleOutsideClick);
        };
    }, [isDropdownOpen, userMenuOpen]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        changeLanguage(event.target.value);
    };

    const navLinks = [
        { to: "/marketplace", label: t('navbar.marketplace') },
        { to: "/item-donation", label: t('navbar.itemDonation') },
        { to: "/house-moving", label: t('navbar.houseMoving') },
        { to: "/item-transport", label: "Item Transport" },
        { to: "/special-request", label: t('navbar.specialRequest') },
    ];

    // Monitor session expiration
    useEffect(() => {
        if (!isAuthenticated) return;

        const checkSessionTime = () => {
            const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    if (decoded.exp) {
                        const expirationTime = decoded.exp * 1000;
                        const currentTime = Date.now();
                        const timeLeft = expirationTime - currentTime;
                        
                        setSessionTimeLeft(Math.max(0, timeLeft));
                        
                        // Show warning if less than 5 minutes left
                        const fiveMinutes = 5 * 60 * 1000;
                        setIsSessionWarning(timeLeft < fiveMinutes && timeLeft > 0);
                    }
                } catch (error) {
                    console.error('Error checking session time:', error);
                }
            }
        };

        // Check immediately and then every 30 seconds
        checkSessionTime();
        const interval = setInterval(checkSessionTime, 30000);

        return () => clearInterval(interval);
    }, [isAuthenticated]);

    // Format time remaining
    const formatTimeLeft = (ms: number) => {
        const minutes = Math.floor(ms / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m`;
    };

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-[102] w-full text-nav-label bg-gradient-to-r from-orange-500 to-red-600 shadow-md transition-transform ease-curve-d duration-600 ${isSticky ? 'translate-y-0' : '-translate-y-full'
                }`}
        >
            <nav aria-label="Main navigation" className="h-16 max-w-[2000px] mx-auto flex items-center justify-between px-4 md:px-6">
                <div className="flex items-center">
                    <Link to="/" className="flex items-center text-2xl font-bold text-white"> 
                        <img 
                            src={logoImage} 
                            alt="ReHome Logo" 
                            className="w-8 h-8 mr-2 rounded-full object-cover border border-white"
                        />
                        Rehome B.v.
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center justify-center gap-4 md:gap-6">
                    {/* Centered Navigation Links */}
                    <div className="flex space-x-4">
                        <Link to="/item-donation" className="rehome-nav-link">
                            {t('navbar.itemDonation')}
                        </Link>
                        <Link to="/marketplace" className="rehome-nav-link">
                            {t('navbar.marketplace')}
                        </Link>
                        <Link to="/house-moving" className="rehome-nav-link">
                            {t('navbar.houseMoving')}
                        </Link>
                        <Link to="/item-transport" className="rehome-nav-link">
                            Item Transport
                        </Link>
                        <Link to="/special-request" className="rehome-nav-link">
                            {t('navbar.specialRequest')}
                        </Link>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-4">
                     {/* Language Selector */}
                     <div className="relative">
                        <select
                            value={currentLanguage}
                            onChange={handleLanguageChange}
                            className="bg-white text-sm text-gray-700 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none pr-8"
                        >
                            {languageOptions.map((option) => (
                                <option key={option.code} value={option.code}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
                        </div>
                    </div>
                    {!isAuthenticated ? (
                        <>
                            <Link to="/register" className="rehome-nav-button">
                                {t('navbar.signup')}
                            </Link>
                            <Link to="/login" className="rehome-nav-button">
                                {t('navbar.login')}
                            </Link>
                        </>
                    ) : (
                        <div className="relative">
                            <div className="flex items-center space-x-3">
                                <Link to="/sell-dash" className="rehome-dashboard-button">
                                    {t('navbar.dashboard')}
                                </Link>
                                <MessageNotifications onClick={() => navigate('/messages')} />
                                
                                {/* Session Warning Indicator */}
                                {isSessionWarning && sessionTimeLeft && (
                                    <div className="flex items-center bg-yellow-100 border border-yellow-300 text-yellow-800 px-2 py-1 rounded-md text-xs">
                                        <span className="mr-1">⏰</span>
                                        <span>Session expires in {formatTimeLeft(sessionTimeLeft)}</span>
                                    </div>
                                )}
                                
                                <div 
                                    onClick={toggleUserMenu} 
                                    className="cursor-pointer"
                                >
                                    <UserAvatar />
                                </div>
                            </div>
                            
                            {userMenuOpen && (
                                <div 
                                    ref={userMenuRef}
                                    className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50"
                                >
                                    <div className="py-1">
                                        <Link 
                                            to="/sell-dash" 
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            {t('navbar.dashboard')}
                                        </Link>
                                        <Link 
                                            to="/messages" 
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Messages
                                        </Link>
                                        {/* Admin Dashboard Link - Only shown for admin users */}
                                        {user && ADMIN_EMAILS.includes(user.email) && (
                                            <Link 
                                                to="/admin" 
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={() => setUserMenuOpen(false)}
                                            >
                                                Admin Dashboard
                                            </Link>
                                        )}
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            {t('auth.logout')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white bg-orange-500 border-2 border-white shadow-lg rounded-lg p-2 hover:bg-orange-600 focus:ring-2 focus:ring-white focus:outline-none transition-all duration-200"
                        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                        onClick={toggleMobileMenu}>
                        {/* Custom 4-bar hamburger icon for extra highlight */}
                        <span className="flex flex-col justify-center items-center w-8 h-8">
                          <span className="block w-7 h-1 bg-white rounded mb-1"></span>
                          <span className="block w-7 h-1 bg-white rounded mb-1"></span>
                          <span className="block w-7 h-1 bg-white rounded mb-1"></span>
                          <span className="block w-7 h-1 bg-white rounded"></span>
                        </span>
                    </Button>
                </div>
            </nav>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                 <div className="md:hidden bg-white text-black">
                    <nav className="flex flex-col p-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className="py-2 text-center text-lg hover:bg-gray-100 rounded-md"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                         <div className="mt-4 pt-4 border-t border-gray-200">
                             <div className="relative mb-4">
                                <select
                                    value={currentLanguage}
                                    onChange={handleLanguageChange}
                                    className="w-full bg-gray-100 text-sm text-gray-700 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none pr-8"
                                >
                                    {languageOptions.map((option) => (
                                        <option key={option.code} value={option.code}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
                                </div>
                            </div>

                            {isAuthenticated ? (
                                <>
                                    <Link to="/sell-dash" className="block w-full text-center py-2 text-lg hover:bg-gray-100 rounded-md" onClick={() => setIsMobileMenuOpen(false)}>
                                        {t('navbar.dashboard')}
                                    </Link>
                                     <Link to="/messages" className="block w-full text-center py-2 text-lg hover:bg-gray-100 rounded-md" onClick={() => setIsMobileMenuOpen(false)}>
                                        Messages
                                    </Link>
                                    {user && ADMIN_EMAILS.includes(user.email) && (
                                        <Link to="/admin" className="block w-full text-center py-2 text-lg hover:bg-gray-100 rounded-md" onClick={() => setIsMobileMenuOpen(false)}>
                                            Admin Dashboard
                                        </Link>
                                    )}
                                    <button onClick={handleLogout} className="block w-full text-center py-2 text-lg hover:bg-gray-100 rounded-md">
                                        {t('auth.logout')}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/register" className="block w-full text-center py-2 text-lg hover:bg-gray-100 rounded-md" onClick={() => setIsMobileMenuOpen(false)}>
                                        {t('navbar.signup')}
                                    </Link>
                                    <Link to="/login" className="block w-full text-center py-2 text-lg hover:bg-gray-100 rounded-md" onClick={() => setIsMobileMenuOpen(false)}>
                                        {t('navbar.login')}
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                 </div>
            )}
        </header>
    );
}