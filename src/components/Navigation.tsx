import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Globe, ChevronDown, User, LogOut, Settings, Home, MapPin, Eye, Info, Phone } from 'lucide-react';

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
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.id === 'home' ? '/' : `/${item.id.replace(' ', '-')}`}
                  className={`font-medium transition-all duration-300 hover:scale-105 ${
                    location.pathname === (item.id === 'home' ? '/' : `/${item.id.replace(' ', '-')}`)
                      ? 'text-orange-500'
                      : `${isScrolled ? 'text-gray-700' : 'text-white'} hover:text-orange-500`
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Language Selector & User Menu */}
            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <div className="relative">
                <button
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
                  <ChevronDown className="w-4 h-4" />
                </button>

                {isLanguageOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border overflow-hidden z-50">
                    {[
                      { code: 'en', flag: '🇺🇸', name: 'English' },
                      { code: 'fr', flag: '🇫🇷', name: 'Français' },
                      { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
                      { code: 'ja', flag: '🇯🇵', name: '日本語' },
                      { code: 'zh', flag: '🇨🇳', name: '中文' },
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          onLanguageChange(lang.code);
                          setIsLanguageOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <span>{lang.flag}</span>
                        <span className="text-sm text-gray-700">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User Authentication */}
              {isUserAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                      isScrolled 
                        ? 'text-gray-700 hover:bg-gray-100' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {currentUser?.firstName || 'User'}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border overflow-hidden z-50">
                      <div className="px-4 py-3 border-b">
                        <p className="text-sm font-medium text-gray-900">
                          {currentUser?.firstName} {currentUser?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{currentUser?.email}</p>
                      </div>
                      {onShowProfile && (
                        <button
                          onClick={() => {
                            onShowProfile();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                        >
                          <Settings className="w-4 h-4" />
                          <span className="text-sm text-gray-700">Profile & Settings</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onUserLogout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm text-gray-700">Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onShowAuth}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isScrolled 
                      ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/30'
                  }`}
                >
                  Sign In
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden p-2 rounded-lg transition-colors ${
                  isScrolled 
                    ? 'text-gray-700 hover:bg-gray-100' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className={`lg:hidden border-t transition-colors duration-300 ${
              isScrolled ? 'bg-white' : 'bg-black/20 backdrop-blur-md'
            }`}>
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.id === 'home' ? '/' : `/${item.id.replace(' ', '-')}`}
                    className={`block px-3 py-2 rounded-lg transition-colors ${
                      location.pathname === (item.id === 'home' ? '/' : `/${item.id.replace(' ', '-')}`)
                        ? 'text-orange-500 bg-orange-50'
                        : `${isScrolled ? 'text-gray-700 hover:bg-gray-50' : 'text-white hover:bg-white/10'} hover:text-orange-500`
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
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
    </>
  );
};

export default Navigation;