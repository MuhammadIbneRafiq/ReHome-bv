import React, { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
  sizes?: string;
  quality?: number;
}

const LazyImage: React.FC<LazyImageProps> = memo(({
  src,
  alt,
  className = '',
  fallbackSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==',
  onLoad,
  onError,
  priority = false,
  sizes,
  quality = 85
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [isInView, setIsInView] = useState(priority);
  const [currentSrc, setCurrentSrc] = useState<string>(placeholder);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadAttemptedRef = useRef<boolean>(false);
  const imageCache = useRef<Map<string, string>>(new Map());

  // Optimize Supabase image URLs with transformations
  const getOptimizedImageUrl = (originalSrc: string, targetQuality: number = quality): string => {
    if (!originalSrc || !originalSrc.includes('supabase')) return originalSrc;
    
    // Check cache first
    const cacheKey = `${originalSrc}_${targetQuality}`;
    if (imageCache.current.has(cacheKey)) {
      return imageCache.current.get(cacheKey)!;
    }
    
    try {
      const url = new URL(originalSrc);
      // Add Supabase image transformation parameters
      url.searchParams.set('width', '800');
      url.searchParams.set('height', '600');
      url.searchParams.set('resize', 'cover');
      url.searchParams.set('quality', targetQuality.toString());
      url.searchParams.set('format', 'webp');
      
      const optimizedUrl = url.toString();
      // Cache the result
      imageCache.current.set(cacheKey, optimizedUrl);
      return optimizedUrl;
    } catch {
      return originalSrc;
    }
  };

  // Preload image in memory
  const preloadImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(url);
      img.onerror = () => reject(new Error('Image failed to load'));
    });
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const img = imgRef.current;
    if (!img) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.unobserve(img);
        }
      },
      {
        rootMargin: '200px 0px', // Start loading 200px before entering viewport for smoother experience
        threshold: 0.01
      }
    );

    observerRef.current.observe(img);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority]);

  // Load image when in view
  useEffect(() => {
    if (!isInView || !src || loadAttemptedRef.current) return;
    
    loadAttemptedRef.current = true;
    const optimizedSrc = getOptimizedImageUrl(src);
    
    // Use Promise to handle image loading
    preloadImage(optimizedSrc)
      .then(() => {
        setCurrentSrc(optimizedSrc);
        setImageState('loaded');
        onLoad?.();
      })
      .catch(() => {
        // Try fallback URL first, then use placeholder
        if (fallbackSrc && optimizedSrc !== fallbackSrc) {
          return preloadImage(fallbackSrc)
            .then(() => {
              setCurrentSrc(fallbackSrc);
              setImageState('loaded');
            })
            .catch(() => {
              setCurrentSrc(fallbackSrc);
              setImageState('error');
              onError?.();
            });
        } else {
          setCurrentSrc(fallbackSrc);
          setImageState('error');
          onError?.();
        }
      });

  }, [isInView, src, fallbackSrc, onLoad, onError, quality]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio: '4/3' }}>
      <motion.img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        initial={{ opacity: 0 }}
        animate={{ opacity: imageState === 'loaded' ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
      
      {/* Loading indicator */}
      {imageState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
        </div>
      )}
      
      {/* Error state */}
      {imageState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-500">
          <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm">Image unavailable</span>
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage; 