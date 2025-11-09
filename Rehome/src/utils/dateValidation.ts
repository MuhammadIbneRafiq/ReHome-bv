import { isDateBlocked } from '../services/blockedDatesService';
import { format } from 'date-fns';

/**
 * Check if a date or date range is available for booking
 * @param startDate - Start date (or single date for fixed bookings)
 * @param endDate - Optional end date for flexible bookings
 * @param cityName - Optional city name to check against
 * @returns Object with isValid flag and error message if invalid
 */
export async function validateBookingDate(
  startDate: Date | string,
  endDate?: Date | string,
  cityName?: string
): Promise<{ isValid: boolean; message?: string }> {
  try {
    const startDateStr = typeof startDate === 'string' ? startDate : format(startDate, 'yyyy-MM-dd');
    const endDateStr = endDate ? (typeof endDate === 'string' ? endDate : format(endDate, 'yyyy-MM-dd')) : null;

    // Check if start date is blocked
    const startDateBlocked = await isDateBlocked(startDateStr, cityName);
    if (startDateBlocked) {
      const cityMsg = cityName ? ` for ${cityName}` : '';
      return {
        isValid: false,
        message: `The selected date (${format(new Date(startDateStr), 'MMMM d, yyyy')}) is not available for booking${cityMsg}. Please select a different date.`,
      };
    }

    // If there's an end date, check all dates in the range
    if (endDateStr) {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      for (let i = 0; i <= daysDiff; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(currentDate.getDate() + i);
        const currentDateStr = format(currentDate, 'yyyy-MM-dd');

        const dateBlocked = await isDateBlocked(currentDateStr, cityName);
        if (dateBlocked) {
          const cityMsg = cityName ? ` for ${cityName}` : '';
          return {
            isValid: false,
            message: `One or more dates in your selected range are not available for booking${cityMsg}. The date ${format(
              currentDate,
              'MMMM d, yyyy'
            )} is blocked. Please select a different date range.`,
          };
        }
      }
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error validating booking date:', error);
    // If validation fails, allow booking but log error
    return { isValid: true };
  }
}

/**
 * Get blocked dates for display in a date picker
 * Useful for disabling dates in UI components
 * @param startDate - Start of range to check
 * @param endDate - End of range to check
 * @param cityName - Optional city name to filter by
 * @returns Array of date strings (yyyy-MM-dd) that are blocked
 */
export async function getBlockedDatesForDisplay(
  startDate: Date | string,
  endDate: Date | string,
  cityName?: string
): Promise<string[]> {
  try {
    const blockedDates: string[] = [];
    const start = new Date(typeof startDate === 'string' ? startDate : startDate);
    const end = new Date(typeof endDate === 'string' ? endDate : endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= daysDiff; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + i);
      const currentDateStr = format(currentDate, 'yyyy-MM-dd');

      const dateBlocked = await isDateBlocked(currentDateStr, cityName);
      if (dateBlocked) {
        blockedDates.push(currentDateStr);
      }
    }

    return blockedDates;
  } catch (error) {
    console.error('Error getting blocked dates for display:', error);
    return [];
  }
}

/**
 * Check if dates within a selection are blocked
 * Returns array of blocked dates within the selection
 */
export async function getBlockedDatesInRange(
  startDate: Date | string,
  endDate: Date | string,
  cityName?: string
): Promise<{ date: string; reason?: string }[]> {
  try {
    const blockedDates: { date: string; reason?: string }[] = [];
    const start = new Date(typeof startDate === 'string' ? startDate : startDate);
    const end = new Date(typeof endDate === 'string' ? endDate : endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= daysDiff; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + i);
      const currentDateStr = format(currentDate, 'yyyy-MM-dd');

      const dateBlocked = await isDateBlocked(currentDateStr, cityName);
      if (dateBlocked) {
        blockedDates.push({
          date: currentDateStr,
        });
      }
    }

    return blockedDates;
  } catch (error) {
    console.error('Error getting blocked dates in range:', error);
    return [];
  }
}


