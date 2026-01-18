import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaBox, FaCalendarAlt, FaPlus, FaSearch, FaTruck, FaTrash, FaEdit, FaCog, FaSave, FaTimes, FaHandshake, FaGlobe, FaExternalLinkAlt, FaTags, FaChartLine, FaUsers } from 'react-icons/fa';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth } from 'date-fns';
import { toast } from 'react-toastify';
import { supabase } from "../../lib/supabaseClient";
import useUserSessionStore from "../../services/state/useUserSessionStore";
import { cityBaseCharges } from "../../lib/constants";
import { CityPrice, MarketplaceItem, CalendarDay, TransportRequest, ItemDonation, SpecialRequest } from '../../types/admin';
import { fetchBlockedDates } from '../../services/blockedDatesService';
import { API_ENDPOINTS } from '../../lib/api/config';
import { 
  adminFetchMarketplaceItemDetails, 
  adminCreateMarketplaceItemDetail, 
  adminUpdateMarketplaceItemDetail, 
  adminDeleteMarketplaceItemDetail,
  MarketplaceItemDetail 
} from '../../services/marketplaceItemDetailsService';
import CalendarSettingsSection from '../../components/admin/CalendarSettingsSection';
import MultiSelectDropdown from '../../components/admin/MultiSelectDropdown';

const requestStatusOptions = ['Open', 'Contacted/ Pending', 'Confirmed', 'Completed', 'Declined'] as const;
type RequestStatus = typeof requestStatusOptions[number];

