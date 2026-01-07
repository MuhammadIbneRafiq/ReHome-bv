import { pricingConfig, cityBaseCharges, getItemPoints, constantsLoaded, furnitureItems } from '../lib/constants';
import { findClosestSupportedCity } from '../utils/locationServices';
import { 
  getCityScheduleStatusCached, 
  checkAllCitiesEmptyCached,
  getBatchScheduleStatus,
  preloadMonthSchedule 
} from '../services/pricingCacheService';

// Using ScheduleStatus type from realtimeService
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
  earlyBookingDiscount: number; // Deprecated - kept for backwards compatibility
  lateBookingFee: number; // New field for late booking fee
  isLastMinuteBooking: boolean; // Flag for UI to show warning
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
  disassemblyItems?: { [key: string]: boolean };
  extraHelperItems: { [key: string]: boolean };
  carryingServiceItems?: { [key: string]: boolean }; // New field for carrying service items
  carryingUpItems?: { [key: string]: boolean }; // Directional: upstairs at dropoff
  carryingDownItems?: { [key: string]: boolean }; // Directional: downstairs at pickup
  isStudent: boolean;
  hasStudentId: boolean;
  isEarlyBooking?: boolean; // For empty calendar days
  pickupPlace?: any; // Google Places object for pickup location
  dropoffPlace?: any; // Google Places object for dropoff location
  selectedDateRange?: { start: string; end: string }; // New field for flexible date range
}

class PricingService {

