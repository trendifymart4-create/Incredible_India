import React, { useEffect, useState } from 'react';

interface DeviceCapabilities {
  isHighPerformance: boolean;
  supportsWebGL: boolean;
  supportsWebXR: boolean;
  batteryLevel?: number;
  isLowPowerMode?: boolean;
}

export const deviceCapabilities: DeviceCapabilities = {
  isHighPerformance: (() => {
    // Check device performance indicators
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return false;
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return !renderer.includes('PowerVR') && !renderer.includes('Adreno 3');
    }
    return true;
  })(),
  
  supportsWebGL: (() => {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  })(),
  
  supportsWebXR: 'xr' in navigator && 'isSessionSupported' in (navigator as any).xr
};

interface DeviceOptimizationWrapperProps {
  children: React.ReactNode;
}

export const DeviceOptimizationWrapper: React.FC<DeviceOptimizationWrapperProps> = ({
  children
}) => {
  const [batteryInfo, setBatteryInfo] = useState<any>(null);

  useEffect(() => {
    // Battery API support
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryInfo(battery);
        
        // Update device capabilities based on battery level
        const updateCapabilities = () => {
          deviceCapabilities.batteryLevel = battery.level;
          deviceCapabilities.isLowPowerMode = battery.level < 0.2 || battery.charging === false;
        };
        
        updateCapabilities();
        battery.addEventListener('levelchange', updateCapabilities);
        battery.addEventListener('chargingchange', updateCapabilities);
      });
    }
  }, []);

  const optimizationClass = deviceCapabilities.isHighPerformance 
    ? 'high-performance-device' 
    : 'low-performance-device';

  return (
    <div className={`device-optimization-wrapper ${optimizationClass}`}>
      {children}
    </div>
  );
};