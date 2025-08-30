import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { isMobileDevice, isStandalone } from './utils/deviceDetection';
import MobileNavigation from './components/mobile/MobileNavigation';
import MobileHome from './components/mobile/MobileHome';
import MobileDestinations from './components/mobile/MobileDestinations';
import MobileVrTours from './components/mobile/MobileVrTours';
import MobileAboutIndia from './components/mobile/MobileAboutIndia';
import MobileContact from './components/mobile/MobileContact';
import MobileDestinationDetails from './components/mobile/MobileDestinationDetails';
import MobileUserProfile from './components/mobile/MobileUserProfile';
import MobileAuthModal from './components/mobile/MobileAuthModal';
import MobileSearch from './components/mobile/MobileSearch';
import MobileNotifications from './components/mobile/MobileNotifications';
import MobileVRExperience from './components/mobile/MobileVRExperience';
import { PullToRefreshEnhanced, ScrollProgressIndicator } from './components/mobile/ScrollAnimations';
import { TouchGestureHandler } from './components/mobile/HapticFeedback';
import { FloatingParticles, DynamicGradientBackground } from './components/mobile/ParallaxEffects';
import { DeviceOptimizationWrapper, deviceCapabilities } from './components/mobile/DeviceOptimizations';
import OfflineBanner from './components/mobile/OfflineBanner';
import ToastNotification from './components/mobile/ToastNotification';
import EnhancedSplashScreen from './components/mobile/SplashScreen';
import { PWAInstallPrompt, PWAInstallManager } from './components/mobile/PWAInstallPrompt';
import { useAuth } from './context/AuthContext';
import { useTranslation } from './context/TranslationContext';
import { Destination } from './api/destinations';
import { subscribeToDestinations } from './api/destinations';

const MobileApp: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  
  const [showSplash, setShowSplash] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toastMessage, setToastMessage] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [showVRModal, setShowVRModal] = useState(false);
  
  // Check if device is mobile
  useEffect(() => {
    if (!isMobileDevice()) {
      // Redirect to desktop version if not mobile
      window.location.href = '/'; // This would be the desktop version
      return;
    }
    
    // Initialize PWA features
    const pwaManager = PWAInstallManager.getInstance();
    pwaManager.registerServiceWorker();
    pwaManager.requestNotificationPermission();
    
    // Show PWA install prompt if applicable
    if (pwaManager.canInstall()) {
      setTimeout(() => {
        setShowPWAPrompt(true);
      }, 10000); // Show after 10 seconds
    }
    
    // Hide splash screen after delay
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    
    return () => clearTimeout(splashTimer);
  }, []);
  
  // Setup destinations subscription
  useEffect(() => {
    const unsubscribe = subscribeToDestinations(
      (fetchedDestinations) => {
        setDestinations(fetchedDestinations);
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
        showToast(t('errors.destinations_load_failed'), 'error');
      }
    );
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);
  
  // Online/Offline status tracking
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };
  
  // Handle pull to refresh
  const handleRefresh = async () => {
    setLoading(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    showToast(t('messages.refresh_complete'), 'success');
  };
  
  // Handle destination selection
  const handleDestinationSelect = (destination: Destination) => {
    navigate(`/destinations/${destination.id}`);
  };
  
  // Handle VR experience
  const handleVRExperience = (destination: Destination) => {
    setSelectedDestination(destination);
    setShowVRModal(true);
    showToast(`Starting VR experience for ${destination.name}`, 'info');
  };
  
  // If showing splash screen
  if (showSplash) {
    return (
      <EnhancedSplashScreen
        onComplete={() => setShowSplash(false)}
        duration={3000}
        variant="branded"
        showProgress={true}
      />
    );
  }

  // If auth is still loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-orange-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-orange-600 font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }
  
  return (
    <DeviceOptimizationWrapper>
      <TouchGestureHandler>
        <div className="mobile-app min-h-screen bg-gray-50 relative">
          {/* Scroll Progress Indicator */}
          <ScrollProgressIndicator color="#ff6b35" height="4px" />
          
          {/* Dynamic Background */}
          <DynamicGradientBackground />
          <FloatingParticles count={20} />
          
          {/* Offline Banner */}
          {!isOnline && <OfflineBanner />}
          
          {/* Pull to Refresh */}
          <PullToRefreshEnhanced onRefresh={handleRefresh}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="pb-16"
          >
            <Routes>
              <Route path="/" element={
                <MobileHome 
                  destinations={destinations.slice(0, 6)} 
                  loading={loading}
                  onDestinationSelect={handleDestinationSelect}
                  onVRExperience={handleVRExperience}
                />
              } />
              <Route path="/destinations" element={
                <MobileDestinations 
                  destinations={destinations} 
                  loading={loading}
                  onDestinationSelect={handleDestinationSelect}
                  onVRExperience={handleVRExperience}
                />
              } />
              <Route path="/destinations/:id" element={
                <MobileDestinationDetails />
              } />
              <Route path="/vr-tours" element={
                <MobileVrTours />
              } />
              <Route path="/about-india" element={
                <MobileAboutIndia />
              } />
              <Route path="/contact" element={
                <MobileContact />
              } />
            </Routes>
          </motion.div>
        </AnimatePresence>
          </PullToRefreshEnhanced>
          
          {/* Bottom Navigation */}
          <MobileNavigation 
            currentUser={currentUser}
            onShowAuth={() => setShowAuthModal(true)}
            onShowProfile={() => setShowUserProfile(true)}
            onShowSearch={() => setShowSearch(true)}
            onShowNotifications={() => setShowNotifications(true)}
          />
          
          {/* Modals */}
      <AnimatePresence>
        {showAuthModal && (
          <MobileAuthModal 
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onAuthSuccess={() => {
              setShowAuthModal(false);
              showToast(t('messages.auth_success'), 'success');
            }}
          />
        )}
        
        {showUserProfile && currentUser && (
          <MobileUserProfile 
            isOpen={showUserProfile}
            onClose={() => setShowUserProfile(false)}
            user={currentUser}
          />
        )}
        
        {showSearch && (
          <MobileSearch 
            isOpen={showSearch}
            onClose={() => setShowSearch(false)}
            destinations={destinations}
          />
        )}
        
        {showNotifications && (
          <MobileNotifications 
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        )}
      </AnimatePresence>
      
      {/* VR Experience Modal */}
      <MobileVRExperience
        destination={selectedDestination}
        isOpen={showVRModal}
        onClose={() => {
          setShowVRModal(false);
          setSelectedDestination(null);
        }}
      />
      
      {/* Toast Notifications */}
      {toastMessage && (
        <ToastNotification 
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
      
      {/* PWA Install Prompt */}
      {showPWAPrompt && (
        <PWAInstallPrompt
          onInstall={() => {
            setShowPWAPrompt(false);
            showToast('App installed successfully!', 'success');
          }}
          onDismiss={() => setShowPWAPrompt(false)}
        />
      )}
        </div>
      </TouchGestureHandler>
    </DeviceOptimizationWrapper>
  );
};

export default MobileApp;