  async calculatePricing(input: PricingInput): Promise<PricingBreakdown> {
    // Deterministic guard: avoid calculating with uninitialized constants
    if (!constantsLoaded) {
      // Return a stable empty breakdown rather than calculating with partial data
      return {
        basePrice: 0,
        itemValue: 0,
        distanceCost: 0,
        carryingCost: 0,
        assemblyCost: 0,
        extraHelperCost: 0,
        subtotal: 0,
        studentDiscount: 0,
        total: 0,
        earlyBookingDiscount: 0,
        lateBookingFee: 0,
        isLastMinuteBooking: false,
        breakdown: {
          baseCharge: { city: null, isCityDay: false, isEarlyBooking: false, originalPrice: 0, finalPrice: 0 },
          items: { totalPoints: 0, multiplier: 1, cost: 0 },
          distance: { distanceKm: 0, category: 'small', rate: 0, cost: 0 },
          carrying: { floors: 0, itemBreakdown: [], totalCost: 0 },
          assembly: { itemBreakdown: [], totalCost: 0 },
          extraHelper: { totalPoints: 0, category: 'small', cost: 0 },
        },
      };
    }
  
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
      lateBookingFee: 0, // New late booking fee
      isLastMinuteBooking: false, // Flag for UI warning
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
      
      
      
      let finalCharge = 0;
      let chargeType = '';
      let isCheapRate = false;
 
      // Calculate early booking discount (8.85%) - only for fixed dates and flexible ranges
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // FIXED DATE: isDateFlexible = false AND no selectedDateRange.end
      if (!input.isDateFlexible && !input.selectedDateRange?.end) {
         
        if (input.serviceType === 'item-transport') {
          // Item transport with different pickup/dropoff dates
          [finalCharge, chargeType] = await this.calculateIntercityItemTransportCharge(
            input, pickupCity, dropoffCity, pickupDistanceDifference, dropoffDistanceDifference
          );
        } else if (input.serviceType === 'house-moving') {
          // House Moving Fixed Date Pricing Logic
          const selectedDate = new Date(input.selectedDate);
          const dropoffResult = await findClosestSupportedCity(input.dropoffPlace);
          const dropoffCity = dropoffResult.city || pickupCity;
          
          let baseCharge: number;
          
          // Check if cities are included in calendar on that date
          const isIncludedPickup = await this.isCityDay(pickupCity, selectedDate);
          const isIncludedDropoff = await this.isCityDay(dropoffCity, selectedDate);
          
          // Check if calendar is empty for this date (treats as "included")
          const isEmpty = await this.isCompletelyEmptyCalendarDay(selectedDate);
          const isCheapPickup = isIncludedPickup;
          const isCheapDropoff = isIncludedDropoff;
          
          const isSameCity = dropoffCity === pickupCity;
          
          if (isSameCity) {
            // WITHIN CITY scenario
            if (isIncludedPickup) {
              // City included in calendar on that date = cheap base charge (city day rate)
              baseCharge = cityBaseCharges[pickupCity]?.cityDay || 0;
              isCheapRate = true;
              chargeType = 'City Day Rate';
            } else if (isEmpty) {
              // Empty calendar day for same-city = 75% of standard charge
              baseCharge = (cityBaseCharges[pickupCity]?.normal || 0) * 0.75;
              isCheapRate = true;
              chargeType = 'Empty Day Rate (75%)';
            } else {
              // City is not included in calendar on that date = standard base charge
              baseCharge = cityBaseCharges[pickupCity]?.normal || 0;
              isCheapRate = false;
              chargeType = 'Standard Rate';
            }
          } else {
            chargeType = 'Intercity Rate';
            // INTERCITY: Empty days use standard charges (no discount)
            if (isEmpty) {
              // Intercity on empty day = use standard charges (no empty day discount)
              baseCharge = Math.max(cityBaseCharges[pickupCity]?.normal, cityBaseCharges[dropoffCity]?.normal);
              isCheapRate = false;
            } else {
              // BETWEEN CITY scenario
              if (isCheapPickup && isCheapDropoff) {
                // If both cities are included = (cheap base charge pickup + cheap base charge dropoff) / 2
                baseCharge = (cityBaseCharges[pickupCity]?.cityDay + cityBaseCharges[dropoffCity]?.cityDay) / 2;
                isCheapRate = true;
              } else if (isCheapPickup && !isCheapDropoff) {
                // If Pickup City is included but dropoff is not included on that date or date is empty in calendar = (cheap base charge pickup + standard base charge dropoff) / 2
                baseCharge = (cityBaseCharges[pickupCity]?.cityDay + cityBaseCharges[dropoffCity]?.normal) / 2;
                isCheapRate = false;
              } else if (!isCheapPickup && isCheapDropoff) {
                // If Pickup City is not included on that date but dropoff is = (cheap base charge dropoff + standard base charge pickup) / 2
                baseCharge = (cityBaseCharges[pickupCity]?.normal + cityBaseCharges[dropoffCity]?.cityDay) / 2;
                isCheapRate = false;
              } else {
                // If none of the 2 cities is included = use the higher standard base charge of the 2 cities
                baseCharge = Math.max(cityBaseCharges[pickupCity]?.normal, cityBaseCharges[dropoffCity]?.normal);
                isCheapRate = false;
              }
            }
          }
          
          console.log('pickupDistanceDifference', pickupDistanceDifference);
          console.log('dropoffDistanceDifference', dropoffDistanceDifference);
          // Add extra km charge ONLY if distance difference > 8km
          if (pickupDistanceDifference > 8) {
            const extraCharge = Math.round((pickupDistanceDifference - 8) * 3);
            baseCharge += extraCharge;
          }          
          finalCharge = baseCharge;
          breakdown.breakdown.baseCharge.city = pickupCity;
        }
      } 
      // FLEXIBLE DATE RANGE: isDateFlexible = false AND selectedDateRange.start AND selectedDateRange.end
      else if (!input.isDateFlexible && input.selectedDateRange?.start && input.selectedDateRange?.end) {
        const startDate = new Date(input.selectedDateRange.start);
        const endDate = new Date(input.selectedDateRange.end);
        const rangeDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        if (rangeDays > 7) {
          // Range above 1 week → cheap base charge for pickup city
          finalCharge = cityBaseCharges[pickupCity]?.cityDay ;
          isCheapRate = true;
          chargeType = 'City Day Rate';
        } else {
          // Range 1 week or below → check if city has actual city days during range
          const hasCityDaysInRange = await this.checkCityDaysInRange(pickupCity, startDate, endDate);
          const isEmpty = await this.isCompletelyEmptyCalendarDay(startDate);

          if (dropoffCity === pickupCity) { 
            // SAME-CITY: Apply 75% rule for empty days
            if (hasCityDaysInRange) {
              finalCharge = cityBaseCharges[pickupCity]?.cityDay;
              chargeType = 'City Day Rate';
            } else if (isEmpty) {
              // Empty day for same-city = 75% of standard charge
              finalCharge = (cityBaseCharges[pickupCity]?.normal || 0) * 0.75;
              chargeType = 'Empty Day Rate (75%)';
            } else {
              finalCharge = cityBaseCharges[pickupCity]?.normal;
              chargeType = 'Standard Rate';
            }
          } else {
            // INTERCITY: Empty days use standard charges (no discount)
            chargeType = 'Intercity Rate';
            if (hasCityDaysInRange) { 
              finalCharge = (cityBaseCharges[pickupCity]?.cityDay + cityBaseCharges[dropoffCity]?.normal) / 2;
            } else if (isEmpty) {
              // Intercity on empty day = standard charges (no empty day discount)
              finalCharge = Math.max(cityBaseCharges[pickupCity]?.normal, cityBaseCharges[dropoffCity]?.normal);
            } else {
              finalCharge = cityBaseCharges[pickupCity]?.normal;
            }
          }
        }
        
        // Add extra km charge for pickup location
        if (pickupDistanceDifference > 0) {
          const extraCharge = Math.round(pickupDistanceDifference * 3);
          finalCharge += extraCharge;
        }
                
      } else if (input.isDateFlexible && !input.selectedDateRange?.start) {
        // ReHome suggest date → always cheapest base price for pickup city
        finalCharge = cityBaseCharges[pickupCity]?.cityDay || 0;
        isCheapRate = true;
        chargeType = 'City Day Rate';
        // Add extra km charge for pickup location if non-base city
        if (pickupDistanceDifference > 8) {
          const extraCharge = Math.round((pickupDistanceDifference - 8) * 3);
          finalCharge += extraCharge;
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
  ): Promise<[number, string]> {
    // Check if calendar is empty for THIS specific city on this date
    const isEmptyPickup = await this.isCompletelyEmptyCalendarDay(new Date(input.pickupDate || ''));
    const isEmptyDropoff = await this.isCompletelyEmptyCalendarDay(new Date(input.dropoffDate || ''));

    let baseCharge: number = 0; // Initialize with default value
    let chargeType: string = '';
    const isIncludedPickup = await this.isCityDay(pickupCity, new Date(input.pickupDate || ''));
    const isIncludedDropoff = await this.isCityDay(dropoffCity, new Date(input.dropoffDate || ''));
    
    const cheapPickup = isIncludedPickup || isEmptyPickup;
    const cheapDropoff = isIncludedDropoff || isEmptyDropoff;

    const isSameDate = input.pickupDate === input.dropoffDate;
    const isSameCity = dropoffCity === pickupCity;
    
    // Item Transport Pricing Logic based on exact specifications
    // EMPTY DAY RULES: Same-city = 75% of standard, Intercity = standard (no discount)
    if (isSameCity && isSameDate) {
      // Within city, same date
      if (isIncludedPickup) {
        // City included in calendar on that date = cheap base charge
        baseCharge = cityBaseCharges[pickupCity]?.cityDay;
        chargeType = 'City Day Rate';
      } else if (isEmptyPickup) {
        // Empty day for same-city = 75% of standard charge
        baseCharge = (cityBaseCharges[pickupCity]?.normal || 0) * 0.75;
        chargeType = 'Empty Day Rate (75%)';
      } else {
        // City is not included in calendar on that date = standard base charge
        baseCharge = cityBaseCharges[pickupCity]?.normal;
        chargeType = 'Standard Rate';
      }

    } else if (isSameCity && !isSameDate) {
      // Within city, different date
      if (isIncludedPickup && isIncludedDropoff) {
        // City is included in calendar on both dates = cheap base charge
        baseCharge = cityBaseCharges[pickupCity]?.cityDay;
        chargeType = 'City Day Rate';
      } else if (isEmptyPickup && isEmptyDropoff) {
        // Both dates are empty days for same-city = 75% of standard charge
        baseCharge = (cityBaseCharges[pickupCity]?.normal || 0) * 0.75;
        chargeType = 'Empty Day Rate (75%)';
      } else if ((isIncludedPickup && !isIncludedDropoff) || (isEmptyPickup && !isEmptyDropoff)) {
        // One date included/empty, other not = (cheap + standard) / 2
        baseCharge = (cityBaseCharges[pickupCity]?.cityDay + cityBaseCharges[dropoffCity]?.normal) / 2;
        chargeType = 'Standard Rate';
      } else if ((!isIncludedPickup && isIncludedDropoff) || (!isEmptyPickup && isEmptyDropoff)) {
        baseCharge = (cityBaseCharges[pickupCity]?.normal + cityBaseCharges[dropoffCity]?.cityDay) / 2;
        chargeType = 'Standard Rate';
      } else {
        // City is included in calendar on none of the 2 dates = standard base charge
        baseCharge = cityBaseCharges[pickupCity]?.normal;
        chargeType = 'Standard Rate';
      }
    } else if (!isSameCity && isSameDate) {
      // Between city, same date - INTERCITY: empty days use standard (no discount)
      chargeType = 'Intercity Rate';
      if (isEmptyDropoff && isEmptyPickup) {
        // Intercity on empty day = standard charges (no empty day discount)
        baseCharge = Math.max(cityBaseCharges[pickupCity]?.normal, cityBaseCharges[dropoffCity]?.normal);
      } else {
        if (isIncludedPickup && isIncludedDropoff) {
          baseCharge = (cityBaseCharges[pickupCity]?.cityDay + cityBaseCharges[dropoffCity]?.cityDay) / 2;
        } else if (isIncludedPickup && !isIncludedDropoff) {
          baseCharge = (cityBaseCharges[pickupCity]?.cityDay + cityBaseCharges[dropoffCity]?.normal) / 2;
        } else if (!isIncludedPickup && isIncludedDropoff) {
          baseCharge = (cityBaseCharges[pickupCity]?.normal + cityBaseCharges[dropoffCity]?.cityDay) / 2;
        } else {
          baseCharge = Math.max(cityBaseCharges[pickupCity]?.normal, cityBaseCharges[dropoffCity]?.normal);
        }
      }
    } else {
      if (cheapPickup && cheapDropoff) {

        baseCharge = (cityBaseCharges[pickupCity]?.cityDay + cityBaseCharges[dropoffCity]?.cityDay) / 2;

        chargeType = 'City Day Rate';
      } else if (cheapPickup && !cheapDropoff) {
      
        baseCharge = (cityBaseCharges[pickupCity]?.cityDay + cityBaseCharges[dropoffCity]?.normal) / 2;
        chargeType = 'Standard Rate';
      } else if (!cheapPickup && cheapDropoff) {

        baseCharge = (cityBaseCharges[pickupCity]?.normal + cityBaseCharges[dropoffCity]?.cityDay) / 2;
        chargeType = 'Standard Rate';
      } else {

        baseCharge = Math.max(cityBaseCharges[pickupCity]?.normal, cityBaseCharges[dropoffCity]?.normal);
        chargeType = 'Standard Rate';
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
        
    return [baseCharge, chargeType];
  }

  /**
   * Check if a city has actual city days (scheduled days) within the given date range
   * This is different from checkCityAvailabilityInRange which includes empty days
   */
  private async checkCityDaysInRange(city: string, startDate: Date, endDate: Date): Promise<boolean> {
    // Validate dates
    if (!startDate || isNaN(startDate.getTime()) || !endDate || isNaN(endDate.getTime())) {
      console.warn('[checkCityDaysInRange] Invalid dates provided');
      return false;
    }

    // Pre-load month data for efficient lookups
    await preloadMonthSchedule(startDate.getFullYear(), startDate.getMonth());
    if (endDate.getMonth() !== startDate.getMonth()) {
      await preloadMonthSchedule(endDate.getFullYear(), endDate.getMonth());
    }

    // Build batch lookup for all dates in range
    const lookups: Array<{ city: string; date: Date }> = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      lookups.push({ city, date: new Date(currentDate) });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Single batched RPC call for all dates instead of N sequential calls
    const results = await getBatchScheduleStatus(lookups);

    // Check if any day qualifies (scheduled or empty)
    for (const [, status] of results) {
      if (status.isScheduled || status.isEmpty) {
        console.log(`[DEBUG] Found city day for ${city} via batch lookup`);
        return true;
      }
    }

    console.log(`[DEBUG] No city days found for ${city} in range`);
    return false;
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

      const smallThreshold = pricingConfig?.distancePricing?.smallDistance?.threshold ?? 10;
      const mediumThresholdRaw = pricingConfig?.distancePricing?.mediumDistance?.threshold ?? 50;
      const mediumThreshold = Math.max(smallThreshold, mediumThresholdRaw);

      const smallRate = pricingConfig?.distancePricing?.smallDistance?.rate ?? 0;
      const mediumRate = pricingConfig?.distancePricing?.mediumDistance?.rate ?? 0.7;
      const longRate = pricingConfig?.distancePricing?.longDistance?.rate ?? 0.5;

      // Determine category and rate
      if (distanceResult.distance <= smallThreshold) {
        breakdown.breakdown.distance.category = 'small';
        breakdown.breakdown.distance.rate = smallRate;
      } else if (distanceResult.distance <= mediumThreshold) {
        breakdown.breakdown.distance.category = 'medium';
        breakdown.breakdown.distance.rate = mediumRate;
      } else {
        breakdown.breakdown.distance.category = 'long';
        breakdown.breakdown.distance.rate = longRate;
      }
      
      breakdown.breakdown.distance.cost = distanceResult.cost;
    } catch (error) {
      console.error('Error calculating distance breakdown:', error);
      breakdown.distanceCost = 0;
      breakdown.breakdown.distance.distanceKm = 0;
    }
  }

  /**
   * Calculate item value based on item points and service type
   */
  private calculateItemValue(input: PricingInput, breakdown: PricingBreakdown) {
    let totalPoints = 0;

    for (const [itemId, quantity] of Object.entries(input.itemQuantities || {})) {
      const qty = Number(quantity);
      if (!qty || qty <= 0) continue;
      totalPoints += getItemPoints(itemId) * qty;
    }

    // House moving charges double per point compared to item transport
    const multiplier = input.serviceType === 'house-moving' ? 2 : 1;
    const cost = Math.round(totalPoints * multiplier);

    breakdown.itemValue = cost;
    breakdown.breakdown.items = {
      totalPoints,
      multiplier,
      cost,
    };
  }

  private async getCityScheduleStatus(city: string, date: Date): Promise<{
    isScheduled: boolean;
    isEmpty: boolean;
  }> {
    if (!date || isNaN(date.getTime())) {
      console.warn('[getCityScheduleStatus] Invalid date provided:', date);
      return { isScheduled: false, isEmpty: true };
    }

    return getCityScheduleStatusCached(city, date);
  }

  private async isCityDay(city: string, date: Date): Promise<boolean> {
    if (!date || isNaN(date.getTime())) {
      console.warn('[isCityDay] Invalid date provided:', date);
      return false;
    }

    const { isScheduled } = await this.getCityScheduleStatus(city, date);
    console.log(`[DEBUG] isCityDay for ${city} on ${date.toISOString().split('T')[0]}:`, isScheduled);
    return isScheduled;
  }

  private async isCompletelyEmptyCalendarDay(date: Date): Promise<boolean> {
    if (!date || isNaN(date.getTime())) {
      console.warn('[isCompletelyEmptyCalendarDay] Invalid date provided:', date);
      return false;
    }

    return checkAllCitiesEmptyCached(date);
  }

  /**
   * Calculate distance cost between pickup and dropoff
   * NEW TIERS:
   * 1. Free up to 10km
   * 2. €0.70/km for 10-30km
   * 3. €0.90/km beyond 30km (to account for route deviations)
   */
  async calculateDistanceCost(providedDistance?: number): Promise<{ cost: number; distance: number; type: string }> {
    const distance = Math.max(0, providedDistance || 0);

    // New fixed thresholds and rates (overriding config for clarity)
    const FREE_THRESHOLD = 10; // Free up to 10km
    const MEDIUM_THRESHOLD = 30; // 0.7€/km for 10-30km
    const MEDIUM_RATE = 0.7; // €0.70 per km for 10-30km
    const LONG_RATE = 0.9; // €0.90 per km beyond 30km

    let rawCost = 0;
    let type = '';

    if (distance <= FREE_THRESHOLD) {
      // Free up to 10km
      rawCost = 0;
      type = `Free (${Math.round(distance)}km ≤ ${FREE_THRESHOLD}km)`;
    } else if (distance <= MEDIUM_THRESHOLD) {
      // 0.7€/km for distance between 10-30km
      const chargeableKm = distance - FREE_THRESHOLD;
      rawCost = chargeableKm * MEDIUM_RATE;
      type = `Medium distance: €${rawCost.toFixed(2)} (${Math.round(chargeableKm)}km × €${MEDIUM_RATE.toFixed(2)})`;
    } else {
      // 0.7€/km for 10-30km + 0.9€/km beyond 30km
      const mediumKm = MEDIUM_THRESHOLD - FREE_THRESHOLD; // 20km at 0.7€
      const longKm = distance - MEDIUM_THRESHOLD;
      const mediumPart = mediumKm * MEDIUM_RATE;
      const longPart = longKm * LONG_RATE;
      rawCost = mediumPart + longPart;
      type = `Long distance: €${mediumPart.toFixed(2)} (${mediumKm}km × €${MEDIUM_RATE.toFixed(2)}) + €${longPart.toFixed(2)} (${Math.round(longKm)}km × €${LONG_RATE.toFixed(2)})`;
    }

    const cost = Math.round(rawCost);
    
    console.log('[Distance] Cost calculation:', {
      distance,
      FREE_THRESHOLD,
      MEDIUM_THRESHOLD,
      MEDIUM_RATE,
      LONG_RATE,
      rawCost,
      roundedCost: cost,
      type
    });
    
    return { 
      cost, 
      distance: Math.round(distance * 10) / 10,
      type 
    };
  }

  private calculateCarryingCost(input: PricingInput, breakdown: PricingBreakdown) {
    // NEW LOGIC: No floor 1 rule - use actual floors regardless of elevator
    // Elevator uses 1.1x multiplier, stairs use 1.35x multiplier
    // Base fee (25) only applies if total item points < 20
    const downstairsFloors = Math.max(0, input.floorPickup);
    const upstairsFloors = Math.max(0, input.floorDropoff);

    console.log('[Carrying] Floors:', {
      upstairsFloors,
      downstairsFloors,
      floorPickup: input.floorPickup,
      floorDropoff: input.floorDropoff,
      elevatorPickup: input.elevatorPickup,
      elevatorDropoff: input.elevatorDropoff,
    });
    const totalFloors = upstairsFloors + downstairsFloors;

    breakdown.breakdown.carrying.floors = totalFloors;

    // If no floors, no carrying cost
    if (totalFloors === 0) {
      breakdown.carryingCost = 0;
      return;
    }

    let totalCarryingCost = 0;
    const itemBreakdown: Array<{
      itemId: string;
      points: number;
      multiplier: number;
      cost: number;
    }> = [];

    // Multipliers: stairs = 1.35, elevator = 1.1
    const STAIRS_MULTIPLIER = 1.35;
    const ELEVATOR_MULTIPLIER = 1.1;
    const BOX_STAIRS_MULTIPLIER_HIGH = 1.5; // For boxes > 10
    const baseFee = 25; // €25 base fee

    // Directional selection: prefer explicit up/down sets, fallback to combined
    const upItems = input.carryingUpItems || {};
    const downItems = input.carryingDownItems || {};
    const combinedItems = input.carryingServiceItems || {};
    
    // Calculate total item points for base fee condition
    let totalItemPoints = 0;
    for (const [itemId, quantity] of Object.entries(input.itemQuantities)) {
      if ((quantity as number) <= 0) continue;
      totalItemPoints += getItemPoints(itemId) * (quantity as number);
    }

    // Count total boxes for tiered box multiplier
    const boxItemId = Object.keys(input.itemQuantities).find(id => 
      id.toLowerCase().includes('box') || id.toLowerCase().includes('moving-box')
    );
    const totalBoxes = boxItemId ? (input.itemQuantities[boxItemId] || 0) : 0;
    
    // Compute per-direction floors and costs
    let downstairsCost = 0;
    let upstairsCost = 0;
    const downstairsBreakdown: typeof itemBreakdown = [];
    const upstairsBreakdown: typeof itemBreakdown = [];

    for (const [itemId, quantity] of Object.entries(input.itemQuantities)) {
      if ((quantity as number) <= 0) continue;
      const points = getItemPoints(itemId);
      const isBox = itemId.toLowerCase().includes('box') || itemId.toLowerCase().includes('moving-box');

      // Items that need carrying upstairs (based on carryingUpItems)
      const needsUp = !!upItems[itemId] || (Object.keys(upItems).length === 0 && !!combinedItems[itemId]);
      if (needsUp && upstairsFloors > 0) {
        // Determine multiplier based on elevator and item type
        let multiplier: number;
        if (input.elevatorDropoff) {
          // Elevator: always 1.1x
          multiplier = ELEVATOR_MULTIPLIER;
        } else if (isBox && totalBoxes > 10) {
          // Stairs with >10 boxes: 1.5x for boxes
          multiplier = BOX_STAIRS_MULTIPLIER_HIGH;
        } else {
          // Stairs: 1.35x
          multiplier = STAIRS_MULTIPLIER;
        }
        
        const cost = points * multiplier * upstairsFloors * (quantity as number);
        upstairsCost += cost;
        upstairsBreakdown.push({ 
          itemId, 
          points: points * (quantity as number), 
          multiplier: multiplier * upstairsFloors, 
          cost 
        });
      }

      // Downstairs (pickup floors)
      const needsDown = (Object.keys(downItems).length > 0 ? !!downItems[itemId] : !!combinedItems[itemId]) && downstairsFloors > 0;
      if (needsDown) {
        // Determine multiplier based on elevator and item type
        let multiplier: number;
        if (input.elevatorPickup) {
          // Elevator: always 1.1x
          multiplier = ELEVATOR_MULTIPLIER;
        } else if (isBox && totalBoxes > 10) {
          // Stairs with >10 boxes: 1.5x for boxes
          multiplier = BOX_STAIRS_MULTIPLIER_HIGH;
        } else {
          // Stairs: 1.35x
          multiplier = STAIRS_MULTIPLIER;
        }
        
        const cost = points * multiplier * downstairsFloors * (quantity as number);
        downstairsCost += cost;
        downstairsBreakdown.push({ 
          itemId, 
          points: points * (quantity as number), 
          multiplier: multiplier * downstairsFloors, 
          cost 
        });
      }
    }

    totalCarryingCost = downstairsCost + upstairsCost;
    itemBreakdown.push(...upstairsBreakdown, ...downstairsBreakdown);
    
    console.log('[Carrying] Directional breakdown pre-base-fee:', {
      STAIRS_MULTIPLIER,
      ELEVATOR_MULTIPLIER,
      totalBoxes,
      totalItemPoints,
      upstairsFloors,
      downstairsFloors,
      elevatorPickup: input.elevatorPickup,
      elevatorDropoff: input.elevatorDropoff,
      upstairsBreakdown,
      downstairsBreakdown,
      upstairsCost,
      downstairsCost,
      totalCarryingCost
    });
    
    // Base fee only applies if total item points < 20
    const baseFeeApplied = (totalCarryingCost > 0 && totalItemPoints < 20) ? baseFee : 0;
    const totalCost = totalCarryingCost + baseFeeApplied;

    console.log('[Carrying] Totals:', {
      upstairsApplied: upstairsFloors > 0,
      downstairsApplied: downstairsFloors > 0,
      baseFee,
      baseFeeApplied,
      totalItemPoints,
      baseFeeCondition: totalItemPoints < 20 ? 'Applied (points < 20)' : 'Not applied (points >= 20)',
      totalCarryingCostExclBase: totalCarryingCost,
      totalCarryingCostInclBase: totalCost
    });

    breakdown.breakdown.carrying.itemBreakdown = itemBreakdown;
    breakdown.breakdown.carrying.totalCost = totalCost;
    breakdown.carryingCost = totalCost;
  }

  private calculateAssemblyCost(input: PricingInput, breakdown: PricingBreakdown) {
    // Fixed unit prices by item name - Updated standardized values
    const assemblyUnitByName: Record<string, number> = {
      '2-Door Wardrobe': 30,
      '2-Doors Closet': 30,
      '3-Door Wardrobe': 35,
      '3-Doors Closet': 35,
      'Single Bed': 30,
      '1-Person Bed': 30,
      'Double Bed': 40,
      '2-Person Bed': 40,
    };

    const disassemblyUnitByName: Record<string, number> = {
      '2-Door Wardrobe': 30,
      '2-Doors Closet': 30,
      '3-Door Wardrobe': 35,
      '3-Doors Closet': 35,
      'Single Bed': 30,
      '1-Person Bed': 30,
      'Double Bed': 40,
      '2-Person Bed': 40,
    };

    const resolveItemName = (itemId: string): string => {
      const furnitureItem = furnitureItems.find(item => item.id === itemId);
      return furnitureItem ? furnitureItem.name : itemId;
    };

    let totalAssemblyCost = 0;
    const itemBreakdown: Array<{
      itemId: string;
      points: number;
      multiplier: number;
      cost: number;
    }> = [];

    // Assembly selections
    for (const [itemId, selected] of Object.entries(input.assemblyItems || {})) {
      if (!selected) continue;
      const quantity = input.itemQuantities[itemId] || 0;
      if (quantity <= 0) continue;
      const name = resolveItemName(itemId);
      const unit = assemblyUnitByName[name] || 0;
      const cost = unit * quantity;
      if (cost > 0) {
        totalAssemblyCost += cost;
        itemBreakdown.push({ itemId, points: 0, multiplier: 1, cost });
        console.log('[Assembly] Item added:', { itemId, name, unit, quantity, cost });
      }
    }

    // Disassembly selections
    for (const [itemId, selected] of Object.entries(input.disassemblyItems || {})) {
      if (!selected) continue;
      const quantity = input.itemQuantities[itemId] || 0;
      if (quantity <= 0) continue;
      const name = resolveItemName(itemId);
      const unit = disassemblyUnitByName[name] || 0;
      const cost = unit * quantity;
      if (cost > 0) {
        totalAssemblyCost += cost;
        itemBreakdown.push({ itemId, points: 0, multiplier: 1, cost });
        console.log('[Disassembly] Item added:', { itemId, name, unit, quantity, cost });
      }
    }

    console.log('[Assembly/Disassembly] Summary:', {
      assemblyUnits: assemblyUnitByName,
      disassemblyUnits: disassemblyUnitByName,
      totalAssemblyCost,
      itemBreakdown
    });

    breakdown.breakdown.assembly.itemBreakdown = itemBreakdown;
    breakdown.breakdown.assembly.totalCost = totalAssemblyCost;
    breakdown.assemblyCost = totalAssemblyCost;
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

    const smallThreshold = pricingConfig?.extraHelperPricing?.smallMove?.threshold ?? 5;
    const smallPrice = pricingConfig?.extraHelperPricing?.smallMove?.price ?? 25;
    const bigPrice = pricingConfig?.extraHelperPricing?.bigMove?.price ?? 45;
    const category = totalQuantity <= smallThreshold ? 'small' : 'big';
    const cost = category === 'small' ? smallPrice : bigPrice;

    breakdown.breakdown.extraHelper.totalPoints = totalQuantity;
    breakdown.breakdown.extraHelper.category = category;
    breakdown.breakdown.extraHelper.cost = cost;
    breakdown.extraHelperCost = cost;
  }

  private calculateTotals(input: PricingInput, breakdown: PricingBreakdown) {
    breakdown.subtotal = breakdown.basePrice + breakdown.itemValue + breakdown.distanceCost + 
                        breakdown.carryingCost + breakdown.assemblyCost + breakdown.extraHelperCost;

    // Apply student discount if applicable
    const studentDiscountRate = pricingConfig?.studentDiscount ?? 0;
    console.log('[DEBUG] Student discount check:', {
      isStudent: input.isStudent,
      hasStudentId: input.hasStudentId,
      studentDiscountRate,
      subtotal: breakdown.subtotal,
      pricingConfigLoaded: !!pricingConfig,
      pricingConfigStudentDiscount: pricingConfig?.studentDiscount,
      constantsLoaded
    });
    
    // Apply student discount ONLY when checkbox is checked AND a valid ID is uploaded
    if (input.isStudent && input.hasStudentId) {
      breakdown.studentDiscount = breakdown.subtotal * studentDiscountRate;
      breakdown.total = breakdown.subtotal - breakdown.studentDiscount;
      console.log('[DEBUG] Student discount applied:', {
        discount: breakdown.studentDiscount,
        newTotal: breakdown.total
      });
    } else {
      // No discount (or preview) without an uploaded ID
      breakdown.studentDiscount = 0;
      breakdown.total = breakdown.subtotal;
      console.log('[DEBUG] Student discount NOT applied - reason:', {
        isStudent: input.isStudent,
        hasStudentId: input.hasStudentId
      });
    }

    const referenceDate = new Date(input.selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysInAdvance = Math.floor((referenceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // LATE BOOKING FEE (replaces early booking discount)
    // Same-day or next-day (≤24h / daysInAdvance <= 1): +€75
    // 1-3 days before (daysInAdvance 2-3): +€50
    const URGENT_FEE = 75; // Same-day or next-day
    const LATE_FEE = 50; // 1-3 days before
    
    breakdown.earlyBookingDiscount = 0; // Deprecated, kept for backwards compatibility
    breakdown.lateBookingFee = 0;
    breakdown.isLastMinuteBooking = false;

    if (daysInAdvance <= 1) {
      // Urgent: same-day or next-day booking
      breakdown.lateBookingFee = URGENT_FEE;
      breakdown.isLastMinuteBooking = true;
      console.log('[DEBUG] Urgent booking fee applied:', { daysInAdvance, fee: URGENT_FEE });
    } else if (daysInAdvance <= 3) {
      // Late: 2-3 days before
      breakdown.lateBookingFee = LATE_FEE;
      breakdown.isLastMinuteBooking = true;
      console.log('[DEBUG] Late booking fee applied:', { daysInAdvance, fee: LATE_FEE });
    }

    // Add late booking fee to total
    breakdown.total = Math.round((breakdown.total + breakdown.lateBookingFee) * 100) / 100;
    
    console.log('[DEBUG] Final totals:', {
      subtotal: breakdown.subtotal,
      studentDiscount: breakdown.studentDiscount,
      lateBookingFee: breakdown.lateBookingFee,
      isLastMinuteBooking: breakdown.isLastMinuteBooking,
      daysInAdvance,
      total: breakdown.total
    });
  }
}

export { PricingService };
export const pricingService = new PricingService();
export default pricingService;