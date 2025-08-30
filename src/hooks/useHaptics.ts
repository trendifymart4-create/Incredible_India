import { useState, useEffect, useCallback } from 'react';

interface HapticFeedbackOptions {
  type?: 'light' | 'medium' | 'heavy';
  enabled?: boolean;
}

export const useHaptics = (options: HapticFeedbackOptions = {}) => {
  const { type = 'medium', enabled = true } = options;
  
  const [isSupported, setIsSupported] = useState(false);
  
  useEffect(() => {
    // Check if haptic feedback is supported
    const checkSupport = () => {
      if ('navigator' in window && 'vibrate' in navigator) {
        setIsSupported(true);
      } else if ('hapticActuator' in Navigator.prototype) {
        setIsSupported(true);
      }
    };
    
    checkSupport();
  }, []);
  
  const triggerHaptic = useCallback((feedbackType?: 'light' | 'medium' | 'heavy') => {
    if (!enabled || !isSupported) return;
    
    const hapticType = feedbackType || type;
    
    try {
      // Try modern Haptic API first (experimental)
      if ('hapticActuator' in navigator && (navigator as any).hapticActuator) {
        const actuator = (navigator as any).hapticActuator;
        if (actuator.pulse) {
          const intensity = hapticType === 'light' ? 0.1 : hapticType === 'medium' ? 0.5 : 1.0;
          actuator.pulse(intensity, 100);
          return;
        }
      }
      
      // Fallback to vibration API
      if (navigator.vibrate) {
        const pattern = {
          light: [10],
          medium: [20],
          heavy: [30, 10, 30]
        };
        navigator.vibrate(pattern[hapticType]);
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }, [enabled, isSupported, type]);
  
  return {
    isSupported,
    triggerHaptic,
    triggerLight: () => triggerHaptic('light'),
    triggerMedium: () => triggerHaptic('medium'),
    triggerHeavy: () => triggerHaptic('heavy')
  };
};