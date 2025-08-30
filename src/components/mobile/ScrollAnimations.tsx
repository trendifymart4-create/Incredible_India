import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface PullToRefreshEnhancedProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
}

export const PullToRefreshEnhanced: React.FC<PullToRefreshEnhancedProps> = ({
  children,
  onRefresh,
  threshold = 80,
  className = ''
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing) {
      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - startY.current;
      
      if (deltaY > 0) {
        setIsPulling(true);
        setPullDistance(Math.min(deltaY, threshold * 1.5));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (isPulling && pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      }
      setIsRefreshing(false);
    }
    
    setIsPulling(false);
    setPullDistance(0);
  };

  const pullProgress = Math.min(pullDistance / threshold, 1);

  return (
    <div 
      className={`relative ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      {(isPulling || isRefreshing) && (
        <motion.div
          className="absolute top-0 left-0 right-0 flex items-center justify-center z-10"
          style={{
            height: pullDistance,
            background: 'linear-gradient(to bottom, rgba(255, 107, 53, 0.1), transparent)'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex flex-col items-center">
            <motion.div
              className="w-8 h-8 border-2 border-orange-500 rounded-full"
              animate={{
                rotate: isRefreshing ? 360 : pullProgress * 180
              }}
              transition={{
                duration: isRefreshing ? 1 : 0,
                repeat: isRefreshing ? Infinity : 0,
                ease: "linear"
              }}
              style={{
                borderTopColor: 'transparent'
              }}
            />
            <p className="text-xs text-orange-600 mt-2">
              {isRefreshing ? 'Refreshing...' : pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
            </p>
          </div>
        </motion.div>
      )}
      
      {/* Content */}
      <motion.div
        style={{
          transform: `translateY(${isPulling || isRefreshing ? pullDistance : 0}px)`
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

interface ScrollProgressIndicatorProps {
  color?: string;
  height?: string;
}

export const ScrollProgressIndicator: React.FC<ScrollProgressIndicatorProps> = ({
  color = '#ff6b35',
  height = '3px'
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        height,
        background: 'rgba(0, 0, 0, 0.1)'
      }}
    >
      <motion.div
        className="h-full"
        style={{
          background: color,
          width: `${scrollProgress}%`
        }}
        initial={{ width: '0%' }}
        animate={{ width: `${scrollProgress}%` }}
        transition={{ duration: 0.1 }}
      />
    </div>
  );
};