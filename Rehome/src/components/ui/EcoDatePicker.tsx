import React, { useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface EcoDatePickerProps {
    value: string;
    onChange: (isoDate: string) => void;
    placeholder?: string;
    className?: string;
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

export const EcoDatePicker: React.FC<EcoDatePickerProps> = ({ value, onChange, placeholder = 'Select date', className }) => {
    const initial = value ? new Date(value) : new Date();
    const [currentYear, setCurrentYear] = useState<number>(initial.getFullYear());
    const [currentMonth, setCurrentMonth] = useState<number>(initial.getMonth());

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);

    // Random green-highlighted (eco-friendly) days for the current month
    const greenDays = useMemo(() => {
        const num = Math.floor(Math.random() * 6) + 4; // 4-9 days
        const set = new Set<number>();
        while (set.size < num) {
            set.add(Math.floor(Math.random() * daysInMonth) + 1);
        }
        return Array.from(set).sort((a, b) => a - b);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentYear, currentMonth, daysInMonth]);

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dayNames = ['Su','Mo','Tu','We','Th','Fr','Sa'];

    const selectedDate = value ? new Date(value) : null;

    const handleSelect = (day: number) => {
        const d = new Date(currentYear, currentMonth, day);
        onChange(formatISO(d));
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

    // Build grid cells (42 = 6 weeks)
    const prevMonthDays = (firstDayOfMonth + 6) % 7; // number of leading blanks (Mon/Sun differences handled by grid)
    const cells: Array<{ day: number | null; type: 'prev' | 'curr' | 'next' }> = [];
    for (let i = 0; i < prevMonthDays; i++) cells.push({ day: null, type: 'prev' });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, type: 'curr' });
    while (cells.length % 7 !== 0) cells.push({ day: null, type: 'next' });
    while (cells.length < 42) cells.push({ day: null, type: 'next' });

    const displayValue = value ? new Date(value).toLocaleDateString() : '';

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border text-left ${className || ''}`}
                >
                    {displayValue || placeholder}
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-3">
                <div className="flex items-center justify-between mb-2">
                    <button onClick={goPrev} className="px-2 py-1 rounded hover:bg-gray-100" aria-label="Previous month">◀</button>
                    <div className="font-medium">{monthNames[currentMonth]} {currentYear}</div>
                    <button onClick={goNext} className="px-2 py-1 rounded hover:bg-gray-100" aria-label="Next month">▶</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-1">
                    {dayNames.map(d => (
                        <div key={d} className="text-center p-1">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {cells.map((c, idx) => {
                        if (c.type !== 'curr' || c.day === null) {
                            return <div key={idx} className="p-2 text-center text-gray-300">{c.day ?? ''}</div>;
                        }
                        const isSelected = !!selectedDate &&
                            selectedDate.getFullYear() === currentYear &&
                            selectedDate.getMonth() === currentMonth &&
                            selectedDate.getDate() === c.day;
                        const isGreen = greenDays.includes(c.day);
                        return (
                            <button
                                key={idx}
                                onClick={() => handleSelect(c.day!)}
                                className={`p-2 text-sm rounded-full text-center
                                    ${isSelected ? 'bg-blue-500 text-white' : isGreen ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'hover:bg-gray-100'}`}
                            >
                                {c.day}
                            </button>
                        );
                    })}
                </div>
                <div className="mt-3 text-xs text-gray-600">Green days are eco-friendly slots (randomized).</div>
            </PopoverContent>
        </Popover>
    );
};

export default EcoDatePicker;


