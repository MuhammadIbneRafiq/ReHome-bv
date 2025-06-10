import { 
  pricingConfig, 
  cityBaseCharges, 
  cityDayData, 
  getItemPoints, 
  getCityFromPostalCode,
  isCityDay
} from '../lib/constants';

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
  calculatePricing(input: PricingInput): PricingBreakdown {
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
          finalPrice: 0
        },
        items: {
          totalPoints: 0,
          multiplier: 0,
          cost: 0
        },
        distance: {
          distanceKm: 0,
          category: 'small',
          rate: 0,
          cost: 0
        },
        carrying: {
          floors: 0,
          itemBreakdown: [],
          totalCost: 0
        },
        assembly: {
          itemBreakdown: [],
          totalCost: 0
        },
        extraHelper: {
          totalPoints: 0,
          category: 'small',
          cost: 0
        }
      }
    };

    // 1. Calculate base charge
    this.calculateBaseCharge(input, breakdown);

    // 2. Calculate item value
    this.calculateItemValue(input, breakdown);

    // 3. Calculate distance cost
    this.calculateDistanceCost(input, breakdown);

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

  private calculateBaseCharge(input: PricingInput, breakdown: PricingBreakdown) {
    const city = getCityFromPostalCode(input.pickupLocation);
    const isCityDay = this.checkCityDay(input.pickupLocation, input.selectedDate);
    
    breakdown.breakdown.baseCharge.city = city;
    breakdown.breakdown.baseCharge.isCityDay = isCityDay;
    breakdown.breakdown.baseCharge.isEarlyBooking = input.isEarlyBooking || false;

    if (!city || !cityBaseCharges[city]) {
      // Default base charge if city not found
      breakdown.breakdown.baseCharge.originalPrice = 119;
      breakdown.breakdown.baseCharge.finalPrice = 119;
      breakdown.basePrice = 119;
      return;
    }

    const cityCharges = cityBaseCharges[city];
    let basePrice = isCityDay ? cityCharges.cityDay : cityCharges.normal;

    // Apply early booking discount if applicable
    if (input.isEarlyBooking) {
      basePrice = basePrice * pricingConfig.earlyBookingDiscount;
    }

    breakdown.breakdown.baseCharge.originalPrice = isCityDay ? cityCharges.cityDay : cityCharges.normal;
    breakdown.breakdown.baseCharge.finalPrice = basePrice;
    breakdown.basePrice = basePrice;
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

  private calculateDistanceCost(input: PricingInput, breakdown: PricingBreakdown) {
    // For now, using a simplified distance calculation
    // In production, you'd use a proper distance calculation service
    const distance = this.calculateDistance(input.pickupLocation, input.dropoffLocation);
    
    let rate = 0;
    let category: 'small' | 'medium' | 'long' = 'small';

    if (distance <= pricingConfig.distancePricing.smallDistance.threshold) {
      rate = pricingConfig.distancePricing.smallDistance.rate;
      category = 'small';
    } else if (distance <= pricingConfig.distancePricing.mediumDistance.threshold) {
      rate = pricingConfig.distancePricing.mediumDistance.rate;
      category = 'medium';
    } else {
      rate = pricingConfig.distancePricing.longDistance.rate;
      category = 'long';
    }

    const cost = distance * rate;

    breakdown.breakdown.distance.distanceKm = distance;
    breakdown.breakdown.distance.category = category;
    breakdown.breakdown.distance.rate = rate;
    breakdown.breakdown.distance.cost = cost;
    breakdown.distanceCost = cost;
  }

  private calculateCarryingCost(input: PricingInput, breakdown: PricingBreakdown) {
    const pickupFloors = input.elevatorPickup ? 0 : Math.max(0, input.floorPickup - 1);
    const dropoffFloors = input.elevatorDropoff ? 0 : Math.max(0, input.floorDropoff - 1);
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

  private checkCityDay(location: string, date: string): boolean {
    if (!location || !date) return false;
    const city = getCityFromPostalCode(location);
    if (!city) return false;
    
    const dateObj = new Date(date);
    return isCityDay(city, dateObj);
  }

  private calculateDistance(pickup: string, dropoff: string): number {
    // Simplified distance calculation
    // In production, you'd use Google Maps API or similar
    if (!pickup || !dropoff) return 0;
    
    // For demo purposes, return a random distance between 5-100km
    // You should replace this with actual distance calculation
    return Math.floor(Math.random() * 95) + 5;
  }

  /**
   * Calculate pricing for item transport between cities
   */
  calculateItemTransportPricing(input: PricingInput): PricingBreakdown {
    // For item transport, we need to handle split base charges
    const modifiedInput = { ...input };
    
    const pickupCity = getCityFromPostalCode(input.pickupLocation);
    const dropoffCity = getCityFromPostalCode(input.dropoffLocation);
    
    if (pickupCity && dropoffCity && pickupCity !== dropoffCity) {
      // Handle split base charge logic for item transport
      const pickupCityDay = this.checkCityDay(input.pickupLocation, input.selectedDate);
      const dropoffCityDay = this.checkCityDay(input.dropoffLocation, input.selectedDate);
      
      let pickupCharge = pickupCityDay ? cityBaseCharges[pickupCity]?.cityDay || 35 : cityBaseCharges[pickupCity]?.normal || 119;
      let dropoffCharge = dropoffCityDay ? cityBaseCharges[dropoffCity]?.cityDay || 35 : cityBaseCharges[dropoffCity]?.normal || 119;
      
      if (input.isDateFlexible) {
        dropoffCharge = 35; // Flexible date gets city day rate
      }
      
      // Split the base charge
      const averageBaseCharge = (pickupCharge + dropoffCharge) / 2;
      
      // Override the base charge calculation for item transport
      const breakdown = this.calculatePricing(modifiedInput);
      breakdown.basePrice = averageBaseCharge;
      breakdown.breakdown.baseCharge.finalPrice = averageBaseCharge;
      
      // Recalculate totals
      breakdown.subtotal = breakdown.basePrice + breakdown.itemValue + breakdown.distanceCost + 
                          breakdown.carryingCost + breakdown.assemblyCost + breakdown.extraHelperCost;
      
      if (input.isStudent && input.hasStudentId) {
        breakdown.studentDiscount = breakdown.subtotal * pricingConfig.studentDiscount;
        breakdown.total = breakdown.subtotal - breakdown.studentDiscount;
      } else {
        breakdown.studentDiscount = 0;
        breakdown.total = breakdown.subtotal;
      }
      
      return breakdown;
    }
    
    return this.calculatePricing(modifiedInput);
  }
}

export const pricingService = new PricingService();
export default pricingService; 