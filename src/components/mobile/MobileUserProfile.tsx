import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, LogOut, Edit, Settings, Heart, History, HelpCircle } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { signOutUser } from '../../api/auth';

interface MobileUserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser;
}

const MobileUserProfile: React.FC<MobileUserProfileProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const handleLogout = async () => {
    try {
      await signOutUser();
      onClose();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const menuItems = [
    { icon: Edit, label: 'Edit Profile', action: () => {} },
    { icon: Heart, label: 'Favorites', action: () => {} },
    { icon: History, label: 'History', action: () => {} },
    { icon: Settings, label: 'Settings', action: () => {} },
    { icon: HelpCircle, label: 'Help & Support', action: () => {} },
    { icon: LogOut, label: 'Sign Out', action: handleLogout, danger: true },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-orange-500 to-red-500 text-white p-6 pb-8">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={32} />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {user.displayName || 'User'}
                  </h2>
                  <p className="text-orange-100">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="px-6 py-4 bg-gray-50">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-800">12</p>
                  <p className="text-xs text-gray-600">Destinations Visited</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">8</p>
                  <p className="text-xs text-gray-600">VR Tours Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">5</p>
                  <p className="text-xs text-gray-600">Favorites</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-6">
              <div className="space-y-2">
                {menuItems.map((item, index) => (
                  <motion.button
                    key={item.label}
                    onClick={item.action}
                    className={`w-full flex items-center p-4 rounded-lg transition-colors text-left ${
                      item.danger
                        ? 'hover:bg-red-50 text-red-600'
                        : 'hover:bg-gray-50 text-gray-800'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon
                      size={20}
                      className={`mr-3 ${
                        item.danger ? 'text-red-500' : 'text-gray-500'
                      }`}
                    />
                    <span className="font-medium">{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-0">
              <div className="text-center text-xs text-gray-500">
                <p>Incredible India Mobile App</p>
                <p>Version 1.0.0</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileUserProfile;