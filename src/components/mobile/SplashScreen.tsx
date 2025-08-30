import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface EnhancedSplashScreenProps {
  onComplete: () => void;
  duration?: number;
  variant?: 'simple' | 'branded' | 'animated';
  showProgress?: boolean;
}

const EnhancedSplashScreen: React.FC<EnhancedSplashScreenProps> = ({
  onComplete,
  duration = 3000,
  variant = 'branded',
  showProgress = false
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + (100 / (duration / 50));
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-br from-orange-500 to-red-500 flex flex-col items-center justify-center z-50"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo */}
      <motion.div
        className="text-center mb-8"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
          <span className="text-orange-500 font-bold text-3xl">I</span>
        </div>
        <h1 className="text-white text-2xl font-bold mb-2">Incredible India</h1>
        <p className="text-orange-100 text-sm">Discover the Beauty</p>
      </motion.div>

      {/* Loading Animation */}
      {variant === 'animated' && (
        <motion.div
          className="flex space-x-2 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-white rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Progress Bar */}
      {showProgress && (
        <div className="w-64 bg-white/20 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-white rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}

      {/* Loading Text */}
      <motion.p
        className="text-white/80 text-sm mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Loading amazing experiences...
      </motion.p>
    </motion.div>
  );
};

export default EnhancedSplashScreen;