// Mobile VR Enhancement Services
import { 
  TouchGestureHandler, 
  HapticFeedbackController, 
  DeviceOptimizations, 
  OrientationLockController,
  VRInteraction,
  VRMetrics
} from '../types/notifications';
import { notificationService } from './notificationService';

export class MobileVREnhancementService {
  private static instance: MobileVREnhancementService;
  private sessionId: string | null = null;
  private sessionStartTime: number = 0;
  private interactions: VRInteraction[] = [];

  static getInstance(): MobileVREnhancementService {
    if (!MobileVREnhancementService.instance) {
      MobileVREnhancementService.instance = new MobileVREnhancementService();
    }
    return MobileVREnhancementService.instance;
  }

  // Touch Gesture Handler
  createTouchGestureHandler(element: HTMLElement): TouchGestureHandler {
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let lastTap = 0;
    let touchCount = 0;
    let lastDistance = 0;
    let lastAngle = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
      touchCount = e.touches.length;

      if (touchCount === 2) {
        const touch2 = e.touches[1];
        lastDistance = Math.hypot(touch2.clientX - touch.clientX, touch2.clientY - touch.clientY);
        lastAngle = Math.atan2(touch2.clientY - touch.clientY, touch2.clientX - touch.clientX);
      }

      // Record interaction
      this.recordInteraction({
        type: 'touch',
        timestamp: Date.now(),
        data: { touchCount, startX, startY }
      });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const deltaX = (e.changedTouches[0]?.clientX || startX) - startX;
      const deltaY = (e.changedTouches[0]?.clientY || startY) - startY;
      const distance = Math.hypot(deltaX, deltaY);

      // Tap detection
      if (duration < 300 && distance < 10) {
        const timeSinceLastTap = endTime - lastTap;
        lastTap = endTime;

        if (timeSinceLastTap < 300) {
          // Double tap
          gestureHandler.onDoubleTap();
          this.triggerHapticFeedback('medium');
        } else {
          // Single tap
          gestureHandler.onTap();
          this.triggerHapticFeedback('light');
        }
      }

      // Swipe detection
      if (duration < 500 && distance > 30) {
        const swipeThreshold = 50;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (deltaX > swipeThreshold) {
            gestureHandler.onSwipeRight();
          } else if (deltaX < -swipeThreshold) {
            gestureHandler.onSwipeLeft();
          }
        } else {
          // Vertical swipe
          if (deltaY > swipeThreshold) {
            gestureHandler.onSwipeDown();
          } else if (deltaY < -swipeThreshold) {
            gestureHandler.onSwipeUp();
          }
        }
        this.triggerHapticFeedback('medium');
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchCount === 2 && e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        // Pinch detection
        const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        const scale = distance / lastDistance;
        lastDistance = distance;
        gestureHandler.onPinch(scale);

        // Rotation detection
        const angle = Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX);
        const rotation = angle - lastAngle;
        lastAngle = angle;
        gestureHandler.onRotate(rotation);
      }
    };

    const gestureHandler: TouchGestureHandler = {
      onTap: () => console.log('Tap detected'),
      onDoubleTap: () => console.log('Double tap detected'),
      onSwipeLeft: () => console.log('Swipe left detected'),
      onSwipeRight: () => console.log('Swipe right detected'),
      onSwipeUp: () => console.log('Swipe up detected'),
      onSwipeDown: () => console.log('Swipe down detected'),
      onPinch: (scale) => console.log('Pinch detected:', scale),
      onRotate: (angle) => console.log('Rotate detected:', angle)
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });

    return gestureHandler;
  }

  // Haptic Feedback Controller
  createHapticFeedbackController(): HapticFeedbackController {
    const vibrate = (pattern: number | number[]) => {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    };

    return {
      light: () => vibrate(10),
      medium: () => vibrate(20),
      heavy: () => vibrate(50),
      selection: () => vibrate([10, 10, 10]),
      impact: (intensity: 'light' | 'medium' | 'heavy') => {
        switch (intensity) {
          case 'light': vibrate(15); break;
          case 'medium': vibrate(30); break;
          case 'heavy': vibrate(60); break;
        }
      },
      notification: (type: 'success' | 'warning' | 'error') => {
        switch (type) {
          case 'success': vibrate([100, 50, 100]); break;
          case 'warning': vibrate([200, 100, 200]); break;
          case 'error': vibrate([300, 100, 300, 100, 300]); break;
        }
      }
    };
  }

  // Device Optimizations
  createDeviceOptimizations(): DeviceOptimizations {
    return {
      adaptVideoQuality: (networkSpeed: string, deviceCapabilities: any) => {
        // Network-based quality adaptation
        const speedMbps = parseFloat(networkSpeed) || 1;
        
        if (speedMbps >= 10) return '1440p';
        if (speedMbps >= 5) return '1080p';
        if (speedMbps >= 2) return '720p';
        return 'auto';
      },

      preloadContent: async (priority: string[]) => {
        // Implement content preloading based on priority
        for (const contentId of priority) {
          try {
            // Preload logic would go here
            console.log(`Preloading content: ${contentId}`);
          } catch (error) {
            console.error(`Failed to preload content ${contentId}:`, error);
          }
        }
      },

      optimizeBatteryUsage: (vrSession: any) => {
        // Reduce quality if battery is low
        if ('getBattery' in navigator) {
          (navigator as any).getBattery().then((battery: any) => {
            if (battery.level < 0.2) {
              console.log('Low battery detected, optimizing performance');
              // Reduce quality, frame rate, etc.
            }
          });
        }
      },

      enableHapticFeedback: (interaction: VRInteraction) => {
        const haptic = this.createHapticFeedbackController();
        switch (interaction.type) {
          case 'play':
          case 'pause':
            haptic.light();
            break;
          case 'seek':
            haptic.selection();
            break;
          case 'fullscreen':
            haptic.medium();
            break;
          case 'quality_change':
            haptic.heavy();
            break;
        }
      },

      adaptUIForOrientation: (orientation: string) => {
        const body = document.body;
        body.classList.remove('portrait', 'landscape');
        
        if (orientation.includes('landscape')) {
          body.classList.add('landscape');
        } else {
          body.classList.add('portrait');
        }
      },

      optimizeForScreenSize: (screenDimensions: { width: number; height: number }) => {
        const { width, height } = screenDimensions;
        const aspectRatio = width / height;
        
        // Adjust layout based on screen dimensions
        const root = document.documentElement;
        root.style.setProperty('--screen-width', `${width}px`);
        root.style.setProperty('--screen-height', `${height}px`);
        root.style.setProperty('--aspect-ratio', aspectRatio.toString());
      }
    };
  }

  // Orientation Lock Controller
  createOrientationLockController(): OrientationLockController {
    return {
      lockLandscape: async () => {
        try {
          if (screen.orientation?.lock) {
            await screen.orientation.lock('landscape');
          }
        } catch (error) {
          console.warn('Orientation lock not supported:', error);
        }
      },

      lockPortrait: async () => {
        try {
          if (screen.orientation?.lock) {
            await screen.orientation.lock('portrait');
          }
        } catch (error) {
          console.warn('Orientation lock not supported:', error);
        }
      },

      unlock: async () => {
        try {
          if (screen.orientation?.unlock) {
            screen.orientation.unlock();
          }
        } catch (error) {
          console.warn('Orientation unlock not supported:', error);
        }
      },

      getCurrentOrientation: () => {
        return screen.orientation?.type || 'portrait-primary';
      },

      onOrientationChange: (callback: (orientation: string) => void) => {
        const handler = () => {
          callback(screen.orientation?.type || 'portrait-primary');
        };

        screen.orientation?.addEventListener('change', handler);
        window.addEventListener('orientationchange', handler);

        return () => {
          screen.orientation?.removeEventListener('change', handler);
          window.removeEventListener('orientationchange', handler);
        };
      }
    };
  }

  // VR Session Management
  startVRSession(destinationId: string, videoId: string, userId: string): string {
    this.sessionId = `vr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.sessionStartTime = Date.now();
    this.interactions = [];

    console.log(`VR Session started: ${this.sessionId}`);
    return this.sessionId;
  }

  endVRSession(userId: string, destinationId: string, videoId?: string): Promise<void> {
    if (!this.sessionId) return Promise.resolve();

    const sessionDuration = (Date.now() - this.sessionStartTime) / 1000;
    const metrics: VRMetrics = {
      viewDuration: sessionDuration,
      completionPercentage: 0, // Would be calculated based on video progress
      qualityLevel: 'auto',
      deviceType: this.getDeviceType(),
      orientation: this.getCurrentOrientation(),
      networkSpeed: this.getNetworkSpeed(),
      batteryLevel: this.getBatteryLevel()
    };

    const analyticsData = {
      userId,
      destinationId,
      videoId,
      sessionId: this.sessionId,
      metrics,
      interactions: this.interactions
    };

    // Reset session
    this.sessionId = null;
    this.sessionStartTime = 0;
    this.interactions = [];

    return notificationService.recordVRSession(analyticsData);
  }

  recordInteraction(interaction: VRInteraction): void {
    this.interactions.push(interaction);
  }

  // Helper methods
  private triggerHapticFeedback(intensity: 'light' | 'medium' | 'heavy'): void {
    const haptic = this.createHapticFeedbackController();
    haptic.impact(intensity);
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  }

  private getCurrentOrientation(): 'portrait' | 'landscape' {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }

  private getNetworkSpeed(): string {
    // Try to get connection info if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      return `${connection.downlink || 'unknown'} Mbps`;
    }
    return 'unknown';
  }

  private getBatteryLevel(): number | undefined {
    // Battery API is deprecated, but might still be available
    return undefined;
  }

  // Performance monitoring
  monitorPerformance(): void {
    if ('performance' in window && 'observer' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            console.log('Navigation performance:', entry);
          } else if (entry.entryType === 'resource') {
            console.log('Resource performance:', entry);
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['navigation', 'resource'] });
      } catch (error) {
        console.warn('Performance monitoring not available:', error);
      }
    }
  }
}

export const mobileVREnhancementService = MobileVREnhancementService.getInstance();