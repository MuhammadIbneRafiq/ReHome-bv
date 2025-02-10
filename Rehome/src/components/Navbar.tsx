import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { ModeToggle } from "./ui/ModeToggle";
import { NamedLogoWithLink } from "./Logo";
import UserAvatar from "./UserAvatar";
import { useAuth } from "../hooks/useAuth";
import '../index.css';
import { useState, useEffect } from 'react';

export default function Navbar() {
    const { isAuthenticated } = useAuth();
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isSticky, setIsSticky] = useState(true);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

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

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-[102] w-full text-nav-label bg-gradient-to-r from-orange-500 to-red-600 shadow-md transition-transform ease-curve-d duration-600 ${isSticky ? 'translate-y-0' : '-translate-y-full'
                }`}
        >
            <ToastContainer />
            <nav aria-label="Main navigation" className="h-16 max-w-[2000px] mx-auto flex items-center justify-between px-4 md:px-6"> {/* Reduced height to h-16 */}
                 <div className="flex items-center">
                    <NamedLogoWithLink />
                </div>

                <div className="flex items-center justify-center gap-4 md:gap-6">
                    {/* New Navigation Items */}
                    <div className="hidden md:flex flex-col items-center"> {/* Use flex-col to stack items */}
                        <div className="flex space-x-4"> {/* Put the links in a row */}
                            <Link to="/home" className="text-white text-sm transition-colors duration-fast hover:text-orange-200">
                                Home
                            </Link>
                            <Link to="/marketplace" className="text-white text-sm transition-colors duration-fast hover:text-orange-200">
                                Marketplace
                            </Link>
                            <Link to="/junk-removal" className="text-white text-sm transition-colors duration-fast hover:text-orange-200">
                                Junk Removal
                            </Link>
                            <Link to="/house-moving" className="text-white text-sm transition-colors duration-fast hover:text-orange-200">
                                House Moving
                            </Link>
                            <Link to="/item-donation" className="text-white text-sm transition-colors duration-fast hover:text-orange-200">
                                Item Donation
                            </Link>

                            <Link to="/pricing" className="text-white text-sm transition-colors duration-fast hover:text-orange-200">
                                Pricing
                            </Link>

                        </div>
                    </div>
                    <ModeToggle />
                    {!isAuthenticated && (
                        <>
                            <Link to="/register" className="text-white hidden md:block text-sm transition-colors duration-fast hover:text-orange-200">
                                Sign up
                            </Link>
                            <Link to="/login" className="text-white hidden md:block text-sm transition-colors duration-fast hover:text-orange-200">
                                Log in
                            </Link>
                        </>
                    )}
                    {isAuthenticated && <UserAvatar />}
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
                                    <Link to="/home" className="text-gray-400 transition-colors duration-fast hover:text-black hover:dark:text-white">
                                        Home
                                    </Link>
                                    <Link to="/marketplace" className="text-gray-400 transition-colors duration-fast hover:text-black hover:dark:text-white">
                                        Marketplace
                                    </Link>
                                    <Link to="/junk-removal" className="text-gray-400 transition-colors duration-fast hover:text-black hover:dark:text-white">
                                        Junk Removal
                                    </Link>
                                    <Link to="/house-moving" className="text-gray-400 transition-colors duration-fast hover:text-black hover:dark:text-white">
                                        House Moving
                                    </Link>
                                    <Link to="/item-donation" className="text-gray-400 transition-colors duration-fast hover:text-black hover:dark:text-white">
                                        Item Donation
                                    </Link>
                                    <Link to="/pricing" className="text-gray-400 transition-colors duration-fast hover:text-black hover:dark:text-white">
                                        Pricing
                                    </Link>
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
                                    {isAuthenticated && <UserAvatar />}
                                </nav>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
}