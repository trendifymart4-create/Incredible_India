import React, { useRef, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayerGestures } from '../../context/VideoPlayerContext';
import type { GestureEvent } from '../../types/videoPlayer';
import { videoPlayerAnimations } from '../../utils/videoPlayerTheme';

interface GestureLayerProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onGesture?: (gesture: GestureEvent) => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  touches: number;
  isLongPress: boolean;
  longPressTimer?: NodeJS.Timeout;
}

const GestureLayer: React.FC<GestureLayerProps> = ({
  children,
  className = '',
  disabled = false,
  onGesture,
}) => {
  const { handleGesture } = useVideoPlayerGestures();
  const [touchState, setTouchState] = useState<TouchState | null>(null);
  const [gestureIndicator, setGestureIndicator] = useState<{
    type: string;
    position: { x: number; y: number };
    visible: boolean;
  }>({ type: '', position: { x: 0, y: 0 }, visible: false });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapTime = useRef<number>(0);
  const tapCount = useRef<number>(0);
  
  // Constants
  const DOUBLE_TAP_DELAY = 300;
  const LONG_PRESS_DELAY = 500;
  const MIN_SWIPE_DISTANCE = 50;
  const MIN_SWIPE_VELOCITY = 0.3;
  const PINCH_THRESHOLD = 20;
  
  // Show gesture indicator
  const showGestureIndicator = useCallback((type: string, position: { x: number; y: number }) => {
    setGestureIndicator({ type, position, visible: true });
    setTimeout(() => {
      setGestureIndicator(prev => ({ ...prev, visible: false }));
    }, 1000);
  }, []);
  
  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    const now = Date.now();
    
    // Clear any existing long press timer
    if (touchState?.longPressTimer) {
      clearTimeout(touchState.longPressTimer);
    }
    
    // Set up long press timer
    const longPressTimer = setTimeout(() => {
      if (touchState) {
        const gestureEvent: GestureEvent = {
          type: 'long_press',
          position: { x: touch.clientX, y: touch.clientY },
        };
        
        handleGesture(gestureEvent);
        onGesture?.(gestureEvent);
        showGestureIndicator('long_press', { x: touch.clientX, y: touch.clientY });
        
        setTouchState(prev => prev ? { ...prev, isLongPress: true } : null);
      }
    }, LONG_PRESS_DELAY);
    
    setTouchState({
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: now,
      lastX: touch.clientX,
      lastY: touch.clientY,
      lastTime: now,
      touches: e.touches.length,
      isLongPress: false,
      longPressTimer,
    });
    
    e.preventDefault();
  }, [disabled, touchState, handleGesture, onGesture, showGestureIndicator]);
  
  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !touchState) return;
    
    const touch = e.touches[0];
    const now = Date.now();
    
    // Clear long press timer on movement
    if (touchState.longPressTimer) {
      clearTimeout(touchState.longPressTimer);
    }
    
    // Handle pinch gesture for multi-touch
    if (e.touches.length === 2 && touchState.touches === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      // You would need to store initial distance to calculate scale
      // For now, we'll just detect pinch gesture
      const gestureEvent: GestureEvent = {
        type: 'pinch',
        position: { 
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        },
        scale: 1, // Calculate actual scale based on initial distance
      };
      
      handleGesture(gestureEvent);
      onGesture?.(gestureEvent);
      return;
    }
    
    setTouchState(prev => prev ? {
      ...prev,
      lastX: touch.clientX,
      lastY: touch.clientY,
      lastTime: now,
      longPressTimer: undefined,
    } : null);
    
    e.preventDefault();
  }, [disabled, touchState, handleGesture, onGesture]);
  
  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled || !touchState) return;
    
    const now = Date.now();
    const deltaX = touchState.lastX - touchState.startX;
    const deltaY = touchState.lastY - touchState.startY;
    const deltaTime = now - touchState.startTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;
    
    // Clear long press timer
    if (touchState.longPressTimer) {
      clearTimeout(touchState.longPressTimer);
    }
    
    // Don't process other gestures if it was a long press
    if (touchState.isLongPress) {
      setTouchState(null);
      return;
    }
    
    // Check for swipe gesture
    if (distance > MIN_SWIPE_DISTANCE && velocity > MIN_SWIPE_VELOCITY) {
      let direction: 'left' | 'right' | 'up' | 'down';
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }
      
      const gestureEvent: GestureEvent = {
        type: 'swipe',
        direction,
        velocity,
        position: { x: touchState.lastX, y: touchState.lastY },
      };
      
      handleGesture(gestureEvent);
      onGesture?.(gestureEvent);
      showGestureIndicator(`swipe_${direction}`, { x: touchState.lastX, y: touchState.lastY });
      
      setTouchState(null);
      return;
    }
    
    // Check for tap gesture
    if (distance < 20 && deltaTime < 300) {
      const currentTime = now;
      const timeSinceLastTap = currentTime - lastTapTime.current;
      
      if (timeSinceLastTap < DOUBLE_TAP_DELAY) {
        tapCount.current += 1;
      } else {
        tapCount.current = 1;
      }
      
      lastTapTime.current = currentTime;
      
      // Handle double tap
      if (tapCount.current === 2) {
        const gestureEvent: GestureEvent = {
          type: 'double_tap',
          position: { x: touchState.lastX, y: touchState.lastY },
        };
        
        handleGesture(gestureEvent);
        onGesture?.(gestureEvent);
        showGestureIndicator('double_tap', { x: touchState.lastX, y: touchState.lastY });
        
        tapCount.current = 0;
      } else {
        // Handle single tap with delay to check for double tap
        setTimeout(() => {
          if (tapCount.current === 1) {
            const gestureEvent: GestureEvent = {
              type: 'tap',
              position: { x: touchState.lastX, y: touchState.lastY },
            };
            
            handleGesture(gestureEvent);
            onGesture?.(gestureEvent);
            showGestureIndicator('tap', { x: touchState.lastX, y: touchState.lastY });
            
            tapCount.current = 0;
          }
        }, DOUBLE_TAP_DELAY);
      }
    }
    
    setTouchState(null);
    e.preventDefault();
  }, [disabled, touchState, handleGesture, onGesture, showGestureIndicator]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (touchState?.longPressTimer) {
        clearTimeout(touchState.longPressTimer);
      }
    };
  }, [touchState?.longPressTimer]);
  
  // Gesture indicator icons
  const getGestureIcon = (type: string) => {
    switch (type) {
      case 'tap':
        return '👆';
      case 'double_tap':
        return '👆👆';
      case 'swipe_left':
        return '👈';
      case 'swipe_right':
        return '👉';
      case 'swipe_up':
        return '👆';
      case 'swipe_down':
        return '👇';
      case 'long_press':
        return '✋';
      case 'pinch':
        return '🤏';
      default:
        return '👆';
    }
  };
  
  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: disabled ? 'auto' : 'none' }}
    >
      {children}
      
      {/* Gesture Indicator */}
      <AnimatePresence>
        {gestureIndicator.visible && (
          <motion.div
            className="absolute pointer-events-none z-50 flex items-center justify-center"
            style={{
              left: gestureIndicator.position.x - 25,
              top: gestureIndicator.position.y - 25,
              width: 50,
              height: 50,
            }}
            variants={videoPlayerAnimations.scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="bg-black/70 backdrop-blur-sm text-white text-2xl rounded-full w-12 h-12 flex items-center justify-center">
              {getGestureIcon(gestureIndicator.type)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GestureLayer;