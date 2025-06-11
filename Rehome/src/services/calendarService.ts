// Google Calendar Integration for ReHome
// This service handles checking scheduled city days and early booking discounts

/**
 * SETUP INSTRUCTIONS:
 * 
 * 1. Go to Google Cloud Console (https://console.cloud.google.com/)
 * 2. Create a new project or select existing one
 * 3. Enable Google Calendar API
 * 4. Create credentials (API Key for public calendars OR OAuth2 for private calendars)
 * 5. Add your credentials to environment variables:
 *    - VITE_GOOGLE_CALENDAR_API_KEY=your_api_key_here
 *    - VITE_GOOGLE_CALENDAR_ID=your_calendar_id_here
 * 
 * RECOMMENDED SETUP:
 * - Create a public Google Calendar for your business
 * - Use different event types/colors for different cities
 * - Event title format: "Amsterdam City Day" or "Rotterdam Schedule"
 * - This allows checking if a specific city is scheduled on a given date
 */

export interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    date?: string;
    dateTime?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
  };
  location?: string;
}

export interface CalendarResponse {
  items: CalendarEvent[];
}

class CalendarService {
  private readonly apiKey: string;
  private readonly calendarId: string;
  private readonly baseUrl = 'https://www.googleapis.com/calendar/v3';

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY || '';
    this.calendarId = import.meta.env.VITE_GOOGLE_CALENDAR_ID || '';
    
    if (!this.apiKey || !this.calendarId) {
      console.warn('Google Calendar API not configured. City day checking will use fallback logic.');
    }
  }

  /**
   * Check if a specific city is scheduled on a given date
   * This replaces the isCityDay function from constants
   */
  async isCityScheduled(city: string, date: Date): Promise<boolean> {
    if (!this.apiKey || !this.calendarId) {
      // Fallback to existing logic from constants if calendar not configured
      return this.fallbackCityDayCheck(city, date);
    }

    try {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const events = await this.getEventsForDate(dateStr);
      
      // Check if any event mentions this city
      return events.some(event => 
        event.summary?.toLowerCase().includes(city.toLowerCase()) ||
        event.location?.toLowerCase().includes(city.toLowerCase())
      );
    } catch (error) {
      console.error('Error checking calendar for city schedule:', error);
      return this.fallbackCityDayCheck(city, date);
    }
  }

  /**
   * Check if a date is empty (no events) for early booking discount
   */
  async isEmptyCalendarDay(date: Date): Promise<boolean> {
    if (!this.apiKey || !this.calendarId) {
      // Without calendar integration, we can't determine empty days
      return false;
    }

    try {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const events = await this.getEventsForDate(dateStr);
      
      // Day is empty if no events or only non-moving events
      return events.length === 0 || 
             events.every(event => !this.isMovingEvent(event));
    } catch (error) {
      console.error('Error checking if calendar day is empty:', error);
      return false;
    }
  }

  /**
   * Get all events for a specific date
   */
  private async getEventsForDate(dateStr: string): Promise<CalendarEvent[]> {
    const timeMin = `${dateStr}T00:00:00Z`;
    const timeMax = `${dateStr}T23:59:59Z`;
    
    const url = `${this.baseUrl}/calendars/${encodeURIComponent(this.calendarId)}/events` +
                `?key=${this.apiKey}` +
                `&timeMin=${timeMin}` +
                `&timeMax=${timeMax}` +
                `&singleEvents=true` +
                `&orderBy=startTime`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.status} ${response.statusText}`);
    }

    const data: CalendarResponse = await response.json();
    return data.items || [];
  }

  /**
   * Check if an event is a moving-related event
   */
  private isMovingEvent(event: CalendarEvent): boolean {
    const summary = event.summary?.toLowerCase() || '';
    const location = event.location?.toLowerCase() || '';
    
    const movingKeywords = [
      'moving', 'move', 'transport', 'delivery', 'pickup',
      'amsterdam', 'rotterdam', 'utrecht', 'the hague', 'eindhoven',
      'tilburg', 'groningen', 'city day', 'schedule'
    ];
    
    return movingKeywords.some(keyword => 
      summary.includes(keyword) || location.includes(keyword)
    );
  }

  /**
   * Fallback city day checking logic (uses existing constants)
   */
  private fallbackCityDayCheck(city: string, date: Date): boolean {
    // Import your existing isCityDay function from constants
    // This is a placeholder - replace with your actual fallback logic
    
    // Example fallback: weekdays are city days, weekends are normal days
    const dayOfWeek = date.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    
    // Different cities could have different patterns
    const citySchedules: { [city: string]: number[] } = {
      'Amsterdam': [1, 3, 5], // Monday, Wednesday, Friday
      'Rotterdam': [2, 4],     // Tuesday, Thursday
      'Utrecht': [1, 2, 3, 4, 5], // All weekdays
      'The Hague': [1, 4],     // Monday, Thursday
      'Eindhoven': [2, 5],     // Tuesday, Friday
      'Tilburg': [3],          // Wednesday
      'Groningen': [1, 5],     // Monday, Friday
    };
    
    const scheduledDays = citySchedules[city];
    return scheduledDays ? scheduledDays.includes(dayOfWeek) : isWeekday;
  }

  /**
   * Get upcoming events for a city (useful for admin dashboard)
   */
  async getUpcomingEventsForCity(city: string, daysAhead = 30): Promise<CalendarEvent[]> {
    if (!this.apiKey || !this.calendarId) {
      return [];
    }

    try {
      const now = new Date();
      const future = new Date();
      future.setDate(now.getDate() + daysAhead);
      
      const timeMin = now.toISOString();
      const timeMax = future.toISOString();
      
      const url = `${this.baseUrl}/calendars/${encodeURIComponent(this.calendarId)}/events` +
                  `?key=${this.apiKey}` +
                  `&timeMin=${timeMin}` +
                  `&timeMax=${timeMax}` +
                  `&singleEvents=true` +
                  `&orderBy=startTime` +
                  `&maxResults=50`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.status} ${response.statusText}`);
      }

      const data: CalendarResponse = await response.json();
      const events = data.items || [];
      
      // Filter events for this specific city
      return events.filter(event => 
        event.summary?.toLowerCase().includes(city.toLowerCase()) ||
        event.location?.toLowerCase().includes(city.toLowerCase())
      );
    } catch (error) {
      console.error('Error fetching upcoming events for city:', error);
      return [];
    }
  }
}

export const calendarService = new CalendarService();
export default calendarService;

/**
 * USAGE EXAMPLES:
 * 
 * // Check if Amsterdam is scheduled on a specific date
 * const isAmsterdamDay = await calendarService.isCityScheduled('Amsterdam', new Date('2024-01-15'));
 * 
 * // Check if a date is empty for early booking discount
 * const isEmpty = await calendarService.isEmptyCalendarDay(new Date('2024-01-20'));
 * 
 * // Get upcoming Amsterdam events
 * const upcomingEvents = await calendarService.getUpcomingEventsForCity('Amsterdam');
 * 
 * CALENDAR SETUP TIPS:
 * 1. Create events with clear naming: "Amsterdam City Day", "Rotterdam Schedule"
 * 2. Use different colors for different cities
 * 3. Include location information in events
 * 4. Set up recurring events for regular schedules
 * 5. Make calendar public if using API key (simpler setup)
 * 6. Or use OAuth2 for private calendars (more secure but complex setup)
 */ 