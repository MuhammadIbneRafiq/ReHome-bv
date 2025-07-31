import { 
  pricingConfig, 
  cityBaseCharges, 
  getItemPoints, 
} from '../lib/constants';
import { findClosestSupportedCity} from '../utils/locationServices';
import API_ENDPOINTS from '../lib/api/config';

export interface PricingBreakdown {
  basePrice: number;
  itemValue: number;
  distanceCost: number;
  carryingCost: number;
  assemblyCost: number;
  extraHelperCost: number;
  subtotal: number;
  studentDiscount: number;
  total: number;
  earlyBookingDiscount: number; // New field for early booking discount
  breakdown: {
    baseCharge: {
      city: string | null;
      isCityDay: boolean;
      isEarlyBooking: boolean;
      originalPrice: number;
      finalPrice: number;
      type?: string;
    };
    items: {
      totalPoints: number;
      multiplier: number;
      cost: number;
    };
    distance: {
      distanceKm: number;
      category: 'small' | 'medium' | 'long';
      rate: number;
      cost: number;
    };
    carrying: {
      floors: number;
      itemBreakdown: Array<{
        itemId: string;
        points: number;
        multiplier: number;
        cost: number;
      }>;
      totalCost: number;
    };
    assembly: {
      itemBreakdown: Array<{
        itemId: string;
        points: number;
        multiplier: number;
        cost: number;
      }>;
      totalCost: number;
    };
    extraHelper: {
      totalPoints: number;
      category: 'small' | 'big';
      cost: number;
    };
  };
}

export interface PricingInput {
  serviceType: 'house-moving' | 'item-transport';
  pickupLocation: string;
  dropoffLocation: string;
  distanceKm?: number; // Calculated distance between locations
  selectedDate: string;
  pickupDate?: string; // New field for pickup date
  dropoffDate?: string; // New field for dropoff date
  isDateFlexible: boolean;
  itemQuantities: { [key: string]: number };
  floorPickup: number;
  floorDropoff: number;
  elevatorPickup: boolean;
  elevatorDropoff: boolean;
  assemblyItems: { [key: string]: boolean };
  extraHelperItems: { [key: string]: boolean };
  carryingServiceItems?: { [key: string]: boolean }; // New field for carrying service items
  isStudent: boolean;
  hasStudentId: boolean;
  isEarlyBooking?: boolean; // For empty calendar days
  pickupPlace?: any; // Google Places object for pickup location
  dropoffPlace?: any; // Google Places object for dropoff location
  selectedDateRange?: { start: string; end: string }; // New field for flexible date range
}

class PricingService {

  async calculatePricing(input: PricingInput): Promise<PricingBreakdown> {
  
    const breakdown: PricingBreakdown = {
      basePrice: 0,
      itemValue: 0,
      distanceCost: 0,
      carryingCost: 0,
      assemblyCost: 0,
      extraHelperCost: 0,
      subtotal: 0,
      studentDiscount: 0,
      total: 0,
      earlyBookingDiscount: 0, // Initialize new field
      breakdown: {
        baseCharge: {
          city: null,
          isCityDay: false,
          isEarlyBooking: false,
          originalPrice: 0,
          finalPrice: 0,
        },
        items: {
          totalPoints: 0,
          multiplier: 0,
          cost: 0,
        },
        distance: {
          distanceKm: 0,
          category: 'small',
          rate: 0,
          cost: 0,
        },
        carrying: {
          floors: 0,
          itemBreakdown: [],
          totalCost: 0,
        },
        assembly: {
          itemBreakdown: [],
          totalCost: 0,
        },
        extraHelper: {
          totalPoints: 0,
          category: 'small',
          cost: 0,
        },
      },
    };

    // 1. Calculate base charge (async)
    await this.calculateBaseChargeBreakdown(input, breakdown);

    // 2. Calculate distance cost (async)
    await this.calculateDistanceBreakdown(input, breakdown);

    // 3. Calculate item value
    this.calculateItemValue(input, breakdown);

    // 4. Calculate carrying cost (add-on)
    this.calculateCarryingCost(input, breakdown);

    // 5. Calculate assembly cost (add-on)
    this.calculateAssemblyCost(input, breakdown);

    // 6. Calculate extra helper cost
    this.calculateExtraHelperCost(input, breakdown);

    // 7. Calculate totals and discounts
    this.calculateTotals(input, breakdown);

    return breakdown;
  }

