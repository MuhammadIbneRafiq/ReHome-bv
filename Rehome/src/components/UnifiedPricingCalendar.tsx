import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isBefore, startOfDay, getDay } from 'date-fns';
import { getCalendarPricing, CalendarPricingResponse, clearPricingCache } from '../services/realtimeService';
import { API_BASE_URL } from '../lib/api/config';

interface UnifiedPricingCalendarProps {
  pickupLocation: any;
  dropoffLocation: any;
  dateOption: 'fixed' | 'flexible' | 'rehome';
  serviceType: 'item-transport' | 'house-moving';
  selectedDates?: {
    start: string;
    end: string;
  };
  onDateSelect?: (date: Date) => void;
  onDateRangeSelect?: (dates: { start: string; end: string }) => void;
  pickupDate?: string;
  dropoffDate?: string;
}

// ─── helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d: Date) { return format(d, 'yyyy-MM-dd'); }
function sameDay(a: string | undefined, b: string) {
  if (!a) return false;
  return fmtDate(new Date(a)) === b;
}

// ─── color helpers ─────────────────────────────────────────────────────────────
function getDayColorClasses(colorCode: string | undefined, isBlocked: boolean, isPast: boolean, isSelected: boolean) {
  if (isSelected) return 'bg-blue-500 text-white border-blue-500';
  if (isBlocked || isPast) return 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed line-through';
  switch (colorCode) {
    case 'green':  return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
    case 'orange': return 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200';
    case 'red':    return 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100';
    default:       return 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200';
  }
}
function getStickerClasses(colorCode: string | undefined) {
  switch (colorCode) {
    case 'green':  return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
    case 'orange': return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white';
    case 'red':    return 'bg-gradient-to-r from-red-400 to-red-500 text-white';
    default:       return 'bg-gray-400 text-white';
  }
}

// ─── Client-side pricing (mirrors basePriceCalculator.js — zero network cost) ─
interface DayStatus { pickupScheduled: boolean; dropoffScheduled: boolean; isEmpty: boolean; isBlocked: boolean; }
interface Charges { pickupCheap: number; pickupStandard: number; dropoffCheap: number; dropoffStandard: number; isIntercity: boolean; }

function calcHouseMovingFixed(d: DayStatus, c: Charges) {
  if (d.isBlocked) return 0;
  if (!c.isIntercity) {
    if (d.pickupScheduled) return c.pickupCheap;
    if (d.isEmpty) return c.pickupStandard * 0.75;
    return c.pickupStandard;
  }
  if (d.pickupScheduled && d.dropoffScheduled) return (c.pickupCheap + c.dropoffCheap) / 2;
  if (d.pickupScheduled) return (c.pickupCheap + c.dropoffStandard) / 2;
  if (d.dropoffScheduled) return (c.pickupStandard + c.dropoffCheap) / 2;
  if (d.isEmpty) return Math.max(c.pickupStandard, c.dropoffStandard) * 0.75;
  return Math.max(c.pickupStandard, c.dropoffStandard);
}

function calcItemSameDate(d: DayStatus, c: Charges) {
  if (d.isBlocked) return 0;
  if (!c.isIntercity) {
    if (d.pickupScheduled) return c.pickupCheap;
    if (d.isEmpty) return c.pickupStandard * 0.75;
    return c.pickupStandard;
  }
  if (d.pickupScheduled && d.dropoffScheduled) return (c.pickupCheap + c.dropoffCheap) / 2;
  if (d.pickupScheduled || d.dropoffScheduled) {
    const cheap = d.pickupScheduled ? c.pickupCheap : c.dropoffCheap;
    const std = d.pickupScheduled ? c.dropoffStandard : c.pickupStandard;
    return (cheap + std) / 2;
  }
  if (d.isEmpty) return (c.pickupStandard + c.dropoffStandard) / 2;
  return Math.max(c.pickupStandard, c.dropoffStandard);
}

function calcItemDiffDates(pDay: DayStatus, dDay: DayStatus, c: Charges) {
  if (!c.isIntercity) {
    const pS = pDay.pickupScheduled, dS = dDay.pickupScheduled;
    if (pS && dS) return c.pickupCheap;
    if (pS || dS) return (c.pickupCheap + c.pickupStandard) / 2;
    if (pDay.isEmpty && dDay.isEmpty) return c.pickupStandard * 0.75;
    return c.pickupStandard;
  }
  const pS = pDay.pickupScheduled, dS = dDay.dropoffScheduled;
  if (pS && dS) return (c.pickupCheap + c.dropoffCheap) / 2;
  if (pS || dS) {
    const cheap = pS ? c.pickupCheap : c.dropoffCheap;
    const std = pS ? c.dropoffStandard : c.pickupStandard;
    return (cheap + std) / 2;
  }
  if (pDay.isEmpty && dDay.isEmpty) return (c.pickupStandard + c.dropoffStandard) / 2;
  return Math.max(c.pickupStandard, c.dropoffStandard);
}

