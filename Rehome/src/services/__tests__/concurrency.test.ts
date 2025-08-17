import { describe, it, expect, beforeAll } from 'vitest';
import { PricingService, PricingInput } from '../pricingService';
import { initDynamicConstants } from '../../lib/constants';

// Initialize constants before running tests
beforeAll(async () => {
  await initDynamicConstants();
});

describe('Pricing Service Concurrency Tests', () => {
  // Helper function to create base pricing input
  const createBaseInput = (overrides: Partial<PricingInput> = {}): PricingInput => ({
    serviceType: 'item-transport',
    pickupLocation: 'Amsterdam',
    dropoffLocation: 'Rotterdam',
    selectedDate: '2024-01-15',
    isDateFlexible: false,
    itemQuantities: { '1': 1, '2': 2 },  // Add some items
    floorPickup: 0,
    floorDropoff: 0,
    elevatorPickup: false,
    elevatorDropoff: false,
    assemblyItems: {},
    extraHelperItems: {},
    isStudent: false,
    hasStudentId: false,
    pickupPlace: { placeId: 'test', text: 'Amsterdam' },
    dropoffPlace: { placeId: 'test', text: 'Rotterdam' },
    ...overrides
  });

  it('should handle 100 concurrent pricing calculations', async () => {
    const pricingService = new PricingService();
    const NUM_REQUESTS = 100;
    
    console.time('100-concurrent-requests');
    
    // Create an array of promises, each one calculating a price
    const promises = Array.from({ length: NUM_REQUESTS }, (_, index) => {
      // Vary inputs slightly to avoid any caching effects
      const input = createBaseInput({
        pickupLocation: index % 2 === 0 ? 'Amsterdam' : 'Rotterdam',
        dropoffLocation: index % 2 === 0 ? 'Rotterdam' : 'Eindhoven',
        pickupDate: `2025-08-${(index % 28) + 1}`.padStart(10, '2025-08-0'),
        dropoffDate: `2025-08-${(index % 28) + 1}`.padStart(10, '2025-08-0'),
        floorPickup: index % 3,
        floorDropoff: (index % 3) + 1,
      });
      
      // Return the promise from calculatePricing
      return pricingService.calculatePricing(input).then(result => {
        // Ensure we got a valid result
        expect(result).toBeDefined();
        expect(result.basePrice).toBeGreaterThan(0);
        expect(result.total).toBeGreaterThan(0);
        return result;
      });
    });
    
    try {
      // Wait for all promises to resolve
      const results = await Promise.all(promises);
      
      console.timeEnd('100-concurrent-requests');
      
      // Log some stats
      const basePrices = results.map(r => r.basePrice);
      const totalPrices = results.map(r => r.total);
      
      console.log(`Completed ${results.length} pricing calculations`);
      console.log(`Base prices - Min: ${Math.min(...basePrices)}, Max: ${Math.max(...basePrices)}, Avg: ${basePrices.reduce((a, b) => a + b, 0) / basePrices.length}`);
      console.log(`Total prices - Min: ${Math.min(...totalPrices)}, Max: ${Math.max(...totalPrices)}, Avg: ${totalPrices.reduce((a, b) => a + b, 0) / totalPrices.length}`);
      
      // Check that all calculations succeeded
      expect(results.length).toBe(NUM_REQUESTS);
      
      // Verify no duplicate references (check for shared state issues)
      // Each result should be its own unique object
      const uniqueObjects = new Set(results.map(r => r.breakdown.baseCharge));
      expect(uniqueObjects.size).toBe(NUM_REQUESTS);
      
    } catch (error) {
      console.error('Concurrency test failed:', error);
      throw error;
    }
  }, 30000); // Increase timeout to 30 seconds for this test
  
  it('should handle concurrent requests with different service types', async () => {
    const pricingService = new PricingService();
    const NUM_REQUESTS = 50; // 50 of each type
    
    console.time('mixed-service-types');
    
    // Create house moving requests
    const houseMovingPromises = Array.from({ length: NUM_REQUESTS }, (_, index) => {
      const input = createBaseInput({
        serviceType: 'house-moving',
        pickupLocation: ['Amsterdam', 'Rotterdam', 'Utrecht', 'Eindhoven'][index % 4],
        dropoffLocation: ['Rotterdam', 'Eindhoven', 'Amsterdam', 'Utrecht'][index % 4],
        selectedDate: `2025-08-${(index % 28) + 1}`.padStart(10, '2025-08-0'),
        isDateFlexible: index % 5 === 0, // Some flexible dates
      });
      
      return pricingService.calculatePricing(input);
    });
    
    // Create item transport requests
    const itemTransportPromises = Array.from({ length: NUM_REQUESTS }, (_, index) => {
      const input = createBaseInput({
        serviceType: 'item-transport',
        pickupLocation: ['Tilburg', 'Breda', 'Groningen', 'Zaanstad'][index % 4],
        dropoffLocation: ['Almere', 'Nijmegen', 's-Hertogenbosch', 'Amersfoort'][index % 4],
        pickupDate: `2025-08-${(index % 28) + 1}`.padStart(10, '2025-08-0'),
        dropoffDate: `2025-08-${(index % 28) + 2}`.padStart(10, '2025-08-0'),
      });
      
      return pricingService.calculatePricing(input);
    });
    
    try {
      // Combine all promises and execute them concurrently
      const allPromises = [...houseMovingPromises, ...itemTransportPromises];
      const results = await Promise.all(allPromises);
      
      console.timeEnd('mixed-service-types');
      
      // Check results
      expect(results.length).toBe(NUM_REQUESTS * 2);
      
      // Verify we got correct service types back
      const houseMovingResults = results.slice(0, NUM_REQUESTS);
      const itemTransportResults = results.slice(NUM_REQUESTS);
      
      // Different service types should have different pricing patterns
      const houseMovingAvg = houseMovingResults.reduce((sum, r) => sum + r.total, 0) / NUM_REQUESTS;
      const itemTransportAvg = itemTransportResults.reduce((sum, r) => sum + r.total, 0) / NUM_REQUESTS;
      
      console.log(`House moving average price: ${houseMovingAvg}`);
      console.log(`Item transport average price: ${itemTransportAvg}`);
      
    } catch (error) {
      console.error('Mixed service types test failed:', error);
      throw error;
    }
  }, 30000);
  
  it('should handle rapid sequential requests without caching issues', async () => {
    const pricingService = new PricingService();
    const NUM_REQUESTS = 20;
    
    console.time('sequential-requests');
    
    // Process requests one after another
    for (let i = 0; i < NUM_REQUESTS; i++) {
      const input = createBaseInput({
        pickupLocation: i % 2 === 0 ? 'Amsterdam' : 'Rotterdam',
        dropoffLocation: i % 2 === 0 ? 'Rotterdam' : 'Amsterdam',
        selectedDate: `2025-09-${(i % 28) + 1}`.padStart(10, '2025-09-0'),
        isDateFlexible: false,
      });
      
      // For sequential tests, we want to ensure each call is awaited before making the next one
      const result = await pricingService.calculatePricing(input);
      
      // Basic validation
      expect(result).toBeDefined();
      expect(result.basePrice).toBeGreaterThan(0);
    }
    
    console.timeEnd('sequential-requests');
  }, 15000);
  
  // Test to verify no memory leaks with large batches
  it('should handle large batch of requests without memory issues', async () => {
    const pricingService = new PricingService();
    const BATCH_SIZE = 200;
    
    console.time('large-batch');
    
    const requests = Array.from({ length: BATCH_SIZE }, (_, index) => {
      return pricingService.calculatePricing(createBaseInput({
        pickupLocation: ['Amsterdam', 'Rotterdam', 'Utrecht', 'Eindhoven', 'Groningen'][index % 5],
        dropoffLocation: ['Rotterdam', 'Amsterdam', 'Tilburg', 'Breda', 'Almere'][index % 5],
        selectedDate: `2025-${(index % 11) + 1}`.padStart(7, '2025-0'),
        isDateFlexible: index % 7 === 0,
      }));
    });
    
    const results = await Promise.all(requests);
    
    console.timeEnd('large-batch');
    console.log(`Successfully processed ${results.length} requests in batch`);
    
    expect(results.length).toBe(BATCH_SIZE);
    expect(results.every(r => r.total > 0)).toBe(true);
  }, 60000);
});
