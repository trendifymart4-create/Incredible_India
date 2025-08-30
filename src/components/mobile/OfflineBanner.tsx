import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';

const OfflineBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnlineChange = () => {
      if (!navigator.onLine) {
        setIsVisible(true);
      } else {
        setTimeout(() => setIsVisible(false), 2000); // Show "Connected" briefly
      }
    };

    handleOnlineChange(); // Check initial state
    window.addEventListener('online', handleOnlineChange);
    window.addEventListener('offline', handleOnlineChange);

    return () => {
      window.removeEventListener('online', handleOnlineChange);
      window.removeEventListener('offline', handleOnlineChange);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    // Simulate retry attempt
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRetrying(false);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className={`fixed top-16 left-0 right-0 z-40 ${
        navigator.onLine ? 'bg-green-500' : 'bg-red-500'
      } text-white py-2 px-4`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      exit={{ y: -100 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {navigator.onLine ? (
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
              <span className="text-sm">Connected</span>
            </div>
          ) : (
            <div className="flex items-center">
              <WifiOff size={16} className="mr-2" />
              <span className="text-sm">You're offline</span>
            </div>
          )}
        </div>
        
        {!navigator.onLine && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center text-sm bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw 
              size={14} 
              className={`mr-1 ${isRetrying ? 'animate-spin' : ''}`} 
            />
            Retry
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default OfflineBanner;