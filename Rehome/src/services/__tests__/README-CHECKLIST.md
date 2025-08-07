# Pricing Test Checklist

- Base charge scenarios (within/between cities, fixed/flexible, rehome)
- Early booking discount application
- Distance cost tiers (<10, <=50, >50)
- Carrying/assembly/extra helper calculations
- Async schedule endpoints success/failure
- Concurrency: parallel calculatePricing calls
- UI usage in `ItemMovingPage.tsx` and `HouseMovingPage.tsx`

Run:

```bash
npm run test
```


