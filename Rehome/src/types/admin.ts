// Transportation request interface
export interface TransportRequest {
    id: string;
    order_number: string;
    created_at: string;
    customer_email: string;
    customer_name: string;
    city: string;
    date: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'Open' | 'Contacted/ Pending' | 'Confirmed' | 'Completed';
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

  // Item donation interface
  export interface ItemDonation {
    id: string;
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
    donation_type: 'charity' | 'recycling' | 'other';
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
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'approved';
    created_at: string;
    updated_at: string;
  }

  // Special request interface
  export interface SpecialRequest {
    id: string;
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
    calculated_distance_km?: number;
    calculated_duration_seconds?: number;
    calculated_duration_text?: string;
    distance_provider?: string;
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
    created_at: string;
    updated_at: string;
    photo_urls?: string[];
  }