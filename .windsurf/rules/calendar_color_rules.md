# Calendar Color Rules

## Same City (pickup and dropoff in the same city)

| Color  | Condition                                                        |
|--------|------------------------------------------------------------------|
| Green  | City is included in admin calendar for that day                  |
| Orange | Empty day (no cities scheduled at all)                           |
| Red    | Responsible city for pricing i.e., either the pickup or the      |
|        | dropoff whichever one is used for pricing is NOT included in     |
|        | admin calendar but also NOT on block list. Only some other       |
|        | cities are scheduled in that day.                                |
| Grey   | Whole day is blocked OR city is on block list for that day       |

## Intercity (pickup and dropoff in different cities)

| Color  | Condition                                                                      |
|--------|--------------------------------------------------------------------------------|
| Green  | Both cities included in admin calendar on that day                             |
| Orange | Only one city included in admin calendar OR empty date (no cities at all)      |
| Red    | Neither of the 2 cities is included in admin calendar (but neither is blocked) |
| Grey   | Whole day is blocked OR at least one of the 2 cities is on the blocked list    |

## Visibility Rules

- **House Moving Fixed**: Colors and prices shown immediately (always visible).
- **Item Transport Fixed**: Colors and prices hidden until the **pickup date** is selected.
- **Flexible Date Range**: Colors and prices hidden until the **start date** is selected.
- **ReHome Chooses**: No calendar shown (special UI with "Guaranteed Cheapest Rate" message).

## Implementation Notes

- Colors are determined server-side in `calendar-pricing.js` → `calculateDatePricing()`.
- The frontend gates color visibility via `showPriceSticker` in `UnifiedPricingCalendar.tsx`.
- When colors are hidden, days render with neutral grey styling.
- Blocked/past days always show grey with ✕ marker regardless of visibility rules.
