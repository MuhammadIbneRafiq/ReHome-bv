import * as tf from '@tensorflow/tfjs';

export interface NSFWCheckResult {
  isSafe: boolean;
  confidence?: number;
  category?: string;
  message: string;
  processingTime?: number;
}

interface CheckResult {
  safeFiles: File[];
  unsafeFiles: { file: File; result: NSFWCheckResult }[];
  allSafe: boolean;
}

class NSFWFilterService {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private imageCache = new Map<string, NSFWCheckResult>();
  private readonly CACHE_SIZE = 100; // Limit cache size

  /**
   * Initialize a lightweight NSFW detection model
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = new Promise(async (resolve, reject) => {
      try {
        console.log('🔍 Initializing lightweight NSFW filter...');
        
        // Use a simple heuristic-based approach for speed
        // This is much faster than loading a heavy ML model
        await tf.ready();
        
        this.isInitialized = true;
        console.log('✅ NSFW filter initialized successfully (heuristic mode)');
        resolve();
      } catch (error) {
        console.error('❌ Failed to initialize NSFW filter:', error);
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
   * Fast heuristic-based content analysis
   */
  private async analyzeImageHeuristic(file: File): Promise<NSFWCheckResult> {
    const startTime = performance.now();

    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        try {
          // Resize for faster processing
          const maxSize = 128;
          const scale = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Get image data for analysis
          const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
          if (!imageData) {
            throw new Error('Could not get image data');
          }

          // Fast heuristic analysis
          const result = this.performHeuristicAnalysis(imageData);
          const processingTime = performance.now() - startTime;

          resolve({
            ...result,
            processingTime
          });
        } catch (error) {
          console.error('Error in heuristic analysis:', error);
          const processingTime = performance.now() - startTime;
          resolve({
            isSafe: true,
            message: '⚠️ Content check unavailable - upload allowed',
            processingTime
          });
        }
      };

      img.onerror = () => {
        const processingTime = performance.now() - startTime;
        resolve({
          isSafe: true,
          message: '⚠️ Could not analyze image - upload allowed',
          processingTime
        });
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Fast heuristic analysis based on color patterns and skin detection
   */
  private performHeuristicAnalysis(imageData: ImageData): Omit<NSFWCheckResult, 'processingTime'> {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    let skinPixels = 0;
    let totalPixels = 0;
    let skinRegions = 0;
    
    // Sample every 4th pixel for speed (16x faster)
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      totalPixels++;
      
      // Simple skin tone detection
      if (this.isSkinTone(r, g, b)) {
        skinPixels++;
        
        // Check if this forms a region with nearby skin pixels
        const x = Math.floor((i / 4) % width);
        const y = Math.floor((i / 4) / width);
        if (this.hasNearbySkinPixels(data, x, y, width, height)) {
          skinRegions++;
        }
      }
    }
    
    const skinPercentage = (skinPixels / totalPixels) * 100;
    const regionDensity = (skinRegions / skinPixels) * 100;
    
    // Conservative thresholds - err on the side of caution
    const SKIN_THRESHOLD = 35; // % of skin-colored pixels
    const REGION_THRESHOLD = 25; // % of skin pixels in regions
    
    const isSafe = skinPercentage < SKIN_THRESHOLD || regionDensity < REGION_THRESHOLD;
    
    if (isSafe) {
      return {
        isSafe: true,
        confidence: Math.max(0.7, 1 - skinPercentage / 100),
        message: '✅ Image appears safe for upload'
      };
    } else {
      return {
        isSafe: false,
        confidence: Math.min(0.8, skinPercentage / 100),
        category: 'potentially_inappropriate',
        message: '🚫 Image may contain inappropriate content'
      };
    }
  }

  /**
   * Simple skin tone detection
   */
  private isSkinTone(r: number, g: number, b: number): boolean {
    // Multiple skin tone ranges for different ethnicities
    return (
      // Light skin tones
      (r > 95 && g > 40 && b > 20 && r > g && r > b && r - g > 15) ||
      // Medium skin tones  
      (r > 80 && g > 50 && b > 30 && r > g && g > b) ||
      // Darker skin tones
      (r > 60 && g > 40 && b > 25 && r >= g && g >= b)
    );
  }

  /**
   * Check for nearby skin pixels to detect regions
   */
  private hasNearbySkinPixels(data: Uint8ClampedArray, x: number, y: number, width: number, height: number): boolean {
    const radius = 2;
    let nearbyCount = 0;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const index = (ny * width + nx) * 4;
          if (this.isSkinTone(data[index], data[index + 1], data[index + 2])) {
            nearbyCount++;
          }
        }
      }
    }
    
    return nearbyCount >= 3; // At least 3 nearby skin pixels
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
        console.log(`🔍 Using cached result for: ${file.name} (${cached.processingTime?.toFixed(1)}ms)`);
        return cached;
      }
      
      console.log(`🔍 Analyzing image: ${file.name}`);
      
      // Perform analysis
      const result = await this.analyzeImageHeuristic(file);
      
      // Cache result (with size limit)
      if (this.imageCache.size >= this.CACHE_SIZE) {
        const firstKey = this.imageCache.keys().next().value;
        this.imageCache.delete(firstKey);
      }
      this.imageCache.set(hash, result);
      
      console.log(`🔍 Analysis complete: ${file.name} (${result.processingTime?.toFixed(1)}ms) - ${result.isSafe ? 'SAFE' : 'UNSAFE'}`);
      
      return result;
    } catch (error) {
      console.error('❌ NSFW check failed:', error);
      
      // If check fails, allow upload but log the error
      return {
        isSafe: true,
        message: '⚠️ Content check unavailable - upload allowed',
        processingTime: 0
      };
    }
  }

  /**
   * Check multiple images efficiently
   */
  async checkMultipleImages(files: File[]): Promise<CheckResult> {
    const startTime = performance.now();
    console.log(`🔍 Checking ${files.length} images...`);
    
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
      return `🚫 "${unsafeFiles[0].file.name}" may contain inappropriate content. Please choose a different image.`;
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