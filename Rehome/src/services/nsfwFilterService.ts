import * as tf from '@tensorflow/tfjs';
import * as nsfwjs from 'nsfwjs';

export interface NSFWCheckResult {
  isSafe: boolean;
  confidence?: number;
  category?: string;
  message: string;
  processingTime?: number;
  details?: {
    predictions?: Array<{
      className: string;
      probability: number;
    }>;
    topPrediction?: string;
    modelConfidence?: number;
  };
}

interface CheckResult {
  safeFiles: File[];
  unsafeFiles: { file: File; result: NSFWCheckResult }[];
  allSafe: boolean;
}

class NSFWFilterService {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private nsfwModel: any = null;
  private imageCache = new Map<string, NSFWCheckResult>();
  private readonly CACHE_SIZE = 100; // Limit cache size

  /**
   * Initialize the NSFW detection model
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = new Promise(async (resolve, reject) => {
      try {
        console.log('🔍 Initializing NSFW detection model...');
        
        // Initialize TensorFlow.js
        await tf.ready();
        
        // Load the NSFW model
        console.log('📦 Loading NSFW model...');
        this.nsfwModel = await nsfwjs.load();
        
        this.isInitialized = true;
        console.log('✅ NSFW model loaded successfully!');
        resolve();
      } catch (error) {
        console.error('❌ Failed to initialize NSFW model:', error);
        reject(error);
      }
    });

    return this.initializationPromise;
  }

  /**
   * Generate a simple hash for image caching
   */
  private generateImageHash(file: File): string {
    return `${file.name}_${file.size}_${file.lastModified}`;
  }

