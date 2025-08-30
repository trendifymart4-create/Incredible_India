import { useState, useEffect, useCallback } from 'react';

interface TouchGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onRotate?: (angle: number) => void;
  threshold?: number;
  enablePinch?: boolean;
  enableRotation?: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
  id: number;
}

export const useTouchGestures = (options: TouchGestureOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onRotate,
    threshold = 50,
    enablePinch = false,
    enableRotation = false
  } = options;
  
  const [touchStart, setTouchStart] = useState<TouchPoint[]>([]);
  const [touchEnd, setTouchEnd] = useState<TouchPoint[]>([]);
  const [isGesturing, setIsGesturing] = useState(false);
  
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touches = Array.from(e.touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      id: touch.identifier
    }));
    
    setTouchStart(touches);
    setIsGesturing(true);
  }, []);
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isGesturing) return;
    
    const touches = Array.from(e.touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      id: touch.identifier
    }));
    
    // Handle pinch gesture
    if (enablePinch && touches.length === 2 && touchStart.length === 2 && onPinch) {
      const startDistance = Math.sqrt(
        Math.pow(touchStart[0].x - touchStart[1].x, 2) + 
        Math.pow(touchStart[0].y - touchStart[1].y, 2)
      );
      
      const currentDistance = Math.sqrt(
        Math.pow(touches[0].x - touches[1].x, 2) + 
        Math.pow(touches[0].y - touches[1].y, 2)
      );
      
      const scale = currentDistance / startDistance;
      onPinch(scale);
    }
    
    // Handle rotation gesture
    if (enableRotation && touches.length === 2 && touchStart.length === 2 && onRotate) {
      const startAngle = Math.atan2(
        touchStart[1].y - touchStart[0].y,
        touchStart[1].x - touchStart[0].x
      );
      
      const currentAngle = Math.atan2(
        touches[1].y - touches[0].y,
        touches[1].x - touches[0].x
      );
      
      const angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
      onRotate(angleDiff);
    }
    
    setTouchEnd(touches);
  }, [isGesturing, touchStart, enablePinch, enableRotation, onPinch, onRotate]);
  
  const handleTouchEnd = useCallback(() => {
    if (!isGesturing || touchStart.length === 0 || touchEnd.length === 0) {
      setIsGesturing(false);
      return;
    }
    
    // Only handle single-finger swipes
    if (touchStart.length === 1 && touchEnd.length === 1) {
      const deltaX = touchEnd[0].x - touchStart[0].x;
      const deltaY = touchEnd[0].y - touchStart[0].y;
      
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      // Determine if it's a horizontal or vertical swipe
      if (Math.max(absX, absY) > threshold) {
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
        } else {
          // Vertical swipe
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown();
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp();
          }
        }
      }
    }
    
    setIsGesturing(false);
    setTouchStart([]);
    setTouchEnd([]);
  }, [isGesturing, touchStart, touchEnd, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);
  
  const bindGestures = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
  
  return {
    bindGestures,
    isGesturing
  };
};