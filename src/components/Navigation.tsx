import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Globe, ChevronDown, User, LogOut, Settings, Home, MapPin, Eye, Info, Phone, Bell, Search, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext'; // Add this import
import { notificationService } from '../services/notificationService';
import DesktopNotifications from './DesktopNotifications';

interface NavigationProps {
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  isUserAuthenticated: boolean;
  currentUser: any;
  onShowAuth: () => void;
  onUserLogout: () => void;
  onShowProfile?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({
  currentLanguage,
  onLanguageChange,
  isUserAuthenticated,
  currentUser,
  onShowAuth,
  onUserLogout,
  onShowProfile
}) => {
 const location = useLocation();
 const { currentUser: authUser } = useAuth();
 const { favorites } = useFavorites(); // Add this hook
  
  console.log('Navigation: component rendered', {
    currentLanguage,
    isUserAuthenticated,
    currentUser,
    location: location.pathname
  });
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'destinations', label: 'Destinations', icon: MapPin },
    { id: 'vr-tours', label: 'VR Tours', icon: Eye },
    { id: 'about-india', label: 'About India', icon: Info },
    { id: 'contact', label: 'Contact', icon: Phone }
  ];

  // Mobile nav items with enhanced labels for better accessibility
  const mobileNavItems = [
    { id: 'home', label: 'Home', icon: Home, ariaLabel: 'Go to homepage' },
    { id: 'destinations', label: 'Destinations', icon: MapPin, ariaLabel: 'Browse destinations' },
    { id: 'vr-tours', label: 'VR Tours', icon: Eye, ariaLabel: 'Explore VR tours' },
    { id: 'about-india', label: 'About', icon: Info, ariaLabel: 'Learn about India' },
    { id: 'contact', label: 'Contact', icon: Phone, ariaLabel: 'Contact us' }
  ];

  useEffect(() => {
    console.log('Navigation: scroll useEffect triggered');
    const handleScroll = () => {
      console.log('Navigation: handleScroll triggered', { scrollY: window.scrollY });
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      console.log('Navigation: cleaning up scroll event listener');
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close mobile menu when location changes
  useEffect(() => {
    console.log('Navigation: location useEffect triggered', { location: location.pathname });
    setIsMobileMenuOpen(false);
  }, [location]);

  // Subscribe to notification count updates
  useEffect(() => {
    if (!authUser) {
      setNotificationCount(0);
      return;
    }

    const updateNotificationCount = async () => {
      try {
        const count = await notificationService.getUnreadCount(authUser.uid);
        setNotificationCount(count);
      } catch (error) {
        console.error('Error getting notification count:', error);
      }
    };

    // Initial count
    updateNotificationCount();

    // Subscribe to real-time updates
    const unsubscribe = notificationService.subscribeToUserNotifications(
      authUser.uid,
      (notifications) => {
        const unreadCount = notifications.filter(n => !(n as any).isRead).length;
        setNotificationCount(unreadCount);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [authUser]);

  // Handle notification click
  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  // Handle favorites click - add this function
  const handleFavoritesClick = () => {
    // Navigate to user profile favorites tab or a dedicated favorites page
    if (onShowProfile) {
      onShowProfile();
    }
  };

  return (
    <>
      {/* Desktop Navigation - Hidden on mobile */}
      <nav className={`hidden md:block fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center">
              <div className={`text-2xl font-bold transition-colors duration-300 ${
                isScrolled ? 'text-gray-800' : 'text-white'
              }`}>
                <span className="text-orange-500">Incredible</span>
                <span className={isScrolled ? 'text-blue-600' : 'text-white'}> India</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => {
                const isActive = location.pathname === (item.id === 'home' ? '/' : `/${item.id.replace(' ', '-')}`);
                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative"
                  >
                    <Link
                      to={item.id === 'home' ? '/' : `/${item.id.replace(' ', '-')}`}
                      className={`font-medium transition-all duration-300 px-3 py-2 rounded-lg group ${
                        isActive
                          ? 'text-orange-500'
                          : `${isScrolled ? 'text-gray-700' : 'text-white'} hover:text-orange-500`
                      }`}
                    >
                      {item.label}
                      <motion.div
                        className="absolute bottom-0 left-0 h-0.5 bg-orange-500"
                        initial={{ width: 0 }}
                        animate={{ width: isActive ? '100%' : 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Action buttons and User Menu */}
            <div className="flex items-center space-x-4">
              {/* Search Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`p-2 rounded-lg transition-all ${
                  isScrolled 
                    ? 'text-gray-700 hover:bg-gray-100' 
                    : 'text-white hover:bg-white/10'
                }`}
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </motion.button>

              {/* Notifications (when authenticated) */}
              {isUserAuthenticated && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNotificationClick}
                  className={`relative p-2 rounded-lg transition-all ${
                    isScrolled 
                      ? 'text-gray-700 hover:bg-gray-100' 
                      : 'text-white hover:bg-white/10'
                  }`}
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold"
                    >
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </motion.span>
                  )}
                </motion.button>
              )}

              {/* Favorites (when authenticated) */}
              {isUserAuthenticated && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFavoritesClick} // Add click handler
                  className={`relative p-2 rounded-lg transition-all ${
                    isScrolled 
                      ? 'text-gray-700 hover:bg-gray-100' 
                      : 'text-white hover:bg-white/10'
                  }`}
                  aria-label="Favorites"
                >
                  <Heart className="w-5 h-5" />
                  {favorites.length > 0 && ( // Show count badge
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold"
                    >
                      {favorites.length > 99 ? '99+' : favorites.length}
                    </motion.span>
                  )}
                </motion.button>
              )}
              {/* Language Selector */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all ${
                    isScrolled 
                      ? 'text-gray-700 hover:bg-gray-100' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {currentLanguage === 'en' ? '🇺🇸' : currentLanguage === 'fr' ? '🇫🇷' : currentLanguage === 'de' ? '🇩🇪' : currentLanguage === 'ja' ? '🇯🇵' : '🇨🇳'}
                  </span>
                  <motion.div
                    animate={{ rotate: isLanguageOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {isLanguageOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border overflow-hidden z-50"
                    >
                      {[
                        { code: 'en', flag: '🇺🇸', name: 'English' },
                        { code: 'fr', flag: '🇫🇷', name: 'Français' },
                        { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
                        { code: 'ja', flag: '🇯🇵', name: '日本語' },
                        { code: 'zh', flag: '🇨🇳', name: '中文' },
                      ].map((lang) => (
                        <motion.button
                          key={lang.code}
                          whileHover={{ backgroundColor: '#f9fafb' }}
                          onClick={() => {
                            onLanguageChange(lang.code);
                            setIsLanguageOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 transition-colors"
                        >
                          <span>{lang.flag}</span>
                          <span className="text-sm text-gray-700">{lang.name}</span>
                          {currentLanguage === lang.code && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="ml-auto w-2 h-2 bg-orange-500 rounded-full"
                            />
                          )}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Authentication */}
              {isUserAuthenticated ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                      isScrolled 
                        ? 'text-gray-700 hover:bg-gray-100' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {(currentUser?.firstName || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {currentUser?.firstName || 'User'}
                    </span>
                    <motion.div
                      animate={{ rotate: isUserMenuOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b bg-gradient-to-r from-orange-50 to-pink-50">
                          <p className="text-sm font-medium text-gray-900">
                            {currentUser?.firstName} {currentUser?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{currentUser?.email}</p>
                        </div>
                        {onShowProfile && (
                          <motion.button
                            whileHover={{ backgroundColor: '#f9fafb' }}
                            onClick={() => {
                              onShowProfile();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 transition-colors text-left"
                          >
                            <Settings className="w-4 h-4" />
                            <span className="text-sm text-gray-700">Profile & Settings</span>
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ backgroundColor: '#fef2f2' }}
                          onClick={() => {
                            onUserLogout();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 transition-colors text-left text-red-600"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">Sign Out</span>
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onShowAuth}
                  className={`px-6 py-2 rounded-xl font-medium transition-all shadow-lg ${
                    isScrolled 
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-orange-200' 
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm'
                  }`}
                >
                  Sign In
                </motion.button>
              )}

              {/* Mobile Menu Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden p-2 rounded-lg transition-colors ${
                  isScrolled 
                    ? 'text-gray-700 hover:bg-gray-100' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <motion.div
                  animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </motion.div>
              </motion.button>
            </div>
          </div>

          {/* Search Bar */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-t border-white/20"
              >
                <div className="py-4">
                  <div className="relative max-w-md mx-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search destinations, tours..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      autoFocus
                    />
                    {searchQuery && (
                      <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className={`lg:hidden border-t transition-colors duration-300 overflow-hidden ${
                  isScrolled ? 'bg-white border-gray-200' : 'bg-black/20 backdrop-blur-md border-white/20'
                }`}
              >
                <div className="px-2 pt-2 pb-3 space-y-1">
                  {navItems.map((item, index) => {
                    const isActive = location.pathname === (item.id === 'home' ? '/' : `/${item.id.replace(' ', '-')}`);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Link
                          to={item.id === 'home' ? '/' : `/${item.id.replace(' ', '-')}`}
                          className={`block px-4 py-3 rounded-xl transition-all ${
                            isActive
                              ? 'text-orange-500 bg-orange-50 border-l-4 border-orange-500'
                              : `${isScrolled ? 'text-gray-700 hover:bg-gray-50' : 'text-white hover:bg-white/10'} hover:text-orange-500`
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Mobile Bottom Navigation - Visible only on mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 mobile-nav-container">
        <div className="mobile-nav-grid">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === (item.id === 'home' ? '/' : `/${item.id.replace(' ', '-')}`);
            return (
              <Link
                key={item.id}
                to={item.id === 'home' ? '/' : `/${item.id.replace(' ', '-')}`}
                className={`mobile-nav-item touch-target touch-ripple ${
                  isActive
                    ? 'text-orange-500 bg-orange-50 active'
                    : 'text-gray-500 hover:text-orange-500'
                }`}
                aria-label={item.ariaLabel}
              >
                <Icon className="mobile-nav-icon" />
                <span className="mobile-nav-text">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Notifications Modal */}
      <DesktopNotifications
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

export default Navigation;