  /**
   * Analyze image using the NSFW model
   */
  private async analyzeImageWithModel(file: File): Promise<NSFWCheckResult> {
    const startTime = performance.now();

    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = async () => {
        try {
          console.log(`🔍 Analyzing image with NSFW model: ${file.name}`);
          
          // Get predictions from the model
          const predictions = await this.nsfwModel.classify(img);
          const processingTime = performance.now() - startTime;
          
          console.log('📊 NSFW Model Predictions:', predictions);
          
          // Sort predictions by probability (highest first)
          const sortedPredictions = predictions.sort((a: any, b: any) => b.probability - a.probability);
          const topPrediction = sortedPredictions[0];
          
          console.log(`🎯 Top prediction: ${topPrediction.className} (${(topPrediction.probability * 100).toFixed(1)}%)`);
          
          // // Define safe categories
          // const safeCategories = ['Neutral', 'Drawing'];
          // const unsafeCategories = ['Porn', 'Sexy', 'Hentai'];
          
          // Determine if image is safe
          const isSafe = this.determineImageSafety(sortedPredictions);
          
          const result: NSFWCheckResult = {
            isSafe,
            confidence: topPrediction.probability,
            category: topPrediction.className,
            message: isSafe 
              ? `✅ Image appears safe (${topPrediction.className}: ${(topPrediction.probability * 100).toFixed(1)}%)`
              : `🚫 Image may contain inappropriate content (${topPrediction.className}: ${(topPrediction.probability * 100).toFixed(1)}%)`,
            processingTime,
            details: {
              predictions: sortedPredictions.map((p: any) => ({
                className: p.className,
                probability: Math.round(p.probability * 1000) / 10 // Round to 1 decimal
              })),
              topPrediction: topPrediction.className,
              modelConfidence: Math.round(topPrediction.probability * 1000) / 10
            }
          };
          
          console.log(`🚦 Decision: ${isSafe ? '✅ SAFE' : '🚫 UNSAFE'} - ${result.message}`);
          
          // Clean up
          URL.revokeObjectURL(img.src);
          
          resolve(result);
        } catch (error) {
          console.error('❌ Error during model analysis:', error);
          const processingTime = performance.now() - startTime;
          
          // Clean up
          URL.revokeObjectURL(img.src);
          
          // If model fails, allow upload but log the error
          resolve({
            isSafe: true,
            message: '⚠️ Content check unavailable - upload allowed',
            processingTime,
            details: {
              predictions: [],
              topPrediction: 'Error',
              modelConfidence: 0
            }
          });
        }
      };

      img.onerror = () => {
        const processingTime = performance.now() - startTime;
        console.error('❌ Failed to load image for analysis');
        
        resolve({
          isSafe: true,
          message: '⚠️ Could not analyze image - upload allowed',
          processingTime,
          details: {
            predictions: [],
            topPrediction: 'Error',
            modelConfidence: 0
          }
        });
      };

      // Load the image
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Determine if image is safe based on model predictions
   */
  private determineImageSafety(predictions: any[]): boolean {
    // Get probabilities for each category
    const neutral = predictions.find(p => p.className === 'Neutral')?.probability || 0;
    const drawing = predictions.find(p => p.className === 'Drawing')?.probability || 0;
    const sexy = predictions.find(p => p.className === 'Sexy')?.probability || 0;
    const porn = predictions.find(p => p.className === 'Porn')?.probability || 0;
    const hentai = predictions.find(p => p.className === 'Hentai')?.probability || 0;
    
    // Calculate safe vs unsafe probabilities
    const safeScore = neutral + drawing;
    const unsafeScore = sexy + porn + hentai;
    
    console.log(`📊 Safety Analysis:`);
    console.log(`   Safe (Neutral + Drawing): ${(safeScore * 100).toFixed(1)}%`);
    console.log(`   Unsafe (Sexy + Porn + Hentai): ${(unsafeScore * 100).toFixed(1)}%`);
    
    // Conservative thresholds for furniture platform
    const SAFE_THRESHOLD = 0.6; // 60% confidence in safe categories
    const UNSAFE_THRESHOLD = 0.15; // 15% confidence in unsafe categories
    
    // Image is safe if:
    // 1. High confidence in safe categories, OR
    // 2. Low confidence in unsafe categories AND not clearly unsafe
    const isSafe = safeScore >= SAFE_THRESHOLD || 
                   (unsafeScore < UNSAFE_THRESHOLD && safeScore > unsafeScore);
    
    console.log(`🎯 Safety decision: ${isSafe ? 'SAFE' : 'UNSAFE'} (Safe: ${(safeScore * 100).toFixed(1)}%, Unsafe: ${(unsafeScore * 100).toFixed(1)}%)`);
    
    return isSafe;
  }

  /**
   * Check if an image is safe for upload (with caching)
   */
  async checkImage(file: File): Promise<NSFWCheckResult> {
    try {
      await this.initialize();
      
      // Check cache first
      const hash = this.generateImageHash(file);
      if (this.imageCache.has(hash)) {
        const cached = this.imageCache.get(hash)!;
        console.log(`🔍 Using cached result for: ${file.name}`);
        return cached;
      }
      
      console.log(`🔍 Analyzing new image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      
      // Perform analysis with the model
      const result = await this.analyzeImageWithModel(file);
      
      // Cache result (with size limit)
      if (this.imageCache.size >= this.CACHE_SIZE) {
        const firstKey = this.imageCache.keys().next().value;
        if (firstKey !== undefined) {
          this.imageCache.delete(firstKey);
        }
      }
      this.imageCache.set(hash, result);
      
      return result;
    } catch (error) {
      console.error('❌ NSFW check failed:', error);
      
      // If check fails, allow upload but log the error
      return {
        isSafe: true,
        message: '⚠️ Content check unavailable - upload allowed',
        processingTime: 0,
        details: {
          predictions: [],
          topPrediction: 'Error',
          modelConfidence: 0
        }
      };
    }
  }

  /**
   * Check multiple images efficiently
   */
  async checkMultipleImages(files: File[]): Promise<CheckResult> {
    const startTime = performance.now();
    console.log(`🔍 Checking ${files.length} images with NSFW model...`);
    
    // Process files in parallel for speed
    const results = await Promise.all(
      files.map(async (file) => ({
        file,
        result: await this.checkImage(file)
      }))
    );

    const safeFiles = results
      .filter(({ result }) => result.isSafe)
      .map(({ file }) => file);

    const unsafeFiles = results
      .filter(({ result }) => !result.isSafe)
      .map(({ file, result }) => ({ file, result }));

    const totalTime = performance.now() - startTime;
    console.log(`✅ Batch analysis complete: ${files.length} files in ${totalTime.toFixed(1)}ms (avg: ${(totalTime/files.length).toFixed(1)}ms per file)`);

    return {
      safeFiles,
      unsafeFiles,
      allSafe: unsafeFiles.length === 0
    };
  }

  /**
   * Get a user-friendly error message for unsafe images
   */
  getUnsafeImageMessage(unsafeFiles: { file: File; result: NSFWCheckResult }[]): string {
    if (unsafeFiles.length === 1) {
      const result = unsafeFiles[0].result;
      return `🚫 "${unsafeFiles[0].file.name}" may contain inappropriate content (${result.details?.topPrediction}: ${result.details?.modelConfidence}%). Please choose a different image.`;
    } else {
      const fileNames = unsafeFiles.map(({ file }) => `"${file.name}"`).join(', ');
      return `🚫 The following images may contain inappropriate content: ${fileNames}. Please choose different images.`;
    }
  }

  /**
   * Clear the image cache
   */
  clearCache(): void {
    this.imageCache.clear();
    console.log('🗑️ NSFW filter cache cleared');
  }
}

// Export a singleton instance
export const nsfwFilterService = new NSFWFilterService();
export default nsfwFilterService; 