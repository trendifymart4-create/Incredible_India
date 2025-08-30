import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsToastProps {
  show: boolean;
  onDismiss: () => void;
}

const KeyboardShortcutsToast: React.FC<KeyboardShortcutsToastProps> = ({ show, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for animation to complete
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm text-white p-4 rounded-lg border border-white/20 z-50 max-w-sm"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Keyboard className="w-5 h-5 text-orange-400" />
              <h4 className="font-medium">Keyboard Shortcuts</h4>
            </div>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onDismiss, 300);
              }}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-300">Play/Pause</span>
                <span className="text-orange-400 font-mono">Space</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Seek ±10s</span>
                <span className="text-orange-400 font-mono">J / L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Volume</span>
                <span className="text-orange-400 font-mono">↑ / ↓</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-300">Mute</span>
                <span className="text-orange-400 font-mono">M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Fullscreen</span>
                <span className="text-orange-400 font-mono">F</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Seek to %</span>
                <span className="text-orange-400 font-mono">0-9</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default KeyboardShortcutsToast;