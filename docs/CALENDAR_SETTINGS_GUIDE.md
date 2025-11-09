# Calendar Settings & Blocked Dates Feature

## Overview

This feature allows administrators to manage calendar settings, including:
- **City Days Configuration**: Set specific days of the week that have higher pricing for each city
- **Blocked Dates**: Block entire days from booking

All booking pages (House Moving, Item Moving, Item Donation, and Special Requests) automatically validate against these settings to prevent bookings during blocked periods.

## Database Setup

### 1. Run the Database Schema

Execute the following SQL schema file in your Supabase SQL Editor:

```
rehome-backend/db/blocked_dates_schema.sql
```

This will create:
- `blocked_dates` table - for full day blocks
- Helper functions for checking blocked dates
- Proper indexes and RLS policies

### 2. Tables Created

#### `blocked_dates`
- `id` (UUID, primary key)
- `date` (DATE) - The blocked date
- `cities` (TEXT[]) - Array of cities affected (empty = all cities)
- `reason` (TEXT) - Optional reason for blocking
- `is_full_day` (BOOLEAN) - Whether the entire day is blocked
- `created_at`, `updated_at`, `created_by`


## Admin Dashboard Usage

### Accessing Calendar Settings

1. Navigate to the Admin Dashboard
2. Click on the **"Schedule Management"** tab
3. You'll see two sub-tabs:
   - **Calendar & City Schedules**: Existing calendar view for assigning cities to dates
   - **Calendar Settings**: NEW - Manage city days, blocked dates, and blocked times

### Managing City Days

City days are days of the week where pricing is higher for specific cities (e.g., market days).

1. Go to **Schedule Management > Calendar Settings**
2. In the **City Days Configuration** section:
   - Click **"Add City Day"**
   - Select a city from the dropdown
   - Check the days of the week that should have higher pricing
   - Click **"Save"**
3. To edit: Click the edit icon next to any city day configuration
4. To delete: Click the trash icon

**Example**: Set Amsterdam to have higher pricing on Wednesdays and Saturdays (market days)

### Blocking Entire Days

Block specific dates when no bookings should be accepted.

1. Go to **Schedule Management > Calendar Settings**
2. In the **Blocked Dates** section:
   - Click **"Block Date"**
   - Select the date to block
   - Optionally add a reason (e.g., "Holiday", "Maintenance")
   - Choose which cities are affected (leave empty to block all cities)
   - Click **"Save"**
3. To edit or delete: Use the edit/trash icons next to each blocked date

**Examples**:
- Block December 25th for all cities (Holiday)
- Block a specific date for Rotterdam only (Local event)


## How Validation Works

### Automatic Validation in Booking Pages

When users try to book a service, the system automatically:

1. **Checks Selected Dates**: Validates that the selected date(s) are not blocked
2. **Checks City-Specific Blocks**: If the user selected a city, only blocks for that city (or all cities) are checked
3. **Checks Date Ranges**: For flexible bookings, validates that ALL dates in the range are available
4. **Checks Time Slots** (future enhancement): Can validate specific pickup/dropoff times

### User Experience

If a user selects a blocked date:
- They see a friendly error message: *"The selected date (January 15, 2025) is not available for booking. Please select a different date."*
- For city-specific blocks: *"The selected date (January 15, 2025) is not available for booking for Amsterdam. Please select a different date."*
- For date ranges: *"One or more dates in your selected range are not available for booking. The date January 15, 2025 is blocked. Please select a different date range."*

### Pages with Validation

1. **House Moving** (`ItemMovingPage.tsx` - house moving mode)
   - Validates selected moving date
   - Validates flexible date range

2. **Item Transport** (`ItemMovingPage.tsx` - item transport mode)
   - Validates pickup and dropoff dates
   - Validates flexible date range

3. **Item Donation** (`ItemDonationPage.tsx`)
   - Validates preferred pickup date

4. **Special Requests** (`SpecialRequestPage.tsx`)
   - Validates dates for Full/International Move service
   - Validates dates for Junk Removal service

## API Services

### Service Functions (`blockedDatesService.ts`)

```typescript
// Fetch all blocked dates
fetchBlockedDates(): Promise<BlockedDate[]>

// Create a new blocked date
createBlockedDate(blockedDate: Omit<BlockedDate, 'id' | 'created_at' | 'updated_at'>): Promise<BlockedDate>

// Update a blocked date
updateBlockedDate(id: string, updates: Partial<BlockedDate>): Promise<BlockedDate>

// Delete a blocked date
deleteBlockedDate(id: string): Promise<void>

// Check if a date is blocked (uses Supabase RPC function)
isDateBlocked(date: string, cityName?: string): Promise<boolean>

// Get blocked dates for calendar display
getBlockedDatesForCalendar(startDate: string, endDate: string): Promise<BlockedDate[]>
```

