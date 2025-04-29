import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBox, FaCalendarAlt, FaPlus, FaSearch, FaTruck, FaTrash, FaEdit } from 'react-icons/fa';
import { format, addDays } from 'date-fns';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../../services/state/useUserSessionStore';

// Furniture item interface
interface FurnitureItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string[];
  created_at: string;
  city_name: string;
  sold: boolean;
}

// Transportation request interface
interface TransportRequest {
  id: string;
  created_at: string;
  customer_email: string;
  customer_name: string;
  city: string;
  date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

// City schedule interface
interface CitySchedule {
  id: string;
  date: string;
  city: string;
  timeSlots: {
    start: string;
    end: string;
    city: string;
  }[];
}

// List of admin email addresses - keep in sync with AdminRoute.tsx
const ADMIN_EMAILS = [
  'muhammadibnerafiq@gmail.com',
  // Add other admin emails here
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'furniture' | 'transport' | 'schedule'>('furniture');
  const [furnitureItems, setFurnitureItems] = useState<FurnitureItem[]>([]);
  const [transportRequests, setTransportRequests] = useState<TransportRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [citySchedule, setCitySchedule] = useState<CitySchedule[]>([]);
  const [newTimeSlot, setNewTimeSlot] = useState({ start: '08:00', end: '15:00', city: 'Rotterdam' });
  const [editingItem, setEditingItem] = useState<FurnitureItem | null>(null);
  const [editedPrice, setEditedPrice] = useState<number>(0);
  
  const user = useUserStore((state) => state.user);
  
  // Load data on initial render - AdminRoute handles access control
  useEffect(() => {
    fetchData();
  }, []);
  
  // Fetch all necessary data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchFurnitureItems(),
        fetchTransportRequests(),
        fetchSchedule()
      ]);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch furniture items
  const fetchFurnitureItems = async () => {
    // Simulated data for now - would connect to Supabase in production
    setFurnitureItems([
      {
        id: '1',
        name: 'Modern Sofa',
        description: 'Comfortable 3-seater sofa in gray',
        price: 599,
        image_url: ['/furniture/sofa1.jpg'],
        created_at: '2023-05-15',
        city_name: 'Amsterdam',
        sold: false
      },
      {
        id: '2',
        name: 'Coffee Table',
        description: 'Wooden coffee table with glass top',
        price: 249,
        image_url: ['/furniture/table1.jpg'],
        created_at: '2023-05-20',
        city_name: 'Rotterdam',
        sold: false
      },
      {
        id: '3',
        name: 'Dining Chair Set',
        description: 'Set of 4 dining chairs',
        price: 399,
        image_url: ['/furniture/chairs1.jpg'],
        created_at: '2023-05-25',
        city_name: 'Utrecht',
        sold: true
      }
    ]);
  };
  
  // Fetch transport requests
  const fetchTransportRequests = async () => {
    // Simulated data for now - would connect to Supabase in production
    setTransportRequests([
      {
        id: '1',
        created_at: '2023-06-01',
        customer_email: 'john.doe@example.com',
        customer_name: 'John Doe',
        city: 'Amsterdam',
        date: '2023-06-10',
        status: 'pending'
      },
      {
        id: '2',
        created_at: '2023-06-02',
        customer_email: 'jane.smith@example.com',
        customer_name: 'Jane Smith',
        city: 'Rotterdam',
        date: '2023-06-12',
        status: 'confirmed'
      },
      {
        id: '3',
        created_at: '2023-06-03',
        customer_email: 'bob.johnson@example.com',
        customer_name: 'Bob Johnson',
        city: 'Utrecht',
        date: '2023-06-15',
        status: 'completed'
      }
    ]);
  };
  
  // Fetch schedule
  const fetchSchedule = async () => {
    // Simulated data for now - would connect to Supabase in production
    const today = new Date();
    setCitySchedule([
      {
        id: '1',
        date: format(today, 'yyyy-MM-dd'),
        city: 'Rotterdam',
        timeSlots: [
          { start: '08:00', end: '15:00', city: 'Rotterdam' }
        ]
      },
      {
        id: '2',
        date: format(addDays(today, 1), 'yyyy-MM-dd'),
        city: 'Amsterdam',
        timeSlots: [
          { start: '09:00', end: '17:00', city: 'Amsterdam' }
        ]
      },
      {
        id: '3',
        date: format(addDays(today, 2), 'yyyy-MM-dd'),
        city: 'Utrecht',
        timeSlots: [
          { start: '10:00', end: '14:00', city: 'Utrecht' },
          { start: '15:00', end: '19:00', city: 'Delft' }
        ]
      }
    ]);
  };
  
  // Update furniture item price
  const updateFurniturePrice = async (id: string, newPrice: number) => {
    try {
      // In production, this would be a Supabase update
      const updatedItems = furnitureItems.map(item => 
        item.id === id ? { ...item, price: newPrice } : item
      );
      setFurnitureItems(updatedItems);
      toast.success('Price updated successfully');
      setEditingItem(null);
    } catch (err) {
      toast.error('Failed to update price');
      console.error(err);
    }
  };
  
  // Add city schedule
  const addCityToSchedule = async () => {
    try {
      // In production, this would be a Supabase insert
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const existingScheduleIndex = citySchedule.findIndex(s => s.date === dateStr);
      
      if (existingScheduleIndex >= 0) {
        // Add to existing date
        const updatedSchedule = [...citySchedule];
        updatedSchedule[existingScheduleIndex].timeSlots.push({
          ...newTimeSlot
        });
        setCitySchedule(updatedSchedule);
      } else {
        // Create new date entry
        setCitySchedule([
          ...citySchedule,
          {
            id: `new-${Date.now()}`,
            date: dateStr,
            city: newTimeSlot.city,
            timeSlots: [{ ...newTimeSlot }]
          }
        ]);
      }
      
      toast.success('Schedule updated successfully');
      
      // Reset the form
      setNewTimeSlot({ start: '08:00', end: '15:00', city: 'Rotterdam' });
    } catch (err) {
      toast.error('Failed to update schedule');
      console.error(err);
    }
  };
  
  // Remove time slot from schedule
  const removeTimeSlot = (dateStr: string, index: number) => {
    try {
      const scheduleIndex = citySchedule.findIndex(s => s.date === dateStr);
      if (scheduleIndex >= 0) {
        const updatedSchedule = [...citySchedule];
        updatedSchedule[scheduleIndex].timeSlots.splice(index, 1);
        
        // If no more time slots, remove the entire day
        if (updatedSchedule[scheduleIndex].timeSlots.length === 0) {
          updatedSchedule.splice(scheduleIndex, 1);
        }
        
        setCitySchedule(updatedSchedule);
        toast.success('Schedule updated successfully');
      }
    } catch (err) {
      toast.error('Failed to update schedule');
      console.error(err);
    }
  };
  
  // Filter furniture items based on search
  const filteredFurnitureItems = furnitureItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.city_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Filter transport requests based on search
  const filteredTransportRequests = transportRequests.filter(request => 
    request.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.city.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get schedule for selected date
  const selectedDateSchedule = citySchedule.find(s => s.date === format(selectedDate, 'yyyy-MM-dd'));

  // List of cities
  const cities = ['Amsterdam', 'Rotterdam', 'Utrecht', 'Delft', 'Den Haag', 'Eindhoven', 'Groningen'];
  
  return (
    <div className="min-h-screen bg-orange-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage furniture inventory and transportation services</p>
        </motion.div>
        
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('furniture')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === 'furniture'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaBox className="inline-block mr-2" />
                Furniture Management
              </button>
              <button
                onClick={() => setActiveTab('transport')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === 'transport'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaTruck className="inline-block mr-2" />
                Transportation Requests
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === 'schedule'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaCalendarAlt className="inline-block mr-2" />
                Schedule Management
              </button>
            </nav>
          </div>
          
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>{error}</p>
              </div>
            ) : (
              <>
                {/* Furniture Management Tab */}
                {activeTab === 'furniture' && (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (€)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredFurnitureItems.map((item) => (
                            <tr key={item.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 flex-shrink-0 mr-3">
                                    <img className="h-10 w-10 rounded-full object-cover" src={item.image_url[0] || '/placeholder.jpg'} alt="" />
                                  </div>
                                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.description}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {editingItem?.id === item.id ? (
                                  <div className="flex items-center">
                                    <input
                                      type="number"
                                      value={editedPrice}
                                      onChange={(e) => setEditedPrice(Number(e.target.value))}
                                      className="w-24 border border-gray-300 rounded-md p-1 mr-2"
                                    />
                                    <button
                                      onClick={() => updateFurniturePrice(item.id, editedPrice)}
                                      className="text-green-600 hover:text-green-900 mr-2"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingItem(null)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <>€{item.price.toFixed(2)}</>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.city_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  item.sold
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {item.sold ? 'Sold' : 'Available'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => {
                                    setEditingItem(item);
                                    setEditedPrice(item.price);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                                >
                                  <FaEdit /> Edit Price
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filteredFurnitureItems.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-gray-500">No furniture items found</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Transportation Requests Tab */}
                {activeTab === 'transport' && (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredTransportRequests.map((request) => (
                            <tr key={request.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{request.customer_name}</div>
                                <div className="text-sm text-gray-500">{request.customer_email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.city}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.date}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  request.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : request.status === 'confirmed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : request.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.created_at}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filteredTransportRequests.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-gray-500">No transportation requests found</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Schedule Management Tab */}
                {activeTab === 'schedule' && (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Calendar */}
                      <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">Schedule Calendar</h3>
                        
                        {/* Date Navigation */}
                        <div className="flex justify-between items-center mb-4">
                          <button
                            onClick={() => setSelectedDate(prev => addDays(prev, -1))}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                          >
                            Previous Day
                          </button>
                          <div className="text-lg font-semibold">
                            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                          </div>
                          <button
                            onClick={() => setSelectedDate(prev => addDays(prev, 1))}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                          >
                            Next Day
                          </button>
                        </div>
                        
                        {/* Schedule List */}
                        <div className="mt-6">
                          <h4 className="text-md font-medium mb-2">Scheduled Cities:</h4>
                          {selectedDateSchedule ? (
                            <div>
                              {selectedDateSchedule.timeSlots.map((slot, index) => (
                                <div key={index} className="flex items-center justify-between mb-2 p-3 bg-orange-50 rounded-md">
                                  <div>
                                    <span className="font-medium">{slot.city}</span>
                                    <span className="text-gray-600 ml-2">
                                      {slot.start} - {slot.end}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => removeTimeSlot(selectedDateSchedule.date, index)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-gray-500 italic">No cities scheduled for this day</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Add Schedule Form */}
                      <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">Add City to Schedule</h3>
                        <form onSubmit={(e) => { e.preventDefault(); addCityToSchedule(); }}>
                          <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                              City
                            </label>
                            <select
                              value={newTimeSlot.city}
                              onChange={(e) => setNewTimeSlot({...newTimeSlot, city: e.target.value})}
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            >
                              {cities.map(city => (
                                <option key={city} value={city}>{city}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                              Start Time
                            </label>
                            <input
                              type="time"
                              value={newTimeSlot.start}
                              onChange={(e) => setNewTimeSlot({...newTimeSlot, start: e.target.value})}
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            />
                          </div>
                          
                          <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                              End Time
                            </label>
                            <input
                              type="time"
                              value={newTimeSlot.end}
                              onChange={(e) => setNewTimeSlot({...newTimeSlot, end: e.target.value})}
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <button
                              type="submit"
                              className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                            >
                              <FaPlus className="inline-block mr-2" />
                              Add to Schedule
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                    
                    {/* Schedule Overview */}
                    <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold mb-4">Schedule Overview</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cities</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Slots</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {citySchedule.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((schedule) => (
                              <tr key={schedule.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{schedule.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {schedule.timeSlots.map(slot => slot.city).join(', ')}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                  {schedule.timeSlots.map((slot, index) => (
                                    <div key={index} className="mb-1">
                                      {slot.city}: {slot.start} - {slot.end}
                                    </div>
                                  ))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {citySchedule.length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-gray-500">No schedules found</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 