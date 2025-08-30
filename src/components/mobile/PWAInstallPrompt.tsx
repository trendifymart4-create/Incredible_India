import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';

interface PWAInstallPromptProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onInstall,
  onDismiss
}) => {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-20 left-4 right-4 z-50"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
      >
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
          <div className="flex items-start">
            <div className="mr-3">
              <Smartphone className="text-orange-500" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">Install App</h3>
              <p className="text-sm text-gray-600 mb-3">
                Add Incredible India to your home screen for quick access!
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={onInstall}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
                >
                  <Download size={16} className="mr-1" />
                  Install
                </button>
                <button
                  onClick={onDismiss}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export class PWAInstallManager {
  private static instance: PWAInstallManager;
  private deferredPrompt: any = null;

  private constructor() {
    this.setupEventListeners();
  }

  public static getInstance(): PWAInstallManager {
    if (!PWAInstallManager.instance) {
      PWAInstallManager.instance = new PWAInstallManager();
    }
    return PWAInstallManager.instance;
  }

  private setupEventListeners() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });
  }

  public canInstall(): boolean {
    return !!this.deferredPrompt;
  }

  public async install(): Promise<boolean> {
    if (!this.deferredPrompt) return false;

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      return outcome === 'accepted';
    } catch (error) {
      console.error('PWA install failed:', error);
      return false;
    }
  }

  public registerServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration);
        })
        .catch(error => {
          console.log('SW registration failed:', error);
        });
    }
  }

  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    return await Notification.requestPermission();
  }
}