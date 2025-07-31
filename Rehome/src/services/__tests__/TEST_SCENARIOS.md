# Pricing Service Test Scenarios Documentation

This document outlines all the test scenarios covered for the `calculateBaseChargeBreakdown` function and `calculateIntercityItemTransportCharge` function, organized according to the business requirements.

## Test Files

1. `pricingService.test.ts` - Main test file for `calculateBaseChargeBreakdown`
2. `intercityItemTransport.test.ts` - Specific test file for `calculateIntercityItemTransportCharge`

## Mocked Dependencies

### City Base Charges
```typescript
{
  'Amsterdam': { normal: 100, cityDay: 80, dayOfWeek: 1 },
  'Rotterdam': { normal: 120, cityDay: 95, dayOfWeek: 2 },
  'The Hague': { normal: 110, cityDay: 85, dayOfWeek: 3 },
  'Utrecht': { normal: 105, cityDay: 82, dayOfWeek: 4 },
  'Eindhoven': { normal: 115, cityDay: 90, dayOfWeek: 5 },
  'Groningen': { normal: 125, cityDay: 100, dayOfWeek: 6 },
  'Tilburg': { normal: 108, cityDay: 83, dayOfWeek: 7 },
  'Almere': { normal: 95, cityDay: 75, dayOfWeek: 1 },
  'Breda': { normal: 102, cityDay: 78, dayOfWeek: 2 },
  'Nijmegen': { normal: 112, cityDay: 87, dayOfWeek: 3 }
}
```

### Mocked Functions
- `findClosestSupportedCity` - Returns city and distance difference
- `isCompletelyEmptyCalendarDay` - Returns boolean for empty calendar
- `isCityDay` - Returns boolean for city day inclusion
- `checkCityDaysInRange` - Returns boolean for city days in date range

## Test Scenarios Covered

### 1. Location Not Supported Scenarios
- ✅ Pickup city not supported → Base price: 0, Type: "Location not supported"
- ✅ Dropoff city not supported → Base price: 0, Type: "Location not supported"

### 2. Fixed Date - House Moving

#### Within City
- ✅ City included in calendar on that date → Cheap base charge (cityDay rate)
- ✅ Calendar empty on that date → Cheap base charge (cityDay rate)
- ✅ City not included in calendar on that date → Standard base charge (normal rate)
- ✅ Distance difference > 8km → Add extra km charge (€3 per km beyond 8km)

#### Between Cities
- ✅ Pickup city included, dropoff not → Average of (cheap pickup + standard dropoff)
- ✅ Pickup city not included, dropoff included → Average of (standard pickup + cheap dropoff)
- ✅ Both cities included → Average of (cheap pickup + cheap dropoff)
- ✅ Calendar empty → Average of (cheap pickup + cheap dropoff)
- ✅ Neither city included → Higher standard base charge of the two cities

### 3. Fixed Date - Item Transport

#### Within City - Same Date
- ✅ City included in calendar on that date → Cheap base charge
- ✅ City not included in calendar on that date → Standard base charge

#### Within City - Different Dates
- ✅ City included on both dates → Cheap base charge
- ✅ City included on only one date → Average of (cheap + standard)
- ✅ City not included on either date → Standard base charge

#### Between Cities - Same Date
- ✅ Both cities included → Average of (cheap pickup + cheap dropoff)
- ✅ Only pickup city included → Average of (cheap pickup + standard dropoff)
- ✅ Only dropoff city included → Average of (standard pickup + cheap dropoff)
- ✅ Neither city included → Higher standard base charge

#### Between Cities - Different Dates
- ✅ Both cities included on their dates → Average of (cheap pickup + cheap dropoff)
- ✅ Only pickup city included on its date → Average of (cheap pickup + standard dropoff)
- ✅ Only dropoff city included on its date → Average of (standard pickup + cheap dropoff)
- ✅ Neither city included on their dates → Higher standard base charge
- ✅ Both dates empty → Average of (cheap pickup + cheap dropoff)

