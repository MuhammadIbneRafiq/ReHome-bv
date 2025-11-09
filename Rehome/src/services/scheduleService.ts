import { supabase } from '../hooks/supaBase';

export interface DaySchedule {
  scheduleDate: string;
  assignedCities: string[];
  isEmpty: boolean;
  totalScheduledCities: number;
}

/**
 * Fetch schedule data for an entire month using optimized Supabase RPC
 * This reduces API calls from 30+ (one per day) to just 1 per month
 */
export async function getMonthSchedule(
  year: number,
  month: number
): Promise<Map<string, DaySchedule>> {
  try {
    // Calculate start and end dates for the month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`[scheduleService] Fetching schedule for ${startDateStr} to ${endDateStr}`);

    const { data, error } = await supabase.rpc('get_month_schedule', {
      start_date: startDateStr,
      end_date: endDateStr
    });

    if (error) {
      console.error('[scheduleService] Error fetching month schedule:', error);
      return new Map();
    }

    // Convert to Map for efficient lookups
    const scheduleMap = new Map<string, DaySchedule>();
    
    if (data) {
      data.forEach((row: any) => {
        scheduleMap.set(row.schedule_date, {
          scheduleDate: row.schedule_date,
          assignedCities: row.assigned_cities || [],
          isEmpty: row.is_empty,
          totalScheduledCities: row.total_scheduled_cities || 0
        });
      });
    }

    console.log(`[scheduleService] Loaded ${scheduleMap.size} days of schedule data`);
    return scheduleMap;
  } catch (error) {
    console.error('[scheduleService] Unexpected error:', error);
    return new Map();
  }
}

/**
 * Check if a specific city is scheduled on a given date
 * Uses the bulk-loaded schedule data
 */
export function isCityScheduled(
  scheduleMap: Map<string, DaySchedule>,
  city: string,
  dateStr: string
): boolean {
  const daySchedule = scheduleMap.get(dateStr);
  if (!daySchedule) return false;
  
  return daySchedule.assignedCities.includes(city);
}

