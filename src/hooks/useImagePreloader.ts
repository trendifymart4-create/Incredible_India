// React hook for managing image preloading state
import { useState, useEffect } from 'react';
import { preloadAllImages, PreloadStatus, warmupImageCache, getPreloadStats } from '../utils/imagePreloader';

export interface UseImagePreloaderResult {
  isLoading: boolean;
  isComplete: boolean;
  progress: number;
  status: PreloadStatus | null;
  stats: {
    totalImages: number;
    cachedImages: number;
    cachePercentage: number;
  };
  startPreloading: () => Promise<void>;
}

export const useImagePreloader = (autoStart = true): UseImagePreloaderResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [status, setStatus] = useState<PreloadStatus | null>(null);
  const [stats, setStats] = useState({
    totalImages: 0,
    cachedImages: 0,
    cachePercentage: 0
  });

  // Update stats
  const updateStats = () => {
    const newStats = getPreloadStats();
    setStats(newStats);
  };

  // Start preloading process
  const startPreloading = async (): Promise<void> => {
    if (isLoading || isComplete) return;

    console.log('🚀 Starting image preloading...');
    setIsLoading(true);
    
    try {
      const finalStatus = await preloadAllImages((progressStatus) => {
        setStatus(progressStatus);
        updateStats();
      });
      
      setStatus(finalStatus);
      setIsComplete(true);
      setIsLoading(false);
      updateStats();
      
      console.log('✅ Image preloading completed:', finalStatus);
    } catch (error) {
      console.error('❌ Image preloading failed:', error);
      setIsLoading(false);
    }
  };

  // Auto-start preloading on mount if enabled
  useEffect(() => {
    updateStats(); // Initial stats
    
    if (autoStart) {
      // Small delay to allow app to initialize first
      const timer = setTimeout(() => {
        startPreloading();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  return {
    isLoading,
    isComplete,
    progress: status?.progress || 0,
    status,
    stats,
    startPreloading
  };
};