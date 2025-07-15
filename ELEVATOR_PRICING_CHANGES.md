# Elevator Pricing Changes - 50% Discount Model

## Overview
Changed the elevator pricing model from **complete elimination** of carrying costs to a **50% discount** when elevators are available.

## Why This Change?

### Business Benefits:
- **More Realistic Pricing**: Accounts for some manual handling even with elevators
- **Flexible Model**: Can be easily adjusted based on real-world testing
- **Better Customer Experience**: Clear pricing expectations
- **Revenue Protection**: Still charges for some labor while providing value

### Technical Benefits:
- **Simpler Logic**: No complex floor calculations
- **Easier Testing**: Clear before/after pricing differences
- **Debug Friendly**: Comprehensive logging for troubleshooting

## Implementation Details

### Pricing Service Changes:
```typescript
// OLD LOGIC (removed):
const pickupFloors = input.elevatorPickup ? 0 : Math.max(0, input.floorPickup - 1);
const dropoffFloors = input.elevatorDropoff ? 0 : Math.max(0, input.floorDropoff - 1);

// NEW LOGIC:
const pickupFloors = Math.max(0, input.floorPickup - 1);
const dropoffFloors = Math.max(0, input.floorDropoff - 1);
const totalFloors = pickupFloors + dropoffFloors;

// Calculate base carrying cost
let baseCarryingCost = totalCarryingPoints * pricingConfig.addonMultiplier;

// Apply 50% discount when elevator is available
if (input.elevatorPickup || input.elevatorDropoff) {
    elevatorDiscount = baseCarryingCost * 0.5;
    finalCarryingCost = baseCarryingCost - elevatorDiscount;
}
```

### UI Changes:
- Updated elevator toggle labels to show "(50% discount on carrying)"
- Added comprehensive debug logging
- Enhanced user feedback

## Example Pricing

### Scenario:
- 3rd floor pickup, 2nd floor dropoff
- Heavy items (sofa, bed, etc.)
- Base carrying cost: €45

### Results:
- **Without elevator**: €45 (full price)
- **With elevator**: €22.50 (50% discount)
- **Savings**: €22.50

## Testing

### Test Steps:
1. Enter locations and select heavy items
2. Set floor numbers > 1
3. Note initial pricing
4. Toggle elevator switches ON
5. Verify 50% reduction in carrying costs
6. Toggle elevator switches OFF
7. Verify return to full pricing

### Debug Messages:
Check browser console for:
- `🔍 [CARRYING DEBUG] Elevator discount applied:`
- `🔍 [CARRYING DEBUG] Final carrying cost calculation:`

## Future Adjustments

The 50% discount can be easily modified by changing this line:
```typescript
elevatorDiscount = baseCarryingCost * 0.5; // Change 0.5 to desired percentage
```

Possible adjustments based on feedback:
- 30% discount (0.3) - More conservative
- 70% discount (0.7) - More generous
- Variable discount based on floor height
- Different discounts for pickup vs dropoff

## Files Modified:
- `Rehome/src/services/pricingService.ts` - Core pricing logic
- `Rehome/src/lib/pages/HouseMovingPage.tsx` - UI labels
- `test-elevator-pricing.html` - Updated test documentation 