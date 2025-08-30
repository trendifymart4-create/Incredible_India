import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Loader, Play, AlertCircle } from 'lucide-react';
import { useVideoPlayer } from '../../context/VideoPlayerContext';
import { videoPlayerAnimations, videoPlayerClasses } from '../../utils/videoPlayerTheme';
import type { BufferStrategy, QualityLevel } from '../../types/videoPlayer';

interface ProgressiveLoaderProps {
  src: string | string[];
  youtubeId?: string;
  poster?: string;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

interface NetworkInfo {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
  downlink: number;
  rtt: number;
}

interface LoadingState {
  phase: 'initializing' | 'loading_preview' | 'loading_full' | 'complete' | 'error';
  progress: number;
  quality: string;
  networkSpeed: 'fast' | 'medium' | 'slow';
  bufferHealth: number;
  estimatedLoadTime: number;
}

const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  src,
  youtubeId,
  poster,
  onLoadStart,
  onLoadComplete,
  onError,
  className = '',
}) => {
  const { state, actions, config } = useVideoPlayer();
  const [loadingState, setLoadingState] = useState<LoadingState>({
    phase: 'initializing',
    progress: 0,
    quality: 'auto',
    networkSpeed: 'medium',
    bufferHealth: 0,
    estimatedLoadTime: 0,
  });
  
  const [showDetailedProgress, setShowDetailedProgress] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const loadStartTime = useRef<number>(0);
  const qualityLevels = useRef<QualityLevel[]>([]);
  
  // Network detection
  const detectNetworkSpeed = useCallback((): 'fast' | 'medium' | 'slow' => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const networkInfo: NetworkInfo = {
        effectiveType: connection.effectiveType || '4g',
        downlink: connection.downlink || 10,
        rtt: connection.rtt || 100,
      };
      
      if (networkInfo.effectiveType === '4g' && networkInfo.downlink > 5) {
        return 'fast';
      } else if (networkInfo.effectiveType === '3g' || networkInfo.downlink > 1) {
        return 'medium';
      } else {
        return 'slow';
      }
    }
    
    // Fallback: measure actual download speed
    return 'medium';
  }, []);
  
  // Buffer strategy based on network speed
  const getBufferStrategy = useCallback((networkSpeed: 'fast' | 'medium' | 'slow'): BufferStrategy => {
    switch (networkSpeed) {
      case 'fast':
        return {
          minBuffer: 30,
          maxBuffer: 120,
          targetBuffer: 60,
          rebufferThreshold: 10,
        };
      case 'medium':
        return {
          minBuffer: 20,
          maxBuffer: 60,
          targetBuffer: 30,
          rebufferThreshold: 5,
        };
      case 'slow':
        return {
          minBuffer: 10,
          maxBuffer: 30,
          targetBuffer: 15,
          rebufferThreshold: 3,
        };
    }
  }, []);
  
  // Quality selection based on network
  const selectOptimalQuality = useCallback((networkSpeed: 'fast' | 'medium' | 'slow'): string => {
    switch (networkSpeed) {
      case 'fast':
        return '1080p';
      case 'medium':
        return '720p';
      case 'slow':
        return '480p';
      default:
        return 'auto';
    }
  }, []);
  
  // Initialize progressive loading
  useEffect(() => {
    const initializeLoading = async () => {
      loadStartTime.current = Date.now();
      onLoadStart?.();
      
      setLoadingState(prev => ({
        ...prev,
        phase: 'initializing',
        progress: 0,
      }));
      
      // Detect network speed
      const networkSpeed = detectNetworkSpeed();
      setLoadingState(prev => ({
        ...prev,
        networkSpeed,
        quality: selectOptimalQuality(networkSpeed),
      }));
      
      // Start loading sequence
      setTimeout(() => startProgressiveLoad(networkSpeed), 100);
    };
    
    if (src || youtubeId) {
      initializeLoading();
    }
  }, [src, youtubeId, detectNetworkSpeed, selectOptimalQuality]);
  
  // Progressive loading sequence
  const startProgressiveLoad = useCallback(async (networkSpeed: 'fast' | 'medium' | 'slow') => {
    try {
      // Phase 1: Load preview/thumbnail
      setLoadingState(prev => ({
        ...prev,
        phase: 'loading_preview',
        progress: 10,
      }));
      
      if (youtubeId) {
        // YouTube loading simulation
        await simulateYouTubeLoad(networkSpeed);
      } else {
        // Regular video loading
        await simulateVideoLoad(networkSpeed);
      }
      
    } catch (error) {
      handleLoadError(error as Error);
    }
  }, [youtubeId]);
  
  // Simulate YouTube loading
  const simulateYouTubeLoad = useCallback(async (networkSpeed: 'fast' | 'medium' | 'slow') => {
    const stages = [
      { progress: 20, message: 'Connecting to YouTube...' },
      { progress: 40, message: 'Loading video metadata...' },
      { progress: 60, message: 'Buffering video...' },
      { progress: 80, message: 'Optimizing quality...' },
      { progress: 100, message: 'Ready to play!' },
    ];
    
    const delay = networkSpeed === 'fast' ? 200 : networkSpeed === 'medium' ? 400 : 800;
    
    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, delay));
      setLoadingState(prev => ({
        ...prev,
        progress: stage.progress,
        phase: stage.progress === 100 ? 'complete' : prev.phase,
      }));
    }
    
    onLoadComplete?.();
  }, [onLoadComplete]);
  
  // Simulate regular video loading
  const simulateVideoLoad = useCallback(async (networkSpeed: 'fast' | 'medium' | 'slow') => {
    const delay = networkSpeed === 'fast' ? 150 : networkSpeed === 'medium' ? 300 : 600;
    const progressSteps = [20, 40, 60, 80, 100];
    
    for (const progress of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, delay));
      setLoadingState(prev => ({
        ...prev,
        progress,
        phase: progress === 100 ? 'complete' : 'loading_full',
      }));
    }
    
    onLoadComplete?.();
  }, [onLoadComplete]);
  
  // Handle loading errors
  const handleLoadError = useCallback((error: Error) => {
    setLoadingState(prev => ({
      ...prev,
      phase: 'error',
    }));
    
    onError?.(error.message);
  }, [onError]);
  
  // Retry loading
  const retryLoad = useCallback(() => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setLoadingState(prev => ({
        ...prev,
        phase: 'initializing',
        progress: 0,
      }));
      
      const networkSpeed = detectNetworkSpeed();
      setTimeout(() => startProgressiveLoad(networkSpeed), 500);
    }
  }, [retryCount, detectNetworkSpeed, startProgressiveLoad]);
  
  // Calculate estimated load time
  useEffect(() => {
    if (loadStartTime.current > 0 && loadingState.progress > 0) {
      const elapsed = Date.now() - loadStartTime.current;
      const estimated = (elapsed / loadingState.progress) * 100;
      
      setLoadingState(prev => ({
        ...prev,
        estimatedLoadTime: Math.round(estimated / 1000),
      }));
    }
  }, [loadingState.progress]);
  
  // Render loading indicators
  const renderLoadingContent = () => {
    switch (loadingState.phase) {
      case 'initializing':
        return (
          <motion.div
            className="flex flex-col items-center space-y-4"
            variants={videoPlayerAnimations.fadeIn}
            initial="initial"
            animate="animate"
          >
            <div className={videoPlayerClasses.spinner} />
            <p className="text-white text-sm">Initializing...</p>
          </motion.div>
        );
      
      case 'loading_preview':
      case 'loading_full':
        return (
          <motion.div
            className="flex flex-col items-center space-y-4 w-full max-w-sm"
            variants={videoPlayerAnimations.fadeIn}
            initial="initial"
            animate="animate"
          >
            {/* Progress Ring */}
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="url(#progressGradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={175.929}
                  strokeDashoffset={175.929 - (175.929 * loadingState.progress) / 100}
                  className="transition-all duration-300 ease-out"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF6B35" />
                    <stop offset="100%" stopColor="#F7931E" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {loadingState.progress}%
                </span>
              </div>
            </div>
            
            {/* Status Text */}
            <div className="text-center">
              <p className="text-white text-sm font-medium mb-1">
                {loadingState.phase === 'loading_preview' ? 'Loading Preview...' : 'Loading Video...'}
              </p>
              <p className="text-gray-300 text-xs">
                {loadingState.estimatedLoadTime > 0 && `~${loadingState.estimatedLoadTime}s remaining`}
              </p>
            </div>
            
            {/* Network Indicator */}
            <div className="flex items-center space-x-2">
              {loadingState.networkSpeed === 'fast' ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : loadingState.networkSpeed === 'slow' ? (
                <WifiOff className="w-4 h-4 text-red-400" />
              ) : (
                <Wifi className="w-4 h-4 text-yellow-400" />
              )}
              <span className="text-gray-300 text-xs capitalize">
                {loadingState.networkSpeed} connection
              </span>
            </div>
            
            {/* Detailed Progress */}
            {showDetailedProgress && (
              <motion.div
                className="w-full bg-black/50 rounded-lg p-3 text-xs text-gray-300"
                variants={videoPlayerAnimations.slideUp}
                initial="initial"
                animate="animate"
              >
                <div className="flex justify-between mb-1">
                  <span>Quality:</span>
                  <span>{loadingState.quality}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Network:</span>
                  <span>{loadingState.networkSpeed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Retry:</span>
                  <span>{retryCount}/3</span>
                </div>
              </motion.div>
            )}
            
            <button
              onClick={() => setShowDetailedProgress(!showDetailedProgress)}
              className="text-gray-400 text-xs hover:text-white transition-colors"
            >
              {showDetailedProgress ? 'Hide' : 'Show'} details
            </button>
          </motion.div>
        );
      
      case 'error':
        return (
          <motion.div
            className="flex flex-col items-center space-y-4 text-center max-w-sm"
            variants={videoPlayerAnimations.fadeIn}
            initial="initial"
            animate="animate"
          >
            <AlertCircle className="w-12 h-12 text-red-400" />
            <div>
              <h3 className="text-white text-lg font-semibold mb-2">
                Loading Failed
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Unable to load the video. Please check your connection and try again.
              </p>
            </div>
            <button
              onClick={retryLoad}
              className={videoPlayerClasses.primaryButton}
              disabled={retryCount >= 3}
            >
              {retryCount >= 3 ? 'Max Retries Reached' : `Retry (${retryCount + 1}/3)`}
            </button>
          </motion.div>
        );
      
      case 'complete':
        return null;
      
      default:
        return null;
    }
  };
  
  if (loadingState.phase === 'complete') {
    return null;
  }
  
  return (
    <div className={`absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-40 ${className}`}>
      {/* Poster background */}
      {poster && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${poster})` }}
        />
      )}
      
      {/* Loading content */}
      <div className="relative z-10">
        {renderLoadingContent()}
      </div>
      
      {/* Skeleton background for video container */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse opacity-30" />
    </div>
  );
};

export default ProgressiveLoader;