import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBox, FaCalendarAlt, FaPlus, FaSearch, FaTruck, FaTrash, FaEdit, FaCog, FaSave, FaTimes } from 'react-icons/fa';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth } from 'date-fns';
import { toast } from 'react-toastify';
import { supabase } from "../../lib/supabaseClient";
import useUserSessionStore from "../../services/state/useUserSessionStore";
import { cityBaseCharges } from "../../lib/constants";


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
  type: 'item-moving' | 'house-moving';
  // Additional fields from Supabase
  pickuptype?: string;
  furnitureitems?: any[];
  customitem?: string;
  floorpickup?: number;
  floordropoff?: number;
  firstname?: string;
  lastname?: string;
  phone?: string;
  estimatedprice?: number;
  selecteddate?: string;
  isdateflexible?: boolean;
  baseprice?: number;
  itempoints?: number;
  carryingcost?: number;
  disassemblycost?: number;
  distancecost?: number;
  extrahelpercost?: number;
  selecteddate_start?: string;
  selecteddate_end?: string;
  firstlocation?: string;
  secondlocation?: string;
  firstlocation_coords?: any;
  secondlocation_coords?: any;
  calculated_distance_km?: number;
  calculated_duration_seconds?: number;
  calculated_duration_text?: string;
  distance_provider?: string;
  disassembly?: boolean;
  elevatorpickup?: boolean;
  elevatordropoff?: boolean;
  extrahelper?: boolean;
  carryingservice?: boolean;
  isstudent?: boolean;
  studentid?: string;
  preferredtimespan?: string;
  updated_at?: string;
}



// Pricing interfaces
interface PricingConfig {
  id: string;
  type: string;
  category: string;
  name: string;
  description: string;
  value: number;
  unit: string;
  active: boolean;
  created_at: string;
}

interface CityPrice {
  id: string;
  city_name: string;
  normal: number;
  city_day: number;
  day_of_week: string;
  created_at: string;
}

interface PricingMultiplier {
  id: string;
  name: string;
  value: number;
  category: string;
  active: boolean;
  created_at: string;
}

// Marketplace interfaces
interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  status: 'available' | 'reserved' | 'sold';
  seller_email: string;
  created_at: string;
  images: string[];
}

// Calendar day interface
interface CalendarDay {
  date: Date;
  assignedCities: string[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

// Time block interface
interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  cities: string[];
  discountPercentage: number;
}

const AdminDashboard = () => {
  const { user, role } = useUserSessionStore();
  const [activeTab, setActiveTab] = useState<'marketplace' | 'transport' | 'schedule' | 'pricing' | 'items'>('transport');

  const ADMIN_EMAILS = [
    'muhammadibnerafiq123@gmail.com',
    'testnewuser12345@gmail.com',
    'egzmanagement@gmail.com',
    'samuel.stroehle8@gmail.com',
    'info@rehomebv.com'
  ];

  const isAdmin = role === 'admin' || ADMIN_EMAILS.includes(user?.email || '');
  
  if (!user || !isAdmin) {
    console.log('AdminDashboard - User not admin, showing access denied');
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-700 mb-4">
            You need admin privileges to access this dashboard.
          </p>
          <p className="text-sm text-gray-500">
            Current user: {user?.email || 'Not logged in'}
            <br />
            Current role: {role || 'No role'}
            <br />
            Is admin email: {ADMIN_EMAILS.includes(user?.email || '') ? 'Yes' : 'No'}
          </p>
        </div>
      </div>
    );
  }
  
  // State for all tabs
  const [transportRequests, setTransportRequests] = useState<TransportRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Filter states
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [priceRangeFilter, setPriceRangeFilter] = useState({
    minPrice: '',
    maxPrice: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Pricing management state
  const [pricingConfigs, setPricingConfigs] = useState<PricingConfig[]>([]);
  const [cityPrices, setCityPrices] = useState<CityPrice[]>([]);
  const [pricingMultipliers, setPricingMultipliers] = useState<PricingMultiplier[]>([]);
  
  // Marketplace management state
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  // const [editingMarketplaceItem, setEditingMarketplaceItem] = useState<string | null>(null);

  // Enhanced marketplace management state
  const [adminListings, setAdminListings] = useState<MarketplaceItem[]>([]);
  const [userListings, setUserListings] = useState<MarketplaceItem[]>([]);
  // const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  // const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [newAdminListing, setNewAdminListing] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'Living Room',
    status: 'available' as 'available' | 'reserved' | 'sold',
    images: [] as string[]
  });
  const [showAddListingForm, setShowAddListingForm] = useState(false);
  const [marketplaceTab, setMarketplaceTab] = useState<'inventory' | 'supervision' | 'sales'>('inventory');

  // Items management state
  const [furnitureItemsData, setFurnitureItemsData] = useState<any[]>([]);
  const [editingFurnitureItem, setEditingFurnitureItem] = useState<string | null>(null);
  const [editFurnitureItemData, setEditFurnitureItemData] = useState<any>({});
  const [newFurnitureItem, setNewFurnitureItem] = useState({
    name: '',
    category: 'Bedroom',
    points: 0
  });
  const [showAddFurnitureForm, setShowAddFurnitureForm] = useState(false);
  
  // State for editing
  const [editingTransportRequest, setEditingTransportRequest] = useState<string | null>(null);
  const [editTransportData, setEditTransportData] = useState<any>({});
  // const [editMarketplaceData, setEditMarketplaceData] = useState<any>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  // const [scheduleData, setScheduleData] = useState<{ [key: string]: string[] }>({});
  const [showCitySelector, setShowCitySelector] = useState(false);

  // Enhanced calendar state for time blocks
  // const [selectedDateForBlocks, setSelectedDateForBlocks] = useState<Date | null>(null);
  // const [showTimeBlockEditor, setShowTimeBlockEditor] = useState(false);
  const [timeBlocks, setTimeBlocks] = useState<{ [key: string]: TimeBlock[] }>({});
  // const [currentTimeBlock, setCurrentTimeBlock] = useState<TimeBlock>({
  //   id: '',
  //   startTime: '08:00',
  //   endTime: '15:00',
  //   cities: [],
  //   discountPercentage: 20
  // });
  // const [editingTimeBlock, setEditingTimeBlock] = useState<string | null>(null);

  // Pricing editing state  
  const [editingPricingConfig, setEditingPricingConfig] = useState<string | null>(null);
  const [editingCityPrice, setEditingCityPrice] = useState<string | null>(null);
  const [editingMultiplier, setEditingMultiplier] = useState<string | null>(null);
  const [editPricingConfigData, setEditPricingConfigData] = useState<any>({});
  const [editCityPriceData, setEditCityPriceData] = useState<any>({});
  const [editMultiplierData, setEditMultiplierData] = useState<any>({});
  const [newPricingConfig, setNewPricingConfig] = useState({
    type: 'base_price',
    category: 'house_moving',
    name: '',
    description: '',
    value: 0,
    unit: '€',
    active: true
  });
  const [newCityPrice, setNewCityPrice] = useState({
    city_name: '',
    normal: 0,
    city_day: 0,
    day_of_week: 1
  });
  const [newMultiplier, setNewMultiplier] = useState({
    name: '',
    value: 0,
    category: 'house_moving',
    active: true
  });
  const [showAddPricingForm, setShowAddPricingForm] = useState(false);
  const [showAddCityForm, setShowAddCityForm] = useState(false);
  const [showAddMultiplierForm, setShowAddMultiplierForm] = useState(false);

  // Transportation request detail state
  const [selectedTransportRequest, setSelectedTransportRequest] = useState<TransportRequest | null>(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);

  // Get all cities from constants
  const allCities = Object.keys(cityBaseCharges);

  // Load data on initial render
  useEffect(() => {
    fetchData();
  }, []);

  // Load time blocks on component mount
  useEffect(() => {
    loadTimeBlocksFromSupabase();
  }, []);

  // Update calendar when time blocks change
  useEffect(() => {
    setCalendarDays(generateCalendarDaysWithTimeBlocks(currentMonth));
  }, [currentMonth, timeBlocks]);

  // Generate calendar days with time block support
  const generateCalendarDaysWithTimeBlocks = (month: Date) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayTimeBlocks = timeBlocks[dateKey] || [];
      const allCitiesForDay = dayTimeBlocks.flatMap(block => block.cities);
      
