// Device detection utility for mobile/desktop routing
export const isMobileDevice = (): boolean => {
  // Check for mobile user agents
  const mobileUserAgents = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i,
    /Opera Mini/i,
    /IEMobile/i
  ];
  
  // Check user agent
  const userAgent = navigator.userAgent;
  const isMobileUA = mobileUserAgents.some((regex) => regex.test(userAgent));
  
  // Check screen size as fallback
  const isSmallScreen = window.innerWidth <= 768;
  
  // Check for touch capability
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check if we're in a Capacitor environment
  const isCapacitor = (window as any).Capacitor && (window as any).Capacitor.isNativePlatform && (window as any).Capacitor.isNativePlatform();
  
  // Return true if any mobile indicators are present
  return isMobileUA || (isSmallScreen && hasTouch) || isCapacitor;
};

export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         ((window as any).Capacitor && (window as any).Capacitor.getPlatform && (window as any).Capacitor.getPlatform() === 'ios');
};

export const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent) || 
         ((window as any).Capacitor && (window as any).Capacitor.getPlatform && (window as any).Capacitor.getPlatform() === 'android');
};

export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  
  if (width <= 768) {
    return 'mobile';
  } else if (width <= 1024) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

export const isStandalone = (): boolean => {
  // Check if app is running in standalone mode (PWA installed)
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

// Check if we're in a Capacitor native environment
export const isCapacitorNative = (): boolean => {
  try {
    return (window as any).Capacitor?.isNativePlatform() === true;
  } catch (error) {
    return false;
  }
};

// Check if native authentication is supported
export const isNativeAuthSupported = (): boolean => {
  return isCapacitorNative() && (isIOS() || isAndroid());
};

export default {
  isMobileDevice,
  isIOS,
  isAndroid,
  getDeviceType,
  isStandalone,
  isCapacitorNative,
  isNativeAuthSupported
};