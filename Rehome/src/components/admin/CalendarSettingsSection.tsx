import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaSave, FaTimes, FaCalendarTimes } from 'react-icons/fa';

import { format } from 'date-fns';
import { toast } from 'react-toastify';
import {
  BlockedDate,
  fetchBlockedDates,
  createBlockedDate,
  updateBlockedDate,
  deleteBlockedDate,
} from '../../services/blockedDatesService';

interface CalendarSettingsSectionProps {
  allCities: string[];
}

const CalendarSettingsSection: React.FC<CalendarSettingsSectionProps> = ({ allCities }) => {
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

  // Load all data
  useEffect(() => {
    loadBlockedDates();
  }, []);

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

  return (
    <div className="space-y-8">
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

    </div>
  );
};

export default CalendarSettingsSection;