const AdminDashboard = () => {
  const { user } = useUserSessionStore();
  const [activeTab, setActiveTab] = useState<'marketplace' | 'transport' | 'schedule' | 'pricing' | 'items' | 'requests' | 'sales' | 'users'>('transport');
  const [requestsTab, setRequestsTab] = useState<'donations' | 'special-requests'>('donations');
  const [scheduleTab, setScheduleTab] = useState<'calendar' | 'settings'>('calendar');
  
  // State for all tabs
  const [transportRequests, setTransportRequests] = useState<TransportRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [requestsSearchQuery, setRequestsSearchQuery] = useState('');
  const [requestsStatusFilter, setRequestsStatusFilter] = useState<RequestStatus | 'All'>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Filter states
  const [cityFilter, setCityFilter] = useState<string[]>([]);
  const [pickupCityFilter, setPickupCityFilter] = useState<string[]>([]);
  const [dropoffCityFilter, setDropoffCityFilter] = useState<string[]>([]);
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
  const [cityPrices, setCityPrices] = useState<CityPrice[]>([]);
  
  // Pricing config state loaded from Supabase tables (replaces pricingConfig.json)
  const [jsonPricingConfig, setJsonPricingConfig] = useState({
    distancePricing: {
      smallDistance: { threshold: 0, rate: 0 },
      mediumDistance: { threshold: 0, rate: 0 },
      longDistance: { rate: 0 },
      baseChargeRange: { range: 0, ratePerKm: 0 }
    },
    carryingMultipliers: {
      lowValue: { threshold: 0, multiplier: 0 },
      highValue: { multiplier: 0 }
    },
    assemblyMultipliers: {
      lowValue: { threshold: 0, multiplier: 0 },
      highValue: { multiplier: 0 }
    },
    assemblyPricing: {
      bed: { price: 0 },
      closet: { price: 0 },
      table: { price: 0 },
      sofa: { price: 0 }
    },
    extraHelperPricing: {
      smallMove: { threshold: 0, price: 0 },
      bigMove: { price: 0 }
    },
    discounts: {
      studentDiscount: { percentage: 0 },
      lateBookingFee: { percentage: 0 }
    }
  });
  const [editingJsonConfig, setEditingJsonConfig] = useState<string | null>(null);
  const [editJsonConfigData, setEditJsonConfigData] = useState<any>({});

  const [carryingConfigRows, setCarryingConfigRows] = useState<any[]>([]);
  const [carryingConfigLoading, setCarryingConfigLoading] = useState(false);
  const [editingCarryingConfig, setEditingCarryingConfig] = useState(false);
  const [editCarryingConfigData, setEditCarryingConfigData] = useState({
    multiplier_per_floor: 1.35,
    base_fee: 25,
    base_fee_threshold_points: null as number | null
  });
  
  // Marketplace management state
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  // const [editingMarketplaceItem, setEditingMarketplaceItem] = useState<string | null>(null);

  // Enhanced marketplace management state
  const [userListings, setUserListings] = useState<MarketplaceItem[]>([]);
  const [userListingsSearchQuery, setUserListingsSearchQuery] = useState('');
  // const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [salesHistoryLoading, setSalesHistoryLoading] = useState(false);
  const [salesStatistics, setSalesStatistics] = useState<any>({});
  const [salesStatisticsLoading, setSalesStatisticsLoading] = useState(false);
  const [rehomeOrders, setRehomeOrders] = useState<any[]>([]);
  const [rehomeOrdersLoading, setRehomeOrdersLoading] = useState(false);
  const [marketplaceTab, setMarketplaceTab] = useState<'inventory' | 'supervision' | 'sales' | 'rehome-orders' | 'item-details'>('inventory');

  const filteredRehomeOrders = rehomeOrders.filter(order => {
    return order.status === 'Open' || order.status === 'Pending';
  });

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
  
  // Marketplace item details management state
  const [marketplaceItemDetails, setMarketplaceItemDetails] = useState<MarketplaceItemDetail[]>([]);
  const [marketplaceItemDetailsLoading, setMarketplaceItemDetailsLoading] = useState(false);
  const [editingMarketplaceItemDetail, setEditingMarketplaceItemDetail] = useState<string | null>(null);
  const [editMarketplaceItemDetailData, setEditMarketplaceItemDetailData] = useState<any>({});
  const [newMarketplaceItemDetail, setNewMarketplaceItemDetail] = useState({
    category: '',
    subcategory: '',
    points: 1
  });
  const [showAddMarketplaceItemDetailForm, setShowAddMarketplaceItemDetailForm] = useState(false);
  
  // State for editing
  const [editingTransportRequest, setEditingTransportRequest] = useState<string | null>(null);
  const [editTransportData, setEditTransportData] = useState<any>({});
  // const [editMarketplaceData, setEditMarketplaceData] = useState<any>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [scheduleData, setScheduleData] = useState<{ [key: string]: { city: string, id: string }[] }>({});
  const [blockedDatesMap, setBlockedDatesMap] = useState<{ [key: string]: { id?: string; cities: string[]; reason?: string | null } }>({});
  const [showCitySelector, setShowCitySelector] = useState(false);
  // Bulk assign modal state
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkAssignStartDate, setBulkAssignStartDate] = useState('');
  const [bulkAssignEndDate, setBulkAssignEndDate] = useState('');
  const [bulkAssignCities, setBulkAssignCities] = useState<string[]>([]);

  // Pricing editing state  
  const [editingCityPrice, setEditingCityPrice] = useState<string | null>(null);
  const [editCityPriceData, setEditCityPriceData] = useState<any>({});
  const [newCityPrice, setNewCityPrice] = useState({
    city_name: '',
    normal: 0,
    city_day: 0,
    day_of_week: 1
  });
  const [showAddCityForm, setShowAddCityForm] = useState(false);

  // Transportation request detail state
  const [selectedTransportRequest, setSelectedTransportRequest] = useState<TransportRequest | null>(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);

  // Item donations state
  const [itemDonations, setItemDonations] = useState<ItemDonation[]>([]);
  const [selectedDonation, setSelectedDonation] = useState<ItemDonation | null>(null);
  const [showDonationDetails, setShowDonationDetails] = useState(false);

  // Special requests state
  const [specialRequests, setSpecialRequests] = useState<SpecialRequest[]>([]);
  const [selectedSpecialRequest, setSelectedSpecialRequest] = useState<SpecialRequest | null>(null);
  const [showSpecialRequestDetails, setShowSpecialRequestDetails] = useState(false);
  const [editingDonationId, setEditingDonationId] = useState<number | null>(null);
  const [editingDonationStatus, setEditingDonationStatus] = useState<RequestStatus>('Open');
  const [savingDonationStatusId, setSavingDonationStatusId] = useState<number | null>(null);
  const [modalDonationStatus, setModalDonationStatus] = useState<RequestStatus>('Open');
  const [editingSpecialRequestId, setEditingSpecialRequestId] = useState<number | null>(null);
  const [editingSpecialRequestStatus, setEditingSpecialRequestStatus] = useState<RequestStatus>('Open');
  const [savingSpecialRequestStatusId, setSavingSpecialRequestStatusId] = useState<number | null>(null);
  const [modalSpecialRequestStatus, setModalSpecialRequestStatus] = useState<RequestStatus>('Open');

  // Get all cities from constants
  const allCities = Object.keys(cityBaseCharges);
  const topCityOptions = useMemo(() => {
    return Object.entries(cityBaseCharges)
      .sort((a, b) => {
        const normalDiff = (b[1]?.normal || 0) - (a[1]?.normal || 0);
        return normalDiff !== 0 ? normalDiff : a[0].localeCompare(b[0]);
      })
      .slice(0, 25)
      .map(([cityName]) => cityName);
  }, [cityBaseCharges]);

  // Load data on initial render
  useEffect(() => {
    fetchData();
  }, []);

  // Update calendar when schedule data change
  useEffect(() => {
    setCalendarDays(generateCalendarDays(currentMonth));
  }, [currentMonth, scheduleData, blockedDatesMap]);

  // Generate calendar days
  const generateCalendarDays = (month: Date) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      // Get assigned cities from city_schedules table
      const assignedCitiesFromSchedule = (scheduleData[dateKey] || []).map(entry => entry.city);
      const blockedInfo = blockedDatesMap[dateKey];

      return {
        date: day,
        assignedCities: [...new Set(assignedCitiesFromSchedule)],
        isToday: isToday(day),
        isCurrentMonth: isSameMonth(day, month),
        isPast: day < new Date(new Date().setHours(0, 0, 0, 0)),
        isFuture: day > new Date(new Date().setHours(23, 59, 59, 999)),
        isBlocked: !!blockedInfo && (blockedInfo.cities.length === 0 || blockedInfo.cities.length === allCities.length),
        blockedCities: blockedInfo ? blockedInfo.cities : [],
        blockedReason: blockedInfo?.reason || null
      };
    });
  };

  const normalizeTransportStatus = (status: any): 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'Open' | 'Contacted/ Pending' | 'Confirmed' | 'Completed' | 'Declined' => {
    if (!status) return 'Open';

    const trimmed = String(status).toLowerCase().trim();

    if (trimmed === 'open') return 'Open';
    if (
      trimmed === 'contacted' ||
      trimmed === 'pending' ||
      trimmed === 'contacted/pending' ||
      trimmed === 'contacted pending' ||
      trimmed === 'contacted_pending'
    ) {
      return 'Contacted/ Pending';
    }

    if (trimmed === 'confirmed') return 'Confirmed';
    if (trimmed === 'completed') return 'Completed';
    if (trimmed === 'declined') return 'Declined';
    if (trimmed === 'cancelled') return 'cancelled';

    return 'Open';
  };

  const formatCurrency = (value: number | string | null | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (num === null || num === undefined || Number.isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

  const normalizeRequestStatus = (status: any): RequestStatus => {
    if (!status) return 'Open';
    const trimmed = String(status).toLowerCase().trim();
    if (trimmed === 'open') return 'Open';
    if (
      trimmed === 'contacted' ||
      trimmed === 'pending' ||
      trimmed === 'contacted/ pending'.toLowerCase() ||
      trimmed === 'contacted_pending' ||
      trimmed === 'contacted pending'
    ) {
      return 'Contacted/ Pending';
    }
    if (trimmed === 'confirmed' || trimmed === 'approved') return 'Confirmed';
    if (trimmed === 'completed') return 'Completed';
    if (trimmed === 'declined' || trimmed === 'rejected' || trimmed === 'cancelled' || trimmed === 'canceled') return 'Declined';
    return 'Open';
  };

  const getRequestStatusClasses = (status: RequestStatus) => {
    switch (status) {
      case 'Open':
        return 'bg-gray-100 text-gray-800';
      case 'Contacted/ Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const fetchCarryingConfig = async () => {
    setCarryingConfigLoading(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.ADMIN.CARRYING_CONFIG, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch carrying configuration');
      }

      const payload = await response.json();
      const rows = payload?.data || [];
      setCarryingConfigRows(rows);

      const standard = rows.find((r: any) => r.item_type === 'standard') || rows[0];
      if (standard) {
        setEditCarryingConfigData({
          multiplier_per_floor: parseFloat(standard.multiplier_per_floor ?? 1.35),
          base_fee: parseFloat(standard.base_fee ?? 25),
          base_fee_threshold_points: standard.base_fee_threshold_points === null || standard.base_fee_threshold_points === undefined
            ? null
            : parseFloat(standard.base_fee_threshold_points)
        });
      }
    } catch (error) {
      console.error('Error fetching carrying config:', error);
    } finally {
      setCarryingConfigLoading(false);
    }
  };

  const handleSaveCarryingConfig = async () => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.ADMIN.CARRYING_CONFIG, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          multiplier_per_floor: editCarryingConfigData.multiplier_per_floor,
          base_fee: editCarryingConfigData.base_fee,
          base_fee_threshold_points: editCarryingConfigData.base_fee_threshold_points
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update carrying configuration');
      }

      toast.success('Carrying configuration updated successfully');
      setEditingCarryingConfig(false);
      await fetchCarryingConfig();
    } catch (error) {
      toast.error('Failed to update carrying configuration');
      console.error('Update carrying config error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const safeParseJSON = <T,>(value: any, fallback: T): T => {
    if (!value) return fallback;
    if (Array.isArray(value) || typeof value === 'object') return value as T;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return (parsed ?? fallback) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  };


  // Load schedule data from Supabase
  const loadScheduleData = async () => {
    try {
      console.log('Loading schedule data from city_schedules table...');
      const { data, error } = await supabase
        .from('city_schedules')
        .select('*');

      if (error) {
        console.error('Error loading schedule data:', error);
        return;
      }

      console.log('Raw schedule data from database:', data);

      // Convert to format: { '2024-01-15': [{ city, id }] }
      const scheduleMap: { [key: string]: { city: string, id: string }[] } = {};
      data?.forEach((item: any) => {
        const dateKey = format(new Date(item.date), 'yyyy-MM-dd');
        if (!scheduleMap[dateKey]) {
          scheduleMap[dateKey] = [];
        }
        scheduleMap[dateKey].push({ city: item.city, id: item.id });
      });

      console.log('Processed schedule map:', scheduleMap);
      setScheduleData(scheduleMap);
    } catch (error) {
      console.error('Error loading schedule data:', error);
    }
  };

  const loadBlockedDates = async () => {
    try {
      const blockedDates = await fetchBlockedDates();
      const map: { [key: string]: { id?: string; cities: string[]; reason?: string | null } } = {};
      blockedDates.forEach(bd => {
        map[bd.date] = {
          id: bd.id,
          cities: bd.cities || [],
          reason: bd.reason ?? null
        };
      });
      setBlockedDatesMap(map);
    } catch (error) {
      console.error('Error loading blocked dates:', error);
    }
  };

  // Save schedule data to Supabase
  const saveScheduleData = async (date: string, cities: string[]) => {
    try {


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
    // selectedCities is now an array of city names for the selected date
    const dateKey = format(day.date, 'yyyy-MM-dd');
    setSelectedCities((scheduleData[dateKey] || []).map(entry => entry.city));
    setShowCitySelector(true);
  };

  // Handle city toggle (just update state, no immediate delete)
  const toggleCity = (city: string) => {
    setSelectedCities(prev =>
      prev.includes(city)
        ? prev.filter(c => c !== city)
        : [...prev, city]
    );
  };

  // Handle city assignment (add new, delete removed)
  const handleCityAssignment = async () => {
    if (!selectedDate) return;

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const originalEntries = scheduleData[dateKey] || [];
    const originalCities = originalEntries.map(entry => entry.city);

    // Cities to delete (were in original, but not in selectedCities)
    const citiesToDelete = originalEntries.filter(entry => !selectedCities.includes(entry.city));
    // Cities to add (are in selectedCities, but not in original)
    const citiesToAdd = selectedCities.filter(city => !originalCities.includes(city));

    // Delete removed cities
    for (const entry of citiesToDelete) {
      await deleteScheduleEntry(entry.id);
    }

    // Add new cities
    if (citiesToAdd.length > 0) {
      await saveScheduleData(dateKey, citiesToAdd);
    }

    await loadScheduleData();
    setCalendarDays(generateCalendarDays(currentMonth));
    setShowCitySelector(false);
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
        fetchPricingData(),
        fetchCarryingConfig(),
        fetchMarketplaceData(),
        fetchFurnitureItemsData(),
        fetchMarketplaceItemDetails(),
        fetchSchedule(),
        fetchUserListings(),
        fetchItemDonations(),
        fetchSpecialRequests(),
        fetchSalesHistory(),
        fetchSalesStatistics(),
        fetchRehomeOrders(),
        loadBlockedDates()
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
      const { data: itemMovingData } = await supabase
        .from('item_moving')
        .select('*, order_number')
        .order('created_at', { ascending: false });

      const { data: houseMovingData } = await supabase
        .from('house_moving')
        .select('*, order_number')
        .order('created_at', { ascending: false });

      // Normalize and combine data
      const itemMoving = (itemMovingData || []).map((req: any) => ({
        id: req.id?.toString() || '',
        order_number: req.order_number || '',
        created_at: req.created_at || '',
        customer_email: req.email || '',
        customer_name: (req.firstname || '') + (req.lastname ? ' ' + req.lastname : ''),
        city: req.firstlocation || '',
        date: req.selecteddate || req.selecteddate_start || req.created_at || '',
        status: normalizeTransportStatus(req.status),
        notes: req.notes || '',
        type: 'item-moving' as const,
        // Additional fields from Supabase
        pickuptype: req.pickuptype,
        furnitureitems: safeParseJSON(req.furnitureitems, [] as any[]),
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
        itemvalue: req.itemvalue,
        carryingcost: req.carryingcost,
        disassemblycost: req.disassemblycost,
        distancecost: req.distancecost,
        extrahelpercost: req.extrahelpercost,
        studentdiscount: req.studentdiscount,
        disassembly_items: safeParseJSON(req.disassembly_items, {} as Record<string, any>),
        extra_helper_items: safeParseJSON(req.extra_helper_items, {} as Record<string, any>),
        carrying_service_items: safeParseJSON(req.carrying_service_items, {} as Record<string, any>),
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
        photo_urls: req.photo_urls || [],
      }));

      const houseMoving = (houseMovingData || []).map((req: any) => ({
        id: req.id?.toString() || '',
        order_number: req.order_number || '',
        created_at: req.created_at || '',
        customer_email: req.email || req.customer_email || '',
        customer_name: (req.firstname || '') + (req.lastname ? ' ' + req.lastname : ''),
        city: req.firstlocation || req.city || '',
        date: req.selecteddate || req.selecteddate_start || req.created_at || '',
        status: normalizeTransportStatus(req.status),
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
        itemvalue: req.itemvalue,
        carryingcost: req.carryingcost,
        disassemblycost: req.disassemblycost,
        distancecost: req.distancecost,
        extrahelpercost: req.extrahelpercost,
        studentdiscount: req.studentdiscount,
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
        photo_urls: req.photo_urls || [],
      }));

      setTransportRequests([...itemMoving, ...houseMoving]);
    } catch (error) {
      setTransportRequests([]);
      toast.error('Failed to fetch transport requests');
      console.error(error);
    }
  };
  
  // Fetch pricing data - 
  const fetchPricingData = async () => {
    try {
      // Fetch city prices
      const { data: cityPrices } = await supabase
        .from('city_base_charges')
        .select('*')
        .order('created_at', { ascending: false });
      const citydata = (cityPrices || []).map((req: any) => ({
          id: req.id?.toString() || '',
          created_at: req.created_at || '',
          city_name: req.city_name || '',
          normal: req.normal || '',
          city_day: req.city_day || '',
          day_of_week: req.day_of_week || '',
      }));

      setCityPrices(citydata || []);

      // Fetch current pricing configuration from Supabase table (backend source of truth)
      const { data: pricingConfig } = await supabase
        .from('pricing_config')
        .select('config_value')
        .eq('is_active', true)
        .single();

      if (pricingConfig?.config_value) {
        setJsonPricingConfig(pricingConfig.config_value);
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

  // Fetch marketplace item details
  const fetchMarketplaceItemDetails = async () => {
    try {
      setMarketplaceItemDetailsLoading(true);
      const token = localStorage.getItem('accessToken');
      const data = await adminFetchMarketplaceItemDetails(token || '');
      setMarketplaceItemDetails(data);
    } catch (error) {
      console.error('Error fetching marketplace item details:', error);
    } finally {
      setMarketplaceItemDetailsLoading(false);
    }
  };

  const fetchSalesHistory = async () => {
    try {
      setSalesHistoryLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_ENDPOINTS.ADMIN.SALES_HISTORY}?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setSalesHistory(result.data || []);
      } else {
        console.error('Failed to fetch sales history:', response.status);
        toast.error('Failed to fetch sales history');
      }
    } catch (error) {
      console.error('Error fetching sales history:', error);
      toast.error('Error fetching sales history');
    } finally {
      setSalesHistoryLoading(false);
    }
  };

  const fetchSalesStatistics = async () => {
    try {
      setSalesStatisticsLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(API_ENDPOINTS.ADMIN.SALES_STATISTICS, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setSalesStatistics(result.data || {});
      } else {
        console.error('Failed to fetch sales statistics:', response.status);
      }
    } catch (error) {
      console.error('Error fetching sales statistics:', error);
    } finally {
      setSalesStatisticsLoading(false);
    }
  };

  const fetchRehomeOrders = async () => {
    try {
      setRehomeOrdersLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_ENDPOINTS.ADMIN.REHOME_ORDERS}?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setRehomeOrders(result.data || []);
      } else {
        console.error('Failed to fetch ReHome orders:', response.status);
        toast.error('Failed to fetch ReHome orders');
      }
    } catch (error) {
      console.error('Error fetching ReHome orders:', error);
      toast.error('Error fetching ReHome orders');
    } finally {
      setRehomeOrdersLoading(false);
    }
  };
  
  // Filter functions for Requests tab
  const filteredItemDonations = itemDonations.filter((donation) => {
    const normalizedSearch = requestsSearchQuery.toLowerCase();
    const contactInfo = typeof donation.contact_info === 'string'
      ? (() => {
          try {
            return JSON.parse(donation.contact_info);
          } catch {
            return { firstName: '', lastName: '', email: '', phone: '' };
          }
        })()
      : donation.contact_info || { firstName: '', lastName: '', email: '', phone: '' };

    const matchesSearch =
      contactInfo.firstName?.toLowerCase().includes(normalizedSearch) ||
      contactInfo.lastName?.toLowerCase().includes(normalizedSearch) ||
      contactInfo.email?.toLowerCase().includes(normalizedSearch) ||
      contactInfo.phone?.toLowerCase().includes(normalizedSearch) ||
      (donation.pickup_location || '').toLowerCase().includes(normalizedSearch);

    const normalizedStatus = normalizeRequestStatus(donation.status);
    const matchesStatus = requestsStatusFilter === 'All' || normalizedStatus === requestsStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredSpecialRequests = specialRequests.filter((request) => {
    const normalizedSearch = requestsSearchQuery.toLowerCase();
    const contactInfo = typeof request.contact_info === 'string'
      ? (() => {
          try {
            return JSON.parse(request.contact_info);
          } catch {
            return { email: '', phone: '' };
          }
        })()
      : request.contact_info || { email: '', phone: '' };

    const matchesSearch =
      contactInfo.email?.toLowerCase().includes(normalizedSearch) ||
      contactInfo.phone?.toLowerCase().includes(normalizedSearch) ||
      (request.pickup_location || '').toLowerCase().includes(normalizedSearch) ||
      (request.dropoff_location || '').toLowerCase().includes(normalizedSearch) ||
      (request.request_type || '').toLowerCase().includes(normalizedSearch);

    const normalizedStatus = normalizeRequestStatus(request.status);
    const matchesStatus = requestsStatusFilter === 'All' || normalizedStatus === requestsStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Fetch schedule (placeholder function)
  const fetchSchedule = async () => {
    await loadScheduleData();
  };

  // Filter transport requests based on search and filters
  const filteredTransportRequests = transportRequests.filter(request => {
    const normalizedSearch = searchQuery.toLowerCase();
    const matchesSearch = request.customer_name?.toLowerCase().includes(normalizedSearch) ||
                         request.customer_email?.toLowerCase().includes(normalizedSearch) ||
                         request.city?.toLowerCase().includes(normalizedSearch) ||
                         request.order_number?.toLowerCase().includes(normalizedSearch) ||
                         request.order_number?.toLowerCase().includes(normalizedSearch.replace('#', ''));
    
    const requestCityValue = (request.city || '').toLowerCase();
    const requestPickupValue = (request.firstlocation || '').toLowerCase();
    const requestDropoffValue = (request.secondlocation || '').toLowerCase();

    const matchesCity = cityFilter.length === 0 || cityFilter.some(city => requestCityValue.includes(city.toLowerCase()));
    const matchesPickupCity = pickupCityFilter.length === 0 || pickupCityFilter.some(city => requestPickupValue.includes(city.toLowerCase()));
    const matchesDropoffCity = dropoffCityFilter.length === 0 || dropoffCityFilter.some(city => requestDropoffValue.includes(city.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.type === typeFilter;
    
    const matchesDateRange = !dateRangeFilter.startDate || !dateRangeFilter.endDate || 
                            (new Date(request.date) >= new Date(dateRangeFilter.startDate) && 
                             new Date(request.date) <= new Date(dateRangeFilter.endDate));
    
    return matchesSearch && matchesCity && matchesStatus && matchesType && matchesDateRange && matchesPickupCity && matchesDropoffCity;
  });

  // Filter furniture items based on search and filters
  const filteredFurnitureItems = furnitureItemsData.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = typeFilter === 'all' || item.category === typeFilter;
    
    return matchesSearch && matchesCategory;
  });

  // City options sourced from city base charges to keep filters consistent
  const cityOptions = topCityOptions.length > 0 ? topCityOptions : allCities;

  // Get unique categories for filter dropdown
  const uniqueCategories = [...new Set([
    ...marketplaceItems.map(i => i.category).filter(Boolean),
    ...furnitureItemsData.map(i => i.category).filter(Boolean)
  ])];

  // Clear all filters function
  const clearAllFilters = () => {
    setCityFilter([]);
    setPickupCityFilter([]);
    setDropoffCityFilter([]);
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
      const tableName = request.type === 'item-moving' ? 'item_moving' : 'house_moving';
      
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
      const tableName = request.type === 'item-moving' ? 'item_moving' : 'house_moving';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', request.id);

      if (error) {
        toast.error('Failed to delete request');
        console.error('Delete error:', {
          error,
          tableName,
          requestId: request.id,
          requestType: request.type
        });
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


  // // Handle delete marketplace item
  // const handleDeleteMarketplaceItem = async (item: MarketplaceItem) => {
  //   if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
  //     return;
  //   }

  //   setIsUpdating(true);
  //   try {
  //     const { error } = await supabase
  //       .from('marketplace_furniture')
  //       .delete()
  //       .eq('id', item.id);

  //     if (error) {
  //       toast.error('Failed to delete item');
  //       console.error('Delete error:', error);
  //     } else {
  //       toast.success('Item deleted successfully');
  //       fetchMarketplaceData(); // Refresh data
  //     }
  //   } catch (error) {
  //     toast.error('Failed to delete item');
  //     console.error('Delete error:', error);
  //   } finally {
  //     setIsUpdating(false);
  //   }
  // };



  // Handle edit city price NEEDS UPDATING
  const handleEditCityPrice = (city: CityPrice) => {
    setEditingCityPrice(city.id);
    setEditCityPriceData({
      city_name: city.city_name,
      normal: city.normal,
      city_day: city.city_day,
      day_of_week: city.day_of_week
    });
  };

  // Handle save city price - Client side only
  const handleSaveCityPrice = async (city: CityPrice) => {
    setIsUpdating(true);
    try {
      // Update local state directly
      setCityPrices(prev => prev.map(c => 
        c.id === city.id 
          ? { ...c, ...editCityPriceData }
          : c
      ));

      toast.success('City price updated successfully');
      setEditingCityPrice(null);
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
      const response = await fetch(`${API_ENDPOINTS.PRICING.CITY_BASE_CHARGES}/${city.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete city price');
      }

      toast.success('City price deleted successfully');
    } catch (error) {
      toast.error('Failed to delete city price');
      console.error('Delete error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle add city price - Client side only
  const handleAddCityPrice = async () => {
    setIsUpdating(true);
    try {
      // Add to local state directly
      const newCity: CityPrice = {
        id: Date.now().toString(),
        ...newCityPrice,
        day_of_week: String(newCityPrice.day_of_week), // <-- convert to string
        created_at: new Date().toISOString()
      };

      setCityPrices(prev => [...prev, newCity]);

      toast.success('City price added successfully');
      setShowAddCityForm(false);
      setNewCityPrice({
        city_name: '',
        normal: 0,
        city_day: 0,
        day_of_week: 1
      });
    } catch (error) {
      toast.error('Failed to add city price');
      console.error('Add error:', error);
    } finally {
      setIsUpdating(false);
    }
  };


  // Ha



  // JSON-based pricing config functions
  const handleEditJsonConfig = (configKey: string, subKey: string) => {
    setEditingJsonConfig(`${configKey}.${subKey}`);
    setEditJsonConfigData({
      ...(jsonPricingConfig as any)[configKey][subKey]
    });
  };

  const handleSaveJsonConfig = async (configKey: string, subKey: string) => {
    setIsUpdating(true);
    try {
      // Update the local state
      const updatedConfig = {
        ...jsonPricingConfig,
        [configKey]: {
          ...(jsonPricingConfig as any)[configKey],
          [subKey]: editJsonConfigData
        }
      };
      
      // Send update to backend
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.PRICING.CONFIG}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          config_value: updatedConfig 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update pricing configuration');
      }

      // Update local state only after successful backend update
      setJsonPricingConfig(updatedConfig);
      
      toast.success('Configuration updated successfully');
      setEditingJsonConfig(null);
            
    } catch (error) {
      toast.error('Failed to update configuration');
      console.error('Update error:', error);
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
      // Update in database using Supabase
      const { error } = await supabase
        .from('furniture_items')
        .update({
          name: editFurnitureItemData.name,
          category: editFurnitureItemData.category,
          points: editFurnitureItemData.points
        })
        .eq('id', item.id);

      if (error) {
        throw error;
      }

      toast.success('Furniture item updated successfully');
      setEditingFurnitureItem(null);
      await fetchFurnitureItemsData(); // Refresh data
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
      // Delete from database using Supabase
      const { error } = await supabase
        .from('furniture_items')
        .delete()
        .eq('id', item.id);

      if (error) {
        throw error;
      }

      toast.success('Furniture item deleted successfully');
      await fetchFurnitureItemsData(); // Refresh data
    } catch (error) {
      toast.error('Failed to delete furniture item');
      console.error('Delete error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle add furniture item - Client side only
  const handleAddFurnitureItem = async () => {
    setIsUpdating(true);
    try {
      // Insert into database
      const { error } = await supabase
        .from('furniture_items')
        .insert([{
          name: newFurnitureItem.name,
          category: newFurnitureItem.category,
          points: newFurnitureItem.points,
        created_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        throw error;
      }

      // Refresh the data from database
      await fetchFurnitureItemsData();

      toast.success('Furniture item added successfully');
      setShowAddFurnitureForm(false);
      setNewFurnitureItem({
        name: '',
        category: 'Bedroom',
        points: 0
      });
    } catch (error) {
      toast.error('Failed to add furniture item');
      console.error('Add error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // // Enhanced marketplace management functions - Client side only
  // const handleAddAdminListing = async () => {
  //   setIsUpdating(true);
  //   try {
  //     const newListing: MarketplaceItem = {
  //       id: Date.now().toString(),
  //       name: newAdminListing.name,
  //       description: newAdminListing.description,
  //       price: newAdminListing.price,
  //       category: newAdminListing.category,
  //       status: newAdminListing.status,
  //       seller_email: user?.email || 'admin@rehome.com',
  //       images: newAdminListing.images,
  //       created_at: new Date().toISOString()
  //     };

  //     if (error) {
  //       throw new Error('Failed to add listing');
  //     }

  //     toast.success('Listing added successfully');
  //     setShowAddListingForm(false);
  //     setNewAdminListing({
  //       name: '',
  //       description: '',
  //       price: 0,
  //       category: 'Living Room',
  //       status: 'available',
  //       images: []
  //     });
  //     fetchAdminListings();
  //   } catch (error) {
  //     toast.error('Failed to add listing');
  //     console.error('Add error:', error);
  //   } finally {
  //     setIsUpdating(false);
  //   }
  // };

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

  // Marketplace item details handlers
  const handleEditMarketplaceItemDetail = (item: MarketplaceItemDetail) => {
    setEditingMarketplaceItemDetail(item.id);
    setEditMarketplaceItemDetailData({
      category: item.category,
      subcategory: item.subcategory || '',
      points: item.points,
      is_active: item.is_active
    });
  };

  const handleSaveMarketplaceItemDetail = async (item: MarketplaceItemDetail) => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const updatedItem = await adminUpdateMarketplaceItemDetail(
        token,
        item.id,
        editMarketplaceItemDetailData
      );

      setMarketplaceItemDetails(prev => 
        prev.map(i => i.id === item.id ? updatedItem : i)
      );

      setEditingMarketplaceItemDetail(null);
      setEditMarketplaceItemDetailData({});
      toast.success('Marketplace item detail updated successfully');
    } catch (error) {
      toast.error('Failed to update marketplace item detail');
      console.error('Update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteMarketplaceItemDetail = async (item: MarketplaceItemDetail) => {
    if (!window.confirm('Are you sure you want to delete this marketplace item detail? This action cannot be undone.')) {
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await adminDeleteMarketplaceItemDetail(token, item.id);

      setMarketplaceItemDetails(prev => prev.filter(i => i.id !== item.id));
      toast.success('Marketplace item detail deleted successfully');
    } catch (error) {
      toast.error('Failed to delete marketplace item detail');
      console.error('Delete error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddMarketplaceItemDetail = async () => {
    if (!newMarketplaceItemDetail.category || newMarketplaceItemDetail.points <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const newItem = await adminCreateMarketplaceItemDetail(
        token,
        {
          category: newMarketplaceItemDetail.category,
          subcategory: newMarketplaceItemDetail.subcategory || undefined,
          points: newMarketplaceItemDetail.points
        }
      );

      setMarketplaceItemDetails(prev => [...prev, newItem]);
      setShowAddMarketplaceItemDetailForm(false);
      setNewMarketplaceItemDetail({
        category: '',
        subcategory: '',
        points: 1
      });
      toast.success('Marketplace item detail added successfully');
    } catch (error) {
      toast.error('Failed to add marketplace item detail');
      console.error('Add error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // const markItemAsSold = async (itemId: string, salePrice: number) => {
  //   setIsUpdating(true);
  //   try {
  //     // Update item status
  //     const { error: updateError } = await supabase
  //       .from('marketplace_furniture')
  //       .update({ status: 'sold' })
  //       .eq('id', itemId);

  //     if (updateError) {
  //       throw new Error('Failed to mark as sold');
  //     }

  //     // Add to sales history
  //     const item = adminListings.find(i => i.id === itemId);
  //     if (item) {
  //       const { error: salesError } = await supabase
  //         .from('sales_history')
  //         .insert([{
  //           item_id: itemId,
  //           item_name: item.name,
  //           buyer_email: 'direct_sale',
  //           sale_price: salePrice,
  //           original_price: item.price,
  //           sale_date: new Date().toISOString()
  //         }]);

  //       if (salesError) {
  //         console.error('Error adding to sales history:', salesError);
  //       }
  //     }

  //     toast.success('Item marked as sold');
  //     fetchAdminListings();
  //   } catch (error) {
  //     toast.error('Failed to mark as sold');
  //     console.error('Update error:', error);
  //   } finally {
  //     setIsUpdating(false);
  //   }
  // };

  // Show detailed view of transportation request
  const handleViewRequestDetails = async (request: TransportRequest) => {
    setSelectedTransportRequest(request);
    
    // Fetch additional details from Supabase if needed
    try {
      const tableName = request.type === 'item-moving' ? 'item_moving' : 'house_moving';
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

  // Fetch item donations
  const fetchItemDonations = async () => {
    try {
      const { data, error } = await supabase
        .from('item_donations')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Fetched item donations:', data);
      if (error) {
        console.error('Error fetching item donations:', error);
        setItemDonations([]);
      } else {
        setItemDonations(data || []);
        console.log('Fetched item donations:', data);
      }
    } catch (error) {
      console.error('Error fetching item donations:', error);
      setItemDonations([]);
    }
  };

  // Fetch special requests
  const fetchSpecialRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching special requests:', error);
        setSpecialRequests([]);
      } else {
        setSpecialRequests(data || []);
        console.log('Fetched special requests:', data);
      }
    } catch (error) {
      console.error('Error fetching special requests:', error);
      setSpecialRequests([]);
    }
  };

  // Handle view donation details
  const handleViewDonationDetails = (donation: ItemDonation) => {
    setSelectedDonation(donation);
    setModalDonationStatus(normalizeRequestStatus(donation.status));
    setShowDonationDetails(true);
  };

  // Handle view special request details
  const handleViewSpecialRequestDetails = (request: SpecialRequest) => {
    setSelectedSpecialRequest(request);
    setModalSpecialRequestStatus(normalizeRequestStatus(request.status));
    setShowSpecialRequestDetails(true);
  };

  const updateDonationStatus = async (donationId: number, status: RequestStatus, onSuccess?: () => void) => {
    setSavingDonationStatusId(donationId);
    try {
      const { error } = await supabase
        .from('item_donations')
        .update({ status })
        .eq('id', donationId);

      if (error) throw error;

      setItemDonations(prev =>
        prev.map(donation => donation.id === donationId ? { ...donation, status } : donation)
      );
      if (selectedDonation?.id === donationId) {
        setSelectedDonation(prev => prev ? { ...prev, status } : prev);
      }
      toast.success('Donation status updated');
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to update donation status');
      console.error('Donation status update error:', error);
    } finally {
      setSavingDonationStatusId(null);
    }
  };

  const handleStartDonationStatusEdit = (donation: ItemDonation) => {
    setEditingDonationId(donation.id);
    setEditingDonationStatus(normalizeRequestStatus(donation.status));
  };

  const handleSaveDonationStatus = async (donationId: number, status?: RequestStatus) => {
    await updateDonationStatus(donationId, status ?? editingDonationStatus, () => setEditingDonationId(null));
  };

  const handleCancelDonationStatusEdit = () => {
    setEditingDonationId(null);
  };

  const handleSaveDonationStatusFromModal = async () => {
    if (!selectedDonation) return;
    await updateDonationStatus(selectedDonation.id, modalDonationStatus);
  };

  const updateSpecialRequestStatus = async (requestId: number, status: RequestStatus, onSuccess?: () => void) => {
    setSavingSpecialRequestStatusId(requestId);
    try {
      const { error } = await supabase
        .from('services')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      setSpecialRequests(prev =>
        prev.map(request => request.id === requestId ? { ...request, status } : request)
      );
      if (selectedSpecialRequest?.id === requestId) {
        setSelectedSpecialRequest(prev => prev ? { ...prev, status } : prev);
      }
      toast.success('Special request status updated');
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to update special request status');
      console.error('Special request status update error:', error);
    } finally {
      setSavingSpecialRequestStatusId(null);
    }
  };

  const handleStartSpecialRequestStatusEdit = (request: SpecialRequest) => {
    setEditingSpecialRequestId(request.id);
    setEditingSpecialRequestStatus(normalizeRequestStatus(request.status));
  };

  const handleCancelSpecialRequestStatusEdit = () => {
    setEditingSpecialRequestId(null);
  };

  const handleSaveSpecialRequestStatusFromModal = async () => {
    if (!selectedSpecialRequest) return;
    await updateSpecialRequestStatus(selectedSpecialRequest.id, modalSpecialRequestStatus);
  };

  // Handle bulk city assignment
  const handleBulkAssignCities = async () => {
    if (!bulkAssignStartDate || !bulkAssignEndDate || bulkAssignCities.length === 0) {
      toast.error('Please select a start date, end date, and at least one city.');
      return;
    }

    // Validate dates are in 2025
    const start = new Date(bulkAssignStartDate);
    const end = new Date(bulkAssignEndDate);
    
    if (start.getFullYear() !== 2025 || end.getFullYear() !== 2025) {
      toast.error('Please select dates within 2025.');
      return;
    }

    if (start > end) {
      toast.error('Start date must be before end date.');
      return;
    }

    setIsUpdating(true);
    try {
      const days = eachDayOfInterval({ start, end });
      for (const day of days) {
        const dateKey = format(day, 'yyyy-MM-dd');
        await saveScheduleData(dateKey, bulkAssignCities);
      }
      toast.success('Cities assigned to selected date range!');
      setShowBulkAssignModal(false);
      setBulkAssignStartDate('');
      setBulkAssignEndDate('');
      setBulkAssignCities([]);
      await loadScheduleData();
      setCalendarDays(generateCalendarDays(currentMonth));
    } catch (error) {
      toast.error('Failed to assign cities to date range');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete a city schedule entry from Supabase by id
  const deleteScheduleEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('city_schedules')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Failed to delete schedule entry');
        console.error('Delete error:', error);
        return;
      }

      toast.success('Schedule entry deleted successfully');
      await loadScheduleData();
      setCalendarDays(generateCalendarDays(currentMonth));
    } catch (error) {
      toast.error('Failed to delete schedule entry');
      console.error('Delete error:', error);
    }
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
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'requests'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaHandshake className="mr-2" />
              Requests
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'sales'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaChartLine className="mr-2" />
              Sales History
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaUsers className="mr-2" />
              User Management
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
                    placeholder="Search by name, email, city, or order #"
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
                {(cityFilter.length > 0 || pickupCityFilter.length > 0 || dropoffCityFilter.length > 0 || statusFilter !== 'all' || typeFilter !== 'all' || 
                  dateRangeFilter.startDate || priceRangeFilter.minPrice) && (
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                  <MultiSelectDropdown
                    label="City"
                    options={cityOptions}
                    selected={cityFilter}
                    onChange={setCityFilter}
                    placeholder="Select cities"
                    searchPlaceholder="Search cities..."
                  />

                  <MultiSelectDropdown
                    label="Pickup City"
                    options={cityOptions}
                    selected={pickupCityFilter}
                    onChange={setPickupCityFilter}
                    placeholder="Select pickup cities"
                    searchPlaceholder="Search cities..."
                  />

                  <MultiSelectDropdown
                    label="Dropoff City"
                    options={cityOptions}
                    selected={dropoffCityFilter}
                    onChange={setDropoffCityFilter}
                    placeholder="Select dropoff cities"
                    searchPlaceholder="Search cities..."
                  />

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
                          <option value="Open">Open</option>
                          <option value="Contacted/ Pending">Contacted/ Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Completed">Completed</option>
                          <option value="Declined">Declined</option>
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
              {(cityFilter.length > 0 || pickupCityFilter.length > 0 || dropoffCityFilter.length > 0 || statusFilter !== 'all' || typeFilter !== 'all' || 
                dateRangeFilter.startDate || priceRangeFilter.minPrice) && (
                <div className="flex flex-wrap gap-2">
                  {cityFilter.length > 0 && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      City: {cityFilter.join(', ')}
                    </span>
                  )}
                  {pickupCityFilter.length > 0 && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-sm">
                      Pickup: {pickupCityFilter.join(', ')}
                    </span>
                  )}
                  {dropoffCityFilter.length > 0 && (
                    <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded text-sm">
                      Dropoff: {dropoffCityFilter.join(', ')}
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
                        <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">ORDER #</th>
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
                        <tr
                          key={index}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            if (editingTransportRequest !== request.id) {
                              handleViewRequestDetails(request);
                            }
                          }}
                        >
                          <td className="border border-gray-300 px-3 py-2 text-xs font-medium">
                            {request.order_number ? `#${request.order_number}` : request.id ? `#${request.id}` : '—'}
                          </td>
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
                            <div className="font-semibold text-orange-600">€{formatCurrency(request.estimatedprice)}</div>
                            <div className="text-[11px] text-gray-500">Base €{formatCurrency(request.baseprice)}</div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-xs">
                            {request.furnitureitems && request.furnitureitems.length > 0 ? (
                              <div>
                                <span className="font-medium">{request.furnitureitems.length} item(s)</span>
                                <span className="text-gray-500 text-[11px] ml-1">{request.itempoints || 0} pts</span>
                              </div>
                            ) : (
                              <span className="text-gray-500">{request.customitem || '—'}</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            {editingTransportRequest === request.id ? (
                              <select
                                value={editTransportData.status}
                                onChange={(e) => setEditTransportData({...editTransportData, status: e.target.value})}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
                              >
                                <option value="Open">Open</option>
                                <option value="Contacted/ Pending">Contacted/ Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Completed">Completed</option>
                                <option value="Declined">Declined</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                request.status === 'Open' ? 'bg-gray-100 text-gray-800' :
                                request.status === 'Contacted/ Pending' ? 'bg-yellow-100 text-yellow-800' :
                                request.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                                request.status === 'Completed' ? 'bg-green-100 text-green-800' :
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveTransportRequest(request);
                                  }}
                                  disabled={isUpdating}
                                  className="flex items-center px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-xs"
                                >
                                  <FaSave className="mr-1" />
                                  {isUpdating ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTransportRequest(null);
                                  }}
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewRequestDetails(request);
                                  }}
                                  className="flex items-center px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                                >
                                  <FaSearch className="mr-1" />
                                  View
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTransportRequest(request);
                                  }}
                                  className="flex items-center px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                >
                                  <FaEdit className="mr-1" />
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTransportRequest(request);
                                  }}
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

                {/* Transportation Request Details Modal - Enhanced */}
                {showRequestDetails && selectedTransportRequest && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-6 pb-4 border-b">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-800">
                              {selectedTransportRequest.type === 'item-moving' ? 'Item Moving' : 'House Moving'} Request
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Request #{selectedTransportRequest.order_number || selectedTransportRequest.id}
                            </p>
                          </div>
                          <button
                            onClick={() => setShowRequestDetails(false)}
                            className="text-gray-500 hover:text-gray-700 p-2"
                          >
                            <FaTimes size={24} />
                          </button>
                        </div>

                        <div className="space-y-6">
                          {/* Customer Information */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">1</span>
                              Customer Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Name</p>
                                <p className="font-medium">{(selectedTransportRequest as any).firstname} {(selectedTransportRequest as any).lastname}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-medium">{selectedTransportRequest.customer_email}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Phone</p>
                                <p className="font-medium">{(selectedTransportRequest as any).phone || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                  selectedTransportRequest.status === 'Open' ? 'bg-gray-100 text-gray-800' :
                                  selectedTransportRequest.status === 'Contacted/ Pending' ? 'bg-yellow-100 text-yellow-800' :
                                  selectedTransportRequest.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                                  selectedTransportRequest.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {selectedTransportRequest.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Location & Service Details */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">2</span>
                              Location & Service Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Pickup Type</p>
                                <p className="font-medium capitalize">{(selectedTransportRequest as any).pickuptype || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Date</p>
                                <p className="font-medium">
                                  {(selectedTransportRequest as any).selecteddate_start && (selectedTransportRequest as any).selecteddate_end ? 
                                    `${format(new Date((selectedTransportRequest as any).selecteddate_start), 'MMM dd, yyyy')} - ${format(new Date((selectedTransportRequest as any).selecteddate_end), 'MMM dd, yyyy')}` :
                                    (selectedTransportRequest as any).selecteddate_start ? 
                                    format(new Date((selectedTransportRequest as any).selecteddate_start), 'MMM dd, yyyy') :
                                    (selectedTransportRequest as any).selecteddate ? 
                                    format(new Date((selectedTransportRequest as any).selecteddate), 'MMM dd, yyyy') : 'Flexible'}
                                  {(selectedTransportRequest as any).isdateflexible && !((selectedTransportRequest as any).selecteddate_start && (selectedTransportRequest as any).selecteddate_end) && ' (Flexible)'}
                                </p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-sm text-gray-600">From (Pickup)</p>
                                <p className="font-medium">{(selectedTransportRequest as any).firstlocation || 'N/A'}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Floor: {(selectedTransportRequest as any).floorpickup || 0} | 
                                  Elevator: {(selectedTransportRequest as any).elevatorpickup || (selectedTransportRequest as any).elevator_pickup ? 'Yes' : 'No'}
                                </p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-sm text-gray-600">To (Dropoff)</p>
                                <p className="font-medium">{(selectedTransportRequest as any).secondlocation || 'N/A'}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Floor: {(selectedTransportRequest as any).floordropoff || 0} | 
                                  Elevator: {(selectedTransportRequest as any).elevatordropoff || (selectedTransportRequest as any).elevator_dropoff ? 'Yes' : 'No'}
                                </p>
                              </div>
                              {(selectedTransportRequest as any).calculated_distance_km && (
                                <div>
                                  <p className="text-sm text-gray-600">Distance</p>
                                  <p className="font-medium">{parseFloat((selectedTransportRequest as any).calculated_distance_km).toFixed(2)} km</p>
                                </div>
                              )}
                              {((selectedTransportRequest as any).preferredtimespan || (selectedTransportRequest as any).preferred_time_span) && (
                                <div>
                                  <p className="text-sm text-gray-600">Preferred Time</p>
                                  <p className="font-medium">{(selectedTransportRequest as any).preferredtimespan || (selectedTransportRequest as any).preferred_time_span}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Full Item List with Add-ons */}
                          {(selectedTransportRequest as any).furnitureitems && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">3</span>
                                Item List
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="bg-gray-200">
                                      <th className="border border-gray-300 px-3 py-2 text-left text-sm">Item</th>
                                      <th className="border border-gray-300 px-3 py-2 text-center text-sm">Qty</th>
                                      <th className="border border-gray-300 px-3 py-2 text-center text-sm">Points</th>
                                      <th className="border border-gray-300 px-3 py-2 text-left text-sm">Add-ons</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(() => {
                                      const furnitureItemsArray = typeof (selectedTransportRequest as any).furnitureitems === 'string' ? 
                                        JSON.parse((selectedTransportRequest as any).furnitureitems) : 
                                        (selectedTransportRequest as any).furnitureitems;
                                      
                                      const disassemblyItems = (selectedTransportRequest as any).disassembly_items;
                                      const carryingItems = (selectedTransportRequest as any).carrying_service_items;
                                      const helperItems = (selectedTransportRequest as any).extra_helper_items;
                                      
                                      let parsedDisassembly: any = {};
                                      let parsedCarrying: any = {};
                                      let parsedHelper: any = {};
                                      
                                      try {
                                        parsedDisassembly = typeof disassemblyItems === 'string' ? JSON.parse(disassemblyItems) : disassemblyItems || {};
                                      } catch {}
                                      try {
                                        parsedCarrying = typeof carryingItems === 'string' ? JSON.parse(carryingItems) : carryingItems || {};
                                      } catch {}
                                      try {
                                        parsedHelper = typeof helperItems === 'string' ? JSON.parse(helperItems) : helperItems || {};
                                      } catch {}
                                      
                                      // Collect all UUIDs from all add-on objects to reconstruct the original item order
                                      const allUUIDs = new Set<string>();
                                      Object.keys(parsedDisassembly).forEach(k => allUUIDs.add(k));
                                      Object.keys(parsedCarrying).forEach(k => allUUIDs.add(k));
                                      Object.keys(parsedHelper).forEach(k => allUUIDs.add(k));
                                      
                                      // Convert to array to maintain order (Object.keys maintains insertion order in modern JS)
                                      const orderedUUIDs = Array.from(allUUIDs);
                                      
                                      return furnitureItemsArray.map((item: any, index: number) => {
                                        // The furniture items array is created from Object.entries(itemQuantities).filter(...).map(...)
                                        // The add-on objects use the same UUIDs from itemQuantities
                                        // We match by assuming the nth item corresponds to the nth UUID in the ordered list
                                        
                                        let hasDisassembly = false;
                                        let hasCarrying = false;
                                        let hasHelper = false;
                                        
                                        // Get the UUID that should correspond to this item based on position
                                        const correspondingUUID = orderedUUIDs[index];
                                        
                                        if (correspondingUUID) {
                                          hasDisassembly = parsedDisassembly[correspondingUUID] === true;
                                          hasCarrying = parsedCarrying[correspondingUUID] === true;
                                          hasHelper = parsedHelper[correspondingUUID] === true;
                                        }
                                        
                                        // Also check by item name (fallback for old data or if UUIDs don't match)
                                        if (parsedDisassembly[item.name]) hasDisassembly = true;
                                        if (parsedCarrying[item.name]) hasCarrying = true;
                                        if (parsedHelper[item.name]) hasHelper = true;
                                        
                                        return (
                                          <tr key={index} className="hover:bg-gray-100">
                                            <td className="border border-gray-300 px-3 py-2 text-sm">{item.name || 'N/A'}</td>
                                            <td className="border border-gray-300 px-3 py-2 text-center text-sm">{item.quantity || 1}</td>
                                            <td className="border border-gray-300 px-3 py-2 text-center text-sm">{item.points || item.value || 0}</td>
                                            <td className="border border-gray-300 px-3 py-2 text-sm">
                                              <div className="flex flex-wrap gap-1">
                                                {hasDisassembly && (
                                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">Disassembly</span>
                                                )}
                                                {hasCarrying && (
                                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">Carrying</span>
                                                )}
                                                {hasHelper && (
                                                  <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">Helper</span>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      });
                                    })()}
                                  </tbody>
                                </table>
                              </div>
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-sm text-gray-600">Total Points: <span className="font-semibold">{(selectedTransportRequest as any).itempoints || 0}</span></p>
                              </div>
                            </div>
                          )}

                          {/* Price Breakdown */}
                          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
                            <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">4</span>
                              Your Price Estimate
                            </h4>
                            <div className="space-y-3">
                              {/* Base Price Section */}
                              {(selectedTransportRequest as any).baseprice !== undefined && (selectedTransportRequest as any).baseprice !== null && (
                                <div>
                                  <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-700 font-medium">Base Price:</span>
                                    <span className="font-semibold">€{parseFloat((selectedTransportRequest as any).baseprice).toFixed(2)}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">Standard rate for your route and date</div>
                                </div>
                              )}

                              {/* Items Section */}
                              {(selectedTransportRequest as any).furnitureitems && (selectedTransportRequest as any).furnitureitems.length > 0 && (
                                <div>
                                  <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-700 font-medium">Items:</span>
                                    <span className="font-semibold">€{parseFloat((selectedTransportRequest as any).itemvalue || 0).toFixed(2)}</span>
                                  </div>
                                  <div className="mt-2 space-y-1">
                                    {(selectedTransportRequest as any).furnitureitems.map((item: any, idx: number) => (
                                      <div key={idx} className="flex justify-between text-xs text-gray-600">
                                        <span>• {item.name || item.title || 'Item'} ({item.quantity || 1}x)</span>
                                        <span>{item.points || 0} pts</span>
                                      </div>
                                    ))}
                                    <div className="text-xs text-gray-500 mt-1">Total Points: {(selectedTransportRequest as any).itempoints || 0}</div>
                                  </div>
                                </div>
                              )}

                              {/* Distance Section */}
                              {(selectedTransportRequest as any).distancecost !== undefined && (selectedTransportRequest as any).distancecost !== null && (
                                <div>
                                  <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-700 font-medium">Distance ({(selectedTransportRequest as any).calculated_distance_km ? parseFloat((selectedTransportRequest as any).calculated_distance_km).toFixed(2) : '0'} km):</span>
                                    <span className="font-semibold">€{parseFloat((selectedTransportRequest as any).distancecost).toFixed(2)}</span>
                                  </div>
                                </div>
                              )}

                              {/* Extra Helper Section */}
                              {(selectedTransportRequest as any).extrahelpercost !== undefined && (selectedTransportRequest as any).extrahelpercost !== null && (
                                <div>
                                  <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-700 font-medium">Extra Helper:</span>
                                    <span className="font-semibold">€{parseFloat((selectedTransportRequest as any).extrahelpercost).toFixed(2)}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Extra Helper: {parseFloat((selectedTransportRequest as any).extrahelpercost) > 0 ? 'Yes' : 'No'}
                                  </div>
                                </div>
                              )}

                              {/* Carrying Service Section */}
                              {(selectedTransportRequest as any).carryingcost !== undefined && (selectedTransportRequest as any).carryingcost !== null && parseFloat((selectedTransportRequest as any).carryingcost) > 0 && (
                                <div>
                                  <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-700 font-medium">Carrying Service:</span>
                                    <span className="font-semibold">€{parseFloat((selectedTransportRequest as any).carryingcost).toFixed(2)}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    <div>Floor carrying assistance</div>
                                    {((selectedTransportRequest as any).floorpickup > 0 || (selectedTransportRequest as any).floordropoff > 0) && (
                                      <div className="mt-1">
                                        {(selectedTransportRequest as any).floorpickup > 0 && (
                                          <div>• Pickup: Floor {(selectedTransportRequest as any).floorpickup} {(selectedTransportRequest as any).elevatorpickup ? '(with elevator)' : '(stairs)'}</div>
                                        )}
                                        {(selectedTransportRequest as any).floordropoff > 0 && (
                                          <div>• Dropoff: Floor {(selectedTransportRequest as any).floordropoff} {(selectedTransportRequest as any).elevatordropoff ? '(with elevator)' : '(stairs)'}</div>
                                        )}
                                      </div>
                                    )}
                                    {(() => {
                                      const carryingItems = (selectedTransportRequest as any).carrying_service_items;
                                      let parsedCarrying: any = {};
                                      try {
                                        parsedCarrying = typeof carryingItems === 'string' ? JSON.parse(carryingItems) : carryingItems || {};
                                      } catch {}
                                      
                                      const carryingUUIDs = Object.keys(parsedCarrying).filter(k => parsedCarrying[k] === true);
                                      
                                      if (carryingUUIDs.length > 0 && (selectedTransportRequest as any).furnitureitems) {
                                        const furnitureItemsArray = typeof (selectedTransportRequest as any).furnitureitems === 'string' ? 
                                          JSON.parse((selectedTransportRequest as any).furnitureitems) : 
                                          (selectedTransportRequest as any).furnitureitems;
                                        
                                        const allUUIDs = new Set<string>();
                                        Object.keys(parsedCarrying).forEach(k => allUUIDs.add(k));
                                        const orderedUUIDs = Array.from(allUUIDs);
                                        
                                        const itemsWithCarrying = furnitureItemsArray
                                          .map((item: any, index: number) => {
                                            const correspondingUUID = orderedUUIDs[index];
                                            const hasCarrying = correspondingUUID && parsedCarrying[correspondingUUID] === true;
                                            return hasCarrying ? item.name : null;
                                          })
                                          .filter((name: string | null) => name !== null);
                                        
                                        if (itemsWithCarrying.length > 0) {
                                          return (
                                            <div className="mt-1">
                                              <div className="font-medium">Items with carrying service:</div>
                                              {itemsWithCarrying.map((name: string, idx: number) => (
                                                <div key={idx}>• {name}</div>
                                              ))}
                                            </div>
                                          );
                                        }
                                      }
                                      return null;
                                    })()}
                                  </div>
                                </div>
                              )}

                              {/* Assembly/Disassembly Section */}
                              {(selectedTransportRequest as any).disassemblycost !== undefined && (selectedTransportRequest as any).disassemblycost !== null && parseFloat((selectedTransportRequest as any).disassemblycost) > 0 && (
                                <div>
                                  <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-700 font-medium">Assembly & Disassembly:</span>
                                    <span className="font-semibold">€{parseFloat((selectedTransportRequest as any).disassemblycost).toFixed(2)}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    <div>Professional assembly/disassembly service</div>
                                    {(() => {
                                      const disassemblyItems = (selectedTransportRequest as any).disassembly_items;
                                      let parsedDisassembly: any = {};
                                      try {
                                        parsedDisassembly = typeof disassemblyItems === 'string' ? JSON.parse(disassemblyItems) : disassemblyItems || {};
                                      } catch {}
                                      
                                      const disassemblyUUIDs = Object.keys(parsedDisassembly).filter(k => parsedDisassembly[k] === true);
                                      
                                      if (disassemblyUUIDs.length > 0 && (selectedTransportRequest as any).furnitureitems) {
                                        const furnitureItemsArray = typeof (selectedTransportRequest as any).furnitureitems === 'string' ? 
                                          JSON.parse((selectedTransportRequest as any).furnitureitems) : 
                                          (selectedTransportRequest as any).furnitureitems;
                                        
                                        const allUUIDs = new Set<string>();
                                        Object.keys(parsedDisassembly).forEach(k => allUUIDs.add(k));
                                        const orderedUUIDs = Array.from(allUUIDs);
                                        
                                        const itemsWithDisassembly = furnitureItemsArray
                                          .map((item: any, index: number) => {
                                            const correspondingUUID = orderedUUIDs[index];
                                            const hasDisassembly = correspondingUUID && parsedDisassembly[correspondingUUID] === true;
                                            return hasDisassembly ? item.name : null;
                                          })
                                          .filter((name: string | null) => name !== null);
                                        
                                        if (itemsWithDisassembly.length > 0) {
                                          return (
                                            <div className="mt-1">
                                              <div className="font-medium">Items requiring assembly/disassembly:</div>
                                              {itemsWithDisassembly.map((name: string, idx: number) => (
                                                <div key={idx}>• {name}</div>
                                              ))}
                                            </div>
                                          );
                                        }
                                      }
                                      return null;
                                    })()}
                                  </div>
                                </div>
                              )}

                              {/* Subtotal */}
                              {(() => {
                                const parts = [
                                  parseFloat((selectedTransportRequest as any).baseprice || 0),
                                  parseFloat((selectedTransportRequest as any).itemvalue || 0),
                                  parseFloat((selectedTransportRequest as any).distancecost || 0),
                                  parseFloat((selectedTransportRequest as any).carryingcost || 0),
                                  parseFloat((selectedTransportRequest as any).disassemblycost || 0),
                                  parseFloat((selectedTransportRequest as any).extrahelpercost || 0)
                                ];
                                const subtotal = parts.reduce((acc, val) => acc + (Number.isFinite(val) ? val : 0), 0);
                                if (subtotal > 0) {
                                  return (
                                    <div className="flex justify-between text-gray-700">
                                      <span className="font-medium">Subtotal:</span>
                                      <span className="font-semibold">€{subtotal.toFixed(2)}</span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}

                              {/* Student Discount */}
                              {(((selectedTransportRequest as any).isstudent || (selectedTransportRequest as any).is_student) && (selectedTransportRequest as any).studentdiscount) && (
                                <div className="flex justify-between text-green-700">
                                  <span className="font-medium">Student Discount (8.85%):</span>
                                  <span className="font-semibold">-€{parseFloat((selectedTransportRequest as any).studentdiscount).toFixed(2)}</span>
                                </div>
                              )}

                              {/* Other Charges if any */}
                              {(() => {
                                const parts = [
                                  parseFloat((selectedTransportRequest as any).baseprice || 0),
                                  parseFloat((selectedTransportRequest as any).itemvalue || 0),
                                  parseFloat((selectedTransportRequest as any).distancecost || 0),
                                  parseFloat((selectedTransportRequest as any).carryingcost || 0),
                                  parseFloat((selectedTransportRequest as any).disassemblycost || 0),
                                  parseFloat((selectedTransportRequest as any).extrahelpercost || 0),
                                  -parseFloat((selectedTransportRequest as any).studentdiscount || 0)
                                ];
                                const total = parseFloat((selectedTransportRequest as any).estimatedprice || 0);
                                const partsSum = parts.reduce((acc, val) => acc + (Number.isFinite(val) ? val : 0), 0);
                                const difference = +(total - partsSum).toFixed(2);
                                if (Math.abs(difference) >= 0.01) {
                                  return (
                                    <div className="flex justify-between text-xs text-gray-600">
                                      <span>Other Charges:</span>
                                      <span>€{difference.toFixed(2)}</span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}

                              {/* Total */}
                              <div className="border-t-2 border-orange-400 pt-3 mt-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-xl font-bold text-gray-800">Total:</span>
                                  <span className="text-2xl font-bold text-orange-600">€{parseFloat((selectedTransportRequest as any).estimatedprice || 0).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Extra Information */}
                          {((selectedTransportRequest as any).extra_instructions || selectedTransportRequest.notes || (selectedTransportRequest as any).customitem) && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">5</span>
                                Extra Information
                              </h4>
                              <div className="space-y-3">
                                {(selectedTransportRequest as any).customitem && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700">Custom Item:</p>
                                    <p className="text-gray-600 mt-1">{(selectedTransportRequest as any).customitem}</p>
                                  </div>
                                )}
                                {(selectedTransportRequest as any).extra_instructions && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700">Extra Instructions:</p>
                                    <p className="text-gray-600 mt-1">{(selectedTransportRequest as any).extra_instructions}</p>
                                  </div>
                                )}
                                {selectedTransportRequest.notes && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700">Notes:</p>
                                    <p className="text-gray-600 mt-1">{selectedTransportRequest.notes}</p>
                                  </div>
                                )}
                                {(selectedTransportRequest as any).studentid && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700">Student ID:</p>
                                    <p className="text-gray-600 mt-1 flex items-center">
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Uploaded ✓</span>
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Photos Section */}
                          {(selectedTransportRequest as any).photo_urls && (selectedTransportRequest as any).photo_urls.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">6</span>
                                Attached Photos ({(selectedTransportRequest as any).photo_urls.length})
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {(selectedTransportRequest as any).photo_urls.map((photoUrl: string, index: number) => (
                                  <div key={index} className="relative group">
                                    <img
                                      src={photoUrl}
                                      alt={`Photo ${index + 1}`}
                                      className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+SW1hZ2Ugbm90IGZvdW5kPC90ZXh0Pjwvc3ZnPg==';
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                      <button
                                        onClick={() => window.open(photoUrl, '_blank')}
                                        className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 rounded-full p-2 transition-all duration-200 hover:bg-opacity-100"
                                      >
                                        <FaExternalLinkAlt className="text-gray-700" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <p className="text-sm text-gray-500 mt-2">
                                Click on any photo to view it in full size
                              </p>
                            </div>
                          )}

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
                    { id: 'supervision', label: 'User Listings', icon: FaSearch },
                    { id: 'sales', label: 'Sales History', icon: FaChartLine },
                    { id: 'rehome-orders', label: 'ReHome Orders', icon: FaBox },
                    { id: 'item-details', label: 'Marketplace Categories', icon: FaTags }
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

                {/* User Listings Supervision Tab */}
                {marketplaceTab === 'supervision' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">User Listings Supervision</h3>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search listings..."
                          value={userListingsSearchQuery}
                          onChange={(e) => setUserListingsSearchQuery(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 pl-10"
                        />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>
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
                          {userListings
                            .filter(item => {
                              if (!userListingsSearchQuery) return true;
                              const searchLower = userListingsSearchQuery.toLowerCase();
                              return (
                                item.name?.toLowerCase().includes(searchLower) ||
                                item.description?.toLowerCase().includes(searchLower) ||
                                item.seller_email?.toLowerCase().includes(searchLower) ||
                                item.category?.toLowerCase().includes(searchLower)
                              );
                            })
                            .map((item, index) => (
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
                    
                    {salesHistoryLoading ? (
                      <div className="p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading sales history...</p>
                      </div>
                    ) : salesHistory.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-gray-600">No sales history available</p>
                        <p className="text-sm text-gray-500 mt-2">Orders will appear here once customers complete purchases</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium">Order #</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium">Customer</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium">Item</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium">Category</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium">Qty</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium">Item Price</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium">Add-ons</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium">Total</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium">Date</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {salesHistory.map((sale) => {
                              const carryingFee = parseFloat(sale.carrying_fee || 0);
                              const assemblyFee = parseFloat(sale.assembly_fee || 0);
                              const deliveryFee = parseFloat(sale.delivery_fee || 0);
                              const extraHelperFee = parseFloat(sale.extra_helper_fee || 0);
                              const totalAddons = carryingFee + assemblyFee + deliveryFee + extraHelperFee;
                              
                              return (
                                <tr key={sale.id} className="hover:bg-gray-50">
                                  <td className="border border-gray-300 px-4 py-2">
                                    <span className="font-mono text-sm font-medium text-blue-600">{sale.order_id}</span>
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <div>
                                      <p className="font-medium">{sale.customer_name || 'N/A'}</p>
                                      <p className="text-xs text-gray-500">{sale.customer_email}</p>
                                      {sale.customer_phone && (
                                        <p className="text-xs text-gray-500">{sale.customer_phone}</p>
                                      )}
                                    </div>
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2">{sale.item_name}</td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                      {sale.item_category || 'N/A'}
                                    </span>
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-center">{sale.quantity}</td>
                                  <td className="border border-gray-300 px-4 py-2">€{parseFloat(sale.item_price).toFixed(2)}</td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    {totalAddons > 0 ? (
                                      <div className="text-xs">
                                        {carryingFee > 0 && <div>Carrying: €{carryingFee.toFixed(2)}</div>}
                                        {assemblyFee > 0 && <div>Assembly: €{assemblyFee.toFixed(2)}</div>}
                                        {deliveryFee > 0 && <div>Delivery: €{deliveryFee.toFixed(2)}</div>}
                                        {extraHelperFee > 0 && <div>Helper: €{extraHelperFee.toFixed(2)}</div>}
                                        <div className="font-medium mt-1">Total: €{totalAddons.toFixed(2)}</div>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 font-medium">€{parseFloat(sale.final_total).toFixed(2)}</td>
                                  <td className="border border-gray-300 px-4 py-2 text-sm">
                                    {sale.created_at && !isNaN(new Date(sale.created_at).getTime()) 
                                      ? format(new Date(sale.created_at), 'MMM dd, yyyy')
                                      : 'N/A'
                                    }
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      sale.payment_status === 'completed' 
                                        ? 'bg-green-100 text-green-800'
                                        : sale.payment_status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {sale.payment_status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ReHome Orders Tab */}
                {marketplaceTab === 'rehome-orders' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">ReHome Orders</h3>
                    
                    {rehomeOrdersLoading ? (
                      <div className="p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading orders...</p>
                      </div>
                    ) : filteredRehomeOrders.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-gray-600">No orders yet</p>
                        <p className="text-sm text-gray-500 mt-2">Orders will appear here when customers place orders</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-300">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border border-gray-300 px-4 py-2 text-left">Order #</th>
                              <th className="border border-gray-300 px-4 py-2 text-left">Customer</th>
                              <th className="border border-gray-300 px-4 py-2 text-left">Items</th>
                              <th className="border border-gray-300 px-4 py-2 text-left">Delivery Address</th>
                              <th className="border border-gray-300 px-4 py-2 text-right">Base Total</th>
                              <th className="border border-gray-300 px-4 py-2 text-right">Carrying</th>
                              <th className="border border-gray-300 px-4 py-2 text-right">Assembly</th>
                              <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                              <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
                              <th className="border border-gray-300 px-4 py-2 text-center">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRehomeOrders.map((order) => {
                              const items = Array.isArray(order.items) ? order.items : [];
                              return (
                                <tr key={order.id} className="hover:bg-gray-50">
                                  <td className="border border-gray-300 px-4 py-2 font-medium text-sm">
                                    {order.order_number}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-sm">
                                    <div>{order.customer_first_name} {order.customer_last_name}</div>
                                    <div className="text-xs text-gray-500">{order.customer_email}</div>
                                    <div className="text-xs text-gray-500">{order.customer_phone}</div>
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-sm">
                                    <div className="max-w-xs">
                                      {items.length > 0 ? (
                                        items.map((item: any, idx: number) => (
                                          <div key={idx} className="text-xs">
                                            • {item.name} ({item.quantity}x) - €{parseFloat(item.price).toFixed(2)}
                                            {(item.needs_carrying || item.needs_assembly) && (
                                              <div className="ml-2 text-orange-600">
                                                {item.needs_carrying && 'Carrying'}
                                                {item.needs_carrying && item.needs_assembly && ' + '}
                                                {item.needs_assembly && 'Assembly'}
                                              </div>
                                            )}
                                          </div>
                                        ))
                                      ) : (
                                        <span className="text-gray-400">No items</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-sm">
                                    <div className="max-w-xs truncate">{order.delivery_address}</div>
                                    <div className="text-xs text-gray-500">
                                      Floor: {order.delivery_floor || 0}
                                      {order.elevator_available && ' (Elevator)'}
                                    </div>
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                                    €{parseFloat(order.base_total || 0).toFixed(2)}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-right">
                                    €{parseFloat(order.carrying_cost || 0).toFixed(2)}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-right">
                                    €{parseFloat(order.assembly_cost || 0).toFixed(2)}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-right font-bold text-lg">
                                    €{parseFloat(order.total_amount || 0).toFixed(2)}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-center">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      order.status === 'delivered' 
                                        ? 'bg-green-100 text-green-800'
                                        : order.status === 'confirmed'
                                        ? 'bg-blue-100 text-blue-800'
                                        : order.status === 'in_delivery'
                                        ? 'bg-purple-100 text-purple-800'
                                        : order.status === 'cancelled'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {order.status}
                                    </span>
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-sm text-center">
                                    {order.created_at && !isNaN(new Date(order.created_at).getTime()) 
                                      ? format(new Date(order.created_at), 'MMM dd, yyyy')
                                      : 'N/A'
                                    }
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Item Details Tab */}
                {marketplaceTab === 'item-details' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Marketplace Item Details Management</h3>
                      <button
                        onClick={() => setShowAddMarketplaceItemDetailForm(!showAddMarketplaceItemDetailForm)}
                        className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                      >
                        <FaPlus className="mr-1" />
                        Add Item Detail
                      </button>
                    </div>

                    {/* Add Item Detail Form */}
                    {showAddMarketplaceItemDetailForm && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-3">Add New Marketplace Item Detail</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input
                            type="text"
                            placeholder="Category"
                            value={newMarketplaceItemDetail.category}
                            onChange={(e) => setNewMarketplaceItemDetail({...newMarketplaceItemDetail, category: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <input
                            type="text"
                            placeholder="Subcategory (optional)"
                            value={newMarketplaceItemDetail.subcategory}
                            onChange={(e) => setNewMarketplaceItemDetail({...newMarketplaceItemDetail, subcategory: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <input
                            type="number"
                            placeholder="Points"
                            value={newMarketplaceItemDetail.points}
                            onChange={(e) => setNewMarketplaceItemDetail({...newMarketplaceItemDetail, points: parseFloat(e.target.value) || 1})}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={handleAddMarketplaceItemDetail}
                            disabled={isUpdating}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                          >
                            {isUpdating ? 'Adding...' : 'Add Item Detail'}
                          </button>
                          <button
                            onClick={() => setShowAddMarketplaceItemDetailForm(false)}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Marketplace Item Details Table */}
                    {marketplaceItemDetailsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading marketplace item details...</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium">CATEGORY</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium">SUBCATEGORY</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium">POINTS</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium">STATUS</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-medium">ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {marketplaceItemDetails.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-2">
                                  {editingMarketplaceItemDetail === item.id ? (
                                    <input
                                      type="text"
                                      value={editMarketplaceItemDetailData.category || ''}
                                      onChange={(e) => setEditMarketplaceItemDetailData({...editMarketplaceItemDetailData, category: e.target.value})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded"
                                    />
                                  ) : (
                                    item.category
                                  )}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                  {editingMarketplaceItemDetail === item.id ? (
                                    <input
                                      type="text"
                                      value={editMarketplaceItemDetailData.subcategory || ''}
                                      onChange={(e) => setEditMarketplaceItemDetailData({...editMarketplaceItemDetailData, subcategory: e.target.value})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded"
                                    />
                                  ) : (
                                    item.subcategory || '-'
                                  )}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                  {editingMarketplaceItemDetail === item.id ? (
                                    <input
                                      type="number"
                                      value={editMarketplaceItemDetailData.points || 1}
                                      onChange={(e) => setEditMarketplaceItemDetailData({...editMarketplaceItemDetailData, points: parseFloat(e.target.value) || 1})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded"
                                    />
                                  ) : (
                                    item.points
                                  )}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {item.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                  {editingMarketplaceItemDetail === item.id ? (
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => handleSaveMarketplaceItemDetail(item)}
                                        disabled={isUpdating}
                                        className="flex items-center px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-xs"
                                      >
                                        <FaSave className="mr-1" />
                                        {isUpdating ? 'Saving...' : 'Save'}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingMarketplaceItemDetail(null);
                                          setEditMarketplaceItemDetailData({});
                                        }}
                                        className="flex items-center px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs"
                                      >
                                        <FaTimes className="mr-1" />
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => handleEditMarketplaceItemDetail(item)}
                                        className="flex items-center px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                      >
                                        <FaEdit className="mr-1" />
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteMarketplaceItemDetail(item)}
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
                    )}
                  </div>
                )}


              </div>
            )}

            {activeTab === 'schedule' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Schedule Management</h2>
                
                {/* Schedule Sub-tabs */}
                <div className="flex space-x-2 mb-6 border-b border-gray-200">
                  <button
                    onClick={() => setScheduleTab('calendar')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                      scheduleTab === 'calendar'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Calendar & City Schedules
                  </button>
                  <button
                    onClick={() => setScheduleTab('settings')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                      scheduleTab === 'settings'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Calendar Settings
                  </button>
                </div>

                {/* Calendar Tab */}
                {scheduleTab === 'calendar' && (
                  <div>
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
                    <button
                      onClick={() => setShowBulkAssignModal(true)}
                      className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 ml-2"
                    >
                      Bulk Assign Cities
                    </button>
                  </div>
                </div>
                {/* Bulk Assign Modal */}
                {showBulkAssignModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                      <h4 className="text-lg font-semibold mb-4">Bulk Assign Cities to Date Range</h4>
                      <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Start Date</label>
                        <input
                          type="date"
                          value={bulkAssignStartDate}
                          onChange={e => setBulkAssignStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">End Date</label>
                        <input
                          type="date"
                          value={bulkAssignEndDate}
                          onChange={e => setBulkAssignEndDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Cities</label>
                        <div className="flex flex-wrap gap-2">
                          {allCities.map(city => (
                            <span
                              key={city}
                              onClick={() => setBulkAssignCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city])}
                              className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                                bulkAssignCities.includes(city)
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {city}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-4">
                        <button
                          onClick={handleBulkAssignCities}
                          disabled={isUpdating}
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          {isUpdating ? 'Assigning...' : 'Assign Cities'}
                        </button>
                        <button
                          onClick={() => setShowBulkAssignModal(false)}
                          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Calendar Legend */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-500 rounded"></div>
                      <span>Today</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                      <span>Past</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                      <span>Future</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-100 rounded"></div>
                      <span>Assigned Cities</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-200 line-through rounded"></div>
                      <span>Blocked Dates</span>
                    </div>
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
                  {calendarDays.map((day, index) => {
                    const isHybridBlocked = !day.isBlocked && day.blockedCities.length > 0;
                    const displayLabel = day.isBlocked
                      ? 'Blocked: All cities'
                      : isHybridBlocked
                        ? `Blocked: ${day.blockedCities.join(', ')}`
                        : '';

                    return (
                      <div
                        key={index}
                        onClick={() => handleDateClick(day)}
                        className={`p-2 rounded-md cursor-pointer text-center border min-h-[80px] ${
                          day.isToday ? 'bg-orange-500 text-white font-bold border-orange-500' :
                          day.isPast ? 'bg-gray-100 border-gray-300' :
                          day.isFuture ? 'bg-blue-50 border-blue-200' :
                          day.isCurrentMonth ? 'hover:bg-gray-100 border-gray-200' : 'text-gray-400 border-gray-100'
                        } ${day.isBlocked ? 'line-through' : ''}`}
                        title={displayLabel || (day.assignedCities.length > 0 ? `Cities: ${day.assignedCities.join(', ')}` : undefined)}
                      >
                        <div className={`text-sm ${day.isPast ? 'text-gray-500' : ''}`}>
                          {day.date.getDate()}
                        </div>
                        {displayLabel && (
                          <div className="mt-1 text-[10px] text-gray-600 font-medium">
                            {displayLabel}
                          </div>
                        )}
                        {day.assignedCities.length > 0 && (
                          <div className="mt-1 flex flex-wrap justify-center gap-1">
                            {day.assignedCities.slice(0, 2).map((city, cityIndex) => (
                              <span key={cityIndex} className="bg-orange-100 text-orange-800 px-1 py-0.5 rounded-full text-xs font-medium">
                                {city}
                              </span>
                            ))}
                            {day.assignedCities.length > 2 && (
                              <span className="bg-orange-200 text-orange-800 px-1 py-0.5 rounded-full text-xs font-medium">
                                +{day.assignedCities.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {showCitySelector && selectedDate && (
                  <div className="mt-4 p-4 bg-white rounded-lg shadow-md">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Assign Cities for {format(selectedDate, 'yyyy-MM-dd')}</h4>
                    {(() => {
                      const dateKey = format(selectedDate, 'yyyy-MM-dd');
                      const blockedInfo = blockedDatesMap[dateKey];
                      const isFullyBlocked = blockedInfo && (blockedInfo.cities.length === 0 || blockedInfo.cities.length === allCities.length);
                      const isPartiallyBlocked = blockedInfo && !isFullyBlocked && blockedInfo.cities.length > 0;
                      return (
                        <div className="mb-3 space-y-1">
                          {isFullyBlocked && (
                            <div className="px-3 py-2 bg-red-50 text-red-700 rounded">
                              This date is currently blocked for all cities{blockedInfo?.reason ? ` (${blockedInfo.reason})` : ''}. Go to Calendar Settings to unblock.
                            </div>
                          )}
                          {isPartiallyBlocked && (
                            <div className="px-3 py-2 bg-yellow-50 text-yellow-700 rounded">
                              This date is partially blocked for: {blockedInfo.cities.join(', ')}.
                            </div>
                          )}
                        </div>
                      );
                    })()}
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

                {/* Calendar Settings Tab */}
                {scheduleTab === 'settings' && (
                  <CalendarSettingsSection 
                    allCities={allCities} 
                    onBlockedDatesChange={loadBlockedDates}
                  />
                )}
              </div>
            )}

            {activeTab === 'pricing' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Pricing Management</h2>
                <div className="space-y-8">

                  <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-700">Carrying Configuration (DB)</h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={fetchCarryingConfig}
                          disabled={carryingConfigLoading}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 disabled:opacity-50"
                        >
                          Refresh
                        </button>
                        {!editingCarryingConfig ? (
                          <button
                            onClick={() => setEditingCarryingConfig(true)}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                          >
                            Edit
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={handleSaveCarryingConfig}
                              disabled={isUpdating}
                              className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCarryingConfig(false)}
                              className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-gray-50 rounded">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Multiplier per floor</label>
                        {editingCarryingConfig ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editCarryingConfigData.multiplier_per_floor}
                            onChange={(e) => setEditCarryingConfigData({
                              ...editCarryingConfigData,
                              multiplier_per_floor: parseFloat(e.target.value)
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          <span className="text-sm font-medium">{editCarryingConfigData.multiplier_per_floor}</span>
                        )}
                      </div>

                      <div className="p-3 bg-gray-50 rounded">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Base fee (€)</label>
                        {editingCarryingConfig ? (
                          <input
                            type="number"
                            step="1"
                            value={editCarryingConfigData.base_fee}
                            onChange={(e) => setEditCarryingConfigData({
                              ...editCarryingConfigData,
                              base_fee: parseFloat(e.target.value)
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          <span className="text-sm font-medium">{editCarryingConfigData.base_fee}</span>
                        )}
                      </div>

                      <div className="p-3 bg-gray-50 rounded">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Base fee threshold points</label>
                        {editingCarryingConfig ? (
                          <input
                            type="number"
                            step="1"
                            value={editCarryingConfigData.base_fee_threshold_points ?? ''}
                            onChange={(e) => setEditCarryingConfigData({
                              ...editCarryingConfigData,
                              base_fee_threshold_points: e.target.value === '' ? null : parseFloat(e.target.value)
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          <span className="text-sm font-medium">{editCarryingConfigData.base_fee_threshold_points ?? 'None (always apply base fee)'}</span>
                        )}
                      </div>
                    </div>

                    {/* Current DB rows (by item type) */}
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">Current DB values</div>
                      {carryingConfigLoading ? (
                        <div className="text-xs text-gray-500">Loading…</div>
                      ) : carryingConfigRows.length === 0 ? (
                        <div className="text-xs text-gray-500">No carrying config rows found.</div>
                      ) : (
                        <div className="text-xs text-gray-700 space-y-1">
                          {carryingConfigRows.map((row: any) => (
                            <div key={row.item_type} className="flex gap-2">
                              <span className="font-semibold capitalize">{row.item_type}:</span>
                              <span>multiplier {parseFloat(row.multiplier_per_floor).toFixed(2)}</span>
                              <span>base fee €{parseFloat(row.base_fee).toFixed(2)}</span>
                              <span>
                                threshold {row.base_fee_threshold_points === null || row.base_fee_threshold_points === undefined ? 'none' : row.base_fee_threshold_points}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      This updates the <span className="font-mono">carrying_config</span> table for standard/box/bag/luggage. Backend pricing reads from DB and is refreshed immediately.
                    </div>
                  </div>
                  
                  {/* JSON-based Pricing Configs */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Core Pricing Configuration</h3>
                    
                    {/* Distance Pricing */}
                    <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-3">Distance Pricing</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-gray-50 rounded">
                          <label className="block text-sm font-medium text-gray-600 mb-1">Small Distance</label>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs text-gray-500">Threshold (km)</label>
                              {editingJsonConfig === 'distancePricing.smallDistance' ? (
                                <input
                                  type="number"
                                  value={editJsonConfigData.threshold}
                                  onChange={(e) => setEditJsonConfigData({...editJsonConfigData, threshold: parseFloat(e.target.value)})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                <span className="text-sm font-medium">{jsonPricingConfig.distancePricing.smallDistance.threshold}</span>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500">Rate (€/km)</label>
                              {editingJsonConfig === 'distancePricing.smallDistance' ? (
                                <input
                                  type="number"
                                  step="0.1"
                                  value={editJsonConfigData.rate}
                                  onChange={(e) => setEditJsonConfigData({...editJsonConfigData, rate: parseFloat(e.target.value)})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                <span className="text-sm font-medium">{jsonPricingConfig.distancePricing.smallDistance.rate}</span>
                              )}
                            </div>
                          </div>
                          {editingJsonConfig === 'distancePricing.smallDistance' ? (
                            <div className="mt-2 flex space-x-1">
                              <button
                                onClick={() => handleSaveJsonConfig('distancePricing', 'smallDistance')}
                                disabled={isUpdating}
                                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingJsonConfig(null)}
                                className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditJsonConfig('distancePricing', 'smallDistance')}
                              className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <label className="block text-sm font-medium text-gray-600 mb-1">Medium Distance</label>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs text-gray-500">Threshold (km)</label>
                              {editingJsonConfig === 'distancePricing.mediumDistance' ? (
                                <input
                                  type="number"
                                  value={editJsonConfigData.threshold}
                                  onChange={(e) => setEditJsonConfigData({...editJsonConfigData, threshold: parseFloat(e.target.value)})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                <span className="text-sm font-medium">{jsonPricingConfig.distancePricing.mediumDistance.threshold}</span>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500">Rate (€/km)</label>
                              {editingJsonConfig === 'distancePricing.mediumDistance' ? (
                                <input
                                  type="number"
                                  step="0.1"
                                  value={editJsonConfigData.rate}
                                  onChange={(e) => setEditJsonConfigData({...editJsonConfigData, rate: parseFloat(e.target.value)})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                <span className="text-sm font-medium">{jsonPricingConfig.distancePricing.mediumDistance.rate}</span>
                              )}
                            </div>
                          </div>
                          {editingJsonConfig === 'distancePricing.mediumDistance' ? (
                            <div className="mt-2 flex space-x-1">
                              <button
                                onClick={() => handleSaveJsonConfig('distancePricing', 'mediumDistance')}
                                disabled={isUpdating}
                                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingJsonConfig(null)}
                                className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditJsonConfig('distancePricing', 'mediumDistance')}
                              className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <label className="block text-sm font-medium text-gray-600 mb-1">Long Distance</label>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs text-gray-500">Rate (€/km)</label>
                              {editingJsonConfig === 'distancePricing.longDistance' ? (
                                <input
                                  type="number"
                                  step="0.1"
                                  value={editJsonConfigData.rate}
                                  onChange={(e) => setEditJsonConfigData({...editJsonConfigData, rate: parseFloat(e.target.value)})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                <span className="text-sm font-medium">{jsonPricingConfig.distancePricing.longDistance.rate}</span>
                              )}
                            </div>
                          </div>
                          {editingJsonConfig === 'distancePricing.longDistance' ? (
                            <div className="mt-2 flex space-x-1">
                              <button
                                onClick={() => handleSaveJsonConfig('distancePricing', 'longDistance')}
                                disabled={isUpdating}
                                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingJsonConfig(null)}
                                className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditJsonConfig('distancePricing', 'longDistance')}
                              className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Carrying Multipliers */}
                    <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-3">Carrying Multipliers (per floor)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded">
                          <label className="block text-sm font-medium text-gray-600 mb-1">Low Value Items (≤6 points)</label>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs text-gray-500">Threshold (points)</label>
                              {editingJsonConfig === 'carryingMultipliers.lowValue' ? (
                                <input
                                  type="number"
                                  value={editJsonConfigData.threshold}
                                  onChange={(e) => setEditJsonConfigData({...editJsonConfigData, threshold: parseFloat(e.target.value)})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                <span className="text-sm font-medium">{jsonPricingConfig.carryingMultipliers.lowValue.threshold}</span>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500">Multiplier</label>
                              {editingJsonConfig === 'carryingMultipliers.lowValue' ? (
                                <input
                                  type="number"
                                  step="0.001"
                                  value={editJsonConfigData.multiplier}
                                  onChange={(e) => setEditJsonConfigData({...editJsonConfigData, multiplier: parseFloat(e.target.value)})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                <span className="text-sm font-medium">{jsonPricingConfig.carryingMultipliers.lowValue.multiplier}</span>
                              )}
                            </div>
                          </div>
                          {editingJsonConfig === 'carryingMultipliers.lowValue' ? (
                            <div className="mt-2 flex space-x-1">
                              <button
                                onClick={() => handleSaveJsonConfig('carryingMultipliers', 'lowValue')}
                                disabled={isUpdating}
                                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingJsonConfig(null)}
                                className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditJsonConfig('carryingMultipliers', 'lowValue')}
                              className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <label className="block text-sm font-medium text-gray-600 mb-1">High Value Items (≥7 points)</label>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs text-gray-500">Multiplier</label>
                              {editingJsonConfig === 'carryingMultipliers.highValue' ? (
                                <input
                                  type="number"
                                  step="0.001"
                                  value={editJsonConfigData.multiplier}
                                  onChange={(e) => setEditJsonConfigData({...editJsonConfigData, multiplier: parseFloat(e.target.value)})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                <span className="text-sm font-medium">{jsonPricingConfig.carryingMultipliers.highValue.multiplier}</span>
                              )}
                            </div>
                          </div>
                          {editingJsonConfig === 'carryingMultipliers.highValue' ? (
                            <div className="mt-2 flex space-x-1">
                              <button
                                onClick={() => handleSaveJsonConfig('carryingMultipliers', 'highValue')}
                                disabled={isUpdating}
                                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingJsonConfig(null)}
                                className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditJsonConfig('carryingMultipliers', 'highValue')}
                              className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Assembly Multipliers */}
                    <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-3">Assembly Multipliers</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded">
                          <label className="block text-sm font-medium text-gray-600 mb-1">Low Value Items (≤6 points)</label>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs text-gray-500">Threshold (points)</label>
                              {editingJsonConfig === 'assemblyMultipliers.lowValue' ? (
                                <input
                                  type="number"
                                  value={editJsonConfigData.threshold}
                                  onChange={(e) => setEditJsonConfigData({...editJsonConfigData, threshold: parseFloat(e.target.value)})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                <span className="text-sm font-medium">{jsonPricingConfig.assemblyMultipliers.lowValue.threshold}</span>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500">Multiplier</label>
                              {editingJsonConfig === 'assemblyMultipliers.lowValue' ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editJsonConfigData.multiplier}
                                  onChange={(e) => setEditJsonConfigData({...editJsonConfigData, multiplier: parseFloat(e.target.value)})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                <span className="text-sm font-medium">{jsonPricingConfig.assemblyMultipliers.lowValue.multiplier}</span>
                              )}
                            </div>
                          </div>
                          {editingJsonConfig === 'assemblyMultipliers.lowValue' ? (
                            <div className="mt-2 flex space-x-1">
                              <button
                                onClick={() => handleSaveJsonConfig('assemblyMultipliers', 'lowValue')}
                                disabled={isUpdating}
                                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingJsonConfig(null)}
                                className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditJsonConfig('assemblyMultipliers', 'lowValue')}
                              className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <label className="block text-sm font-medium text-gray-600 mb-1">High Value Items (≥7 points)</label>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs text-gray-500">Multiplier</label>
                              {editingJsonConfig === 'assemblyMultipliers.highValue' ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editJsonConfigData.multiplier}
                                  onChange={(e) => setEditJsonConfigData({...editJsonConfigData, multiplier: parseFloat(e.target.value)})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                <span className="text-sm font-medium">{jsonPricingConfig.assemblyMultipliers.highValue.multiplier}</span>
                              )}
                            </div>
                          </div>
                          {editingJsonConfig === 'assemblyMultipliers.highValue' ? (
                            <div className="mt-2 flex space-x-1">
                              <button
                                onClick={() => handleSaveJsonConfig('assemblyMultipliers', 'highValue')}
                                disabled={isUpdating}
                                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingJsonConfig(null)}
                                className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditJsonConfig('assemblyMultipliers', 'highValue')}
                              className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>                    

                    {/* Extra Helper Pricing */}
                    <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-3">Extra Helper Pricing</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded">
                          <label className="block text-sm font-medium text-gray-600 mb-1">Small Move (≤30 items)</label>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs text-gray-500">Threshold (items)</label>
                              {editingJsonConfig === 'extraHelperPricing.smallMove' ? (
                                <input
                                  type="number"
                                  value={editJsonConfigData.threshold}
                                  onChange={(e) => setEditJsonConfigData({...editJsonConfigData, threshold: parseFloat(e.target.value)})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                <span className="text-sm font-medium">{jsonPricingConfig.extraHelperPricing.smallMove.threshold}</span>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500">Price (€)</label>
                              {editingJsonConfig === 'extraHelperPricing.smallMove' ? (
                                <input
                                  type="number"
                                  value={editJsonConfigData.price}
                                  onChange={(e) => setEditJsonConfigData({...editJsonConfigData, price: parseFloat(e.target.value)})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                <span className="text-sm font-medium">{jsonPricingConfig.extraHelperPricing.smallMove.price}</span>
                              )}
                            </div>
                          </div>
                          {editingJsonConfig === 'extraHelperPricing.smallMove' ? (
                            <div className="mt-2 flex space-x-1">
                              <button
                                onClick={() => handleSaveJsonConfig('extraHelperPricing', 'smallMove')}
                                disabled={isUpdating}
                                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingJsonConfig(null)}
                                className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditJsonConfig('extraHelperPricing', 'smallMove')}
                              className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <label className="block text-sm font-medium text-gray-600 mb-1">Big Move (&gt;30 items)</label>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs text-gray-500">Price (€)</label>
                              {editingJsonConfig === 'extraHelperPricing.bigMove' ? (
                                <input
                                  type="number"
                                  value={editJsonConfigData.price}
                                  onChange={(e) => setEditJsonConfigData({...editJsonConfigData, price: parseFloat(e.target.value)})}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                <span className="text-sm font-medium">{jsonPricingConfig.extraHelperPricing.bigMove.price}</span>
                              )}
                            </div>
                          </div>
                          {editingJsonConfig === 'extraHelperPricing.bigMove' ? (
                            <div className="mt-2 flex space-x-1">
                              <button
                                onClick={() => handleSaveJsonConfig('extraHelperPricing', 'bigMove')}
                                disabled={isUpdating}
                                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingJsonConfig(null)}
                                className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditJsonConfig('extraHelperPricing', 'bigMove')}
                              className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Discounts/Extra Charges */}
                    <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-3">Discounts/Extra Charges</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded">
                          <label className="block text-sm font-medium text-gray-600 mb-1">Student Discount (%)</label>
                          {editingJsonConfig === 'discounts.studentDiscount' ? (
                            <div className="space-y-2">
                              <input
                                type="number"
                                step="0.01"
                                value={(editJsonConfigData.percentage || 0) * 100}
                                onChange={(e) => setEditJsonConfigData({...editJsonConfigData, percentage: parseFloat(e.target.value) / 100})}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleSaveJsonConfig('discounts', 'studentDiscount')}
                                  disabled={isUpdating}
                                  className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingJsonConfig(null)}
                                  className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="text-sm font-medium">{((jsonPricingConfig.discounts?.studentDiscount?.percentage || 0.0885) * 100).toFixed(2)}%</span>
                              <button
                                onClick={() => handleEditJsonConfig('discounts', 'studentDiscount')}
                                className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <label className="block text-sm font-medium text-gray-600 mb-1">Late Booking Fee (%)</label>
                          {editingJsonConfig === 'discounts.lateBookingFee' ? (
                            <div className="space-y-2">
                              <input
                                type="number"
                                step="0.01"
                                value={(editJsonConfigData.percentage || 0) * 100}
                                onChange={(e) => setEditJsonConfigData({...editJsonConfigData, percentage: parseFloat(e.target.value) / 100})}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleSaveJsonConfig('discounts', 'lateBookingFee')}
                                  disabled={isUpdating}
                                  className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingJsonConfig(null)}
                                  className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="text-sm font-medium">{((jsonPricingConfig.discounts?.lateBookingFee?.percentage || 0.10) * 100).toFixed(2)}%</span>
                              <button
                                onClick={() => handleEditJsonConfig('discounts', 'lateBookingFee')}
                                className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
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
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">ROUTE</th>
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

                    {/* Base Charge Range for Non-City Locations */}
                    <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-3">Base Charge Range for Non-City Locations</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded">
                          <label className="block text-sm font-medium text-gray-600 mb-1">Base Range (km)</label>
                          {editingJsonConfig === 'distancePricing.baseChargeRange.range' ? (
                            <div className="space-y-2">
                              <input
                                type="number"
                                value={editJsonConfigData}
                                onChange={(e) => setEditJsonConfigData(parseFloat(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => {
                                    const updatedConfig = { ...jsonPricingConfig };
                                    const currentRange = updatedConfig.distancePricing.baseChargeRange;
                                    updatedConfig.distancePricing.baseChargeRange = {
                                      range: editJsonConfigData,
                                      ratePerKm: currentRange?.ratePerKm ?? 0
                                    };
                                    setJsonPricingConfig(updatedConfig);
                                    setEditingJsonConfig(null);
                                  }}
                                  disabled={isUpdating}
                                  className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingJsonConfig(null)}
                                  className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="text-sm font-medium">{jsonPricingConfig.distancePricing?.baseChargeRange?.range || 8} km</span>
                              <button
                                onClick={() => {
                                  setEditingJsonConfig('distancePricing.baseChargeRange.range');
                                  setEditJsonConfigData(jsonPricingConfig.distancePricing?.baseChargeRange?.range || 8);
                                }}
                                className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                          <label className="block text-sm font-medium text-gray-600 mb-1">Rate per km beyond range (€)</label>
                          {editingJsonConfig === 'distancePricing.baseChargeRange.ratePerKm' ? (
                            <div className="space-y-2">
                              <input
                                type="number"
                                step="0.1"
                                value={editJsonConfigData}
                                onChange={(e) => setEditJsonConfigData(parseFloat(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => {
                                    const updatedConfig = { ...jsonPricingConfig };
                                    const currentRange = updatedConfig.distancePricing.baseChargeRange;
                                    updatedConfig.distancePricing.baseChargeRange = {
                                      range: currentRange?.range ?? 0,
                                      ratePerKm: editJsonConfigData
                                    };
                                    setJsonPricingConfig(updatedConfig);
                                    setEditingJsonConfig(null);
                                  }}
                                  disabled={isUpdating}
                                  className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingJsonConfig(null)}
                                  className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="text-sm font-medium">€{jsonPricingConfig.distancePricing?.baseChargeRange?.ratePerKm || 3}</span>
                              <button
                                onClick={() => {
                                  setEditingJsonConfig('distancePricing.baseChargeRange.ratePerKm');
                                  setEditJsonConfigData(jsonPricingConfig.distancePricing?.baseChargeRange?.ratePerKm || 3);
                                }}
                                className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        For locations outside designated cities, the base charge will include the city base price plus additional charges for distance beyond the base range.
                      </p>
                    </div>

                    {/* Marketplace Pricing Configuration */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Marketplace Pricing Configuration</h3>
                      
                      {/* Marketplace Assembly Multipliers */}
                      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-3">Marketplace Assembly Multipliers</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-50 rounded">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Low Points Items (≤6 points)</label>
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs text-gray-500">Threshold (points)</label>
                                {editingJsonConfig === 'marketplacePricing.assemblyMultipliers.lowPoints' ? (
                                  <input
                                    type="number"
                                    value={editJsonConfigData.threshold}
                                    onChange={(e) => setEditJsonConfigData({...editJsonConfigData, threshold: parseFloat(e.target.value)})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                ) : (
                                  <span className="text-sm font-medium">{(jsonPricingConfig as any).marketplacePricing?.assemblyMultipliers?.lowPoints?.threshold || 6}</span>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500">Multiplier</label>
                                {editingJsonConfig === 'marketplacePricing.assemblyMultipliers.lowPoints' ? (
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={editJsonConfigData.multiplier}
                                    onChange={(e) => setEditJsonConfigData({...editJsonConfigData, multiplier: parseFloat(e.target.value)})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                ) : (
                                  <span className="text-sm font-medium">{(jsonPricingConfig as any).marketplacePricing?.assemblyMultipliers?.lowPoints?.multiplier || 1.5}</span>
                                )}
                              </div>
                            </div>
                            {editingJsonConfig === 'marketplacePricing.assemblyMultipliers.lowPoints' ? (
                              <div className="mt-2 flex space-x-1">
                                <button
                                  onClick={() => handleSaveJsonConfig('marketplacePricing.assemblyMultipliers', 'lowPoints')}
                                  disabled={isUpdating}
                                  className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingJsonConfig(null)}
                                  className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditJsonConfig('marketplacePricing.assemblyMultipliers', 'lowPoints')}
                                className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                          
                          <div className="p-3 bg-gray-50 rounded">
                            <label className="block text-sm font-medium text-gray-600 mb-1">High Points Items (≥7 points)</label>
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs text-gray-500">Multiplier</label>
                                {editingJsonConfig === 'marketplacePricing.assemblyMultipliers.highPoints' ? (
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={editJsonConfigData.multiplier}
                                    onChange={(e) => setEditJsonConfigData({...editJsonConfigData, multiplier: parseFloat(e.target.value)})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                ) : (
                                  <span className="text-sm font-medium">{(jsonPricingConfig as any).marketplacePricing?.assemblyMultipliers?.highPoints?.multiplier || 3.0}</span>
                                )}
                              </div>
                            </div>
                            {editingJsonConfig === 'marketplacePricing.assemblyMultipliers.highPoints' ? (
                              <div className="mt-2 flex space-x-1">
                                <button
                                  onClick={() => handleSaveJsonConfig('marketplacePricing.assemblyMultipliers', 'highPoints')}
                                  disabled={isUpdating}
                                  className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingJsonConfig(null)}
                                  className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditJsonConfig('marketplacePricing.assemblyMultipliers', 'highPoints')}
                                className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Marketplace Carrying Multipliers */}
                      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-3">Marketplace Carrying Multipliers</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-50 rounded">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Low Points Items (≤6 points)</label>
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs text-gray-500">Threshold (points)</label>
                                {editingJsonConfig === 'marketplacePricing.carryingMultipliers.lowPoints' ? (
                                  <input
                                    type="number"
                                    value={editJsonConfigData.threshold}
                                    onChange={(e) => setEditJsonConfigData({...editJsonConfigData, threshold: parseFloat(e.target.value)})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                ) : (
                                  <span className="text-sm font-medium">{(jsonPricingConfig as any).marketplacePricing?.carryingMultipliers?.lowPoints?.threshold || 6}</span>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500">Multiplier</label>
                                {editingJsonConfig === 'marketplacePricing.carryingMultipliers.lowPoints' ? (
                                  <input
                                    type="number"
                                    step="0.001"
                                    value={editJsonConfigData.multiplier}
                                    onChange={(e) => setEditJsonConfigData({...editJsonConfigData, multiplier: parseFloat(e.target.value)})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                ) : (
                                  <span className="text-sm font-medium">{(jsonPricingConfig as any).marketplacePricing?.carryingMultipliers?.lowPoints?.multiplier || 0.012}</span>
                                )}
                              </div>
                            </div>
                            {editingJsonConfig === 'marketplacePricing.carryingMultipliers.lowPoints' ? (
                              <div className="mt-2 flex space-x-1">
                                <button
                                  onClick={() => handleSaveJsonConfig('marketplacePricing.carryingMultipliers', 'lowPoints')}
                                  disabled={isUpdating}
                                  className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingJsonConfig(null)}
                                  className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditJsonConfig('marketplacePricing.carryingMultipliers', 'lowPoints')}
                                className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                          
                          <div className="p-3 bg-gray-50 rounded">
                            <label className="block text-sm font-medium text-gray-600 mb-1">High Points Items (≥7 points)</label>
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs text-gray-500">Multiplier</label>
                                {editingJsonConfig === 'marketplacePricing.carryingMultipliers.highPoints' ? (
                                  <input
                                    type="number"
                                    step="0.001"
                                    value={editJsonConfigData.multiplier}
                                    onChange={(e) => setEditJsonConfigData({...editJsonConfigData, multiplier: parseFloat(e.target.value)})}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                ) : (
                                  <span className="text-sm font-medium">{(jsonPricingConfig as any).marketplacePricing?.carryingMultipliers?.highPoints?.multiplier || 0.030}</span>
                                )}
                              </div>
                            </div>
                            {editingJsonConfig === 'marketplacePricing.carryingMultipliers.highPoints' ? (
                              <div className="mt-2 flex space-x-1">
                                <button
                                  onClick={() => handleSaveJsonConfig('marketplacePricing.carryingMultipliers', 'highPoints')}
                                  disabled={isUpdating}
                                  className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingJsonConfig(null)}
                                  className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditJsonConfig('marketplacePricing.carryingMultipliers', 'highPoints')}
                                className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
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
                            <option value="Others">Others</option>
                            <option value="Storage">Storage</option>

                          </select>
                          <input
                            type="number"
                            placeholder="Points"
                            value={newFurnitureItem.points}
                            onChange={(e) => setNewFurnitureItem({...newFurnitureItem, points: parseFloat(e.target.value) || 0})}
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
                                    <option value="Others">Others</option>
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
                                    onChange={(e) => setEditFurnitureItemData({...editFurnitureItemData, points: parseFloat(e.target.value) || 0})}
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

            {activeTab === 'requests' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Requests</h2>
                {/* Requests Sub-tabs */}
                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={() => setRequestsTab('donations')}
                    className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
                      requestsTab === 'donations'
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <FaHandshake className="mr-2" />
                    Item Donations
                  </button>
                  <button
                    onClick={() => setRequestsTab('special-requests')}
                    className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
                      requestsTab === 'special-requests'
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <FaGlobe className="mr-2" />
                    Special Requests
                  </button>
                </div>
                {/* Requests Filters */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={requestsSearchQuery}
                      onChange={(e) => setRequestsSearchQuery(e.target.value)}
                      placeholder="Search by customer name, email, phone, or location"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                  </div>
                  <div className="w-full lg:w-64 flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Status</label>
                    <select
                      value={requestsStatusFilter}
                      onChange={(e) => setRequestsStatusFilter(e.target.value as RequestStatus | 'All')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    >
                      <option value="All">All statuses</option>
                      {requestStatusOptions.map((statusOption) => (
                        <option key={statusOption} value={statusOption}>
                          {statusOption}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Requests Sub-tab Content */}
                {requestsTab === 'donations' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Item Donations</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">ID</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">USER</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">PHONE</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">SELL/FREE</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">PRICE</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">ITEM/DESCRIPTION</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">LOCATION</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">FLOORS</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">PREFERRED DATE</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">STATUS</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredItemDonations.map((donation) => {
                            let contactInfo: any = donation.contact_info;
                            if (typeof contactInfo === 'string') {
                              try {
                                contactInfo = JSON.parse(contactInfo);
                              } catch {
                                contactInfo = { firstName: '', lastName: '', email: '', phone: '' };
                              }
                            }

                            let donationItems: any = donation.donation_items;
                            let itemsArray: any[] = [];
                            if (typeof donationItems === 'string') {
                              try {
                                itemsArray = JSON.parse(donationItems);
                              } catch {
                                itemsArray = [];
                              }
                            } else if (Array.isArray(donationItems)) {
                              itemsArray = donationItems;
                            }

                            const hasPrice = itemsArray.some((item) => typeof item.price === 'number');
                            const totalPrice = itemsArray.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
                            const displayPrice = donation.donation_type === 'sell' && hasPrice
                              ? totalPrice.toFixed(2)
                              : null;

                            const description = itemsArray.length > 0
                              ? itemsArray
                                  .map((item) => item.description || '')
                                  .filter(Boolean)
                                  .join(' | ')
                              : donation.custom_item || 'N/A';

                            return (
                              <tr key={donation.id} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                  {donation.id}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                  <div className="font-medium">{contactInfo.firstName || ''} {contactInfo.lastName || ''}</div>
                                  <div className="text-gray-500">{contactInfo.email || 'N/A'}</div>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                  {contactInfo.phone || 'N/A'}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    donation.donation_type === 'charity' || donation.donation_type === 'recycling'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {donation.donation_type === 'charity' || donation.donation_type === 'recycling' ? 'Free' : 'Sell'}
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                  {displayPrice ? `€${displayPrice}` : 'N/A'}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                  {itemsArray.length > 0 ? (
                                    <div>
                                      <div className="font-medium">{itemsArray.length} item(s)</div>
                                      <div className="text-gray-500 text-xs truncate max-w-xs">
                                        {description}
                                      </div>
                                    </div>
                                  ) : description}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                  {donation.pickup_location || 'N/A'}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                  {donation.floor ? `Floor ${donation.floor}${donation.elevator_available ? ' (Elevator)' : ''}` : 'Ground'}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                  {donation.preferred_pickup_date ? (
                                    <div>
                                      <div>{format(new Date(donation.preferred_pickup_date), 'MMM dd, yyyy')}</div>
                                      {donation.preferred_time_span && (
                                        <div className="text-gray-500 text-xs">{donation.preferred_time_span}</div>
                                      )}
                                    </div>
                                  ) : donation.is_date_flexible ? 'Flexible' : 'N/A'}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                  {editingDonationId === donation.id ? (
                                    <div className="flex items-center gap-2">
                                      <select
                                        value={editingDonationStatus}
                                        onChange={(e) => setEditingDonationStatus(e.target.value as RequestStatus)}
                                        className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                                      >
                                        {requestStatusOptions.map((statusOption) => (
                                          <option key={statusOption} value={statusOption}>
                                            {statusOption}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        onClick={() => handleSaveDonationStatus(donation.id)}
                                        disabled={savingDonationStatusId === donation.id}
                                        className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                                      >
                                        {savingDonationStatusId === donation.id ? 'Saving...' : 'Save'}
                                      </button>
                                      <button
                                        onClick={handleCancelDonationStatusEdit}
                                        className="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRequestStatusClasses(normalizeRequestStatus(donation.status))}`}>
                                      {normalizeRequestStatus(donation.status)}
                                    </span>
                                  )}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                  <div className="flex gap-2">
                                    {editingDonationId !== donation.id && (
                                      <button
                                        onClick={() => handleStartDonationStatusEdit(donation)}
                                        className="px-2 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                                      >
                                        Edit
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleViewDonationDetails(donation)}
                                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                      View
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {requestsTab === 'special-requests' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Special Requests</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">ID</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">CUSTOMER</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">REQUEST</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">LOCATION</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">FLOORS</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">DATE</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">STATUS</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-xs">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSpecialRequests.map((request) => {
                            let contactInfo: any = request.contact_info;
                            if (typeof contactInfo === 'string') {
                              try {
                                contactInfo = JSON.parse(contactInfo);
                              } catch {
                                contactInfo = { firstName: '', lastName: '', email: '', phone: '' };
                              }
                            }
                            
                            let services: any = request.selected_services;
                            let servicesArray: string[] = [];
                            if (typeof services === 'string') {
                              try {
                                servicesArray = JSON.parse(services);
                              } catch {
                                servicesArray = [services];
                              }
                            } else if (Array.isArray(services)) {
                              servicesArray = services;
                            }

                            const requestType = request.request_type || (servicesArray.length > 0 && servicesArray[0]) || 'N/A';
                            const requestLabel = requestType === 'junkRemoval' ? 'Junk Removal' :
                                                requestType === 'storage' ? 'Item Storage' :
                                                requestType === 'fullInternationalMove' ? 'Full Moving' :
                                                requestType;

                            const anyRequest: any = request;
                            const pickupFloor = anyRequest.floor_pickup ?? anyRequest.pickup_floor;
                            const dropoffFloor = anyRequest.floor_dropoff ?? anyRequest.dropoff_floor;
                            const elevatorPickup = anyRequest.elevator_pickup ?? anyRequest.pickup_elevator;
                            const elevatorDropoff = anyRequest.elevator_dropoff ?? anyRequest.dropoff_elevator;

                            let preferredDateRaw: any = request.preferred_date;
                            let preferredDateValue: string | null = null;
                            if (Array.isArray(preferredDateRaw) && preferredDateRaw.length > 0) {
                              preferredDateValue = preferredDateRaw[0];
                            } else if (typeof preferredDateRaw === 'string') {
                              try {
                                const parsed = JSON.parse(preferredDateRaw);
                                if (Array.isArray(parsed) && parsed.length > 0) {
                                  preferredDateValue = parsed[0];
                                } else {
                                  preferredDateValue = preferredDateRaw;
                                }
                              } catch {
                                preferredDateValue = preferredDateRaw;
                              }
                            }

                            let preferredDateDisplay = '';
                            if (preferredDateValue) {
                              preferredDateDisplay = format(new Date(preferredDateValue), 'MMM dd, yyyy');
                            } else if (request.is_date_flexible) {
                              preferredDateDisplay = 'Flexible';
                            } else {
                              preferredDateDisplay = 'N/A';
                            }
                            
                            return (
                              <tr key={request.id} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                  {request.id}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                  <div className="font-medium">{contactInfo.email || 'N/A'}</div>
                                  <div className="text-gray-500">{contactInfo.phone || ''}</div>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    requestType === 'junkRemoval' ? 'bg-red-100 text-red-800' :
                                    requestType === 'storage' ? 'bg-purple-100 text-purple-800' :
                                    requestType === 'fullInternationalMove' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {requestLabel}
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                  {request.pickup_location && request.dropoff_location ? (
                                    <div>
                                      <div className="font-medium">From: {request.pickup_location}</div>
                                      <div className="text-gray-500">To: {request.dropoff_location}</div>
                                    </div>
                                  ) : request.pickup_location || request.dropoff_location || 'N/A'}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                  {pickupFloor || dropoffFloor ? (
                                    <div>
                                      {pickupFloor && <div>P: {pickupFloor}{elevatorPickup ? ' 🛗' : ''}</div>}
                                      {dropoffFloor && <div>D: {dropoffFloor}{elevatorDropoff ? ' 🛗' : ''}</div>}
                                    </div>
                                  ) : 'Ground'}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                  {preferredDateDisplay}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                  {editingSpecialRequestId === request.id ? (
                                    <div className="flex items-center gap-2">
                                      <select
                                        value={editingSpecialRequestStatus}
                                        onChange={(e) => setEditingSpecialRequestStatus(e.target.value as RequestStatus)}
                                        className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                                      >
                                        {requestStatusOptions.map((statusOption) => (
                                          <option key={statusOption} value={statusOption}>
                                            {statusOption}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        onClick={() =>
                                          updateSpecialRequestStatus(
                                            request.id,
                                            editingSpecialRequestStatus,
                                            () => setEditingSpecialRequestId(null)
                                          )
                                        }
                                        disabled={savingSpecialRequestStatusId === request.id}
                                        className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                                      >
                                        {savingSpecialRequestStatusId === request.id ? 'Saving...' : 'Save'}
                                      </button>
                                      <button
                                        onClick={handleCancelSpecialRequestStatusEdit}
                                        className="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRequestStatusClasses(normalizeRequestStatus(request.status))}`}>
                                      {normalizeRequestStatus(request.status)}
                                    </span>
                                  )}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                  <div className="flex gap-2">
                                    {editingSpecialRequestId !== request.id && (
                                      <button
                                        onClick={() => handleStartSpecialRequestStatusEdit(request)}
                                        className="px-2 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                                      >
                                        Edit
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleViewSpecialRequestDetails(request)}
                                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                      View
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Item Donation Details Modal */}
            {showDonationDetails && selectedDonation && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-800">Item Donation Details</h3>
                      <button
                        onClick={() => setShowDonationDetails(false)}
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
                          {(() => {
                            let contactInfo = selectedDonation.contact_info;
                            if (typeof contactInfo === 'string') {
                              try {
                                contactInfo = JSON.parse(contactInfo);
                              } catch {
                                contactInfo = { email: '', phone: '', firstName: '', lastName: '' };
                              }
                            }
                            return (
                              <>
                                <p><span className="font-medium">Name:</span> {contactInfo.firstName || ''} {contactInfo.lastName || ''}</p>
                                <p><span className="font-medium">Email:</span> {contactInfo.email || 'N/A'}</p>
                                <p><span className="font-medium">Phone:</span> {contactInfo.phone || 'N/A'}</p>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Donation Information */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Donation Information</h4>
                        <div className="space-y-2">
                          <p><span className="font-medium">Type:</span> 
                            <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                              selectedDonation.donation_type === 'charity' ? 'bg-green-100 text-green-800' :
                              selectedDonation.donation_type === 'recycling' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedDonation.donation_type}
                            </span>
                          </p>
                          <p><span className="font-medium">Status:</span> 
                            <div className="flex items-center">
                              <select
                                value={modalDonationStatus}
                                onChange={(e) => setModalDonationStatus(e.target.value as RequestStatus)}
                                className="ml-2 px-2 py-1 rounded text-xs font-medium border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                <option value="Open">Open</option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                              {modalDonationStatus !== normalizeRequestStatus(selectedDonation.status) && (
                                <button 
                                  onClick={handleSaveDonationStatusFromModal}
                                  className="ml-2 px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600"
                                >
                                  Save
                                </button>
                              )}
                            </div>
                          </p>
                          <p><span className="font-medium">Condition:</span> {selectedDonation.item_condition || 'N/A'}</p>
                        </div>
                        {/* Uploaded Photos */}
                        {selectedDonation.photo_urls && selectedDonation.photo_urls.length > 0 ? (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold mb-3 text-gray-700">📸 Uploaded Photos ({selectedDonation.photo_urls.length})</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {selectedDonation.photo_urls.map((url: string, idx: number) => (
                                <div key={idx} className="relative group">
                                  <a 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="block"
                                    title="Click to view full size"
                                  >
                                    <img 
                                      src={url} 
                                      alt={`Donation Photo ${idx + 1}`} 
                                      className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
                                      onError={(e) => {
                                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00OCA0MGMtNC40MiAwLTggMy41OC04IDhzMy41OCA4IDggOCA4LTMuNTggOC04LTMuNTgtOC04LTh6IiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik00OCA1NmMtOC44NCAwLTE2LTcuMTYtMTYtMTZzNy4xNi0xNiAxNi0xNiAxNiA3LjE2IDE2IDE2LTcuMTYgMTYtMTYgMTZ6IiBmaWxsPSIjOUI5QkEwIi8+Cjwvc3ZnPgo=';
                                        e.currentTarget.alt = 'Image failed to load';
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                      <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">View</span>
                                    </div>
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold mb-2 text-gray-500">📸 Uploaded Photos</h4>
                            <p className="text-xs text-gray-400">No photos uploaded</p>
                          </div>
                        )}
                      </div>

                      {/* Location Information */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Location Details</h4>
                        <div className="space-y-2">
                          <p><span className="font-medium">Pickup Location:</span> {selectedDonation.pickup_location || 'N/A'}</p>
                          <p><span className="font-medium">Floor:</span> {selectedDonation.floor || 'Ground'}</p>
                          <p><span className="font-medium">Elevator Available:</span> {selectedDonation.elevator_available ? 'Yes' : 'No'}</p>
                          <p><span className="font-medium">Distance:</span> {selectedDonation.calculated_distance_km || 'N/A'} km</p>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Donated Items</h4>
                        {selectedDonation.donation_items?.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                              <thead>
                                <tr className="bg-gray-100">
                                  {/* Dynamically render columns based on keys in the first item */}
                                  {Object.keys(selectedDonation.donation_items[0]).map((key) => (
                                    <th key={key} className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">
                                      {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {selectedDonation.donation_items.map((item: any, index: number) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    {Object.keys(selectedDonation.donation_items[0]).map((key) => (
                                      <td key={key} className="border border-gray-300 px-3 py-2 text-sm">
                                        {item[key] ?? ''}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-gray-700">Custom item: {selectedDonation.custom_item}</p>
                        )}
                      </div>

                      {/* Special Instructions */}
                      {selectedDonation.special_instructions && (
                        <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-lg font-semibold text-gray-800 mb-3">Special Instructions</h4>
                          <p className="text-gray-700">{selectedDonation.special_instructions}</p>
                        </div>
                      )}

                      {/* Timeline */}
                      <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Timeline</h4>
                        <div className="space-y-2">
                          <p><span className="font-medium">Created:</span> {format(new Date(selectedDonation.created_at), 'PPpp')}</p>
                          <p><span className="font-medium">Updated:</span> {format(new Date(selectedDonation.updated_at), 'PPpp')}</p>
                          <p><span className="font-medium">Preferred Pickup Date:</span> {selectedDonation.preferred_pickup_date ? format(new Date(selectedDonation.preferred_pickup_date), 'PPP') : 'N/A'}</p>
                          <p><span className="font-medium">Date Flexible:</span> {selectedDonation.is_date_flexible ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={() => setShowDonationDetails(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Special Request Details Modal */}
            {showSpecialRequestDetails && selectedSpecialRequest && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-800">Special Request Details</h3>
                      <button
                        onClick={() => setShowSpecialRequestDetails(false)}
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
                          {(() => {
                            let contactInfo = selectedSpecialRequest.contact_info;
                            if (typeof contactInfo === 'string') {
                              try {
                                contactInfo = JSON.parse(contactInfo);
                              } catch {
                                contactInfo = { email: '', phone: '', firstName: '', lastName: '' };
                              }
                            }
                            return (
                              <>
                                <p><span className="font-medium">Name:</span> {contactInfo.firstName || ''} {contactInfo.lastName || ''}</p>
                                <p><span className="font-medium">Email:</span> {contactInfo.email || 'N/A'}</p>
                                <p><span className="font-medium">Phone:</span> {contactInfo.phone || 'N/A'}</p>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Request Information */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Request Information</h4>
                        <div className="space-y-2">
                          <p><span className="font-medium">Type:</span> {selectedSpecialRequest.request_type || 'N/A'}</p>
                          <p><span className="font-medium">Status:</span> 
                            <div className="flex items-center">
                              <select
                                value={modalSpecialRequestStatus}
                                onChange={(e) => setModalSpecialRequestStatus(e.target.value as RequestStatus)}
                                className="ml-2 px-2 py-1 rounded text-xs font-medium border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                <option value="Open">Open</option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                              {modalSpecialRequestStatus !== normalizeRequestStatus(selectedSpecialRequest.status) && (
                                <button 
                                  onClick={handleSaveSpecialRequestStatusFromModal}
                                  className="ml-2 px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600"
                                >
                                  Save
                                </button>
                              )}
                            </div>
                          </p>
                        </div>
                        {/* Uploaded Photos */}
                        {selectedSpecialRequest.photo_urls && selectedSpecialRequest.photo_urls.length > 0 ? (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold mb-3 text-gray-700">📸 Uploaded Photos ({selectedSpecialRequest.photo_urls.length})</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {selectedSpecialRequest.photo_urls.map((url: string, idx: number) => (
                                <div key={idx} className="relative group">
                                  <a 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="block"
                                    title="Click to view full size"
                                  >
                                    <img 
                                      src={url} 
                                      alt={`Special Request Photo ${idx + 1}`} 
                                      className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
                                      onError={(e) => {
                                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00OCA0MGMtNC40MiAwLTggMy41OC04IDhzMy41OCA4IDggOCA4LTMuNTggOC04LTMuNTgtOC04LTh6IiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik00OCA1NmMtOC44NCAwLTE2LTcuMTYtMTYtMTZzNy4xNi0xNiAxNi0xNiAxNiA3LjE2IDE2IDE2LTcuMTYgMTYtMTYgMTZ6IiBmaWxsPSIjOUI5QkEwIi8+Cjwvc3ZnPgo=';
                                        e.currentTarget.alt = 'Image failed to load';
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                      <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">View</span>
                                    </div>
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold mb-2 text-gray-500">📸 Uploaded Photos</h4>
                            <p className="text-xs text-gray-400">No photos uploaded</p>
                          </div>
                        )}
                      </div>

                      {/* Location Information */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Location Details</h4>
                        <div className="space-y-2">
                          <p><span className="font-medium">Pickup Location:</span> {selectedSpecialRequest.pickup_location || 'N/A'}</p>
                          <p><span className="font-medium">Dropoff Location:</span> {selectedSpecialRequest.dropoff_location || 'N/A'}</p>
                          {(() => {
                            const anyRequest: any = selectedSpecialRequest;
                            const pickupFloor = anyRequest.floor_pickup ?? anyRequest.pickup_floor;
                            const dropoffFloor = anyRequest.floor_dropoff ?? anyRequest.dropoff_floor;
                            const pickupElevatorRaw = anyRequest.elevator_pickup ?? anyRequest.pickup_elevator;
                            const dropoffElevatorRaw = anyRequest.elevator_dropoff ?? anyRequest.dropoff_elevator;

                            const normalizeElevator = (value: any) => {
                              if (typeof value === 'boolean') return value;
                              if (typeof value === 'string') {
                                const lowered = value.toLowerCase();
                                if (lowered === 'yes') return true;
                                if (lowered === 'no') return false;
                              }
                              return false;
                            };

                            return (
                              <>
                                <p><span className="font-medium">Pickup Floor:</span> {pickupFloor ?? 'Ground'}</p>
                                <p><span className="font-medium">Dropoff Floor:</span> {dropoffFloor ?? 'Ground'}</p>
                                <p><span className="font-medium">Pickup Elevator:</span> {normalizeElevator(pickupElevatorRaw) ? 'Yes' : 'No'}</p>
                                <p><span className="font-medium">Dropoff Elevator:</span> {normalizeElevator(dropoffElevatorRaw) ? 'Yes' : 'No'}</p>
                              </>
                            );
                          })()}
                          <p><span className="font-medium">Distance:</span> {selectedSpecialRequest.calculated_distance_km || 'N/A'} km</p>
                        </div>
                      </div>

                      {/* Timeline (moved up) */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Timeline</h4>
                        <div className="space-y-2">
                          <p><span className="font-medium">Created:</span> {selectedSpecialRequest.created_at && !isNaN(new Date(selectedSpecialRequest.created_at).getTime()) ? format(new Date(selectedSpecialRequest.created_at), 'PPpp') : 'N/A'}</p>
                          <p><span className="font-medium">Updated:</span> {selectedSpecialRequest.updated_at && !isNaN(new Date(selectedSpecialRequest.updated_at).getTime()) ? format(new Date(selectedSpecialRequest.updated_at), 'PPpp') : 'N/A'}</p>
                          <p><span className="font-medium">Preferred Date:</span> {selectedSpecialRequest.preferred_date && !isNaN(new Date(selectedSpecialRequest.preferred_date).getTime()) ? format(new Date(selectedSpecialRequest.preferred_date), 'PPP') : 'N/A'}</p>
                          <p><span className="font-medium">Date Flexible:</span> {selectedSpecialRequest.is_date_flexible ? 'Yes' : 'No'}</p>
                        </div>
                      </div>

                      {/* Message */}
                      {selectedSpecialRequest.message && (
                        <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-lg font-semibold text-gray-800 mb-3">Message</h4>
                          <p className="text-gray-700">{selectedSpecialRequest.message}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={() => setShowSpecialRequestDetails(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sales History Section */}
          {activeTab === 'sales' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Sales History & Analytics</h3>
                
                {/* Sales Statistics Cards */}
                {salesStatisticsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-gray-200 p-4 rounded-lg animate-pulse">
                        <div className="h-16 bg-gray-300 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : salesStatistics ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-90">Total Sales</p>
                          <p className="text-2xl font-bold">{salesStatistics.totalSales}</p>
                        </div>
                        <FaChartLine className="text-3xl opacity-80" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-90">Total Revenue</p>
                          <p className="text-2xl font-bold">€{salesStatistics.totalRevenue}</p>
                        </div>
                        <FaChartLine className="text-3xl opacity-80" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-90">Avg Order Value</p>
                          <p className="text-2xl font-bold">€{salesStatistics.averageOrderValue}</p>
                        </div>
                        <FaChartLine className="text-3xl opacity-80" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-90">Categories</p>
                          <p className="text-2xl font-bold">{Object.keys(salesStatistics.categoryStats || {}).length}</p>
                        </div>
                        <FaTags className="text-3xl opacity-80" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-90">Total Sales</p>
                          <p className="text-2xl font-bold">{salesStatistics.totalSales}</p>
                        </div>
                        <FaChartLine className="text-3xl opacity-80" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-90">Total Revenue</p>
                          <p className="text-2xl font-bold">€{salesStatistics.totalRevenue}</p>
                        </div>
                        <FaChartLine className="text-3xl opacity-80" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-90">Avg Order Value</p>
                          <p className="text-2xl font-bold">€{salesStatistics.averageOrderValue}</p>
                        </div>
                        <FaChartLine className="text-3xl opacity-80" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-90">Categories</p>
                          <p className="text-2xl font-bold">{Object.keys(salesStatistics.categoryStats || {}).length}</p>
                        </div>
                        <FaTags className="text-3xl opacity-80" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Category Statistics */}
                {salesStatistics?.categoryStats && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Sales by Category</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(salesStatistics.categoryStats).map(([category, stats]: [string, any]) => (
                        <div key={category} className="bg-gray-50 p-3 rounded-lg">
                          <h5 className="font-medium text-gray-800">{category}</h5>
                          <p className="text-sm text-gray-600">Sales: {stats.count}</p>
                          <p className="text-sm text-gray-600">Revenue: €{stats.revenue}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sales History Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-800">Recent Sales</h4>
                </div>
                
                {salesHistoryLoading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading sales history...</p>
                  </div>
                ) : salesHistory.length === 0 ? (
                  <div className="p-6 text-center">
                    <FaChartLine className="text-4xl text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No sales history available</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {salesHistory.map((sale) => (
                          <tr key={sale.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {sale.order_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>
                                <p className="font-medium">{sale.customer_name || 'N/A'}</p>
                                <p className="text-gray-500">{sale.customer_email}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {sale.item_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {sale.item_category || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {sale.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              €{sale.final_total}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {sale.created_at && !isNaN(new Date(sale.created_at).getTime()) 
                                ? format(new Date(sale.created_at), 'MMM dd, yyyy')
                                : 'N/A'
                              }
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                sale.payment_status === 'completed' 
                                  ? 'bg-green-100 text-green-800'
                                  : sale.payment_status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {sale.payment_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User Management Section */}
          {activeTab === 'users' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">User Management</h3>
                <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-8">
                  <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">User Management Coming Soon</h4>
                  <p className="text-gray-500">
                    This section will allow you to manage user accounts, assign roles, and set permissions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard; 