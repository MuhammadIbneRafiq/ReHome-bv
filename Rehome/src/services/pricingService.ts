import { 
  pricingConfig, 
  cityBaseCharges, 
  getItemPoints, 
  isCityDay
} from '../lib/constants';
import { calendarService } from './calendarService';
import { findClosestSupportedCity} from '../utils/locationServices';

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
}

class PricingService {
  
  /**
   * Calculate comprehensive pricing for house moving or item transport
   */
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
   * Calculate base charge breakdown (async)
   */
  private async calculateBaseChargeBreakdown(input: PricingInput, breakdown: PricingBreakdown) {
    try {
      let baseResult;
      // Check if we have a calculated distance for long-distance moves
      const isLongDistanceMove = input.distanceKm && input.distanceKm > 50;
      console.log('isLongDistanceMove is', isLongDistanceMove);
      console.log('input.distanceKm is', input.distanceKm);
      
      if (input.isDateFlexible) {
        // For flexible dates, apply early booking discount (50% off normal rate)
        //TODO W CALENDER
        const { city, distanceDifference } = await findClosestSupportedCity(input.pickupPlace);
        if (!city) {
          breakdown.basePrice = 0;
          breakdown.breakdown.baseCharge.city = null;
          return;
        }
                      
        const distanceFromCenter = input.distanceKm || 0;
        let finalCharge = cityBaseCharges[city]?.cityDay || 0;
        let chargeType = `${city} Flexible date with city day rate according to ReHome delivery plans`;
        
        if (isLongDistanceMove && distanceFromCenter > 8) {
          const extraKm = distanceDifference;
          const extraCharge = Math.round(extraKm * 3); // €3 per km beyond 8km
          finalCharge += extraCharge;
          chargeType += ` (+€${extraCharge} for ${Math.round(extraKm)}km beyond city center)`;
        }
        
        // Add long distance indicator if applicable
        if (isLongDistanceMove) {
          chargeType += ` (long distance: ${Math.round(input.distanceKm!)}km)`;
        }
        
        baseResult = {
          charge: finalCharge,
          type: chargeType,
          city,
          distance: Math.round(distanceFromCenter * 10) / 10
        };
        
        // Set the breakdown for flexible date scenario
        breakdown.basePrice = baseResult.charge;
        breakdown.breakdown.baseCharge.city = baseResult.city;
        breakdown.breakdown.baseCharge.isCityDay = true; // Flexible dates now use city day rates
        breakdown.breakdown.baseCharge.isEarlyBooking = true; // Flexible dates are considered early booking
        breakdown.breakdown.baseCharge.originalPrice = finalCharge;
        breakdown.breakdown.baseCharge.finalPrice = baseResult.charge;
      } else {
        // For fixed dates, check if we have separate pickup and dropoff dates
        if (input.pickupDate && input.dropoffDate) {
          
          // Calculate base charge for both pickup and dropoff cities
          const pickupDate = new Date(input.pickupDate);
          const dropoffDate = new Date(input.dropoffDate);
          
          const { city: pickupCity, distanceDifference: pickupDistanceDifference } = await findClosestSupportedCity(input.pickupPlace);
          const { city: dropoffCity, distanceDifference: dropoffDistanceDifference } = await findClosestSupportedCity(input.dropoffPlace);

          if (!pickupCity || !dropoffCity) {
            breakdown.basePrice = 0;
            breakdown.breakdown.baseCharge.city = null;
            return;
          }
          
          // Calculate base charges for both cities
          const pickupBaseResult = await this.calculateBaseCharge(pickupDistanceDifference || 0, input.pickupLocation, pickupDate, input.pickupPlace);
          const dropoffBaseResult = await this.calculateBaseCharge(dropoffDistanceDifference || 0, input.dropoffLocation, dropoffDate, input.dropoffPlace);
          
          // Combine the charges based on whether it's the same date or different dates
          let totalCharge: number;
          const isSameDate = pickupDate.toDateString() === dropoffDate.toDateString();
          
          if (isSameDate) {
            // Same date: use the higher of the two base charges (one trip covering both cities)
            totalCharge = Math.max(pickupBaseResult.charge, dropoffBaseResult.charge);
            
          } else {
            // Different dates: add the base charges from both cities (two separate trips)
            totalCharge = pickupBaseResult.charge + dropoffBaseResult.charge;
            
          }
          
          // Determine the charge type based on same date vs different dates
          let chargeType = '';
          if (isSameDate) {
            // Same date: using higher rate between the two cities
            const isPickupCityDay = await this.isCityDay(pickupCity, pickupDate);
            const isDropoffCityDay = await this.isCityDay(dropoffCity, dropoffDate);
                                  // For same date, describe which city/rate we're using (the higher one)
            const isUsingPickup = pickupBaseResult.charge >= dropoffBaseResult.charge;
            const primaryCity = isUsingPickup ? pickupCity : dropoffCity;
            const isPrimaryCityDay = isUsingPickup ? isPickupCityDay : isDropoffCityDay;
            
            if (pickupCity === dropoffCity) {
              // Same city, same date
              if (isPrimaryCityDay) {
                chargeType = `${primaryCity} city day rate (same date)`;
              } else {
                chargeType = `${primaryCity} normal rate (same date)`;
              }
            } else {
              // Different cities, same date - using higher rate
              if (isPrimaryCityDay) {
                chargeType = `${primaryCity} city day rate (same date, higher of ${pickupCity}/${dropoffCity})`;
              } else {
                chargeType = `${primaryCity} normal rate (same date, higher of ${pickupCity}/${dropoffCity})`;
              }
            }
          } else {
            // Different dates: combining both city rates
            const isPickupCityDay = await this.isCityDay(pickupCity, pickupDate);
            const isDropoffCityDay = await this.isCityDay(dropoffCity, dropoffDate);
            

            
            if (isPickupCityDay && isDropoffCityDay) {
              chargeType = `${pickupCity}/${dropoffCity} city day rates (different dates)`;
            } else if (isPickupCityDay || isDropoffCityDay) {
              chargeType = `${pickupCity}/${dropoffCity} mixed rates (different dates)`;
            } else {
              chargeType = `${pickupCity}/${dropoffCity} normal rates (different dates)`;
            }
          }
          
          baseResult = {
            charge: totalCharge,
            type: chargeType,
            city: isSameDate && pickupCity !== dropoffCity ? 
              (pickupBaseResult.charge >= dropoffBaseResult.charge ? pickupCity : dropoffCity) : 
              (pickupCity === dropoffCity ? pickupCity : `${pickupCity}/${dropoffCity}`),
            distance: Math.max(pickupBaseResult.distance, dropoffBaseResult.distance)
          };
          
          // Set the breakdown for dual-date scenario
          breakdown.basePrice = totalCharge;
          breakdown.breakdown.baseCharge.city = isSameDate && pickupCity !== dropoffCity ? 
            (pickupBaseResult.charge >= dropoffBaseResult.charge ? pickupCity : dropoffCity) : 
            (pickupCity === dropoffCity ? pickupCity : `${pickupCity}/${dropoffCity}`);
          breakdown.breakdown.baseCharge.isCityDay = chargeType.includes('city day');
          breakdown.breakdown.baseCharge.isEarlyBooking = input.isDateFlexible;
          breakdown.breakdown.baseCharge.originalPrice = totalCharge;
          breakdown.breakdown.baseCharge.finalPrice = totalCharge;
          breakdown.breakdown.baseCharge.type = chargeType;
        } else {
          // Fallback to single date calculation
          if (!input.selectedDate) {
            breakdown.basePrice = 0;
            breakdown.breakdown.baseCharge.city = null;
            return;
          }
          
          const date = new Date(input.selectedDate);
          baseResult = await this.calculateBaseCharge(input.distanceKm || 0, input.pickupLocation, date, input.pickupPlace);
          
          // Set the breakdown for single-date scenario
          breakdown.basePrice = baseResult.charge;
          breakdown.breakdown.baseCharge.city = baseResult.city;
          breakdown.breakdown.baseCharge.isCityDay = baseResult.type.includes('city day');
          breakdown.breakdown.baseCharge.isEarlyBooking = baseResult.type.includes('early booking') || input.isDateFlexible;
          breakdown.breakdown.baseCharge.originalPrice = baseResult.charge;
          breakdown.breakdown.baseCharge.finalPrice = baseResult.charge;
          breakdown.breakdown.baseCharge.type = baseResult.type;
        }
      }
      
      
    } catch (error) {
      console.error('Error calculating base charge breakdown:', error);
      breakdown.basePrice = 0;
      breakdown.breakdown.baseCharge.city = null;
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
    console.log('distanceDifference', distanceDifference);

    // Check if it's a city day (scheduled in that city)
    const isScheduledDay = await this.isCityDay(city, date);
    
    // Check if it's an empty day for early booking discount
    const isEmptyDay = await this.isEmptyCalendarDay(date);
        
    // Determine base charge (without distance adjustments - distance is handled separately)
    let baseCharge: number;
    let chargeType: string;
    
    if (isScheduledDay) {
      // City day pricing
      baseCharge = cityBaseCharges[city]?.cityDay || 0;
      chargeType = `${city} city day rate`;
    } else if (isEmptyDay) {
      // Early booking discount (50% off normal rate)
      const normalRate = cityBaseCharges[city]?.normal || 0;
      baseCharge = Math.round(normalRate * 0.5);
      chargeType = `${city} Flexible date with discount according to ReHome delivery plans`;
    } else {
      // Normal pricing
      baseCharge = cityBaseCharges[city]?.normal || 0;
      chargeType = `${city} normal rate`;
    }
        
    // Apply city center extra charge if beyond 8km from city center
    if (distanceKm) {
      const extraKm = distanceDifference;
      const extraCharge = Math.round(extraKm * 3); // €3 per km beyond 8km
      baseCharge += extraCharge;
      chargeType += ` (+€${extraCharge} for ${Math.round(extraKm)}km beyond city center)`;
    }
    
    return { 
      charge: baseCharge, 
      type: chargeType, 
      city, 
      distance: Math.round(distanceKm * 10) / 10 // Round to 1 decimal 
    };
  }

  private async isCityDay(city: string, date: Date): Promise<boolean> {
    // TEMPORARY: Use constants-based logic directly since calendar service has incorrect data
    // TODO: Fix calendar service data for city days
    const constantsResult = isCityDay(city, date);
    
    return constantsResult;
    
    // Original calendar service logic (commented out temporarily)
    /*
    try {
      const calendarResult = await calendarService.isCityScheduled(city, date);
      console.log('🔍 [CALENDAR DEBUG] Calendar service result:', {
        city,
        date: isNaN(date.getTime()) ? 'Invalid Date' : date.toISOString(),
        calendarResult
      });
      return calendarResult;
    } catch (error) {
      console.warn('Calendar service unavailable, using fallback logic:', error);
      const fallbackResult = isCityDay(city, date);
      console.log('🔍 [FALLBACK DEBUG] Using constants fallback:', {
        city,
        date: isNaN(date.getTime()) ? 'Invalid Date' : date.toISOString(),
        fallbackResult
      });
      return fallbackResult;
    }
    */
  }

  private async isEmptyCalendarDay(date: Date): Promise<boolean> {
    // Check if calendar day is empty for early booking discount
    try {
      return await calendarService.isEmptyCalendarDay(date);
    } catch (error) {
      console.warn('Calendar service unavailable for empty day check:', error);
      return false; // No early booking discount if calendar is unavailable
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

  /**
   * Calculate pricing for item transport with special base charge logic
   * Handles split base charges for cross-city transport
   */
  async calculateItemTransportPricing(input: PricingInput): Promise<PricingBreakdown> {
    const { city: pickupCity, distanceDifference: pickupDistanceDifference } = await findClosestSupportedCity(input.pickupPlace);
    const { city: dropoffCity, distanceDifference: dropoffDistanceDifference } = await findClosestSupportedCity(input.dropoffPlace);
    const selectedDate = new Date(input.selectedDate);
    
    console.log('pickupDistanceDifference', pickupDistanceDifference);
    console.log('dropoffDistanceDifference', dropoffDistanceDifference);
    // First calculate the regular pricing breakdown
    const breakdown = await this.calculatePricing(input);
    
    // Now handle special item transport base charge logic
    if (pickupCity && dropoffCity) {
      let finalBaseCharge: number;
      
      if (pickupCity === dropoffCity) {
        // Transport within same city
        const isCityScheduled = await this.isCityDay(pickupCity, selectedDate);
        const isEmpty = await this.isEmptyCalendarDay(selectedDate);
        
        if (isEmpty) {
          // Early booking discount: with discount according to ReHome delivery plans
          const normalRate = cityBaseCharges[pickupCity]?.normal;
          finalBaseCharge = Math.round(normalRate * 0.5);
        } else if (isCityScheduled) {
          // City day rate
          finalBaseCharge = cityBaseCharges[pickupCity]?.cityDay;
        } else {
          // Normal rate
          finalBaseCharge = cityBaseCharges[pickupCity]?.normal;
        }
      } else {
        // Transport between different cities - Split base charge logic
        
        // Check if pickup date aligns with pickup city schedule
        const pickupAligns = await this.isCityDay(pickupCity, selectedDate);
        const pickupEmpty = await this.isEmptyCalendarDay(selectedDate);
        
        // For dropoff, check if flexible date is selected
        let dropoffAligns = false;
        let dropoffEmpty = false;
        
        if (input.isDateFlexible) {
          // Flexible date: use city day rate for dropoff city
          dropoffAligns = true;
        } else {
          // Fixed date: check if it aligns with dropoff city schedule
          dropoffAligns = await this.isCityDay(dropoffCity, selectedDate);
          dropoffEmpty = await this.isEmptyCalendarDay(selectedDate);
        }
        
        // Calculate pickup charge
        let pickupCharge: number;
        if (pickupEmpty) {
          pickupCharge = Math.round((cityBaseCharges[pickupCity]?.normal));
        } else if (pickupAligns) {
          pickupCharge = cityBaseCharges[pickupCity]?.cityDay;
        } else {
          pickupCharge = cityBaseCharges[pickupCity]?.normal;
        }
        
        // Calculate dropoff charge
        let dropoffCharge: number;
        if (input.isDateFlexible) {
          // Flexible date gets city day rate
          dropoffCharge = cityBaseCharges[dropoffCity]?.cityDay;
        } else if (dropoffEmpty) {
          dropoffCharge = Math.round((cityBaseCharges[dropoffCity]?.normal));
        } else if (dropoffAligns) {
          dropoffCharge = cityBaseCharges[dropoffCity]?.cityDay;
        } else {
          dropoffCharge = cityBaseCharges[dropoffCity]?.normal;
        }
        
        // Split the base charge (average of pickup and dropoff)
        finalBaseCharge = Math.max(pickupCharge, dropoffCharge);
      }
      
      // Update the breakdown with the calculated base charge
      breakdown.basePrice = finalBaseCharge;
      breakdown.breakdown.baseCharge.finalPrice = finalBaseCharge;
      breakdown.breakdown.baseCharge.originalPrice = finalBaseCharge; // Fix: also update originalPrice for UI display
      breakdown.breakdown.baseCharge.city = pickupCity;
      breakdown.breakdown.baseCharge.isCityDay = pickupCity === dropoffCity ? 
        await this.isCityDay(pickupCity, selectedDate) : false;
      breakdown.breakdown.baseCharge.isEarlyBooking = await this.isEmptyCalendarDay(selectedDate);
      
      // Recalculate totals with new base charge
      breakdown.subtotal = breakdown.basePrice + breakdown.itemValue + breakdown.distanceCost + 
                          breakdown.carryingCost + breakdown.assemblyCost + breakdown.extraHelperCost;
      
      if (input.isStudent && input.hasStudentId) {
        breakdown.studentDiscount = breakdown.subtotal * pricingConfig.studentDiscount;
        breakdown.total = breakdown.subtotal - breakdown.studentDiscount;
      } else {
        breakdown.studentDiscount = 0;
        breakdown.total = breakdown.subtotal;
      }
    }
    
    return breakdown;
  }
}

export const pricingService = new PricingService();
export default pricingService; 