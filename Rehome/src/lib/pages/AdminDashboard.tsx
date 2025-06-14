import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBox, FaCalendarAlt, FaPlus, FaSearch, FaTruck, FaTrash, FaEdit, FaCog, FaSave, FaTimes, FaEye, FaEyeSlash, FaGavel } from 'react-icons/fa';
import { format, addDays } from 'date-fns';
import { toast } from 'react-toastify';
import { cityBaseCharges } from '../constants';
import { PricingConfig, CityBasePrice, CreatePricingConfigRequest } from '../../types/pricing';
import { pricingAdminService } from '../../services/pricingAdminService';
import BiddingManagement from '../../components/admin/BiddingManagement';

// Furniture item interface
interface FurnitureItem {
  id: string;
  name: string;
  description: string;
  price: number;
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

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'transport' | 'schedule' | 'pricing' | 'items' | 'bidding'>('marketplace');
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
  
  // Pricing management state
  const [pricingConfigs, setPricingConfigs] = useState<PricingConfig[]>([]);
  const [cityPrices, setCityPrices] = useState<CityBasePrice[]>([]);
  // const [setPricingMultipliers] = useState<PricingMultiplier[]>([]);
  const [editingPricingConfig, setEditingPricingConfig] = useState<string | null>(null);
  const [editingCityPrice, setEditingCityPrice] = useState<string | null>(null);
  // const [editingMultiplier, setEditingMultiplier] = useState<string | null>(null);
  const [newPricingConfig, setNewPricingConfig] = useState<CreatePricingConfigRequest>({
    type: 'base_price',
    category: 'house_moving',
    name: '',
    description: '',
    value: 0,
    unit: '€',
    active: true
  });
  const [showAddPricingForm, setShowAddPricingForm] = useState(false);
  
