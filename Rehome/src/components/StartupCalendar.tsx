import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
  onReHomeChoose?: () => void;
}

const StartupCalendar: React.FC<CalendarProps> = ({ onDateSelect, onReHomeChoose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateRangeOption, setDateRangeOption] = useState<'flexible' | 'fixed'>('fixed');

  // Generate random sustainable days for the current month
  const generateSustainableDays = (year: number, month: number): number[] => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const sustainableDays: number[] = [];
    
    // Randomly select 3-7 days as sustainable
    const numSustainableDays = Math.floor(Math.random() * 5) + 3;
    
    for (let i = 0; i < numSustainableDays; i++) {
      const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
      if (!sustainableDays.includes(randomDay)) {
        sustainableDays.push(randomDay);
      }
    }
    
    return sustainableDays.sort((a, b) => a - b);
  };

  const sustainableDays = generateSustainableDays(currentDate.getFullYear(), currentDate.getMonth());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getPreviousMonthDays = (date: Date) => {
    const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    const firstDay = getFirstDayOfMonth(date);
    
    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(daysInPrevMonth - i);
    }
    return days;
  };

  const getNextMonthDays = (date: Date) => {
    const totalCells = 42; // 6 weeks * 7 days
    const currentMonthDays = getDaysInMonth(date);
    const firstDay = getFirstDayOfMonth(date);
    const remainingCells = totalCells - (currentMonthDays + firstDay);
    
    const days = [];
    for (let i = 1; i <= remainingCells; i++) {
      days.push(i);
    }
    return days;
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
    onDateSelect?.(newDate);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleClear = () => {
    setSelectedDate(null);
  };

  const handleReHomeChoose = () => {
    // Randomly select a sustainable day
    if (sustainableDays.length > 0) {
      const randomSustainableDay = sustainableDays[Math.floor(Math.random() * sustainableDays.length)];
      const chosenDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), randomSustainableDay);
      setSelectedDate(chosenDate);
      onDateSelect?.(chosenDate);
    }
    onReHomeChoose?.();
  };

  const handleSustainableOption = () => {
    // Same functionality as "Let ReHome choose"
    handleReHomeChoose();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <div className="text-red-600 font-semibold mb-4">Important for StartUp Application</div>
      
      <div className="mb-4">
        <p className="text-sm mb-2">To highlight sustainability:</p>
        <p className="text-sm">1. Highlight the days that align with the entered city in green in the calendar.</p>
      </div>

      {/* Calendar */}
      <div className="border rounded-lg p-4 mb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
            <span className="text-gray-400">▼</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePreviousMonth} className="p-1 hover:bg-gray-100 rounded">▲</button>
            <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded">▼</button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day, index) => (
            <div key={index} className="text-center text-sm font-medium text-gray-600 p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Previous month days */}
          {getPreviousMonthDays(currentDate).map((day) => (
            <div key={`prev-${day}`} className="text-center p-2 text-gray-300">
              {day}
            </div>
          ))}

          {/* Current month days */}
          {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => i + 1).map((day) => {
            const isSustainable = sustainableDays.includes(day);
            const isSelected = selectedDate?.getDate() === day && 
                              selectedDate?.getMonth() === currentDate.getMonth() && 
                              selectedDate?.getFullYear() === currentDate.getFullYear();
            
            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={`
                  text-center p-2 rounded-full text-sm
                  ${isSelected 
                    ? 'bg-blue-500 text-white' 
                    : isSustainable 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'hover:bg-gray-100'
                  }
                `}
              >
                {day}
              </button>
            );
          })}

          {/* Next month days */}
          {getNextMonthDays(currentDate).map((day) => (
            <div key={`next-${day}`} className="text-center p-2 text-gray-300">
              {day}
            </div>
          ))}
        </div>

        {/* Footer buttons */}
        <div className="flex justify-between mt-4">
          <button onClick={handleClear} className="text-sm text-gray-600 hover:text-gray-800">
            Clear
          </button>
          <button onClick={handleToday} className="text-sm text-gray-600 hover:text-gray-800">
            Today
          </button>
        </div>
      </div>

      {/* Date range options */}
      <div className="mb-4">
        <p className="text-sm mb-2">2. Display (Sustainable and Budget Option) next to reHome can suggest date.</p>
        
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="dateRange"
              checked={dateRangeOption === 'flexible'}
              onChange={() => setDateRangeOption('flexible')}
              className="w-4 h-4"
            />
            <span className="text-sm">Flexible date range</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="dateRange"
              checked={dateRangeOption === 'fixed'}
              onChange={() => setDateRangeOption('fixed')}
              className="w-4 h-4"
            />
            <span className="text-sm">Fixed date</span>
            {dateRangeOption === 'fixed' && <span className="text-green-600">✓</span>}
          </label>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        <Button
          onClick={handleReHomeChoose}
          className="w-full bg-blue-600 text-white hover:bg-blue-700"
        >
          Let ReHome choose
        </Button>
        
        <Button
          onClick={handleSustainableOption}
          className="w-full bg-green-600 text-white hover:bg-green-700"
        >
          Sustainable and Budget Option
        </Button>
      </div>

      {selectedDate && (
        <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
          <strong>Selected Date:</strong> {selectedDate.toLocaleDateString()}
          {sustainableDays.includes(selectedDate.getDate()) && (
            <span className="ml-2 text-green-600">🌱 Sustainable day!</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StartupCalendar;
