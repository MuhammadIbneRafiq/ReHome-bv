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

export interface BlockedTimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  cities: string[];
  reason?: string;
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
 * Fetch all blocked time slots
 */
export async function fetchBlockedTimeSlots(): Promise<BlockedTimeSlot[]> {
  try {
    const { data, error } = await supabase
      .from('blocked_time_slots')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching blocked time slots:', error);
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
 * Fetch blocked time slots for a specific date
 */
export async function fetchBlockedTimeSlotsForDate(
  date: string
): Promise<BlockedTimeSlot[]> {
  try {
    const { data, error } = await supabase
      .from('blocked_time_slots')
      .select('*')
      .eq('date', date)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching blocked time slots for date:', error);
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
 * Create a new blocked time slot
 */
export async function createBlockedTimeSlot(
  blockedTimeSlot: Omit<BlockedTimeSlot, 'id' | 'created_at' | 'updated_at'>
): Promise<BlockedTimeSlot> {
  try {
    const { data, error } = await supabase
      .from('blocked_time_slots')
      .insert([blockedTimeSlot])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating blocked time slot:', error);
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
 * Update a blocked time slot
 */
export async function updateBlockedTimeSlot(
  id: string,
  updates: Partial<Omit<BlockedTimeSlot, 'id' | 'created_at' | 'updated_at'>>
): Promise<BlockedTimeSlot> {
  try {
    const { data, error } = await supabase
      .from('blocked_time_slots')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating blocked time slot:', error);
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
 * Delete a blocked time slot
 */
export async function deleteBlockedTimeSlot(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('blocked_time_slots')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting blocked time slot:', error);
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
 * Check if a time slot is blocked for a specific city
 */
export async function isTimeSlotBlocked(
  date: string,
  startTime: string,
  endTime: string,
  cityName?: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_time_slot_blocked', {
      check_date: date,
      check_start_time: startTime,
      check_end_time: endTime,
      city_name: cityName || null,
    });

    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('Error checking if time slot is blocked:', error);
    // Fallback to manual check if RPC fails
    return await isTimeSlotBlockedFallback(date, startTime, endTime, cityName);
  }
}

/**
 * Fallback method to check if a time slot is blocked
 */
async function isTimeSlotBlockedFallback(
  date: string,
  startTime: string,
  endTime: string,
  cityName?: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('blocked_time_slots')
      .select('*')
      .eq('date', date);

    if (error) throw error;

    if (!data || data.length === 0) return false;

    // Convert time strings to comparable format (HH:MM)
    const checkStart = startTime.substring(0, 5);
    const checkEnd = endTime.substring(0, 5);

    // Check if any time slot overlaps
    for (const blockedSlot of data) {
      // Check if cities apply
      const citiesMatch =
        blockedSlot.cities.length === 0 ||
        !cityName ||
        blockedSlot.cities.includes(cityName);

      if (!citiesMatch) continue;

      const slotStart = blockedSlot.start_time.substring(0, 5);
      const slotEnd = blockedSlot.end_time.substring(0, 5);

      // Check for overlap
      const overlaps =
        (slotStart <= checkStart && slotEnd > checkStart) ||
        (slotStart < checkEnd && slotEnd >= checkEnd) ||
        (slotStart >= checkStart && slotEnd <= checkEnd);

      if (overlaps) return true;
    }

    return false;
  } catch (error) {
    console.error('Error in fallback time slot blocked check:', error);
    return false;
  }
}

/**
 * Get all blocked dates and time slots for a date range (for calendar display)
 */
export async function getBlockedDatesAndTimesForRange(
  startDate: string,
  endDate: string
): Promise<{ dates: BlockedDate[]; timeSlots: BlockedTimeSlot[] }> {
  try {
    const [dates, timeSlots] = await Promise.all([
      fetchBlockedDatesForRange(startDate, endDate),
      (async () => {
        const { data, error } = await supabase
          .from('blocked_time_slots')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });

        if (error) throw error;
        return data || [];
      })(),
    ]);

    return { dates, timeSlots };
  } catch (error) {
    console.error('Error fetching blocked dates and times for range:', error);
    throw error;
  }
}