  /**
   * Calculate base charge breakdown based on location, date, and service type
   */
  private async calculateBaseChargeBreakdown(input: PricingInput, breakdown: PricingBreakdown) {
    try {     
      // Determine if this is an intercity move
      const pickupResult = await findClosestSupportedCity(input.pickupPlace);
      const dropoffResult = await findClosestSupportedCity(input.dropoffPlace);
      const pickupCity = pickupResult.city;
      const dropoffCity = dropoffResult.city;
      const pickupDistanceDifference = pickupResult.distanceDifference;
      const dropoffDistanceDifference = dropoffResult.distanceDifference;
      
      
      if (!pickupCity || !dropoffCity) {
        breakdown.basePrice = 0;
        breakdown.breakdown.baseCharge.city = null;
        breakdown.breakdown.baseCharge.type = 'Location not supported';
        return;
      }
      
      
      const isIntercity = pickupCity !== dropoffCity && dropoffCity;
      
      let finalCharge = 0;
      let chargeType = '';
      let isCheapRate = false;
 
      // Calculate early booking discount (10%) - only for fixed dates and flexible ranges
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // FIXED DATE: isDateFlexible = false AND no selectedDateRange.end
      if (!input.isDateFlexible && !input.selectedDateRange?.end) {
        console.log('🗓️ FIXED DATE MODE!', input.selectedDate || `pickup: ${input.pickupDate}, dropoff: ${input.dropoffDate}`);
         
        if (input.serviceType === 'item-transport') {
          // Item transport with different pickup/dropoff dates
          finalCharge = await this.calculateIntercityItemTransportCharge(
            input, pickupCity, dropoffCity, pickupDistanceDifference, dropoffDistanceDifference
          );
          chargeType = 'Intercity Rate';
        } else if (input.serviceType === 'house-moving') {
          // House Moving Fixed Date Pricing Logic
          const selectedDate = new Date(input.selectedDate);
          const dropoffResult = await findClosestSupportedCity(input.dropoffPlace);
          const dropoffCity = dropoffResult.city || pickupCity;
          
          let baseCharge: number;
          let isCheapRate: boolean;
          
          // Check if cities are included in calendar on that date
          const isIncludedPickup = await this.isCityDay(pickupCity, selectedDate);
          const isIncludedDropoff = await this.isCityDay(dropoffCity, selectedDate);
          
          // Check if calendar is empty for this date (treats as "included")
          const isEmpty = await this.isCompletelyEmptyCalendarDay(selectedDate);
          const isCheapPickup = isIncludedPickup || isEmpty;
          const isCheapDropoff = isIncludedDropoff || isEmpty;
          
          const isSameCity = dropoffCity === pickupCity;
          
          if (isSameCity) {
            // WITHIN CITY scenario
            if (isCheapPickup) {
              // City included in calendar on that date or empty date = cheap base charge
              baseCharge = cityBaseCharges[pickupCity]?.cityDay || 0;
              isCheapRate = true;
              console.log(`[DEBUG] ${pickupCity} - House Moving Within City, cheap rate (included/empty): €${baseCharge}`);
            } else {
              // City is not included in calendar on that date = standard base charge
              baseCharge = cityBaseCharges[pickupCity]?.normal || 0;
              isCheapRate = false;
              console.log(`[DEBUG] ${pickupCity} - House Moving Within City, standard rate (not included): €${baseCharge}`);
            }
          } else {
            // BETWEEN CITY scenario
            if (isCheapPickup && isCheapDropoff) {
              // If both cities are included = (cheap base charge pickup + cheap base charge dropoff) / 2
              baseCharge = (cityBaseCharges[pickupCity]?.cityDay + cityBaseCharges[dropoffCity]?.cityDay) / 2;
              isCheapRate = true;
              console.log(`[DEBUG] House Moving Between Cities, both included: (€${cityBaseCharges[pickupCity]?.cityDay} + €${cityBaseCharges[dropoffCity]?.cityDay}) / 2 = €${baseCharge}`);
            } else if (isCheapPickup && !isCheapDropoff) {
              // If Pickup City is included but dropoff is not included on that date or date is empty in calendar = (cheap base charge pickup + standard base charge dropoff) / 2
              baseCharge = (cityBaseCharges[pickupCity]?.cityDay + cityBaseCharges[dropoffCity]?.normal) / 2;
              isCheapRate = false;
              console.log(`[DEBUG] House Moving Between Cities, pickup included: (€${cityBaseCharges[pickupCity]?.cityDay} + €${cityBaseCharges[dropoffCity]?.normal}) / 2 = €${baseCharge}`);
            } else if (!isCheapPickup && isCheapDropoff) {
              // If Pickup City is not included on that date but dropoff is = (cheap base charge dropoff + standard base charge pickup) / 2
              baseCharge = (cityBaseCharges[pickupCity]?.normal + cityBaseCharges[dropoffCity]?.cityDay) / 2;
              isCheapRate = false;
              console.log(`[DEBUG] House Moving Between Cities, dropoff included: (€${cityBaseCharges[pickupCity]?.normal} + €${cityBaseCharges[dropoffCity]?.cityDay}) / 2 = €${baseCharge}`);
            } else {
              // If none of the 2 cities is included = use the higher standard base charge of the 2 cities
              baseCharge = Math.max(cityBaseCharges[pickupCity]?.normal, cityBaseCharges[dropoffCity]?.normal);
              isCheapRate = false;
              console.log(`[DEBUG] House Moving Between Cities, neither included: max(€${cityBaseCharges[pickupCity]?.normal}, €${cityBaseCharges[dropoffCity]?.normal}) = €${baseCharge}`);
            }
          }
          
          // Add extra km charge ONLY if distance difference > 8km
          if (pickupDistanceDifference > 8) {
            const extraCharge = Math.round((pickupDistanceDifference - 8) * 3);
            console.log(`[DEBUG] ${pickupCity} - Adding extra km charge: €${extraCharge} for ${Math.round(pickupDistanceDifference - 8)}km beyond 8km`);
            baseCharge += extraCharge;
          }
          
          console.log(`[DEBUG] ${pickupCity} - Final charge: €${baseCharge} (isCheapRate: ${isCheapRate})`);
          
          finalCharge = baseCharge;
          breakdown.breakdown.baseCharge.city = pickupCity;
          chargeType = isSameCity ? 'Within City Rate' : 'Between City Rate';
        }
      } 
      // FLEXIBLE DATE RANGE: isDateFlexible = false AND selectedDateRange.start AND selectedDateRange.end
      else if (!input.isDateFlexible && input.selectedDateRange?.start && input.selectedDateRange?.end) {
        console.log('📅 FLEXIBLE DATE RANGE MODE!', input.selectedDateRange);
        const startDate = new Date(input.selectedDateRange.start);
        const endDate = new Date(input.selectedDateRange.end);
        const rangeDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        if (rangeDays > 7) {
          // Range above 1 week → cheap base charge for pickup city
          finalCharge = cityBaseCharges[pickupCity]?.cityDay ;
          isCheapRate = true;
          chargeType = 'Intercity Rate';
        } else {
          // Range 1 week or below → check if city has actual city days during range
          const hasCityDaysInRange = await this.checkCityDaysInRange(pickupCity, startDate, endDate);
          const isEmpty = await this.isCompletelyEmptyCalendarDay(startDate);
          console.log('🔍 [DEBUG] hasCityDaysInRange for', pickupCity, ':', hasCityDaysInRange);
          if (hasCityDaysInRange) {
            if (dropoffCity === pickupCity) { 
              finalCharge = cityBaseCharges[pickupCity]?.cityDay;
              isCheapRate = true;
              chargeType =  pickupCity + ' - Cheap Rate';
            }
            else {
              finalCharge = (cityBaseCharges[pickupCity]?.cityDay + cityBaseCharges[dropoffCity]?.normal) / 2;
              isCheapRate = true;
              chargeType = isIntercity ? 'Intercity Rate' : `${pickupCity} - Cheap Rate`;
            }
          } else if (isEmpty) {
            if (dropoffCity === pickupCity) { 
              finalCharge = cityBaseCharges[pickupCity]?.cityDay;
              isCheapRate = true;
              chargeType =  pickupCity + ' - Cheap Rate';
            }
            else {
              finalCharge = (cityBaseCharges[pickupCity]?.cityDay + cityBaseCharges[dropoffCity]?.cityDay) / 2;
              isCheapRate = false;
              chargeType = `${pickupCity} - Normal Rate`;
            }
          }
          else {
            finalCharge = cityBaseCharges[pickupCity]?.normal || 0;
            isCheapRate = false;
            chargeType = isIntercity ? 'Intercity Rate' : `${pickupCity} - Normal Rate`;
          }
        }
        
        // Add extra km charge for pickup location
        if (pickupDistanceDifference > 0) {
          const extraCharge = Math.round(pickupDistanceDifference * 3);
          finalCharge += extraCharge;
        }
                
      } else if (input.isDateFlexible && !input.selectedDateRange?.start) {
        // ReHome suggest date → always cheapest base price for pickup city
        console.log('🏠 REHOME CHOOSE MODE! (Cheapest rates)');
        finalCharge = cityBaseCharges[pickupCity]?.cityDay || 0;
        isCheapRate = true;
        chargeType += 'ReHome- Cheap Rate';
        // Add extra km charge for pickup location if non-base city
        if (pickupDistanceDifference > 8) {
          const extraCharge = Math.round((pickupDistanceDifference - 8) * 3);
          finalCharge += extraCharge;
          chargeType += 'ReHome- Cheap Rate';
        }
      }
      
      // Set breakdown values
      breakdown.basePrice = finalCharge;
      breakdown.breakdown.baseCharge.originalPrice = finalCharge;
      breakdown.breakdown.baseCharge.finalPrice = finalCharge;
      breakdown.breakdown.baseCharge.isCityDay = isCheapRate;
      breakdown.breakdown.baseCharge.isEarlyBooking = false;
      
      // Set city if not set yet
      if (!breakdown.breakdown.baseCharge.city) {
        breakdown.breakdown.baseCharge.city = pickupCity;
      }
      
      if (chargeType) {
        breakdown.breakdown.baseCharge.type = chargeType;
      }
            
    } catch (error) {
      console.error('Error calculating base charge breakdown:', error);
      breakdown.basePrice = 0;
      breakdown.breakdown.baseCharge.city = null;
      breakdown.breakdown.baseCharge.type = 'Error calculating price';
    }
  }
    /**
  * Calculate base charge for item transport with different pickup/dropoff dates
  */
  private async calculateIntercityItemTransportCharge(
    input: PricingInput,
    pickupCity: string,
    dropoffCity: string,
    pickupDistanceDifference: number,
    dropoffDistanceDifference: number
  ): Promise<number> {
    // Check if calendar is empty for THIS specific city on this date
    const isEmptyPickup = await this.isCompletelyEmptyCalendarDay(new Date(input.pickupDate || ''));
    const isEmptyDropoff = await this.isCompletelyEmptyCalendarDay(new Date(input.dropoffDate || ''));
    let baseCharge: number;
    const isIncludedPickup = await this.isCityDay(pickupCity, new Date(input.pickupDate || ''));
    const isIncludedDropoff = await this.isCityDay(dropoffCity, new Date(input.dropoffDate || ''));
    
    // Check if city is included OR date is empty (for "cheap base charge" logic)
    const isCheapPickup = isIncludedPickup || isEmptyPickup;
    const isCheapDropoff = isIncludedDropoff || isEmptyDropoff;
    const isSameDate = input.pickupDate === input.dropoffDate;
    const isSameCity = dropoffCity === pickupCity;
    
    // Item Transport Pricing Logic based on exact specifications
    if (isSameCity) {
      // WITHIN CITY scenarios
      if (isSameDate) {
        // Within city, same date
        if (isCheapPickup) {
          // City included in calendar on that date or empty date = cheap base charge
          baseCharge = cityBaseCharges[pickupCity]?.cityDay;
          console.log(`[DEBUG] ${pickupCity} - Within city, same date, cheap rate (included/empty): €${baseCharge}`);
        } else {
          // City is not included in calendar on that date = standard base charge
          baseCharge = cityBaseCharges[pickupCity]?.normal;
          console.log(`[DEBUG] ${pickupCity} - Within city, same date, standard rate (not included): €${baseCharge}`);
        }
      } else {
        // Within city, different date
        if (isCheapPickup && isCheapDropoff) {
          // City is included in calendar or empty on both dates = cheap base charge
          baseCharge = cityBaseCharges[pickupCity]?.cityDay;
          console.log(`[DEBUG] ${pickupCity} - Within city, different dates, both cheap: €${baseCharge}`);
        } else if (isCheapPickup || isCheapDropoff) {
          // City is included in calendar or empty only on one date = (cheap base charge + standard base charge) / 2
          const cheapRate = cityBaseCharges[pickupCity]?.cityDay;
          const standardRate = cityBaseCharges[pickupCity]?.normal;
          baseCharge = (cheapRate + standardRate) / 2;
          console.log(`[DEBUG] ${pickupCity} - Within city, different dates, one cheap: (€${cheapRate} + €${standardRate}) / 2 = €${baseCharge}`);
        } else {
          // City is included in calendar on none of the 2 dates = standard base charge
          baseCharge = cityBaseCharges[pickupCity]?.normal;
          console.log(`[DEBUG] ${pickupCity} - Within city, different dates, neither cheap: €${baseCharge}`);
        }
      }
    } else {
      // BETWEEN CITY scenarios
      if (isSameDate) {
        // Between city, same date
        if (isCheapPickup && isCheapDropoff) {
          // Pickup city and dropoff city are included = (cheap base charge pickup + cheap base charge dropoff) / 2
          baseCharge = (cityBaseCharges[pickupCity]?.cityDay + cityBaseCharges[dropoffCity]?.cityDay) / 2;
          console.log(`[DEBUG] Between cities, same date, both included: (€${cityBaseCharges[pickupCity]?.cityDay} + €${cityBaseCharges[dropoffCity]?.cityDay}) / 2 = €${baseCharge}`);
        } else if (isCheapPickup || isCheapDropoff) {
          // Only one of the 2 is included = (cheap base charge for included city + standard base charge for non-included) / 2
          const cheapCity = isCheapPickup ? pickupCity : dropoffCity;
          const standardCity = isCheapPickup ? dropoffCity : pickupCity;
          baseCharge = (cityBaseCharges[cheapCity]?.cityDay + cityBaseCharges[standardCity]?.normal) / 2;
          console.log(`[DEBUG] Between cities, same date, one included: (€${cityBaseCharges[cheapCity]?.cityDay} + €${cityBaseCharges[standardCity]?.normal}) / 2 = €${baseCharge}`);
        } else {
          // If none of the 2 cities is included = use the higher standard base charge of the 2 cities
          baseCharge = Math.max(cityBaseCharges[pickupCity]?.normal, cityBaseCharges[dropoffCity]?.normal);
          console.log(`[DEBUG] Between cities, same date, neither included: max(€${cityBaseCharges[pickupCity]?.normal}, €${cityBaseCharges[dropoffCity]?.normal}) = €${baseCharge}`);
        }
      } else {
        // Between city, different date
        if (isCheapPickup && isCheapDropoff) {
          // Both cities included in calendar on their date or both dates empty = (cheap base charge pickup + cheap base charge dropoff) / 2
          baseCharge = (cityBaseCharges[pickupCity]?.cityDay + cityBaseCharges[dropoffCity]?.cityDay) / 2;
          console.log(`[DEBUG] Between cities, different dates, both included: (€${cityBaseCharges[pickupCity]?.cityDay} + €${cityBaseCharges[dropoffCity]?.cityDay}) / 2 = €${baseCharge}`);
        } else if (isCheapPickup || isCheapDropoff) {
          // Only one city is included in calendar on their date or date is empty = (cheap base charge for that city + standard base charge for the other) / 2
          const cheapCity = isCheapPickup ? pickupCity : dropoffCity;
          const standardCity = isCheapPickup ? dropoffCity : pickupCity;
          baseCharge = (cityBaseCharges[cheapCity]?.cityDay + cityBaseCharges[standardCity]?.normal) / 2;
          console.log(`[DEBUG] Between cities, different dates, one included: (€${cityBaseCharges[cheapCity]?.cityDay} + €${cityBaseCharges[standardCity]?.normal}) / 2 = €${baseCharge}`);
        } else {
          // None of the 2 dates include the respective city or an empty date = use the higher standard base charge of the 2 cities
          baseCharge = Math.max(cityBaseCharges[pickupCity]?.normal, cityBaseCharges[dropoffCity]?.normal);
          console.log(`[DEBUG] Between cities, different dates, neither included: max(€${cityBaseCharges[pickupCity]?.normal}, €${cityBaseCharges[dropoffCity]?.normal}) = €${baseCharge}`);
        }
      }
    }

    // Add extra km charge ONLY if distance difference > 8km
    if (pickupDistanceDifference > 8) {
      const extraCharge = Math.round((pickupDistanceDifference - 8) * 3);
      baseCharge += extraCharge;
    }
    if (dropoffDistanceDifference > 8) {
      const extraCharge = Math.round((dropoffDistanceDifference - 8) * 3);
      baseCharge += extraCharge;
    }
        
    return baseCharge;
  }
  
