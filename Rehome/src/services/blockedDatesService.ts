import { supabase } from '../lib/supabaseClient';

export interface BlockedDate {
  id: string;
  date: string;
  cities: string[];
  reason?: string;
  is_full_day: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

/**
 * Fetch all blocked dates
 */
export async function fetchBlockedDates(): Promise<BlockedDate[]> {
  try {
    const { data, error } = await supabase
      .from('blocked_dates')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    throw error;
  }
}

/**
 * Fetch blocked dates for a specific date range
 */
export async function fetchBlockedDatesForRange(
  startDate: string,
  endDate: string
): Promise<BlockedDate[]> {
  try {
    const { data, error } = await supabase
      .from('blocked_dates')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching blocked dates for range:', error);
    throw error;
  }
}

/**
 * Create a new blocked date
 */
export async function createBlockedDate(
  blockedDate: Omit<BlockedDate, 'id' | 'created_at' | 'updated_at'>
): Promise<BlockedDate> {
  try {
    const { data, error } = await supabase
      .from('blocked_dates')
      .insert([blockedDate])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating blocked date:', error);
    throw error;
  }
}

/**
 * Update a blocked date
 */
export async function updateBlockedDate(
  id: string,
  updates: Partial<Omit<BlockedDate, 'id' | 'created_at' | 'updated_at'>>
): Promise<BlockedDate> {
  try {
    const { data, error } = await supabase
      .from('blocked_dates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating blocked date:', error);
    throw error;
  }
}

/**
 * Delete a blocked date
 */
export async function deleteBlockedDate(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('blocked_dates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting blocked date:', error);
    throw error;
  }
}

/**
 * Check if a date is blocked for a specific city
 */
export async function isDateBlocked(
  date: string,
  cityName?: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_date_blocked', {
      check_date: date,
      city_name: cityName || null,
    });

    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('Error checking if date is blocked:', error);
    // Fallback to manual check if RPC fails
    return await isDateBlockedFallback(date, cityName);
  }
}

/**
 * Fallback method to check if a date is blocked
 */
async function isDateBlockedFallback(
  date: string,
  cityName?: string
): Promise<boolean> {
  try {
    let query = supabase
      .from('blocked_dates')
      .select('*')
      .eq('date', date)
      .eq('is_full_day', true);

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) return false;

    // Check if any blocked date applies
    for (const blockedDate of data) {
      // If cities array is empty, all cities are blocked
      if (blockedDate.cities.length === 0) return true;
      // If city name is provided and it's in the blocked cities list
      if (cityName && blockedDate.cities.includes(cityName)) return true;
    }

    return false;
  } catch (error) {
    console.error('Error in fallback date blocked check:', error);
    return false;
  }
}

/**
 * Get all blocked dates for a date range (for calendar display)
 */
export async function getBlockedDatesForCalendar(
  startDate: string,
  endDate: string
): Promise<BlockedDate[]> {
  try {
    return await fetchBlockedDatesForRange(startDate, endDate);
  } catch (error) {
    console.error('Error fetching blocked dates for calendar:', error);
    throw error;
  }
}


