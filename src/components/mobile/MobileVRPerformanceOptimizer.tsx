// Mobile VR Performance Optimizer Component
import React, { useEffect, useState, useRef } from 'react';
import { Battery, Wifi, Smartphone, Gauge, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NetworkInfo {
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
}

interface BatteryInfo {
  level: number;
  charging: boolean;
}

interface PerformanceInfo {
  memoryUsage?: number;
  fps: number;
  networkSpeed: NetworkInfo;
  battery?: BatteryInfo;
  deviceCapabilities: {
    maxTextureSize: number;
    supportedFormats: string[];
    webGLVersion: string;
  };
}

interface MobileVRPerformanceOptimizerProps {
  isActive: boolean;
  onQualityChange: (quality: string) => void;
  onPerformanceUpdate: (metrics: PerformanceInfo) => void;
  currentQuality: string;
  availableQualities: string[];
}

const MobileVRPerformanceOptimizer: React.FC<MobileVRPerformanceOptimizerProps> = ({
  isActive,
  onQualityChange,
  onPerformanceUpdate,
  currentQuality,
  availableQualities
}) => {
  const [performanceInfo, setPerformanceInfo] = useState<PerformanceInfo>({
    fps: 60,
    networkSpeed: {},
    deviceCapabilities: {
      maxTextureSize: 0,
      supportedFormats: [],
      webGLVersion: '1.0'
    }
  });
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number>();

  // Monitor performance metrics
  useEffect(() => {
    if (!isActive) return;

    const monitorPerformance = () => {
      const now = performance.now();
      const delta = now - lastFrameTimeRef.current;
      
      if (delta >= 1000) { // Update every second
        const fps = Math.round((frameCountRef.current * 1000) / delta);
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
        
        setPerformanceInfo(prev => ({
          ...prev,
          fps
        }));
      }
      
      frameCountRef.current++;
      animationFrameRef.current = requestAnimationFrame(monitorPerformance);
    };

    animationFrameRef.current = requestAnimationFrame(monitorPerformance);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive]);

  // Gather device capabilities
  useEffect(() => {
    const gatherDeviceCapabilities = () => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      const capabilities = {
        maxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 0,
        supportedFormats: ['mp4', 'webm'],
        webGLVersion: gl ? (gl.getParameter(gl.VERSION) || '1.0') : '1.0'
      };

      setPerformanceInfo(prev => ({
        ...prev,
        deviceCapabilities: capabilities
      }));
    };

    gatherDeviceCapabilities();
  }, []);

  // Monitor network conditions
  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;
      
      if (connection) {
        const networkSpeed: NetworkInfo = {
          downlink: connection.downlink,
          effectiveType: connection.effectiveType,
          rtt: connection.rtt,
          saveData: connection.saveData
        };

        setPerformanceInfo(prev => ({
          ...prev,
          networkSpeed
        }));
      }
    };

    updateNetworkInfo();

    // Listen for network changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
      return () => connection.removeEventListener('change', updateNetworkInfo);
    }
  }, []);

  // Monitor battery status
  useEffect(() => {
    const updateBatteryInfo = async () => {
      try {
        if ('getBattery' in navigator) {
          const battery = await (navigator as any).getBattery();
          
          const batteryInfo: BatteryInfo = {
            level: battery.level,
            charging: battery.charging
          };

          setPerformanceInfo(prev => ({
            ...prev,
            battery: batteryInfo
          }));

          // Listen for battery changes
          const updateBattery = () => {
            setPerformanceInfo(prev => ({
              ...prev,
              battery: {
                level: battery.level,
                charging: battery.charging
              }
            }));
          };

          battery.addEventListener('levelchange', updateBattery);
          battery.addEventListener('chargingchange', updateBattery);
        }
      } catch (error) {
        console.warn('Battery API not available:', error);
      }
    };

    updateBatteryInfo();
  }, []);

  // Auto-optimize quality based on performance
  useEffect(() => {
    if (!autoOptimize || !isActive) return;

    const { fps, networkSpeed, battery } = performanceInfo;
    let recommendedQuality = currentQuality;

    // Network-based optimization
    if (networkSpeed.effectiveType) {
      switch (networkSpeed.effectiveType) {
        case 'slow-2g':
        case '2g':
          recommendedQuality = '360p';
          break;
        case '3g':
          recommendedQuality = '480p';
          break;
        case '4g':
          recommendedQuality = fps < 30 ? '720p' : '1080p';
          break;
      }
    }

    // FPS-based optimization
    if (fps < 20) {
      recommendedQuality = '360p';
    } else if (fps < 30) {
      recommendedQuality = '480p';
    }

    // Battery-based optimization
    if (battery && battery.level < 0.2 && !battery.charging) {
      // Reduce quality when battery is low
      const qualityIndex = availableQualities.indexOf(recommendedQuality);
      const lowerQualityIndex = Math.min(qualityIndex + 1, availableQualities.length - 1);
      recommendedQuality = availableQualities[lowerQualityIndex] || recommendedQuality;
    }

    // Apply optimization if different from current
    if (recommendedQuality !== currentQuality) {
      setIsOptimizing(true);
      setTimeout(() => {
        onQualityChange(recommendedQuality);
        setIsOptimizing(false);
      }, 500);
    }
  }, [performanceInfo, autoOptimize, currentQuality, availableQualities, onQualityChange, isActive]);

  // Send performance updates to parent
  useEffect(() => {
    onPerformanceUpdate(performanceInfo);
  }, [performanceInfo, onPerformanceUpdate]);

  const getPerformanceStatus = () => {
    const { fps, networkSpeed, battery } = performanceInfo;
    
    if (fps < 20 || (battery && battery.level < 0.1)) {
      return { status: 'poor', color: 'text-red-500', message: 'Performance Issues' };
    } else if (fps < 30 || networkSpeed.effectiveType === '3g' || (battery && battery.level < 0.2)) {
      return { status: 'fair', color: 'text-yellow-500', message: 'Moderate Performance' };
    } else {
      return { status: 'good', color: 'text-green-500', message: 'Optimal Performance' };
    }
  };

  const performanceStatus = getPerformanceStatus();

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 left-4 right-4 z-50 bg-black/80 backdrop-blur-sm text-white rounded-lg p-3"
    >
      {/* Performance Status Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Gauge className={`w-4 h-4 ${performanceStatus.color}`} />
          <span className={`text-sm font-medium ${performanceStatus.color}`}>
            {performanceStatus.message}
          </span>
          {isOptimizing && (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
        </div>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Performance Metrics */}
      <div className="flex items-center justify-between text-xs space-x-4">
        <div className="flex items-center space-x-1">
          <span>FPS:</span>
          <span className={performanceInfo.fps < 30 ? 'text-yellow-400' : 'text-green-400'}>
            {performanceInfo.fps}
          </span>
        </div>

        {performanceInfo.networkSpeed.effectiveType && (
          <div className="flex items-center space-x-1">
            <Wifi className="w-3 h-3" />
            <span className="text-gray-300">{performanceInfo.networkSpeed.effectiveType}</span>
          </div>
        )}

        {performanceInfo.battery && (
          <div className="flex items-center space-x-1">
            <Battery className={`w-3 h-3 ${
              performanceInfo.battery.level < 0.2 ? 'text-red-400' : 'text-gray-300'
            }`} />
            <span className={performanceInfo.battery.level < 0.2 ? 'text-red-400' : 'text-gray-300'}>
              {Math.round(performanceInfo.battery.level * 100)}%
            </span>
          </div>
        )}

        <div className="flex items-center space-x-1">
          <Smartphone className="w-3 h-3" />
          <span className="text-gray-300">{currentQuality}</span>
        </div>
      </div>

      {/* Advanced Settings */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-white/20"
          >
            {/* Auto-Optimize Toggle */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm">Auto-Optimize</span>
              <button
                onClick={() => setAutoOptimize(!autoOptimize)}
                className={`w-10 h-6 rounded-full transition-colors ${
                  autoOptimize ? 'bg-orange-500' : 'bg-gray-600'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  autoOptimize ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Manual Quality Selection */}
            <div className="space-y-2">
              <span className="text-sm text-gray-300">Quality Settings</span>
              <div className="flex space-x-2">
                {availableQualities.map((quality) => (
                  <button
                    key={quality}
                    onClick={() => {
                      setAutoOptimize(false);
                      onQualityChange(quality);
                    }}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      quality === currentQuality
                        ? 'bg-orange-500 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-gray-300'
                    }`}
                  >
                    {quality}
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="mt-3 text-xs text-gray-400 space-y-1">
              {performanceInfo.networkSpeed.downlink && (
                <div>Network: {performanceInfo.networkSpeed.downlink.toFixed(1)} Mbps</div>
              )}
              {performanceInfo.memoryUsage && (
                <div>Memory: {Math.round(performanceInfo.memoryUsage * 100)}%</div>
              )}
              <div>WebGL: {performanceInfo.deviceCapabilities.webGLVersion}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MobileVRPerformanceOptimizer;