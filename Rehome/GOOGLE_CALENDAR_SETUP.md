# Google Calendar Integration Setup Guide

## Overview
ReHome supports Google Calendar integration for advanced scheduling features including:
- **City Day Detection**: Automatically detect when your business is scheduled in specific cities
- **Early Booking Discounts**: Offer 50% discounts on empty calendar days
- **Real-time Availability**: Show actual calendar availability to customers

## Features
✅ **Automated City Scheduling**: Calendar events determine city day rates  
✅ **Early Booking Discounts**: Empty days get automatic 50% discount  
✅ **Fallback Logic**: Works without calendar (uses hardcoded schedule)  
✅ **Environment Variable Support**: Easy configuration via .env files  

## Setup Instructions

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google Calendar API**
4. Create credentials:
   - For **public calendars**: Use API Key
   - For **private calendars**: Use OAuth2

### 2. Create Business Calendar
1. Create a new Google Calendar for your moving business
2. Make it public if using API Key authentication
3. Set up events with city names in titles/locations

### 3. Environment Variables
Create or update your `.env` file in the `Rehome/` directory:

```env
# Google Calendar Integration
REACT_APP_GOOGLE_CALENDAR_API_KEY=your_google_calendar_api_key_here
REACT_APP_GOOGLE_CALENDAR_ID=your_calendar_id_here

# Optional: Default calendar ID as fallback
REACT_APP_DEFAULT_CALENDAR_ID=rehome.business@gmail.com
```

### 4. Event Format Examples
Create calendar events with these formats:

**City Day Events:**
- Title: "Amsterdam City Day" 
- Title: "Rotterdam Schedule"
- Location: "Amsterdam", "Rotterdam", etc.

**Moving Events:**
- Title: "House Moving - Smith Family"
- Location: "Amsterdam"

**Empty Days:**
- No events = Early booking discount available (50% off)

## Current Integration Status

### ✅ Already Implemented:
1. **Calendar Service** (`src/services/calendarService.ts`)
   - Google Calendar API integration
   - City scheduling detection
   - Empty day checking
   - Fallback to hardcoded logic

2. **Pricing Service** (`src/services/pricingService.ts`)
   - Uses calendar service for city day detection
   - Applies early booking discounts
   - Async/await calendar integration
   - Graceful fallback when calendar unavailable

3. **Environment Variable Support**
   - `REACT_APP_GOOGLE_CALENDAR_API_KEY`
   - `REACT_APP_GOOGLE_CALENDAR_ID`
   - Hardcoded fallback when not configured

### 📋 Fallback Behavior (Without Calendar):
When calendar is not configured or unavailable, the system uses:
- **Hardcoded city schedules** from `src/lib/constants.ts`
- **No early booking discounts** (calendar required for empty day detection)
- **Standard city day logic** (e.g., Amsterdam on Mondays)

## Testing the Integration

### Test Calendar Setup:
1. Create test events in your Google Calendar
2. Add city names to event titles/locations
3. Leave some days empty for early booking testing

### Test in Application:
1. Select a date with calendar events → Should get city day rate
2. Select an empty date → Should get early booking discount (50% off)
3. Select a date without calendar access → Should use fallback logic

## API Usage Limits
- **Google Calendar API**: 1,000,000 queries per day (free tier)
- **ReHome Usage**: ~1-3 API calls per pricing calculation
- **Recommended**: Monitor usage in Google Cloud Console

## Troubleshooting

### Calendar Not Working?
1. Check environment variables are set correctly
2. Verify calendar ID is correct
3. Ensure calendar is public (for API key auth)
4. Check API key has Calendar API enabled
5. Look for console warnings about calendar service

### Still Getting Fallback Behavior?
This is normal! The app works fine without calendar integration using the hardcoded city schedules from `constants.ts`.

## Technical Implementation

The calendar integration is fully asynchronous and non-blocking:

```typescript
// Calendar integration with fallback
const isScheduledDay = await calendarService.isCityScheduled(city, date);
const isEmptyDay = await calendarService.isEmptyCalendarDay(date);

// Falls back to constants if calendar fails
return isCityDay(city, date); // Hardcoded fallback
```

This ensures the pricing system always works, whether calendar is configured or not. 