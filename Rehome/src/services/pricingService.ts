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
   * Calculate base charge breakdown using the correct logic for date options and city combinations
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
      
      console.log('[DEBUG] Pickup city:', pickupCity, 'Dropoff city:', dropoffCity);
      
      if (!pickupCity) {
        breakdown.basePrice = 0;
        breakdown.breakdown.baseCharge.city = null;
        breakdown.breakdown.baseCharge.type = 'Location not supported';
        return;
      }
      
      const isIntercity = pickupCity !== dropoffCity && dropoffCity;
      console.log('[DEBUG] Is intercity move:', isIntercity);
      
      let finalCharge = 0;
      let chargeType = '';
      let isEarlyBooking = false;
      let isCheapRate = false;
      
      // Check if either city is not an exact match (not in top 25)
      const isPickupNearest = !pickupCity || !cityBaseCharges[pickupCity];
      const isDropoffNearest = !dropoffCity || !cityBaseCharges[dropoffCity];
      const isNearestCityRate = isPickupNearest || isDropoffNearest;
      
      // Calculate early booking discount (10%) - only for fixed dates and flexible ranges
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if ((input.selectedDate && !input.isDateFlexible) || 
          (input.serviceType === 'item-transport' && input.pickupDate && input.dropoffDate && !input.isDateFlexible)) {
         // Fixed date (either selectedDate for house moving, or pickupDate/dropoffDate for item transport)
         let referenceDate: Date;
         
         if (input.selectedDate) {
           referenceDate = new Date(input.selectedDate);
         } else if (input.pickupDate) {
           // For item transport, use pickup date as reference for early booking calculation
           referenceDate = new Date(input.pickupDate);
         } else {
           throw new Error('No valid date found for fixed date calculation');
         }
         
         const daysInAdvance = Math.floor((referenceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
         isEarlyBooking = daysInAdvance >= 14; // 2 weeks = 14 days
         console.log('[DEBUG] Fixed date - Days in advance:', daysInAdvance, 'isEarlyBooking:', isEarlyBooking);
         
         if (isIntercity && input.serviceType === 'item-transport' && input.pickupDate && input.dropoffDate) {
           // Item transport with different pickup/dropoff dates
           finalCharge = await this.calculateIntercityItemTransportCharge(
             input, pickupCity, dropoffCity, pickupDistanceDifference, dropoffDistanceDifference
           );
           chargeType = 'Intercity Rate';
         } else if (isIntercity) {
           // House moving or item transport same day intercity
           finalCharge = await this.calculateIntercityFixedDateCharge(
             input, pickupCity, dropoffCity, pickupDistanceDifference, dropoffDistanceDifference
           );
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
         
         // Apply early booking discount (10%)
         if (isEarlyBooking && !isIntercity) {
           const originalCharge = finalCharge;
           finalCharge = Math.round(finalCharge * 0.9); // 10% discount
           chargeType += ` (Early booking: -10%)`;
           console.log('[DEBUG] Early booking discount applied:', originalCharge, '→', finalCharge);
         }
        
      } else if (input.isDateFlexible && input.selectedDateRange?.start && input.selectedDateRange?.end) {
        // Flexible date range
        const startDate = new Date(input.selectedDateRange.start);
        const endDate = new Date(input.selectedDateRange.end);
        const rangeDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Check if starting date is 2 weeks or more in advance for early booking
        const daysInAdvance = Math.floor((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        isEarlyBooking = daysInAdvance >= 14;
        console.log('[DEBUG] Flexible range - Days:', rangeDays, 'Days in advance:', daysInAdvance, 'isEarlyBooking:', isEarlyBooking);
        
        if (rangeDays > 7) {
          // Range above 1 week → cheap base charge for pickup city
          finalCharge = cityBaseCharges[pickupCity]?.cityDay || 0;
          isCheapRate = true;
          if (isIntercity) {
            chargeType = 'Intercity Rate';
          } else {
            chargeType = `${pickupCity} - Cheap Rate (Flexible range > 1 week)`;
          }
        } else {
          // Range 1 week or below → check if city has available day during range
          const hasAvailableDay = await this.checkCityAvailabilityInRange(pickupCity, startDate, endDate);
          if (hasAvailableDay) {
            finalCharge = cityBaseCharges[pickupCity]?.cityDay || 0;
            isCheapRate = true;
            chargeType = isIntercity ? 'Intercity Rate' : `${pickupCity} - Cheap Rate (Available in range)`;
          } else {
            finalCharge = cityBaseCharges[pickupCity]?.normal || 0;
            isCheapRate = false;
            chargeType = isIntercity ? 'Intercity Rate' : `${pickupCity} - Normal Rate (Not available in range)`;
          }
        }
        
        // Add extra km charge for pickup location
        if (pickupDistanceDifference > 0) {
          const extraCharge = Math.round(pickupDistanceDifference * 3);
          finalCharge += extraCharge;
          chargeType += ` (+€${extraCharge} for ${Math.round(pickupDistanceDifference)}km beyond city center)`;
        }
        
        // Apply early booking discount (10%)
        if (isEarlyBooking) {
          const originalCharge = finalCharge;
          finalCharge = Math.round(finalCharge * 0.9);
          chargeType += ` (Early booking: -10%)`;
          console.log('[DEBUG] Early booking discount applied:', originalCharge, '→', finalCharge);
        }
        
      } else if (input.isDateFlexible && !input.selectedDateRange?.start) {
        // ReHome suggest date → always cheapest base price for pickup city
        finalCharge = cityBaseCharges[pickupCity]?.cityDay || 0;
        isCheapRate = true;
        
        // Add extra km charge for pickup location
        if (pickupDistanceDifference > 0) {
          const extraCharge = Math.round(pickupDistanceDifference * 3);
          finalCharge += extraCharge;
          chargeType = isIntercity 
            ? `Intercity Rate (+€${extraCharge} for ${Math.round(pickupDistanceDifference)}km beyond city center)`
            : `${pickupCity} - Cheap Rate (ReHome suggest date) (+€${extraCharge} for ${Math.round(pickupDistanceDifference)}km beyond city center)`;
        } else {
          chargeType = isIntercity ? 'Intercity Rate' : `${pickupCity} - Cheap Rate (ReHome suggest date)`;
        }
        
        // No early booking discount for ReHome suggest date
      }
      
      // Set breakdown values
      console.log(`[DEBUG] Setting breakdown values - finalCharge: €${finalCharge}, isNearestCityRate: ${isNearestCityRate}`);
      breakdown.basePrice = finalCharge;
      breakdown.breakdown.baseCharge.city = isIntercity ? `${pickupCity}/${dropoffCity}` : pickupCity;
      breakdown.breakdown.baseCharge.isCityDay = isCheapRate;
      breakdown.breakdown.baseCharge.isEarlyBooking = isEarlyBooking;
      breakdown.breakdown.baseCharge.originalPrice = finalCharge;
      breakdown.breakdown.baseCharge.finalPrice = finalCharge;
      // Set type to Nearest City Rate if either city is not in top 25
      if (isNearestCityRate) {
        breakdown.breakdown.baseCharge.type = 'Nearest City Rate';
      } else {
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
     const selectedDate = new Date(input.selectedDate!);
     
     // Check if calendar is empty for this city on this date
     const isEmpty = await this.isEmptyCalendarDay(city, selectedDate);
     
     let baseCharge: number;
     let isCheapRate: boolean;
     
           console.log(`[DEBUG] ${city} on ${selectedDate.toISOString().split('T')[0]} - isEmpty: ${isEmpty}`);
      console.log(`[DEBUG] ${city} cityBaseCharges:`, cityBaseCharges[city]);
      
      if (isEmpty) {
        // Empty calendar → cheap base charge
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
     
     // Add extra km charge
     if (distanceDifference > 0) {
       const extraCharge = Math.round(distanceDifference * 3);
       console.log(`[DEBUG] ${city} - Adding extra km charge: €${extraCharge} for ${Math.round(distanceDifference)}km beyond city center`);
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
   ): Promise<number> {
     
     // Calculate pickup charge
     const pickupResult = await this.calculateWithinCityFixedDateCharge(
       input, pickupCity, pickupDistanceDifference
     );
     
     // Calculate dropoff charge  
     const dropoffResult = await this.calculateWithinCityFixedDateCharge(
       { ...input, selectedDate: input.selectedDate }, dropoffCity, dropoffDistanceDifference
     );
     
     console.log('[DEBUG] Intercity calculation details:', {
       pickup: { city: pickupCity, charge: pickupResult.charge, isCheapRate: pickupResult.isCheapRate },
       dropoff: { city: dropoffCity, charge: dropoffResult.charge, isCheapRate: dropoffResult.isCheapRate }
     });
     
     // Apply the correct intercity logic based on city day alignment
     let totalCharge: number;
     
           if (pickupResult.isCheapRate && dropoffResult.isCheapRate) {
        // Scenario 1: Both cities are city days → Use cheapest total charge (including distance)
        totalCharge = Math.min(pickupResult.charge, dropoffResult.charge);
        console.log('[DEBUG] Scenario 1 - Both cities align: Using cheapest total charge €' + totalCharge + ' (pickup: €' + pickupResult.charge + ', dropoff: €' + dropoffResult.charge + ')');
      } else if (pickupResult.isCheapRate || dropoffResult.isCheapRate) {
       // Scenario 2/3: Only one city is a city day → Split the charges
       totalCharge = Math.round((pickupResult.charge + dropoffResult.charge) / 2);
       console.log('[DEBUG] Scenario 2/3 - Only one city aligns: Split charge €' + totalCharge);
     } else {
       // Scenario 4: Neither city is a city day → Use higher charge
       totalCharge = Math.max(pickupResult.charge, dropoffResult.charge);
       console.log('[DEBUG] Scenario 4 - Neither city aligns: Using higher charge €' + totalCharge);
     }
     
     console.log('[DEBUG] Intercity final charge:', totalCharge);
     
     return totalCharge;
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
     // Calculate pickup charge using pickup date
     const pickupInput = { 
       ...input, 
       selectedDate: input.pickupDate!
     };
     const pickupResult = await this.calculateWithinCityFixedDateCharge(
       pickupInput, pickupCity, pickupDistanceDifference
     );
     
     // Calculate dropoff charge using dropoff date
     const dropoffInput = { 
       ...input, 
       selectedDate: input.dropoffDate!
     };
     const dropoffResult = await this.calculateWithinCityFixedDateCharge(
       dropoffInput, dropoffCity, dropoffDistanceDifference
     );
     
     // Apply the correct intercity logic based on city day alignment
     let totalCharge: number;
     
           if (pickupResult.isCheapRate && dropoffResult.isCheapRate) {
        // Scenario 1: Both cities are city days → Use cheapest total charge (including distance)
        totalCharge = Math.min(pickupResult.charge, dropoffResult.charge);
      } else if (pickupResult.isCheapRate || dropoffResult.isCheapRate) {
       // Scenario 2/3: Only one city is a city day → Split the charges
       totalCharge = Math.round((pickupResult.charge + dropoffResult.charge) / 2);
     } else {
       // Scenario 4: Neither city is a city day → Use higher charge
       totalCharge = Math.max(pickupResult.charge, dropoffResult.charge);
     }
     
     return totalCharge;
   }
  
  /**
   * Check if a city has any available day within the given date range
   */
  private async checkCityAvailabilityInRange(city: string, startDate: Date, endDate: Date): Promise<boolean> {
    try {
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];
      const baseUrl = API_ENDPOINTS.AUTH.LOGIN.split('/api/auth/login')[0];
      const url = `${baseUrl}/api/city-availability-range?city=${encodeURIComponent(city)}&startDate=${startStr}&endDate=${endStr}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to fetch availability range: ${response.status}`);
        return false; // Fallback to not available
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.warn(`Backend error: ${result.error}`);
        return false;
      }
      
      return result.data.hasAvailableDay;
    } catch (error) {
      console.error('[checkCityAvailabilityInRange] Error:', error);
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
    const daysInAdvance = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isEarlyBooking = daysInAdvance >= 21;
    // Determine base charge
    let baseCharge: number;
    let chargeType: string;
    if (isScheduledDay) {
      // City day pricing - aligned with schedule
      baseCharge = cityBaseCharges[city]?.cityDay || 0;
      chargeType = `${city} city day rate`;
    } else if (isEarlyBooking) {
      // Early booking discount (50% off normal rate)
      const normalRate = cityBaseCharges[city]?.normal || 0;
      baseCharge = Math.round(normalRate * 0.5);
      chargeType = `${city} early booking discount (50% off)`;
    } else {
      // Normal pricing - doesn't align with schedule and not early booking
      baseCharge = cityBaseCharges[city]?.normal || 0;
      chargeType = `${city} normal rate`;
    }
    // Apply city center extra charge if beyond city center range
    if (distanceDifference > 0) {
      const extraCharge = Math.round(distanceDifference * 3); // €3 per km beyond 8km
      baseCharge += extraCharge;
      chargeType += ` (+€${extraCharge} for ${Math.round(distanceDifference)}km beyond city center)`;
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
    const { isScheduled } = await this.getCityScheduleStatus(city, date);
    console.log(`[DEBUG] isCityDay for ${city} on ${date.toISOString().split('T')[0]}:`, isScheduled);
    return isScheduled;
  }

  private async isEmptyCalendarDay(city: string, date: Date): Promise<boolean> {
    const { isEmpty } = await this.getCityScheduleStatus(city, date);
    return isEmpty;
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
      ? pricingConfig.houseMovingItemMultiplier 
      : pricingConfig.itemTransportMultiplier;

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
    const pickupFloors = input.elevatorPickup ? 1 : Math.max(0, input.floorPickup - 1);
    const dropoffFloors = input.elevatorDropoff ? 1 : Math.max(0, input.floorDropoff - 1);
    const totalFloors = pickupFloors + dropoffFloors;

    breakdown.breakdown.carrying.floors = totalFloors;

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
            cost: itemCarryingPoints * pricingConfig.addonMultiplier
          });
        }
      }
    }

    const totalCost = totalCarryingPoints * pricingConfig.addonMultiplier;

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
          cost: itemAssemblyPoints * pricingConfig.addonMultiplier
        });
      }
    }

    const totalCost = totalAssemblyPoints * pricingConfig.addonMultiplier;

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
  }
}

export const pricingService = new PricingService();
export default pricingService; 