function calcFlexibleForEndDate(
  startStr: string, endStr: string,
  rawDays: Map<string, DayStatus>, c: Charges
) {
  const rangeDays = Math.ceil((new Date(endStr).getTime() - new Date(startStr).getTime()) / 86400000) + 1;
  if (rangeDays > 7) return c.pickupCheap;
  let pickupAvail = false, bothSameDate = false;
  const cur = new Date(startStr);
  const last = new Date(endStr);
  while (cur <= last) {
    const ds = fmtDate(cur);
    const st = rawDays.get(ds);
    if (st?.pickupScheduled) { pickupAvail = true; if (c.isIntercity && st.dropoffScheduled) bothSameDate = true; }
    cur.setDate(cur.getDate() + 1);
  }
  if (!c.isIntercity) return pickupAvail ? c.pickupCheap : c.pickupStandard;
  return bothSameDate ? (c.pickupCheap + c.dropoffCheap) / 2 : c.pickupStandard;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export const UnifiedPricingCalendar: React.FC<UnifiedPricingCalendarProps> = ({
  pickupLocation,
  dropoffLocation,
  dateOption,
  serviceType,
  selectedDates,
  onDateSelect,
  onDateRangeSelect,
  pickupDate,
  dropoffDate
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [flexStart, setFlexStart] = useState<Date | null>(
    selectedDates?.start ? new Date(selectedDates.start) : null
  );
  const [flexEnd, setFlexEnd] = useState<Date | null>(
    selectedDates?.end ? new Date(selectedDates.end) : null
  );

  // Raw data fetched ONCE per month/location — never re-fetched on date selection
  const [rawDays, setRawDays] = useState<Map<string, DayStatus>>(new Map());
  const [rawColors, setRawColors] = useState<Map<string, string>>(new Map());
  const [charges, setCharges] = useState<Charges | null>(null);

  const isItemTransport = serviceType === 'item-transport';
  const todayStart = useMemo(() => startOfDay(new Date()), []);

  // ─── Calendar grid cells (Mon-start, with leading blanks) ──────────────────
  const calendarCells = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const firstDayOffset = (getDay(start) + 6) % 7;
    const blanks: null[] = Array(firstDayOffset).fill(null);
    return [...blanks, ...days];
  }, [currentMonth]);

  // ─── Fetch raw schedule data ONCE per month + locations ────────────────────
  const fetchRawData = useCallback(async () => {
    if (!pickupLocation || !dropoffLocation) return;
    if (dateOption === 'rehome') return;
    setLoading(true);
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      clearPricingCache();

      // Helper function to format dates without timezone conversion
      const formatDateLocal = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T00:00:00.000Z`;
      };
      
      const result = await getCalendarPricing({
        pickupLocation,
        dropoffLocation,
        startDate: formatDateLocal(start),
        endDate: formatDateLocal(end),
        serviceType,
        dateOption: 'fixed', // always fetch fixed-mode to get per-day schedule status
      }, API_BASE_URL);

      // Store raw schedule statuses, color codes, and city charges
      const days = new Map<string, DayStatus>();
      const colors = new Map<string, string>();
      result.dates.forEach((d: CalendarPricingResponse) => {
        days.set(d.date, {
          pickupScheduled: d.breakdown?.pickupCityScheduled ?? false,
          dropoffScheduled: d.breakdown?.dropoffCityScheduled ?? false,
          isEmpty: d.breakdown?.isEmpty ?? false,
          isBlocked: d.breakdown?.isBlocked ?? false,
        });
        colors.set(d.date, d.colorCode);
      });
      // Merge into existing maps so cross-month data persists (e.g. flex start in Feb, end in Mar)
      setRawDays(prev => {
        const merged = new Map(prev);
        days.forEach((v, k) => merged.set(k, v));
        return merged;
      });
      setRawColors(prev => {
        const merged = new Map(prev);
        colors.forEach((v, k) => merged.set(k, v));
        return merged;
      });

      // Extract city charges from response meta (parseFloat: Supabase numeric columns return strings)
      if (result.summary) {
        const m = result.summary;
        setCharges({
          pickupCheap: parseFloat(m.pickupCharge?.cheap) || 64,
          pickupStandard: parseFloat(m.pickupCharge?.standard) || 89,
          dropoffCheap: parseFloat(m.dropoffCharge?.cheap) || 64,
          dropoffStandard: parseFloat(m.dropoffCharge?.standard) || 89,
          isIntercity: !!m.isIntercity,
        });
      }
    } catch (error) {
      console.error('Failed to fetch pricing data:', error);
    } finally {
      setLoading(false);
    }
    // Only re-fetch when month or locations change — NOT when dates change
  }, [pickupLocation, dropoffLocation, currentMonth, serviceType, dateOption]);

  useEffect(() => { fetchRawData(); }, [fetchRawData]);

  // ─── Compute prices INSTANTLY from raw data (no network) ─────────────────
  const pricingData = useMemo(() => {
    const map = new Map<string, { price: number; colorCode: string; priceType: string; isBlocked: boolean }>();
    if (!charges || rawDays.size === 0) return map;

    const pickupStr = pickupDate ? fmtDate(new Date(pickupDate)) : null;
    const dropoffStr = dropoffDate ? fmtDate(new Date(dropoffDate)) : null;
    const flexStartStr = flexStart ? fmtDate(flexStart) : null;

    rawDays.forEach((status, dateStr) => {
      const colorCode = rawColors.get(dateStr) || 'red';
      if (status.isBlocked) {
        map.set(dateStr, { price: 0, colorCode: 'grey', priceType: 'blocked', isBlocked: true });
        return;
      }

      let price = 0;

      if (dateOption === 'flexible') {
        // After start is selected, show "what if this were the end date" price
        if (flexStartStr) {
          let s = flexStartStr, e = dateStr;
          if (s > e) [s, e] = [e, s];
          price = calcFlexibleForEndDate(s, e, rawDays, charges);
        }
        // Before start selected: no prices shown (handled by showPriceSticker logic)
      } else if (isItemTransport && dateOption === 'fixed') {
        if (pickupStr && !dropoffStr) {
          // Pickup selected → show price for each day as potential dropoff
          const pDay = rawDays.get(pickupStr);
          if (pDay) {
            if (dateStr === pickupStr) {
              price = calcItemSameDate(status, charges);
            } else {
              price = calcItemDiffDates(pDay, status, charges);
            }
          }
        } else if (pickupStr && dropoffStr) {
          // Both selected → show final paired price on every day
          const pDay = rawDays.get(pickupStr);
          const dDay = rawDays.get(dropoffStr);
          if (pDay && dDay) {
            price = pickupStr === dropoffStr
              ? calcItemSameDate(pDay, charges)
              : calcItemDiffDates(pDay, dDay, charges);
          }
        }
        // Before pickup selected: no prices shown
      } else {
        // House moving fixed — single date, price is straightforward
        price = calcHouseMovingFixed(status, charges);
      }

      // Use backend-returned colorCode which already has correct same-city vs intercity logic
      const priceType = colorCode === 'green' ? 'cheap' : colorCode === 'orange' ? 'empty' : 'standard';
      map.set(dateStr, {
        price: Math.round(price * 100) / 100,
        colorCode,
        priceType,
        isBlocked: false,
      });
    });
    return map;
  }, [rawDays, rawColors, charges, dateOption, isItemTransport, pickupDate, dropoffDate, flexStart]);

  // ─── Date click handler ────────────────────────────────────────────────────
  const handleDateClick = (date: Date) => {
    const dateStr = fmtDate(date);
    const day = rawDays.get(dateStr);
    if (day?.isBlocked) return;

    if (dateOption === 'flexible') {
      if (!flexStart || (flexStart && flexEnd)) {
        setFlexStart(date);
        setFlexEnd(null);
      } else {
        let s = flexStart, e = date;
        if (s > e) [s, e] = [e, s];
        setFlexStart(s);
        setFlexEnd(e);
        
        // Use local date format to avoid timezone issues
        const formatDate = (d: Date) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}T00:00:00.000Z`;
        };
        
        onDateRangeSelect?.({ start: formatDate(s), end: formatDate(e) });
      }
    } else {
      onDateSelect?.(date);
    }
  };

  // ─── Selection state helpers ───────────────────────────────────────────────
  const isPickupSelected = useCallback(
    (dateStr: string) => isItemTransport && dateOption === 'fixed' && sameDay(pickupDate, dateStr),
    [isItemTransport, dateOption, pickupDate]
  );
  const isDropoffSelected = useCallback(
    (dateStr: string) => isItemTransport && dateOption === 'fixed' && sameDay(dropoffDate, dateStr),
    [isItemTransport, dateOption, dropoffDate]
  );
  const isHouseMovingSelected = useCallback(
    (dateStr: string) => !isItemTransport && dateOption === 'fixed' && sameDay(selectedDates?.start, dateStr),
    [isItemTransport, dateOption, selectedDates?.start]
  );
  const isInFlexRange = useCallback(
    (date: Date) => {
      if (dateOption !== 'flexible' || !flexStart) return false;
      const t = date.getTime(), s = flexStart.getTime(), e = flexEnd?.getTime();
      if (t === s) return true;
      if (e && t === e) return true;
      if (e && t > s && t < e) return true;
      return false;
    },
    [dateOption, flexStart, flexEnd]
  );
  const isFlexEndpoint = useCallback(
    (date: Date) => {
      if (dateOption !== 'flexible' || !flexStart) return false;
      const t = date.getTime();
      return t === flexStart.getTime() || (flexEnd ? t === flexEnd.getTime() : false);
    },
    [dateOption, flexStart, flexEnd]
  );

  // ─── Render a single calendar day ──────────────────────────────────────────
  const renderDay = (date: Date) => {
    const dateStr = fmtDate(date);
    const day = pricingData.get(dateStr);
    const isPast = isBefore(date, todayStart);
    const blocked = day?.isBlocked || day?.colorCode === 'grey';
    const disabled = isPast || blocked || loading;

    const isPickup = isPickupSelected(dateStr);
    const isDropoff = isDropoffSelected(dateStr);
    const isHMSelected = isHouseMovingSelected(dateStr);
    const isFlex = isFlexEndpoint(date);
    const isAnySelected = isPickup || isDropoff || isHMSelected || isFlex;

    // Show price stickers & colors when we have enough info to compute a meaningful price
    const showPriceSticker =
      (dateOption === 'fixed' && !isItemTransport) ||                          // house moving: always
      (dateOption === 'fixed' && isItemTransport && !!pickupDate) ||           // item transport: after pickup
      (dateOption === 'flexible' && !!flexStart);                              // flexible: after start

    // Use neutral colors until dates are selected (colors only appear alongside prices)
    const effectiveColor = showPriceSticker ? day?.colorCode : undefined;
    let colorClass = getDayColorClasses(effectiveColor, !!blocked, isPast, isAnySelected);

    const inRange = isInFlexRange(date) && !isFlexEndpoint(date);
    if (inRange && !isPast && !blocked) {
      colorClass = 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
    }

    let ringClass = '';
    if (isPickup && !isDropoff) ringClass = 'ring-2 ring-blue-500 ring-offset-1';
    if (isDropoff && !isPickup) ringClass = 'ring-2 ring-purple-500 ring-offset-1';
    if (isPickup && isDropoff) ringClass = 'ring-2 ring-blue-500 ring-offset-1';

    const tooltip = day
      ? blocked ? 'Date blocked - Unavailable'
        : `${day.priceType}: €${day.price.toFixed(2)}`
      : '';

    return (
      <button
        key={dateStr}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && handleDateClick(date)}
        className={`relative p-2 text-sm rounded-full text-center transition-colors border min-h-[44px] ${colorClass} ${ringClass} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={tooltip}
      >
        <span className={isToday(date) ? 'font-bold' : ''}>{format(date, 'd')}</span>

        {day && !blocked && !isPast && showPriceSticker && day.price > 0 && (
          <span className={`absolute -top-3 -right-3 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border-2 border-white ${getStickerClasses(day.colorCode)}`}>
            €{day.price.toFixed(2)}
          </span>
        )}

        {(blocked || isPast) && (
          <span className="absolute -top-3 -right-3 bg-gray-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border-2 border-white">
            ✕
          </span>
        )}

        {isPickup && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-500 border border-white" />
        )}
        {isDropoff && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-purple-500 border border-white" />
        )}
      </button>
    );
  };

  // ─── Selection prompt ────────────────────────────────────────────────────
  const getSelectionPrompt = () => {
    if (dateOption === 'flexible') {
      if (!flexStart) return 'Select the start of your date range';
      if (!flexEnd) return 'Now select the end of your date range';
      return null;
    }
    if (dateOption === 'fixed' && isItemTransport) {
      if (!pickupDate) return 'Select your pickup date';
      if (!dropoffDate) return 'Now select your dropoff date';
    }
    return null;
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-500" />
          {dateOption === 'rehome' ? 'ReHome Will Choose Best Date' : 'Select Your Date'}
        </h3>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCurrentMonth(m => addMonths(m, -1))} className="p-1 hover:bg-gray-100 rounded" aria-label="Previous month">◀</button>
          <span className="font-semibold min-w-[140px] text-center">{format(currentMonth, 'MMMM yyyy')}</span>
          <button type="button" onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1 hover:bg-gray-100 rounded" aria-label="Next month">▶</button>
        </div>
      </div>

      {/* Selection prompt */}
      {getSelectionPrompt() && (
        <div className="mb-3 text-sm font-medium text-blue-700 bg-blue-50 px-3 py-2 rounded-lg animate-pulse">
          {getSelectionPrompt()}
        </div>
      )}

      {/* Calendar body */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
        </div>
      ) : dateOption === 'rehome' ? (
        <div className="text-center py-12 bg-purple-50 rounded-lg">
          <div className="text-3xl mb-4">📅</div>
          <h4 className="text-lg font-medium text-purple-800 mb-2">ReHome Chooses the Best Date</h4>
          <p className="text-gray-600">Our team will schedule your move on the most cost-effective date available.</p>
          <div className="mt-4 text-2xl font-bold text-purple-600">Guaranteed Cheapest Rate</div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="grid grid-cols-7 gap-1">
            {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
              <div key={d} className="p-2 text-center text-xs font-medium text-gray-500">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) =>
              cell === null
                ? <div key={`blank-${idx}`} className="p-2" />
                : renderDay(cell)
            )}
          </div>
        </div>
      )}

      {/* ─── Selection Summary Below Calendar ──────────────────────────────── */}
      {dateOption === 'fixed' && isItemTransport && (pickupDate || dropoffDate) && (
        <div className="mt-4 border border-gray-200 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-semibold text-gray-800">Selected Dates</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className={`flex-1 rounded-lg px-3 py-2 text-sm ${pickupDate ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-dashed border-gray-300'}`}>
              <span className="font-medium text-blue-700">Pickup: </span>
              {pickupDate ? (
                <span>{format(new Date(pickupDate), 'EEE, MMM d yyyy')}</span>
              ) : (
                <span className="text-gray-400 italic">Not selected</span>
              )}
            </div>
            <div className={`flex-1 rounded-lg px-3 py-2 text-sm ${dropoffDate ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50 border border-dashed border-gray-300'}`}>
              <span className="font-medium text-purple-700">Dropoff: </span>
              {dropoffDate ? (
                <span>{format(new Date(dropoffDate), 'EEE, MMM d yyyy')}</span>
              ) : (
                <span className="text-gray-400 italic">Not selected</span>
              )}
            </div>
          </div>
        </div>
      )}

      {dateOption === 'fixed' && !isItemTransport && selectedDates?.start && (
        <div className="mt-4 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-800">Selected Moving Date</h4>
          <div className="mt-1 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm">
            {format(new Date(selectedDates.start), 'EEEE, MMMM d yyyy')}
          </div>
        </div>
      )}

      {dateOption === 'flexible' && (
        <div className="mt-4 border border-gray-200 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-semibold text-gray-800">Flexible Date Range</h4>
          {flexStart && flexEnd ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm">
              {format(flexStart, 'EEE, MMM d')} → {format(flexEnd, 'EEE, MMM d yyyy')}
              <span className="ml-2 text-blue-600 font-medium">
                ({Math.round((flexEnd.getTime() - flexStart.getTime()) / (1000 * 60 * 60 * 24)) + 1} days)
              </span>
              {/* {flexRangePrice && (
                <div className="mt-2 text-lg font-bold text-green-700">
                  Base Price: €{Math.round(flexRangePrice.price)}
                  <span className="ml-2 text-xs font-normal text-gray-500">({flexRangePrice.type})</span>
                </div>
              )} */}
            </div>
          ) : flexStart ? (
            <div className="bg-blue-50 border border-dashed border-blue-300 rounded-lg px-3 py-2 text-sm text-blue-700">
              Start: {format(flexStart, 'EEE, MMM d yyyy')} — <span className="italic">now click the end date</span>
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-500 italic">
              Click a start date on the calendar above
            </div>
          )}
        </div>
      )}
    </div>
  );
};
