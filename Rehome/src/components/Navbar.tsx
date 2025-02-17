import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Menu, Sun, Moon } from "lucide-react"; // Import Sun and Moon
import UserAvatar from "./UserAvatar";
import { useAuth } from "../hooks/useAuth";
import '../index.css';
import { useState, useEffect } from 'react';
import { useTheme } from "../services/providers/ThemeProvider";
import { ChevronDownIcon } from "@radix-ui/react-icons"; // if it exists

export default function Navbar() {
    const { isAuthenticated, userEmail, handleLogout } = useAuth();
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isSticky, setIsSticky] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const { theme, toggleTheme } = useTheme(); // Assuming you have a theme context

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
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
            if (isPopupOpen && !e.target.closest(".three-dot")) {
                setIsPopupOpen(false);
            }
        };

        document.addEventListener("click", handleOutsideClick);

        return () => {
            document.removeEventListener("click", handleOutsideClick);
        };
    }, [isPopupOpen]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const togglePopup = () => {
        setIsPopupOpen(!isPopupOpen);
    };

    // Dummy Language Options (Replace with your actual language selection logic)
    const [selectedLanguage, setSelectedLanguage] = useState("en");
    const languageOptions = [
        { code: "en", label: "English" },
        { code: "es", label: "Español" }, // Example
        // Add more language options as needed
    ];

    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedLanguage(event.target.value);
        // Add your logic to change the language (e.g., update context, etc.)
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
                            value={selectedLanguage}
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
                            <button onClick={toggleDropdown} className="rehome-nav-link">
                                Transportation
                            </button>
                            <Link to="/marketplace" className="rehome-nav-link">
                                Marketplace
                            </Link>
                            <Link to="/special-request" className="rehome-nav-link">
                                Special Request
                            </Link>

                            {isDropdownOpen && (
                                <div className="absolute top-12 bg-white shadow-lg rounded-md  min-w-[150px] z-50"> {/* Added absolute positioning */}
                                    <Link to="/item-moving" className="block px-4 py-2 text-gray-700 hover:bg-gray-200 whitespace-nowrap">
                                        Item Moving
                                    </Link>
                                    <Link to="/house-moving" className="block px-4 py-2 text-gray-700 hover:bg-gray-200 whitespace-nowrap">
                                        House Moving
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={toggleTheme} className="rehome-nav-icon-button"> {/* Style the icon button  */}
                        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>
                    {!isAuthenticated && (
                        <>
                            <Link to="/register" className="rehome-nav-button">
                                Sign up
                            </Link>
                            <Link to="/login" className="rehome-nav-button">
                                Log in
                            </Link>
                        </>
                    )}
                    {isAuthenticated && (
                        <>
                            <Link to="/sell-dash" className="rehome-dashboard-button">
                                Dashboard
                            </Link>
                            <div className="flex items-center space-x-2">
                                <UserAvatar />
                                <span className="text-white">{userEmail}</span> {/* Display the email */}
                                <Button variant="link" onClick={handleLogout}>Logout</Button>
                            </div>
                        </>
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
                                    <button onClick={toggleDropdown} className="rehome-nav-link">
                                        Transportation
                                    </button>
                                    <Link to="/marketplace" className="rehome-nav-link">
                                        Marketplace
                                    </Link>
                                    <Link to="/special-request" className="rehome-nav-link">
                                        Special Request
                                    </Link>

                                    {isDropdownOpen && (
                                        <div className="absolute top-12 bg-white shadow-lg rounded-md  min-w-[150px] z-50"> {/* Added absolute positioning */}
                                            <Link to="/item-moving" className="block px-4 py-2 text-gray-700 hover:bg-gray-200 whitespace-nowrap">
                                                Item Moving
                                            </Link>
                                            <Link to="/house-moving" className="block px-4 py-2 text-gray-700 hover:bg-gray-200 whitespace-nowrap">
                                                House Moving
                                            </Link>
                                        </div>
                                    )}
                                    {!isAuthenticated && (
                                        <>
                                            <Link to="/register" className="text-gray-400 transition-colors duration-fast hover:text-black hover:dark:text-white">
                                                Sign up
                                            </Link>
                                            <Link to="/login" className="text-gray-400 transition-colors duration-fast hover:text-black hover:dark:text-white">
                                                Log in
                                            </Link>
                                        </>
                                    )}
                                    {isAuthenticated && (
                                        <>
                                            <Link to="/sell-dash" className="text-gray-400 transition-colors duration-fast hover:text-black hover:dark:text-white">
                                                Dashboard
                                            </Link>
                                            <Link to="/profile" className="text-gray-400 transition-colors duration-fast hover:text-black hover:dark:text-white">
                                                {userEmail}
                                            </Link>
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