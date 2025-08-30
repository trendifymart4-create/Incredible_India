import React, { useRef, useEffect } from 'react';
import { useTouchGestures } from '../../hooks/useTouchGestures';
import { useHaptics } from '../../hooks/useHaptics';

interface TouchGestureHandlerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
}

export const TouchGestureHandler: React.FC<TouchGestureHandlerProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onDoubleTap,
  onLongPress
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHaptics();
  
  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleClick
  } = useTouchGestures({
    onSwipeLeft: () => {
      triggerHaptic('light');
      onSwipeLeft?.();
    },
    onSwipeRight: () => {
      triggerHaptic('light');
      onSwipeRight?.();
    },
    onSwipeUp: () => {
      triggerHaptic('light');
      onSwipeUp?.();
    },
    onSwipeDown: () => {
      triggerHaptic('light');
      onSwipeDown?.();
    },
    onDoubleTap: () => {
      triggerHaptic('medium');
      onDoubleTap?.();
    },
    onLongPress: () => {
      triggerHaptic('heavy');
      onLongPress?.();
    }
  });

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      className="touch-handler"
    >
      {children}
    </div>
  );
};