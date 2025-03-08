import * as React from 'react';
import Footer from "../../components/Footer";
// Import Images - Assuming you have these files in assets
import sofaImage from "../../assets/IMG-20250208-WA0001.jpg";
import tableImage from "../../assets/IMG-20250208-WA0010.jpg";
import chairImage from "../../assets/IMG-20250208-WA0013.jpg";
import { motion } from "framer-motion"; // Import Framer Motion
import { FaHandshake, FaStar, FaHome, FaUserGraduate } from "react-icons/fa"; // Import Icons
import { Link } from "react-router-dom";
import { MdCheckCircle, MdSupportAgent } from "react-icons/md";
import { FurnitureItem } from "../../types/furniture";
import { useTranslation } from "react-i18next";
import { translateFurnitureItem } from "../utils/dynamicTranslation";

            {/* Why Choose Us Section */}
            <div className="py-16 bg-orange-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
                            Why Choose ReHome?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            We're committed to making your moving and furniture experience seamless and stress-free.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-2xl font-semibold text-gray-900 mb-4">For Buyers</h3>
                            <ul className="space-y-3 text-gray-600">
                                <li>• Access to quality, verified furniture</li>
                                <li>• Transparent pricing and no hidden fees</li>
                                <li>• Integrated delivery service</li>
                            </ul>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-2xl font-semibold text-gray-900 mb-4">For Sellers</h3>
                            <ul className="space-y-3 text-gray-600">
                                <li>• Easy listing process</li>
                                <li>• Wide reach to potential buyers</li>
                                <li>• Secure payment handling</li>
                            </ul>
                        </div>
                    </div>

                    <div className="text-center">
                        <Link
                            to="/why-choose-us"
                            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
                        >
                            Learn More About Us
                            <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div> 