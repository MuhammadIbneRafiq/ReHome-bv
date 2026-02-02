---
description: Testing principles and best practices - NEVER simplify or remove tests
---

# Testing Principles

## Core Rules

### 1. NEVER Simplify or Remove Tests When Things Don't Work
- If a testing framework or mocking is complex, **learn how to use it properly**
- If tests are failing, **fix the root cause** - don't delete the test
- If mocking is difficult, find the correct approach - don't skip the test
- Put unresolved issues in "Next Steps" or "Suggestions" instead of removing tests

### 2. Test With ACTUAL Values, Not Just Types
❌ BAD:
```javascript
expect(typeof result).toBe('number');
expect(result).toBeDefined();
```

✅ GOOD:
```javascript
expect(result.totalCost).toBe(25.50);
expect(result.floors).toBe(2);
expect(result.multiplier).toBe(1.35);
```

### 3. Use Real Data From Database
- Query Supabase for actual pricing values before writing tests
- Use MCP tools to fetch real configuration
- If values change, update tests - don't make them generic

### 4. Cover All Aspects of Code
Each function should have tests for:
- Happy path (normal operation)
- Edge cases (null, empty, undefined)
- Error handling
- Boundary conditions
- Different input formats

### 5. Async Operations Must Be Properly Handled
- Close database connections after tests
- Use `afterAll` to clean up resources
- If Jest shows "did not exit" warning, fix the root cause:
  ```javascript
  afterAll(async () => {
    // Close any open connections
    await supabase.removeAllChannels();
    // Or close specific connections
  });
  ```

## Jest with ES Modules

### Proper Mocking Pattern
```javascript
// Use unstable_mockModule for ES modules
import { jest } from '@jest/globals';

jest.unstable_mockModule('./module.js', () => ({
  myFunction: jest.fn().mockResolvedValue(25)
}));

// Import AFTER mocking
const { myFunction } = await import('./module.js');
```

### Handle Async Cleanup
```javascript
import { afterAll } from '@jest/globals';

afterAll(async () => {
  // Clean up Supabase connections
  if (supabase) {
    await supabase.removeAllChannels();
  }
  // Wait for pending operations
  await new Promise(resolve => setTimeout(resolve, 500));
});
```

## Test Value Sources

### Pricing Values (from Supabase)
- `pricing_config` table: base charges, multipliers
- `carrying_config` table: floor multipliers (1.35 per floor)
- `assembly_pricing_config` table: assembly costs per item
- `extra_helper_config` table: helper costs by category

### Always Verify Against Database
Before writing price assertions, query the actual values:
```sql
SELECT * FROM pricing_config;
SELECT * FROM carrying_config;
SELECT * FROM assembly_pricing_config;
```

## Red Flags - Never Do These

1. ❌ "Let me simplify the tests to focus on what can be reliably tested"
2. ❌ Checking only `typeof` instead of actual values
3. ❌ Removing tests because mocking is "complex"
4. ❌ Using `.toBeDefined()` when you should check actual values
5. ❌ Ignoring async cleanup warnings
