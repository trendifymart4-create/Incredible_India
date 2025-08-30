import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  MapPin, 
  Camera, 
  Globe, 
  MessageCircle,
  User,
  Search,
  Bell,
  BellRing,
  Wifi,
  WifiOff
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';

interface MobileNavigationProps {
  currentUser: FirebaseUser | null;
  onShowAuth: () => void;
  onShowProfile: () => void;
  onShowSearch: () => void;
  onShowNotifications: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentUser,
  onShowAuth,
  onShowProfile,
  onShowSearch,
  onShowNotifications,
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const { currentUser: authUser } = useAuth();

  // Monitor network status
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

  // Subscribe to notification count
  useEffect(() => {
    if (!authUser) {
      setUnreadCount(0);
      return;
    }

    const getUnreadCount = async () => {
      try {
        const count = await notificationService.getUnreadCount(authUser.uid);
        setUnreadCount(count);
      } catch (error) {
        console.error('Error getting unread count:', error);
      }
    };

    // Get initial count
    getUnreadCount();

    // Subscribe to real-time updates
    const unsubscribe = notificationService.subscribeToUserNotifications(
      authUser.uid,
      (notifications) => {
        const newUnreadCount = notifications.filter(n => !n.isRead).length;
        
        // Check if there's a new notification (unread count increased)
        if (newUnreadCount > unreadCount) {
          setHasNewNotification(true);
          
          // Trigger haptic feedback if available
          if ('vibrate' in navigator) {
            navigator.vibrate(100);
          }
          
          // Reset animation after a few seconds
          setTimeout(() => setHasNewNotification(false), 3000);
        }
        
        setUnreadCount(newUnreadCount);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [authUser, unreadCount]);

  const navItems = [
    { path: '/mobile/', icon: Home, label: 'Home' },
    { path: '/mobile/destinations', icon: MapPin, label: 'Destinations' },
    { path: '/mobile/vr-tours', icon: Camera, label: 'VR Tours' },
    { path: '/mobile/about-india', icon: Globe, label: 'About' },
    { path: '/mobile/contact', icon: MessageCircle, label: 'Contact' },
  ];

  return (
    <>
      {/* Top Action Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200 z-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">I</span>
            </div>
            <span className="font-semibold text-gray-800">Incredible India</span>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Network Status Indicator */}
            <div className={`flex items-center space-x-1 text-xs ${
              isOnline ? 'text-green-500' : 'text-red-500'
            }`}>
              {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            </div>
            
            <button
              onClick={onShowSearch}
              className="p-2 text-gray-600 hover:text-orange-500 transition-colors"
            >
              <Search size={20} />
            </button>
            
            {/* Enhanced Notification Button */}
            <button
              onClick={onShowNotifications}
              className="p-2 text-gray-600 hover:text-orange-500 transition-colors relative"
            >
              <AnimatePresence>
                {hasNewNotification ? (
                  <motion.div
                    key="bell-ring"
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ 
                      scale: [0.8, 1.1, 1], 
                      rotate: [-10, 10, -10, 10, 0],
                    }}
                    exit={{ scale: 0.8 }}
                    transition={{ 
                      duration: 0.6,
                      repeat: 2,
                      repeatType: 'reverse'
                    }}
                  >
                    <BellRing size={20} className="text-orange-500" />
                  </motion.div>
                ) : (
                  <motion.div key="bell-normal">
                    <Bell size={20} />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Notification Badge */}
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.div>
              )}
              
              {/* Pulse Animation for New Notifications */}
              {hasNewNotification && (
                <motion.div
                  className="absolute inset-0 bg-orange-500 rounded-full"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ 
                    scale: [1, 1.5, 2], 
                    opacity: [0.8, 0.4, 0] 
                  }}
                  transition={{ 
                    duration: 1,
                    repeat: Infinity,
                    repeatType: 'loop'
                  }}
                />
              )}
            </button>
            
            <button
              onClick={currentUser ? onShowProfile : onShowAuth}
              className="p-2 text-gray-600 hover:text-orange-500 transition-colors relative"
            >
              <User size={20} />
              {/* User Status Indicator */}
              {currentUser && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <motion.div 
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all ${
                  isActive
                    ? 'text-orange-500 bg-orange-50'
                    : 'text-gray-600 hover:text-orange-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    animate={{ scale: isActive ? 1.1 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <item.icon size={20} />
                  </motion.div>
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </motion.div>
    </>
  );
};

export default MobileNavigation;