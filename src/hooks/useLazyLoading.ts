import { useState, useEffect, useRef, useCallback } from 'react';

interface LazyLoadingOptions {
  rootMargin?: string;
  threshold?: number | number[];
  preloadOnHover?: boolean;
  preloadDelay?: number;
}

export const useLazyLoading = (options: LazyLoadingOptions = {}) => {
  const {
    rootMargin = '100px',
    threshold = 0.1,
    preloadOnHover = false,
    preloadDelay = 300
  } = options;
  
  const [isVisible, setIsVisible] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle intersection changes
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    setIsVisible(entry.isIntersecting);
    
    // If element becomes visible, cancel any hover preloading
    if (entry.isIntersecting && hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);
  
  // Handle mouse enter for hover preloading
  const handleMouseEnter = useCallback(() => {
    if (!preloadOnHover || isPreloaded) return;
    
    setIsHovered(true);
    
    // Set timer to preload after delay
    hoverTimerRef.current = setTimeout(() => {
      setIsPreloaded(true);
    }, preloadDelay);
  }, [preloadOnHover, isPreloaded, preloadDelay]);
  
  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    
    // Cancel preload if not yet triggered
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);
  
  // Set up intersection observer
  useEffect(() => {
    if (!elementRef.current) return;
    
    // Create observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold
    });
    
    // Observe element
    if (elementRef.current) {
      observerRef.current.observe(elementRef.current);
    }
    
    return () => {
      // Clean up observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      
      // Clean up hover timer
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    };
  }, [handleIntersection, rootMargin, threshold]);
  
  // Preload manually
  const preload = useCallback(() => {
    setIsPreloaded(true);
    
    // Cancel any pending hover preload
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);
  
  // Reset loading state
  const reset = useCallback(() => {
    setIsVisible(false);
    setIsPreloaded(false);
    setIsHovered(false);
    
    // Cancel any pending hover preload
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);
  
  return {
    isVisible,
    isPreloaded,
    isHovered,
    elementRef,
    handleMouseEnter,
    handleMouseLeave,
    preload,
    reset
  };
};

// Hook specifically for lazy loading images
export const useLazyImage = (src: string, options: LazyLoadingOptions = {}) => {
  const [imageSrc, setImageSrc] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const lazyLoading = useLazyLoading(options);
  
  // When element becomes visible or is preloaded, load the image
  useEffect(() => {
    if ((lazyLoading.isVisible || lazyLoading.isPreloaded) && !imageSrc) {
      setImageSrc(src);
    }
  }, [lazyLoading.isVisible, lazyLoading.isPreloaded, imageSrc, src]);
  
  // Handle image load events
  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);
  
  const handleImageError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true); // Consider it loaded even if errored
  }, []);
  
  return {
    ...lazyLoading,
    imageSrc,
    isLoaded,
    hasError,
    handleImageLoad,
    handleImageError
  };
};

export default useLazyLoading;