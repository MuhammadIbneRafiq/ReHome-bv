import React, { useState, useEffect } from 'react';
import { findClosestSupportedCity } from '../../utils/locationServices';
import { getMonthPricing } from '../../services/monthPricingService';
import { GooglePlaceObject } from '../../utils/locationServices';

interface EnhancedDatePickerProps {
    value: string;
    onChange: (isoDate: string) => void;
    placeholder?: string;
    className?: string;
    pickupPlace?: GooglePlaceObject | null;
    dropoffPlace?: GooglePlaceObject | null;
    serviceType?: 'item-transport' | 'house-moving';
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    label?: string;
}

interface DayInfo {
    day: number;
    date: Date;
    isCityDay: boolean;
    isEmpty: boolean;
    basePrice: number;
    priceType: string;
    colorCode: 'green' | 'orange' | 'red' | 'grey';
    assignedCities: string[];
    isBlocked: boolean;
}

function formatISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDaysInMonth(year: number, monthIndex: number): number {
    return new Date(year, monthIndex + 1, 0).getDate();
}

export const EnhancedDatePickerInline: React.FC<EnhancedDatePickerProps> = ({ 
    value, 
    onChange, 
    placeholder = 'Select date', 
    className,
    pickupPlace,
    dropoffPlace,
    isOpen = false,
    onOpenChange,
    label,
}) => {
    const initial = value ? new Date(value) : new Date();
    const [currentYear, setCurrentYear] = useState<number>(initial.getFullYear());
    const [currentMonth, setCurrentMonth] = useState<number>(initial.getMonth());
    const [isLoading, setIsLoading] = useState(false);
    const [dayInfos, setDayInfos] = useState<Map<string, DayInfo>>(new Map());
    const [pickupCity, setPickupCity] = useState<string | null>(null);
    const [dropoffCity, setDropoffCity] = useState<string | null>(null);

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dayNames = ['Su','Mo','Tu','We','Th','Fr','Sa'];

    const selectedDate = value ? new Date(value) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find closest cities when places change
    useEffect(() => {
        const findCities = async () => {
            if (!pickupPlace || !dropoffPlace) {
                setPickupCity(null);
                setDropoffCity(null);
                return;
            }

            const [pickupResult, dropoffResult] = await Promise.all([
                findClosestSupportedCity(pickupPlace),
                findClosestSupportedCity(dropoffPlace)
            ]);

            setPickupCity(pickupResult.city);
            setDropoffCity(dropoffResult.city);
        };

        findCities();
    }, [pickupPlace, dropoffPlace]);

    // Load month pricing from backend API (cached)
    useEffect(() => {
        const loadMonthPricing = async () => {
            if (!pickupCity || !dropoffCity) {
                setDayInfos(new Map());
                return;
            }

            setIsLoading(true);
            try {
                const pricingData = await getMonthPricing(currentYear, currentMonth, pickupCity, dropoffCity);
                
                const newDayInfos = new Map<string, DayInfo>();
                
                for (const [dateStr, pricing] of pricingData) {
                    const date = new Date(dateStr);
                    
                    newDayInfos.set(dateStr, {
                        day: date.getDate(),
                        date,
                        isCityDay: pricing.isCityDay,
                        isEmpty: pricing.isEmpty,
                        basePrice: pricing.basePrice,
                        priceType: pricing.priceType,
                        colorCode: pricing.isBlocked ? 'grey' : pricing.colorCode,
                        assignedCities: pricing.assignedCities,
                        isBlocked: pricing.isBlocked
                    });
                }
                
                setDayInfos(newDayInfos);
                console.log('[EnhancedDatePicker] Loaded', newDayInfos.size, 'days from backend');
            } catch (error) {
                console.error('[EnhancedDatePicker] Error loading month pricing:', error);
                setDayInfos(new Map());
            } finally {
                setIsLoading(false);
            }
        };

        loadMonthPricing();
    }, [currentYear, currentMonth, pickupCity, dropoffCity]);

    const handleSelect = (day: number) => {
        const date = new Date(currentYear, currentMonth, day);
        const dateStr = formatISO(date);
        onChange(dateStr);
        
        // Close calendar after selection
        if (onOpenChange) {
            onOpenChange(false);
        }
    };

    const toggleOpen = () => {
        if (onOpenChange) {
            onOpenChange(!isOpen);
        }
    };

    const goPrev = () => {
        const prev = new Date(currentYear, currentMonth - 1, 1);
        setCurrentYear(prev.getFullYear());
        setCurrentMonth(prev.getMonth());
    };

    const goNext = () => {
        const next = new Date(currentYear, currentMonth + 1, 1);
        setCurrentYear(next.getFullYear());
        setCurrentMonth(next.getMonth());
    };

    const prevMonthDays = (firstDayOfMonth + 6) % 7;
    const cells: Array<{ day: number | null; type: 'prev' | 'curr' | 'next' }> = [];
    for (let i = 0; i < prevMonthDays; i++) cells.push({ day: null, type: 'prev' });
    
    for (let day = 1; day <= daysInMonth; day++) {
        cells.push({ day, type: 'curr' });
    }
    
    while (cells.length < 42) {
        cells.push({ day: null, type: 'next' });
    }

    const displayValue = value ? new Date(value).toLocaleDateString() : '';

    return (
        <div className="w-full">
            {/* Date Input Trigger */}
            <div className="mb-2">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                )}
                <button
                    type="button"
                    onClick={toggleOpen}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border text-left ${className || ''}`}
                >
                    {displayValue || placeholder}
                </button>
            </div>

            {/* Inline Calendar (shown when isOpen is true) */}
            {isOpen && (
                <div className="w-full bg-white border border-gray-200 rounded-lg shadow-lg p-6 mb-4 animate-fadeIn">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <button 
                                onClick={goPrev} 
                                className="p-1 hover:bg-gray-100 rounded" 
                                type="button" 
                                aria-label="Previous month"
                            >
                                ◀
                            </button>
                            <h3 className="font-semibold">
                                {monthNames[currentMonth]} {currentYear}
                            </h3>
                            <button 
                                onClick={goNext} 
                                className="p-1 hover:bg-gray-100 rounded" 
                                type="button" 
                                aria-label="Next month"
                            >
                                ▶
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {dayNames.map(day => (
                                <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {cells.map((c, idx) => {
                                if (c.type !== 'curr' || c.day === null) {
                                    return <div key={idx} className="p-2 text-center text-gray-300">{c.day ?? ''}</div>;
                                }
                                
                                const dateStr = formatISO(new Date(currentYear, currentMonth, c.day));
                                const dayInfo = dayInfos.get(dateStr);
                                const isSelected = !!selectedDate &&
                                    selectedDate.getFullYear() === currentYear &&
                                    selectedDate.getMonth() === currentMonth &&
                                    selectedDate.getDate() === c.day;

                                const tooltipText = dayInfo
                                    ? dayInfo.isBlocked
                                        ? 'Date blocked - Unavailable for booking'
                                        : `${dayInfo.priceType}: €${dayInfo.basePrice}${dayInfo.assignedCities.length > 0 ? `\nCities: ${dayInfo.assignedCities.join(', ')}` : ''}`
                                    : 'Loading...';

                                // Get background/border classes based on colorCode
                                const getColorClasses = () => {
                                    if (isSelected) return 'bg-blue-500 text-white border-blue-500';
                                    if (dayInfo?.isBlocked || (new Date(currentYear, currentMonth, c.day ?? undefined) < today)) {
                                        return 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed line-through';
                                    }
                                    switch (dayInfo?.colorCode) {
                                        case 'green': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
                                        case 'orange': return 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200';
                                        case 'red': return 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100';
                                        default: return 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200';
                                    }
                                };

                                // Get price sticker gradient based on colorCode
                                const getStickerClasses = () => {
                                    switch (dayInfo?.colorCode) {
                                        case 'green': return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
                                        case 'orange': return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white';
                                        case 'red': return 'bg-gradient-to-r from-red-400 to-red-500 text-white';
                                        default: return 'bg-gray-400 text-white';
                                    }
                                };

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSelect(c.day!)}
                                        disabled={isLoading || dayInfo?.isBlocked || (new Date(currentYear, currentMonth, c.day ?? undefined) < today)}
                                        className={`p-2 text-sm rounded-full text-center relative transition-colors border ${getColorClasses()} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title={tooltipText}
                                    >
                                        {c.day}
                                        {dayInfo && !dayInfo.isBlocked && !(new Date(currentYear, currentMonth, c.day ?? undefined) < today) && (
                                            <div className={`absolute -top-3 -right-3 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border-2 border-white ${getStickerClasses()}`}>
                                                €{dayInfo.basePrice}
                                            </div>
                                        )}
                                        {(dayInfo?.isBlocked || (new Date(currentYear, currentMonth, c.day ?? undefined) < today)) && (
                                            <div className="absolute -top-3 -right-3 bg-gray-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border-2 border-white">
                                                ✕
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedDatePickerInline;
