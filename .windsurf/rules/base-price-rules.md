# Base Price Calculation Rules

## Terminology

- **Cheap base charge** (`city_day`): Rate when the city IS scheduled in the admin calendar for that day.
- **Standard base charge** (`normal`): Rate when the city is NOT scheduled but NOT blocked.
- **Empty day**: No cities at all are scheduled on that date.
- **Blocked**: Date is blocked — no booking possible, price = 0.

## Database Columns

- `city_base_charges` table: `city_name`, `city_day` (cheap), `normal` (standard), `latitude`, `longitude`
- `city_schedules` table: `date`, `city`
- `blocked_dates` table: `date`
- NEVER use `admin_calendar`, `cheap_base_charge`, or `standard_base_charge` — those do not exist.

---

## FIXED DATE — House Moving

### Within City
| Scenario               | Formula                                  |
|------------------------|------------------------------------------|
| City scheduled         | `cheap`                                  |
| Empty day              | `standard * 0.75`                           |
| City not included      | `standard`                               |
| Blocked                | `0`                                      |

### Between Cities (Intercity)
| Scenario                         | Formula                                            |
|----------------------------------|----------------------------------------------------|
| Both cities scheduled            | `(cheap_pickup + cheap_dropoff) / 2`               |
| Pickup scheduled, dropoff not    | `(cheap_pickup + standard_dropoff) / 2`            |
| Dropoff scheduled, pickup not    | `(standard_pickup + cheap_dropoff) / 2`            |
| Empty day                        | `max(standard_pickup, standard_dropoff) * 0.75`    |
| Neither city scheduled           | `max(standard_pickup, standard_dropoff)`            |
| Blocked                          | `0`                                                |

---

## FIXED DATE — Item Transport — Same Date

### Within City
| Scenario               | Formula                                  |
|------------------------|------------------------------------------|
| City scheduled         | `cheap`                                  |
| Empty day              | `standard * 0.75`                        |
| City not included      | `standard`                               |
| Blocked                | `0`                                      |

### Between Cities (Intercity)
| Scenario                         | Formula                                            |
|----------------------------------|----------------------------------------------------|
| Both cities scheduled            | `(cheap_pickup + cheap_dropoff) / 2`               |
| One city scheduled               | `(cheap_included + standard_not_included) / 2`     |
| Empty day                        | `(standard_pickup + standard_dropoff) / 2`         |
| Neither city scheduled           | `max(standard_pickup, standard_dropoff)`            |
| Blocked                          | `0`                                                |

> **Note**: Intercity empty day differs from house moving! Item transport uses average of both standards; house moving uses 75% of higher standard.

---

## FIXED DATE — Item Transport — Different Dates

### Within City (same city for pickup and dropoff)
| Scenario                                                   | Formula                          |
|------------------------------------------------------------|----------------------------------|
| City scheduled on BOTH dates                               | `cheap`                          |
| City scheduled on ONE date (regardless of other being empty or not) | `(cheap + standard) / 2` |
| Both dates empty                                           | `standard * 0.75`                |
| Neither date has city scheduled (not both empty)           | `standard`                       |

### Between Cities (Intercity)
| Scenario                                                   | Formula                                            |
|------------------------------------------------------------|-----------------------------------------------------|
| Both cities scheduled on their respective dates            | `(cheap_pickup + cheap_dropoff) / 2`               |
| One city scheduled on its date (regardless of other being empty or not) | `(cheap_that_city + standard_other_city) / 2` |
| Both dates empty                                           | `(standard_pickup + standard_dropoff) / 2`         |
| Neither city scheduled on its date (not both empty)        | `max(standard_pickup, standard_dropoff)`            |

> **Key rule**: "Regardless of other city day being empty or not included" — if exactly one city is scheduled on its date, use that city's cheap + other city's standard, divided by 2.

---

## FLEXIBLE DATE RANGE

### Range > 7 days
Always: `cheap` for pickup city (regardless of schedule).

### Range ≤ 7 days

#### Within City
| Scenario                          | Formula      |
|-----------------------------------|--------------|
| City available in range           | `cheap`      |
| City NOT available (even if empty)| `standard`   |

#### Between Cities
| Scenario                                  | Formula                              |
|-------------------------------------------|--------------------------------------|
| Both cities on same date within range     | `(cheap_pickup + cheap_dropoff) / 2` |
| Otherwise                                 | `standard` for pickup city           |

---

## REHOME CAN SUGGEST

Always: `cheap` for pickup city (guaranteed cheapest rate).

---

## Implementation Files

- **Shared calculator**: `rehome-backend/services/pricing/basePriceCalculator.js` (5 exported functions)
- **City resolution**: `rehome-backend/services/pricing/cityUtils.js` (`findClosestCity`)
- **Calendar API**: `rehome-backend/api/calendar-pricing.js`
- **Sidebar pricing**: `rehome-backend/services/supabasePricingService.js`
- **Tests**: `rehome-backend/tests/base-price-calculation.test.js`
