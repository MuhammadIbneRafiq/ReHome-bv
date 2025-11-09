# Calendar Improvements - Deployment Steps

## Prerequisites
- Supabase access with SQL execution permissions
- Frontend build/deployment access
- Ability to test in staging environment (recommended)

---

## Step 1: Deploy Database Changes (CRITICAL - Do This First!)

### Option A: Using Supabase Dashboard (Recommended)
1. Log into your Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of:
   ```
   /rehome-backend/sql/get-month-schedule.sql
   ```
5. Click **Run** to create the RPC function
6. Verify success: You should see "Success. No rows returned"

### Option B: Using psql CLI
```bash
# Connect to your Supabase database
psql -h your-project-ref.supabase.co -U postgres -d postgres

# Run the migration
\i rehome-backend/sql/get-month-schedule.sql

# Verify function exists
\df get_month_schedule
```

### Verification
Run this test query to ensure the function works:
```sql
SELECT * FROM get_month_schedule(
  '2025-01-01'::date,
  '2025-01-31'::date
);
```

**Expected Result:** A table showing dates, assigned cities, and empty status for January 2025.

---

## Step 2: Deploy Frontend Changes

### Files to Deploy
```
src/
  ├── services/
  │   └── scheduleService.ts                    [NEW]
  ├── components/ui/
  │   └── EnhancedDatePickerInline.tsx          [NEW]
  └── lib/pages/
      └── ItemMovingPage.tsx                    [MODIFIED]
```

### Deployment Commands
```bash
# 1. Build the frontend
npm run build

# 2. Test the build locally (optional but recommended)
npm run preview

# 3. Deploy to production
# (Use your normal deployment process - Vercel, Netlify, etc.)
git add .
git commit -m "feat: Improved calendar with bulk loading and inline display"
git push origin main
```

---

## Step 3: Post-Deployment Verification

### Test Checklist

#### 1. Database Function
```sql
-- Test the RPC function
SELECT * FROM get_month_schedule(
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days'
);
```

#### 2. Frontend Calendar Loading
1. Open the item transport or house moving page
2. **Check:** Calendar should load within 200ms
3. **Check:** No console errors
4. **Check:** Days with assigned cities show green highlighting
5. **Check:** Click a date to see assigned cities in detail panel

#### 3. Calendar Behavior
1. **Test:** Click on "Pickup Date" input
   - ✅ Calendar should appear inline below the input
2. **Test:** Click on "Dropoff Date" input
   - ✅ Pickup Date calendar should close
   - ✅ Dropoff Date calendar should open
3. **Test:** Select a date
   - ✅ Calendar should close automatically
   - ✅ Selected date should appear in input field

#### 4. Performance Monitoring
Open browser DevTools → Network tab:
1. Load the calendar
2. **Check:** Only ONE call to `get_month_schedule` RPC
3. **Check:** No calls to `/api/city-schedule-status` (old endpoint)
4. **Check:** Total load time < 500ms

---

## Step 4: Monitor for Issues

### First 24 Hours
Watch for these potential issues:

#### Database Performance
```sql
-- Check RPC function execution times
SELECT 
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_user_functions
WHERE funcname = 'get_month_schedule';
```

**Expected:** mean_exec_time < 100ms

#### Frontend Errors
Monitor your error tracking tool (Sentry, LogRocket, etc.) for:
- `[scheduleService]` errors
- `[EnhancedDatePicker]` errors
- Failed RPC calls

---

## Rollback Plan (If Needed)

### Quick Rollback
If critical issues arise:

1. **Revert Frontend:** Deploy previous commit
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Database:** The RPC function is additive, no need to remove it
   - Old frontend code doesn't use it
   - New code requires it

### Partial Rollback
If only frontend has issues:
```bash
# Revert just the ItemMovingPage.tsx changes
git checkout HEAD~1 -- src/lib/pages/ItemMovingPage.tsx
git commit -m "Revert: ItemMovingPage calendar changes"
git push origin main
```

---

## Step 5: Optimize (After Stable)

### Optional Enhancements

#### 1. Add Database Index
```sql
-- Speed up schedule queries
CREATE INDEX IF NOT EXISTS idx_city_schedules_date 
ON city_schedules(date);
```

#### 2. Enable Supabase Realtime (Future)
```typescript
// Add to scheduleService.ts
const subscription = supabase
  .channel('schedule_changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'city_schedules' },
    (payload) => {
      // Invalidate cache and reload
      refreshMonthSchedule();
    }
  )
  .subscribe();
```

#### 3. Add Prefetching
```typescript
// Prefetch next month when user switches months
useEffect(() => {
  const nextMonth = currentMonth + 1;
  prefetchMonthSchedule(currentYear, nextMonth);
}, [currentMonth]);
```

---

## Troubleshooting Guide

### Issue: Calendar shows all days as empty

**Cause:** Database function not deployed
**Fix:** Run Step 1 again

### Issue: "RPC function not found" error

**Cause:** Function name mismatch or permissions
**Fix:** 
```sql
-- Check function exists
SELECT proname FROM pg_proc WHERE proname = 'get_month_schedule';

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_month_schedule(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_month_schedule(date, date) TO anon;
```

### Issue: Calendar loads slowly

**Cause:** Database query not optimized
**Fix:** Add index (see Step 5)

### Issue: Calendar doesn't close when clicking another input

**Cause:** State management issue
**Check:**
1. Ensure all `handleCalendarToggle` calls are correct
2. Verify `closeAllCalendars` function is defined
3. Check browser console for errors

---

## Success Criteria

✅ **Performance:** Calendar loads in < 200ms
✅ **Accuracy:** Assigned cities display correctly
✅ **UX:** Only one calendar open at a time
✅ **Stability:** No increase in error rate
✅ **User Satisfaction:** Faster, clearer date selection

---

## Support Contacts

- **Database Issues:** Check Supabase logs and contact Supabase support
- **Frontend Issues:** Check browser console and error tracking tool
- **General Questions:** Refer to CALENDAR_IMPROVEMENTS_SUMMARY.md

---

*Last Updated: 2025-01-09*
