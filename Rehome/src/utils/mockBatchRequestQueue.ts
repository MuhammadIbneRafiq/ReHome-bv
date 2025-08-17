/**
 * Mock Batch Request Queue - Provides immediate results for tests
 * 
 * This mock avoids actual network and timer operations during tests.
 */

import { RequestKey } from './batchRequestQueue';

/**
 * A simplified version of BatchRequestQueue that doesn't actually batch
 * but resolves each request immediately for testing purposes.
 */
export class MockBatchRequestQueue<T> {
  private processor: (keys: RequestKey[]) => Promise<Record<RequestKey, T>>;
  
  constructor(processor: (keys: RequestKey[]) => Promise<Record<RequestKey, T>>) {
    this.processor = processor;
  }
  
  /**
   * Process each request immediately without batching
   */
  public async enqueue(key: RequestKey): Promise<T> {
    try {
      const results = await this.processor([key]);
      return results[key];
    } catch (error) {
      console.error(`[MOCK] Error processing request for key ${key}:`, error);
      throw error;
    }
  }
  
  public getQueueSize(): number {
    return 0;
  }
  
  public isProcessing(): boolean {
    return false;
  }
}

export default MockBatchRequestQueue;
