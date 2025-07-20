// Transportation request interface
export interface TransportRequest {
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
  }
  
  // Time block interface
  export interface TimeBlock {
    id: string;
    startTime: string;
    endTime: string;
    cities: string[];
    discountPercentage: number;
  }