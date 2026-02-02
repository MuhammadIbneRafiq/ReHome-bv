---
description: Testing guidelines and centralized test location
---

# Testing Guidelines

## Centralized Test Location

All frontend tests MUST be placed in the centralized `src/__tests__` directory structure:

```
src/
├── __tests__/
│   ├── components/
│   │   ├── ui/
│   │   │   └── ComponentName.test.tsx
│   │   └── pages/
│   │       └── PageName.test.tsx
│   ├── utils/
│   │   └── utilityName.test.ts
│   ├── services/
│   │   └── serviceName.test.ts
│   └── lib/
│       └── libName.test.ts
```

## Test File Naming

- Test files MUST follow the pattern: `[Component/Utility/Service].test.{js,ts,tsx}`
- Use `.test.tsx` for React component tests
- Use `.test.ts` for utility/service tests
- Use `.spec.{js,ts,tsx}` only if following existing conventions

## Test Structure

### Component Tests
- Place in `src/__tests__/components/[same-path-as-source]/`
- Example: `src/components/ui/Button.tsx` → `src/__tests__/components/ui/Button.test.tsx`

### Utility Tests
- Place in `src/__tests__/utils/`
- Example: `src/utils/googleMapsLoader.ts` → `src/__tests__/utils/googleMapsLoader.test.ts`

### Service Tests
- Place in `src/__tests__/services/`
- Example: `src/services/apiService.ts` → `src/__tests__/services/apiService.test.ts`

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test src/__tests__/components/ui/GooglePlacesAutocomplete.test.tsx
```

## Important Notes

- NEVER place test files alongside source files (e.g., `Component.tsx` and `Component.test.tsx` in same directory)
- ALWAYS use the centralized `src/__tests__` structure
- The vitest config is configured to only look for tests in `src/**/__tests__/**/*.{test,spec}.{js,ts,tsx}`
- Tests placed outside this structure WILL NOT be discovered by the test runner
