import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaClock, FaCalendarTimes } from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabaseClient';
import {
  BlockedDate,
  BlockedTimeSlot,
  fetchBlockedDates,
  fetchBlockedTimeSlots,
  createBlockedDate,
  createBlockedTimeSlot,
  updateBlockedDate,
  updateBlockedTimeSlot,
  deleteBlockedDate,
  deleteBlockedTimeSlot,
} from '../../services/blockedDatesService';

interface CalendarSettingsSectionProps {
  allCities: string[];
}

interface CityDayData {
  id: string;
  city_name: string;
  days: string[];
  created_at?: string;
  updated_at?: string;
}

const CalendarSettingsSection: React.FC<CalendarSettingsSectionProps> = ({ allCities }) => {
  // City Days Management State
  const [cityDaysData, setCityDaysData] = useState<CityDayData[]>([]);
  const [editingCityDay, setEditingCityDay] = useState<string | null>(null);
  const [editCityDayData, setEditCityDayData] = useState<{ days: string[] }>({ days: [] });
  const [newCityDay, setNewCityDay] = useState({ city_name: '', days: [] as string[] });
  const [showAddCityDayForm, setShowAddCityDayForm] = useState(false);

  // Blocked Dates Management State
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [editingBlockedDate, setEditingBlockedDate] = useState<string | null>(null);
  const [editBlockedDateData, setEditBlockedDateData] = useState<Partial<BlockedDate>>({});
  const [newBlockedDate, setNewBlockedDate] = useState({
    date: '',
    cities: [] as string[],
    reason: '',
    is_full_day: true,
  });
  const [showAddBlockedDateForm, setShowAddBlockedDateForm] = useState(false);

  // Blocked Time Slots Management State
  const [blockedTimeSlots, setBlockedTimeSlots] = useState<BlockedTimeSlot[]>([]);
  const [editingBlockedTimeSlot, setEditingBlockedTimeSlot] = useState<string | null>(null);
  const [editBlockedTimeSlotData, setEditBlockedTimeSlotData] = useState<Partial<BlockedTimeSlot>>({});
  const [newBlockedTimeSlot, setNewBlockedTimeSlot] = useState({
    date: '',
    start_time: '09:00',
    end_time: '17:00',
    cities: [] as string[],
    reason: '',
  });
  const [showAddBlockedTimeSlotForm, setShowAddBlockedTimeSlotForm] = useState(false);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Load all data
  useEffect(() => {
    loadCityDaysData();
    loadBlockedDates();
    loadBlockedTimeSlots();
  }, []);

  // ========== CITY DAYS MANAGEMENT ==========

  const loadCityDaysData = async () => {
    try {
      const { data, error } = await supabase
        .from('city_day_data')
        .select('*')
        .order('city_name');

      if (error) throw error;
      setCityDaysData(data || []);
    } catch (error) {
      console.error('Error loading city days data:', error);
      toast.error('Failed to load city days data');
    }
  };

  const handleAddCityDay = async () => {
    if (!newCityDay.city_name || newCityDay.days.length === 0) {
      toast.error('Please select a city and at least one day');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('city_day_data')
        .insert([{ city_name: newCityDay.city_name, days: newCityDay.days }])
        .select()
        .single();

      if (error) throw error;

      setCityDaysData([...cityDaysData, data]);
      setNewCityDay({ city_name: '', days: [] });
      setShowAddCityDayForm(false);
      toast.success('City day configuration added successfully');
    } catch (error: any) {
      console.error('Error adding city day:', error);
      toast.error(error.message || 'Failed to add city day configuration');
    }
  };

  const handleUpdateCityDay = async (cityName: string) => {
    if (editCityDayData.days && editCityDayData.days.length === 0) {
      toast.error('Please select at least one day');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('city_day_data')
        .update({ days: editCityDayData.days })
        .eq('city_name', cityName)
        .select()
        .single();

      if (error) throw error;

      setCityDaysData(cityDaysData.map(cd => (cd.city_name === cityName ? data : cd)));
      setEditingCityDay(null);
      setEditCityDayData({ days: [] });
      toast.success('City day configuration updated successfully');
    } catch (error: any) {
      console.error('Error updating city day:', error);
      toast.error(error.message || 'Failed to update city day configuration');
    }
  };

  const handleDeleteCityDay = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this city day configuration?')) return;

    try {
      const { error } = await supabase.from('city_day_data').delete().eq('id', id);

      if (error) throw error;

      setCityDaysData(cityDaysData.filter(cd => cd.id !== id));
      toast.success('City day configuration deleted successfully');
    } catch (error: any) {
      console.error('Error deleting city day:', error);
      toast.error(error.message || 'Failed to delete city day configuration');
    }
  };

  const toggleCityDaySelection = (day: string, isEdit: boolean) => {
    if (isEdit) {
      const currentDays = editCityDayData.days || [];
      if (currentDays.includes(day)) {
        setEditCityDayData({ ...editCityDayData, days: currentDays.filter(d => d !== day) });
      } else {
        setEditCityDayData({ ...editCityDayData, days: [...currentDays, day] });
      }
    } else {
      if (newCityDay.days.includes(day)) {
        setNewCityDay({ ...newCityDay, days: newCityDay.days.filter(d => d !== day) });
      } else {
        setNewCityDay({ ...newCityDay, days: [...newCityDay.days, day] });
      }
    }
  };

  // ========== BLOCKED DATES MANAGEMENT ==========

  const loadBlockedDates = async () => {
    try {
      const dates = await fetchBlockedDates();
      setBlockedDates(dates);
    } catch (error) {
      console.error('Error loading blocked dates:', error);
      toast.error('Failed to load blocked dates');
    }
  };

  const handleAddBlockedDate = async () => {
    if (!newBlockedDate.date) {
      toast.error('Please select a date');
      return;
    }

    try {
      const created = await createBlockedDate(newBlockedDate);
      setBlockedDates([...blockedDates, created]);
      setNewBlockedDate({ date: '', cities: [], reason: '', is_full_day: true });
      setShowAddBlockedDateForm(false);
      toast.success('Blocked date added successfully');
    } catch (error: any) {
      console.error('Error adding blocked date:', error);
      toast.error(error.message || 'Failed to add blocked date');
    }
  };

  const handleUpdateBlockedDate = async (id: string) => {
    try {
      const updated = await updateBlockedDate(id, editBlockedDateData);
      setBlockedDates(blockedDates.map(bd => (bd.id === id ? updated : bd)));
      setEditingBlockedDate(null);
      setEditBlockedDateData({});
      toast.success('Blocked date updated successfully');
    } catch (error: any) {
      console.error('Error updating blocked date:', error);
      toast.error(error.message || 'Failed to update blocked date');
    }
  };

  const handleDeleteBlockedDate = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this blocked date?')) return;

    try {
      await deleteBlockedDate(id);
      setBlockedDates(blockedDates.filter(bd => bd.id !== id));
      toast.success('Blocked date deleted successfully');
    } catch (error: any) {
      console.error('Error deleting blocked date:', error);
      toast.error(error.message || 'Failed to delete blocked date');
    }
  };

  const toggleBlockedDateCity = (city: string, isEdit: boolean) => {
    if (isEdit) {
      const currentCities = editBlockedDateData.cities || [];
      if (currentCities.includes(city)) {
        setEditBlockedDateData({ ...editBlockedDateData, cities: currentCities.filter(c => c !== city) });
      } else {
        setEditBlockedDateData({ ...editBlockedDateData, cities: [...currentCities, city] });
      }
    } else {
      if (newBlockedDate.cities.includes(city)) {
        setNewBlockedDate({ ...newBlockedDate, cities: newBlockedDate.cities.filter(c => c !== city) });
      } else {
        setNewBlockedDate({ ...newBlockedDate, cities: [...newBlockedDate.cities, city] });
      }
    }
  };

  // ========== BLOCKED TIME SLOTS MANAGEMENT ==========

  const loadBlockedTimeSlots = async () => {
    try {
      const slots = await fetchBlockedTimeSlots();
      setBlockedTimeSlots(slots);
    } catch (error) {
      console.error('Error loading blocked time slots:', error);
      toast.error('Failed to load blocked time slots');
    }
  };

  const handleAddBlockedTimeSlot = async () => {
    if (!newBlockedTimeSlot.date || !newBlockedTimeSlot.start_time || !newBlockedTimeSlot.end_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (newBlockedTimeSlot.start_time >= newBlockedTimeSlot.end_time) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      const created = await createBlockedTimeSlot(newBlockedTimeSlot);
      setBlockedTimeSlots([...blockedTimeSlots, created]);
      setNewBlockedTimeSlot({ date: '', start_time: '09:00', end_time: '17:00', cities: [], reason: '' });
      setShowAddBlockedTimeSlotForm(false);
      toast.success('Blocked time slot added successfully');
    } catch (error: any) {
      console.error('Error adding blocked time slot:', error);
      toast.error(error.message || 'Failed to add blocked time slot');
    }
  };

  const handleUpdateBlockedTimeSlot = async (id: string) => {
    try {
      const updated = await updateBlockedTimeSlot(id, editBlockedTimeSlotData);
      setBlockedTimeSlots(blockedTimeSlots.map(bts => (bts.id === id ? updated : bts)));
      setEditingBlockedTimeSlot(null);
      setEditBlockedTimeSlotData({});
      toast.success('Blocked time slot updated successfully');
    } catch (error: any) {
      console.error('Error updating blocked time slot:', error);
      toast.error(error.message || 'Failed to update blocked time slot');
    }
  };

  const handleDeleteBlockedTimeSlot = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this blocked time slot?')) return;

    try {
      await deleteBlockedTimeSlot(id);
      setBlockedTimeSlots(blockedTimeSlots.filter(bts => bts.id !== id));
      toast.success('Blocked time slot deleted successfully');
    } catch (error: any) {
      console.error('Error deleting blocked time slot:', error);
      toast.error(error.message || 'Failed to delete blocked time slot');
    }
  };

  const toggleBlockedTimeSlotCity = (city: string, isEdit: boolean) => {
    if (isEdit) {
      const currentCities = editBlockedTimeSlotData.cities || [];
      if (currentCities.includes(city)) {
        setEditBlockedTimeSlotData({ ...editBlockedTimeSlotData, cities: currentCities.filter(c => c !== city) });
      } else {
        setEditBlockedTimeSlotData({ ...editBlockedTimeSlotData, cities: [...currentCities, city] });
      }
    } else {
      if (newBlockedTimeSlot.cities.includes(city)) {
        setNewBlockedTimeSlot({ ...newBlockedTimeSlot, cities: newBlockedTimeSlot.cities.filter(c => c !== city) });
      } else {
        setNewBlockedTimeSlot({ ...newBlockedTimeSlot, cities: [...newBlockedTimeSlot.cities, city] });
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* City Days Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">City Days Configuration</h3>
            <p className="text-sm text-gray-600">Set which days have higher pricing for each city</p>
          </div>
          <button
            onClick={() => setShowAddCityDayForm(!showAddCityDayForm)}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center"
          >
            <FaPlus className="mr-2" />
            Add City Day
          </button>
        </div>

        {/* Add City Day Form */}
        {showAddCityDayForm && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-3">Add New City Day Configuration</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <select
                  value={newCityDay.city_name}
                  onChange={e => setNewCityDay({ ...newCityDay, city_name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="">Select a city</option>
                  {allCities.filter(city => !cityDaysData.find(cd => cd.city_name === city)).map(city => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">City Days (Higher Pricing)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {daysOfWeek.map(day => (
                    <label key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newCityDay.days.includes(day)}
                        onChange={() => toggleCityDaySelection(day, false)}
                        className="mr-2"
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleAddCityDay}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
                >
                  <FaSave className="mr-2" /> Save
                </button>
                <button
                  onClick={() => {
                    setShowAddCityDayForm(false);
                    setNewCityDay({ city_name: '', days: [] });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 flex items-center"
                >
                  <FaTimes className="mr-2" /> Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* City Days List */}
        <div className="space-y-2">
          {cityDaysData.map(cityDay => (
            <div key={cityDay.id} className="border border-gray-200 rounded p-3">
              {editingCityDay === cityDay.city_name ? (
                <div>
                  <h4 className="font-semibold mb-2">{cityDay.city_name}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    {daysOfWeek.map(day => (
                      <label key={day} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={(editCityDayData.days || []).includes(day)}
                          onChange={() => toggleCityDaySelection(day, true)}
                          className="mr-2"
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateCityDay(cityDay.city_name)}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm flex items-center"
                    >
                      <FaSave className="mr-1" /> Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingCityDay(null);
                        setEditCityDayData({ days: [] });
                      }}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm flex items-center"
                    >
                      <FaTimes className="mr-1" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">{cityDay.city_name}</h4>
                    <p className="text-sm text-gray-600">City Days: {cityDay.days.join(', ')}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingCityDay(cityDay.city_name);
                        setEditCityDayData({ days: cityDay.days });
                      }}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteCityDay(cityDay.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {cityDaysData.length === 0 && (
            <p className="text-gray-500 text-center py-4">No city day configurations yet</p>
          )}
        </div>
      </div>

      {/* Blocked Dates */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Blocked Dates</h3>
            <p className="text-sm text-gray-600">Block entire days from booking</p>
          </div>
          <button
            onClick={() => setShowAddBlockedDateForm(!showAddBlockedDateForm)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center"
          >
            <FaCalendarTimes className="mr-2" />
            Block Date
          </button>
        </div>

        {/* Add Blocked Date Form */}
        {showAddBlockedDateForm && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-3">Block a New Date</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={newBlockedDate.date}
                  onChange={e => setNewBlockedDate({ ...newBlockedDate, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason (Optional)</label>
                <input
                  type="text"
                  value={newBlockedDate.reason}
                  onChange={e => setNewBlockedDate({ ...newBlockedDate, reason: e.target.value })}
                  placeholder="e.g., Holiday, Maintenance"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Affected Cities (Leave empty to block all cities)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                  {allCities.map(city => (
                    <label key={city} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newBlockedDate.cities.includes(city)}
                        onChange={() => toggleBlockedDateCity(city, false)}
                        className="mr-2"
                      />
                      {city}
                    </label>
                  ))}
                </div>
                {newBlockedDate.cities.length === 0 && (
                  <p className="text-sm text-orange-600 mt-1">⚠️ All cities will be blocked</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleAddBlockedDate}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
                >
                  <FaSave className="mr-2" /> Save
                </button>
                <button
                  onClick={() => {
                    setShowAddBlockedDateForm(false);
                    setNewBlockedDate({ date: '', cities: [], reason: '', is_full_day: true });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 flex items-center"
                >
                  <FaTimes className="mr-2" /> Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Blocked Dates List */}
        <div className="space-y-2">
          {blockedDates
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(blockedDate => (
              <div key={blockedDate.id} className="border border-gray-200 rounded p-3 bg-red-50">
                {editingBlockedDate === blockedDate.id ? (
                  <div>
                    <div className="grid grid-cols-1 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <input
                          type="date"
                          value={editBlockedDateData.date || blockedDate.date}
                          onChange={e => setEditBlockedDateData({ ...editBlockedDateData, date: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Reason</label>
                        <input
                          type="text"
                          value={editBlockedDateData.reason ?? blockedDate.reason}
                          onChange={e => setEditBlockedDateData({ ...editBlockedDateData, reason: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Affected Cities</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                          {allCities.map(city => (
                            <label key={city} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={(editBlockedDateData.cities || blockedDate.cities).includes(city)}
                                onChange={() => toggleBlockedDateCity(city, true)}
                                className="mr-2"
                              />
                              {city}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateBlockedDate(blockedDate.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm flex items-center"
                      >
                        <FaSave className="mr-1" /> Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingBlockedDate(null);
                          setEditBlockedDateData({});
                        }}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm flex items-center"
                      >
                        <FaTimes className="mr-1" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">
                        {format(new Date(blockedDate.date), 'EEEE, MMMM d, yyyy')}
                      </h4>
                      {blockedDate.reason && <p className="text-sm text-gray-600">Reason: {blockedDate.reason}</p>}
                      <p className="text-sm text-gray-600">
                        {blockedDate.cities.length === 0
                          ? 'All cities blocked'
                          : `Cities: ${blockedDate.cities.join(', ')}`}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingBlockedDate(blockedDate.id);
                          setEditBlockedDateData({
                            date: blockedDate.date,
                            cities: blockedDate.cities,
                            reason: blockedDate.reason,
                          });
                        }}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteBlockedDate(blockedDate.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          {blockedDates.length === 0 && (
            <p className="text-gray-500 text-center py-4">No blocked dates</p>
          )}
        </div>
      </div>

      {/* Blocked Time Slots */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Blocked Time Slots</h3>
            <p className="text-sm text-gray-600">Block specific time periods from booking</p>
          </div>
          <button
            onClick={() => setShowAddBlockedTimeSlotForm(!showAddBlockedTimeSlotForm)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center"
          >
            <FaClock className="mr-2" />
            Block Time
          </button>
        </div>

        {/* Add Blocked Time Slot Form */}
        {showAddBlockedTimeSlotForm && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-3">Block a Time Slot</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={newBlockedTimeSlot.date}
                  onChange={e => setNewBlockedTimeSlot({ ...newBlockedTimeSlot, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason (Optional)</label>
                <input
                  type="text"
                  value={newBlockedTimeSlot.reason}
                  onChange={e => setNewBlockedTimeSlot({ ...newBlockedTimeSlot, reason: e.target.value })}
                  placeholder="e.g., Maintenance"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input
                  type="time"
                  value={newBlockedTimeSlot.start_time}
                  onChange={e => setNewBlockedTimeSlot({ ...newBlockedTimeSlot, start_time: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <input
                  type="time"
                  value={newBlockedTimeSlot.end_time}
                  onChange={e => setNewBlockedTimeSlot({ ...newBlockedTimeSlot, end_time: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Affected Cities (Leave empty to block all cities)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                  {allCities.map(city => (
                    <label key={city} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newBlockedTimeSlot.cities.includes(city)}
                        onChange={() => toggleBlockedTimeSlotCity(city, false)}
                        className="mr-2"
                      />
                      {city}
                    </label>
                  ))}
                </div>
                {newBlockedTimeSlot.cities.length === 0 && (
                  <p className="text-sm text-orange-600 mt-1">⚠️ All cities will be blocked</p>
                )}
              </div>
              <div className="md:col-span-2 flex space-x-2">
                <button
                  onClick={handleAddBlockedTimeSlot}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
                >
                  <FaSave className="mr-2" /> Save
                </button>
                <button
                  onClick={() => {
                    setShowAddBlockedTimeSlotForm(false);
                    setNewBlockedTimeSlot({ date: '', start_time: '09:00', end_time: '17:00', cities: [], reason: '' });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 flex items-center"
                >
                  <FaTimes className="mr-2" /> Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Blocked Time Slots List */}
        <div className="space-y-2">
          {blockedTimeSlots
            .sort((a, b) => {
              const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
              if (dateCompare !== 0) return dateCompare;
              return a.start_time.localeCompare(b.start_time);
            })
            .map(slot => (
              <div key={slot.id} className="border border-gray-200 rounded p-3 bg-yellow-50">
                {editingBlockedTimeSlot === slot.id ? (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <input
                          type="date"
                          value={editBlockedTimeSlotData.date || slot.date}
                          onChange={e => setEditBlockedTimeSlotData({ ...editBlockedTimeSlotData, date: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Reason</label>
                        <input
                          type="text"
                          value={editBlockedTimeSlotData.reason ?? slot.reason}
                          onChange={e => setEditBlockedTimeSlotData({ ...editBlockedTimeSlotData, reason: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Start Time</label>
                        <input
                          type="time"
                          value={editBlockedTimeSlotData.start_time || slot.start_time}
                          onChange={e => setEditBlockedTimeSlotData({ ...editBlockedTimeSlotData, start_time: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">End Time</label>
                        <input
                          type="time"
                          value={editBlockedTimeSlotData.end_time || slot.end_time}
                          onChange={e => setEditBlockedTimeSlotData({ ...editBlockedTimeSlotData, end_time: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Affected Cities</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                          {allCities.map(city => (
                            <label key={city} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={(editBlockedTimeSlotData.cities || slot.cities).includes(city)}
                                onChange={() => toggleBlockedTimeSlotCity(city, true)}
                                className="mr-2"
                              />
                              {city}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateBlockedTimeSlot(slot.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm flex items-center"
                      >
                        <FaSave className="mr-1" /> Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingBlockedTimeSlot(null);
                          setEditBlockedTimeSlotData({});
                        }}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm flex items-center"
                      >
                        <FaTimes className="mr-1" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">
                        {format(new Date(slot.date), 'EEEE, MMMM d, yyyy')} • {slot.start_time} - {slot.end_time}
                      </h4>
                      {slot.reason && <p className="text-sm text-gray-600">Reason: {slot.reason}</p>}
                      <p className="text-sm text-gray-600">
                        {slot.cities.length === 0 ? 'All cities blocked' : `Cities: ${slot.cities.join(', ')}`}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingBlockedTimeSlot(slot.id);
                          setEditBlockedTimeSlotData({
                            date: slot.date,
                            start_time: slot.start_time,
                            end_time: slot.end_time,
                            cities: slot.cities,
                            reason: slot.reason,
                          });
                        }}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteBlockedTimeSlot(slot.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          {blockedTimeSlots.length === 0 && (
            <p className="text-gray-500 text-center py-4">No blocked time slots</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarSettingsSection;


