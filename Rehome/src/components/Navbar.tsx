import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button } from "./ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react"; // Import Sun and Moon
import UserAvatar from "./UserAvatar";
import { useAuth } from "../hooks/useAuth";
import '../index.css';
import { useState, useEffect, useRef } from 'react'; // Import useRef
import { ChevronDownIcon } from "@radix-ui/react-icons"; // if it exists
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';

export default function Navbar() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentLanguage, changeLanguage, languageOptions } = useLanguage();
    const { isAuthenticated, logout } = useAuth();
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isSticky, setIsSticky] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null); // Ref to the dropdown container
    const transportationButtonRef = useRef<HTMLButtonElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const toggleUserMenu = () => {
        setUserMenuOpen(!userMenuOpen);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
        setUserMenuOpen(false);
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

    const togglePopup = () => {
        setIsPopupOpen(!isPopupOpen);
    };

    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        changeLanguage(event.target.value);
    };

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-[102] w-full text-nav-label bg-gradient-to-r from-orange-500 to-red-600 shadow-md transition-transform ease-curve-d duration-600 ${isSticky ? 'translate-y-0' : '-translate-y-full'
                }`}
        >
            <ToastContainer />
            <nav aria-label="Main navigation" className="h-16 max-w-[2000px] mx-auto flex items-center justify-between px-4 md:px-6">
                 <div className="flex items-center">
                    <Link to="/" className="text-2xl font-bold text-white"> {/* ReHome Text Logo */}
                        Rehome B.v.
                    </Link>
                    {/* Language Selector */}
                    <div className="ml-6 relative">
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
                            <ChevronDownIcon className="h-5 w-5" aria-hidden="true" /> {/*  Using a Radix UI icon */}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-4 md:gap-6">
                    {/* New Navigation Items */}
                    <div className="hidden md:flex flex-col items-center"> {/* Use flex-col to stack items */}
                        <div className="flex space-x-4 relative"> {/* Added relative class */}
                            <button
                                ref={transportationButtonRef}
                                onClick={toggleDropdown}
                                className="rehome-nav-link"
                            >
                                {t('navbar.transportation')}
                            </button>
                            <Link to="/marketplace" className="rehome-nav-link">
                                {t('navbar.marketplace')}
                            </Link>
                            <Link to="/special-request" className="rehome-nav-link">
                                {t('navbar.specialRequest')}
                            </Link>

                            {isDropdownOpen && (
                                <div ref={dropdownRef} className="absolute top-12 bg-white shadow-lg rounded-md  min-w-[150px] z-50"> {/* Added absolute positioning */}
                                    <Link to="/item-moving" className="block px-4 py-2 text-gray-700 hover:bg-gray-200 whitespace-nowrap">
                                        {t('navbar.itemMoving')}
                                    </Link>
                                    <Link to="/house-moving" className="block px-4 py-2 text-gray-700 hover:bg-gray-200 whitespace-nowrap">
                                        {t('navbar.houseMoving')}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {!isAuthenticated && (
                        <>
                            <Link to="/register" className="rehome-nav-button">
                                {t('navbar.signup')}
                            </Link>
                            <Link to="/login" className="rehome-nav-button">
                                {t('navbar.login')}
                            </Link>
                        </>
                    )}
                    {isAuthenticated && (
                        <div className="relative">
                            <div className="flex items-center space-x-3">
                                <Link to="/sell-dash" className="rehome-dashboard-button">
                                    {t('navbar.dashboard')}
                                </Link>
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
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            {t('dashboard.title')}
                                        </Link>
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
                    <div className="relative md:hidden">
                        {!isAuthenticated &&
                            <Button variant="ghost" size="icon" className="md:hidden three-dot dark:text-white text-black" onClick={togglePopup}>
                                <Menu className="w-6 h-6" />
                            </Button>
                        }
                        {isPopupOpen && (
                            <div className="absolute border-solid border-2 border-black-200 right-0 top-10 bg-transperant text-gray-400 shadow-lg rounded-lg w-40">
                                <nav className="grid gap-2 p-4 text-sm font-medium">
                                    {/* New Navigation Items (Mobile) */}
                                    <Link to="/marketplace" className="text-gray-400 transition-colors duration-fast hover:text-black hover:dark:text-white">
                                        {t('navbar.marketplace')}
                                    </Link>
                                    <Link to="/item-moving" className="text-gray-400 transition-colors duration-fast hover:text-black hover:dark:text-white">
                                        {t('navbar.itemMoving')}
                                    </Link>
                                    <Link to="/house-moving" className="text-gray-400 transition-colors duration-fast hover:text-black hover:dark:text-white">
                                        {t('navbar.houseMoving')}
                                    </Link>
                                    <Link to="/special-request" className="text-gray-400 transition-colors duration-fast hover:text-black hover:dark:text-white">
                                        {t('navbar.specialRequest')}
                                    </Link>
                                    {!isAuthenticated && (
                                        <>
                                            <Link to="/register" className="text-gray-400 transition-colors duration-fast hover:text-black hover:dark:text-white">
                                                {t('navbar.signup')}
                                            </Link>
                                            <Link to="/login" className="text-gray-400 transition-colors duration-fast hover:text-black hover:dark:text-white">
                                                {t('navbar.login')}
                                            </Link>
                                        </>
                                    )}
                                    {isAuthenticated && (
                                        <>
                                            <Link to="/sell-dash" className="text-gray-400 transition-colors duration-fast hover:text-black hover:dark:text-white">
                                                {t('navbar.dashboard')}
                                            </Link>
                                            <button 
                                                onClick={handleLogout}
                                                className="text-left text-gray-400 transition-colors duration-fast hover:text-black hover:dark:text-white"
                                            >
                                                {t('auth.logout')}
                                            </button>
                                        </>
                                    )}
                                </nav>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
}