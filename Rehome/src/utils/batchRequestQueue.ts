/**
 * Batch Request Queue - Groups multiple requests into batched API calls
 * 
 * This utility allows collecting multiple individual requests within a small time window
 * and combining them into a single batch API request, significantly reducing network overhead.
 */

// Define request types
export type RequestKey = string;
export type BatchProcessor<T> = (keys: RequestKey[]) => Promise<Record<RequestKey, T>>;

interface QueuedRequest<T> {
  key: RequestKey;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

/**
 * BatchRequestQueue collects individual requests and processes them in batches
 */
export class BatchRequestQueue<T> {
  private queue: QueuedRequest<T>[] = [];
  private timer: NodeJS.Timeout | null = null;
  private processingPromise: Promise<void> | null = null;
  private processor: BatchProcessor<T>;
  private batchDelay: number;
  private maxBatchSize: number;

  /**
   * Create a new BatchRequestQueue
   * @param processor Function that processes batched requests
   * @param options Configuration options
   */
  constructor(
    processor: BatchProcessor<T>,
    options: {
      batchDelay?: number;
      maxBatchSize?: number;
    } = {}
  ) {
    this.processor = processor;
    this.batchDelay = options.batchDelay || 10; // Default 10ms delay
    this.maxBatchSize = options.maxBatchSize || 20; // Default max batch size
  }

  /**
   * Add a request to the queue
   * @param key Unique key for this request
   * @returns Promise that resolves with the result
   */
  public enqueue(key: RequestKey): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Add to queue
      this.queue.push({ key, resolve, reject });
      
      // Schedule processing if not already scheduled
      this.scheduleProcessing();
      
      // If we've hit max batch size, process immediately
      if (this.queue.length >= this.maxBatchSize) {
        this.processQueue();
      }
    });
  }

  /**
   * Schedule processing of the queue after a short delay
   */
  private scheduleProcessing(): void {
    if (this.timer === null && this.processingPromise === null) {
      this.timer = setTimeout(() => this.processQueue(), this.batchDelay);
    }
  }

  /**
   * Process all queued requests in a batch
   */
  private processQueue(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // If queue is empty, do nothing
    if (this.queue.length === 0) {
      return;
    }

    // Take current batch and reset queue
    const batch = [...this.queue];
    this.queue = [];

    // Create set of unique keys to fetch
    const uniqueKeys = [...new Set(batch.map(item => item.key))];

    // Process batch
    this.processingPromise = this.processor(uniqueKeys)
      .then(results => {
        // Resolve each request with its result
        batch.forEach(({ key, resolve, reject }) => {
          if (key in results) {
            resolve(results[key]);
          } else {
            reject(new Error(`No result for key: ${key}`));
          }
        });
      })
      .catch(error => {
        // Reject all requests on batch error
        console.error('Batch processing error:', error);
        batch.forEach(({ reject }) => {
          reject(error);
        });
      })
      .finally(() => {
        this.processingPromise = null;
        
        // If new items were added during processing, schedule another run
        if (this.queue.length > 0) {
          this.scheduleProcessing();
        }
      });
  }

  /**
   * Get the current queue size
   */
  public getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Check if the queue is currently processing
   */
  public isProcessing(): boolean {
    return this.processingPromise !== null;
  }
}

export default BatchRequestQueue;
