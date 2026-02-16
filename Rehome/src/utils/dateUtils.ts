/**
 * Format a Date object to ISO string without timezone conversion.
 * This ensures the date stays as the user selected it (e.g., Feb 17 remains Feb 17).
 * 
 * CRITICAL: Always use this instead of date.toISOString() when dealing with:
 * - User-selected dates from calendars
 * - Date ranges for bookings
 * - Any date that should represent a calendar day (not a timestamp)
 * 
 * @param date - The Date object to format
 * @returns ISO-formatted string like "2026-02-17T00:00:00.000Z"
 */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00.000Z`;
}

/**
 * Format a date string to YYYY-MM-DD format.
 * Handles both ISO strings and already-formatted date strings.
 * 
 * @param dateStr - Date string (ISO or YYYY-MM-DD format)
 * @returns YYYY-MM-DD formatted string
 */
export function toDateString(dateStr: string): string {
  if (!dateStr) return '';
  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  // If ISO string, extract date part
  if (dateStr.includes('T')) {
    return dateStr.split('T')[0];
  }
  // Try parsing as date
  const date = new Date(dateStr);
  return formatDateLocal(date).split('T')[0];
}

/**
 * Get today's date in local format (without timezone conversion)
 * @returns Today's date as ISO string
 */
export function getTodayLocal(): string {
  return formatDateLocal(new Date());
}

/**
 * Get tomorrow's date in local format (without timezone conversion)
 * @returns Tomorrow's date as ISO string
 */
export function getTomorrowLocal(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateLocal(tomorrow);
}
