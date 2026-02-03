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
      lateBookingFee?: number;
      subtotal?: number;
      total?: number;
      breakdown?: any;
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

  // Special request interface
  export interface SpecialRequest {
    id: number;
    selected_services: string[];
    message?: string;
    contact_info: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    pickup_location?: string;
    dropoff_location?: string;
    pickup_location_coords?: any;
    dropoff_location_coords?: any;
    request_type?: string;
    preferred_date?: string;
    is_date_flexible: boolean;
    floor_pickup?: string;
    floor_dropoff?: string;
    elevator_pickup?: boolean;
    elevator_dropoff?: boolean;
    pickup_floor?: string;
    dropoff_floor?: string;
    pickup_elevator?: boolean;
    dropoff_elevator?: boolean;
    calculated_distance_km?: number;
    calculated_duration_seconds?: number;
    calculated_duration_text?: string;
    distance_provider?: string;
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | LegacyRequestStatus;
    created_at: string;
    updated_at: string;
    photo_urls?: string[];
  }