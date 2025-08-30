import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  MapPin, 
  Camera, 
  Globe, 
  MessageCircle,
  User,
  Search,
  Bell
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

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
            <button
              onClick={onShowSearch}
              className="p-2 text-gray-600 hover:text-orange-500 transition-colors"
            >
              <Search size={20} />
            </button>
            
            <button
              onClick={onShowNotifications}
              className="p-2 text-gray-600 hover:text-orange-500 transition-colors relative"
            >
              <Bell size={20} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            </button>
            
            <button
              onClick={currentUser ? onShowProfile : onShowAuth}
              className="p-2 text-gray-600 hover:text-orange-500 transition-colors"
            >
              <User size={20} />
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