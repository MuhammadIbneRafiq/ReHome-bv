# Supabase RPC Functions Deployment Guide

## 🎯 What Was Fixed

### 1. **Table Name Corrections**
- Fixed all references from `city_schedule` → `city_schedules` (with 's')
- Fixed all column names to match actual schema:
  - `city_name` → `city`
  - `schedule_date` → `date`
  - Removed references to non-existent `is_active` column

### 2. **Blocked Dates Function Fix**
- Updated `is_date_blocked()` to use correct schema:
  - Changed from `blocked_date` column to `date`
  - Changed from single `city_name` to `cities` array
  - Added support for `is_full_day` boolean
  - Removed references to non-existent `is_active` column

### 3. **Added Missing Functions**
- ✅ `get_month_schedule()` - Efficiently loads entire month in one call
- ✅ `get_blocked_dates()` - Fetches blocked dates for a date range

### 4. **Real-Time Updates**
- Added callback system from `CalendarSettingsSection` to `AdminDashboard`
- Now when you block a date, the main calendar refreshes automatically
- No more page reload needed! 🎉

---

## 📋 Deployment Steps

### Step 1: Run the Main SQL File

1. **Open Supabase Dashboard** → Your Project
2. Go to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy the **entire contents** of:
   ```
   rehome-backend/sql/supabase-rpc-functions.sql
   ```
5. Paste into the SQL Editor
6. Click **Run** (or press `Ctrl+Enter`)

✅ This will create/update all 10 RPC functions

---

### Step 2: Verify Functions Were Created

Run this verification query:

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'is_date_blocked',
    'get_month_schedule',
    'get_blocked_dates',
    'get_city_schedule_status',
    'get_city_days_in_range',
    'get_batch_city_schedules'
  )
ORDER BY routine_name;
```

You should see **6 functions** listed as type `FUNCTION`.

---

### Step 3: Verify Table Schemas

Make sure your tables match the expected schema:

#### Check `city_schedules` table:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'city_schedules';
```

**Expected columns:**
- `id` (uuid)
- `date` (date)
- `city` (text)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

#### Check `blocked_dates` table:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'blocked_dates';
```

**Expected columns:**
- `id` (uuid)
- `date` (date)
- `cities` (ARRAY of text)
- `reason` (text)
- `is_full_day` (boolean)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `created_by` (text)

---

### Step 4: Test the Functions

#### Test `is_date_blocked`:
```sql
SELECT is_date_blocked('2024-12-25', NULL) AS is_christmas_blocked;
```

#### Test `get_month_schedule`:
```sql
SELECT * FROM get_month_schedule('2024-12-01', '2024-12-31');
```

#### Test `get_blocked_dates`:
```sql
SELECT * FROM get_blocked_dates('2024-12-01', '2024-12-31', NULL);
```

---

## 🔧 How the Real-Time Updates Work

### Before (❌):
1. User blocks a date in Calendar Settings
2. Calendar shows old data
3. **User has to reload page** to see changes

### After (✅):
1. User blocks a date in Calendar Settings
2. `CalendarSettingsSection` calls `onBlockedDatesChange()` callback
3. `AdminDashboard` runs `loadBlockedDates()` automatically
4. Calendar updates **immediately** via `useEffect` dependency on `blockedDatesMap`

---

## 🚀 Performance Benefits

### Before:
- 30+ API calls per month view (one per day)
- Slow initial load
- No caching

### After:
- **1 API call** per month view via `get_month_schedule()`
- Fast initial load
- Efficient database queries with proper indexes

---

## 📊 Function Overview

| Function | Purpose | Used By |
|----------|---------|---------|
| `is_date_blocked` | Check if date blocked for city | Date picker, booking form |
| `get_month_schedule` | Load entire month schedule | Admin calendar |
| `get_blocked_dates` | Get all blocked dates in range | Calendar settings |
| `get_city_schedule_status` | Check city availability | Booking logic |
| `get_city_days_in_range` | Get scheduled days | City selection |
| `get_batch_city_schedules` | Batch schedule check | Performance optimization |

---

## ✅ Checklist

- [ ] Run `supabase-rpc-functions.sql` in Supabase SQL Editor
- [ ] Verify all 6+ functions created successfully
- [ ] Test `is_date_blocked()` function
- [ ] Test `get_month_schedule()` function
- [ ] Clear browser cache and test calendar
- [ ] Block a date in Calendar Settings
- [ ] Verify calendar updates WITHOUT page reload
- [ ] Test booking form with blocked dates

---

## 🐛 Troubleshooting

### "Function already exists" error
This is OK! The SQL uses `CREATE OR REPLACE FUNCTION` which updates existing functions.

### "Table does not exist" error
You need to run the table creation scripts first:
1. `rehome-backend/db/city_schedules_schema.sql`
2. `rehome-backend/db/blocked_dates_schema.sql`

### Calendar not updating
1. Check browser console for errors
2. Verify you're using the updated code (clear cache)
3. Make sure `loadBlockedDates()` is being called in `AdminDashboard`

---

## 📝 Next Steps

1. Deploy the SQL functions to Supabase
2. Test the calendar blocking functionality
3. Monitor performance improvements
4. Consider adding Supabase Realtime subscriptions for multi-user scenarios

---

**Last Updated:** $(date)
**Schema Version:** 2.0
**Compatible with:** Supabase PostgreSQL 15+
