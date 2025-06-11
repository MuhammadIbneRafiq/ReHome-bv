# Google Calendar Integration Setup Guide

## Overview
ReHome supports Google Calendar integration for advanced scheduling features:
- **City Day Detection**: Automatically detect when business is scheduled in specific cities
- **Early Booking Discounts**: Offer 50% discounts on empty calendar days  
- **Real-time Availability**: Show actual calendar availability to customers

## Setup Instructions

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google Calendar API**
4. Create credentials (API Key for public calendars)

### 2. Environment Variables
Create `.env` file in `Rehome/` directory:
```
VITE_GOOGLE_CALENDAR_API_KEY=your_api_key_here
VITE_GOOGLE_CALENDAR_ID=your_calendar_id_here
```

### 3. Calendar Event Format
- **City Events**: "Amsterdam City Day", "Rotterdam Schedule"
- **Empty Days**: No events = 50% early booking discount

## Current Status: ✅ FULLY IMPLEMENTED
- Calendar service with Google API integration
- Pricing service uses calendar for city day detection
- Fallback to hardcoded schedule when calendar unavailable
- Environment variable support ready

The system works with or without calendar configuration! 