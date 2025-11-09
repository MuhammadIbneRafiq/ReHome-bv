import React, { useState, useEffect } from 'react';
import { findClosestSupportedCity } from '../../utils/locationServices';
import { getMonthSchedule, DaySchedule } from '../../services/scheduleService';
import { getBlockedDatesForCalendar, BlockedDate } from '../../services/blockedDatesService';
import { cityBaseCharges } from '../../lib/constants';
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
    isGreen: boolean;
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
    const [selectedDayInfo, setSelectedDayInfo] = useState<DayInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [dayInfos, setDayInfos] = useState<Map<string, DayInfo>>(new Map());
    const [scheduleData, setScheduleData] = useState<Map<string, DaySchedule>>(new Map());
    const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dayNames = ['Su','Mo','Tu','We','Th','Fr','Sa'];

    const selectedDate = value ? new Date(value) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Load schedule data and blocked dates for the month
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const startDate = new Date(currentYear, currentMonth, 1);
                const endDate = new Date(currentYear, currentMonth + 1, 0);
                const startDateStr = formatISO(startDate);
                const endDateStr = formatISO(endDate);

                const [monthSchedule, blockedDatesData] = await Promise.all([
                    getMonthSchedule(currentYear, currentMonth),
                    getBlockedDatesForCalendar(startDateStr, endDateStr)
                ]);

                setScheduleData(monthSchedule);
                
                // Create a set of blocked date strings for quick lookup
                const blockedSet = new Set<string>();
                blockedDatesData.forEach((bd: BlockedDate) => {
                    blockedSet.add(bd.date);
                });
                setBlockedDates(blockedSet);
            } catch (error) {
                console.error('[EnhancedDatePicker] Error loading data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [currentYear, currentMonth]);

    // Calculate day infos when places or schedule data changes
    useEffect(() => {
        const calculateDayInfos = async () => {
            if (!pickupPlace || !dropoffPlace || scheduleData.size === 0) {
                setDayInfos(new Map());
                return;
            }

            const pickupCityResult = await findClosestSupportedCity(pickupPlace);
            const dropoffCityResult = await findClosestSupportedCity(dropoffPlace);
            
            const pickupCity = pickupCityResult.city;
            const dropoffCity = dropoffCityResult.city;
            
            if (!pickupCity || !dropoffCity) {
                setDayInfos(new Map());
                return;
            }

            const newDayInfos = new Map<string, DayInfo>();

            try {
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(currentYear, currentMonth, day);
                    const dateStr = formatISO(date);
                    
                    const daySchedule = scheduleData.get(dateStr);
                    
                    // Check if EITHER pickup or dropoff city is scheduled
                    const pickupScheduled = daySchedule?.assignedCities.includes(pickupCity) || false;
                    const dropoffScheduled = daySchedule?.assignedCities.includes(dropoffCity) || false;
                    const isCityDay = pickupScheduled || dropoffScheduled;
                    
                    // Empty is STRICTLY from the global empty check (no cities assigned at all)
                    const isEmpty = daySchedule?.isEmpty ?? true;
                    const assignedCities = daySchedule?.assignedCities || [];
                    
                    let basePrice = 0;
                    let priceType = '';
                    
                    if (pickupCity === dropoffCity) {
                        if (isCityDay || isEmpty) {
                            basePrice = cityBaseCharges[pickupCity]?.cityDay || 0;
                            priceType = 'City Day Rate';
                        } else {
                            basePrice = cityBaseCharges[pickupCity]?.normal || 0;
                            priceType = 'Standard Rate';
                        }
                    } else {
                        if (isCityDay || isEmpty) {
                            const pickupPrice = cityBaseCharges[pickupCity]?.cityDay || 0;
                            const dropoffPrice = cityBaseCharges[dropoffCity]?.normal || 0;
                            basePrice = (pickupPrice + dropoffPrice) / 2;
                            priceType = 'Intercity Rate (City Day)';
                        } else {
                            basePrice = cityBaseCharges[pickupCity]?.normal || 0;
                            priceType = 'Intercity Rate';
                        }
                    }

                    const isBlocked = blockedDates.has(dateStr);
                    const isGreen = (isCityDay || isEmpty) && !isBlocked;

                    newDayInfos.set(dateStr, {
                        day,
                        date,
                        isCityDay,
                        isEmpty,
                        basePrice,
                        priceType,
                        isGreen,
                        assignedCities,
                        isBlocked
                    });
                }
            } catch (error) {
                console.error('[EnhancedDatePicker] Error calculating day infos:', error);
            }

            setDayInfos(newDayInfos);
        };

        calculateDayInfos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentYear, currentMonth, pickupPlace, dropoffPlace, scheduleData, blockedDates]);

    const handleSelect = (day: number) => {
        const date = new Date(currentYear, currentMonth, day);
        const dateStr = formatISO(date);
        onChange(dateStr);
        
        const dayInfo = dayInfos.get(dateStr);
        setSelectedDayInfo(dayInfo || null);
        
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
                <div className="w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4 mb-4 animate-fadeIn">
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
                                        : dayInfo.isGreen
                                            ? `${dayInfo.priceType}: €${dayInfo.basePrice}${dayInfo.assignedCities.length > 0 ? `\nCities: ${dayInfo.assignedCities.join(', ')}` : ''}`
                                            : `Expensive day for pickup/dropoff cities${dayInfo.assignedCities.length > 0 ? `\nServing: ${dayInfo.assignedCities.join(', ')}` : ''}`
                                    : 'Loading...';

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSelect(c.day!)}
                                        disabled={isLoading || dayInfo?.isBlocked}
                                        className={`p-2 text-sm rounded-full text-center relative transition-colors border
                                            ${isSelected ? 'bg-blue-500 text-white border-blue-500' : 
                                              dayInfo?.isBlocked ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed line-through' :
                                              dayInfo?.isGreen ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' : 
                                              'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}
                                            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title={tooltipText}
                                    >
                                        {c.day}
                                        {!dayInfo?.isBlocked && dayInfo?.isCityDay && (
                                            <div className="absolute top-0 right-0 w-2 h-2 bg-green-600 rounded-full"></div>
                                        )}
                                        {!dayInfo?.isBlocked && dayInfo?.isEmpty && !dayInfo?.isCityDay && (
                                            <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                                        )}
                                        {!dayInfo?.isBlocked && dayInfo && !dayInfo.isGreen && (
                                            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
                                        )}
                                        {dayInfo?.isBlocked && (
                                            <div className="absolute top-0 right-0 w-2 h-2 bg-gray-500 rounded-full"></div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                                <span>City Day / Empty Day (Lower Price)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                <span>Scheduled City Day</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span>Empty Calendar Day</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-50 border border-red-300 rounded"></div>
                                <span>Expensive Day (No City Match)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-gray-200 border border-gray-400 rounded line-through"></div>
                                <span>Blocked Date (Unavailable)</span>
                            </div>
                        </div>

                        {selectedDayInfo && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="font-medium text-blue-900 mb-2">
                                    {selectedDayInfo.date.toLocaleDateString('en-US', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-blue-700">Base Price:</span>
                                        <span className="font-semibold text-blue-900">€{selectedDayInfo.basePrice}</span>
                                    </div>
                                    <div className="text-blue-600">
                                        {selectedDayInfo.priceType}
                                    </div>
                                    {selectedDayInfo.assignedCities.length > 0 && (
                                        <div className="text-sm text-gray-700 mt-2">
                                            <span className="font-medium">Assigned Cities:</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {selectedDayInfo.assignedCities.map((city) => (
                                                    <span 
                                                        key={city} 
                                                        className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs"
                                                    >
                                                        {city}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {selectedDayInfo.isCityDay && (
                                        <div className="text-green-600 font-medium">
                                            ✓ City Day - Best Price Available
                                        </div>
                                    )}
                                    {selectedDayInfo.isEmpty && !selectedDayInfo.isCityDay && (
                                        <div className="text-blue-600 font-medium">
                                            ✓ Empty Calendar - Good Price
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedDatePickerInline;