### 4. Flexible Date Range

#### Above One Week (> 7 days)
- ✅ Range > 7 days → Cheap base charge for pickup city
- ✅ Distance difference > 0 → Add extra km charge

#### Below One Week (≤ 7 days)
- ✅ City has city days in range → Cheap base charge
- ✅ Calendar empty on start date → Cheap base charge
- ✅ No city days in range and not empty → Standard base charge
- ✅ Intercity with pickup city having city days → Average of (cheap pickup + standard dropoff)
- ✅ Intercity with both dates empty → Average of (cheap pickup + cheap dropoff)

### 5. ReHome Suggest Mode
- ✅ Always use cheapest base price for pickup city
- ✅ Distance difference > 8km → Add extra km charge

### 6. Error Handling
- ✅ Network errors → Base price: 0, Type: "Error calculating price"

### 7. Edge Cases with Different Cities
- ✅ The Hague to Utrecht intercity move
- ✅ Eindhoven to Groningen intercity move
- ✅ Tilburg to Almere intercity item transport
- ✅ Breda to Nijmegen flexible date range

## Intercity Item Transport Specific Tests

### Same Date Scenarios
- ✅ Both cities included on same date → Average of (cheap pickup + cheap dropoff)
- ✅ Only pickup city included → Average of (cheap pickup + standard dropoff)
- ✅ Only dropoff city included → Average of (standard pickup + cheap dropoff)
- ✅ Neither city included → Higher standard base charge
- ✅ Both dates empty → Average of (cheap pickup + standard dropoff)

### Different Dates Scenarios
- ✅ Both cities included on their dates → Average of (cheap pickup + cheap dropoff)
- ✅ Only pickup city included on its date → Average of (cheap pickup + standard dropoff)
- ✅ Only dropoff city included on its date → Average of (standard pickup + cheap dropoff)
- ✅ Neither city included on their dates → Higher standard base charge
- ✅ Both dates empty → Average of (cheap pickup + cheap dropoff)

### Distance Charges
- ✅ Pickup distance > 8km → Add extra km charge
- ✅ Dropoff distance > 8km → Add extra km charge
- ✅ Both distances > 8km → Add extra km charges for both
- ✅ Distances ≤ 8km → No extra charges

### Different City Combinations
- ✅ The Hague to Utrecht with both cities included
- ✅ Eindhoven to Groningen with standard rates
- ✅ Tilburg to Almere with mixed rates
- ✅ Breda to Nijmegen with both empty dates

### Edge Cases
- ✅ Same city with different dates
- ✅ Same city with same date
- ✅ Same city with empty dates

## Test Coverage Summary

### Total Test Cases: 50+
- **Location scenarios**: 2 tests
- **Fixed Date House Moving**: 12 tests
- **Fixed Date Item Transport**: 15 tests
- **Flexible Date Range**: 8 tests
- **ReHome Suggest Mode**: 2 tests
- **Error Handling**: 1 test
- **Edge Cases**: 4 tests
- **Intercity Item Transport**: 20+ tests

### Key Features Tested
- ✅ All pricing calculation logic
- ✅ Distance-based charges
- ✅ Calendar state handling (empty, city day, normal)
- ✅ Intercity vs within-city logic
- ✅ Date range calculations
- ✅ Error handling and edge cases
- ✅ Multiple city combinations
- ✅ Different service types (house-moving, item-transport)

### Mock Strategy
- **findClosestSupportedCity**: Mocked to return specific cities and distance differences
- **isCompletelyEmptyCalendarDay**: Mocked to return boolean values for empty calendar states
- **isCityDay**: Mocked to return boolean values for city day inclusion
- **checkCityDaysInRange**: Mocked to return boolean values for city days in date ranges

This comprehensive test suite ensures that all business logic scenarios are covered and the pricing calculations work correctly under all conditions. 