  /**
   * Check if a city has actual city days (scheduled days) within the given date range
   * This is different from checkCityAvailabilityInRange which includes empty days
   */
  private async checkCityDaysInRange(city: string, startDate: Date, endDate: Date): Promise<boolean> {
    try {
      // Validate dates before using them
      if (!startDate || isNaN(startDate.getTime())) {
        console.warn('[checkCityDaysInRange] Invalid startDate provided:', startDate);
        return false;
      }
      if (!endDate || isNaN(endDate.getTime())) {
        console.warn('[checkCityDaysInRange] Invalid endDate provided:', endDate);
        return false;
      }

      const currentDate = new Date(startDate);
      
      // Check each day in the range for actual city days (scheduled days)
      while (currentDate <= endDate) {
        const isCityDay = await this.isCityDay(city, currentDate);
        const isEmpty = await this.isCompletelyEmptyCalendarDay(currentDate);
        
        if (isCityDay || isEmpty) {
          console.log(`🎯 [DEBUG] Found city day for ${city} on ${currentDate.toISOString().split('T')[0]}`);
          return true; // Found at least one city day
        }
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      console.log(`❌ [DEBUG] No city days found for ${city} in range ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      return false; // No city days found in range
    } catch (error) {
      console.error('[checkCityDaysInRange] Error:', error);
      return false; // Fallback to not available
    }
  }

  /**
   * Calculate distance cost breakdown (async)
   */
  private async calculateDistanceBreakdown(input: PricingInput, breakdown: PricingBreakdown) {
    if (!input.pickupLocation || !input.dropoffLocation) {
      breakdown.distanceCost = 0;
      breakdown.breakdown.distance.distanceKm = 0;
      return;
    }

    try {
      const distanceResult = await this.calculateDistanceCost(input.distanceKm);
      
      breakdown.distanceCost = distanceResult.cost;
      breakdown.breakdown.distance.distanceKm = distanceResult.distance;
      
      // Determine category and rate
      if (distanceResult.distance < 10) {
        breakdown.breakdown.distance.category = 'small';
        breakdown.breakdown.distance.rate = 0;
      } else if (distanceResult.distance <= 50) {
        breakdown.breakdown.distance.category = 'medium';
        breakdown.breakdown.distance.rate = 0.7;
      } else {
        breakdown.breakdown.distance.category = 'long';
        breakdown.breakdown.distance.rate = 0.5;
      }
      
      breakdown.breakdown.distance.cost = distanceResult.cost;
    } catch (error) {
      console.error('Error calculating distance breakdown:', error);
      breakdown.distanceCost = 0;
      breakdown.breakdown.distance.distanceKm = 0;
    }
  }

  /**
   * Calculate base charge based on location and date
   */
  async calculateBaseCharge(distanceKm: number, pickup: string, date?: Date, placeObject?: any): Promise<{ charge: number; type: string; city: string; distance: number }> {
    // No pricing without both pickup location and date
    if (!pickup || !date) {
      return { charge: 0, type: 'No estimate available', city: '', distance: 0 };
    }
    // Find closest supported city
    const { city, distanceDifference } = await findClosestSupportedCity(placeObject);
    if (!city) {
      return { charge: 0, type: 'Location not supported', city: '', distance: 0 };
    }

    // Check if it's a city day (scheduled in that city)
    const isScheduledDay = await this.isCityDay(city, date);
    // Check if it's an early booking (at least 21 days in advance)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Determine base charge
    let baseCharge: number;
    let chargeType: string;
    if (isScheduledDay) {
      // City day pricing - aligned with schedule
      baseCharge = cityBaseCharges[city]?.cityDay || 0;
      chargeType = `${city} - Cheap Rate`;
    } else {
      // Normal pricing - doesn't align with schedule and not early booking
      baseCharge = cityBaseCharges[city]?.normal || 0;
      chargeType = `${city} - Normal Rate`;
    }
    // Apply city center extra charge if beyond city center range
    if (distanceDifference > 0) {
      const extraCharge = Math.round(distanceDifference * 3); // €3 per km beyond 8km
      baseCharge += extraCharge;
    }
    return {
      charge: baseCharge,
      type: chargeType,
      city,
      distance: Math.round(distanceKm * 10) / 10 // Round to 1 decimal
    };
  }

  private async getCityScheduleStatus(city: string, date: Date): Promise<{
    isScheduled: boolean;
    isEmpty: boolean;
  }> {
    try {
      // Validate date before using it
      if (!date || isNaN(date.getTime())) {
        console.warn('[getCityScheduleStatus] Invalid date provided:', date);
        return {
          isScheduled: false,
          isEmpty: true
        };
      }

      const dateStr = date.toISOString().split('T')[0];
      const baseUrl = API_ENDPOINTS.AUTH.LOGIN.split('/api/auth/login')[0];
      const url = `${baseUrl}/api/city-schedule-status?city=${encodeURIComponent(city)}&date=${dateStr}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch schedule status: ${response.status}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(`Backend error: ${result.error}`);
      }
      return {
        isScheduled: result.data.isScheduled,
        isEmpty: result.data.isEmpty
      };
    } catch (error) {
      console.error('[getCityScheduleStatus] Error:', error);
      // Fallback to safe defaults
      return {
        isScheduled: false,
        isEmpty: true
      };
    }
  }

  private async isCityDay(city: string, date: Date): Promise<boolean> {
    // Validate date before using it
    if (!date || isNaN(date.getTime())) {
      console.warn('[isCityDay] Invalid date provided:', date);
      return false;
    }

    const { isScheduled } = await this.getCityScheduleStatus(city, date);
    console.log(`[DEBUG] isCityDay for ${city} on ${date.toISOString().split('T')[0]}:`, isScheduled);
    return isScheduled;
  }


  private async isCompletelyEmptyCalendarDay(date: Date): Promise<boolean> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const baseUrl = API_ENDPOINTS.AUTH.LOGIN.split('/api/auth/login')[0];
      const url = `${baseUrl}/api/check-all-cities-empty?date=${dateStr}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to fetch all cities empty status: ${response.status}`);
        return false; // Fallback to not empty
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.warn(`Backend error: ${result.error}`);
        return false;
      }
      
      console.log(`[DEBUG] All cities empty on ${dateStr}:`, result.data.isEmpty);
      return result.data.isEmpty;
    } catch (error) {
      return false; // Fallback to not empty
    }
  }


  private calculateItemValue(input: PricingInput, breakdown: PricingBreakdown) {
    let totalPoints = 0;
    
    for (const [itemId, quantity] of Object.entries(input.itemQuantities)) {
      if (quantity > 0) {
        const points = getItemPoints(itemId);
        totalPoints += points * quantity;
      }
    }

    const multiplier = input.serviceType === 'house-moving' 
      ? pricingConfig.baseMultipliers.houseMovingItemMultiplier 
      : pricingConfig.baseMultipliers.itemTransportMultiplier;

    breakdown.breakdown.items.totalPoints = totalPoints;
    breakdown.breakdown.items.multiplier = multiplier;
    breakdown.breakdown.items.cost = totalPoints * multiplier;
    breakdown.itemValue = totalPoints * multiplier;
  }

  /**
   * Calculate distance cost between pickup and dropoff
   */
  async calculateDistanceCost(providedDistance?: number): Promise<{ cost: number; distance: number; type: string }> {
    let distance: number;
    distance = providedDistance || 0;

    let cost = 0;
    let type = '';
    
    if (distance < 10) {
      cost = 0;
      type = 'Free (under 10km)';
    } else if (distance <= 50) {
      cost = Math.round(distance * 0.7);
      type = `Medium distance (${Math.round(distance)}km × €0.70)`;
    } else {
      // For long distance moves (>50km), use a different pricing structure
      // Base cost for first 50km + additional cost for remaining distance
      const baseCost = Math.round(50 * 0.7); // €0.70 per km for first 50km
      const additionalKm = distance - 50;
      const additionalCost = Math.round(additionalKm * 0.5); // €0.50 per km for additional distance
      cost = baseCost + additionalCost;
      type = `Long distance: €${baseCost} (first 50km) + €${additionalCost} (${Math.round(additionalKm)}km additional)`;
    }
    
    return { 
      cost, 
      distance: Math.round(distance * 10) / 10, // Round to 1 decimal
      type 
    };
  }

  private calculateCarryingCost(input: PricingInput, breakdown: PricingBreakdown) {
    // Calculate floors based on new elevator logic:
    // - If elevator is available, count as 1 floor (same effort as 1 level)
    // - If no elevator, count actual floors above ground level
    const pickupFloors = input.elevatorPickup ? 1 : Math.max(0, input.floorPickup);
    const dropoffFloors = input.elevatorDropoff ? 1 : Math.max(0, input.floorDropoff);
    console.log(pickupFloors, 'pickupFloors')
    console.log(dropoffFloors, 'dropoffFloors')
    const totalFloors = pickupFloors + dropoffFloors;

    breakdown.breakdown.carrying.floors = totalFloors;

    // If no floors, no carrying cost
    if (totalFloors === 0) {
      breakdown.carryingCost = 0;
      return;
    }

    let totalCarryingPoints = 0;
    const itemBreakdown: Array<{
      itemId: string;
      points: number;
      multiplier: number;
      cost: number;
    }> = [];

    // Use carryingServiceItems if provided, otherwise use all items with quantities > 0
    const itemsToCarry = input.carryingServiceItems || {};
    
    for (const [itemId, quantity] of Object.entries(input.itemQuantities)) {
      if (quantity > 0) {
        // Check if this item needs carrying service
        const needsCarrying = itemsToCarry[itemId] || false;
        
        if (needsCarrying) {
          const points = getItemPoints(itemId);
          const multiplier = points <= pricingConfig.carryingMultipliers.lowValue.threshold
            ? pricingConfig.carryingMultipliers.lowValue.multiplier
            : pricingConfig.carryingMultipliers.highValue.multiplier;
          
          const itemCarryingPoints = points * multiplier * totalFloors * quantity;
          totalCarryingPoints += itemCarryingPoints;

          itemBreakdown.push({
            itemId,
            points: points * quantity,
            multiplier: multiplier * totalFloors,
            cost: itemCarryingPoints * pricingConfig.baseMultipliers.addonMultiplier
          });
        }
      }
    }
    // Apply x3 multiplier for add-ons as per pricing rules
    const totalCost = totalCarryingPoints * pricingConfig.baseMultipliers.addonMultiplier;

    breakdown.breakdown.carrying.itemBreakdown = itemBreakdown;
    breakdown.breakdown.carrying.totalCost = totalCost;
    breakdown.carryingCost = totalCost;
  }

  private calculateAssemblyCost(input: PricingInput, breakdown: PricingBreakdown) {
    let totalAssemblyPoints = 0;
    const itemBreakdown: Array<{
      itemId: string;
      points: number;
      multiplier: number;
      cost: number;
    }> = [];

    for (const [itemId, needsAssembly] of Object.entries(input.assemblyItems)) {
      if (needsAssembly && input.itemQuantities[itemId] > 0) {
        const points = getItemPoints(itemId);
        const quantity = input.itemQuantities[itemId];
        const multiplier = points <= pricingConfig.assemblyMultipliers.lowValue.threshold
          ? pricingConfig.assemblyMultipliers.lowValue.multiplier
          : pricingConfig.assemblyMultipliers.highValue.multiplier;
        
        const itemAssemblyPoints = points * multiplier * quantity;
        totalAssemblyPoints += itemAssemblyPoints;

        itemBreakdown.push({
          itemId,
          points: points * quantity,
          multiplier,
          cost: itemAssemblyPoints * pricingConfig.baseMultipliers.addonMultiplier
        });
      }
    }

    // Apply x3 multiplier for add-ons as per pricing rules
    const totalCost = totalAssemblyPoints * pricingConfig.baseMultipliers.addonMultiplier;

    breakdown.breakdown.assembly.itemBreakdown = itemBreakdown;
    breakdown.breakdown.assembly.totalCost = totalCost;
    breakdown.assemblyCost = totalCost;
  }

  private calculateExtraHelperCost(input: PricingInput, breakdown: PricingBreakdown) {
    // Check if any items need extra helper
    const needsExtraHelper = Object.values(input.extraHelperItems).some(Boolean);
    
    if (!needsExtraHelper) {
      breakdown.extraHelperCost = 0;
      return;
    }

    // Calculate total quantity for items that need extra helper
    let totalQuantity = 0;
    for (const [itemId, needsHelper] of Object.entries(input.extraHelperItems)) {
      if (needsHelper && input.itemQuantities[itemId] > 0) {
        const quantity = input.itemQuantities[itemId];
        totalQuantity += quantity;
      }
    }

    const category = totalQuantity <= pricingConfig.extraHelperPricing.smallMove.threshold ? 'small' : 'big';
    const cost = category === 'small' 
      ? pricingConfig.extraHelperPricing.smallMove.price 
      : pricingConfig.extraHelperPricing.bigMove.price;

    breakdown.breakdown.extraHelper.totalPoints = totalQuantity;
    breakdown.breakdown.extraHelper.category = category;
    breakdown.breakdown.extraHelper.cost = cost;
    breakdown.extraHelperCost = cost;
  }

  private calculateTotals(input: PricingInput, breakdown: PricingBreakdown) {
    breakdown.subtotal = breakdown.basePrice + breakdown.itemValue + breakdown.distanceCost + 
                        breakdown.carryingCost + breakdown.assemblyCost + breakdown.extraHelperCost;

    // Apply student discount if applicable
    if (input.isStudent && input.hasStudentId) {
      breakdown.studentDiscount = breakdown.subtotal * pricingConfig.studentDiscount;
      breakdown.total = breakdown.subtotal - breakdown.studentDiscount;
    } else {
      breakdown.studentDiscount = 0;
      breakdown.total = breakdown.subtotal;
    }

    const referenceDate = new Date(input.selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysInAdvance = Math.floor((referenceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isEarlyBooking = daysInAdvance >= 14; // 2 weeks = 14 days
  

    // Apply early booking discount to the total (after student discount)
    if (isEarlyBooking) {
      input.isEarlyBooking = true;
      breakdown.earlyBookingDiscount = Math.round(breakdown.total * 0.10 * 100) / 100;
      breakdown.total = Math.round((breakdown.subtotal - breakdown.earlyBookingDiscount) * 100) / 100;
    } else {
      breakdown.earlyBookingDiscount = 0;
    }
  }
}

export { PricingService };
export const pricingService = new PricingService();
export default pricingService; 