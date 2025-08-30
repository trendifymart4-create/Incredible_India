import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Destinations from './components/Destinations';
import DestinationsGrid from './components/DestinationsGrid';
import VRExperience from './components/VRExperience';
import FeaturedVideo from './components/FeaturedVideo';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import UserProfile from './components/UserProfile';
import ScrollToTop from './components/ScrollToTop';
import DebugPanel from './components/DebugPanel';
import ImagePreloadScreen from './components/ImagePreloadScreen';
import VrTours from './pages/VrTours';
import AboutIndia from './pages/AboutIndia';
import Contact from './pages/Contact';
import DeviceDetector from './components/mobile/DeviceDetector';
import MobileRouter from './components/mobile/MobileRouter';

import { Destination } from './api/destinations';
import { useAuth } from './context/AuthContext';
import { signOutUser } from './api/auth';
import { useTranslation } from './context/TranslationContext';
import { useImagePreloader } from './hooks/useImagePreloader';

// Import seeder for development (can be used from browser console)
import './utils/destinationSeeder';

function App() {
  console.log('App: component rendered');
  const { currentLanguage, setLanguage, t } = useTranslation();
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [isVRModalOpen, setIsVRModalOpen] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showPreloadScreen, setShowPreloadScreen] = useState(true);

  const { currentUser, isAdmin, loading } = useAuth();
  const { isLoading: isPreloading, isComplete: preloadComplete, status: preloadStatus } = useImagePreloader(true);
  
  console.log('App: auth context values', { currentUser, isAdmin, loading });
  console.log('App: preload status', { isPreloading, preloadComplete, showPreloadScreen });

  const handleUserLogout = async () => {
    await signOutUser();
  };

  // Handle keyboard shortcut for admin access (Ctrl+Shift+A) and debug panel (Ctrl+Shift+D)
  React.useEffect(() => {
    console.log('App: useEffect for keyboard shortcuts triggered', { isAdmin });
    const handleKeyPress = (e: KeyboardEvent) => {
      console.log('App: handleKeyPress triggered', { key: e.key, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey });
      
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        console.log('App: Ctrl+Shift+A pressed', { isAdmin });
        if (isAdmin) {
          setShowAdminPanel(true);
        } else {
          setShowAdminLogin(true);
        }
      }
      
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        console.log('App: Ctrl+Shift+D pressed - opening debug panel');
        setShowDebugPanel(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      console.log('App: cleaning up keyboard event listener');
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isAdmin, setShowAdminPanel, setShowAdminLogin]);

  const handleVRExperience = (destination: Destination) => {
    setSelectedDestination(destination);
    setIsVRModalOpen(true);
  };

  const handleCloseVR = () => {
    setIsVRModalOpen(false);
    setSelectedDestination(null);
  };

  const handleAdminLoginSuccess = () => {
    setShowAdminLogin(false);
    setShowAdminPanel(true);
  };

  const handlePreloadComplete = () => {
    setShowPreloadScreen(false);
  };

  const handleSkipPreload = () => {
    setShowPreloadScreen(false);
  };

  // Show preload screen during initial loading
  if (showPreloadScreen && (isPreloading || !preloadComplete)) {
    return (
      <ImagePreloadScreen
        status={preloadStatus}
        isComplete={preloadComplete}
        onComplete={handlePreloadComplete}
        onSkip={handleSkipPreload}
      />
    );
  }

  return (
    <DeviceDetector>
      <div className="min-h-screen bg-white">
        <ScrollToTop />
        <Navigation
          currentLanguage={currentLanguage}
          onLanguageChange={setLanguage}
          isUserAuthenticated={!!currentUser}
          currentUser={currentUser}
          onShowAuth={() => setShowAuthModal(true)}
          onUserLogout={handleUserLogout}
          onShowProfile={() => setShowUserProfile(true)}
        />
        <div className="pb-nav md:pb-0"> {/* Remove top padding to allow transparent navbar */}
          <Routes>
            <Route path="/" element={
              <>
                <Hero />
                <DestinationsGrid onVRExperience={handleVRExperience} />
                <FeaturedVideo />
                <Testimonials />
              </>
            } />
            <Route path="/destinations" element={
              <>
                <Destinations onVRExperience={handleVRExperience} />
              </>
            } />
            <Route path="/vr-tours" element={<VrTours />} />
            <Route path="/about-india" element={<AboutIndia />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/mobile/*" element={<MobileRouter />} />
          </Routes>
        </div>

        <Footer />

        <VRExperience
          destination={selectedDestination}
          isOpen={isVRModalOpen}
          onClose={handleCloseVR}
        />

        {/* Admin Login Modal */}
        {showAdminLogin && (
          <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />
        )}

        {/* User Auth Modal */}
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onAuthSuccess={() => setShowAuthModal(false)}
          />
        )}

        {/* User Profile */}
        {currentUser && (
          <UserProfile
            isOpen={showUserProfile}
            onClose={() => setShowUserProfile(false)}
          />
        )}

        {/* Admin Panel */}
        {isAdmin && (
          <AdminPanel
            isOpen={showAdminPanel}
            onClose={() => setShowAdminPanel(false)}
          />
        )}

        {/* Debug Panel */}
        <DebugPanel
          isOpen={showDebugPanel}
          onClose={() => setShowDebugPanel(false)}
        />

        {/* Admin Access Button (only show when authenticated as admin) */}
        {isAdmin && !showAdminPanel && (
          <button
            onClick={() => setShowAdminPanel(true)}
            className="fixed bottom-4 right-4 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg transition-all z-40"
            title="Open Admin Panel (Ctrl+Shift+A)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.06 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 01.06-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}

        {/* Debug Panel Button (only show in development) */}
        {import.meta.env.DEV && !showDebugPanel && (
          <button
            onClick={() => setShowDebugPanel(true)}
            className="fixed bottom-4 left-4 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all z-40"
            title="Open Debug Panel (Ctrl+Shift+D)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </button>
        )}
      </div>
    </DeviceDetector>
  );
}

export default App;