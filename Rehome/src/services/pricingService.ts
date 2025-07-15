import { 
  pricingConfig, 
  cityBaseCharges, 
  getItemPoints, 
  getCityFromPostalCode,
  isCityDay
} from '../lib/constants';
import { 
  findClosestCity, 
  calculateDistanceFromCityCenter, 
  calculateDistanceBetweenLocations 
} from '../utils/distanceCalculations';
import { calendarService } from './calendarService';

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
  selectedDate: string;
  isDateFlexible: boolean;
  itemQuantities: { [key: string]: number };
  floorPickup: number;
  floorDropoff: number;
  elevatorPickup: boolean;
  elevatorDropoff: boolean;
  assemblyItems: { [key: string]: boolean };
  extraHelperItems: { [key: string]: boolean };
  isStudent: boolean;
  hasStudentId: boolean;
  isEarlyBooking?: boolean; // For empty calendar days
}

class PricingService {
  
  /**
   * Calculate comprehensive pricing for house moving or item transport
   */
  async calculatePricing(input: PricingInput): Promise<PricingBreakdown> {
    console.log('🔍 [PRICING DEBUG] Starting calculatePricing with input:', {
      serviceType: input.serviceType,
      pickupLocation: input.pickupLocation,
      dropoffLocation: input.dropoffLocation,
      selectedDate: input.selectedDate,
      isDateFlexible: input.isDateFlexible,
      itemQuantities: input.itemQuantities
    });

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
    if (!input.pickupLocation || !input.selectedDate) {
      breakdown.basePrice = 0;
      breakdown.breakdown.baseCharge.city = null;
      return;
    }

    try {
      const date = new Date(input.selectedDate);
      const baseResult = await this.calculateBaseCharge(input.pickupLocation, date);
      
      breakdown.basePrice = baseResult.charge;
      breakdown.breakdown.baseCharge.city = baseResult.city;
      breakdown.breakdown.baseCharge.isCityDay = baseResult.type.includes('city day');
      breakdown.breakdown.baseCharge.isEarlyBooking = baseResult.type.includes('early booking');
      breakdown.breakdown.baseCharge.originalPrice = baseResult.charge;
      breakdown.breakdown.baseCharge.finalPrice = baseResult.charge;
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
      const distanceResult = await this.calculateDistanceCost(input.pickupLocation, input.dropoffLocation);
      
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
  async calculateBaseCharge(pickup: string, date?: Date): Promise<{ charge: number; type: string; city: string; distance: number }> {
    // No pricing without both pickup location and date
    if (!pickup || !date) {
      return { charge: 0, type: 'No estimate available', city: '', distance: 0 };
    }

    // Find closest supported city
    const city = await this.findClosestCity(pickup);
    if (!city) {
      return { charge: 0, type: 'Location not supported', city: '', distance: 0 };
    }

    // Calculate distance from city center
    const distanceFromCenter = await this.calculateDistanceFromCityCenter(pickup, city);
    
    // Check if it's a city day (scheduled in that city)
    const isScheduledDay = await this.isCityDay(city, date);
    
    // Check if it's an empty day for early booking discount
    const isEmptyDay = await this.isEmptyCalendarDay(date);
    
    // Determine base charge
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
      chargeType = `${city} early booking (50% off)`;
    } else {
      // Normal pricing
      baseCharge = cityBaseCharges[city]?.normal || 0;
      chargeType = `${city} normal rate`;
    }
    
    // Apply extra charge if beyond 8km from city center
    if (distanceFromCenter > 8) {
      const extraKm = distanceFromCenter - 8;
      const extraCharge = Math.round(extraKm * 3); // €3 per km beyond 8km
      baseCharge += extraCharge;
      chargeType += ` (+€${extraCharge} for ${Math.round(extraKm)}km beyond city center)`;
    }
    
    return { 
      charge: baseCharge, 
      type: chargeType, 
      city, 
      distance: Math.round(distanceFromCenter * 10) / 10 // Round to 1 decimal 
    };
  }

  private async isCityDay(city: string, date: Date): Promise<boolean> {
    // Try Google Calendar integration first, fall back to constants
    try {
      return await calendarService.isCityScheduled(city, date);
    } catch (error) {
      console.warn('Calendar service unavailable, using fallback logic:', error);
      return isCityDay(city, date);
    }
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

  /**
   * Find the closest city from our supported cities list using OpenStreetMap
   */
  private async findClosestCity(location: string): Promise<string | null> {
    try {
      // First try to extract city from postal code/address using existing logic
      const extractedCity = getCityFromPostalCode(location);
      if (extractedCity && cityBaseCharges[extractedCity]) {
        return extractedCity;
      }

      // Use OpenStreetMap to find the closest city
      const closestCityResult = await findClosestCity(location);
      if (closestCityResult && cityBaseCharges[closestCityResult.city]) {
        return closestCityResult.city;
      }

      // If no match found, return Amsterdam as default
      return 'Amsterdam';
    } catch (error) {
      console.error('Error finding closest city:', error);
      return 'Amsterdam';
    }
  }

  /**
   * Calculate distance from city center using OpenStreetMap
   */
  private async calculateDistanceFromCityCenter(location: string, city: string): Promise<number> {
    try {
      return await calculateDistanceFromCityCenter(location, city);
    } catch (error) {
      console.error('Error calculating distance from city center:', error);
      // Fallback to reasonable estimate
      return 5; // Assume 5km if calculation fails
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
  async calculateDistanceCost(pickup: string, dropoff: string): Promise<{ cost: number; distance: number; type: string }> {
    if (!pickup || !dropoff) {
      return { cost: 0, distance: 0, type: 'Enter both locations' };
    }

    const distance = await this.calculateDistance(pickup, dropoff);
    
    let cost = 0;
    let type = '';
    
    if (distance < 10) {
      cost = 0;
      type = 'Free (under 10km)';
    } else if (distance <= 50) {
      cost = Math.round(distance * 0.7);
      type = `Medium distance (${Math.round(distance)}km × €0.70)`;
    } else {
      cost = Math.round(distance * 0.5);
      type = `Long distance (${Math.round(distance)}km × €0.50)`;
    }
    
    return { 
      cost, 
      distance: Math.round(distance * 10) / 10, // Round to 1 decimal
      type 
    };
  }

  /**
   * Calculate distance between pickup and dropoff locations using OpenStreetMap
   */
  private async calculateDistance(pickup: string, dropoff: string): Promise<number> {
    try {
      if (!pickup || !dropoff) return 0;
      return await calculateDistanceBetweenLocations(pickup, dropoff);
    } catch (error) {
      console.error('Error calculating distance between locations:', error);
      return 0;
    }
  }

  private calculateCarryingCost(input: PricingInput, breakdown: PricingBreakdown) {
    // If elevator is available, count half the floors (rounded up), else full
    const pickupFloors = input.elevatorPickup ? Math.ceil(Math.max(0, input.floorPickup - 1) / 2) : Math.max(0, input.floorPickup - 1);
    const dropoffFloors = input.elevatorDropoff ? Math.ceil(Math.max(0, input.floorDropoff - 1) / 2) : Math.max(0, input.floorDropoff - 1);
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

    for (const [itemId, quantity] of Object.entries(input.itemQuantities)) {
      if (quantity > 0) {
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

    // Calculate total points for items that need extra helper
    let totalPoints = 0;
    for (const [itemId, needsHelper] of Object.entries(input.extraHelperItems)) {
      if (needsHelper && input.itemQuantities[itemId] > 0) {
        const points = getItemPoints(itemId);
        const quantity = input.itemQuantities[itemId];
        totalPoints += points * quantity;
      }
    }

    const category = totalPoints <= pricingConfig.extraHelperPricing.smallMove.threshold ? 'small' : 'big';
    const cost = category === 'small' 
      ? pricingConfig.extraHelperPricing.smallMove.price 
      : pricingConfig.extraHelperPricing.bigMove.price;

    breakdown.breakdown.extraHelper.totalPoints = totalPoints;
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
    const pickupCity = await this.findClosestCity(input.pickupLocation);
    const dropoffCity = await this.findClosestCity(input.dropoffLocation);
    const selectedDate = new Date(input.selectedDate);
    
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
          // Early booking discount: 50% off normal rate
          const normalRate = cityBaseCharges[pickupCity]?.normal || 119;
          finalBaseCharge = Math.round(normalRate * 0.5);
        } else if (isCityScheduled) {
          // City day rate
          finalBaseCharge = cityBaseCharges[pickupCity]?.cityDay || 35;
        } else {
          // Normal rate
          finalBaseCharge = cityBaseCharges[pickupCity]?.normal || 119;
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
          pickupCharge = Math.round((cityBaseCharges[pickupCity]?.normal || 119) * 0.5);
        } else if (pickupAligns) {
          pickupCharge = cityBaseCharges[pickupCity]?.cityDay || 35;
        } else {
          pickupCharge = cityBaseCharges[pickupCity]?.normal || 119;
        }
        
        // Calculate dropoff charge
        let dropoffCharge: number;
        if (input.isDateFlexible) {
          // Flexible date gets city day rate
          dropoffCharge = cityBaseCharges[dropoffCity]?.cityDay || 35;
        } else if (dropoffEmpty) {
          dropoffCharge = Math.round((cityBaseCharges[dropoffCity]?.normal || 149) * 0.5);
        } else if (dropoffAligns) {
          dropoffCharge = cityBaseCharges[dropoffCity]?.cityDay || 35;
        } else {
          dropoffCharge = cityBaseCharges[dropoffCity]?.normal || 149;
        }
        
        // Split the base charge (average of pickup and dropoff)
        finalBaseCharge = Math.round((pickupCharge + dropoffCharge) / 2);
      }
      
      // Update the breakdown with the calculated base charge
      breakdown.basePrice = finalBaseCharge;
      breakdown.breakdown.baseCharge.finalPrice = finalBaseCharge;
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