      return {
        date: day,
        assignedCities: [...new Set(allCitiesForDay)], // Remove duplicates
        isToday: isToday(day),
        isCurrentMonth: isSameMonth(day, month)
      };
    });
  };

  // Handle time block management (commented out to fix build)
  // const handleDateClickForBlocks = (day: CalendarDay) => {
  //   setSelectedDateForBlocks(day.date);
  //   const dateKey = format(day.date, 'yyyy-MM-dd');
  //   setTimeBlocks(prev => ({
  //     ...prev,
  //     [dateKey]: prev[dateKey] || []
  //   }));
  //   setShowTimeBlockEditor(true);
  // };

  // const addTimeBlock = () => {
  //   if (!selectedDateForBlocks) return;
    
  //   const dateKey = format(selectedDateForBlocks, 'yyyy-MM-dd');
  //   const newBlock: TimeBlock = {
  //     ...currentTimeBlock,
  //     id: Date.now().toString()
  //   };

  //   setTimeBlocks(prev => ({
  //     ...prev,
  //     [dateKey]: [...(prev[dateKey] || []), newBlock]
  //   }));

  //   // Reset form
  //   setCurrentTimeBlock({
  //     id: '',
  //     startTime: '08:00',
  //     endTime: '15:00',
  //     cities: [],
  //     discountPercentage: 20
  //   });
  // };

  // const updateTimeBlock = (blockId: string, updatedBlock: TimeBlock) => {
  //   if (!selectedDateForBlocks) return;
    
  //   const dateKey = format(selectedDateForBlocks, 'yyyy-MM-dd');
  //   setTimeBlocks(prev => ({
  //     ...prev,
  //     [dateKey]: prev[dateKey]?.map(block => 
  //       block.id === blockId ? updatedBlock : block
  //     ) || []
  //   }));
  // };

  // const deleteTimeBlock = (blockId: string) => {
  //   if (!selectedDateForBlocks) return;
    
  //   const dateKey = format(selectedDateForBlocks, 'yyyy-MM-dd');
  //   setTimeBlocks(prev => ({
  //     ...prev,
  //     [dateKey]: prev[dateKey]?.filter(block => block.id !== blockId) || []
  //   }));
  // };

  // const saveTimeBlocksToSupabase = async () => {
  //   if (!selectedDateForBlocks) return;

  //   try {
  //     const dateKey = format(selectedDateForBlocks, 'yyyy-MM-dd');
  //     const blocksForDate = timeBlocks[dateKey] || [];

  //     // Delete existing time blocks for this date
  //     await supabase
  //       .from('time_blocks')
  //       .delete()
  //       .eq('date', dateKey);

  //     // Insert new time blocks
  //     if (blocksForDate.length > 0) {
  //       const timeBlockEntries = blocksForDate.map(block => ({
  //         date: dateKey,
  //         start_time: block.startTime,
  //         end_time: block.endTime,
  //         cities: block.cities,
  //         discount_percentage: block.discountPercentage,
  //         created_at: new Date().toISOString()
  //       }));

  //       const { error } = await supabase
  //         .from('time_blocks')
  //         .insert(timeBlockEntries);

  //       if (error) {
  //         toast.error('Failed to save time blocks');
  //         console.error('Save error:', error);
  //       } else {
  //         toast.success('Time blocks saved successfully');
  //       }
  //     }
  //   } catch (error) {
  //     toast.error('Failed to save time blocks');
  //     console.error('Save error:', error);
  //   }
  // };

  const loadTimeBlocksFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('time_blocks')
        .select('*');

      if (error) {
        console.error('Error loading time blocks:', error);
        return;
      }

      // Convert to time blocks format
      const timeBlocksMap: { [key: string]: TimeBlock[] } = {};
      data?.forEach((item: any) => {
        const dateKey = item.date;
        if (!timeBlocksMap[dateKey]) {
          timeBlocksMap[dateKey] = [];
        }
        timeBlocksMap[dateKey].push({
          id: item.id.toString(),
          startTime: item.start_time,
          endTime: item.end_time,
          cities: item.cities,
          discountPercentage: item.discount_percentage
        });
      });

      setTimeBlocks(timeBlocksMap);
    } catch (error) {
      console.error('Error loading time blocks:', error);
    }
  };

  // Load schedule data from Supabase
  const loadScheduleData = async () => {
    try {
      const { data, error } = await supabase
        .from('city_schedules')
        .select('*');

      if (error) {
        console.error('Error loading schedule data:', error);
        return;
      }

      // Convert to format: { '2024-01-15': ['Amsterdam', 'Rotterdam'] }
      const scheduleMap: { [key: string]: string[] } = {};
      data?.forEach((item: any) => {
        const dateKey = format(new Date(item.date), 'yyyy-MM-dd');
        if (!scheduleMap[dateKey]) {
          scheduleMap[dateKey] = [];
        }
        scheduleMap[dateKey].push(item.city);
      });

      // setScheduleData(scheduleMap); // Commented out - scheduleData is not used
    } catch (error) {
      console.error('Error loading schedule data:', error);
    }
  };

  // Save schedule data to Supabase
  const saveScheduleData = async (date: string, cities: string[]) => {
    try {
      // First, delete existing entries for this date
      await supabase
        .from('city_schedules')
        .delete()
        .eq('date', date);

      // Then insert new entries
      if (cities.length > 0) {
        const entries = cities.map(city => ({
          date: date,
          city: city,
          created_at: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('city_schedules')
          .insert(entries);

        if (error) {
          toast.error('Failed to save schedule');
          console.error('Save error:', error);
        } else {
          toast.success('Schedule saved successfully');
        }
      }
    } catch (error) {
      toast.error('Failed to save schedule');
      console.error('Save error:', error);
    }
  };

  // Handle date selection
  const handleDateClick = (day: CalendarDay) => {
    setSelectedDate(day.date);
    setSelectedCities(day.assignedCities);
    setShowCitySelector(true);
  };

  // Handle city assignment
  const handleCityAssignment = async () => {
    if (!selectedDate) return;

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    // setScheduleData(prev => ({
    //   ...prev,
    //   [dateKey]: selectedCities
    // })); // Commented out - scheduleData is not used

    await saveScheduleData(dateKey, selectedCities);
    setShowCitySelector(false);
  };

  // Handle city toggle
  const toggleCity = (city: string) => {
    setSelectedCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city)
        : [...prev, city]
    );
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => addDays(startOfMonth(prev), -1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addDays(endOfMonth(prev), 1));
  };

  // Fetch all necessary data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchTransportRequests(),
        fetchSchedule(),
        fetchPricingData(),
        fetchMarketplaceData(),
        fetchFurnitureItemsData(),
        loadScheduleData(),
        fetchAdminListings(),
        fetchUserListings()
      ]);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  

  
  // Fetch transport requests
  const fetchTransportRequests = async () => {
    try {
      // Fetch from Supabase tables
      const { data: itemMovingData, error: itemError } = await supabase
        .from('item_moving')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: houseMovingData, error: houseError } = await supabase
        .from('house_moving')
        .select('*')
        .order('created_at', { ascending: false });

      if (itemError) console.error('Error fetching item moving:', itemError);
      if (houseError) console.error('Error fetching house moving:', houseError);

      console.log('itemMovingData', itemMovingData);
      console.log('houseMovingData', houseMovingData);

      // Normalize and combine data
      const itemMoving = (itemMovingData || []).map((req: any) => ({
        id: req.id?.toString() || '',
        created_at: req.created_at || '',
        customer_email: req.email || '',
        customer_name: (req.firstname || '') + (req.lastname ? ' ' + req.lastname : ''),
        city: req.firstlocation || '',
        date: req.selecteddate || req.selecteddate_start || req.created_at || '',
        status: req.status || 'pending',
        notes: req.notes || '',
        type: 'item-moving' as const,
        // Additional fields from Supabase
        pickuptype: req.pickuptype,
        furnitureitems: req.furnitureitems,
        customitem: req.customitem,
        floorpickup: req.floorpickup,
        floordropoff: req.floordropoff,
        firstname: req.firstname,
        lastname: req.lastname,
        phone: req.phone,
        estimatedprice: req.estimatedprice,
        selecteddate: req.selecteddate,
        isdateflexible: req.isdateflexible,
        baseprice: req.baseprice,
        itempoints: req.itempoints,
        carryingcost: req.carryingcost,
        disassemblycost: req.disassemblycost,
        distancecost: req.distancecost,
        extrahelpercost: req.extrahelpercost,
        selecteddate_start: req.selecteddate_start,
        selecteddate_end: req.selecteddate_end,
        firstlocation: req.firstlocation,
        secondlocation: req.secondlocation,
        firstlocation_coords: req.firstlocation_coords,
        secondlocation_coords: req.secondlocation_coords,
        calculated_distance_km: req.calculated_distance_km,
        calculated_duration_seconds: req.calculated_duration_seconds,
        calculated_duration_text: req.calculated_duration_text,
        distance_provider: req.distance_provider,
        disassembly: req.disassembly,
        elevatorpickup: req.elevatorpickup,
        elevatordropoff: req.elevatordropoff,
        extrahelper: req.extrahelper,
        carryingservice: req.carryingservice,
        isstudent: req.isstudent,
        studentid: req.studentid,
        preferredtimespan: req.preferredtimespan,
        updated_at: req.updated_at,
      }));

      const houseMoving = (houseMovingData || []).map((req: any) => ({
        id: req.id?.toString() || '',
        created_at: req.created_at || '',
        customer_email: req.email || req.customer_email || '',
        customer_name: (req.firstname || '') + (req.lastname ? ' ' + req.lastname : ''),
        city: req.firstlocation || req.city || '',
        date: req.selecteddate || req.selecteddate_start || req.created_at || '',
        status: req.status || 'pending',
        notes: req.notes || '',
        type: 'house-moving' as const,
        // Additional fields from Supabase
        pickuptype: req.pickuptype,
        furnitureitems: req.furnitureitems,
        customitem: req.customitem,
        floorpickup: req.floorpickup,
        floordropoff: req.floordropoff,
        firstname: req.firstname,
        lastname: req.lastname,
        phone: req.phone,
        estimatedprice: req.estimatedprice,
        selecteddate: req.selecteddate,
        isdateflexible: req.isdateflexible,
        baseprice: req.baseprice,
        itempoints: req.itempoints,
        carryingcost: req.carryingcost,
        disassemblycost: req.disassemblycost,
        distancecost: req.distancecost,
        extrahelpercost: req.extrahelpercost,
        selecteddate_start: req.selecteddate_start,
        selecteddate_end: req.selecteddate_end,
        firstlocation: req.firstlocation,
        secondlocation: req.secondlocation,
        firstlocation_coords: req.firstlocation_coords,
        secondlocation_coords: req.secondlocation_coords,
        calculated_distance_km: req.calculated_distance_km,
        calculated_duration_seconds: req.calculated_duration_seconds,
        calculated_duration_text: req.calculated_duration_text,
        distance_provider: req.distance_provider,
        disassembly: req.disassembly,
        elevatorpickup: req.elevatorpickup,
        elevatordropoff: req.elevatordropoff,
        extrahelper: req.extrahelper,
        carryingservice: req.carryingservice,
        isstudent: req.isstudent,
        studentid: req.studentid,
        preferredtimespan: req.preferredtimespan,
        updated_at: req.updated_at,
      }));

      setTransportRequests([...itemMoving, ...houseMoving]);
    } catch (error) {
      setTransportRequests([]);
      toast.error('Failed to fetch transport requests');
      console.error(error);
    }
  };
  
  // Fetch pricing data
  const fetchPricingData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      // Fetch pricing configs
      const configsResponse = await fetch('https://rehome-backend.vercel.app/api/admin/pricing-configs', { headers });
      if (configsResponse.ok) {
        const configsData = await configsResponse.json();
        setPricingConfigs(configsData.configs || []);
      }

      // Fetch city prices
      const citiesResponse = await fetch('https://rehome-backend.vercel.app/api/admin/city-prices', { headers });
      if (citiesResponse.ok) {
        const citiesData = await citiesResponse.json();
        setCityPrices(citiesData.cities || []);
      }

      // Fetch pricing multipliers
      const multipliersResponse = await fetch('https://rehome-backend.vercel.app/api/admin/pricing-multipliers', { headers });
      if (multipliersResponse.ok) {
        const multipliersData = await multipliersResponse.json();
        setPricingMultipliers(multipliersData.multipliers || []);
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error);
    }
  };
  
  // Fetch marketplace data
  const fetchMarketplaceData = async () => {
    try {
      // Fetch marketplace items from Supabase
      const { data: items, error: itemsError } = await supabase
        .from('marketplace_furniture')
        .select('*')
        .order('created_at', { ascending: false });

      if (itemsError) console.error('Error fetching marketplace items:', itemsError);
      setMarketplaceItems(items || []);


    } catch (error) {
      console.error('Error fetching marketplace data:', error);
    }
  };
  
  // Fetch furniture items data
  const fetchFurnitureItemsData = async () => {
    try {
      const { data, error } = await supabase
        .from('furniture_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching furniture items:', error);
      setFurnitureItemsData(data || []);
    } catch (error) {
      console.error('Error fetching furniture items data:', error);
    }
  };
  
  // Fetch schedule (placeholder function)
  const fetchSchedule = async () => {
    // This function is kept for compatibility but doesn't do anything
    // Schedule data is now handled by loadScheduleData()
  };

  // Filter transport requests based on search and filters
  const filteredTransportRequests = transportRequests.filter(request => {
    const matchesSearch = request.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCity = cityFilter === 'all' || request.city === cityFilter;
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.type === typeFilter;
    
    const matchesDateRange = !dateRangeFilter.startDate || !dateRangeFilter.endDate || 
                            (new Date(request.date) >= new Date(dateRangeFilter.startDate) && 
                             new Date(request.date) <= new Date(dateRangeFilter.endDate));
    
    return matchesSearch && matchesCity && matchesStatus && matchesType && matchesDateRange;
  });

  // Filter marketplace items based on search and filters (commented out - using adminListings instead)
  // const filteredMarketplaceItems = marketplaceItems.filter(item => {
  //   const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //                        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //                        item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //                        item.seller_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
  //   const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
  //   const matchesCategory = typeFilter === 'all' || item.category === typeFilter;
    
  //   const matchesPriceRange = (!priceRangeFilter.minPrice || item.price >= parseFloat(priceRangeFilter.minPrice)) &&
  //                            (!priceRangeFilter.maxPrice || item.price <= parseFloat(priceRangeFilter.maxPrice));
    
  //   return matchesSearch && matchesStatus && matchesCategory && matchesPriceRange;
  // });

  // Filter pricing configs based on search and filters
  const filteredPricingConfigs = pricingConfigs.filter(config => {
    const matchesSearch = config.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         config.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         config.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = typeFilter === 'all' || config.category === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && config.active) ||
                         (statusFilter === 'inactive' && !config.active);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Filter furniture items based on search and filters
  const filteredFurnitureItems = furnitureItemsData.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = typeFilter === 'all' || item.category === typeFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique cities for filter dropdown
  const uniqueCities = [...new Set([
    ...transportRequests.map(r => r.city).filter(Boolean),
    ...Object.keys(cityBaseCharges)
  ])];

  // Get unique categories for filter dropdown
  const uniqueCategories = [...new Set([
    ...marketplaceItems.map(i => i.category).filter(Boolean),
    ...furnitureItemsData.map(i => i.category).filter(Boolean),
    ...pricingConfigs.map(p => p.category).filter(Boolean)
  ])];

  // Clear all filters function
  const clearAllFilters = () => {
    setCityFilter('all');
    setStatusFilter('all');
    setTypeFilter('all');
    setDateRangeFilter({ startDate: '', endDate: '' });
    setPriceRangeFilter({ minPrice: '', maxPrice: '' });
    setSearchQuery('');
  };

  // Handle edit transportation request
  const handleEditTransportRequest = (request: TransportRequest) => {
    setEditingTransportRequest(request.id);
    setEditTransportData({
      customer_name: request.customer_name,
      customer_email: request.customer_email,
      city: request.city,
      status: request.status,
      notes: request.notes || ''
    });
  };

  // Handle save transportation request
  const handleSaveTransportRequest = async (request: TransportRequest) => {
    setIsUpdating(true);
    try {
      const tableName = request.type === 'item-moving' ? 'item_moving_requests' : 'house_moving_requests';
      
      const { error } = await supabase
        .from(tableName)
        .update({
          firstname: editTransportData.customer_name.split(' ')[0],
          lastname: editTransportData.customer_name.split(' ').slice(1).join(' '),
          email: editTransportData.customer_email,
          firstlocation: editTransportData.city,
          status: editTransportData.status,
          notes: editTransportData.notes
        })
        .eq('id', request.id);

      if (error) {
        toast.error('Failed to update request');
        console.error('Update error:', error);
      } else {
        toast.success('Request updated successfully');
        setEditingTransportRequest(null);
        fetchTransportRequests(); // Refresh data
      }
    } catch (error) {
      toast.error('Failed to update request');
      console.error('Update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete transportation request
  const handleDeleteTransportRequest = async (request: TransportRequest) => {
    if (!window.confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
      return;
    }

    setIsUpdating(true);
    try {
      const tableName = request.type === 'item-moving' ? 'item_moving_requests' : 'house_moving_requests';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', request.id);

      if (error) {
        toast.error('Failed to delete request');
        console.error('Delete error:', error);
      } else {
        toast.success('Request deleted successfully');
        fetchTransportRequests(); // Refresh data
      }
    } catch (error) {
      toast.error('Failed to delete request');
      console.error('Delete error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle edit marketplace item
      const handleEditMarketplaceItem = (item: MarketplaceItem) => {
      // setEditingMarketplaceItem(item.id); // Commented out - editingMarketplaceItem is not used
      // setEditMarketplaceData({
      //   name: item.name,
      //   description: item.description,
      //   price: item.price,
      //   category: item.category,
      //   status: item.status
      // }); // Commented out - editMarketplaceData is not used
      console.log('Edit item:', item);
    };

  // Handle save marketplace item (commented out - unused)
  // const handleSaveMarketplaceItem = async (item: MarketplaceItem) => {
  //   setIsUpdating(true);
  //   try {
  //     const { error } = await supabase
  //       .from('marketplace_furniture')
  //       .update({
  //         name: editMarketplaceData.name,
  //         description: editMarketplaceData.description,
  //         price: editMarketplaceData.price,
  //         category: editMarketplaceData.category,
  //         status: editMarketplaceData.status
  //       })
  //       .eq('id', item.id);

  //     if (error) {
  //       toast.error('Failed to update item');
  //       console.error('Update error:', error);
  //     } else {
  //       toast.success('Item updated successfully');
  //       setEditingMarketplaceItem(null);
  //       fetchMarketplaceData(); // Refresh data
  //     }
  //   } catch (error) {
  //     toast.error('Failed to update item');
  //     console.error('Update error:', error);
  //   } finally {
  //     setIsUpdating(false);
  //   }
  // };

  // Handle delete marketplace item
  const handleDeleteMarketplaceItem = async (item: MarketplaceItem) => {
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('marketplace_furniture')
        .delete()
        .eq('id', item.id);

      if (error) {
        toast.error('Failed to delete item');
        console.error('Delete error:', error);
      } else {
        toast.success('Item deleted successfully');
        fetchMarketplaceData(); // Refresh data
      }
    } catch (error) {
      toast.error('Failed to delete item');
      console.error('Delete error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle edit pricing config
  const handleEditPricingConfig = (config: PricingConfig) => {
    setEditingPricingConfig(config.id);
    setEditPricingConfigData({
      type: config.type,
      category: config.category,
      name: config.name,
      description: config.description,
      value: config.value,
      unit: config.unit,
      active: config.active
    });
  };

  // Handle save pricing config
  const handleSavePricingConfig = async (config: PricingConfig) => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`https://rehome-backend.vercel.app/api/admin/pricing-configs/${config.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editPricingConfigData)
      });

      if (!response.ok) {
        throw new Error('Failed to update pricing config');
      }

      toast.success('Pricing config updated successfully');
      setEditingPricingConfig(null);
      fetchPricingData(); // Refresh data
    } catch (error) {
      toast.error('Failed to update pricing config');
      console.error('Update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete pricing config
  const handleDeletePricingConfig = async (config: PricingConfig) => {
    if (!window.confirm('Are you sure you want to delete this pricing config? This action cannot be undone.')) {
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`https://rehome-backend.vercel.app/api/admin/pricing-configs/${config.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete pricing config');
      }

      toast.success('Pricing config deleted successfully');
      fetchPricingData(); // Refresh data
    } catch (error) {
      toast.error('Failed to delete pricing config');
      console.error('Delete error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle add pricing config
  const handleAddPricingConfig = async () => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch('https://rehome-backend.vercel.app/api/admin/pricing-configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newPricingConfig)
      });

      if (!response.ok) {
        throw new Error('Failed to add pricing config');
      }

      toast.success('Pricing config added successfully');
      setShowAddPricingForm(false);
      setNewPricingConfig({
        type: 'base_price',
        category: 'house_moving',
        name: '',
        description: '',
        value: 0,
        unit: '€',
        active: true
      });
      fetchPricingData(); // Refresh data
    } catch (error) {
      toast.error('Failed to add pricing config');
      console.error('Add error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle edit city price
  const handleEditCityPrice = (city: CityPrice) => {
    setEditingCityPrice(city.id);
    setEditCityPriceData({
      city_name: city.city_name,
      normal: city.normal,
      city_day: city.city_day,
      day_of_week: city.day_of_week
    });
  };

  // Handle save city price
  const handleSaveCityPrice = async (city: CityPrice) => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`https://rehome-backend.vercel.app/api/admin/city-prices/${city.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editCityPriceData)
      });

      if (!response.ok) {
        throw new Error('Failed to update city price');
      }

      toast.success('City price updated successfully');
      setEditingCityPrice(null);
      fetchPricingData(); // Refresh data
    } catch (error) {
      toast.error('Failed to update city price');
      console.error('Update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete city price
  const handleDeleteCityPrice = async (city: CityPrice) => {
    if (!window.confirm('Are you sure you want to delete this city price? This action cannot be undone.')) {
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`https://rehome-backend.vercel.app/api/admin/city-prices/${city.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete city price');
      }

      toast.success('City price deleted successfully');
      fetchPricingData(); // Refresh data
    } catch (error) {
      toast.error('Failed to delete city price');
      console.error('Delete error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle add city price
  const handleAddCityPrice = async () => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch('https://rehome-backend.vercel.app/api/admin/city-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newCityPrice)
      });

      if (!response.ok) {
        throw new Error('Failed to add city price');
      }

      toast.success('City price added successfully');
      setShowAddCityForm(false);
      setNewCityPrice({
        city_name: '',
        normal: 0,
        city_day: 0,
        day_of_week: 1
      });
      fetchPricingData(); // Refresh data
    } catch (error) {
      toast.error('Failed to add city price');
      console.error('Add error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle edit multiplier
  const handleEditMultiplier = (multiplier: PricingMultiplier) => {
    setEditingMultiplier(multiplier.id);
    setEditMultiplierData({
      name: multiplier.name,
      value: multiplier.value,
      category: multiplier.category,
      active: multiplier.active
    });
  };

  // Handle save multiplier
  const handleSaveMultiplier = async (multiplier: PricingMultiplier) => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`https://rehome-backend.vercel.app/api/admin/pricing-multipliers/${multiplier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editMultiplierData)
      });

      if (!response.ok) {
        throw new Error('Failed to update multiplier');
      }

      toast.success('Multiplier updated successfully');
      setEditingMultiplier(null);
      fetchPricingData(); // Refresh data
    } catch (error) {
      toast.error('Failed to update multiplier');
      console.error('Update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete multiplier
  const handleDeleteMultiplier = async (multiplier: PricingMultiplier) => {
    if (!window.confirm('Are you sure you want to delete this multiplier? This action cannot be undone.')) {
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`https://rehome-backend.vercel.app/api/admin/pricing-multipliers/${multiplier.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete multiplier');
      }

      toast.success('Multiplier deleted successfully');
      fetchPricingData(); // Refresh data
    } catch (error) {
      toast.error('Failed to delete multiplier');
      console.error('Delete error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle add multiplier
  const handleAddMultiplier = async () => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch('https://rehome-backend.vercel.app/api/admin/pricing-multipliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newMultiplier)
      });

      if (!response.ok) {
        throw new Error('Failed to add multiplier');
      }

      toast.success('Multiplier added successfully');
      setShowAddMultiplierForm(false);
      setNewMultiplier({
        name: '',
        value: 0,
        category: 'house_moving',
        active: true
      });
      fetchPricingData(); // Refresh data
    } catch (error) {
      toast.error('Failed to add multiplier');
      console.error('Add error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle edit furniture item
  const handleEditFurnitureItem = (item: any) => {
    setEditingFurnitureItem(item.id);
    setEditFurnitureItemData({
      name: item.name,
      category: item.category,
      points: item.points
    });
  };

  // Handle save furniture item
  const handleSaveFurnitureItem = async (item: any) => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`https://rehome-backend.vercel.app/api/admin/furniture-items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editFurnitureItemData)
      });

      if (!response.ok) {
        throw new Error('Failed to update furniture item');
      }

      toast.success('Furniture item updated successfully');
      setEditingFurnitureItem(null);
      fetchFurnitureItemsData(); // Refresh data
    } catch (error) {
      toast.error('Failed to update furniture item');
      console.error('Update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete furniture item
  const handleDeleteFurnitureItem = async (item: any) => {
    if (!window.confirm('Are you sure you want to delete this furniture item? This action cannot be undone.')) {
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`https://rehome-backend.vercel.app/api/admin/furniture-items/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete furniture item');
      }

      toast.success('Furniture item deleted successfully');
      fetchFurnitureItemsData(); // Refresh data
    } catch (error) {
      toast.error('Failed to delete furniture item');
      console.error('Delete error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle add furniture item
  const handleAddFurnitureItem = async () => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch('https://rehome-backend.vercel.app/api/admin/furniture-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newFurnitureItem)
      });

      if (!response.ok) {
        throw new Error('Failed to add furniture item');
      }

      toast.success('Furniture item added successfully');
      setShowAddFurnitureForm(false);
      setNewFurnitureItem({
        name: '',
        category: 'Bedroom',
        points: 0
      });
      fetchFurnitureItemsData(); // Refresh data
    } catch (error) {
      toast.error('Failed to add furniture item');
      console.error('Add error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Enhanced marketplace management functions
  const handleAddAdminListing = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('marketplace_furniture')
        .insert([{
          name: newAdminListing.name,
          description: newAdminListing.description,
          price: newAdminListing.price,
          category: newAdminListing.category,
          status: newAdminListing.status,
          seller_email: user?.email || 'admin@rehome.com',
          images: newAdminListing.images,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        throw new Error('Failed to add listing');
      }

      toast.success('Listing added successfully');
      setShowAddListingForm(false);
      setNewAdminListing({
        name: '',
        description: '',
        price: 0,
        category: 'Living Room',
        status: 'available',
        images: []
      });
      fetchAdminListings();
    } catch (error) {
      toast.error('Failed to add listing');
      console.error('Add error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchAdminListings = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_furniture')
        .select('*')
        .eq('seller_email', user?.email || 'admin@rehome.com')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin listings:', error);
        return;
      }

      setAdminListings(data || []);
    } catch (error) {
      console.error('Error fetching admin listings:', error);
    }
  };

  const fetchUserListings = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_furniture')
        .select('*')
        .neq('seller_email', user?.email || 'admin@rehome.com')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user listings:', error);
        return;
      }

      setUserListings(data || []);
    } catch (error) {
      console.error('Error fetching user listings:', error);
    }
  };

  // const fetchIncomingRequests = async () => {
  //   try {
  //     const { data, error } = await supabase
  //       .from('marketplace_requests')
  //       .select(`
  //         *,
  //         marketplace_furniture (
  //           name,
  //           price
  //         )
  //       `)
  //       .eq('marketplace_furniture.seller_email', user?.email || 'admin@rehome.com')
  //       .order('created_at', { ascending: false });

  //     if (error) {
  //       console.error('Error fetching requests:', error);
  //       return;
  //     }

  //     setIncomingRequests(data || []);
  //   } catch (error) {
  //     console.error('Error fetching requests:', error);
  //   }
  // };

  // const handleRequestResponse = async (requestId: string, status: 'accepted' | 'rejected') => {
  //   setIsUpdating(true);
  //   try {
  //     const { error } = await supabase
  //       .from('marketplace_requests')
  //       .update({ status })
  //       .eq('id', requestId);

  //     if (error) {
  //       throw new Error('Failed to update request');
  //     }

  //     toast.success(`Request ${status} successfully`);
  //     fetchIncomingRequests();
  //   } catch (error) {
  //     toast.error('Failed to update request');
  //     console.error('Update error:', error);
  //   } finally {
  //     setIsUpdating(false);
  //   }
  // };

  const deleteUserListing = async (listingId: string) => {
    if (!window.confirm('Are you sure you want to delete this user listing? This action cannot be undone.')) {
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('marketplace_furniture')
        .delete()
        .eq('id', listingId);

      if (error) {
        throw new Error('Failed to delete listing');
      }

      toast.success('User listing deleted successfully');
      fetchUserListings();
    } catch (error) {
      toast.error('Failed to delete listing');
      console.error('Delete error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const markItemAsSold = async (itemId: string, salePrice: number) => {
    setIsUpdating(true);
    try {
      // Update item status
      const { error: updateError } = await supabase
        .from('marketplace_furniture')
        .update({ status: 'sold' })
        .eq('id', itemId);

      if (updateError) {
        throw new Error('Failed to mark as sold');
      }

      // Add to sales history
      const item = adminListings.find(i => i.id === itemId);
      if (item) {
        const { error: salesError } = await supabase
          .from('sales_history')
          .insert([{
            item_id: itemId,
            item_name: item.name,
            buyer_email: 'direct_sale',
            sale_price: salePrice,
            original_price: item.price,
            sale_date: new Date().toISOString()
          }]);

        if (salesError) {
          console.error('Error adding to sales history:', salesError);
        }
      }

      toast.success('Item marked as sold');
      fetchAdminListings();
    } catch (error) {
      toast.error('Failed to mark as sold');
      console.error('Update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Show detailed view of transportation request
  const handleViewRequestDetails = async (request: TransportRequest) => {
    setSelectedTransportRequest(request);
    
    // Fetch additional details from Supabase if needed
    try {
      const tableName = request.type === 'item-moving' ? 'item_moving_requests' : 'house_moving_requests';
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', request.id)
        .single();

      if (error) {
        console.error('Error fetching request details:', error);
      } else {
        setSelectedTransportRequest({...request, ...data});
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
    }
    
    setShowRequestDetails(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col pt-24 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col pt-24 items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Admin Dashboard</h1>
          <p className="text-gray-600">Manage furniture inventory, transportation services, and pricing</p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white rounded-lg shadow-lg p-1">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'marketplace'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaBox className="mr-2" />
              Marketplace Management
            </button>
            <button
              onClick={() => setActiveTab('transport')}
              className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'transport'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaTruck className="mr-2" />
              Transportation Requests
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'schedule'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <FaCalendarAlt className="mr-2" />
              Schedule Management
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'pricing'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaCog className="mr-2" />
              Pricing Management
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'items'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaBox className="mr-2" />
              Items Management
            </button>

          </div>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
        >
          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="space-y-4">
              {/* Main Search and Filter Toggle */}
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    showFilters ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <FaCog className="mr-2" />
                  Filters
                </button>
                {(cityFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all' || 
                  dateRangeFilter.startDate || priceRangeFilter.minPrice) && (
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                  {/* City Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <select
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="all">All Cities</option>
                      {uniqueCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="all">All Status</option>
                      {activeTab === 'transport' && (
                        <>
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </>
                      )}
                      {activeTab === 'marketplace' && (
                        <>
                          <option value="available">Available</option>
                          <option value="reserved">Reserved</option>
                          <option value="sold">Sold</option>
                        </>
                      )}
                      {activeTab === 'pricing' && (
                        <>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Type/Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {activeTab === 'transport' ? 'Type' : 'Category'}
                    </label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="all">All {activeTab === 'transport' ? 'Types' : 'Categories'}</option>
                      {activeTab === 'transport' && (
                        <>
                          <option value="item-moving">Item Moving</option>
                          <option value="house-moving">House Moving</option>
                        </>
                      )}
                      {(activeTab === 'marketplace' || activeTab === 'items' || activeTab === 'pricing') && 
                        uniqueCategories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))
                      }
                    </select>
                  </div>

                  {/* Date Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                    <div className="space-y-1">
                      <input
                        type="date"
                        value={dateRangeFilter.startDate}
                        onChange={(e) => setDateRangeFilter({...dateRangeFilter, startDate: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                        placeholder="Start Date"
                      />
                      <input
                        type="date"
                        value={dateRangeFilter.endDate}
                        onChange={(e) => setDateRangeFilter({...dateRangeFilter, endDate: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                        placeholder="End Date"
                      />
                    </div>
                  </div>

                  {/* Price Range Filter (for marketplace) */}
                  {activeTab === 'marketplace' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price Range (€)</label>
                      <div className="space-y-1">
                        <input
                          type="number"
                          value={priceRangeFilter.minPrice}
                          onChange={(e) => setPriceRangeFilter({...priceRangeFilter, minPrice: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="Min Price"
                        />
                        <input
                          type="number"
                          value={priceRangeFilter.maxPrice}
                          onChange={(e) => setPriceRangeFilter({...priceRangeFilter, maxPrice: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="Max Price"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Filter Summary */}
              {(cityFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all' || 
                dateRangeFilter.startDate || priceRangeFilter.minPrice) && (
                <div className="flex flex-wrap gap-2">
                  {cityFilter !== 'all' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      City: {cityFilter}
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                      Status: {statusFilter}
                    </span>
                  )}
                  {typeFilter !== 'all' && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                      {activeTab === 'transport' ? 'Type' : 'Category'}: {typeFilter}
                    </span>
                  )}
                  {(dateRangeFilter.startDate || dateRangeFilter.endDate) && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                      Date: {dateRangeFilter.startDate || 'Start'} - {dateRangeFilter.endDate || 'End'}
                    </span>
                  )}
                  {(priceRangeFilter.minPrice || priceRangeFilter.maxPrice) && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm">
                      Price: €{priceRangeFilter.minPrice || '0'} - €{priceRangeFilter.maxPrice || '∞'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'transport' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Transportation Requests</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">TYPE</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">CUSTOMER</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">PHONE</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">PICKUP TYPE</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">LOCATION</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">FLOORS</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">DATE</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">PRICE</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">ITEMS</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">STATUS</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransportRequests.map((request, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              request.type === 'item-moving' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {request.type === 'item-moving' ? 'Item' : 'House'}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-xs">
                            {editingTransportRequest === request.id ? (
                              <input
                                type="text"
                                value={editTransportData.customer_name}
                                onChange={(e) => setEditTransportData({...editTransportData, customer_name: e.target.value})}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
                              />
                            ) : (
                              <div>
                                <div className="font-medium">{request.customer_name}</div>
                                <div className="text-gray-500 text-xs">{request.customer_email}</div>
                              </div>
                            )}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-xs">
                            {request.phone || '-'}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-xs">
                            {request.pickuptype || '-'}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-xs">
                            <div>
                              <div><strong>From:</strong> {request.firstlocation || request.city || '-'}</div>
                              <div><strong>To:</strong> {request.secondlocation || '-'}</div>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-xs">
                            <div>
                              <div>Pickup: {request.floorpickup || '-'}</div>
                              <div>Dropoff: {request.floordropoff || '-'}</div>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-xs">
                            {request.selecteddate ? format(new Date(request.selecteddate), 'MM/dd/yyyy') : 
                             request.selecteddate_start ? format(new Date(request.selecteddate_start), 'MM/dd/yyyy') :
                             format(new Date(request.date), 'MM/dd/yyyy')}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-xs">
                            <div>
                              <div className="font-medium">€{request.estimatedprice || '-'}</div>
                              <div className="text-gray-500">Base: €{request.baseprice || '-'}</div>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-xs">
                            {request.furnitureitems ? (
                              <div>
                                <div>{request.furnitureitems.length} items</div>
                                <div className="text-gray-500">{request.itempoints || 0} points</div>
                              </div>
                            ) : (
                              request.customitem || '-'
                            )}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            {editingTransportRequest === request.id ? (
                              <select
                                value={editTransportData.status}
                                onChange={(e) => setEditTransportData({...editTransportData, status: e.target.value})}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                request.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                request.status === 'completed' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {request.status}
                              </span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            {editingTransportRequest === request.id ? (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleSaveTransportRequest(request)}
                                  disabled={isUpdating}
                                  className="flex items-center px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-xs"
                                >
                                  <FaSave className="mr-1" />
                                  {isUpdating ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={() => setEditingTransportRequest(null)}
                                  disabled={isUpdating}
                                  className="flex items-center px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs"
                                >
                                  <FaTimes className="mr-1" />
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleViewRequestDetails(request)}
                                  className="flex items-center px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                                >
                                  <FaSearch className="mr-1" />
                                  View
                                </button>
                                <button
                                  onClick={() => handleEditTransportRequest(request)}
                                  className="flex items-center px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                >
                                  <FaEdit className="mr-1" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTransportRequest(request)}
                                  className="flex items-center px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                >
                                  <FaTrash className="mr-1" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Transportation Request Details Modal */}
                {showRequestDetails && selectedTransportRequest && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
                      <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-2xl font-bold text-gray-800">
                            {selectedTransportRequest.type === 'item-moving' ? 'Item Moving' : 'House Moving'} Request Details
                          </h3>
                          <button
                            onClick={() => setShowRequestDetails(false)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <FaTimes size={24} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Customer Information */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-lg font-semibold text-gray-800 mb-3">Customer Information</h4>
                            <div className="space-y-2">
                              <p><span className="font-medium">Name:</span> {selectedTransportRequest.customer_name}</p>
                              <p><span className="font-medium">Email:</span> {selectedTransportRequest.customer_email}</p>
                              <p><span className="font-medium">Phone:</span> {(selectedTransportRequest as any).phone || 'N/A'}</p>
                            </div>
                          </div>

                          {/* Request Information */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-lg font-semibold text-gray-800 mb-3">Request Information</h4>
                            <div className="space-y-2">
                              <p><span className="font-medium">Type:</span> 
                                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                  selectedTransportRequest.type === 'item-moving' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {selectedTransportRequest.type === 'item-moving' ? 'Item Moving' : 'House Moving'}
                                </span>
                              </p>
                              <p><span className="font-medium">Status:</span> 
                                <span className="ml-2 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  {selectedTransportRequest.status}
                                </span>
                              </p>
                              <p><span className="font-medium">Date:</span> {format(new Date(selectedTransportRequest.date), 'PPP')}</p>
                              <p><span className="font-medium">City:</span> {selectedTransportRequest.city}</p>
                            </div>
                          </div>

                          {/* Location Information */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-lg font-semibold text-gray-800 mb-3">Location Details</h4>
                            <div className="space-y-2">
                              <p><span className="font-medium">From:</span> {(selectedTransportRequest as any).firstlocation || 'N/A'}</p>
                              <p><span className="font-medium">To:</span> {(selectedTransportRequest as any).secondlocation || 'N/A'}</p>
                              <p><span className="font-medium">Distance:</span> {(selectedTransportRequest as any).distance || 'N/A'} km</p>
                              <p><span className="font-medium">Floor (From):</span> {(selectedTransportRequest as any).firstfloor || 'N/A'}</p>
                              <p><span className="font-medium">Floor (To):</span> {(selectedTransportRequest as any).secondfloor || 'N/A'}</p>
                            </div>
                          </div>

                          {/* Service Details */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-lg font-semibold text-gray-800 mb-3">Service Details</h4>
                            <div className="space-y-2">
                              <p><span className="font-medium">Helper Required:</span> {(selectedTransportRequest as any).helper ? 'Yes' : 'No'}</p>
                              <p><span className="font-medium">Dismantling:</span> {(selectedTransportRequest as any).dismantling ? 'Yes' : 'No'}</p>
                              <p><span className="font-medium">Total Items:</span> {(selectedTransportRequest as any).totalitems || 'N/A'}</p>
                              <p><span className="font-medium">Total Points:</span> {(selectedTransportRequest as any).totalpoints || 'N/A'}</p>
                              <p><span className="font-medium">Estimated Price:</span> €{(selectedTransportRequest as any).price || 'N/A'}</p>
                            </div>
                          </div>

                          {/* Special Requirements */}
                          {selectedTransportRequest.notes && (
                            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                              <h4 className="text-lg font-semibold text-gray-800 mb-3">Special Requirements / Notes</h4>
                              <p className="text-gray-700">{selectedTransportRequest.notes}</p>
                            </div>
                          )}

                          {/* Items List (for item moving) */}
                          {selectedTransportRequest.type === 'item-moving' && (selectedTransportRequest as any).items && (
                            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                              <h4 className="text-lg font-semibold text-gray-800 mb-3">Items to Move</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                  <thead>
                                    <tr className="bg-gray-100">
                                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Item</th>
                                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Category</th>
                                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Quantity</th>
                                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Points</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(selectedTransportRequest as any).items.map((item: any, index: number) => (
                                      <tr key={index} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-3 py-2 text-sm">{item.name}</td>
                                        <td className="border border-gray-300 px-3 py-2 text-sm">{item.category}</td>
                                        <td className="border border-gray-300 px-3 py-2 text-sm">{item.quantity}</td>
                                        <td className="border border-gray-300 px-3 py-2 text-sm">{item.points}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Timeline */}
                          <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-lg font-semibold text-gray-800 mb-3">Timeline</h4>
                            <div className="space-y-2">
                              <p><span className="font-medium">Created:</span> {format(new Date(selectedTransportRequest.created_at), 'PPpp')}</p>
                              <p><span className="font-medium">Preferred Date:</span> {(selectedTransportRequest as any).preferreddate || 'N/A'}</p>
                              <p><span className="font-medium">Time Slot:</span> {(selectedTransportRequest as any).timeslot || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 flex justify-end space-x-3">
                          <button
                            onClick={() => setShowRequestDetails(false)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            Close
                          </button>
                          <button
                            onClick={() => {
                              handleEditTransportRequest(selectedTransportRequest);
                              setShowRequestDetails(false);
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Edit Request
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'marketplace' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Marketplace Management</h2>
                
                {/* Marketplace Sub-tabs */}
                <div className="flex space-x-4 mb-6">
                  {[
                    { id: 'inventory', label: 'My Inventory', icon: FaBox },
                    { id: 'supervision', label: 'User Listings', icon: FaSearch },
                    { id: 'sales', label: 'Sales History', icon: FaCog }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setMarketplaceTab(tab.id as any)}
                      className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
                        marketplaceTab === tab.id
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <tab.icon className="mr-2" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* My Inventory Tab */}
                {marketplaceTab === 'inventory' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">My Marketplace Inventory</h3>
                      <button
                        onClick={() => setShowAddListingForm(!showAddListingForm)}
                        className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                      >
                        <FaPlus className="mr-1" />
                        Add Listing
                      </button>
                    </div>

                    {/* Add Listing Form */}
                    {showAddListingForm && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-3">Add New Marketplace Listing</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="Item Name"
                            value={newAdminListing.name}
                            onChange={(e) => setNewAdminListing({...newAdminListing, name: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <input
                            type="number"
                            placeholder="Price (€)"
                            value={newAdminListing.price}
                            onChange={(e) => setNewAdminListing({...newAdminListing, price: parseFloat(e.target.value)})}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <select
                            value={newAdminListing.category}
                            onChange={(e) => setNewAdminListing({...newAdminListing, category: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="Living Room">Living Room</option>
                            <option value="Bedroom">Bedroom</option>
                            <option value="Kitchen">Kitchen</option>
                            <option value="Bathroom">Bathroom</option>
                            <option value="Office">Office</option>
                            <option value="Garden">Garden</option>
                            <option value="Other">Other</option>
                          </select>
                          <select
                            value={newAdminListing.status}
                            onChange={(e) => setNewAdminListing({...newAdminListing, status: e.target.value as any})}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="available">Available</option>
                            <option value="reserved">Reserved</option>
                          </select>
                        </div>
                        <textarea
                          placeholder="Description"
                          value={newAdminListing.description}
                          onChange={(e) => setNewAdminListing({...newAdminListing, description: e.target.value})}
                          className="mt-4 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          rows={3}
                        />
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={handleAddAdminListing}
                            disabled={isUpdating}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                          >
                            {isUpdating ? 'Adding...' : 'Add Listing'}
                          </button>
                          <button
                            onClick={() => setShowAddListingForm(false)}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Admin Listings Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">ITEM</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">CATEGORY</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">PRICE</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">STATUS</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">DATE</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminListings.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2">
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-sm text-gray-500">{item.description}</div>
                                </div>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">{item.category}</td>
                              <td className="border border-gray-300 px-4 py-2">€{item.price}</td>
                              <td className="border border-gray-300 px-4 py-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  item.status === 'available' ? 'bg-green-100 text-green-800' :
                                  item.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {format(new Date(item.created_at), 'yyyy-MM-dd')}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => handleEditMarketplaceItem(item)}
                                    className="flex items-center px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                  >
                                    <FaEdit className="mr-1" />
                                    Edit
                                  </button>
                                  {item.status !== 'sold' && (
                                    <button
                                      onClick={() => markItemAsSold(item.id, item.price)}
                                      className="flex items-center px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                                    >
                                      Mark Sold
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteMarketplaceItem(item)}
                                    className="flex items-center px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                  >
                                    <FaTrash className="mr-1" />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* User Listings Supervision Tab */}
                {marketplaceTab === 'supervision' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">User Listings Supervision</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">ITEM</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">SELLER</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">CATEGORY</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">PRICE</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">STATUS</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">DATE</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userListings.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2">
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-sm text-gray-500">{item.description}</div>
                                </div>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">{item.seller_email}</td>
                              <td className="border border-gray-300 px-4 py-2">{item.category}</td>
                              <td className="border border-gray-300 px-4 py-2">€{item.price}</td>
                              <td className="border border-gray-300 px-4 py-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  item.status === 'available' ? 'bg-green-100 text-green-800' :
                                  item.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {format(new Date(item.created_at), 'yyyy-MM-dd')}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                <button
                                  onClick={() => deleteUserListing(item.id)}
                                  className="flex items-center px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                >
                                  <FaTrash className="mr-1" />
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sales History Tab */}
                {marketplaceTab === 'sales' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales History</h3>
                    <p className="text-gray-600 mb-4">
                      Sales data is stored in Supabase. You can access detailed sales reports through the database.
                    </p>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-blue-800">
                        💡 <strong>Tip:</strong> All sales are automatically recorded in the 'sales_history' table in Supabase 
                        when items are marked as sold or purchase requests are accepted.
                      </p>
                    </div>
                  </div>
                )}


              </div>
            )}

            {activeTab === 'schedule' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Schedule Management</h2>
                <p className="text-gray-600 mb-4">Manage city schedules and time slots</p>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={goToPreviousMonth}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Previous
                    </button>
                    <button
                      onClick={goToNextMonth}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Next
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <div key={index} className="text-center text-sm font-medium text-gray-600">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => (
                    <div
                      key={index}
                      onClick={() => handleDateClick(day)}
                      className={`p-2 rounded-md cursor-pointer text-center ${
                        day.isToday ? 'bg-orange-500 text-white font-bold' :
                        day.isCurrentMonth ? 'hover:bg-gray-100' : 'text-gray-400'
                      }`}
                    >
                      {day.date.getDate()}
                      {day.assignedCities.length > 0 && (
                        <div className="mt-1 text-xs text-gray-600">
                          {day.assignedCities.map((city, cityIndex) => (
                            <span key={cityIndex} className="mr-1">
                              {city}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {showCitySelector && selectedDate && (
                  <div className="mt-4 p-4 bg-white rounded-lg shadow-md">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Assign Cities for {format(selectedDate, 'yyyy-MM-dd')}</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {allCities.map(city => (
                        <span
                          key={city}
                          onClick={() => toggleCity(city)}
                          className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                            selectedCities.includes(city)
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {city}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={handleCityAssignment}
                      className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                    >
                      Save Schedule
                    </button>
                    <button
                      onClick={() => setShowCitySelector(false)}
                      className="ml-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pricing' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Pricing Management</h2>
                <div className="space-y-8">
                  {/* Pricing Configs */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Pricing Configurations</h3>
                      <button
                        onClick={() => setShowAddPricingForm(!showAddPricingForm)}
                        className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                      >
                        <FaPlus className="mr-1" />
                        Add Config
                      </button>
                    </div>
                    
                    {/* Add Pricing Config Form */}
                    {showAddPricingForm && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-3">Add New Pricing Configuration</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="Name"
                            value={newPricingConfig.name}
                            onChange={(e) => setNewPricingConfig({...newPricingConfig, name: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <select
                            value={newPricingConfig.category}
                            onChange={(e) => setNewPricingConfig({...newPricingConfig, category: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="house_moving">House Moving</option>
                            <option value="item_transport">Item Transport</option>
                            <option value="marketplace">Marketplace</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Value"
                            value={newPricingConfig.value}
                            onChange={(e) => setNewPricingConfig({...newPricingConfig, value: parseFloat(e.target.value)})}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <input
                            type="text"
                            placeholder="Unit (€, %, etc.)"
                            value={newPricingConfig.unit}
                            onChange={(e) => setNewPricingConfig({...newPricingConfig, unit: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={handleAddPricingConfig}
                            disabled={isUpdating}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                          >
                            {isUpdating ? 'Adding...' : 'Add Config'}
                          </button>
                          <button
                            onClick={() => setShowAddPricingForm(false)}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">NAME</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">CATEGORY</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">VALUE</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">UNIT</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">STATUS</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPricingConfigs.map((config, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2">
                                {editingPricingConfig === config.id ? (
                                  <input
                                    type="text"
                                    value={editPricingConfigData.name}
                                    onChange={(e) => setEditPricingConfigData({...editPricingConfigData, name: e.target.value})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  />
                                ) : (
                                  config.name
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {editingPricingConfig === config.id ? (
                                  <select
                                    value={editPricingConfigData.category}
                                    onChange={(e) => setEditPricingConfigData({...editPricingConfigData, category: e.target.value})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  >
                                    <option value="house_moving">House Moving</option>
                                    <option value="item_transport">Item Transport</option>
                                    <option value="marketplace">Marketplace</option>
                                  </select>
                                ) : (
                                  config.category
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {editingPricingConfig === config.id ? (
                                  <input
                                    type="number"
                                    value={editPricingConfigData.value}
                                    onChange={(e) => setEditPricingConfigData({...editPricingConfigData, value: parseFloat(e.target.value)})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  />
                                ) : (
                                  config.value
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {editingPricingConfig === config.id ? (
                                  <input
                                    type="text"
                                    value={editPricingConfigData.unit}
                                    onChange={(e) => setEditPricingConfigData({...editPricingConfigData, unit: e.target.value})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  />
                                ) : (
                                  config.unit
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {editingPricingConfig === config.id ? (
                                  <select
                                    value={editPricingConfigData.active ? 'true' : 'false'}
                                    onChange={(e) => setEditPricingConfigData({...editPricingConfigData, active: e.target.value === 'true'})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                  </select>
                                ) : (
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    config.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {config.active ? 'Active' : 'Inactive'}
                                  </span>
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {editingPricingConfig === config.id ? (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleSavePricingConfig(config)}
                                      disabled={isUpdating}
                                      className="flex items-center px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-xs"
                                    >
                                      <FaSave className="mr-1" />
                                      {isUpdating ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                      onClick={() => setEditingPricingConfig(null)}
                                      disabled={isUpdating}
                                      className="flex items-center px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs"
                                    >
                                      <FaTimes className="mr-1" />
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleEditPricingConfig(config)}
                                      className="flex items-center px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                    >
                                      <FaEdit className="mr-1" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeletePricingConfig(config)}
                                      className="flex items-center px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                    >
                                      <FaTrash className="mr-1" />
                                      Delete
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

                  {/* City Prices */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">City Base Prices</h3>
                      <button
                        onClick={() => setShowAddCityForm(!showAddCityForm)}
                        className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                      >
                        <FaPlus className="mr-1" />
                        Add City
                      </button>
                    </div>

                    {/* Add City Price Form */}
                    {showAddCityForm && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-3">Add New City Price</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="City Name"
                            value={newCityPrice.city_name}
                            onChange={(e) => setNewCityPrice({...newCityPrice, city_name: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <input
                            type="number"
                            placeholder="Normal Price"
                            value={newCityPrice.normal}
                            onChange={(e) => setNewCityPrice({...newCityPrice, normal: parseFloat(e.target.value)})}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <input
                            type="number"
                            placeholder="City Day Price"
                            value={newCityPrice.city_day}
                            onChange={(e) => setNewCityPrice({...newCityPrice, city_day: parseFloat(e.target.value)})}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <select
                            value={newCityPrice.day_of_week}
                            onChange={(e) => setNewCityPrice({...newCityPrice, day_of_week: parseInt(e.target.value)})}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value={1}>Monday</option>
                            <option value={2}>Tuesday</option>
                            <option value={3}>Wednesday</option>
                            <option value={4}>Thursday</option>
                            <option value={5}>Friday</option>
                            <option value={6}>Saturday</option>
                            <option value={7}>Sunday</option>
                          </select>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={handleAddCityPrice}
                            disabled={isUpdating}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                          >
                            {isUpdating ? 'Adding...' : 'Add City'}
                          </button>
                          <button
                            onClick={() => setShowAddCityForm(false)}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">CITY</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">NORMAL</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">CITY DAY</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">DAY OF WEEK</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cityPrices.map((city, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2">
                                {editingCityPrice === city.id ? (
                                  <input
                                    type="text"
                                    value={editCityPriceData.city_name}
                                    onChange={(e) => setEditCityPriceData({...editCityPriceData, city_name: e.target.value})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  />
                                ) : (
                                  city.city_name
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {editingCityPrice === city.id ? (
                                  <input
                                    type="number"
                                    value={editCityPriceData.normal}
                                    onChange={(e) => setEditCityPriceData({...editCityPriceData, normal: parseFloat(e.target.value)})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  />
                                ) : (
                                  `€${city.normal}`
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {editingCityPrice === city.id ? (
                                  <input
                                    type="number"
                                    value={editCityPriceData.city_day}
                                    onChange={(e) => setEditCityPriceData({...editCityPriceData, city_day: parseFloat(e.target.value)})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  />
                                ) : (
                                  `€${city.city_day}`
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {editingCityPrice === city.id ? (
                                  <select
                                    value={editCityPriceData.day_of_week}
                                    onChange={(e) => setEditCityPriceData({...editCityPriceData, day_of_week: parseInt(e.target.value)})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  >
                                    <option value={1}>Monday</option>
                                    <option value={2}>Tuesday</option>
                                    <option value={3}>Wednesday</option>
                                    <option value={4}>Thursday</option>
                                    <option value={5}>Friday</option>
                                    <option value={6}>Saturday</option>
                                    <option value={7}>Sunday</option>
                                  </select>
                                ) : (
                                  city.day_of_week
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {editingCityPrice === city.id ? (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleSaveCityPrice(city)}
                                      disabled={isUpdating}
                                      className="flex items-center px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-xs"
                                    >
                                      <FaSave className="mr-1" />
                                      {isUpdating ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                      onClick={() => setEditingCityPrice(null)}
                                      disabled={isUpdating}
                                      className="flex items-center px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs"
                                    >
                                      <FaTimes className="mr-1" />
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleEditCityPrice(city)}
                                      className="flex items-center px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                    >
                                      <FaEdit className="mr-1" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCityPrice(city)}
                                      className="flex items-center px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                    >
                                      <FaTrash className="mr-1" />
                                      Delete
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

                  {/* Pricing Multipliers */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Pricing Multipliers</h3>
                      <button
                        onClick={() => setShowAddMultiplierForm(!showAddMultiplierForm)}
                        className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                      >
                        <FaPlus className="mr-1" />
                        Add Multiplier
                      </button>
                    </div>

                    {/* Add Multiplier Form */}
                    {showAddMultiplierForm && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-3">Add New Pricing Multiplier</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="Name"
                            value={newMultiplier.name}
                            onChange={(e) => setNewMultiplier({...newMultiplier, name: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Value"
                            value={newMultiplier.value}
                            onChange={(e) => setNewMultiplier({...newMultiplier, value: parseFloat(e.target.value)})}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <select
                            value={newMultiplier.category}
                            onChange={(e) => setNewMultiplier({...newMultiplier, category: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="house_moving">House Moving</option>
                            <option value="item_transport">Item Transport</option>
                            <option value="marketplace">Marketplace</option>
                          </select>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={handleAddMultiplier}
                            disabled={isUpdating}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                          >
                            {isUpdating ? 'Adding...' : 'Add Multiplier'}
                          </button>
                          <button
                            onClick={() => setShowAddMultiplierForm(false)}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">NAME</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">VALUE</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">CATEGORY</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">STATUS</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pricingMultipliers.map((multiplier, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2">
                                {editingMultiplier === multiplier.id ? (
                                  <input
                                    type="text"
                                    value={editMultiplierData.name}
                                    onChange={(e) => setEditMultiplierData({...editMultiplierData, name: e.target.value})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  />
                                ) : (
                                  multiplier.name
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {editingMultiplier === multiplier.id ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editMultiplierData.value}
                                    onChange={(e) => setEditMultiplierData({...editMultiplierData, value: parseFloat(e.target.value)})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  />
                                ) : (
                                  multiplier.value
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {editingMultiplier === multiplier.id ? (
                                  <select
                                    value={editMultiplierData.category}
                                    onChange={(e) => setEditMultiplierData({...editMultiplierData, category: e.target.value})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  >
                                    <option value="house_moving">House Moving</option>
                                    <option value="item_transport">Item Transport</option>
                                    <option value="marketplace">Marketplace</option>
                                  </select>
                                ) : (
                                  multiplier.category
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {editingMultiplier === multiplier.id ? (
                                  <select
                                    value={editMultiplierData.active ? 'true' : 'false'}
                                    onChange={(e) => setEditMultiplierData({...editMultiplierData, active: e.target.value === 'true'})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                  </select>
                                ) : (
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    multiplier.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {multiplier.active ? 'Active' : 'Inactive'}
                                  </span>
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {editingMultiplier === multiplier.id ? (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleSaveMultiplier(multiplier)}
                                      disabled={isUpdating}
                                      className="flex items-center px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-xs"
                                    >
                                      <FaSave className="mr-1" />
                                      {isUpdating ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                      onClick={() => setEditingMultiplier(null)}
                                      disabled={isUpdating}
                                      className="flex items-center px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs"
                                    >
                                      <FaTimes className="mr-1" />
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleEditMultiplier(multiplier)}
                                      className="flex items-center px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                    >
                                      <FaEdit className="mr-1" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMultiplier(multiplier)}
                                      className="flex items-center px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                    >
                                      <FaTrash className="mr-1" />
                                      Delete
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

                  {/* Distance Pricing Configuration */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Distance Pricing Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Small Distance */}
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-800 mb-2">Small Distance (≤10 km)</h4>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-sm text-green-700">Price per km</label>
                            <input
                              type="number"
                              step="0.01"
                              defaultValue="0.00"
                              className="w-full px-2 py-1 border border-green-300 rounded text-sm"
                              placeholder="€0.00 (Free)"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-green-700">Max Distance</label>
                            <input
                              type="number"
                              defaultValue="10"
                              className="w-full px-2 py-1 border border-green-300 rounded text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Medium Distance */}
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-medium text-yellow-800 mb-2">Medium Distance (10-50 km)</h4>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-sm text-yellow-700">Price per km</label>
                            <input
                              type="number"
                              step="0.01"
                              defaultValue="0.70"
                              className="w-full px-2 py-1 border border-yellow-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-yellow-700">Max Distance</label>
                            <input
                              type="number"
                              defaultValue="50"
                              className="w-full px-2 py-1 border border-yellow-300 rounded text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Long Distance */}
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-medium text-red-800 mb-2">Long Distance (&gt;50 km)</h4>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-sm text-red-700">Price per km</label>
                            <input
                              type="number"
                              step="0.01"
                              defaultValue="0.50"
                              className="w-full px-2 py-1 border border-red-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-red-700">Min Distance</label>
                            <input
                              type="number"
                              defaultValue="50"
                              className="w-full px-2 py-1 border border-red-300 rounded text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Save Distance Pricing
                      </button>
                    </div>
                  </div>

                  {/* Helper Pricing Configuration */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Extra Helper Pricing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Small Move Helper */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-800 mb-3">Small Move Helper</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-blue-700 mb-1">Item Point Limit (Small Move)</label>
                            <input
                              type="number"
                              defaultValue="50"
                              className="w-full px-3 py-2 border border-blue-300 rounded"
                              placeholder="Points threshold"
                            />
                            <p className="text-xs text-blue-600 mt-1">Moves with ≤ this many points are considered small</p>
                          </div>
                          <div>
                            <label className="block text-sm text-blue-700 mb-1">Helper Price (Small Move)</label>
                            <input
                              type="number"
                              step="0.01"
                              defaultValue="25.00"
                              className="w-full px-3 py-2 border border-blue-300 rounded"
                              placeholder="€25.00"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Big Move Helper */}
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="font-medium text-purple-800 mb-3">Big Move Helper</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-purple-700 mb-1">Item Point Limit (Big Move)</label>
                            <input
                              type="number"
                              defaultValue="51"
                              className="w-full px-3 py-2 border border-purple-300 rounded"
                              placeholder="Points threshold"
                            />
                            <p className="text-xs text-purple-600 mt-1">Moves with &gt; this many points are considered big</p>
                          </div>
                          <div>
                            <label className="block text-sm text-purple-700 mb-1">Helper Price (Big Move)</label>
                            <input
                              type="number"
                              step="0.01"
                              defaultValue="45.00"
                              className="w-full px-3 py-2 border border-purple-300 rounded"
                              placeholder="€45.00"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Save Helper Pricing
                      </button>
                    </div>
                  </div>

                  {/* Add-on Services Configuration */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Add-on Service Multipliers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* House Moving Add-ons */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-3">House Moving Add-ons</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Dismantling Service</span>
                            <input type="number" step="0.01" defaultValue="1.2" className="w-16 px-2 py-1 border rounded text-sm" />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Packing Service</span>
                            <input type="number" step="0.01" defaultValue="1.3" className="w-16 px-2 py-1 border rounded text-sm" />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Storage Service</span>
                            <input type="number" step="0.01" defaultValue="1.1" className="w-16 px-2 py-1 border rounded text-sm" />
                          </div>
                        </div>
                      </div>

                      {/* Item Transport Add-ons */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-3">Item Transport Add-ons</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Assembly Service</span>
                            <input type="number" step="0.01" defaultValue="1.15" className="w-16 px-2 py-1 border rounded text-sm" />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Fragile Handling</span>
                            <input type="number" step="0.01" defaultValue="1.25" className="w-16 px-2 py-1 border rounded text-sm" />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Express Delivery</span>
                            <input type="number" step="0.01" defaultValue="1.4" className="w-16 px-2 py-1 border rounded text-sm" />
                          </div>
                        </div>
                      </div>

                      {/* ReHome Marketplace Add-ons */}
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <h4 className="font-medium text-orange-800 mb-3">ReHome Listing Add-ons</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Premium Listing</span>
                            <input type="number" step="0.01" defaultValue="1.5" className="w-16 px-2 py-1 border rounded text-sm" />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Featured Placement</span>
                            <input type="number" step="0.01" defaultValue="1.8" className="w-16 px-2 py-1 border rounded text-sm" />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Professional Photos</span>
                            <input type="number" step="0.01" defaultValue="1.3" className="w-16 px-2 py-1 border rounded text-sm" />
                          </div>
                        </div>
                        <p className="text-xs text-orange-600 mt-2">
                          💡 ReHome listing multipliers are typically higher than transport services
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Save Add-on Multipliers
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'items' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Items Management</h2>
                <div className="space-y-6">
                  {/* Add Furniture Item Form */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Furniture Items</h3>
                      <button
                        onClick={() => setShowAddFurnitureForm(!showAddFurnitureForm)}
                        className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                      >
                        <FaPlus className="mr-1" />
                        Add Item
                      </button>
                    </div>

                    {/* Add Furniture Item Form */}
                    {showAddFurnitureForm && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-3">Add New Furniture Item</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <input
                            type="text"
                            placeholder="Item Name"
                            value={newFurnitureItem.name}
                            onChange={(e) => setNewFurnitureItem({...newFurnitureItem, name: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <select
                            value={newFurnitureItem.category}
                            onChange={(e) => setNewFurnitureItem({...newFurnitureItem, category: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="Bedroom">Bedroom</option>
                            <option value="Living Room">Living Room</option>
                            <option value="Kitchen">Kitchen</option>
                            <option value="Bathroom">Bathroom</option>
                            <option value="Office">Office</option>
                            <option value="Garden">Garden</option>
                            <option value="Other">Other</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Points"
                            value={newFurnitureItem.points}
                            onChange={(e) => setNewFurnitureItem({...newFurnitureItem, points: parseInt(e.target.value)})}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={handleAddFurnitureItem}
                            disabled={isUpdating}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                          >
                            {isUpdating ? 'Adding...' : 'Add Item'}
                          </button>
                          <button
                            onClick={() => setShowAddFurnitureForm(false)}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">NAME</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">CATEGORY</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">POINTS</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">CREATED</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFurnitureItems.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2">
                                {editingFurnitureItem === item.id ? (
                                  <input
                                    type="text"
                                    value={editFurnitureItemData.name}
                                    onChange={(e) => setEditFurnitureItemData({...editFurnitureItemData, name: e.target.value})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  />
                                ) : (
                                  item.name
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {editingFurnitureItem === item.id ? (
                                  <select
                                    value={editFurnitureItemData.category}
                                    onChange={(e) => setEditFurnitureItemData({...editFurnitureItemData, category: e.target.value})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  >
                                    <option value="Bedroom">Bedroom</option>
                                    <option value="Living Room">Living Room</option>
                                    <option value="Kitchen">Kitchen</option>
                                    <option value="Bathroom">Bathroom</option>
                                    <option value="Office">Office</option>
                                    <option value="Garden">Garden</option>
                                    <option value="Other">Other</option>
                                  </select>
                                ) : (
                                  item.category
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {editingFurnitureItem === item.id ? (
                                  <input
                                    type="number"
                                    value={editFurnitureItemData.points}
                                    onChange={(e) => setEditFurnitureItemData({...editFurnitureItemData, points: parseInt(e.target.value)})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  />
                                ) : (
                                  item.points
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {format(new Date(item.created_at), 'yyyy-MM-dd')}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {editingFurnitureItem === item.id ? (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleSaveFurnitureItem(item)}
                                      disabled={isUpdating}
                                      className="flex items-center px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-xs"
                                    >
                                      <FaSave className="mr-1" />
                                      {isUpdating ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                      onClick={() => setEditingFurnitureItem(null)}
                                      disabled={isUpdating}
                                      className="flex items-center px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs"
                                    >
                                      <FaTimes className="mr-1" />
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleEditFurnitureItem(item)}
                                      className="flex items-center px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                    >
                                      <FaEdit className="mr-1" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFurnitureItem(item)}
                                      className="flex items-center px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                    >
                                      <FaTrash className="mr-1" />
                                      Delete
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
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard; 