### Validation Utilities (`dateValidation.ts`)

```typescript
// Validate a booking date or date range
validateBookingDate(startDate: Date | string, endDate?: Date | string, cityName?: string): Promise<{ isValid: boolean; message?: string }>

// Validate a booking time slot
validateBookingTimeSlot(date: Date | string, startTime: string, endTime: string, cityName?: string): Promise<{ isValid: boolean; message?: string }>

// Get list of blocked dates for display (e.g., disable in date picker)
getBlockedDatesForDisplay(startDate: Date | string, endDate: Date | string, cityName?: string): Promise<string[]>

// Get blocked dates in a range with reasons
getBlockedDatesInRange(startDate: Date | string, endDate: Date | string, cityName?: string): Promise<{ date: string; reason?: string }[]>
```

## Database Helper Functions

The schema includes SQL functions that can be called from anywhere:

```sql
-- Check if a date is blocked
SELECT is_date_blocked('2025-01-15', 'Amsterdam');

-- Get all blocked dates in a range
SELECT * FROM get_blocked_dates('2025-01-01', '2025-01-31', 'Amsterdam');
```

## Edge Cases Handled

1. **Empty Cities Array**: When `cities` is an empty array `[]`, the block applies to ALL cities
2. **City-Specific Blocks**: When specific cities are listed, only those cities are blocked
3. **Time Slot Overlaps**: The system detects any time overlap, not just exact matches
4. **Date Ranges**: For flexible bookings, ALL dates in the range must be available
5. **Graceful Fallback**: If the validation service fails, bookings are still allowed (logged as error)

## Security

- **Row Level Security (RLS)**: All users can read blocked dates (needed for validation), but only authenticated admins can create/update/delete
- **Admin-Only Access**: The Calendar Settings UI is only accessible from the Admin Dashboard
- **Audit Trail**: `created_at`, `updated_at`, and `created_by` fields track changes

## Future Enhancements

1. **Recurring Blocks**: Add support for recurring blocks (e.g., every Wednesday)
2. **Capacity Management**: Instead of full blocks, set max bookings per day
3. **Bulk Operations**: Add bulk blocking for date ranges
4. **Reason Templates**: Provide common reason templates (Holiday, Maintenance, Staff unavailable)
5. **Import/Export**: Allow importing blocked dates from calendar files (iCal)
6. **Notifications**: Notify admins when users attempt to book blocked dates

**Note**: Blocked dates now display in the EnhancedDatePickerInline with gray strikethrough styling.

## Troubleshooting

### Validation Not Working

1. Check that the database schema has been run successfully
2. Verify RLS policies are in place: `blocked_dates` table should allow public read access
3. Check browser console for errors
4. Verify the Supabase RPC function exists: `is_date_blocked`

### Blocked Dates Not Appearing in Admin UI

1. Check that the tables exist in Supabase
2. Verify authentication is working (check `localStorage.getItem('accessToken')`)
3. Check network tab for failed API calls
4. Verify the `CalendarSettingsSection` component is properly imported

### Users Still Able to Book on Blocked Dates

1. Check that the validation is actually running (add console.log if needed)
2. Verify the city name being passed matches exactly (case-sensitive)
3. Check that the date format is correct (YYYY-MM-DD)
4. Ensure the fallback validation is not always returning true

## Testing

### Manual Testing Checklist

1. ☐ Add a blocked date for all cities
2. ☐ Try to book on that date from House Moving page → Should show error
3. ☐ Add a city-specific blocked date
4. ☐ Try to book for that city → Should show error
5. ☐ Try to book for a different city → Should succeed
6. ☐ Add a blocked time slot
7. ☐ Try to book during that time → Should show error (when time validation is implemented)
8. ☐ Edit a blocked date → Changes should save
9. ☐ Delete a blocked date → Should be removed
10. ☐ Test with flexible date range including blocked date → Should show error

## Support

For issues or questions about this feature, please:
1. Check this documentation
2. Review the code comments in `blockedDatesService.ts` and `dateValidation.ts`
3. Check Supabase logs for database-related issues
4. Review browser console for client-side errors