  // Furniture items management state
  const [furnitureItemsData, setFurnitureItemsData] = useState<any[]>([]);
  const [editingFurnitureItem, setEditingFurnitureItem] = useState<string | null>(null);
  const [newFurnitureItem, setNewFurnitureItem] = useState({
    name: '',
    category: 'Bedroom',
    points: 0
  });
  const [showAddFurnitureForm, setShowAddFurnitureForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPricingCategory, setSelectedPricingCategory] = useState<string>('all');
  
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
        fetchSchedule(),
        fetchPricingData(),
        fetchFurnitureItemsData()
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
        created_at: '2023-05-15',
        city_name: 'Amsterdam',
        sold: false
      },
      {
        id: '2',
        name: 'Coffee Table',
        description: 'Wooden coffee table with glass top',
        price: 249,
        created_at: '2023-05-20',
        city_name: 'Rotterdam',
        sold: false
      },
      {
        id: '3',
        name: 'Dining Chair Set',
        description: 'Set of 4 dining chairs',
        price: 399,
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
  
  // Fetch pricing data
  const fetchPricingData = async () => {
    try {
      const [configs, cities] = await Promise.all([
        pricingAdminService.getPricingConfigs(),
        pricingAdminService.getCityBasePrices(),
        pricingAdminService.getPricingMultipliers()
      ]);
      
      setPricingConfigs(configs);
      setCityPrices(cities);
      // setPricingMultipliers(multipliers);
    } catch (error) {
      console.error('Error fetching pricing data:', error);
    }
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

  // Fetch furniture items data for management
  const fetchFurnitureItemsData = async () => {
    try {
      const items = await pricingAdminService.getFurnitureItems();
      setFurnitureItemsData(items);
    } catch (error) {
      console.error('Error fetching furniture items:', error);
    }
  };

  // Create new furniture item
  const createFurnitureItem = async () => {
    try {
      const response = await pricingAdminService.createFurnitureItem(newFurnitureItem);
      if (response.success) {
        toast.success('Furniture item created successfully!');
        setNewFurnitureItem({ name: '', category: 'Bedroom', points: 0 });
        setShowAddFurnitureForm(false);
        await fetchFurnitureItemsData();
      } else {
        toast.error(response.error || 'Failed to create furniture item');
      }
    } catch (error) {
      toast.error('Failed to create furniture item');
      console.error(error);
    }
  };
  
  // Update furniture item
  const updateFurnitureItem = async (id: string, updates: any) => {
    try {
      const response = await pricingAdminService.updateFurnitureItem(id, updates);
      if (response.success) {
        toast.success('Furniture item updated successfully!');
        setEditingFurnitureItem(null);
        await fetchFurnitureItemsData();
      } else {
        toast.error(response.error || 'Failed to update furniture item');
      }
    } catch (error) {
      toast.error('Failed to update furniture item');
      console.error(error);
    }
  };
  
  // Delete furniture item
  const deleteFurnitureItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this furniture item?')) {
      return;
    }
    
    try {
      const response = await pricingAdminService.deleteFurnitureItem(id);
      if (response.success) {
        toast.success('Furniture item deleted successfully!');
        await fetchFurnitureItemsData();
      } else {
        toast.error(response.error || 'Failed to delete furniture item');
      }
    } catch (error) {
      toast.error('Failed to delete furniture item');
      console.error(error);
    }
  };

  // Update furniture price
  const updateFurniturePrice = async (id: string, newPrice: number) => {
    try {
      // Update price in database (would be actual API call)
      const updatedItems = furnitureItems.map(item => 
        item.id === id ? { ...item, price: newPrice } : item
      );
      setFurnitureItems(updatedItems);
      toast.success('Price updated successfully!');
      setEditingItem(null);
    } catch (error) {
      toast.error('Failed to update price');
      console.error(error);
    }
  };

  // Add city to schedule
  const addCityToSchedule = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const existingSchedule = citySchedule.find(schedule => schedule.date === dateStr);
      
      if (existingSchedule) {
        // Add to existing schedule
        const updatedSchedule = citySchedule.map(schedule => 
          schedule.date === dateStr 
            ? { ...schedule, timeSlots: [...schedule.timeSlots, newTimeSlot] }
            : schedule
        );
        setCitySchedule(updatedSchedule);
      } else {
        // Create new schedule for the date
        const newSchedule: CitySchedule = {
          id: `schedule-${Date.now()}`,
          date: dateStr,
          city: newTimeSlot.city,
          timeSlots: [newTimeSlot]
        };
        setCitySchedule([...citySchedule, newSchedule]);
      }
      
      toast.success(`${newTimeSlot.city} scheduled for ${dateStr}`);
      setNewTimeSlot({ start: '08:00', end: '15:00', city: 'Rotterdam' });
    } catch (error) {
      toast.error('Failed to add schedule');
      console.error(error);
    }
  };

  // ================== PRICING MANAGEMENT FUNCTIONS ==================

  // Update pricing config
  const updatePricingConfig = async (id: string, updates: Partial<PricingConfig>) => {
    try {
      const result = await pricingAdminService.updatePricingConfig(id, updates);
      if (result.success) {
        setPricingConfigs(configs => 
          configs.map(config => 
            config.id === id ? { ...config, ...updates } : config
          )
        );
        setEditingPricingConfig(null);
        toast.success('Pricing configuration updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update pricing configuration');
      }
    } catch (error) {
      toast.error('Error updating pricing configuration');
      console.error(error);
    }
  };

  // Update city price
  const updateCityPrice = async (id: string, updates: Partial<CityBasePrice>) => {
    try {
      const result = await pricingAdminService.updateCityBasePrice(id, updates);
      if (result.success) {
        setCityPrices(cities => 
          cities.map(city => 
            city.id === id ? { ...city, ...updates } : city
          )
        );
        setEditingCityPrice(null);
        toast.success('City price updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update city price');
      }
    } catch (error) {
      toast.error('Error updating city price');
      console.error(error);
    }
  };

  // // Update multiplier
  // const updateMultiplier = async (id: string, updates: Partial<PricingMultiplier>) => {
  //   try {
  //     const result = await pricingAdminService.updatePricingMultiplier(id, updates);
  //     if (result.success) {
  //       setPricingMultipliers(multipliers => 
  //         multipliers.map(multiplier => 
  //           multiplier.id === id ? { ...multiplier, ...updates } : multiplier
  //         )
  //       );
  //       setEditingMultiplier(null);
  //       toast.success('Multiplier updated successfully!');
  //     } else {
  //       toast.error(result.error || 'Failed to update multiplier');
  //     }
  //   } catch (error) {
  //     toast.error('Error updating multiplier');
  //     console.error(error);
  //   }
  // };

  // Create new pricing config
  const createPricingConfig = async () => {
    try {
      const result = await pricingAdminService.createPricingConfig(newPricingConfig);
      if (result.success) {
        await fetchPricingData(); // Refresh data
        setNewPricingConfig({
          type: 'base_price',
          category: 'house_moving',
          name: '',
          description: '',
          value: 0,
          unit: '€',
          active: true
        });
        setShowAddPricingForm(false);
        toast.success('New pricing configuration created successfully!');
      } else {
        toast.error(result.error || 'Failed to create pricing configuration');
      }
    } catch (error) {
      toast.error('Error creating pricing configuration');
      console.error(error);
    }
  };

  // Delete pricing config
  const deletePricingConfig = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing configuration?')) return;
    
    try {
      const result = await pricingAdminService.deletePricingConfig(id);
      if (result.success) {
        setPricingConfigs(configs => configs.filter(config => config.id !== id));
        toast.success('Pricing configuration deleted successfully!');
      } else {
        toast.error(result.error || 'Failed to delete pricing configuration');
      }
    } catch (error) {
      toast.error('Error deleting pricing configuration');
      console.error(error);
    }
  };

  // Remove time slot
  const removeTimeSlot = (dateStr: string, index: number) => {
    const updatedSchedule = citySchedule.map(schedule => {
      if (schedule.date === dateStr) {
        const updatedTimeSlots = schedule.timeSlots.filter((_, i) => i !== index);
        return { ...schedule, timeSlots: updatedTimeSlots };
      }
      return schedule;
    }).filter(schedule => schedule.timeSlots.length > 0); // Remove empty schedules
    
    setCitySchedule(updatedSchedule);
    toast.success('Time slot removed');
  };

  // Filter functions
  const filteredFurnitureItems = furnitureItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.city_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTransportRequests = transportRequests.filter(request =>
    request.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPricingConfigs = pricingConfigs.filter(config =>
    (config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    config.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    config.category.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (selectedPricingCategory === 'all' || config.category === selectedPricingCategory)
  );

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
          <p className="mt-2 text-gray-600">Manage furniture inventory, transportation services, and pricing</p>
        </motion.div>
        
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === 'marketplace'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaBox className="inline-block mr-2" />
                Marketplace Management
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
              <button
                onClick={() => setActiveTab('pricing')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === 'pricing'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaCog className="inline-block mr-2" />
                Pricing Management
              </button>
              <button
                onClick={() => setActiveTab('items')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === 'items'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaBox className="inline-block mr-2" />
                Items Management
              </button>
              <button
                onClick={() => setActiveTab('bidding')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === 'bidding'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                              >
                  <FaGavel className="inline-block mr-2" />
                  Bidding Management
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
                {activeTab === 'marketplace' && (
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
                                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-500 max-w-xs truncate">{item.description}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {editingItem?.id === item.id ? (
                                  <input
                                    type="number"
                                    value={editedPrice}
                                    onChange={(e) => setEditedPrice(Number(e.target.value))}
                                    className="w-20 border border-gray-300 rounded-md p-1"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        updateFurniturePrice(item.id, editedPrice);
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="text-sm text-gray-900">€{item.price}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{item.city_name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  item.sold ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {item.sold ? 'Sold' : 'Available'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {editingItem?.id === item.id ? (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => updateFurniturePrice(item.id, editedPrice)}
                                      className="text-green-600 hover:text-green-900"
                                    >
                                      <FaSave />
                                    </button>
                                    <button
                                      onClick={() => setEditingItem(null)}
                                      className="text-gray-600 hover:text-gray-900"
                                    >
                                      <FaTimes />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingItem(item);
                                      setEditedPrice(item.price);
                                    }}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                      <FaEdit />
                                    </button>
                                    <button className="text-red-600 hover:text-red-900">
                                      <FaTrash />
                                  </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredTransportRequests.map((request) => (
                            <tr key={request.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{request.customer_name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{request.customer_email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{request.city}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{request.date}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  request.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                  request.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {request.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button className="text-indigo-600 hover:text-indigo-900 mr-2">
                                  <FaEdit className="inline" />
                                </button>
                                <button className="text-red-600 hover:text-red-900">
                                  <FaTrash className="inline" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Schedule Management Tab */}
                {activeTab === 'schedule' && (
                  <div className="space-y-6">
                    {/* Add New Schedule */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Add City to Schedule</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                          <input
                            type="date"
                            value={format(selectedDate, 'yyyy-MM-dd')}
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                            className="w-full border border-gray-300 rounded-md p-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                          <select
                            value={newTimeSlot.city}
                            onChange={(e) => setNewTimeSlot({ ...newTimeSlot, city: e.target.value })}
                            className="w-full border border-gray-300 rounded-md p-2"
                          >
                            {Object.keys(cityBaseCharges).map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                          <input
                            type="time"
                            value={newTimeSlot.start}
                            onChange={(e) => setNewTimeSlot({ ...newTimeSlot, start: e.target.value })}
                            className="w-full border border-gray-300 rounded-md p-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                          <input
                            type="time"
                            value={newTimeSlot.end}
                            onChange={(e) => setNewTimeSlot({ ...newTimeSlot, end: e.target.value })}
                            className="w-full border border-gray-300 rounded-md p-2"
                          />
                        </div>
                      </div>
                      <button
                        onClick={addCityToSchedule}
                        className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded"
                      >
                        <FaPlus className="inline mr-2" />
                        Add to Schedule
                      </button>
                    </div>

                    {/* Current Schedule */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Current Schedule</h3>
                      {citySchedule.length === 0 ? (
                        <p className="text-gray-500">No schedules found.</p>
                      ) : (
                        <div className="space-y-4">
                          {citySchedule.map((schedule) => (
                            <div key={schedule.id} className="bg-white border border-gray-200 rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 mb-2">{schedule.date}</h4>
                              <div className="space-y-2">
                                {schedule.timeSlots.map((slot, index) => (
                                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                    <span className="text-sm">
                                      <strong>{slot.city}</strong>: {slot.start} - {slot.end}
                                    </span>
                                    <button
                                      onClick={() => removeTimeSlot(schedule.date, index)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      <FaTrash className="text-xs" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Pricing Management Tab */}
                {activeTab === 'pricing' && (
                  <div className="space-y-8">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                      <FaCog className="inline mr-2 text-orange-500" />
                          Pricing Management
                    </h2>
                        <p className="text-gray-600 mt-1">Manage base prices, multipliers, and city-specific rates</p>
                      </div>
                      <button
                        onClick={() => setShowAddPricingForm(!showAddPricingForm)}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                      >
                        <FaPlus className="mr-2" />
                        Add New Configuration
                      </button>
                    </div>

                    {/* Add New Pricing Config Form */}
                    {showAddPricingForm && (
                      <div className="bg-gray-50 p-6 rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4">Add New Pricing Configuration</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                              value={newPricingConfig.type}
                              onChange={(e) => setNewPricingConfig({...newPricingConfig, type: e.target.value as any})}
                              className="w-full border border-gray-300 rounded-md p-2"
                            >
                              <option value="base_price">Base Price</option>
                              <option value="multiplier">Multiplier</option>
                              <option value="distance_rate">Distance Rate</option>
                              <option value="addon">Add-on</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                              value={newPricingConfig.category}
                              onChange={(e) => setNewPricingConfig({...newPricingConfig, category: e.target.value})}
                              className="w-full border border-gray-300 rounded-md p-2"
                            >
                              <option value="house_moving">House Moving</option>
                              <option value="item_transport">Item Transport</option>
                              <option value="special_request">Special Request</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                              type="text"
                              value={newPricingConfig.name}
                              onChange={(e) => setNewPricingConfig({...newPricingConfig, name: e.target.value})}
                              className="w-full border border-gray-300 rounded-md p-2"
                              placeholder="Configuration name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                              type="text"
                              value={newPricingConfig.description}
                              onChange={(e) => setNewPricingConfig({...newPricingConfig, description: e.target.value})}
                              className="w-full border border-gray-300 rounded-md p-2"
                              placeholder="Description"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                            <input
                              type="number"
                              step="0.01"
                              value={newPricingConfig.value}
                              onChange={(e) => setNewPricingConfig({...newPricingConfig, value: parseFloat(e.target.value) || 0})}
                              className="w-full border border-gray-300 rounded-md p-2"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                            <input
                              type="text"
                              value={newPricingConfig.unit}
                              onChange={(e) => setNewPricingConfig({...newPricingConfig, unit: e.target.value})}
                              className="w-full border border-gray-300 rounded-md p-2"
                              placeholder="€, %, €/km, x"
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex space-x-4">
                          <button
                            onClick={createPricingConfig}
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                          >
                            <FaSave className="inline mr-2" />
                            Save Configuration
                          </button>
                          <button
                            onClick={() => setShowAddPricingForm(false)}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                          >
                            <FaTimes className="inline mr-2" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Category Filter Section */}
                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="flex flex-wrap gap-4 items-center">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Service Category</label>
                          <select
                            value={selectedPricingCategory}
                            onChange={(e) => setSelectedPricingCategory(e.target.value)}
                            className="border border-gray-300 rounded-md p-2"
                          >
                            <option value="all">All Categories</option>
                            <option value="house_moving">House Moving</option>
                            <option value="item_transport">Item Transport</option>
                            <option value="special_request">Special Request</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Search Configurations</label>
                          <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search by name, description..."
                              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Category Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {['house_moving', 'item_transport', 'special_request'].map(category => {
                        const count = pricingConfigs.filter(config => config.category === category).length;
                        const activeCount = pricingConfigs.filter(config => config.category === category && config.active).length;
                        return (
                          <div key={category} className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-600 capitalize">
                                  {category.replace('_', ' ')}
                                </p>
                                <p className="text-2xl font-bold text-gray-900">{count}</p>
                                <p className="text-xs text-gray-500">{activeCount} active</p>
                              </div>
                              <div className={`p-3 rounded-full ${
                                category === 'house_moving' ? 'bg-blue-100' :
                                category === 'item_transport' ? 'bg-green-100' :
                                'bg-purple-100'
                              }`}>
                                <FaCog className={`h-6 w-6 ${
                                  category === 'house_moving' ? 'text-blue-600' :
                                  category === 'item_transport' ? 'text-green-600' :
                                  'text-purple-600'
                                }`} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pricing Configurations Table */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          Pricing Configurations ({filteredPricingConfigs.length} items)
                        </h3>
                        {selectedPricingCategory !== 'all' && (
                          <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-orange-100 text-orange-800">
                            Showing: {selectedPricingCategory.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredPricingConfigs.map((config) => (
                              <tr key={config.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    config.type === 'base_price' ? 'bg-blue-100 text-blue-800' :
                                    config.type === 'multiplier' ? 'bg-purple-100 text-purple-800' :
                                    config.type === 'distance_rate' ? 'bg-green-100 text-green-800' :
                                    'bg-orange-100 text-orange-800'
                                  }`}>
                                    {config.type.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {config.category.replace('_', ' ')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {editingPricingConfig === config.id ? (
                                    <input
                                      type="text"
                                      defaultValue={config.name}
                                      onBlur={(e) => updatePricingConfig(config.id, { name: e.target.value })}
                                      className="w-full border border-gray-300 rounded-md p-1 text-sm"
                                    />
                                  ) : (
                                    <div className="text-sm font-medium text-gray-900">{config.name}</div>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  {editingPricingConfig === config.id ? (
                                    <input
                                      type="text"
                                      defaultValue={config.description}
                                      onBlur={(e) => updatePricingConfig(config.id, { description: e.target.value })}
                                      className="w-full border border-gray-300 rounded-md p-1 text-sm"
                                    />
                                  ) : (
                                    <div className="text-sm text-gray-500 max-w-xs truncate">{config.description}</div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {editingPricingConfig === config.id ? (
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        step="0.01"
                                        defaultValue={config.value}
                                        onBlur={(e) => updatePricingConfig(config.id, { value: parseFloat(e.target.value) || 0 })}
                                        className="w-20 border border-gray-300 rounded-md p-1 text-sm"
                                      />
                                      <span className="text-sm text-gray-500">{config.unit}</span>
                                    </div>
                                  ) : (
                                    <div className="text-sm font-medium text-gray-900">
                                      {config.value} {config.unit}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <button
                                    onClick={() => updatePricingConfig(config.id, { active: !config.active })}
                                    className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                                      config.active 
                                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                                    }`}
                                  >
                                    {config.active ? <FaEye className="mr-1" /> : <FaEyeSlash className="mr-1" />}
                                    {config.active ? 'Active' : 'Inactive'}
                                  </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => setEditingPricingConfig(
                                        editingPricingConfig === config.id ? null : config.id
                                      )}
                                      className="text-indigo-600 hover:text-indigo-900"
                                    >
                                      <FaEdit />
                                    </button>
                                    <button
                                      onClick={() => deletePricingConfig(config.id)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* City Base Prices */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">City Base Prices ({cityPrices.length} cities)</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Price (€)</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance Rate (€/km)</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {cityPrices.map((city) => (
                              <tr key={city.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{city.city}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {editingCityPrice === city.id ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      defaultValue={city.base_price}
                                      onBlur={(e) => updateCityPrice(city.id, { base_price: parseFloat(e.target.value) || 0 })}
                                      className="w-20 border border-gray-300 rounded-md p-1 text-sm"
                                    />
                                  ) : (
                                    <div className="text-sm text-gray-900">€{city.base_price}</div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {editingCityPrice === city.id ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      defaultValue={city.distance_rate}
                                      onBlur={(e) => updateCityPrice(city.id, { distance_rate: parseFloat(e.target.value) || 0 })}
                                      className="w-20 border border-gray-300 rounded-md p-1 text-sm"
                                    />
                                  ) : (
                                    <div className="text-sm text-gray-900">€{city.distance_rate}</div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <button
                                    onClick={() => updateCityPrice(city.id, { active: !city.active })}
                                    className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                                      city.active 
                                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                                    }`}
                                  >
                                    {city.active ? <FaEye className="mr-1" /> : <FaEyeSlash className="mr-1" />}
                                    {city.active ? 'Active' : 'Inactive'}
                                  </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() => setEditingCityPrice(
                                      editingCityPrice === city.id ? null : city.id
                                    )}
                                    className="text-indigo-600 hover:text-indigo-900"
                                    title="Edit city prices"
                                  >
                                    <FaEdit />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Items Management Tab */}
                {activeTab === 'items' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-gray-900">Furniture Items Management</h2>
                      <button
                        onClick={() => setShowAddFurnitureForm(true)}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center"
                      >
                        <FaPlus className="mr-2" />
                        Add New Item
                      </button>
                    </div>

                    {/* Add New Furniture Item Form */}
                    {showAddFurnitureForm && (
                      <div className="bg-white rounded-lg shadow p-6 border">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Furniture Item</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                            <input
                              type="text"
                              value={newFurnitureItem.name}
                              onChange={(e) => setNewFurnitureItem({...newFurnitureItem, name: e.target.value})}
                              className="w-full border border-gray-300 rounded-md p-2"
                              placeholder="e.g., Queen Bed"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                            <select
                              value={newFurnitureItem.category}
                              onChange={(e) => setNewFurnitureItem({...newFurnitureItem, category: e.target.value})}
                              className="w-full border border-gray-300 rounded-md p-2"
                            >
                              <option value="Bedroom">Bedroom</option>
                              <option value="Living Room">Living Room</option>
                              <option value="Dining">Dining</option>
                              <option value="Kitchen">Kitchen</option>
                              <option value="Office">Office</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                            <input
                              type="number"
                              step="0.1"
                              value={newFurnitureItem.points}
                              onChange={(e) => setNewFurnitureItem({...newFurnitureItem, points: parseFloat(e.target.value) || 0})}
                              className="w-full border border-gray-300 rounded-md p-2"
                              placeholder="e.g., 5.5"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-4">
                          <button
                            onClick={() => setShowAddFurnitureForm(false)}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            <FaTimes className="mr-2 inline" />
                            Cancel
                          </button>
                          <button
                            onClick={createFurnitureItem}
                            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                          >
                            <FaSave className="mr-2 inline" />
                            Add Item
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="flex flex-wrap gap-4 items-center">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
                          <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="border border-gray-300 rounded-md p-2"
                          >
                            <option value="all">All Categories</option>
                            <option value="Bedroom">Bedroom</option>
                            <option value="Living Room">Living Room</option>
                            <option value="Dining">Dining</option>
                            <option value="Kitchen">Kitchen</option>
                            <option value="Office">Office</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Search Items</label>
                          <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search by name..."
                              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Furniture Items Table */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                          Furniture Items ({furnitureItemsData.filter(item => 
                            (selectedCategory === 'all' || item.category === selectedCategory) &&
                            item.name.toLowerCase().includes(searchQuery.toLowerCase())
                          ).length} items)
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {furnitureItemsData
                              .filter(item => 
                                (selectedCategory === 'all' || item.category === selectedCategory) &&
                                item.name.toLowerCase().includes(searchQuery.toLowerCase())
                              )
                              .map((item) => (
                                <tr key={item.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {editingFurnitureItem === item.id ? (
                                      <input
                                        type="text"
                                        defaultValue={item.name}
                                        onBlur={(e) => updateFurnitureItem(item.id, { name: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-1 text-sm"
                                      />
                                    ) : (
                                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {editingFurnitureItem === item.id ? (
                                      <select
                                        defaultValue={item.category}
                                        onBlur={(e) => updateFurnitureItem(item.id, { category: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-1 text-sm"
                                      >
                                        <option value="Bedroom">Bedroom</option>
                                        <option value="Living Room">Living Room</option>
                                        <option value="Dining">Dining</option>
                                        <option value="Kitchen">Kitchen</option>
                                        <option value="Office">Office</option>
                                        <option value="Other">Other</option>
                                      </select>
                                    ) : (
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        item.category === 'Bedroom' ? 'bg-blue-100 text-blue-800' :
                                        item.category === 'Living Room' ? 'bg-green-100 text-green-800' :
                                        item.category === 'Dining' ? 'bg-purple-100 text-purple-800' :
                                        item.category === 'Kitchen' ? 'bg-red-100 text-red-800' :
                                        item.category === 'Office' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {item.category}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {editingFurnitureItem === item.id ? (
                                      <input
                                        type="number"
                                        step="0.1"
                                        defaultValue={item.points}
                                        onBlur={(e) => updateFurnitureItem(item.id, { points: parseFloat(e.target.value) || 0 })}
                                        className="w-20 border border-gray-300 rounded-md p-1 text-sm"
                                      />
                                    ) : (
                                      <div className="text-sm font-medium text-gray-900">{item.points} pts</div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => setEditingFurnitureItem(
                                          editingFurnitureItem === item.id ? null : item.id
                                        )}
                                        className="text-indigo-600 hover:text-indigo-900"
                                        title="Edit item"
                                      >
                                        <FaEdit />
                                      </button>
                                      <button
                                        onClick={() => deleteFurnitureItem(item.id)}
                                        className="text-red-600 hover:text-red-900"
                                        title="Delete item"
                                      >
                                        <FaTrash />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Category Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {['Bedroom', 'Living Room', 'Dining', 'Kitchen', 'Office', 'Other'].map(category => {
                        const count = furnitureItemsData.filter(item => item.category === category).length;
                        return (
                          <div key={category} className="bg-white rounded-lg shadow p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">{count}</div>
                            <div className="text-sm text-gray-600">{category}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bidding Management Tab */}
                {activeTab === 'bidding' && (
                  <BiddingManagement />
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
