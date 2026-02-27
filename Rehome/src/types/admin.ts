// Transportation request interface - matches transportation_requests table
export interface TransportRequest {
    id: string;
    order_number: string;
    created_at: string;
    customer_name: string;
    email: string;
    city: string;
    date: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'Open' | 'Contacted/ Pending' | 'Confirmed' | 'Completed' | 'Declined';
    notes?: string;
    type: 'item-transport' | 'house-moving';
    
    // New unified table fields (from transportation_requests)
    phone?: string;
    pickup_location?: {
      displayName?: string;
      formattedAddress?: string;
      coordinates?: { lat: number; lng: number };
    };
    dropoff_location?: {
      displayName?: string;
      formattedAddress?: string;
      coordinates?: { lat: number; lng: number };
    };
    selected_date?: string;
    date_option?: 'fixed' | 'flexible' | 'rehome';
    custom_item?: string;
    preferred_time_span?: string;
    items?: any[];
    service_type?: string;
    has_student_id?: boolean;
    student_id_url?: string;
    store_proof_url?: string;
    needs_assembly?: boolean;
    needs_extra_helper?: boolean;
    pickup_floors?: number;
    dropoff_floors?: number;
    has_elevator_pickup?: boolean;
    has_elevator_dropoff?: boolean;
    special_instructions?: string;
    item_image_urls?: string[];
    pricing_breakdown?: {
      basePrice?: number;
      itemValue?: number;
      distanceCost?: number;
      carryingCost?: number;
      assemblyCost?: number;
      extraHelperCost?: number;
      studentDiscount?: number;
      subtotal?: number;
      total?: number;
      breakdown?: any;
      // Item selections stored in pricing_breakdown JSONB
      assemblyItems?: Record<string, boolean>;
      disassemblyItems?: Record<string, boolean>;
      extraHelperItems?: Record<string, boolean>;
      carryingServiceItems?: Record<string, boolean>;
      carryingUpItems?: Record<string, boolean>;
      carryingDownItems?: Record<string, boolean>;
    };
    total_price?: number;
    admin_notes?: string;
    updated_at?: string;
    
    // Legacy fields for backward compatibility
    pickuptype?: string;
    furnitureitems?: any[];
    customitem?: string;
    floorpickup?: number;
    floordropoff?: number;
    firstname?: string;
    lastname?: string;
    estimatedprice?: number;
    selecteddate?: string;
    isdateflexible?: boolean;
    baseprice?: number;
    itemvalue?: number;
    itempoints?: number;
    carryingcost?: number;
    disassemblycost?: number;
    distancecost?: number;
    extrahelpercost?: number;
    studentdiscount?: number;
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
    photo_urls?: string[];
  }
  
  
  
  // Pricing interfaces
  
  export interface CityPrice {
    id: string;
    city_name: string;
    normal: number;
    city_day: number;
    day_of_week: string;
    created_at: string;
  }
  
  // Marketplace interfaces
  export interface MarketplaceItem {
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
  export interface CalendarDay {
    date: Date;
    assignedCities: string[];
    isToday: boolean;
    isCurrentMonth: boolean;
    isPast: boolean;
    isFuture: boolean;
    isBlocked: boolean;
    blockedCities: string[];
    blockedReason?: string | null;
  }
  
  // Time block interface
  export interface TimeBlock {
    id: string;
    startTime: string;
    endTime: string;
    cities: string[];
    discountPercentage: number;
  }

  // Common status variants used across admin experiences
export type LegacyRequestStatus = 'Open' | 'Contacted/ Pending' | 'Confirmed' | 'Completed' | 'Declined';

  // Item donation interface
  export interface ItemDonation {
    id: number;
    donation_items: any[];
    custom_item?: string;
    contact_info: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    pickup_location?: string;
    donation_location?: string;
    pickup_location_coords?: any;
    donation_location_coords?: any;
    preferred_pickup_date?: string;
    is_date_flexible: boolean;
    donation_type: 'charity' | 'recycling' | 'sell' | 'other';
    special_instructions?: string;
    total_estimated_value?: number;
    item_condition?: string;
    photo_urls: string[];
    floor?: string;
    elevator_available?: boolean;
    preferred_time_span?: string;
    calculated_distance_km?: number;
    calculated_duration_seconds?: number;
    calculated_duration_text?: string;
    distance_provider?: string;
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'approved' | LegacyRequestStatus;
    created_at: string;
    updated_at: string;
  }

  // Special request interface - matches special_requests table
  export interface SpecialRequest {
    latest_removal_date: any;
    earliest_removal_date: any;
    delivery_address: boolean;
    delivery_preference: any;
    delivery_elevator: string;
    delivery_floor: undefined;
    storage_end_date: any;
    pickup_preference: any;
    storage_start_date: any;
    id: string;
    request_type: 'international_move' | 'junk_removal' | 'item_storage' | string;
    customer_name: string;
    email: string;
    phone: string;
    
    // Pickup address fields
    pickup_country?: string;
    pickup_postal?: string;
    pickup_house_number?: string;
    pickup_addition?: string;
    pickup_city?: string;
    pickup_street?: string;
    pickup_floor?: number;
    pickup_elevator?: boolean;
    pickup_address?: string;
    
    // Dropoff address fields
    dropoff_country?: string;
    dropoff_postal?: string;
    dropoff_house_number?: string;
    dropoff_addition?: string;
    dropoff_city?: string;
    dropoff_street?: string;
    dropoff_floor?: number;
    dropoff_elevator?: boolean;
    dropoff_address?: string;
    
    // Date fields
    move_date_type?: 'specific' | 'flexible' | 'let_rehome_choose' | string;
    specific_date_start?: string;
    specific_date_end?: string;
    
    // Request details
    item_description?: string;
    selected_services?: string[] | any;
    storage_duration_months?: number;
    delivery_needed?: boolean;
    junk_volume?: string;
    
    // Photos and pricing
    photo_urls?: string[];
    estimated_price?: number;
    
    // Status and metadata
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | LegacyRequestStatus;
    admin_notes?: string;
    created_at: string;
    updated_at?: string;
    
    // Legacy fields for backward compatibility
    contact_info?: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    pickup_location?: string;
    dropoff_location?: string;
    pickup_location_coords?: any;
    dropoff_location_coords?: any;
    preferred_date?: string;
    is_date_flexible?: boolean;
    floor_pickup?: string;
    floor_dropoff?: string;
    elevator_pickup?: boolean;
    elevator_dropoff?: boolean;
    message?: string;
    calculated_distance_km?: number;
    calculated_duration_seconds?: number;
    calculated_duration_text?: string;
    distance_provider?: string;
  }