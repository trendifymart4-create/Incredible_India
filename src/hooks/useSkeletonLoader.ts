import { useState, useEffect, useCallback } from 'react';

interface SkeletonLoaderOptions {
  itemCount?: number;
  loadingDelay?: number;
  errorTimeout?: number;
  retryAttempts?: number;
}

export const useSkeletonLoader = (options: SkeletonLoaderOptions = {}) => {
  const {
    itemCount = 5,
    loadingDelay = 300,
    errorTimeout = 10000,
    retryAttempts = 3
  } = options;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  
  // Simulate loading with progress
  useEffect(() => {
    if (!isLoading) return;
    
    let progressInterval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;
    
    // Simulate progressive loading
    progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        return Math.min(newProgress, 95); // Cap at 95% until actual load completes
      });
    }, 200);
    
    // Timeout for error simulation
    timeoutId = setTimeout(() => {
      clearInterval(progressInterval);
      setIsError(true);
      setIsLoading(false);
      setProgress(100);
    }, errorTimeout);
    
    // Cleanup
    return () => {
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
    };
  }, [isLoading, errorTimeout]);
  
  // Complete loading
  const completeLoading = useCallback((data: any[] = []) => {
    setProgress(100);
    setTimeout(() => {
      setIsLoading(false);
      setIsError(false);
      setItems(data);
      setRetryCount(0);
    }, loadingDelay);
  }, [loadingDelay]);
  
  // Trigger error
  const triggerError = useCallback(() => {
    setIsLoading(false);
    setIsError(true);
    setProgress(100);
  }, []);
  
  // Retry loading
  const retry = useCallback(() => {
    if (retryCount >= retryAttempts) {
      console.warn('Max retry attempts reached');
      return;
    }
    
    setRetryCount(prev => prev + 1);
    setIsLoading(true);
    setIsError(false);
    setProgress(0);
  }, [retryCount, retryAttempts]);
  
  // Reset to initial state
  const reset = useCallback(() => {
    setIsLoading(true);
    setIsError(false);
    setRetryCount(0);
    setItems([]);
    setProgress(0);
  }, []);
  
  // Generate skeleton items
  const generateSkeletonItems = useCallback(() => {
    return Array.from({ length: itemCount }, (_, index) => ({
      id: `skeleton-${index}`,
      type: 'skeleton',
      index
    }));
  }, [itemCount]);
  
  // Get loading state description
  const getLoadingState = useCallback(() => {
    if (isError) return 'error';
    if (isLoading && progress < 100) return 'loading';
    if (isLoading && progress === 100) return 'completing';
    return 'complete';
  }, [isError, isLoading, progress]);
  
  return {
    isLoading,
    isError,
    retryCount,
    items,
    progress,
    skeletonItems: generateSkeletonItems(),
    completeLoading,
    triggerError,
    retry,
    reset,
    getLoadingState
  };
};

// Hook for content-aware skeleton loading
export const useContentAwareSkeleton = (contentType: string) => {
  const getContentSkeletonConfig = useCallback(() => {
    switch (contentType) {
      case 'destination-card':
        return {
          itemCount: 6,
          itemHeight: '200px',
          showImage: true,
          showTitle: true,
          showDescription: true,
          showRating: true,
          showMeta: true
        };
      case 'destination-list':
        return {
          itemCount: 8,
          itemHeight: '120px',
          showImage: true,
          showTitle: true,
          showDescription: false,
          showRating: true,
          showMeta: false
        };
      case 'review':
        return {
          itemCount: 5,
          itemHeight: '150px',
          showImage: true,
          showTitle: true,
          showDescription: true,
          showRating: true,
          showMeta: true
        };
      case 'testimonial':
        return {
          itemCount: 3,
          itemHeight: '180px',
          showImage: true,
          showTitle: false,
          showDescription: true,
          showRating: false,
          showMeta: true
        };
      default:
        return {
          itemCount: 5,
          itemHeight: '100px',
          showImage: false,
          showTitle: true,
          showDescription: true,
          showRating: false,
          showMeta: false
        };
    }
  }, [contentType]);
  
  const config = getContentSkeletonConfig();
  
  const generateContentSkeletonItems = useCallback(() => {
    return Array.from({ length: config.itemCount }, (_, index) => ({
      id: `content-skeleton-${contentType}-${index}`,
      type: 'content-skeleton',
      contentType,
      index,
      config
    }));
  }, [config, contentType]);
  
  return {
    skeletonItems: generateContentSkeletonItems(),
    config
  };
};

export default useSkeletonLoader;