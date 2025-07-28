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
      
      
      if (!pickupCity) {
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
         
        if (isIntercity && input.serviceType === 'item-transport' && input.pickupDate && input.dropoffDate) {
          // Item transport with different pickup/dropoff dates
          finalCharge = await this.calculateIntercityItemTransportCharge(
            input, pickupCity, dropoffCity, pickupDistanceDifference, dropoffDistanceDifference
          );
          chargeType = 'Intercity Rate';
        } else if (isIntercity) {
          // House moving or item transport same day intercity - average rates and add distance
          const intercityResult = await this.calculateIntercityFixedDateCharge(
            input, pickupCity, dropoffCity, pickupDistanceDifference, dropoffDistanceDifference
          );
          finalCharge = intercityResult.charge;
          breakdown.breakdown.baseCharge.city = intercityResult.cityUsed;
          chargeType = 'Intercity Rate';
        } else {
          // Within city move
          console.log(`[DEBUG] Within-city move for ${pickupCity}, distanceDifference: ${pickupDistanceDifference}`);
          const result = await this.calculateWithinCityFixedDateCharge(
            input, pickupCity, pickupDistanceDifference
          );
          finalCharge = result.charge;
          isCheapRate = result.isCheapRate;
          chargeType = `${pickupCity} - ${isCheapRate ? 'Cheap Rate' : 'Normal Rate'}`;
          console.log(`[DEBUG] Within-city final charge set to: €${finalCharge}, isCheapRate: ${isCheapRate}`);
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
          finalCharge = cityBaseCharges[pickupCity]?.cityDay || 0;
          isCheapRate = true;
          chargeType = 'Intercity Rate';
        } else {
          // Range 1 week or below → check if city has actual city days during range
          const hasCityDaysInRange = await this.checkCityDaysInRange(pickupCity, startDate, endDate);
          console.log('🔍 [DEBUG] hasCityDaysInRange for', pickupCity, ':', hasCityDaysInRange);
          if (hasCityDaysInRange) {
            finalCharge = cityBaseCharges[pickupCity]?.cityDay || 0;
            isCheapRate = true;
            chargeType = isIntercity ? 'Intercity Rate' : `${pickupCity} - Cheap Rate`;
          } else {
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
      
      console.log('[DEBUG] Final result - Charge:', finalCharge, 'Type:', breakdown.breakdown.baseCharge.type);
      console.log('[DEBUG] Breakdown basePrice set to:', breakdown.basePrice);
      
    } catch (error) {
      console.error('Error calculating base charge breakdown:', error);
      breakdown.basePrice = 0;
      breakdown.breakdown.baseCharge.city = null;
      breakdown.breakdown.baseCharge.type = 'Error calculating price';
    }
  }
  
  /**
   * Calculate base charge for within-city moves on fixed dates
   */
     private async calculateWithinCityFixedDateCharge(
     input: PricingInput, 
     city: string, 
     distanceDifference: number
   ): Promise<{ charge: number; isCheapRate: boolean }> {
     // Validate selectedDate before creating Date object
     if (!input.selectedDate) {
       console.warn('[calculateWithinCityFixedDateCharge] No selectedDate provided');
       throw new Error('Selected date is required for fixed date calculation');
     }

     const selectedDate = new Date(input.selectedDate);
     
     // Validate the created Date object
     if (isNaN(selectedDate.getTime())) {
       console.warn('[calculateWithinCityFixedDateCharge] Invalid selectedDate:', input.selectedDate);
       throw new Error('Invalid selected date format');
     }
     
     // Check if calendar is empty for THIS specific city on this date
     const isEmpty = await this.isCompletelyEmptyCalendarDay(selectedDate);
     
     let baseCharge: number;
     let isCheapRate: boolean;
     
           console.log(`[DEBUG] ${city} on ${selectedDate.toISOString().split('T')[0]} - isEmpty: ${isEmpty}`);
      console.log(`[DEBUG] ${city} cityBaseCharges:`, cityBaseCharges[city]);
      
      if (isEmpty) {
        // Empty calendar for this city → cheap base charge
        baseCharge = cityBaseCharges[city]?.cityDay || 0;
        isCheapRate = true;
        console.log(`[DEBUG] ${city} - Empty calendar, using cityDay rate: €${baseCharge}`);
      } else {
        // Not empty → check if city is included on that date
        const isIncluded = await this.isCityDay(city, selectedDate);
        console.log(`[DEBUG] ${city} - Not empty, isCityDay: ${isIncluded}`);
        
        if (isIncluded) {
          baseCharge = cityBaseCharges[city]?.cityDay || 0;
          isCheapRate = true;
          console.log(`[DEBUG] ${city} - City day, using cityDay rate: €${baseCharge}`);
        } else {
          baseCharge = cityBaseCharges[city]?.normal || 0;
          isCheapRate = false;
          console.log(`[DEBUG] ${city} - Not city day, using normal rate: €${baseCharge}`);
        }
      }
     
     // Add extra km charge ONLY if distance difference > 8km
     if (distanceDifference > 8) {
       const extraCharge = Math.round((distanceDifference - 8) * 3);
       console.log(`[DEBUG] ${city} - Adding extra km charge: €${extraCharge} for ${Math.round(distanceDifference - 8)}km beyond 8km`);
       baseCharge += extraCharge;
     }
     
     console.log(`[DEBUG] ${city} - Final charge: €${baseCharge} (isCheapRate: ${isCheapRate})`);
     
     return { charge: baseCharge, isCheapRate };
   }
  
     /**
    * Calculate base charge for intercity moves on fixed dates (house moving or same-day item transport)
    */
   private async calculateIntercityFixedDateCharge(
     input: PricingInput,
     pickupCity: string,
     dropoffCity: string,
     pickupDistanceDifference: number,
     dropoffDistanceDifference: number
   ): Promise<{ charge: number, cityUsed: string }> {
     // Calculate pickup charge (without distance - will add later)
     const pickupResult = await this.calculateWithinCityFixedDateCharge(
       input, pickupCity, 0 // Don't add distance charge here
     );
     
     // Calculate dropoff charge (without distance - will add later)
     const dropoffResult = await this.calculateWithinCityFixedDateCharge(
       { ...input, selectedDate: input.selectedDate }, dropoffCity, 0 // Don't add distance charge here
     );
     
     let totalCharge = 0;
     let cityUsed = pickupCity;
     
     // Apply intercity logic: average the base rates, then add distance charges
     if (pickupResult.isCheapRate && dropoffResult.isCheapRate) {
       // Both cities are city days → average them
       totalCharge = Math.round((pickupResult.charge + dropoffResult.charge) / 2);
       cityUsed = pickupResult.charge <= dropoffResult.charge ? pickupCity : dropoffCity;
       console.log('[DEBUG] Intercity - Both cities align: Averaging charges €' + totalCharge + ' (pickup: €' + pickupResult.charge + ', dropoff: €' + dropoffResult.charge + ')');
     } else if (pickupResult.isCheapRate || dropoffResult.isCheapRate) {
       // Only one city is a city day → average city day + normal rate
       totalCharge = Math.round((pickupResult.charge + dropoffResult.charge) / 2);
       cityUsed = pickupResult.charge <= dropoffResult.charge ? pickupCity : dropoffCity;
       console.log('[DEBUG] Intercity - Mixed rates: Averaging city day + normal €' + totalCharge + ' (pickup: €' + pickupResult.charge + ', dropoff: €' + dropoffResult.charge + ')');
     } else {
       // Neither city is a city day → average normal rates
       totalCharge = Math.round((pickupResult.charge + dropoffResult.charge) / 2);
       cityUsed = pickupResult.charge <= dropoffResult.charge ? pickupCity : dropoffCity;
       console.log('[DEBUG] Intercity - Both normal rates: Averaging charges €' + totalCharge + ' (pickup: €' + pickupResult.charge + ', dropoff: €' + dropoffResult.charge + ')');
     }
     
     // Add distance charges for non-base cities (>8km)
     if (pickupDistanceDifference > 0) {
       const pickupExtraCharge = Math.round((pickupDistanceDifference - 8) * 3);
       totalCharge += pickupExtraCharge;
       console.log(`[DEBUG] Intercity - Added pickup distance charge: €${pickupExtraCharge} for ${Math.round(pickupDistanceDifference - 8)}km beyond 8km`);
     }
     
     if (dropoffDistanceDifference > 0) {
       const dropoffExtraCharge = Math.round((dropoffDistanceDifference-3) * 3);
       totalCharge += dropoffExtraCharge;
       console.log(`[DEBUG] Intercity - Added dropoff distance charge: €${dropoffExtraCharge} for ${Math.round(dropoffDistanceDifference - 8)}km beyond 8km`);
     }
     
     console.log(`[DEBUG] Intercity - Final total charge: €${totalCharge}`);
     
     return { charge: totalCharge, cityUsed };
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
     // Calculate pickup charge using pickup date (without distance - will add later)
     const pickupInput = { 
       ...input, 
       selectedDate: input.pickupDate!
     };
     const pickupResult = await this.calculateWithinCityFixedDateCharge(
       pickupInput, pickupCity, 0 // Don't add distance charge here
     );
     
     // Calculate dropoff charge using dropoff date (without distance - will add later)
     const dropoffInput = { 
       ...input, 
       selectedDate: input.dropoffDate!
     };
     const dropoffResult = await this.calculateWithinCityFixedDateCharge(
       dropoffInput, dropoffCity, 0 // Don't add distance charge here
     );
     
     // Apply the correct intercity logic based on city day alignment for each respective date
     let totalCharge: number;
     
           if (pickupResult.isCheapRate && dropoffResult.isCheapRate) {
        // Both cities are city days on their respective dates → average them
        totalCharge = Math.round((pickupResult.charge + dropoffResult.charge) / 2);
        console.log('[DEBUG] Item Transport - Both cities align on respective dates: Averaging charges €' + totalCharge + ' (pickup: €' + pickupResult.charge + ', dropoff: €' + dropoffResult.charge + ')');
      } else if (pickupResult.isCheapRate || dropoffResult.isCheapRate) {
       // Only one city is a city day on its date → average city day + normal rate
       totalCharge = Math.round((pickupResult.charge + dropoffResult.charge) / 2);
       console.log('[DEBUG] Item Transport - Mixed rates on respective dates: Averaging city day + normal €' + totalCharge + ' (pickup: €' + pickupResult.charge + ', dropoff: €' + dropoffResult.charge + ')');
     } else {
       // Neither city is a city day on its date → average normal rates
       totalCharge = Math.round((pickupResult.charge + dropoffResult.charge) / 2);
       console.log('[DEBUG] Item Transport - Both normal rates on respective dates: Averaging charges €' + totalCharge + ' (pickup: €' + pickupResult.charge + ', dropoff: €' + dropoffResult.charge + ')');
     }
     
     // Add distance charges for non-base cities (>8km)
     if (pickupDistanceDifference > 8) {
       const pickupExtraCharge = Math.round((pickupDistanceDifference - 8) * 3);
       totalCharge += pickupExtraCharge;
       console.log(`[DEBUG] Item Transport - Added pickup distance charge: €${pickupExtraCharge} for ${Math.round(pickupDistanceDifference - 8)}km beyond 8km`);
     }
     
     if (dropoffDistanceDifference > 8) {
       const dropoffExtraCharge = Math.round((dropoffDistanceDifference - 8) * 3);
       totalCharge += dropoffExtraCharge;
       console.log(`[DEBUG] Item Transport - Added dropoff distance charge: €${dropoffExtraCharge} for ${Math.round(dropoffDistanceDifference - 8)}km beyond 8km`);
     }
     
     console.log(`[DEBUG] Item Transport - Final total charge: €${totalCharge}`);
     
     return totalCharge;
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
      // Validate the date before using it
      if (!date || isNaN(date.getTime())) {
        console.warn('[isCompletelyEmptyCalendarDay] Invalid date provided:', date);
        return false; // Fallback to not empty for invalid dates
      }

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
      console.error('[isCompletelyEmptyCalendarDay] Error:', error);
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

export const pricingService = new PricingService();
export default pricingService; 